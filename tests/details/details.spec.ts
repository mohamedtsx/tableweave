import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("explicit trigger isolates selection, links, text and row actions; arbitrary content and genuine row", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.getByRole("checkbox", { name: "Select a" }).check();
  await page.getByRole("button", { name: "Row action a", exact: true }).click();
  await page.getByRole("link", { name: "Synthetic transaction" }).click();
  await page.locator("[data-select-text]").first().dblclick();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Details a", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Record details" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("[data-native-row]")).toHaveText("a");
  await expect(page.locator("[data-selected]")).toHaveText("a");
  await expect(dialog.getByText("Supplied summary")).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Record details" }),
  ).toBeFocused();
  await dialog.getByRole("button", { name: "Close details" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Details a", exact: true }),
  ).toBeFocused();
});

for (const method of ["header", "footer", "escape", "backdrop"] as const) {
  test(`dirty denial preserves mounted draft and focus for ${method}`, async ({
    page,
  }) => {
    await page.goto("/fixture.html");
    await page.evaluate(() =>
      window.fixture.set({ policy: "deny", layout: "form" }),
    );
    await page.getByRole("button", { name: "Details c", exact: true }).click();
    // Opening obeys the same policy; allow initial open, then deny all close paths.
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.evaluate(() => window.fixture.set({ policy: "allow" }));
    await page.getByRole("button", { name: "Details c", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Record details" });
    await dialog
      .getByRole("textbox", { name: "Consumer draft" })
      .fill("Do not discard");
    await page.evaluate(() => window.fixture.set({ policy: "deny" }));
    if (method === "header")
      await dialog.getByRole("button", { name: "Close details" }).click();
    if (method === "footer")
      await dialog.getByRole("button", { name: "Footer Cancel" }).click();
    if (method === "escape") await page.keyboard.press("Escape");
    if (method === "backdrop") await page.mouse.click(5, 100);
    await expect(page.locator("[data-outcome]")).toHaveText("blocked");
    await expect(
      dialog.getByRole("textbox", { name: "Consumer draft" }),
    ).toHaveValue("Do not discard");
    await expect(dialog).toBeVisible();
    expect(
      await dialog.evaluate((e) => e.contains(document.activeElement)),
    ).toBe(true);
    await dialog
      .getByRole("button", { name: "Save application draft" })
      .click();
    await expect(dialog.locator("[data-saved]")).toHaveText("1");
    await expect(dialog).toBeVisible();
  });
}

test("controlled proposed opens/closes never mirror; rejection emits no event and remains usable", async ({
  page,
}) => {
  await page.goto("/fixture.html?controlled");
  await page.getByRole("button", { name: "Details a", exact: true }).click();
  await expect(page.locator("[data-outcome]")).toHaveText("submitted");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.evaluate(() => window.fixture.reject());
  await page.getByRole("button", { name: "Details a", exact: true }).click();
  await page.evaluate(() => window.fixture.accept());
  const dialog = page.getByRole("dialog", { name: "Record details" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close details" }).click();
  await expect(dialog).toBeVisible();
  await page.evaluate(() => window.fixture.reject());
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".tw-details__status")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Footer Cancel" }).click();
  await page.evaluate(() => window.fixture.accept());
  await expect(dialog).toHaveCount(0);
});

test("async confirmation and replacement guard current target, same-turn owner changes and ABA", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.getByRole("button", { name: "Details a", exact: true }).click();
  await page.evaluate(() => window.fixture.set({ policy: "async" }));
  await page.getByRole("button", { name: "Close details" }).click();
  await expect(page.locator(".tw-details__status")).toHaveText(
    "Checking whether details can close.",
  );
  await page.getByRole("button", { name: "Footer Cancel" }).click();
  await expect(page.locator("[data-outcome]")).toHaveText("busy");
  await page.evaluate(() => {
    window.fixture.open("b");
    window.fixture.resolve(true);
  });
  await expect(page.locator("[data-target]")).toHaveText("b");
  await expect(page.locator("[data-record-id]")).toHaveText("b");
  await expect(page.locator("[data-outcome]")).toHaveText("stale");
  await page.evaluate(async () => {
    window.fixture.captureClose();
    window.fixture.open("a");
    window.fixture.open("b");
    await window.fixture.invokeSavedClose();
  });
  await expect(page.locator("[data-target]")).toHaveText("b");
  await expect(page.locator("[data-outcome]")).toHaveText("stale");
  await page.evaluate(() => window.fixture.set({ policy: "deny" }));
  await page.getByRole("button", { name: "Open another record" }).click();
  await expect(page.locator("[data-target]")).toHaveText("b");
  // A different requested target is a replacement policy, not an unguarded open.
  await page.evaluate(() => window.fixture.open("a"));
  await page.getByRole("button", { name: "Open another record" }).click();
  await expect(page.locator("[data-outcome]")).toHaveText("blocked");
  await expect(page.locator("[data-target]")).toHaveText("a");
});

test("current app authority is read before policy even without React render; request generation cannot leak old records", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.getByRole("button", { name: "Details a", exact: true }).click();
  await page.evaluate(async () => {
    window.fixture.captureClose();
    const before = window.fixture.read();
    window.fixture.setAuthorityWithoutRender({
      ...before.authority,
      context: { ...before.authority.context, epoch: 1, scopeKey: "scope-b" },
    });
    await window.fixture.invokeSavedClose();
  });
  await expect(page.locator("[data-outcome]")).toHaveText("stale");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Safe table focus" }),
  ).toBeFocused();
  await page.evaluate(() => {
    const state = window.fixture.read();
    const context = { ...state.expected, epoch: 2 };
    window.fixture.set({
      expected: context,
      authority: {
        ...state.authority,
        context,
        generation: state.authority.generation + 1,
      },
    });
  });
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator('.tw-details__body > [role="status"]')).toHaveText(
    "Loading record details.",
  );
  await expect(page.getByText("Supplied summary")).toHaveCount(0);
});

