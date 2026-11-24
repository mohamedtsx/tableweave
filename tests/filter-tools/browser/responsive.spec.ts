import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { inspect, openFixture } from "./helpers.js";

const errors = new WeakMap<Page, string[]>();
const external = new WeakMap<Page, string[]>();
test.beforeEach(({ page, baseURL }) => {
  const found: string[] = [];
  const origins: string[] = [];
  errors.set(page, found);
  external.set(page, origins);
  if (!baseURL) throw new Error("Public integration base URL missing");
  const fixtureOrigin = new URL(baseURL).origin;
  page.on("pageerror", (error) => found.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith("http") && url.origin !== fixtureOrigin)
      origins.push(url.origin);
  });
});
test.afterEach(({ page }) => {
  expect(errors.get(page)).toEqual([]);
  expect(external.get(page)).toEqual([]);
});

async function contained(page: Page, width: number) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  for (const box of await page.locator("[data-rule-id]").evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right };
    }),
  )) {
    expect(box.left).toBeGreaterThanOrEqual(-1);
    expect(box.right).toBeLessThanOrEqual(width + 1);
  }
}

for (const width of [1440, 1024, 768, 390, 320])
  for (const dark of [false, true])
    test(`emitted combined rules and overlay stay contained at ${width}px ${dark ? "dark" : "light"}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 1000 });
      await openFixture(page, `?example=crossAny${dark ? "&dark" : ""}`);
      await expect(page.getByTestId("native-ids")).toHaveText("b,d,e,f,g,h");
      await contained(page, width);
      if (width === 1440 && !dark) {
        await page.screenshot({
          path: info.outputPath("combined-1440-light-closed.png"),
        });
        const violations = (await new AxeBuilder({ page }).analyze())
          .violations;
        await info.attach("axe-closed-1440-light", {
          body: JSON.stringify(violations, null, 2),
          contentType: "application/json",
        });
        expect(
          violations.map(({ id, nodes }) => ({
            id,
            targets: nodes.map(({ target }) => target),
          })),
        ).toEqual([]);
      }
      const all = await page
        .getByRole("button", { name: "All", exact: true })
        .evaluate((button) => getComputedStyle(button).backgroundColor);
      const any = await page
        .getByRole("button", { name: "Any", exact: true })
        .evaluate((button) => getComputedStyle(button).backgroundColor);
      expect(all).not.toBe(any);
      await page
        .getByRole("button", {
          name: /^Value: Note \(hidden column\): .+$/,
        })
        .click();
      const box = await page.getByRole("dialog").boundingBox();
      if (!box) throw new Error("Actual filter overlay missing");
      expect(box.x).toBeGreaterThanOrEqual(-1);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
      await contained(page, width);
      if (width === 320 && dark) {
        await page.screenshot({
          path: info.outputPath("combined-320-dark.png"),
        });
        const violations = (await new AxeBuilder({ page }).analyze())
          .violations;
        await info.attach("axe-overlay-320-dark", {
          body: JSON.stringify(violations, null, 2),
          contentType: "application/json",
        });
        expect(
          violations.map(({ id, nodes }) => ({
            id,
            targets: nodes.map(({ target }) => target),
          })),
        ).toEqual([]);
      }
      await page.screenshot({
        path: info.outputPath(
          `combined-${width}-${dark ? "dark" : "light"}.png`,
        ),
      });
    });

for (const width of [768, 320])
  test(`Arabic-locale RTL layout is contained at ${width}px without claiming complete localization`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await openFixture(page, "?example=repeated&rtl");
    await expect(page.locator("main.wp07")).toHaveAttribute("dir", "rtl");
    await contained(page, width);
    await page
      .getByRole("button", { name: /^Value: Amount: .+$/ })
      .first()
      .click();
    const box = await page.getByRole("dialog").boundingBox();
    if (!box) throw new Error("Actual RTL filter overlay missing");
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    await page.screenshot({
      path: info.outputPath(`combined-${width}-rtl.png`),
    });
  });

test("320px dark RTL with 200% text preserves whole rule groups and contained scrolling", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 1000 });
  await openFixture(page, "?example=crossAny&dark&rtl");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await contained(page, 320);
  const before = await inspect(page);
  await page.getByRole("button", { name: /^Value: Amount: .+$/ }).click();
  const box = await page.getByRole("dialog").boundingBox();
  if (!box) throw new Error("Enlarged text overlay missing");
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(321);
  await page.keyboard.press("Escape");
  expect((await inspect(page)).state.query).toEqual(before.state.query);
  await page.screenshot({
    path: info.outputPath("combined-320-dark-rtl-200percent.png"),
  });
});

test("all rule segments are keyboard reachable and both Escape/backdrop cancel preserve native results", async ({
  page,
}) => {
  await openFixture(page, "?example=repeated");
  const before = await inspect(page);
  await page
    .getByRole("button", { name: "Field: Amount", exact: true })
    .first()
    .focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Operator: is at least", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  const value = page
    .getByRole("button", { name: /^Value: Amount: .+$/ })
    .first();
  await expect(value).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page
      .getByRole("button", { name: "Rule options: Amount", exact: true })
      .first(),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Enter");
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("25");
  for (let index = 0; index < 5; index++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]')),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(value).toBeFocused();
  await expect(page.getByTestId("native-ids")).toHaveText("b,c,d");
  await value.press("Enter");
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("20");
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("Browser viewport missing");
  await page.mouse.click(viewport.width - 10, viewport.height - 10);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await inspect(page)).state.query).toEqual(before.state.query);
  expect((await inspect(page)).metrics.acceptedRequests).toBe(
    before.metrics.acceptedRequests,
  );
});

test("real debounced search Cancel never requests or changes the accepted native model", async ({
  page,
}) => {
  await openFixture(page);
  await page.clock.install({ time: new Date("2030-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2030-01-01T00:00:01Z"));
  const before = await inspect(page);
  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.fill("unsubmitted");
  await search.press("Escape");
  await page.clock.runFor(250);
  await expect(search).toHaveValue("");
  await expect(page.getByTestId("native-ids")).toHaveText("a,b,c,d,e,f,g,h");
  expect((await inspect(page)).metrics.acceptedRequests).toBe(
    before.metrics.acceptedRequests,
  );
});
