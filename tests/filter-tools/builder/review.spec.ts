import type { Page } from "@playwright/test";

const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(({ page }) => {
  expect(runtimeErrors.get(page)).toEqual([]);
});

import { expect, test } from "@playwright/test";

test("fixture serves real source styles without an in-memory stylesheet rewrite", async ({
  page,
}) => {
  const response = await page.request.get("/fixture.css");
  expect(response.ok()).toBe(true);
  await page.goto("/");
  await expect(page.locator(".tw-filter-builder")).toHaveCSS("display", "flex");
  await expect(page.locator(".tw-filter-builder")).toHaveCSS(
    "flex-wrap",
    "wrap",
  );
});

async function appAction(page: Page, name: string) {
  await page
    .locator("nav button")
    .getByText(name, { exact: true })
    .evaluate((button) => {
      if (!(button instanceof HTMLButtonElement))
        throw new Error("Missing fixture application control");
      button.click();
    });
}
async function appliedAmount(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /^Add filter rule(?::|$)/ }).click();
  await page.getByRole("option", { name: "Amount", exact: true }).click();
  await page.getByRole("option", { name: "equals", exact: true }).click();
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("10");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByLabel("Applied rules")).toContainText('"value":10');
}
async function loadedTermA(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Seed async rule", exact: true })
    .click();
  await page.getByRole("button", { name: /^Value: Person(?::|$)/ }).click();
  await page
    .getByRole("textbox", { name: "Search options", exact: true })
    .fill("A");
  await appAction(page, "Resolve latest options");
  await expect(page.getByRole("option", { name: /^A one/ })).toBeEnabled();
}

test("n5 same-turn external accept then still-connected Apply cannot overwrite the latest rule", async ({
  page,
}, testInfo) => {
  await appliedAmount(page);
  await page
    .getByRole("button", { name: "Hold proposals", exact: true })
    .click();
  await page.getByRole("button", { name: /^Value: Amount(?::|$)/ }).click();
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("12");
  const result = await page.evaluate(() => {
    const apply = [
      ...document.querySelectorAll(".tw-filter-popover button"),
    ].find((button) => button.textContent === "Apply filter");
    if (!(apply instanceof HTMLButtonElement))
      throw new Error("Missing live Apply button");
    window.builderReview.replaceAmount(30);
    const before = window.builderReview.inspect().rules;
    const connected = apply.isConnected;
    apply.click();
    window.builderReview.acceptPending();
    return { before, connected, after: window.builderReview.inspect().rules };
  });
  await testInfo.attach("same-turn-live-dom", {
    body: JSON.stringify(result),
    contentType: "application/json",
  });
  expect(result.connected).toBe(true);
  expect(result.before[0]?.value).toBe(30);
  expect(result.after[0]?.value).toBe(30);
  await expect(page.getByRole("alert")).toContainText("filter changed");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /^Value: Amount(?::|$)/ }),
  ).toBeFocused();
});

