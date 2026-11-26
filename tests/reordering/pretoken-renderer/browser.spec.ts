import { expect, test } from "@playwright/test";
import type {} from "./browser.js";
test.beforeEach(async ({ page }) => {
  await page.goto("/tests/reordering/pretoken-renderer/browser.html");
  await expect
    .poll(() => page.evaluate(() => window.pretokenRenderer.status().ready))
    .toBe(true);
});
const rowLabel = "Move row: row-0";
test("actual production row menu transfers once with exact original receiver and app token", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: rowLabel, exact: true })
    .press("Enter");
  await page.getByRole("menuitem", { name: "Move down", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => window.pretokenRenderer.information().status.notifications,
      ),
    )
    .toBe(1);
  const info = await page.evaluate(() => window.pretokenRenderer.information());
  expect(info.sameReceiver).toBe(true);
  expect(info.operation?.movedId).toBe("row-0");
  expect(info.operation?.beforeId).toBe("row-2");
  expect(info.operation?.afterId).toBe("row-1");
  expect(info.operation?.pageIds).toHaveLength(11);
  expect(info.pending).toBe("submitted");
  await expect(page.getByLabel("Draft row-0")).toHaveValue(
    "Retained native draft",
  );
  await expect(
    page.getByRole("button", { name: "Move column: title", exact: true }),
  ).toBeDisabled();
});
for (const kind of [
  "update",
  "replace",
  "failed",
  "null",
  "cleanup",
  "metadata",
] as const)
  test(`actual R/core/N ${kind} during genuine eligibility prevents pending creation`, async ({
    page,
  }) => {
    await page.evaluate((kind) => window.pretokenRenderer.arm(kind), kind);
    await page.getByRole("button", { name: rowLabel, exact: true }).click();
    await page
      .getByRole("menuitem", { name: "Move down", exact: true })
      .click();
    const info = await page.evaluate(() =>
      window.pretokenRenderer.information(),
    );
    expect(info.trace).toContain(`cut:${kind}`);
    if (kind === "replace") expect(info.trace).toContain("B-committed");
    expect(info.status.notifications).toBe(0);
    expect(info.status.pending).toBe(false);
    expect(info.operation).toBeUndefined();
  });
test("n4 post-clear observer sees actor retired and all old lower ref/ticket routes empty", async ({
  page,
}) => {
  const result = await page.evaluate(() =>
    window.pretokenRenderer.observerClear(),
  );
  expect(result.before).toEqual({ row: true, handle: true, leaf: true });
  expect(result.observed.length).toBeGreaterThan(0);
  for (const item of result.observed)
    expect(item).toEqual({
      actorNull: true,
      disabled: true,
      rowEmpty: true,
      handleEmpty: true,
      leafEmpty: true,
    });
  expect(result.late).toBe(true);
  expect(result.denied).toBe(true);
  expect(result.lateReads).toBe(0);
});
test("n5 genuine loading config works before app commit; ready and wait preserve app ownership and form", async ({
  page,
}) => {
  await page.evaluate(() => window.pretokenRenderer.remoteFull());
  const shell = page.locator('[data-probe="remote"]');
  await expect
    .poll(() =>
      page.evaluate(() => window.pretokenRenderer.fullInformation().phase),
    )
    .toBe("no-display");
  await expect(
    shell.getByRole("button", { name: rowLabel, exact: true }),
  ).toHaveCount(0);
  expect(
    (await page.evaluate(() => window.pretokenRenderer.fullInformation()))
      .notifications,
  ).toBe(0);
  await page.evaluate(() => window.pretokenRenderer.completeFull());
  await expect(
    shell.getByRole("button", { name: rowLabel, exact: true }),
  ).toBeEnabled();
  await shell.getByLabel("Draft row-0").fill("Local draft stays");
  await page.evaluate(() => window.pretokenRenderer.waitFull());
  await expect(
    shell.getByRole("button", { name: rowLabel, exact: true }),
  ).toBeDisabled();
  await expect(shell.getByLabel("Draft row-0")).toHaveValue(
    "Local draft stays",
  );
  const info = await page.evaluate(() =>
    window.pretokenRenderer.fullInformation(),
  );
  expect(info.notifications).toBe(0);
  expect(info.appPhase).not.toBe("unmounted");
  expect(info.appPhase).not.toBe("disposed");
});
test("n6 Number coercion normal metadata reentry denies original saved navigation before dispatch", async ({
  page,
}) => {
  await page.evaluate(() => window.pretokenRenderer.reset(false, false));
  await expect
    .poll(() => page.evaluate(() => window.pretokenRenderer.status().ready))
    .toBe(true);
  expect(await page.evaluate(() => window.pretokenRenderer.coercion())).toEqual(
    { denied: true, coerced: 1, sameRevision: true },
  );
});
for (const mode of ["throw", "reject", "detach", "query", "selection"] as const)
  test(`notification ${mode} is delivered once; no retry/undo or synthetic backend result`, async ({
    page,
  }) => {
    await page.evaluate((mode) => window.pretokenRenderer.notify(mode), mode);
    await page.getByRole("button", { name: rowLabel, exact: true }).click();
    await page
      .getByRole("menuitem", { name: "Move down", exact: true })
      .click();
    const info = await page.evaluate(() =>
      window.pretokenRenderer.information(),
    );
    expect(info.status.notifications).toBe(1);
    expect(info.sameReceiver).toBe(true);
    expect(info.operation).toBeDefined();
    if (["throw", "reject", "detach", "selection"].includes(mode))
      expect(info.status.pending).toBe(true);
  });
