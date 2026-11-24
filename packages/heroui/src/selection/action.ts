import type { ControlsPresentation } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import type { SelectionAction, SelectionActionContext } from "./types.js";

/** Capture metadata/callbacks ONCE before validation. Never freeze an app record. */
export function captureActions<S extends QuerySchema, T extends object>(
  input: readonly SelectionAction<S, T>[],
): readonly SelectionAction<S, T>[] {
  const seen = new Set<string>();
  return Object.freeze(
    Array.from(input, (value) => {
      const action = { ...value };
      if (
        typeof action.id !== "string" ||
        !action.id.trim() ||
        seen.has(action.id) ||
        typeof action.label !== "string" ||
        !action.label.trim() ||
        typeof action.onAction !== "function" ||
        (action.isDisabled !== undefined &&
          typeof action.isDisabled !== "boolean") ||
        (action.isPending !== undefined &&
          typeof action.isPending !== "boolean") ||
        (action.variant !== undefined &&
          !["secondary", "tertiary", "danger"].includes(action.variant))
      )
        throw new TypeError("Invalid selection action descriptor");
      seen.add(action.id);
      return Object.freeze(action);
    }),
  );
}

/** Records are available only through a newly guarded event-time snapshot. */
export function selectionActionContext<S extends QuerySchema, T extends object>(
  facts: ControlsPresentation<S, T>,
): SelectionActionContext<S, T> {
  const {
    selectedIds,
    canCancelSelection,
    loadedSelected,
    missingSelectedIds,
    busy,
    stale,
    obsolete,
    resourceObsolete,
    blockedReason,
    displayed,
    requestedQuery,
  } = facts;
  if (
    !selectedIds.length ||
    !canCancelSelection ||
    blockedReason === "context" ||
    blockedReason === "definition" ||
    blockedReason === "source" ||
    blockedReason === "binding"
  )
    throw new Error("Selection action is unavailable");
  return Object.freeze({
    selectedIds: Object.freeze([...selectedIds]),
    selectedCount: selectedIds.length,
    loadedSelected: Object.freeze(
      loadedSelected.map(({ id, record }) => Object.freeze({ id, record })),
    ),
    missingSelectedIds: Object.freeze([...missingSelectedIds]),
    busy,
    stale,
    obsolete,
    resourceObsolete,
    blockedReason,
    displayed,
    requestedQuery,
  });
}
