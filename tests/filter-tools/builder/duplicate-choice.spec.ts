import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(({ page }) => {
  expect(runtimeErrors.get(page)).toEqual([]);
});

async function duplicatedReadyPerson(page: Page, target: number) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Seed async rule", exact: true })
    .click();
  await expect(page.locator("[data-rule-id]")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Rule options: Person", exact: true })
    .click();
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  await expect(page.locator("[data-rule-id]")).toHaveCount(2);
  const before = await page.evaluate(
    () => window.builderReview.inspect().rules,
  );
  expect(before.map((rule) => rule.value)).toEqual([[99], [99]]);
  expect(new Set(before.map((rule) => rule.id)).size).toBe(2);
  await page
    .getByRole("button", { name: "Hold proposals", exact: true })
    .click();
  await page
    .locator("[data-rule-id]")
    .nth(target)
    .getByRole("button", { name: /^Value: Person(?::|$)/ })
    .click();
  await page.evaluate(() => {
    window.builderReview.beginOptions("current");
    if (!window.builderReview.settleOptions([{ id: 1, label: "Current one" }]))
      throw new Error("Synthetic page did not settle");
  });
  await expect(
    page.getByRole("option", { name: "Current one", exact: true }),
  ).toBeEnabled();
  const authority = await page.evaluate(() => window.builderReview.inspect());
  expect(authority.options.canChoose).toBe(true);
  expect(authority.options.kind).toBe("ready");
  return { before, authority };
}

async function accept(page: Page) {
  await page
    .locator("nav button")
    .getByText("Accept proposal", { exact: true })
    .evaluate((button) => {
      if (!(button instanceof HTMLButtonElement))
        throw new Error("Missing app acceptance port");
      button.click();
    });
}

test("n11 duplicate async field accepts a current choice for only the edited rule", async ({
  page,
}, testInfo) => {
  const { before, authority } = await duplicatedReadyPerson(page, 0);
  await page.getByRole("option", { name: "Current one", exact: true }).click();
  const submitted = await page.evaluate(() => window.builderReview.inspect());
  await testInfo.attach("duplicate-live-choice", {
    body: JSON.stringify({
      before,
      authority,
      submitted,
      runtimeErrors: runtimeErrors.get(page),
    }),
    contentType: "application/json",
  });
  expect(submitted.proposalCount).toBe(authority.proposalCount + 1);
  expect(submitted.rules).toEqual(before);
  await accept(page);
  const after = await page.evaluate(() => window.builderReview.inspect());
  expect(after.rules).toHaveLength(2);
  const targetValue = after.rules.find(
    (rule) => rule.id === before[0]?.id,
  )?.value;
  expect(targetValue).toEqual(expect.arrayContaining([99, 1]));
  expect(targetValue).toHaveLength(2);
  expect(after.rules.find((rule) => rule.id === before[1]?.id)).toEqual(
    before[1],
  );
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.builderReview
          .inspect()
          .options.selected.map((option) => option.id),
      ),
    )
    .toEqual(expect.arrayContaining([99, 1]));
  expect(
    await page.evaluate(() => window.builderReview.inspect().options.selected),
  ).toHaveLength(2);
});

test("n11 final deselection removes only the target duplicate and retains the other's selected label", async ({
  page,
}, testInfo) => {
  const { before, authority } = await duplicatedReadyPerson(page, 1);
  await page
    .getByRole("option", { name: "Person scope one", exact: true })
    .click();
  const submitted = await page.evaluate(() => window.builderReview.inspect());
  await testInfo.attach("duplicate-final-deselection", {
    body: JSON.stringify({
      before,
      authority,
      submitted,
      runtimeErrors: runtimeErrors.get(page),
    }),
    contentType: "application/json",
  });
  expect(submitted.proposalCount).toBe(authority.proposalCount + 1);
  expect(submitted.rules).toEqual(before);
  await accept(page);
  await expect(page.locator("[data-rule-id]")).toHaveCount(1);
  const after = await page.evaluate(() => window.builderReview.inspect());
  expect(after.rules).toEqual([before[0]]);
  expect(after.options.selected).toEqual([
    { id: 99, label: "Person scope one", known: true },
  ]);
  expect(after.options.canChoose).toBe(true);
  await expect(
    page.getByRole("button", { name: /^Value: Person(?::|$)/ }),
  ).toContainText("Person scope one");
});

test("n11 shared field union preserves numeric zero versus string zero without weakening projection validation", async ({
  page,
}) => {
  await page.goto("/");
  const before = await page.evaluate(
    () => window.builderReview.inspect().rules,
  );
  const proof = await page.evaluate(() =>
    window.builderReview.mixedOptionUnion(),
  );
  expect(proof.ids).toEqual([0, "0", 99]);
  expect(proof.selectedIds).toEqual([0, "0", 99]);
  expect(proof.rules.map((rule) => rule.value)).toEqual([
    [0, "0", 99],
    [0, "0"],
    [8],
  ]);
  expect(proof.duplicateInputRejected).toBe(true);
  expect(
    await page.evaluate(() => window.builderReview.inspect().rules),
  ).toEqual(before);
});
