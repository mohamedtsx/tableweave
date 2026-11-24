import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import {
  addRule,
  appAction,
  applyDstDate,
  inspect,
  inspector,
  openFixture,
} from "./helpers.js";

const errors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const found: string[] = [];
  errors.set(page, found);
  page.on("pageerror", (error) => found.push(error.message));
});
test.afterEach(({ page }) => expect(errors.get(page)).toEqual([]));

test("operator-family story seed is a valid public query and its seven real predicates switch between Any and All", async ({
  page,
}) => {
  await openFixture(page, "?example=families");
  await expect(page.locator("[data-rule-id]")).toHaveCount(7);
  await expect(page.getByTestId("native-ids")).toHaveText("a,b,c,d,e,f,g,h");
  const before = await inspect(page);
  expect(before.state.query.builder.rules.map(({ field }) => field)).toEqual([
    "amount",
    "note",
    "entityNumber",
    "tags",
    "flag",
    "day",
    "customScore",
  ]);
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.getByTestId("native-ids")).toHaveText("none");
  const after = await inspect(page);
  expect(after.state.query.builder.rules).toEqual(
    before.state.query.builder.rules,
  );
  expect(after.state.query.builder.join).toBe("and");
});

test("hidden nullable text distinguishes empty from whitespace and its exact inverse composes with native search", async ({
  page,
}) => {
  await openFixture(page);
  await addRule(page, "Note (hidden column)", "is empty");
  // Whitespace is not empty without explicit application normalization.
  await expect(page.getByTestId("native-ids")).toHaveText("c,d,h");
  const rule = (await inspect(page)).state.query.builder.rules[0];
  await page.getByRole("searchbox", { name: "Search records" }).fill("Alpha");
  await page.getByRole("searchbox", { name: "Search records" }).press("Enter");
  await expect(page.getByTestId("native-ids")).toHaveText("d");
  await page
    .getByRole("button", {
      name: "Rule options: Note (hidden column)",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Negate", exact: true }).click();
  await expect(page.getByTestId("native-ids")).toHaveText("a,b,g");
  expect((await inspect(page)).state.query.builder.rules).toEqual([
    { ...rule, operator: "notEmpty" },
  ]);
  expect((await inspect(page)).state.query.search).toBe("Alpha");
});

test("pending search acceptance composes with an unrelated open builder edit rather than replacing either tool", async ({
  page,
}) => {
  await openFixture(page, "?example=repeated");
  await page.clock.install({ time: new Date("2030-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2030-01-01T00:00:01Z"));
  const before = await inspect(page);
  await page.getByRole("searchbox", { name: "Search records" }).fill("Alpha");
  await page
    .getByRole("button", { name: /^Value: Amount: .+$/ })
    .first()
    .click();
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("20");
  await expect(page.getByTestId("native-ids")).toHaveText("b,c,d");
  await page.clock.runFor(200);
  await expect(page.getByTestId("native-ids")).toHaveText("b,d");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByTestId("native-ids")).toHaveText("d");
  const after = await inspect(page);
  expect(after.state.query.search).toBe("Alpha");
  expect(after.state.query.builder.rules).toEqual([
    { id: "amount-low", field: "amount", operator: "number.gte", value: 20 },
    { id: "amount-high", field: "amount", operator: "number.lte", value: 30 },
  ]);
  expect(after.metrics.acceptedRequests).toBe(
    before.metrics.acceptedRequests + 2,
  );
  expect(after.metrics.resultsMounts).toBe(before.metrics.resultsMounts);
  expect(after.metrics.resourceInvalidations).toBe(
    before.metrics.resourceInvalidations,
  );
});

test("application builder replacement invalidates the displaced edit without resurrecting its rule", async ({
  page,
}) => {
  await openFixture(page, "?example=repeated");
  await inspector(page);
  await page
    .getByRole("button", { name: /^Value: Amount: .+$/ })
    .first()
    .click();
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("25");
  const before = await inspect(page);
  await appAction(page, "Load cross-field Any example");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByTestId("native-ids")).toHaveText("b,d,e,f,g,h");
  const after = await inspect(page);
  expect(after.state.query.builder.rules.map(({ id }) => id)).toEqual([
    "amount-rule",
    "note-rule",
  ]);
  expect(after.metrics.acceptedRequests).toBe(
    before.metrics.acceptedRequests + 1,
  );
  expect(after.metrics.resultsMounts).toBe(before.metrics.resultsMounts);
});

test("Cancel date edit is distinct from Cancel selection and never clears hidden builder criteria", async ({
  page,
}) => {
  await openFixture(page, "?example=repeated");
  await page
    .getByRole("button", { name: "Select visible records", exact: true })
    .click();
  const before = await inspect(page);
  await page
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  await page
    .getByRole("button", { name: "DST day — March 9", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cancel date edit", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Filter by date", exact: true }),
  ).toBeFocused();
  await expect(page.getByTestId("native-ids")).toHaveText("b,c,d");
  const cancelledDate = await inspect(page);
  expect(cancelledDate.state.query).toEqual(before.state.query);
  expect(cancelledDate.state.selection).toEqual(before.state.selection);
  expect(cancelledDate.metrics.acceptedRequests).toBe(
    before.metrics.acceptedRequests,
  );
  await page
    .getByRole("button", { name: "Cancel selection", exact: true })
    .click();
  const cancelledSelection = await inspect(page);
  expect(
    Object.values(cancelledSelection.state.selection).filter(Boolean),
  ).toHaveLength(0);
  expect(cancelledSelection.state.query).toEqual(before.state.query);
  await expect(page.locator("[data-rule-id]")).toHaveCount(2);
});

