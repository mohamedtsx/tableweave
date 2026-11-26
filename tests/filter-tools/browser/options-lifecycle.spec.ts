import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import {
  addRule,
  appAction,
  inspect,
  inspector,
  openFixture,
  pendingNumber,
} from "./helpers.js";

const errors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const found: string[] = [];
  errors.set(page, found);
  page.on("pageerror", (error) => found.push(error.message));
});
test.afterEach(({ page }) => expect(errors.get(page)).toEqual([]));

test("real picker option search rejects uncancellable ABA and copied responses while accepted rows remain authoritative", async ({
  page,
}) => {
  await openFixture(page, "?async");
  await addRule(page, "Numeric entity", "is");
  const search = page.getByRole("textbox", {
    name: "Search options",
    exact: true,
  });
  await search.fill("old");
  const old = await pendingNumber(page);
  await search.fill("new");
  await search.fill("old");
  const current = await pendingNumber(page);
  expect(
    await page.evaluate(
      (token) =>
        window.wp07?.numberDriver.source.succeed(token, {
          options: [{ id: 1, label: "Current numeric one" }],
          hasMore: false,
        }),
      current,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      (token) =>
        window.wp07?.numberDriver.source.succeed(token, {
          options: [{ id: 0, label: "Obsolete numeric zero" }],
          hasMore: false,
        }),
      old,
    ),
  ).toBe(false);
  expect(
    await page.evaluate(
      (token) =>
        window.wp07?.numberDriver.source.succeed(
          { ...token },
          { options: [{ id: 0, label: "Copied token" }], hasMore: false },
        ),
      current,
    ),
  ).toBe(false);
  await expect(
    page.getByRole("option", { name: "Current numeric one", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { name: "Obsolete numeric zero", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByTestId("native-ids")).toHaveText("a,b,c,d,e,f,g,h");
  await page
    .getByRole("option", { name: "Current numeric one", exact: true })
    .click();
  await expect(page.getByTestId("native-ids")).toHaveText("b,e");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: /^Value: Numeric entity: .+$/ }),
  ).toContainText("Current numeric one");
  await old.dispose();
  await current.dispose();
});

