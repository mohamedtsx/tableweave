"use client";

import { Button } from "@heroui/react/button";
import type { QuerySchema } from "@tableweave/react/contracts";
import { englishDataTableLocale } from "../localization/data-table.js";
import {
  requireTableRendererSourceTarget,
  TableRendererCommitError,
} from "../table/renderer-commit.js";
import type { TableRendererTarget } from "../table/types.js";

/** Source-owned state; a source-only error never borrows row/select permission. */
export function DataTableState<S extends QuerySchema, T extends object>({
  target,
}: {
  readonly target: TableRendererTarget<S, T>;
}) {
  try {
    const { model, ports, metadata } = requireTableRendererSourceTarget(target),
      recovery = model.recovery;
    const m = {
      ...englishDataTableLocale.messages.state,
      ...ports.messages.state,
    };
    let text: string | null = null,
      notice: string | null = null;
    switch (recovery.kind) {
      case "uncommitted":
        text = m.uncommitted;
        break;
      case "unavailable":
        text = m.unavailable;
        break;
      case "idle":
        text = m.idle;
        break;
      case "loading":
        text = m.loading;
        break;
      case "initial-error":
        text =
          recovery.error === "offline"
            ? m.offline
            : recovery.error === "timeout"
              ? m.timeout
              : m.initialError;
        break;
      case "empty":
      case "updating-empty":
        text =
          recovery.cause === "dataset"
            ? m.emptyDataset
            : recovery.cause === "filtered"
              ? m.noMatches
              : recovery.cause === "no-record-on-page"
                ? m.noRecordOnPage
                : m.unknownEmpty;
        break;
      case "records":
        break;
    }
    if ("notice" in recovery)
      notice =
        recovery.notice === "updating"
          ? m.updating
          : recovery.notice === "update-failed"
            ? m.updateFailed
            : null;
    const custom = ports.renderState?.({ model, recovery, metadata });
    requireTableRendererSourceTarget(target);
    const retry =
      "canRetry" in recovery &&
      recovery.canRetry &&
      metadata.mode !== "client" &&
      metadata.canRetry &&
      !!ports.onRetry;
    const retainedFacts =
      "stale" in recovery && (recovery.stale || recovery.obsolete);
    if (custom === undefined && !text && !notice && !retry && !retainedFacts)
      return null;
    return (
      <div
        className={text ? "tw-data-table__state" : "tw-data-table__notice"}
        data-stale={"stale" in recovery ? recovery.stale : undefined}
        data-obsolete={"obsolete" in recovery ? recovery.obsolete : undefined}
        aria-busy={
          "busy" in recovery ? recovery.busy : recovery.kind === "loading"
        }
      >
        {custom === undefined ? (
          <>
            {text ? <p role="status">{text}</p> : null}
            {notice ? <p role="status">{notice}</p> : null}
          </>
        ) : (
          custom
        )}
        {retry ? (
          <Button
            type="button"
            variant="secondary"
            onPress={() => {
              try {
                const current = requireTableRendererSourceTarget(target),
                  r = current.model.recovery;
                if (
                  !("canRetry" in r) ||
                  !r.canRetry ||
                  current.metadata.mode === "client" ||
                  !current.metadata.canRetry
                )
                  return;
                const result = current.ports.onRetry?.();
                requireTableRendererSourceTarget(target);
                if (result)
                  void result
                    .then(
                      () => {
                        requireTableRendererSourceTarget(target);
                      },
                      () => {
                        requireTableRendererSourceTarget(target);
                      },
                    )
                    .catch(() => {});
              } catch {
                /* App failure does not clear data or auto-retry. */
              }
            }}
          >
            {m.retry}
          </Button>
        ) : null}
      </div>
    );
  } catch (error) {
    if (error instanceof TableRendererCommitError) return null;
    throw error;
  }
}
