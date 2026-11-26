import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

async function select(
  page: Page,
  ids = ["a", "c", "offpage"],
  table = "primary",
) {
  await page.evaluate(
    ({ ids, table }) => window.selectionFixture[table]?.select(ids),
    { ids, table },
  );
}
const primary = (page: Page) => page.getByTestId("primary");

test("all accepted IDs replace/unmount the entire normal region; no criteria or independent-table changes", async ({
  page,
}) => {
  await page.goto("/");
  const before = await page.evaluate(() =>
    window.selectionFixture.primary?.query(),
  );
  await primary(page).getByLabel("Embedded search").fill("unfinished");
  await primary(page)
    .getByRole("button", { name: "Filters", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "primary draft editor" }),
  ).toBeVisible();
  await select(page);
  await expect(primary(page).getByRole("status")).toHaveText("3 selected");
  await expect(primary(page).getByTestId("primary-normal")).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByTestId("independent-normal")).toBeVisible();
  await expect(
    primary(page).getByRole("button", { name: "External tab" }),
  ).toBeVisible();
  await expect(primary(page).getByLabel("External date")).toHaveValue(
    "2026-11-24",
  );
  await primary(page)
    .getByRole("button", { name: "Clear row selection" })
    .click();
  await expect(primary(page).getByLabel("Embedded search")).toHaveValue("");
  expect(
    await page.evaluate(() => window.selectionFixture.primary?.query()),
  ).toBe(before);
  await expect(page.getByRole("button", { name: /export/i })).toHaveCount(0);
});

for (const mode of ["multiple", "single"])
  test(`controlled ${mode}: proposal/delay/rejection do not switch toolbar optimistically`, async ({
    page,
  }) => {
    await page.goto(`/?controlled=1${mode === "single" ? "&single=1" : ""}`);
    await select(page, ["offpage"]);
    await expect(page.getByTestId("primary-normal")).toBeVisible();
    await page.evaluate(() => window.selectionFixture.primary?.reject());
    await expect(page.getByTestId("primary-normal")).toBeVisible();
    await select(page, ["offpage"]);
    await page.evaluate(() => window.selectionFixture.primary?.accept());
    await expect(primary(page).getByRole("status")).toHaveText("1 selected");
    await primary(page)
      .getByRole("button", { name: "Clear row selection" })
      .click();
    await expect(primary(page).getByRole("status")).toHaveText("1 selected");
    await page.evaluate(() => window.selectionFixture.primary?.reject());
    await expect(primary(page).getByRole("status")).toHaveText("1 selected");
    await primary(page)
      .getByRole("button", { name: "Clear row selection" })
      .press("Enter");
    await page.evaluate(() => window.selectionFixture.primary?.accept());
    await expect(page.getByTestId("primary-normal")).toBeVisible();
  });

test("offpage-only selected count, loaded/missing subsets and same-ID refresh use current records", async ({
  page,
}) => {
  await page.goto("/");
  await select(page, ["offpage"]);
  await primary(page).getByRole("button", { name: "Review selected" }).click();
  let payload = await page.evaluate(() =>
    window.selectionFixture.primary?.getCalls().at(-1),
  );
  expect(payload?.selectedIds).toEqual(["offpage"]);
  expect(payload?.loadedSelected).toEqual([]);
  expect(payload?.missingSelectedIds).toEqual(["offpage"]);
  await select(page);
  await page.evaluate(() => window.selectionFixture.primary?.capture());
  await page.evaluate(() => {
    window.selectionFixture.primary?.refresh();
    window.selectionFixture.primary?.settle();
  });
  await page.evaluate(() => window.selectionFixture.primary?.invokeSaved());
  payload = await page.evaluate(() =>
    window.selectionFixture.primary?.getCalls().at(-1),
  );
  expect(payload?.selectedIds).toEqual(["a", "c", "offpage"]);
  expect(payload?.loadedSelected).toEqual([
    { id: "a", record: { id: "a", amount: 999, eligible: true } },
  ]);
  expect(payload?.missingSelectedIds).toEqual(["c", "offpage"]);
  expect(payload?.busy).toBe(false);
  expect(payload?.stale).toBe(false);
  expect(payload?.displayed?.request?.requestKey).toBe("request-2");
});

