import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from "@playwright/test";
import type {} from "../src/rows/inspection";
import { openApplication } from "./bootstrap-ready";

async function open(page: Page) {
  await openApplication(page);
  await expect(page.getByTestId("record-row")).toHaveCount(10);
}
async function readCount(request: APIRequestContext): Promise<number> {
  const result: unknown = await (await request.get("/api/probe")).json();
  if (
    typeof result === "object" &&
    result !== null &&
    "stats" in result &&
    typeof result.stats === "object" &&
    result.stats !== null &&
    "reads" in result.stats &&
    typeof result.stats.reads === "number"
  )
    return result.stats.reads;
  throw new Error("Invalid synthetic read counter.");
}

test("n2 committed loader scope replaces rows/runtime and clears prior scope caches and selection", async ({
  page,
  baseURL,
}) => {
  await open(page);
  let reads = 0;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname.startsWith("/_serverFn/")
    )
      reads++;
  });
  await page.getByRole("checkbox").first().check();
  const previous = await page.evaluateHandle(() => window.__wp06Inspect);
  await page
    .context()
    .addCookies([
      { name: "wp06-actor", value: "beta", url: baseURL ?? "missing" },
    ]);
  await page.getByRole("button", { name: "Reload authorization" }).click();
  await expect(page.getByTestId("authorized-scope")).toHaveText("demo:beta");
  await expect(page.getByTestId("record-row").first()).toContainText(
    "Beta record 01",
  );
  await expect(page.getByTestId("selection")).toHaveText("Selected 0");
  await expect(page.getByTestId("canary")).toHaveText("request-canary-beta");
  expect(
    await page.evaluate(() => window.__wp06Inspect?.().cachedScopes),
  ).not.toContain("demo:alpha");
  const retired = await previous.evaluate((inspect) => inspect?.());
  expect(retired?.selectionCount).toBe(0);
  expect(retired?.serverRows).toBe(0);
  expect(retired?.access).toBe(false);
  expect(reads).toBe(1);
  await previous.dispose();
});

test("n3 real unauthorized cookie on ordinary Refresh terminally clears private state", async ({
  page,
  baseURL,
}) => {
  await open(page);
  await page.getByRole("checkbox").first().check();
  await page
    .context()
    .addCookies([
      { name: "wp06-actor", value: "revoked", url: baseURL ?? "missing" },
    ]);
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.getByTestId("blocked")).toBeVisible();
  await expect(page.getByTestId("record-row")).toHaveCount(0);
  await expect(page.getByTestId("selection")).toHaveText("Selected 0");
  const state = await page.evaluate(() => window.__wp06Inspect?.());
  expect(state?.access).toBe(false);
  expect(state?.canSelect).toBe(false);
  expect(state?.serverRows).toBe(0);
  expect(state?.serverAccess).toBe(false);
  expect(state?.cachedScopes).toEqual([]);
  expect(state?.canary).toBeUndefined();
});

test("same authorization revalidation preserves current page and selection", async ({
  page,
  request,
}) => {
  await open(page);
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page.getByTestId("page")).toHaveText(
    "Displayed 11–20 of 24; requested page 2",
  );
  const before = await readCount(request);
  let rowRequests = 0;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname.startsWith("/_serverFn/")
    )
      rowRequests++;
  });
  await page.evaluate(async () => {
    if (!window.__wp06Revalidate)
      throw new Error("Missing application router action.");
    await window.__wp06Revalidate();
  });
  await expect(page.getByTestId("selection")).toHaveText("Selected 1");
  await expect(page.getByTestId("page")).toHaveText(
    "Displayed 11–20 of 24; requested page 2",
  );
  expect(await readCount(request)).toBe(before);
  expect(rowRequests).toBe(0);
});

test("pending old scope cannot revive records through an Alpha/Beta/Alpha authorization ABA", async ({
  page,
  request,
  baseURL,
}) => {
  await open(page);
  const previous = await page.evaluateHandle(() => window.__wp06Inspect);
  await page.getByRole("checkbox").first().check();
  const before = await readCount(request);
  await page.getByRole("button", { name: "Late record 01" }).click();
  await expect(page.getByTestId("resource")).toContainText("pending");
  // A real server-side started read, not just the synchronous resource intent.
  await expect.poll(() => readCount(request)).toBeGreaterThan(before);
  await page
    .context()
    .addCookies([
      { name: "wp06-actor", value: "beta", url: baseURL ?? "missing" },
    ]);
  await page.getByRole("button", { name: "Reload authorization" }).click();
  await expect(page.getByTestId("record-row").first()).toContainText(
    "Beta record 01",
  );
  await page
    .context()
    .addCookies([
      { name: "wp06-actor", value: "alpha", url: baseURL ?? "missing" },
    ]);
  await page.getByRole("button", { name: "Reload authorization" }).click();
  await expect(page.getByTestId("authorized-scope")).toHaveText("demo:alpha");
  await expect(page.getByTestId("record-row")).toHaveCount(10);
  await page.waitForTimeout(750);
  await expect(page.getByTestId("record-row").first()).toContainText(
    "Alpha record 01",
  );
  await expect(page.getByTestId("record-row").first()).not.toContainText(
    "older response",
  );
  await expect(page.getByTestId("selection")).toHaveText("Selected 0");
  expect((await previous.evaluate((inspect) => inspect?.()))?.access).toBe(
    false,
  );
  expect(
    await page.evaluate(() => window.__wp06Inspect?.().cachedScopes),
  ).not.toContain("demo:beta");
  await previous.dispose();
});

