import {
  createRowMoveCoordinator,
  type ReorderStamp,
  type RowMoveAcknowledgement,
  type RowReorderFrame,
} from "../../../packages/react/src/reordering/index.js";

/** ES2022 only: the corrected pure entry still needs no DOM/React/native types. */
export function pureExtentTypes(old: ReorderStamp, pageIds: readonly string[]) {
  const complete: ReorderStamp = { ...old, extent: "complete", pageIndex: 0 };
  const current: RowReorderFrame = {
    stamp: complete,
    pageIds,
    baseRevision: null,
  };
  const ack: RowMoveAcknowledgement = {
    stamp: { ...complete, sourceVersion: complete.sourceVersion + 1 },
    disposition: "applied",
  };
  return {
    ack,
    coordinator: createRowMoveCoordinator({
      instanceId: "pure-source-types",
      readCurrent: () => current,
    }),
  };
}
