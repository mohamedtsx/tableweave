import { expect, test } from "@playwright/test";

test("pinned genuine Drawer disables drag only; child input/scroll and rejected exits survive", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/proof.html");
  await page.getByRole("button", { name: "Open proof" }).click();
  const dialog = page.getByRole("dialog", { name: "Drag proof" });
  await expect(dialog).toBeVisible();
  // Wait for the real entrance animation before choosing pointer coordinates.
  await expect
    .poll(async () => {
      const box = await dialog.boundingBox();
      return Math.round((box?.x ?? 0) + (box?.width ?? 0));
    })
    .toBe(page.viewportSize()?.width);
  for (const selector of ["[data-drag-header]", "[data-drag-footer]"]) {
    const box = await dialog.locator(selector).boundingBox();
    if (!box) throw new Error("Missing drag surface");
    await page.mouse.move(box.x + 10, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    if (selector === "[data-drag-header]") {
      expect(
        await page.evaluate(
          () => window.getSelection()?.toString().length ?? 0,
        ),
      ).toBeGreaterThan(0);
    }
    await expect(dialog).toHaveCSS("transform", "none");
    expect(
      await dialog.evaluate((e) => (e as HTMLElement).style.transform),
    ).toBe("");
    await expect(page.locator("[data-requests]")).toHaveText("0");
  }
  await dialog.getByRole("button", { name: "Child press 0" }).click();
  await expect(
    dialog.getByRole("button", { name: "Child press 1" }),
  ).toBeVisible();
  await dialog.getByRole("textbox", { name: "Draft" }).fill("changed");
  const body = dialog.locator('[data-slot="drawer-body"]');
  await body.hover();
  await page.mouse.wheel(0, 500);
  await expect.poll(() => body.evaluate((e) => e.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-requests]")).toHaveText("1");
  await expect(dialog).toBeVisible();
  await page.mouse.click(5, 100);
  await expect(page.locator("[data-requests]")).toHaveText("2");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close proof" }).click();
  await expect(page.locator("[data-requests]")).toHaveText("3");
  await expect(dialog.getByRole("textbox", { name: "Draft" })).toHaveValue(
    "changed",
  );
  expect(errors).toEqual([]);
});
