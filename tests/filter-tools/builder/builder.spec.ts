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

async function addRule(page: Page, field: string, operator: string) {
  await page.getByRole("button", { name: /^Add filter rule(?::|$)/ }).click();
  await page.getByRole("option", { name: field, exact: true }).click();
  await page.getByRole("option", { name: operator, exact: true }).click();
}
// Synthetic application completions/authorization changes may arrive while a
// modal picker is open. This deliberately invokes the fixture's app-owned port,
// not an inaccessible user interaction through the overlay.
async function appAction(page: Page, name: string) {
  await page
    .locator("nav button")
    .getByText(name, { exact: true })
    .evaluate((button) => {
      if (button instanceof HTMLButtonElement) button.click();
    });
}
async function confirmNumber(page: Page, operator: string, value: string) {
  await addRule(page, "Amount", operator);
  await page.getByRole("textbox", { name: "Value", exact: true }).fill(value);
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
test("builder fields exclude independent owners and confirmed number preserves zero", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: /^Add filter rule(?::|$)/ }).click();
  await expect(
    page.getByRole("option", { name: "searchText", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("option", { name: "tabState", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("option", { name: "bookedAt", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("option", { name: "Amount", exact: true }).click();
  await page.getByRole("option", { name: "equals", exact: true }).click();
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("0");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByLabel("Result IDs")).toHaveText("a");
  await expect(page.getByLabel("Applied rules")).toContainText('"value":0');
  expect(errors).toEqual([]);
});
test("invalid numeric drafts and Cancel preserve accepted query", async ({
  page,
}) => {
  await page.goto("/");
  await addRule(page, "Amount", "is greater than");
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("1e999");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Enter a valid filter value.",
  );
  await expect(page.getByLabel("Applied rules")).toHaveText(
    '{"join":"and","rules":[]}',
  );
  await page.getByRole("button", { name: "Cancel filter edit" }).click();
  await expect(
    page.getByRole("button", { name: /^Add filter rule(?::|$)/ }),
  ).toBeFocused();
});
test("scalar choices preserve numeric zero and valueless boolean commits without editor", async ({
  page,
}) => {
  await page.goto("/");
  await addRule(page, "Status", "is");
  await page.getByRole("option", { name: "Zero", exact: true }).click();
  await expect(page.getByLabel("Applied rules")).toContainText('"value":0');
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await addRule(page, "Enabled", "is false");
  await expect(page.getByLabel("Applied rules")).toContainText(
    '"operator":"boolean.isFalse"',
  );
  await expect(page.getByLabel("Applied rules")).not.toContainText(
    '"value":false',
  );
  await expect(page.getByLabel("Result IDs")).toHaveText("a");
});

test("Any and independent same-field IDs drive actual native results", async ({
  page,
}) => {
  await page.goto("/");
  await confirmNumber(page, "is greater than", "20");
  await confirmNumber(page, "is less than", "5");
  await expect(page.getByLabel("Result IDs")).toHaveText("");
  await expect(page.locator("[data-rule-id]")).toHaveCount(2);
  const ids = await page
    .locator("[data-rule-id]")
    .evaluateAll((rules) =>
      rules.map((rule) => rule.getAttribute("data-rule-id")),
    );
  expect(new Set(ids).size).toBe(2);
  await page.getByRole("button", { name: "Any", exact: true }).click();
  await expect(page.getByLabel("Result IDs")).toHaveText("a,c");
  await expect(
    page.getByRole("button", { name: "Any", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const selectedBackground = await page
    .getByRole("button", { name: "Any", exact: true })
    .evaluate((button) => getComputedStyle(button).backgroundColor);
  const unselectedBackground = await page
    .getByRole("button", { name: "All", exact: true })
    .evaluate((button) => getComputedStyle(button).backgroundColor);
  expect(selectedBackground).not.toBe(unselectedBackground);
});

test("Duplicate Negate Remove and builder-only Clear preserve independent criteria and join", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Seed independent criteria" }).click();
  await expect(page.getByLabel("Independent criteria")).toContainText(
    '"search":"a"',
  );
  const independent = await page
    .getByLabel("Independent criteria")
    .textContent();
  await confirmNumber(page, "is greater than", "1");
  await page.getByRole("button", { name: "Any", exact: true }).click();
  await page
    .getByRole("button", { name: "Rule options: Amount", exact: true })
    .click();
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  await expect(page.locator("[data-rule-id]")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Rule options: Amount", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Negate", exact: true }).click();
  await expect(page.getByLabel("Applied rules")).toContainText(
    '"operator":"number.lte"',
  );
  await page
    .getByRole("button", { name: "Rule options: Amount", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(page.locator("[data-rule-id]")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Field: Amount", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Clear filter-builder rules", exact: true })
    .click();
  await expect(page.getByLabel("Applied rules")).toHaveText(
    '{"join":"or","rules":[]}',
  );
  await expect(page.getByLabel("Independent criteria")).toHaveText(
    independent ?? "",
  );
  await expect(
    page.getByRole("button", { name: /^Add filter rule(?::|$)/ }),
  ).toBeFocused();
});

test("text preserves whitespace and number/range drafts never coerce blanks or nonfinite values", async ({
  page,
}) => {
  await page.goto("/");
  await addRule(page, "Name", "contains");
  await page.getByRole("textbox", { name: "Value", exact: true }).fill(" ");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByLabel("Applied rules")).toContainText('"value":" "');
  await page
    .getByRole("button", { name: "Clear filter-builder rules", exact: true })
    .click();
  await addRule(page, "Amount", "is between");
  await page.getByRole("textbox", { name: "From", exact: true }).fill("0");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Complete the filter value.",
  );
  await page.getByRole("textbox", { name: "To", exact: true }).fill("Infinity");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Enter a valid filter value.",
  );
  await page.getByRole("textbox", { name: "To", exact: true }).fill("10");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByLabel("Applied rules")).toContainText(
    '"value":[0,10]',
  );
  await expect(page.getByLabel("Result IDs")).toHaveText("a,b");
});

test("membership is accepted-controlled and final deselection removes only its rule", async ({
  page,
}) => {
  await page.goto("/");
  await addRule(page, "Tags", "contains any of");
  await expect(page.getByLabel("Applied rules")).toHaveText(
    '{"join":"and","rules":[]}',
  );
  await page.getByRole("option", { name: "Tag zero", exact: true }).click();
  await expect(page.getByLabel("Applied rules")).toContainText('"value":[0]');
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: /^Value: Tags(?::|$)/ }).click();
  await expect(
    page.getByRole("option", { name: "Tag zero", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("option", { name: "Tag zero", exact: true }).click();
  await expect(page.getByLabel("Applied rules")).toHaveText(
    '{"join":"and","rules":[]}',
  );
  await expect(
    page.getByRole("button", { name: /^Add filter rule(?::|$)/ }),
  ).toBeFocused();
});

test("confirmed proposals close as submitted, rejection has no optimistic chip or waiting mirror", async ({
  page,
}) => {
  await page.goto("/");
  await confirmNumber(page, "equals", "10");
  await page
    .getByRole("button", { name: "Hold proposals", exact: true })
    .click();
  await page.getByRole("button", { name: /^Value: Amount(?::|$)/ }).click();
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("20");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByLabel("Applied rules")).toContainText('"value":10');
  await expect(page.getByLabel("Mutation observation")).toHaveText(
    "builder.commit:proposed",
  );
  await page
    .getByRole("button", { name: "Reject proposal", exact: true })
    .click();
  await page.getByRole("button", { name: /^Value: Amount(?::|$)/ }).click();
  await expect(
    page.getByRole("textbox", { name: "Value", exact: true }),
  ).toHaveValue("10");
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("20");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await page
    .getByRole("button", { name: "Accept proposal", exact: true })
    .click();
  await expect(page.getByLabel("Applied rules")).toContainText('"value":20');
  await expect(page.getByLabel("Result IDs")).toHaveText("");
});

test("callback rejection is safe and Cancel Escape backdrop are draft-only exits", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await confirmNumber(page, "equals", "10");
  const accepted = await page.getByLabel("Applied rules").textContent();
  await page
    .getByRole("button", { name: "Toggle callback failure", exact: true })
    .click();
  await page.getByRole("button", { name: /^Value: Amount(?::|$)/ }).click();
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("30");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "The filter change could not be submitted.",
  );
  await expect(page.getByText("private fixture failure")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: /^Value: Amount(?::|$)/ }),
  ).toBeFocused();
  await expect(page.getByLabel("Applied rules")).toHaveText(accepted ?? "");
  await page.getByRole("button", { name: /^Value: Amount(?::|$)/ }).click();
  await page.mouse.click(2, 2);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByLabel("Applied rules")).toHaveText(accepted ?? "");
  expect(errors).toEqual([]);
});

