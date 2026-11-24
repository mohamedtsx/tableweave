import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import {
  addRule,
  applyDstDate,
  inspect,
  inspector,
  numberRule,
  openFixture,
  pendingNumber,
} from "./helpers.js";

const errors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const found: string[] = [];
  errors.set(page, found);
  page.on("pageerror", (error) => found.push(error.message));
});
test.afterEach(({ page }) => expect(errors.get(page)).toEqual([]));

test("emitted public tools preserve configured ownership and render the actual native collection", async ({
  page,
}) => {
  await openFixture(page);
  await expect(page.getByTestId("native-ids")).toHaveText("a,b,c,d,e,f,g,h");
  await expect(page.getByRole("rowheader")).toHaveCount(8);
  await expect(
    page.getByRole("rowheader", { name: "Alpha zero", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Note", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Add filter rule: Filters", exact: true })
    .click();
  for (const excluded of [
    "description",
    "category",
    "happened",
    "internalCode",
  ])
    await expect(
      page.getByRole("option", { name: excluded, exact: true }),
    ).toHaveCount(0);
  await expect(
    page.getByRole("option", { name: "Note (hidden column)", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Add filter rule: Filters", exact: true }),
  ).toBeFocused();
});

test("native cross-field Any remains ANDed with actual search, tabs and timezone-aware date results", async ({
  page,
}) => {
  await openFixture(page);
  await numberRule(page, "is at least", "30");
  await expect(page.getByTestId("native-ids")).toHaveText("d,e,f,g,h");
  await addRule(page, "Note (hidden column)", "contains");
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("alpha");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByTestId("native-ids")).toHaveText("none");
  await page.getByRole("button", { name: "Any", exact: true }).click();
  await expect(page.getByTestId("native-ids")).toHaveText("b,d,e,f,g,h");
  await page.getByRole("searchbox", { name: "Search records" }).fill("Alpha");
  await page.getByRole("searchbox", { name: "Search records" }).press("Enter");
  await expect(page.getByTestId("native-ids")).toHaveText("b,d,g");
  await applyDstDate(page);
  await expect(page.getByTestId("native-ids")).toHaveText("b,g");
  await page.getByRole("tab", { name: "Paused", exact: true }).click();
  await expect(page.getByTestId("native-ids")).toHaveText("none");
  await page.getByRole("tab", { name: /^Ready/ }).click();
  await expect(page.getByTestId("native-ids")).toHaveText("b,g");
  expect((await inspect(page)).state.query.builder.join).toBe("or");
});

test("same-field rule IDs are independent in the native pipeline and coexist with owned tools", async ({
  page,
}) => {
  await openFixture(page);
  await numberRule(page, "is at least", "10");
  await numberRule(page, "is at most", "30");
  const ids = await page
    .locator("[data-rule-id]")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-rule-id")),
    );
  expect(ids).toHaveLength(2);
  expect(new Set(ids).size).toBe(2);
  await expect(page.getByTestId("native-ids")).toHaveText("b,c,d");
  await page.getByRole("searchbox", { name: "Search records" }).fill("Alpha");
  await page.getByRole("searchbox", { name: "Search records" }).press("Enter");
  await page.getByRole("tab", { name: /^Ready/ }).click();
  await applyDstDate(page);
  await expect(page.getByTestId("native-ids")).toHaveText("b");
  expect(
    (await inspect(page)).state.query.builder.rules.map(({ id }) => id),
  ).toEqual(ids);
});

test("builder-only Clear preserves every independent query criterion and column presentation", async ({
  page,
}) => {
  await openFixture(page, "?example=crossAny&independent");
  await expect(page.getByTestId("native-ids")).toHaveText("g,b");
  await inspector(page);
  await page
    .getByRole("button", { name: "Toggle note column", exact: true })
    .click();
  const before = await inspect(page);
  await page
    .getByRole("button", { name: "Clear filter-builder rules", exact: true })
    .click();
  await expect(page.getByTestId("native-ids")).toHaveText("g,b,a");
  const after = await inspect(page);
  expect(after.state.query.builder).toEqual({ join: "or", rules: [] });
  expect({ ...after.state.query, builder: null }).toEqual({
    ...before.state.query,
    builder: null,
  });
  expect(after.state.columns).toEqual(before.state.columns);
  await expect(
    page.getByRole("button", { name: "Add filter rule: Filters", exact: true }),
  ).toBeFocused();
});

test("invalid local draft and Cancel make no accepted request or result change", async ({
  page,
}) => {
  await openFixture(page);
  const before = await inspect(page);
  await addRule(page, "Amount", "equals");
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("1e999");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Enter a valid filter value.",
  );
  await expect(page.getByTestId("native-ids")).toHaveText("a,b,c,d,e,f,g,h");
  await page
    .getByRole("button", { name: "Cancel filter edit", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Add filter rule: Filters", exact: true }),
  ).toBeFocused();
  const after = await inspect(page);
  expect(after.state.query).toEqual(before.state.query);
  expect(after.metrics.acceptedRequests).toBe(before.metrics.acceptedRequests);
});

test("numeric zero, text zero, valueless false and membership removal preserve semantic types", async ({
  page,
}) => {
  await openFixture(page);
  await addRule(page, "Numeric entity", "is");
  await page.getByRole("option", { name: "Numeric zero", exact: true }).click();
  await expect(page.getByTestId("native-ids")).toHaveText("a,d,g");
  // Immediate selection may leave its accepted-controlled editor open. Escape
  // dismisses it; it must not roll back the already accepted predicate.
  await page.keyboard.press("Escape");
  await addRule(page, "Text entity", "is");
  await page.getByRole("option", { name: "Text zero", exact: true }).click();
  await expect(page.getByTestId("native-ids")).toHaveText("a,g");
  await page.keyboard.press("Escape");
  expect(
    (await inspect(page)).state.query.builder.rules.map(({ value }) => value),
  ).toEqual([0, "0"]);
  await addRule(page, "Nullable flag", "is false");
  await expect(page.getByTestId("native-ids")).toHaveText("a");
  const rules = (await inspect(page)).state.query.builder.rules;
  expect(Object.hasOwn(rules[2] ?? {}, "value")).toBe(false);
  await addRule(page, "Tags", "contains any of");
  await page.getByRole("option", { name: "Red", exact: true }).click();
  await expect(page.getByTestId("native-ids")).toHaveText("none");
  const acceptedWithTag = (await inspect(page)).state.query.builder.rules;
  await page.keyboard.press("Escape");
  expect(
    (await inspect(page)).state.query.builder.rules,
    "Escape must not remove an accepted membership rule",
  ).toEqual(acceptedWithTag);
  await page.getByRole("button", { name: /^Value: Tags: .+$/ }).click();
  await page.getByRole("option", { name: "Red", exact: true }).click();
  await expect(page.getByTestId("native-ids")).toHaveText("a");
  expect((await inspect(page)).state.query.builder.rules).toEqual(rules);
});

test("custom editor and evaluator compose with the same native query and search", async ({
  page,
}) => {
  await openFixture(page);
  await addRule(page, "Computed score", "is a multiple of");
  await page
    .getByRole("textbox", { name: "Custom numeric operand" })
    .fill("20");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByTestId("native-ids")).toHaveText("a,c,e,g");
  await page.getByRole("searchbox", { name: "Search records" }).fill("Alpha");
  await page.getByRole("searchbox", { name: "Search records" }).press("Enter");
  await expect(page.getByTestId("native-ids")).toHaveText("a,g");
  expect((await inspect(page)).state.query.builder.rules[0]).toMatchObject({
    field: "customScore",
    operator: "fixture.multiple-of",
    value: 20,
  });
});

