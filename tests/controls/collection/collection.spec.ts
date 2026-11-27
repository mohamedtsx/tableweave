import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("multiple uses eligible current page and preserves off-page IDs", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("grid", { name: "Items" })).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Select Beta", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("checkbox", { name: "Select eligible rows on this page" })
    .locator("xpath=ancestor::label")
    .click();
  expect(await page.evaluate(() => window.collection.ids())).toEqual([
    "a",
    "c",
    "off",
  ]);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("rowheader", { name: "Delta", exact: true }),
  ).toBeVisible();
  const all = page
    .getByRole("checkbox", { name: "Select eligible rows on this page" })
    .locator("xpath=ancestor::label");
  await all.click();
  expect(await page.evaluate(() => window.collection.ids())).toEqual([
    "a",
    "c",
    "d",
    "off",
  ]);
  await all.click();
  expect(await page.evaluate(() => window.collection.ids())).toEqual([
    "a",
    "c",
    "off",
  ]);
});

test("single has row checks but no header/all keyboard path and replaces IDs", async ({
  page,
}) => {
  await page.goto("/?single");
  await expect(page.locator("thead input[type=checkbox]")).toHaveCount(0);
  const a = page.getByRole("checkbox", { name: "Select Alpha", exact: true });
  const c = page.getByRole("checkbox", { name: "Select Gamma", exact: true });
  await a.locator("xpath=ancestor::label").click();
  expect(await page.evaluate(() => window.collection.ids())).toEqual(["a"]);
  await c.locator("xpath=ancestor::label").click();
  expect(await page.evaluate(() => window.collection.ids())).toEqual(["c"]);
  await c.focus();
  await page.keyboard.press("Control+a");
  expect(await page.evaluate(() => window.collection.ids())).toEqual(["c"]);
  await page.keyboard.press("Meta+a");
  expect(await page.evaluate(() => window.collection.ids())).toEqual(["c"]);
});

test("disabled mode supplies no selection checkbox or all-keyboard mutation", async ({
  page,
}) => {
  await page.goto("/?none");
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByRole("grid").focus();
  await page.keyboard.press("Control+a");
  expect(await page.evaluate(() => window.collection.ids())).toEqual([]);
});

test("controlled selection and sorting wait for acceptance and survive rejection", async ({
  page,
}) => {
  await page.goto("/?controlled");
  const a = page.getByRole("checkbox", { name: "Select Alpha", exact: true });
  await a.locator("xpath=ancestor::label").click();
  await expect(a).not.toBeChecked();
  await expect(page.locator('tbody [data-key="a"]')).toHaveAttribute(
    "aria-selected",
    "false",
  );
  expect(await page.evaluate(() => window.collection.requests())).toBe(1);
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(a).toBeChecked();
  await a.locator("xpath=ancestor::label").click();
  await expect(a).toBeChecked();
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(a).toBeChecked();
  await page
    .getByRole("button", { name: "Sort Name, not sorted", exact: true })
    .click();
  await expect(page.getByLabel("Accepted sorting")).toHaveText("");
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.getByLabel("Accepted sorting")).toHaveText("name:false");
});

for (const target of ["row", "page"] as const)
  test(`old connected ${target} action cannot overwrite newer accepted selection before commit`, async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("grid")).toBeVisible();
    const evidence = await page.evaluate(
      (target) => window.collection.stale("selection", target),
      target,
    );
    expect(evidence.connected).toBe(true);
    expect(evidence.before).toBe(evidence.after);
    expect(await page.evaluate(() => window.collection.ids())).toEqual([
      "fresh",
    ]);
  });

test("old connected row query is blocked while same-owner header sort uses latest accepted query", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("grid")).toBeVisible();
  const row = await page.evaluate(() =>
    window.collection.stale("query", "row"),
  );
  expect(row.before).toBe(row.after);
  expect(row.connected).toBe(true);
  expect(await page.evaluate(() => window.collection.ids())).toEqual(["off"]);
  await page.goto("/");
  await expect(page.getByRole("grid")).toBeVisible();
  const sort = await page.evaluate(() =>
    window.collection.stale("query", "sort"),
  );
  expect(sort.before).toBe(sort.after);
  expect(sort.query.sorting).toEqual([{ id: "name", desc: false }]);
  expect(sort.query.pagination.pageIndex).toBe(0);
});

