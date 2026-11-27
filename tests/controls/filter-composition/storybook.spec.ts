import { expect, test } from "@playwright/test";
import { expectCompletedPlay } from "./storybook.play-completion.js";

for (const suffix of [
  "builder-and-selection",
  "tabs-and-date",
  "controlled-search",
  "membership-rtl",
])
  test(`actual filter/control Storybook play: ${suffix}`, async ({
    page,
    request,
  }, info) => {
    const id = `controls-real-filter-composition--${suffix}`;
    const index = await request.get("/index.json");
    expect(index.ok()).toBe(true);
    const data = (await index.json()) as {
      entries: Record<string, { type: string }>;
    };
    expect(data.entries[id]?.type).toBe("story");
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/iframe.html?id=${id}&viewMode=story`);
    await expect(page.getByTestId("filter-controls-play")).toHaveAttribute(
      "data-play-state",
      "completed",
    );
    await expectCompletedPlay(page, info);
    await expect(
      page.locator("body.sb-show-errordisplay,body.sb-show-nopreview"),
    ).toHaveCount(0);
    await expect(page.getByTestId("filter-controls-play")).not.toHaveAttribute(
      "data-play-state",
      "exception",
    );
    expect(errors).toEqual([]);
  });
