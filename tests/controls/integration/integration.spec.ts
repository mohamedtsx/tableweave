import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import type { RaceKind } from "../../../apps/storybook/src/controls/ControlsExample.js";

const errors = new WeakMap<Page, string[]>();
const modules = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const captured: string[] = [];
  errors.set(page, captured);
  page.on("pageerror", (error) => captured.push(error.message));
  const urls: string[] = [];
  modules.set(page, urls);
  page.on("request", (request) => urls.push(decodeURIComponent(request.url())));
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
  const urls = modules.get(page) ?? [];
  expect(
    urls.filter(
      (url) =>
        /packages\/(?:react|heroui)\/src\//.test(url) ||
        url.includes("/home/mohamed/Desktop/"),
    ),
  ).toEqual([]);
  const stage = process.env.CONTROLS_ARCHIVE_ROOT;
  if (stage)
    expect(
      urls.filter(
        (url) =>
          url.includes("/@fs/") &&
          !url.includes(`/@fs/${stage.replace(/^\//, "")}/`),
      ),
    ).toEqual([]);
});
const left = (page: Page) => page.locator("#left");
const button = (page: Page, name: string) =>
  left(page).getByRole("button", { name, exact: true });
const check = (page: Page, name: string) =>
  left(page).getByRole("checkbox", { name, exact: true });
const state = (page: Page) =>
  page.evaluate(() => {
    const api = window.controlsIntegration.left;
    if (!api) throw new Error("Example not mounted");
    return api.state();
  });
async function ready(page: Page, path = "/") {
  await page.goto(path);
  await expect(
    left(page).getByRole("grid", { name: "left records" }),
  ).toBeVisible();
  await expect(
    left(page).getByRole("rowheader", { name: "Alpha", exact: true }),
  ).toBeVisible();
  await expect(left(page)).toHaveAttribute("data-owner-match", "true");
}
function assertPrecommit(evidence: {
  before: string | null;
  after: string | null;
  connected: boolean;
}) {
  expect(evidence.connected).toBe(true);
  expect(evidence.before).not.toBeNull();
  expect(evidence.after).toBe(evidence.before);
}

test("actual public controls share accepted IDs and real app actions receive loaded/missing context", async ({
  page,
}) => {
  await ready(page);
  await expect(button(page, "Sort")).toBeVisible();
  await expect(button(page, "Columns")).toBeVisible();
  await expect(left(page).getByLabel("Subscribed selected count")).toHaveCount(
    0,
  );
  await expect(left(page).locator('[data-slot="table-footer"]')).toHaveCount(0);
  await button(page, "Select loaded and missing IDs").click();
  expect((await state(page)).selected).toEqual(["a", "off"]);
  await expect(button(page, "Sort")).toHaveCount(0);
  await button(page, "Queue review").click();
  await expect(left(page).getByLabel("Review queue")).toHaveText(
    "2 IDs in the local review queue",
  );
  await expect(
    left(page).getByRole("status", { name: "Action feedback" }),
  ).toHaveText("Queued 2 IDs: 1 loaded, 1 unavailable.");
  expect(
    await page.evaluate(
      () => window.controlsIntegration.left?.owner.audit.actions,
    ),
  ).toEqual([{ ids: ["a", "off"], loaded: ["a"], missing: ["off"] }]);
  await button(page, "Toggle action failure").click();
  await button(page, "Queue review").click();
  await expect(
    left(page).getByRole("status", { name: "Action feedback" }),
  ).toHaveText("The review queue could not be updated.");
  await expect(page.locator("body")).not.toContainText(
    "Synthetic private action detail",
  );
  expect((await state(page)).queue).toEqual(["a", "off"]);
});

test("normal portal draft unmounts on selection and Cancel does not reset accepted criteria", async ({
  page,
}) => {
  await ready(page);
  const criteria = await left(page).getByTestId("criteria").textContent();
  await button(page, "Open scratch note").click();
  await page
    .getByRole("textbox", { name: "Scratch note draft" })
    .fill("discard this draft");
  await page.evaluate(() =>
    window.controlsIntegration.left?.owner.external({
      type: "selection.change",
      update: { a: true },
    }),
  );
  await expect(
    page.getByRole("dialog", { name: "left scratch note" }),
  ).toHaveCount(0);
  await expect(button(page, "Cancel — Clear row selection")).toBeFocused();
  await button(page, "Cancel — Clear row selection").click();
  await expect(button(page, "Open scratch note")).toBeFocused();
  await expect(left(page).getByTestId("criteria")).toHaveText(criteria ?? "");
  await button(page, "Open scratch note").click();
  await expect(
    page.getByRole("textbox", { name: "Scratch note draft" }),
  ).toHaveValue("");
  expect((await state(page)).normalUnmounts).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Discard note", exact: true }).click();
});

