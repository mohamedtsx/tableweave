import { expect, test } from "@playwright/test";
import type {} from "./browser.js";

async function open(page: import("@playwright/test").Page, shape = "hook") {
  await page.goto(
    `/tests/table-renderer-collection/browser.html?shape=${shape}`,
  );
  await expect
    .poll(() => page.evaluate(() => window.rendererCollection.state().ready))
    .toBe(true);
  expect(
    await page.evaluate(() => window.rendererCollection.state().counts.body),
  ).toBe(0);
  await page.evaluate(() => window.rendererCollection.commit());
  await expect
    .poll(() => page.evaluate(() => window.rendererCollection.state().valid))
    .toBe(true);
}
for (const shape of [
  "function",
  "hook",
  "memo",
  "forwardRef",
  "class",
  "suspense",
])
  test(`actual helper preserves React-owned ${shape} shape`, async ({
    page,
  }) => {
    await open(page, shape);
    if (shape === "suspense")
      await expect(page.locator("[data-suspended]")).toHaveText("Suspended");
    else if (shape === "function")
      await expect(page.locator("[data-native-body]").first()).toHaveText(
        "Synthetic one",
      );
    else
      await expect(
        page.getByRole("textbox", { name: "Native r1", exact: true }),
      ).toHaveValue("Synthetic one");
    expect(
      await page.evaluate(() => window.rendererCollection.state().counts.body),
    ).toBeGreaterThan(0);
  });
