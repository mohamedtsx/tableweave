import { expect, test } from "@playwright/test";

const errors = new WeakMap<object, string[]>();
test.beforeEach(async ({ page }) => {
  const entries: string[] = [];
  errors.set(page, entries);
  page.on("pageerror", (error) => entries.push(error.message));
  await page.goto("/tests/criteria-search-tabs/browser.html");
});
test.afterEach(({ page }) => {
  expect(errors.get(page)).toEqual([]);
});
test("same-domain props preserve Search/form DOM, raw edit/focus/caret and remaining debounce", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2030-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2030-01-01T00:00:01Z"));
  const search = page.getByRole("searchbox", { name: "Search records" }),
    form = page.getByRole("textbox", { name: "Custom results form" });
  await search.fill("still typing");
  await page.clock.runFor(100);
  const searchNode = await search.elementHandle();
  if (!searchNode) throw new Error("Search missing");
  await search.focus();
  await search.evaluate((node: HTMLInputElement) =>
    node.setSelectionRange(2, 5),
  );
  await search.press("Alt+r");
  await expect(search).toBeFocused();
  expect(
    await search.evaluate((node: HTMLInputElement) => [
      node.selectionStart,
      node.selectionEnd,
    ]),
  ).toEqual([2, 5]);
  await form.fill("12345");
  await form.focus();
  await form.evaluate((node: HTMLInputElement) => node.setSelectionRange(1, 3));
  const formNode = await form.elementHandle();
  if (!formNode) throw new Error("Form missing");
  // A real app keyboard shortcut reallocates props without intentionally moving
  // focus to a pointer-clicked button. No forced/programmatic click.
  await form.press("Alt+r");
  await expect(search).toHaveValue("still typing");
  await expect(form).toHaveValue("12345");
  await expect(form).toBeFocused();
  expect(
    await form.evaluate((node: HTMLInputElement) => [
      node.selectionStart,
      node.selectionEnd,
    ]),
  ).toEqual([1, 3]);
  expect(await formNode.evaluate((node) => node.isConnected)).toBe(true);
  expect(await searchNode.evaluate((node) => node.isConnected)).toBe(true);
  await page.clock.runFor(199);
  await expect(page.getByTestId("observations")).toHaveText("0");
  await page.clock.runFor(1);
  await expect(page.getByTestId("observations")).toHaveText("1");
});
test("abandoned transition/Suspense B never captures private candidate config before actual commit", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2030-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2030-01-01T00:00:01Z"));
  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.fill("kept");
  await page
    .getByRole("button", { name: "Suspend candidate", exact: true })
    .click();
  await expect(search).toHaveValue("kept");
  expect(
    await page.evaluate(
      () =>
        (
          window as unknown as {
            criteriaSearchTabs: { counts(): { candidateReads: number } };
          }
        ).criteriaSearchTabs.counts().candidateReads,
    ),
  ).toBe(0);
  await page
    .getByRole("button", { name: "Resolve candidate", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              criteriaSearchTabs: { counts(): { candidateReads: number } };
            }
          ).criteriaSearchTabs.counts().candidateReads,
      ),
    )
    .toBeGreaterThan(0);
});
test("controlled older acceptance rebases newer Search and Escape does not clear accepted text", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2030-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2030-01-01T00:00:01Z"));
  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.fill("first");
  await search.press("Enter");
  await search.fill("newer");
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.getByTestId("accepted-search")).toHaveText("first");
  await expect(search).toHaveValue("newer");
  await search.press("Escape");
  await expect(search).toHaveValue("first");
  await expect(page.getByTestId("accepted-search")).toHaveText("first");
});

test("actual composition events block intermediate Enter/debounce and arm only after composition end", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2030-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2030-01-01T00:00:01Z"));
  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.dispatchEvent("compositionstart");
  await search.fill("composition");
  await search.press("Enter");
  await page.clock.runFor(1000);
  await expect(page.getByTestId("observations")).toHaveText("0");
  await search.dispatchEvent("compositionend", { data: "composition" });
  await page.clock.runFor(300);
  await expect(page.getByTestId("observations")).toHaveText("1");
  await expect(page.getByTestId("accepted-search")).toHaveText("(empty)");
});
test("Tabs use one stable results subtree, real ARIA linkage and manual keyboard activation", async ({
  page,
}) => {
  const results = page.getByTestId("results"),
    form = page.getByRole("textbox", { name: "Custom results form" });
  await form.fill("survives tab acceptance");
  await expect(results).toHaveCount(1);
  const all = page.getByRole("tab", { name: "All", exact: true });
  await all.focus();
  await page.keyboard.press("ArrowRight");
  await expect(all).not.toHaveAttribute("aria-selected", "true");
  await all.click();
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(all).toHaveAttribute("aria-selected", "true");
  const controls = await all.getAttribute("aria-controls");
  expect(controls).toBeTruthy();
  if (!controls) throw new Error("Actual selected tab controls ID missing");
  await expect(page.getByRole("tabpanel")).toHaveAttribute("id", controls);
  await expect(results).toHaveCount(1);
  await expect(form).toHaveValue("survives tab acceptance");
});
test("real Strict/hide purges local edits only; dropping criteria denies instead of raw fallback", async ({
  page,
}) => {
  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.fill("private edit");
  await page.getByRole("button", { name: "Toggle tools", exact: true }).click();
  await expect(search).toHaveCount(0);
  await page.getByRole("button", { name: "Toggle tools", exact: true }).click();
  await expect(search).toHaveValue("");
  expect(
    await page.evaluate(() =>
      (
        window as unknown as {
          criteriaSearchTabs: {
            counts(): { phase: string; selection: object };
          };
        }
      ).criteriaSearchTabs.counts(),
    ),
  ).toMatchObject({ phase: "settled", selection: { one: true } });
  await page
    .getByRole("button", { name: "Drop criteria", exact: true })
    .click();
  await expect(search).toHaveCount(0);
  await expect(
    page.getByText("Filtering is unavailable.", { exact: true }),
  ).toBeVisible();
});

test("automatic keyboard activation submits only a genuine current schema tab", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Automatic tabs", exact: true })
    .click();
  await page.getByRole("tab", { name: "Any", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("observations")).toHaveText("1");
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "All", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("results")).toHaveCount(1);
});

test("long labels stay in their actual overflow scroller with usable navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.getByRole("button", { name: "Long tabs", exact: true }).click();
  const scroller = page.locator(".tw-filter-tabs-scroll");
  expect(
    await scroller.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Next filter tabs", exact: true })
    .click();
  await expect
    .poll(() => scroller.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});
