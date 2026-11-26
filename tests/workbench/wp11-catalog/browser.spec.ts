import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
const map = readFileSync(
  new URL("../../../apps/storybook/src/workbench/scenes.md", import.meta.url),
  "utf8",
);
const ids = [
  ...new Set(
    map.match(
      /wp11-(?:configurations|filters|recovery|details|reordering)--[a-z-]+/g,
    ),
  ),
];
if (ids.length !== 33)
  throw new Error("Review actual CSF catalog before final browser execution");
for (const id of ids)
  test(`${id} — actual public DOM play`, async ({ page }) => {
    let pageErrors = 0;
    page.on("pageerror", () => {
      pageErrors++;
    });
    await page.goto(`/iframe.html?id=${id}&viewMode=story`);
    const surface = page.locator("[data-workbench-play]");
    await expect(surface.first()).toHaveAttribute(
      "data-workbench-play",
      "completed",
    );
    await expect(page.locator('[data-workbench-play="exception"]')).toHaveCount(
      0,
    );
    expect(pageErrors).toBe(0);
  });
for (const width of [320, 390, 768, 1024, 1440])
  test(`native facade fits viewport ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(
      "/iframe.html?id=wp11-configurations--narrow&viewMode=story",
    );
    await expect(page.locator("[data-workbench-play]")).toHaveAttribute(
      "data-workbench-play",
      "completed",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