test("n6 retained same-key option refresh failure exposes warning and supplied Retry", async ({
  page,
}, testInfo) => {
  await loadedTermA(page);
  await page
    .getByRole("button", { name: "Cancel filter edit", exact: true })
    .click();
  await page.getByRole("button", { name: /^Value: Person(?::|$)/ }).click();
  await page.evaluate(() => window.builderReview.refreshOptions());
  await appAction(page, "Fail latest options");
  const retained = await page.evaluate(
    () => window.builderReview.inspect().options,
  );
  await testInfo.attach("retained-failure", {
    body: JSON.stringify(retained),
    contentType: "application/json",
  });
  expect(retained.kind).toBe("failure");
  expect(retained.display).toBe("options");
  expect(retained.notice).toBe("load-failed");
  expect(retained.canRetry).toBe(true);
  await expect(page.getByRole("option", { name: /^A one/ })).toBeVisible();
  await expect(page.getByRole("option", { name: /^A one/ })).toBeDisabled();
  await expect(
    page.getByRole("option", { name: "Person scope one", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("alert")).toContainText(
    "Options could not be loaded.",
  );
  await page
    .getByRole("button", { name: "Retry options", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () => window.builderReview.inspect().requests.at(-1)?.generation ?? 0,
      ),
    )
    .toBeGreaterThan(retained.request?.generation ?? 0);
  await appAction(page, "Resolve latest options");
  await expect(page.getByRole("option", { name: /^A one/ })).toBeEnabled();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByLabel("Applied rules")).toContainText('"value":[99]');
});

test("n7 reopened Next keeps displayed term and opaque cursor from the same request", async ({
  page,
}, testInfo) => {
  await loadedTermA(page);
  const displayed = await page.evaluate(
    () => window.builderReview.inspect().options.page?.request,
  );
  await page
    .getByRole("button", { name: "Cancel filter edit", exact: true })
    .click();
  await page.getByRole("button", { name: /^Value: Person(?::|$)/ }).click();
  await page.getByRole("button", { name: "Next options", exact: true }).click();
  const next = await page.evaluate(() =>
    window.builderReview.inspect().requests.at(-1),
  );
  await testInfo.attach("page-provenance", {
    body: JSON.stringify({ displayed, next }),
    contentType: "application/json",
  });
  expect(next?.pageKey).toBe(`${displayed?.pageKey}-next`);
  expect(next?.term).toBe(displayed?.term);
  expect(next?.fieldId).toBe(displayed?.fieldId);
  expect(next?.scopeKey).toBe(displayed?.scopeKey);
  expect(next?.generation).toBeGreaterThan(displayed?.generation ?? 0);
  await expect(
    page.getByRole("textbox", { name: "Search options", exact: true }),
  ).toHaveValue("A");
});

for (const action of ["Duplicate", "Negate", "Remove"]) {
  test(`n5 same-turn external replacement invalidates stale ${action}`, async ({
    page,
  }) => {
    await appliedAmount(page);
    await page
      .getByRole("button", { name: "Hold proposals", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Rule options: Amount", exact: true })
      .click();
    const result = await page.evaluate((label) => {
      const actionButton = [
        ...document.querySelectorAll(".tw-filter-popover button"),
      ].find((button) => button.textContent === label);
      if (!(actionButton instanceof HTMLButtonElement))
        throw new Error("Missing live rule action");
      window.builderReview.replaceAmount(30);
      const connected = actionButton.isConnected;
      actionButton.click();
      window.builderReview.acceptPending();
      return { connected, rules: window.builderReview.inspect().rules };
    }, action);
    expect(result.connected).toBe(true);
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0]?.value).toBe(30);
    expect(result.rules[0]?.operator).toBe("number.eq");
    await expect(page.getByRole("alert")).toContainText("filter changed");
    await expect(
      page.getByRole("button", { name: "Rule options: Amount", exact: true }),
    ).toBeFocused();
  });
}

for (const action of ["Clear", "Any"]) {
  test(`n5 same-turn external replacement invalidates stale builder ${action}`, async ({
    page,
  }) => {
    await appliedAmount(page);
    await page
      .getByRole("button", { name: "Hold proposals", exact: true })
      .click();
    const result = await page.evaluate((label) => {
      const actionButton = [
        ...document.querySelectorAll(".tw-filter-builder button"),
      ].find((button) => button.textContent === label);
      if (!(actionButton instanceof HTMLButtonElement))
        throw new Error("Missing live builder action");
      window.builderReview.replaceAmount(30);
      const connected = actionButton.isConnected;
      actionButton.click();
      window.builderReview.acceptPending();
      return { connected, rules: window.builderReview.inspect().rules };
    }, action);
    expect(result.connected).toBe(true);
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0]?.value).toBe(30);
    await expect(
      page.getByRole("button", { name: "All", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("alert")).toContainText("filter changed");
  });
}

for (const option of ["Tag one", "Tag zero"]) {
  test(`n5 same-turn external replacement invalidates stale immediate ${option}`, async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^Add filter rule(?::|$)/ }).click();
    await page.getByRole("option", { name: "Tags", exact: true }).click();
    await page
      .getByRole("option", { name: "contains any of", exact: true })
      .click();
    await page.getByRole("option", { name: "Tag zero", exact: true }).click();
    await expect(page.getByLabel("Applied rules")).toContainText('"value":[0]');
    await page
      .getByRole("button", { name: "Hold proposals", exact: true })
      .click();
    await page.getByRole("button", { name: /^Value: Tags(?::|$)/ }).click();
    const result = await page.evaluate((label) => {
      const choice = [...document.querySelectorAll('[role="option"]')].find(
        (node) => node.textContent === label,
      );
      if (!(choice instanceof HTMLElement))
        throw new Error("Missing live choice");
      const rule = window.builderReview.inspect().rules[0];
      if (!rule) throw new Error("Missing rule");
      window.builderReview.dispatchAndAccept({
        type: "builder.commit",
        rule: { id: rule.id, field: "tags", operator: "set.anyOf", value: [2] },
      });
      const connected = choice.isConnected;
      choice.click();
      window.builderReview.acceptPending();
      return { connected, rules: window.builderReview.inspect().rules };
    }, option);
    expect(result.connected).toBe(true);
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0]?.value).toEqual([2]);
    await expect(page.getByRole("alert")).toContainText("filter changed");
  });
}