test("custom typed values are confirmed and inverse requiring replacement stays a draft", async ({
  page,
}) => {
  await page.goto("/");
  await addRule(page, "Custom", "minimum");
  await page
    .getByRole("textbox", { name: "Custom minimum", exact: true })
    .fill("10");
  await expect(page.getByLabel("Applied rules")).toHaveText(
    '{"join":"and","rules":[]}',
  );
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByLabel("Applied rules")).toContainText(
    '"value":{"minimum":10}',
  );
  await expect(page.getByLabel("Result IDs")).toHaveText("b,c");
  await page
    .getByRole("button", { name: "Rule options: Custom", exact: true })
    .click();
  await page.getByRole("button", { name: "Negate", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Custom maximum", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Applied rules")).toContainText(
    '"operator":"custom.minimum"',
  );
  await page
    .getByRole("textbox", { name: "Custom minimum", exact: true })
    .fill("0");
  await page
    .getByRole("textbox", { name: "Custom maximum", exact: true })
    .fill("10");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByLabel("Applied rules")).toContainText(
    '"operator":"custom.band"',
  );
  await expect(page.getByLabel("Result IDs")).toHaveText("a,b");
});

test("async choice ABA, selected off-page labels, local failure and Retry never erase the rule", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Seed async rule", exact: true })
    .click();
  await page.getByRole("button", { name: /^Value: Person(?::|$)/ }).click();
  await expect(
    page.getByRole("option", { name: "Person scope one", exact: true }),
  ).toBeVisible();
  const search = page.getByRole("textbox", {
    name: "Search options",
    exact: true,
  });
  await search.fill("A");
  await search.fill("B");
  await search.fill("A");
  await appAction(page, "Resolve oldest options");
  await expect(page.getByText("STALE PRIVATE LABEL")).toHaveCount(0);
  await expect(
    page.getByRole("status").filter({ hasText: "Loading options." }),
  ).toBeVisible();
  await appAction(page, "Resolve latest options");
  await expect(page.getByRole("option", { name: /A one/ })).toBeVisible();
  await expect(
    page.getByRole("option", { name: "Person scope one", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await search.fill("failure");
  await appAction(page, "Fail latest options");
  await expect(page.getByRole("alert")).toContainText(
    "Options could not be loaded.",
  );
  await expect(
    page.getByRole("option", { name: "Person scope one", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Applied rules")).toContainText('"value":[99]');
  await page
    .getByRole("button", { name: "Retry options", exact: true })
    .click();
  await appAction(page, "Resolve latest options");
  await expect(page.getByRole("option", { name: /failure one/ })).toBeVisible();
  await page.getByRole("button", { name: "Cancel filter edit" }).click();
  await expect(page.getByLabel("Option source state")).toContainText(
    "ready/true",
  );
  await expect(
    page.getByRole("button", { name: /^Value: Person(?::|$)/ }),
  ).toContainText("Person scope one");
});

test("scope/access/epoch invalidate draft and option labels without permission restoration", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Seed async rule", exact: true })
    .click();
  await page.getByRole("button", { name: /^Value: Person(?::|$)/ }).click();
  await expect(
    page.getByRole("option", { name: "Person scope one", exact: true }),
  ).toBeVisible();
  await appAction(page, "Change scope");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Person scope one", { exact: true })).toHaveCount(
    0,
  );
  await appAction(page, "Resolve oldest options");
  await expect(page.getByText("STALE PRIVATE LABEL")).toHaveCount(0);
  await page.getByRole("button", { name: /^Value: Person(?::|$)/ }).click();
  await expect(
    page.getByRole("option", { name: "Person scope two", exact: true }),
  ).toBeVisible();
  await appAction(page, "Lose option access");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /^Value: Person(?::|$)/ }),
  ).toContainText("Unavailable");
  await expect(page.getByLabel("Option source state")).toContainText("false");
  await page.getByRole("button", { name: /^Value: Person(?::|$)/ }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByLabel("Option source state")).toContainText("false");
});

