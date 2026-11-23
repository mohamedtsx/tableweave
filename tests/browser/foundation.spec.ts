import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("static smoke boots styled vendor primitives and supports keyboard activation", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  const externalOrigins: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      url.protocol.startsWith("http") &&
      url.origin !== "http://127.0.0.1:6007"
    ) {
      externalOrigins.push(url.origin);
    }
  });
  await page.goto("/iframe.html?id=foundation-workspace--smoke&viewMode=story");
  const main = page.getByRole("main");
  await expect(
    main.getByRole("heading", { name: "Workspace foundation" }),
  ).toBeVisible();
  const button = main.getByRole("button", { name: "Check interaction" });
  await button.click();
  await expect(main.getByRole("status")).toHaveText("Checks completed: 1");
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(main.getByRole("status")).toHaveText("Checks completed: 2");
  await expect(button).toHaveAttribute("data-slot", "button");
  expect(
    await button.evaluate((element) => getComputedStyle(element).borderRadius),
  ).not.toBe("0px");
  const results = await new AxeBuilder({ page }).include("main").analyze();
  expect(results.violations).toEqual([]);
  expect(errors).toEqual([]);
  expect(externalOrigins).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("smoke.png"),
    fullPage: true,
  });
});