test("off-page labels and repeated-field accepted-ID union survive local option paging, empty and failure", async ({
  page,
}) => {
  await openFixture(page, "?async&example=entities");
  const before = await inspect(page);
  await page
    .getByRole("button", { name: /^Value: Numeric entity: .+$/ })
    .click();
  const first = await pendingNumber(page);
  await page.evaluate(
    (token) => window.wp07?.numberDriver.settle(token, "ready"),
    first,
  );
  await expect(
    page.getByRole("option", { name: "Numeric zero", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Next options", exact: true }).click();
  const next = await pendingNumber(page);
  expect(await next.evaluate((token) => token.pageKey)).toBe(
    "continuation:tail",
  );
  await page.evaluate(
    (token) => window.wp07?.numberDriver.settle(token, "ready"),
    next,
  );
  expect(
    await page.evaluate(() =>
      window.wp07?.numberDriver.source
        .getSnapshot()
        .page?.options.map(({ id }) => id),
    ),
  ).toEqual([2]);
  await expect(
    page.getByRole("option", { name: "Numeric zero", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page
    .getByRole("textbox", { name: "Search options", exact: true })
    .fill("missing");
  const empty = await pendingNumber(page);
  await page.evaluate(
    (token) => window.wp07?.numberDriver.settle(token, "empty"),
    empty,
  );
  await expect(
    page.getByText("No options available.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { name: "Numeric zero", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search options", exact: true })
    .fill("failure");
  const failure = await pendingNumber(page);
  await page.evaluate(
    (token) => window.wp07?.numberDriver.settle(token, "failure"),
    failure,
  );
  await expect(page.getByRole("alert")).toContainText(
    "Options could not be loaded.",
  );
  await page.keyboard.press("Escape");
  expect((await inspect(page)).state.query).toEqual(before.state.query);
  await expect(page.getByTestId("native-ids")).toHaveText("a,g");
  await addRule(page, "Numeric entity", "is");
  await page
    .getByRole("textbox", { name: "Search options", exact: true })
    .fill("two");
  const secondRule = await pendingNumber(page);
  await page.evaluate(
    (token) => window.wp07?.numberDriver.settle(token, "ready"),
    secondRule,
  );
  await page.getByRole("option", { name: "Numeric two", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("native-ids")).toHaveText("none");
  expect(
    await page.evaluate(
      () => window.wp07?.numberDriver.source.getSnapshot().selected,
    ),
  ).toEqual([
    { id: 0, label: "Numeric zero", known: true },
    { id: 2, label: "Numeric two", known: true },
  ]);
  await expect(
    page.getByRole("button", { name: /^Value: Numeric entity: .+$/ }).first(),
  ).toContainText("Numeric zero");
  await expect(
    page.getByRole("button", { name: /^Value: Numeric entity: .+$/ }).last(),
  ).toContainText("Numeric two");
  for (const handle of [first, next, empty, failure, secondRule])
    await handle.dispose();
});

test("application scope/access invalidation masks old option labels and rejects prior-scope responses", async ({
  page,
}) => {
  await openFixture(page, "?async&example=entities");
  await inspector(page);
  await page
    .getByRole("button", { name: /^Value: Numeric entity: .+$/ })
    .click();
  const initial = await pendingNumber(page);
  await page.evaluate(
    (token) =>
      window.wp07?.numberDriver.source.succeed(token, {
        options: [{ id: 0, label: "Scope A zero" }],
        hasMore: false,
      }),
    initial,
  );
  await page
    .getByRole("textbox", { name: "Search options", exact: true })
    .fill("pending");
  const old = await pendingNumber(page);
  await appAction(page, "Switch synthetic scope");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /^Value: Numeric entity: .+$/ }),
  ).not.toContainText("Scope A zero");
  await expect(page.getByTestId("native-ids")).toHaveText("second-a,second-g");
  expect(
    await page.evaluate(
      (token) =>
        window.wp07?.numberDriver.source.succeed(token, {
          options: [{ id: 0, label: "Late scope A label" }],
          hasMore: false,
        }),
      old,
    ),
  ).toBe(false);
  await page
    .getByRole("button", { name: /^Value: Numeric entity: .+$/ })
    .click();
  const next = await pendingNumber(page);
  expect(await next.evaluate((token) => token.scopeKey)).toBe("scope-b");
  await page.evaluate(
    (token) =>
      window.wp07?.numberDriver.source.succeed(token, {
        options: [{ id: 0, label: "Scope B zero" }],
        hasMore: false,
      }),
    next,
  );
  await appAction(page, "Simulate access loss");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByTestId("native-ids")).toHaveText("none");
  expect(
    await page.evaluate(() => {
      const source = window.wp07?.numberDriver.source.getSnapshot();
      return {
        selected: source?.selected,
        page: source?.page,
        access: source?.context.access,
      };
    }),
  ).toEqual({ selected: [], page: null, access: false });
  await expect(page.locator("main.wp07")).not.toContainText("Scope B zero");
  await appAction(page, "Restore synthetic access");
  await expect(page.getByTestId("native-ids")).toHaveText("second-a,second-g");
  await expect(page.locator("main.wp07")).not.toContainText("Scope B zero");
  expect(
    await page.evaluate(
      (token) =>
        window.wp07?.numberDriver.source.succeed(token, {
          options: [{ id: 0, label: "Revoked late label" }],
          hasMore: false,
        }),
      next,
    ),
  ).toBe(false);
  for (const handle of [initial, old, next]) await handle.dispose();
});

for (const ready of [false, true])
  test(`actual emitted builder/source and resource preserve committed Suspense hide/reveal (ready: ${ready})`, async ({
    page,
  }) => {
    await openFixture(
      page,
      `?async&example=entities&nostrict${ready ? "&transport=ready" : ""}`,
    );
    await page
      .getByRole("button", { name: /^Value: Numeric entity: .+$/ })
      .click();
    const pending = ready ? null : await pendingNumber(page);
    if (ready)
      await expect(
        page.getByRole("option", { name: "Numeric zero", exact: true }),
      ).toBeVisible();
    await page.keyboard.press("Escape");
    const before = await inspect(page);
    const api = await page.evaluateHandle(() => {
      if (!window.wp07) throw new Error("Fixture owner missing");
      return window.wp07;
    });
    await page
      .getByRole("button", {
        name: "Commit same-scope Suspense hide",
        exact: true,
      })
      .click();
    await expect(page.getByTestId("suspense-fallback")).toBeVisible();
    await expect(page.locator("main.wp07")).toBeHidden();
    const hidden = await api.evaluate((owner) =>
      owner.numberDriver.source.getSnapshot(),
    );
    expect(hidden.active).toBe(true);
    if (pending)
      expect(
        await page.evaluate(
          (token) => window.wp07?.numberDriver.settle(token, "ready"),
          pending,
        ),
      ).toBe(true);
    else
      expect(hidden.selected).toEqual([
        { id: 0, label: "Numeric zero", known: true },
      ]);
    await page
      .getByRole("button", { name: "Reveal same-scope workbench", exact: true })
      .click();
    await expect(page.getByTestId("native-ids")).toHaveText("a,g");
    await expect(
      page.getByRole("button", { name: /^Value: Numeric entity: .+$/ }),
    ).toContainText("Numeric zero");
    const after = await inspect(page);
    expect(after.metrics.resultsMounts).toBe(before.metrics.resultsMounts);
    expect(after.metrics.resultsCleanups).toBe(before.metrics.resultsCleanups);
    expect(after.metrics.resourceInvalidations).toBe(
      before.metrics.resourceInvalidations,
    );
    await page.evaluate(() => window.wp07?.numberDriver.setMode("manual"));
    await page
      .getByRole("button", { name: /^Value: Numeric entity: .+$/ })
      .click();
    await page
      .getByRole("textbox", { name: "Search options", exact: true })
      .fill("uncancellable");
    const late = await pendingNumber(page);
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Unmount workbench", exact: true })
      .click();
    await expect(page.getByTestId("unmounted")).toBeVisible();
    const disposed = await api.evaluate((owner) =>
      owner.numberDriver.source.getSnapshot(),
    );
    expect(disposed.active).toBe(false);
    expect(disposed.page).toBeNull();
    expect(disposed.selected).toEqual([]);
    expect(
      await page.evaluate(
        ({ owner, token }) =>
          owner.numberDriver.source.succeed(token, {
            options: [{ id: 0, label: "Late unmounted label" }],
            hasMore: false,
          }),
        { owner: api, token: late },
      ),
    ).toBe(false);
    await api.dispose();
    await late.dispose();
    if (pending) await pending.dispose();
  });
