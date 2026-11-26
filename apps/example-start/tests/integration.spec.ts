import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from "@playwright/test";
import { fixtureClock, initialQuery } from "../src/rows/schema";
import { openApplication } from "./bootstrap-ready";

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
async function stats(request: APIRequestContext) {
  const response = await request.get("/api/probe");
  const value: unknown = await response.json();
  if (
    !object(value) ||
    !object(value.stats) ||
    typeof value.stats.reads !== "number" ||
    typeof value.stats.aborted !== "number" ||
    typeof value.stats.completed !== "number"
  )
    throw new Error("Invalid fixture stats.");
  return {
    reads: value.stats.reads,
    aborted: value.stats.aborted,
    completed: value.stats.completed,
  };
}
async function open(page: Page) {
  await openApplication(page);
  await expect(page.getByTestId("record-row")).toHaveCount(10);
  await expect(page.getByTestId("resource")).toContainText(
    "ready|none|current",
  );
}

test("actual HTTP SSR isolates concurrent scopes AND a same-key request canary", async ({
  request,
}) => {
  const actors = ["alpha", "beta", "alpha", "beta"];
  const responses = await Promise.all(
    actors.map((actor) =>
      request.get("/", { headers: { Cookie: `wp06-actor=${actor}` } }),
    ),
  );
  for (const [index, response] of responses.entries()) {
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("private");
    expect(response.headers()["cache-control"]).toContain("no-store");
    const actor = actors[index];
    const other = actor === "alpha" ? "beta" : "alpha";
    const html = await response.text();
    expect(html).toContain(`request-canary-${actor}`);
    expect(html).not.toContain(`request-canary-${other}`);
    expect(html).toContain(
      actor === "alpha" ? "Alpha record 01" : "Beta record 01",
    );
    expect(html).not.toContain(
      actor === "alpha" ? "Beta record" : "Alpha record",
    );
    expect(html).toContain('data-testid="record-row"');
    expect(html.replaceAll("<!-- -->", "")).toContain(
      `wp06-table|en-US|UTC|${fixtureClock}`,
    );
  }
});

test("hydration/StrictMode reuses real SSR rows with no duplicate fresh network read", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const rpcReads: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname.startsWith("/_serverFn/")
    )
      rpcReads.push("read");
  });
  const before = await stats(request);
  await open(page);
  await page.waitForTimeout(250);
  expect(rpcReads).toHaveLength(0);
  expect((await stats(request)).reads - before.reads).toBe(1);
  expect(errors).toEqual([]);
  await expect(page.getByTestId("bootstrap")).toHaveText(
    `wp06-table|en-US|UTC|${fixtureClock}`,
  );
  await page.getByRole("checkbox").first().check();
  await expect(page.getByTestId("selection")).toHaveText("Selected 1");
});

test("changed-page failure retains DISPLAYED range, synchronously blocks selection and retries CURRENT page", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("button", { name: "Fail next page", exact: true })
    .click();
  await expect(page.getByTestId("resource")).toContainText(
    "failure|update-failed|obsolete",
  );
  await expect(page.getByTestId("page")).toHaveText(
    "Displayed 1–10 of 24; requested page 2",
  );
  await expect(page.getByRole("checkbox").first()).toBeDisabled();
  await page
    .getByRole("button", { name: "Retry current query", exact: true })
    .click();
  await expect(page.getByTestId("page")).toHaveText(
    "Displayed 11–20 of 24; requested page 2",
  );
  await expect(page.getByTestId("record-row").first()).toContainText(
    "Alpha record 11",
  );
});

test("new intent guards an obsolete checkbox in the same event turn before React commits", async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() => {
    const button = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent === "Slow no matches",
    );
    const checkbox = document.querySelector('input[type="checkbox"]');
    if (
      !(button instanceof HTMLButtonElement) ||
      !(checkbox instanceof HTMLInputElement)
    )
      throw new Error("Missing application control.");
    button.click();
    checkbox.click();
  });
  await expect(page.getByTestId("selection")).toHaveText("Selected 0");
  await expect(page.getByTestId("resource")).toContainText(
    "pending|updating|obsolete",
  );
  await expect(page.getByTestId("page")).toHaveText(
    "Displayed 1–10 of 24; requested page 1",
  );
  await expect(page.getByTestId("record-row")).toHaveCount(0);
  await expect(page.getByTestId("empty")).toHaveText(
    "No records match these criteria.",
  );
});