test("off-page record is app-owned, no fabricated native row; retry supplied only for current error", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.getByRole("button", { name: "Details off-page" }).click();
  await expect(page.locator("[data-native-row]")).toHaveText("none");
  await page.evaluate(() => {
    const authority = window.fixture.read().authority;
    window.fixture.set({ source: { authority, status: "missing" } });
  });
  await expect(page.locator('.tw-details__body > [role="status"]')).toHaveText(
    "This record is not available.",
  );
  await expect(
    page.getByRole("button", { name: "Retry", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() => {
    const authority = window.fixture.read().authority;
    window.fixture.set({
      source: { authority, status: "error", code: "offline" },
    });
  });
  await expect(
    page.locator('.tw-details__body > [role="status"]'),
  ).toContainText("Details are unavailable while offline.");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.locator('.tw-details__body > [role="status"]')).toHaveText(
    "Loading record details.",
  );
});

test("removed trigger and access/dataset/definition loss use safe fallback; unmount invalidates pending confirmation", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.getByRole("button", { name: "Details a", exact: true }).click();
  await page.evaluate(() => window.fixture.set({ rows: false }));
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close details" }).click();
  await expect(
    page.getByRole("button", { name: "Safe table focus" }),
  ).toBeFocused();
  for (const field of ["datasetKey", "definitionKey", "access"] as const) {
    await page.evaluate(() => window.fixture.set({ rows: true }));
    await page.getByRole("button", { name: "Details a", exact: true }).click();
    await page.evaluate((field) => {
      const state = window.fixture.read();
      window.fixture.set({
        expected: {
          ...state.expected,
          [field]: field === "access" ? false : "new-context",
          epoch: state.expected.epoch + 1,
        },
      });
    }, field);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Safe table focus" }),
    ).toBeFocused();
    await page.evaluate(() => {
      const state = window.fixture.read();
      window.fixture.set({ expected: state.authority.context });
      window.fixture.controller.dispatch({
        type: "details.change",
        update: { rowId: null },
      });
    });
  }
  await page.getByRole("button", { name: "Details a", exact: true }).click();
  await page.evaluate(() => window.fixture.set({ policy: "async" }));
  await page.getByRole("button", { name: "Close details" }).click();
  await page.evaluate(() => {
    window.fixture.set({ mounted: false });
    window.fixture.resolve(true);
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => window.fixture.controller.getSnapshot().details.rowId,
    ),
  ).toBe("a");
});

