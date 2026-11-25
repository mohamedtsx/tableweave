import { expect, test } from "@playwright/test";
test("real Next RSC refuses a function crossing the client boundary", async ({
  page,
}) => {
  const response = await page.goto("/non-serializable");
  expect(response?.status()).toBe(500);
  await expect(page.locator("body")).toContainText(
    /Event handlers cannot be passed|Functions cannot be passed|cannot be passed directly to Client Components/,
  );
});
