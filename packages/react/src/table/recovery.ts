import type { QuerySchema } from "../contracts/types.js";
import type { CriteriaSourceMetadata } from "../presentation/criteria-frame.js";
import type { ControlsPresentation } from "../presentation/types.js";
import type {
  DataTableEmptyCause,
  DataTableModel,
  DataTableRecovery,
} from "./types.js";

/** Pure finite recovery facts from already committed genuine projections.
 * No query compilation, row scanning, callbacks, error payload or permission grant. */
export function projectDataTableRecovery<
  S extends QuerySchema,
  T extends object,
>(input: {
  readonly phase: DataTableModel<S, T>["phase"];
  readonly metadata: CriteriaSourceMetadata<S> | null;
  readonly presentation: ControlsPresentation<S, T> | null;
  readonly clientInputCount: number | null;
  readonly currentQueryIdentity?: string | null;
}): DataTableRecovery {
  const { phase, metadata, presentation, clientInputCount } = input;
  if (phase === "unavailable" || (!metadata && phase !== "uncommitted"))
    return Object.freeze({ kind: "unavailable" });
  if (phase === "uncommitted" || !metadata)
    return Object.freeze({ kind: "uncommitted" });
  const remote = metadata.mode === "client" ? null : metadata;
  const canRetry =
    (remote?.canRetry ?? false) &&
    (presentation ? presentation.canRetry : true);
  const displayed = presentation?.displayed;
  if (!displayed) {
    if (!remote || remote.kind === "idle")
      return Object.freeze({ kind: "idle" });
    if (remote.kind === "pending" && !remote.hasSnapshot)
      return Object.freeze({ kind: "loading" });
    if (remote.kind === "failure" && !remote.hasSnapshot)
      return Object.freeze({
        kind: "initial-error",
        error: remote.error ?? "unavailable",
        canRetry,
      });
    return Object.freeze({ kind: "unavailable" });
  }
  const busy = remote?.busy ?? presentation.busy;
  const stale = presentation.stale || (remote?.stale ?? false);
  const obsolete =
    presentation.obsolete ||
    presentation.resourceObsolete ||
    (input.currentQueryIdentity != null &&
      displayed.queryIdentity !== input.currentQueryIdentity);
  const notice = remote?.stale
    ? remote.kind === "pending"
      ? "updating"
      : remote.kind === "failure"
        ? "update-failed"
        : null
    : null;
  if (displayed.recordCount > 0)
    return Object.freeze({
      kind: "records",
      notice,
      busy,
      stale,
      obsolete,
      canRetry,
    });
  let cause: DataTableEmptyCause = "unknown";
  if (displayed.pageInfo.kind === "known" && displayed.pageInfo.total > 0)
    cause = "no-record-on-page";
  else if (remote) cause = remote.emptyKind ?? "unknown";
  else if (
    displayed.pageInfo.kind === "known" &&
    displayed.pageInfo.total === 0
  ) {
    if (clientInputCount === 0) cause = "dataset";
    else if (clientInputCount !== null && clientInputCount > 0)
      cause = "filtered";
  }
  return Object.freeze({
    kind: busy ? "updating-empty" : "empty",
    cause,
    notice,
    busy,
    stale,
    obsolete,
    canRetry,
  });
}
