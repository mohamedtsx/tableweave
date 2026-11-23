import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

async function assertAlignment(page: Page, expected: string[]) {
  const cellIds = await page
    .locator("tbody > tr")
    .evaluateAll((rows) =>
      rows.map((row) =>
        [...row.children].map((cell) => cell.getAttribute("data-column-id")),
      ),
    );
  for (const ids of cellIds) expect(ids).toEqual(expected);
  const spans = await page
    .locator("thead > tr")
    .evaluateAll((rows) =>
      rows.map((row) =>
        [...row.querySelectorAll("th")].reduce(
          (sum, th) => sum + th.colSpan,
          0,
        ),
      ),
    );
  expect(spans.every((span) => span === expected.length)).toBe(true);
  await expect(
    page.locator("thead th th, thead > div, tbody > div"),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-column-id="predicate-carrier"]'),
  ).toHaveCount(0);
  await expect(page.getByText("INTERNAL PREDICATE")).toHaveCount(0);
}

test("balanced grouped collection and standalone utility have real semantic DOM", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("grid", { name: "Grouped inventory" }),
  ).toBeVisible();
  await expect(page.locator("thead > tr")).toHaveCount(2);
  await expect(
    page.getByRole("columnheader", { name: "Identity", exact: true }),
  ).toHaveAttribute("colspan", "2");
  await expect(
    page.getByRole("columnheader", { name: "Stock", exact: true }),
  ).toHaveAttribute("colspan", "2");
  await expect(
    page.getByRole("rowheader", { name: "Alpha", exact: true }),
  ).toBeVisible();
  await expect(page.locator("tbody > tr > td")).toHaveCount(15);
  await expect(
    page.getByRole("checkbox", { name: "Select eligible rows on this page" }),
  ).toBeVisible();
  await assertAlignment(page, [
    "selection",
    "name",
    "sku",
    "quantity",
    "location",
  ]);
  await page.screenshot({ path: testInfo.outputPath("balanced.png") });
  expect(errors).toEqual([]);
});

test("uneven depth and visibility prune groups and rebuild header spans without carrier leaks", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle uneven depth" }).click();
  await expect(page.locator("thead > tr")).toHaveCount(3);
  await expect(
    page.getByRole("columnheader", { name: "Metrics", exact: true }),
  ).toHaveAttribute("colspan", "1");
  await assertAlignment(page, [
    "selection",
    "name",
    "sku",
    "quantity",
    "location",
  ]);
  await page.getByRole("button", { name: "Toggle SKU", exact: true }).click();
  await expect(
    page.getByRole("columnheader", { name: "Identity", exact: true }),
  ).toHaveAttribute("colspan", "1");
  await assertAlignment(page, ["selection", "name", "quantity", "location"]);
  await page.getByRole("button", { name: "Toggle stock group" }).click();
  await expect(
    page.getByRole("columnheader", { name: "Stock", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("columnheader", { name: "Metrics", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("thead > tr")).toHaveCount(2);
  await assertAlignment(page, ["selection", "name"]);
  await page.getByRole("button", { name: "Toggle stock group" }).click();
  await expect(page.locator("thead > tr")).toHaveCount(3);
  await assertAlignment(page, ["selection", "name", "quantity", "location"]);
  await page.screenshot({ path: testInfo.outputPath("uneven-pruned.png") });
  expect(errors).toEqual([]);
});

test("current-page selection preserves off-page IDs and exposes page checked/mixed state", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const header = page.getByRole("checkbox", {
    name: "Select eligible rows on this page",
  });
  await expect(header).not.toBeChecked();
  expect(
    await header.evaluate(
      (input) => input instanceof HTMLInputElement && input.indeterminate,
    ),
  ).toBe(false);
  await expect(
    page.getByRole("checkbox", { name: "Select Beta" }),
  ).toBeDisabled();
  await page
    .locator('tbody [data-key="inv-a"] [data-slot="checkbox-content"]')
    .click();
  await expect(page.getByLabel("Accepted selected IDs")).toHaveText(
    "inv-a,off-page",
  );
  expect(
    await header.evaluate(
      (input) => input instanceof HTMLInputElement && input.indeterminate,
    ),
  ).toBe(true);
  await header.locator("xpath=ancestor::label").click();
  await expect(page.getByLabel("Accepted selected IDs")).toHaveText(
    "inv-a,inv-d,off-page",
  );
  await header.locator("xpath=ancestor::label").click();
  await expect(page.getByLabel("Accepted selected IDs")).toHaveText("off-page");
  await header.locator("xpath=ancestor::label").click();
  await page.getByRole("button", { name: "Change page" }).click();
  await expect(page.getByRole("rowheader", { name: "Gamma" })).toBeVisible();
  await expect(header).not.toBeChecked();
  expect(
    await header.evaluate(
      (input) => input instanceof HTMLInputElement && input.indeterminate,
    ),
  ).toBe(false);
  await header.locator("xpath=ancestor::label").click();
  await expect(page.getByLabel("Accepted selected IDs")).toHaveText(
    "inv-a,inv-c,inv-d,off-page",
  );
  await expect(page.locator("[data-selected-count]")).toHaveText("4 selected");
  await page.getByRole("button", { name: "Change page" }).click();
  await expect(page.locator('tbody [data-key="inv-a"]')).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.locator('tbody [data-key="inv-d"]')).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(errors).toEqual([]);
});

test("controlled multi-sort priorities, primary aria-sort and same-ID data updates are reactive", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Sort Name, not sorted", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Sort Quantity, not sorted", exact: true })
    .click({ modifiers: ["Shift"] });
  await expect(page.getByRole("status", { name: "Sort order" })).toHaveText(
    "name ascending, priority 1; quantity ascending, priority 2",
  );
  await expect(page.locator('th[aria-sort="ascending"]')).toHaveCount(1);
  await expect(page.locator('th[data-column-id="name"]')).toHaveAttribute(
    "aria-sort",
    "ascending",
  );
  await expect(
    page.locator('th[data-column-id="quantity"]'),
  ).not.toHaveAttribute("aria-sort");
  await expect(
    page.getByRole("button", { name: "Sort Quantity, ascending, priority 2" }),
  ).toBeVisible();
  const before = await page
    .locator('tbody [data-key="inv-a"]')
    .getAttribute("data-key");
  await page.getByRole("button", { name: "Revise Alpha" }).click();
  await expect(
    page.getByRole("rowheader", { name: "Alpha revised", exact: true }),
  ).toBeVisible();
  expect(
    await page.locator('tbody [data-key="inv-a"]').getAttribute("data-key"),
  ).toBe(before);
  expect(errors).toEqual([]);
});

