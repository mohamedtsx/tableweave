import { useNativeTable, useTableweaveResource } from "@tableweave/react";
import { type QueryClient, useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useState } from "react";
import type { AuthorizationSession } from "./authorization-session";
import type { RuntimeInspection } from "./inspection";
import { rowsOptions } from "./options";
import { createDemoRuntime } from "./runtime";
import type {
  AuthorizationIdentity,
  AuthorizedBootstrap,
  ReadInput,
} from "./types";

interface SessionProps {
  readonly bootstrap: AuthorizedBootstrap;
  readonly canary: string;
  readonly queryClient: QueryClient;
  readonly authorization: AuthorizationSession;
  /** Acceptance fixture can suspend a speculative render, never commit writes. */
  readonly beforeCommit?: () => void;
}
export function AuthorizationBoundary(props: SessionProps) {
  return (
    <DemoSession
      key={`${props.bootstrap.definitionKey}|${props.bootstrap.scopeKey}|${props.bootstrap.authorizationId}`}
      {...props}
    />
  );
}

function DemoSession({
  bootstrap,
  canary,
  queryClient,
  authorization,
  beforeCommit,
}: SessionProps) {
  const router = useRouter();
  const [runtime] = useState(() =>
    createDemoRuntime(bootstrap, queryClient, authorization),
  );
  const resource = useTableweaveResource(runtime.resource, {
    definitionKey: bootstrap.definitionKey,
    scopeKey: bootstrap.scopeKey,
    access: true,
  });
  useLayoutEffect(() => {
    authorization.commit(runtime.authority);
  }, [authorization, runtime]);
  const snapshot = resource.snapshot;
  const table = useNativeTable(runtime.definition, runtime.controller, {
    mode: "server",
    records: snapshot?.records ?? [],
    pageInfo: snapshot?.page ?? { kind: "unknown", hasNextPage: false },
  });
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  useEffect(() => {
    const inspect = (): RuntimeInspection => ({
      scopeKey: runtime.resource.getSnapshot().context.scopeKey,
      definitionKey: runtime.authority.identity.definitionKey,
      authorizationId: runtime.authority.identity.id,
      controllerDisposed: runtime.controller.isDisposed(),
      access: runtime.resource.getSnapshot().context.access,
      canSelect: runtime.resource.getSnapshot().canSelect,
      active: runtime.resource.getSnapshot().active,
      rows: runtime.resource.getSnapshot().snapshot?.records.length ?? 0,
      selectionCount: Object.values(
        runtime.controller.getSnapshot().selection,
      ).filter(Boolean).length,
      detailsOpen: runtime.controller.getSnapshot().details.rowId !== null,
      serverRows:
        runtime.resource.getServerSnapshot().snapshot?.records.length ?? 0,
      serverAccess: runtime.resource.getServerSnapshot().context.access,
      cachedScopes: queryClient
        .getQueryCache()
        .getAll()
        .flatMap((query) =>
          query.queryKey[0] === "wp06-rows" &&
          typeof query.queryKey[1] === "string"
            ? [query.queryKey[1]]
            : [],
        ),
      canary: queryClient.getQueryData(["request-canary"]),
    });
    window.__wp06Inspect = inspect;
    const reconnect = () => {
      // Simulate an owner reconnecting the retained wrapper with its original
      // allowed expected props. A revoked grant must still remain terminal.
      runtime.resource.setContext(runtime.context);
      return runtime.resource.connect();
    };
    const revalidate = async () => {
      await router.invalidate();
    };
    window.__wp06Reconnect = reconnect;
    window.__wp06Revalidate = revalidate;
    return () => {
      if (window.__wp06Inspect === inspect) delete window.__wp06Inspect;
      if (window.__wp06Reconnect === reconnect) delete window.__wp06Reconnect;
      if (window.__wp06Revalidate === revalidate)
        delete window.__wp06Revalidate;
    };
  }, [runtime, queryClient, router]);
  const displayedPage = snapshot?.query.pagination;
  const start =
    displayedPage && snapshot.records.length
      ? displayedPage.pageIndex * displayedPage.pageSize + 1
      : 0;
  const end =
    displayedPage && snapshot.records.length
      ? displayedPage.pageIndex * displayedPage.pageSize +
        snapshot.records.length
      : 0;
  beforeCommit?.();
  return (
    <main>
      {resource.context.access && (
        <RowsObserver
          input={runtime.observerInput(table.state.query)}
          grant={runtime.authority.identity}
        />
      )}
      <h1>Synthetic Start + Query integration</h1>
      <p>
        Application-owned demo authorization only. No production authentication
        or database.
      </p>
      <output data-testid="canary">{canary}</output>
      <output data-testid="authorized-scope">{bootstrap.scopeKey}</output>
      <output data-testid="bootstrap">
        {bootstrap.tableId}|{bootstrap.query.locale}|{bootstrap.query.timeZone}|
        {bootstrap.clock}
      </output>
      <output data-testid="hydrated">{hydrated ? "hydrated" : "server"}</output>
      <p data-testid="resource">
        {resource.kind}|{resource.notice ?? "none"}|
        {resource.obsolete ? "obsolete" : "current"}|
        {resource.request?.generation ?? 0}
      </p>
      <p data-testid="page">
        Displayed {start}–{end}
        {snapshot?.page.kind === "known"
          ? ` of ${snapshot.page.total}`
          : " (total unknown)"}
        ; requested page {table.state.query.pagination.pageIndex + 1}
      </p>
      <p data-testid="selection">Selected {table.selectedIds.length}</p>
      <p data-testid="corrections">Corrections {runtime.correctionCount()}</p>
      <fieldset>
        <legend>Application test controls</legend>
        <button
          type="button"
          onClick={() => {
            void router.invalidate();
          }}
        >
          Reload authorization
        </button>
        <button
          type="button"
          onClick={() =>
            runtime.command({ type: "search.commit", search: "record 01" })
          }
        >
          Find record 01
        </button>
        <button
          type="button"
          onClick={() =>
            runtime.command({ type: "search.commit", search: "record 02" })
          }
        >
          Find record 02
        </button>
        <button
          type="button"
          onClick={() =>
            runtime.command(
              { type: "search.commit", search: "missing" },
              "slow",
            )
          }
        >
          Slow no matches
        </button>
        <button
          type="button"
          onClick={() => runtime.command({ type: "search.commit", search: "" })}
        >
          Clear search
        </button>
        <button
          type="button"
          disabled={!resource.canNavigate || !table.pagination.canNextPage}
          onClick={() => table.nextPage()}
        >
          Next page
        </button>
        <button
          type="button"
          disabled={!resource.canNavigate || !table.pagination.canPreviousPage}
          onClick={() => table.previousPage()}
        >
          Previous page
        </button>
        <button
          type="button"
          onClick={() =>
            runtime.command(
              {
                type: "pagination.change",
                update: {
                  pageIndex: table.state.query.pagination.pageIndex + 1,
                  pageSize: 10,
                },
              },
              "fail",
            )
          }
        >
          Fail next page
        </button>
        <button type="button" onClick={() => runtime.refresh("fail")}>
          Fail refresh
        </button>
        <button
          type="button"
          disabled={!resource.canRetry}
          onClick={() => runtime.retry()}
        >
          Retry current query
        </button>
        <button
          type="button"
          disabled={!resource.canRetry}
          onClick={() => runtime.retry("empty")}
        >
          Retry current query as empty
        </button>
        <button type="button" onClick={() => runtime.refresh("empty")}>
          Fresh empty
        </button>
        <button type="button" onClick={() => runtime.refresh("normal")}>
          Refresh
        </button>
        <button type="button" onClick={() => runtime.refresh("slow")}>
          Slow refresh
        </button>
        <button
          type="button"
          onClick={() =>
            runtime.command(
              { type: "search.commit", search: "record 01" },
              "uncancellable",
            )
          }
        >
          Late record 01
        </button>
        <button type="button" onClick={() => runtime.refresh("unknown")}>
          Unknown total
        </button>
        <button type="button" onClick={() => runtime.refresh("unknown-last")}>
          Full final unknown page
        </button>
        <button
          type="button"
          onClick={() =>
            runtime.command(
              {
                type: "pagination.change",
                update: { pageIndex: 2, pageSize: 10 },
              },
              "shrink",
            )
          }
        >
          Shrink dataset
        </button>
        <button type="button" onClick={() => runtime.refresh("deny")}>
          Revoke access
        </button>
        <button
          type="button"
          onClick={() =>
            runtime.controller.dispatch({ type: "selection.cancel" })
          }
        >
          Cancel selection
        </button>
      </fieldset>
      {resource.error && <p role="alert">{resource.error.message}</p>}
      <table
        id={bootstrap.tableId}
        aria-label="Synthetic records"
        aria-busy={resource.busy}
      >
        <thead>
          <tr>
            <th scope="col">Select</th>
            {table.visibleColumns.map((column) => (
              <th scope="col" key={column.id}>
                {String(column.columnDef.header ?? column.id)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.id} data-testid="record-row">
              <td>
                <input
                  type="checkbox"
                  aria-label={`Select ${row.original.label}`}
                  checked={row.getIsSelected()}
                  disabled={!resource.canSelect}
                  onChange={() => {
                    if (runtime.resource.getSnapshot().canSelect)
                      row.toggleSelected();
                  }}
                />
              </td>
              {row.getVisibleCells().map((cell) =>
                cell.column.id === "label" ? (
                  <th scope="row" key={cell.id}>
                    {String(cell.getValue())}
                  </th>
                ) : (
                  <td key={cell.id}>{String(cell.getValue())}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {resource.display === "empty" && (
        <p data-testid="empty">
          {snapshot?.emptyKind === "filtered"
            ? "No records match these criteria."
            : "No records yet."}
        </p>
      )}
      {resource.display === "blocked" && (
        <p data-testid="blocked">
          Access unavailable. Reload after explicit authorization.
        </p>
      )}
    </main>
  );
}

function RowsObserver({
  input,
  grant,
}: {
  readonly input: ReadInput;
  readonly grant: AuthorizationIdentity;
}) {
  useQuery({
    ...rowsOptions(input, grant),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  return null;
}
