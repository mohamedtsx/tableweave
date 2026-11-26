import { expect, type Page, test } from "@playwright/test";
import type { QuerySafeFixture } from "./fixtures.js";
import { registerSourceDiagnostics } from "./source-diagnostics.js";

declare global {
  interface Window {
    querySafe: QuerySafeFixture;
    otherQuerySafe: QuerySafeFixture;
  }
}

/** Main owns this inert HTML/config/port. Dynamic import shares the exact source
 * factory realm; navigation does not bootstrap another fixture or a mock grant. */
async function mount(page: Page, renderer = false, rtl = false) {
  await page.goto("/tests/reordering/query-safe/browser.html");
  await page.evaluate(
    async ({ renderer, rtl }) => {
      const path = "/tests/reordering/query-safe/fixtures.tsx";
      const module = await import(/* @vite-ignore */ path);
      window.querySafe = module.mountQuerySafeFixture(renderer, rtl);
    },
    { renderer, rtl },
  );
  await ready(page);
}
async function ready(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const info = window.querySafe.information();
        return info.staged && info.phase === "ready";
      }),
    )
    .toBe(true);
}
async function start(page: Page) {
  expect(await page.evaluate(() => window.querySafe.start())).toBe("started");
}
async function query(
  page: Page,
  kind: Parameters<QuerySafeFixture["query"]>[0],
) {
  expect(
    await page.evaluate((kind) => window.querySafe.query(kind), kind),
  ).toBe("committed");
  await ready(page);
}
test.afterEach(async ({ page }) => {
  await page.evaluate(() => {
    window.otherQuerySafe?.dispose();
    window.querySafe?.dispose();
  });
});
registerSourceDiagnostics();

test("A/B/A retains one debt on the same lease; query versions cannot acknowledge it", async ({
  page,
}) => {
  await mount(page);
  await start(page);
  const initial = await page.evaluate(() => window.querySafe.information());
  await query(page, "sort");
  expect(await page.evaluate(() => window.querySafe.ackActive())).toEqual({
    status: "ignored",
    reason: "authority",
  });
  expect(await page.evaluate(() => window.querySafe.ackRetired())).toEqual({
    status: "ignored",
    reason: "authority",
  });
  await query(page, "clear-sort");
  const aba = await page.evaluate(() => window.querySafe.information());
  expect(aba.query).toBe(initial.query);
  expect(aba.metadata.ownerEpoch).toBe(2);
  expect(aba.metadata.sourceVersion).toBe(0);
  expect(aba.pendingId).toBe(initial.pendingId);
  expect(aba.inputIds).toEqual(initial.inputIds);
  expect(
    await page.evaluate(() => window.querySafe.authority("not-applied")),
  ).toBe(true);
  await ready(page);
  expect(
    await page.evaluate(() => window.querySafe.ackRetired("not-applied")),
  ).toEqual({ status: "changed" });
  const done = await page.evaluate(() => window.querySafe.information());
  expect(done.pending).toBe(false);
  expect(done.feedback).toEqual({
    operationId: initial.pendingId,
    code: "rejected",
  });
  expect(done.inputIds).toEqual(initial.inputIds);
});

test("retired definitive rejection works synchronously while the query model is null", async ({
  page,
}) => {
  await mount(page);
  await start(page);
  const result = await page.evaluate(() => {
    const f = window.querySafe;
    f.C.dispatch({
      type: "sorting.change",
      update: [{ id: "amount", desc: true }],
    });
    return {
      result: f.settle({ kind: "rejected", code: "conflict" }),
      info: f.information(),
    };
  });
  expect(result.result).toEqual({ status: "changed" });
  expect(result.info.pending).toBe(false);
  expect(result.info.feedback?.code).toBe("conflict");
  expect(result.info.inputIds).toEqual(["one", "two", "three"]);
});

