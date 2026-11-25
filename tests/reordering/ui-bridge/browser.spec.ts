import { expect, test } from "@playwright/test";
import type {} from "./browser.js";
test.beforeEach(async ({ page }) => {
  await page.goto("/tests/reordering/ui-bridge/browser.html");
  await expect
    .poll(() => page.evaluate(() => window.admissionBridge.ready()))
    .toBe(true);
});
test("stable metadata/capture do not call app metadata", async ({ page }) => {
  expect(
    await page.evaluate(() => window.admissionBridge.metadataOnly()),
  ).toEqual({ stable: true, sameOrigin: true, reads: 0 });
});
test("pending ABA at equal C revision denies A but permits fresh origin and current join", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.admissionBridge.pendingABA()),
  ).toEqual({
    during: true,
    after: true,
    sameRevision: true,
    fresh: true,
    operation: 3,
  });
});
test("navigation capture/observe cannot overwrite the actual row interaction slot", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.admissionBridge.rowSlot())).toEqual({
    noReads: true,
    started: true,
    oldNavigation: true,
  });
});
test("actual config B replaces A join/action without owner retirement", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.admissionBridge.replaced())).toEqual({
    replaced: true,
    oldJoin: true,
    oldOrigin: true,
    newJoin: true,
  });
});
test("Strict UI cleanup/hide does not dispose app lease or backend pending", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.admissionBridge.releasePending()),
  ).toEqual({
    hiddenPending: true,
    waiting: "awaiting-authority",
    oldJoin: true,
    newJoin: true,
    pending: true,
    ownerEpoch: 0,
  });
});
test("forged proofs/foreign claims deny before app ports", async ({ page }) => {
  expect(
    await page.evaluate(() => window.admissionBridge.wrongInputs()),
  ).toEqual({
    refused: true,
    foreignUI: true,
    forgedOrigin: true,
    forgedJoin: true,
    reads: 0,
  });
});
test("honest app source tag changes deny before new model publication", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.admissionBridge.sourceTag())).toEqual(
    { denied: true, sameState: true },
  );
});
test("queued controlled command cannot revive through ordinary direct accept", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.admissionBridge.queued())).toEqual({
    denied: true,
    pageSize: 10,
  });
});
test("no-op fence emits bridge version while old snapshot fields stay equal", async ({
  page,
}) => {
  const result = await page.evaluate(() => window.admissionBridge.noOp());
  expect(result).toMatchObject({
    noop: true,
    version: true,
    old: true,
    fresh: true,
  });
  expect(result.deliveries).toBeGreaterThan(0);
});
test("metadata reentry can suspend but not retag a navigation receipt", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.admissionBridge.reentry())).toEqual({
    denied: true,
    joined: false,
  });
});
test("genuine same-D/C/P foreign hook model is not an exact committed join", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.admissionBridge.foreign())).toEqual({
    refused: true,
    distinct: true,
    reads: 0,
  });
});
test("current registered renderer body is invoked only behind actual join", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.admissionBridge.body())).toBe("one");
});
test("source wait retains the app notice until actual retained producer publishes", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.admissionBridge.waiting())).toEqual({
    pending: true,
    delivered: 0,
  });
  expect(
    await page.evaluate(() => window.admissionBridge.authoritative()),
  ).toEqual({ delivered: 1, pending: true, feedback: "superseded" });
});
test("U1 complete11/default10 and matching complete acknowledgement are preserved", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.admissionBridge.complete())).toEqual({
    extent: "complete",
    pageSize: 10,
    ids: 11,
    feedback: "applied",
  });
});
for (const kind of ["release", "suspend"] as const) {
  test(`UI ${kind} during live settlement cannot be misclassified as source retirement (open seam)`, async ({
    page,
  }) => {
    // Not skipped/rebaselined: current source trace contradicts pendingPreserved.
    expect(
      await page.evaluate(
        (kind) => window.admissionBridge.settlementCleanup(kind),
        kind,
      ),
    ).toEqual({
      pendingPreserved: true,
      sameC: true,
      sameAppMetadata: true,
      actualSourceStillValid: true,
    });
  });
}