test("controlled row and Cancel proposals remain rejected or accepted by the app, not Aria", async ({
  page,
}) => {
  await ready(page, "/?controlled");
  const row = check(page, "Select Alpha");
  await row.locator("xpath=ancestor::label").click();
  await expect(row).not.toBeChecked();
  expect((await state(page)).proposal).toBe("selection.change");
  await button(page, "Reject proposal").click();
  await expect(row).not.toBeChecked();
  await row.locator("xpath=ancestor::label").click();
  await button(page, "Accept proposal").click();
  await expect(row).toBeChecked();
  await button(page, "Cancel — Clear row selection").click();
  await button(page, "Reject proposal").click();
  await expect(row).toBeChecked();
  await button(page, "Cancel — Clear row selection").click();
  await button(page, "Accept proposal").click();
  await expect(row).not.toBeChecked();
  await expect(button(page, "Sort")).toBeVisible();
});

test("single mode has no header/page-all keyboard route and replaces selected IDs", async ({
  page,
}) => {
  await ready(page, "/?single");
  await expect(left(page).locator("thead input[type=checkbox]")).toHaveCount(0);
  const a = check(page, "Select Alpha"),
    c = check(page, "Select Gamma");
  await a.locator("xpath=ancestor::label").click();
  await c.locator("xpath=ancestor::label").click();
  expect((await state(page)).selected).toEqual(["c"]);
  await c.focus();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Meta+a");
  expect((await state(page)).selected).toEqual(["c"]);
});

test("page-all changes only eligible current page and preserves genuine off-page IDs", async ({
  page,
}) => {
  await ready(page, "/?client");
  await button(page, "Select loaded and missing IDs").click();
  await check(page, "Select eligible rows on this page")
    .locator("xpath=ancestor::label")
    .click();
  expect((await state(page)).selected).toEqual(["a", "c", "off"]);
  await button(page, "Next page").click();
  await expect(
    left(page).getByRole("rowheader", { name: "Delta", exact: true }),
  ).toBeVisible();
  await check(page, "Select eligible rows on this page")
    .locator("xpath=ancestor::label")
    .click();
  expect((await state(page)).selected).toEqual([
    "a",
    "c",
    "d",
    "e",
    "f",
    "off",
  ]);
});

test("retained A while requested B is pending/failure uses shown metadata and real Retry tokens", async ({
  page,
}) => {
  await ready(page);
  const transport = (await state(page)).transportCount;
  await button(page, "Next page").click();
  await expect(button(page, "Next page")).toBeDisabled();
  expect((await state(page)).query.pagination.pageIndex).toBe(1);
  await expect(
    left(page).getByText("1–3 of 12 records · Page 1 of 4"),
  ).toBeVisible();
  await expect(check(page, "Select Alpha")).toBeDisabled();
  await button(page, "Fail request").click();
  await expect(
    left(page).getByRole("rowheader", { name: "Alpha", exact: true }),
  ).toBeVisible();
  await button(page, "Retry").click();
  expect((await state(page)).transportCount).toBe(transport + 2);
  await button(page, "Settle unknown").click();
  await expect(
    left(page).getByRole("rowheader", { name: "Delta", exact: true }),
  ).toBeVisible();
  await expect(left(page).getByText("4–6 records · Page 2")).toBeVisible();
  await expect(
    left(page).getByRole("button", { name: "Page 1", exact: true }),
  ).toHaveCount(0);
  await button(page, "Next page").click();
  await button(page, "Settle zero").click();
  await expect(
    left(page).getByText("0–0 of 0 records · No pages"),
  ).toBeVisible();
  await expect(left(page).locator("tbody tr")).toHaveCount(0);
});

for (const kind of ["selection", "query", "scope"] as const)
  test(`same-turn external ${kind} prevents an old connected row action overwriting accepted state`, async ({
    page,
  }) => {
    await ready(page);
    const evidence = await check(page, "Select Alpha")
      .locator("xpath=ancestor::label")
      .evaluate((node, kind: RaceKind) => {
        const api = window.controlsIntegration.left;
        if (!api || !(node instanceof HTMLElement))
          throw new Error("Missing race actor");
        return api.race(kind, node);
      }, kind);
    assertPrecommit(evidence);
    expect((await state(page)).selected).toEqual(
      kind === "selection" ? ["fresh", "off"] : [],
    );
    if (kind === "query")
      expect((await state(page)).query.pagination.pageIndex).toBe(1);
    if (kind === "scope")
      await expect(
        left(page).locator(".ct-private [role=grid],.ct-private button"),
      ).toHaveCount(0);
  });

