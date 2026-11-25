import { expect, test } from "@playwright/test";
import type {} from "./browser.js";
test.beforeEach(async ({ page }) => {
  await page.goto("/tests/reordering/fence-domains/browser.html");
  await expect
    .poll(() => page.evaluate(() => Boolean(window.fenceDomains)))
    .toBe(true);
});
for (const kind of ["release", "suspend"] as const) {
  for (const event of ["ack", "reconcile"] as const)
    test(`actual native ${event} ${kind} preserves unmatched submitted operation`, async ({
      page,
    }) => {
      const result = await page.evaluate(
        ([kind, event]) => window.fenceDomains.nativeReentry(kind, true, event),
        [kind, event] as const,
      );
      expect(result).toMatchObject({
        called: true,
        exact: true,
        epoch: 0,
        status: "ignored",
      });
    });
  for (const submitted of [false, true])
    test(`actual native callback ${kind}, submitted=${submitted}`, async ({
      page,
    }) => {
      const result = await page.evaluate(
        ([kind, submitted]) =>
          window.fenceDomains.nativeReentry(kind, submitted),
        [kind, submitted] as const,
      );
      expect(result).toMatchObject({ called: true, exact: true, epoch: 0 });
      expect(result.status).toBe(submitted ? "changed" : "blocked");
    });
  for (const event of ["settle", "ack", "reconcile"] as const)
    test(`submitted ${event}: UI ${kind} is not source loss`, async ({
      page,
    }) => {
      const value = await page.evaluate(
        ([kind, event]) => window.fenceDomains.submitted(kind, event),
        [kind, event] as const,
      );
      expect(value).toMatchObject({
        called: true,
        exactPending: true,
        sameC: true,
        sameMetadata: true,
        sourceValid: true,
      });
      if (event === "settle") expect(value.phase).toBe("awaiting-authority");
      if (event === "ack") expect(value.phase).toBe(null);
    });
  for (const port of ["placement", "metadata", "eligibility"] as const)
    test(`${port} UI ${kind} blocks before token without retiring domain`, async ({
      page,
    }) => {
      expect(
        await page.evaluate(
          ([kind, port]) => window.fenceDomains.beforeToken(kind, port),
          [kind, port] as const,
        ),
      ).toEqual({
        called: true,
        blocked: true,
        pending: true,
        sameEpoch: true,
        freshJoin: true,
      });
    });
  for (const failure of [
    "version",
    "throw",
    "malformed",
    "public-eligibility",
  ] as const)
    test(`in-flight ${failure} wins over UI ${kind}`, async ({ page }) => {
      expect(
        await page.evaluate(
          ([kind, failure]) => window.fenceDomains.inFlight(kind, failure),
          [kind, failure] as const,
        ),
      ).toEqual({
        reached: true,
        pendingPurged: true,
        sourceModelDropped: true,
      });
    });
}
for (const later of ["release", "source", "query"] as const)
  test(`app token handoff precedes later observer ${later}`, async ({
    page,
  }) => {
    const result = await page.evaluate(
      (later) => window.fenceDomains.handoff(later),
      later,
    );
    expect(result.order.slice(0, 4)).toEqual([
      "call",
      "return",
      "submit",
      "observer",
    ]);
    expect(result).toMatchObject({ observerAfter: true, tokenDelivered: true });
    if (later === "release") expect(result.pendingAfter).toBe(true);
    if (later === "source") expect(result.pendingAfter).toBe(false);
    if (later === "query") expect(result.laterProposal).toBe(true);
  });
test("pre-entry wait retains app notice; genuine retained-source commit delivers once", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => window.fenceDomains.waiting()),
  ).toMatchObject({
    result: { status: "ignored", reason: "authority" },
    held: true,
    before: 0,
    after: 1,
    terminal: true,
  });
});
for (const aba of [false, true])
  test(`ordinary direct accept enforces original issuance, ABA=${aba}`, async ({
    page,
  }) => {
    expect(
      await page.evaluate((aba) => window.fenceDomains.directAccept(aba), aba),
    ).toEqual({ refused: true, sameRevision: true, old: true, fresh: true });
  });
for (const kind of ["index", "size", "clamp"] as const)
  test(`no-op ${kind} publishes UI generation only`, async ({ page }) => {
    expect(
      await page.evaluate((kind) => window.fenceDomains.noOp(kind), kind),
    ).toEqual({
      noop: true,
      sameC: true,
      version: true,
      delivered: true,
      old: true,
      fresh: true,
    });
  });
for (const port of ["clock", "updater", "state"] as const)
  test(`${port} reentry cannot commit stale original command`, async ({
    page,
  }) => {
    expect(
      await page.evaluate(
        (port) => window.fenceDomains.commandReentry(port),
        port,
      ),
    ).toEqual({ called: true, refused: true, sameC: true, epoch: 0 });
  });
test("uncontrolled accepted C/query-first order is not undone by UI cleanup", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.fenceDomains.uncontrolled())).toEqual(
    {
      committed: true,
      sameC: false,
      order: ["query:unready", "commit:unready"],
      notificationFailures: 0,
    },
  );
});
test("observe/navigation capture is stable zero-port and does not overwrite row origin", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.fenceDomains.zeroPorts())).toEqual({
    delta: 0,
    stable: true,
    sameOrigin: true,
    started: true,
  });
});
test("two real domains and genuine foreign P2 owner cannot alias", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.fenceDomains.independent())).toEqual({
    aExact: true,
    bExact: true,
    differentP: true,
    refused: true,
    reads: 0,
  });
});
test("a caught public error cannot replay the internal UI interruption receipt", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.fenceDomains.replay())).toEqual({
    publicError: true,
    retired: true,
  });
});
test("actual complete11/default10 supersession and matching acknowledgement", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.fenceDomains.complete())).toEqual({
    count: 11,
    size: 10,
    extent: "complete",
    superseded: true,
    code: "applied",
  });
});
for (const kind of ["selection", "columns", "configuration", "same"] as const)
  test(`coherent model continuation after ${kind} is not backend retirement`, async ({
    page,
  }) => {
    const result = await page.evaluate(
      (kind) => window.fenceDomains.modelContinuation(kind),
      kind,
    );
    expect(result).toMatchObject({
      exact: true,
      sameEpoch: true,
      sameSourceOwner: true,
    });
    if (kind === "selection" || kind === "columns")
      expect(result.genuineWrapperChanged).toBe(true);
    // Same-frame/new-wrapper is only claimed if the actual issuer produces it;
    // no spread/proxy/cast model can create an allowing fixture.
  });
test("actual P retirement purges owned pending and tombstones UI/source proofs", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.fenceDomains.realPurge())).toEqual({
    purged: true,
    joinEnded: true,
    staleModel: true,
  });
});
