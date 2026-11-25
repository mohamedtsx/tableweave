import {
  renderNativeComponent,
  requireCriteriaTool,
  requireDataTableModel,
  useDataTable,
  useTableweaveState,
} from "@tableweave/react";
import {
  StrictMode,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { createRoot } from "react-dom/client";
import { transactionDefinition } from "../shared/definitions.js";
import { createExampleOwner } from "../shared/owner.js";
import { transactions } from "../shared/records.js";

/** No stylesheet/styled component graph: a real native headless projection. */
export function HeadlessExample() {
  const [owner] = useState(() =>
    createExampleOwner(transactionDefinition({ full: true }), transactions, {
      id: "vite-headless",
    }),
  );
  const own = useSyncExternalStore(
    owner.subscribe,
    owner.getSnapshot,
    owner.getServerSnapshot,
  );
  const state = useTableweaveState(owner.C);
  useLayoutEffect(() => owner.connect(), [owner]);
  const model = useDataTable(owner.D, owner.modelOptions());
  const [draft, setDraft] = useState("");
  useLayoutEffect(
    () =>
      owner.P.registerParticipant(owner.criteria(), {
        purge() {
          setDraft("");
          return undefined;
        },
      }),
    [owner],
  );
  let display = false;
  try {
    requireDataTableModel(model, owner.D);
    display = model.phase === "display";
  } catch {
    /* No render-time display grant before actual commit. */
  }
  const view = display ? model.view : null,
    presentation = display ? model.presentation : null;
  return (
    <main>
      <h1>Unstyled headless example</h1>
      <p>
        Synthetic complete client input. No styling or drag integration is
        imported.
      </p>
      <a href="./index.html">Open the styled page</a>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          try {
            requireDataTableModel(model, owner.D);
            const target = model.toolTarget;
            if (!target) return;
            requireCriteriaTool(target.authority, target.owner);
            owner.dispatch({ type: "search.commit", search: draft });
          } catch {
            /* A stale form cannot acquire a replacement grant. */
          }
        }}
      >
        <label>
          Search descriptions
          <input
            name="search"
            value={draft}
            disabled={!view || !own.access}
            onChange={(event) => {
              if (owner.getSnapshot().access) setDraft(event.target.value);
            }}
          />
        </label>
        <button type="submit" disabled={!view || !own.access}>
          Apply search
        </button>
        <button
          type="button"
          disabled={!own.access}
          onClick={() => {
            if (owner.getSnapshot().access)
              setDraft(owner.C.getSnapshot().query.search);
          }}
        >
          Cancel search draft
        </button>
      </form>
      {!own.access ? (
        <p role="status">
          Application access ended. A new source owner is required.
        </p>
      ) : !view || !presentation ? (
        <p role="status">Preparing the actual model.</p>
      ) : (
        <>
          <p>
            <output aria-label="Selected count">
              {presentation.selectedIds.length} selected
            </output>
          </p>
          <button
            type="button"
            disabled={!presentation.canCancelSelection}
            onClick={() => {
              model.authority?.cancelSelection();
            }}
          >
            Cancel row selection
          </button>
          <table aria-label="Headless synthetic transactions">
            <thead>
              {view.headerGroups.map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th key={header.id} colSpan={header.colSpan} scope="col">
                      {header.isPlaceholder ? null : header.column.id ===
                        "selection" ? (
                        <label>
                          Select this page
                          <input
                            type="checkbox"
                            checked={presentation.pageSelection.checked}
                            disabled={!presentation.canSelect}
                            onChange={(event) => {
                              model.authority?.selectPage(event.target.checked);
                            }}
                          />
                        </label>
                      ) : (
                        <>
                          {renderNativeComponent(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {header.column.columnDef.enableSorting ? (
                            <button
                              type="button"
                              aria-label={`Sort ${header.column.id}`}
                              onClick={() => {
                                try {
                                  const id = header.column.id;
                                  if (
                                    !model.authority ||
                                    (id !== "description" && id !== "amount")
                                  )
                                    return;
                                  model.authority.require({ type: "sort" });
                                  owner.dispatch({
                                    type: "sorting.change",
                                    update: [
                                      {
                                        id,
                                        desc:
                                          state.query.sorting[0]?.id === id &&
                                          !state.query.sorting[0].desc,
                                      },
                                    ],
                                  });
                                } catch {
                                  /* Event-time authority denied. */
                                }
                              }}
                            >
                              Sort
                            </button>
                          ) : null}
                        </>
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
                          {`Select ${row.original.description}`}
                          <input
                            type="checkbox"
                            checked={state.selection[row.id] === true}
                            disabled={
                              !presentation.canSelect ||
                              !presentation.eligiblePageIds.includes(row.id)
                            }
                            onChange={(event) => {
                              model.authority?.selectRow(
                                row.id,
                                event.target.checked,
                              );
                            }}
                          />
                        </label>
                      </td>
                    ) : cell.column.id === "description" ? (
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
              disabled={!presentation.canPreviousPage}
              onClick={() => {
                model.authority?.previousPage();
              }}
            >
              Previous page
            </button>
            <span>Page {state.query.pagination.pageIndex + 1}</span>
            <button
              type="button"
              disabled={!presentation.canNextPage}
              onClick={() => {
                model.authority?.nextPage();
              }}
            >
              Next page
            </button>
          </nav>
        </>
      )}
      <button type="button" disabled={!own.access} onClick={owner.revoke}>
        Revoke application access
      </button>
    </main>
  );
}
if (typeof document !== "undefined") {
  const element = document.getElementById("app");
  if (element)
    createRoot(element).render(
      <StrictMode>
        <HeadlessExample />
      </StrictMode>,
    );
}
