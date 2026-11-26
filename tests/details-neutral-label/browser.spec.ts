import { expect, test } from "@playwright/test";
import type {} from "./browser.js";

test("explicit neutral label updates preserve actual accessory/lifecycle/actor/config/source and app form DOM", async ({
  page,
}) => {
  await page.goto("/tests/details-neutral-label/browser.html");
  await expect
    .poll(() => page.evaluate(() => window.detailsNeutralLabel.ready()))
    .toBe(true);
  await page.evaluate(() => window.detailsNeutralLabel.open());
  const input = page.getByRole("textbox", {
    name: "Local details draft",
    exact: true,
  });
  await expect(input).toBeVisible();
  await input.fill("Unsaved draft");
  await input.evaluate((node) => node.setAttribute("data-original", "yes"));
  await page.evaluate(() => {
    window.detailsNeutralLabel.capture();
    window.detailsNeutralLabel.arabic();
  });
  await expect(
    page.locator('section[aria-label="منطقة تفاصيل السجل"]'),
  ).toHaveCount(1);
  await expect(input).toHaveValue("Unsaved draft");
  await expect(input).toHaveAttribute("data-original", "yes");
  expect(
    Object.values(
      await page.evaluate(() => window.detailsNeutralLabel.identity()),
    ).every(Boolean),
  ).toBe(true);
  await page.evaluate(() => window.detailsNeutralLabel.custom());
  await expect(
    page.locator('section[aria-label="General details region"]'),
  ).toHaveCount(1);
  await expect(input).toHaveValue("Unsaved draft");
  expect(
    Object.values(
      await page.evaluate(() => window.detailsNeutralLabel.identity()),
    ).every(Boolean),
  ).toBe(true);
});
