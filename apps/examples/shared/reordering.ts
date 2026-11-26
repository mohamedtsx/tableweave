import {
  requireDataTableModel,
  type DataTableModel,
  type NativeControllerOptions,
  type TableDefinition,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import {
  createReorderController,
  type ReorderAdmissionLease,
  type ReorderApplicationMetadata,
} from "@tableweave/react/reordering-controller";
import type {
  RowMoveOperation,
  RowMoveSettlement,
} from "@tableweave/react/reordering";

/** Application transport ownership. The actual renderer, not this module, begins. */
export function createExampleReordering<
  S extends QuerySchema,
  T extends object,
>(
  D: TableDefinition<S, T>,
  controller: NativeControllerOptions<S>,
  instanceId: string,
  context: { definitionKey: string; scopeKey: string },
  readRecords: () => readonly T[],
  publishRecords: (records: readonly T[]) => void,
  changed: () => void,
) {
  const metadata: ReorderApplicationMetadata = {
    ownerEpoch: 1,
    sourceVersion: 0,
    revision: 0,
    baseRevision: "0",
  };
  let current = metadata;
  const helper = createReorderController(D, {
    controller,
    instanceId,
    readCurrent() {
      return current;
    },
  });
  let lease: ReorderAdmissionLease<S, T> | null = helper.admission.mount();
  let operation: RowMoveOperation | null = null,
    awaitingSource: RowMoveOperation | null = null;
  let reported = false;
  let held: {
    operation: RowMoveOperation;
    outcome: RowMoveSettlement;
    ownerEpoch: number;
  } | null = null;
  let notice =
    "Synthetic transport. Use a real row move menu to submit an operation.";
  function sourceChanged() {
    const next = current.sourceVersion + 1;
    current = {
      ...current,
      sourceVersion: next,
      revision: next,
      baseRevision: String(next),
    };
  }
  function deliver(receipt: NonNullable<typeof held>) {
    const result = helper.admission.settle(receipt.operation, receipt.outcome);
    if (
      result.status === "ignored" &&
      (result.reason === "authority" || result.reason === "reentrant")
    ) {
      held = receipt;
      notice =
        "Exact synthetic transport notice held until a coherent model commit; no outcome was invented.";
      return;
    }
    held = null;
    notice =
      receipt.outcome.kind === "indeterminate"
        ? "Synthetic transport status unknown; awaiting application reconciliation."
        : receipt.outcome.kind === "accepted"
          ? "Synthetic transport accepted; awaiting authoritative source and acknowledgement."
          : "Synthetic transport rejected this intent; no input order was changed.";
    if (!helper.admission.getSnapshot().moves.pending) operation = null;
  }
  return {
    ...helper,
    get lease() {
      return lease;
    },
    get operation() {
      return operation;
    },
    get notice() {
      return notice;
    },
    get canSettle() {
      return operation !== null && !reported;
    },
    get canPublish() {
      return operation !== null && awaitingSource === null;
    },
    sourceChanged,
    connect() {
      if (lease) return;
      current = { ...current, ownerEpoch: current.ownerEpoch + 1 };
      lease = helper.admission.mount();
    },
    disconnect() {
      const ending = lease;
      lease = null;
      operation = null;
      awaitingSource = null;
      held = null;
      reported = false;
      notice =
        "Application source owner ended; no backend cancellation is implied.";
      if (ending) helper.admission.disconnect(ending);
    },
    onSubmit(value: RowMoveOperation) {
      // Called synchronously by the real production row-config notification.
      if (operation === value) return;
      operation = value;
      reported = false;
      held = null;
      notice = "Synthetic row intent received. Transport has not resolved.";
      changed();
    },
    settle(outcome: RowMoveSettlement) {
      if (!operation || reported) return;
      reported = true;
      deliver({ operation, outcome, ownerEpoch: current.ownerEpoch });
      changed();
    },
    publishApplied() {
      const value = operation;
      if (
        !value ||
        awaitingSource ||
        helper.admission.getSnapshot().moves.pending?.operation !== value
      )
        return;
      const records = readRecords(),
        moved = records.find(
          (record) => D.native.getRowId(record) === value.move.movedId,
        );
      if (!moved) return;
      const rest = records.filter(
        (record) => D.native.getRowId(record) !== value.move.movedId,
      );
      const index =
        value.move.beforeId === null
          ? rest.length
          : rest.findIndex(
              (record) => D.native.getRowId(record) === value.move.beforeId,
            );
      if (index < 0) return;
      const previous = rest[index - 1];
      if (
        (previous ? D.native.getRowId(previous) : null) !== value.move.afterId
      ) {
        notice =
          "Synthetic intent no longer matches the authoritative input gap; awaiting application resolution.";
        changed();
        return;
      }
      // Authoritative synthetic INPUT event. No native output/order backup/rollback.
      awaitingSource = value;
      publishRecords([...rest.slice(0, index), moved, ...rest.slice(index)]);
      notice =
        "Synthetic authoritative input published; waiting for its genuine model commit.";
      changed();
    },
    commit(model: DataTableModel<S, T>) {
      if (
        !lease ||
        model.phase !== "display" ||
        model.presentation?.busy ||
        model.presentation?.stale
      )
        return;
      requireDataTableModel(model, D);
      // Correlate the client producer event to the actual committed page, not a
      // guessed boolean/clock or a second accepted-order cache.
      const state = helper.controller.getSnapshot(),
        input = readRecords();
      if (state.query.sorting.length || model.presentation?.obsolete) return;
      const page = input.slice(
        state.query.pagination.pageIndex * state.query.pagination.pageSize,
        (state.query.pagination.pageIndex + 1) *
          state.query.pagination.pageSize,
      );
      if (
        !model.view ||
        model.view.rows.length !== page.length ||
        model.view.rows.some((row, index) => row.original !== page[index])
      )
        return;
      helper.admission.commitModel(lease, model);
      if (held) {
        if (
          held.ownerEpoch !== current.ownerEpoch ||
          held.operation !== operation ||
          helper.admission.getSnapshot().moves.pending?.operation !==
            held.operation
        ) {
          held = null;
          notice =
            "Held synthetic notice no longer belongs to this pending source; it was not replayed to a new owner.";
          changed();
        } else {
          const receipt = held;
          deliver(receipt);
          if (!held) changed();
        }
      }
      const received = awaitingSource;
      if (!received || received !== operation) return;
      const result = helper.admission.acknowledge(received, {
        stamp: {
          ...context,
          ownerEpoch: current.ownerEpoch,
          sourceVersion: current.sourceVersion,
          revision: current.revision,
          queryIdentity: state.queryIdentity,
          ...state.query.pagination,
        },
        disposition: "applied",
      });
      if (
        result.status === "changed" &&
        !helper.admission.getSnapshot().moves.pending
      ) {
        operation = null;
        awaitingSource = null;
        notice =
          "Synthetic application reconciliation completed; no real persistence was performed.";
        changed();
      }
    },
  };
}
