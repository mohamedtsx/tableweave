import { requireReorderAdmission } from "../../../packages/react/src/reordering-controller/index.js";
import type { TableCommand } from "../../../packages/react/src/controller/types.js";
import { fixture, type S } from "./fixtures.js";
import type { Harness } from "./harness.js";

export function positive(h: Harness) {
  h.capture();
  const before = h.f.admission.getSnapshot();
  const result = h.begin();
  return {
    started: result.status === "started",
    pending:
      h.f.admission.getSnapshot().moves.pending?.operation ===
      (result.status === "started" ? result.operation : null),
    changed: h.f.admission.getSnapshot() !== before,
    receiver: h.f.counts.receiver,
    actual:
      requireReorderAdmission(h.f.admission, h.f.D, h.f.C).controller === h.f.C,
  };
}
export function queued(h: Harness) {
  const original: TableCommand<S> = {
    type: "pagination.change",
    update: { pageIndex: 0, pageSize: 25 },
  };
  let captured: TableCommand<S> | null = null;
  let same = false;
  h.f.callbacks.command = (command) => {
    if (!captured) captured = command;
    else same = captured === command;
    return undefined;
  };
  const result = h.f.C.dispatch(original);
  if (result.status !== "proposed")
    throw new Error("Real queued proposal required");
  const cloned = captured !== original;
  h.capture();
  h.begin();
  let during = false;
  try {
    h.f.C.dispatch({
      type: "pagination.clamp",
      pageCount: 0,
      queryIdentity: h.f.C.getSnapshot().queryIdentity,
    });
  } catch {
    during = true;
  }
  h.reject();
  h.f.callbacks.command = () => undefined;
  let directDenied = false,
    preflightDenied = false;
  try {
    h.f.C.accept(result.proposal);
  } catch {
    directDenied = true;
  }
  try {
    h.f.admission.requireProposal(result.proposal);
  } catch {
    preflightDenied = true;
  }
  return {
    cloned,
    same,
    during,
    directDenied,
    preflightDenied,
    pageSize: h.f.C.getSnapshot().query.pagination.pageSize,
  };
}
export function commandIdentity(h: Harness) {
  let issued: TableCommand<S> | null = null;
  let same = false;
  h.f.callbacks.command = (command) => {
    if (!issued) issued = command;
    else same = issued === command;
    return undefined;
  };
  const result = h.f.C.dispatch({
    type: "columns.order",
    update: ["name", "amount"],
  });
  if (result.status !== "proposed")
    throw new Error("Real column proposal required");
  h.f.admission.requireProposal(result.proposal);
  const accepted = h.f.C.accept(result.proposal);
  h.f.clearPending();
  h.render();
  return {
    same,
    committed: accepted.status === "committed",
    order: h.f.C.getSnapshot().columns.order,
  };
}
export function reentry(
  h: Harness,
  where: "metadata" | "eligibility" | "listener" | "query",
) {
  h.capture();
  let armed = true;
  const action = () => {
    if (!armed) return;
    armed = false;
    if (where === "query")
      h.f.C.dispatch({ type: "search.commit", search: "" });
    else if (where === "listener") h.f.admission.advance("source");
    else {
      try {
        h.f.C.dispatch({
          type: "pagination.change",
          update: (previous) => previous,
        });
      } catch {
        /* Real denial. */
      }
    }
  };
  let stop = () => {};
  if (where === "listener") stop = h.f.admission.subscribe(action);
  else if (where === "metadata" || where === "query")
    h.f.callbacks.metadata = action;
  else h.f.callbacks.eligibility = action;
  let denied = false;
  try {
    denied = h.begin().status !== "started";
  } catch {
    denied = true;
  }
  stop();
  return {
    denied,
    pending: h.f.admission.getSnapshot().moves.pending === null,
  };
}
export function purge(h: Harness) {
  h.capture();
  h.begin();
  let calls = 0;
  const stop = h.f.admission.subscribe(() => calls++);
  const reads = h.f.counts.metadata,
    eligibility = h.f.counts.eligibility;
  const ticket = h.f.reset();
  const during = h.f.admission.getSnapshot();
  const observed = {
    phase: during.phase,
    interaction: during.interaction,
    pending: during.moves.pending === null,
    callbacks: calls,
    reads: h.f.counts.metadata - reads,
    eligibility: h.f.counts.eligibility - eligibility,
  };
  const completed = h.f.finish(ticket);
  stop();
  return {
    ...observed,
    settled: completed.status === "settled",
    selection: Object.keys(h.f.C.getSnapshot().selection).length,
  };
}
export function uncertainty(h: Harness) {
  h.capture();
  h.begin();
  h.f.admission.settle(h.operation(), {
    kind: "accepted",
    revision: "server-v1",
  });
  const waiting = h.f.admission.getSnapshot().moves.pending?.phase;
  h.f.newer();
  h.render();
  const metadata = h.f.metadata(),
    state = h.f.C.getSnapshot();
  const result = h.f.admission.acknowledge(h.operation(), {
    stamp: {
      ownerEpoch: metadata.ownerEpoch,
      sourceVersion: metadata.sourceVersion,
      revision: metadata.revision,
      definitionKey: h.f.context.definitionKey,
      scopeKey: h.f.context.scopeKey,
      queryIdentity: state.queryIdentity,
      pageIndex: state.query.pagination.pageIndex,
      pageSize: state.query.pagination.pageSize,
    },
    disposition: "applied",
  });
  return {
    waiting,
    changed: result.status === "changed",
    pending: h.f.admission.getSnapshot().moves.pending === null,
    feedback: h.f.admission.getSnapshot().moves.feedback?.code,
  };
}
export function uncontrolled() {
  const f = fixture(false);
  try {
    const result = f.C.dispatch({
      type: "columns.order",
      update: ["name", "amount"],
    });
    return {
      committed: result.status === "committed",
      order: f.C.getSnapshot().columns.order,
    };
  } finally {
    f.dispose();
  }
}

