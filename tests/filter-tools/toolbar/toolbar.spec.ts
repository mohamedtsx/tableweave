import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(({ page }) => {
  expect(runtimeErrors.get(page)).toEqual([]);
});

test("search uses schema debounce, Escape cancels, and Clear submits once", async ({
  page,
}) => {
  await page.goto("/toolbar.html");
  await page.clock.install({ time: new Date("2030-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2030-01-01T00:00:01Z"));
  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.fill("draft");
  await page.clock.runFor(100);
  await expect(page.getByTestId("accepted-search")).toHaveText("(empty)");
  await search.press("Escape");
  await page.clock.runFor(350);
  await expect(page.getByTestId("accepted-search")).toHaveText("(empty)");
  await search.fill("accepted");
  await page.clock.runFor(300);
  await expect(page.getByTestId("accepted-search")).toHaveText("accepted");
  await page
    .getByRole("button", { name: "Clear search", exact: true })
    .click({ force: true });
  await expect(page.getByTestId("accepted-search")).toHaveText("(empty)");
  await expect(page.getByTestId("observations")).toHaveText("2");
});

test("zero debounce and IME do not submit an unfinished composition", async ({
  page,
}) => {
  await page.goto("/toolbar.html?zero");
  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.dispatchEvent("compositionstart");
  await search.fill("日本");
  await search.press("Enter");
  await page.waitForTimeout(80);
  await expect(page.getByTestId("accepted-search")).toHaveText("(empty)");
  await search.dispatchEvent("compositionend");
  await expect(page.getByTestId("accepted-search")).toHaveText("日本");
});

test("controlled search rejects without an optimistic mirror", async ({
  page,
}) => {
  await page.goto("/toolbar.html?controlled&zero");
  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.fill("proposal");
  await expect(page.getByTestId("observations")).toHaveText("1");
  await expect(search).toHaveValue("");
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(page.getByTestId("accepted-search")).toHaveText("(empty)");
});

test("newer typing survives acceptance of its own older submission", async ({
  page,
}) => {
  await page.goto("/toolbar.html?controlled");
  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.fill("older");
  await search.press("Enter");
  await search.fill("newer");
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(search).toHaveValue("newer");
  await expect(page.getByTestId("accepted-search")).toHaveText("older");
  await expect(page.getByTestId("observations")).toHaveText("2");
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.getByTestId("accepted-search")).toHaveText("newer");
});

test("external replacement and scoped invalidation cancel stale timers", async ({
  page,
}) => {
  await page.goto("/toolbar.html");
  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.fill("stale");
  await page
    .getByRole("button", { name: "External search", exact: true })
    .click();
  await page.waitForTimeout(350);
  await expect(search).toHaveValue("external");
  await search.fill("private draft");
  await page.getByRole("button", { name: "Change scope", exact: true }).click();
  await expect(search).toHaveValue("external");
  await page.waitForTimeout(350);
  await expect(page.getByTestId("accepted-search")).toHaveText("external");
  await search.fill("reset draft");
  await page
    .getByRole("button", { name: "Invalidate drafts", exact: true })
    .click();
  await page.waitForTimeout(350);
  await expect(search).toHaveValue("external");
});