for (const outcome of [
  { kind: "accepted" },
  { kind: "indeterminate", code: "timeout" },
  { kind: "indeterminate", code: "unavailable" },
  { kind: "indeterminate", code: "cancel-requested" },
] as const) {
  test(`${outcome.kind}/${"code" in outcome ? outcome.code : "accepted"} consumes one settlement across retirement, never authority`, async ({
    page,
  }) => {
    await mount(page);
    await start(page);
    expect(
      await page.evaluate(
        (outcome) => window.querySafe.settle(outcome),
        outcome,
      ),
    ).toEqual({ status: "changed" });
    await query(page, "sort");
    expect(
      await page.evaluate(() =>
        window.querySafe.settle({ kind: "rejected", code: "conflict" }),
      ),
    ).toEqual({ status: "ignored", reason: "operation" });
    const info = await page.evaluate(() => window.querySafe.information());
    expect(info.pending).toBe(true);
    expect(info.pendingPhase).toBe("awaiting-authority");
    expect(info.inputIds).toEqual(["one", "two", "three"]);
    expect(await page.evaluate(() => window.querySafe.ackRetired())).toEqual({
      status: "ignored",
      reason: "authority",
    });
  });
}

test("explicit token authority can finish before transport; late exact-token payload is untouched", async ({
  page,
}) => {
  await mount(page);
  await start(page);
  await query(page, "sort");
  expect(
    await page.evaluate(() => window.querySafe.authority("superseded")),
  ).toBe(true);
  await ready(page);
  expect(
    await page.evaluate(() => window.querySafe.ackRetired("superseded")),
  ).toEqual({ status: "changed" });
  const late = await page.evaluate(() =>
    window.querySafe.revokeDuringPayload(),
  );
  expect(late).toEqual({
    result: { status: "ignored", reason: "operation" },
    fields: [],
  });
  expect(
    (await page.evaluate(() => window.querySafe.information())).feedback?.code,
  ).toBe("superseded");
});

test("active unavailable preflight retains debt without consuming settlement", async ({
  page,
}) => {
  await mount(page);
  await start(page);
  const first = await page.evaluate(() => {
    window.querySafe.metadataFailure();
    const result = window.querySafe.settle({ kind: "accepted" });
    window.querySafe.clearMetadataFailure();
    return { result, info: window.querySafe.information() };
  });
  expect(first.result).toEqual({ status: "ignored", reason: "authority" });
  expect(first.info.pending).toBe(true);
  expect(first.info.pendingPhase).toBe("submitted");
  expect(
    await page.evaluate(() =>
      window.querySafe.settle({ kind: "rejected", code: "conflict" }),
    ),
  ).toEqual({ status: "changed" });
});

test("pure changed from observe-detach is not a consumed settlement", async ({
  page,
}) => {
  await mount(page);
  await start(page);
  const detached = await page.evaluate(() =>
    window.querySafe.departDuringObserve(),
  );
  expect(detached.reads).toBe(3);
  expect(detached.result).toEqual({ status: "changed" });
  expect(
    (await page.evaluate(() => window.querySafe.information())).pendingPhase,
  ).toBe("submitted");
  expect(
    await page.evaluate(() => window.querySafe.settle({ kind: "accepted" })),
  ).toEqual({ status: "changed" });
  expect(
    await page.evaluate(() =>
      window.querySafe.settle({ kind: "rejected", code: "conflict" }),
    ),
  ).toEqual({ status: "ignored", reason: "operation" });
});

