import { expect, test } from "@playwright/test";
import type {} from "./react.entry.js";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/criteria-frame-react/react.html");
  await expect
    .poll(() =>
      page.evaluate(() => window.criteriaReactFixture.one.state().phase),
    )
    .toBe("frame");
});
test("Strict replay is nonterminal, initial render null, ordinary envelopes do not loop, C selection refreshes at commit", async ({
  page,
}) => {
  const first = await page.evaluate(() =>
    window.criteriaReactFixture.one.state(),
  );
  expect(first.phases[0]).toBe("null");
  expect(first.controllerDisposed).toBe(false);
  expect(first.canReorder).toBe(true);
  await page.evaluate(() => {
    for (let i = 0; i < 4; i++) window.criteriaReactFixture.one.rerender();
  });
  await expect
    .poll(() =>
      page.evaluate(() => window.criteriaReactFixture.one.state().renders),
    )
    .toBeLessThan(30);
  await page.evaluate(() => window.criteriaReactFixture.one.select());
  await expect
    .poll(() =>
      page.evaluate(() => window.criteriaReactFixture.one.state().selected),
    )
    .toEqual(["r1"]);
  const next = await page.evaluate(() =>
    window.criteriaReactFixture.one.state(),
  );
  expect(next.nativeRevision).toBe(next.revision);
  expect(next.sourceAllowed).toBe(true);
  expect(next.toolAllowed).toBe(true);
  await page.evaluate(() => window.criteriaReactFixture.one.hideColumn());
  await expect
    .poll(() =>
      page.evaluate(() => window.criteriaReactFixture.one.state().columns),
    )
    .toEqual(["amount"]);
});
test("suspended candidate never reads private source and leaves committed A until actual B commit", async ({
  page,
}) => {
  await page.evaluate(() => window.criteriaReactFixture.one.suspend());
  await expect
    .poll(() =>
      page.evaluate(() => window.criteriaReactFixture.one.state().sourceReads),
    )
    .toBe(0);
  expect(
    await page.evaluate(
      () => window.criteriaReactFixture.one.state().toolAllowed,
    ),
  ).toBe(true);
  await page.evaluate(() => window.criteriaReactFixture.one.complete());
  await expect(page.locator("#client")).toHaveText("frame/3/client");
  expect(
    await page.evaluate(
      () => window.criteriaReactFixture.one.state().sourceReads,
    ),
  ).toBe(0);
});
test("initial failure grants metadata but no frame/tool/model; Retry remains an uninvoked app actor", async ({
  page,
}) => {
  await expect
    .poll(() =>
      page.evaluate(() => window.criteriaReactFixture.two.state().phase),
    )
    .toBe("source");
  const state = await page.evaluate(() =>
    window.criteriaReactFixture.two.state(),
  );
  expect(state.canRetry).toBe(true);
  expect(state.modelCalls).toBe(0);
  expect(state.toolAllowed).toBe(false);
  expect(await page.evaluate(() => window.criteriaReactFixture.retries())).toBe(
    0,
  );
  await page.evaluate(() => window.criteriaReactFixture.two.changeQuery());
  await expect
    .poll(() =>
      page.evaluate(() => window.criteriaReactFixture.two.state().canRetry),
    )
    .toBe(false);
});
test("actual full complete order, genuine remote update with unchanged input and immediate access mask", async ({
  page,
}) => {
  await expect(page.locator("#complete")).toHaveText("frame/137/ready");
  await page.evaluate(() => window.criteriaReactFixture.two.remote());
  await expect(page.locator("#failure")).toHaveText("frame/2/ready");
  await page.evaluate(() => window.criteriaReactFixture.two.updateRemote());
  await expect(page.locator("#failure")).toHaveText("frame/4/ready");
  await page.evaluate(() => window.criteriaReactFixture.two.deny());
  await expect(page.locator("#failure")).toHaveText("null");
  expect(
    await page.evaluate(
      () => window.criteriaReactFixture.two.state().sourceAllowed,
    ),
  ).toBe(false);
});
test("two genuine owners stay isolated; unmount disconnects local frame/readiness only", async ({
  page,
}) => {
  await page.evaluate(() => window.criteriaReactFixture.one.unmount());
  const state = await page.evaluate(() =>
    window.criteriaReactFixture.one.state(),
  );
  expect(state.sourceAllowed).toBe(false);
  expect(state.toolAllowed).toBe(false);
  expect(state.controllerDisposed).toBe(false);
  expect(state.publicationPhase).toBe("settled");
  expect(state.resourceKind).toBe("idle");
  expect(
    await page.evaluate(
      () => window.criteriaReactFixture.three.state().toolAllowed,
    ),
  ).toBe(true);
});
test("real native callback reentry revokes publication and masks source/frame readiness", async ({
  page,
}) => {
  await page.evaluate(() => window.criteriaReactFixture.one.reenter());
  await expect(page.locator("#client")).toHaveText("null");
  expect(
    await page.evaluate(
      () => window.criteriaReactFixture.one.state().sourceAllowed,
    ),
  ).toBe(false);
  expect(
    await page.evaluate(
      () => window.criteriaReactFixture.one.state().toolAllowed,
    ),
  ).toBe(false);
});
