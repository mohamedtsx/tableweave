import { expect, test } from "@playwright/test";
import type {} from "../src/rows/inspection";
import { openApplication } from "./bootstrap-ready";

test("n5 authorization loader denial terminates the old wrapper before unmount and prevents reconnect", async ({
  page,
  baseURL,
}) => {
  await openApplication(page);
  await page.getByRole("checkbox").first().check();
  const previous = await page.evaluateHandle(() => ({
    inspect: window.__wp06Inspect,
    reconnect: window.__wp06Reconnect,
  }));
  await page
    .context()
    .addCookies([
      { name: "wp06-actor", value: "revoked", url: baseURL ?? "missing" },
    ]);
  await page.getByRole("button", { name: "Reload authorization" }).click();
  await expect(page.getByTestId("authorization-error")).toBeVisible();
  await expect
    .poll(() => previous.evaluate((probe) => probe.inspect?.().active))
    .toBe(false);
  const beforeReconnect = await previous.evaluate((probe) => probe.inspect?.());
  const afterReconnect = await previous.evaluate((probe) => {
    const disconnect = probe.reconnect?.();
    const snapshot = probe.inspect?.();
    disconnect?.();
    return snapshot;
  });
  await test.info().attach("synthetic-authorization-state", {
    body: JSON.stringify({ beforeReconnect, afterReconnect }),
    contentType: "application/json",
  });
  expect.soft(beforeReconnect?.cachedScopes).toEqual([]);
  expect.soft(beforeReconnect?.canary).toBeUndefined();
  expect.soft(beforeReconnect?.access).toBe(false);
  expect.soft(beforeReconnect?.serverAccess).toBe(false);
  expect(beforeReconnect?.selectionCount).toBe(0);
  expect(beforeReconnect?.detailsOpen).toBe(false);
  expect(beforeReconnect?.canSelect).toBe(false);
  expect.soft(afterReconnect?.access).toBe(false);
  expect.soft(afterReconnect?.serverAccess).toBe(false);
  expect.soft(afterReconnect?.rows).toBe(0);
  expect(afterReconnect?.serverRows).toBe(0);
  const oldId = beforeReconnect?.authorizationId;
  await page
    .context()
    .addCookies([
      { name: "wp06-actor", value: "alpha", url: baseURL ?? "missing" },
    ]);
  await page.getByRole("button", { name: "Recheck authorization" }).click();
  await expect(page.getByTestId("record-row")).toHaveCount(10);
  expect(
    (await page.evaluate(() => window.__wp06Inspect?.()))?.authorizationId,
  ).not.toBe(oldId);
  const oldAfterRestoration = await previous.evaluate((probe) => {
    const disconnect = probe.reconnect?.();
    const state = probe.inspect?.();
    disconnect?.();
    return state;
  });
  expect(oldAfterRestoration?.access).toBe(false);
  expect(oldAfterRestoration?.rows).toBe(0);
  await previous.dispose();
});

