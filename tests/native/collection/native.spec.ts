import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

async function openNative(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?native");
  await expect(
    page.getByRole("grid", { name: "Native grouped inventory" }),
  ).toBeVisible();
  return errors;
}
async function assertNativeRows(page: Page, ids: string[]) {
  await expect(page.getByLabel("Native row IDs")).toHaveText(ids.join(","));
  expect(
    await page
      .locator("tbody > tr")
      .evaluateAll((rows) => rows.map((row) => row.getAttribute("data-key"))),
  ).toEqual(ids);
}
async function assertNativeAlignment(page: Page, expected: string[]) {
  await expect(page.getByLabel("Native visible columns")).toHaveText(
    expected.join(","),
  );
  for (const ids of await page
    .locator("tbody > tr")
    .evaluateAll((rows) =>
      rows.map((row) =>
        [...row.children].map((cell) => cell.getAttribute("data-column-id")),
      ),
    ))
    expect(ids).toEqual(expected);
  const spans = await page
    .locator("thead > tr")
    .evaluateAll((rows) =>
      rows.map((row) =>
        [...row.querySelectorAll("th")].reduce(
          (total, cell) => total + cell.colSpan,
          0,
        ),
      ),
    );
  expect(spans.every((span) => span === expected.length)).toBe(true);
  await expect(
    page.locator("thead th th, thead > div, tbody > div"),
  ).toHaveCount(0);
  expect(await page.getByRole("grid").textContent()).not.toContain("predicate");
}

