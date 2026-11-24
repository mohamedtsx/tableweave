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

async function appAction(page: Page, name: string) {
  await page
    .locator("nav button")
    .getByText(name, { exact: true })
    .evaluate((button) => {
      if (!(button instanceof HTMLButtonElement))
        throw new Error("Missing app fixture port");
      button.click();
    });
}

for (const membership of [true, false]) {
  test(`n13 static ${membership ? "membership" : "scalar"} Escape dismisses without a query/proposal change`, async ({
    page,
  }, testInfo) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^Add filter rule(?::|$)/ }).click();
    await page
      .getByRole("option", {
        name: membership ? "Tags" : "Status",
        exact: true,
      })
      .click();
    await page
      .getByRole("option", {
        name: membership ? "contains any of" : "is",
        exact: true,
      })
      .click();
    await page
      .getByRole("option", {
        name: membership ? "Tag zero" : "Zero",
        exact: true,
      })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page
      .getByRole("button", {
        name: membership ? /^Value: Tags(?::|$)/ : /^Value: Status(?::|$)/,
      })
      .click();
    const before = await page.evaluate(() => ({
      state: window.builderReview.inspect(),
      results: document.querySelector('[aria-label="Result IDs"]')?.textContent,
    }));
    await page
      .getByRole("option", {
        name: membership ? "Tag zero" : "Zero",
        exact: true,
      })
      .press("Escape");
    const after = await page.evaluate(() => ({
      state: window.builderReview.inspect(),
      results: document.querySelector('[aria-label="Result IDs"]')?.textContent,
    }));
    await testInfo.attach("escape-static", {
      body: JSON.stringify({ before, after }),
      contentType: "application/json",
    });
    expect(after.state.rules).toEqual(before.state.rules);
    expect(after.state.proposalCount).toBe(before.state.proposalCount);
    expect(after.state.requests).toEqual(before.state.requests);
    expect(after.results).toBe(before.results);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("button", {
        name: membership ? /^Value: Tags(?::|$)/ : /^Value: Status(?::|$)/,
      }),
    ).toBeFocused();
    // Space remains a genuine choice action; empty membership is not forbidden.
    await page
      .getByRole("button", {
        name: membership ? /^Value: Tags(?::|$)/ : /^Value: Status(?::|$)/,
      })
      .click();
    await page
      .getByRole("option", {
        name: membership ? "Tag zero" : "Numeric one",
        exact: true,
      })
      .press("Space");
    if (membership)
      await expect(page.getByLabel("Applied rules")).toHaveText(
        '{"join":"and","rules":[]}',
      );
    else
      await expect(page.getByLabel("Applied rules")).toContainText('"value":1');
  });
}

test("n13 async membership Escape does not propose removal or restart requests", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Seed async rule", exact: true })
    .click();
  await page.getByRole("button", { name: /^Value: Person(?::|$)/ }).click();
  await page.evaluate(() => {
    if (!window.builderReview.settleOptions([{ id: 1, label: "Current one" }]))
      throw new Error("Missing ready source");
  });
  await appAction(page, "Hold proposals");
  const before = await page.evaluate(() => window.builderReview.inspect());
  const results = await page.getByLabel("Result IDs").textContent();
  await page
    .getByRole("option", { name: "Person scope one", exact: true })
    .press("Escape");
  const after = await page.evaluate(() => window.builderReview.inspect());
  await testInfo.attach("escape-async", {
    body: JSON.stringify({ before, after }),
    contentType: "application/json",
  });
  expect(after.rules).toEqual(before.rules);
  expect(after.proposalCount).toBe(before.proposalCount);
  expect(after.pending).toBe(false);
  expect(after.requests).toEqual(before.requests);
  await expect(page.getByLabel("Result IDs")).toHaveText(results ?? "");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /^Value: Person(?::|$)/ }),
  ).toBeFocused();
});

test("n14 axe detects no label-in-name mismatch for add and numeric/text value triggers", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await appAction(page, "Hold proposals");
  await page.evaluate(() => {
    window.builderReview.dispatchAndAccept({
      type: "builder.commit",
      rule: {
        id: "amount-label",
        field: "amount",
        operator: "number.eq",
        value: 30,
      },
    });
    window.builderReview.dispatchAndAccept({
      type: "builder.commit",
      rule: {
        id: "note-label",
        field: "note",
        operator: "text.contains",
        value: "alpha",
      },
    });
  });
  await expect(page.locator("[data-rule-id]")).toHaveCount(2);
  const report = await new AxeBuilder({ page })
    .include(".tw-filter-builder")
    .analyze();
  await testInfo.attach("builder-axe", {
    body: JSON.stringify(report.violations),
    contentType: "application/json",
  });
  expect(report.violations).toEqual([]);
  await expect(
    page.getByRole("button", { name: "Add filter rule: Filters", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Value: Amount: 30", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Value: Note (hidden column): alpha",
      exact: true,
    }),
  ).toBeVisible();
});

