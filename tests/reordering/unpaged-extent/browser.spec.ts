import { expect, test } from "@playwright/test";
import type {} from "./browser.js";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/reordering/unpaged-extent/browser.html");
  for (const name of ["client", "complete", "paged"] as const)
    await expect
      .poll(() =>
        page.evaluate((name) => window.unpagedExtent[name].ready(), name),
      )
      .toBe("ready");
});
for (const name of ["client", "complete"] as const) {
  test(`genuine disabled ${name} uses complete11 with actual pageSize10 and unchanged C`, async ({
    page,
  }) => {
    const facts = await page.evaluate(
      (name) => window.unpagedExtent[name].information(),
      name,
    );
    expect(facts).toMatchObject({
      schemaEnabled: false,
      nativeEnabled: false,
      viewEnabled: false,
      displayedRows: 11,
      pageIndex: 0,
      pageSize: 10,
    });
    expect(facts.appKeys).toEqual([
      "ownerEpoch",
      "sourceVersion",
      "revision",
      "baseRevision",
    ]);
    const moved = await page.evaluate(
      (name) => window.unpagedExtent[name].begin(),
      name,
    );
    expect(moved).toMatchObject({
      status: "started",
      extent: "complete",
      ownExtent: true,
      pageIndex: 0,
      pageSize: 10,
      actualC: true,
    });
    expect(moved.ids).toEqual(moved.actualIds);
    expect(moved.ids).toHaveLength(11);
  });
  test(`real ${name} source publication observes complete extent and requires complete ack`, async ({
    page,
  }) => {
    await page.evaluate((name) => window.unpagedExtent[name].begin(), name);
    const result = await page.evaluate(
      (name) => window.unpagedExtent[name].acknowledge(),
      name,
    );
    expect(result).toMatchObject({
      waiting: "awaiting-authority",
      omittedCannotSettle: true,
      pending: true,
      feedback: "applied",
      failures: [],
    });
    expect(result.actualIds?.slice(0, 3)).toEqual(["two", "one", "three"]);
  });
}
test("full client dataset with pagination enabled is page, not complete source extent", async ({
  page,
}) => {
  const facts = await page.evaluate(() =>
    window.unpagedExtent.paged.information(),
  );
  expect(facts).toMatchObject({
    schemaEnabled: true,
    nativeEnabled: true,
    viewEnabled: true,
    displayedRows: 10,
  });
  const moved = await page.evaluate(() => window.unpagedExtent.paged.begin());
  expect(moved).toMatchObject({
    extent: "page",
    ownExtent: false,
    pageSize: 10,
  });
  expect(moved.ids).toEqual(moved.actualIds);
  expect(moved.ids).toHaveLength(10);
});
test("unsupported paginated server-complete cannot mint a complete marker or an allowing model", async ({
  page,
}) => {
  await expect
    .poll(() =>
      page.evaluate(() => window.unpagedExtent.pagedRemoteDenial.modelPhase()),
    )
    .not.toBe("uncommitted");
  expect(
    await page.evaluate(() =>
      window.unpagedExtent.pagedRemoteDenial.denyBegin(),
    ),
  ).toMatchObject({ denied: true });
});
