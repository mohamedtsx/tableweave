import { expect, test } from "@playwright/test";

test("stable child preserves custom form DOM, input, focus and caret across actual config commits", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/criteria-commit/browser.html");
  const input = page.getByRole("textbox", { name: "Fixture raw input" });
  await input.fill("12345");
  await input.focus();
  const id = await input.getAttribute("data-form");
  await input.evaluate((element: HTMLInputElement) =>
    element.setSelectionRange(2, 4),
  );
  // DOM click without focus transfer: host props reallocate but child stays mounted.
  await page
    .getByRole("button", { name: "Reconfigure", exact: true })
    .evaluate((element: HTMLButtonElement) => element.click());
  await expect(input).toHaveValue("12345");
  await expect(input).toBeFocused();
  expect(await input.getAttribute("data-form")).toBe(id);
  expect(
    await input.evaluate((element: HTMLInputElement) => [
      element.selectionStart,
      element.selectionEnd,
    ]),
  ).toEqual([2, 4]);
  expect(errors).toEqual([]);
});

test("Suspense/transition candidate renders do not capture private props until an actual commit", async ({
  page,
}) => {
  await page.goto("/tests/criteria-commit/browser.html");
  const input = page.getByRole("textbox", { name: "Fixture raw input" });
  await input.fill("owned");
  await page
    .getByRole("button", { name: "Suspend candidate", exact: true })
    .click();
  await expect(input).toHaveValue("owned");
  expect(
    await page.evaluate(
      () =>
        (
          window as unknown as {
            criteriaCommitFixture: { counts(): { descriptorReads: number } };
          }
        ).criteriaCommitFixture.counts().descriptorReads,
    ),
  ).toBe(0);
  await page.getByRole("button", { name: "Resolve", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              criteriaCommitFixture: { counts(): { descriptorReads: number } };
            }
          ).criteriaCommitFixture.counts().descriptorReads,
      ),
    )
    .toBeGreaterThan(0);
  await expect(input).toHaveValue("owned");
});

test("real Strict/hide lifecycle resets only local edits, not application selection/domain", async ({
  page,
}) => {
  await page.goto("/tests/criteria-commit/browser.html");
  const input = page.getByRole("textbox", { name: "Fixture raw input" });
  await input.fill("local");
  await page.getByRole("button", { name: "Toggle", exact: true }).click();
  await expect(input).toHaveCount(0);
  await page.getByRole("button", { name: "Toggle", exact: true }).click();
  await expect(input).toHaveValue("");
  expect(
    await page.evaluate(() =>
      (
        window as unknown as {
          criteriaCommitFixture: {
            counts(): { selection: object; phase: string };
          };
        }
      ).criteriaCommitFixture.counts(),
    ),
  ).toMatchObject({ selection: { one: true }, phase: "settled" });
});
