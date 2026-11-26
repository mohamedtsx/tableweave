import { expect, type Page, test } from "@playwright/test";
import type { port } from "./fixture.js";

declare global {
  interface Window {
    pagerDisabled: typeof port;
  }
}
let errors: string[];
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
});
test.afterEach(async () => {
  expect(errors).toEqual([]);
});
async function open(page: Page, scenario: string) {
  await page.goto(`/?case=${scenario}`);
  await expect(
    page.getByRole("heading", { name: "Disabled pager source policy fixture" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => window.pagerDisabled.observe().renderCommits),
    )
    .toBeGreaterThanOrEqual(2);
  if (scenario.startsWith("hook-"))
    await expect
      .poll(() =>
        page.evaluate(() => window.pagerDisabled.observe().hookEffects),
      )
      .toBeGreaterThanOrEqual(2);
}
async function settledClick(page: Page, name: string) {
  const previous = await page.evaluate(
    () => window.pagerDisabled.observe().hookEffects,
  );
  await page.getByRole("button", { name, exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.pagerDisabled.observe().hookEffects))
    .toBeGreaterThan(previous);
}
test("raw disabled schema renders nothing and never reads presentation/optional prop references", async ({
  page,
}) => {
  await open(page, "raw-disabled");
  await expect(page.locator(".tw-pagination")).toHaveCount(0);
  const observed = await page.evaluate(() => window.pagerDisabled.observe());
  expect(observed.audit).toEqual([]);
  expect(observed.disabledCommands).toEqual([]);
  expect(observed.disabledStateUnchanged).toBe(true);
});
for (const scenario of ["hook-disabled", "hook-disabled-looking"]) {
  test(`${scenario}: committed disabled hook performs no private capture/read/dispatch work`, async ({
    page,
  }) => {
    await open(page, scenario);
    const observed = await page.evaluate(() => window.pagerDisabled.observe());
    expect(observed.audit).toEqual([]);
    expect(observed.reads.count).toBe(0);
    expect(observed.commands).toEqual([]);
    expect(observed.requests).toEqual([]);
    expect(observed.disabledCommands).toEqual([]);
    expect(observed.disabledStateUnchanged).toBe(true);
  });
}
test("unusable controller metadata fails closed before hostile context/authority", async ({
  page,
}) => {
  await open(page, "hook-metadata-error");
  const observed = await page.evaluate(() => window.pagerDisabled.observe());
  expect(observed.audit.length).toBeGreaterThan(0);
  expect(observed.audit.every((event) => event === "metadata.get")).toBe(true);
  expect(observed.reads.count).toBe(0);
  expect(observed.commands).toEqual([]);
  expect(observed.requests).toEqual([]);
});
test("explicit own metadata accessor suppresses pager without invoking getter", async ({
  page,
}) => {
  await open(page, "metadata-disabled");
  await expect(page.locator(".tw-pagination")).toHaveCount(0);
  expect(
    (await page.evaluate(() => window.pagerDisabled.observe())).audit,
  ).toEqual([]);
});
test("enabled genuine authority still navigates with real keyboard target/focus and original summary", async ({
  page,
}) => {
  await open(page, "enabled");
  await expect(page.locator("#pager-range")).toHaveText(
    "1–2 of 12 records · Page 1 of 6",
  );
  await page
    .getByRole("button", { name: "Page 2", exact: true })
    .press("Enter");
  await expect(page.locator("#pager-range")).toHaveText(
    "3–4 of 12 records · Page 2 of 6",
  );
  await expect(page.locator("#pager-page-2")).toBeFocused();
  expect(
    (await page.evaluate(() => window.pagerDisabled.observe())).commits,
  ).toEqual(["pagination.change"]);
});
test("enabled correction still clamps using real owner and receiver, without resource transport", async ({
  page,
}) => {
  await open(page, "hook-enabled");
  await expect
    .poll(() => page.evaluate(() => window.pagerDisabled.observe().pageIndex))
    .toBe(1);
  const observed = await page.evaluate(() => window.pagerDisabled.observe());
  expect(observed.commits).toEqual(["pagination.clamp"]);
  expect(observed.reads.count).toBeGreaterThan(0);
  expect(observed.reads.receivers.every(Boolean)).toBe(true);
  expect(observed.disabledCommands).toEqual([]);
});
test("true→false→true preserves spent owner/epoch attempt, rejection and hook order", async ({
  page,
}) => {
  await open(page, "hook-spent");
  expect(
    (await page.evaluate(() => window.pagerDisabled.observe())).requests,
  ).toEqual(["pagination.clamp"]);
  await settledClick(page, "Reject correction");
  await settledClick(page, "Rerender owner");
  await settledClick(page, "Disable policy");
  await expect(page.getByLabel("Fixture policy")).toHaveText("disabled");
  await settledClick(page, "Enable policy");
  let observed = await page.evaluate(() => window.pagerDisabled.observe());
  expect(observed.requests).toEqual(["pagination.clamp"]);
  expect(observed.commands).toEqual(["pagination.clamp"]);
  expect(observed.pageIndex).toBe(4);
  expect(observed.audit).toEqual([]);
  expect(observed.disabledCommands).toEqual([]);
  await settledClick(page, "Advance epoch");
  observed = await page.evaluate(() => window.pagerDisabled.observe());
  expect(observed.requests).toEqual(["pagination.clamp", "pagination.clamp"]);
  expect(observed.reads.receivers.every(Boolean)).toBe(true);
});
test("existing removed-target focus recovery remains enabled; disabled commit never steals external focus", async ({
  page,
}) => {
  await open(page, "focus");
  const current = page.getByRole("button", { name: "Page 5", exact: true });
  await current.click();
  await expect(current).toBeFocused();
  // Legitimate app data-completion port: a native input refresh, not a hidden UI click.
  await page.evaluate(() => window.pagerDisabled.shrink());
  await expect(current).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => document.activeElement?.closest("#pager") !== null),
    )
    .toBe(true);
  await page.evaluate(() => window.pagerDisabled.disable());
  await expect(page.locator("#pager")).toHaveCount(0);
  await page
    .getByRole("button", { name: "External region", exact: true })
    .click();
  await page.evaluate(() => window.pagerDisabled.enable());
  await expect(page.locator("#pager")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "External region", exact: true }),
  ).toBeFocused();
  expect(
    (await page.evaluate(() => window.pagerDisabled.observe())).audit,
  ).toEqual([]);
});