test("controlled date proposal retains selected native rows until application acceptance atomically filters and cancels selection", async ({
  page,
}) => {
  await openFixture(page, "?controlled&example=repeated");
  await page
    .getByRole("button", { name: "Select visible records", exact: true })
    .click();
  const before = await inspect(page);
  await applyDstDate(page);
  await expect(page.getByTestId("native-ids")).toHaveText("b,c,d");
  expect((await inspect(page)).state.selection).toEqual(before.state.selection);
  expect((await inspect(page)).state.query).toEqual(before.state.query);
  await page
    .getByRole("button", { name: "Accept proposed change", exact: true })
    .click();
  await expect(page.getByTestId("native-ids")).toHaveText("b,c");
  const after = await inspect(page);
  expect(Object.values(after.state.selection).filter(Boolean)).toHaveLength(0);
  expect(after.state.query.builder).toEqual(before.state.query.builder);
  expect(after.metrics.acceptedRequests).toBe(
    before.metrics.acceptedRequests + 1,
  );
  expect(after.metrics.resultsMounts).toBe(before.metrics.resultsMounts);
  await expect(page.locator("[data-rule-id]")).toHaveCount(2);
});

test("dirty search survives a committed Suspense hide and resumes only on reveal against stable native/resource owners", async ({
  page,
}) => {
  await openFixture(page, "?example=repeated");
  await page.clock.install({ time: new Date("2030-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2030-01-01T00:00:01Z"));
  await page
    .getByRole("button", { name: "Results local state 0", exact: true })
    .click();
  const table = await page
    .getByRole("grid", { name: "Synthetic filter results", exact: true })
    .elementHandle();
  if (!table) throw new Error("Stable native collection missing");
  const api = await page.evaluateHandle(() => window.wp07);
  const before = await inspect(page);
  await page.getByRole("searchbox", { name: "Search records" }).fill("Alpha");
  await page
    .getByRole("button", {
      name: "Commit same-scope Suspense hide",
      exact: true,
    })
    .click();
  await page.clock.runFor(350);
  await expect(page.getByTestId("suspense-fallback")).toBeVisible();
  await expect(page.locator("main.wp07")).toBeHidden();
  expect((await inspect(page)).state.query).toEqual(before.state.query);
  expect((await inspect(page)).metrics.acceptedRequests).toBe(
    before.metrics.acceptedRequests,
  );
  await page
    .getByRole("button", { name: "Reveal same-scope workbench", exact: true })
    .click();
  await expect(
    page.getByRole("searchbox", { name: "Search records" }),
  ).toHaveValue("Alpha");
  await page.clock.runFor(200);
  await expect(page.getByTestId("native-ids")).toHaveText("b,d");
  const after = await inspect(page);
  expect(after.state.query.builder).toEqual(before.state.query.builder);
  expect(after.metrics.acceptedRequests).toBe(
    before.metrics.acceptedRequests + 1,
  );
  // StrictMode may replay passive effects on reveal. Check actual instance and
  // DOM/local-state identity, not passive setup counters as a proxy for mounts.
  await expect(
    page.getByRole("button", { name: "Results local state 1", exact: true }),
  ).toBeVisible();
  expect(
    await table.evaluate(
      (element) =>
        element.isConnected &&
        element ===
          document.querySelector(
            '[role="grid"][aria-label="Synthetic filter results"]',
          ),
    ),
  ).toBe(true);
  expect(await page.evaluate((owner) => window.wp07 === owner, api)).toBe(true);
  // The resource contract explicitly clears on StrictMode passive replay. Its
  // application request effect must re-establish the accepted native projection.
  expect(after.resource?.active).toBe(true);
  expect(after.resource?.kind).toBe("ready");
  expect(after.resource?.snapshot?.query).toEqual(after.state.query);
  expect(after.resource?.snapshot?.records.map(({ id }) => id)).toEqual([
    "b",
    "d",
  ]);
  await table.dispose();
  await api.dispose();
});
