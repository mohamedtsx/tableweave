import { expect, test } from "@playwright/test";
test("actual unpatched archive consumer mounts through real public exports, no aliases", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?compare=1");
  await expect(page.getByRole("table")).toHaveCount(2);
  await expect(page.locator('[data-instance="primary"] tbody tr')).toHaveCount(
    10,
  );
  const response = await request.get("/headless");
  expect(response.ok()).toBe(true);
  expect(errors).toEqual([]);
});
