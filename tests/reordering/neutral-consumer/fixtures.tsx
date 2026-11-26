import {
  createCriteriaPublication,
  defineTable,
  requireDataTableModel,
  useDataTable,
  type DataTableModel,
  type DataTableOptions,
  type StateProposal,
} from "@tableweave/react";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import { createReorderController } from "@tableweave/react/reordering-controller";
import { StrictMode, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { DataTable } from "../../../packages/heroui/src/data-table/data-table.js";
import {
  arabicDataTableLocale,
  englishDataTableLocale,
} from "../../../packages/heroui/src/localization/data-table.js";
import type { TableRendererCollectionConfig } from "../../../packages/heroui/src/table/types.js";
import {
  createDataTableRendererCell,
  requireTableRendererTarget,
} from "../../../packages/heroui/src/table/renderer-commit.js";
import { TableRendererCollection } from "../../../packages/heroui/src/table/renderer-collection.js";
import { TableReorderingHost } from "../../../packages/heroui/src/table/reordering-host.js";
import {
  getTableReorderingBinding,
  publishTableReordering,
  reorderingSnapshot,
} from "../../../packages/heroui/src/table/reordering-binding.js";
import {
  issueNativeRow,
  nativeRowRef,
  nativeRefStatus,
} from "../../../packages/heroui/src/table/native-resource-lifetime.js";
import type { TableRendererTarget } from "../../../packages/heroui/src/table/types.js";

export interface Item {
  readonly id: string;
  readonly title: string;
  readonly amount: number;
  readonly note: string;
}
export const records: readonly Item[] = Array.from(
  { length: 11 },
  (_, index) => ({
    id: `row-${index}`,
    title: `Record ${index}`,
    amount: index,
    note: `Note ${index}`,
  }),
);
export function fixture(rows = false, unpaged = false, grouped = false) {
  const schema = defineQuerySchema({
    id: "neutral-consumer",
    version: 1,
    fields: {
      title: { type: "text", owner: "none", sort: true },
      amount: { type: "number", owner: "none", sort: true },
    },
    pagination: { enabled: !unpaged, defaultSize: 10, sizes: [10, 25] },
  });
  const leaves = [
    {
      id: "title",
      accessorKey: "title" as const,
      header: "Record",
      cell: ({ row }: { row: { original: Item } }) => (
        <>
          <span>{row.original.title}</span>
          <input
            aria-label={`Draft ${row.original.id}`}
            defaultValue="Retained native cell"
          />
        </>
      ),
    },
    { id: "amount", accessorKey: "amount" as const, header: "Amount" },
    { id: "note", accessorKey: "note" as const, header: "Note" },
  ];
  const D = defineTable<Item>()({
    schema,
    getRowId: (record) => record.id,
    selection: false,
    reordering: { rows, columns: true },
    columns: grouped
      ? [{ id: "group", header: "Records", columns: leaves }]
      : leaves,
  });
  type S = typeof schema;
  let proposal: StateProposal<S> | null = null;
  let metadataReads = 0,
    submissions = 0;
  const options = {
    initial: {
      query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
    },
    now: () => 0,
    controlled: ["columns"] as const,
    onRequest(value: StateProposal<S>) {
      proposal = value;
    },
  };
  const helper = rows
    ? createReorderController(D, {
        controller: options,
        instanceId: "neutral-app",
        readCurrent() {
          metadataReads++;
          return {
            ownerEpoch: 0,
            sourceVersion: 0,
            revision: 0,
            baseRevision: "0",
          };
        },
      })
    : null;
  const C = helper?.controller ?? D.createController(options);
  const appLease = helper?.admission.mount() ?? null;
  const context = {
    definitionKey: schema.id,
    scopeKey: "synthetic-neutral",
    access: true,
  };
  const initialState = C.getSnapshot();
  let initial = true;
  const P = createCriteriaPublication({
    controller: C,
    definition: C.getDefinition(),
    retirement: {
      retire(event) {
        if (
          !initial ||
          event.controller !== C ||
          C.getSnapshot() !== initialState ||
          proposal !== null
        )
          throw Error("Actual initial publication certificate changed");
        initial = false;
        return undefined;
      },
    },
  });
  const pending = P.begin({
    controller: C,
    definition: C.getDefinition(),
    expected: context,
    actual: context,
  });
  if (
    pending.status !== "pending" ||
    !pending.snapshot.pending ||
    P.complete(pending.ticket).status !== "settled"
  )
    throw Error("Actual P required");
  const counts = { text: 0, format: 0 };
  const collection: TableRendererCollectionConfig<S, Item> = {
    label: "Neutral synthetic table",
    rowHeaderColumnId: "title",
    rowTextValue(row) {
      counts.text++;
      return row.id;
    },
    columnTextValue(column) {
      counts.text++;
      return column.id;
    },
    cellTextValue(cell) {
      counts.text++;
      return String(cell.getValue() ?? "");
    },
  };
  const sourceOptions = (): DataTableOptions<S, Item> => {
    const current = P.getSnapshot().current;
    if (!current) throw Error("Current P required");
    return {
      controller: C,
      publication: P,
      criteria: P.issue({
        controller: C,
        definition: C.getDefinition(),
        context: current.expected,
        epoch: current.epoch,
      }),
      expected: context,
      source: { mode: "client", context, records },
      manualOrder: true,
    };
  };
  const rowConfig =
    helper && appLease
      ? {
          admission: helper.admission,
          lease: appLease,
          handleColumnId: "title",
          onSubmit() {
            submissions++;
            throw Error("Row terminal boundary is held");
          },
        }
      : null;
  return {
    schema,
    D,
    C,
    P,
    helper,
    appLease,
    collection,
    sourceOptions,
    counts,
    rowConfig,
    metadataReads: () => metadataReads,
    submissions: () => submissions,
    proposal: () => proposal,
    accept() {
      if (!proposal) throw Error("Exact actual proposal required");
      const owned = proposal;
      proposal = null;
      return C.accept(owned);
    },
  };
}
export function mountFixture(
  rows = false,
  unpaged = false,
  grouped = false,
  arabic = false,
) {
  const f = fixture(rows, unpaged, grouped),
    container = document.createElement("section");
  document.body.append(container);
  const root = createRoot(container);
  let actual: DataTableModel<typeof f.schema, Item> | null = null;
  let shown = true;
  function Source() {
    const model = useDataTable(f.D, f.sourceOptions());
    const [committed, setCommitted] = useState<typeof model | null>(null);
    actual = model;
    useLayoutEffect(() => {
      try {
        requireDataTableModel(model, f.D);
        if (
          model.phase !== "display" ||
          !model.authority ||
          !model.view ||
          !model.frame ||
          model.presentation?.busy
        )
          return;
        if (f.helper && f.appLease)
          f.helper.admission.commitModel(f.appLease, model);
        setCommitted((previous) => (previous === model ? previous : model));
      } catch {
        /* No fake ready model. */
      }
    }, [model]);
    return committed && shown ? (
      <StrictMode>
        <DataTable
          table={committed}
          collection={f.collection}
          locale={arabic ? arabicDataTableLocale : englishDataTableLocale}
          reordering={{
            columns: true,
            ...(f.rowConfig ? { rows: f.rowConfig } : {}),
          }}
        />
      </StrictMode>
    ) : null;
  }
  const render = () => flushSync(() => root.render(<Source />));
  render();
  return {
    f,
    container,
    model: () => actual,
    render,
    hide() {
      shown = false;
      render();
    },
    show() {
      shown = true;
      render();
    },
    dispose() {
      flushSync(() => root.unmount());
      container.remove();
      if (f.helper && f.appLease) f.helper.admission.disconnect(f.appLease);
      CDispose();
    },
  };
  function CDispose() {
    f.P.dispose();
    f.helper?.admission.dispose();
    f.C.dispose();
  }
}

/** Real cached native collection, with an ordinary external registration sibling. */
export function mountDirectFixture() {
  const f = fixture(false, true),
    container = document.createElement("section"),
    root = createRoot(container);
  document.body.append(container);
  type Target = TableRendererTarget<typeof f.schema, Item>;
  let current: Target | null = null,
    repaint: (() => void) | null = null;
  let old: ReturnType<typeof issueNativeRow<typeof f.schema, Item>> | null =
    null;
  let priorPass: object | null = null,
    renders = 0;
  const config = {
    collection: { ...f.collection, label: "Direct cached refs" },
    reordering: { columns: true as const },
  };
  function Direct() {
    const model = useDataTable(f.D, f.sourceOptions());
    const [cell] = useState(() => createDataTableRendererCell(model));
    const [target, setTarget] = useState<Target | null>(null),
      [, setPass] = useState(0);
    const [life] = useState<{ lease: ReturnType<typeof cell.connect> | null }>(
      () => ({ lease: null }),
    );
    repaint = () => setPass((pass) => pass + 1);
    useLayoutEffect(() => {
      const lease = cell.connect();
      life.lease = lease;
      return () => {
        cell.disconnect(lease);
        life.lease = null;
      };
    }, [cell, life]);
    useLayoutEffect(() => {
      try {
        requireDataTableModel(model, f.D);
        if (model.phase !== "display" || !life.lease) return;
        const actor = cell.commit(life.lease, model, config),
          value = { cell, actor };
        publishTableReordering(value);
        current = value;
        setTarget(value);
      } catch {
        /* Genuine Strict/source waiting only; no fake model. */
      }
    }, [cell, life, model]);
    renders++;
    return target ? (
      <>
        <TableReorderingHost target={target} />
        <TableRendererCollection target={target} />
      </>
    ) : null;
  }
  flushSync(() =>
    root.render(
      <StrictMode>
        <Direct />
      </StrictMode>,
    ),
  );
  return {
    f,
    container,
    retireAndReplay() {
      if (!current || !repaint) throw Error("Actual direct renderer required");
      const value = requireTableRendererTarget(current),
        row = value.model.view?.rows[0],
        binding = getTableReorderingBinding(current);
      if (!row || !binding) throw Error("Current native row/binding required");
      old = issueNativeRow(current, row);
      priorPass = reorderingSnapshot(binding).refPass;
      const ref = nativeRowRef(old),
        node = container.querySelector<HTMLTableRowElement>("tbody tr");
      if (!node) throw Error("Real mounted tr required");
      ref(null);
      ref(node); // Ended replay must remain inert; no new incarnation.
      flushSync(repaint);
      return nativeRefStatus(old);
    },
    status() {
      if (!current) throw Error("Actual renderer required");
      const binding = getTableReorderingBinding(current);
      if (!binding) throw Error("Actual binding required");
      const snapshot = reorderingSnapshot(binding);
      const row = snapshot.ready
        ? requireTableRendererTarget(current).model.view?.rows[0]
        : null;
      return {
        ready: snapshot.ready,
        refreshed: priorPass !== null && priorPass !== snapshot.refPass,
        old: old ? nativeRefStatus(old) : null,
        fresh: row ? nativeRefStatus(issueNativeRow(current, row)) : null,
        renders,
      };
    },
  };
}
