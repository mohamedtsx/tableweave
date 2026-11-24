import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const table = (page: Page) => page.getByTestId("a");
const state = (page: Page) =>
  page.evaluate(() => window.columnFixture.a?.state());
async function sortOpen(page: Page) {
  await table(page).getByRole("button", { name: "Sort", exact: true }).click();
  return page.getByRole("dialog", { name: "Sorting", exact: true });
}
async function columnsOpen(page: Page) {
  await table(page)
    .getByRole("button", { name: "Columns", exact: true })
    .click();
  return page.getByRole("dialog", { name: "Shown columns", exact: true });
}

test("explicit directions, additive priorities including hidden primary, remove and no competing table ARIA", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.columnFixture.a?.sort([{ id: "name", desc: true }]);
    window.columnFixture.a?.hide({ name: false });
  });
  const dialog = await sortOpen(page);
  // Hidden Name remains the processing primary: Beta (amount 1) precedes Alpha.
  await expect(table(page).locator("tbody tr td:nth-child(2)")).toHaveText([
    "1",
    "2",
  ]);
  await expect(
    dialog.getByRole("list", { name: "Sort priority" }),
  ).toContainText("1. Name: Descending (Hidden column)");
  await dialog
    .getByRole("button", { name: "Add ascending: Amount", exact: true })
    .click();
  expect((await state(page))?.sorting).toEqual([
    { id: "name", desc: true },
    { id: "amount", desc: false },
  ]);
  await expect(dialog.getByRole("listitem")).toHaveText([
    "1. Name: Descending (Hidden column)",
    "2. Amount: Ascending",
  ]);
  await dialog
    .getByRole("button", { name: "Add descending: Amount", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Remove: Name", exact: true })
    .click();
  expect((await state(page))?.sorting).toEqual([{ id: "amount", desc: true }]);
  await expect(page.locator("[aria-sort]")).toHaveCount(0);
  await dialog
    .getByRole("button", { name: "Ascending: Name", exact: true })
    .click();
  expect((await state(page))?.sorting).toEqual([{ id: "name", desc: false }]);
  await expect(table(page).locator("tbody tr td:nth-child(2)")).toHaveText([
    "2",
    "1",
  ]);
  expect(
    await page.evaluate(() => window.columnFixture.b?.state().sorting),
  ).toEqual([]);
});

