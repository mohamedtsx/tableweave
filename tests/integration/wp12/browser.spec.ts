import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import type {} from "./application.js";

// Authored acceptance obligations only. No skips, expected-fail annotations or
// runtime result follows from LIGHT typing this module.
const faults = new WeakMap<
  Page,
  { page: number; console: number; source: number }
>();
test.beforeEach(async ({ page }) => {
  const counts = { page: 0, console: 0, source: 0 };
  faults.set(page, counts);
  page.on("pageerror", () => {
    counts.page++;
  });
  page.on("console", (message) => {
    if (message.type() === "error") counts.console++;
  });
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (
      /\/packages\/(react|heroui)\/src\//.test(path) ||
      /\/src\/(workbench|controls)\//.test(path) ||
      /\/(?:storybook|@storybook)\//.test(path)
    )
      counts.source++;
  });
  await page.addInitScript(() => {
    window.addEventListener("wp12-react-error", () => {
      throw new Error("WP12 recoverable React error");
    });
  });
});
test.afterEach(({ page }) => {
  expect(faults.get(page)).toEqual({ page: 0, console: 0, source: 0 });
});
const root = (page: Page, id: "a" | "b" = "a") =>
  page.locator(`#instance-${id}`);
const button = (page: Page, name: string | RegExp, id: "a" | "b" = "a") =>
  root(page, id).getByRole("button", { name, exact: typeof name === "string" });
const rows = (page: Page, id: "a" | "b" = "a") =>
  root(page, id).getByRole("rowheader");
async function state(page: Page, id: "a" | "b" = "a") {
  return page.evaluate((id) => {
    const { owner } = window.wp12[id],
      resource = owner.remote.resource.getSnapshot();
    return {
      accepted: owner.C.getSnapshot(),
      access: owner.getSnapshot().access,
      notice: owner.getSnapshot().notice,
      resource: {
        kind: resource.kind,
        busy: resource.busy,
        stale: resource.stale,
        obsolete: resource.obsolete,
        requestKey: resource.request?.requestKey,
        requestPage: resource.request?.query.pagination,
        shownPage: resource.snapshot?.query.pagination,
        shownIds: resource.snapshot?.records.map((record) => record.id),
        page: resource.snapshot?.page,
        emptyKind: resource.snapshot?.emptyKind,
      },
    };
  }, id);
}
async function open(page: Page, ready = true, grouped = false) {
  await page.goto(grouped ? "/?view=grouped" : "/");
  await expect(rows(page, "b").first()).toHaveText("Transfer note 01");
  expect(
    await page.evaluate(() => {
      const a = window.wp12.a.owner,
        b = window.wp12.b.owner;
      return (
        a !== b &&
        a.D !== b.D &&
        a.C !== b.C &&
        a.P !== b.P &&
        a.context.scopeKey !== b.context.scopeKey &&
        a.record("tx-001") !== undefined &&
        b.record("tx-001") !== undefined
      );
    }),
    "genuine independent D/C/P/application owners with shared stable row IDs",
  ).toBe(true);
  await root(page)
    .locator("summary")
    .filter({ hasText: /^Application A controls$/ })
    .click();
  await root(page, "b")
    .locator("summary")
    .filter({ hasText: /^Application B controls$/ })
    .click();
  await expect(button(page, "Deliver known page")).toHaveCount(1);
  if (ready) await deliver(page);
}
async function deliver(page: Page, unknown = false) {
  const target = button(
    page,
    unknown ? "Deliver unknown page" : "Deliver known page",
  );
  await expect(target).toBeEnabled();
  await target.click();
  await expect.poll(async () => (await state(page)).resource.busy).toBe(false);
}
async function select(page: Page, name: string, id: "a" | "b" = "a") {
  const checkbox = root(page, id).getByRole("checkbox", { name, exact: true });
  await checkbox.locator("xpath=ancestor::label[1]").click();
}
async function sort(page: Page, column: string, id: "a" | "b" = "a") {
  await button(page, new RegExp(`^Sort ${column},`), id).click();
  await page
    .getByRole("button", { name: `Ascending: ${column}`, exact: true })
    .click();
  await page.keyboard.press("Escape");
}
async function numberRule(page: Page, value: string) {
  await button(page, "Add filter rule: Filters").click();
  await page.getByRole("option", { name: "Amount", exact: true }).click();
  await page
    .getByRole("option", { name: "is greater than", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Recipe numeric value", exact: true })
    .fill(value);
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await deliver(page);
}
async function search(page: Page, text: string, id: "a" | "b" = "a") {
  const input = root(page, id).getByRole("searchbox", {
    name: "Search descriptions",
  });
  await input.fill(text);
  await input.press("Enter");
}
async function audit(page: Page, boundary: string) {
  await expect(
    root(page, "b").locator('table[data-slot="table-content"]'),
  ).toBeVisible();
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations, `actual axe scan: ${boundary}`).toEqual([]);
}
async function columns(page: Page, id: "a" | "b") {
  return root(page, id)
    .locator("thead th[data-column-id]")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-column-id")),
    );
}
async function chooseVisibility(page: Page, column: string, id: "a" | "b") {
  await button(page, "Columns", id).click();
  await page
    .getByRole("dialog", { name: "Shown columns", exact: true })
    .getByRole("checkbox", { name: column, exact: true })
    .locator("xpath=ancestor::label[1]")
    .click();
  await page.keyboard.press("Escape");
}

