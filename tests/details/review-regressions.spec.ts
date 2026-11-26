import { expect, test } from "@playwright/test";

test("n1: accessor authority cannot validate allowed then render an access-false source", async ({
  page,
}) => {
  await page.goto("/fixture.html?normal");
  await page.getByRole("button", { name: "Details a", exact: true }).click();
  await page.evaluate(() => {
    const state = window.fixture.read();
    window.detailsProbe = { accessReads: 0, sourceReads: 0 };
    const context = Object.defineProperty({ ...state.expected }, "access", {
      enumerable: true,
      get() {
        window.detailsProbe.accessReads++;
        return window.detailsProbe.accessReads <= 3;
      },
    });
    const authority = { ...state.authority, context };
    const denied = {
      ...state.authority,
      context: { ...state.expected, access: false },
    };
    window.fixture.set({
      authority,
      source: {
        authority: denied,
        status: "ready",
        record: {
          id: "a",
          name: "DENIED SOURCE SECRET",
          description: "Synthetic denied input",
        },
      },
    });
  });
  await expect(
    page.getByText("DENIED SOURCE SECRET", { exact: true }),
  ).toHaveCount(0);
  expect(await page.evaluate(() => window.detailsProbe.accessReads)).toBe(0);
});

test("n1: denied context never inspects a throwing old source authority", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/fixture.html");
  await page.getByRole("button", { name: "Details a", exact: true }).click();
  await page.evaluate(() => {
    const state = window.fixture.read();
    window.detailsProbe = { accessReads: 0, sourceReads: 0 };
    const source = Object.defineProperty(
      {
        authority: state.authority,
        status: "ready" as const,
        record: { id: "a", name: "Private old record", description: "Old" },
      },
      "authority",
      {
        enumerable: true,
        get() {
          window.detailsProbe.sourceReads++;
          throw new Error("PRIVATE SOURCE GETTER PAYLOAD");
        },
      },
    );
    window.fixture.set({
      expected: {
        ...state.expected,
        access: false,
        epoch: state.expected.epoch + 1,
      },
      source,
    });
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => window.detailsProbe.sourceReads)).toBe(0);
  expect(errors).toEqual([]);
});

test("n2: actual ready/loading/error/ready refetch preserves the original dirty form", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.evaluate(() => window.fixture.set({ layout: "form" }));
  await page.getByRole("button", { name: "Details c", exact: true }).click();
  const field = page.getByRole("textbox", { name: "Consumer draft" });
  await field.fill("Dirty value survives actual loading");
  const original = await field.elementHandle();
  await page.evaluate(() => {
    const state = window.fixture.read();
    const authority = {
      ...state.authority,
      generation: state.authority.generation + 1,
    };
    window.fixture.set({ authority, source: { authority, status: "loading" } });
  });
  await expect(page.getByRole("dialog")).toBeVisible();
  const duringLoading = await original?.evaluate(
    (element) => element.isConnected,
  );
  expect(
    await page.evaluate(() => {
      const context = window.fixture.readSession()?.context;
      return {
        status: context?.status,
        recordAbsent: context?.record === undefined,
        rowAbsent: context?.row === undefined,
      };
    }),
  ).toEqual({ status: "loading", recordAbsent: true, rowAbsent: true });
  await expect(page.locator('.tw-details__body > [role="status"]')).toHaveText(
    "Loading record details.",
  );
  await page.evaluate(() => {
    const authority = window.fixture.read().authority;
    window.fixture.set({
      source: { authority, status: "error", code: "offline" },
    });
  });
  const duringError = await original?.evaluate(
    (element) => element.isConnected,
  );
  expect(
    await page.evaluate(() => {
      const context = window.fixture.readSession()?.context;
      return {
        status: context?.status,
        recordAbsent: context?.record === undefined,
      };
    }),
  ).toEqual({ status: "error", recordAbsent: true });
  await expect(
    page.locator('.tw-details__body > [role="status"]'),
  ).toContainText("Details are unavailable while offline.");
  await page.evaluate(() => {
    const authority = window.fixture.read().authority;
    window.fixture.set({
      source: {
        authority,
        status: "ready",
        record: {
          id: "c",
          name: "Fresh same-session record",
          description: "Fresh",
        },
      },
    });
  });
  const value = await field.inputValue();
  const same = await original?.evaluate(
    (element) => element === document.querySelector('input[name="draft"]'),
  );
  expect({ duringLoading, duringError, value, same }).toEqual({
    duringLoading: true,
    duringError: true,
    value: "Dirty value survives actual loading",
    same: true,
  });
});