test("resource initial/retained/pending/failure and privacy masking do not fabricate models", async ({
  page,
}) => {
  await page.goto("/?server");
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await page.getByRole("button", { name: "Succeed", exact: true }).click();
  await page.getByRole("rowheader", { name: "Alpha", exact: true }).click();
  expect(await page.evaluate(() => window.collection.ids())).toEqual([
    "a",
    "off",
  ]);
  await expect(
    page.getByRole("rowheader", { name: "Alpha", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await expect(
    page.getByRole("rowheader", { name: "Alpha", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Select Alpha", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Fail", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Select Alpha", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Sort Score, not sorted", exact: true })
    .click();
  await expect(page.getByLabel("Accepted sorting")).toHaveText("score:false");
  await page
    .getByRole("button", { name: "Mask before effect", exact: true })
    .click();
  const surface = page.getByRole("region", { name: "Collection surface" });
  await expect(surface.getByRole("grid")).toHaveCount(0);
  await expect(surface.locator("output, [data-slot=table-footer]")).toHaveCount(
    0,
  );
  await expect(surface).not.toContainText("Alpha");
});

test("old connected scoped row action denies immediately from actual resource context", async ({
  page,
}) => {
  await page.goto("/?server");
  await page.getByRole("button", { name: "Succeed", exact: true }).click();
  await expect(page.getByRole("grid")).toBeVisible();
  const evidence = await page.evaluate(() =>
    window.collection.stale("scope", "row"),
  );
  expect(evidence.before).toBe(evidence.after);
  expect(evidence.connected).toBe(true);
  expect(await page.evaluate(() => window.collection.ids())).toEqual(["off"]);
  await expect(
    page.getByRole("region", { name: "Collection surface" }),
  ).not.toContainText("Alpha");
});

test("preferred row-header hiding falls back without changing row IDs/text; hidden primary retains true priority", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Hide preferred", exact: true })
    .click();
  await expect(
    page.locator(
      'tbody [data-key="a"] [role=rowheader], tbody [data-key="a"] th',
    ),
  ).toHaveText("3");
  await expect(
    page.getByRole("checkbox", { name: "Select Alpha", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Hidden primary sort", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Sort Score, descending, priority 2",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator('th[aria-sort="ascending"], th[aria-sort="descending"]'),
  ).toHaveCount(0);
  await expect(page.getByRole("status", { name: "Sort order" })).toHaveText(
    "name ascending, priority 1; score descending, priority 2",
  );
  await expect(page.locator("thead > div, tbody > div, th th")).toHaveCount(0);
});

test("same-query eligibility refresh disables current row without changing IDs", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ineligible", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Select Alpha", exact: true }),
  ).toBeDisabled();
  expect(await page.evaluate(() => window.collection.ids())).toEqual(["off"]);
});

test("replaceable messages, provider RTL, diagnostics off, narrow/dark and scoped axe", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/?rtl&messages&diagoff&dark");
  const grid = page.getByRole("grid", { name: "Items" });
  await expect(grid).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "كل الصفوف الحالية", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "اختيار Alpha", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-slot="table-footer"]')).toHaveCount(0);
  await expect(page.getByLabel("عدد مشترك")).toHaveCount(0);
  expect(
    await grid.evaluate((element) => getComputedStyle(element).direction),
  ).toBe("rtl");
  expect(
    await page
      .locator("[data-slot=checkbox-control]")
      .first()
      .evaluate((element) => getComputedStyle(element).borderTopWidth),
  ).toBe("1px");
  const accessibility = await new AxeBuilder({ page })
    .include('[aria-label="Collection surface"]')
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("rtl-dark-320.png") });
  await page.getByRole("button", { name: "Diagnostics", exact: true }).click();
  await expect(page.getByLabel("عدد مشترك")).toHaveText("قيمة 1");
});

test("legacy native-only path retains minimal APIs and default subscribed diagnostics", async ({
  page,
}) => {
  await page.goto("/?legacy");
  await expect(page.getByLabel("Subscribed selected count")).toHaveText("1");
  await page
    .getByRole("checkbox", { name: "Select Alpha", exact: true })
    .locator("xpath=ancestor::label")
    .click();
  await expect(page.getByLabel("Subscribed selected count")).toHaveText("2");
});

