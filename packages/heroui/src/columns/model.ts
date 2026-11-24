import type { MutationResult, TableState } from "@tableweave/react";
import { getControlsAuthorityOwner } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import type {
  ColumnControlOptions,
  ColumnControlsTarget,
  ControlMutationNotice,
} from "./types.js";

export interface DataLeaf {
  readonly id: string;
  readonly label: string;
  readonly hideable: boolean;
  readonly sortable: boolean;
  readonly multiSortable: boolean;
}

/** Capture before validating; descriptors/callbacks are never validated then reread. */
export function captureOptions(
  input: ColumnControlOptions,
): ColumnControlOptions {
  const options = { ...input };
  const labels = options.labels
    ? Object.freeze({ ...options.labels })
    : undefined;
  if (
    (options.isDisabled !== undefined &&
      typeof options.isDisabled !== "boolean") ||
    (options.disabledReason !== undefined &&
      (typeof options.disabledReason !== "string" ||
        !options.disabledReason.trim())) ||
    (options.onResult !== undefined &&
      typeof options.onResult !== "function") ||
    (labels &&
      Object.values(labels).some(
        (label) => typeof label !== "string" || !label.trim(),
      ))
  )
    throw new TypeError("Invalid column control options");
  return Object.freeze({ ...options, ...(labels ? { labels } : {}) });
}

export function captureTarget<S extends QuerySchema, T extends object>(
  input: ColumnControlsTarget<S, T>,
) {
  const { definition, view, authority, presentation } = input;
  const { controller, native, state } = view;
  return Object.freeze({
    definition,
    controller,
    native,
    state,
    authority,
    presentation,
  });
}
export type CapturedTarget<
  S extends QuerySchema,
  T extends object,
> = ReturnType<typeof captureTarget<S, T>>;

/** Identity is not permission. Always followed by a fresh require at event time. */
export function requireTarget<S extends QuerySchema, T extends object>(
  target: CapturedTarget<S, T>,
  type: "sort" | "columns",
): void {
  const owner = getControlsAuthorityOwner(target.authority);
  if (
    !owner ||
    owner.definition !== target.definition ||
    owner.controller !== target.controller
  )
    throw new Error("Column controls unavailable");
  target.authority.require({ type });
}

export function isAvailable<S extends QuerySchema, T extends object>(
  target: CapturedTarget<S, T>,
): boolean {
  const owner = getControlsAuthorityOwner(target.authority);
  // Render facts are NOT owner proof or event authorization. In particular, a
  // query value/reference is never compared to establish controller ownership.
  return (
    owner !== null &&
    owner.definition === target.definition &&
    owner.controller === target.controller &&
    target.presentation.requestedQuery !== null &&
    !["definition", "context", "source"].includes(
      target.presentation.blockedReason ?? "",
    )
  );
}

/** Enumerate ONLY public policies. No all-flat/private column-ID enumeration. */
export function dataLeaves<S extends QuerySchema, T extends object>(
  target: CapturedTarget<S, T>,
  labels: ColumnControlOptions["labels"],
): readonly DataLeaf[] {
  const leaves = target.definition.controllerDefinition.columns.filter(
    (policy) => !policy.utility,
  );
  const byId = new Map(leaves.map((policy) => [policy.id, policy]));
  return Object.freeze(
    target.state.columns.order.flatMap((id) => {
      const policy = byId.get(id);
      if (!policy) return [];
      const column = target.native.getColumn(id);
      if (!column || column.columns.length || column.columnDef.meta?.utility)
        return [];
      const header = column.columnDef.header;
      const label =
        labels && Object.hasOwn(labels, id) ? labels[id] : undefined;
      return [
        Object.freeze({
          id,
          label:
            label ??
            (typeof header === "string" && header.trim() ? header : id),
          hideable: policy.hideable !== false && column.getCanHide(),
          sortable:
            target.definition.controllerDefinition.schema.fields[id]?.sort ===
              true && column.getCanSort(),
          multiSortable:
            target.definition.multiSort && column.getCanMultiSort(),
        }),
      ];
    }),
  );
}

export function observe(
  observer: ColumnControlOptions["onResult"],
  notice: ControlMutationNotice,
): void {
  try {
    // Async observers are not awaited and may not reject into the application.
    const result: unknown = observer?.(notice);
    if (result && (typeof result === "object" || typeof result === "function"))
      void Promise.resolve(result).catch(() => {});
  } catch {
    /* Observers do not own accepted state. */
  }
}
export function notice<S extends QuerySchema>(
  result: MutationResult<S>,
): ControlMutationNotice {
  return result.status === "proposed" ? "submitted" : result.status;
}

export function setVisible<S extends QuerySchema, T extends object>(
  target: CapturedTarget<S, T>,
  options: ColumnControlOptions,
  id: string,
  visible: boolean,
): void {
  if (options.isDisabled) return;
  try {
    requireTarget(target, "columns");
    if (typeof visible !== "boolean") throw new Error("Invalid visibility");
    const result = target.controller.dispatch({
      type: "columns.visibility",
      update(previous) {
        requireTarget(target, "columns");
        const policy = target.controller
          .getDefinition()
          .columns.find((item) => item.id === id && !item.utility);
        const column = target.native.getColumn(id);
        if (
          !policy ||
          !column ||
          column.columns.length ||
          column.columnDef.meta?.utility ||
          (!visible && (policy.hideable === false || !column.getCanHide()))
        )
          throw new Error("Column controls unavailable");
        const data = target.controller
          .getDefinition()
          .columns.filter((item) => !item.utility);
        if (
          !visible &&
          data.every((item) => item.id === id || previous[item.id] === false)
        )
          throw new Error("A data column must remain visible");
        // Never touch order/query/selection; previous is the reducer's accepted slice.
        return { ...previous, [id]: visible };
      },
    });
    observe(options.onResult, notice(result));
  } catch {
    observe(options.onResult, "unavailable");
  }
}

export function visibleCount<S extends QuerySchema>(
  state: TableState<S>,
  leaves: readonly DataLeaf[],
): number {
  return leaves.filter((leaf) => state.columns.visibility[leaf.id] !== false)
    .length;
}
