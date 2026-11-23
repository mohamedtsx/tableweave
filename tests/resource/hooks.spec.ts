import { expect, test } from "@playwright/test";

test("committed Suspense hide/reveal preserves ready rows and app state without restarting passive fetch effects", async ({
  page,
}) => {
  await page.goto("/hooks.html?without-strict&ready-on-mount");
  await expect(page.locator("#resource")).toHaveAttribute("data-kind", "ready");
  await expect(page.locator("#resource")).toHaveText("scope-a:1");
  await page.evaluate(() => window.resourceFixture.seedApp());
  const before = await page.evaluate(() => window.resourceFixture.inspect());
  expect(before.fetchEffects).toBe(1);
  await page
    .getByRole("button", { name: "Hide same scope", exact: true })
    .click();
  await expect(page.locator("#fallback")).toBeVisible();
  await expect(page.locator("#resource")).toBeHidden();
  const hidden = await page.evaluate(() => window.resourceFixture.inspect());
  expect(hidden.invalidations).toEqual(before.invalidations);
  expect(hidden.rows).toEqual(before.rows);
  expect(hidden.app).toEqual(before.app);
  expect(hidden.active).toBe(true);
  expect(hidden.fetchEffects).toBe(1);
  expect(hidden.fetchCleanups).toBe(0);
  await page
    .getByRole("button", { name: "Reveal same scope", exact: true })
    .click();
  await expect(page.locator("#fallback")).toHaveCount(0);
  await expect(page.locator("#resource")).toHaveAttribute("data-kind", "ready");
  await expect(page.locator("#resource")).toHaveText("scope-a:1");
  const revealed = await page.evaluate(() => window.resourceFixture.inspect());
  expect(revealed.generations).toEqual([1]);
  expect(revealed.fetchEffects).toBe(1);
  expect(revealed.fetchCleanups).toBe(0);
});

for (const settleWhileHidden of [false, true])
  test(`committed Suspense hide/reveal preserves pending request identity (settle hidden: ${settleWhileHidden})`, async ({
    page,
  }) => {
    await page.goto("/hooks.html?without-strict");
    await expect(page.locator("#resource")).toHaveAttribute(
      "data-kind",
      "pending",
    );
    await page.evaluate(() => window.resourceFixture.seedApp());
    const before = await page.evaluate(() => window.resourceFixture.inspect());
    await page
      .getByRole("button", { name: "Hide same scope", exact: true })
      .click();
    await expect(page.locator("#fallback")).toBeVisible();
    await expect(page.locator("#resource")).toBeHidden();
    const hidden = await page.evaluate(() => window.resourceFixture.inspect());
    expect(hidden.invalidations).toEqual(before.invalidations);
    expect(hidden.app).toEqual(before.app);
    expect(hidden.active).toBe(true);
    expect(hidden.fetchEffects).toBe(1);
    expect(hidden.fetchCleanups).toBe(0);
    if (settleWhileHidden) {
      await page
        .getByRole("button", { name: "Resolve latest", exact: true })
        .click();
      expect(
        await page.evaluate(
          () => window.resourceFixture.inspect().lastAcceptance,
        ),
      ).toBe(true);
    }
    await page
      .getByRole("button", { name: "Reveal same scope", exact: true })
      .click();
    await expect(page.locator("#resource")).toHaveAttribute(
      "data-kind",
      settleWhileHidden ? "ready" : "pending",
    );
    if (!settleWhileHidden)
      await page
        .getByRole("button", { name: "Resolve latest", exact: true })
        .click();
    await expect(page.locator("#resource")).toHaveText("scope-a:1");
    const revealed = await page.evaluate(() =>
      window.resourceFixture.inspect(),
    );
    expect(revealed.generations).toEqual([1]);
    expect(revealed.fetchEffects).toBe(1);
    expect(revealed.fetchCleanups).toBe(0);
  });

for (const ready of [false, true])
  test(`real unmount of a Suspense-hidden owner synchronously clears before application passive cleanup (ready: ${ready})`, async ({
    page,
  }) => {
    await page.goto(
      `/hooks.html?without-strict${ready ? "&ready-on-mount" : ""}`,
    );
    await expect(page.locator("#resource")).toHaveAttribute(
      "data-kind",
      ready ? "ready" : "pending",
    );
    await page.evaluate(() => window.resourceFixture.seedApp());
    await page
      .getByRole("button", { name: "Hide same scope", exact: true })
      .click();
    await expect(page.locator("#fallback")).toBeVisible();
    await page
      .getByRole("button", { name: "Toggle mount", exact: true })
      .click();
    await expect(page.locator("#unmounted")).toBeVisible();
    const unmounted = await page.evaluate(() =>
      window.resourceFixture.inspect(),
    );
    expect(unmounted.invalidations).toEqual(["unmount"]);
    expect(unmounted.rows).toEqual([]);
    expect(unmounted.active).toBe(false);
    expect(unmounted.app).toEqual({
      selection: [],
      details: "",
      labels: [],
      move: "",
    });
    expect(unmounted.fetchEffects).toBe(1);
    expect(unmounted.fetchCleanups).toBe(1);
    expect(unmounted.cleanupObservations).toEqual([
      { active: false, rows: [], lateAccepted: false },
    ]);
    await page
      .getByRole("button", { name: "Resolve latest", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => window.resourceFixture.inspect().lastAcceptance,
      ),
    ).toBe(false);
  });

