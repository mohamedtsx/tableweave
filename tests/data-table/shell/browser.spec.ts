import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/data-table/shell/browser.html");
  await expect(page.locator("#english-shell").first()).toBeVisible();
});
test("real minimal default builder, explicit configured tools, one native scroller", async ({
  page,
}) => {
  const minimal = page.locator('[data-shell-fixture="english"]').nth(0),
    configured = page.locator('[data-shell-fixture="english"]').nth(1);
  await expect(minimal.locator(".tw-filter-builder")).toHaveCount(1);
  await expect(minimal.getByPlaceholder("Search shell records")).toHaveCount(0);
  await expect(
    configured.getByPlaceholder("Search shell records"),
  ).toBeVisible();
  await expect(configured.getByRole("table")).toHaveCount(1);
  await expect(
    configured.locator(".tw-data-table__collection .tw-native-collection"),
  ).toHaveCount(1);
});
test("ordinary model/config refresh preserves React memo/forwardRef/class forms and caret", async ({
  page,
}) => {
  const root = page.locator('[data-shell-fixture="english"]').nth(1);
  await page.evaluate(() => window.tableShell.configured.custom());
  const input = root.getByRole("textbox", {
    name: "Uncontrolled toolbar draft",
  });
  await input.fill("Kept value");
  await input.focus();
  await input.evaluate((node) => {
    if (node instanceof HTMLInputElement) node.setSelectionRange(3, 3);
  });
  const handle = await input.elementHandle();
  await root
    .getByRole("textbox", { name: "Memo cell draft" })
    .fill("Memo edit");
  await input.focus();
  await page.evaluate(() => window.tableShell.configured.refresh());
  expect(await input.evaluate((actual, old) => actual === old, handle)).toBe(
    true,
  );
  await expect(input).toHaveValue("Kept value");
  await expect(input).toBeFocused();
  expect(
    await input.evaluate((n) =>
      n instanceof HTMLInputElement ? n.selectionStart : null,
    ),
  ).toBe(3);
  await expect(
    root.getByRole("textbox", { name: "Memo cell draft" }),
  ).toHaveValue("Memo edit");
  await expect(
    root.getByRole("textbox", { name: "Forward cell draft" }),
  ).toBeVisible();
  await expect(
    root.getByRole("textbox", { name: "Class cell draft" }),
  ).toBeVisible();
});
test("selection swaps normal tools intentionally; external results remain independent", async ({
  page,
}) => {
  const root = page.locator('[data-shell-fixture="english"]').nth(1),
    external = root.getByRole("textbox", { name: "External result draft" });
  await external.fill("External edit");
  const node = await external.elementHandle();
  await page.evaluate(() => window.tableShell.configured.select());
  await expect(
    root.getByRole("button", { name: "Inspect selection" }),
  ).toBeVisible();
  await expect(root.getByPlaceholder("Search shell records")).toHaveCount(0);
  await expect(external).toHaveValue("External edit");
  expect(await external.evaluate((a, b) => a === b, node)).toBe(true);
  await root.getByRole("button", { name: "Clear row selection" }).click();
  await expect(root.getByPlaceholder("Search shell records")).toBeVisible();
  // Normal tool unmount is intentional; no assertion that its local draft survives.
});
test("actual details join keeps form on parent B and refetch association is not an ID clone", async ({
  page,
}) => {
  await page.evaluate(() => window.tableShell.configured.open());
  const input = page.getByRole("textbox", { name: "Detail draft" });
  await input.fill("Detail edit");
  await input.focus();
  const node = await input.elementHandle();
  await page.evaluate(() => window.tableShell.configured.refresh());
  await page.setViewportSize({ width: 390, height: 820 });
  await expect(input).toHaveValue("Detail edit");
  expect(await input.evaluate((a, b) => a === b, node)).toBe(true);
  await page.evaluate(() => window.tableShell.configured.refetch());
  await expect(page.locator('[data-row-association="false"]')).toContainText(
    "Independent record",
  );
  await expect(input).toHaveValue("Detail edit");
});
test("same C/P but second genuine P2 owner cannot borrow details A", async ({
  page,
}) => {
  await page.evaluate(() => window.tableShell.configured.foreign());
  await expect
    .poll(() =>
      page.evaluate(() => window.tableShell.configured.status().detailsActor),
    )
    .toBe(false);
  const before = await page.evaluate(() =>
    window.tableShell.configured.counters(),
  );
  await page.evaluate(() => window.tableShell.configured.refresh());
  const after = await page.evaluate(() =>
    window.tableShell.configured.counters(),
  );
  expect(after.read).toBe(before.read);
  expect(after.body).toBe(before.body);
});
test("exclusive claim rejects second table; stale release cannot clear current join", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.tableShell.configured.wrongJoin()),
  ).toEqual({ denied: true, oldAlive: true });
});
test("old deferred policy/session cannot act/focus a remounted table", async ({
  page,
}) => {
  await page.evaluate(async () => {
    await window.tableShell.configured.open();
    window.oldShellDetails = window.tableShell.configured.oldDetails();
    window.tableShell.configured.dirty();
    void window.oldShellDetails.close();
    window.tableShell.configured.detach();
    window.tableShell.configured.reattach();
    window.tableShell.configured.resolve();
  });
  expect(
    await page.evaluate(() => window.oldShellDetails?.open()),
  ).toMatchObject({ status: "stale" });
  await page.evaluate(() => window.oldShellDetails?.focus());
});
test("source-only initial failure/Retry is separate, retained refresh error keeps actual rows", async ({
  page,
}) => {
  await page.evaluate(() => {
    window.tableShell.remote.start();
    window.tableShell.remote.fail();
  });
  expect(
    await page.evaluate(() => window.tableShell.remote.oldRetry()),
  ).toEqual({ denied: true, callsA: 0, callsB: 0 });
  const root = page.locator('[data-shell-fixture="english"]').nth(4);
  await expect(root.getByText("The connection is unavailable.")).toBeVisible();
  await root.getByRole("button", { name: "Retry", exact: true }).click();
  await page.evaluate(() => window.tableShell.remote.succeed());
  await expect(root.getByRole("table")).toBeVisible();
  await page.evaluate(() => {
    window.tableShell.remote.start();
    window.tableShell.remote.fail();
  });
  await expect(root.getByRole("table")).toBeVisible();
  expect(
    (await page.evaluate(() => window.tableShell.remote.status())).recovery,
  ).toMatchObject({ kind: "records", notice: "update-failed" });
});
test("unknown empty is not labelled as filtered; disabled pager stays absent; complete uses real complete resource", async ({
  page,
}) => {
  await page.evaluate(() => {
    window.tableShell.complete.start();
    window.tableShell.complete.succeed("unknown");
  });
  expect(
    (await page.evaluate(() => window.tableShell.complete.status())).recovery,
  ).toMatchObject({ kind: "empty", cause: "unknown" });
  await expect(
    page
      .locator('[data-shell-fixture="english"]')
      .nth(2)
      .locator(".tw-pagination"),
  ).toHaveCount(0);
});
test("disabled schema does not even capture formatter/correction accessors", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.tableShell.disabled.disabledPorts()),
  ).toEqual({ reads: 0, actor: true, formatter: true });
});
test("old source custom callback A does not call B", async ({ page }) => {
  expect(
    await page.evaluate(() =>
      window.tableShell.configured.sourceCallbackOwnership(),
    ),
  ).toEqual({ rejected: true, callsA: 0, callsB: 0 });
});
test("actual normalized collection dictionaries keep original override receiver", async ({
  page,
}) => {
  const value = await page.evaluate(() =>
    window.tableShell.configured.dictionaryReceiver(),
  );
  expect(value.calls).toBeGreaterThan(0);
  expect(value.bad).toBe(0);
});
test("actual publication A to B to A-shaped values cannot revive old source callback", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.tableShell.configured.publicationABA()),
  ).toEqual({ denied: true, calls: 0, actor: true });
});
test("actual owned renderState Promise completion cannot deliver through retired actor A", async ({
  page,
}) => {
  expect(
    await page.evaluate(() =>
      window.tableShell.configured.staleStateCompletion(),
    ),
  ).toEqual({ denied: true });
});
test("unselectable current row still has a genuine details trigger; offpage programmatic details has no fabricated row", async ({
  page,
}) => {
  const root = page.locator('[data-shell-fixture="english"]').nth(1);
  await root.getByRole("button", { name: "Next", exact: true }).click();
  await expect(root.getByRole("button", { name: "Details two" })).toBeEnabled();
  await root.getByRole("button", { name: "Details two" }).click();
  await expect(
    page.getByRole("textbox", { name: "Detail draft" }),
  ).toBeVisible();
});
test("independently supplied offpage detail record is not projected into a native row", async ({
  page,
}) => {
  await page.evaluate(() => window.tableShell.configured.open("two"));
  await expect(page.locator('[data-row-association="false"]')).toContainText(
    "Independent record",
  );
});
test("candidate Suspense does not capture shell private config", async ({
  page,
}) => {
  await page.evaluate(() => window.tableShell.configured.suspend());
  expect(
    (await page.evaluate(() => window.tableShell.configured.status())).reads,
  ).toBe(0);
});
test("true publication reset masks details and purges owned library actor", async ({
  page,
}) => {
  await page.evaluate(() => window.tableShell.configured.open());
  await page.evaluate(() => window.tableShell.configured.reset());
  await expect(page.getByRole("textbox", { name: "Detail draft" })).toHaveCount(
    0,
  );
  expect(
    (await page.evaluate(() => window.tableShell.configured.status()))
      .detailsActor,
  ).toBe(false);
});
for (const width of [320, 390, 768, 1024, 1440])
  test(`authored RTL width ${width} screenshot`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const shell = page.locator("#arabic-shell");
    await expect(shell).toHaveAttribute("dir", "rtl");
    await expect(shell).toHaveScreenshot(`shell-rtl-${width}.png`);
  });
