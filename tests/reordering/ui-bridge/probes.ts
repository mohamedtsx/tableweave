import {
  captureReorderNavigation,
  claimReorderUI,
  joinReorderModel,
  observeReorderUI,
  releaseReorderUI,
  requireReorderModel,
  requireReorderNavigation,
  suspendReorderUI,
} from "../../../packages/react/src/reordering-controller/index.js";
import { requireTableRendererTarget } from "../../../packages/heroui/src/table/renderer-commit.js";
import { requireDataTableModel } from "../../../packages/react/src/table/use-data-table.js";
import { required } from "../admission/fixtures.js";
import type { Harness } from "./harness.js";

function denied(action: () => unknown) {
  try {
    action();
    return false;
  } catch {
    return true;
  }
}
export function metadataOnly(h: Harness) {
  const binding = required(h.currentUI().binding);
  const joined = h.join(),
    before = h.f.counts.metadata;
  const a = observeReorderUI(binding);
  const first = captureReorderNavigation(joined);
  const second = captureReorderNavigation(joined);
  const b = observeReorderUI(binding);
  return {
    stable: a === b,
    sameOrigin: first === second,
    reads: h.f.counts.metadata - before,
  };
}
export function pendingABA(h: Harness) {
  const origin = h.origin(),
    joined = h.join(),
    model = h.model();
  const revision = h.f.C.getSnapshot().revision;
  const operation = h.begin();
  requireReorderModel(joined, model);
  const during = denied(() => requireReorderNavigation(origin, joined, model));
  h.rejected();
  const after = denied(() => requireReorderNavigation(origin, joined, model));
  const fresh = captureReorderNavigation(joined);
  requireReorderNavigation(fresh, joined, model);
  return {
    during,
    after,
    sameRevision: h.f.C.getSnapshot().revision === revision,
    fresh: fresh !== origin,
    operation: operation.move.pageIds.length,
  };
}
export function rowSlot(h: Harness) {
  const rowOrigin = h.f.admission.capture(h.appLease);
  const before = h.f.counts.metadata;
  const origin = h.origin();
  observeReorderUI(required(h.currentUI().binding));
  const noReads = h.f.counts.metadata === before;
  const result = h.f.admission.begin(rowOrigin, {
    movedId: "one",
    beforeId: "three",
    afterId: "two",
  });
  return {
    noReads,
    started: result.status === "started",
    oldNavigation: denied(() => h.requireOrigin(origin)),
  };
}
export function replaced(h: Harness) {
  const a = h.join(),
    model = h.model(),
    origin = h.origin();
  h.configB();
  const b = h.join();
  return {
    replaced: a !== b,
    oldJoin: denied(() => requireReorderModel(a, model)),
    oldOrigin: denied(() => requireReorderNavigation(origin, a, model)),
    newJoin: !denied(() => requireReorderModel(b, h.model())),
  };
}
export function releasePending(h: Harness) {
  const a = h.currentUI(),
    joined = h.join();
  h.begin();
  h.hide();
  const hiddenPending = h.f.admission.getSnapshot().moves.pending !== null;
  h.accepted();
  const waiting = h.f.admission.getSnapshot().moves.pending?.phase;
  h.show();
  if (a.binding) releaseReorderUI(a.binding);
  return {
    hiddenPending,
    waiting,
    oldJoin: denied(() => requireReorderModel(joined, h.model())),
    newJoin: !denied(() => requireReorderModel(h.join(), h.model())),
    pending: h.f.admission.getSnapshot().moves.pending !== null,
    ownerEpoch: h.f.metadata().ownerEpoch,
  };
}
export function wrongInputs(h: Harness) {
  const ui = h.currentUI(),
    joined = h.join(),
    model = h.model();
  const binding = required(ui.binding),
    actor = required(ui.actor);
  const before = h.f.counts.metadata;
  const refused = [{ ...binding }, new Proxy(binding, {})].every(
    (input) =>
      denied(() => observeReorderUI(input)) &&
      denied(() => joinReorderModel(input, model, actor)),
  );
  const foreignUI = denied(() =>
    claimReorderUI(h.f.D, h.f.admission, h.appLease, {}),
  );
  const origin = h.origin();
  return {
    refused,
    foreignUI,
    forgedOrigin: denied(() =>
      requireReorderNavigation({ ...origin }, joined, model),
    ),
    forgedJoin: denied(() => requireReorderModel(new Proxy(joined, {}), model)),
    reads: h.f.counts.metadata - before,
  };
}
export function sourceTag(h: Harness) {
  const origin = h.origin(),
    state = h.f.C.getSnapshot();
  h.f.newer();
  return {
    denied: denied(() => h.requireOrigin(origin)),
    sameState: h.f.C.getSnapshot() === state,
  };
}
export function queued(h: Harness) {
  const origin = h.origin();
  h.requireOrigin(origin);
  const proposal = h.f.C.dispatch({
    type: "pagination.change",
    update: { pageIndex: 0, pageSize: 25 },
  });
  if (proposal.status !== "proposed") throw 0;
  h.begin();
  h.rejected();
  return {
    denied: denied(() => h.f.C.accept(proposal.proposal)),
    pageSize: h.f.C.getSnapshot().query.pagination.pageSize,
  };
}
export async function noOp(h: Harness) {
  const origin = h.origin(),
    binding = required(h.currentUI().binding);
  const before = observeReorderUI(binding);
  let deliveries = 0;
  const stop = h.f.admission.subscribe(() => {
    deliveries++;
  });
  h.requireOrigin(origin);
  const result = h.f.C.dispatch({
    type: "pagination.change",
    update: (previous) => previous,
  });
  await Promise.resolve();
  stop();
  return {
    noop: result.status === "noop",
    version: before !== observeReorderUI(binding),
    deliveries,
    old: denied(() => h.requireOrigin(origin)),
    fresh: !denied(() => h.requireOrigin(h.origin())),
  };
}
export function reentry(h: Harness) {
  const binding = required(h.currentUI().binding),
    origin = h.origin();
  let armed = true;
  h.f.callbacks.metadata = () => {
    if (armed) {
      armed = false;
      suspendReorderUI(binding);
    }
  };
  return {
    denied: denied(() => h.requireOrigin(origin)),
    joined: observeReorderUI(binding).joined,
  };
}
export async function foreign(h: Harness) {
  const other = h.foreignModel();
  await Promise.resolve();
  const value = other.read(),
    ui = h.currentUI();
  const binding = required(ui.binding),
    actor = required(ui.actor);
  const before = h.f.counts.metadata;
  const refused = denied(() => joinReorderModel(binding, value, actor));
  other.dispose();
  return {
    refused,
    distinct: value.sourceTarget?.owner !== h.model().sourceTarget?.owner,
    reads: h.f.counts.metadata - before,
  };
}
export function actualBody(h: Harness) {
  const target = h.target();
  const current = requireTableRendererTarget(target);
  requireReorderModel(h.join(), current.model);
  const row = current.model.view?.rows[0];
  if (!row || !current.ports.collection) throw 0;
  const value = current.ports.collection.rowTextValue(row);
  requireReorderModel(h.join(), requireTableRendererTarget(target).model);
  return value;
}

/** Required behavior, deliberately not waived. Source-traced blocker; unrun. */
export function settlementCleanup(h: Harness, kind: "release" | "suspend") {
  const binding = required(h.currentUI().binding);
  const model = h.model();
  const operation = h.begin();
  const before = h.f.C.getSnapshot(),
    metadata = h.f.metadata();
  let armed = true;
  h.f.callbacks.metadata = () => {
    if (!armed) return;
    armed = false;
    if (kind === "release") releaseReorderUI(binding);
    else suspendReorderUI(binding);
  };
  h.accepted();
  return {
    pendingPreserved:
      h.f.admission.getSnapshot().moves.pending?.operation === operation,
    sameC: h.f.C.getSnapshot() === before,
    sameAppMetadata: h.f.metadata() === metadata,
    actualSourceStillValid: !denied(() => requireDataTableModel(model, h.f.D)),
  };
}