test("n14 rich formatter names preserve rendered zero/false text, raw whitespace and valueless Boolean", async ({
  page,
}, testInfo) => {
  await page.goto("/?rich");
  await appAction(page, "Hold proposals");
  await page.evaluate(() => {
    window.builderReview.dispatchAndAccept({
      type: "builder.commit",
      rule: {
        id: "rich-zero",
        field: "amount",
        operator: "number.eq",
        value: 0,
      },
    });
    window.builderReview.dispatchAndAccept({
      type: "builder.commit",
      rule: {
        id: "rich-alpha",
        field: "note",
        operator: "text.contains",
        value: "alpha",
      },
    });
    window.builderReview.dispatchAndAccept({
      type: "builder.commit",
      rule: {
        id: "rich-false",
        field: "note",
        operator: "text.contains",
        value: "false",
      },
    });
    window.builderReview.dispatchAndAccept({
      type: "builder.commit",
      rule: {
        id: "raw-spaces",
        field: "name",
        operator: "text.contains",
        value: " ",
      },
    });
    window.builderReview.dispatchAndAccept({
      type: "builder.commit",
      rule: {
        id: "valueless-false",
        field: "enabled",
        operator: "boolean.isFalse",
      },
    });
  });
  await expect(
    page.getByRole("button", { name: "Value: Amount: 0 units", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("button", {
        name: "Value: Note (hidden column): alpha note",
        exact: true,
      })
      .locator("em"),
  ).toHaveText("alpha");
  await expect(
    page
      .getByRole("button", {
        name: "Value: Note (hidden column): false note",
        exact: true,
      })
      .locator("em"),
  ).toHaveText("false");
  const whitespace = page
    .locator('[data-rule-id="raw-spaces"]')
    .getByRole("button", { name: /^Value: Name:/ });
  expect(await whitespace.locator("bdi").textContent()).toBe(" ");
  await expect(whitespace).toHaveAccessibleName("Value: Name:");
  await expect(
    page
      .locator('[data-rule-id="valueless-false"]')
      .getByRole("button", { name: /^Value:/ }),
  ).toHaveCount(0);
  await expect(
    page
      .locator('[data-rule-id="valueless-false"]')
      .getByRole("button", { name: "Operator: is false", exact: true }),
  ).toBeVisible();
  const rules = await page.evaluate(() => window.builderReview.inspect().rules);
  expect(rules.find((rule) => rule.id === "rich-zero")?.value).toBe(0);
  expect(rules.find((rule) => rule.id === "rich-false")?.value).toBe("false");
  expect(rules.find((rule) => rule.id === "raw-spaces")?.value).toBe(" ");
  expect(
    rules.find((rule) => rule.id === "valueless-false"),
  ).not.toHaveProperty("value");
  const report = await new AxeBuilder({ page })
    .include(".tw-filter-builder")
    .analyze();
  await testInfo.attach("rich-builder-axe", {
    body: JSON.stringify(report.violations),
    contentType: "application/json",
  });
  expect(report.violations).toEqual([]);
});

test("n14 translated visible text and field context compose matching Arabic names", async ({
  page,
}, testInfo) => {
  await page.goto("/?arabic");
  await appAction(page, "Hold proposals");
  await page.evaluate(() => {
    window.builderReview.dispatchAndAccept({
      type: "builder.commit",
      rule: {
        id: "arabic-zero",
        field: "amount",
        operator: "number.eq",
        value: 0,
      },
    });
    window.builderReview.dispatchAndAccept({
      type: "builder.commit",
      rule: {
        id: "arabic-note",
        field: "note",
        operator: "text.contains",
        value: "alpha",
      },
    });
  });
  await expect(
    page.getByRole("button", { name: "إضافة شرط: الفلاتر", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "الحقل: المبلغ", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "المعامل: يساوي", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "القيمة: المبلغ: 0", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "القيمة: ملاحظة (حقل مخفي): alpha",
      exact: true,
    }),
  ).toBeVisible();
  const report = await new AxeBuilder({ page })
    .include(".tw-filter-builder")
    .analyze();
  await testInfo.attach("arabic-builder-axe", {
    body: JSON.stringify(report.violations),
    contentType: "application/json",
  });
  expect(report.violations).toEqual([]);
});

test("builder Apply uses the actual shared confirm helper in light and dark", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await appAction(page, "Hold proposals");
  await page.evaluate(() =>
    window.builderReview.dispatchAndAccept({
      type: "builder.commit",
      rule: {
        id: "confirm-style",
        field: "amount",
        operator: "number.eq",
        value: 10,
      },
    }),
  );
  await page.getByRole("button", { name: /^Value: Amount:/ }).click();
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("0");
  const apply = page.getByRole("button", { name: "Apply filter", exact: true });
  await expect(apply).toBeEnabled();
  await expect(apply).toHaveClass(/tw-confirm-action/);
  for (const dark of [false, true]) {
    await page
      .locator("html")
      .evaluate(
        (html, enabled) => html.classList.toggle("dark", enabled),
        dark,
      );
    const colors = await apply.evaluate((button) => {
      const style = getComputedStyle(button);
      const root = getComputedStyle(document.documentElement);
      return {
        background: style.backgroundColor,
        color: style.color,
        buttonBg: style.getPropertyValue("--button-bg").trim(),
        buttonFg: style.getPropertyValue("--button-fg").trim(),
        foreground: root.getPropertyValue("--foreground").trim(),
        backgroundToken: root.getPropertyValue("--background").trim(),
      };
    });
    expect(colors.buttonBg).toBe(colors.foreground);
    expect(colors.buttonFg).toBe(colors.backgroundToken);
    const report = await new AxeBuilder({ page })
      .include(".tw-filter-popover")
      .analyze();
    await testInfo.attach(`confirm-${dark ? "dark" : "light"}`, {
      body: JSON.stringify({ colors, violations: report.violations }),
      contentType: "application/json",
    });
    expect(report.violations).toEqual([]);
  }
});
