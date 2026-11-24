import { expect, type Page, test } from "@playwright/test";
import type { ProbeFlags, ProbeId } from "./probe-fixture.js";

const errors = new WeakMap<Page, string[]>();
const requests = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const captured: string[] = [];
  const modules: string[] = [];
  errors.set(page, captured);
  requests.set(page, modules);
  page.on("pageerror", (error) => captured.push(error.message));
  page.on("request", (request) =>
    modules.push(decodeURIComponent(request.url())),
  );
});
test.afterEach(({ page }) => {
  expect(errors.get(page)).toEqual([]);
  expect(
    (requests.get(page) ?? []).filter(
      (url) =>
        /\/packages\/(?:react|heroui)\/src\//.test(url) ||
        url.includes("/wp08-fc01-") ||
        url.includes("/tableweave-wp08/") ||
        url.includes("/home/mohamed/Desktop/"),
    ),
  ).toEqual([]);
});

const root = (page: Page, id: ProbeId = "first") => page.locator(`#${id}`);
const cancel = (page: Page, id: ProbeId = "first") =>
  root(page, id).getByRole("button", {
    name: "Cancel — Clear row selection",
    exact: true,
  });
const trigger = (page: Page) =>
  root(page).getByRole("button", {
    name: "Add filter rule: Filters",
    exact: true,
  });
const inspect = (page: Page, id: ProbeId = "first") =>
  page.evaluate((id) => {
    const actor = window.focusHandoff[id];
    if (!actor) throw new Error(`Missing committed actor ${id}`);
    return actor.inspect();
  }, id);

async function open(page: Page, query = "") {
  await page.goto(`/probe.html?${query}`);
  await expect(
    root(page).getByRole("grid", { name: "first records" }),
  ).toBeVisible();
  await expect(root(page)).toHaveAttribute("data-owner-match", "true");
  await expect
    .poll(() => page.evaluate(() => !!window.focusHandoff.first))
    .toBe(true);
}
async function editor(page: Page) {
  await root(page)
    .getByRole("button", { name: /^Value: Amount: / })
    .click();
  const input = page.getByRole("textbox", { name: "Value", exact: true });
  await input.fill("70");
  await expect(input).toBeFocused();
}
async function select(page: Page, flags: Partial<ProbeFlags> = {}) {
  await page.evaluate((flags) => {
    const actor = window.focusHandoff.first;
    if (!actor) throw new Error("Missing committed first actor");
    actor.select(flags);
  }, flags);
}
async function externalCancel(page: Page, flags: Partial<ProbeFlags>) {
  await page.evaluate((flags) => {
    const actor = window.focusHandoff.first;
    if (!actor) throw new Error("Missing committed first actor");
    actor.cancel(flags);
  }, flags);
}

for (const strict of [false, true])
  test(`actual builder input -> enabled Cancel -> normal focus and draft discard; strict=${strict}`, async ({
    page,
  }) => {
    await open(page, strict ? "strict" : "");
    const before = await inspect(page);
    await editor(page);
    await select(page);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(cancel(page)).toBeEnabled();
    await expect(cancel(page)).toBeFocused();
    expect(
      await cancel(page).evaluate((node) => node.closest("[inert]") === null),
    ).toBe(true);
    await cancel(page).click();
    await expect(trigger(page)).toBeFocused();
    const after = await inspect(page);
    expect(after.query).toEqual(before.query);
    expect(after.selected).toEqual([]);
    expect(after.counters).toEqual({ restore: 1, action: 0, error: 0 });
    await root(page)
      .getByRole("button", { name: /^Value: Amount: / })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Value", exact: true }),
    ).toHaveValue("20");
  });

test("surviving external focus is not stolen by accepted selection replacement", async ({
  page,
}) => {
  await open(page);
  const survivor = root(page).getByTestId("survivor");
  await survivor.focus();
  await select(page);
  await expect(cancel(page)).toBeVisible();
  await expect(survivor).toBeFocused();
  expect((await inspect(page)).counters).toEqual({
    restore: 0,
    action: 0,
    error: 0,
  });
});

