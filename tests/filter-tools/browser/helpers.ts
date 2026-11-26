import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function openFixture(page: Page, query = "") {
  await page.goto(`/${query}`);
  await expect(page.getByTestId("native-ids")).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(window.wp07))).toBe(true);
}
export async function inspect(page: Page) {
  return page.evaluate(() => {
    if (!window.wp07) throw new Error("Fixture application is unavailable");
    return window.wp07.inspect();
  });
}
export async function addRule(page: Page, field: string, operator: string) {
  await page
    .getByRole("button", { name: "Add filter rule: Filters", exact: true })
    .click();
  await page.getByRole("option", { name: field, exact: true }).click();
  await page.getByRole("option", { name: operator, exact: true }).click();
}
export async function numberRule(page: Page, operator: string, value: string) {
  await addRule(page, "Amount", operator);
  await page.getByRole("textbox", { name: "Value", exact: true }).fill(value);
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
export async function applyDstDate(page: Page) {
  await page
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  await page
    .getByRole("button", { name: "DST day — March 9", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Apply date filter", exact: true })
    .click();
}
export async function inspector(page: Page) {
  const details = page.locator("details.wp07-inspector");
  if (!(await details.getAttribute("open"))) {
    if (
      !(await details.evaluate(
        (element) => element instanceof HTMLDetailsElement && element.open,
      ))
    )
      await details.locator("summary").click();
  }
}
/** App acknowledgements/data responses are allowed while a modal makes its
 * background inert. Invoke the real fixture callback, not a fake user click. */
export async function appAction(page: Page, name: string) {
  await page.locator("button").evaluateAll((buttons, label) => {
    const button = buttons.find((entry) => entry.textContent?.trim() === label);
    if (!(button instanceof HTMLButtonElement) || button.disabled)
      throw new Error("Application action unavailable");
    button.click();
  }, name);
}
export async function pendingNumber(page: Page) {
  return page.evaluateHandle(() => {
    const token = window.wp07?.numberDriver.getSnapshot().at(-1);
    if (!token) throw new Error("Application option request missing");
    return token;
  });
}
