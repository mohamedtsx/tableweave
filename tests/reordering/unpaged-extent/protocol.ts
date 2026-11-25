import {
  createRowMoveCoordinator,
  type ReorderStamp,
  type RowMoveBeginResult,
  type RowMoveOperation,
  type RowReorderFrame,
} from "../../../packages/react/src/reordering/index.js";

/** Legitimate synthetic APPLICATION metadata port, not a criteria/model grant. */
export function applicationFrame(
  changes: Partial<ReorderStamp> = {},
  count = 3,
): RowReorderFrame {
  return {
    stamp: {
      ownerEpoch: 0,
      sourceVersion: 0,
      definitionKey: "synthetic-definition",
      scopeKey: "synthetic-scope",
      queryIdentity: "synthetic-query",
      pageIndex: 0,
      pageSize: 10,
      revision: 0,
      ...changes,
    },
    pageIds: Array.from({ length: count }, (_, index) => `row-${index}`),
    baseRevision: "0",
  };
}
export const placement = {
  movedId: "row-0",
  beforeId: "row-2",
  afterId: "row-1",
} as const;
export function requireStarted(result: RowMoveBeginResult): RowMoveOperation {
  if (result.status !== "started")
    throw new Error("Actual started operation required");
  return result.operation;
}
export function protocol(
  initial = applicationFrame({ extent: "complete" }, 11),
) {
  let current = initial;
  const reads: (readonly string[])[] = [];
  const coordinator = createRowMoveCoordinator({
    instanceId: "synthetic-extent",
    readCurrent(ids) {
      reads.push(ids);
      return current;
    },
  });
  return {
    coordinator,
    reads,
    current: () => current,
    publish(next: RowReorderFrame) {
      current = next;
    },
    begin() {
      return coordinator.begin(current, placement);
    },
    newer(changes: Partial<ReorderStamp> = {}) {
      current = {
        ...current,
        stamp: {
          ...current.stamp,
          sourceVersion: current.stamp.sourceVersion + 1,
          ...changes,
        },
      };
      return current;
    },
  };
}
