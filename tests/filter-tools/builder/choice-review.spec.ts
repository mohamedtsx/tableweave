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

async function loadedPerson(page: Page, scalar = false) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Seed async rule", exact: true })
    .click();
  await expect(page.getByLabel("Applied rules")).toContainText('"value":[99]');
  await page
    .getByRole("button", { name: "Hold proposals", exact: true })
    .click();
  if (scalar) {
    await page.evaluate(() =>
      window.builderReview.dispatchAndAccept({
        type: "builder.commit",
        rule: {
          id: "async-rule",
          field: "person",
          operator: "enum.is",
          value: 99,
        },
      }),
    );
  }
  await page.getByRole("button", { name: /^Value: Person(?::|$)/ }).click();
  await page
    .getByRole("textbox", { name: "Search options", exact: true })
    .fill("A");
  await page.evaluate(() => {
    if (
      !window.builderReview.settleOptions([
        { id: 1, label: "A one" },
        { id: 2, label: "A two" },
      ])
    )
      throw new Error("Synthetic page did not settle");
  });
  await expect(
    page.getByRole("option", { name: "A one", exact: true }),
  ).toBeEnabled();
}

test("n10 same-turn pending page blocks stale membership addition and recovered-label deselection without a proposal", async ({
  page,
}, testInfo) => {
  await loadedPerson(page);
  const result = await page.evaluate(() => {
    const addition = [...document.querySelectorAll('[role="option"]')].find(
      (node) => node.textContent === "A one",
    );
    const deselection = [...document.querySelectorAll('[role="option"]')].find(
      (node) => node.textContent === "Person scope one",
    );
    if (
      !(addition instanceof HTMLElement) ||
      !(deselection instanceof HTMLElement)
    )
      throw new Error("Missing live choices");
    const before = window.builderReview.inspect();
    window.builderReview.beginOptions("B");
    const pending = window.builderReview.inspect().options;
    const connected = addition.isConnected && deselection.isConnected;
    addition.click();
    window.builderReview.acceptPending();
    const afterAddition = window.builderReview.inspect();
    deselection.click();
    window.builderReview.acceptPending();
    return {
      connected,
      before,
      pending,
      afterAddition,
      after: window.builderReview.inspect(),
    };
  });
  await testInfo.attach("same-turn-pending-choice", {
    body: JSON.stringify(result),
    contentType: "application/json",
  });
  expect(result.connected).toBe(true);
  expect(result.pending.kind).toBe("pending");
  expect(result.pending.page).toBeNull();
  expect(result.pending.canChoose).toBe(false);
  expect(result.afterAddition.proposalCount).toBe(result.before.proposalCount);
  expect(result.after.proposalCount).toBe(result.before.proposalCount);
  expect(result.after.pending).toBe(false);
  expect(result.after.rules[0]?.value).toEqual([99]);
  expect(result.after.options.request?.term).toBe("B");
  expect(result.after.options.kind).toBe("pending");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "filter changed" }),
  ).toBeVisible();
  // Remove is an independent explicit action, not option eligibility.
  await page
    .getByRole("button", { name: "Cancel filter edit", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Rule options: Person", exact: true })
    .click();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await page
    .getByRole("button", { name: "Accept proposal", exact: true })
    .click();
  await expect(page.getByLabel("Applied rules")).toHaveText(
    '{"join":"and","rules":[]}',
  );
});

test("n10 same-turn new ready token rejects old scalar click even when that ID is still eligible", async ({
  page,
}, testInfo) => {
  await loadedPerson(page, true);
  const result = await page.evaluate(() => {
    const option = [...document.querySelectorAll('[role="option"]')].find(
      (node) => node.textContent === "A one",
    );
    if (!(option instanceof HTMLElement))
      throw new Error("Missing live scalar choice");
    const before = window.builderReview.inspect();
    window.builderReview.beginOptions("B");
    const settled = window.builderReview.settleOptions([
      { id: 1, label: "B one" },
    ]);
    const authority = window.builderReview.inspect().options;
    const connected = option.isConnected;
    option.click();
    window.builderReview.acceptPending();
    return {
      before,
      settled,
      authority,
      connected,
      after: window.builderReview.inspect(),
    };
  });
  await testInfo.attach("same-turn-ready-choice", {
    body: JSON.stringify(result),
    contentType: "application/json",
  });
  expect(result.connected).toBe(true);
  expect(result.settled).toBe(true);
  expect(result.authority.canChoose).toBe(true);
  expect(result.authority.page?.options[0]?.disabled).not.toBe(true);
  expect(result.after.proposalCount).toBe(result.before.proposalCount);
  expect(result.after.rules[0]?.value).toBe(99);
  // A current rendered click remains usable after rejecting the stale one.
  await page.getByRole("option", { name: "B one", exact: true }).click();
  await page
    .locator("nav button")
    .getByText("Accept proposal", { exact: true })
    .evaluate((button) => {
      if (button instanceof HTMLButtonElement) button.click();
    });
  await expect(page.getByLabel("Applied rules")).toContainText('"value":1');
});

