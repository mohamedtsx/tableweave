import { expect, test } from "@playwright/test";

test("n4: port generation ahead of props masks data without disconnecting the same dirty session", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.evaluate(() => window.fixture.set({ layout: "form" }));
  await page.getByRole("button", { name: "Details c", exact: true }).click();
  const field = page.getByRole("textbox", { name: "Consumer draft" });
  await field.fill("Draft through port generation race");
  const original = await field.elementHandle();
  await page.evaluate(() => {
    const port = window.fixture.privatePort();
    window.originalGenerationRead = port.read;
    const current = port.read();
    window.nextGenerationAuthority = {
      ...current.authority,
      generation: current.authority.generation + 1,
    };
    port.read = () => ({
      ...window.originalGenerationRead(),
      authority: window.nextGenerationAuthority,
    });
    window.fixture.publish();
  });
  const duringLag = await page.evaluate(() => {
    const session = window.fixture.readSession();
    return {
      open: session?.isOpen,
      status: session?.context?.status,
      recordAbsent: session?.context?.record === undefined,
      rowAbsent: session?.context?.row === undefined,
    };
  });
  const connected = await original?.evaluate((element) => element.isConnected);
  await page.evaluate(() => {
    window.fixture.privatePort().read = window.originalGenerationRead;
    const authority = window.nextGenerationAuthority;
    window.fixture.set({ authority, source: { authority, status: "loading" } });
  });
  expect({ connected, duringLag }).toEqual({
    connected: true,
    duringLag: {
      open: true,
      status: "loading",
      recordAbsent: true,
      rowAbsent: true,
    },
  });
  await expect(field).toHaveValue("Draft through port generation race");
  expect(await original?.evaluate((element) => element.isConnected)).toBe(true);
  await page.evaluate(() => {
    const authority = window.fixture.read().authority;
    window.fixture.set({
      source: {
        authority,
        status: "ready",
        record: {
          id: "c",
          name: "Current generation B",
          description: "Fresh response",
        },
      },
    });
  });
  await expect(field).toHaveValue("Draft through port generation race");
  expect(
    await original?.evaluate(
      (element) => element === document.querySelector('input[name="draft"]'),
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() => ({
      status: window.fixture.readSession()?.context?.status,
      record: window.fixture.readSession()?.context?.record?.name,
      row: window.fixture.readSession()?.context?.row?.id ?? null,
    })),
  ).toEqual({ status: "ready", record: "Current generation B", row: null });
});

test("n5: beforeChange accessor cannot replace a denying policy with an allowing policy", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.evaluate(() => window.fixture.set({ layout: "form" }));
  await page.getByRole("button", { name: "Details c", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Consumer draft" })
    .fill("Must not lose draft");
  await page.evaluate(() => {
    window.callbackProbe = { reads: 0, deny: 0, allow: 0 };
    window.detailsOptionsTransform = (base) => {
      let reads = 0;
      return Object.defineProperty({ ...base }, "beforeChange", {
        enumerable: true,
        get() {
          window.callbackProbe.reads++;
          return ++reads === 1
            ? () => {
                window.callbackProbe.deny++;
                return false;
              }
            : () => {
                window.callbackProbe.allow++;
                return true;
              };
        },
      });
    };
    window.fixture.publish();
  });
  await page
    .getByRole("button", { name: "Close details", exact: true })
    .click();
  expect(
    await page.evaluate(() => ({
      allow: window.callbackProbe.allow,
      target: window.fixture.controller.getSnapshot().details.rowId,
    })),
  ).toEqual({ allow: 0, target: "c" });
  await expect(
    page.getByRole("textbox", { name: "Consumer draft" }),
  ).toHaveValue("Must not lose draft");
  expect(await page.evaluate(() => window.callbackProbe.reads)).toBe(0);
});

test("n4: close stays reachable using the actual lifecycle during parent generation lag", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.getByRole("button", { name: "Details c", exact: true }).click();
  await page.evaluate(() => {
    const port = window.fixture.privatePort();
    const original = port.read;
    const authority = {
      ...original().authority,
      generation: original().authority.generation + 1,
    };
    port.read = () => ({ ...original(), authority });
    window.fixture.publish();
  });
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator('.tw-details__body > [role="status"]')).toHaveText(
    "Loading record details.",
  );
  await page.getByRole("button", { name: "Close details" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => window.fixture.controller.getSnapshot().details.rowId,
    ),
  ).toBeNull();
});

