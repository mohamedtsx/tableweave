import { expect, test } from "@playwright/test";
import type {} from "./browser.js";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/table-renderer-commit/browser.html");
  await expect
    .poll(() =>
      page.evaluate(() => window.rendererCommit.display.state().phase),
    )
    .toBe("display");
});
test("capture invokes no app callbacks, preserves opaque children/message receiver and candidate A", async ({
  page,
}) => {
  await page.evaluate(() => window.rendererCommit.display.commitA());
  let state = await page.evaluate(() => window.rendererCommit.display.state());
  expect(state.calls).toBe(0);
  expect(state.childReads).toBe(0);
  await page.evaluate(() => {
    window.rendererCommit.display.candidateOnly();
    window.rendererCommit.display.invoke();
    window.rendererCommit.display.message();
  });
  state = await page.evaluate(() => window.rendererCommit.display.state());
  expect(state.candidateReads).toBe(0);
  expect(state.messageReceiver).toBe(true);
  expect(state.stateModelIsCurrent).toBe(true);
});
test("metadata B refreshes A context without config revision/draft retirement; actual B retires A", async ({
  page,
}) => {
  await page.evaluate(() => {
    window.rendererCommit.display.commitA();
    window.rendererCommit.display.refresh();
  });
  await expect
    .poll(() =>
      page.evaluate(() => window.rendererCommit.display.state().oldModelDenied),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() => window.rendererCommit.display.state().valid),
    )
    .toBe(true);
  await page.evaluate(() => window.rendererCommit.display.invoke());
  let state = await page.evaluate(() => window.rendererCommit.display.state());
  expect(state.sameActor).toBe(true);
  expect(state.configUnchanged).toBe(true);
  expect(state.metadataChanged).toBe(true);
  expect(state.draft).toBe("kept");
  expect(state.stateModelIsCurrent).toBe(true);
  await page.evaluate(() => window.rendererCommit.display.commitB());
  expect(
    await page.evaluate(() => window.rendererCommit.display.oldSavedDenied()),
  ).toBe(true);
  state = await page.evaluate(() => window.rendererCommit.display.state());
  expect(state.valid).toBe(true);
  expect(state.draft).toBe("kept");
});
test("source-only state/Retry works without fabricated frame/tool, rows deny", async ({
  page,
}) => {
  await expect
    .poll(() =>
      page.evaluate(() => window.rendererCommit.failure.state().phase),
    )
    .toBe("no-display");
  await page.evaluate(() => window.rendererCommit.failure.commitA());
  expect(
    await page.evaluate(() => window.rendererCommit.failure.state().hasTool),
  ).toBe(false);
  expect(
    await page.evaluate(() =>
      window.rendererCommit.failure.sourceOnlyRowsDenied(),
    ),
  ).toBe(true);
  await page.evaluate(() => {
    window.rendererCommit.failure.invoke();
    window.rendererCommit.failure.retry();
  });
  expect(
    await page.evaluate(() => window.rendererCommit.failure.state().calls),
  ).toBe(2);
});
test("root B cannot retire independently committed child A; copied metadata update does not purge A", async ({
  page,
}) => {
  await page.evaluate(() => {
    window.rendererCommit.display.commitA();
    window.rendererCommit.display.startChild();
    window.rendererCommit.display.commitB();
  });
  expect(
    await page.evaluate(() => window.rendererCommit.display.childAlive()),
  ).toBe(true);
  expect(
    await page.evaluate(() => window.rendererCommit.display.rejectCopy()),
  ).toBe(true);
  expect(
    await page.evaluate(() => window.rendererCommit.display.state().valid),
  ).toBe(true);
});
test("async A Retry cannot use new actor/model permissions after actual B commit", async ({
  page,
}) => {
  await expect
    .poll(() =>
      page.evaluate(() => window.rendererCommit.failure.state().phase),
    )
    .toBe("no-display");
  await page.evaluate(() => {
    window.rendererCommit.failure.commitA();
    window.rendererCommit.failure.startAsync();
    window.rendererCommit.failure.commitB();
  });
  expect(
    await page.evaluate(() => window.rendererCommit.failure.resolveAsync()),
  ).toBe("denied");
});
test("metadata-only model B also invalidates an in-flight A continuation, not A's callback revision", async ({
  page,
}) => {
  await expect
    .poll(() =>
      page.evaluate(() => window.rendererCommit.failure.state().phase),
    )
    .toBe("no-display");
  const before = await page.evaluate(
    () => window.rendererCommit.failure.state().modelRevision,
  );
  await page.evaluate(() => {
    window.rendererCommit.failure.commitA();
    window.rendererCommit.failure.startAsync();
    window.rendererCommit.failure.refresh();
  });
  await expect
    .poll(() =>
      page.evaluate(() => window.rendererCommit.failure.state().modelRevision),
    )
    .not.toBe(before);
  expect(
    await page.evaluate(() => window.rendererCommit.failure.resolveAsync()),
  ).toBe("denied");
});
test("actual invalid accessor capture purges private locals without invoking the getter", async ({
  page,
}) => {
  await page.evaluate(() => {
    window.rendererCommit.display.commitA();
    window.rendererCommit.display.badActualCommit();
  });
  expect(
    await page.evaluate(() => window.rendererCommit.display.state().valid),
  ).toBe(false);
  expect(
    await page.evaluate(
      () => window.rendererCommit.display.state().candidateReads,
    ),
  ).toBe(0);
  await page.evaluate(() => window.rendererCommit.display.commitB());
  expect(
    await page.evaluate(() => window.rendererCommit.display.state().draft),
  ).toBeNull();
});
test("invalid capture/reentrant P revocation fail closed; timers and owned locals purge", async ({
  page,
}) => {
  await page.evaluate(() => {
    window.rendererCommit.display.commitA();
    window.rendererCommit.display.work();
    window.rendererCommit.display.reentry();
  });
  await expect
    .poll(() =>
      page.evaluate(() => window.rendererCommit.display.state().valid),
    )
    .toBe(false);
  await page.waitForTimeout(100);
  expect(
    await page.evaluate(() => window.rendererCommit.display.state().calls),
  ).toBe(0);
});
test("P1/P2 same C/CD/context epoch cannot retag the renderer owner or inspect candidate config", async ({
  page,
}) => {
  await page.evaluate(() => {
    window.rendererCommit.display.commitA();
    window.rendererCommit.display.createP2();
  });
  await expect
    .poll(() =>
      page.evaluate(() => window.rendererCommit.display.state().p2Ready),
    )
    .toBe(true);
  expect(
    await page.evaluate(() => window.rendererCommit.display.rejectP2()),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => window.rendererCommit.display.state().candidateReads,
    ),
  ).toBe(0);
});
