// Additional authored browser obligations. Not executed or compiler evidence.
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/data-table/details-accessory/browser.html");
});
test("the actual unselectable multi-select row is a positive details target", async ({
  page,
}) => {
  await page.evaluate(() => window.boundDetails.mountOther());
  await page.getByRole("button", { name: "Details one" }).last().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("[data-row]")).toHaveText("actual row");
});
test("two actual owners have independent dialogs and accepted target lifetimes", async ({
  page,
}) => {
  await page.evaluate(() => window.boundDetails.mountOther());
  await page.getByRole("button", { name: "Details one" }).first().click();
  await page.evaluate(() => window.boundDetails.client.close());
  await expect(page.locator(".tw-details__dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Details one" }).last().click();
  await page.evaluate(() => window.boundDetails.client.configB());
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page.evaluate(() => window.boundDetails.client.state().rowId),
  ).toBeNull();
});
test("dirty false blocks and dirty true submits through the same footer policy", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Details one" }).click();
  await page.evaluate(() => window.boundDetails.client.dirty(true));
  await page.getByRole("button", { name: "Close details" }).click();
  await page.evaluate(() => window.boundDetails.client.resolve(false));
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.evaluate(() => window.boundDetails.client.resolve(true));
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("Escape and backdrop route through actual beforeChange rather than a second close engine", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Details one" }).click();
  const before = await page.evaluate(
    () => window.boundDetails.client.state().counters.before,
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Details one" }).click();
  await page.mouse.click(4, 4);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => window.boundDetails.client.state().counters.before,
    ),
  ).toBe(before + 2);
});
test("generation is data freshness, not a session key or a publisher epoch", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Details one" }).click();
  const old = await page.evaluate(
    () => window.boundDetails.client.state().authority,
  );
  const input = page.getByRole("textbox", { name: "Controlled draft" });
  await input.fill("Generation-independent draft");
  await page.evaluate(() => window.boundDetails.client.refresh());
  const next = await page.evaluate(
    () => window.boundDetails.client.state().authority,
  );
  expect(next.generation).toBe(old.generation + 1);
  expect(next.session).toBe(old.session);
  expect(next.context.epoch).toBe(old.context.epoch);
  await expect(input).toHaveValue("Generation-independent draft");
});
test("unknown copied and proxied actual models deny before alleged model fields", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const { createDetailsCommitCell } = await import(
      "/packages/heroui/src/details/committed-details.ts"
    );
    const actual = window.boundDetails.client.actualModel();
    let reads = 0,
      denied = 0;
    const proxy = new Proxy(actual, {
      get() {
        reads++;
        throw new Error("alleged model");
      },
      getOwnPropertyDescriptor() {
        reads++;
        throw new Error("alleged model");
      },
      getPrototypeOf() {
        reads++;
        throw new Error("alleged model");
      },
    });
    for (const value of [{}, { ...actual }, proxy])
      try {
        createDetailsCommitCell(value);
      } catch {
        denied++;
      }
    return { reads, denied };
  });
  expect(result).toEqual({ reads: 0, denied: 3 });
});
