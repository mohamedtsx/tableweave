import type {
  ReorderStamp,
  RowMoveOperation,
  RowMovePlacement,
  RowReorderFrame,
} from "../../../packages/react/src/reordering/index.js";
import { createRowMoveCoordinator } from "../../../packages/react/src/reordering/index.js";

export function frame(
  extra: Partial<ReorderStamp> = {},
  pageIds = ["a", "b", "c"],
): RowReorderFrame {
  return {
    stamp: {
      ownerEpoch: 1,
      sourceVersion: 1,
      definitionKey: "definition-a",
      scopeKey: "scope-a",
      queryIdentity: "query-a",
      pageIndex: 0,
      pageSize: 10,
      revision: "r1",
      ...extra,
    },
    pageIds,
    baseRevision: "wire-r1",
  };
}
export const move: RowMovePlacement = {
  movedId: "a",
  beforeId: "c",
  afterId: "b",
};
export function fixture() {
  let current = frame();
  let read: (ids: readonly string[]) => RowReorderFrame = () => current;
  const calls: (readonly string[])[] = [];
  const coordinator = createRowMoveCoordinator({
    instanceId: "synthetic-table",
    readCurrent(ids) {
      calls.push(ids);
      return read(ids);
    },
  });
  return {
    coordinator,
    calls,
    get current() {
      return current;
    },
    set current(value: RowReorderFrame) {
      current = value;
    },
    port(fn: typeof read) {
      read = fn;
    },
    start(): RowMoveOperation {
      const result = coordinator.begin(current, move);
      if (result.status !== "started")
        throw new Error("Missing synthetic operation.");
      return result.operation;
    },
    advance(extra: Partial<ReorderStamp> = {}, pageIds = ["b", "a", "c"]) {
      current = {
        ...current,
        stamp: {
          ...current.stamp,
          sourceVersion: current.stamp.sourceVersion + 1,
          ...extra,
        },
        pageIds,
      };
      return current;
    },
  };
}