test("I1 — public criteria, hidden-field ownership, selection provenance and atomic exits", async ({
  page,
}) => {
  await open(page);
  const independent = await state(page, "b");
  await select(page, "Select eligible rows on this page");
  const pageSelected = (await state(page)).accepted.selection;
  expect(
    Object.keys(pageSelected).filter((id) => pageSelected[id]),
  ).toHaveLength(9);
  expect(pageSelected["tx-002"]).not.toBe(true);
  await button(page, /Clear row selection/).click();
  await button(page, "Add filter rule: Filters").click();
  await expect(
    page.getByRole("option", { name: "Reference", exact: true }),
  ).toBeVisible();
  for (const name of ["description", "status", "occurred"])
    await expect(page.getByRole("option", { name, exact: true })).toHaveCount(
      0,
    );
  await page.keyboard.press("Escape");
  await numberRule(page, "-1000000");
  const valid = await state(page);
  await button(page, /^Value: Amount:/).click();
  await page
    .getByRole("textbox", { name: "Recipe numeric value" })
    .fill("1e999");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  expect((await state(page)).accepted.query).toEqual(valid.accepted.query);
  await page.getByRole("button", { name: "Cancel filter edit" }).click();
  expect((await state(page)).accepted.selection).toEqual(
    valid.accepted.selection,
  );
  await button(page, "Add filter rule: Filters").click();
  await page.getByRole("option", { name: "Reference", exact: true }).click();
  await page.getByRole("option", { name: "is not empty", exact: true }).click();
  await deliver(page);
  expect(
    (await state(page)).accepted.query.builder.rules.some(
      (rule) => rule.field === "reference",
    ),
  ).toBe(true);
  await button(page, "Any").click();
  await deliver(page);
  await search(page, "Transfer");
  await deliver(page);
  await button(page, "Filter by date").click();
  await page
    .getByRole("button", { name: "November 25 UTC", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Apply date filter", exact: true })
    .click();
  await deliver(page);
  await select(page, "Select Transfer note 01");
  await expect(root(page).getByRole("searchbox")).toHaveCount(0);
  await expect(
    root(page).getByRole("tab", { name: "All records", exact: true }),
  ).toBeVisible();
  await expect(button(page, "Filter by date")).toBeVisible();
  await button(page, "Next page").click();
  await deliver(page);
  await select(page, "Select Transfer note 21");
  await button(page, "Queue synthetic review").click();
  await expect(root(page).getByLabel("Application A notice")).toContainText(
    "2 IDs; 1 loaded records",
  );
  const selection = (await state(page)).accepted.selection;
  await sort(page, "Description");
  await deliver(page);
  await button(page, /10 Rows per page/).click();
  await page.getByRole("option", { name: "25", exact: true }).click();
  await deliver(page);
  expect((await state(page)).accepted.selection).toEqual(selection);
  expect((await state(page)).accepted.query.pagination).toEqual({
    pageIndex: 0,
    pageSize: 25,
  });
  await button(page, "Queue synthetic review").click();
  await expect(root(page).getByLabel("Application A notice")).toContainText(
    "2 IDs; 2 loaded records",
  );
  const beforeCancel = (await state(page)).accepted;
  await button(page, /Clear row selection/).click();
  expect((await state(page)).accepted.query).toEqual(beforeCancel.query);
  await expect(button(page, "Add filter rule: Filters")).toBeFocused();
  await button(page, "Columns").click();
  await expect(
    page
      .getByRole("dialog", { name: "Shown columns" })
      .getByRole("checkbox", { name: /Description/ }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await chooseVisibility(page, "Reference", "a");
  const beforeClear = (await state(page)).accepted;
  await button(page, "Clear filter-builder rules").click();
  await deliver(page);
  const afterClear = (await state(page)).accepted;
  expect(afterClear.query.builder).toEqual({ join: "or", rules: [] });
  expect({ ...afterClear.query, builder: null }).toEqual({
    ...beforeClear.query,
    builder: null,
  });
  expect(afterClear.columns).toEqual(beforeClear.columns);
  await expect(rows(page)).toHaveText(
    Array.from(
      { length: 12 },
      (_, index) => `Transfer note ${String(index * 2 + 1).padStart(2, "0")}`,
    ),
  );
  await select(page, "Select Transfer note 01");
  const before = await page.evaluate(
    () =>
      window.wp12.a.events
        .inspect()
        .observations.filter((event) => event.channel === "C").length,
  );
  await root(page).getByRole("tab", { name: "Posted", exact: true }).click();
  const current = await state(page);
  expect(current.accepted.selection).toEqual({});
  expect(current.resource.requestPage).toEqual(
    current.accepted.query.pagination,
  );
  expect(
    await page.evaluate(
      () =>
        window.wp12.a.events
          .inspect()
          .observations.filter((event) => event.channel === "C").length,
    ),
  ).toBe(before + 1);
  await deliver(page);
  expect((await state(page, "b")).accepted).toEqual(independent.accepted);
});

test("I2 — truthful initial/retained/unknown/empty resource and out-of-range boundaries", async ({
  page,
}) => {
  await open(page, false);
  await expect(
    root(page).getByText("Loading records…", { exact: true }),
  ).toBeVisible();
  await expect(rows(page)).toHaveCount(0);
  expect((await state(page)).resource.shownPage).toBeUndefined();
  expect((await state(page)).resource.page).toBeUndefined();
  await expect(root(page).getByText(/0–0|of 0 records/)).toHaveCount(0);
  await expect(
    root(page).getByText("There are no records.", { exact: true }),
  ).toHaveCount(0);
  await button(page, "Fail request").click();
  await expect(
    root(page).getByText("Records could not be loaded.", { exact: true }),
  ).toBeVisible();
  await audit(page, "initial error with a real retry and B native records");
  const failedInitial = await state(page);
  await button(page, "Retry").click();
  expect((await state(page)).resource.requestKey).not.toBe(
    failedInitial.resource.requestKey,
  );
  await deliver(page, true);
  await expect(
    root(page).getByText("1–10 records · Page 1", { exact: true }),
  ).toBeVisible();
  await expect(button(page, "Page 1")).toHaveCount(0);
  await select(page, "Select Transfer note 01");
  await button(page, "Next page").click();
  await expect(rows(page).first()).toHaveText("Transfer note 01");
  await expect(
    root(page).getByText("1–10 records · Page 1", { exact: true }),
  ).toBeVisible();
  expect((await state(page)).resource.requestPage?.pageIndex).toBe(1);
  expect((await state(page)).resource.shownPage?.pageIndex).toBe(0);
  await expect(
    root(page).getByText("Showing previous results for the displayed page.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    root(page).getByRole("checkbox", {
      name: "Select Transfer note 03",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(button(page, "Next page")).toBeDisabled();
  await expect(button(page, /Clear row selection/)).toBeEnabled();
  await button(page, "Fail request").click();
  await expect(
    root(page).getByText(
      "Records could not be updated. Showing the last available data.",
      { exact: true },
    ),
  ).toBeVisible();
  const failedPage = await state(page);
  await button(page, "Retry").click();
  const retry = await state(page);
  expect(retry.resource.requestKey).not.toBe(failedPage.resource.requestKey);
  expect(retry.resource.requestPage?.pageIndex).toBe(1);
  await deliver(page);
  await expect(rows(page).first()).toHaveText("Transfer note 11");
  await button(page, /Clear row selection/).click();
  await button(page, "Supply empty input").click();
  await deliver(page);
  await expect(rows(page)).toHaveCount(0);
  expect((await state(page)).resource.shownIds).toEqual([]);
  await expect(
    root(page).getByText("There are no records.", { exact: true }),
  ).toBeVisible();
  await button(page, "Begin refresh").click();
  await expect(rows(page)).toHaveCount(0);
  await expect(
    root(page).getByText("Loading records…", { exact: true }),
  ).toHaveCount(0);
  expect((await state(page)).resource.busy).toBe(true);
  await button(page, "Fail request").click();
  await expect(rows(page)).toHaveCount(0);
  await button(page, "Begin refresh").click();
  await button(page, "Deliver unknown empty").click();
  await expect(
    root(page).getByText("There are no records to display.", { exact: true }),
  ).toBeVisible();
  await expect(
    root(page).getByText("No records match.", { exact: true }),
  ).toHaveCount(0);
  await button(page, "Supply one record").click();
  await deliver(page);
  // No app causality/correction port is supplied: never manufacture an epoch/clamp.
  expect((await state(page)).accepted.query.pagination.pageIndex).toBe(1);
  expect((await state(page)).resource.page).toEqual({
    kind: "known",
    total: 1,
  });
  await expect(
    root(page).getByText("There are no records on this page.", { exact: true }),
  ).toBeVisible();
  await search(page, "no matching synthetic text");
  await deliver(page);
  await expect(
    root(page).getByText("No records match.", { exact: true }),
  ).toBeVisible();
  await expect(button(page, "Clear search")).toBeVisible();
  await expect(button(page, "Clear filter-builder rules")).toHaveCount(0);
});

test("I3 — one genuine dirty detail form, refresh/appearance/off-page native provenance and focus", async ({
  page,
}) => {
  await open(page);
  const trigger = button(page, "View details tx-001");
  await trigger.press("Enter");
  const dialog = page.getByRole("dialog", {
    name: "Application A record details",
    exact: true,
  });
  await expect(dialog).toHaveCount(1);
  const draft = dialog.getByRole("textbox", { name: "Reference draft" });
  await draft.fill("Retain real form through transitions");
  const original = await draft.elementHandle();
  if (!original) throw new Error("Real detail input required");
  await dialog
    .getByRole("button", { name: "Refresh detail", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Deliver detail", exact: true })
    .click();
  await page.evaluate(() => {
    window.wp12.a.owner.remote.begin();
    window.wp12.a.owner.remote.succeed();
  });
  await page.setViewportSize({ width: 390, height: 900 });
  // Genuine application button event models external appearance change while a
  // modal is active. NOT a claim of physical pointer access behind the modal.
  await page
    .locator(".wp12-heading")
    .getByRole("button", { name: "Toggle direction", includeHidden: true })
    .evaluate((node) => {
      if (node instanceof HTMLButtonElement) node.click();
    });
  await page.evaluate(() => {
    window.wp12.a.owner.remote.succeed();
  });
  await expect(page.getByRole("main")).toHaveAttribute("dir", "rtl");
  await page
    .locator(".wp12-heading")
    .getByRole("button", { name: "Toggle theme", includeHidden: true })
    .evaluate((node) => {
      if (node instanceof HTMLButtonElement) node.click();
    });
  await expect(draft).toHaveValue("Retain real form through transitions");
  expect(
    await original.evaluate(
      (node) =>
        node.isConnected &&
        node ===
          document
            .querySelector('[aria-label="Detail native row"]')
            ?.nextElementSibling?.querySelector("input"),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await dialog
    .getByRole("button", { name: "Keep editing", exact: true })
    .click();
  await expect(draft).toHaveValue("Retain real form through transitions");
  await expect(draft).toBeFocused();
  await page
    .locator(".wp12-heading")
    .getByRole("button", { name: "Toggle direction", includeHidden: true })
    .evaluate((node) => {
      if (node instanceof HTMLButtonElement) node.click();
    });
  await page.evaluate(() => {
    window.wp12.a.owner.remote.succeed();
  });
  await dialog
    .getByRole("button", { name: "Refresh detail", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Fail detail", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Retry", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Deliver detail", exact: true })
    .click();
  await expect(draft).toHaveValue("Retain real form through transitions");
  await dialog
    .getByRole("button", { name: "Close record details", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Discard draft", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await draft.fill("Off-page target is not deletion");
  await page.evaluate(() => {
    window.wp12.a.owner.dispatch({
      type: "pagination.change",
      update: { pageIndex: 1, pageSize: 10 },
    });
    window.wp12.a.owner.remote.succeed();
  });
  await expect(dialog.getByLabel("Detail native row")).toHaveText("none");
  await expect(draft).toHaveValue("Off-page target is not deletion");
  await dialog
    .getByRole("button", { name: "Refresh detail", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Report missing detail", exact: true })
    .click();
  await expect(
    dialog.getByText("This record is not available.", { exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Close record details", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Discard draft", exact: true })
    .click();
  await expect(
    root(page).getByRole("button", { name: "Application A safe focus" }),
  ).toBeFocused();
  await expect(rows(page, "b").first()).toHaveText("Transfer note 01");
});

test("I4 — late public receipts and review27n1 before-C/P purge, never eventual-only", async ({
  page,
}) => {
  await open(page);
  await root(page, "b")
    .getByLabel("Native note tx-001")
    .fill("B must survive A loss");
  await button(page, "Begin refresh").click();
  expect(await page.evaluate(() => window.wp12.a.events.captureRow())).toBe(
    true,
  );
  await search(page, "Transfer note 11");
  await deliver(page);
  const newer = await state(page);
  expect(await page.evaluate(() => window.wp12.a.events.replayRow())).toEqual({
    success: false,
    failure: false,
  });
  expect((await state(page)).resource).toEqual(newer.resource);
  await search(page, "");
  await deliver(page);
  await button(page, "Add filter rule: Filters").click();
  await page.getByRole("option", { name: "Account", exact: true }).click();
  await page.getByRole("option", { name: "is", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => window.wp12.a.owner.numericOptions.source.getSnapshot().busy,
      ),
    )
    .toBe(true);
  expect(await page.evaluate(() => window.wp12.a.events.captureOptions())).toBe(
    true,
  );
  await page
    .getByRole("textbox", { name: "Search options", exact: true })
    .fill("two");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.wp12.a.owner.numericOptions.source.getSnapshot().request?.term,
      ),
    )
    .toBe("two");
  await page.evaluate(() => {
    window.wp12.a.owner.numericOptions.respond();
  });
  await expect(
    page.getByRole("option", { name: "Account two", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => window.wp12.a.events.replayOptions()),
  ).toEqual({ success: false, failure: false });
  await page.getByRole("option", { name: "Account two", exact: true }).click();
  await deliver(page);
  expect((await state(page)).accepted.query.builder.rules[0]?.value).toBe(2);
  await button(page, "Clear filter-builder rules").click();
  await deliver(page);
  // Apply zero through the real picker before selection hides the normal toolbar.
  await button(page, "Add filter rule: Filters").click();
  await page.getByRole("option", { name: "Account", exact: true }).click();
  await page.getByRole("option", { name: "is", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.wp12.a.owner.numericOptions.source.getSnapshot().request?.term,
      ),
    )
    .toBe("");
  await page.evaluate(() => {
    window.wp12.a.owner.numericOptions.respond();
  });
  await page.getByRole("option", { name: "Account zero", exact: true }).click();
  await deliver(page);
  await select(page, "Select Transfer note 01");
  await button(page, "View details tx-001").click();
  const dialog = page.getByRole("dialog", {
    name: "Application A record details",
    exact: true,
  });
  await dialog
    .getByRole("textbox", { name: "Reference draft" })
    .fill("Dirty before actual terminal loss");
  await dialog
    .getByRole("button", { name: "Refresh detail", exact: true })
    .click();
  expect(await page.evaluate(() => window.wp12.a.events.captureDetail())).toBe(
    true,
  );
  // A later real generation succeeds before the captured older response.
  await dialog
    .getByRole("button", { name: "Refresh detail", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Deliver detail", exact: true })
    .click();
  const generation = await page.evaluate(
    () => window.wp12.a.driver.getSnapshot().authority.generation,
  );
  await page.evaluate(() => {
    window.wp12.a.events.replayDetail();
  });
  expect(
    await page.evaluate(
      () => window.wp12.a.driver.getSnapshot().authority.generation,
    ),
  ).toBe(generation);
  expect(
    await page.evaluate(
      () => window.wp12.a.driver.getSnapshot().source?.status,
    ),
  ).toBe("ready");
  await expect(
    dialog.getByRole("textbox", { name: "Reference draft" }),
  ).toHaveValue("Dirty before actual terminal loss");
  await dialog
    .getByRole("button", { name: "Close record details", exact: true })
    .click();
  expect(
    await page.evaluate(() => window.wp12.a.events.captureDecision()),
  ).toBe(true);
  // Real app-owned option transport may start while picker/UI is absent. The
  // selected-ID INPUT is the actual applied zero rule, not fabricated permission.
  const before = await page.evaluate(() => {
    const { owner, driver, events } = window.wp12.a;
    const context = { ...owner.context, fieldId: "account" };
    const request = owner.numericOptions.source.begin({
      ...context,
      term: "",
      pageKey: "loss-pending",
    });
    if (!request) throw new Error("Actual source request unavailable");
    owner.numericOptions.source.setSelectedIds(context, [0]);
    owner.numericOptions.source.recoverSelectedLabels(request, [
      { id: 0, label: "Account zero" },
    ]);
    owner.numericOptions.onRequest(request);
    if (!events.captureOptions() || !events.captureAction("tx-001"))
      throw new Error("Actual origins required");
    driver.load(driver.getSnapshot().authority);
    if (!events.captureDetail())
      throw new Error("Actual pending detail required");
    owner.remote.begin();
    return events.inspect();
  });
  for (const key of [
    "records",
    "retained",
    "rowPending",
    "optionLabels",
    "optionPending",
    "detailSource",
    "detailPending",
    "detailDrafts",
    "dirty",
    "decision",
    "selected",
    "target",
    "requestBinding",
    "snapshotBinding",
  ] as const)
    expect(before.counts[key], `nonvacuous pre-loss ${key}`).toBeGreaterThan(0);
  await page.evaluate(() => {
    window.wp12.a.events.revoke();
  });
  const after = await page.evaluate(() => window.wp12.a.events.inspect());
  const controller = after.observations.filter(
    (event) => event.revoking && event.channel === "C",
  );
  const publication = after.observations.filter(
    (event) => event.revoking && event.channel === "P",
  );
  expect(
    controller.length,
    "real intermediate C notifications required",
  ).toBeGreaterThan(0);
  expect(publication.length, "real P notifications required").toBeGreaterThan(
    0,
  );
  expect(after.errors).toBe(0);
  expect(after.overflow).toBe(0);
  expect(after.phase).toBe("settled");
  expect(after.publicationFailure).toBeNull();
  for (const observed of [...controller, ...publication]) {
    // Soft assertions still FAIL the case, and permit all post-loss callbacks to
    // be exercised. No expected-failure/skip converts review27n1 into success.
    expect
      .soft(observed.counts, `review27n1 ${observed.channel} snapshot readable`)
      .not.toBeNull();
    for (const [key, value] of Object.entries(observed.counts ?? {}))
      expect
        .soft(
          value,
          `review27n1 ${observed.channel} must purge ${key} before notification`,
        )
        .toBe(0);
  }
  const retired = await state(page);
  expect(await page.evaluate(() => window.wp12.a.events.replayRow())).toEqual({
    success: false,
    failure: false,
  });
  expect(
    await page.evaluate(() => window.wp12.a.events.replayOptions()),
  ).toEqual({ success: false, failure: false });
  await page.evaluate(() => {
    const { events } = window.wp12.a;
    events.replayDetail();
    events.replayDecision();
    events.replayAction();
  });
  expect((await state(page)).accepted.selection).toEqual({});
  expect((await state(page)).resource.shownIds).toBeUndefined();
  expect((await state(page)).notice).toBe(retired.notice);
  await expect(rows(page)).toHaveCount(0);
  await expect(dialog).toHaveCount(0);
  await expect(
    root(page).getByRole("button", { name: "Application A safe focus" }),
  ).toBeFocused();
  await expect(root(page, "b").getByLabel("Native note tx-001")).toHaveValue(
    "B must survive A loss",
  );
  await root(page, "b")
    .getByLabel("Native note tx-001")
    .fill("B still independently editable");
  await select(page, "Select Transfer note 01", "b");
  const beforeB = await page.evaluate(() => window.wp12.b.events.inspect());
  expect(beforeB.counts.inlineDrafts).toBeGreaterThan(0);
  expect(beforeB.counts.selected).toBeGreaterThan(0);
  await page.evaluate(() => {
    window.wp12.b.events.revoke();
  });
  const afterB = await page.evaluate(() => window.wp12.b.events.inspect());
  for (const channel of ["C", "P"] as const) {
    const actual = afterB.observations.filter(
      (event) => event.revoking && event.channel === channel,
    );
    expect(
      actual.length,
      `nonvacuous B ${channel} inline-draft purge`,
    ).toBeGreaterThan(0);
    for (const event of actual) expect(event.counts?.inlineDrafts).toBe(0);
  }
  await page.evaluate(() => {
    const { owner, drafts } = window.wp12.b;
    drafts.edit(owner, "tx-001", "late retired edit");
  });
  expect(await page.evaluate(() => window.wp12.b.drafts.getSnapshot())).toEqual(
    {},
  );
  await expect(root(page, "b").getByLabel("Native note tx-001")).toHaveCount(0);
});

for (const grouped of [false, true])
  test(`I5 — ${grouped ? "grouped" : "flat"} native manual movement, drafts, source wait and no drag`, async ({
    page,
  }) => {
    await open(page, true, grouped);
    const native = root(page, "b").getByLabel("Native note tx-001");
    await native.fill("Native element and app draft");
    const element = await native.elementHandle();
    if (!element) throw new Error("Genuine native input required");
    const initial = await state(page, "b");
    const originalHeaders = await columns(page, "b");
    await button(page, "Move column: Amount", "b").click();
    await page
      .getByRole("menuitem", { name: "Move after", exact: true })
      .click();
    await expect.poll(() => columns(page, "b")).not.toEqual(originalHeaders);
    const moved = (await state(page, "b")).accepted.columns;
    expect(moved.order.indexOf("reference")).toBe(
      initial.accepted.columns.order.indexOf("reference"),
    );
    for (const utility of ["selection", "details", "review", "nativeNote"])
      expect(moved.order.indexOf(utility)).toBe(
        initial.accepted.columns.order.indexOf(utility),
      );
    await chooseVisibility(page, "Reference", "b");
    const revealed = await columns(page, "b");
    const actualDataAndUtilityIds = new Set([...originalHeaders, "reference"]);
    expect(revealed).toEqual(
      moved.order.filter((id) => actualDataAndUtilityIds.has(id)),
    );
    await chooseVisibility(page, "Reference", "b");
    expect(
      await element.evaluate(
        (node) =>
          node.isConnected &&
          node ===
            document.querySelector(
              '#instance-b input[aria-label="Native note tx-001"]',
            ),
      ),
    ).toBe(true);
    await expect(native).toHaveValue("Native element and app draft");
    await expect(button(page, "Move column: Details", "b")).toHaveCount(0);
    await expect(button(page, "Move column: Working note", "b")).toHaveCount(0);
    if (grouped) {
      await expect(
        root(page, "b").getByRole("columnheader", {
          name: "Values",
          exact: true,
        }),
      ).toBeVisible();
      await expect(button(page, "Move column: Values", "b")).toHaveCount(0);
      await button(page, "Move column: Magnitude", "b").click();
      await expect(
        page.getByRole("menuitem", { name: "Move after", exact: true }),
      ).toHaveAttribute("aria-disabled", "true");
      await page.keyboard.press("Escape");
    }
    await expect(root(page, "b").locator("th button button")).toHaveCount(0);
    await button(page, "Move row: Transfer note 01", "b").press("Enter");
    await page
      .getByRole("menuitem", { name: "Move down", exact: true })
      .click();
    const operation = await page.evaluateHandle(
      () => window.wp12.b.owner.reorder?.operation,
    );
    const submitted = await page.evaluate(() => window.wp12.b.events.inspect());
    expect(submitted.submissions).toBe(1);
    expect(submitted.exactPendingOperation).toBe(true);
    await expect(
      root(page, "b")
        .getByRole("status")
        .filter({ hasText: "Row move submitted." }),
    ).toBeFocused();
    expect(
      await page.evaluate(() => {
        const operation = window.wp12.b.owner.reorder?.operation;
        return operation
          ? {
              moved: operation.move.movedId,
              before: operation.move.beforeId,
              after: operation.move.afterId,
            }
          : null;
      }),
    ).toEqual({ moved: "tx-001", before: "tx-003", after: "tx-002" });
    await expect(button(page, "Next page", "b")).toBeDisabled();
    await expect(button(page, "Move column: Amount", "b")).toBeDisabled();
    await expect(
      root(page, "b").getByRole("checkbox", {
        name: "Select Transfer note 01",
        exact: true,
      }),
    ).toBeEnabled();
    await button(page, "Accept synthetic transport", "b").click();
    expect(
      (await page.evaluate(() => window.wp12.b.events.inspect())).counts
        .movePending,
    ).toBe(1);
    await expect(rows(page, "b").first()).toHaveText("Transfer note 01");
    await button(page, "Publish authoritative input", "b").click();
    await expect
      .poll(() =>
        page.evaluate(() => window.wp12.b.events.inspect().counts.movePending),
      )
      .toBe(0);
    await expect(rows(page, "b").nth(0)).toHaveText("Transfer note 02");
    await expect(rows(page, "b").nth(1)).toHaveText("Transfer note 01");
    expect(
      await element.evaluate(
        (node) =>
          node.isConnected &&
          node ===
            document.querySelector(
              '#instance-b input[aria-label="Native note tx-001"]',
            ),
      ),
    ).toBe(true);
    await expect(native).toHaveValue("Native element and app draft");
    expect(await operation.evaluate((value) => value !== null)).toBe(true);
    await button(page, "Move row: Transfer note 01", "b").click();
    await page
      .getByRole("menuitem", { name: "Move down", exact: true })
      .click();
    const retainedOperation = await page.evaluateHandle(
      () => window.wp12.b.owner.reorder?.operation,
    );
    await button(page, "Report synthetic timeout", "b").click();
    await button(page, "Hide renderer", "b").click();
    expect(
      await retainedOperation.evaluate(
        (value) => value === window.wp12.b.owner.reorder?.operation,
      ),
    ).toBe(true);
    await button(page, "Show renderer", "b").click();
    await expect(native).toHaveValue("Native element and app draft");
    await button(page, "Publish authoritative input", "b").click();
    await expect
      .poll(() =>
        page.evaluate(() => window.wp12.b.events.inspect().counts.movePending),
      )
      .toBe(0);
    const finished = await page.evaluate(() => window.wp12.b.events.inspect());
    expect(finished.submissions).toBe(2);
    expect(
      finished.observations.some(
        (event) =>
          event.channel === "source" && event.counts?.movePending === 1,
      ),
    ).toBe(true);
    await expect(rows(page, "b").nth(2)).toHaveText("Transfer note 01");
    await sort(page, "Amount", "b");
    const disabled = button(page, "Move row: Transfer note 21", "b");
    await expect(disabled).toBeDisabled();
    await expect(disabled).toHaveAccessibleDescription(
      /Row moves require current eligible rows/,
    );
    await page.evaluate(() => {
      window.wp12.b.owner.dispatch({ type: "sorting.change", update: [] });
    });
    await search(page, "Transfer note 01", "b");
    await expect(
      button(page, "Move row: Transfer note 01", "b"),
    ).toBeDisabled();
    // Separate negative capability; simple menu success does NOT satisfy G-02.
    await expect(page.getByRole("button", { name: /drag/i })).toHaveCount(0);
    await expect(
      page.locator('[draggable="true"],[data-drag-handle]'),
    ).toHaveCount(0);
    await expect(rows(page).first()).toHaveText("Transfer note 01");
  });

async function containment(page: Page) {
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  const rules = root(page).locator(".tw-filter-rule");
  await expect(rules).toHaveCount(2);
  for (const control of await rules.getByRole("button").all()) {
    await expect(control).toBeVisible();
    expect(
      await control.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return box.left >= -1 && box.right <= innerWidth + 1;
      }),
      "intact rule segments wrap without escaping the viewport",
    ).toBe(true);
  }
  const last = root(page, "b").getByLabel("Native note tx-001");
  await button(page, "Review tx-001", "b").focus();
  await page.keyboard.press("Tab");
  await expect(last).toBeFocused();
  const contained = await last.evaluate((node) => {
    const scroll = node.closest('[data-slot="table-scroll-container"]');
    if (!(scroll instanceof HTMLElement)) return false;
    const a = node.getBoundingClientRect(),
      b = scroll.getBoundingClientRect();
    return (
      a.left >= b.left - 1 &&
      a.right <= b.right + 1 &&
      scroll.clientWidth <= innerWidth
    );
  });
  expect(
    contained,
    "last native cell reachable inside actual scroll owner",
  ).toBe(true);
  if ((page.viewportSize()?.width ?? 1440) <= 390) {
    expect(
      await last.evaluate((node) => {
        const scroll = node.closest('[data-slot="table-scroll-container"]');
        return (
          scroll instanceof HTMLElement &&
          scroll.scrollWidth > scroll.clientWidth
        );
      }),
      "actual narrow native table overflow must be contained, not hidden",
    ).toBe(true);
  }
  const pairs = await root(page, "b")
    .locator("thead th[data-column-id]")
    .evaluateAll((headers) =>
      headers.map((header) => {
        const id = header.getAttribute("data-column-id"),
          row = document.querySelector("#instance-b tbody tr");
        const cell = [...(row?.children ?? [])].find(
          (node) => node.getAttribute("data-column-id") === id,
        );
        return cell
          ? Math.abs(
              cell.getBoundingClientRect().width -
                header.getBoundingClientRect().width,
            )
          : null;
      }),
    );
  expect(pairs.length).toBeGreaterThan(0);
  expect(pairs.every((width) => width !== null && width <= 2)).toBe(true);
}
test("I6 — actual narrow interaction/scroll/form/focus plus bounded EN/AR theme matrix", async ({
  page,
}) => {
  await open(page);
  const owners = await page.evaluateHandle(() => [
    window.wp12.a.owner.C,
    window.wp12.a.owner.P,
    window.wp12.b.owner.C,
    window.wp12.b.owner.P,
  ]);
  await numberRule(page, "-1000000");
  await button(page, "Add filter rule: Filters").click();
  await page.getByRole("option", { name: "Reference", exact: true }).click();
  await page.getByRole("option", { name: "is not empty", exact: true }).click();
  await deliver(page);
  await button(page, "Any").click();
  await deliver(page);
  const originalColumnIds = await columns(page, "b");
  await audit(page, "normal native rows and toolbar");
  await select(page, "Select Transfer note 01");
  await audit(page, "real selection replacement");
  await button(page, /Clear row selection/).click();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await containment(page);
    expect(await columns(page, "b")).toEqual(originalColumnIds);
    await root(page, "b")
      .getByLabel("Native note tx-001")
      .fill(`Native width ${width}`);
    await button(page, "Next page").press("Enter");
    await deliver(page);
    await expect(rows(page).first()).toHaveText("Transfer note 11");
    await button(page, "Previous page").press("Enter");
    await deliver(page);
    await button(page, "View details tx-001").press("Enter");
    const dialog = page.getByRole("dialog", {
      name: "Application A record details",
      exact: true,
    });
    await dialog
      .getByRole("textbox", { name: "Reference draft" })
      .fill(`Dirty width ${width}`);
    await expect(dialog).toBeVisible();
    if (width < 768)
      await expect
        .poll(async () => Math.round((await dialog.boundingBox())?.width ?? 0))
        .toBe(width);
    await page.keyboard.press("Escape");
    await dialog
      .getByRole("button", { name: "Keep editing", exact: true })
      .press("Enter");
    await expect(
      dialog.getByRole("textbox", { name: "Reference draft" }),
    ).toHaveValue(`Dirty width ${width}`);
    await expect(
      dialog.getByRole("textbox", { name: "Reference draft" }),
    ).toBeFocused();
    if (width === 320) await audit(page, "real open dirty drawer");
    await dialog
      .getByRole("button", { name: "Close record details", exact: true })
      .press("Enter");
    await dialog
      .getByRole("button", { name: "Discard draft", exact: true })
      .press("Enter");
    await expect(button(page, "View details tx-001")).toBeFocused();
  }
  let currentRTL = false,
    currentDark = false;
  for (const [width, rtl, dark] of [
    [320, true, true],
    [390, false, true],
    [768, true, false],
    [1024, true, true],
    [1440, true, false],
  ] as const) {
    await page.setViewportSize({ width, height: 1000 });
    if (rtl !== currentRTL) {
      await page
        .getByRole("button", { name: "Toggle direction", exact: true })
        .click();
      await deliver(page);
      currentRTL = rtl;
    }
    if (dark !== currentDark) {
      await page
        .getByRole("button", { name: "Toggle theme", exact: true })
        .click();
      currentDark = dark;
    }
    await expect(page.getByRole("main")).toHaveAttribute(
      "dir",
      rtl ? "rtl" : "ltr",
    );
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      dark ? "dark" : "light",
    );
    await expect(button(page, rtl ? "الأعمدة" : "Columns")).toBeVisible();
    await containment(page);
    const locale = rtl ? "ar-EG" : "en-US";
    await expect(page.getByLabel("Locale number")).toHaveText(
      new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(
        -1234.5,
      ),
    );
    await expect(
      root(page)
        .locator("tbody tr")
        .first()
        .locator('[data-column-id="amount"]'),
    ).toHaveText(
      new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(0),
    );
    await button(page, "View details tx-001").click();
    const dialog = page.getByRole("dialog", {
      name: "Application A record details",
      exact: true,
    });
    await dialog
      .getByRole("textbox", { name: "Reference draft" })
      .fill("Mixed TX-001 / مرجع");
    await dialog
      .getByRole("button", { name: "Save synthetic reference", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Close record details", exact: true })
      .click();
    await expect(button(page, "View details tx-001")).toBeFocused();
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await page.setViewportSize({ width: 320, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await containment(page);
  await button(page, "View details tx-001").click();
  await expect(
    page.getByRole("dialog", {
      name: "Application A record details",
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(button(page, "View details tx-001")).toBeFocused();
  expect(
    await owners.evaluate(
      (values) =>
        values[0] === window.wp12.a.owner.C &&
        values[1] === window.wp12.a.owner.P &&
        values[2] === window.wp12.b.owner.C &&
        values[3] === window.wp12.b.owner.P,
    ),
  ).toBe(true);
});