test("old connected chooser callback cannot overwrite newly accepted visibility", async ({
  page,
}) => {
  await ready(page, "/?client");
  await button(page, "Columns").click();
  const dialog = page.getByRole("dialog", {
    name: "Shown columns",
    exact: true,
  });
  const evidence = await dialog
    .getByRole("checkbox", { name: "Score", exact: true })
    .locator("xpath=ancestor::label")
    .evaluate((node) => {
      const api = window.controlsIntegration.left;
      if (!api || !(node instanceof HTMLElement))
        throw new Error("Missing chooser actor");
      return api.race("visibility", node);
    });
  assertPrecommit(evidence);
  // A precommit layout mismatch is denied by the actual authority, not merged
  // speculatively into an old native view. The new accepted slice stays intact.
  expect(evidence.afterActionRevision).toBe(evidence.acceptedRevision);
  expect((await state(page)).visibility).toEqual({ name: false });
});

test("preferred row-header fallback and hidden primary remain truthful across actual chooser and sorting", async ({
  page,
}) => {
  await ready(page, "/?client");
  await button(page, "Set two sort priorities").click();
  await button(page, "Columns").click();
  await page
    .getByRole("dialog", { name: "Shown columns", exact: true })
    .getByRole("checkbox", { name: "Name", exact: true })
    .locator("xpath=ancestor::label")
    .click();
  await page.keyboard.press("Escape");
  await expect(
    left(page).locator('tbody [data-key="a"] [role=rowheader]'),
  ).toHaveText("East");
  await expect(
    button(page, "Sort Score, descending, priority 2"),
  ).toBeVisible();
  await expect(
    left(page).locator('th[aria-sort="ascending"],th[aria-sort="descending"]'),
  ).toHaveCount(0);
  await button(page, "Sort").click();
  await expect(
    page.getByRole("dialog", { name: "Sorting", exact: true }),
  ).toContainText("1. Name: Ascending (Hidden column)");
});