test("same-key refresh has a new generation, retains rows on failure, and fresh empty replaces them", async ({
  page,
}) => {
  await open(page);
  const initial = await page.getByTestId("resource").textContent();
  await page.getByRole("button", { name: "Fail refresh", exact: true }).click();
  await expect(page.getByTestId("resource")).toContainText(
    "failure|update-failed|current",
  );
  expect(await page.getByTestId("resource").textContent()).not.toBe(initial);
  await expect(page.getByTestId("record-row")).toHaveCount(10);
  await page.getByRole("button", { name: "Fresh empty" }).click();
  await expect(page.getByTestId("record-row")).toHaveCount(0);
  await expect(page.getByTestId("empty")).toHaveText("No records yet.");
  await page.waitForTimeout(150);
  await expect(page.getByTestId("record-row")).toHaveCount(0);
});

test("A then failed B then retry-empty B permanently replaces A", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("button", { name: "Fail next page", exact: true })
    .click();
  await expect(page.getByTestId("resource")).toContainText(
    "failure|update-failed|obsolete",
  );
  await page
    .getByRole("button", { name: "Retry current query as empty", exact: true })
    .click();
  await expect(page.getByTestId("record-row")).toHaveCount(0);
  await expect(page.getByTestId("page")).toHaveText(
    "Displayed 0–0 of 0; requested page 1",
  );
  await expect(page.getByTestId("resource")).toContainText(
    "ready|none|current",
  );
  await page.waitForTimeout(150);
  await expect(page.getByTestId("record-row")).toHaveCount(0);
});

test("real RPC abort reaches the server reader; subsequent query succeeds", async ({
  page,
  request,
}) => {
  await open(page);
  const before = await stats(request);
  await page.getByRole("button", { name: "Slow refresh", exact: true }).click();
  await expect
    .poll(async () => (await stats(request)).reads)
    .toBeGreaterThan(before.reads);
  await page.getByRole("button", { name: "Find record 02" }).click();
  await expect(page.getByTestId("record-row")).toHaveCount(1);
  await expect(page.getByTestId("record-row")).toContainText("Alpha record 02");
  await expect
    .poll(async () => (await stats(request)).aborted)
    .toBeGreaterThan(before.aborted);
});

test("late uncancellable A cannot overwrite B or an ABA new generation", async ({
  page,
  request,
}) => {
  await open(page);
  const before = await stats(request);
  await page.getByRole("button", { name: "Late record 01" }).click();
  await expect(page.getByTestId("resource")).toContainText("pending");
  await expect
    .poll(async () => (await stats(request)).reads)
    .toBeGreaterThan(before.reads);
  await page.getByRole("button", { name: "Find record 02" }).click();
  await expect(page.getByTestId("record-row")).toHaveCount(1);
  await expect(page.getByTestId("record-row")).toContainText("Alpha record 02");
  await page
    .getByRole("button", { name: "Find record 01", exact: true })
    .click();
  await expect(page.getByTestId("record-row")).toHaveCount(1);
  await expect(page.getByTestId("record-row")).toContainText("Alpha record 01");
  const acceptedGeneration = await page.getByTestId("resource").textContent();
  await expect
    .poll(async () => (await stats(request)).completed)
    .toBeGreaterThanOrEqual(before.completed + 3);
  await expect(page.getByTestId("record-row")).not.toContainText(
    "older response",
  );
  await expect(page.getByTestId("resource")).toHaveText(
    acceptedGeneration ?? "missing",
  );
});

