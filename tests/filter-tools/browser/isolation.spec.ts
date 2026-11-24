import { expect, test } from "@playwright/test";
import { pendingNumber } from "./helpers.js";

test("two public table instances isolate native queries, scoped option labels, selection and resource lifetimes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?twins&async&example=entities");
  await expect(page.getByRole("main")).toHaveCount(1);
  const first = page.getByRole("region", {
    name: "First synthetic table",
    exact: true,
  });
  const second = page.getByRole("region", {
    name: "Second synthetic table",
    exact: true,
  });
  await expect(first.getByTestId("native-ids")).toHaveText("a,g");
  await expect(second.getByTestId("native-ids")).toHaveText(
    "second-a,second-g",
  );
  await expect
    .poll(() => page.evaluate(() => Boolean(window.wp07 && window.wp07Second)))
    .toBe(true);
  const originalSecond = await page.evaluate(() =>
    window.wp07Second?.inspect(),
  );
  await first
    .getByRole("button", { name: /^Value: Numeric entity: .+$/ })
    .click();
  const tokenA = await pendingNumber(page);
  await page.evaluate(
    (token) =>
      window.wp07?.numberDriver.source.succeed(token, {
        options: [{ id: 0, label: "Scope A numeric zero" }],
        hasMore: false,
      }),
    tokenA,
  );
  await page.keyboard.press("Escape");
  await expect(
    first.getByRole("button", { name: /^Value: Numeric entity: .+$/ }),
  ).toContainText("Scope A numeric zero");
  await second
    .getByRole("button", { name: /^Value: Numeric entity: .+$/ })
    .click();
  const tokenB = await page.evaluateHandle(() => {
    const token = window.wp07Second?.numberDriver.getSnapshot().at(-1);
    if (!token) throw new Error("Second table option request missing");
    return token;
  });
  expect(await tokenA.evaluate((token) => token.scopeKey)).toBe("scope-a");
  expect(await tokenB.evaluate((token) => token.scopeKey)).toBe("scope-b");
  expect(
    await page.evaluate(
      (token) =>
        window.wp07?.numberDriver.source.succeed(token, {
          options: [{ id: 0, label: "Cross-table response" }],
          hasMore: false,
        }),
      tokenB,
    ),
  ).toBe(false);
  expect(
    await page.evaluate(
      (token) =>
        window.wp07Second?.numberDriver.source.succeed(token, {
          options: [{ id: 0, label: "Scope B numeric zero" }],
          hasMore: false,
        }),
      tokenB,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(
    second.getByRole("button", { name: /^Value: Numeric entity: .+$/ }),
  ).toContainText("Scope B numeric zero");
  await expect(first).not.toContainText("Scope B numeric zero");
  await expect(second).not.toContainText("Scope A numeric zero");
  await first
    .getByRole("button", { name: "Clear filter-builder rules", exact: true })
    .click();
  await expect(first.getByTestId("native-ids")).toHaveText("a,b,c,d,e,f,g,h");
  await first.getByRole("searchbox", { name: "Search records" }).fill("Alpha");
  await first.getByRole("searchbox", { name: "Search records" }).press("Enter");
  await expect(first.getByTestId("native-ids")).toHaveText("a,b,d,g");
  await first
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  await page
    .getByRole("button", { name: "DST day — March 9", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Apply date filter", exact: true })
    .click();
  await expect(first.getByTestId("native-ids")).toHaveText("a,b,g");
  await first
    .getByRole("button", { name: "Select visible records", exact: true })
    .click();
  await expect(
    first.getByRole("button", { name: "Cancel selection", exact: true }),
  ).toBeVisible();
  await expect(second.getByTestId("native-ids")).toHaveText(
    "second-a,second-g",
  );
  expect(await page.evaluate(() => window.wp07Second?.inspect())).toEqual(
    originalSecond,
  );
  expect(
    await page.evaluate(
      () => window.wp07Second?.numberDriver.source.getSnapshot().active,
    ),
  ).toBe(true);
  await expect(
    second.getByRole("button", { name: /^Value: Numeric entity: .+$/ }),
  ).toContainText("Scope B numeric zero");
  await tokenA.dispose();
  await tokenB.dispose();
  expect(errors).toEqual([]);
});