test("n10 same-key ready disabled metadata blocks stale final membership deselection", async ({
  page,
}, testInfo) => {
  await loadedPerson(page);
  const result = await page.evaluate(() => {
    const option = [...document.querySelectorAll('[role="option"]')].find(
      (node) => node.textContent === "Person scope one",
    );
    if (!(option instanceof HTMLElement))
      throw new Error("Missing live selected label");
    const before = window.builderReview.inspect();
    const repeatedSuccess = window.builderReview.settleOptions([
      { id: 1, label: "Disallowed second settlement", disabled: true },
    ]);
    window.builderReview.beginOptions("A");
    const settled = window.builderReview.settleOptions([
      { id: 99, label: "Person scope one — unavailable", disabled: true },
      { id: 1, label: "A one — unavailable", disabled: true },
    ]);
    const current = window.builderReview.inspect().options;
    const sameToken = current.request === before.options.request;
    const samePage = current.page === before.options.page;
    const connected = option.isConnected;
    option.click();
    window.builderReview.acceptPending();
    return {
      before,
      repeatedSuccess,
      settled,
      current,
      sameToken,
      samePage,
      connected,
      after: window.builderReview.inspect(),
    };
  });
  await testInfo.attach("same-token-metadata-choice", {
    body: JSON.stringify(result),
    contentType: "application/json",
  });
  expect(result.repeatedSuccess).toBe(false);
  expect(result.settled).toBe(true);
  expect(result.sameToken).toBe(false);
  expect(result.samePage).toBe(false);
  expect(result.connected).toBe(true);
  expect(result.current.canChoose).toBe(true);
  expect(
    result.current.page?.options.find((option) => option.id === 99)?.disabled,
  ).toBe(true);
  expect(result.current.request?.term).toBe(
    result.before.options.request?.term,
  );
  expect(result.current.request?.pageKey).toBe(
    result.before.options.request?.pageKey,
  );
  expect(result.after.proposalCount).toBe(result.before.proposalCount);
  expect(result.after.rules[0]?.value).toEqual([99]);
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("option", {
      name: "Person scope one — unavailable",
      exact: true,
    }),
  ).toBeDisabled();
});

test("n10 same-token selected-label recovery alone preserves eligible current deselection", async ({
  page,
}, testInfo) => {
  await loadedPerson(page);
  const result = await page.evaluate(() => {
    const option = [...document.querySelectorAll('[role="option"]')].find(
      (node) => node.textContent === "Person scope one",
    );
    if (!(option instanceof HTMLElement))
      throw new Error("Missing live selected label");
    const before = window.builderReview.inspect();
    const recovered = window.builderReview.recoverCurrentLabel();
    const current = window.builderReview.inspect().options;
    const connected = option.isConnected;
    option.click();
    window.builderReview.acceptPending();
    return {
      before,
      recovered,
      sameToken: before.options.request === current.request,
      samePage: before.options.page === current.page,
      connected,
      after: window.builderReview.inspect(),
    };
  });
  await testInfo.attach("same-token-label-recovery", {
    body: JSON.stringify(result),
    contentType: "application/json",
  });
  expect(result.connected).toBe(true);
  expect(result.recovered).toBe(true);
  expect(result.sameToken).toBe(true);
  expect(result.samePage).toBe(true);
  expect(result.after.proposalCount).toBe(result.before.proposalCount + 1);
  expect(result.after.rules).toHaveLength(0);
});