test("unknown/proxy/copied cells and actors deny before payload; identical envelope copy works", async ({
  page,
}) => {
  await open(page);
  const result = await page.evaluate(() =>
    window.rendererCollection.unknowns(),
  );
  expect(result.denied.every(Boolean)).toBe(true);
  expect(result.reads).toBe(0);
  expect(result.proxyOwner).toBeNull();
  expect(result.copyAccepted).toBe(true);
});
test("actual initial-error resource/source-only actor cannot grant collection/selection display", async ({
  page,
}) => {
  await page.goto("/tests/table-renderer-collection/browser.html?sourceOnly");
  await expect
    .poll(() => page.evaluate(() => window.rendererCollection.state().phase))
    .toBe("no-display");
  await page.evaluate(() => window.rendererCollection.commit());
  expect(
    await page.evaluate(() => window.rendererCollection.state().valid),
  ).toBe(false);
  expect(
    await page.evaluate(() => window.rendererCollection.state().counts.body),
  ).toBe(0);
  await expect(page.getByRole("table")).toHaveCount(0);
});
test("real current native arguments accepted; foreign payload never read; old frame args deny", async ({
  page,
}) => {
  await open(page);
  const before = await page.evaluate(
    () => window.rendererCollection.state().revision,
  );
  await page.evaluate(() => window.rendererCollection.replace());
  await expect
    .poll(() => page.evaluate(() => window.rendererCollection.state().valid))
    .toBe(true);
  // Data replacement can preserve controller revision; wait for actual input result.
  await expect
    .poll(() =>
      page.evaluate(() => window.rendererCollection.arguments().oldDenied),
    )
    .toBe(true);
  const result = await page.evaluate(() =>
    window.rendererCollection.arguments(),
  );
  expect(result.denied).toEqual([true, true, true]);
  expect(result.reads).toBe(0);
  expect(result.current).toBe("Synthetic one");
  void before;
});
test("metadata B leaves A's real app form DOM/value intact through selection and query refresh", async ({
  page,
}) => {
  await open(page);
  const input = page.getByRole("textbox", { name: "Native r1", exact: true });
  await input.fill("Unsaved local input");
  await input.evaluate((node) => {
    node.setAttribute("data-same-dom", "yes");
  });
  const before = await page.evaluate(
    () => window.rendererCollection.state().revision,
  );
  await page.evaluate(() => window.rendererCollection.select());
  await expect
    .poll(() => page.evaluate(() => window.rendererCollection.state().revision))
    .not.toBe(before);
  await expect(
    page.getByRole("button", { name: "Act A", exact: true }),
  ).toBeVisible();
  await expect(input).toHaveAttribute("data-same-dom", "yes");
  await expect(input).toHaveValue("Unsaved local input");
  await page.evaluate(() => window.rendererCollection.query());
  await expect(input).toHaveValue("Unsaved local input");
  await expect(input).toHaveAttribute("data-same-dom", "yes");
  expect(
    await page.evaluate(
      () =>
        window.rendererCollection.state().cSame &&
        window.rendererCollection.state().cdSame,
    ),
  ).toBe(true);
});
test("saved action A/Cancel A cannot dispatch B actions or clear B selection", async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() => window.rendererCollection.select());
  await expect(
    page.getByRole("button", { name: "Act A", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    window.rendererCollection.saveHandlers();
    window.rendererCollection.commit("B");
  });
  await expect(
    page.getByRole("button", { name: "Act B", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => window.rendererCollection.invokeSaved());
  const result = await page.evaluate(() => window.rendererCollection.state());
  expect(result.counts.actionA).toBe(0);
  expect(result.counts.actionB).toBe(0);
  expect(result.selected).toEqual(["r1"]);
  await page.getByRole("button", { name: "Act B", exact: true }).click();
  expect(
    await page.evaluate(() => window.rendererCollection.state().counts.actionB),
  ).toBe(1);
});
test("saved A action remains A with current selected context after same-domain metadata B", async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() => window.rendererCollection.select());
  await expect(
    page.getByRole("button", { name: "Act A", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    window.rendererCollection.saveHandlers();
    window.rendererCollection.addSelection();
  });
  await expect
    .poll(() =>
      page.evaluate(() => window.rendererCollection.state().selected.length),
    )
    .toBe(2);
  await expect
    .poll(() => page.evaluate(() => window.rendererCollection.state().valid))
    .toBe(true);
  await page.evaluate(() => window.rendererCollection.invokeSavedAction());
  expect(
    await page.evaluate(() => window.rendererCollection.state().counts.actionA),
  ).toBe(1);
});
test("A fallback reentry committing B cannot focus B's new foreign selected region or call B fallback", async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() => window.rendererCollection.select());
  const cancel = page.getByRole("button", {
    name: /Cancel.*Clear row selection/,
  });
  await expect(cancel).toBeVisible();
  await cancel.focus();
  await page.evaluate(() => window.rendererCollection.armFocusHandoff());
  await cancel.click();
  await expect
    .poll(() =>
      page.evaluate(() => window.rendererCollection.state().counts.focusA),
    )
    .toBe(1);
  await expect(
    page.getByRole("textbox", { name: "New foreign region", exact: true }),
  ).toBeFocused();
  expect(
    await page.evaluate(() => window.rendererCollection.state().counts.focusB),
  ).toBe(0);
});
test("async A failure after B cannot report through B or restore B focus", async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() => {
    window.rendererCollection.commit("A", true);
    window.rendererCollection.select();
  });
  await expect(
    page.getByRole("button", { name: "Act A", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Act A", exact: true }).click();
  await page.evaluate(() => window.rendererCollection.commit("B"));
  await expect(
    page.getByRole("button", { name: "Act B", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => window.rendererCollection.resolve());
  await page.waitForTimeout(0);
  const result = await page.evaluate(() => window.rendererCollection.state());
  expect(result.counts.errorA).toBe(0);
  expect(result.counts.errorB).toBe(0);
  expect(result.counts.focusB).toBe(0);
});
test("context-capture revocation denies before actual helper element exposure/body", async ({
  page,
}) => {
  await open(page);
  const before = await page.evaluate(() =>
    window.rendererCollection.contextReentry(),
  );
  await expect
    .poll(() => page.evaluate(() => window.rendererCollection.state().valid))
    .toBe(false);
  expect(
    await page.evaluate(() => window.rendererCollection.state().counts.body),
  ).toBe(before);
  await page.evaluate(() => window.rendererCollection.restoreContext());
});
test("text callback revocation stops subsequent library text work and masks the adopted region", async ({
  page,
}) => {
  await open(page);
  const before = await page.evaluate(
    () => window.rendererCollection.state().counts,
  );
  await page.evaluate(() => window.rendererCollection.revokeText());
  await expect
    .poll(() => page.evaluate(() => window.rendererCollection.state().valid))
    .toBe(false);
  const after = await page.evaluate(
    () => window.rendererCollection.state().counts,
  );
  expect(after.cellText - before.cellText).toBe(1);
  expect(after.rowText).toBe(before.rowText);
});