for (const state of ["pending", "failure"])
  test(`same-scope ${state}: actions receive truthful stale provenance and Cancel stays reachable`, async ({
    page,
  }) => {
    await page.goto("/");
    await select(page, ["a", "offpage"]);
    await page.evaluate(() => window.selectionFixture.primary?.refresh());
    if (state === "failure")
      await page.evaluate(() => window.selectionFixture.primary?.fail());
    await primary(page)
      .getByRole("button", { name: "Review selected" })
      .click();
    const payload = await page.evaluate(() =>
      window.selectionFixture.primary?.getCalls().at(-1),
    );
    expect(payload?.busy).toBe(state === "pending");
    expect(payload?.stale).toBe(true);
    expect(payload?.displayed?.request?.requestKey).toBe("request-1");
    await expect(
      primary(page).getByRole("button", { name: "Clear row selection" }),
    ).toBeEnabled();
    await primary(page)
      .getByRole("button", { name: "Clear row selection" })
      .press("Space");
    await expect(page.getByTestId("primary-normal")).toBeVisible();
  });

for (const change of ["scope", "access", "replaceAuthority"] as const)
  test(`old saved callback suppressed after ${change}`, async ({ page }) => {
    await page.goto("/");
    await select(page, ["a"]);
    await page.evaluate(() => window.selectionFixture.primary?.capture());
    await page.evaluate(
      (change) => window.selectionFixture.primary?.[change](),
      change,
    );
    await page.evaluate(() => window.selectionFixture.primary?.invokeSaved());
    expect(
      await page.evaluate(
        () => window.selectionFixture.primary?.getCalls().length,
      ),
    ).toBe(0);
    if (change === "access")
      await expect(page.getByTestId("primary-normal")).toHaveCount(0);
    if (change === "scope")
      await expect(primary(page).getByRole("status")).toHaveText("1 selected");
  });

test("old-scope Cancel cannot clear a new scope's accepted selection", async ({
  page,
}) => {
  await page.goto("/");
  await select(page, ["a"]);
  await page.evaluate(() => window.selectionFixture.primary?.capture(true));
  await page.evaluate(() => window.selectionFixture.primary?.scope());
  await page.evaluate(() => window.selectionFixture.primary?.invokeSaved());
  await expect(primary(page).getByRole("status")).toHaveText("1 selected");
});

test("app disabled/pending flags rechecked by old handlers and do not block Cancel", async ({
  page,
}) => {
  await page.goto("/");
  await select(page, ["a"]);
  await page.evaluate(() => window.selectionFixture.primary?.capture());
  for (const method of ["setDisabled", "setPending"] as const) {
    await page.evaluate(
      (method) => window.selectionFixture.primary?.[method](true),
      method,
    );
    await expect(
      primary(page).getByRole("button", { name: "Review selected" }),
    ).toBeDisabled();
    await page.evaluate(() => window.selectionFixture.primary?.invokeSaved());
    expect(
      await page.evaluate(
        () => window.selectionFixture.primary?.getCalls().length,
      ),
    ).toBe(0);
    await expect(
      primary(page).getByRole("button", { name: "Clear row selection" }),
    ).toBeEnabled();
    await page.evaluate(
      (method) => window.selectionFixture.primary?.[method](false),
      method,
    );
  }
});

test("thrown/rejected app action and rejected app error reporter produce no unhandled browser errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await select(page, ["a"]);
  for (const behavior of ["throw", "reject", "report-reject"]) {
    await page.evaluate(
      (behavior) => window.selectionFixture.primary?.setBehavior(behavior),
      behavior,
    );
    await primary(page)
      .getByRole("button", { name: "Review selected" })
      .click();
  }
  await expect(
    primary(page).getByTestId("Application failure count"),
  ).toHaveText("3");
  expect(errors).toEqual([]);
  await expect(primary(page).getByRole("alert")).toHaveText(
    "The application action could not finish.",
  );
  await expect(primary(page).getByRole("status")).toHaveText("1 selected");
});

