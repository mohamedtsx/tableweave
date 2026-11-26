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
import { harness, type Harness } from "../ui-bridge/harness.js";
import { required } from "../admission/fixtures.js";

export type Cleanup = "release" | "suspend";
export function denies(action: () => unknown): boolean {
  try {
    action();
    return false;
  } catch {
    return true;
  }
}
function cleanup(h: Harness, kind: Cleanup) {
  const binding = required(h.currentUI().binding);
  return () =>
    kind === "release" ? releaseReorderUI(binding) : suspendReorderUI(binding);
}
async function actual(server = false, unpaged = false) {
  const h = harness(server, unpaged);
  for (let turn = 0; turn < 6 && !h.information().joined; turn++)
    await Promise.resolve();
  if (!h.information().joined)
    throw new Error("Actual committed renderer join required");
  return h;
}
export async function submitted(
  kind: Cleanup,
  event: "settle" | "ack" | "reconcile",
) {
  const h = await actual();
  try {
    const operation = h.begin();
    if (event === "ack") {
      h.accepted();
      h.authoritative();
    }
    const revoke = cleanup(h, kind),
      state = h.f.C.getSnapshot(),
      metadata = h.f.metadata();
    let called = false;
    h.f.callbacks.metadata = () => {
      if (!called) {
        called = true;
        revoke();
      }
    };
    const result =
      event === "settle"
        ? h.accepted()
        : event === "ack"
          ? h.acknowledge()
          : h.f.admission.reconcile();
    const pending = h.f.admission.getSnapshot().moves.pending;
    return {
      called,
      result: result.status,
      exactPending:
        event === "ack" ? pending === null : pending?.operation === operation,
      phase: pending?.phase ?? null,
      sameC: h.f.C.getSnapshot() === state,
      sameMetadata: h.f.metadata() === metadata,
      sourceValid: !denies(() => requireDataTableModel(h.model(), h.f.D)),
    };
  } finally {
    h.dispose();
  }
}
export async function beforeToken(
  kind: Cleanup,
  port: "placement" | "metadata" | "eligibility",
) {
  const h = await actual();
  try {
    const interaction = h.f.admission.capture(h.appLease),
      revoke = cleanup(h, kind);
    let called = false;
    const once = () => {
      if (!called) {
        called = true;
        revoke();
      }
    };
    const placement = { movedId: "one", beforeId: "three", afterId: "two" };
    if (port === "metadata") h.f.callbacks.metadata = once;
    if (port === "eligibility") h.f.callbacks.eligibility = once;
    const input =
      port === "placement"
        ? new Proxy(placement, {
            ownKeys(value) {
              once();
              return Reflect.ownKeys(value);
            },
          })
        : placement;
    const result = h.f.admission.begin(interaction, input);
    delete h.f.callbacks.metadata;
    delete h.f.callbacks.eligibility;
    const current = requireTableRendererTarget(h.target());
    const binding = claimReorderUI(
      h.f.D,
      h.f.admission,
      h.appLease,
      h.currentUI().cell,
    );
    const join = joinReorderModel(
      binding,
      current.model,
      required(h.currentUI().actor),
    );
    requireReorderModel(join, current.model);
    return {
      called,
      blocked: result.status === "blocked",
      pending: h.f.admission.getSnapshot().moves.pending === null,
      sameEpoch: h.f.metadata().ownerEpoch === 0,
      freshJoin: observeReorderUI(binding).joined,
    };
  } finally {
    h.dispose();
  }
}
export async function handoff(later: "release" | "source" | "query") {
  const h = await actual();
  try {
    const order: string[] = [],
      receiver = {
        submit(operation: ReturnType<Harness["begin"]>) {
          if (
            this !== receiver ||
            h.f.admission.getSnapshot().moves.pending?.operation !== operation
          )
            throw new Error("Exact receiver/operation handoff");
          order.push("submit");
        },
      };
    const notification = receiver.submit,
      revoke = cleanup(h, "release");
    let delivered = false,
      observerAfter = false;
    const stop = h.f.admission.subscribe(() => {
      if (observerAfter) return;
      observerAfter = delivered;
      order.push("observer");
      if (later === "release") revoke();
      if (later === "source") h.f.admission.advance("source");
      if (later === "query")
        h.f.C.dispatch({
          type: "sorting.change",
          update: [{ id: "amount", desc: true }],
        });
    });
    order.push("call");
    const operation = h.begin();
    order.push("return");
    // Captured before begin; no source/join/permission read after token transfer.
    Reflect.apply(notification, receiver, [operation]);
    delivered = true;
    await Promise.resolve();
    stop();
    return {
      order,
      observerAfter,
      tokenDelivered: delivered,
      pendingAfter:
        h.f.admission.getSnapshot().moves.pending?.operation === operation,
      laterProposal: h.f.pending !== null,
    };
  } finally {
    h.dispose();
  }
}
export async function inFlight(
  kind: Cleanup,
  failure: "version" | "throw" | "malformed" | "public-eligibility",
) {
  const h = await actual();
  try {
    h.begin();
    const revoke = cleanup(h, kind);
    let reads = 0;
    h.f.callbacks.metadata = () => {
      // Two readiness metadata reads occur before pure. Third is genuinely inside
      // pure.observe; its retiring catch is intentionally unchanged.
      if (++reads !== 3) return;
      revoke();
      if (failure === "version") h.f.newer();
      if (failure === "throw")
        throw new Error("Synthetic original port failure");
      if (failure === "public-eligibility")
        throw { code: "reorder.eligibility" };
      if (failure === "malformed")
        Reflect.apply(h.f.setMetadata, undefined, [
          {
            ownerEpoch: 0,
            sourceVersion: "bad",
            revision: 0,
            baseRevision: "0",
          },
        ]);
    };
    h.accepted();
    return {
      reached: reads >= 3,
      pendingPurged: h.f.admission.getSnapshot().moves.pending === null,
      sourceModelDropped: h.f.admission.getSnapshot().phase === "unready",
    };
  } finally {
    h.dispose();
  }
}
export async function waiting() {
  const h = await actual(true);
  try {
    const operation = h.begin();
    h.hide();
    h.refresh();
    const result = h.accepted();
    const held =
      h.f.admission.getSnapshot().moves.pending?.operation === operation;
    h.recordNotice({ kind: "accepted", revision: "transport" });
    const before = h.delivered();
    h.authoritative();
    h.acknowledge();
    return {
      result,
      held,
      before,
      after: h.delivered(),
      terminal: h.f.admission.getSnapshot().moves.pending === null,
    };
  } finally {
    h.dispose();
  }
}
export async function directAccept(aba: boolean) {
  const h = await actual();
  try {
    const old = h.origin(),
      revision = h.f.C.getSnapshot().revision;
    const proposal = h.f.C.dispatch({
      type: "pagination.change",
      update: { pageIndex: 0, pageSize: 25 },
    });
    if (proposal.status !== "proposed")
      throw new Error("Actual controlled proposal required");
    if (aba) {
      h.begin();
      h.rejected();
    } else cleanup(h, "suspend")();
    const refused = denies(() => h.f.C.accept(proposal.proposal));
    if (!aba) h.configB();
    const joined = h.join(),
      fresh = captureReorderNavigation(joined);
    requireReorderNavigation(fresh, joined, h.model());
    return {
      refused,
      sameRevision: h.f.C.getSnapshot().revision === revision,
      old: denies(() => requireReorderNavigation(old, joined, h.model())),
      fresh: true,
    };
  } finally {
    h.dispose();
  }
}
export async function noOp(kind: "index" | "size" | "clamp") {
  const h = await actual();
  try {
    const binding = required(h.currentUI().binding),
      origin = h.origin();
    const state = h.f.C.getSnapshot(),
      before = observeReorderUI(binding);
    const result =
      kind === "clamp"
        ? h.f.C.dispatch({
            type: "pagination.clamp",
            pageCount: 1,
            queryIdentity: state.queryIdentity,
          })
        : h.f.C.dispatch({
            type: "pagination.change",
            update: (previous) => ({
              ...previous,
              [kind === "size" ? "pageSize" : "pageIndex"]:
                kind === "size" ? 10 : 0,
            }),
          });
    let delivered = false;
    const stop = h.f.admission.subscribe(() => {
      delivered = true;
    });
    await Promise.resolve();
    stop();
    return {
      noop: result.status === "noop",
      sameC: h.f.C.getSnapshot() === state,
      version: before !== observeReorderUI(binding),
      delivered,
      old: denies(() => h.requireOrigin(origin)),
      fresh: !denies(() => h.requireOrigin(h.origin())),
    };
  } finally {
    h.dispose();
  }
}
export async function commandReentry(port: "clock" | "updater" | "state") {
  const h = await actual();
  try {
    const revoke = cleanup(h, "release"),
      state = h.f.C.getSnapshot();
    let called = false;
    const once = () => {
      if (!called) {
        called = true;
        revoke();
      }
    };
    if (port === "clock") h.f.callbacks.clock = once;
    if (port === "state") h.f.callbacks.state = once;
    const refused = denies(() =>
      h.f.C.dispatch({
        type: "pagination.change",
        update: (previous) => {
          if (port === "updater") once();
          return { ...previous, pageSize: 25 };
        },
      }),
    );
    return {
      called,
      refused,
      sameC: h.f.C.getSnapshot() === state,
      epoch: h.f.metadata().ownerEpoch,
    };
  } finally {
    h.dispose();
  }
}
export async function zeroPorts() {
  const h = await actual();
  try {
    const binding = required(h.currentUI().binding),
      joined = h.join();
    const row = h.f.admission.capture(h.appLease),
      before = observeReorderUI(binding),
      reads = h.f.counts.metadata;
    const a = captureReorderNavigation(joined),
      b = captureReorderNavigation(joined);
    observeReorderUI(binding);
    const delta = h.f.counts.metadata - reads;
    const stable = before === observeReorderUI(binding);
    const begun = h.f.admission.begin(row, {
      movedId: "one",
      beforeId: "three",
      afterId: "two",
    });
    requireReorderModel(joined, h.model());
    return {
      delta,
      stable,
      sameOrigin: a === b,
      started: begun.status === "started",
    };
  } finally {
    h.dispose();
  }
}
export async function independent() {
  const a = await actual(),
    b = await actual();
  try {
    const first = a.begin(),
      second = b.begin(),
      bJoin = b.join();
    cleanup(a, "release")();
    a.accepted();
    requireReorderModel(bJoin, b.model());
    const foreign = b.foreignModel();
    await Promise.resolve();
    const reads = b.f.counts.metadata;
    const refused = denies(() =>
      joinReorderModel(
        required(b.currentUI().binding),
        foreign.read(),
        required(b.currentUI().actor),
      ),
    );
    foreign.dispose();
    return {
      aExact: a.f.admission.getSnapshot().moves.pending?.operation === first,
      bExact: b.f.admission.getSnapshot().moves.pending?.operation === second,
      differentP: a.f.P !== b.f.P,
      refused,
      reads: b.f.counts.metadata - reads,
    };
  } finally {
    a.dispose();
    b.dispose();
  }
}
export async function replay() {
  const a = await actual(),
    b = await actual();
  try {
    const origin = a.origin();
    a.f.callbacks.metadata = cleanup(a, "release");
    let escaped: unknown;
    try {
      a.requireOrigin(origin);
    } catch (error) {
      escaped = error;
    }
    b.begin();
    let reads = 0;
    b.f.callbacks.metadata = () => {
      if (++reads === 3) throw escaped;
    };
    b.accepted();
    return {
      publicError: escaped instanceof Error,
      retired: b.f.admission.getSnapshot().moves.pending === null,
    };
  } finally {
    a.dispose();
    b.dispose();
  }
}
export async function complete() {
  const h = await actual(false, true);
  try {
    const operation = h.begin();
    h.accepted();
    h.authoritative();
    const superseded = h.f.admission.getSnapshot().moves.pending?.superseded;
    h.acknowledge();
    return {
      count: operation.move.pageIds.length,
      size: operation.origin.pageSize,
      extent: operation.origin.extent,
      superseded,
      code: h.f.admission.getSnapshot().moves.feedback?.code,
    };
  } finally {
    h.dispose();
  }
}
export async function modelContinuation(
  kind: "selection" | "columns" | "configuration" | "same",
) {
  const h = await actual();
  try {
    const operation = h.begin(),
      before = h.model(),
      metadata = h.f.metadata();
    if (kind === "selection") h.f.C.dispatch({ type: "selection.cancel" });
    if (kind === "columns") {
      const proposal = h.f.C.dispatch({
        type: "columns.order",
        update: (previous) => [...previous].reverse(),
      });
      if (proposal.status !== "proposed")
        throw new Error("Actual columns proposal");
      h.f.C.accept(proposal.proposal);
      h.f.clearPending();
    }
    if (kind === "configuration") h.configB();
    else h.render();
    await Promise.resolve();
    requireReorderModel(h.join(), h.model());
    h.f.admission.reconcile();
    return {
      exact: h.f.admission.getSnapshot().moves.pending?.operation === operation,
      sameEpoch: h.f.metadata().ownerEpoch === metadata.ownerEpoch,
      sameSourceOwner:
        h.model().sourceTarget?.owner === before.sourceTarget?.owner,
      genuineWrapperChanged: h.model() !== before,
      genuineFrameChanged: h.model().frame !== before.frame,
    };
  } finally {
    h.dispose();
  }
}
export async function realPurge() {
  const h = await actual();
  try {
    h.begin();
    const binding = required(h.currentUI().binding),
      oldModel = h.model();
    h.f.reset();
    return {
      purged: h.f.admission.getSnapshot().moves.pending === null,
      joinEnded: !observeReorderUI(binding).joined,
      staleModel: denies(() => requireDataTableModel(oldModel, h.f.D)),
    };
  } finally {
    h.dispose();
  }
}
