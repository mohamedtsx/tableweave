import { requireDataTableModel, useDataTable } from "@tableweave/react";
import { DataTable } from "@tableweave/heroui";
import type { QuerySchema } from "@tableweave/react/contracts";
import { useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { cellText, digest, type BenchClient } from "./fixture.js";
import type { Source } from "./source.js";
export function Benchmark<S extends QuerySchema, T extends BenchClient>({
  source,
}: {
  readonly source: Source<S, T>;
}) {
  useSyncExternalStore(
    source.subscribe,
    source.getSnapshot,
    source.getSnapshot,
  );
  const model = useDataTable(source.D, source.options()),
    host = useRef<HTMLDivElement>(null);
  const collection = useMemo(
    () => ({
      label: "WP14 reference table",
      rowHeaderColumnId: "recordLabel",
      rowTextValue: (value: NonNullable<typeof model.view>["rows"][number]) =>
        value.id,
      columnTextValue: (
        value: NonNullable<typeof model.view>["visibleColumns"][number],
      ) => value.id,
      cellTextValue: (
        value: ReturnType<
          NonNullable<typeof model.view>["rows"][number]["getVisibleCells"]
        >[number],
      ) => cellText(value.getValue()),
    }),
    [],
  );
  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    let active = true;
    function witness() {
      const current = host.current;
      if (!active || !current || !source.timing.target) return null;
      requireDataTableModel(model, source.D);
      const state = source.C.getSnapshot(),
        presentation = model.presentation;
      if (
        !source.isCurrent() ||
        model.phase !== "display" ||
        model.state !== state ||
        model.view?.state !== state ||
        !presentation?.displayed ||
        presentation.busy ||
        presentation.stale ||
        presentation.obsolete ||
        presentation.resourceObsolete ||
        presentation.blockedReason !== null ||
        presentation.displayed.queryIdentity !== state.queryIdentity ||
        presentation.displayed.pagination.pageSize !== 100
      )
        return null;
      const binding = source.checkServer(presentation.displayed.request);
      const table = current.querySelector("table"),
        box = current.getBoundingClientRect();
      if (
        !(table instanceof HTMLTableElement) ||
        window.top !== window ||
        document.visibilityState !== "visible" ||
        box.width <= 0 ||
        box.height <= 0 ||
        box.bottom <= 0 ||
        box.top >= innerHeight ||
        getComputedStyle(current).display === "none" ||
        getComputedStyle(current).visibility !== "visible"
      )
        return null;
      if (innerWidth !== 1440 || innerHeight !== 900) return null;
      for (
        let node: HTMLElement | null = table;
        node;
        node = node.parentElement
      ) {
        const style = getComputedStyle(node);
        if (
          node.hidden ||
          node.getAttribute("aria-hidden") === "true" ||
          style.display === "none" ||
          style.visibility !== "visible" ||
          Number(style.opacity) === 0
        )
          return null;
      }
      const rows = [...table.querySelectorAll("tbody > tr")];
      if (
        rows.length !== 100 ||
        model.view.rows.length !== 100 ||
        presentation.rows.length !== 100
      )
        return null;
      const headerNodes = [...table.querySelectorAll("thead th")],
        headers = headerNodes.map((node) => node.textContent?.trim() ?? "");
      const cells = rows.map((row) =>
        [...row.querySelectorAll("td,th")].map(
          (cell) => cell.textContent?.trim() ?? "",
        ),
      );
      if (cells.some((row) => row.length !== headers.length)) return null;
      const ids = cells.map((row) => row[0] ?? "");
      if (
        JSON.stringify(ids) !==
          JSON.stringify(model.view.rows.map((row) => row.id)) ||
        JSON.stringify(headers) !==
          JSON.stringify(model.view.visibleColumns.map((column) => column.id))
      )
        return null;
      const expected = source.timing.target.oracle;
      if (
        state.query.pagination.pageIndex !== expected.page ||
        presentation.displayed.recordCount !== 100 ||
        headers.length !== expected.headers.length
      )
        return null;
      if (
        source.mode !== "server-unknown" &&
        (presentation.displayed.pageInfo.kind !== "known" ||
          presentation.displayed.pageInfo.total !== expected.total)
      )
        return null;
      if (
        source.mode === "server-unknown" &&
        (presentation.displayed.pageInfo.kind !== "unknown" ||
          presentation.displayed.pageInfo.hasNextPage !== expected.hasNextPage)
      )
        return null;
      const inputCount =
        source.mode === "client"
          ? source.getSnapshot().records.length
          : source.resource.getSnapshot().snapshot?.records.length;
      if (inputCount !== expected.inputCount) return null;
      return {
        state,
        dom: {
          ids,
          headers,
          cells: digest(JSON.stringify(cells)),
          binding,
          inputCount,
          page: state.query.pagination.pageIndex,
          total:
            presentation.displayed.pageInfo.kind === "known"
              ? presentation.displayed.pageInfo.total
              : null,
          hasNextPage:
            presentation.displayed.pageInfo.kind === "unknown"
              ? presentation.displayed.pageInfo.hasNextPage
              : null,
        },
      };
    }
    function attempt() {
      try {
        const found = witness();
        if (!found) return;
        if (!source.timing.pending) {
          source.timing.resetMatched(found.state, found.dom);
          return;
        }
        void source.timing.complete(found.state, found.dom, () => {
          const again = witness();
          if (!again || JSON.stringify(again) !== JSON.stringify(found))
            throw new Error("E_CHANGED_AFTER_WITNESS");
        });
      } catch {
        /* Genuine neutral or superseded frame is not a completed sample. */
      }
    }
    const observer = new MutationObserver(attempt);
    observer.observe(element, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });
    const frame = requestAnimationFrame(attempt);
    attempt();
    return () => {
      active = false;
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [source, model]);
  return (
    <div
      ref={host}
      className="wp14-table"
      onKeyDownCapture={(event) => {
        if (
          !event.ctrlKey &&
          !event.metaKey &&
          (event.key.length === 1 ||
            event.key === "Backspace" ||
            event.key === "Delete")
        )
          source.timing.key();
      }}
    >
      <DataTable table={model} collection={collection} />
    </div>
  );
}
