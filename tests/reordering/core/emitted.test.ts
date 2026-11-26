import { expect, it } from "vitest";
import {
  createRowMoveCoordinator,
  moveVisibleColumn,
} from "./.artifacts/declarations/index.js";
import { frame, move } from "./fixtures.js";

it("executes actual scoped emitted JavaScript and own declarations, not a fake barrel", () => {
  const current = frame();
  const coordinator = createRowMoveCoordinator({
    instanceId: "emitted",
    readCurrent: () => current,
  });
  expect(coordinator.begin(current, move).status).toBe("started");
  expect(
    moveVisibleColumn(
      [{ id: "a" }, { id: "b" }],
      { order: ["a", "b"], visibility: {} },
      { movedId: "a", beforeId: null, afterId: "b" },
    ),
  ).toEqual(["b", "a"]);
});
