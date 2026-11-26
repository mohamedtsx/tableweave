import { expect, test } from "@playwright/test";

const errors = new WeakMap<object, string[]>();
test.beforeEach(async ({ page }) => {
  const collected: string[] = []; errors.set(page, collected);
  page.on("pageerror", error => collected.push(error.message));
  await page.goto("/tests/criteria-builder/browser.html");
});
test.afterEach(({ page }) => expect(errors.get(page)).toEqual([]));

test("real React custom form DOM, uncontrolled value, caret and focus survive B and sort", async ({ page }) => {
  await page.getByRole("button", { name: /^Value: Note/ }).click();
  const input = page.getByRole("textbox", { name: "Custom note" });
  await input.fill("kept application form state");
  const original = await input.elementHandle();
  if (!original) throw new Error("Custom input missing");
  await input.evaluate((node: HTMLInputElement) => node.setSelectionRange(3, 9));
  await input.press("Alt+r");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("kept application form state");
  expect(await original.evaluate(node => node.isConnected)).toBe(true);
  expect(await input.evaluate((node: HTMLInputElement) => [node.selectionStart, node.selectionEnd])).toEqual([3, 9]);
  await input.press("Alt+q");
  expect(await original.evaluate(node => node.isConnected)).toBe(true);
  await expect(input).toBeFocused();
  await expect(page.getByTestId("observations")).toHaveText("0");
});
test("numeric confirmation, local Cancel, controlled proposal rejection and builder-only Clear", async ({ page }) => {
  const before = await page.getByTestId("accepted").textContent();
  await page.getByRole("button", { name: /^Value: Amount/ }).click();
  const value = page.getByRole("textbox", { name: "Value", exact: true });
  await value.fill("19");
  await page.getByRole("button", { name: "Cancel filter edit" }).click();
  await expect(page.getByTestId("accepted")).toHaveText(before ?? "");
  await expect(page.getByTestId("observations")).toHaveText("0");
  await page.getByRole("button", { name: /^Value: Amount/ }).click();
  await value.fill("20");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByTestId("observations")).toHaveText("1");
  await expect(page.getByTestId("accepted")).toHaveText(before ?? "");
  await page.getByRole("button", { name: "Reject proposal" }).click();
  await page.getByRole("button", { name: "Clear filter-builder rules" }).click();
  await expect(page.getByTestId("selection")).toHaveText('{"one":true}');
  await page.getByRole("button", { name: "Accept proposal" }).click();
  await expect(page.getByTestId("accepted")).toHaveText('{"join":"and","rules":[]}');
  await expect(page.getByTestId("selection")).toHaveText('{"one":true}');
});
test("Date exact input survives B; real P reset closes the old nested edit without deleting accepted rules", async ({ page }) => {
  const accepted = await page.getByTestId("accepted").textContent();
  await page.getByRole("button", { name: /^Value: Created/ }).click();
  const exact = page.getByRole("textbox", { name: /Exact date and time/ });
  await exact.fill("partial private date");
  const original = await exact.elementHandle();
  if (!original) throw new Error("Exact Date input missing");
  await exact.press("Alt+r");
  expect(await original.evaluate(node => node.isConnected)).toBe(true);
  await expect(exact).toHaveValue("partial private date");
  await expect(page.getByRole("button", { name: "Apply filter", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Reset domain" }).click();
  await expect(exact).toHaveCount(0);
  await expect(page.getByTestId("accepted")).toHaveText(accepted ?? "");
  await expect(page.getByTestId("selection")).toHaveText("{}");
  await expect(page.getByTestId("disposed")).toHaveText("false");
});
test("rendered suspended B cannot traverse candidate ports, and criteria omission cannot downgrade adoption", async ({ page }) => {
  await page.getByRole("button", { name: "Suspend candidate" }).click();
  await page.getByRole("button", { name: "Abandon candidate" }).click();
  await expect(page.getByTestId("candidate-reads")).toHaveText("0");
  await page.getByRole("button", { name: "Drop criteria" }).click();
  await expect(page.getByRole("button", { name: /^Value: Amount/ })).toHaveCount(0);
  await expect(page.getByText("Filter controls are unavailable.")).toBeVisible();
});