test("a delayed real unauthorized outcome for the retired token cannot revoke a new scope", async ({
  page,
  baseURL,
}) => {
  await open(page);
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let received = () => {};
  const denied = new Promise<void>((resolve) => {
    received = resolve;
  });
  let captured = false;
  await page.route("**/_serverFn/**", async (route) => {
    if (route.request().method() !== "POST" || captured) {
      await route.continue();
      return;
    }
    captured = true;
    const response = await route.fetch();
    expect(await response.text()).toContain("access-lost");
    received();
    await held;
    await route.fulfill({ response });
  });
  await page
    .context()
    .addCookies([
      { name: "wp06-actor", value: "revoked", url: baseURL ?? "missing" },
    ]);
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await denied;
  await page
    .context()
    .addCookies([
      { name: "wp06-actor", value: "beta", url: baseURL ?? "missing" },
    ]);
  await page.getByRole("button", { name: "Reload authorization" }).click();
  await expect(page.getByTestId("record-row").first()).toContainText(
    "Beta record 01",
  );
  release();
  await page.waitForTimeout(150);
  await expect(page.getByTestId("record-row")).toHaveCount(10);
  expect((await page.evaluate(() => window.__wp06Inspect?.()))?.access).toBe(
    true,
  );
  await expect(page.getByRole("checkbox").first()).toBeEnabled();
});

test("abandoned suspended bootstrap cannot invalidate the committed runtime; later commit retires it", async ({
  page,
  baseURL,
}) => {
  await openApplication(page, "/lifecycle");
  await page.getByRole("checkbox").first().check();
  const previous = await page.evaluateHandle(() => window.__wp06Inspect);
  await page
    .context()
    .addCookies([
      { name: "wp06-actor", value: "beta", url: baseURL ?? "missing" },
    ]);
  await page
    .getByRole("button", { name: "Prepare suspended authorization" })
    .click();
  await expect(page.getByTestId("transition-pending")).toHaveText("pending");
  await expect(page.getByTestId("authorized-scope")).toHaveText("demo:alpha");
  await expect(page.getByTestId("selection")).toHaveText("Selected 1");
  expect((await previous.evaluate((inspect) => inspect?.()))?.access).toBe(
    true,
  );
  expect(
    await page.evaluate(() => window.__wp06Inspect?.().cachedScopes),
  ).toContain("demo:alpha");
  await page
    .getByRole("button", { name: "Discard authorization render" })
    .click();
  await expect(page.getByTestId("transition-pending")).toHaveText("settled");
  await expect(page.getByTestId("selection")).toHaveText("Selected 1");
  await expect(page.getByTestId("record-row").first()).toContainText(
    "Alpha record 01",
  );
  expect((await previous.evaluate((inspect) => inspect?.()))?.access).toBe(
    true,
  );
  await page
    .getByRole("button", { name: "Commit prepared authorization" })
    .click();
  await expect(page.getByTestId("authorized-scope")).toHaveText("demo:beta");
  await expect(page.getByTestId("record-row").first()).toContainText(
    "Beta record 01",
  );
  await expect(page.getByTestId("selection")).toHaveText("Selected 0");
  expect((await previous.evaluate((inspect) => inspect?.()))?.access).toBe(
    false,
  );
  expect(
    await page.evaluate(() => window.__wp06Inspect?.().cachedScopes),
  ).not.toContain("demo:alpha");
  await previous.dispose();
});

test("n4 malformed RPC input rejection is private/no-store before validation", async ({
  page,
}) => {
  await open(page);
  const pending = page.waitForRequest(
    (request) =>
      request.method() === "POST" &&
      new URL(request.url()).pathname.startsWith("/_serverFn/"),
  );
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  const rpc = await pending;
  const headers = await rpc.allHeaders();
  delete headers["content-length"];
  const original = rpc.postData() ?? "";
  const changed = original.replace('"normal"', '"invalid-mode"');
  expect(changed).not.toBe(original);
  const response = await page.request.post(rpc.url(), {
    headers,
    data: changed,
  });
  // Start intentionally serializes this validation failure with HTTP 200.
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("private");
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test("n4 CSRF rejection retains outer private/no-store response policy", async ({
  page,
}) => {
  await open(page);
  const pending = page.waitForRequest(
    (request) =>
      request.method() === "POST" &&
      new URL(request.url()).pathname.startsWith("/_serverFn/"),
  );
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  const rpc = await pending;
  const headers = await rpc.allHeaders();
  delete headers["content-length"];
  headers.origin = "https://untrusted.example";
  headers["sec-fetch-site"] = "cross-site";
  const response = await page.request.post(rpc.url(), {
    headers,
    data: rpc.postData() ?? "",
  });
  expect(response.status()).toBe(403);
  expect(response.headers()["cache-control"]).toContain("private");
  expect(response.headers()["cache-control"]).toContain("no-store");
});
