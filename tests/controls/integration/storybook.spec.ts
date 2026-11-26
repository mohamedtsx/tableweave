import { expect, test } from "@playwright/test";
import { expectCompletedPlay } from "./storybook.play-completion.js";

for (const suffix of [
  "normal-and-selection",
  "retained-request",
  "controlled-rejection",
  "single-rtl",
])
  test(`actual Storybook 9.1.21 play completes without an exception: ${suffix}`, async ({
    page,
    request,
  }, info) => {
    const id = `controls-public-composition--${suffix}`;
    const index = await request.get("/index.json");
    expect(index.ok()).toBe(true);
    const data = (await index.json()) as {
      entries: Record<string, { type: string }>;
    };
    expect(data.entries[id]?.type).toBe("story");
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/iframe.html?id=${id}&viewMode=story`);
    // Loading, a visible canvas, or a rendered button is NOT play completion.
    // The marker changes only after every awaited real userEvent/assertion.
    await expect(page.getByTestId("controls-play")).toHaveAttribute(
      "data-play-state",
      "completed",
      { timeout: 30_000 },
    );
    await expectCompletedPlay(page, info);
    await expect(
      page.locator("body.sb-show-errordisplay,body.sb-show-nopreview"),
    ).toHaveCount(0);
    await expect(page.getByTestId("controls-play")).not.toHaveAttribute(
      "data-play-state",
      "exception",
    );
    expect(errors).toEqual([]);
  });