for (const failure of ["preflight", "inside-pure", "source-busy"] as const) {
  test(`${failure} recovery requires genuine same-query APP readmission and permits a second operation`, async ({
    page,
  }) => {
    await mount(page);
    await start(page);
    const initial = await page.evaluate(() => window.querySafe.information());
    const failed = await page.evaluate((failure) => {
      const f = window.querySafe;
      if (failure === "preflight") {
        f.metadataFailure();
        const result = f.settle({ kind: "accepted" });
        f.clearMetadataFailure();
        return { result, reads: null, busy: null };
      }
      if (failure === "inside-pure")
        return { ...f.failInsideObserve(), busy: null };
      return { result: null, reads: null, busy: f.busySourceCapture() };
    }, failure);
    if (failure === "preflight")
      expect(failed.result).toEqual({ status: "ignored", reason: "authority" });
    if (failure === "inside-pure") {
      expect(failed.reads).toBe(3);
      expect(failed.result).toEqual({ status: "changed" });
    }
    if (failure === "source-busy") {
      expect(failed.busy?.callbacks).toBeGreaterThan(0);
      expect(failed.busy?.captureDenied).toBe(true);
      expect(failed.busy?.phase).toBe("committed");
    }
    const cut = await page.evaluate(() => window.querySafe.information());
    expect(cut.pendingId).toBe(initial.pendingId);
    expect(cut.pendingPhase).toBe("submitted");
    expect(cut.readmissionRequired).toBe(true);
    expect(cut.phase).toBe("unready");
    expect(
      await page.evaluate(() => window.querySafe.sameEpochCommitDenied()),
    ).toBe(true);
    const stillCut = await page.evaluate(() => window.querySafe.information());
    expect(stillCut.readmissionRequired).toBe(true);
    expect(stillCut.pendingId).toBe(initial.pendingId);
    // Refusal is exact, still unconsumed, and does not manufacture source recovery.
    expect(
      await page.evaluate(() =>
        window.querySafe.settle({ kind: "rejected", code: "conflict" }),
      ),
    ).toEqual({ status: "changed" });
    const refused = await page.evaluate(() => window.querySafe.information());
    expect(refused.pending).toBe(false);
    expect(refused.readmissionRequired).toBe(true);
    expect(refused.phase).toBe("unready");
    await page.evaluate(() => window.querySafe.readmit());
    await ready(page);
    const recovered = await page.evaluate(() => window.querySafe.information());
    expect(recovered.readmissionRequired).toBe(false);
    expect(recovered.query).toBe(initial.query);
    expect(recovered.metadata.ownerEpoch).toBe(initial.metadata.ownerEpoch + 1);
    expect(recovered.metadata.sourceVersion).toBe(
      initial.metadata.sourceVersion,
    );
    expect(recovered.inputIds).toEqual(initial.inputIds);
    await start(page);
    const second = await page.evaluate(() => window.querySafe.information());
    expect(second.pendingId).not.toBe(initial.pendingId);
    expect(second.pendingPhase).toBe("submitted");
  });
}

test("a late failed newer candidate cannot discharge readmission after exact refusal", async ({
  page,
}) => {
  await mount(page);
  await start(page);
  const initial = await page.evaluate(() => window.querySafe.information());
  await page.evaluate(() => {
    const f = window.querySafe;
    f.metadataFailure();
    f.settle({ kind: "accepted" });
    f.clearMetadataFailure();
    f.settle({ kind: "rejected", code: "conflict" });
    f.lateCandidateFailure();
    f.readmit();
  });
  await expect
    .poll(() =>
      page.evaluate(() => window.querySafe.information().lateCandidateFailures),
    )
    .toBe(1);
  const failed = await page.evaluate(() => window.querySafe.information());
  expect(failed.pending).toBe(false);
  expect(failed.metadata.ownerEpoch).toBe(initial.metadata.ownerEpoch + 1);
  expect(failed.readmissionRequired).toBe(true);
  expect(failed.phase).toBe("unready");
  expect(
    await page.evaluate(() => window.querySafe.sameEpochCommitDenied()),
  ).toBe(true);
  expect(
    (await page.evaluate(() => window.querySafe.information()))
      .readmissionRequired,
  ).toBe(true);
  await page.evaluate(() => window.querySafe.readmit());
  await ready(page);
  const recovered = await page.evaluate(() => window.querySafe.information());
  expect(recovered.metadata.ownerEpoch).toBe(initial.metadata.ownerEpoch + 2);
  expect(recovered.metadata.sourceVersion).toBe(initial.metadata.sourceVersion);
  expect(recovered.query).toBe(initial.query);
  expect(recovered.readmissionRequired).toBe(false);
  await start(page);
});