test("schema/native unconfigured fields are disabled with reasons; single default has no additive actions", async ({
  page,
}) => {
  await page.goto("/?single=1");
  const dialog = await sortOpen(page);
  await expect(
    dialog.getByRole("button", { name: "Ascending: Fixed", exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByRole("button", { name: "Ascending: Note", exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByText("Sorting is not enabled for this column", { exact: true }),
  ).toHaveCount(2);
  await expect(dialog.getByRole("button", { name: /^Add / })).toHaveCount(0);
  await dialog
    .getByRole("button", { name: "Descending: Name", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Ascending: Amount", exact: true })
    .click();
  expect((await state(page))?.sorting).toEqual([{ id: "amount", desc: false }]);
});

test("old sort DOM callback respects same-turn accepted sorting, reducer-owned page reset and selection preservation", async ({
  page,
}) => {
  await page.goto("/");
  const dialog = await sortOpen(page);
  const button = dialog.getByRole("button", {
    name: "Add ascending: Amount",
    exact: true,
  });
  await button.evaluate((node) => {
    window.columnFixture.a?.select();
    window.columnFixture.a?.page();
    window.columnFixture.a?.sort([{ id: "name", desc: true }]);
    (node as HTMLButtonElement).click();
  });
  expect((await state(page))?.sorting).toEqual([
    { id: "name", desc: true },
    { id: "amount", desc: false },
  ]);
  expect((await state(page))?.selection).toEqual({ a: true });
  expect((await state(page))?.page).toBe(0);
});

test("chooser includes complete hidden leaves in full order; required reason; preferred header hide preserves all other slices", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.columnFixture.a?.sort([{ id: "name", desc: true }]);
    window.columnFixture.a?.select();
    window.columnFixture.a?.page();
    window.columnFixture.a?.hide({ amount: false });
  });
  const before = await state(page);
  const dialog = await columnsOpen(page);
  await expect(dialog.getByRole("checkbox")).toHaveCount(4);
  await expect(
    dialog.getByRole("checkbox", { name: "Amount", exact: true }),
  ).not.toBeChecked();
  await expect(
    dialog.getByRole("checkbox", { name: "Fixed", exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByRole("checkbox", { name: "Fixed", exact: true }),
  ).toHaveAccessibleDescription("Required column");
  await expect(
    dialog.getByText("Required column", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText(/utility|carrier|Actions|Data/, { exact: true }),
  ).toHaveCount(0);
  await dialog.getByText("Name", { exact: true }).click();
  const after = await state(page);
  expect(after?.visibility).toEqual({ amount: false, name: false });
  expect(after?.order).toEqual(before?.order);
  expect(after?.sorting).toEqual(before?.sorting);
  expect(after?.selection).toEqual(before?.selection);
  expect(after?.page).toBe(before?.page);
  await dialog.getByText("Amount", { exact: true }).click();
  expect((await state(page))?.visibility).toEqual({ name: false });
});

test("old chooser DOM callback preserves same-turn external visibility", async ({
  page,
}) => {
  await page.goto("/");
  const dialog = await columnsOpen(page);
  await dialog
    .getByRole("checkbox", { name: "Name", exact: true })
    .evaluate((node) => {
      window.columnFixture.a?.hide({ amount: false });
      (node as HTMLElement).click();
    });
  expect((await state(page))?.visibility).toEqual({
    name: false,
    amount: false,
  });
});

test("final visible restriction is explained, re-enables after reveal and applies at event time", async ({
  page,
}) => {
  await page.goto("/?final=1");
  const dialog = await columnsOpen(page);
  for (const name of ["Name", "Amount", "Note"])
    await dialog.getByText(name, { exact: true }).click();
  await expect(
    dialog.getByRole("checkbox", { name: "Fixed", exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByText("At least one data column must remain visible", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("checkbox", { name: "Fixed", exact: true }),
  ).toHaveAccessibleDescription("At least one data column must remain visible");
  await dialog.getByText("Name", { exact: true }).click();
  await expect(
    dialog.getByRole("checkbox", { name: "Fixed", exact: true }),
  ).toBeEnabled();
  await dialog
    .getByRole("checkbox", { name: "Fixed", exact: true })
    .evaluate((node) => {
      window.columnFixture.a?.hide({ amount: false, note: false, name: false });
      (node as HTMLElement).click();
    });
  expect((await state(page))?.visibility.fixed).not.toBe(false);
});

for (const kind of ["sort", "columns"] as const)
  test(`controlled ${kind}: proposal/delay/rejection are never accepted UI`, async ({
    page,
  }) => {
    await page.goto("/?controlled=1");
    const dialog =
      kind === "sort" ? await sortOpen(page) : await columnsOpen(page);
    const button =
      kind === "sort"
        ? dialog.getByRole("button", { name: "Ascending: Name", exact: true })
        : dialog.getByRole("checkbox", { name: "Name", exact: true });
    const before = await state(page);
    if (kind === "columns")
      await dialog.getByText("Name", { exact: true }).click();
    else await button.click();
    expect((await state(page))?.subscriptions).toBe(before?.subscriptions);
    expect((await state(page))?.notices).toEqual(["submitted"]);
    if (kind === "columns") await expect(button).toBeChecked();
    else await expect(dialog.getByText("No sorting applied")).toBeVisible();
    await page.evaluate(() => window.columnFixture.a?.reject());
    expect((await state(page))?.subscriptions).toBe(before?.subscriptions);
    if (kind === "columns")
      await dialog.getByText("Name", { exact: true }).click();
    else await button.click();
    await page.evaluate(() => window.columnFixture.a?.accept());
    expect((await state(page))?.subscriptions).toBe(
      (before?.subscriptions ?? 0) + 1,
    );
    if (kind === "columns") await expect(button).not.toBeChecked();
    else
      await expect(dialog.getByRole("listitem")).toHaveText(
        "1. Name: Ascending",
      );
  });

test("same-owner server criteria/layout work through loading and failure with old query authority", async ({
  page,
}) => {
  await page.goto("/?server=1");
  await page.evaluate(() => window.columnFixture.a?.loading());
  let dialog = await sortOpen(page);
  await dialog
    .getByRole("button", { name: "Descending: Name", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await page.evaluate(() => window.columnFixture.a?.fail());
  dialog = await columnsOpen(page);
  await dialog.getByText("Name", { exact: true }).click();
  expect((await state(page))?.sorting).toEqual([{ id: "name", desc: true }]);
  expect((await state(page))?.visibility).toEqual({ name: false });
});

for (const denial of ["access", "scope", "foreignTarget"] as const)
  test(`old DOM callback denies changed ${denial}`, async ({ page }) => {
    await page.goto("/?server=1");
    const dialog = await sortOpen(page);
    const before = await state(page);
    await dialog
      .getByRole("button", { name: "Ascending: Name", exact: true })
      .evaluate((node, change) => {
        window.columnFixture.a?.[change]();
        (node as HTMLButtonElement).click();
      }, denial);
    expect((await state(page))?.sorting).toEqual(before?.sorting);
    await page.keyboard.press("Escape");
    if (denial !== "scope")
      await expect(
        table(page).getByRole("button", { name: "Sort", exact: true }),
      ).toBeDisabled();
    expect((await state(page))?.notices).toContain("unavailable");
  });

test("disabled controls expose a reason and cannot open", async ({ page }) => {
  await page.goto("/?disabled=1");
  await expect(
    table(page).getByRole("button", { name: "Sort", exact: true }),
  ).toBeDisabled();
  await expect(
    table(page).getByText("Sorting changes are disabled"),
  ).toBeVisible();
  await expect(
    table(page).getByRole("button", { name: "Columns", exact: true }),
  ).toBeDisabled();
  await expect(
    table(page).getByText("Column changes are disabled"),
  ).toBeVisible();
});

test("keyboard opens, shows focus, changes sort and Escape restores trigger focus", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = table(page).getByRole("button", {
    name: "Sort",
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const button = page.getByRole("button", {
    name: "Ascending: Name",
    exact: true,
  });
  await button.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(button).toBeFocused();
  expect(
    await button.evaluate((node) => getComputedStyle(node).outlineStyle),
  ).not.toBe("none");
  await page.keyboard.press("Enter");
  expect((await state(page))?.sorting).toEqual([{ id: "name", desc: false }]);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  const columns = table(page).getByRole("button", {
    name: "Columns",
    exact: true,
  });
  await columns.focus();
  await page.keyboard.press("Space");
  const checkbox = page.getByRole("checkbox", { name: "Name", exact: true });
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).not.toBeChecked();
  await page.keyboard.press("Escape");
  await expect(columns).toBeFocused();
});

for (const mode of ["light", "dark", "rtl-dark"] as const)
  test(`${mode}: contained 320/390/768/1024/1440, text expansion and axe`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const rtl = mode === "rtl-dark";
    await page.goto(
      `/?${mode !== "light" ? "dark=1" : ""}${rtl ? "&rtl=1" : ""}`,
    );
    if (rtl) expect((await state(page))?.locale).toBe("ar-EG");
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const trigger = table(page).getByRole("button", {
        name: rtl ? "ترتيب" : "Sort",
        exact: true,
      });
      await trigger.click();
      const dialog = page.getByRole("dialog", {
        name: rtl ? "الترتيب" : "Sorting",
        exact: true,
      });
      await expect(dialog).toBeVisible();
      const box = await dialog.boundingBox();
      expect(box?.x).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      if (width === 320) {
        const result = await new AxeBuilder({ page }).analyze();
        expect(result.violations).toEqual([]);
        await page.screenshot({
          path: `tests/controls/columns/.artifacts/${mode}-320.png`,
          fullPage: true,
        });
      }
      await page.keyboard.press("Escape");
      // Each viewport is an independent scene. Finish its semantic close/focus
      // boundary before resizing; rapid unsynchronized input has a separate test.
      await expect(dialog).toHaveCount(0);
      await expect(page.locator('[role="dialog"]')).toHaveCount(0);
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(trigger).toBeFocused();
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "24px";
    });
    await table(page)
      .getByRole("button", { name: rtl ? "الأعمدة" : "Columns", exact: true })
      .click();
    await expect(
      page.getByRole("checkbox", { name: rtl ? "الاسم" : "Name", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations).toEqual([]);
    await page
      .getByRole("dialog")
      .getByText(rtl ? "الاسم" : "Name", { exact: true })
      .click();
    await expect(
      page.getByRole("checkbox", { name: rtl ? "الاسم" : "Name", exact: true }),
    ).not.toBeChecked();
    const contrast = await page.getByRole("dialog").evaluate((dialog) => {
      const control = dialog.querySelector('[data-slot="checkbox-control"]');
      const popover = dialog.closest(".tw-column-controls-popover");
      if (!control || !popover) throw new Error("Missing checkbox boundary");
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Missing canvas");
      const luminance = (color: string) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const rgb = Array.from(ctx.getImageData(0, 0, 1, 1).data)
          .slice(0, 3)
          .map((channel) => {
            const value = channel / 255;
            return value <= 0.04045
              ? value / 12.92
              : ((value + 0.055) / 1.055) ** 2.4;
          });
        return (
          (rgb[0] ?? 0) * 0.2126 +
          (rgb[1] ?? 0) * 0.7152 +
          (rgb[2] ?? 0) * 0.0722
        );
      };
      const style = getComputedStyle(control);
      const border = luminance(style.borderColor);
      const background = luminance(getComputedStyle(popover).backgroundColor);
      return {
        width: parseFloat(style.borderWidth),
        ratio:
          (Math.max(border, background) + 0.05) /
          (Math.min(border, background) + 0.05),
      };
    });
    expect(contrast.width).toBeGreaterThanOrEqual(1);
    expect(contrast.ratio).toBeGreaterThanOrEqual(3);
    await page.screenshot({
      path: `tests/controls/columns/.artifacts/${mode}-chooser-expanded-320.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