test("helper acceptance/indeterminate are not persistence success or fabricated acknowledgement", async ({
  page,
}) => {
  await page.getByRole("button", { name: rowLabel, exact: true }).click();
  await page.getByRole("menuitem", { name: "Move down", exact: true }).click();
  await page.evaluate(() => window.pretokenRenderer.settle("indeterminate"));
  expect(
    (await page.evaluate(() => window.pretokenRenderer.information())).pending,
  ).toBe("awaiting-authority");
  await page.evaluate(() => window.pretokenRenderer.settle("accepted"));
  expect(
    (await page.evaluate(() => window.pretokenRenderer.information())).pending,
  ).toBe("awaiting-authority");
});
test("unselectable row remains movable; actual isRowMovable still blocks terminal action", async ({
  page,
}) => {
  await page.evaluate(() => window.pretokenRenderer.rejectEligible());
  await page.getByRole("button", { name: rowLabel, exact: true }).click();
  await page.getByRole("menuitem", { name: "Move down", exact: true }).click();
  const info = await page.evaluate(() => window.pretokenRenderer.information());
  expect(info.status.notifications).toBe(0);
  expect(info.status.pending).toBe(false);
});
test("ordinary C columns-only and optional AR rows preserve native anatomy and scoped Escape", async ({
  page,
}) => {
  await page.evaluate(() =>
    window.pretokenRenderer.reset(false, true, false, true, true),
  );
  await expect
    .poll(() => page.evaluate(() => window.pretokenRenderer.status().ready))
    .toBe(true);
  expect(
    (await page.evaluate(() => window.pretokenRenderer.information()))
      .columnHelper,
  ).toBe(true);
  await page
    .getByRole("button", { name: "نقل العمود: title", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  expect(await page.locator("th button button, td button button").count()).toBe(
    0,
  );
});

test("ended A native cleanup cannot revoke B after real ref-pass refresh", async ({
  page,
}) => {
  await page.evaluate(() => window.pretokenRenderer.saveThenRetire());
  await expect
    .poll(() => page.evaluate(() => window.pretokenRenderer.status().ready))
    .toBe(true);
  await page.evaluate(() => window.pretokenRenderer.arm("stale"));
  await page
    .getByRole("button", { name: rowLabel, exact: true })
    .press("Space");
  await page.getByRole("menuitem", { name: "Move down", exact: true }).click();
  expect(
    (await page.evaluate(() => window.pretokenRenderer.information())).status
      .notifications,
  ).toBe(1);
});
test("saved navigation cannot survive pending ABA at equal C revision", async ({
  page,
}) => {
  await page.evaluate(() => window.pretokenRenderer.reset(false, false));
  await expect
    .poll(() => page.evaluate(() => window.pretokenRenderer.status().ready))
    .toBe(true);
  await page.evaluate(() => window.pretokenRenderer.saveNavigation());
  const before = (
    await page.evaluate(() => window.pretokenRenderer.information())
  ).revision;
  await page.getByRole("button", { name: rowLabel, exact: true }).click();
  await page.getByRole("menuitem", { name: "Move down", exact: true }).click();
  await page.evaluate(() => window.pretokenRenderer.settle("rejected"));
  expect(
    await page.evaluate(() => window.pretokenRenderer.runSavedNavigation()),
  ).toEqual({ denied: true, revision: before });
});
test("notification cannot steal externally moved focus", async ({ page }) => {
  await page.evaluate(() => window.pretokenRenderer.notify("focus"));
  await page.getByRole("button", { name: rowLabel, exact: true }).click();
  await page.getByRole("menuitem", { name: "Move down", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "External focus", exact: true }),
  ).toBeFocused();
  expect(
    (await page.evaluate(() => window.pretokenRenderer.information())).status
      .notifications,
  ).toBe(1);
});
test("actual new client source and explicit app acknowledgement close synthetic pending intent", async ({
  page,
}) => {
  await page.getByRole("button", { name: rowLabel, exact: true }).click();
  await page.getByRole("menuitem", { name: "Move down", exact: true }).click();
  await page.evaluate(() => window.pretokenRenderer.settle("accepted"));
  expect(
    (await page.evaluate(() => window.pretokenRenderer.information())).status
      .pending,
  ).toBe(true);
  await page.evaluate(() => window.pretokenRenderer.publishApplied());
  await expect
    .poll(() => page.evaluate(() => window.pretokenRenderer.status().ready))
    .toBe(true);
  const result = await page.evaluate(() =>
    window.pretokenRenderer.acknowledgeApplied(),
  );
  expect(result.status).toBe("changed");
  expect(
    (await page.evaluate(() => window.pretokenRenderer.information())).status
      .pending,
  ).toBe(false);
});
test("isRowSelectable false does not disable an otherwise movable row", async ({
  page,
}) => {
  await expect(
    page.getByRole("checkbox", { name: "Select row-1", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Move row: row-1", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Move up", exact: true }).click();
  expect(
    (await page.evaluate(() => window.pretokenRenderer.information())).operation
      ?.movedId,
  ).toBe("row-1");
});
test("source replacement during size coercion blocks before captured schema facts", async ({
  page,
}) => {
  await page.evaluate(() => window.pretokenRenderer.reset(false, false));
  await expect
    .poll(() => page.evaluate(() => window.pretokenRenderer.status().ready))
    .toBe(true);
  expect(
    await page.evaluate(() => window.pretokenRenderer.coercion("size")),
  ).toEqual({ denied: true, coerced: 1, sameRevision: true });
});
test("one actual pending row operation locks row/column/pager, not native selection", async ({
  page,
}) => {
  await page.evaluate(() => window.pretokenRenderer.full());
  const shell = page.locator('[data-probe="shell"]');
  await expect(
    shell.getByRole("button", { name: rowLabel, exact: true }),
  ).toBeEnabled();
  await expect(shell.locator("tbody tr")).toHaveCount(10);
  await expect(
    shell.getByRole("button", { name: "Next page", exact: true }),
  ).toBeEnabled();
  await shell.getByRole("button", { name: rowLabel, exact: true }).click();
  await page.getByRole("menuitem", { name: "Move down", exact: true }).click();
  await expect(
    shell.getByRole("button", { name: "Next page", exact: true }),
  ).toBeDisabled();
  await expect(
    shell.getByRole("button", { name: "Move column: title", exact: true }),
  ).toBeDisabled();
  await expect(
    shell.getByRole("checkbox", { name: "Select row-0", exact: true }),
  ).toBeEnabled();
  expect(
    (await page.evaluate(() => window.pretokenRenderer.fullInformation()))
      .pending,
  ).toBe(true);
});
test("genuine foreign P2 with equal D/C/context strings denies before private locale", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.pretokenRenderer.p2Reject())).toEqual(
    { denied: true, localeReads: 0, genuineP2: true },
  );
});