test("independent tables mask private tools on the first frame before adapter effects", async ({
  page,
}) => {
  await ready(page, "/?pair");
  await button(page, "Select loaded and missing IDs").click();
  await button(page, "Queue review").click();
  await button(page, "Mask before effects").click();
  await expect(
    left(page).locator(
      ".ct-private button,.ct-private input,.ct-private [role=grid]",
    ),
  ).toHaveCount(0);
  expect((await state(page)).beforeEffectsMasked).toBe(true);
  await expect(left(page).locator(".ct-private")).not.toContainText("Alpha");
  await expect(
    page
      .locator("#right")
      .getByRole("rowheader", { name: "Alpha", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator("#right").getByRole("button", { name: "Sort", exact: true }),
  ).toBeVisible();
});

test("real synchronous receiver-bound correction has one shrink attempt per app epoch", async ({
  page,
}) => {
  await page.goto("/?correction&page=3");
  await expect(
    left(page).getByRole("rowheader", { name: "Juliet", exact: true }),
  ).toBeVisible();
  const epoch = (await state(page)).epoch;
  await button(page, "Shrink to seven").click();
  await expect
    .poll(async () => (await state(page)).query.pagination.pageIndex)
    .toBe(2);
  expect((await state(page)).epoch).toBe(epoch);
  expect(
    (await state(page)).requests.filter(
      (reason) => reason === "pagination.clamp",
    ),
  ).toHaveLength(1);
  await button(page, "Respond with one").click();
  await expect(
    left(page).getByText("Displayed page 3 is outside the current 1 pages.", {
      exact: false,
    }),
  ).toBeVisible();
  expect((await state(page)).query.pagination.pageIndex).toBe(2);
  expect(
    (await state(page)).requests.filter(
      (reason) => reason === "pagination.clamp",
    ),
  ).toHaveLength(1);
});

for (const rtl of [false, true])
  for (const dark of [false, true])
    test(`public messages/provider, 320px, axe and checkbox boundary: rtl=${rtl}, dark=${dark}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width: 320, height: 1100 });
      await ready(page, `/?${rtl ? "rtl&" : ""}${dark ? "dark" : ""}`);
      const box = check(page, rtl ? "اختيار Alpha" : "Select Alpha");
      await expect(box).toBeVisible();
      await expect(left(page).getByRole("grid")).toHaveCSS(
        "direction",
        rtl ? "rtl" : "ltr",
      );
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      ).toBe(true);
      const border = await left(page)
        .locator("[data-slot=checkbox-control]")
        .first()
        .evaluate((element) => ({
          width: getComputedStyle(element).borderTopWidth,
          style: getComputedStyle(element).borderTopStyle,
        }));
      expect(border).toEqual({ width: "1px", style: "solid" });
      const contrast = await left(page)
        .locator("[data-slot=checkbox-control]")
        .first()
        .evaluate((element) => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 1;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Missing color measurement context");
          const rgb = (color: string) => {
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 1, 1);
            return [...ctx.getImageData(0, 0, 1, 1).data];
          };
          let parent = element.parentElement;
          let background = [0, 0, 0, 0];
          while (parent && background[3] === 0) {
            background = rgb(getComputedStyle(parent).backgroundColor);
            parent = parent.parentElement;
          }
          if (background[3] !== 255)
            throw new Error("No opaque checkbox backdrop");
          const foreground = rgb(getComputedStyle(element).borderTopColor);
          const luminance = (value: number[]) => {
            const linear = value.slice(0, 3).map((channel) => {
              const x = channel / 255;
              return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
            });
            return (
              (linear[0] ?? 0) * 0.2126 +
              (linear[1] ?? 0) * 0.7152 +
              (linear[2] ?? 0) * 0.0722
            );
          };
          const a = luminance(foreground),
            b = luminance(background);
          return {
            foreground,
            background,
            ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
          };
        });
      expect(contrast.ratio).toBeGreaterThanOrEqual(3);
      await info.attach("checkbox-boundary", {
        body: JSON.stringify(contrast),
        contentType: "application/json",
      });
      const axe = await new AxeBuilder({ page })
        .include("#left .ct-private")
        .analyze();
      expect(axe.violations).toEqual([]);
      await page.screenshot({
        path: info.outputPath("combined-320.png"),
        fullPage: true,
      });
    });

test("old connected pager denies changed query while the same-owner header sorts latest accepted query", async ({
  page,
}) => {
  await ready(page);
  const evidence = await button(page, "Next page").evaluate((node) => {
    const api = window.controlsIntegration.left;
    if (!api || !(node instanceof HTMLElement))
      throw new Error("Missing pager actor");
    return api.race("query", node);
  });
  assertPrecommit(evidence);
  expect(evidence.afterActionRevision).toBe(evidence.acceptedRevision);
  expect((await state(page)).query.pagination.pageIndex).toBe(1);
  await ready(page);
  const sort = await button(page, "Sort Score, not sorted").evaluate((node) => {
    const api = window.controlsIntegration.left;
    if (!api || !(node instanceof HTMLElement))
      throw new Error("Missing sort actor");
    return api.race("query", node);
  });
  assertPrecommit(sort);
  await expect
    .poll(async () => (await state(page)).query.sorting)
    .toEqual([{ id: "score", desc: false }]);
  expect((await state(page)).query.pagination.pageIndex).toBe(0);
});

test("old connected application action cannot run after actual scope invalidation", async ({
  page,
}) => {
  await ready(page);
  await button(page, "Select loaded and missing IDs").click();
  const evidence = await button(page, "Queue review").evaluate((node) => {
    const api = window.controlsIntegration.left;
    if (!api || !(node instanceof HTMLElement))
      throw new Error("Missing action actor");
    return api.race("scope", node);
  });
  assertPrecommit(evidence);
  expect(
    await page.evaluate(
      () => window.controlsIntegration.left?.owner.audit.actions,
    ),
  ).toEqual([]);
  expect((await state(page)).queue).toEqual([]);
  await expect(
    left(page).locator(".ct-private button,.ct-private [role=grid]"),
  ).toHaveCount(0);
});

test("real page-size options reset one accepted query and preserve selection and criteria", async ({
  page,
}) => {
  await ready(page);
  await button(page, "Select loaded and missing IDs").click();
  const before = await state(page);
  await button(page, "3 Rows per page").click();
  await page.getByRole("option", { name: "6", exact: true }).click();
  await expect
    .poll(async () => (await state(page)).query.pagination.pageSize)
    .toBe(6);
  const accepted = await state(page);
  expect(accepted.query.pagination.pageIndex).toBe(0);
  expect(accepted.epoch).toBeGreaterThan(before.epoch);
  expect(accepted.selected).toEqual(before.selected);
  expect(accepted.query.builder).toEqual(before.query.builder);
  await expect(
    left(page).getByText("1–3 of 12 records · Page 1 of 4"),
  ).toBeVisible();
  await button(page, "Settle known").click();
  await expect(
    left(page).getByText("1–6 of 12 records · Page 1 of 2"),
  ).toBeVisible();
});

test("controlled correction rejection spends its attempt; only an explicit new app epoch reopens it", async ({
  page,
}) => {
  await page.goto("/?correction&controlled&page=3");
  await expect(
    left(page).getByRole("rowheader", { name: "Juliet", exact: true }),
  ).toBeVisible();
  await button(page, "Shrink to seven").click();
  await expect
    .poll(async () => (await state(page)).proposal)
    .toBe("pagination.clamp");
  await button(page, "Reject proposal").click();
  expect((await state(page)).query.pagination.pageIndex).toBe(3);
  await button(page, "Begin request").click();
  await button(page, "Respond with one").click();
  expect(
    (await state(page)).requests.filter(
      (reason) => reason === "pagination.clamp",
    ),
  ).toHaveLength(1);
  await page.evaluate(() =>
    window.controlsIntegration.left?.owner.external(
      {
        type: "pagination.change",
        update: { pageIndex: 3, pageSize: 3 },
      },
      true,
    ),
  );
  await button(page, "Begin request").click();
  await button(page, "Respond with one").click();
  await expect
    .poll(async () => (await state(page)).proposal)
    .toBe("pagination.clamp");
  expect(
    (await state(page)).requests.filter(
      (reason) => reason === "pagination.clamp",
    ),
  ).toHaveLength(2);
  await button(page, "Accept proposal").click();
  await expect
    .poll(async () => (await state(page)).query.pagination.pageIndex)
    .toBe(0);
});

test("combined normal/chooser layout contains the viewport matrix and 200% CSS text expansion", async ({
  page,
}, info) => {
  await ready(page, "/?client");
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await expect(button(page, "Sort")).toBeVisible();
    if (width === 1440)
      await page.screenshot({
        path: info.outputPath("combined-1440.png"),
        fullPage: true,
      });
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await button(page, "Columns").click();
  await expect(
    page.getByRole("dialog", { name: "Shown columns", exact: true }),
  ).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .include("#left .ct-private")
    .include('[role="dialog"]')
    .analyze();
  expect(axe.violations).toEqual([]);
});

test("correction cannot replace a pending genuine user navigation proposal from the old accepted page", async ({
  page,
}) => {
  await page.goto("/?correction&controlled&page=3");
  await expect(
    left(page).getByRole("rowheader", { name: "Juliet", exact: true }),
  ).toBeVisible();
  await button(page, "Shrink to seven").click();
  await expect
    .poll(async () => (await state(page)).proposal)
    .toBe("pagination.clamp");
  await button(page, "Previous page").click();
  await expect
    .poll(async () => (await state(page)).proposal)
    .toBe("pagination.change");
  expect(
    (await state(page)).requests.filter(
      (reason) => reason === "pagination.clamp",
    ),
  ).toHaveLength(1);
  expect((await state(page)).query.pagination.pageIndex).toBe(3);
  await button(page, "Accept proposal").click();
  await expect
    .poll(async () => (await state(page)).query.pagination.pageIndex)
    .toBe(2);
});

test("n1 mandatory reset prevents old controlled IDs reaching a fresh scope B action", async ({
  page,
}, info) => {
  await ready(page, "/?controlled");
  const query = (await state(page)).query;
  await button(page, "Select loaded and missing IDs").click();
  expect((await state(page)).selected).toEqual(["a", "off"]);
  await button(page, "Change scope").click();
  await button(page, "Begin request").click();
  await button(page, "Settle known").click();
  await expect(
    left(page).getByRole("rowheader", { name: "Alpha", exact: true }),
  ).toBeVisible();
  // Exercise the exact reviewed callback if the old selection is still exposed.
  // A correct mandatory reset removes this action until B owns a new selection.
  if (await button(page, "Queue review").count())
    await button(page, "Queue review").click();
  const evidence = await page.evaluate(() => {
    const api = window.controlsIntegration.left;
    if (!api) throw new Error("Example not mounted");
    const resource = api.owner.resource.getSnapshot();
    return {
      context: resource.context,
      shownScope: resource.snapshot?.scopeKey,
      acceptedIds: api.state().selected,
      proposal: api.state().proposal,
      actions: api.owner.audit.actions,
    };
  });
  await info.attach("n1-fresh-scope-action", {
    body: JSON.stringify(evidence, null, 2),
    contentType: "application/json",
  });
  expect(evidence.context.scopeKey).toBe("B");
  expect(evidence.shownScope).toBe("B");
  expect(evidence.actions).toEqual([]);
  expect(evidence.acceptedIds).toEqual([]);
  expect(evidence.proposal).toBeNull();
  expect((await state(page)).query).toEqual(query);
  await check(page, "Select Gamma").locator("xpath=ancestor::label").click();
  await button(page, "Accept proposal").click();
  await button(page, "Queue review").click();
  expect(
    await page.evaluate(
      () => window.controlsIntegration.left?.owner.audit.actions,
    ),
  ).toEqual([{ ids: ["c"], loaded: ["c"], missing: [] }]);
});

for (const group of ["query", "selection", "columns"] as const)
  test(`n1 noop mandatory clear retires held controlled ${group} before expected scope changes`, async ({
    page,
  }) => {
    await ready(page, "/?controlled");
    const before = await state(page);
    if (group === "query") await button(page, "Next page").click();
    else if (group === "selection")
      await check(page, "Select Alpha")
        .locator("xpath=ancestor::label")
        .click();
    else {
      await button(page, "Columns").click();
      await page
        .getByRole("dialog", { name: "Shown columns", exact: true })
        .getByRole("checkbox", { name: "Score", exact: true })
        .locator("xpath=ancestor::label")
        .click();
      await page.keyboard.press("Escape");
    }
    const evidence = await page.evaluate(() => {
      const api = window.controlsIntegration.left;
      if (!api) throw new Error("Example not mounted");
      const owner = api.owner;
      const held = owner.getSnapshot().proposal;
      if (!held) throw new Error("Expected a genuine held controlled proposal");
      const accepted = owner.controller.getSnapshot();
      const proposed = held.transition.state;
      owner.setExpected({ ...owner.getSnapshot().context, scopeKey: "B" });
      // No resource synchronization yet: this is the expected-context/layout gap.
      const resourceScope = owner.resource.getSnapshot().context.scopeKey;
      owner.accept();
      let heldRejected = false;
      try {
        owner.controller.accept(held);
      } catch {
        heldRejected = true;
      }
      return {
        changedGroups: held.transition.changedGroups,
        heldRejected,
        heldNotRetagged: proposed === held.transition.state,
        acceptedUnchanged: accepted === owner.controller.getSnapshot(),
        resourceScope,
        expectedScope: owner.getSnapshot().context.scopeKey,
        proposal: owner.getSnapshot().proposal,
      };
    });
    expect(evidence).toMatchObject({
      changedGroups: [group],
      heldRejected: true,
      heldNotRetagged: true,
      acceptedUnchanged: true,
      resourceScope: "A",
      expectedScope: "B",
      proposal: null,
    });
    await button(page, "Begin request").click();
    await button(page, "Settle known").click();
    expect((await state(page)).query).toEqual(before.query);
    expect((await state(page)).visibility).toEqual(before.visibility);
    expect((await state(page)).selected).toEqual([]);
    await expect(button(page, "Queue review")).toHaveCount(0);
  });

for (const origin of ["application", "resource"] as const)
  test(`n1 ${origin} access loss retires held intent and clears private action state`, async ({
    page,
  }) => {
    await ready(page, "/?controlled");
    await button(page, "Select loaded and missing IDs").click();
    await button(page, "Queue review").click();
    const before = await state(page);
    await button(page, "Next page").click();
    const evidence = await page.evaluate((origin) => {
      const api = window.controlsIntegration.left;
      if (!api) throw new Error("Example not mounted");
      const owner = api.owner;
      owner.setNote("private local note");
      const held = owner.getSnapshot().proposal;
      if (!held) throw new Error("Expected a genuine held query proposal");
      // A real same-query request also proves transport alone did not reset it.
      const token = owner.begin();
      if (!token) throw new Error("Expected an actual resource request token");
      if (origin === "application")
        owner.setExpected(
          { ...owner.getSnapshot().context, access: false },
          true,
        );
      else if (!owner.resource.fail(token, "access-lost"))
        throw new Error("Expected resource-originated access loss");
      owner.accept();
      let heldRejected = false;
      try {
        owner.controller.accept(held);
      } catch {
        heldRejected = true;
      }
      return {
        heldRejected,
        selected: api.state().selected,
        proposal: api.state().proposal,
        queue: owner.getSnapshot().queue,
        note: owner.getSnapshot().note,
        feedback: owner.getSnapshot().feedback,
        resourceAccess: owner.resource.getSnapshot().context.access,
        lateSettlement: owner.settle(),
      };
    }, origin);
    expect(evidence).toEqual({
      heldRejected: true,
      selected: [],
      proposal: null,
      queue: [],
      note: "",
      feedback: "",
      resourceAccess: false,
      lateSettlement: false,
    });
    expect((await state(page)).query).toEqual(before.query);
    await expect(
      left(page).locator(
        ".ct-private button,.ct-private input,.ct-private [role=grid]",
      ),
    ).toHaveCount(0);
    await button(page, "Restore access").click();
    await button(page, "Begin request").click();
    await button(page, "Settle known").click();
    await expect(button(page, "Sort")).toBeVisible();
    expect((await state(page)).selected).toEqual([]);
    await expect(button(page, "Queue review")).toHaveCount(0);
  });

test("n1 same-context refresh preserves controlled selection and ordinary Cancel rejection/delayed acceptance", async ({
  page,
}) => {
  await ready(page, "/?controlled");
  await button(page, "Select loaded and missing IDs").click();
  const before = await state(page);
  await button(page, "Cancel — Clear row selection").click();
  await button(page, "Begin request").click();
  await button(page, "Settle known").click();
  expect((await state(page)).selected).toEqual(before.selected);
  expect((await state(page)).proposal).toBe("selection.cancel");
  await button(page, "Reject proposal").click();
  expect((await state(page)).selected).toEqual(before.selected);
  await button(page, "Cancel — Clear row selection").click();
  const evidence = await page.evaluate(() => {
    const owner = window.controlsIntegration.left?.owner;
    if (!owner) throw new Error("Example not mounted");
    const held = owner.getSnapshot().proposal;
    if (!held) throw new Error("Expected held ordinary Cancel");
    // A value-equal expected context is not a new owner or mandatory reset.
    owner.setExpected({ ...owner.getSnapshot().context }, true);
    return { sameProposal: held === owner.getSnapshot().proposal };
  });
  expect(evidence.sameProposal).toBe(true);
  expect((await state(page)).selected).toEqual(before.selected);
  await button(page, "Begin request").click();
  await button(page, "Settle known").click();
  expect((await state(page)).selected).toEqual(before.selected);
  await button(page, "Accept proposal").click();
  expect((await state(page)).selected).toEqual([]);
  expect((await state(page)).query).toEqual(before.query);
});

test("n1 retired automatic query acceptance cannot run after a same-turn scope switch", async ({
  page,
}) => {
  await ready(page);
  const before = await state(page);
  const evidence = await button(page, "Next page").evaluate((node) => {
    const owner = window.controlsIntegration.left?.owner;
    if (!owner || !(node instanceof HTMLElement))
      throw new Error("Missing genuine connected pager");
    node.click();
    const held = owner.getSnapshot().proposal;
    if (!held) throw new Error("Expected queued automatic query proposal");
    owner.setExpected({ ...owner.getSnapshot().context, scopeKey: "B" }, true);
    let heldRejected = false;
    try {
      owner.controller.accept(held);
    } catch {
      heldRejected = true;
    }
    return { heldRejected, connected: node.isConnected };
  });
  expect(evidence).toEqual({ heldRejected: true, connected: true });
  // New task: the old onRequest microtask has actually had time to run.
  expect((await state(page)).proposal).toBeNull();
  expect((await state(page)).query).toEqual(before.query);
  await button(page, "Begin request").click();
  await button(page, "Settle known").click();
  expect((await state(page)).query).toEqual(before.query);
  expect((await state(page)).commits).not.toContain("pagination.change");
});

test("n1 same-owner controlled sorting and page-size acceptance preserve selected IDs and criteria", async ({
  page,
}) => {
  await ready(page, "/?controlled");
  await button(page, "Select loaded and missing IDs").click();
  const before = await state(page);
  await button(page, "Sort Score, not sorted").click();
  expect((await state(page)).query.sorting).toEqual(before.query.sorting);
  expect((await state(page)).selected).toEqual(before.selected);
  await button(page, "Accept proposal").click();
  await button(page, "Settle known").click();
  expect((await state(page)).query.sorting).toEqual([
    { id: "score", desc: false },
  ]);
  expect((await state(page)).selected).toEqual(before.selected);
  await button(page, "3 Rows per page").click();
  await page.getByRole("option", { name: "6", exact: true }).click();
  expect((await state(page)).query.pagination.pageSize).toBe(3);
  expect((await state(page)).selected).toEqual(before.selected);
  await button(page, "Accept proposal").click();
  await button(page, "Settle known").click();
  const accepted = await state(page);
  expect(accepted.query.pagination).toEqual({ pageIndex: 0, pageSize: 6 });
  expect(accepted.query.builder).toEqual(before.query.builder);
  expect(accepted.query.sorting).toEqual([{ id: "score", desc: false }]);
  expect(accepted.selected).toEqual(before.selected);
});

for (const boundary of ["reset", "unmount", "dispose", "definition"] as const)
  test(`n1 resource ${boundary} invalidation completes controlled reset and retires held query`, async ({
    page,
  }) => {
    await ready(page, "/?controlled");
    await button(page, "Select loaded and missing IDs").click();
    const before = await state(page);
    await button(page, "Next page").click();
    const evidence = await page.evaluate((boundary) => {
      const api = window.controlsIntegration.left;
      if (!api) throw new Error("Example not mounted");
      const owner = api.owner;
      const held = owner.getSnapshot().proposal;
      if (!held) throw new Error("Expected held controlled query");
      if (boundary === "dispose") owner.resource.dispose();
      else if (boundary === "definition")
        owner.resource.setContext({
          ...owner.getSnapshot().context,
          definitionKey: "replacement-definition",
        });
      else owner.resource.clear(boundary);
      owner.accept();
      let heldRejected = false;
      try {
        owner.controller.accept(held);
      } catch {
        heldRejected = true;
      }
      return {
        heldRejected,
        selected: api.state().selected,
        proposal: api.state().proposal,
        bindings: owner.bindings(),
        snapshot: owner.resource.getSnapshot().snapshot,
      };
    }, boundary);
    expect(evidence).toEqual({
      heldRejected: true,
      selected: [],
      proposal: null,
      bindings: { request: null, snapshot: null },
      snapshot: null,
    });
    expect((await state(page)).query).toEqual(before.query);
    await expect(button(page, "Queue review")).toHaveCount(0);
  });

test("public regression: plain StrictMode renders and selects without collection errors", async ({
  page,
}, info) => {
  try {
    await ready(page, "/?strict");
    await check(page, "Select Alpha").locator("xpath=ancestor::label").click();
    expect((await state(page)).selected).toEqual(["a"]);
    await button(page, "Queue review").click();
    expect(
      await page.evaluate(
        () => window.controlsIntegration.left?.owner.audit.actions,
      ),
    ).toEqual([{ ids: ["a"], loaded: ["a"], missing: [] }]);
    await button(page, "Cancel — Clear row selection").click();
    await expect(button(page, "Sort")).toBeVisible();
    expect((await state(page)).selected).toEqual([]);
  } finally {
    await info.attach("plain-strictmode-page-errors", {
      body: JSON.stringify(errors.get(page) ?? []),
      contentType: "application/json",
    });
  }
});

test("public regression: physical rapid reopen preserves Escape and trigger focus for Sorting and Chooser", async ({
  page,
}, info) => {
  // Adapted only from Tableweave's own uninstrumented diagnostic input actions.
  // Each actor gets a fresh page so one broken open modal cannot hide the other.
  for (const [name, title] of [
    ["Sort", "Sorting"],
    ["Columns", "Shown columns"],
  ] as const)
    await test.step(name, async () => {
      await page.setViewportSize({ width: 768, height: 900 });
      await ready(page, "/?client&dark");
      const trigger = button(page, name);
      const dialog = page.getByRole("dialog", { name: title, exact: true });
      await trigger.click();
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      // No close/focus/animation wait here: the trigger is available during exit.
      // mouse.click is physical pointer input, never force or a DOM-click bypass.
      const box = await trigger.boundingBox();
      if (!box) throw new Error(`Missing physical ${name} trigger bounds`);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("Escape");
      // Soft final assertions exercise BOTH actors even if the first is broken.
      // Waiting for the final result must not delay the second Escape itself.
      await expect
        .soft(trigger)
        .toHaveAttribute("aria-expanded", "false", { timeout: 1_500 });
      await expect.soft(dialog).toHaveCount(0, { timeout: 1_500 });
      await expect.soft(trigger).toBeFocused({ timeout: 1_500 });
      await info.attach(`rapid-${name.toLowerCase()}-final-state`, {
        body: JSON.stringify({
          expanded: await trigger.getAttribute("aria-expanded"),
          dialogs: await dialog.count(),
          activeElement: await page.evaluate(
            () => document.activeElement?.tagName ?? null,
          ),
          triggerFocused: await trigger.evaluate(
            (element) => element === document.activeElement,
          ),
        }),
        contentType: "application/json",
      });
    });
});
