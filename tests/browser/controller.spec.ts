import { expect, test } from "@playwright/test";

test("n1: inline selector equality survives unrelated parent rerenders", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:6008/hooks.html");
  await expect(page.locator("#parent")).toHaveAttribute(
    "data-committed",
    "0/0",
  );
  await expect(page.locator("#inline-selection")).toHaveAttribute(
    "data-effects",
    /\d+/,
  );
  const stable = await page.locator("#selection").getAttribute("data-effects");
  const inline = await page
    .locator("#inline-selection")
    .getAttribute("data-effects");
  await page
    .getByRole("button", { name: "Unrelated render", exact: true })
    .click();
  // The parent's passive effect runs after the child effects for this commit.
  await expect(page.locator("#parent")).toHaveAttribute(
    "data-committed",
    "1/0",
  );
  await expect(page.locator("#snapshot")).toHaveText("0/1/0");
  expect(await page.locator("#selection").getAttribute("data-effects")).toBe(
    stable,
  );
  expect(
    await page.locator("#inline-selection").getAttribute("data-effects"),
  ).toBe(inline);
  expect(errors).toEqual([]);
});

test("n1: changed inline selectors and accepted state still recompute their values", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:6008/hooks.html");
  await expect(page.locator("#parent")).toHaveAttribute(
    "data-committed",
    "0/0",
  );
  const stable = await page.locator("#selection").getAttribute("data-effects");
  const initial = Number(
    await page.locator("#inline-selection").getAttribute("data-effects"),
  );
  await page
    .getByRole("button", { name: "Selector Offset", exact: true })
    .click();
  await expect(page.locator("#parent")).toHaveAttribute(
    "data-committed",
    "0/1",
  );
  await expect(page.locator("#inline-selection")).toHaveText("1");
  expect(
    Number(
      await page.locator("#inline-selection").getAttribute("data-effects"),
    ),
  ).toBe(initial + 1);
  expect(await page.locator("#selection").getAttribute("data-effects")).toBe(
    stable,
  );
  await page
    .getByRole("button", { name: "Unrelated render", exact: true })
    .click();
  await expect(page.locator("#parent")).toHaveAttribute(
    "data-committed",
    "1/1",
  );
  expect(
    Number(
      await page.locator("#inline-selection").getAttribute("data-effects"),
    ),
  ).toBe(initial + 1);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await expect(page.locator("#inline-selection")).toHaveText("2");
  await expect(page.locator("#selection")).toHaveText("1");
  await expect(page.locator("#snapshot")).toHaveText("1/1/1");
  expect(errors).toEqual([]);
});

test("React accepted-state hooks avoid mirrors, partial proposals and selector loops", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:6008/hooks.html");
  await expect(page.locator("#snapshot")).toHaveText("0/1/0");
  const initialQueryRenders = await page
    .locator("#query")
    .getAttribute("data-renders");
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await expect(page.locator("#selection")).toHaveText("1");
  await expect(page.locator("#snapshot")).toHaveText("1/1/1");
  expect(await page.locator("#query").getAttribute("data-renders")).toBe(
    initialQueryRenders,
  );
  const selectedRenders = await page
    .locator("#selection")
    .getAttribute("data-renders");
  await page
    .getByRole("button", { name: "Propose Clear", exact: true })
    .click();
  await expect(page.locator("#requests")).toHaveText("1/0");
  await expect(page.locator("#snapshot")).toHaveText("1/1/1");
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(page.locator("#snapshot")).toHaveText("1/1/1");
  expect(await page.locator("#selection").getAttribute("data-renders")).toBe(
    selectedRenders,
  );
  await page
    .getByRole("button", { name: "Propose Clear", exact: true })
    .click();
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.locator("#snapshot")).toHaveText("2/0/0");
  await expect(page.locator("#requests")).toHaveText("2/1");
  await expect(page.locator("#query")).toHaveText("0");
  await expect(page.locator("#selection")).toHaveText("0");
  const finalQueryRenders = await page
    .locator("#query")
    .getAttribute("data-renders");
  await page.getByRole("button", { name: "Noop", exact: true }).click();
  expect(await page.locator("#query").getAttribute("data-renders")).toBe(
    finalQueryRenders,
  );
  await page.getByRole("button", { name: "Unmount", exact: true }).click();
  await expect(page.locator("main")).toHaveCount(0);
  expect(errors).toEqual([]);
});