test("same-stamp different native page IDs cannot report ready after core retirement", async ({
  page,
}) => {
  await mount(page);
  await start(page);
  const initial = await page.evaluate(() => window.querySafe.information());
  await page.evaluate(() => window.querySafe.unversionedInput());
  const invalid = await page.evaluate(() => window.querySafe.information());
  expect(invalid.inputIds).toEqual(["two", "one", "three"]);
  expect(invalid.metadata).toEqual(initial.metadata);
  expect(invalid.pendingId).toBe(initial.pendingId);
  expect(invalid.pendingPhase).toBe("submitted");
  expect(invalid.readmissionRequired).toBe(true);
  expect(invalid.phase).toBe("unready");
  expect(
    await page.evaluate(() => window.querySafe.sameEpochCommitDenied()),
  ).toBe(true);
  expect(
    await page.evaluate(() => window.querySafe.authority("superseded")),
  ).toBe(true);
  expect(
    (await page.evaluate(() => window.querySafe.information()))
      .readmissionRequired,
  ).toBe(true);
  await page.evaluate(() => window.querySafe.readmit());
  await ready(page);
  expect(
    await page.evaluate(() => window.querySafe.ackRetired("superseded")),
  ).toEqual({ status: "changed" });
  const recovered = await page.evaluate(() => window.querySafe.information());
  expect(recovered.pending).toBe(false);
  expect(recovered.inputIds).toEqual(invalid.inputIds);
  expect(recovered.query).toBe(initial.query);
  expect(recovered.metadata.sourceVersion).toBe(
    initial.metadata.sourceVersion + 1,
  );
  expect(await page.evaluate(() => window.querySafe.startAtEnd())).toBe(
    "started",
  );
});

test("same-query readmission retains uncertainty until explicit newer token authority", async ({
  page,
}) => {
  await mount(page);
  await start(page);
  const initial = await page.evaluate(() => window.querySafe.information());
  await page.evaluate(() => {
    const f = window.querySafe;
    f.metadataFailure();
    f.settle({ kind: "accepted" });
    f.clearMetadataFailure();
    f.readmit();
  });
  await ready(page);
  const readmitted = await page.evaluate(() => window.querySafe.information());
  expect(readmitted.pendingId).toBe(initial.pendingId);
  expect(readmitted.metadata.sourceVersion).toBe(
    initial.metadata.sourceVersion,
  );
  expect(readmitted.query).toBe(initial.query);
  expect(
    await page.evaluate(() => window.querySafe.ackRetired("not-applied")),
  ).toEqual({
    status: "ignored",
    reason: "authority",
  });
  expect(
    await page.evaluate(() =>
      window.querySafe.settle({ kind: "indeterminate", code: "timeout" }),
    ),
  ).toEqual({ status: "changed" });
  expect(
    await page.evaluate(() => window.querySafe.authority("not-applied")),
  ).toBe(true);
  await ready(page);
  expect(
    await page.evaluate(() => window.querySafe.ackRetired("not-applied")),
  ).toEqual({ status: "changed" });
  expect(
    (await page.evaluate(() => window.querySafe.information())).pending,
  ).toBe(false);
  await start(page);
});

test("one effective pending gate covers metadata, UI claim/release, navigation, pager, clamp and begin", async ({
  page,
}) => {
  await mount(page);
  await page.evaluate(() => window.querySafe.join());
  await start(page);
  await query(page, "sort");
  await page.evaluate(() => {
    window.querySafe.releaseUI();
    window.querySafe.join();
  });
  const gates = await page.evaluate(() => window.querySafe.gates());
  expect(gates.uiPending).toBe(true);
  expect(gates.navigateDenied).toBe(true);
  expect(gates.pagerDenied).toBe(true);
  expect(gates.clampDenied).toBe(true);
  expect(gates.move).toEqual({ status: "blocked", reason: "pending" });
  expect(
    (await page.evaluate(() => window.querySafe.information())).pending,
  ).toBe(true);
});

test("blocked provisional and noop attempts never become issued debt", async ({
  page,
}) => {
  await mount(page);
  expect(await page.evaluate(() => window.querySafe.noopBeforeToken())).toEqual(
    { status: "noop" },
  );
  expect(
    (await page.evaluate(() => window.querySafe.information())).pending,
  ).toBe(false);
  expect(
    (await page.evaluate(() => window.querySafe.blockedBeforeToken())).status,
  ).toBe("blocked");
  expect(
    (await page.evaluate(() => window.querySafe.information())).pending,
  ).toBe(false);
  await start(page);
});

