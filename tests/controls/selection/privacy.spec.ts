import { expect, test } from "@playwright/test";

test("privacy mask never remounts normal criteria while accepted selection survives access denial", async ({
  page,
}) => {
  await page.goto("/");
  const primary = page.getByTestId("primary");
  const query = await page.evaluate(() =>
    window.selectionFixture.primary?.query(),
  );
  await page.evaluate(() => window.selectionFixture.primary?.select(["a"]));
  await expect(primary.getByRole("status")).toHaveText("1 selected");
  await primary.getByRole("button", { name: "Clear row selection" }).focus();
  await page.evaluate(() =>
    window.selectionFixture.primary?.denyRetainingSelection(),
  );
  const audit = await page.evaluate(() =>
    window.selectionFixture.primary?.privacyFacts(),
  );
  await test.info().attach("genuine-mask", {
    body: JSON.stringify(audit),
    contentType: "application/json",
  });
  expect(audit).toEqual({
    blockedReason: "context",
    selectedIds: [],
    requestedQuery: null,
    acceptedSelection: { a: true },
  });
  await expect(primary.getByTestId("primary-normal")).toHaveCount(0);
  await expect(
    primary.getByText("Amount greater than 0", { exact: true }),
  ).toHaveCount(0);
  await expect(
    primary.getByRole("button", { name: "Review selected" }),
  ).toHaveCount(0);
  await expect(primary.locator("[data-selection-active]")).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      window.selectionFixture.primary?.focusFallbackCalls(),
    ),
  ).toBe(0);
  expect(
    await page.evaluate(() => window.selectionFixture.primary?.query()),
  ).toBe(query);
  await primary.getByLabel("External date").focus();
  await page.evaluate(() => window.selectionFixture.primary?.restoreAccess());
  await expect(primary.getByRole("status")).toHaveText("1 selected");
  await expect(primary.getByTestId("primary-normal")).toHaveCount(0);
  expect(
    (await page.evaluate(() => window.selectionFixture.primary?.privacyFacts()))
      ?.acceptedSelection,
  ).toEqual({ a: true });
  await expect(primary.getByLabel("External date")).toBeFocused();
  await primary.getByRole("button", { name: "Clear row selection" }).click();
  await expect(primary.getByTestId("primary-normal")).toBeVisible();
  expect(
    await page.evaluate(() => window.selectionFixture.primary?.query()),
  ).toBe(query);
});

test("privacy mask unmounts an active normal portal without private fallback or stealing surviving focus", async ({
  page,
}) => {
  await page.goto("/");
  const primary = page.getByTestId("primary");
  await primary.getByRole("button", { name: "Filters", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "primary draft editor" }),
  ).toBeVisible();
  await page.evaluate(() =>
    window.selectionFixture.primary?.denyRetainingSelection(),
  );
  await expect(primary.getByTestId("primary-normal")).toHaveCount(0);
  await expect(
    page.getByRole("dialog", { name: "primary draft editor" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      window.selectionFixture.primary?.focusFallbackCalls(),
    ),
  ).toBe(0);
  await primary.getByLabel("External date").focus();
  await page.evaluate(() => window.selectionFixture.primary?.restoreAccess());
  await expect(primary.getByTestId("primary-normal")).toBeVisible();
  await expect(primary.getByLabel("External date")).toBeFocused();
  await page.evaluate(() =>
    window.selectionFixture.primary?.denyRetainingSelection(),
  );
  await expect(primary.getByLabel("External date")).toBeFocused();
  await expect(primary.getByTestId("primary-normal")).toHaveCount(0);
});

for (const state of ["initial", "pending", "failure"])
  test(`same-owner ${state} without a snapshot keeps authorized tools and selection Cancel usable`, async ({
    page,
  }) => {
    await page.goto("/?initial=1");
    const primary = page.getByTestId("primary");
    const query = await page.evaluate(() =>
      window.selectionFixture.primary?.query(),
    );
    if (state !== "initial")
      await page.evaluate(() => window.selectionFixture.primary?.refresh());
    if (state === "failure")
      await page.evaluate(() => window.selectionFixture.primary?.fail());
    await expect(primary.getByTestId("primary-normal")).toBeVisible();
    expect(
      (
        await page.evaluate(() =>
          window.selectionFixture.primary?.privacyFacts(),
        )
      )?.requestedQuery,
    ).not.toBeNull();
    await page.evaluate(() => window.selectionFixture.primary?.select(["a"]));
    await expect(primary.getByRole("status")).toHaveText("1 selected");
    await expect(
      primary.getByRole("button", { name: "Clear row selection" }),
    ).toBeEnabled();
    await primary.getByRole("button", { name: "Clear row selection" }).click();
    await expect(primary.getByTestId("primary-normal")).toBeVisible();
    expect(
      await page.evaluate(() => window.selectionFixture.primary?.query()),
    ).toBe(query);
  });