export function busyObservation(h: Harness) {
  h.capture();
  h.begin();
  h.f.admission.settle(h.operation(), {
    kind: "indeterminate",
    code: "timeout",
  });
  h.f.refresh();
  h.render();
  const before = h.f.counts.eligibility;
  h.f.admission.reconcile();
  const busy = h.model().presentation?.busy;
  const waiting = h.f.admission.getSnapshot().moves.pending !== null;
  h.f.removeFormerRow();
  h.render();
  h.f.admission.reconcile();
  return {
    busy,
    waiting,
    noNewEligibility: h.f.counts.eligibility === before,
    missingFormer: !h.model().view?.rows.some((row) => row.id === "one"),
    stillPending: h.f.admission.getSnapshot().moves.pending !== null,
  };
}

export function callbackBoundary(
  h: Harness,
  where: "command" | "state" | "request" | "updater" | "clock",
) {
  let armed = true;
  const advance = () => {
    if (!armed) return;
    armed = false;
    h.f.admission.advance("configuration");
  };
  if (where === "command")
    h.f.callbacks.command = () => {
      advance();
      return undefined;
    };
  if (where === "state")
    h.f.callbacks.state = () => {
      advance();
      return undefined;
    };
  if (where === "request") h.f.callbacks.request = advance;
  if (where === "clock") h.f.callbacks.clock = advance;
  const before = h.f.C.getSnapshot();
  let denied = false;
  try {
    const result =
      where === "clock"
        ? h.f.C.dispatch({
            type: "sorting.change",
            update: [{ id: "amount", desc: true }],
          })
        : h.f.C.dispatch({
            type: "columns.order",
            update(previous) {
              if (where === "updater") advance();
              return [...previous].reverse();
            },
          });
    denied = result.status === "rejected";
  } catch {
    denied = true;
  }
  return { denied, sameAccepted: h.f.C.getSnapshot() === before };
}

export function queryFirst(h: Harness) {
  const phases: string[] = [];
  h.f.callbacks.query = () =>
    phases.push(`query:${h.f.admission.getSnapshot().phase}`);
  h.f.callbacks.commit = () =>
    phases.push(`commit:${h.f.admission.getSnapshot().phase}`);
  const result = h.f.C.dispatch({
    type: "sorting.change",
    update: [{ id: "amount", desc: true }],
  });
  if (result.status !== "proposed")
    throw new Error("Actual query proposal required");
  h.f.C.accept(result.proposal);
  h.f.clearPending();
  return { phases };
}

export function copiedInteraction(h: Harness, proxy: boolean) {
  const origin = h.capture();
  const reads = h.f.counts.metadata;
  let denied = false;
  try {
    h.f.admission.begin(proxy ? new Proxy(origin, {}) : { ...origin }, {
      movedId: "one",
      beforeId: "three",
      afterId: "two",
    });
  } catch {
    denied = true;
  }
  return { denied, noPortRead: h.f.counts.metadata === reads };
}

export function foreignModel(h: Harness, other: Harness) {
  const reads = h.f.counts.metadata;
  let denied = false;
  try {
    h.f.admission.commitModel(h.lease(), other.model());
  } catch {
    denied = true;
  }
  return { denied, noPortRead: h.f.counts.metadata === reads };
}

export async function staleLease(h: Harness) {
  const old = h.lease();
  const origin = h.capture();
  h.f.admission.disconnect(old);
  await Promise.resolve(); // actual deferred P release, no fake cleanup acknowledgement
  h.f.epoch();
  const next = h.f.admission.mount();
  h.f.admission.commitModel(next, h.model());
  h.f.admission.disconnect(old);
  const ready = h.f.admission.getSnapshot().phase === "ready";
  let oldDenied = false;
  try {
    h.f.admission.begin(origin, {
      movedId: "one",
      beforeId: "three",
      afterId: "two",
    });
  } catch {
    oldDenied = true;
  }
  return {
    ready,
    oldDenied,
    newOwnerPreserved: h.f.admission.getSnapshot().phase === "ready",
  };
}