for (const end of [
  "disconnect",
  "advance",
  "publication",
  "controller",
] as const) {
  test(`actual ${end} ends the witness without declaring backend completion or remount-unlocking debt`, async ({
    page,
  }) => {
    await mount(page);
    await start(page);
    const ended = await page.evaluate((end) => {
      const f = window.querySafe;
      f.end(end);
      return {
        snapshot: f.admission.getSnapshot(),
        application: f.information(),
        remountDenied: f.remountDenied(),
        late: f.settle({ kind: "rejected", code: "conflict" }),
      };
    }, end);
    expect(ended.snapshot.moves.pending).toBeNull();
    expect(ended.snapshot.moves.feedback).toBeNull();
    expect(ended.remountDenied).toBe(true);
    expect(ended.late.status).toBe("ignored");
    expect(ended.snapshot.phase).not.toBe("ready");
    if (end === "publication" || end === "controller") {
      expect(ended.application.sourceLive).toBe(false);
      expect(ended.application.inputIds).toEqual([]);
    }
  });
}

test("same P and scope labels on a genuine replacement source owner cannot revive the old token", async ({
  page,
}) => {
  await mount(page);
  await start(page);
  await page.evaluate(() => window.querySafe.foreignSource());
  await expect
    .poll(() => page.evaluate(() => window.querySafe.foreignReady()))
    .toBe(true);
  expect(
    await page.evaluate(() => window.querySafe.foreignCommitDenied()),
  ).toBe(true);
  expect(await page.evaluate(() => window.querySafe.ackRetired())).toEqual({
    status: "ignored",
    reason: "operation",
  });
  const ended = await page.evaluate(() => {
    const fixture = window.querySafe;
    const late = fixture.settle({ kind: "rejected", code: "conflict" });
    const snapshot = fixture.admission.getSnapshot();
    // Remove the old physical lease too: an existing lease alone is not evidence
    // that the negative ended-debt latch prevents replacement ownership.
    fixture.end("disconnect");
    return { late, snapshot, remountDenied: fixture.remountDenied() };
  });
  expect(ended.late).toEqual({ status: "ignored", reason: "operation" });
  expect(ended.snapshot.phase).not.toBe("ready");
  expect(ended.snapshot.moves.pending).toBeNull();
  expect(ended.snapshot.moves.feedback).toBeNull();
  expect(ended.remountDenied).toBe(true);
  expect(await page.evaluate(() => window.querySafe.remountDenied())).toBe(
    true,
  );
});

test("copied/proxied/foreign-P tokens and payloads are rejected before reflection", async ({
  page,
}) => {
  await mount(page);
  await start(page);
  for (const proxy of [false, true]) {
    const result = await page.evaluate(
      (proxy) => window.querySafe.hostileUnknown(proxy),
      proxy,
    );
    expect(result.touches).toBe(0);
    for (const event of [result.settle, result.acknowledge, result.retired])
      expect(event).toEqual({ status: "ignored", reason: "operation" });
  }
  const other = await page.evaluate(async () => {
    const path = "/tests/reordering/query-safe/fixtures.tsx";
    const module = await import(/* @vite-ignore */ path);
    window.otherQuerySafe = module.mountQuerySafeFixture();
    return true;
  });
  expect(other).toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.otherQuerySafe.information().staged))
    .toBe(true);
  expect(await page.evaluate(() => window.otherQuerySafe.start())).toBe(
    "started",
  );
  const foreign = await page.evaluate(() => {
    let touches = 0;
    const payload = new Proxy(
      {},
      {
        getPrototypeOf() {
          touches++;
          throw new Error("Foreign payload");
        },
      },
    );
    const result = Reflect.apply(
      window.querySafe.admission.reconcileRetired,
      window.querySafe.admission,
      [window.otherQuerySafe.operation(), payload],
    );
    return { result, touches };
  });
  expect(foreign).toEqual({
    result: { status: "ignored", reason: "operation" },
    touches: 0,
  });
});

