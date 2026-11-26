import { expect, type Page, test } from "@playwright/test";
import type { port } from "./fixture.js";

declare global {
  interface Window {
    nativeBrowser: typeof port;
  }
}
let errors: string[];
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
});
test.afterEach(async () => {
  expect(errors).toEqual([]);
});

function expected(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `r${String(index).padStart(3, "0")}`,
    amount: index % 7,
    title: `label-${String(count - 1 - index).padStart(3, "0")}`,
    eligible: index % 4 !== 0,
  }))
    .filter((row) => row.amount >= 1)
    .sort((a, b) => b.amount - a.amount || a.title.localeCompare(b.title));
}
async function open(page: Page, query = "") {
  await page.goto(`/?${query}`);
  await expect(
    page.getByRole("grid", { name: "Native client inventory" }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.nativeBrowser.observe().commits))
    .toBeGreaterThanOrEqual(2);
}
async function rows(page: Page, ids: string[]) {
  await expect(page.getByLabel("Accepted row IDs")).toHaveText(ids.join(","));
  const physical = page.locator("tbody > tr[data-key]");
  await expect(physical).toHaveCount(ids.length);
  expect(
    await physical.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-key")),
    ),
  ).toEqual(ids);
  const observation = await page.evaluate(() => window.nativeBrowser.observe());
  expect(observation.nativeRows).toEqual(ids);
  expect(observation.rows).toEqual(ids);
  expect(observation.sameRows).toBe(true);
  expect(observation.originalsRetained).toBe(true);
  expect(observation.unchanged).toBe(true);
  expect(observation.mutable).toBe(true);
  return observation;
}
for (const scenario of [
  { policy: "false", custom: false, size: 10, visible: 148 },
  { policy: "false", custom: true, size: 7, visible: 148 },
  { policy: "omitted", custom: false, size: 10, visible: 10 },
  { policy: "true", custom: false, size: 10, visible: 10 },
  { policy: "true", custom: true, size: 7, visible: 7 },
]) {
  test(`actual DOM policy=${scenario.policy} custom=${scenario.custom} returns ${scenario.visible}`, async ({
    page,
  }) => {
    await open(
      page,
      `policy=${scenario.policy}${scenario.custom ? "&custom" : ""}`,
    );
    const all = expected(173).map((row) => row.id);
    const observation = await rows(page, all.slice(0, scenario.visible));
    expect(observation.pair).toEqual({ pageIndex: 0, pageSize: scenario.size });
    expect(observation.pagination.enabled).toBe(scenario.policy !== "false");
    expect(observation.pagination.pageInfo).toEqual({
      kind: "known",
      total: 148,
    });
    if (scenario.policy === "false") {
      expect(observation.pagination.pageCount).toBeNull();
      expect(observation.pagination.canNextPage).toBe(false);
      expect(observation.pagination.canPreviousPage).toBe(false);
      expect(
        await page.evaluate(() => window.nativeBrowser.denyPaging()),
      ).toEqual({
        codes: ["native.page", "native.page", "state.capability"],
        counters: { updater: 0, command: 0, state: 0, commit: 0, query: 0 },
        sameState: true,
      });
      await expect(
        page.getByRole("button", { name: "Native next page" }),
      ).toHaveCount(0);
    } else {
      await page
        .getByRole("button", { name: "Native next page", exact: true })
        .click();
      await rows(page, all.slice(scenario.size, scenario.size * 2));
      await page
        .getByRole("button", { name: "Native previous page", exact: true })
        .click();
      await rows(page, all.slice(0, scenario.size));
    }
  });
}
for (const count of [0, 5, 311]) {
  test(`disabled physical rows count=${count}, not a maxPageRows cap`, async ({
    page,
  }) => {
    await open(page, `count=${count}`);
    const observation = await rows(
      page,
      expected(count).map((row) => row.id),
    );
    expect(observation.pagination.pageInfo).toEqual({
      kind: "known",
      total: expected(count).length,
    });
    expect(observation.pair.pageSize).toBe(10);
    if (count === 311) expect(observation.rows.length).toBeGreaterThan(100);
  });
}
test("actual header sorting routes two ordered native sorts; filter clearing resets selection, not dormant pair", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("button", { name: "Clear sorting", exact: true })
    .click();
  await expect(page.getByLabel("Accepted sorting")).toHaveText("");
  await page
    .getByRole("button", { name: "Sort Amount, not sorted", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Sort Amount, ascending, priority 1",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Sort Title, not sorted", exact: true })
    .click({ modifiers: ["Shift"] });
  await expect(page.getByLabel("Accepted sorting")).toHaveText(
    "amount:true,title:false",
  );
  await expect(page.getByRole("status", { name: "Sort order" })).toHaveText(
    "amount descending, priority 1; title ascending, priority 2",
  );
  await rows(
    page,
    expected(173).map((row) => row.id),
  );
  expect(
    (await page.evaluate(() => window.nativeBrowser.observe())).selected,
  ).toEqual(["offscreen"]);
  await page
    .getByRole("button", { name: "Clear builder", exact: true })
    .click();
  const all = Array.from({ length: 173 }, (_, index) => ({
    id: `r${String(index).padStart(3, "0")}`,
    amount: index % 7,
    title: 172 - index,
  }))
    .sort((a, b) => b.amount - a.amount || a.title - b.title)
    .map((row) => row.id);
  const observation = await rows(page, all);
  expect(observation.selected).toEqual([]);
  expect(observation.pair).toEqual({ pageIndex: 0, pageSize: 10 });
  await page
    .getByRole("button", { name: "Apply positive filter", exact: true })
    .click();
  await rows(
    page,
    expected(173).map((row) => row.id),
  );
});
test("multiple selection header changes only eligible rendered rows, preserving unloaded selected ID", async ({
  page,
}) => {
  await open(page);
  const header = page.getByRole("checkbox", {
    name: "Select eligible rows on this page",
    exact: true,
  });
  await expect(header).not.toBeChecked();
  await header.locator("xpath=ancestor::label").click();
  const eligible = expected(173)
    .filter((row) => row.eligible)
    .map((row) => row.id);
  await expect
    .poll(() =>
      page.evaluate(() => window.nativeBrowser.observe().selected.length),
    )
    .toBe(eligible.length + 1);
  let observation = await rows(
    page,
    expected(173).map((row) => row.id),
  );
  expect([...observation.selected].sort()).toEqual(
    ["offscreen", ...eligible].sort(),
  );
  expect(observation.loadedSelected).toEqual(eligible);
  expect(observation.eligible).toEqual(eligible);
  await expect(header).toBeChecked();
  const ineligible = expected(173).find((row) => !row.eligible);
  if (!ineligible) throw new Error("Missing rendered ineligible row");
  await expect(
    page.getByRole("checkbox", {
      name: `Select ${ineligible.title}`,
      exact: true,
    }),
  ).toBeDisabled();
  await header.locator("xpath=ancestor::label").click();
  await expect(page.getByLabel("Accepted selected IDs")).toHaveText(
    "offscreen",
  );
  observation = await rows(
    page,
    expected(173).map((row) => row.id),
  );
  expect(observation.loadedSelected).toEqual([]);
});
test("single selection replaces and false selection renders no checkbox actions", async ({
  page,
}) => {
  await open(page, "selection=single");
  await expect(
    page.getByRole("checkbox", {
      name: "Select eligible rows on this page",
      exact: true,
    }),
  ).toHaveCount(0);
  const targets = expected(173)
    .filter((row) => row.eligible)
    .slice(0, 2);
  for (const target of targets) {
    await page
      .getByRole("checkbox", { name: `Select ${target.title}`, exact: true })
      .locator("xpath=ancestor::label")
      .click();
    await expect(page.getByLabel("Accepted selected IDs")).toHaveText(
      target.id,
    );
  }
  await rows(
    page,
    expected(173).map((row) => row.id),
  );
  await open(page, "selection=false");
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  expect(
    (
      await rows(
        page,
        expected(173).map((row) => row.id),
      )
    ).selected,
  ).toEqual([]);
});
test("grouped hidden columns preserve leaf order and every physical cell alignment", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("button", { name: "Reorder leaves", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.nativeBrowser.observe().columns))
    .toEqual(["selection", "code", "title", "amount"]);
  await page
    .getByRole("button", { name: "Hide grouped leaves", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.nativeBrowser.observe().columns))
    .toEqual(["selection", "title"]);
  await expect(
    page.getByRole("columnheader", { name: "Metrics", exact: true }),
  ).toHaveCount(0);
  const alignments = await page
    .locator("tbody > tr[data-key]")
    .evaluateAll((elements) =>
      elements.map((element) =>
        [...element.children].map((cell) =>
          cell.getAttribute("data-column-id"),
        ),
      ),
    );
  expect(alignments).toHaveLength(148);
  for (const alignment of alignments)
    expect(alignment).toEqual(["selection", "title"]);
  expect(
    await page
      .locator("thead > tr")
      .evaluateAll((elements) =>
        elements.map((element) =>
          [...element.querySelectorAll("th")].reduce(
            (sum, cell) => sum + cell.colSpan,
            0,
          ),
        ),
      ),
  ).toEqual([2, 2]);
  await expect(
    page.locator("thead th th, thead > div, tbody > div"),
  ).toHaveCount(0);
  await rows(
    page,
    expected(173).map((row) => row.id),
  );
});
test("keyboard reaches last of >100 physical rows, then Space selects genuine row checkbox", async ({
  page,
}, testInfo) => {
  await open(page);
  const grid = page.getByRole("grid", { name: "Native client inventory" });
  for (let index = 0; index < 30; index++) {
    if (
      await grid.evaluate((element) => element.contains(document.activeElement))
    )
      break;
    await page.keyboard.press("Tab");
  }
  expect(
    await grid.evaluate((element) => element.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Control+End");
  const last = expected(173).at(-1);
  if (!last) throw new Error("Missing expected last row");
  await expect
    .poll(() =>
      page.evaluate(() =>
        document.activeElement
          ?.closest("tr[data-key]")
          ?.getAttribute("data-key"),
      ),
    )
    .toBe(last.id);
  await expect(
    page.locator(`tbody > tr[data-key="${last.id}"]`),
  ).toBeInViewport();
  // Ctrl+End enters the final ROW. RAC Home from a row goes to the first row,
  // not its first cell. ArrowRight enters the current row's first child cell.
  await page.keyboard.press("ArrowRight");
  const checkbox = page.getByRole("checkbox", {
    name: `Select ${last.title}`,
    exact: true,
  });
  await expect(checkbox).toBeFocused();
  await expect(checkbox).toBeEnabled();
  await page.keyboard.press("Space");
  await expect(checkbox).toBeChecked();
  await expect(checkbox).toBeFocused();
  const observation = await rows(
    page,
    expected(173).map((row) => row.id),
  );
  expect(observation.selected).toContain(last.id);
  await page.screenshot({ path: testInfo.outputPath("last-row-keyboard.png") });
  await testInfo.attach("grid-aria", {
    body: await grid.ariaSnapshot(),
    contentType: "text/plain",
  });
});
test("saved native actions reject stale/disposed views without accepted mutation; ordinary server rejects before row IDs", async ({
  page,
}) => {
  await open(page);
  expect(
    await page.evaluate(() => window.nativeBrowser.denyOrdinaryServer()),
  ).toEqual({ code: "native.page", rowIdCalls: 0, sameState: true });
  await page.evaluate(() => window.nativeBrowser.save());
  await page
    .getByRole("button", { name: "Clear builder", exact: true })
    .click();
  await expect(page.locator("tbody > tr[data-key]")).toHaveCount(173);
  expect(
    await page.evaluate(() => window.nativeBrowser.savedActions()),
  ).toEqual({ codes: ["native.page", "native.page"], sameState: true });
  await page.evaluate(() => window.nativeBrowser.dispose());
  expect(
    await page.evaluate(() => window.nativeBrowser.disposedActions()),
  ).toEqual({
    codes: ["native.lifecycle", "native.lifecycle", "native.lifecycle"],
    updater: 0,
    sameState: true,
  });
});
