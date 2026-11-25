import { expect, test } from "@playwright/test";
test("styled: production actions, one details shell and authoritative response", async ({
  page,
}) => {
  let errors = 0;
  page.on("pageerror", () => {
    errors++;
  });
  await page.goto("/");
  await expect(
    page.getByRole("rowheader", { name: "Transfer note 01", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Review tx-001", exact: true })
    .click();
  await expect(page.getByLabel("Application notice")).toContainText(
    "review queued for tx-001",
  );
  await page
    .getByRole("checkbox", { name: "Select Transfer note 01", exact: true })
    .locator("xpath=ancestor::label[1]")
    .click();
  await page
    .getByRole("button", { name: "Queue synthetic review", exact: true })
    .click();
  await expect(page.getByLabel("Application notice")).toContainText(
    "1 IDs; 1 loaded records",
  );
  await page.getByRole("button", { name: /Clear row selection/ }).click();
  await page
    .getByRole("button", { name: "View details tx-001", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Reference draft" })
    .fill("synthetic working note");
  await page
    .getByRole("button", { name: "Save synthetic reference", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await page
    .getByRole("searchbox", { name: "Search descriptions" })
    .fill("Transfer note 11");
  await page
    .getByRole("searchbox", { name: "Search descriptions" })
    .press("Enter");
  await expect(
    page.getByRole("button", { name: "Deliver known page", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Deliver known page", exact: true })
    .click();
  await expect(
    page.getByRole("rowheader", { name: "Transfer note 11", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("rowheader", { name: "Transfer note 01", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Revoke application access", exact: true })
    .click();
  await expect(
    page.getByRole("rowheader", { name: "Transfer note 11", exact: true }),
  ).toHaveCount(0);
  expect(errors).toBe(0);
});
test("headless: real accepted query, stable selection/paging, zero style graph", async ({
  page,
}) => {
  await page.goto("/headless.html");
  await expect(
    page.getByRole("rowheader", { name: "Transfer note 01", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Select Transfer note 01", exact: true })
    .check();
  await expect(page.getByLabel("Selected count")).toHaveText("1 selected");
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(
    page.getByRole("rowheader", { name: "Transfer note 11", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Selected count")).toHaveText("1 selected");
  await page
    .getByRole("textbox", { name: "Search descriptions" })
    .fill("Transfer note 01");
  await page.getByRole("button", { name: "Apply search", exact: true }).click();
  await expect(
    page.getByRole("rowheader", { name: "Transfer note 01", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Selected count")).toHaveText("0 selected");
  expect(await page.evaluate(() => document.styleSheets.length)).toBe(0);
  await expect(page.locator('link[rel="stylesheet"], style')).toHaveCount(0);
  await page
    .getByRole("button", { name: "Revoke application access", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Search descriptions" }),
  ).toHaveValue("");
});
test("styled: manual recovery and locale transition retain the owner", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("rowheader", { name: "Transfer note 01", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Begin refresh", exact: true })
    .click();
  await page.getByRole("button", { name: "Fail request", exact: true }).click();
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await page
    .getByRole("button", { name: "Deliver known page", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Toggle direction", exact: true })
    .click();
  await expect(page.getByRole("main")).toHaveAttribute("dir", "rtl");
  await page
    .getByRole("button", { name: "Deliver known page", exact: true })
    .click();
  await expect(
    page.getByRole("rowheader", { name: "Transfer note 01", exact: true }),
  ).toBeVisible();
});
