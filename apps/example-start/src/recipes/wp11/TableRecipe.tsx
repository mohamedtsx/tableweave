import {
  renderNativeComponent,
  requireCriteriaTool,
  requireDataTableModel,
  useDataTable,
  useTableweaveState,
} from "@tableweave/react";
import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import type { RecipeOwner } from "./table-owner.js";

/** UNMOUNTED headless recipe; the caller creates/retains the request-local owner. */
export function TableRecipe({ owner }: { readonly owner: RecipeOwner }) {
  useSyncExternalStore(
    owner.resource.subscribe,
    owner.resource.getSnapshot,
    owner.resource.getServerSnapshot,
  );
  const state = useTableweaveState(owner.C);
  useLayoutEffect(() => owner.connect(), [owner]);
  const model = useDataTable(owner.D, owner.modelOptions());
  const [draft, setDraft] = useState("");
  useLayoutEffect(
    () =>
      owner.P.registerParticipant(owner.criteria, {
        purge() {
          setDraft("");
          return undefined;
        },
      }),
    [owner],
  );
  let ready = false;
  try {
    requireDataTableModel(model, owner.D);
    ready = model.phase === "display";
  } catch {
    /* Neutral until actual commit. */
  }
  return (
    <section aria-label="Unmounted Query table recipe">
      <h2>Synthetic Query-backed table recipe</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          try {
            requireDataTableModel(model, owner.D);
            const target = model.toolTarget;
            if (!target) return;
            requireCriteriaTool(target.authority, target.owner);
            owner.C.dispatch({ type: "search.commit", search: draft });
          } catch {
            /* No replacement authority from a stale form. */
          }
        }}
      >
        <label>
          Search descriptions
          <input
            disabled={!ready}
            value={draft}
            onChange={(event) => {
              if (owner.isActive()) setDraft(event.target.value);
            }}
          />
        </label>
        <button type="submit" disabled={!ready}>
          Apply search
        </button>
      </form>
      <p role="status">{model.recovery.kind}</p>
      {ready && model.view ? (
        <table aria-label="Recipe transactions">
          <thead>
            {model.view.headerGroups.map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} colSpan={header.colSpan} scope="col">
                    {header.isPlaceholder
                      ? null
                      : renderNativeComponent(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {model.view.rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) =>
                  cell.column.id === "description" ? (
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
      ) : null}
      <nav aria-label="Recipe pagination">
        <button
          type="button"
          disabled={!model.presentation?.canPreviousPage}
          onClick={() => {
            model.authority?.previousPage();
          }}
        >
          Previous page
        </button>
        <span>Page {state.query.pagination.pageIndex + 1}</span>
        <button
          type="button"
          disabled={!model.presentation?.canNextPage}
          onClick={() => {
            model.authority?.nextPage();
          }}
        >
          Next page
        </button>
        <button
          type="button"
          disabled={!model.presentation?.canRetry}
          onClick={() => {
            model.authority?.retry();
          }}
        >
          Retry current request
        </button>
      </nav>
    </section>
  );
}
