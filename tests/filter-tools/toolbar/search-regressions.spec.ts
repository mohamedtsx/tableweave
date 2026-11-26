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

async function freezeClock(page: Page) {
  await page.clock.install({ time: new Date("2030-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2030-01-01T00:00:01Z"));
}

test("n3 surviving search draft resumes debounce after committed Suspense hide/reveal", async ({
  page,
}, testInfo) => {
  await page.goto("/toolbar.html");
  await freezeClock(page);
  const search = page.getByRole("searchbox", { name: "Search records" });
  const original = await search.elementHandle();
  if (!original) throw new Error("Search input missing");
  await search.fill("suspended draft");
  await page.clock.runFor(100);
  await page
    .getByRole("button", { name: "Toggle search Suspense", exact: true })
    .click();
  await expect(
    page.getByText("Search Suspense fallback", { exact: true }),
  ).toBeVisible();
  await page.clock.runFor(1000);
  await expect(page.getByTestId("accepted-search")).toHaveText("(empty)");
  await expect(page.getByTestId("observations")).toHaveText("0");
  await page
    .getByRole("button", { name: "Toggle search Suspense", exact: true })
    .click();
  await expect(search).toHaveValue("suspended draft");
  expect(await original.evaluate((element) => element.isConnected)).toBe(true);
  await page.clock.runFor(1000);
  await testInfo.attach("effect-lifetime", {
    body: JSON.stringify(await page.evaluate(() => window.searchEffectEvents)),
    contentType: "application/json",
  });
  await expect(page.getByTestId("accepted-search")).toHaveText(
    "suspended draft",
  );
  await expect(page.getByTestId("observations")).toHaveText("1");
});

test("n3 Enter can submit a surviving draft immediately after Suspense reveal", async ({
  page,
}) => {
  await page.goto("/toolbar.html");
  await freezeClock(page);
  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.fill("enter after reveal");
  await page.clock.runFor(100);
  await page
    .getByRole("button", { name: "Toggle search Suspense", exact: true })
    .click();
  await expect(
    page.getByText("Search Suspense fallback", { exact: true }),
  ).toBeVisible();
  await page.clock.runFor(1000);
  await page
    .getByRole("button", { name: "Toggle search Suspense", exact: true })
    .click();
  await expect(search).toHaveValue("enter after reveal");
  await search.press("Enter");
  await expect(page.getByTestId("accepted-search")).toHaveText(
    "enter after reveal",
  );
  await page.clock.runFor(1000);
  await expect(page.getByTestId("observations")).toHaveText("1");
});

test("n4 rejected same-text history cannot acknowledge an external accepted replacement", async ({
  page,
}) => {
  await page.goto("/toolbar.html?controlled");
  await freezeClock(page);
  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.fill("external");
  await search.press("Enter");
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await search.fill("new local draft");
  await page
    .getByRole("button", { name: "External search", exact: true })
    .click();
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.getByTestId("accepted-search")).toHaveText("external");
  await page.clock.runFor(500);
  await expect(page.getByTestId("observations")).toHaveText("1");
  await expect(search).toHaveValue("external");
});

test("true search owner unmount cancels its timer without resetting the controller", async ({
  page,
}) => {
  await page.goto("/toolbar.html");
  await freezeClock(page);
  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.fill("unmounted draft");
  await page
    .getByRole("button", { name: "Toggle search mounted", exact: true })
    .click();
  await expect(search).toHaveCount(0);
  await page.clock.runFor(1000);
  await expect(page.getByTestId("accepted-search")).toHaveText("(empty)");
  await expect(page.getByTestId("observations")).toHaveText("0");
  await page
    .getByRole("button", { name: "Toggle search mounted", exact: true })
    .click();
  await expect(search).toHaveValue("");
  await page.clock.runFor(1000);
  await expect(page.getByTestId("observations")).toHaveText("0");
});

test("same-context parent rerenders do not restart the search debounce", async ({
  page,
}) => {
  await page.goto("/toolbar.html");
  await freezeClock(page);
  await page
    .getByRole("searchbox", { name: "Search records" })
    .fill("not postponed");
  for (let index = 0; index < 2; index += 1) {
    await page.clock.runFor(100);
    await page
      .getByRole("button", { name: "Rerender same context", exact: true })
      .click();
  }
  await page.clock.runFor(100);
  await expect(page.getByTestId("accepted-search")).toHaveText("not postponed");
  await expect(page.getByTestId("observations")).toHaveText("1");
});

test("scope replacement while search is hidden discards the old draft before reveal", async ({
  page,
}) => {
  await page.goto("/toolbar.html");
  await freezeClock(page);
  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.fill("old-scope draft");
  await page
    .getByRole("button", { name: "Toggle search Suspense", exact: true })
    .click();
  await expect(
    page.getByText("Search Suspense fallback", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Change scope", exact: true }).click();
  await page.clock.runFor(1000);
  await page
    .getByRole("button", { name: "Toggle search Suspense", exact: true })
    .click();
  await expect(search).toHaveValue("");
  await page.clock.runFor(1000);
  await expect(page.getByTestId("observations")).toHaveText("0");
});

test("valid own acceptance while hidden preserves newer typing after reveal", async ({
  page,
}) => {
  await page.goto("/toolbar.html?controlled");
  await freezeClock(page);
  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.fill("older own");
  await search.press("Enter");
  await search.fill("newer own");
  await page
    .getByRole("button", { name: "Toggle search Suspense", exact: true })
    .click();
  await expect(
    page.getByText("Search Suspense fallback", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.getByTestId("accepted-search")).toHaveText("older own");
  await page.clock.runFor(1000);
  await expect(page.getByTestId("observations")).toHaveText("1");
  await page
    .getByRole("button", { name: "Toggle search Suspense", exact: true })
    .click();
  await expect(search).toHaveValue("newer own");
  await page.clock.runFor(300);
  await expect(page.getByTestId("observations")).toHaveText("2");
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.getByTestId("accepted-search")).toHaveText("newer own");
});

test("exact proposal-query acceptance correlates through a controlled selection override", async ({
  page,
}) => {
  await page.goto("/toolbar.html?controlled&selection-override");
  await freezeClock(page);
  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.fill("older own");
  await search.press("Enter");
  await search.fill("newer own");
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.getByTestId("accepted-search")).toHaveText("older own");
  await expect(search).toHaveValue("newer own");
  await page.clock.runFor(300);
  await expect(page.getByTestId("observations")).toHaveText("2");
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.getByTestId("accepted-search")).toHaveText("newer own");
});

test("n4 an external same-text superseding proposal is not an own acknowledgement", async ({
  page,
}) => {
  await page.goto("/toolbar.html?controlled");
  await freezeClock(page);
  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.fill("external");
  await search.press("Enter");
  await search.fill("newer local");
  // Do not reject: this independent application dispatch supersedes the receipt.
  await page
    .getByRole("button", { name: "External search", exact: true })
    .click();
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(search).toHaveValue("external");
  await page.clock.runFor(500);
  await expect(page.getByTestId("observations")).toHaveText("1");
});
