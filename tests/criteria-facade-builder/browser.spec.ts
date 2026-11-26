import { expect, test } from "@playwright/test";
import type {} from "./browser.js";

const failures = new WeakMap<object, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  failures.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/criteria-facade-builder/browser.html");
});
test.afterEach(({ page }) => expect(failures.get(page)).toEqual([]));

for (const kind of ["number", "point", "range"] as const) {
  for (const throwing of [false, true]) {
    test(`real parent supersession preserves exact ${kind} A (${throwing ? "throw" : "return"})`, async ({
      page,
    }) => {
      const result = await page.evaluate(
        ({ kind, throwing }) =>
          window.facadeBuilder.supersession(kind, throwing),
        { kind, throwing },
      );
      for (const key of [
        "sameActor",
        "sameCore",
        "sameHost",
        "samePublication",
        "sameSource",
        "sameSlots",
        "sameDate",
        "samePresentation",
        "sameConnection",
        "noInvalidation",
      ] as const)
        expect(result[key], key).toBe(true);
      expect(result.notifications).toBe(0);
      expect(result.bReads).toBe(0);
      expect(result.bCallsBeforeCommit).toBe(0);
      expect(result.oldCallback).toBe("synthetic-A-id");
      expect(result.badReceiver).toBe(0);
      expect(result.timerDeadlinePreserved).toBe(true);
      expect(result.timerFired).toBe(true);
      expect(result.partial).toContain("synthetic partial");
      expect(result.oldDeniedAfterB).toBe(true);
      expect(result.bClassName).toBe("synthetic-B");
    });
  }
}
test("unchanged parent ticket and model refresh do not recommit the child", async ({
  page,
}) => {
  const result = await page.evaluate(() => window.facadeBuilder.coalescing());
  expect(result).toMatchObject({
    sameTicket: true,
    same: true,
    waiting: "waiting",
    keptWaiting: true,
    sameRefreshTicket: true,
    sameRefreshActor: true,
    sameRefreshVersion: true,
    numeric: ["17e"],
  });
});
for (const variant of [
  "malformed",
  "forged",
  "reentry",
  "reset",
  "source-loss",
  "no-A",
  "raw-A",
] as const) {
  test(`actual ${variant} cannot become a SKIP grant`, async ({ page }) => {
    expect(
      await page.evaluate(
        (variant) => window.facadeBuilder.denial(variant),
        variant,
      ),
    ).toEqual({ denied: true, oldDenied: true });
  });
}
for (const name of [
  "controller",
  "context",
  "stamp",
  "mode",
  "foreign-source",
  "copy",
  "proxy",
] as const) {
  test(`actual facade ${name} metadata is checked before coalescing`, async ({
    page,
  }) => {
    expect(
      await page.evaluate((name) => window.facadeBuilder.metadata(name), name),
    ).toEqual({ denied: true, oldDenied: true });
  });
}
test("actual carrier is one-use and exact-input/cell bound", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.facadeBuilder.receipts())).toEqual({
    wrongCell: false,
    wrongCarrier: false,
    first: true,
    reused: false,
    noPresentation: true,
  });
});
test("a genuine foreign owner cannot replace the committed C/CD/P association", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.facadeBuilder.foreignOwner()),
  ).toEqual({
    denied: true,
    oldDenied: true,
  });
});
test("post-seal native cancellation failure remains fail-closed", async ({
  page,
}) => {
  const result = await page.evaluate(() => window.facadeBuilder.postBoundary());
  expect(result.denied).toBe(true);
  expect(result.cancellations).toBeGreaterThan(0);
});
test("core actor alone cannot bypass actual host presentation association", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.facadeBuilder.association())).toEqual(
    {
      observed: true,
      earlyReady: false,
      readyAfter: "new-associated-B",
    },
  );
});
test("parent B does not own child A callbacks before child B L-config", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.facadeBuilder.savedDraft())).toEqual({
    beforeChild: ["23"],
    denied: true,
  });
});
test("native defaults and server-complete mode come from real producers", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.facadeBuilder.defaults(false)),
  ).toMatchObject({
    amount: "amount",
    created: "created",
    mode: "client",
    registry: true,
  });
  expect(
    await page.evaluate(() => window.facadeBuilder.defaults(true)),
  ).toMatchObject({
    amount: "amount",
    created: "created",
    sourceMode: "server-complete",
    mode: "server",
    registry: true,
  });
});
test("deferred source invalidation retains the original actual origin and purges before regrant", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.facadeBuilder.invalidationOrigin()),
  ).toEqual({
    beforeReset: 0,
    denied: true,
    purged: true,
    originalOrigin: true,
    settled: true,
  });
});
test("plain FilterBuilder bridge preserves uncontrolled form DOM, caret and focus", async ({
  page,
}) => {
  await page.evaluate(() => window.facadeBuilder.client.show());
  await page.getByRole("button", { name: /^Value: Note/ }).click();
  const input = page.getByRole("textbox", { name: "Custom note" });
  await input.fill("synthetic retained custom input");
  const original = await input.elementHandle();
  if (!original) throw new Error("Actual custom form missing");
  await input.evaluate((node: HTMLInputElement) =>
    node.setSelectionRange(3, 9),
  );
  await input.press("Alt+r");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("synthetic retained custom input");
  expect(await original.evaluate((node) => node.isConnected)).toBe(true);
  expect(
    await input.evaluate((node: HTMLInputElement) => [
      node.selectionStart,
      node.selectionEnd,
    ]),
  ).toEqual([3, 9]);
  await page.evaluate(() => window.facadeBuilder.client.suspend());
  await page.evaluate(() => window.facadeBuilder.client.abandon());
  expect(await original.evaluate((node) => node.isConnected)).toBe(true);
});
test("actual Date input survives parent refresh and real reset closes its old lifetime", async ({
  page,
}) => {
  await page.evaluate(() => window.facadeBuilder.client.show());
  await page
    .getByRole("button", { name: /^Value: Created/ })
    .first()
    .click();
  const input = page.getByRole("textbox", { name: /Exact date and time/ });
  await input.fill("synthetic incomplete instant");
  const original = await input.elementHandle();
  if (!original) throw new Error("Actual Date input missing");
  await input.press("Alt+r");
  await expect(input).toHaveValue("synthetic incomplete instant");
  expect(await original.evaluate((node) => node.isConnected)).toBe(true);
  await page.evaluate(() => window.facadeBuilder.client.reset());
  await expect(input).toHaveCount(0);
});