for (const [original, target] of [
  ["alpha", "beta"],
  ["beta", "alpha"],
] as const) {
  test(`stale bootstrap denial of ${original} cannot revoke committed ${target}`, async ({
    page,
    baseURL,
  }) => {
    await page
      .context()
      .addCookies([
        { name: "wp06-actor", value: original, url: baseURL ?? "missing" },
      ]);
    await openApplication(page);
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
      if (route.request().method() !== "GET" || captured) {
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
    const priorRevalidation = page.evaluate(async () => {
      if (!window.__wp06Revalidate) throw new Error("Missing router action.");
      await window.__wp06Revalidate();
    });
    await denied;
    await page
      .context()
      .addCookies([
        { name: "wp06-actor", value: target, url: baseURL ?? "missing" },
      ]);
    await page.evaluate(async () => {
      if (!window.__wp06Revalidate) throw new Error("Missing router action.");
      await window.__wp06Revalidate();
    });
    await expect(page.getByTestId("authorized-scope")).toHaveText(
      `demo:${target}`,
    );
    const accepted = await page.evaluate(
      () => window.__wp06Inspect?.().authorizationId,
    );
    release();
    await priorRevalidation;
    await expect(page.getByTestId("record-row")).toHaveCount(10);
    expect(
      (await page.evaluate(() => window.__wp06Inspect?.()))?.authorizationId,
    ).toBe(accepted);
    expect((await page.evaluate(() => window.__wp06Inspect?.()))?.access).toBe(
      true,
    );
    await expect(page.getByTestId("authorization-error")).toHaveCount(0);
  });
}

test("ordinary bootstrap unavailability is not inferred to revoke an authorized grant", async ({
  page,
}) => {
  await openApplication(page);
  const previous = await page.evaluateHandle(() => ({
    inspect: window.__wp06Inspect,
    reconnect: window.__wp06Reconnect,
  }));
  await page.route("**/_serverFn/**", async (route) => {
    if (route.request().method() === "GET") await route.abort("failed");
    else await route.continue();
  });
  await page.getByRole("button", { name: "Reload authorization" }).click();
  await expect(page.getByTestId("authorization-error")).toBeVisible();
  await expect
    .poll(() => previous.evaluate((probe) => probe.inspect?.().active))
    .toBe(false);
  const restored = await previous.evaluate((probe) => {
    const disconnect = probe.reconnect?.();
    const state = probe.inspect?.();
    disconnect?.();
    return state;
  });
  expect(restored?.access).toBe(true);
  expect(restored?.rows).toBe(10);
  await previous.dispose();
});

test("a real authorization loss between bootstrap and canary is also terminal", async ({
  page,
  baseURL,
}) => {
  await openApplication(page);
  const previous = await page.evaluateHandle(() => ({
    inspect: window.__wp06Inspect,
    reconnect: window.__wp06Reconnect,
  }));
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let received = () => {};
  const allowed = new Promise<void>((resolve) => {
    received = resolve;
  });
  let captured = false;
  await page.route("**/_serverFn/**", async (route) => {
    if (route.request().method() !== "GET" || captured) {
      await route.continue();
      return;
    }
    captured = true;
    const response = await route.fetch();
    expect(await response.text()).toContain("authorized");
    received();
    await held;
    await route.fulfill({ response });
  });
  await page.getByRole("button", { name: "Reload authorization" }).click();
  await allowed;
  await page
    .context()
    .addCookies([
      { name: "wp06-actor", value: "revoked", url: baseURL ?? "missing" },
    ]);
  release();
  await expect(page.getByTestId("authorization-error")).toBeVisible();
  const state = await previous.evaluate((probe) => probe.inspect?.());
  expect(state?.access).toBe(false);
  expect(state?.cachedScopes).toEqual([]);
  expect(state?.serverAccess).toBe(false);
  const reconnected = await previous.evaluate((probe) => {
    const disconnect = probe.reconnect?.();
    const next = probe.inspect?.();
    disconnect?.();
    return next;
  });
  expect(reconnected?.rows).toBe(0);
  await previous.dispose();
});

test("a definition-only commit replaces the actual native definition and retires the old grant", async ({
  page,
}) => {
  await openApplication(page, "/lifecycle");
  await page.getByRole("checkbox").first().check();
  const previous = await page.evaluateHandle(() => window.__wp06Inspect);
  const old = await previous.evaluate((inspect) => inspect?.());
  let reads = 0;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname.startsWith("/_serverFn/")
    )
      reads++;
  });
  await page
    .getByRole("button", { name: "Commit alternate definition" })
    .click();
  await expect(
    page.getByRole("columnheader", { name: "Amount (alternate layout)" }),
  ).toBeVisible();
  await expect(page.getByTestId("selection")).toHaveText("Selected 0");
  const next = await page.evaluate(() => window.__wp06Inspect?.());
  expect(next?.scopeKey).toBe(old?.scopeKey);
  expect(next?.definitionKey).not.toBe(old?.definitionKey);
  expect(next?.authorizationId).not.toBe(old?.authorizationId);
  expect(reads).toBe(1);
  expect((await previous.evaluate((inspect) => inspect?.()))?.access).toBe(
    false,
  );
  expect(
    (await previous.evaluate((inspect) => inspect?.()))?.serverAccess,
  ).toBe(false);
  expect(
    (await previous.evaluate((inspect) => inspect?.()))?.controllerDisposed,
  ).toBe(true);
  await previous.dispose();
});