test("keyboard reaches native row selection and controlled sort without lost focus", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const sort = page.getByRole("button", {
    name: "Sort Name, not sorted",
    exact: true,
  });
  const grid = page.getByRole("grid", { name: "Grouped inventory" });
  await expect(grid).toBeVisible();
  for (let i = 0; i < 20; i++) {
    if (
      await grid.evaluate((element) => element.contains(document.activeElement))
    )
      break;
    await page.keyboard.press("Tab");
  }
  await page.keyboard.press("Control+Home");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowRight");
  await testInfo.attach("initial-keyboard-focus", {
    body: await page.evaluate(
      () => document.activeElement?.outerHTML ?? "none",
    ),
    contentType: "text/html",
  });
  await expect(sort).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Sort Name, ascending, priority 1" }),
  ).toBeFocused();
  const checkbox = page.getByRole("checkbox", {
    name: "Select Alpha",
    exact: true,
  });
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowLeft");
  await expect(checkbox).toBeFocused();
  await page.keyboard.press("Space");
  await expect(checkbox).toBeChecked();
  await expect(checkbox).toBeFocused();
  await expect(
    page.locator('tbody [data-key="inv-a"] [data-slot="checkbox-content"]'),
  ).toHaveAttribute("data-focus-visible", "true");
  await page.screenshot({ path: testInfo.outputPath("keyboard-focus.png") });
});

test("raw unequal-depth public branch reproduces upstream placeholder render limitation", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?raw-uneven");
  await expect
    .poll(() =>
      errors.some((error) => error.includes("render is not a function")),
    )
    .toBe(true);
  await testInfo.attach("raw-uneven-errors", {
    body: JSON.stringify(errors, null, 2),
    contentType: "application/json",
  });
});

test("rejected selection and sort proposals never become Aria-owned accepted state", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Reject proposals" }).click();
  await page
    .locator('tbody [data-key="inv-a"] [data-slot="checkbox-content"]')
    .click();
  await expect(
    page.getByRole("checkbox", { name: "Select Alpha", exact: true }),
  ).not.toBeChecked();
  await expect(page.getByLabel("Accepted selected IDs")).toHaveText("off-page");
  await page
    .getByRole("button", { name: "Sort Name, not sorted", exact: true })
    .click();
  await expect(page.getByRole("status", { name: "Sort order" })).toHaveText(
    "Not sorted",
  );
  await expect(page.locator("th[aria-sort]")).toHaveCount(0);
});

test("uneven padding headers never acquire keyboard focus", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle uneven depth" }).click();
  const grid = page.getByRole("grid", { name: "Grouped inventory" });
  for (let i = 0; i < 20; i++) {
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
  await page.keyboard.press("ArrowUp");
  await expect(page.locator('th[data-column-id="identity"]')).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator('th[data-column-id="stock"]')).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('th[data-column-id="identity"]')).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("button", { name: "Sort Name, not sorted", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(
    page.getByRole("checkbox", { name: "Select eligible rows on this page" }),
  ).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(
    page.getByRole("checkbox", { name: "Select eligible rows on this page" }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => document.activeElement?.closest('[aria-hidden="true"]') === null,
    ),
  ).toBe(true);
});

test("uneven semantic table has no scoped automated accessibility violations", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle uneven depth" }).click();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  await testInfo.attach("axe-results", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  });
  expect(results.violations).toEqual([]);
});

