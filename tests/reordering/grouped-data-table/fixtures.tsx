import { DataTable, type DataTableProps } from "@tableweave/heroui";
import {
  createCriteriaPublication,
  getCriteriaAuthorityOrigin,
  useDataTable,
} from "@tableweave/react";
import { createQuery } from "@tableweave/react/contracts";
import { StrictMode, useEffect, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { transactionDefinition } from "../../../apps/examples/shared/definitions.js";
import {
  fixedNow,
  type Transaction,
  transactions,
} from "../../../apps/examples/shared/records.js";

/** Real C/P/client-source owner. No row coordinator, admission, or transport. */
function createOwner() {
  const D = transactionDefinition({
    full: true,
    grouped: true,
    rows: false,
    utilities: [
      {
        id: "details",
        header: "Details",
        meta: { utility: true },
        cell: () => "Synthetic details",
      },
    ],
  });
  const context = {
    definitionKey: D.native.controllerDefinition.schema.id,
    scopeKey: "grouped-data-table",
    access: true,
  };
  const C = D.createController({
    initial: {
      query: createQuery(D.native.controllerDefinition.schema, {
        locale: "en-US",
        timeZone: "UTC",
      }),
    },
    now: () => fixedNow,
  });
  let records: readonly Transaction[] = [],
    live = false,
    version = 0;
  const listeners = new Set<() => void>();
  const notify = () => {
    version++;
    for (const listener of listeners) listener();
  };
  function retire() {
    // Actual application retirement on EVERY P transition/disposal, including boot.
    live = false;
    records = [];
    C.dispatch({ type: "selection.cancel" });
    C.dispatch({ type: "details.change", update: { rowId: null } });
    return undefined;
  }
  const P = createCriteriaPublication({
    controller: C,
    definition: C.getDefinition(),
    retirement: { retire },
  });
  const pending = P.begin({
    controller: C,
    definition: C.getDefinition(),
    expected: context,
    actual: context,
  });
  if (
    pending.status !== "pending" ||
    P.complete(pending.ticket).status !== "settled"
  )
    throw new Error("Synthetic publication did not settle");
  // Reacquire application-owned INPUTS only after actual retirement completed.
  records = transactions;
  live = true;
  const current = P.getSnapshot().current;
  if (!current) throw new Error("Synthetic publication has no current origin");
  const criteria = P.issue({
    controller: C,
    definition: C.getDefinition(),
    context: current.expected,
    epoch: current.epoch,
  });
  const origin = getCriteriaAuthorityOrigin(criteria);
  if (!origin) throw new Error("Synthetic criteria has no genuine origin");
  return {
    D,
    C,
    P,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => version,
    options() {
      return {
        controller: C,
        publication: P,
        criteria,
        expected: context,
        source: {
          mode: "client" as const,
          context: live ? origin.context : { ...origin.context, access: false },
          records,
        },
      };
    },
    replaceRecords() {
      if (!live) return;
      records = transactions.map((record) => ({
        ...record,
        description: `Replacement ${record.description}`,
      }));
      notify();
    },
    revokeSource() {
      live = false;
      records = [];
      notify();
    },
    revokePublication() {
      const denied = P.begin({
        controller: C,
        definition: C.getDefinition(),
        expected: context,
        actual: { ...context, access: false },
      });
      if (denied.status === "pending") P.complete(denied.ticket);
      notify();
    },
    state() {
      const columns = C.getSnapshot().columns;
      return {
        order: [...columns.order],
        visibility: { ...columns.visibility },
        sourceLive: live,
        retainedInputCount: records.length,
        publicationPhase: P.getSnapshot().phase,
        publicationAccess: P.getSnapshot().current?.actual.access ?? false,
        rowReordering: D.reordering.rows,
        columnReordering: D.reordering.columns,
      };
    },
  };
}

type Owner = ReturnType<typeof createOwner>;
const collection: NonNullable<
  DataTableProps<
    Owner["D"]["native"]["controllerDefinition"]["schema"],
    Transaction
  >["collection"]
> = {
  label: "Synthetic grouped transactions",
  rowHeaderColumnId: "description",
  selectionColumnId: "selection",
  rowTextValue: (row) => row.original.description,
  columnTextValue: (column) =>
    typeof column.columnDef.header === "string"
      ? column.columnDef.header
      : column.id,
  cellTextValue: (cell) => String(cell.getValue() ?? ""),
};
const reordering = { columns: true } as const;

function Surface({ owner }: { readonly owner: Owner }) {
  useSyncExternalStore(owner.subscribe, owner.getSnapshot, owner.getSnapshot);
  const model = useDataTable(owner.D, owner.options());
  return (
    <DataTable table={model} collection={collection} reordering={reordering} />
  );
}

export function mountGroupedDataTable(
  container: HTMLElement,
  options: { readonly deferred?: boolean } = {},
) {
  const owner = createOwner();
  const effects = { setup: 0, cleanup: 0 };
  function Application() {
    const [shown, setShown] = useState(!options.deferred);
    useEffect(() => {
      effects.setup++;
      return () => {
        effects.cleanup++;
      };
    }, []);
    const visibility = (account: boolean) =>
      owner.C.dispatch({
        type: "columns.visibility",
        update: (current) => ({ ...current, account }),
      });
    return (
      <main aria-label="Grouped DataTable fixture">
        <button type="button" onClick={() => setShown(!shown)}>
          {shown ? "Unmount table" : "Mount table"}
        </button>
        <button type="button" onClick={() => visibility(false)}>
          Hide Account
        </button>
        <button type="button" onClick={() => visibility(true)}>
          Show Account
        </button>
        <button type="button" onClick={() => owner.replaceRecords()}>
          Replace synthetic records
        </button>
        <button type="button" onClick={() => owner.revokeSource()}>
          Revoke source
        </button>
        <button type="button" onClick={() => owner.revokePublication()}>
          Retire publication
        </button>
        {shown ? <Surface owner={owner} /> : null}
      </main>
    );
  }
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <Application />
    </StrictMode>,
  );
  const api = {
    state: () => ({ ...owner.state(), effects: { ...effects } }),
    dispose() {
      root.unmount();
      owner.P.dispose();
      owner.C.dispose();
      if (window.groupedDataTable === api) delete window.groupedDataTable;
    },
  };
  window.groupedDataTable = api;
  return api;
}

declare global {
  interface Window {
    groupedDataTable?: ReturnType<typeof mountGroupedDataTable>;
  }
}

// MAIN supplies browser.html, Vite aliases/styles/config/port (6570 reserved).
// Selected entry imports mountGroupedDataTable and calls it ONCE with #root and
// {deferred: new URLSearchParams(location.search).has("deferred")}; pagehide calls
// the returned dispose(). Importing this module alone mounts/runs nothing.
