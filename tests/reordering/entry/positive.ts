import {
  createRowMoveCoordinator,
  moveVisibleColumn,
  ReorderError,
  reorderLimits,
  type ReorderColumnPolicy,
  type ReorderColumnState,
  type RowMoveBeginResult,
  type RowMoveCoordinator,
  type RowMovePlacement,
  type RowMoveSettlement,
  type RowReorderFrame,
  type RowReorderPort,
} from "@tableweave/react/reordering";

/** Pure source-alias type feasibility; no committed application port is run. */
export function create(
  readCurrent: RowReorderPort["readCurrent"],
): RowMoveCoordinator {
  return createRowMoveCoordinator({
    instanceId: "synthetic-type-consumer",
    readCurrent,
  });
}
export function begin(
  coordinator: RowMoveCoordinator,
  frame: RowReorderFrame,
  placement: RowMovePlacement,
): RowMoveBeginResult {
  return coordinator.begin(frame, placement);
}
export const columns: (
  policies: readonly ReorderColumnPolicy[],
  state: ReorderColumnState,
  placement: RowMovePlacement,
) => readonly string[] = moveVisibleColumn;
export const accepted: RowMoveSettlement = { kind: "accepted" };
export const uncertain: RowMoveSettlement = {
  kind: "indeterminate",
  code: "cancel-requested",
};
export const limits = reorderLimits;
export const safeError = ReorderError;