test("private date primitive through public tools rejects partial values and preserves milliseconds/symbolic intent", async ({
  page,
}) => {
  await openFixture(page);
  await page
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Date value type" })
    .selectOption("instant");
  const start = page.getByRole("textbox", {
    name: "Start date — Exact date and time",
    exact: true,
  });
  const end = page.getByRole("textbox", {
    name: "End date — Exact date and time",
    exact: true,
  });
  await start.fill("2025-03-09T03:00:00.456-04:00");
  await end.fill("invalid");
  await expect(
    page.getByRole("button", { name: "Apply date filter", exact: true }),
  ).toBeDisabled();
  await expect(page.getByTestId("native-ids")).toHaveText("a,b,c,d,e,f,g,h");
  await end.fill("2025-03-09T03:00:00.456-04:00");
  await page
    .getByRole("button", { name: "Apply date filter", exact: true })
    .click();
  await expect(page.getByTestId("native-ids")).toHaveText("b");
  expect(JSON.stringify((await inspect(page)).state.query.date)).toContain(
    ".456-04:00",
  );
  await page
    .getByRole("button", { name: "Clear date filter", exact: true })
    .click();
  await addRule(page, "Calendar day", "is on");
  await page
    .getByRole("combobox", { name: "Date value type" })
    .selectOption("relative");
  await page
    .getByRole("combobox", { name: "Relative date preset" })
    .selectOption({ label: "Today" });
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByTestId("native-ids")).toHaveText("a,b,c,f,g");
  expect((await inspect(page)).state.query.builder.rules[0]?.value).toEqual({
    kind: "relative",
    preset: "today",
  });
});

