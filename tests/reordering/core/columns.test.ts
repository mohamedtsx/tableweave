import { describe, expect, it } from "vitest";
import { defineQuerySchema } from "../../../packages/react/src/contracts/schema.js";
import {
  columnState,
  defineController,
} from "../../../packages/react/src/controller/validation.js";
import {
  moveVisibleColumn,
  type ReorderColumnPolicy,
  type ReorderColumnState,
  ReorderError,
  type RowMovePlacement,
} from "../../../packages/react/src/reordering/index.js";

const policies: readonly ReorderColumnPolicy[] = [
  { id: "a", reorderGroup: "g" },
  { id: "h", reorderGroup: "g" },
  { id: "b", reorderGroup: "g" },
  { id: "select", utility: true },
  { id: "c", reorderGroup: "other" },
  { id: "d", reorderGroup: "other" },
  { id: "e", reorderGroup: "g" },
];
const initial: ReorderColumnState = {
  order: policies.map((p) => p.id),
  visibility: { h: false },
};
const move: RowMovePlacement = { movedId: "a", beforeId: null, afterId: "b" };
const schema = defineQuerySchema({
  id: "column-parity",
  version: 1,
  fields: { label: { type: "text", owner: "none" } },
});
const definition = defineController({ schema, columns: policies });

function permutations(ids: readonly string[]): string[][] {
  if (!ids.length) return [[]];
  return ids.flatMap((id, index) =>
    permutations(ids.filter((_, i) => i !== index)).map((rest) => [
      id,
      ...rest,
    ]),
  );
}

