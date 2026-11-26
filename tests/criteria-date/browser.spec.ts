import { expect, test } from "@playwright/test";

const errors = new WeakMap<object, string[]>();
test.beforeEach(async ({ page }) => {
  const entries: string[] = [];
  errors.set(page, entries);
  page.on("pageerror", (error) => entries.push(error.message));
  await page.goto("/tests/criteria-date/browser.html");
});
test.afterEach(({ page }) => {
  expect(errors.get(page)).toEqual([]);
});
test("same-domain functions/props and sort preserve exact input, form DOM, focus and caret", async ({
  page,
}) => {
  const single = page.getByTestId("single");
  await single
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  await single
    .getByRole("combobox", { name: "Date value type" })
    .selectOption("instant");
  const input = single.getByRole("textbox", {
    name: "Date — Exact date and time",
  });
  await input.fill("2030-01-10T12:34:56.789Z");
  const original = await input.elementHandle();
  if (!original) throw new Error("Date input missing");
  await input.focus();
  await input.evaluate((node: HTMLInputElement) =>
    node.setSelectionRange(4, 9),
  );
  await input.press("Alt+r");
  await expect(input).toBeFocused();
  expect(
    await input.evaluate((node: HTMLInputElement) => [
      node.selectionStart,
      node.selectionEnd,
    ]),
  ).toEqual([4, 9]);
  await expect(input).toHaveValue("2030-01-10T12:34:56.789Z");
  expect(await original.evaluate((node) => node.isConnected)).toBe(true);
  await input.press("Alt+q");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("2030-01-10T12:34:56.789Z");
  expect(await original.evaluate((node) => node.isConnected)).toBe(true);
  const form = page.getByRole("textbox", { name: "Application form" });
  await form.fill("kept form");
  const node = await form.elementHandle();
  if (!node) throw new Error("Form missing");
  await form.evaluate((element: HTMLInputElement) =>
    element.setSelectionRange(1, 5),
  );
  await form.press("Alt+r");
  await expect(form).toBeFocused();
  await expect(form).toHaveValue("kept form");
  expect(await node.evaluate((element) => element.isConnected)).toBe(true);
  expect(
    await form.evaluate((element: HTMLInputElement) => [
      element.selectionStart,
      element.selectionEnd,
    ]),
  ).toEqual([1, 5]);
  await expect(page.getByTestId("observations")).toHaveText("0");
});
test("partial/invalid day segments cannot apply; raw legacy still edits independently", async ({
  page,
}) => {
  const single = page.getByTestId("single");
  await single
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  const segments = single.getByRole("spinbutton");
  await segments.first().focus();
  await segments.first().press("1");
  await expect(
    single.getByRole("button", { name: "Apply date filter" }),
  ).toBeDisabled();
  await single.getByRole("button", { name: "Cancel date edit" }).click();
  await expect(
    single.getByRole("combobox", { name: "Date value type" }),
  ).toHaveCount(0);
  const legacy = page.getByTestId("legacy");
  await legacy
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  await expect(
    legacy.getByRole("combobox", { name: "Date value type" }),
  ).toBeVisible();
  await legacy.getByRole("button", { name: "Cancel date edit" }).click();
  await expect(page.getByTestId("observations")).toHaveText("0");
});
test("range endpoints stay independent, invalid exact end blocks Apply and milliseconds survive", async ({
  page,
}) => {
  const range = page.getByTestId("range");
  await range
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  await range
    .getByRole("combobox", { name: "Date value type" })
    .selectOption("instant");
  const start = range.getByRole("textbox", {
      name: "Start date — Exact date and time",
    }),
    end = range.getByRole("textbox", {
      name: "End date — Exact date and time",
    });
  await start.fill("2030-01-10T12:34:56.789Z");
  await end.fill("partial end");
  await expect(start).toHaveValue("2030-01-10T12:34:56.789Z");
  await expect(
    range.getByRole("button", { name: "Apply date filter" }),
  ).toBeDisabled();
  await end.fill("2030-01-11T01:02:03.456Z");
  await expect(
    range.getByRole("button", { name: "Apply date filter" }),
  ).toBeEnabled();
  await start.press("Alt+r");
  await expect(start).toHaveValue("2030-01-10T12:34:56.789Z");
  await expect(end).toHaveValue("2030-01-11T01:02:03.456Z");
});

test("complete literal day can propose/accept; invalid February blur cannot apply the previous or a constrained day", async ({
  page,
}) => {
  const single = page.getByTestId("single");
  await single
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  const segments = single.getByRole("spinbutton");
  await expect(segments).toHaveCount(3);
  await segments.nth(0).press("3");
  await segments.nth(1).press("8");
  await expect(
    single.getByRole("button", { name: "Apply date filter", exact: true }),
  ).toBeDisabled();
  await segments.nth(2).pressSequentially("2030");
  await single
    .getByRole("button", { name: "Apply date filter", exact: true })
    .click();
  await page.getByRole("button", { name: "Accept date", exact: true }).click();
  await expect(page.getByTestId("accepted")).toHaveText(
    '{"operator":"date.on","value":{"kind":"day","value":"2030-03-08"}}',
  );
  await single
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  await segments.nth(0).press("2");
  await segments.nth(1).pressSequentially("30");
  await segments.nth(1).press("Tab");
  await expect(
    single.getByRole("button", { name: "Apply date filter", exact: true }),
  ).toBeDisabled();
  await single
    .getByRole("button", { name: "Cancel date edit", exact: true })
    .click();
  await expect(page.getByTestId("accepted")).toHaveText(
    '{"operator":"date.on","value":{"kind":"day","value":"2030-03-08"}}',
  );
});
test("controlled Apply proposes, rejection is not acceptance, real accepted baseline ends a new edit", async ({
  page,
}) => {
  const single = page.getByTestId("single");
  await single
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  await single
    .getByRole("combobox", { name: "Date value type" })
    .selectOption("relative");
  await single
    .getByRole("combobox", { name: "Relative date preset" })
    .selectOption({ label: "Today" });
  await single.getByRole("button", { name: "Apply date filter" }).click();
  await expect(page.getByTestId("accepted")).toHaveText("null");
  await expect(page.getByTestId("observations")).toHaveText("1");
  await page.getByRole("button", { name: "Reject date", exact: true }).click();
  await expect(page.getByTestId("accepted")).toHaveText("null");
  await single
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  await page.getByRole("button", { name: "External accepted date" }).click();
  await expect(
    single.getByRole("combobox", { name: "Date value type" }),
  ).toHaveCount(0);
  await expect(single.getByText("Today", { exact: true })).toBeVisible();
});
test("Strict/Suspense candidate stays unread until actual commit; reset/drop/disconnect never dispose app C", async ({
  page,
}) => {
  const single = page.getByTestId("single");
  await single
    .getByRole("button", { name: "Filter by date", exact: true })
    .click();
  await page.getByRole("button", { name: "Suspend candidate" }).click();
  await expect(page.getByTestId("candidate-reads")).toHaveText("0");
  await expect(
    single.getByRole("combobox", { name: "Date value type" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Abandon candidate" }).click();
  await expect(page.getByTestId("candidate-reads")).toHaveText("0");
  await page.getByRole("button", { name: "Reset domain" }).click();
  await expect(
    single.getByRole("combobox", { name: "Date value type" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Drop criteria" }).click();
  await expect(
    single.getByRole("button", { name: "Filter by date", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Toggle tools" }).click();
  await expect(page.getByTestId("disposed")).toHaveText("false");
});