test("closing the exact source owner permanently denies the fixed witness", async ({
  page,
}) => {
  await mount(page);
  await start(page);
  await page.evaluate(() => window.querySafe.closeSourceOwner());
  const result = await page.evaluate(() => ({
    settlement: window.querySafe.settle({ kind: "rejected", code: "conflict" }),
    snapshot: window.querySafe.admission.getSnapshot(),
    remountDenied: window.querySafe.remountDenied(),
  }));
  expect(result.settlement).toEqual({ status: "ignored", reason: "authority" });
  expect(result.snapshot.moves.pending).toBeNull();
  expect(result.snapshot.moves.feedback).toBeNull();
  expect(result.remountDenied).toBe(true);
});

test("malformed outcomes and reentrant events do not consume another settlement", async ({
  page,
}) => {
  await mount(page);
  await start(page);
  expect(await page.evaluate(() => window.querySafe.malformed())).toEqual({
    result: { status: "ignored", reason: "invalid" },
    getters: 0,
  });
  const reentrant = await page.evaluate(() =>
    window.querySafe.reenterDuringPayload(),
  );
  expect(reentrant.nested).toEqual({ status: "ignored", reason: "reentrant" });
  expect(reentrant.outer).toEqual({ status: "changed" });
  await query(page, "sort");
  expect(
    await page.evaluate(() =>
      window.querySafe.settle({ kind: "rejected", code: "rejected" }),
    ),
  ).toEqual({ status: "ignored", reason: "operation" });
});

test("revocation during the first outcome descriptor stops before the next callback", async ({
  page,
}) => {
  await mount(page);
  await start(page);
  expect(
    await page.evaluate(() => window.querySafe.revokeDuringPayload()),
  ).toEqual({
    result: { status: "ignored", reason: "authority" },
    fields: ["kind"],
  });
  expect(await page.evaluate(() => window.querySafe.remountDenied())).toBe(
    true,
  );
});

test("retired acknowledgement checks every current stamp field and strictly newer authority", async ({
  page,
}) => {
  await mount(page);
  await start(page);
  await query(page, "sort");
  expect(
    await page.evaluate(() => window.querySafe.authority("not-applied")),
  ).toBe(true);
  await ready(page);
  const variants = [
    { ownerEpoch: 500 },
    { sourceVersion: 0 },
    { revision: "wrong" },
    { definitionKey: "other" },
    { scopeKey: "same-label-is-not-authority" },
    { queryIdentity: "wrong" },
    { pageIndex: 1 },
    { pageSize: 25 },
  ];
  for (const variant of variants) {
    expect(
      await page.evaluate(
        (variant) => window.querySafe.ackRetired("not-applied", variant),
        variant,
      ),
    ).toEqual({ status: "ignored", reason: "authority" });
    expect(
      (await page.evaluate(() => window.querySafe.information())).pending,
    ).toBe(true);
  }
  const extent = await page.evaluate(() => {
    const f = window.querySafe;
    const origin = f.operation().origin;
    const info = f.information();
    return f.admission.reconcileRetired(f.operation(), {
      disposition: "not-applied",
      stamp: {
        ...origin,
        ownerEpoch: info.metadata.ownerEpoch,
        sourceVersion: info.metadata.sourceVersion,
        queryIdentity: info.query,
        extent: "complete",
      },
    });
  });
  expect(extent).toEqual({ status: "ignored", reason: "authority" });
  expect(
    await page.evaluate(() => window.querySafe.ackRetired("not-applied")),
  ).toEqual({ status: "changed" });
});