test("one overlay and form identity across all widths, logical end, RTL/dark/text expansion and nested Escape", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.evaluate(() => window.fixture.set({ layout: "form" }));
  await page.getByRole("button", { name: "Details c", exact: true }).click();
  const draft = page.getByRole("textbox", { name: "Consumer draft" });
  await draft.fill("Retain across resize");
  const handle = await draft.elementHandle();
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 800 });
    const dialog = page.getByRole("dialog", { name: "Record details" });
    await expect(dialog).toHaveCount(1);
    await expect(draft).toHaveValue("Retain across resize");
    expect(
      await handle?.evaluate(
        (e) => e === document.querySelector('input[name="draft"]'),
      ),
    ).toBe(true);
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.round(box?.width ?? 0)).toBe(width < 768 ? width : 512);
    // Geometry must settle after the genuine vendor entrance/resize animation.
    await expect
      .poll(async () => {
        const settled = await dialog.boundingBox();
        return Math.round((settled?.x ?? 0) + (settled?.width ?? 0));
      })
      .toBe(width);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.dir = "rtl";
    document.documentElement.style.fontSize = "200%";
    window.fixture.set({ direction: "rtl", dark: true, expanded: true });
  });
  const rtl = page.getByRole("dialog", { name: "تفاصيل السجل" });
  expect(Math.round((await rtl.boundingBox())?.x ?? -1)).toBe(0);
  await rtl.getByRole("button", { name: "Nested help" }).click();
  await expect(
    page.getByRole("dialog", { name: "Help", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Help", exact: true }),
  ).toHaveCount(0);
  await expect(rtl).toBeVisible();
  await expect(draft).toHaveValue("Retain across resize");
});

for (const method of ["header", "footer", "escape", "backdrop"] as const) {
  test(`allowed ${method} closes exactly once without changing query or selection`, async ({
    page,
  }) => {
    await page.goto("/fixture.html");
    await page.getByRole("checkbox", { name: "Select a" }).check();
    const before = await page.evaluate(() =>
      JSON.stringify(window.fixture.controller.getSnapshot().query),
    );
    await page.getByRole("button", { name: "Details a", exact: true }).click();
    if (method === "header")
      await page.getByRole("button", { name: "Close details" }).click();
    if (method === "footer")
      await page.getByRole("button", { name: "Footer Cancel" }).click();
    if (method === "escape") await page.keyboard.press("Escape");
    if (method === "backdrop") await page.mouse.click(5, 100);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("[data-selected]")).toHaveText("a");
    expect(
      await page.evaluate(() =>
        JSON.stringify(window.fixture.controller.getSnapshot().query),
      ),
    ).toBe(before);
    expect(await page.evaluate(() => window.fixture.read().policyCalls)).toBe(
      2,
    );
  });
}

