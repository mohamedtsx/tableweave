import { expect, test } from "@playwright/test";

test("n1 accepting a controlled proposal cannot commit suspended replacement records", async ({
  page,
}) => {
  await page.goto("/review.html?controlled");
  await expect(page.locator("#review-rows")).toHaveText("a");
  await page.evaluate(() => {
    window.nativeReview.suspend();
    window.nativeReview.proposeSort();
  });
  await expect
    .poll(() => page.evaluate(() => window.nativeReview.suspended()))
    .toBe(true);
  await page.evaluate(() => window.nativeReview.acceptSort());
  await expect
    .poll(() => page.evaluate(() => window.nativeReview.sorting()))
    .toEqual(["amount:true"]);
  await expect(page.locator("#review-rows")).toHaveText("a");
  expect(await page.evaluate(() => window.nativeReview.nativeRows())).toEqual([
    "a",
  ]);
  expect(await page.evaluate(() => window.nativeReview.rawRows())).toEqual([
    "a",
  ]);
  expect(
    await page.evaluate(() => window.nativeReview.selectVisible()),
  ).toBeNull();
});

test("n1 keeps committed models and visible-row actions isolated from suspended/abandoned renders", async ({
  page,
}) => {
  await page.goto("/review.html");
  await expect(page.locator("#review-rows")).toHaveText("a");
  await page.evaluate(() => window.nativeReview.suspend());
  await expect
    .poll(() => page.evaluate(() => window.nativeReview.suspended()))
    .toBe(true);
  await expect(page.locator("#review-rows")).toHaveText("a");
  expect(await page.evaluate(() => window.nativeReview.nativeRows())).toEqual([
    "a",
  ]);
  expect(await page.evaluate(() => window.nativeReview.rawRows())).toEqual([
    "a",
  ]);
  expect(
    await page.evaluate(() => window.nativeReview.selectVisible()),
  ).toBeNull();
  expect(await page.evaluate(() => window.nativeReview.nativeRows())).toEqual([
    "a",
  ]);
  await page.evaluate(() => window.nativeReview.abandon());
  await expect(page.locator("#review-rows")).toHaveText("a");
  await expect(page.locator("#review-selection")).toHaveText("a");
});
test("n1 rejected controlled proposals cannot publish suspended native input", async ({
  page,
}) => {
  await page.goto("/review.html?controlled");
  await expect(page.locator("#review-rows")).toHaveText("a");
  await page.evaluate(() => {
    window.nativeReview.proposeSort();
    window.nativeReview.suspend();
  });
  await expect
    .poll(() => page.evaluate(() => window.nativeReview.suspended()))
    .toBe(true);
  expect(await page.evaluate(() => window.nativeReview.sorting())).toEqual([]);
  expect(await page.evaluate(() => window.nativeReview.nativeRows())).toEqual([
    "a",
  ]);
  expect(await page.evaluate(() => window.nativeReview.rawRows())).toEqual([
    "a",
  ]);
  await page.evaluate(() => window.nativeReview.rejectSort());
  expect(
    await page.evaluate(() => window.nativeReview.selectVisible()),
  ).toBeNull();
  await page.evaluate(() => window.nativeReview.abandon());
  await expect(page.locator("#review-selection")).toHaveText("a");
  expect(await page.evaluate(() => window.nativeReview.sorting())).toEqual([]);
});
test("n3 captured pager actions read latest committed metadata", async ({
  page,
}) => {
  await page.goto("/review.html");
  await expect(page.locator("#review-next")).toHaveText("true");
  await page.evaluate(() => window.nativeReview.metadata(false));
  await expect(page.locator("#review-next")).toHaveText("false");
  await page.evaluate(() => window.nativeReview.capturedNext());
  expect(await page.evaluate(() => window.nativeReview.page())).toBe(0);
});
test("n1 visible native row action remains valid while replacement data render is suspended", async ({
  page,
}) => {
  await page.goto("/review.html");
  await expect(page.locator("#review-rows")).toHaveText("a");
  await page.evaluate(() => window.nativeReview.suspend());
  await expect
    .poll(() => page.evaluate(() => window.nativeReview.suspended()))
    .toBe(true);
  expect(
    await page.evaluate(() => window.nativeReview.selectVisible()),
  ).toBeNull();
});
test("n3 speculative metadata cannot revoke committed navigation authority", async ({
  page,
}) => {
  await page.goto("/review.html");
  await expect(page.locator("#review-next")).toHaveText("true");
  await page.evaluate(() => window.nativeReview.suspendMetadata(false));
  await expect
    .poll(() => page.evaluate(() => window.nativeReview.suspended()))
    .toBe(true);
  await expect(page.locator("#review-next")).toHaveText("true");
  await page.evaluate(() => window.nativeReview.capturedNext());
  expect(await page.evaluate(() => window.nativeReview.page())).toBe(1);
});
