import type { QueryFor, QuerySchema } from "@tableweave/react/contracts";
import type { CapturedTarget } from "../columns/model.js";
import { notice, observe, requireTarget } from "../columns/model.js";
import type { ColumnControlOptions } from "../columns/types.js";

export type SortAction =
  | "ascending"
  | "descending"
  | "remove"
  | "add-ascending"
  | "add-descending";

export function changeSort<S extends QuerySchema, T extends object>(
  target: CapturedTarget<S, T>,
  options: ColumnControlOptions,
  id: string,
  action: SortAction,
): void {
  if (options.isDisabled) return;
  try {
    requireTarget(target, "sort");
    if (
      ![
        "ascending",
        "descending",
        "remove",
        "add-ascending",
        "add-descending",
      ].includes(action)
    )
      throw new Error("Invalid sorting action");
    const result = target.controller.dispatch({
      type: "sorting.change",
      update(previous) {
        requireTarget(target, "sort");
        const column = target.native.getColumn(id);
        const field = target.definition.controllerDefinition.schema.fields[id];
        const policy = target.controller
          .getDefinition()
          .columns.find((item) => item.id === id && !item.utility);
        if (
          !policy ||
          !column ||
          column.columns.length ||
          column.columnDef.meta?.utility ||
          field?.sort !== true ||
          !column.getCanSort()
        )
          throw new Error("Sorting unavailable");
        if (action === "remove")
          return previous.filter((item) => item.id !== id);
        // The public native/schema capability checks above narrow this runtime ID.
        const sortId = id as QueryFor<S>["sorting"][number]["id"];
        const desc = action === "descending" || action === "add-descending";
        if (!action.startsWith("add-")) return [{ id: sortId, desc }];
        if (
          !target.definition.multiSort ||
          target.definition.controllerDefinition.schema.sorting?.multi !==
            true ||
          !column.getCanMultiSort() ||
          previous.some(
            (item) => !target.native.getColumn(item.id)?.getCanMultiSort(),
          )
        )
          throw new Error("Multiple sorting unavailable");
        return previous.some((item) => item.id === id)
          ? previous.map((item) =>
              item.id === id ? { id: sortId, desc } : item,
            )
          : [...previous, { id: sortId, desc }];
      },
    });
    observe(options.onResult, notice(result));
  } catch {
    observe(options.onResult, "unavailable");
  }
}
