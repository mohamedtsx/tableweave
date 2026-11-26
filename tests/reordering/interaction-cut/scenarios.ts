import {
  revokeReorderInteraction,
  observeReorderUI,
  requireReorderModel,
  captureReorderNavigation,
  requireReorderNavigation,
} from "../../../packages/react/src/reordering-controller/index.js";
import { requireDataTableModel } from "../../../packages/react/src/table/use-data-table.js";
import { harness, type Harness } from "../ui-bridge/harness.js";
import { required } from "../admission/fixtures.js";
import { host } from "../fence-domains/host.js";
import { nativeFixture } from "../fence-domains/native-fixture.js";

const placement = { movedId: "one", beforeId: "three", afterId: "two" };
function denied(action: () => unknown): boolean {
  try {
    action();
    return false;
  } catch {
    return true;
  }
}
async function actual() {
  const h = harness();
  for (let turn = 0; turn < 6 && !h.information().joined; turn++)
    await Promise.resolve();
  if (!h.information().joined)
    throw new Error("Actual committed model/renderer required");
  await Promise.resolve();
  return h;
}
function started(
  h: Harness,
  interaction: ReturnType<Harness["f"]["admission"]["capture"]>,
) {
  const result = h.f.admission.begin(interaction, placement);
  if (result.status !== "started")
    throw new Error("Actual started operation required");
  return result.operation;
}
export async function beforeBegin() {
  const h = await actual();
  try {
    const row = h.f.admission.capture(h.appLease);
    await Promise.resolve();
    let deliveries = 0,
      payloads = 0;
    const stop = h.f.admission.subscribe(() => {
      deliveries++;
    });
    const before = observeReorderUI(required(h.currentUI().binding)),
      counts = { ...h.f.counts };
    const release: undefined = revokeReorderInteraction(row);
    const after = h.f.admission.getSnapshot(),
      repeated = h.f.admission.getSnapshot();
    const input = new Proxy(placement, {
      ownKeys(value) {
        payloads++;
        return Reflect.ownKeys(value);
      },
    });
    const result = h.f.admission.begin(row, input);
    revokeReorderInteraction(row);
    await Promise.resolve();
    stop();
    return {
      undefinedResult: release === undefined,
      blocked: result.status === "blocked",
      inactive: !after.interaction,
      stableSnapshot: after === repeated,
      stableUI: before === observeReorderUI(required(h.currentUI().binding)),
      reads: h.f.counts.metadata - counts.metadata,
      movable: h.f.counts.eligibility - counts.eligibility,
      deliveries,
      payloads,
      pending: after.moves.pending === null,
      epoch: h.f.metadata().ownerEpoch,
    };
  } finally {
    h.dispose();
  }
}
export async function preToken(port: "placement" | "metadata" | "movable") {
  const h = await actual();
  try {
    const row = h.f.admission.capture(h.appLease),
      binding = required(h.currentUI().binding);
    let called = false,
      sameUI = false;
    const revoke = () => {
      if (called) return;
      called = true;
      const before = observeReorderUI(binding);
      revokeReorderInteraction(row);
      sameUI = before === observeReorderUI(binding);
    };
    if (port === "metadata") h.f.callbacks.metadata = revoke;
    if (port === "movable") h.f.callbacks.eligibility = revoke;
    const input =
      port === "placement"
        ? new Proxy(placement, {
            ownKeys(value) {
              revoke();
              return Reflect.ownKeys(value);
            },
          })
        : placement;
    const result = h.f.admission.begin(row, input);
    const noPending = h.f.admission.getSnapshot().moves.pending === null;
    delete h.f.callbacks.metadata;
    delete h.f.callbacks.eligibility;
    requireDataTableModel(h.model(), h.f.D);
    requireReorderModel(h.join(), h.model());
    const fresh = h.f.admission.capture(h.appLease),
      operation = started(h, fresh);
    return {
      called,
      sameUI,
      blocked: result.status === "blocked",
      noPending,
      epoch: h.f.metadata().ownerEpoch,
      freshStarted:
        h.f.admission.getSnapshot().moves.pending?.operation === operation,
    };
  } finally {
    h.dispose();
  }
}
export async function nativePreToken() {
  const fixture = nativeFixture(),
    h = host(fixture.owner);
  for (let turn = 0; turn < 6 && !h.ready(); turn++) await Promise.resolve();
  if (!h.ready()) throw new Error("Actual native host required");
  try {
    const row = h.f.admission.capture(h.appLease),
      beforeEpoch = h.f.metadata().ownerEpoch;
    let called = false,
      sameUI = false;
    fixture.callbacks.native = () => {
      if (called) return;
      called = true;
      const before = observeReorderUI(h.binding());
      revokeReorderInteraction(row);
      sameUI = before === observeReorderUI(h.binding());
    };
    const result = h.f.admission.begin(row, placement);
    const noPending = h.f.admission.getSnapshot().moves.pending === null;
    delete fixture.callbacks.native;
    const fresh = h.f.admission.capture(h.appLease),
      next = h.f.admission.begin(fresh, placement);
    return {
      called,
      sameUI,
      blocked: result.status === "blocked",
      noPending,
      sameEpoch: h.f.metadata().ownerEpoch === beforeEpoch,
      freshStarted: next.status === "started",
    };
  } finally {
    h.dispose();
  }
}
export async function precedence(
  failure: "version" | "throw" | "malformed" | "publication",
) {
  const h = await actual();
  try {
    const row = h.f.admission.capture(h.appLease),
      binding = required(h.currentUI().binding);
    let called = false;
    h.f.callbacks.metadata = () => {
      if (called) return;
      called = true;
      revokeReorderInteraction(row);
      if (failure === "version") h.f.newer();
      if (failure === "throw")
        throw new Error("Synthetic original callback failure");
      if (failure === "malformed")
        Reflect.apply(h.f.setMetadata, undefined, [
          {
            ownerEpoch: 0,
            sourceVersion: "invalid",
            revision: 0,
            baseRevision: "0",
          },
        ]);
      if (failure === "publication") h.f.reset();
    };
    let escaped: unknown,
      blocked = false;
    try {
      blocked = h.f.admission.begin(row, placement).status === "blocked";
    } catch (error) {
      escaped = error;
    }
    const snapshot = h.f.admission.getSnapshot();
    return {
      called,
      denied: blocked || escaped instanceof Error,
      noPending: snapshot.moves.pending === null,
      sourceRetired: snapshot.phase === "unready",
      associationEnded: !observeReorderUI(binding).joined,
      publicErrorOnly: escaped === undefined || escaped instanceof Error,
    };
  } finally {
    h.dispose();
  }
}
export async function foreignAndOld() {
  const a = await actual(),
    b = await actual();
  try {
    const old = a.f.admission.capture(a.appLease),
      current = a.f.admission.capture(a.appLease);
    const other = b.f.admission.capture(b.appLease);
    let traps = 0;
    const trap = new Proxy(
      {},
      {
        get() {
          traps++;
          throw 0;
        },
        ownKeys() {
          traps++;
          throw 0;
        },
        getPrototypeOf() {
          traps++;
          throw 0;
        },
        getOwnPropertyDescriptor() {
          traps++;
          throw 0;
        },
      },
    );
    const revokedProxy = Proxy.revocable({}, {});
    revokedProxy.revoke();
    const reads = a.f.counts.metadata + b.f.counts.metadata;
    for (const value of [
      null,
      undefined,
      1,
      "cut",
      Symbol("cut"),
      () => {},
      trap,
      revokedProxy.proxy,
      { ...current },
      Object.create(current),
      new Proxy(current, {}),
      a.f.C,
      a.f.D,
      a.f.P,
      a.f.admission,
      a.appLease,
      a.join(),
      a.origin(),
    ])
      if (revokeReorderInteraction(value) !== undefined)
        throw new Error("Release result");
    revokeReorderInteraction(old);
    revokeReorderInteraction(old);
    const noReads = a.f.counts.metadata + b.f.counts.metadata === reads;
    const crossDenied = denied(() => a.f.admission.begin(other, placement));
    const first = started(a, current),
      second = started(b, other);
    revokeReorderInteraction(current);
    revokeReorderInteraction(other);
    return {
      traps,
      noReads,
      crossDenied,
      aExact: a.f.admission.getSnapshot().moves.pending?.operation === first,
      bExact: b.f.admission.getSnapshot().moves.pending?.operation === second,
    };
  } finally {
    a.dispose();
    b.dispose();
  }
}
export async function afterStart(kind: "accepted" | "indeterminate") {
  const h = await actual();
  try {
    const row = h.f.admission.capture(h.appLease),
      operation = started(h, row);
    const state = h.f.C.getSnapshot(),
      metadata = h.f.metadata();
    revokeReorderInteraction(row);
    const exact =
      h.f.admission.getSnapshot().moves.pending?.operation === operation;
    h.f.admission.settle(
      operation,
      kind === "accepted"
        ? { kind, revision: "transport" }
        : { kind, code: "timeout" },
    );
    revokeReorderInteraction(row);
    const awaiting = h.f.admission.getSnapshot().moves.pending?.phase;
    const unchanged =
      h.f.C.getSnapshot() === state && h.f.metadata() === metadata;
    h.authoritative();
    const current = h.f.metadata(),
      snapshot = h.f.C.getSnapshot();
    h.f.admission.acknowledge(operation, {
      stamp: {
        ownerEpoch: current.ownerEpoch,
        sourceVersion: current.sourceVersion,
        revision: current.revision,
        definitionKey: h.f.context.definitionKey,
        scopeKey: h.f.context.scopeKey,
        queryIdentity: snapshot.queryIdentity,
        pageIndex: snapshot.query.pagination.pageIndex,
        pageSize: snapshot.query.pagination.pageSize,
      },
      disposition: "applied",
    });
    return {
      exact,
      awaiting,
      unchanged,
      terminal: h.f.admission.getSnapshot().moves.pending === null,
      code: h.f.admission.getSnapshot().moves.feedback?.code,
    };
  } finally {
    h.dispose();
  }
}
export async function independentReceipts() {
  const h = await actual();
  try {
    const proposal = h.f.C.dispatch({
      type: "pagination.change",
      update: { pageIndex: 0, pageSize: 25 },
    });
    if (proposal.status !== "proposed")
      throw new Error("Actual proposal required");
    const join = h.join(),
      origin = captureReorderNavigation(join),
      binding = required(h.currentUI().binding);
    const before = observeReorderUI(binding),
      row = h.f.admission.capture(h.appLease);
    revokeReorderInteraction(row);
    h.f.admission.getSnapshot();
    const sameUI = before === observeReorderUI(binding);
    requireReorderNavigation(origin, join, h.model());
    const accepted = h.f.C.accept(proposal.proposal);
    return {
      sameUI,
      navigationStayedCurrent: true,
      accepted: accepted.status === "committed",
    };
  } finally {
    h.dispose();
  }
}
export async function borrowedReceiver() {
  const h = await actual();
  try {
    const row = h.f.admission.capture(h.appLease),
      reads = h.f.counts.metadata;
    const refused = denied(() =>
      Reflect.apply(h.f.admission.begin, {}, [row, placement]),
    );
    const noReads = h.f.counts.metadata === reads;
    const operation = started(h, row);
    return {
      refused,
      noReads,
      exact: h.f.admission.getSnapshot().moves.pending?.operation === operation,
    };
  } finally {
    h.dispose();
  }
}
