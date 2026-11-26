import { AxeBuilder } from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { legacyIds } from "./catalog.js";
import "./catalog-check.js";
// Keep all original 33 DOM plays + five viewport assertions byte-for-byte intact.
import "../wp11-catalog/browser.spec.js";

type Diagnostics = {
  pageErrors: string[];
  consoleErrors: string[];
  console: { type: string; text: string }[];
  failedRequests: string[];
  httpErrors: string[];
  blockedRequests: string[];
};
const diagnostics = new WeakMap<Page, Diagnostics>();

async function frameworkState(page: Page) {
  return page.evaluate(() => {
    const preview = (
      window as Window & {
        __STORYBOOK_PREVIEW__?: {
          channel?: { last: (event: string) => unknown[] | undefined };
        };
      }
    ).__STORYBOOK_PREVIEW__;
    const channel = preview?.channel;
    const finished = channel?.last("storyFinished")?.[0] as
      | {
          storyId?: string;
          status?: string;
          reporters?: { status?: string }[];
        }
      | undefined;
    return {
      channelPresent: typeof channel?.last === "function",
      finished: finished ?? null,
      exceptions: [
        "playFunctionThrewException",
        "unhandledErrorsWhilePlaying",
        "storyThrewException",
        "storyErrored",
        "storyMissing",
        "configError",
      ].flatMap((event) =>
        channel?.last(event) ? [{ event, args: channel.last(event) }] : [],
      ),
    };
  });
}

async function finishedPlay(page: Page, id: string) {
  await expect
    .poll(
      async () => {
        const state = await frameworkState(page);
        return {
          channel: state.channelPresent,
          id: state.finished?.storyId,
          status: state.finished?.status,
        };
      },
      { message: `Actual Storybook storyFinished success: ${id}` },
    )
    .toEqual({ channel: true, id, status: "success" });
  const state = await frameworkState(page);
  expect(state.exceptions).toEqual([]);
  expect(Array.isArray(state.finished?.reporters)).toBe(true);
  expect(
    state.finished?.reporters?.filter((report) => report.status === "failed"),
  ).toEqual([]);
  return state;
}

test.beforeEach(async ({ page, context }) => {
  const record: Diagnostics = {
    pageErrors: [],
    consoleErrors: [],
    console: [],
    failedRequests: [],
    httpErrors: [],
    blockedRequests: [],
  };
  diagnostics.set(page, record);
  page.on("pageerror", (error) => record.pageErrors.push(error.message));
  page.on("console", (message) => {
    record.console.push({ type: message.type(), text: message.text() });
    if (message.type() === "error") record.consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) =>
    record.failedRequests.push(
      `${request.method()} ${request.url()} ${request.failure()?.errorText}`,
    ),
  );
  page.on("response", (response) => {
    if (response.status() >= 400) {
      record.httpErrors.push(`${response.status()} ${response.url()}`);
    }
  });
  await context.route("**/*", async (route) => {
    if (new URL(route.request().url()).origin !== "http://127.0.0.1:6570") {
      record.blockedRequests.push(route.request().url());
      await route.abort("blockedbyclient");
    } else {
      await route.continue();
    }
  });
});

test.afterEach(async ({ page }, testInfo) => {
  const record = diagnostics.get(page);
  try {
    const url = new URL(page.url());
    const id = url.searchParams.get("id");
    if (url.pathname === "/iframe.html" && id) {
      const state = await finishedPlay(page, id);
      await testInfo.attach("actual-story-finished.json", {
        body: JSON.stringify({ id, state }, null, 2),
        contentType: "application/json",
      });
      if (id.startsWith("wp11-")) {
        const surfaces = page.locator("[data-workbench-play]");
        expect(await surfaces.count()).toBeGreaterThan(0);
        for (const surface of await surfaces.all()) {
          await expect(surface).toHaveAttribute(
            "data-workbench-play",
            "completed",
          );
        }
        await expect(
          page.locator('[data-workbench-play="exception"]'),
        ).toHaveCount(0);
      }
      if (testInfo.title.startsWith("native facade fits viewport")) {
        const path = testInfo.outputPath("viewport.png");
        await page.screenshot({ path, fullPage: true });
        await testInfo.attach("viewport", { path, contentType: "image/png" });
      }
    }
  } finally {
    await testInfo.attach("page-diagnostics.json", {
      body: JSON.stringify({ url: page.url(), ...record }, null, 2),
      contentType: "application/json",
    });
    // Retain partial framework evidence even when completion fails.
    if (page.url().includes("/iframe.html")) {
      await testInfo.attach("framework-final-state.json", {
        body: JSON.stringify(await frameworkState(page), null, 2),
        contentType: "application/json",
      });
    }
    expect(record?.pageErrors).toEqual([]);
    expect(record?.consoleErrors).toEqual([]);
    expect(record?.failedRequests).toEqual([]);
    expect(record?.httpErrors).toEqual([]);
    expect(record?.blockedRequests).toEqual([]);
  }
});