async function reachUnevenNameHeader(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle uneven depth" }).click();
  const grid = page.getByRole("grid", { name: "Grouped inventory" });
  for (let index = 0; index < 20; index++) {
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
}

test("Home from Identity skips the hidden leading utility padding", async ({
  page,
}, testInfo) => {
  await reachUnevenNameHeader(page);
  await page.keyboard.press("ArrowUp");
  await expect(page.locator('th[data-column-id="identity"]')).toBeFocused();
  await page.keyboard.press("Home");
  await testInfo.attach("Home-focus", {
    body: await page.evaluate(
      () => document.activeElement?.outerHTML ?? "none",
    ),
    contentType: "text/html",
  });
  expect(
    await page.evaluate(
      () => document.activeElement?.closest('[aria-hidden="true"]') === null,
    ),
  ).toBe(true);
  await expect(page.locator('th[data-column-id="identity"]')).toBeFocused();
  expect(
    await page.evaluate(
      () => document.activeElement?.closest('[aria-hidden="true"]') === null,
    ),
  ).toBe(true);
});

test("End from Metrics skips the hidden trailing location padding", async ({
  page,
}, testInfo) => {
  await reachUnevenNameHeader(page);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("button", {
      name: "Sort Quantity, not sorted",
      exact: true,
    }),
  ).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(page.locator('th[data-column-id="metrics"]')).toBeFocused();
  await page.keyboard.press("End");
  await testInfo.attach("End-focus", {
    body: await page.evaluate(
      () => document.activeElement?.outerHTML ?? "none",
    ),
    contentType: "text/html",
  });
  expect(
    await page.evaluate(
      () => document.activeElement?.closest('[aria-hidden="true"]') === null,
    ),
  ).toBe(true);
  await expect(page.locator('th[data-column-id="metrics"]')).toBeFocused();
  expect(
    await page.evaluate(
      () => document.activeElement?.closest('[aria-hidden="true"]') === null,
    ),
  ).toBe(true);
});

test("Home and End retain visible sibling and nested-leaf collection scope", async ({
  page,
}) => {
  await reachUnevenNameHeader(page);
  // Name's collection parent is its padding branch, not the flattened final
  // header row. End must not jump to Location merely because of DOM position.
  await page.keyboard.press("End");
  await expect(
    page.getByRole("button", { name: "Sort Name, not sorted", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Home");
  await expect(
    page.getByRole("button", { name: "Sort Name, not sorted", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("End");
  await expect(page.locator('th[data-column-id="stock"]')).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.locator('th[data-column-id="identity"]')).toBeFocused();
});

test("Shift Home and End skip padding without changing row selection", async ({
  page,
}) => {
  await reachUnevenNameHeader(page);
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Shift+Home");
  await expect(page.locator('th[data-column-id="identity"]')).toBeFocused();
  await page.keyboard.press("Shift+End");
  await expect(page.locator('th[data-column-id="stock"]')).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator('th[data-column-id="metrics"]')).toBeFocused();
  await page.keyboard.press("Shift+End");
  await expect(page.locator('th[data-column-id="metrics"]')).toBeFocused();
  await page.keyboard.press("Shift+Home");
  await expect(page.locator('th[data-column-id="metrics"]')).toBeFocused();
  await expect(page.getByLabel("Accepted selected IDs")).toHaveText("off-page");
  expect(
    await page.evaluate(
      () => document.activeElement?.closest('[aria-hidden="true"]') === null,
    ),
  ).toBe(true);
});

test("Ctrl and Meta Home End chords retain Aria global and platform semantics", async ({
  page,
}) => {
  await reachUnevenNameHeader(page);
  await page.keyboard.press("ArrowUp");
  // Meta chords on this Linux Chromium fixture are left to Aria/browser; they
  // must not be rewritten into local endpoint moves or hidden padding focus.
  await page.keyboard.press("Meta+Home");
  await expect(page.locator('th[data-column-id="identity"]')).toBeFocused();
  await page.keyboard.press("Meta+End");
  await expect(page.locator('th[data-column-id="identity"]')).toBeFocused();
  await page.keyboard.press("Control+Home");
  await expect(
    page.getByRole("checkbox", { name: "Select Alpha", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Control+End");
  // In Aria's tab-navigation mode, the focused checkbox owns non-arrow keys.
  // The padding guard must preserve that behavior rather than force a grid move.
  await expect(
    page.getByRole("checkbox", { name: "Select Alpha", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Control+End");
  await expect(
    page.locator('tbody [data-key="inv-d"] [data-column-id="location"]'),
  ).toBeFocused();
  await page.keyboard.press("Control+Shift+Home");
  await expect(
    page.getByRole("checkbox", { name: "Select Alpha", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Control+Shift+End");
  await expect(
    page.locator('tbody [data-key="inv-d"] [data-column-id="location"]'),
  ).toBeFocused();
  const ids = (
    await page.getByLabel("Accepted selected IDs").textContent()
  )?.split(",");
  expect(ids).toContain("off-page");
  expect(ids).not.toContain("inv-b");
  expect(
    await page.evaluate(
      () => document.activeElement?.closest('[aria-hidden="true"]') === null,
    ),
  ).toBe(true);
});