test("custom customer layout, error boundary and full interior remain real slots inside one named dialog", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.evaluate(() => window.fixture.set({ layout: "custom" }));
  await page.getByRole("button", { name: "Details b", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Record details" });
  await expect(
    dialog.getByRole("heading", { name: "Custom customer layout" }),
  ).toBeVisible();
  await expect(dialog.getByText("Consumer-defined panel")).toBeVisible();
  await page.evaluate(() => window.fixture.set({ policy: "throw" }));
  await dialog.getByRole("button", { name: "Close details" }).click();
  await expect(page.locator("[data-outcome]")).toHaveText("failed");
  await expect(dialog).toBeVisible();
  await expect(
    page.getByText("Private fixture error must not escape"),
  ).toHaveCount(0);
  await page.evaluate(() =>
    window.fixture.set({ interior: true, policy: "deny" }),
  );
  await expect(
    dialog.getByRole("heading", { name: "Entirely custom interior" }),
  ).toBeVisible();
  await dialog
    .getByRole("textbox", { name: "Custom interior draft" })
    .fill("Retain custom tree");
  await dialog.getByRole("button", { name: "Custom interior exit" }).click();
  await expect(page.locator("[data-outcome]")).toHaveText("blocked");
  await expect(
    dialog.getByRole("textbox", { name: "Custom interior draft" }),
  ).toHaveValue("Retain custom tree");
});

test("closed-reopened and scope ABA generations cannot resurrect records or finish an old confirmation", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.getByRole("button", { name: "Details a", exact: true }).click();
  await page.evaluate(() => {
    const oldSource = window.fixture.read().source;
    window.fixture.controller.dispatch({
      type: "details.change",
      update: { rowId: null },
    });
    window.fixture.open("a");
    window.fixture.set({ source: oldSource });
  });
  await expect(page.locator('.tw-details__body > [role="status"]')).toHaveText(
    "Loading record details.",
  );
  await page.evaluate(() => {
    const state = window.fixture.read();
    window.fixture.set({
      source: {
        authority: state.authority,
        status: "ready",
        record: { id: "a", name: "New session record", description: "New" },
      },
      policy: "async",
    });
  });
  await page.getByRole("button", { name: "Close details" }).click();
  await page.evaluate(() => {
    const state = window.fixture.read();
    const b = {
      ...state.expected,
      scopeKey: "scope-b",
      epoch: state.expected.epoch + 1,
    };
    const a = { ...state.expected, epoch: b.epoch + 1 };
    window.fixture.set({
      expected: b,
      authority: { ...state.authority, context: b },
    });
    const authority = {
      ...state.authority,
      context: a,
      generation: state.authority.generation + 1,
    };
    window.fixture.set({
      expected: a,
      authority,
      source: {
        authority,
        status: "ready",
        record: { id: "a", name: "New scope record", description: "New scope" },
      },
    });
    window.fixture.resolve(true);
  });
  await expect(page.locator("[data-outcome]")).toHaveText("stale");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByText("New scope record", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("New session record", { exact: true }),
  ).toHaveCount(0);
});

test("real modal focus/scroll boundary, axe and reduced motion", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/fixture.html");
  await page.getByRole("button", { name: "Details a", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Record details" });
  expect(
    await page
      .locator("#root")
      .evaluate(
        (e) =>
          e.hasAttribute("inert") || e.getAttribute("aria-hidden") === "true",
      ),
  ).toBe(true);
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press(i % 2 ? "Shift+Tab" : "Tab");
    expect(
      await dialog.evaluate((e) => e.contains(document.activeElement)),
    ).toBe(true);
  }
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).overflow,
    ),
  ).toBe("hidden");
  const result = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .analyze();
  expect(result.violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("details-desktop.png") });
  await page.setViewportSize({ width: 320, height: 640 });
  await page.screenshot({ path: testInfo.outputPath("details-narrow.png") });
});

test("same-session refetch does not reset a dirty custom form", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.evaluate(() => window.fixture.set({ layout: "form" }));
  await page.getByRole("button", { name: "Details c", exact: true }).click();
  const field = page.getByRole("textbox", { name: "Consumer draft" });
  await field.fill("Local draft wins");
  const handle = await field.elementHandle();
  await page.evaluate(() => {
    const state = window.fixture.read();
    const authority = {
      ...state.authority,
      generation: state.authority.generation + 1,
    };
    window.fixture.set({
      authority,
      source: {
        authority,
        status: "ready",
        record: {
          id: "c",
          name: "Updated application record",
          description: "Updated",
        },
        busy: true,
        stale: true,
      },
    });
  });
  await expect(field).toHaveValue("Local draft wins");
  expect(
    await handle?.evaluate(
      (e) => e === document.querySelector('input[name="draft"]'),
    ),
  ).toBe(true);
});

test("source React DOM SSR initial-open hydrates without viewport branches or recoverable errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const response = await page.goto("/ssr.html");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("dialog", { name: "Record details" }),
  ).toBeVisible();
  await expect(page.locator("[data-native-row]")).toHaveText("a");
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(page.getByRole("dialog")).toHaveCount(1);
  expect(errors).toEqual([]);
});