describe("original contiguous partitions and hidden slots", () => {
  it("merges reordered visible leaves into original visible slots", () => {
    const result = moveVisibleColumn(policies, initial, move);
    expect(result).toEqual(["b", "h", "a", "select", "c", "d", "e"]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(initial.order).toEqual(policies.map((p) => p.id));
    expect(initial.visibility).toEqual({ h: false });
    expect(
      columnState(
        definition,
        { order: result, visibility: initial.visibility },
        initial,
      ).order,
    ).toEqual(result);
  });
  it("returns an own frozen complete permutation for a no-op", () => {
    const result = moveVisibleColumn(policies, initial, {
      movedId: "a",
      beforeId: "b",
      afterId: null,
    });
    expect(result).toEqual(initial.order);
    expect(result).not.toBe(initial.order);
  });
  for (const placement of [
    { movedId: "select", beforeId: "c", afterId: null },
    { movedId: "a", beforeId: "c", afterId: "select" },
    { movedId: "a", beforeId: "e", afterId: null },
    { movedId: "e", beforeId: "a", afterId: null },
    { movedId: "a", beforeId: "h", afterId: null },
    { movedId: "h", beforeId: "b", afterId: "a" },
    { movedId: "a", beforeId: "a", afterId: null },
    { movedId: "a", beforeId: null, afterId: null },
    { movedId: "group", beforeId: "b", afterId: null },
    { movedId: "a", beforeId: "unknown", afterId: null },
  ])
    it(`rejects utility/hidden/group/cross-partition placement ${JSON.stringify(placement)}`, () => {
      expect(() =>
        moveVisibleColumn(policies, initial, placement),
      ).toThrowError(ReorderError);
      try {
        moveVisibleColumn(policies, initial, placement);
      } catch (error) {
        expect((error as ReorderError).code).toBe("reorder.columns");
      }
    });
  it("separates repeated root groups on both sides of each utility", () => {
    const original = [
      { id: "a" },
      { id: "b" },
      { id: "u", utility: true },
      { id: "c" },
      { id: "d" },
    ];
    const state = { order: original.map((p) => p.id), visibility: {} };
    expect(() =>
      moveVisibleColumn(original, state, {
        movedId: "a",
        beforeId: "c",
        afterId: null,
      }),
    ).toThrowError(ReorderError);
    expect(
      moveVisibleColumn(original, state, {
        movedId: "c",
        beforeId: null,
        afterId: "d",
      }),
    ).toEqual(["a", "b", "u", "d", "c"]);
  });
  it("preserves required row-header identity/visibility; no carrier or group inference", () => {
    const original = [{ id: "label", hideable: false }, { id: "amount" }];
    const state = { order: ["label", "amount"], visibility: {} };
    expect(
      moveVisibleColumn(original, state, {
        movedId: "label",
        beforeId: null,
        afterId: "amount",
      }),
    ).toEqual(["amount", "label"]);
    expect(state.visibility).toEqual({});
    expect(() =>
      moveVisibleColumn(
        original,
        { ...state, visibility: { label: false } },
        { movedId: "amount", beforeId: null, afterId: "label" },
      ),
    ).toThrowError(ReorderError);
  });
  it("agrees with actual accepted controller validation for all 5040 full permutations", () => {
    let validStates = 0;
    let moves = 0;
    for (const order of permutations(initial.order)) {
      let valid = true;
      try {
        columnState(definition, { order, visibility: initial.visibility });
      } catch {
        valid = false;
      }
      const state = { order, visibility: initial.visibility };
      if (!valid) {
        expect(() => moveVisibleColumn(policies, state, move)).toThrowError(
          ReorderError,
        );
        continue;
      }
      validStates++;
      for (const partition of [["a", "b"], ["c", "d"], ["e"]])
        for (const movedId of partition) {
          const visible = order.filter(
            (id) => partition.includes(id) && id !== movedId,
          );
          for (let slot = 0; slot <= visible.length; slot++) {
            const proposal = moveVisibleColumn(policies, state, {
              movedId,
              beforeId: visible[slot] ?? null,
              afterId: visible[slot - 1] ?? null,
            });
            expect(
              columnState(
                definition,
                { order: proposal, visibility: initial.visibility },
                state,
              ).order,
            ).toEqual(proposal);
            expect(proposal[order.indexOf("h")]).toBe("h");
            expect(proposal[3]).toBe("select");
            expect(new Set(proposal).size).toBe(initial.order.length);
            moves++;
          }
        }
    }
    expect(validStates).toBe(12);
    expect(moves).toBe(108);
  });
});

describe("strict column metadata rejection", () => {
  for (const order of [
    ["a", "h", "b", "select", "c", "d"],
    ["a", "h", "b", "select", "c", "d", "d"],
    ["a", "h", "b", "select", "c", "d", "unknown"],
    ["select", "h", "b", "a", "c", "d", "e"],
    ["a", "h", "c", "select", "b", "d", "e"],
  ])
    it(`rejects non-permutation/partition ${JSON.stringify(order)}`, () => {
      expect(() =>
        moveVisibleColumn(policies, { ...initial, order }, move),
      ).toThrowError(ReorderError);
    });
  for (const visibility of [
    { select: false },
    { unknown: false },
    { h: "false" },
    { a: false, h: false, b: false, c: false, d: false, e: false },
  ])
    it(`rejects bad visibility ${JSON.stringify(visibility)}`, () => {
      expect(() =>
        moveVisibleColumn(
          policies,
          { ...initial, visibility } as ReorderColumnState,
          move,
        ),
      ).toThrowError(ReorderError);
    });
  for (const extra of [
    { utility: true, hideable: true },
    { utility: "yes" },
    { hideable: undefined },
    { reorderGroup: undefined },
    { reorderGroup: "bad group" },
    { id: "_private" },
    { extra: true },
  ])
    it(`rejects malformed policy ${JSON.stringify(extra)}`, () => {
      expect(() =>
        moveVisibleColumn(
          [
            { id: "a", ...extra },
            { id: "b" },
          ] as unknown as ReorderColumnPolicy[],
          { order: ["a", "b"], visibility: {} },
          { movedId: "a", beforeId: null, afterId: "b" },
        ),
      ).toThrowError(ReorderError);
    });
  it("rejects duplicate policies and extended/accessor policy/order arrays without invoking getters", () => {
    let gets = 0;
    const evil = Object.defineProperty({ id: "a" }, "utility", {
      enumerable: true,
      get() {
        gets++;
        throw new Error("private");
      },
    });
    for (const original of [
      [evil, { id: "b" }],
      [{ id: "a" }, { id: "a" }],
      Object.assign([{ id: "a" }, { id: "b" }], { extra: true }),
    ])
      expect(() =>
        moveVisibleColumn(
          original,
          { order: ["a", "b"], visibility: {} },
          { movedId: "a", beforeId: null, afterId: "b" },
        ),
      ).toThrowError(ReorderError);
    const order = Object.defineProperty(["a", "b"], "0", {
      enumerable: true,
      get() {
        gets++;
        return "a";
      },
    });
    expect(() =>
      moveVisibleColumn(
        [{ id: "a" }, { id: "b" }],
        { order, visibility: {} },
        { movedId: "a", beforeId: null, afterId: "b" },
      ),
    ).toThrowError(ReorderError);
    expect(gets).toBe(0);
  });
});
