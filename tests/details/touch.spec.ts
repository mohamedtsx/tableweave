import { expect, test } from "@playwright/test";

test.use({ hasTouch: true, viewport: { width: 390, height: 800 } });
test("emulated touch scroll remains native while header swipe is inert", async ({
  page,
}) => {
  await page.goto("/proof.html");
  await page.getByRole("button", { name: "Open proof" }).tap();
  const dialog = page.getByRole("dialog", { name: "Drag proof" });
  await expect
    .poll(async () => {
      const box = await dialog.boundingBox();
      return Math.round((box?.x ?? 0) + (box?.width ?? 0));
    })
    .toBe(390);
  const client = await page.context().newCDPSession(page);
  const header = await dialog.locator("[data-drag-header]").boundingBox();
  if (!header) throw new Error("Missing header");
  const x = header.x + 5;
  const y = header.y + header.height / 2;
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: x + 150, y }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect(await dialog.evaluate((e) => (e as HTMLElement).style.transform)).toBe(
    "",
  );
  await expect(page.locator("[data-requests]")).toHaveText("0");
  const body = dialog.locator('[data-slot="drawer-body"]');
  const box = await body.boundingBox();
  if (!box) throw new Error("Missing body");
  const middleX = box.x + box.width / 2;
  const startY = box.y + box.height * 0.8;
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: middleX, y: startY }],
  });
  for (let i = 1; i <= 5; i++) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: middleX, y: startY - i * 35 }],
    });
  }
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect.poll(() => body.evaluate((e) => e.scrollTop)).toBeGreaterThan(0);
});