for (const id of legacyIds) {
  test(`${id} — legacy render and authored play`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${id}&viewMode=story`);
    await finishedPlay(page, id);
    await expect(page.locator("#storybook-root")).toBeVisible();
    await expect(page.locator("#storybook-root")).not.toBeEmpty();
    if (id.startsWith("controls-public-composition--")) {
      await expect(page.getByTestId("controls-play")).toHaveAttribute(
        "data-play-state",
        "completed",
      );
      await expect(page.getByRole("grid")).toBeVisible();
    } else if (id.startsWith("controls-real-filter-composition--")) {
      await expect(page.getByTestId("filter-controls-play")).toHaveAttribute(
        "data-play-state",
        "completed",
      );
      await expect(page.getByRole("grid")).toBeVisible();
    } else if (id === "foundation-workspace--smoke") {
      await expect(page.getByRole("status")).toHaveText("Checks completed: 0");
      await page
        .getByRole("button", { name: "Check interaction", exact: true })
        .click();
      await expect(page.getByRole("status")).toHaveText("Checks completed: 1");
    } else if (id === "filters-tools--builder-all-any") {
      await expect(page.getByTestId("native-ids")).toHaveText("b");
    } else if (id === "filters-tools--invalid-draft") {
      await expect(page.getByRole("alert")).toBeVisible();
      await expect(page.getByTestId("native-ids")).toHaveText("b,c,d");
    } else if (id === "filters-tools--async-options") {
      await expect(
        page.getByRole("button", { name: "Retry options", exact: true }),
      ).toBeVisible();
      await expect(page.getByTestId("native-ids")).toHaveText("a,g");
    } else if (id === "filters-tools--builder-clear") {
      await expect(page.getByTestId("native-ids")).toHaveText("g,b,a");
      await expect(
        page.getByRole("button", {
          name: "Clear filter-builder rules",
          exact: true,
        }),
      ).toHaveCount(0);
    } else if (id === "filters-tools--selection-slot") {
      await expect(
        page.getByRole("button", { name: "Cancel selection", exact: true }),
      ).toBeVisible();
      await expect(page.locator(".wp07-selection-slot")).toContainText(
        "selected",
      );
    } else if (id === "filters-tools--independent-tables") {
      await expect(page.getByTestId("native-ids")).toHaveCount(2);
    } else if (id.startsWith("filters-tools--")) {
      await expect(page.getByTestId("native-ids")).toBeVisible();
    }
  });
}

for (const [name, id, theme, direction] of [
  ["light", "wp11-configurations--fully-configured", "light", "ltr"],
  ["dark", "wp11-configurations--dark", "dark", "ltr"],
  ["Arabic RTL", "wp11-configurations--rtl", "light", "rtl"],
] as const) {
  test(`${name} — native semantics, screenshot and axe`, async ({
    page,
  }, testInfo) => {
    await page.goto(`/iframe.html?id=${id}&viewMode=story`);
    await finishedPlay(page, id);
    await expect(page.getByRole("main")).toHaveAttribute("data-theme", theme);
    await expect(page.getByRole("main")).toHaveAttribute("dir", direction);
    const grid = page.getByRole("grid", {
      name: "Synthetic transactions",
      exact: true,
    });
    await expect(grid).toBeVisible();
    // RAC also creates a hidden collection table. Check the actual named grid's
    // native anatomy rather than ambiguously selecting both table elements.
    expect(await grid.evaluate((element) => element.tagName)).toBe("TABLE");
    const screenshot = testInfo.outputPath("appearance.png");
    await page.screenshot({ path: screenshot, fullPage: true });
    await testInfo.attach("appearance", {
      path: screenshot,
      contentType: "image/png",
    });
    const result = await new AxeBuilder({ page }).analyze();
    await testInfo.attach("axe.json", {
      body: JSON.stringify(result, null, 2),
      contentType: "application/json",
    });
    expect(result.violations).toEqual([]);
  });
}

test("details form — keyboard activation and named native controls", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(
    "/iframe.html?id=wp11-details--custom-details&viewMode=story",
  );
  await finishedPlay(page, "wp11-details--custom-details");
  const trigger = page.getByRole("button", {
    name: "View details tx-001",
    exact: true,
  });
  await trigger.focus();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  const draft = page.getByRole("textbox", {
    name: "Reference draft",
    exact: true,
  });
  await expect(draft).toBeVisible();
  await draft.focus();
  await page.keyboard.press("End");
  await page.keyboard.type(" keyboard review");
  await expect(draft).toHaveValue(/keyboard review$/);
  const close = page.getByRole("button", {
    name: "Close record details",
    exact: true,
  });
  await close.focus();
  await page.keyboard.press("Enter");
  const keep = page.getByRole("button", { name: "Keep editing", exact: true });
  await expect(keep).toBeVisible();
  await keep.focus();
  await page.keyboard.press("Enter");
  await expect(draft).toHaveValue(/keyboard review$/);
  await expect(keep).toHaveCount(0);
  const result = await new AxeBuilder({ page }).analyze();
  await testInfo.attach("details-axe.json", {
    body: JSON.stringify(result, null, 2),
    contentType: "application/json",
  });
  expect(result.violations).toEqual([]);
  const screenshot = testInfo.outputPath("details-keyboard.png");
  await page.screenshot({ path: screenshot, fullPage: true });
  await testInfo.attach("details-keyboard", {
    path: screenshot,
    contentType: "image/png",
  });
});