test("parent-layout live expected/source denial blocks private focus/action/error handoff", async ({
  page,
}) => {
  await open(page);
  await editor(page);
  await select(page, { deny: true });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(cancel(page)).toBeVisible();
  await expect(cancel(page)).not.toBeFocused();
  const denied = await inspect(page);
  expect(denied.blockedReason).toBe("context");
  expect(denied.requestedQueryPresent).toBe(false);
  expect(denied.expectedAccess).toBe(false);
  expect(denied.sourceAccess).toBe(false);
  // The stale render still exposes this real toolbar button. The genuine
  // event-time authority must withhold both action and private error callbacks.
  await root(page)
    .getByRole("button", { name: "Probe action", exact: true })
    .click();
  expect((await inspect(page)).counters).toEqual({
    restore: 0,
    action: 0,
    error: 0,
  });
});

test("initial selection followed by denied normal return invokes no private callbacks", async ({
  page,
}) => {
  await open(page, "initial-selection");
  await cancel(page).focus();
  await externalCancel(page, { deny: true });
  await expect(cancel(page)).toHaveCount(0);
  await expect(root(page).getByTestId("normal")).toBeVisible();
  await expect(trigger(page)).not.toBeFocused();
  const denied = await inspect(page);
  expect(denied.blockedReason).toBe("context");
  expect(denied.expectedAccess).toBe(false);
  expect(denied.sourceAccess).toBe(false);
  expect(denied.counters).toEqual({ restore: 0, action: 0, error: 0 });
});

test("two StrictMode native/controller owners preserve the other instance focus and state", async ({
  page,
}) => {
  await open(page, "pair&strict");
  await expect(
    root(page, "second").getByRole("grid", { name: "second records" }),
  ).toBeVisible();
  await expect(root(page, "second")).toHaveAttribute(
    "data-owner-match",
    "true",
  );
  expect(
    await page.evaluate(() => {
      const a = window.focusHandoff.first?.owner;
      const b = window.focusHandoff.second?.owner;
      return (
        !!a &&
        !!b &&
        a !== b &&
        a.controller !== b.controller &&
        a.definition !== b.definition
      );
    }),
  ).toBe(true);
  const before = await inspect(page, "second");
  const survivor = root(page, "second").getByTestId("survivor");
  await survivor.focus();
  await select(page);
  await expect(cancel(page)).toBeVisible();
  await expect(survivor).toBeFocused();
  await expect(root(page, "second").getByTestId("normal")).toBeVisible();
  const after = await inspect(page, "second");
  expect(after.query).toEqual(before.query);
  expect(after.selected).toEqual([]);
  expect(after.counters).toEqual({ restore: 0, action: 0, error: 0 });
  expect((await inspect(page)).counters).toEqual({
    restore: 0,
    action: 0,
    error: 0,
  });
});

for (const mode of ["revokeInRestore", "externalInRestore"] as const)
  test(`application fallback ${mode} prevents subsequent private focus work`, async ({
    page,
  }) => {
    await open(page, "initial-selection");
    await cancel(page).focus();
    await externalCancel(page, { [mode]: true });
    await expect(cancel(page)).toHaveCount(0);
    await expect(trigger(page)).toBeVisible();
    await expect(trigger(page)).not.toBeFocused();
    if (mode === "externalInRestore")
      await expect(root(page).getByTestId("survivor")).toBeFocused();
    else {
      const denied = await inspect(page);
      expect(denied.blockedReason).toBe("context");
      expect(denied.expectedAccess).toBe(false);
      expect(denied.sourceAccess).toBe(false);
    }
    expect((await inspect(page)).counters).toEqual({
      restore: 1,
      action: 0,
      error: 0,
    });
  });

for (const mode of ["rapid", "unmount"] as const)
  test(`StrictMode ${mode} invalidates obsolete focus callbacks`, async ({
    page,
  }) => {
    await open(page, "strict");
    const before = (await inspect(page)).query;
    await editor(page);
    await select(page, { [mode]: true });
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(cancel(page)).toHaveCount(0);
    if (mode === "rapid")
      await expect(root(page).getByTestId("normal")).toBeVisible();
    else await expect(root(page).getByTestId("normal")).toHaveCount(0);
    expect((await inspect(page)).counters).toEqual({
      restore: 0,
      action: 0,
      error: 0,
    });
    const survivor = root(page).getByTestId("survivor");
    await expect(survivor).toBeEnabled();
    await survivor.click();
    await expect(root(page).getByLabel("first external clicks")).toHaveText(
      "1",
    );
    await expect(survivor).toBeFocused();
    const after = await inspect(page);
    expect(after.query).toEqual(before);
    expect(after.counters).toEqual({ restore: 0, action: 0, error: 0 });
  });