test("320px RTL wraps whole rules with contained overlays and no page overflow", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle RTL", exact: true }).click();
  await confirmNumber(page, "is greater than", "10");
  await confirmNumber(page, "is less than", "30");
  await expect(page.locator("[data-rule-id]")).toHaveCount(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: /^Value: Amount(?::|$)/ })
    .first()
    .click();
  const box = await page.getByRole("dialog").boundingBox();
  expect(box?.x).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
  await page.screenshot({ path: testInfo.outputPath("builder-320-rtl.png") });
});

test("draft lifetime ignores unrelated paging but invalidates changed/removed rules and explicit epochs", async ({
  page,
}) => {
  await page.goto("/");
  await confirmNumber(page, "equals", "10");
  await page.getByRole("button", { name: /^Value: Amount(?::|$)/ }).click();
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("12");
  await appAction(page, "External page change");
  await expect(
    page.getByRole("textbox", { name: "Value", exact: true }),
  ).toHaveValue("12");
  await appAction(page, "External rule change");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByLabel("Applied rules")).toContainText('"value":30');
  await page.getByRole("button", { name: /^Value: Amount(?::|$)/ }).click();
  await expect(
    page.getByRole("textbox", { name: "Value", exact: true }),
  ).toHaveValue("30");
  await appAction(page, "Invalidate builder drafts");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: /^Value: Amount(?::|$)/ }).click();
  await appAction(page, "External rule removal");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /^Add filter rule(?::|$)/ }),
  ).toBeFocused();
});

