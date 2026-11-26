import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/criteria-facade-config/browser.html");
  await expect
    .poll(() => page.evaluate(() => window.facadeSource.client.state().ready))
    .toBe(true);
});
for (const throws of [false, true])
  test(`actual parent B inside descriptor ${throws ? "throw" : "return"} skips without touching A`, async ({
    page,
  }) => {
    const result = await page.evaluate(
      (value) => window.facadeSource.client.supersede(value),
      throws,
    );
    expect(result).toMatchObject({
      sameActor: true,
      sameSnapshot: true,
      sameHostVersion: true,
      draft: "kept",
      fired: 0,
      denied: false,
      observed: 0,
      bReads: 0,
    });
  });
test("source ticket and input identities survive unrelated parent B/model publication", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.facadeSource.client.tickets())).toBe(
    true,
  );
  expect(
    await page.evaluate(() => window.facadeSource.client.coalescing()),
  ).toEqual({ eligible: true, same: true });
});
for (const variant of [
  "malformed",
  "reset",
  "reentry",
  "initial",
  "forged",
] as const)
  test(`actual ${variant} path remains fail-closed`, async ({ page }) => {
    expect(
      await page.evaluate(
        (value) => window.facadeSource.client.supersede(true, value),
        variant,
      ),
    ).toMatchObject({ denied: true });
  });
test("closed receipt checks exact carrier/cell/input and is one use", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.facadeSource.client.receipts()),
  ).toEqual({ wrong: false, first: true, reused: false });
});
test("actual native cancellation boundary never gains the pre-publication skip grant", async ({
  page,
}) => {
  const result = await page.evaluate(() =>
    window.facadeSource.client.postBoundary(),
  );
  expect(result.denied).toBe(true);
  expect(result.skip).toBe(false);
  expect(result.cancels).toBeGreaterThanOrEqual(2);
});
test("real builder CELL uses schema ID fallback, actual registry and actual processing source", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.facadeSource.client.builder()),
  ).toMatchObject({ label: "amount", mode: "client", registry: true });
  await expect
    .poll(() => page.evaluate(() => window.facadeSource.complete.state().ready))
    .toBe(true);
  expect(
    await page.evaluate(() => window.facadeSource.complete.builder()),
  ).toMatchObject({ label: "amount", mode: "server", registry: true });
});
test("user overrides win and original function/dictionary receivers stay child-owned across parent B", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.facadeSource.client.defaultsAndOwners()),
  ).toMatchObject({
    label: "User amount",
    alias: true,
    filters: "User filters",
    custom: "User comparison",
    builtin: true,
    format: "User amount",
    editor: "Actual dictionary receiver",
    whileB: "a-rule",
    staleDenied: true,
    bad: 0,
    bCalls: 0,
  });
});
test("real P purge drops parent opaque slots; old handles remain only historical metadata", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.facadeSource.client.purge()),
  ).toMatchObject({
    before: true,
    state: "denied",
    sameMetadata: true,
    actor: null,
  });
});
test("unready/suspended candidate never traverses opaque parent config", async ({
  page,
}) => {
  await page.evaluate(() => window.facadeSource.client.unreadyCandidate());
  await expect(page.getByText("Suspended facade candidate")).toBeVisible();
  expect(
    await page.evaluate(() => window.facadeSource.client.state().gets),
  ).toBe(0);
});
test("actual Search deadline/text/caret and Tabs uncontrolled results survive unchanged parent B", async ({
  page,
}) => {
  await page.evaluate(() => window.facadeSource.client.show());
  const search = page.getByPlaceholder("Synthetic search"),
    results = page.getByRole("textbox", { name: "Independent results draft" });
  await results.fill("Kept results");
  await page.clock.install();
  await search.fill("Synthetic pending");
  await search.focus();
  await search.evaluate((node) => {
    if (node instanceof HTMLInputElement) node.setSelectionRange(4, 4);
  });
  const old = await search.elementHandle();
  await page.clock.runFor(150);
  await page.evaluate(() => window.facadeSource.client.parentB());
  await page.evaluate(() => {
    window.facadeSource.client.selection();
    window.facadeSource.client.query();
  });
  await expect(search).toHaveValue("Synthetic pending");
  await expect(search).toBeFocused();
  await expect(results).toHaveValue("Kept results");
  expect(
    await search.evaluate((node, previous) => node === previous, old),
  ).toBe(true);
  expect(
    await search.evaluate((node) =>
      node instanceof HTMLInputElement ? node.selectionStart : null,
    ),
  ).toBe(4);
  await page.clock.runFor(151);
  expect(
    await page.evaluate(() => window.facadeSource.client.state().observed),
  ).toBe(1);
});
test("actual Search IME state survives parent/model revision without submitting composition", async ({
  page,
}) => {
  await page.evaluate(() => window.facadeSource.client.show());
  const search = page.getByPlaceholder("Synthetic search");
  await page.clock.install();
  await search.dispatchEvent("compositionstart");
  await search.fill("Synthetic composing");
  await page.evaluate(() => window.facadeSource.client.parentB());
  await page.clock.runFor(500);
  expect(
    await page.evaluate(() => window.facadeSource.client.state().observed),
  ).toBe(0);
  await search.dispatchEvent("compositionend");
  await page.clock.runFor(301);
  expect(
    await page.evaluate(() => window.facadeSource.client.state().observed),
  ).toBe(1);
});
test("actual Date edit subtree survives unrelated parent B and width changes", async ({
  page,
}) => {
  await page.evaluate(() => window.facadeSource.client.show());
  await page.locator(".tw-filter-date-actions button").first().click();
  const editor = page.locator(".tw-filter-date-editor"),
    node = await editor.elementHandle();
  await expect(editor).toBeVisible();
  const segment = editor.getByRole("spinbutton").first();
  await segment.focus();
  await segment.press("ArrowUp");
  const segmentNode = await segment.elementHandle(),
    text = await segment.textContent();
  await page.evaluate(() => window.facadeSource.client.parentB());
  await page.setViewportSize({ width: 390, height: 820 });
  expect(
    await editor.evaluate((actual, previous) => actual === previous, node),
  ).toBe(true);
  await expect(editor).toBeVisible();
  expect(
    await segment.evaluate(
      (actual, previous) => actual === previous,
      segmentNode,
    ),
  ).toBe(true);
  expect(await segment.textContent()).toBe(text);
  await expect(segment).toBeFocused();
});