for (const input of [
  "bad-owner",
  "bad-definition",
  "copied-owner",
  "proxy-owner",
  "foreign-rows",
])
  test(`explicit owner provenance masks ${input} before renderer ports or B events`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/?${input}`);
    await expect(
      page
        .getByRole("region", { name: "Collection surface" })
        .getByRole("grid"),
    ).toHaveCount(0);
    await expect(
      page
        .getByRole("region", { name: "Collection surface" })
        .locator("button,input,output"),
    ).toHaveCount(0);
    expect(await page.evaluate(() => window.collection.ids())).toEqual(["off"]);
    expect(await page.evaluate(() => window.collection.alienPortReads())).toBe(
      0,
    );
    expect(errors).toEqual([]);
  });

test("multiple checkbox Space and page-all keyboard use accepted controlled IDs", async ({
  page,
}) => {
  await page.goto("/");
  const first = page.getByRole("checkbox", {
    name: "Select Alpha",
    exact: true,
  });
  await first.focus();
  await page.keyboard.press("Space");
  await expect(first).toBeChecked();
  await page.keyboard.press("Control+a");
  expect(await page.evaluate(() => window.collection.ids())).toEqual([
    "a",
    "c",
    "off",
  ]);
});

test("genuine RAC keyboard range preserves its accepted anchor and rechecks final authority", async ({
  page,
}) => {
  await page.goto("/?server&all-eligible");
  await page.getByRole("button", { name: "Succeed", exact: true }).click();
  await page.getByRole("rowheader", { name: "Alpha", exact: true }).click();
  expect(await page.evaluate(() => window.collection.ids())).toEqual([
    "a",
    "off",
  ]);
  await page.getByRole("rowheader", { name: "Alpha", exact: true }).focus();
  await page.evaluate(() => window.collection.flipBatch());
  await page.keyboard.press("Control+Shift+End");
  expect(await page.evaluate(() => window.collection.flips())).toBe(1);
  expect(await page.evaluate(() => window.collection.ids())).toEqual([
    "a",
    "off",
  ]);
});

test("genuine RAC range atomically adds every eligible row and preserves off-page IDs", async ({
  page,
}) => {
  await page.goto("/?all-eligible");
  await page.getByRole("rowheader", { name: "Alpha", exact: true }).click();
  await page.getByRole("rowheader", { name: "Alpha", exact: true }).focus();
  await page.keyboard.press("Control+Shift+End");
  expect(await page.evaluate(() => window.collection.ids())).toEqual([
    "a",
    "b",
    "c",
    "off",
  ]);
});

test("controlled range remains unselected until accepted and retains the accepted anchor after rejection", async ({
  page,
}) => {
  await page.goto("/?controlled&all-eligible");
  const first = page.getByRole("rowheader", { name: "Alpha", exact: true });
  await first.click();
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await first.focus();
  await page.keyboard.press("Control+Shift+End");
  expect(await page.evaluate(() => window.collection.ids())).toEqual([
    "a",
    "off",
  ]);
  await expect(page.locator('tbody [data-key="b"]')).toHaveAttribute(
    "aria-selected",
    "false",
  );
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await first.focus();
  await page.keyboard.press("Control+Shift+End");
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  expect(await page.evaluate(() => window.collection.ids())).toEqual([
    "a",
    "b",
    "c",
    "off",
  ]);
});

test("Escape uses scoped Cancel even with obsolete rows but never clears another scope", async ({
  page,
}) => {
  await page.goto("/?server");
  await page.getByRole("button", { name: "Succeed", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Select Alpha", exact: true })
    .locator("xpath=ancestor::label")
    .click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Select Alpha", exact: true }),
  ).toBeDisabled();
  await page.getByRole("grid").focus();
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => window.collection.ids())).toEqual([]);
  await page.goto("/?server");
  await page.getByRole("button", { name: "Succeed", exact: true }).click();
  const evidence = await page.evaluate(() =>
    window.collection.stale("scope", "cancel"),
  );
  expect(evidence.connected).toBe(true);
  expect(evidence.before).toBe(evidence.after);
  expect(await page.evaluate(() => window.collection.ids())).toEqual(["off"]);
});

test("invalid utility row header has an owned replaceable diagnostic", async ({
  page,
}) => {
  await page.goto("/?invalid-header&messages");
  await expect(page.getByRole("alert")).toHaveText("عنوان صف غير صالح");
});

test("approved controller rejects hiding all data without breaking the current row header", async ({
  page,
}) => {
  await page.goto("/?messages");
  await page
    .getByRole("button", { name: "Hide all data", exact: true })
    .click();
  await expect(
    page.getByRole("rowheader", { name: "Alpha", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("a utility-only controlled collection has an owned missing-data diagnostic", async ({
  page,
}) => {
  await page.goto("/?utility-only");
  await expect(page.getByRole("alert")).toHaveText("أعمدة غير صالحة");
});

test("light layout contains table scrolling across the scoped viewport matrix", async ({
  page,
}, info) => {
  await page.goto("/?diagoff");
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("grid", { name: "Items" })).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    if (width === 1440)
      await page.screenshot({ path: info.outputPath("light-1440.png") });
  }
  await page
    .getByRole("button", { name: "Sort Name, not sorted", exact: true })
    .click();
  await expect(page.locator('th[data-column-id="name"]')).toHaveAttribute(
    "aria-sort",
    "ascending",
  );
  const accessibility = await new AxeBuilder({ page })
    .include('[aria-label="Collection surface"]')
    .analyze();
  expect(accessibility.violations).toEqual([]);
});