test("only allowed inverses appear and field/operator changes never coerce the prior operand", async ({
  page,
}) => {
  await page.goto("/");
  await addRule(page, "Name", "contains");
  await page.getByRole("textbox", { name: "Value", exact: true }).fill("Alpha");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await page
    .getByRole("button", { name: "Rule options: Name", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Negate", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Cancel filter edit", exact: true })
    .click();
  await page.getByRole("button", { name: "Field: Name", exact: true }).click();
  await page.getByRole("option", { name: "Amount", exact: true }).click();
  await page.getByRole("option", { name: "equals", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Value", exact: true }),
  ).toHaveValue("");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Complete the filter value.",
  );
  await expect(page.getByLabel("Applied rules")).toContainText(
    '"field":"name"',
  );
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Result IDs")).toHaveText("a");
});

test("immediate proposals keep accepted option state through delayed accept and rejection", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Hold proposals", exact: true })
    .click();
  await addRule(page, "Tags", "contains any of");
  await page.getByRole("option", { name: "Tag zero", exact: true }).click();
  await expect(
    page.getByRole("option", { name: "Tag zero", exact: true }),
  ).toHaveAttribute("aria-selected", "false");
  await expect(page.getByLabel("Applied rules")).toHaveText(
    '{"join":"and","rules":[]}',
  );
  await appAction(page, "Reject proposal");
  await expect(
    page.getByRole("option", { name: "Tag zero", exact: true }),
  ).toHaveAttribute("aria-selected", "false");
  await page.getByRole("option", { name: "Tag zero", exact: true }).click();
  await appAction(page, "Accept proposal");
  await expect(page.getByLabel("Applied rules")).toContainText('"value":[0]');
  await page.getByRole("button", { name: /^Value: Tags(?::|$)/ }).click();
  await expect(
    page.getByRole("option", { name: "Tag zero", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("option", { name: "Tag one", exact: true }).click();
  await expect(
    page.getByRole("option", { name: "Tag one", exact: true }),
  ).toHaveAttribute("aria-selected", "false");
  await appAction(page, "Reject proposal");
  await expect(page.getByLabel("Applied rules")).toContainText('"value":[0]');
  await page.keyboard.press("Escape");
});

test("builder mutation atomically resets page and selection without selection Cancel", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Seed selection and page", exact: true })
    .click();
  await expect(page.getByLabel("Accepted selection")).toHaveText("offpage");
  await expect(page.getByLabel("Accepted page")).toHaveText("1");
  await confirmNumber(page, "is greater than", "0");
  await expect(page.getByLabel("Accepted selection")).toHaveText("");
  await expect(page.getByLabel("Accepted page")).toHaveText("0");
  await expect(page.getByLabel("Result IDs")).toHaveText("b,c");
});

test("each rule segment is keyboard reachable and the overlay traps focus until draft Cancel", async ({
  page,
}) => {
  await page.goto("/");
  await confirmNumber(page, "equals", "10");
  await page
    .getByRole("button", { name: "Field: Amount", exact: true })
    .focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Operator: equals", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: /^Value: Amount(?::|$)/ }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Rule options: Amount", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  for (let step = 0; step < 8; step++) await page.keyboard.press("Tab");
  expect(
    await page
      .getByRole("dialog")
      .evaluate((dialog) => dialog.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Rule options: Amount", exact: true }),
  ).toBeFocused();
});

test("light/dark builder stays contained across documented widths and enlarged text", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await confirmNumber(page, "is greater than", "10");
  await confirmNumber(page, "is less than", "30");
  for (const dark of [false, true]) {
    await page
      .locator("html")
      .evaluate(
        (html, enabled) => html.classList.toggle("dark", enabled),
        dark,
      );
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page
          .locator(".tw-filter-builder")
          .evaluate((builder) => builder.scrollWidth <= builder.clientWidth),
      ).toBe(true);
    }
    await page.locator(".tw-filter-builder").screenshot({
      path: testInfo.outputPath(`builder-320-${dark ? "dark" : "light"}.png`),
    });
  }
  await page.addStyleTag({ content: "html {font-size:125%;}" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("real date day segments keep incomplete/invalid drafts out of accepted rules and reopen the accepted seed", async ({
  page,
}) => {
  await page.goto("/");
  await addRule(page, "Happened", "is on");
  const segments = page.getByRole("spinbutton");
  await expect(segments).toHaveCount(3);
  await segments.nth(0).pressSequentially("11");
  await segments.nth(1).pressSequentially("24");
  await expect(
    page.getByRole("button", { name: "Apply filter", exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel("Applied rules")).toHaveText(
    '{"join":"and","rules":[]}',
  );
  await segments.nth(2).pressSequentially("2026");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByLabel("Applied rules")).toContainText(
    '"value":{"kind":"day","value":"2026-11-24"}',
  );
  await expect(page.getByLabel("Result IDs")).toHaveText("a");
  await page.getByRole("button", { name: /^Value: Happened(?::|$)/ }).click();
  await segments.nth(0).press("2");
  await segments.nth(1).pressSequentially("30");
  await segments.nth(1).press("Tab");
  await expect(
    page.getByRole("button", { name: "Apply filter", exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel("Result IDs")).toHaveText("a");
  await page
    .getByRole("button", { name: "Cancel filter edit", exact: true })
    .click();
  await page.getByRole("button", { name: /^Value: Happened(?::|$)/ }).click();
  await expect(
    page.getByRole("button", { name: "Apply filter", exact: true }),
  ).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Applied rules")).toContainText('"2026-11-24"');
});

test("real date range confirms both endpoints and cardinality changes require a replacement operand", async ({
  page,
}) => {
  await page.goto("/");
  await addRule(page, "Happened", "is between");
  const segments = page.getByRole("spinbutton");
  await expect(segments).toHaveCount(6);
  await segments.nth(0).pressSequentially("11");
  await segments.nth(1).pressSequentially("24");
  await segments.nth(2).pressSequentially("2026");
  await expect(
    page.getByRole("button", { name: "Apply filter", exact: true }),
  ).toBeDisabled();
  await segments.nth(3).pressSequentially("11");
  await segments.nth(4).pressSequentially("25");
  await segments.nth(5).pressSequentially("2026");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByLabel("Result IDs")).toHaveText("a,b");
  await expect(page.getByLabel("Applied rules")).toContainText(
    '"value":[{"kind":"day","value":"2026-11-24"},{"kind":"day","value":"2026-11-25"}]',
  );
  await page
    .getByRole("button", { name: "Operator: is between", exact: true })
    .click();
  await page.getByRole("option", { name: "is on", exact: true }).click();
  await expect(segments).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Apply filter", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Result IDs")).toHaveText("a,b");
});

test("real datetime primitive preserves exact milliseconds and symbolic relative values stay symbolic", async ({
  page,
}) => {
  await page.goto("/");
  await addRule(page, "Timestamp", "is on");
  await page
    .getByRole("combobox", { name: "Date value type" })
    .selectOption("instant");
  await page
    .getByRole("textbox", { name: "Date — Exact date and time" })
    .fill("2026-11-24T03:00:00.123-05:00");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByLabel("Applied rules")).toContainText(
    '"kind":"instant","value":"2026-11-24T03:00:00.123-05:00"',
  );
  await expect(page.getByLabel("Result IDs")).toHaveText("a");
  await page
    .getByRole("button", { name: "Clear filter-builder rules", exact: true })
    .click();
  await addRule(page, "Happened", "is on");
  await page
    .getByRole("combobox", { name: "Date value type" })
    .selectOption("relative");
  await page
    .getByRole("combobox", { name: "Relative date preset" })
    .selectOption({ label: "Today" });
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByLabel("Applied rules")).toContainText(
    '"value":{"kind":"relative","preset":"today"}',
  );
  await expect(page.getByLabel("Result IDs")).toHaveText("a");
});

test("changing a date rule to a valueless operator drops the operand and mounts no date editor", async ({
  page,
}) => {
  await page.goto("/");
  await addRule(page, "Happened", "is on");
  await page
    .getByRole("combobox", { name: "Date value type" })
    .selectOption("relative");
  await page
    .getByRole("combobox", { name: "Relative date preset" })
    .selectOption({ label: "Today" });
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await page
    .getByRole("button", { name: "Operator: is on", exact: true })
    .click();
  await page.getByRole("option", { name: "is empty", exact: true }).click();
  await expect(page.getByLabel("Applied rules")).toContainText(
    '"operator":"empty"',
  );
  await expect(page.getByLabel("Applied rules")).not.toContainText('"value"');
  await expect(
    page.getByRole("button", { name: /^Value: Happened(?::|$)/ }),
  ).toHaveCount(0);
  await expect(page.getByRole("spinbutton")).toHaveCount(0);
});

test("async empty page is local and still shows accepted off-page selected labels", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Seed async rule", exact: true })
    .click();
  await page.getByRole("button", { name: /^Value: Person(?::|$)/ }).click();
  await appAction(page, "Resolve empty options");
  await expect(
    page.getByText("No options available.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { name: "Person scope one", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByLabel("Applied rules")).toContainText('"value":[99]');
});

test("explicit client policy disables server-only custom operators while server mode compiles and submits them", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Add filter rule(?::|$)/ }).click();
  await page
    .getByRole("option", { name: "Server amount", exact: true })
    .click();
  await expect(
    page.getByRole("option", { name: "server minimum", exact: true }),
  ).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByLabel("Applied rules")).toHaveText(
    '{"join":"and","rules":[]}',
  );
  await page.goto("/?server");
  await addRule(page, "Server amount", "server minimum");
  await page
    .getByRole("textbox", { name: "Custom minimum", exact: true })
    .fill("25");
  await page.getByRole("button", { name: "Apply filter", exact: true }).click();
  await expect(page.getByLabel("Applied rules")).toContainText(
    '"operator":"custom.server","value":{"minimum":25}',
  );
  // Actual manual/server native input bypasses client filtering; this is not a fabricated server result.
  await expect(page.getByLabel("Result IDs")).toHaveText("a,b,c");
});

