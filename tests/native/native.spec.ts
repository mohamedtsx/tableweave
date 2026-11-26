import { expect, test } from "@playwright/test";

test("subscribed memoized leaves, atomic controlled sorts and same-query data/metadata refresh", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/native.html");
  await expect(page.locator("#rows")).toHaveText("a,b");
  await expect(page.locator("#selected-a")).toHaveText("false");
  const sortingEffects = await page.locator("#sorting-effect").textContent();
  await page.locator("#select-a").click();
  await expect(page.locator("#selected-a")).toHaveText("true");
  await expect(page.locator("#sorting-effect")).toHaveText(
    sortingEffects ?? "",
  );
  await page.locator("#sort").click();
  await expect(page.locator("#sort-value")).toHaveText("");
  await page.locator("#reject").click();
  await expect(page.locator("#sort-value")).toHaveText("");
  await page.locator("#sort").click();
  await page.locator("#accept").click();
  await expect(page.locator("#sort-value")).toHaveText("amount:false");
  await expect(page.locator("#selected-a")).toHaveText("true");
  await expect(page.locator("#notifications")).toHaveText("1");
  await page.locator("#refresh").click();
  await expect(page.locator("#rows")).toHaveText("fresh");
  await expect(page.locator("#selected-a")).toHaveText("true");
  await expect(page.locator("#next-available")).toHaveText("false");
  await page.locator("#next").click();
  await expect(page.locator("#page")).toHaveText("0");
  await page.locator("#allow-next").click();
  await expect(page.locator("#next-available")).toHaveText("true");
  await page.locator("#next").click();
  await page.locator("#accept").click();
  await expect(page.locator("#page")).toHaveText("1");
  await page.locator("#cancel-selection").click();
  await expect(page.locator("#selected-a")).toHaveText("false");
  expect(errors).toEqual([]);
});
