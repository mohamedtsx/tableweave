import { expect, test } from "@playwright/test";
import type {} from "./react.entry.js";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/table-facade/hook/react.html");
  await expect(page.locator("#client")).toHaveText("display/records/25");
});
test("real P1/C models, disabled unslicing >100 and actual manual complete rows", async ({
  page,
}) => {
  await expect(page.locator("#unsliced")).toHaveText("display/records/173");
  await expect(page.locator("#complete")).toHaveText("display/records/173");
  const state = await page.evaluate(() => window.facadeHook.client.state());
  expect(state.phases[0]).toBe("uncommitted");
  expect(state.renderPrivate).toBe(0);
  expect(state.resetCount).toBe(0);
  expect(state.current).toBe(true);
});
test("Strict replay, reallocated props/no-loop, selection/columns and actual relative-clock commits", async ({
  page,
}) => {
  const before = await page.evaluate(
    () => window.facadeHook.client.state().counts,
  );
  await page.evaluate(() => {
    for (let i = 0; i < 4; i++) window.facadeHook.client.rerender();
  });
  await expect
    .poll(() => page.evaluate(() => window.facadeHook.client.state().counts))
    .toEqual(before);
  await page.evaluate(() => {
    window.facadeHook.client.select();
    window.facadeHook.client.hide();
  });
  await expect
    .poll(() => page.evaluate(() => window.facadeHook.client.state().selected))
    .toEqual(["r1"]);
  await expect
    .poll(() => page.evaluate(() => window.facadeHook.client.state().columns))
    .toEqual(["amount", "computed"]);
  expect(
    (await page.evaluate(() => window.facadeHook.client.state())).renders,
  ).toBeLessThan(35);
  await page.evaluate(() => window.facadeHook.relative.tick());
  await expect(page.locator("#relative")).toHaveText("display/empty/0");
  const state = await page.evaluate(() => window.facadeHook.relative.state());
  expect(state.nativeQueryIdentity).toBe(state.queryIdentity);
  expect(state.renderPrivate).toBe(0);
});
test("abandoned/suspended B never reads source/private projection; A stays current until actual B", async ({
  page,
}) => {
  await page.evaluate(() => window.facadeHook.client.suspend());
  expect(
    await page.evaluate(() => window.facadeHook.client.state().suspendedReads),
  ).toBe(0);
  expect(
    await page.evaluate(() => window.facadeHook.client.state().current),
  ).toBe(true);
  await page.evaluate(() => window.facadeHook.client.finish());
  await expect(page.locator("#client")).toHaveText("display/records/3");
  expect(
    await page.evaluate(() => window.facadeHook.client.state().renderPrivate),
  ).toBe(0);
});
test("initial error is source-only, no fabricated frame/tool/private model or Retry invocation", async ({
  page,
}) => {
  await expect(page.locator("#failure")).toHaveText(
    "no-display/initial-error/none",
  );
  const state = await page.evaluate(() => window.facadeHook.failure.state());
  expect(state.sourceOnly).toBe(true);
  expect(state.tool).toBe(false);
  expect(state.recovery).toEqual({
    kind: "initial-error",
    error: "offline",
    canRetry: true,
  });
  expect(state.counts.rowId).toBe(0);
  expect(await page.evaluate(() => window.facadeHook.retries())).toBe(0);
});
test("retained A records and filtered empty while B pending, fresh zero replaces records", async ({
  page,
}) => {
  await page.evaluate(() => {
    window.facadeHook.remote.beginB();
    window.facadeHook.empty.beginB();
  });
  await expect(page.locator("#remote")).toHaveText("display/records/4");
  await expect(page.locator("#empty")).toHaveText("display/updating-empty/0");
  expect(
    (await page.evaluate(() => window.facadeHook.remote.state())).recovery,
  ).toMatchObject({ busy: true, stale: true, notice: "updating" });
  await page.evaluate(() => window.facadeHook.remote.remoteEmpty());
  await expect(page.locator("#remote")).toHaveText("display/empty/0");
});
test("source access loss/P begin mask output, C/P swaps require keyed lifetime", async ({
  page,
}) => {
  await page.evaluate(() => window.facadeHook.remote.revoke());
  await expect(page.locator("#remote")).toHaveText(
    "unavailable/unavailable/none",
  );
  await page.evaluate(() => window.facadeHook.client.blockP());
  await expect(page.locator("#client")).toHaveText(
    "unavailable/unavailable/none",
  );
  await page.evaluate(() => {
    window.facadeHook.unsliced.swapC();
    window.facadeHook.complete.swapP();
  });
  await expect(page.locator("#unsliced")).toHaveText(
    "unavailable/unavailable/none",
  );
  await expect(page.locator("#complete")).toHaveText(
    "unavailable/unavailable/none",
  );
});
test("unmount is local, two tables independent, app's original sole resource lease remains authoritative", async ({
  page,
}) => {
  await page.evaluate(() => window.facadeHook.remote.unmount());
  let state = await page.evaluate(() => window.facadeHook.remote.state());
  expect(state.disposed).toBe(false);
  expect(state.resourceKind).toBe("ready");
  expect(state.resourceActive).toBe(true);
  expect(state.current).toBe(false);
  expect(
    await page.evaluate(() => window.facadeHook.client.state().current),
  ).toBe(true);
  await page.evaluate(() => window.facadeHook.remote.disconnectApplication());
  state = await page.evaluate(() => window.facadeHook.remote.state());
  expect(state.resourceActive).toBe(false);
});
test("private callback reentry during genuine native/projection work denies, never becomes render work", async ({
  page,
}) => {
  await page.evaluate(() => window.facadeHook.client.reenter());
  await expect(page.locator("#client")).toHaveText(
    "unavailable/unavailable/none",
  );
  expect(
    await page.evaluate(() => window.facadeHook.client.state().renderPrivate),
  ).toBe(0);
});