test("n4: generation replacement during confirmation does not invent a new target or reset the pending decision", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.getByRole("button", { name: "Details c", exact: true }).click();
  await page.evaluate(() => window.fixture.set({ policy: "async" }));
  await page.getByRole("button", { name: "Close details" }).click();
  await page.evaluate(() => {
    const port = window.fixture.privatePort();
    window.originalGenerationRead = port.read;
    const authority = {
      ...port.read().authority,
      generation: port.read().authority.generation + 1,
    };
    window.nextGenerationAuthority = authority;
    port.read = () => ({ ...window.originalGenerationRead(), authority });
    window.fixture.publish();
  });
  await expect(page.locator(".tw-details__status")).toHaveText(
    "Checking whether details can close.",
  );
  await page.evaluate(() => {
    window.fixture.privatePort().read = window.originalGenerationRead;
    const authority = window.nextGenerationAuthority;
    window.fixture.set({ authority, source: { authority, status: "loading" } });
  });
  await expect(page.locator(".tw-details__status")).toHaveText(
    "Checking whether details can close.",
  );
  await page.evaluate(() => window.fixture.resolve(true));
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(() => ({
      status: window.fixture.read().outcome,
      target: window.fixture.controller.getSnapshot().details.rowId,
    })),
  ).toEqual({ status: "committed", target: null });
});

for (const change of ["target", "session", "scope", "scope-aba"] as const) {
  test(`n4: actual ${change} replacement still unmounts and invalidates a pending close`, async ({
    page,
  }) => {
    await page.goto("/fixture.html");
    await page.evaluate(() => window.fixture.set({ layout: "form" }));
    await page.getByRole("button", { name: "Details c", exact: true }).click();
    const original = await page
      .getByRole("textbox", { name: "Consumer draft" })
      .elementHandle();
    await page.evaluate(() => window.fixture.set({ policy: "async" }));
    await page.getByRole("button", { name: "Close details" }).click();
    await page.evaluate((change) => {
      const port = window.fixture.privatePort();
      const original = port.read;
      const before = original().authority;
      const authority =
        change === "target"
          ? { ...before, rowId: "b", session: before.session + 1 }
          : change === "session"
            ? { ...before, session: before.session + 1 }
            : {
                ...before,
                context: {
                  ...before.context,
                  scopeKey:
                    change === "scope" ? "scope-b" : before.context.scopeKey,
                  epoch: before.context.epoch + (change === "scope" ? 1 : 2),
                },
              };
      port.read = () => ({ ...original(), authority });
      window.fixture.publish();
    }, change);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await original?.evaluate((element) => element.isConnected)).toBe(
      false,
    );
    await page.evaluate(() => window.fixture.resolve(true));
    expect(
      await page.evaluate(() => ({
        outcome: window.fixture.read().outcome,
        target: window.fixture.controller.getSnapshot().details.rowId,
      })),
    ).toEqual({ outcome: "stale", target: "c" });
  });
}

for (const name of ["beforeChange", "onOutcome", "focusFallback"] as const) {
  test(`n5: throwing ${name} accessor is never invoked and never exposes its payload`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/fixture.html");
    await page.getByRole("button", { name: "Details c", exact: true }).click();
    await page.evaluate((name) => {
      window.callbackAudit = {
        receivers: [],
        oldObserver: 0,
        newObserver: 0,
        getterCalls: 0,
      };
      window.detailsOptionsTransform = (base) =>
        Object.defineProperty({ ...base }, name, {
          enumerable: true,
          get() {
            window.callbackAudit.getterCalls++;
            throw new Error("PRIVATE OPTION ACCESSOR PAYLOAD");
          },
        });
      window.fixture.publish();
    }, name);
    if (name === "focusFallback") {
      await page.evaluate(() =>
        window.fixture.set({
          expected: { ...window.fixture.read().expected, access: false },
        }),
      );
    } else {
      await page.getByRole("button", { name: "Close details" }).click();
      if (name === "beforeChange")
        await expect(page.getByRole("dialog")).toBeVisible();
      else await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    expect(await page.evaluate(() => window.callbackAudit.getterCalls)).toBe(0);
    expect(errors).toEqual([]);
  });
}

