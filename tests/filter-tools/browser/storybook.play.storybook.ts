import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { expectCompletedPlay } from "./storybook.play-completion.js";

const errors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const found: string[] = [];
  errors.set(page, found);
  page.on("pageerror", (error) => found.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      found.push(`console.error: ${message.text()}`);
  });
});
test.afterEach(({ page }) => expect(errors.get(page)).toEqual([]));

test("plain built iframe automatically runs the existing SelectionSlot play", async ({
  page,
}, info) => {
  await page.goto(
    "/iframe.html?id=filters-tools--selection-slot&viewMode=story",
  );
  await expectCompletedPlay(page, info);
  await expect(
    page.getByRole("button", { name: "Cancel selection", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add filter rule: Filters", exact: true }),
  ).toHaveCount(0);
});

test("built FieldOwnership play reaches the actual HeroUI field picker", async ({
  page,
}, info) => {
  await page.goto(
    "/iframe.html?id=filters-tools--field-ownership&viewMode=story",
  );
  await expectCompletedPlay(page, info);
  await expect(
    page.getByRole("option", { name: "Note (hidden column)", exact: true }),
  ).toBeVisible();
});

test("built InvalidDraft play submits invalid local text without changing accepted native rows", async ({
  page,
}, info) => {
  await page.goto(
    "/iframe.html?id=filters-tools--invalid-draft&viewMode=story",
  );
  await expectCompletedPlay(page, info);
  await expect(page.getByRole("alert")).toHaveText(
    "Enter a valid filter value.",
  );
  await expect(page.getByTestId("native-ids")).toHaveText("b,c,d");
});

test("built AsyncOptions play exposes local failure and real Retry over unchanged native rows", async ({
  page,
}, info) => {
  await page.goto(
    "/iframe.html?id=filters-tools--async-options&viewMode=story",
  );
  await expectCompletedPlay(page, info);
  await expect(
    page.getByRole("button", { name: "Retry options", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("native-ids")).toHaveText("a,g");
});

test("built BuilderAllAny play removes only Amount after actual All/Any transitions", async ({
  page,
}, info) => {
  await page.goto(
    "/iframe.html?id=filters-tools--builder-all-any&viewMode=story",
  );
  await expectCompletedPlay(page, info);
  await expect
    .poll(
      async () =>
        JSON.parse(
          (await page.getByTestId("accepted-query").textContent()) ?? "null",
        ).builder,
    )
    .toEqual({
      join: "or",
      rules: [
        {
          id: "note-rule",
          field: "note",
          operator: "text.contains",
          value: "alpha",
        },
      ],
    });
  await expect(page.getByTestId("native-ids")).toHaveText("b");
  await page
    .getByRole("button", { name: "Clear filter-builder rules", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        JSON.parse(
          (await page.getByTestId("accepted-query").textContent()) ?? "null",
        ).builder,
    )
    .toEqual({ join: "or", rules: [] });
  await expect(page.getByTestId("native-ids")).toHaveText("a,b,c,d,e,f,g,h");
});

test("built BuilderClear play retains independent accepted tools and sorting", async ({
  page,
}, info) => {
  await page.goto(
    "/iframe.html?id=filters-tools--builder-clear&viewMode=story",
  );
  await expectCompletedPlay(page, info);
  await expect
    .poll(
      async () =>
        JSON.parse(
          (await page.getByTestId("accepted-query").textContent()) ?? "null",
        ).builder,
    )
    .toEqual({ join: "or", rules: [] });
  const query = JSON.parse(
    (await page.getByTestId("accepted-query").textContent()) ?? "null",
  );
  expect(query.search).toBe("Alpha");
  expect(query.tabId).toBe("ready");
  expect(query.date).not.toBeNull();
  expect(query.sorting).toEqual([{ id: "amount", desc: true }]);
  await expect(page.getByTestId("native-ids")).toHaveText("g,b,a");
  await expect(
    page.getByRole("button", {
      name: "Clear filter-builder rules",
      exact: true,
    }),
  ).toHaveCount(0);
});
