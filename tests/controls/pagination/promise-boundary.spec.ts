import { expect, test } from "@playwright/test";

test("LIMITATION: unsupported poisoned app Promise stays host-unhandled; library does not invoke getters or clamp", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/correction-review.html?mode=poison-promise&noStrict");
  await expect(page.locator("#diagnostic")).toBeVisible();
  // A browser task checkpoint exposes the already-rejected application's Promise.
  await page.evaluate(
    () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
  );
  const value = await page.evaluate(() => window.correctionProbe.snapshot());
  console.log(
    "n4 getter/dispatch/rejection facts",
    JSON.stringify({
      audit: value.audit,
      b: value.b,
      commits: value.commits.b,
      errors,
    }),
  );
  expect(value.b.pageIndex).toBe(4);
  expect(value.commits.b).toEqual([]);
  expect(value.audit.rawError).toBeNull();
  await expect(page.locator("#mounted")).toBeVisible();
  expect(value.audit.constructorReads).toBe(0);
  expect(value.audit.speciesReads).toBe(0);
  expect(value.audit.getterReads).toBe(0);
  expect(
    await page.evaluate(() => window.correctionProbe.poisonFacts()),
  ).toEqual({
    constructorLocked: true,
    returnedDescriptorsUnchanged: true,
    returnedPrototypeUnchanged: true,
    returnedFrozenStatusUnchanged: true,
    nativePrototypeDescriptorsUnchanged: true,
    nativeConstructorDescriptorsUnchanged: true,
  });
  // Explicitly authorized negative characterization, NOT containment success.
  // Exact historical errors=[] failure is archived in promise-original-failure.md.
  expect(errors).toEqual(["SYNTHETIC PRIVATE REJECTED PROMISE"]);
});

for (const mode of [
  "ordinary-rejection",
  "poison-fulfilled-constructor",
  "poison-fulfilled-species",
])
  test(`DEFENSIVE: ordinary observation/getter-free async rejection metadata: ${mode}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/correction-review.html?mode=${mode}&noStrict`);
    await expect(page.locator("#diagnostic")).toBeVisible();
    await page.evaluate(
      () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
    );
    const value = await page.evaluate(() => window.correctionProbe.snapshot());
    expect(value.b.pageIndex).toBe(4);
    expect(value.commits.b).toEqual([]);
    expect(value.audit.reads).toBe(1);
    expect(value.audit.constructorReads).toBe(0);
    expect(value.audit.speciesReads).toBe(0);
    expect(value.audit.rawError).toBeNull();
    expect(errors).toEqual([]);
  });

test("LIMITATION: intrinsic then cannot attach past a locked throwing constructor", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/promise-feasibility.html");
  await page.evaluate(
    () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
  );
  const facts = await page.evaluate(() => window.promiseFeasibility);
  console.log(
    "n4 standalone infeasibility facts",
    JSON.stringify({ ...facts, errors }),
  );
  // This is explicit negative characterization, not universal containment proof.
  expect(facts).toEqual({
    constructorReads: 1,
    handlerRuns: 0,
    attachmentError: "SYNTHETIC FEASIBILITY CONSTRUCTOR",
    constructorLocked: true,
    descriptorUnchanged: true,
  });
  expect(errors).toEqual(["SYNTHETIC FEASIBILITY ORIGINAL REJECTION"]);
});

test("LIMITATION: app-only original rejection exists without any library observer", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/promise-feasibility.html?strategy=none");
  await page.evaluate(
    () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
  );
  const facts = await page.evaluate(() => window.promiseFeasibility);
  console.log(
    "n4 app-only rejection facts",
    JSON.stringify({ ...facts, errors }),
  );
  expect(facts).toEqual({
    constructorReads: 0,
    handlerRuns: 0,
    attachmentError: null,
    constructorLocked: true,
    descriptorUnchanged: true,
  });
  expect(errors).toEqual(["SYNTHETIC FEASIBILITY ORIGINAL REJECTION"]);
});