test("n5: exact data callbacks keep options/port receivers and rejected async observers cannot break close", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/fixture.html");
  await page.getByRole("button", { name: "Details a", exact: true }).click();
  await page.evaluate(() => {
    window.callbackAudit = {
      receivers: [],
      oldObserver: 0,
      newObserver: 0,
      getterCalls: 0,
    };
    const port = window.fixture.privatePort();
    const originalRead = port.read;
    port.read = function () {
      window.callbackAudit.receivers.push(this === port);
      return originalRead();
    };
    port.retry = function () {
      window.callbackAudit.receivers.push(this === port);
    };
    window.detailsOptionsTransform = (base) => {
      const options = { ...base };
      options.beforeChange = function () {
        window.callbackAudit.receivers.push(this === options);
        return true;
      };
      options.onOutcome = async function () {
        window.callbackAudit.receivers.push(this === options);
        throw new Error("PRIVATE ASYNC OBSERVER PAYLOAD");
      };
      options.focusFallback = async function () {
        window.callbackAudit.receivers.push(this === options);
        throw new Error("PRIVATE ASYNC FOCUS PAYLOAD");
      };
      return options;
    };
    const authority = window.fixture.read().authority;
    window.fixture.set({
      source: { authority, status: "error", code: "offline" },
    });
  });
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await page.getByRole("button", { name: "Close details" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(() => window.callbackAudit.receivers.every(Boolean)),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("n5: pending outcome uses its captured observer, not a replacement observer", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.getByRole("button", { name: "Details a", exact: true }).click();
  await page.evaluate(() => {
    window.callbackAudit = {
      receivers: [],
      oldObserver: 0,
      newObserver: 0,
      getterCalls: 0,
    };
    window.detailsOptionsTransform = (base) => ({
      ...base,
      onOutcome() {
        window.callbackAudit.oldObserver++;
      },
    });
    window.fixture.set({ policy: "async" });
  });
  await page.getByRole("button", { name: "Close details" }).click();
  await page.evaluate(() => {
    window.detailsOptionsTransform = (base) => ({
      ...base,
      onOutcome() {
        window.callbackAudit.newObserver++;
      },
    });
    window.fixture.publish();
  });
  await page.evaluate(() => window.fixture.resolve(true));
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(() => ({
      old: window.callbackAudit.oldObserver,
      next: window.callbackAudit.newObserver,
    })),
  ).toEqual({ old: 1, next: 0 });
});

test("n4: replacing the genuine controller owner resets the interior and rejects old requests", async ({
  page,
}) => {
  await page.goto("/fixture.html");
  await page.evaluate(() => window.fixture.set({ layout: "form" }));
  await page.getByRole("button", { name: "Details c", exact: true }).click();
  const field = page.getByRole("textbox", { name: "Consumer draft" });
  await field.fill("Old controller draft");
  const old = await field.elementHandle();
  await page.evaluate(() => {
    window.fixture.captureClose();
    window.fixture.replaceDetailsController();
  });
  await expect(field).toHaveValue("Unsaved");
  expect(await old?.evaluate((element) => element.isConnected)).toBe(false);
  const result = await page.evaluate(async () => {
    const outcome = await window.fixture.invokeSavedClose();
    return {
      status: outcome?.status,
      target: window.fixture.detailsController().getSnapshot().details.rowId,
    };
  });
  expect(result).toEqual({ status: "stale", target: "c" });
});

for (const name of ["read", "retry"] as const) {
  test(`n5: ${name} port accessor is rejected without invocation`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/fixture.html");
    await page.getByRole("button", { name: "Details a", exact: true }).click();
    await page.evaluate((name) => {
      window.callbackAudit = {
        receivers: [],
        oldObserver: 0,
        newObserver: 0,
        getterCalls: 0,
      };
      Object.defineProperty(window.fixture.privatePort(), name, {
        configurable: true,
        get() {
          window.callbackAudit.getterCalls++;
          throw new Error("PRIVATE PORT CALLBACK");
        },
      });
      const authority = window.fixture.read().authority;
      window.fixture.set({
        source: { authority, status: "error", code: "offline" },
      });
    }, name);
    if (name === "read") await expect(page.getByRole("dialog")).toHaveCount(0);
    else {
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Retry", exact: true }),
      ).toHaveCount(0);
      await page.getByRole("button", { name: "Close details" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    expect(await page.evaluate(() => window.callbackAudit.getterCalls)).toBe(0);
    expect(errors).toEqual([]);
  });
}

for (const kind of ["nativeFrame", "origin", "viewController"] as const) {
  test(`preserved envelope control: ${kind} getter only removes optional native row`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/fixture.html");
    await page.getByRole("button", { name: "Details a", exact: true }).click();
    await page.evaluate((kind) => {
      window.callbackAudit = {
        receivers: [],
        oldObserver: 0,
        newObserver: 0,
        getterCalls: 0,
      };
      const port = window.fixture.privatePort();
      const original = port.read;
      port.read = () => {
        const actual = original();
        const frame = actual.nativeFrame;
        if (!frame) throw new Error("Missing genuine committed fixture frame");
        const getter = {
          enumerable: true,
          get() {
            window.callbackAudit.getterCalls++;
            throw new Error("PRIVATE FRAME GETTER");
          },
        };
        if (kind === "nativeFrame")
          return Object.defineProperty({ ...actual }, "nativeFrame", getter);
        if (kind === "origin")
          return {
            ...actual,
            nativeFrame: Object.defineProperty({ ...frame }, "origin", getter),
          };
        return {
          ...actual,
          nativeFrame: {
            ...frame,
            view: Object.defineProperty(
              { ...frame.view },
              "controller",
              getter,
            ),
          },
        };
      };
      window.fixture.publish();
    }, kind);
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator("[data-native-row]")).toHaveText("none");
    expect(
      await page.evaluate(() => ({
        calls: window.callbackAudit.getterCalls,
        record: window.fixture.readSession()?.context?.record?.name,
      })),
    ).toEqual({ calls: 0, record: "Synthetic transaction" });
    expect(errors).toEqual([]);
  });
}

