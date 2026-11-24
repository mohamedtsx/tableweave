import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/data-table/details-accessory/browser.html");
});
test("source-only first mount has no private detail reader/body and no fabricated pair", async ({
  page,
}) => {
  await expect
    .poll(() =>
      page.evaluate(() => window.boundDetails.sourceOnly.state().phase),
    )
    .toBe("no-display");
  const state = await page.evaluate(() =>
    window.boundDetails.sourceOnly.state(),
  );
  expect(state.read).toBe(0);
  expect(state.body).toBe(0);
  expect(state.ports).toBe(false);
});
test("genuine source/owner and selection-disabled row trigger; new record object has no fake native row", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Details one" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("[data-row]")).toHaveText("actual row");
  await page.evaluate(() => window.boundDetails.client.refresh());
  await expect(page.locator("[data-row]")).toHaveText("no row");
  expect(await page.evaluate(() => window.boundDetails.client.identity())).toBe(
    true,
  );
  expect(await page.evaluate(() => window.boundDetails.client.rows())).toBe(
    true,
  );
});
test("controlled/uncontrolled form identity, caret and drafts survive allowed config/frame/width updates", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Details one" }).click();
  const controlled = page.getByRole("textbox", { name: "Controlled draft" }),
    uncontrolled = page.getByRole("textbox", { name: "Uncontrolled draft" });
  await controlled.fill("Kept controlled");
  await uncontrolled.fill("Kept uncontrolled");
  await controlled.focus();
  await controlled.evaluate((node) => {
    if (node instanceof HTMLInputElement) node.setSelectionRange(3, 3);
  });
  const element = await controlled.elementHandle();
  await page.evaluate(() => {
    window.boundDetails.client.configB();
    window.boundDetails.client.refresh();
    window.boundDetails.client.query();
  });
  await page.setViewportSize({ width: 390, height: 850 });
  await expect(controlled).toHaveValue("Kept controlled");
  await expect(uncontrolled).toHaveValue("Kept uncontrolled");
  expect(await controlled.evaluate((node, old) => node === old, element)).toBe(
    true,
  );
  await expect(controlled).toBeFocused();
  expect(
    await controlled.evaluate((node) =>
      node instanceof HTMLInputElement ? node.selectionStart : null,
    ),
  ).toBe(3);
});
test("A deferred dirty decision cannot close or call B ports after B actual commit", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Details one" }).click();
  await page.evaluate(() => window.boundDetails.client.dirty(true));
  await page.getByRole("button", { name: "Close details" }).click();
  await page.evaluate(() => window.boundDetails.client.configB());
  await page.evaluate(() => window.boundDetails.client.resolve(true));
  await expect(page.getByRole("dialog")).toBeVisible();
});
test("real P purge masks body and retires old actor without library transport/owner disposal", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Details one" }).click();
  await page.evaluate(() => window.boundDetails.client.reset());
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("[data-form]")).toHaveCount(0);
});