test("n5 same-turn external removal cannot be reinserted by stale Apply", async ({
  page,
}) => {
  await appliedAmount(page);
  await page
    .getByRole("button", { name: "Hold proposals", exact: true })
    .click();
  await page.getByRole("button", { name: /^Value: Amount(?::|$)/ }).click();
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("12");
  const result = await page.evaluate(() => {
    const apply = [
      ...document.querySelectorAll(".tw-filter-popover button"),
    ].find((button) => button.textContent === "Apply filter");
    if (!(apply instanceof HTMLButtonElement))
      throw new Error("Missing live Apply");
    const rule = window.builderReview.inspect().rules[0];
    if (!rule) throw new Error("Missing rule");
    window.builderReview.dispatchAndAccept({
      type: "builder.remove",
      ruleId: rule.id,
    });
    const connected = apply.isConnected;
    apply.click();
    window.builderReview.acceptPending();
    return { connected, rules: window.builderReview.inspect().rules };
  });
  expect(result.connected).toBe(true);
  expect(result.rules).toHaveLength(0);
  await expect(page.getByRole("alert")).toContainText("filter changed");
  await expect(
    page.getByRole("button", { name: /^Add filter rule(?::|$)/ }),
  ).toBeFocused();
});

test("n5 same-turn unrelated paging/presentation preserves valid submission and later own acceptance", async ({
  page,
}) => {
  await appliedAmount(page);
  await page
    .getByRole("button", { name: "Hold proposals", exact: true })
    .click();
  await page.getByRole("button", { name: /^Value: Amount(?::|$)/ }).click();
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("12");
  const submitted = await page.evaluate(() => {
    const apply = [
      ...document.querySelectorAll(".tw-filter-popover button"),
    ].find((button) => button.textContent === "Apply filter");
    if (!(apply instanceof HTMLButtonElement))
      throw new Error("Missing live Apply");
    window.builderReview.dispatchAndAccept({
      type: "pagination.change",
      update: { pageIndex: 0, pageSize: 2 },
    });
    window.builderReview.dispatchAndAccept({
      type: "columns.visibility",
      update: { amount: false },
    });
    const connected = apply.isConnected;
    apply.click();
    return { connected, rules: window.builderReview.inspect().rules };
  });
  expect(submitted.connected).toBe(true);
  expect(submitted.rules[0]?.value).toBe(10);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await appAction(page, "Accept proposal");
  await expect(page.getByLabel("Applied rules")).toContainText('"value":12');
  await expect(page.getByLabel("Independent criteria")).toContainText(
    '"pageSize":2',
  );
});

test("n7 still-connected Next refuses a cursor after actual source-context invalidation", async ({
  page,
}) => {
  await loadedTermA(page);
  const result = await page.evaluate(() => {
    const next = [
      ...document.querySelectorAll(".tw-filter-popover button"),
    ].find((button) => button.textContent === "Next options");
    if (!(next instanceof HTMLButtonElement))
      throw new Error("Missing live Next");
    const count = window.builderReview.inspect().requests.length;
    window.builderReview.invalidateOptions();
    const connected = next.isConnected;
    next.click();
    return {
      connected,
      count,
      after: window.builderReview.inspect().requests.length,
      context: window.builderReview.inspect().options.context,
    };
  });
  expect(result.connected).toBe(true);
  expect(result.after).toBe(result.count);
  expect(result.context.scopeKey).toBe("external-scope");
});
