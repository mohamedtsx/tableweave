import {
  renderNativeComponent,
  requireCriteriaTool,
  requireDataTableModel,
  useDataTable,
  useTableweaveState,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import type { TableSource } from "../application/table-source.js";

/** Borrows an already-owned source; UI detach never ends the application source. */
export function HeadlessTable<S extends QuerySchema, T extends object>({
  source,
  title,
  rowHeader,
  rowText,
}: {
  readonly source: TableSource<S, T>;
  readonly title: string;
  readonly rowHeader: string;
  readonly rowText: (record: T) => string;
}) {
  useSyncExternalStore(
    source.resource.subscribe,
    source.resource.getSnapshot,
    source.resource.getServerSnapshot,
  );
  const state = useTableweaveState(source.C);
  const model = useDataTable(source.D, source.modelOptions());
  const [draft, setDraft] = useState("");
  useLayoutEffect(() => source.registerDraft(() => setDraft("")), [source]);
  let ready = false;
  try {
    requireDataTableModel(model, source.D);
    ready = model.phase === "display";
  } catch {
    /* Neutral before a genuine commit, or after source end. */
  }
  const view = ready ? model.view : null,
    facts = ready ? model.presentation : null;
  return (
    <section aria-label={title}>
      <h2>{title}</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          try {
            if (!source.isCurrent()) return;
            requireDataTableModel(model, source.D);
            const tool = model.toolTarget;
            if (!tool) return;
            requireCriteriaTool(tool.authority, tool.owner);
            source.C.dispatch({ type: "search.commit", search: draft });
          } catch {
            /* Saved form cannot borrow a replacement source grant. */
          }
        }}
      >
        <label>
          Search records
          <input
            value={draft}
            disabled={!view || !source.isCurrent()}
            onChange={(event) => {
              if (source.isCurrent()) setDraft(event.target.value);
            }}
          />
        </label>
        <button type="submit" disabled={!view || !source.isCurrent()}>
          Apply search
        </button>
        <button
          type="button"
          disabled={!source.isCurrent()}
          onClick={() => {
            if (source.isCurrent())
              setDraft(source.C.getSnapshot().query.search);
          }}
        >
          Cancel search draft
        </button>
      </form>
      <p role="status">
        {model.recovery.kind === "records"
          ? (model.recovery.notice ?? "Current records")
          : model.recovery.kind}
      </p>
      <button
        type="button"
        disabled={!source.isCurrent() || !!model.presentation?.busy}
        onClick={source.refresh}
      >
        Refresh synthetic records
      </button>
      <button
        type="button"
        disabled={!model.presentation?.canRetry}
        onClick={() => {
          try {
            model.authority?.retry();
          } catch {
            /* Stale retry denied. */
          }
        }}
      >
        Retry current request
      </button>
      {view && facts ? (
        <>
          <p>
            <output aria-label="Selected count">
              {facts.selectedIds.length} selected; {facts.loadedSelected.length}{" "}
              loaded
            </output>
          </p>
          <button
            type="button"
            disabled={!facts.canCancelSelection}
            onClick={() => {
              try {
                model.authority?.cancelSelection();
              } catch {
                /* Ended owner. */
              }
            }}
          >
            Cancel row selection
          </button>
          <table aria-label={title}>
            <thead>
              {view.headerGroups.map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th key={header.id} colSpan={header.colSpan} scope="col">
                      {header.isPlaceholder ? null : header.column.id ===
                        "selection" ? (
                        <label>
                          Select page
                          <input
                            type="checkbox"
                            checked={facts.pageSelection.checked}
                            aria-checked={
                              facts.pageSelection.mixed
                                ? "mixed"
                                : facts.pageSelection.checked
                            }
                            disabled={!facts.canSelect}
                            onChange={(event) => {
                              try {
                                model.authority?.selectPage(
                                  event.target.checked,
                                );
                              } catch {
                                /* Ended owner. */
                              }
                            }}
                          />
                        </label>
                      ) : (
                        renderNativeComponent(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {view.rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) =>
                    cell.column.id === "selection" ? (
                      <td key={cell.id}>
                        <label>
                          {`Select ${rowText(row.original)}`}
                          <input
                            type="checkbox"
                            checked={state.selection[row.id] === true}
                            disabled={
                              !facts.canSelect ||
                              !facts.eligiblePageIds.includes(row.id)
                            }
                            onChange={(event) => {
                              try {
                                model.authority?.selectRow(
                                  row.id,
                                  event.target.checked,
                                );
                              } catch {
                                /* Ended owner. */
                              }
                            }}
                          />
                        </label>
                      </td>
                    ) : cell.column.id === rowHeader ? (
                      <th key={cell.id} scope="row">
                        {renderNativeComponent(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </th>
                    ) : (
                      <td key={cell.id}>
                        {renderNativeComponent(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <nav aria-label="Pagination">
            <button
              type="button"
              disabled={!facts.canPreviousPage}
              onClick={() => {
                try {
                  model.authority?.previousPage();
                } catch {
                  /* Ended owner. */
                }
              }}
            >
              Previous page
            </button>
            <span>Page {state.query.pagination.pageIndex + 1}</span>
            <button
              type="button"
              disabled={!facts.canNextPage}
              onClick={() => {
                try {
                  model.authority?.nextPage();
                } catch {
                  /* Ended owner. */
                }
              }}
            >
              Next page
            </button>
          </nav>
        </>
      ) : (
        <p>No granted table view is mounted yet.</p>
      )}
    </section>
  );
}