test("n3: shared immutable record does not authorize a retained scope-A native row", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.getByRole("button", { name: "Details a", exact: true }).click();
  await page.evaluate(() => {
    const state = window.fixture.read();
    if (state.source?.status !== "ready")
      throw new Error("Missing ready source");
    const shared = Object.freeze(state.source.record);
    window.fixture.retainNativeView();
    const context = {
      ...state.expected,
      scopeKey: "scope-b",
      epoch: state.expected.epoch + 1,
    };
    const authority = {
      ...state.authority,
      context,
      generation: state.authority.generation + 1,
    };
    window.fixture.set({
      expected: context,
      authority,
      source: { authority, status: "ready", record: shared },
      nativeOrigin: context,
      nativeRecords: [
        shared,
        { id: "scope-b-only", name: "B-only record", description: "B" },
      ],
    });
  });
  await expect(page.getByRole("dialog")).toBeVisible();
  const facts = await page.evaluate(() => {
    const context = window.fixture.readSession()?.context;
    return {
      record: context?.record?.name,
      row: context?.row?.id ?? null,
      oldRows:
        context?.row?.table.getRowModel().rows.map((row) => row.id) ?? [],
      currentRows: window.fixture.nativeView()?.rows.map((row) => row.id),
    };
  });
  expect(facts.currentRows).toEqual(["a", "scope-b-only"]);
  expect(facts.record).toBe("Synthetic transaction");
  expect(facts.row).toBeNull();
  expect(facts.oldRows).toEqual([]);
  // A proper newly committed B frame still exposes genuine optional rows.
  await page.evaluate(() => window.fixture.useCurrentNativeFrame());
  await expect(page.locator("[data-native-row]")).toHaveText("a");
  expect(
    await page.evaluate(() =>
      window.fixture
        .readSession()
        ?.context?.row?.table.getRowModel()
        .rows.map((row) => row.id),
    ),
  ).toEqual(["a", "scope-b-only"]);
});

test("n1: proxy metadata failures fail closed without invoking or exposing private getters", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/fixture.html?normal");
  await page.getByRole("button", { name: "Details a", exact: true }).click();
  await page.evaluate(() => {
    const state = window.fixture.read();
    window.detailsProbe = { accessReads: 0, sourceReads: 0 };
    const authority = new Proxy(state.authority, {
      getOwnPropertyDescriptor() {
        throw new Error("PRIVATE DESCRIPTOR ERROR");
      },
    });
    const source = new Proxy(state.source ?? {}, {
      getPrototypeOf() {
        window.detailsProbe.sourceReads++;
        throw new Error("PRIVATE SOURCE ERROR");
      },
    }) as typeof state.source;
    window.fixture.set({ authority, source });
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => window.detailsProbe.sourceReads)).toBe(0);
  expect(errors).toEqual([]);
});

test("n2: lifecycle invalidation still removes the dirty subtree without consulting policy", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.evaluate(() => window.fixture.set({ layout: "form" }));
  await page.getByRole("button", { name: "Details c", exact: true }).click();
  const field = page.getByRole("textbox", { name: "Consumer draft" });
  await field.fill("Private draft from old scope");
  const old = await field.elementHandle();
  const before = await page.evaluate(() => window.fixture.read().policyCalls);
  await page.evaluate(() => {
    const state = window.fixture.read();
    window.fixture.set({
      policy: "deny",
      expected: {
        ...state.expected,
        scopeKey: "scope-b",
        epoch: state.expected.epoch + 1,
      },
    });
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await old?.evaluate((element) => element.isConnected)).toBe(false);
  expect(await page.evaluate(() => window.fixture.read().policyCalls)).toBe(
    before,
  );
  await page.evaluate(() => {
    const state = window.fixture.read();
    const authority = {
      ...state.authority,
      context: state.expected,
      session: state.authority.session + 1,
      generation: state.authority.generation + 1,
    };
    window.fixture.set({
      authority,
      source: {
        authority,
        status: "ready",
        record: {
          id: "c",
          name: "Scope B inventory",
          description: "New scope",
        },
      },
    });
  });
  await expect(field).toHaveValue("Unsaved");
  expect(
    await old?.evaluate(
      (element) => element === document.querySelector('input[name="draft"]'),
    ),
  ).toBe(false);
});

test("control: same-turn accepted B rejects close A before invoking policy", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.getByRole("button", { name: "Details a", exact: true }).click();
  const facts = await page.evaluate(async () => {
    window.fixture.captureClose();
    const before = window.fixture.read().policyCalls;
    window.fixture.open("b");
    const result = await window.fixture.invokeSavedClose();
    return {
      before,
      after: window.fixture.read().policyCalls,
      status: result?.status,
      target: window.fixture.controller.getSnapshot().details.rowId,
    };
  });
  expect(facts).toEqual({ before: 1, after: 1, status: "stale", target: "b" });
});

test("control: separately fetched detail remains legitimate without a native row", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.getByRole("button", { name: "Details a", exact: true }).click();
  await page.evaluate(() => {
    const state = window.fixture.read();
    if (state.source?.status !== "ready")
      throw new Error("Missing ready source");
    window.fixture.retainNativeView();
    const context = {
      ...state.expected,
      scopeKey: "scope-b",
      epoch: state.expected.epoch + 1,
    };
    const authority = {
      ...state.authority,
      context,
      generation: state.authority.generation + 1,
    };
    window.fixture.set({
      expected: context,
      authority,
      source: {
        authority,
        status: "ready",
        record: { ...state.source.record, name: "Separate B response" },
      },
      nativeOrigin: context,
      nativeRecords: [
        state.source.record,
        { id: "scope-b-only", name: "B-only native record", description: "B" },
      ],
    });
  });
  await expect(
    page.getByText("Separate B response", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => window.fixture.readSession()?.context?.row),
  ).toBeUndefined();
  await page.evaluate(() => window.fixture.useCurrentNativeFrame());
  expect(
    await page.evaluate(() =>
      window.fixture.nativeView()?.rows.map((row) => row.id),
    ),
  ).toEqual(["a", "scope-b-only"]);
  expect(
    await page.evaluate(() => window.fixture.readSession()?.context?.row),
  ).toBeUndefined();
});