for (const kind of ["authority", "context", "throw"] as const) {
  test(`preserved envelope control: ${kind} read failure masks full interior and uses safe focus`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/fixture.html");
    await page.evaluate(() => window.fixture.set({ interior: true }));
    await page.getByRole("button", { name: "Details a", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Custom interior draft" })
      .fill("Private draft");
    await page.evaluate((kind) => {
      window.callbackAudit = {
        receivers: [],
        oldObserver: 0,
        newObserver: 0,
        getterCalls: 0,
      };
      const port = window.fixture.privatePort();
      const original = port.read;
      port.read = () => {
        if (kind === "throw") throw new Error("PRIVATE READ FAILURE");
        const actual = original();
        const getter = {
          enumerable: true,
          get() {
            window.callbackAudit.getterCalls++;
            throw new Error("PRIVATE AUTHORITY GETTER");
          },
        };
        return kind === "authority"
          ? Object.defineProperty({ ...actual }, "authority", getter)
          : {
              ...actual,
              authority: Object.defineProperty(
                { ...actual.authority },
                "context",
                getter,
              ),
            };
      };
      window.fixture.publish();
    }, kind);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Safe table focus" }),
    ).toBeFocused();
    expect(await page.evaluate(() => window.callbackAudit.getterCalls)).toBe(0);
    expect(errors).toEqual([]);
  });
}