test("native grouped headers, ordered leaves and FlexRender cells survive visibility/group pruning", async ({
  page,
}, testInfo) => {
  const errors = await openNative(page);
  await assertNativeRows(page, ["a", "b"]);
  await expect(page.locator("thead > tr")).toHaveCount(3);
  await expect(
    page.getByRole("columnheader", { name: "Identity", exact: true }),
  ).toHaveAttribute("colspan", "2");
  await expect(
    page.getByRole("columnheader", { name: "Stock", exact: true }),
  ).toHaveAttribute("colspan", "2");
  await expect(
    page
      .getByRole("rowheader", { name: "Alpha", exact: true })
      .locator("strong"),
  ).toHaveText("Alpha");
  await assertNativeAlignment(page, [
    "selection",
    "name",
    "sku",
    "quantity",
    "location",
  ]);
  await page.getByRole("button", { name: "Native reorder identity" }).click();
  await assertNativeAlignment(page, [
    "selection",
    "sku",
    "name",
    "quantity",
    "location",
  ]);
  await page.getByRole("button", { name: "Native toggle SKU" }).click();
  await assertNativeAlignment(page, [
    "selection",
    "name",
    "quantity",
    "location",
  ]);
  await page.getByRole("button", { name: "Native toggle stock" }).click();
  await expect(
    page.getByRole("columnheader", { name: "Stock", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("columnheader", { name: "Metrics", exact: true }),
  ).toHaveCount(0);
  await assertNativeAlignment(page, ["selection", "name"]);
  await testInfo.attach("native-grid-dom", {
    body: await page.getByRole("grid").evaluate((element) => element.outerHTML),
    contentType: "text/html",
  });
  await testInfo.attach("native-grid-aria", {
    body: await page.getByRole("grid").ariaSnapshot(),
    contentType: "text/plain",
  });
  await page.screenshot({ path: testInfo.outputPath("native-pruned.png") });
  expect(errors).toEqual([]);
});

test("native cross-field Any and repeated same-field rules process before real page projection", async ({
  page,
}) => {
  const errors = await openNative(page);
  await page
    .getByRole("button", { name: "Cross-field Any", exact: true })
    .click();
  await expect(page.getByLabel("Native filtered IDs")).toHaveText("a,b,d,e");
  await expect(page.getByLabel("Native builder rule count")).toHaveText("2");
  await assertNativeRows(page, ["a", "b"]);
  await page.getByRole("button", { name: "Native next page" }).click();
  await assertNativeRows(page, ["d", "e"]);
  await page
    .getByRole("button", { name: "Repeated-field Any", exact: true })
    .click();
  await expect(page.getByLabel("Native filtered IDs")).toHaveText("b,d,e,f");
  await expect(page.getByLabel("Native builder rule count")).toHaveText("2");
  await expect(page.getByLabel("Native page metadata")).toHaveText(
    "client/0/2/known/4",
  );
  await assertNativeRows(page, ["b", "d"]);
  await page.getByRole("button", { name: "Native page size 10" }).click();
  await assertNativeRows(page, ["b", "d", "e", "f"]);
  expect(errors).toEqual([]);
});

test("native controlled sort callbacks determine rows and priority without Aria sort ownership", async ({
  page,
}) => {
  const errors = await openNative(page);
  await page
    .getByRole("button", { name: "Sort Quantity, not sorted", exact: true })
    .click();
  await assertNativeRows(page, ["b", "d"]);
  await page
    .getByRole("button", { name: "Sort Name, not sorted", exact: true })
    .click({ modifiers: ["Shift"] });
  await expect(page.getByRole("status", { name: "Sort order" })).toHaveText(
    "quantity ascending, priority 1; name ascending, priority 2",
  );
  await expect(page.getByLabel("Subscribed sorting")).toHaveText(
    "quantity:false,name:false",
  );
  await expect(page.locator('th[aria-sort="ascending"]')).toHaveCount(1);
  await expect(page.locator('th[data-column-id="quantity"]')).toHaveAttribute(
    "aria-sort",
    "ascending",
  );
  await page.getByRole("button", { name: "Native next page" }).click();
  await assertNativeRows(page, ["a", "c"]);
  await page.getByRole("button", { name: "Hold native proposals" }).click();
  await page
    .getByRole("button", { name: "Sort Quantity, ascending, priority 1" })
    .click();
  await assertNativeRows(page, ["a", "c"]);
  await expect(page.getByLabel("Subscribed sorting")).toHaveText(
    "quantity:false,name:false",
  );
  await page.getByRole("button", { name: "Reject native proposal" }).click();
  await assertNativeRows(page, ["a", "c"]);
  await page
    .getByRole("button", { name: "Sort Quantity, ascending, priority 1" })
    .click();
  await page.getByRole("button", { name: "Accept native proposal" }).click();
  await expect(page.getByLabel("Subscribed sorting")).toHaveText(
    "quantity:true",
  );
  await assertNativeRows(page, ["e", "f"]);
  expect(errors).toEqual([]);
});

test("native stable-ID selection is subscribed and page actions preserve off-page IDs", async ({
  page,
}) => {
  const errors = await openNative(page);
  await expect(page.getByLabel("Subscribed selected count")).toHaveText("1");
  await page
    .locator('tbody [data-key="a"] [data-slot="checkbox-content"]')
    .click();
  await expect(page.getByLabel("Subscribed selected count")).toHaveText("2");
  await expect(page.getByLabel("Native accepted selected IDs")).toContainText(
    "a",
  );
  await expect(
    page.getByRole("checkbox", { name: "Select Beta", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Native next page" }).click();
  await assertNativeRows(page, ["d", "c"]);
  const header = page.getByRole("checkbox", {
    name: "Select eligible rows on this page",
  });
  await expect(header).not.toBeChecked();
  expect(
    await header.evaluate(
      (element) => element instanceof HTMLInputElement && element.indeterminate,
    ),
  ).toBe(false);
  await header.locator("xpath=ancestor::label").click();
  await expect(page.getByLabel("Subscribed selected count")).toHaveText("4");
  await header.locator("xpath=ancestor::label").click();
  await expect(page.getByLabel("Subscribed selected count")).toHaveText("2");
  await page.getByRole("button", { name: "Native previous page" }).click();
  await expect(page.locator('tbody [data-key="a"]')).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("button", { name: "Hold native proposals" }).click();
  await page
    .locator('tbody [data-key="a"] [data-slot="checkbox-content"]')
    .click();
  await expect(
    page.getByRole("checkbox", { name: "Select Alpha", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Reject native proposal" }).click();
  await expect(page.getByLabel("Subscribed selected count")).toHaveText("2");
  expect(errors).toEqual([]);
});

test("native data-only and metadata-only refreshes update current view without resetting accepted state", async ({
  page,
}) => {
  const errors = await openNative(page);
  const revision = await page.getByLabel("Native state revision").textContent();
  const effects = await page
    .getByLabel("Subscribed sorting")
    .getAttribute("data-effects");
  await page
    .getByRole("button", { name: "Unrelated native owner render" })
    .click();
  await expect(page.getByLabel("Unrelated native render count")).toHaveText(
    "1",
  );
  expect(
    await page.getByLabel("Subscribed sorting").getAttribute("data-effects"),
  ).toBe(effects);
  await page.getByRole("button", { name: "Native data refresh" }).click();
  await expect(
    page
      .getByRole("rowheader", { name: "Alpha refreshed", exact: true })
      .locator("strong"),
  ).toHaveText("Alpha refreshed");
  await expect(
    page.locator('tbody [data-key="a"] [data-column-id="quantity"]'),
  ).toHaveText("8");
  await expect(page.getByLabel("Native state revision")).toHaveText(
    revision ?? "",
  );
  await page.getByRole("button", { name: "Use server page" }).click();
  await assertNativeRows(page, ["f", "a", "d"]);
  await expect(page.getByLabel("Native page metadata")).toHaveText(
    "server/0/2/unknown/false",
  );
  await expect(
    page.getByRole("button", { name: "Native next page" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Server has next" }).click();
  await expect(
    page.getByRole("button", { name: "Native next page" }),
  ).toBeEnabled();
  await expect(page.getByLabel("Native page metadata")).toHaveText(
    "server/0/2/unknown/true",
  );
  await page.getByRole("button", { name: "Server known total" }).click();
  await expect(page.getByLabel("Native page metadata")).toHaveText(
    "server/0/2/known/17",
  );
  await expect(page.getByLabel("Native state revision")).toHaveText(
    revision ?? "",
  );
  expect(errors).toEqual([]);
});

test("server page bypasses native filter/sort/pagination while maintaining grouped collection", async ({
  page,
}) => {
  const errors = await openNative(page);
  await page
    .getByRole("button", { name: "Repeated-field Any", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Sort Name, not sorted", exact: true })
    .click();
  await page.getByRole("button", { name: "Native next page" }).click();
  await page.getByRole("button", { name: "Use server page" }).click();
  // Supplied server records stay in supplied order, even a record that fails the
  // active client predicate, and even when the supplied page exceeds pageSize.
  await assertNativeRows(page, ["f", "a", "d"]);
  await expect(page.getByLabel("Native builder rule count")).toHaveText("2");
  await expect(page.getByLabel("Native page metadata")).toHaveText(
    "server/1/2/unknown/false",
  );
  await assertNativeAlignment(page, [
    "selection",
    "name",
    "sku",
    "quantity",
    "location",
  ]);
  await page
    .getByRole("button", { name: "Use complete client records" })
    .click();
  await assertNativeRows(page, ["e", "f"]);
  await expect(page.getByLabel("Native page metadata")).toHaveText(
    "client/1/2/known/4",
  );
  expect(errors).toEqual([]);
});

test("native controlled keyboard sort and selection retain stable focus and skip grouped padding", async ({
  page,
}, testInfo) => {
  const errors = await openNative(page);
  const grid = page.getByRole("grid", { name: "Native grouped inventory" });
  for (let index = 0; index < 50; index++) {
    if (
      await grid.evaluate((element) => element.contains(document.activeElement))
    )
      break;
    await page.keyboard.press("Tab");
  }
  await page.keyboard.press("Control+Home");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("button", { name: "Sort Name, not sorted", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", {
      name: "Sort Name, ascending, priority 1",
      exact: true,
    }),
  ).toBeFocused();
  await assertNativeRows(page, ["a", "b"]);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowLeft");
  const alpha = page.getByRole("checkbox", {
    name: "Select Alpha",
    exact: true,
  });
  await expect(alpha).toBeFocused();
  await page.keyboard.press("Space");
  await expect(alpha).toBeChecked();
  await expect(alpha).toBeFocused();
  await expect(page.getByLabel("Subscribed selected count")).toHaveText("2");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await expect(
    page.getByRole("checkbox", { name: "Select eligible rows on this page" }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => document.activeElement?.closest('[aria-hidden="true"]') === null,
    ),
  ).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("native-keyboard.png") });
  expect(errors).toEqual([]);
});
