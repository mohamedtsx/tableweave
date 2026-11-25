import { expect, test } from "@playwright/test";
import type { BrowserAPI } from "./browser.js";
declare global {
  interface Window {
    neutralConsumer: BrowserAPI;
  }
}
test.beforeEach(async ({ page }) => {
  await page.goto("/tests/reordering/neutral-consumer/browser.html");
  await expect(page.getByRole("table")).toHaveCount(5);
});
test("ordinary C columns have functional menus with no helper or fabricated counters", async ({
  page,
}) => {
  const first = page.getByRole("table").first();
  await first
    .getByRole("button", { name: "Move column: title", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Move after", exact: true }).click();
  await page.evaluate(() => window.neutralConsumer.accept());
  await expect
    .poll(() =>
      page.evaluate(() => window.neutralConsumer.information().order[1]),
    )
    .toBe("title");
  const info = await page.evaluate(() => window.neutralConsumer.information());
  expect(info.columnHelper).toBeNull();
  expect(info.metadataReads).toBe(0);
});
test("held rows show a safe reason and preserve all eleven native records", async ({
  page,
}) => {
  await expect(
    page.getByText("Row movement is unavailable.", { exact: true }),
  ).toBeVisible();
  const info = await page.evaluate(() => window.neutralConsumer.information());
  expect(info.submissions).toBe(0);
  expect(info.rows).toBe(11);
  await expect(page.getByRole("button", { name: /Move row/ })).toHaveCount(0);
});
test("Strict UI detach retains app ownership and fresh native cell content", async ({
  page,
}) => {
  await page.evaluate(() => window.neutralConsumer.rows.hide());
  await page.evaluate(() => window.neutralConsumer.rows.show());
  await expect(page.getByRole("table")).toHaveCount(5);
  await expect(page.getByLabel("Draft row-0")).toHaveCount(5);
  expect(
    await page.evaluate(
      () => window.neutralConsumer.rows.f.helper?.admission.getSnapshot().phase,
    ),
  ).not.toBe("disposed");
});
test("ended non-null replay stays inert and one local pass updates actual cached collection refs", async ({
  page,
}) => {
  await expect
    .poll(() =>
      page.evaluate(() => window.neutralConsumer.direct.status().ready),
    )
    .toBe(true);
  expect(
    await page.evaluate(() => window.neutralConsumer.direct.retireAndReplay()),
  ).toBe("ended");
  await expect
    .poll(() =>
      page.evaluate(() => window.neutralConsumer.direct.status().fresh),
    )
    .toBe("sealed");
  const status = await page.evaluate(() =>
    window.neutralConsumer.direct.status(),
  );
  expect(status.refreshed).toBe(true);
  expect(status.old).toBe("ended");
  expect(status.renders).toBeLessThan(100);
});
test("grouped and AR controls are real sibling handles, not nested sort buttons", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: "نقل العمود: title", exact: true }),
  ).toBeVisible();
  expect(await page.locator("th button button").count()).toBe(0);
  await expect(
    page.getByRole("columnheader", { name: /Records/ }),
  ).toBeVisible();
});
