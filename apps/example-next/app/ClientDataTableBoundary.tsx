"use client";

import { Button } from "@heroui/react/button";
import { DataTable, englishDataTableLocale } from "@tableweave/heroui";
import { useDataTable, useTableweaveState } from "@tableweave/react";
import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import { createClientOwner } from "../lib/client-owner.js";
import type { InitialPayload } from "../lib/payload.js";

export default function ClientDataTableBoundary({
  initial,
}: {
  readonly initial: InitialPayload;
}) {
  const [source] = useState(() => createClientOwner(initial));
  const [shown, setShown] = useState(true);
  const { app } = source;
  const own = useSyncExternalStore(
    app.subscribe,
    app.getSnapshot,
    app.getServerSnapshot,
  );
  const state = useTableweaveState(app.C);
  useLayoutEffect(() => source.connect(), [source]);
  const changedInitial = initial !== source.initial;
  useLayoutEffect(() => {
    if (changedInitial) app.revoke();
  }, [app, changedInitial]);
  // The producer remains mounted above optional renderer visibility. A new RSC
  // payload is NOT a continuation grant even if its scope strings are equal.
  const model = useDataTable(app.D, app.modelOptions());
  const titleId = `transactions-${source.initial.instance}`;
  return (
    <section
      className="example-panel"
      aria-labelledby={titleId}
      data-instance={source.initial.instance}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id={titleId} className="text-xl font-semibold">
            Transactions
            {source.initial.instance === "comparison"
              ? " · independent example"
              : ""}
          </h2>
          <p className="mt-2 text-sm text-muted">
            Public synthetic inputs · en-US · UTC · 25 Nov 2026
          </p>
        </div>
        <a
          className="example-link"
          href={`/headless?instance=${source.initial.instance}`}
        >
          Read headless JSON
        </a>
      </header>
      <fieldset className="my-5 flex min-w-0 flex-wrap items-center gap-2 border-0 p-0">
        <legend className="sr-only">Example source controls</legend>
        <Button
          variant="secondary"
          size="sm"
          isDisabled={!own.access || changedInitial}
          onPress={() => setShown((value) => !value)}
        >
          {shown ? "Hide table" : "Show table"}
        </Button>
        <Button
          variant="tertiary"
          size="sm"
          isDisabled={!own.access || changedInitial}
          onPress={() => app.revoke()}
        >
          Revoke example source
        </Button>
        <span className="text-sm text-muted" role="status">
          {own.notice}
        </span>
      </fieldset>
      {changedInitial ? (
        <p role="status">
          New initial input requires a new document.{" "}
          <a className="example-link" href="/">
            Open a fresh example
          </a>
        </p>
      ) : !own.access ? (
        <p role="status">
          This source is retired.{" "}
          <a className="example-link" href="/">
            Open a fresh example
          </a>{" "}
          to start a new source owner.
        </p>
      ) : shown ? (
        <DataTable
          table={model}
          locale={englishDataTableLocale}
          collection={{
            label: `Public synthetic transactions · ${source.initial.instance}`,
            rowHeaderColumnId: "description",
            rowTextValue: (row) => row.original.description,
            columnTextValue: (column) => column.id,
            cellTextValue: (cell) => String(cell.getValue() ?? ""),
          }}
        />
      ) : (
        <p role="status">
          Table hidden; its application source remains connected.
        </p>
      )}
      <footer className="mt-5 space-y-1 text-sm text-muted">
        <p data-page-index={state.query.pagination.pageIndex}>
          Accepted query page: {state.query.pagination.pageIndex + 1}. Query
          state belongs to the actual controller.
        </p>
        <p>
          Initial payload only; the JSON route is not a data transport,
          authorization check or persistence service. Drag remains blocked; G-02
          is incomplete.
        </p>
      </footer>
    </section>
  );
}
