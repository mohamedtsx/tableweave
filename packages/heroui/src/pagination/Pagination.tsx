"use client";

import { Button } from "@heroui/react/button";
import { Label } from "@heroui/react/label";
import { ListBox } from "@heroui/react/list-box";
import { Pagination as HeroPagination } from "@heroui/react/pagination";
import { Select } from "@heroui/react/select";
import { ControlsError } from "@tableweave/react";
import { useEffect, useId, useRef } from "react";
import { formatPaginationNumber, paginationMessages } from "./messages.js";
import { paginationTargets } from "./model.js";
import type { PaginationComponent } from "./types.js";

export const Pagination: PaginationComponent = ({
  schema,
  presentation: facts,
  authority,
  locale = facts.displayed?.query.locale ?? "en-US",
  messages: m = paginationMessages,
  formatNumber = formatPaginationNumber,
  id,
  className,
  onRetry,
}) => {
  const generatedId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const focusedControl = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const previous = focusedControl.current;
    const root = rootRef.current;
    if (
      previous &&
      !previous.isConnected &&
      root &&
      (!document.activeElement || document.activeElement === document.body)
    ) {
      // Only recover focus lost by a removed numbered target. Never take it
      // from a surviving table control or an external application region.
      const target =
        root.querySelector<HTMLElement>(
          'button[aria-current="page"]:not(:disabled)',
        ) ??
        root.querySelector<HTMLElement>("button:not(:disabled)") ??
        root.querySelector<HTMLElement>(".tw-pagination__range");
      target?.focus();
      focusedControl.current = target;
    }
  });
  const rootId = id ?? generatedId;
  const displayed = facts.displayed;
  const n = (value: number) => formatNumber(value, locale);
  const index = displayed?.pagination.pageIndex ?? 0;
  const count = displayed?.pageCount ?? null;
  const page = !displayed
    ? ""
    : count === 0
      ? m.noPages
      : count === null
        ? m.page(n(index + 1))
        : index >= count
          ? m.outOfRange(n(index + 1), n(count))
          : m.knownPage(n(index + 1), n(count));
  const range = !displayed
    ? m.unavailable
    : displayed.range
      ? displayed.pageInfo.kind === "known"
        ? m.knownRange(
            n(displayed.range.from),
            n(displayed.range.to),
            n(displayed.pageInfo.total),
          )
        : m.unknownTotalRange(n(displayed.range.from), n(displayed.range.to))
      : displayed.pageInfo.kind === "known"
        ? m.unknownRangeKnownTotal(n(displayed.pageInfo.total))
        : m.unknownRange;
  const retained =
    displayed !== null &&
    (facts.busy || facts.stale || facts.obsolete || facts.resourceObsolete);
  const notice = [
    facts.busy ? m.updating : "",
    retained ? m.retained : "",
    facts.stale && !facts.busy ? m.stale : "",
  ]
    .filter(Boolean)
    .join(" ");
  const blocked = !facts.canNavigate ? m.navigationUnavailable : "";
  // An invalidated old handler is an expected no-op, not an uncaught UI error.
  // Unexpected app callback errors are not swallowed.
  const guarded = (action: () => void) => {
    try {
      action();
    } catch (error) {
      if (!(error instanceof ControlsError)) throw error;
    }
  };
  const reasonId = `${rootId}-reason`;
  return (
    <div
      ref={rootRef}
      onFocusCapture={(event) => {
        focusedControl.current = event.target;
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          focusedControl.current = null;
      }}
      id={rootId}
      className={["tw-pagination", className].filter(Boolean).join(" ")}
      data-busy={facts.busy || undefined}
      data-stale={facts.stale || undefined}
      data-obsolete={facts.obsolete || facts.resourceObsolete || undefined}
    >
      <div className="tw-pagination__summary">
        <p
          id={`${rootId}-range`}
          className="tw-pagination__range"
          tabIndex={-1}
          aria-live="polite"
          aria-atomic="true"
        >
          {range}
          {page ? ` · ${page}` : ""}
        </p>
        {notice ? (
          <p
            className="tw-pagination__notice"
            aria-live="polite"
            aria-atomic="true"
          >
            {notice}
          </p>
        ) : null}
        {blocked ? (
          <p id={reasonId} className="tw-pagination__reason">
            {blocked}
          </p>
        ) : null}
      </div>
      <div className="tw-pagination__controls">
        {displayed ? (
          <Select
            id={`${rootId}-size`}
            className="tw-pagination__size"
            value={String(displayed.pagination.pageSize)}
            isDisabled={!facts.canNavigate}
            {...(blocked ? { "aria-describedby": reasonId } : {})}
            onChange={(value) =>
              guarded(() => {
                const size = Number(value);
                if (schema.pagination.sizes.includes(size))
                  authority.setPageSize(size);
              })
            }
          >
            <Label>{m.rowsPerPage}</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {schema.pagination.sizes.map((size) => (
                  <ListBox.Item
                    key={size}
                    id={String(size)}
                    textValue={n(size)}
                  >
                    {n(size)}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        ) : null}
        <HeroPagination aria-label={m.navigation} aria-busy={facts.busy}>
          <HeroPagination.Content className="tw-pagination__pages">
            <HeroPagination.Item>
              <Button
                id={`${rootId}-previous`}
                variant="tertiary"
                size="sm"
                isDisabled={!facts.canPreviousPage}
                {...(!facts.canPreviousPage
                  ? {
                      "aria-describedby": blocked
                        ? reasonId
                        : `${rootId}-first-reason`,
                    }
                  : {})}
                onPress={() =>
                  guarded(() => {
                    authority.previousPage();
                  })
                }
              >
                {m.previous}
              </Button>
            </HeroPagination.Item>
            {paginationTargets(index, count ?? 0).map((target) => (
              <HeroPagination.Item key={target}>
                <Button
                  id={`${rootId}-page-${target + 1}`}
                  size="sm"
                  variant={target === index ? "secondary" : "tertiary"}
                  aria-label={m.page(n(target + 1))}
                  {...(target === index
                    ? { "aria-current": "page" as const }
                    : {})}
                  isDisabled={!facts.canNavigate}
                  {...(blocked ? { "aria-describedby": reasonId } : {})}
                  onPress={() =>
                    guarded(() => {
                      authority.setPageIndex(target);
                    })
                  }
                >
                  {n(target + 1)}
                </Button>
              </HeroPagination.Item>
            ))}
            <HeroPagination.Item>
              <Button
                id={`${rootId}-next`}
                variant="tertiary"
                size="sm"
                isDisabled={!facts.canNextPage}
                {...(!facts.canNextPage
                  ? {
                      "aria-describedby": blocked
                        ? reasonId
                        : `${rootId}-last-reason`,
                    }
                  : {})}
                onPress={() =>
                  guarded(() => {
                    authority.nextPage();
                  })
                }
              >
                {m.next}
              </Button>
            </HeroPagination.Item>
          </HeroPagination.Content>
        </HeroPagination>
        <span id={`${rootId}-first-reason`} hidden>
          {m.firstPage}
        </span>
        <span id={`${rootId}-last-reason`} hidden>
          {m.lastPage}
        </span>
        {onRetry && facts.canRetry ? (
          <Button
            id={`${rootId}-retry`}
            size="sm"
            variant="secondary"
            onPress={() =>
              guarded(() => {
                onRetry(authority.require({ type: "retry" }));
              })
            }
          >
            {m.retry}
          </Button>
        ) : null}
      </div>
    </div>
  );
};
