# Archived original n4 failures — evidence, not current expectations

Main explicitly authorized test-only replacement of the impossible universal
no-host-rejection assertion after independent feasibility and frozen-source review.
This archive preserves the old failed expectation and actual facts. No old failure
is relabeled as a containment pass. No skip/xfail/global suppression is introduced.

## Before getter correction

Command in `/tmp/opencode/tableweave-wp08`:

```sh
pnpm exec playwright test --config tests/controls/pagination/playwright.config.ts promise-boundary.spec.ts
```

Original source aggregate:
`434530ddee3ea96c66926f8dd36e8e1d2d628b76b0fb0017e085d2c44847a398`.
Capture helper:
`4a716790242744e64f33722ae302e7b7b7ce807293caba27c38baf7dfe26d265`.

Actual probe (one execution, exit1, first failure at constructorReads):

```json
{"audit":{"reads":1,"receiverChecks":[],"getterReads":0,"authorityReads":0,"constructorReads":1,"speciesReads":0,"rawError":null},"b":{"pageIndex":4,"pageSize":10},"commits":[],"errors":["SYNTHETIC PRIVATE REJECTED PROMISE"]}
```

```text
Expected: 0
Received: 1
expect(value.audit.constructorReads).toBe(0);
```

## After getter correction, before authorized test classification

Frozen source aggregate:
`c7085cfc552c48c945c7629c71db8d78288384ae0a7b0fb081c743ab6d4dcf19`.
Original spec SHA256:
`fdb33e88afb50cdfa304ac705df03df1704ae8d271da72e6d77c254564586385`
in historical `promise-candidate.sha256` (all33 inputs independently matched).

Actual full worker invocation: **61 pass /1 fail,62 executions, exit1**. Exactly
the old universal no-host-error assertion failed. Its actual probe:

```json
{"audit":{"reads":1,"receiverChecks":[],"getterReads":0,"authorityReads":0,"constructorReads":0,"speciesReads":0,"rawError":null},"b":{"pageIndex":4,"pageSize":10},"commits":[],"errors":["SYNTHETIC PRIVATE REJECTED PROMISE"]}
```

Exact original test before replacement:

```ts
test("n4 negative boundary: poisoned rejected Promise must not invoke getters or leak rejection", async ({
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
  expect(errors).toEqual([]);
});
```

Exact final failure diff, captured before the next Playwright run clears its owned
results directory:

```text
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "SYNTHETIC PRIVATE REJECTED PROMISE",
+ ]
```

Recorded page snapshot:

```yaml
- main [ref=e3]:
  - heading "Correction owner regressions" [level=1] [ref=e4]
  - paragraph [ref=e5]: Correction mounted
  - paragraph [ref=e6]: "{\"a\":{\"pageIndex\":4,\"pageSize\":10},\"b\":{\"pageIndex\":4,\"pageSize\":10}}"
```

Independent final review (`PROMISE-FINAL-REVIEW.md` in
`/tmp/opencode/wp08-pagination-review-6477`) separately records **82 pass /2 fail
across84 replays**: this worker assertion plus its independent equivalent both
failed only at `errors=[]`. Its13 separate defensive/limitation checks and10
unit/SSR checks passed. These historical independent runs are not added to the
worker's new test count or retrospectively reported green.

The supported port was always synchronous own-data. The avoidable getter execution
was a real defect and was corrected; the remaining original application rejection
also occurs without any observer. The authorized replacement asserts that exact
host event plus all no-getter/no-clamp/no-crash/no-mutation obligations, not generic
rejection containment. Independent/main scoped review still does not accept full
WP-08, packed integration or other deferred gates.
