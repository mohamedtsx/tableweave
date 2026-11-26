import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const failures = new WeakMap<Page, string[]>();
const urls = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  const requests: string[] = [];
  failures.set(page, errors);
  urls.set(page, requests);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) =>
    requests.push(decodeURIComponent(request.url())),
  );
});
test.afterEach(({ page }) => {
  expect(failures.get(page)).toEqual([]);
  expect(
    (urls.get(page) ?? []).filter(
      (url) =>
        /\/packages\/(?:react|heroui)\/src\//.test(url) ||
        url.includes("/tableweave-wp08/") ||
        url.includes("/home/mohamed/Desktop/"),
    ),
  ).toEqual([]);
});

const first = (page: Page) => page.locator("#first");
const button = (page: Page, name: string) =>
  first(page).getByRole("button", { name, exact: true });
const ids = (page: Page) => first(page).getByTestId("composition-ids");
const search = (page: Page) =>
  first(page).getByRole("searchbox", { name: "Search records" });
const inspect = (page: Page) =>
  page.evaluate(() => {
    const owner = window.filterControls.first;
    if (!owner) throw new Error("First application owner unavailable");
    return owner.inspect();
  });
async function open(page: Page, query = "") {
  await page.goto(`/${query}`);
  await expect(
    first(page).getByRole("grid", { name: "first records" }),
  ).toBeVisible();
  await expect(first(page)).toHaveAttribute("data-owner-match", "true");
  await expect
    .poll(() => page.evaluate(() => !!window.filterControls.first))
    .toBe(true);
}
async function addRule(page: Page, field: string, operator: string) {
  await button(page, "Add filter rule: Filters").click();
  await page.getByRole("option", { name: field, exact: true }).click();
  await page.getByRole("option", { name: operator, exact: true }).click();
}
async function numberRule(page: Page, value: string) {
  await addRule(page, "Amount", "is at least");
  await page.getByRole("textbox", { name: "Value", exact: true }).fill(value);
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
async function chooseDate(
  page: Page,
  finish: "Apply date filter" | "Cancel date edit",
) {
  await button(page, "Filter by date").click();
  await button(page, "November 24 UTC").click();
  await button(page, finish).click();
}
async function select(page: Page, name: string) {
  await first(page)
    .getByRole("checkbox", { name: `Select ${name}`, exact: true })
    .locator("xpath=ancestor::label")
    .click();
}

test("actual configured ownership and nullable tabs retain one results/native subtree", async ({
  page,
}) => {
  await open(page);
  await expect(ids(page)).toHaveText("a,b,c");
  const results = await first(page)
    .getByTestId("composition-results")
    .elementHandle();
  const grid = await first(page).getByRole("grid").elementHandle();
  if (!results || !grid) throw new Error("Real result nodes unavailable");
  const owner = await page.evaluateHandle(() => window.filterControls.first);
  await button(page, "Results local state 0").click();
  await button(page, "Add filter rule: Filters").click();
  for (const excluded of ["description", "status", "day"])
    await expect(
      page.getByRole("option", { name: excluded, exact: true }),
    ).toHaveCount(0);
  await expect(
    page.getByRole("option", { name: "Note (hidden column)", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await first(page).getByRole("tab", { name: "Paused", exact: true }).click();
  await expect(ids(page)).toHaveText("c,d,g");
  await first(page)
    .getByRole("tab", { name: "All records", exact: true })
    .click();
  await expect(ids(page)).toHaveText("a,b,c");
  expect((await inspect(page)).state.query.tabId).toBeNull();
  expect(
    await results.evaluate(
      (node) =>
        node.isConnected &&
        node ===
          document.querySelector('#first [data-testid="composition-results"]'),
    ),
  ).toBe(true);
  expect(
    await grid.evaluate(
      (node) =>
        node.isConnected &&
        node === document.querySelector('#first [role="grid"]'),
    ),
  ).toBe(true);
  expect(
    await owner.evaluate((same) => same === window.filterControls.first),
  ).toBe(true);
  await expect(button(page, "Results local state 1")).toBeVisible();
});

test("real builder/search/tab/date predicates compose in the same accepted client pipeline", async ({
  page,
}) => {
  await open(page);
  await numberRule(page, "30");
  await expect(ids(page)).toHaveText("c,d,e");
  await search(page).fill("Alpha");
  await search(page).press("Enter");
  await expect(ids(page)).toHaveText("d,f");
  await chooseDate(page, "Apply date filter");
  await expect(ids(page)).toHaveText("d");
  await first(page).getByRole("tab", { name: "Ready", exact: true }).click();
  await expect(ids(page)).toHaveText("none");
  await first(page).getByRole("tab", { name: "Paused", exact: true }).click();
  await expect(ids(page)).toHaveText("d");
  const { state } = await inspect(page);
  expect(state.query.builder.rules[0]?.field).toBe("amount");
  expect(state.query.search).toBe("Alpha");
  expect(state.query.tabId).toBe("paused");
  expect(state.query.timeZone).toBe("UTC");
  expect(state.evaluatedAt).toBe(Date.parse("2026-11-24T12:00:00.000Z"));
});

test("Builder Clear preserves actual independent criteria, sorting and accepted visibility", async ({
  page,
}) => {
  await open(page, "?rule");
  await button(page, "Set two sort priorities").click();
  await button(page, "Columns").click();
  await page
    .getByRole("dialog", { name: "Shown columns", exact: true })
    .getByRole("checkbox", { name: "Note", exact: true })
    .locator("xpath=ancestor::label")
    .click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await search(page).fill("Alpha");
  await search(page).press("Enter");
  await first(page).getByRole("tab", { name: "Ready", exact: true }).click();
  await chooseDate(page, "Apply date filter");
  await expect(ids(page)).toHaveText("none");
  const before = await inspect(page);
  await button(page, "Clear filter-builder rules").click();
  await expect(ids(page)).toHaveText("a");
  const after = await inspect(page);
  expect(after.state.query.builder).toEqual({ join: "and", rules: [] });
  expect({ ...after.state.query, builder: null }).toEqual({
    ...before.state.query,
    builder: null,
  });
  expect(after.state.columns).toEqual(before.state.columns);
});

test("real rule options Negate and Remove retain semantic IDs and native results", async ({
  page,
}) => {
  await open(page, "?rule");
  const initial = (await inspect(page)).state.query.builder.rules[0];
  await button(page, "Rule options: Amount").click();
  await page.getByRole("button", { name: "Negate", exact: true }).click();
  await expect(ids(page)).toHaveText("a");
  expect((await inspect(page)).state.query.builder.rules).toEqual([
    { ...initial, operator: "number.lt" },
  ]);
  await button(page, "Rule options: Amount").click();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(ids(page)).toHaveText("a,b,c");
  expect((await inspect(page)).state.query.builder.rules).toEqual([]);
});

test("enum membership is immediate, Escape preserves it and deselecting its last value removes the rule", async ({
  page,
}) => {
  await open(page);
  await addRule(page, "Team", "is any of");
  await page.getByRole("option", { name: "Red", exact: true }).click();
  await expect(ids(page)).toHaveText("a,c,e");
  const accepted = (await inspect(page)).state.query.builder;
  expect(accepted.rules[0]?.value).toEqual(["red"]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await inspect(page)).state.query.builder).toEqual(accepted);
  await first(page)
    .getByRole("button", { name: /^Value: Team: .+$/ })
    .click();
  await page.getByRole("option", { name: "Red", exact: true }).click();
  await expect(ids(page)).toHaveText("a,b,c");
  expect((await inspect(page)).state.query.builder.rules).toEqual([]);
});

test("invalid builder draft and Editor Cancel preserve the accepted query, independently of selection Cancel", async ({
  page,
}) => {
  await open(page, "?rule");
  const before = await inspect(page);
  await first(page)
    .getByRole("button", { name: /^Value: Amount: .+$/ })
    .click();
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("1e999");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Enter a valid filter value.",
  );
  await page
    .getByRole("button", { name: "Cancel filter edit", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await inspect(page)).state.query).toEqual(before.state.query);
  await select(page, "Beta");
  await button(page, "Cancel — Clear row selection").click();
  expect((await inspect(page)).state.query).toEqual(before.state.query);
  await expect(
    first(page).getByRole("button", { name: /^Value: Amount: .+$/ }),
  ).toBeVisible();
});

test("accepted off-page-only selection unmounts real builder portals and cancels queued search without clearing accepted criteria", async ({
  page,
}, info) => {
  await open(page, "?rule");
  await page.clock.install({ time: new Date("2030-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2030-01-01T00:00:01Z"));
  const before = await inspect(page);
  await search(page).fill("queued Alpha");
  await first(page)
    .getByRole("button", { name: /^Value: Amount: .+$/ })
    .click();
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("70");
  await expect(
    page.getByRole("textbox", { name: "Value", exact: true }),
  ).toBeFocused();
  const focusBefore = await page.evaluate(() => ({
    tag: document.activeElement?.tagName,
    label: document.activeElement?.getAttribute("aria-label"),
    dialogs: document.querySelectorAll('[role="dialog"]').length,
  }));
  // A real application acceptance while the normal-region portal owns focus.
  await page.evaluate(() =>
    window.filterControls.first?.external({
      type: "selection.change",
      update: { unavailable: true },
    }),
  );
  await expect(first(page).getByTestId("composition-normal")).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await info.attach("selection-swap-focus", {
    body: JSON.stringify({
      before: focusBefore,
      after: await page.evaluate(() => ({
        tag: document.activeElement?.tagName,
        label: document.activeElement?.getAttribute("aria-label"),
        dialogs: document.querySelectorAll('[role="dialog"]').length,
      })),
    }),
    contentType: "application/json",
  });
  await expect(button(page, "Cancel — Clear row selection")).toBeFocused();
  await expect(button(page, "Filter by date")).toBeVisible();
  await expect(
    first(page).getByRole("tab", { name: "Ready", exact: true }),
  ).toBeVisible();
  await page.clock.runFor(1_000);
  expect((await inspect(page)).state.query).toEqual(before.state.query);
  await button(page, "Queue selected IDs").click();
  await expect(
    first(page).getByRole("status", { name: "Queue feedback" }),
  ).toHaveText("Queued 1 IDs: 0 loaded, 1 unavailable.");
  await button(page, "Cancel — Clear row selection").click();
  await expect(button(page, "Add filter rule: Filters")).toBeFocused();
  await expect(search(page)).toHaveValue("");
  await first(page)
    .getByRole("button", { name: /^Value: Amount: .+$/ })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Value", exact: true }),
  ).toHaveValue("20");
});

test("actual search debounce, composition events, Enter and Escape remain local until valid submission", async ({
  page,
}) => {
  await open(page);
  await page.clock.install({ time: new Date("2030-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2030-01-01T00:00:01Z"));
  await search(page).fill("Alpha");
  await page.clock.runFor(299);
  expect((await inspect(page)).state.query.search).toBe("");
  await page.clock.runFor(1);
  await expect(ids(page)).toHaveText("a,d,f");
  await search(page).dispatchEvent("compositionstart");
  await search(page).fill("Beta");
  await search(page).press("Enter");
  await page.clock.runFor(500);
  expect((await inspect(page)).state.query.search).toBe("Alpha");
  await search(page).dispatchEvent("compositionend");
  await page.clock.runFor(300);
  await expect(ids(page)).toHaveText("b");
  await search(page).fill("discard");
  await search(page).press("Escape");
  await page.clock.runFor(500);
  expect((await inspect(page)).state.query.search).toBe("Beta");
  await expect(search(page)).toHaveValue("Beta");
});

test("controlled search and selection proposals can be held, rejected and later accepted without optimistic state", async ({
  page,
}) => {
  await open(page, "?controlled");
  await search(page).fill("Alpha");
  await search(page).press("Enter");
  await expect(first(page).getByTestId("composition-proposal")).toHaveText(
    "search.commit",
  );
  await expect(ids(page)).toHaveText("a,b,c");
  expect((await inspect(page)).state.query.search).toBe("");
  await button(page, "Reject proposed change").click();
  await search(page).fill("Alpha");
  await search(page).press("Enter");
  await button(page, "Accept proposed change").click();
  await expect(ids(page)).toHaveText("a,d,f");
  await select(page, "Alpha");
  await expect(first(page).getByTestId("composition-normal")).toBeVisible();
  await button(page, "Reject proposed change").click();
  expect((await inspect(page)).state.selection).toEqual({});
  await select(page, "Alpha");
  await button(page, "Accept proposed change").click();
  await expect(first(page).getByTestId("composition-normal")).toHaveCount(0);
  const accepted = (await inspect(page)).state;
  await button(page, "Cancel — Clear row selection").click();
  await button(page, "Reject proposed change").click();
  expect((await inspect(page)).state.selection).toEqual(accepted.selection);
  await button(page, "Cancel — Clear row selection").click();
  await button(page, "Accept proposed change").click();
  expect((await inspect(page)).state.query).toEqual(accepted.query);
});

test("external date Cancel preserves selection; accepted filter consequences remain reducer-owned", async ({
  page,
}) => {
  await open(page, "?controlled&rule");
  await button(page, "Select only unavailable ID").click();
  const before = (await inspect(page)).state;
  await chooseDate(page, "Cancel date edit");
  expect((await inspect(page)).state).toEqual(before);
  await chooseDate(page, "Apply date filter");
  expect((await inspect(page)).state.query).toEqual(before.query);
  expect((await inspect(page)).state.selection).toEqual(before.selection);
  await button(page, "Reject proposed change").click();
  expect((await inspect(page)).state.query.date).toBeNull();
  await chooseDate(page, "Apply date filter");
  await button(page, "Accept proposed change").click();
  await expect(ids(page)).toHaveText("b,d,g");
  expect((await inspect(page)).state.selection).toEqual({});
  expect((await inspect(page)).state.query.builder).toEqual(
    before.query.builder,
  );
  await expect(first(page).getByTestId("composition-normal")).toBeVisible();
});

test("controlled real builder Apply is a held proposal, never an optimistic rule or native row change", async ({
  page,
}) => {
  await open(page, "?controlled");
  const before = (await inspect(page)).state;
  await numberRule(page, "60");
  await expect(button(page, "Accept proposed change")).toBeEnabled();
  expect((await inspect(page)).state.query).toEqual(before.query);
  await expect(ids(page)).toHaveText("a,b,c");
  await button(page, "Reject proposed change").click();
  expect((await inspect(page)).state.query.builder.rules).toEqual([]);
  await numberRule(page, "60");
  await button(page, "Accept proposed change").click();
  await expect(ids(page)).toHaveText("f,g,h");
  expect((await inspect(page)).state.query.builder.rules[0]).toMatchObject({
    field: "amount",
    operator: "number.gte",
    value: 60,
  });
});

test("sorting, page and size changes preserve IDs and real builder criteria during selection replacement", async ({
  page,
}) => {
  await open(page, "?rule");
  await select(page, "Beta");
  const before = (await inspect(page)).state;
  await button(page, "Sort Amount, not sorted").click();
  await button(page, "Next page").click();
  await button(page, "3 Rows per page").click();
  await page.getByRole("option", { name: "6", exact: true }).click();
  const after = (await inspect(page)).state;
  expect(after.selection).toEqual(before.selection);
  expect(after.query.builder).toEqual(before.query.builder);
  expect(after.query.pagination).toEqual({ pageIndex: 0, pageSize: 6 });
  expect(after.query.sorting).toEqual([{ id: "amount", desc: false }]);
});

test("real chooser keeps required columns and row-header fallback while hidden primary sort retains true priority", async ({
  page,
}) => {
  await open(page);
  await button(page, "Set two sort priorities").click();
  await button(page, "Columns").click();
  const dialog = page.getByRole("dialog", {
    name: "Shown columns",
    exact: true,
  });
  await expect(dialog.getByRole("checkbox", { name: /Status/ })).toBeDisabled();
  await dialog
    .getByRole("checkbox", { name: "Record", exact: true })
    .locator("xpath=ancestor::label")
    .click();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(
    first(page).locator('tbody [data-key="a"] [role="rowheader"]'),
  ).toHaveText("ready");
  await expect(
    button(page, "Sort Amount, descending, priority 2"),
  ).toBeVisible();
  await expect(
    first(page).locator('th[aria-sort="ascending"],th[aria-sort="descending"]'),
  ).toHaveCount(0);
  await button(page, "Sort").click();
  await expect(
    page.getByRole("dialog", { name: "Sorting", exact: true }),
  ).toContainText("1. Record: Ascending (Hidden column)");
});

test("two actual table/controller/authority owners remain independent", async ({
  page,
}) => {
  await open(page, "?pair");
  expect(
    await page.evaluate(() => {
      const a = window.filterControls.first;
      const b = window.filterControls.second;
      return (
        !!a &&
        !!b &&
        a !== b &&
        a.controller !== b.controller &&
        a.definition !== b.definition
      );
    }),
  ).toBe(true);
  await search(page).fill("Alpha");
  await search(page).press("Enter");
  await expect(ids(page)).toHaveText("a,d,f");
  await expect(
    page.locator("#second").getByTestId("composition-ids"),
  ).toHaveText("a,b,c");
  await button(page, "Select only unavailable ID").click();
  await expect(first(page).getByTestId("composition-normal")).toHaveCount(0);
  await expect(
    page.locator("#second").getByTestId("composition-normal"),
  ).toBeVisible();
  await expect(page.locator("#second")).toHaveAttribute(
    "data-owner-match",
    "true",
  );
});

for (const rtl of [false, true])
  for (const dark of [false, true])
    test(`real tool/control narrow locale/theme/axe: rtl=${rtl}, dark=${dark}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width: 320, height: 1100 });
      await open(page, `?${rtl ? "rtl&" : ""}${dark ? "dark" : ""}`);
      await expect(first(page).getByTestId("provider-locale")).toHaveAttribute(
        "data-direction",
        rtl ? "rtl" : "ltr",
      );
      await expect(first(page).getByRole("grid")).toHaveCSS(
        "direction",
        rtl ? "rtl" : "ltr",
      );
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      ).toBe(true);
      const contrast = await first(page)
        .locator("[data-slot=checkbox-control]")
        .first()
        .evaluate((element) => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 1;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Color measurement unavailable");
          const rgb = (color: string) => {
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 1, 1);
            return [...ctx.getImageData(0, 0, 1, 1).data];
          };
          let parent = element.parentElement;
          let background = [0, 0, 0, 0];
          while (parent && background[3] === 0) {
            background = rgb(getComputedStyle(parent).backgroundColor);
            parent = parent.parentElement;
          }
          if (background[3] !== 255)
            throw new Error("No opaque checkbox backdrop");
          const foreground = rgb(getComputedStyle(element).borderTopColor);
          const luminance = (value: number[]) => {
            const linear = value.slice(0, 3).map((channel) => {
              const x = channel / 255;
              return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
            });
            return (
              (linear[0] ?? 0) * 0.2126 +
              (linear[1] ?? 0) * 0.7152 +
              (linear[2] ?? 0) * 0.0722
            );
          };
          const a = luminance(foreground);
          const b = luminance(background);
          return {
            foreground,
            background,
            ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
          };
        });
      expect(contrast.ratio).toBeGreaterThanOrEqual(3);
      await info.attach("checkbox-boundary", {
        body: JSON.stringify(contrast),
        contentType: "application/json",
      });
      const audit = await new AxeBuilder({ page }).include("#first").analyze();
      expect(audit.violations).toEqual([]);
      await page.screenshot({
        path: info.outputPath("combined-tools-320.png"),
        fullPage: true,
      });
    });

test("combined actual tools preserve viewport containment and 200 percent CSS text expansion", async ({
  page,
}, info) => {
  await open(page, "?rule");
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 });
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await expect(button(page, "Add filter rule: Filters")).toBeVisible();
    if (width === 1440)
      await page.screenshot({
        path: info.outputPath("combined-tools-1440.png"),
        fullPage: true,
      });
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  const audit = await new AxeBuilder({ page }).include("#first").analyze();
  expect(audit.violations).toEqual([]);
});
