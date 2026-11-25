import { expect, test } from "@playwright/test";
import type {} from "./browser.js";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/reordering/admission/browser.html");
  await expect
    .poll(() => page.evaluate(() => window.reorderAdmission.ready()))
    .toBe("ready");
});
test("actual begin credits exactly its own submitted notification", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.reorderAdmission.positive())).toEqual(
    { started: true, pending: true, changed: true, receiver: 0, actual: true },
  );
});
test("core clones caller command and queued navigation cannot revive after pending releases", async ({
  page,
}) => {
  const result = await page.evaluate(() => window.reorderAdmission.queued());
  expect(result).toMatchObject({
    cloned: true,
    during: true,
    directDenied: true,
    preflightDenied: true,
    pageSize: 10,
  });
});
test("actual original column command reaches final accept unchanged", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.reorderAdmission.commandIdentity()),
  ).toEqual({ same: true, committed: true, order: ["name", "amount"] });
});
for (const where of ["metadata", "eligibility", "listener", "query"] as const) {
  test(`unrelated ${where} reentry cannot be credited as begin's own event`, async ({
    page,
  }) => {
    expect(
      await page.evaluate(
        (where) => window.reorderAdmission.reentry(where),
        where,
      ),
    ).toEqual({ denied: true, pending: true });
  });
}
test("real P purge clears pending/interaction before source or subscriber callbacks", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.reorderAdmission.purge())).toEqual({
    phase: "unready",
    interaction: false,
    pending: true,
    callbacks: 0,
    reads: 0,
    eligibility: 0,
    settled: true,
    selection: 0,
  });
});
test("accepted is not authoritative; exact newer acknowledgement releases", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.reorderAdmission.uncertainty()),
  ).toEqual({
    waiting: "awaiting-authority",
    changed: true,
    pending: true,
    feedback: "applied",
  });
});
test("uncontrolled column update uses actual accepted native/controller state", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.reorderAdmission.uncontrolled()),
  ).toEqual({ committed: true, order: ["name", "amount"] });
});
test("real same-query server refresh and missing former row use observation, not empty reorder grant", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.reorderAdmission.busyObservation()),
  ).toEqual({
    busy: true,
    waiting: true,
    noNewEligibility: true,
    missingFormer: true,
    stillPending: true,
  });
});
for (const where of [
  "command",
  "state",
  "request",
  "updater",
  "clock",
] as const) {
  test(`source/config change in ${where} cannot commit the captured old command`, async ({
    page,
  }) => {
    expect(
      await page.evaluate(
        (where) => window.reorderAdmission.callbackBoundary(where),
        where,
      ),
    ).toEqual({ denied: true, sameAccepted: true });
  });
}
test("query-first and commit callbacks observe closed old model admission", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.reorderAdmission.queryFirst()),
  ).toEqual({ phases: ["query:unready", "commit:unready"] });
});
for (const proxy of [false, true]) {
  test(`copied/proxied origin (${proxy}) denies before application metadata`, async ({
    page,
  }) => {
    expect(
      await page.evaluate(
        (proxy) => window.reorderAdmission.copiedInteraction(proxy),
        proxy,
      ),
    ).toEqual({ denied: true, noPortRead: true });
  });
}
test("genuine foreign model cannot substitute for the actual factory C", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.reorderAdmission.foreignModel()),
  ).toEqual({ denied: true, noPortRead: true });
});
test("fresh higher app epoch/new lease does not credit stale cleanup or old gesture", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.reorderAdmission.staleLease()),
  ).toEqual({ ready: true, oldDenied: true, newOwnerPreserved: true });
});
test("required unpaged manual order must not inherit a dormant query page-size cap (open producer contract)", async ({
  page,
}) => {
  // Deliberately NOT waived/skipped/rebaselined. See BLOCKER.md; not executed here.
  expect(
    await page.evaluate(() => window.reorderAdmission.unpagedContract()),
  ).toEqual({
    eligible: true,
    rows: 11,
    canonicalPageSize: 10,
    admission: "ready",
  });
});
