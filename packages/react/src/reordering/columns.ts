import {
  array,
  budget,
  data,
  gap,
  ids,
  invalid,
  placement,
  safely,
  text,
} from "./capture.js";
import type {
  ReorderColumnPolicy,
  ReorderColumnState,
  RowMovePlacement,
} from "./types.js";

/** Pure complete-order proposal. Never dispatches or mutates accepted columns. */
export function moveVisibleColumn(
  policies: readonly ReorderColumnPolicy[],
  state: ReorderColumnState,
  input: RowMovePlacement,
): readonly string[] {
  return safely(() => {
    const charge = budget();
    const captured = array(policies).map((value) => {
      const item = data(
        value,
        ["id", "hideable", "utility", "reorderGroup"],
        ["id"],
      );
      const id = text(item.id, charge);
      const group = item.reorderGroup;
      if (
        !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(id) ||
        (Object.hasOwn(item, "hideable") &&
          typeof item.hideable !== "boolean") ||
        (Object.hasOwn(item, "utility") && typeof item.utility !== "boolean") ||
        (item.utility === true && item.hideable === true) ||
        (Object.hasOwn(item, "reorderGroup") &&
          (typeof group !== "string" ||
            !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(group)))
      )
        invalid();
      return {
        id,
        hideable: item.hideable !== false,
        utility: item.utility === true,
        group: group === undefined ? "" : text(group, charge),
      };
    });
    if (new Set(captured.map((item) => item.id)).size !== captured.length)
      invalid();
    const byId = new Map(captured.map((item) => [item.id, item]));
    const fields = data(state, ["order", "visibility"]);
    const order = ids(fields.order, charge);
    if (order.length !== captured.length || order.some((id) => !byId.has(id)))
      invalid();
    const rawVisibility = data(fields.visibility, null);
    const hidden = new Set<string>();
    for (const [id, visible] of Object.entries(rawVisibility)) {
      text(id, charge);
      const policy = byId.get(id);
      if (
        !policy ||
        typeof visible !== "boolean" ||
        (!visible && (policy.utility || !policy.hideable))
      )
        invalid();
      if (!visible) hidden.add(id);
    }
    const dataColumns = captured.filter((item) => !item.utility);
    if (dataColumns.length && dataColumns.every((item) => hidden.has(item.id)))
      invalid();

    // The original controller's contiguous group runs, split on BOTH utility sides.
    const partitions = new Map<string, number>();
    let partition = 0;
    let previousGroup: string | undefined;
    for (const item of captured) {
      if (item.utility || previousGroup !== item.group) partition++;
      partitions.set(item.id, partition);
      if (item.utility) {
        partition++;
        previousGroup = undefined;
      } else previousGroup = item.group;
    }
    const valid = (candidate: readonly string[]) =>
      candidate.every((id, index) => {
        const original = captured[index];
        return (
          original !== undefined &&
          (!original.utility || id === original.id) &&
          partitions.get(id) === partitions.get(original.id)
        );
      });
    if (!valid(order)) invalid();
    const move = placement(input, charge);
    const members = [move.movedId, move.beforeId, move.afterId].filter(
      (id): id is string => id !== null,
    );
    if (
      members.some(
        (id) =>
          !byId.has(id) ||
          byId.get(id)?.utility ||
          hidden.has(id) ||
          partitions.get(id) !== partitions.get(move.movedId),
      )
    )
      invalid();
    const slots = order.flatMap((id, index) =>
      !hidden.has(id) &&
      !byId.get(id)?.utility &&
      partitions.get(id) === partitions.get(move.movedId)
        ? [index]
        : [],
    );
    const visible = slots.map((index) => order[index] as string);
    const index = gap(visible, move);
    if (typeof index !== "number") invalid();
    const reordered = visible.filter((id) => id !== move.movedId);
    reordered.splice(index, 0, move.movedId);
    const result = [...order];
    slots.forEach((slot, index) => {
      result[slot] = reordered[index] as string;
    });
    if (
      !valid(result) ||
      new Set(result).size !== order.length ||
      order.some((id, index) => hidden.has(id) && result[index] !== id)
    )
      invalid();
    return Object.freeze(result);
  }, "reorder.columns");
}