test("keyboard activation, focus-visible, and restoration only for removed controls (including portal)", async ({
  page,
}) => {
  await page.goto("/");
  await primary(page)
    .getByRole("button", { name: "Filters", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByLabel("Unsubmitted rule"),
  ).toBeFocused();
  await select(page, ["offpage"]);
  const cancel = primary(page).getByRole("button", {
    name: "Clear row selection",
  });
  await expect(cancel).toBeFocused();
  await cancel.press("Enter");
  await expect(
    primary(page).getByRole("button", { name: "Filters", exact: true }),
  ).toBeFocused();
  await primary(page)
    .getByRole("button", { name: "Select a", exact: true })
    .focus();
  await select(page, ["offpage"]);
  await expect(
    primary(page).getByRole("button", { name: "Select a", exact: true }),
  ).toBeFocused();
  await primary(page).getByRole("button", { name: "External tab" }).focus();
  await page.evaluate(() => window.selectionFixture.primary?.select([]));
  await expect(
    primary(page).getByRole("button", { name: "External tab" }),
  ).toBeFocused();
  await select(page, ["offpage"]);
  await primary(page).getByRole("button", { name: "Review selected" }).focus();
  await page.keyboard.press("Tab");
  await expect(cancel).toBeFocused();
  expect(
    await cancel.evaluate((node) => node.getAttribute("data-focus-visible")),
  ).toBe("true");
});

for (const width of [1440, 1024, 768, 390, 320])
  test(`light/dark/Arabic RTL/text expansion at ${width}px: no overflow, named controls and contrast axe`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const query of ["long=1", "rtl=1&dark=1"]) {
      await page.goto(`/?${query}`);
      await select(page);
      const root = primary(page).locator('[data-selection-active="true"]');
      await expect(root).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const buttons = root.getByRole("button");
      for (const button of await buttons.all()) {
        const bounds = await button.boundingBox();
        expect(bounds?.width).toBeGreaterThan(0);
        expect(bounds?.height).toBeGreaterThanOrEqual(44);
      }
      const axe = await new AxeBuilder({ page })
        .include('[data-testid="primary"]')
        .analyze();
      expect(axe.violations).toEqual([]);
      await page.screenshot({
        path: `tests/controls/selection/.artifacts/${width}-${query.startsWith("rtl") ? "rtl-dark" : "light-long"}.png`,
      });
    }
  });

test("complete client source supplies selected records beyond the displayed page", async ({
  page,
}) => {
  await page.goto("/?client=1");
  await select(page, ["a", "c", "offpage"]);
  await primary(page).getByRole("button", { name: "Review selected" }).click();
  const payload = await page.evaluate(() =>
    window.selectionFixture.primary?.getCalls().at(-1),
  );
  expect(payload?.loadedSelected.map((entry) => entry.id)).toEqual(["a", "c"]);
  expect(payload?.missingSelectedIds).toEqual(["offpage"]);
});

for (const replacement of ["foreignController", "foreignResource"] as const)
  test(`saved action reads authentic ${replacement} ownership before exposing records`, async ({
    page,
  }) => {
    await page.goto("/");
    await select(page, ["a"]);
    await page.evaluate(() => window.selectionFixture.primary?.capture());
    await page.evaluate(
      (replacement) => window.selectionFixture.primary?.[replacement](),
      replacement,
    );
    await page.evaluate(() => window.selectionFixture.primary?.invokeSaved());
    expect(
      await page.evaluate(
        () => window.selectionFixture.primary?.getCalls().length,
      ),
    ).toBe(0);
  });

test("deferred app failure after scope change is observed but never delivered to a foreign owner", async ({
  page,
}) => {
  const unhandled: string[] = [];
  page.on("pageerror", (error) => unhandled.push(error.message));
  await page.goto("/");
  await select(page, ["a"]);
  await page.evaluate(() =>
    window.selectionFixture.primary?.setBehavior("deferred"),
  );
  await primary(page).getByRole("button", { name: "Review selected" }).click();
  await page.evaluate(() => window.selectionFixture.primary?.scope());
  await page.evaluate(() => window.selectionFixture.primary?.rejectPending());
  await expect(
    primary(page).getByTestId("Application failure count"),
  ).toHaveText("0");
  expect(unhandled).toEqual([]);
});

test("absent normal trigger restores focus to the supplied safe application fallback; actions are optional", async ({
  page,
}) => {
  await page.goto("/?no-trigger=1&no-actions=1");
  await select(page, ["offpage"]);
  const cancel = primary(page).getByRole("button", {
    name: "Clear row selection",
  });
  await expect(
    primary(page).getByRole("button", { name: "Review selected" }),
  ).toHaveCount(0);
  await cancel.focus();
  await cancel.press("Enter");
  await expect(
    primary(page).getByRole("button", { name: "External tab" }),
  ).toBeFocused();
});

test("320px and 200% root text size keep the selection group and every action contained", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 1000 });
  await page.goto("/?long=1");
  await select(page);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  const root = primary(page).locator('[data-selection-active="true"]');
  expect(
    await root.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  for (const action of await root.getByRole("button").all()) {
    const bounds = await action.boundingBox();
    expect(bounds?.x).toBeGreaterThanOrEqual(0);
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(320);
  }
});
