import AxeBuilder from "@axe-core/playwright";
import { test as base, expect } from "@playwright/test";

const test = base.extend<{ runtimeErrors: string[] }>({
  runtimeErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use(errors);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

test("known first/middle/last pages and bounded controls preserve selected IDs", async ({
  page,
}) => {
  await page.goto("/?scenario=client");
  await expect(page.locator("#pager-range")).toHaveText(
    "1–10 of 60 records · Page 1 of 6",
  );
  await expect(
    page.getByRole("button", { name: "Previous page", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Page 3", exact: true }).click();
  await expect(page.locator("#pager-range")).toHaveText(
    "21–30 of 60 records · Page 3 of 6",
  );
  await page.getByRole("button", { name: "Page 5", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#pager-page-5")).toBeFocused();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page.locator("#pager-range")).toHaveText(
    "51–60 of 60 records · Page 6 of 6",
  );
  await expect(
    page.getByRole("button", { name: "Next page", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() => window.pagerTest.snapshot().state.selection),
  ).toEqual({ "off-page": true });
  await expect(page.locator("nav button")).toHaveCount(7);
});

test("page size uses schema defaults, resets once and preserves sorting/selection", async ({
  page,
}) => {
  await page.goto("/?scenario=client&page=3");
  await page.evaluate(() => window.pagerTest.sort());
  await page.evaluate(() => window.pagerTest.externalPage(3));
  const before = await page.evaluate(
    () => window.pagerTest.snapshot().commits.length,
  );
  await page.getByRole("button", { name: /Rows per page/ }).click();
  await expect(page.getByRole("option")).toHaveCount(4);
  await page.getByRole("option", { name: "25", exact: true }).click();
  await expect(page.locator("#pager-range")).toHaveText(
    "1–25 of 60 records · Page 1 of 3",
  );
  const after = await page.evaluate(() => window.pagerTest.snapshot());
  expect(after.commits.slice(before)).toEqual(["pagination.change"]);
  expect(after.state.query.sorting).toEqual([{ id: "amount", desc: true }]);
  expect(after.state.selection).toEqual({ "off-page": true });
});

test("custom schema sizes, keyboard selection and focus survive a size reset", async ({
  page,
}) => {
  await page.goto("/?scenario=client&custom&page=2");
  const trigger = page.getByRole("button", { name: /Rows per page/ });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("option")).toHaveCount(3);
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(page.locator("#pager-range")).toHaveText(
    "1–6 of 60 records · Page 1 of 10",
  );
  await expect(trigger).toBeFocused();
});

test("unknown total has only previous/next and honors explicit next even on an empty page", async ({
  page,
}) => {
  await page.goto("/?scenario=unknown&page=6");
  await expect(page.locator("#pager-range")).toHaveText(
    "No range is available for the displayed page. · Page 7",
  );
  await expect(page.locator("nav button")).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Next page", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  expect(
    await page.evaluate(
      () => window.pagerTest.snapshot().state.query.pagination.pageIndex,
    ),
  ).toBe(7);
  await page.goto("/?scenario=unknown&next=false");
  await expect(
    page.getByRole("button", { name: "Next page", exact: true }),
  ).toBeDisabled();
});

test("null snapshot is unavailable, not zero; real zero is 0..0 with no Page 1 of 0", async ({
  page,
}) => {
  await page.goto("/?scenario=null");
  await expect(page.locator("#pager-range")).toHaveText(
    "Pagination details are not available yet.",
  );
  await expect(page.getByText("No pages", { exact: false })).toHaveCount(0);
  await page.goto("/?scenario=zero");
  await expect(page.locator("#pager-range")).toHaveText(
    "0–0 of 0 records · No pages",
  );
  await expect(page.locator("nav button")).toHaveCount(2);
});

for (const failed of [false, true])
  test(`retained A is never relabeled B (${failed ? "failure" : "pending"})`, async ({
    page,
  }) => {
    await page.goto(`/?scenario=retained${failed ? "&failed" : ""}`);
    await expect(page.locator("#pager-range")).toHaveText(
      "1–10 of 60 records · Page 1 of 6",
    );
    await expect(
      page.getByText(/Showing previous results for the displayed page/),
    ).toBeVisible();
    await expect(page.locator("#pager")).toHaveAttribute("data-stale", "true");
    await expect(
      page.getByRole("button", { name: "Next page", exact: true }),
    ).toBeDisabled();
    if (failed) {
      await page.getByRole("button", { name: "Retry", exact: true }).click();
      const next = await page.evaluate(() => window.pagerTest.snapshot());
      expect(next.transportCount).toBe(1);
      expect(next.request?.query.pagination.pageIndex).toBe(1);
      expect(next.resource).toBe("pending");
      await page.evaluate(() => window.pagerTest.succeed());
      await expect(page.locator("#pager-range")).toHaveText(
        "11–20 of 60 records · Page 2 of 6",
      );
    } else
      await expect(page.locator("#pager")).toHaveAttribute("data-busy", "true");
  });

test("Retry is absent without a supplied application wrapper", async ({
  page,
}) => {
  await page.goto("/?scenario=retained&failed&noRetry");
  await expect(
    page.getByRole("button", { name: "Retry", exact: true }),
  ).toHaveCount(0);
});

test("old connected callback in same turn cannot navigate an accepted newer query", async ({
  page,
}) => {
  await page.goto("/?scenario=client");
  await expect(page.locator("#pager-next")).toBeEnabled();
  const index = await page.evaluate(() => {
    window.pagerTest.externalPage(2);
    document.getElementById("pager-next")?.click();
    return window.pagerTest.snapshot().state.query.pagination.pageIndex;
  });
  expect(index).toBe(2);
});

test("old connected callback rechecks same-query changed hasNext metadata", async ({
  page,
}) => {
  await page.goto("/?scenario=unknown");
  await expect(page.locator("#pager-next")).toBeEnabled();
  const index = await page.evaluate(() => {
    window.pagerTest.begin();
    window.pagerTest.succeed(60, false);
    document.getElementById("pager-next")?.click();
    return window.pagerTest.snapshot().state.query.pagination.pageIndex;
  });
  expect(index).toBe(0);
  await expect(page.locator("#pager-next")).toBeDisabled();
});

test("old connected callback cannot cross a scope change", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#pager-next")).toBeEnabled();
  const index = await page.evaluate(() => {
    window.pagerTest.changeScope();
    document.getElementById("pager-next")?.click();
    return window.pagerTest.snapshot().state.query.pagination.pageIndex;
  });
  expect(index).toBe(0);
  await expect(page.locator("#pager-range")).toHaveText(
    "Pagination details are not available yet.",
  );
});

test("removed numbered target recovers meaningful focus without stealing external focus", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#pager-page-5").focus();
  await page.evaluate(() => {
    window.pagerTest.begin();
    window.pagerTest.succeed(12);
  });
  await expect(page.locator("#pager-page-1")).toBeFocused();
  await page.locator("#outside").focus();
  await page.evaluate(() => {
    window.pagerTest.begin();
    window.pagerTest.succeed(1);
  });
  await expect(page.locator("#outside")).toBeFocused();
});

test("out-of-range known metadata stays truthful without opt-in correction", async ({
  page,
}) => {
  await page.goto("/?page=4&total=12");
  await expect(page.locator("#pager-range")).toHaveText(
    "No range is available for the displayed page. 12 records in total. · Displayed page 5 is outside the current 2 pages.",
  );
  expect(
    await page.evaluate(() => window.pagerTest.snapshot().commits),
  ).toEqual([]);
  await page.getByRole("button", { name: "Page 2", exact: true }).click();
  expect(
    await page.evaluate(
      () => window.pagerTest.snapshot().state.query.pagination.pageIndex,
    ),
  ).toBe(1);
});

test("current authoritative shrink corrects once outside render, contradictory totals cannot loop", async ({
  page,
}) => {
  await page.goto("/?page=4&total=12&auto");
  await expect
    .poll(() =>
      page.evaluate(
        () => window.pagerTest.snapshot().state.query.pagination.pageIndex,
      ),
    )
    .toBe(1);
  expect(
    await page.evaluate(() => window.pagerTest.snapshot().commits),
  ).toEqual(["pagination.clamp"]);
  await page.evaluate(() => {
    window.pagerTest.begin();
    window.pagerTest.succeed(1);
  });
  await expect(page.getByText(/outside the current 1 pages/)).toBeVisible();
  await page.evaluate(() => window.pagerTest.tick());
  expect(
    await page.evaluate(() => window.pagerTest.snapshot().commits),
  ).toEqual(["pagination.clamp"]);
  expect(
    await page.evaluate(
      () => window.pagerTest.snapshot().state.query.pagination.pageIndex,
    ),
  ).toBe(1);
});

test("controlled proposed/rejected correction spends the chain; acceptance does not reopen it", async ({
  page,
}) => {
  await page.goto("/?page=4&total=12&auto&controlled");
  await expect
    .poll(() => page.evaluate(() => window.pagerTest.snapshot().proposals))
    .toBe(1);
  await page.evaluate(() => window.pagerTest.reject());
  await page.evaluate(() => window.pagerTest.tick());
  expect(await page.evaluate(() => window.pagerTest.snapshot().proposals)).toBe(
    1,
  );
  expect(
    await page.evaluate(
      () => window.pagerTest.snapshot().state.query.pagination.pageIndex,
    ),
  ).toBe(4);
  await page.goto("/?page=4&total=12&auto&controlled");
  await expect
    .poll(() => page.evaluate(() => window.pagerTest.snapshot().proposals))
    .toBe(1);
  await page.evaluate(() => window.pagerTest.accept());
  await page.evaluate(() => {
    window.pagerTest.begin();
    window.pagerTest.succeed(1);
  });
  await page.evaluate(() => window.pagerTest.tick());
  expect(await page.evaluate(() => window.pagerTest.snapshot().proposals)).toBe(
    1,
  );
});

test("external navigation epoch starts a new chain, unlike automatic target responses", async ({
  page,
}) => {
  await page.goto("/?page=4&total=12&auto");
  await expect
    .poll(() => page.evaluate(() => window.pagerTest.snapshot().commits.length))
    .toBe(1);
  await page.evaluate(() => {
    window.pagerTest.externalPage(3);
    window.pagerTest.begin();
    window.pagerTest.succeed(1);
  });
  await expect
    .poll(() =>
      page.evaluate(
        () => window.pagerTest.snapshot().state.query.pagination.pageIndex,
      ),
    )
    .toBe(0);
  expect(
    await page.evaluate(
      () =>
        window.pagerTest
          .snapshot()
          .commits.filter((reason) => reason === "pagination.clamp").length,
    ),
  ).toBe(2);
});

test("epoch invalidated before a passive correction effect prevents stale clamp", async ({
  page,
}) => {
  await page.goto("/?page=4&total=12&auto&invalidateEffect");
  await expect(page.locator("#pager-range")).toContainText("outside");
  expect(
    await page.evaluate(() => window.pagerTest.snapshot().commits),
  ).toEqual([]);
});

test("StrictMode callback rejection also spends a correction chain", async ({
  page,
}) => {
  await page.goto("/?page=4&total=12&auto&controlled&callbackRejected&strict");
  await expect
    .poll(() => page.evaluate(() => window.pagerTest.snapshot().proposals))
    .toBe(1);
  await page.evaluate(() => window.pagerTest.tick());
  expect(await page.evaluate(() => window.pagerTest.snapshot().proposals)).toBe(
    1,
  );
  expect(
    await page.evaluate(
      () => window.pagerTest.snapshot().state.query.pagination.pageIndex,
    ),
  ).toBe(4);
});

for (const invalidateEffect of ["query", "scope"])
  test(`accepted ${invalidateEffect} invalidates an old scheduled correction`, async ({
    page,
  }) => {
    await page.goto(
      `/?page=4&total=12&auto&invalidateEffect=${invalidateEffect}`,
    );
    await expect(page.locator("#pager")).toBeVisible();
    expect(
      await page.evaluate(() =>
        window.pagerTest
          .snapshot()
          .commits.filter((reason) => reason === "pagination.clamp"),
      ),
    ).toEqual([]);
    if (invalidateEffect === "query")
      expect(
        await page.evaluate(
          () => window.pagerTest.snapshot().state.query.pagination.pageIndex,
        ),
      ).toBe(2);
  });

test("same-query new metadata invalidates a scheduled old total, then corrects to the current bound", async ({
  page,
}) => {
  await page.goto("/?page=4&total=12&auto&invalidateEffect=metadata");
  await expect
    .poll(() =>
      page.evaluate(
        () => window.pagerTest.snapshot().state.query.pagination.pageIndex,
      ),
    )
    .toBe(3);
  expect(
    await page.evaluate(() => window.pagerTest.snapshot().commits),
  ).toEqual(["pagination.clamp"]);
});

test("same-query request-generation ABA invalidates the old correction target", async ({
  page,
}) => {
  await page.goto("/?page=4&total=12&auto&invalidateEffect=request-aba");
  await expect
    .poll(() =>
      page.evaluate(
        () => window.pagerTest.snapshot().state.query.pagination.pageIndex,
      ),
    )
    .toBe(3);
  const value = await page.evaluate(() => window.pagerTest.snapshot());
  expect(value.commits).toEqual(["pagination.clamp"]);
  expect(value.request?.generation).toBe(3);
});

test("zero-total shrink corrects to index zero without inventing Page 1 of 0", async ({
  page,
}) => {
  await page.goto("/?scenario=zero&page=4&auto");
  await expect
    .poll(() =>
      page.evaluate(
        () => window.pagerTest.snapshot().state.query.pagination.pageIndex,
      ),
    )
    .toBe(0);
  expect(
    await page.evaluate(() => window.pagerTest.snapshot().commits),
  ).toEqual(["pagination.clamp"]);
});

for (const scenario of ["unknown", "retained", "null"])
  test(`correction refuses non-authoritative ${scenario}`, async ({ page }) => {
    await page.goto(
      `/?scenario=${scenario}&auto&page=4${scenario === "retained" ? "&failed" : ""}`,
    );
    await expect(page.locator("#pager")).toBeVisible();
    expect(
      await page.evaluate(() =>
        window.pagerTest
          .snapshot()
          .commits.filter((reason) => reason === "pagination.clamp"),
      ),
    ).toEqual([]);
  });

for (const rtl of [false, true])
  for (const dark of [false, true])
    test(`320px ${rtl ? "Arabic RTL" : "English LTR"} ${dark ? "dark" : "light"} wraps, works by keyboard and passes axe`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 760 });
      await page.goto(
        `/?scenario=client${rtl ? "&rtl" : ""}${dark ? "&dark" : ""}`,
      );
      const trigger = page.getByRole("button", {
        name: rtl ? /عدد الصفوف/ : /Rows per page/,
      });
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({
        path: `tests/controls/pagination/.artifacts/${rtl ? "rtl" : "ltr"}-${dark ? "dark" : "light"}-320-initial.png`,
        fullPage: true,
      });
      await trigger.focus();
      await page.keyboard.press("Enter");
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.keyboard.press("End");
      await page.keyboard.press("Enter");
      await expect(trigger).toBeFocused();
      expect(
        await page.evaluate(
          () => window.pagerTest.snapshot().state.query.pagination.pageSize,
        ),
      ).toBe(100);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const result = await new AxeBuilder({ page }).analyze();
      expect(result.violations).toEqual([]);
      await page.screenshot({
        path: `tests/controls/pagination/.artifacts/${rtl ? "rtl" : "ltr"}-${dark ? "dark" : "light"}-320.png`,
        fullPage: true,
      });
    });

test("all reference widths and 200% text keep every control reachable", async ({
  page,
}) => {
  await page.goto("/?scenario=client");
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator("#pager-next")).toBeVisible();
    expect(
      await page.evaluate(() => {
        const buttons = [
          ...document.querySelectorAll<HTMLButtonElement>("#pager button"),
        ];
        return (
          document.documentElement.scrollWidth <= innerWidth &&
          buttons.every((button) => {
            const rect = button.getBoundingClientRect();
            return rect.left >= 0 && rect.right <= innerWidth;
          })
        );
      }),
    ).toBe(true);
    await page.screenshot({
      path: `tests/controls/pagination/.artifacts/known-${width}.png`,
      fullPage: true,
    });
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Next page", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#pager-range")).toContainText("Page 2 of 6");
});
