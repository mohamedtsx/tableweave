import type {
  RowMoveAcknowledgement,
  RowMoveOperation,
  RowMoveSettlement,
  RowReorderPort,
} from "@tableweave/react/reordering";
// @ts-expect-error NEGATIVE native renderer is not a pure reorder export
import { useDataTable } from "@tableweave/react/reordering";

declare const operation: RowMoveOperation;
// @ts-expect-error NEGATIVE issued operation is readonly
operation.generation = 2;
// @ts-expect-error NEGATIVE backend acceptance is not a terminal acknowledgement
export const ack: RowMoveAcknowledgement = { disposition: "accepted" };
// @ts-expect-error NEGATIVE uncertain cancellation is not success/undo
export const undo: RowMoveSettlement = { kind: "cancelled", reverted: true };
declare const current: RowReorderPort;
export const asynchronous: RowReorderPort = {
  // @ts-expect-error NEGATIVE application committed read must be synchronous
  readCurrent: async (ids) => current.readCurrent(ids),
};
void useDataTable;
