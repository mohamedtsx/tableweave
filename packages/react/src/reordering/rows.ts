import {
  acknowledgement,
  budget,
  data,
  errorCode,
  frame,
  gap,
  invalid,
  observePromise,
  placement,
  safely,
  sameIds,
  sameOrigin,
  sameStamp,
  settlement,
  text,
} from "./capture.js";
import type {
  ReorderStamp,
  RowMoveBeginResult,
  RowMoveBlockedReason,
  RowMoveCoordinator,
  RowMoveCoordinatorOptions,
  RowMoveEventResult,
  RowMoveFeedbackCode,
  RowMoveState,
  RowReorderFrame,
  RowReorderPort,
} from "./types.js";

const changed = Object.freeze({ status: "changed" } as const);
const ignored = (
  reason: Extract<RowMoveEventResult, { status: "ignored" }>["reason"],
): RowMoveEventResult => Object.freeze({ status: "ignored", reason });
const blocked = (reason: RowMoveBlockedReason): RowMoveBeginResult =>
  Object.freeze({ status: "blocked", reason });
const empty = (): RowMoveState =>
  Object.freeze({ pending: null, feedback: null });
const noIds: readonly string[] = Object.freeze([]);

export function createRowMoveCoordinator(
  options: RowMoveCoordinatorOptions,
): RowMoveCoordinator {
  const { instanceId, readCurrent } = safely(() => {
    const fields = data(options, ["instanceId", "readCurrent"]);
    if (typeof fields.readCurrent !== "function") invalid();
    return {
      instanceId: text(fields.instanceId, budget()),
      readCurrent: fields.readCurrent as RowReorderPort["readCurrent"],
    };
  }, "reorder.invalid");
  let state = empty();
  let sequence = 0;
  let settled = false;
  let disposed = false;
  let busy = false;
  let fence = 0;
  // Scalar authority high-water metadata only; no accepted records/order mirror.
  let latest: ReorderStamp | null = null;
  let latestWire: string | null = null;
  let invalidThrough: number | null = null;
  const listeners = new Set<{ notify: () => void }>();
  let notifying = false;
  let notifyAgain = false;
  const publish = () => {
    if (notifying) {
      notifyAgain = true;
      return;
    }
    notifying = true;
    try {
      do {
        notifyAgain = false;
        for (const entry of [...listeners]) {
          if (!listeners.has(entry)) continue;
          try {
            const notify = entry.notify;
            observePromise(notify());
          } catch (error) {
            observePromise(error);
            // A broken observer cannot corrupt the token or stop later readers.
          }
        }
      } while (notifyAgain);
    } finally {
      notifying = false;
    }
  };
  const detach = () => {
    if (fence === Number.MAX_SAFE_INTEGER) disposed = true;
    else fence++;
    if (latest)
      invalidThrough = Math.max(invalidThrough ?? -1, latest.ownerEpoch);
    const dirty = state.pending !== null || state.feedback !== null;
    if (dirty) state = empty();
    settled = false;
    if (dirty) publish();
    if (disposed) listeners.clear();
    return dirty;
  };
  const read = (ids: readonly string[]): RowReorderFrame => {
    const before = fence;
    let input: unknown;
    try {
      input = readCurrent(ids);
    } catch (error) {
      observePromise(error);
      throw error;
    }
    let current: RowReorderFrame;
    try {
      current = frame(input);
    } catch (error) {
      observePromise(input);
      observePromise(error);
      throw error;
    }
    if (before !== fence || disposed) {
      invalidThrough = Math.max(invalidThrough ?? -1, current.stamp.ownerEpoch);
      invalid();
    }
    const next = current.stamp;
    if (
      (invalidThrough !== null && next.ownerEpoch <= invalidThrough) ||
      (latest &&
        (next.ownerEpoch < latest.ownerEpoch ||
          (next.ownerEpoch === latest.ownerEpoch &&
            (!sameOrigin(next, latest) ||
              next.sourceVersion < latest.sourceVersion ||
              (next.sourceVersion === latest.sourceVersion &&
                (!Object.is(next.revision, latest.revision) ||
                  current.baseRevision !== latestWire))))))
    )
      invalid();
    if (
      state.pending &&
      sameStamp(next, state.pending.operation.origin) &&
      !sameIds(current.pageIds, state.pending.operation.move.pageIds)
    )
      invalid();
    latest = next;
    latestWire = current.baseRevision;
    return current;
  };
  const observe = (): RowReorderFrame | null => {
    try {
      const previousOrigin = latest;
      const current = read(noIds);
      const pending = state.pending;
      if (previousOrigin && !sameOrigin(previousOrigin, current.stamp)) {
        const dirty = state.pending !== null || state.feedback !== null;
        if (dirty) state = empty();
        settled = false;
        if (dirty) publish();
      } else if (
        pending &&
        !pending.superseded &&
        current.stamp.sourceVersion > pending.operation.origin.sourceVersion
      ) {
        state = Object.freeze({
          ...state,
          pending: Object.freeze({ ...pending, superseded: true }),
        });
        publish();
      }
      return current;
    } catch {
      detach();
      return null;
    }
  };
  const finish = (code: RowMoveFeedbackCode) => {
    const pending = state.pending;
    if (!pending) return;
    state = Object.freeze({
      pending: null,
      feedback: Object.freeze({
        operationId: pending.operation.move.operationId,
        code,
      }),
    });
    settled = false;
    publish();
  };
  const guard = (): RowMoveEventResult | null =>
    disposed
      ? ignored("disposed")
      : busy || notifying
        ? ignored("reentrant")
        : null;
  const coordinator: RowMoveCoordinator = {
    getSnapshot: () => state,
    subscribe(listener) {
      if (typeof listener !== "function")
        return safely(invalid, "reorder.invalid");
      if (disposed) return () => {};
      const entry = { notify: listener };
      listeners.add(entry);
      return () => {
        listeners.delete(entry);
      };
    },
    begin(originInput, placementInput) {
      if (disposed || busy || notifying) return blocked("unavailable");
      if (state.pending) return blocked("pending");
      busy = true;
      const before = fence;
      try {
        let origin: RowReorderFrame;
        let move: ReturnType<typeof placement>;
        try {
          const charge = budget();
          origin = frame(originInput, charge);
          move = placement(placementInput, charge);
        } catch (error) {
          observePromise(error);
          return blocked("invalid");
        }
        if (before !== fence || disposed) return blocked("unavailable");
        const ids = Object.freeze([
          ...new Set([
            move.movedId,
            ...(move.beforeId === null ? [] : [move.beforeId]),
            ...(move.afterId === null ? [] : [move.afterId]),
          ]),
        ]);
        let current: RowReorderFrame;
        try {
          current = read(ids);
        } catch (error) {
          if (before !== fence || disposed) return blocked("unavailable");
          return blocked(
            errorCode(error) === "reorder.eligibility"
              ? "eligibility"
              : errorCode(error) === "reorder.invalid"
                ? "origin"
                : "unavailable",
          );
        }
        if (
          !sameStamp(origin.stamp, current.stamp) ||
          origin.baseRevision !== current.baseRevision ||
          !sameIds(origin.pageIds, current.pageIds)
        )
          return blocked("origin");
        const index = gap(current.pageIds, move);
        if (typeof index !== "number") return blocked(index);
        if (index === current.pageIds.indexOf(move.movedId))
          return Object.freeze({ status: "noop" });
        if (sequence === Number.MAX_SAFE_INTEGER) return blocked("unavailable");
        const generation = ++sequence;
        const operation = Object.freeze({
          generation,
          origin: current.stamp,
          move: Object.freeze({
            ...move,
            operationId: `${instanceId}:${generation}`,
            scopeKey: current.stamp.scopeKey,
            pageIds: current.pageIds,
            baseRevision: current.baseRevision,
          }),
        }) as NonNullable<RowMoveState["pending"]>["operation"];
        settled = false;
        state = Object.freeze({
          pending: Object.freeze({
            operation,
            phase: "submitted",
            superseded: false,
          }),
          feedback: null,
        });
        publish();
        // An observer may synchronously revoke/dispose before app submission.
        return state.pending?.operation === operation && !disposed
          ? Object.freeze({ status: "started", operation })
          : blocked("unavailable");
      } finally {
        busy = false;
      }
    },
    settle(operation, input) {
      const unavailable = guard();
      if (unavailable) return unavailable;
      if (!state.pending || state.pending.operation !== operation || settled)
        return ignored("operation");
      busy = true;
      try {
        let outcome: ReturnType<typeof settlement>;
        try {
          outcome = settlement(input);
        } catch (error) {
          observePromise(error);
          return ignored("invalid");
        }
        if (disposed || state.pending?.operation !== operation)
          return ignored("operation");
        const prior = state;
        const current = observe();
        const pending = state.pending;
        if (!current || !pending || pending.operation !== operation)
          return state !== prior ? changed : ignored("authority");
        settled = true;
        if (outcome.kind === "rejected") finish(outcome.code);
        else {
          state = Object.freeze({
            pending: Object.freeze({ ...pending, phase: "awaiting-authority" }),
            feedback:
              outcome.kind === "indeterminate"
                ? Object.freeze({
                    operationId: operation.move.operationId,
                    code: "unavailable",
                  })
                : null,
          });
          publish();
        }
        return changed;
      } finally {
        busy = false;
      }
    },
    acknowledge(operation, input) {
      const unavailable = guard();
      if (unavailable) return unavailable;
      if (!state.pending || state.pending.operation !== operation)
        return ignored("operation");
      busy = true;
      try {
        let ack: ReturnType<typeof acknowledgement>;
        try {
          ack = acknowledgement(input);
        } catch (error) {
          observePromise(error);
          return ignored("invalid");
        }
        if (disposed || state.pending?.operation !== operation)
          return ignored("operation");
        const prior = state;
        const current = observe();
        if (!current || state.pending?.operation !== operation)
          return state !== prior ? changed : ignored("authority");
        if (
          !sameStamp(ack.stamp, current.stamp) ||
          ack.stamp.sourceVersion <= operation.origin.sourceVersion
        )
          return state !== prior ? changed : ignored("authority");
        finish(
          ack.disposition === "not-applied" ? "rejected" : ack.disposition,
        );
        return changed;
      } finally {
        busy = false;
      }
    },
    reconcile() {
      const unavailable = guard();
      if (unavailable) return unavailable;
      busy = true;
      try {
        const previous = state;
        observe();
        return state !== previous ? changed : ignored("unchanged");
      } finally {
        busy = false;
      }
    },
    invalidate(reason) {
      if (reason !== "context" && reason !== "access" && reason !== "unmount")
        return safely(invalid, "reorder.invalid");
      if (!disposed) detach();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      detach();
      listeners.clear();
    },
  };
  return Object.freeze(coordinator);
}