test("unknown total uses explicit next flags even for a full final page", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("button", { name: "Unknown total", exact: true })
    .click();
  await expect(page.getByTestId("page")).toContainText("total unknown");
  await expect(
    page.getByRole("button", { name: "Next page", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Full final unknown page" }).click();
  await expect(page.getByTestId("record-row")).toHaveCount(10);
  await expect(
    page.getByRole("button", { name: "Next page", exact: true }),
  ).toBeDisabled();
});

test("authoritative dataset shrink clamps once without correction loops", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: "Shrink dataset" }).click();
  await expect(page.getByTestId("page")).toHaveText(
    "Displayed 1–3 of 3; requested page 1",
  );
  await expect(page.getByTestId("corrections")).toHaveText("Corrections 1");
  await page.waitForTimeout(150);
  await expect(page.getByTestId("record-row")).toHaveCount(3);
});

test("terminal access loss clears rows/selection/cache and cannot be revived by late completion", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: "Slow refresh", exact: true }).click();
  await page.getByRole("button", { name: "Revoke access" }).click();
  await expect(page.getByTestId("blocked")).toBeVisible();
  await expect(page.getByTestId("record-row")).toHaveCount(0);
  await expect(page.getByTestId("selection")).toHaveText("Selected 0");
  await page.waitForTimeout(700);
  await expect(page.getByTestId("record-row")).toHaveCount(0);
});

test("real HTTP reader independently rejects malformed/unauthorized transport and query inputs", async ({
  request,
}) => {
  const base = {
    scopeKey: "demo:alpha",
    clock: fixtureClock,
    query: initialQuery(),
    requestKey: "http-test",
    mode: "normal",
  };
  const invalid: readonly unknown[] = [
    { ...base, scopeKey: "demo:beta" },
    { ...base, signal: "not-serializable-cancellation" },
    { ...base, query: { ...base.query, schemaVersion: 99 } },
    {
      ...base,
      query: { ...base.query, pagination: { pageIndex: -1, pageSize: 10 } },
    },
    {
      ...base,
      query: { ...base.query, pagination: { pageIndex: 0, pageSize: 101 } },
    },
    { ...base, query: { ...base.query, tabId: "unknown" } },
    {
      ...base,
      query: { ...base.query, sorting: [{ id: "status", desc: false }] },
    },
    {
      ...base,
      query: {
        ...base.query,
        builder: {
          join: "and",
          rules: [
            {
              id: "bad",
              field: "label",
              operator: "text.contains",
              value: "x",
            },
          ],
        },
      },
    },
    {
      ...base,
      query: {
        ...base.query,
        builder: {
          join: "and",
          rules: [
            {
              id: "bad",
              field: "amount",
              operator: "number.eq;DROP",
              value: 2,
            },
          ],
        },
      },
    },
  ];
  for (const data of invalid) {
    const response = await request.post("/api/probe", { data });
    expect(response.status()).toBe(400);
    expect(await response.text()).toBe('{"code":"request-rejected"}');
  }
  const valid = await request.post("/api/probe", {
    data: {
      ...base,
      query: {
        ...base.query,
        sorting: [{ id: "amount", desc: true }],
        pagination: { pageIndex: 1, pageSize: 10 },
      },
    },
  });
  expect(valid.status()).toBe(200);
  const text = await valid.text();
  expect(text).toContain('"id":"alpha-13"');
  expect(text).not.toContain('"id":"alpha-24"');
});

test("POST RPC criteria remains outside URL and installed CSRF middleware rejects cross-origin replay", async ({
  page,
}) => {
  await open(page);
  const pending = page.waitForRequest(
    (request) =>
      request.method() === "POST" &&
      new URL(request.url()).pathname.startsWith("/_serverFn/"),
  );
  await page.getByRole("button", { name: "Find record 02" }).click();
  const rpc = await pending;
  expect(new URL(rpc.url()).search).toBe("");
  const headers = await rpc.allHeaders();
  delete headers["content-length"];
  headers.origin = "https://untrusted.example";
  headers["sec-fetch-site"] = "cross-site";
  const response = await page.request.post(rpc.url(), {
    headers,
    data: rpc.postData() ?? "",
  });
  expect(response.status()).toBe(403);
});
