import {
  createRowMoveCoordinator,
  type ReorderStamp,
  type RowMoveAcknowledgement,
  type RowReorderFrame,
} from "../../../packages/react/src/reordering/index.js";
import type { ReorderApplicationMetadata } from "../../../packages/react/src/reordering-controller/index.js";

export function sourceCompatibility(old: ReorderStamp, input: RowReorderFrame) {
  const page: ReorderStamp = { ...old, extent: "page" };
  const complete: ReorderStamp = { ...old, pageIndex: 0, extent: "complete" };
  const ack: RowMoveAcknowledgement = {
    stamp: complete,
    disposition: "applied",
  };
  const coordinator = createRowMoveCoordinator({
    instanceId: "source-types",
    readCurrent: () => input,
  });
  const app: ReorderApplicationMetadata = {
    ownerEpoch: 1,
    sourceVersion: 2,
    revision: 3,
    baseRevision: "3",
  };
  return { page, complete, ack, coordinator, app };
}
