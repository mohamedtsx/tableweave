import { expect, test } from "@playwright/test";

test("review n1: genuine authority A cannot clamp separate B with identical query/metadata", async ({
  page,
}) => {
  await page.goto("/correction-review.html?mode=mismatched-owner");
  await expect(page.locator("#diagnostic")).toBeVisible();
  const value = await page.evaluate(() => window.correctionProbe.snapshot());
  console.log("n1 before/after probe", JSON.stringify(value));
  expect(value.proof).toEqual({
    sameQueryIdentity: true,
    sameEvaluatedAt: true,
    sameQueryObject: false,
    metadataEqual: true,
  });
  expect(value.ownerA).toBe(true);
  expect(value.b.pageIndex).toBe(4);
  expect(value.commits.b).toEqual([]);
  expect(value.audit.authorityReads).toBe(0);
});
test("review n2: denied-then-allowed context accessor cannot acquire clamp authority", async ({
  page,
}) => {
  await page.goto("/correction-review.html?mode=context-accessor");
  await expect(page.locator("#diagnostic")).toBeVisible();
  const value = await page.evaluate(() => window.correctionProbe.snapshot());
  console.log("n2 accessor probe", JSON.stringify(value));
  expect(value.b.pageIndex).toBe(4);
  expect(value.commits.b).toEqual([]);
  expect(value.audit.getterReads).toBe(0);
});

for (const mode of ["paired", "proxy-get-trap", "callback-rebind"])
  test(`review positive: ${mode} corrects only the proved owner`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/correction-review.html?mode=${mode}`);
    await expect
      .poll(() =>
        page.evaluate(() => window.correctionProbe.snapshot().b.pageIndex),
      )
      .toBe(1);
    const value = await page.evaluate(() => window.correctionProbe.snapshot());
    expect(value.a.pageIndex).toBe(4);
    expect(value.commits).toEqual({ a: [], b: ["pagination.clamp"] });
    expect(value.audit.rawError).toBeNull();
    expect(value.audit.getterReads).toBe(0);
    expect(errors).toEqual([]);
  });

for (const mode of [
  "definition-mismatch",
  "unregistered-authority",
  "denied",
  "nested-context-accessor",
  "epoch-accessor",
  "definition-accessor",
  "callback-accessor",
  "result-accessor",
  "result-nested-accessor",
  "result-epoch-accessor",
  "then-accessor",
  "metadata-accessor",
  "throwing-port",
  "malformed-port",
  "async-port",
  "proxy-origin-throw",
  "proxy-result-throw",
  "proxy-nested-throw",
  "final-denied",
])
  test(`review fail closed: ${mode} does not invoke getters, leak errors or clamp`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/correction-review.html?mode=${mode}`);
    await expect(page.locator("#diagnostic")).toBeVisible();
    await page.evaluate(() => window.correctionProbe.tick());
    const value = await page.evaluate(() => window.correctionProbe.snapshot());
    expect(value.a.pageIndex).toBe(4);
    expect(value.b.pageIndex).toBe(4);
    expect(value.commits).toEqual({ a: [], b: [] });
    expect(value.audit.rawError).toBeNull();
    expect(value.audit.getterReads).toBe(0);
    if (["definition-mismatch", "unregistered-authority"].includes(mode))
      expect(value.audit.authorityReads).toBe(0);
    if (mode === "definition-mismatch") {
      expect(value.distinctDefinition).toBe(true);
      expect(value.sameDefinitionConfiguration).toBe(true);
      expect(value.ownerB).toBe(true);
    }
    expect(errors).toEqual([]);
  });
test("review n3: own method readCurrent keeps its receiver without crashing", async ({
  page,
}) => {
  await page.goto("/correction-review.html?mode=receiver");
  await expect(page.locator("#diagnostic, #caught-error")).toBeVisible();
  const value = await page.evaluate(() => window.correctionProbe.snapshot());
  console.log("n3 receiver probe", JSON.stringify(value));
  expect(value.audit.rawError).toBeNull();
  expect(value.audit.receiverChecks.length).toBeGreaterThan(0);
  expect(value.audit.receiverChecks.every(Boolean)).toBe(true);
  expect(value.b.pageIndex).toBe(1);
});
