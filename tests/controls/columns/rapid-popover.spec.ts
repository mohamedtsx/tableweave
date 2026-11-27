import { expect, test } from "@playwright/test";

for (const control of [
  { trigger: "Sort", dialog: "Sorting" },
  { trigger: "Columns", dialog: "Shown columns" },
]) {
  test(`${control.trigger}: four physical Escape/immediate-reopen cycles retain final Escape and focus`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto("/");
    const trigger = page
      .getByTestId("a")
      .getByRole("button", { name: control.trigger, exact: true });
    const dialog = page.getByRole("dialog", {
      name: control.dialog,
      exact: true,
    });
    const before = await page.evaluate(() => window.columnFixture.a?.state());
    try {
      for (let cycle = 0; cycle < 4; cycle++) {
        await trigger.click();
        await expect(dialog).toBeVisible();
        const box = await trigger.boundingBox();
        if (!box) throw new Error("Missing physical trigger target");
        await page.keyboard.press("Escape");
        // Deliberately no close/focus/ARIA wait here: a real pointer can reopen
        // during exit. Do not synchronize away this legitimate user interaction.
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await expect(trigger).toHaveAttribute("aria-expanded", "true");
        // Do not wait for eventual focus recovery before sending this Escape.
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
        await expect(page.locator('[role="dialog"]')).toHaveCount(0);
        await expect(trigger).toHaveAttribute("aria-expanded", "false");
        await expect(trigger).toBeFocused();
      }
      expect(
        await page.evaluate(() => window.columnFixture.a?.state()),
      ).toEqual(before);
      expect(errors).toEqual([]);
    } finally {
      await info.attach("rapid-final-state.json", {
        body: JSON.stringify({
          control: control.trigger,
          expanded: await trigger.getAttribute("aria-expanded"),
          dialogs: await dialog.count(),
          focus: await page.evaluate(() => ({
            tag: document.activeElement?.tagName,
            role: document.activeElement?.getAttribute("role"),
          })),
          errors,
        }),
        contentType: "application/json",
      });
    }
  });
}
