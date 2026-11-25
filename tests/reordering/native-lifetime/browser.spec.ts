import { expect, type Page, test } from "@playwright/test";

async function ready(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => window.nativeLifetime.first.snapshot().ready),
    )
    .toBe(true);
}
test.beforeEach(async ({ page }) => {
  await page.goto("/tests/reordering/native-lifetime/browser.html");
  await ready(page);
});
test("real compounds preserve geometry for B and deny A", async ({ page }) => {
  const value = await page.evaluate(() =>
    window.nativeLifetime.first.callbackB(),
  );
  expect(value).toEqual({
    beforeAllowed: true,
    denied: true,
    sameNode: true,
    row: "sealed",
  });
  await ready(page);
});
test("ended callbacks are inert and refresh is one-shot", async ({ page }) => {
  const value = await page.evaluate(() =>
    window.nativeLifetime.first.releaseAndReplay(),
  );
  expect(value).toEqual({
    threw: false,
    row: "ended",
    first: "refresh-refs",
    second: "incomplete",
  });
  await page.evaluate(() => window.nativeLifetime.first.fresh());
  await ready(page);
});
test("foreign P2 and proxy members cannot join", async ({ page }) => {
  await expect
    .poll(() =>
      page.evaluate(() => window.nativeLifetime.second.snapshot().ready),
    )
    .toBe(true);
  const foreign = await page.evaluate(() =>
    window.nativeLifetime.first.foreign(window.nativeLifetime.second),
  );
  expect(foreign).toBe(true);
  const fake = await page.evaluate(() =>
    window.nativeLifetime.first.wrongMembers(),
  );
  expect(fake).toEqual({ denied: true, reads: 0 });
});
test("native brands reject td/div/spoof/proxy inertly", async ({ page }) => {
  const result = await page.evaluate(() =>
    window.nativeLifetime.first.brands(),
  );
  expect(result).toEqual(
    Array.from({ length: 4 }, () => ({ threw: false, status: "ended" })),
  );
});
test("P purge retires refs before observers", async ({ page }) => {
  const value = await page.evaluate(() =>
    window.nativeLifetime.first.sourceReset(),
  );
  expect(value.status).toBe("ended");
  expect(value.observed).toBe("ended");
});
for (const kind of ["throw", "nonvoid"] as const)
  test(`real timer ${kind} cancellation retains debt`, async ({ page }) => {
    const value = await page.evaluate(
      (mode) => window.nativeLifetime.first.cancelDebt(mode),
      kind,
    );
    expect(value).toEqual({
      liveAllowed: true,
      validUpdateKept: true,
      debtDenied: true,
      fresh: "issued",
      runs: 0,
      cancels: 2,
    });
  });
test("pre-try update reentry revokes grants", async ({ page }) => {
  const value = await page.evaluate(() =>
    window.nativeLifetime.first.updateReentry(),
  );
  expect(value).toBe("ended");
});
test("Suspense renders again under actual proof", async ({ page }) => {
  await page.evaluate(() => window.nativeLifetime.first.suspend());
  await expect(page.getByText("Suspended")).toBeVisible();
  await page.evaluate(() => window.nativeLifetime.first.resume());
  await ready(page);
});
test("old returned cleanup/null cannot clear a same-node replacement", async ({
  page,
}) => {
  const result = await page.evaluate(() =>
    window.nativeLifetime.first.cleanupRoundTrip(),
  );
  expect(result).toEqual({ before: "candidate", after: "candidate" });
});
test("metadata activation of the identical actual model preserves refs", async ({
  page,
}) => {
  const result = await page.evaluate(() =>
    window.nativeLifetime.first.sameModelUpdate(),
  );
  expect(result).toEqual({ same: true, phase: "sealed" });
});
test("wrong parent and wrong designated cell cannot seal", async ({ page }) => {
  expect(
    await page.evaluate(() => window.nativeLifetime.first.missingDesignation()),
  ).toBe(true);
  const result = await page.evaluate(() =>
    window.nativeLifetime.first.badParent(),
  );
  expect(result).toEqual({ seal: "incomplete", phase: "ended" });
});
test("source mode change cannot retag prior tickets", async ({ page }) => {
  await page.evaluate(() => window.nativeLifetime.first.sourceMode());
  await expect
    .poll(() => page.evaluate(() => window.nativeLifetime.first.snapshot().row))
    .toBe("ended");
});
test("a genuine new model with identical frame keeps geometry", async ({
  page,
}) => {
  await page.evaluate(() => window.nativeLifetime.first.refreshModel());
  await expect
    .poll(() =>
      page.evaluate(
        () => window.nativeLifetime.first.snapshot().modelRefreshed,
      ),
    )
    .toBe(true);
  const result = await page.evaluate(() =>
    window.nativeLifetime.first.snapshot(),
  );
  expect(result.frameSame).toBe(true);
  expect(result.ticketSame).toBe(true);
  expect(result.row).toBe("sealed");
});
test("actual native frame replacement retires the prior ticket", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.nativeLifetime.first.replaceFrame()),
  ).toBe("sealed");
  await expect
    .poll(() =>
      page.evaluate(() => window.nativeLifetime.first.snapshot().hidden),
    )
    .toBe(true);
  expect(
    await page.evaluate(() => window.nativeLifetime.first.snapshot().retired),
  ).toBe("ended");
});
for (const kind of ["config", "model"] as const)
  test(`actual ${kind} rejection purges before alleged getters`, async ({
    page,
  }) => {
    const value = await page.evaluate(
      (kind) => window.nativeLifetime.first.failClosed(kind),
      kind,
    );
    expect(value).toEqual({ reads: 0, ended: "ended", actorNull: true });
  });
test("same scope/IDs after real P reset cannot revive A", async ({ page }) => {
  await page.evaluate(() => window.nativeLifetime.first.sourceABA());
  await ready(page);
  expect(
    await page.evaluate(() => window.nativeLifetime.first.replayObsolete()),
  ).toBe("sealed");
});
test("real server query wait retires old refs without borrowing rows", async ({
  page,
}) => {
  await expect
    .poll(() =>
      page.evaluate(() => window.nativeLifetime.remote.snapshot().ready),
    )
    .toBe(true);
  await page.evaluate(() => window.nativeLifetime.remote.serverWait());
  await expect
    .poll(() =>
      page.evaluate(() => window.nativeLifetime.remote.snapshot().retired),
    )
    .toBe("ended");
  await page.evaluate(() => window.nativeLifetime.remote.serverReady());
  await expect
    .poll(() =>
      page.evaluate(() => window.nativeLifetime.remote.snapshot().ready),
    )
    .toBe(true);
});
test("fresh lease can enroll while stale lease cannot release it", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.nativeLifetime.first.remount())).toBe(
    true,
  );
  await ready(page);
});
test("real rAF cancellation cannot resurrect grants during clearing", async ({
  page,
}) => {
  const result = await page.evaluate(() =>
    window.nativeLifetime.first.nativeCancelReentry(),
  );
  expect(result).toEqual({ denied: 4, runs: 0, row: "ended" });
});
test("prototype getter reentry cannot grant a candidate", async ({ page }) => {
  const result = await page.evaluate(() =>
    window.nativeLifetime.first.getterReentry(),
  );
  expect(result).toEqual({ reentered: true, threw: false, phase: "ended" });
});