for (const strict of [true, false]) {
  test(`option owner preserves hidden work and revokes actual cleanup tokens (${strict ? "StrictMode reveal replay" : "production passive lifetime"})`, async ({
    page,
  }, testInfo) => {
    await page.goto(strict ? "/" : "/?without-strict");
    await page
      .getByRole("button", { name: "Seed async rule", exact: true })
      .click();
    await page.getByRole("button", { name: /^Value: Person(?::|$)/ }).click();
    await expect(
      page.getByRole("option", { name: "Person scope one", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Cancel filter edit", exact: true })
      .click();
    await expect(page.getByLabel("Option source state")).toContainText(
      "pending/true",
    );
    await appAction(page, "Toggle builder Suspense");
    await expect(
      page.getByText("Builder suspended", { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Option source state")).toContainText(
      "pending/true",
    );
    await appAction(page, "Resolve latest options");
    await expect(page.getByLabel("Option source state")).toContainText(
      "ready/true",
    );
    await expect(page.getByLabel("Option selected labels")).toContainText(
      "Person scope one",
    );
    await appAction(page, "Toggle builder Suspense");
    await testInfo.attach("source-after-reveal", {
      body: (await page.locator("body").textContent()) ?? "",
      contentType: "text/plain",
    });
    if (strict) {
      // Dev StrictMode replays a passive cleanup/setup on reveal. Cleanup must
      // invalidate exactly as real unmount; never resurrect that token/label.
      await expect(page.getByLabel("Option source state")).toContainText(
        "idle/true",
      );
      await expect(page.getByLabel("Option selected labels")).not.toContainText(
        "Person scope one",
      );
      await appAction(page, "Resolve latest options");
      await expect(page.getByLabel("Option source state")).toContainText(
        "idle/true",
      );
      await page.getByRole("button", { name: /^Value: Person(?::|$)/ }).click();
      await expect(
        page.getByRole("option", { name: "Person scope one", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Cancel filter edit", exact: true })
        .click();
    } else {
      await expect(page.getByLabel("Option selected labels")).toContainText(
        "Person scope one",
      );
      await expect(page.getByLabel("Option source state")).toContainText(
        "ready/true",
      );
    }
    await expect(page.getByLabel("Option selected labels")).toContainText(
      "Person scope one",
    );
    await expect(
      page.getByRole("button", { name: /^Value: Person(?::|$)/ }),
    ).toContainText("Person scope one");
    await appAction(page, "Toggle builder mount");
    await expect(page.getByLabel("Option source state")).toContainText(
      "idle/false",
    );
    await appAction(page, "Resolve latest options");
    await expect(page.getByLabel("Option source state")).toContainText(
      "idle/false",
    );
    await appAction(page, "Toggle builder mount");
    await expect(
      page.getByRole("button", { name: /^Value: Person(?::|$)/ }),
    ).toContainText("99");
    await expect(
      page.getByRole("button", { name: /^Value: Person(?::|$)/ }),
    ).not.toContainText("Person scope one");
  });
}