test("real legacy/adopted hooks and copied/proxied session denial precede alleged fields", async ({
  page,
}) => {
  await page.evaluate(() => window.boundDetails.client.probeSessions());
  await expect
    .poll(() =>
      page.evaluate(() => window.boundDetails.client.sessionIdentity()),
    )
    .toEqual({ legacy: "legacy", adopted: "adopted", denied: 3, trapReads: 0 });
});
test("source-only config and a suspended candidate perform zero private descriptor capture", async ({
  page,
}) => {
  await page.evaluate(() => window.boundDetails.sourceOnly.poison());
  expect(
    await page.evaluate(
      () => window.boundDetails.sourceOnly.state().descriptorReads,
    ),
  ).toBe(0);
  await page.evaluate(() => window.boundDetails.client.poison(true));
  await expect(page.getByText("Suspended candidate")).toBeVisible();
  expect(
    await page.evaluate(
      () => window.boundDetails.client.state().descriptorReads,
    ),
  ).toBe(0);
  await page.evaluate(() => window.boundDetails.client.recover());
});
test("strict-stale A waits in a real purgeable output slot without another private read/projection", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Details one" }).click();
  const input = page.getByRole("textbox", { name: "Controlled draft" });
  await input.fill("Waiting draft");
  await input.focus();
  expect(
    await page.evaluate(() => window.boundDetails.client.waiting()),
  ).toEqual({ waiting: true, sameHeld: true, readDelta: 0, bodyDelta: 0 });
  await expect(input).toHaveValue("Waiting draft");
});
test("controlled reject preserves form; accepted close is not optimistic; all original receivers survive", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Details one" }).click();
  await page.evaluate(() => window.boundDetails.client.controlled(true));
  const input = page.getByRole("textbox", { name: "Uncontrolled draft" });
  await input.fill("Rejected draft");
  await page.getByRole("button", { name: "Close details" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.evaluate(() => window.boundDetails.client.reject());
  await expect(input).toHaveValue("Rejected draft");
  await page.getByRole("button", { name: "Close details" }).click();
  await page.evaluate(() => window.boundDetails.client.accept());
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => window.boundDetails.client.state().counters.badReceiver,
    ),
  ).toBe(0);
});
test("saved actor A command cannot use actual B ports after B commit or same-ID session ABA", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Details one" }).click();
  await page.evaluate(() => window.boundDetails.client.save());
  await page.evaluate(() => window.boundDetails.client.configB());
  expect(
    await page.evaluate(() => window.boundDetails.client.callSaved()),
  ).toEqual({ status: "stale" });
  await page.evaluate(() => {
    window.boundDetails.client.save();
    window.boundDetails.client.sessionABA();
  });
  expect(
    await page.evaluate(() => window.boundDetails.client.callSaved()),
  ).toEqual({ status: "stale" });
  await expect(page.getByRole("dialog")).toBeVisible();
});
test("off-page open record remains readable while its unloaded row cannot be triggered", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Details one" }).click();
  await page.evaluate(() => window.boundDetails.client.offpage());
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("[data-row]")).toHaveText("no row");
  await expect(page.getByRole("button", { name: "Details one" })).toHaveCount(
    0,
  );
  await page.evaluate(() =>
    window.boundDetails.client.programmatic("unloaded-independent"),
  );
  await expect(page.locator("[data-status]")).toHaveText("missing");
  await expect(page.getByRole("dialog")).toBeVisible();
});
test("retry continuation A cannot use B readers or callbacks", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Details one" }).click();
  await page.evaluate(() => {
    window.boundDetails.client.error();
    window.boundDetails.client.deferRetry();
    window.boundDetails.client.saveRetry();
  });
  await page.evaluate(() => {
    void window.boundDetails.client.callSavedRetry();
  });
  await page.evaluate(() => window.boundDetails.client.configB());
  const before = await page.evaluate(
    () => window.boundDetails.client.state().read,
  );
  await page.evaluate(() => window.boundDetails.client.resolveRetry());
  expect(
    await page.evaluate(() => window.boundDetails.client.state().read),
  ).toBe(before);
});
test("real shared core stale leases, local purge, no purge callback and bare denied-UI close", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Details one" }).click();
  expect(
    await page.evaluate(() => window.boundDetails.client.coreProbe()),
  ).toEqual({
    staleLeaseSafe: true,
    denied: true,
    purged: true,
    noPrivateCallbacks: true,
    controllerAlive: true,
    bareCleanup: "committed",
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("real independent C/P/model owners cannot be substituted", async ({
  page,
}) => {
  await page.evaluate(() => window.boundDetails.mountOther());
  await expect
    .poll(() => page.evaluate(() => window.boundDetails.foreign()))
    .toBe(true);
});
test("independent app context access loss clears its actual owned output before another body call", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Details one" }).click();
  expect(
    await page.evaluate(() => window.boundDetails.client.accessLoss()),
  ).toBe(true);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("[data-form]")).toHaveCount(0);
});
test("logical-end RTL/fullscreen shares the existing single drawer and preserves the form node", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Details one" }).click();
  const input = page.getByRole("textbox", { name: "Controlled draft" }),
    node = await input.elementHandle();
  await page.evaluate(() => window.boundDetails.client.rtl());
  await expect(page.getByRole("dialog")).toHaveAttribute("dir", "rtl");
  await page.setViewportSize({ width: 320, height: 780 });
  expect(await input.evaluate((actual, old) => actual === old, node)).toBe(
    true,
  );
  await expect(page.getByRole("dialog")).toHaveCount(1);
});
test("queued old close never steals focus from an accepted newer dialog", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Details one" }).click();
  const before = await page.evaluate(
    () => window.boundDetails.client.state().counters.focus,
  );
  await page.evaluate(() => window.boundDetails.client.closeThenOpen());
  await expect
    .poll(() => page.evaluate(() => window.boundDetails.client.state().rowId))
    .toBe("two");
  await expect(page.getByRole("dialog")).toBeVisible();
  const input = page.getByRole("textbox", { name: "Controlled draft" });
  await input.focus();
  await expect(input).toBeFocused();
  expect(
    await page.evaluate(
      () => window.boundDetails.client.state().counters.focus,
    ),
  ).toBe(before);
});
test("removed trigger close leaves no focus in disconnected/private form content", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Details one" }).click();
  await page.evaluate(() => window.boundDetails.client.offpage());
  await page.evaluate(() => window.boundDetails.client.close());
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(() => {
      const active = document.activeElement;
      return (
        !!active?.isConnected && !active.closest("[inert],.tw-details__dialog")
      );
    }),
  ).toBe(true);
});