test("StrictMode replay reconnects, rejects replay-era completions and reacts to refresh", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/hooks.html");
  await expect(page.locator("#resource")).toHaveAttribute(
    "data-kind",
    "pending",
  );
  const started = await page.evaluate(() => window.resourceFixture.inspect());
  expect(started.generations).toHaveLength(2);
  expect(started.invalidations).toEqual(["unmount"]);
  expect(started.cleanupObservations).toEqual([
    { active: false, rows: [], lateAccepted: false },
  ]);
  await page
    .getByRole("button", { name: "Resolve oldest", exact: true })
    .click();
  await expect(page.locator("#resource")).toHaveText("none");
  expect(
    await page.evaluate(() => window.resourceFixture.inspect().lastAcceptance),
  ).toBe(false);
  await page
    .getByRole("button", { name: "Resolve latest", exact: true })
    .click();
  await expect(page.locator("#resource")).toHaveText("scope-a:2");
  await expect(page.locator("#resource")).toHaveAttribute("data-kind", "ready");
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.locator("#resource")).toHaveAttribute("data-busy", "true");
  await expect(page.locator("#resource")).toHaveText("scope-a:2");
  await page.getByRole("button", { name: "Fail latest", exact: true }).click();
  await expect(page.locator("#resource")).toHaveAttribute(
    "data-kind",
    "failure",
  );
  await expect(page.locator("#resource")).toHaveText("scope-a:2");
  expect(errors).toEqual([]);
});

test("scope/definition/permission changes suppress private rows in every render and clear app lifecycle state", async ({
  page,
}) => {
  await page.goto("/hooks.html");
  await expect(page.locator("#resource")).toHaveAttribute(
    "data-kind",
    "pending",
  );
  await page
    .getByRole("button", { name: "Resolve latest", exact: true })
    .click();
  await expect(page.locator("#resource")).toHaveText("scope-a:2");
  await page.getByRole("button", { name: "Scope B", exact: true }).click();
  await expect(page.locator("#resource")).toHaveAttribute(
    "data-scope",
    "scope-b",
  );
  await expect(page.locator("#resource")).toHaveText("none");
  let state = await page.evaluate(() => window.resourceFixture.inspect());
  expect(
    state.renders
      .filter((render) => render.scope === "scope-b")
      .every((render) => render.rows.length === 0),
  ).toBe(true);
  expect(state.invalidations).toContain("scope-change");
  expect(state.app).toEqual({
    selection: [],
    details: "",
    labels: [],
    move: "",
  });
  await page
    .getByRole("button", { name: "Resolve latest", exact: true })
    .click();
  await expect(page.locator("#resource")).toHaveText("scope-b:3");
  await page.getByRole("button", { name: "Definition 2", exact: true }).click();
  await expect(page.locator("#resource")).toHaveText("none");
  await page
    .getByRole("button", { name: "Resolve latest", exact: true })
    .click();
  await expect(page.locator("#resource")).toHaveText("scope-b:4");
  await page.getByRole("button", { name: "Deny", exact: true }).click();
  await expect(page.locator("#resource")).toHaveAttribute(
    "data-kind",
    "blocked",
  );
  await expect(page.locator("#resource")).toHaveText("none");
  state = await page.evaluate(() => window.resourceFixture.inspect());
  expect(
    state.renders
      .filter((render) => !render.access)
      .every((render) => render.rows.length === 0),
  ).toBe(true);
  expect(state.invalidations).toContain("definition-change");
  expect(state.invalidations).toContain("access-loss");
  await page
    .getByRole("button", { name: "Resolve latest", exact: true })
    .click();
  expect(
    await page.evaluate(() => window.resourceFixture.inspect().lastAcceptance),
  ).toBe(false);
});