for (const corrupt of [
  "lower-version",
  "same-version-different-revision",
] as const) {
  test(`global source authority high-water rejects ${corrupt} across owner epochs`, async ({
    page,
  }) => {
    await mount(page);
    await start(page);
    await query(page, "sort");
    expect(
      await page.evaluate(() => window.querySafe.authority("not-applied")),
    ).toBe(true);
    await ready(page);
    await page.evaluate((corrupt) => {
      const f = window.querySafe,
        metadata = f.information().metadata;
      f.setMetadata({
        ...metadata,
        ownerEpoch: metadata.ownerEpoch + 1,
        ...(corrupt === "lower-version"
          ? { sourceVersion: metadata.sourceVersion - 1 }
          : { revision: "unversioned", baseRevision: "unversioned" }),
      });
    }, corrupt);
    expect(
      (await page.evaluate(() => window.querySafe.information())).phase,
    ).not.toBe("ready");
    expect(
      (await page.evaluate(() => window.querySafe.ackRetired())).status,
    ).toBe("ignored");
  });
}

test("sorted/effectively filtered displays stay genuine but blocked; neutral empty Any stays eligible", async ({
  page,
}) => {
  await mount(page);
  await query(page, "sort");
  expect(
    (await page.evaluate(() => window.querySafe.information())).canReorder,
  ).toBe(false);
  await query(page, "clear-sort");
  await query(page, "filter");
  const filtered = await page.evaluate(() => window.querySafe.information());
  expect(filtered.rows).toEqual(["two", "three"]);
  expect(filtered.inputIds).toEqual(["one", "two", "three"]);
  expect(filtered.canReorder).toBe(false);
  await query(page, "clear-filter");
  await query(page, "neutral-any");
  expect(
    (await page.evaluate(() => window.querySafe.information())).canReorder,
  ).toBe(true);
  await start(page);
});

test("latest-input base/anchor conflict never restores the issuance array or automatically acknowledges", async ({
  page,
}) => {
  await mount(page);
  await start(page);
  await query(page, "sort");
  await page.evaluate(() => window.querySafe.competingInput());
  await ready(page);
  expect(await page.evaluate(() => window.querySafe.authority("applied"))).toBe(
    false,
  );
  expect(
    (await page.evaluate(() => window.querySafe.information())).inputIds,
  ).toEqual(["one", "three"]);
  expect(
    (await page.evaluate(() => window.querySafe.information())).pending,
  ).toBe(true);
  expect(
    await page.evaluate(() => window.querySafe.authority("superseded")),
  ).toBe(true);
  await ready(page);
  expect(
    await page.evaluate(() => window.querySafe.ackRetired("superseded")),
  ).toEqual({ status: "changed" });
  expect(
    (await page.evaluate(() => window.querySafe.information())).inputIds,
  ).toEqual(["one", "three"]);
});

for (const notification of ["throw", "query"] as const) {
  test(`actual narrow RTL keyboard renderer ${notification} notification retains handed-off debt across hide/show`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mount(page, true, true);
    await expect(
      page.getByRole("grid", { name: "Query-safe rows", exact: true }),
    ).toBeVisible();
    await page.evaluate(
      (notification) => window.querySafe.notification(notification),
      notification,
    );
    const handle = page.getByRole("button", {
      name: "Move row: one",
      exact: true,
    });
    await handle.focus();
    await page.keyboard.press("Enter");
    await page
      .getByRole("menuitem", { name: "Move down", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect
      .poll(() =>
        page.evaluate(() => window.querySafe.information().deliveries),
      )
      .toBe(1);
    expect(
      (await page.evaluate(() => window.querySafe.information())).pending,
    ).toBe(true);
    await page.evaluate(() => window.querySafe.hide());
    await page.evaluate(() => window.querySafe.show());
    await expect(
      page.getByRole("grid", { name: "Query-safe rows", exact: true }),
    ).toBeVisible();
    const info = await page.evaluate(() => window.querySafe.information());
    expect(info.deliveries).toBe(1);
    expect(info.pending).toBe(true);
    expect(info.metadata.sourceVersion).toBe(0);
    expect(info.inputIds).toEqual(["one", "two", "three"]);
    await expect(
      page.getByRole("button", { name: /^Move row:/ }).first(),
    ).toBeDisabled();
    await expect(
      page
        .getByText("A row move is awaiting resolution.", { exact: true })
        .first(),
    ).toBeVisible();
  });
}
