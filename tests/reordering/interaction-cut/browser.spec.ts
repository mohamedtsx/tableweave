import { expect, test } from "@playwright/test";
import type {} from "./browser.js";
test.beforeEach(async ({ page }) => {
  await page.goto("/tests/reordering/interaction-cut/browser.html");
  await expect
    .poll(() => page.evaluate(() => Boolean(window.interactionCut)))
    .toBe(true);
});
test("already-revoked current cut blocks without ports/placement or notification", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.interactionCut.beforeBegin()),
  ).toEqual({
    undefinedResult: true,
    blocked: true,
    inactive: true,
    stableSnapshot: true,
    stableUI: true,
    reads: 0,
    movable: 0,
    deliveries: 0,
    payloads: 0,
    pending: true,
    epoch: 0,
  });
});
for (const port of ["placement", "metadata", "movable"] as const)
  test(`${port} revokes exact ACT attempt at unchanged UI generation`, async ({
    page,
  }) => {
    expect(
      await page.evaluate((port) => window.interactionCut.preToken(port), port),
    ).toEqual({
      called: true,
      sameUI: true,
      blocked: true,
      noPending: true,
      epoch: 0,
      freshStarted: true,
    });
  });
test("actual native eligibility revocation carries through original ACT finally", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.interactionCut.nativePreToken()),
  ).toEqual({
    called: true,
    sameUI: true,
    blocked: true,
    noPending: true,
    sameEpoch: true,
    freshStarted: true,
  });
});
for (const failure of ["version", "throw", "malformed", "publication"] as const)
  test(`real ${failure} dominates simultaneous physical revocation`, async ({
    page,
  }) => {
    expect(
      await page.evaluate(
        (failure) => window.interactionCut.precedence(failure),
        failure,
      ),
    ).toEqual({
      called: true,
      denied: true,
      noPending: true,
      sourceRetired: true,
      associationEnded: true,
      publicErrorOnly: true,
    });
  });
test("fake/copy/proxy/other capabilities/old cuts are inert across genuine domains", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.interactionCut.foreignAndOld()),
  ).toEqual({
    traps: 0,
    noReads: true,
    crossDenied: true,
    aExact: true,
    bExact: true,
  });
});
for (const kind of ["accepted", "indeterminate"] as const)
  test(`after-start revoke does not undo ${kind} pending before actual ack`, async ({
    page,
  }) => {
    expect(
      await page.evaluate(
        (kind) => window.interactionCut.afterStart(kind),
        kind,
      ),
    ).toEqual({
      exact: true,
      awaiting: "awaiting-authority",
      unchanged: true,
      terminal: true,
      code: "applied",
    });
  });
test("row-only capture/revoke does not manufacture UI ABA for command/nav origins", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.interactionCut.independentReceipts()),
  ).toEqual({ sameUI: true, navigationStayedCurrent: true, accepted: true });
});
test("original borrowed-receiver denial preserves the real active row origin", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.interactionCut.borrowedReceiver()),
  ).toEqual({ refused: true, noReads: true, exact: true });
});