test("controlled proposals and silent rejection never paint an optimistic builder/search query", async ({
  page,
}) => {
  await openFixture(page, "?controlled");
  await numberRule(page, "equals", "0");
  await expect(page.locator("[data-rule-id]")).toHaveCount(0);
  await expect(page.getByTestId("native-ids")).toHaveText("a,b,c,d,e,f,g,h");
  await page
    .getByRole("button", {
      name: "Silently reject proposed change",
      exact: true,
    })
    .click();
  await expect(page.locator("[data-rule-id]")).toHaveCount(0);
  expect((await inspect(page)).metrics.acceptedRequests).toBe(0);
  await numberRule(page, "equals", "10");
  await page
    .getByRole("button", { name: "Accept proposed change", exact: true })
    .click();
  await expect(page.getByTestId("native-ids")).toHaveText("b");
  await page.getByRole("button", { name: "Any", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "All", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", {
      name: "Silently reject proposed change",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Any", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.fill("Beta");
  await search.press("Enter");
  await expect(search).toHaveValue("");
  await page
    .getByRole("button", {
      name: "Silently reject proposed change",
      exact: true,
    })
    .click();
  await expect(search).toHaveValue("");
  await expect(page.getByTestId("native-ids")).toHaveText("b");
});

test("tabs keep one actual native results subtree and resource lifetime through delayed acceptance", async ({
  page,
}) => {
  await openFixture(page, "?controlled");
  const table = await page
    .locator('[aria-label="Synthetic filter results"]')
    .elementHandle();
  if (!table) throw new Error("Native collection missing");
  await page
    .getByRole("button", { name: "Results local state 0", exact: true })
    .click();
  const before = (await inspect(page)).metrics;
  await page.getByRole("tab", { name: /^Ready/ }).click();
  await expect(
    page.getByRole("tab", { name: "All categories", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page
    .getByRole("button", { name: "Accept proposed change", exact: true })
    .click();
  await expect(page.getByTestId("native-ids")).toHaveText("a,b,e,f,g");
  await expect(page.getByRole("tabpanel")).toHaveCount(1);
  const selected = page.getByRole("tab", { name: /^Ready/ });
  await expect(page.getByRole("tabpanel")).toHaveAttribute(
    "id",
    (await selected.getAttribute("aria-controls")) ?? "missing",
  );
  await expect(
    page.getByRole("button", { name: "Results local state 1", exact: true }),
  ).toBeVisible();
  expect(await table.evaluate((element) => element.isConnected)).toBe(true);
  const after = (await inspect(page)).metrics;
  expect(after.resultsMounts).toBe(before.resultsMounts);
  expect(after.resultsCleanups).toBe(before.resultsCleanups);
  expect(after.resourceInvalidations).toBe(before.resourceInvalidations);
});

test("selection-slot illustration hides normal tools without clearing accepted criteria or native/resource owners", async ({
  page,
}) => {
  await openFixture(page, "?example=repeated");
  const before = await inspect(page);
  await page
    .getByRole("button", { name: "Select visible records", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cancel selection", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add filter rule: Filters", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("searchbox", { name: "Search records" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Filter by date", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "All categories", exact: true }),
  ).toBeVisible();
  const selected = await inspect(page);
  expect(selected.state.query).toEqual(before.state.query);
  expect(selected.metrics.resultsMounts).toBe(before.metrics.resultsMounts);
  expect(selected.metrics.resourceInvalidations).toBe(
    before.metrics.resourceInvalidations,
  );
  await page
    .getByRole("button", { name: "Cancel selection", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Add filter rule: Filters", exact: true }),
  ).toBeVisible();
  expect((await inspect(page)).state.query).toEqual(before.state.query);
});

test("local async failures retry current tokens without replacing table results; picker close preserves work", async ({
  page,
}) => {
  await openFixture(page, "?async&example=entities");
  const before = await inspect(page);
  await page
    .getByRole("button", { name: /^Value: Numeric entity: .+$/ })
    .click();
  const first = await pendingNumber(page);
  await page.evaluate(
    (token) => window.wp07?.numberDriver.settle(token, "failure"),
    first,
  );
  await expect(page.getByRole("alert")).toContainText(
    "Options could not be loaded.",
  );
  await expect(page.getByTestId("native-ids")).toHaveText("a,g");
  await page
    .getByRole("button", { name: "Retry options", exact: true })
    .click();
  const retry = await pendingNumber(page);
  expect(
    await page.evaluate(
      ([a, b]) =>
        b.generation > a.generation &&
        b.term === a.term &&
        b.pageKey === a.pageKey,
      [first, retry] as const,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  expect(
    await page.evaluate(
      (token) => window.wp07?.numberDriver.settle(token, "ready"),
      retry,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: /^Value: Numeric entity: .+$/ }),
  ).toContainText("Numeric zero");
  const after = await inspect(page);
  expect(after.state.query).toEqual(before.state.query);
  expect(after.metrics.acceptedRequests).toBe(before.metrics.acceptedRequests);
  await first.dispose();
  await retry.dispose();
});