test("access-loss response remains blocked even while the old permission prop is true", async ({
  page,
}) => {
  await page.goto("/hooks.html");
  await expect(page.locator("#resource")).toHaveAttribute(
    "data-kind",
    "pending",
  );
  await page
    .getByRole("button", { name: "Resolve latest", exact: true })
    .click();
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page
    .getByRole("button", { name: "Revoke in response", exact: true })
    .click();
  await expect(page.locator("#resource")).toHaveAttribute(
    "data-kind",
    "blocked",
  );
  await expect(page.locator("#resource")).toHaveText("none");
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.locator("#resource")).toHaveAttribute(
    "data-kind",
    "blocked",
  );
  await page
    .getByRole("button", { name: "Resolve latest", exact: true })
    .click();
  expect(
    await page.evaluate(() => window.resourceFixture.inspect().lastAcceptance),
  ).toBe(false);
  await page.getByRole("button", { name: "Toggle mount", exact: true }).click();
  await expect(page.locator("#unmounted")).toHaveText("Unmounted");
  await page.getByRole("button", { name: "Toggle mount", exact: true }).click();
  await expect(page.locator("#resource")).toHaveAttribute(
    "data-kind",
    "blocked",
  );
  await page.getByRole("button", { name: "Deny", exact: true }).click();
  await expect(page.locator("#resource")).toHaveAttribute(
    "data-kind",
    "blocked",
  );
  await page.getByRole("button", { name: "Allow", exact: true }).click();
  await expect(page.locator("#resource")).toHaveAttribute(
    "data-kind",
    "pending",
  );
  await page
    .getByRole("button", { name: "Resolve latest", exact: true })
    .click();
  await expect(page.locator("#resource")).toHaveText("scope-a:4");
});

test("synchronous request-side revocation survives the initial StrictMode effect replay", async ({
  page,
}) => {
  await page.goto("/hooks.html?revoke-on-mount");
  await expect(page.locator("#resource")).toHaveAttribute(
    "data-kind",
    "blocked",
  );
  const state = await page.evaluate(() => window.resourceFixture.inspect());
  expect(state.generations).toEqual([1]);
  expect(state.rows).toEqual([]);
  expect(state.invalidations).toEqual(["access-loss", "unmount"]);
});

test("unmount clears the buffer and remount requires fresh application requests", async ({
  page,
}) => {
  await page.goto("/hooks.html");
  await expect(page.locator("#resource")).toHaveAttribute(
    "data-kind",
    "pending",
  );
  await page
    .getByRole("button", { name: "Resolve latest", exact: true })
    .click();
  await expect(page.locator("#resource")).toHaveText("scope-a:2");
  await page.getByRole("button", { name: "Toggle mount", exact: true }).click();
  await expect(page.locator("#unmounted")).toHaveText("Unmounted");
  expect(
    await page.evaluate(() => window.resourceFixture.inspect().rows),
  ).toEqual([]);
  expect(
    await page.evaluate(() => window.resourceFixture.inspect().active),
  ).toBe(false);
  await page
    .getByRole("button", { name: "Resolve latest", exact: true })
    .click();
  expect(
    await page.evaluate(() => window.resourceFixture.inspect().lastAcceptance),
  ).toBe(false);
  await page.getByRole("button", { name: "Toggle mount", exact: true }).click();
  await expect(page.locator("#resource")).toHaveAttribute(
    "data-kind",
    "pending",
  );
  await expect(page.locator("#resource")).toHaveText("none");
  await page
    .getByRole("button", { name: "Resolve latest", exact: true })
    .click();
  await expect(page.locator("#resource")).toHaveText("scope-a:4");
});

test("abandoned speculative scope renders hide rows without mutating the committed adapter", async ({
  page,
}) => {
  await page.goto("/hooks.html");
  await expect(page.locator("#resource")).toHaveAttribute(
    "data-kind",
    "pending",
  );
  await page
    .getByRole("button", { name: "Resolve latest", exact: true })
    .click();
  await expect(page.locator("#resource")).toHaveText("scope-a:2");
  const before = await page.evaluate(() => window.resourceFixture.inspect());
  await page
    .getByRole("button", { name: "Speculative B", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.resourceFixture
            .inspect()
            .renders.filter((render) => render.scope === "scope-b").length,
      ),
    )
    .toBeGreaterThan(0);
  const speculative = await page.evaluate(() =>
    window.resourceFixture.inspect(),
  );
  expect(speculative.rows).toEqual(before.rows);
  expect(speculative.generations).toEqual(before.generations);
  expect(speculative.invalidations).toEqual(before.invalidations);
  expect(
    speculative.renders
      .filter((render) => render.scope === "scope-b")
      .every((render) => render.rows.length === 0),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Cancel speculative", exact: true })
    .click();
  await expect(page.locator("#resource")).toHaveText("scope-a:2");
});
