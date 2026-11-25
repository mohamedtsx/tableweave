import {
  createRowMoveCoordinator,
  moveVisibleColumn,
  type RowMoveOperation,
  type RowReorderFrame,
} from "./.artifacts/declarations/index.js";

declare const frame: RowReorderFrame;
const coordinator = createRowMoveCoordinator({
  instanceId: "types",
  readCurrent: () => frame,
});
const result = coordinator.begin(frame, {
  movedId: "a",
  beforeId: null,
  afterId: "b",
});
if (result.status === "started") {
  const token: RowMoveOperation = result.operation;
  coordinator.settle(token, { kind: "accepted", revision: "r2" });
  coordinator.acknowledge(token, {
    stamp: frame.stamp,
    disposition: "applied",
  });
  // @ts-expect-error operation metadata is immutable
  token.origin.sourceVersion = 2;
  // @ts-expect-error the token brand cannot be constructed as a plain object
  const forged: RowMoveOperation = {
    generation: 1,
    origin: frame.stamp,
    move: token.move,
  };
  void forged;
  // @ts-expect-error arbitrary backend messages are not public settlement codes
  coordinator.settle(token, { kind: "rejected", code: "private payload" });
  // @ts-expect-error this protocol does not accept raw application errors
  coordinator.settle(token, new Error("unavailable"));
}
// @ts-expect-error numeric revisions require explicit string wire baseRevision
const wrong: RowReorderFrame = { ...frame, baseRevision: 1 };
void wrong;
createRowMoveCoordinator({
  instanceId: "x",
  readCurrent: () => frame,
  // @ts-expect-error no fetching/persistence callbacks are inferred
  persist: () => {},
});
// @ts-expect-error the atomic port returns metadata, not promises
createRowMoveCoordinator({ instanceId: "x", readCurrent: async () => frame });
const columns = moveVisibleColumn(
  [{ id: "a" }, { id: "b" }],
  { order: ["a", "b"], visibility: {} },
  { movedId: "a", beforeId: null, afterId: "b" },
);
// @ts-expect-error result is a readonly proposal, not a mutable accepted order
columns.push("c");
