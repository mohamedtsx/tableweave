import { expect, test } from "@playwright/test";

test("unmodified real builder portal loses focus on selection swap without fake clocks", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?rule");
  const root = page.locator("#first");
  await expect(root.getByRole("grid")).toBeVisible();
  await root.getByRole("button", { name: /^Value: Amount: .+$/ }).click();
  const input = page.getByRole("textbox", { name: "Value", exact: true });
  await input.fill("70");
  await expect(input).toBeFocused();
  await page.evaluate(() =>
    window.filterControls.first?.external({
      type: "selection.change",
      update: { unavailable: true },
    }),
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await info.attach("unclocked-focus", {
    body: JSON.stringify(
      await page.evaluate(() => ({
        tag: document.activeElement?.tagName,
        label: document.activeElement?.getAttribute("aria-label"),
      })),
    ),
    contentType: "application/json",
  });
  await expect(
    root.getByRole("button", {
      name: "Cancel — Clear row selection",
      exact: true,
    }),
  ).toBeFocused();
  expect(errors).toEqual([]);
});
