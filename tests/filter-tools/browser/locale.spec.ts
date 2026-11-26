import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { inspect, inspector, openFixture } from "./helpers.js";

const errors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const found: string[] = [];
  errors.set(page, found);
  page.on("pageerror", (error) => found.push(error.message));
});
test.afterEach(({ page }) => expect(errors.get(page)).toEqual([]));

test("RTL inherited Aria direction moves ArrowRight to the previous tab despite an English browser locale", async ({
  page,
}) => {
  await openFixture(page, "?rtl");
  expect(await page.evaluate(() => navigator.language)).toBe("en-US");
  expect((await inspect(page)).state.query.locale).toBe("ar-EG");
  await expect(page.locator("main.wp07")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("main.wp07")).toHaveAttribute("lang", "ar-EG");
  await expect(page.getByTestId("aria-locale")).toHaveAttribute(
    "data-locale",
    "ar-EG",
  );
  await expect(page.getByTestId("aria-locale")).toHaveAttribute(
    "data-direction",
    "rtl",
  );
  await expect(
    page.getByRole("searchbox", { name: "البحث في السجلات", exact: true }),
  ).toHaveAttribute("placeholder", "ابحث في السجلات…");
  await expect(page.getByTestId("mixed-bidi")).toContainText("سجل تجريبي");
  await expect(page.getByTestId("bidi-token")).toHaveText("Alpha-0 / 123.45");
  expect(
    await page
      .getByTestId("bidi-token")
      .evaluate((element) => getComputedStyle(element).direction),
  ).toBe("ltr");
  const neutral = page.getByRole("tab", {
    name: "All categories",
    exact: true,
  });
  await neutral.focus();
  await neutral.press("ArrowRight");
  expect(
    await page.evaluate(() => document.activeElement?.getAttribute("data-key")),
  ).toBe("paused");
  await expect(
    page.getByRole("tab", { name: "Paused", exact: true }),
  ).toBeFocused();
  expect((await inspect(page)).state.query.tabId).toBeNull();
  await page.getByRole("tab", { name: "Paused", exact: true }).press("Enter");
  await expect(page.getByTestId("native-ids")).toHaveText("c,d,h");
});

test("English inherited Aria direction keeps ArrowRight as next-tab navigation and renders actual accepted rows", async ({
  page,
}) => {
  await openFixture(page);
  await expect(page.getByTestId("aria-locale")).toHaveAttribute(
    "data-locale",
    "en-US",
  );
  await expect(page.getByTestId("aria-locale")).toHaveAttribute(
    "data-direction",
    "ltr",
  );
  await expect(
    page.getByRole("searchbox", { name: "Search records", exact: true }),
  ).toBeVisible();
  const neutral = page.getByRole("tab", {
    name: "All categories",
    exact: true,
  });
  await neutral.focus();
  await neutral.press("ArrowRight");
  const ready = page.getByRole("tab", { name: "Ready", exact: true });
  await expect(ready).toBeFocused();
  expect((await inspect(page)).state.query.tabId).toBeNull();
  await ready.press("Enter");
  await expect(page.getByTestId("native-ids")).toHaveText("a,b,e,f,g");
});

test("only accepted locale changes update the whole workbench's Aria context, partial messages and bidi content without remounts", async ({
  page,
}, info) => {
  await openFixture(page, "?controlled");
  await page.clock.install({ time: new Date("2030-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2030-01-01T00:00:01Z"));
  await inspector(page);
  await page
    .getByRole("button", { name: "Results local state 0", exact: true })
    .click();
  const owner = await page.evaluateHandle(() => window.wp07);
  const grid = await page
    .getByRole("grid", { name: "Synthetic filter results", exact: true })
    .elementHandle();
  if (!grid) throw new Error("Native collection missing");
  const before = await inspect(page);
  await page
    .getByRole("button", { name: "Use Arabic locale", exact: true })
    .click();
  await expect(page.getByTestId("aria-locale")).toHaveAttribute(
    "data-locale",
    "en-US",
  );
  await expect(page.locator("main.wp07")).toHaveAttribute("dir", "ltr");
  await page
    .getByRole("button", {
      name: "Silently reject proposed change",
      exact: true,
    })
    .click();
  expect((await inspect(page)).state.query).toEqual(before.state.query);
  await expect(page.getByTestId("aria-locale")).toHaveAttribute(
    "data-direction",
    "ltr",
  );
  await page
    .getByRole("button", { name: "Use Arabic locale", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Accept proposed change", exact: true })
    .click();
  await expect(page.getByTestId("aria-locale")).toHaveAttribute(
    "data-locale",
    "ar-EG",
  );
  await expect(page.getByTestId("aria-locale")).toHaveAttribute(
    "data-direction",
    "rtl",
  );
  await expect(page.locator("main.wp07")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("main.wp07")).toHaveAttribute("lang", "ar-EG");
  expect(await page.evaluate(() => navigator.language)).toBe("en-US");
  const search = page.getByRole("searchbox", {
    name: "البحث في السجلات",
    exact: true,
  });
  await search.fill("Alpha");
  await expect(
    page.getByRole("button", { name: "مسح البحث", exact: true }),
  ).toBeVisible();
  await search.press("Escape");
  await page.clock.runFor(250);
  await expect(search).toHaveValue("");
  await expect(
    page.getByText("تم إلغاء تعديل البحث.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("bidi-token")).toHaveAttribute("dir", "ltr");
  const neutral = page.getByRole("tab", {
    name: "All categories",
    exact: true,
  });
  await neutral.focus();
  await neutral.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Paused", exact: true }),
  ).toBeFocused();
  await page.screenshot({
    path: info.outputPath("accepted-arabic-context.png"),
  });
  await page
    .getByRole("button", { name: "Use English locale", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Accept proposed change", exact: true })
    .click();
  await expect(page.getByTestId("aria-locale")).toHaveAttribute(
    "data-locale",
    "en-US",
  );
  await expect(page.getByTestId("aria-locale")).toHaveAttribute(
    "data-direction",
    "ltr",
  );
  await expect(
    page.getByRole("searchbox", { name: "Search records", exact: true }),
  ).toBeVisible();
  await neutral.focus();
  await neutral.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Ready", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Results local state 1", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("native-ids")).toHaveText("a,b,c,d,e,f,g,h");
  expect(await grid.evaluate((element) => element.isConnected)).toBe(true);
  expect(
    await page.evaluate((original) => window.wp07 === original, owner),
  ).toBe(true);
  expect((await inspect(page)).metrics.acceptedRequests).toBe(
    before.metrics.acceptedRequests + 2,
  );
  await grid.dispose();
  await owner.dispose();
});
