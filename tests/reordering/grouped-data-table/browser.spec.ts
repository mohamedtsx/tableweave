import { expect, type Page, test } from "@playwright/test";
import { registerSourceDiagnostics } from "../query-safe/source-diagnostics.js";
import type {} from "./fixtures.js";

test.afterEach(async ({ page }) => {
  await page.evaluate(() => window.groupedDataTable?.dispose());
});
registerSourceDiagnostics();

const initialVisible = [
  "selection",
  "description",
  "status",
  "occurred",
  "amount",
  "account",
  "magnitude",
  "details",
];
const movedOrder = [
  "selection",
  "description",
  "status",
  "occurred",
  "account",
  "reference",
  "amount",
  "magnitude",
  "details",
];
const grid = (page: Page) =>
  page.getByRole("grid", { name: /^Synthetic grouped transactions$/ });
const amount = (page: Page) =>
  grid(page).getByRole("button", { name: /^Move column: Amount$/ });
const state = (page: Page) =>
  page.evaluate(() => {
    if (!window.groupedDataTable) throw new Error("Fixture bootstrap missing");
    return window.groupedDataTable.state();
  });
const visibleIds = (page: Page) =>
  grid(page)
    .locator('thead th[data-slot="table-column"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-column-id")),
    );

async function open(page: Page, deferred = false) {
  await page.goto(
    `/tests/reordering/grouped-data-table/browser.html${deferred ? "?deferred" : ""}`,
  );
  if (deferred) {
    await expect(grid(page)).toHaveCount(0);
    await page.getByRole("button", { name: /^Mount table$/ }).click();
  }
  await expect(grid(page)).toBeVisible();
  expect(await grid(page).evaluate((node) => node.tagName)).toBe("TABLE");
  await expect(amount(page)).toBeEnabled();
  await expect.poll(() => visibleIds(page)).toEqual(initialVisible);
  await expect(grid(page).locator("tbody tr[data-key]")).toHaveCount(10);
  const current = await state(page);
  expect(current.rowReordering).toBe(false);
  expect(current.columnReordering).toBe(true);
  expect(current.visibility.reference).toBe(false);
  expect(current.effects.setup).toBeGreaterThanOrEqual(2);
  expect(current.effects.cleanup).toBeGreaterThanOrEqual(1);
  await expect(
    grid(page).getByRole("button", { name: /^Move row:/ }),
  ).toHaveCount(0);
}

async function moveAfter(page: Page) {
  await amount(page).click();
  const menu = page.getByRole("menu", { name: /^Move column: Amount$/ });
  await expect(
    menu.getByRole("menuitem", { name: /^Move before$/ }),
  ).toBeDisabled();
  const after = menu.getByRole("menuitem", { name: /^Move after$/ });
  await expect(after).toBeEnabled();
  await after.click();
  await expect.poll(async () => (await state(page)).order).toEqual(movedOrder);
  await expect
    .poll(() => visibleIds(page))
    .toEqual(movedOrder.filter((id) => id !== "reference"));
  const current = await state(page);
  expect(new Set(current.order).size).toBe(movedOrder.length);
  expect([...current.order].sort()).toEqual([...movedOrder].sort());
  expect(current.order.indexOf("reference")).toBe(5);
  expect(current.visibility.reference).toBe(false);
  await expect(
    grid(page).getByRole("button", {
      name: /^Move column: (Selection|Details|Values|Reference)$/,
    }),
  ).toHaveCount(0);
  const group = grid(page).locator('th[data-column-id="values"]');
  await expect(group).toHaveAttribute("colspan", "3");
}

test("columns-only grouped DataTable seals after real refs; complete hidden-ID permutation", async ({
  page,
}) => {
  await open(page);
  await moveAfter(page);
  await grid(page)
    .getByRole("button", { name: /^Move column: Magnitude$/ })
    .click();
  const menu = page.getByRole("menu", { name: /^Move column: Magnitude$/ });
  await expect(
    menu.getByRole("menuitem", { name: /^Move after$/ }),
  ).toBeDisabled();
  await expect(
    menu.getByRole("menuitem", { name: /^Move before$/ }),
  ).toBeEnabled();
  expect((await state(page)).order).toEqual(movedOrder);
});

test("later application mount and StrictMode unmount/remount reseal without row transport", async ({
  page,
}) => {
  await open(page, true);
  const oldHandle = await amount(page).elementHandle();
  if (!oldHandle) throw new Error("Actual native handle missing");
  await page.getByRole("button", { name: /^Unmount table$/ }).click();
  await expect(grid(page)).toHaveCount(0);
  expect(await oldHandle.evaluate((node) => node.isConnected)).toBe(false);
  await page.getByRole("button", { name: /^Mount table$/ }).click();
  await expect(amount(page)).toBeEnabled();
  await expect.poll(() => visibleIds(page)).toEqual(initialVisible);
  await moveAfter(page);
  expect(await oldHandle.evaluate((node) => node.isConnected)).toBe(false);
  await oldHandle.dispose();
});

test("hide/reveal preserves groups and utilities; replacement inputs reseal genuine headers", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: /^Hide Account$/ }).click();
  await expect(
    grid(page).getByRole("button", { name: /^Move column: Account$/ }),
  ).toHaveCount(0);
  await expect(amount(page)).toBeEnabled();
  await expect
    .poll(() => visibleIds(page))
    .toEqual(initialVisible.filter((id) => id !== "account"));
  await page.getByRole("button", { name: /^Show Account$/ }).click();
  await expect(
    grid(page).getByRole("button", { name: /^Move column: Account$/ }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: /^Replace synthetic records$/ })
    .click();
  await expect(
    grid(page).getByText("Replacement Transfer note 01", { exact: true }),
  ).toBeVisible();
  await expect(amount(page)).toBeEnabled();
  await expect.poll(() => visibleIds(page)).toEqual(initialVisible);
  await moveAfter(page);
});

for (const revoke of ["Revoke source", "Retire publication"] as const) {
  test(`${revoke} removes actionable native moves and keeps accepted order unchanged`, async ({
    page,
  }) => {
    await open(page);
    await amount(page).click();
    await expect(
      page.getByRole("menuitem", { name: /^Move after$/ }),
    ).toBeEnabled();
    const before = (await state(page)).order;
    await page.getByRole("button", { name: revoke, exact: true }).click();
    await expect(
      page.getByRole("button", { name: /^Move column:/ }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("menuitem", { name: /^Move after$/ }),
    ).toHaveCount(0);
    const retired = await state(page);
    expect(retired.sourceLive).toBe(false);
    expect(retired.retainedInputCount).toBe(0);
    expect(retired.publicationAccess).toBe(revoke === "Revoke source");
    expect(retired.order).toEqual(before);
    // Retained DOM, if any, must be disabled or hidden/inert, never actionable.
    expect(
      await page
        .locator('button[aria-label^="Move column:"]')
        .evaluateAll((nodes) =>
          nodes.every(
            (node) =>
              node.hasAttribute("disabled") ||
              node.closest("[inert], [hidden]") !== null,
          ),
        ),
    ).toBe(true);
  });
}
