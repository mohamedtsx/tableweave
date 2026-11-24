import type { RowData } from "@tanstack/react-table";
import type { QuerySchema } from "../contracts/types.js";
import type { NativeSelectionMode } from "../tanstack/types.js";
import type { ControlsBlockedReason, ControlsPresentation } from "./types.js";

const empty = Object.freeze([]);

/** Exhaustive privacy boundary. Never accepts or spreads another owner's facts.
 * A new required presentation field must acquire an explicit neutral value here. */
export function maskedControlsPresentation<
  S extends QuerySchema,
  T extends RowData,
>(
  selectionMode: NativeSelectionMode,
  blockedReason: ControlsBlockedReason,
): ControlsPresentation<S, T> {
  return Object.freeze({
    selectionMode,
    selectedIds: empty,
    loadedSelected: empty,
    missingSelectedIds: empty,
    rows: empty,
    eligiblePageIds: empty,
    pageSelection: Object.freeze({
      supported: selectionMode === "multiple",
      checked: false,
      mixed: false,
    }),
    displayed: null,
    requestedQuery: null,
    busy: false,
    stale: false,
    obsolete: false,
    resourceObsolete: false,
    blockedReason,
    canSelect: false,
    canNavigate: false,
    canPreviousPage: false,
    canNextPage: false,
    canReorder: false,
    canRetry: false,
    canCancelSelection: false,
  });
}