test("one real associated panel preserves DOM, local state and resource lifetime", async ({
  page,
}) => {
  await page.goto("/toolbar.html?controlled");
  const original = await page.getByRole("table").elementHandle();
  if (!original) throw new Error("Actual results table missing");
  await page.getByRole("button", { name: "Results local state 0" }).click();
  const lifecycle = await page.evaluate(() => ({ ...window.toolbarLifecycle }));
  await expect(
    page.getByRole("tab", { name: "Open", exact: true }),
  ).toHaveAccessibleDescription("Application total: 0");
  await page.getByRole("tab", { name: "Open" }).click();
  await expect(page.getByRole("tab", { name: "All records" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toHaveCount(1);
  await page.getByRole("tab", { name: "Closed", exact: true }).click();
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  const selected = page.getByRole("tab", { name: "Closed", exact: true });
  await expect(selected).toHaveAttribute("aria-selected", "true");
  const controls = await selected.getAttribute("aria-controls");
  await expect(page.getByRole("tabpanel")).toHaveAttribute(
    "id",
    controls ?? "missing",
  );
  await expect(page.getByRole("tabpanel")).toHaveAttribute(
    "aria-labelledby",
    (await selected.getAttribute("id")) ?? "missing",
  );
  expect(await original.evaluate((node) => node.isConnected)).toBe(true);
  await expect(
    page.getByRole("button", { name: "Results local state 1" }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.toolbarLifecycle)).toEqual(lifecycle);
  await expect(page.getByRole("table")).toHaveCount(1);
});

test("null selection without presentation is diagnosed rather than auto-selected", async ({
  page,
}) => {
  await page.goto("/toolbar.html?missing-neutral");
  await expect(page.getByRole("alert")).toContainText(
    "not configured correctly",
  );
  await expect(page.getByTestId("accepted-tab")).toHaveText("neutral");
  await expect(page.getByRole("tab", { name: "Open" })).toHaveAttribute(
    "aria-selected",
    "false",
  );
});

test("range relative preset remains symbolic and controlled summary remains accepted", async ({
  page,
}) => {
  await page.goto("/toolbar.html?controlled");
  await page
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await page
    .getByRole("button", { name: "Apply date filter", exact: true })
    .click();
  await expect(page.getByTestId("accepted-date")).toHaveText("null");
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.getByTestId("accepted-date")).toHaveText(
    '{"operator":"date.on","value":{"kind":"relative","preset":"today"}}',
  );
  await page
    .getByRole("button", { name: "Clear date filter", exact: true })
    .click();
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.getByTestId("accepted-date")).toHaveText("null");
});

test("default range and restricted operator mismatch is a visible configuration failure", async ({
  page,
}) => {
  await page.goto("/toolbar.html?incompatible");
  await expect(
    page.getByRole("button", { name: "Filter by date", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText(
    "not configured correctly",
  );
});

test("exact instant path preserves milliseconds without vendor granularity loss", async ({
  page,
}) => {
  await page.goto("/toolbar.html?single");
  await page
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Date value type" })
    .selectOption("instant");
  await page
    .getByRole("textbox", { name: "Date — Exact date and time" })
    .fill("2025-11-02T01:30:00.123-04:00");
  await page
    .getByRole("button", { name: "Apply date filter", exact: true })
    .click();
  await expect(page.getByTestId("accepted-date")).toHaveText(
    '{"operator":"date.on","value":{"kind":"instant","value":"2025-11-02T01:30:00.123-04:00"}}',
  );
});

test("literal day segments confirm only complete values; invalid blur cannot apply a prior or constrained date", async ({
  page,
}) => {
  await page.goto("/toolbar.html?single");
  await page
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  const segments = page.getByRole("spinbutton");
  await expect(segments).toHaveCount(3);
  await segments.nth(0).press("3");
  await segments.nth(1).press("8");
  await expect(
    page.getByRole("button", { name: "Apply date filter", exact: true }),
  ).toBeDisabled();
  await segments.nth(2).pressSequentially("2025");
  await page
    .getByRole("button", { name: "Apply date filter", exact: true })
    .click();
  await expect(page.getByTestId("accepted-date")).toHaveText(
    '{"operator":"date.on","value":{"kind":"day","value":"2025-03-08"}}',
  );
  await page
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  await segments.nth(0).press("2");
  await segments.nth(1).pressSequentially("30");
  await segments.nth(1).press("Tab");
  await expect(
    page.getByRole("button", { name: "Apply date filter", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Cancel date edit", exact: true })
    .click();
  await expect(page.getByTestId("accepted-date")).toHaveText(
    '{"operator":"date.on","value":{"kind":"day","value":"2025-03-08"}}',
  );
});

test("range segments never emit a half-range and include both complete day endpoints", async ({
  page,
}) => {
  await page.goto("/toolbar.html");
  await page
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  const segments = page.getByRole("spinbutton");
  await expect(segments).toHaveCount(6);
  await segments.nth(0).press("3");
  await segments.nth(1).press("8");
  await segments.nth(2).pressSequentially("2025");
  await expect(
    page.getByRole("button", { name: "Apply date filter", exact: true }),
  ).toBeDisabled();
  await segments.nth(3).press("3");
  await segments.nth(4).pressSequentially("10");
  await segments.nth(5).pressSequentially("2025");
  await page
    .getByRole("button", { name: "Apply date filter", exact: true })
    .click();
  await expect(page.getByTestId("accepted-date")).toHaveText(
    '{"operator":"date.between","value":[{"kind":"day","value":"2025-03-08"},{"kind":"day","value":"2025-03-10"}]}',
  );
});

test("wall-time convenience editing rejects a DST gap instead of shifting it", async ({
  page,
}) => {
  await page.goto("/toolbar.html?single");
  await page
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Date value type" })
    .selectOption("instant");
  await page
    .getByRole("textbox", { name: "Date — Exact date and time" })
    .fill("2025-03-09T01:30:00.123-05:00");
  await page.getByRole("spinbutton", { name: /^hour,/ }).press("2");
  await expect(page.getByRole("alert")).toContainText(
    "ambiguous or does not exist",
  );
  await expect(
    page.getByRole("button", { name: "Apply date filter", exact: true }),
  ).toBeDisabled();
  await expect(page.getByTestId("accepted-date")).toHaveText("null");
});

test("styled tools remain contained at required widths and expose no axe violations", async ({
  page,
}) => {
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/toolbar.html?${width === 390 ? "dark&rtl" : ""}`);
    await page
      .getByRole("button", { name: "Filter by date", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "Cancel date edit", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: `tests/filter-tools/toolbar/.artifacts/toolbar-${width}.png`,
      fullPage: true,
    });
    if (width === 1440) {
      const result = await new AxeBuilder({ page }).analyze();
      expect(result.violations).toEqual([]);
    }
  }
});

test("real calendar opens at the accepted clock's month and fits a narrow viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 1000 });
  await page.goto("/toolbar.html?single");
  await page
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  await page.getByRole("button", { name: /^Choose date/ }).click();
  await expect(page.getByRole("heading", { name: /March 2025/ })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "tests/filter-tools/toolbar/.artifacts/calendar-320.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: /^Choose date/ }),
  ).toBeFocused();
});
