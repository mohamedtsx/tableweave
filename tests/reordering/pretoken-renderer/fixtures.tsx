import {
  beginControlsRequest,
  createCriteriaPublication,
  createResourceAdapter,
  defineTable,
  getControlsRequestBinding,
  requireDataTableModel,
  useDataTable,
  type DataTableModel,
  type DataTableOptions,
  type NativeRow,
  type StateProposal,
  type ResourceRequest,
} from "@tableweave/react";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import { createReorderController } from "@tableweave/react/reordering-controller";
import type { RowMoveOperation } from "@tableweave/react/reordering";
import { StrictMode, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { DataTable } from "../../../packages/heroui/src/data-table/data-table.js";
import {
  englishDataTableLocale,
  arabicDataTableLocale,
} from "../../../packages/heroui/src/localization/data-table.js";
import {
  createDataTableRendererCell,
  requireTableRendererTarget,
} from "../../../packages/heroui/src/table/renderer-commit.js";
import { TableRendererCollection } from "../../../packages/heroui/src/table/renderer-collection.js";
import { TableReorderingHost } from "../../../packages/heroui/src/table/reordering-host.js";
import { DataTableState } from "../../../packages/heroui/src/data-table/state.js";
import {
  captureTableNavigation,
  getTableReorderingBinding,
  publishTableReordering,
  reorderingSnapshot,
  navigateTable,
} from "../../../packages/heroui/src/table/reordering-binding.js";
import {
  issueNativeRow,
  nativeRowRef,
  nativeRefStatus,
} from "../../../packages/heroui/src/table/native-resource-lifetime.js";
import type {
  TableRendererTarget,
  TableRendererConfig,
  TableRendererLease,
} from "../../../packages/heroui/src/table/types.js";

export interface Item {
  id: string;
  title: string;
  amount: number;
  note: string;
}
export function createFixture(
  options: {
    rows?: boolean;
    unpaged?: boolean;
    grouped?: boolean;
    remote?: boolean;
  } = {},
) {
  const schema = defineQuerySchema({
    id: "pretoken-renderer",
    version: 1,
    fields: {
      title: { type: "text", owner: "search", sort: true },
      amount: { type: "number", owner: "none", sort: true },
    },
    pagination: { enabled: !options.unpaged, defaultSize: 10, sizes: [10, 25] },
  });
  let records: Item[] = Array.from({ length: 11 }, (_, i) => ({
    id: `row-${i}`,
    title: `Record ${i}`,
    amount: i,
    note: `Note ${i}`,
  }));
  const counts = {
    metadata: 0,
    eligibility: 0,
    text: 0,
    body: 0,
    state: 0,
    notifications: 0,
  };
  const trace: string[] = [];
  let onMetadata: (() => void) | null = null,
    onEligible: ((row: NativeRow<Item>) => boolean) | null = null;
  const leaves = [
    {
      id: "title",
      accessorKey: "title" as const,
      header: "Record",
      cell: ({ row }: { row: NativeRow<Item> }) => {
        counts.body++;
        return (
          <>
            <span>{row.original.title}</span>
            <input
              aria-label={`Draft ${row.id}`}
              defaultValue="Retained native draft"
            />
          </>
        );
      },
    },
    { id: "amount", accessorKey: "amount" as const, header: "Amount" },
    { id: "note", accessorKey: "note" as const, header: "Note" },
  ];
  const D = defineTable<Item>()({
    schema,
    getRowId: (item) => item.id,
    selection: "multiple",
    isRowSelectable: (row) => row.id !== "row-1",
    reordering: { rows: options.rows !== false, columns: true },
    columns: [
      {
        id: "select",
        header: "Selection",
        meta: { utility: true },
        cell: () => null,
      },
      ...(options.grouped
        ? [{ id: "group", header: "Records", columns: leaves }]
        : leaves),
      {
        id: "action",
        header: "Action",
        meta: { utility: true },
        cell: () => <button type="button">Application action</button>,
      },
    ],
  });
  type S = typeof schema;
  const metadata = {
    ownerEpoch: 0,
    sourceVersion: 0,
    revision: 0,
    baseRevision: "0",
  };
  let proposal: StateProposal<S> | null = null;
  const controllerOptions = {
    initial: {
      query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
    },
    now: () => 0,
    controlled: ["columns"] as const,
    onRequest(value: StateProposal<S>) {
      proposal = value;
    },
  };
  const helperOptions = {
    controller: controllerOptions,
    instanceId: "pretoken-app",
    readCurrent() {
      counts.metadata++;
      trace.push("metadata");
      onMetadata?.();
      return { ...metadata };
    },
    isRowMovable(row: NativeRow<Item>) {
      counts.eligibility++;
      trace.push("eligibility");
      return onEligible?.(row) ?? true;
    },
  };
  const helper =
    options.rows === false ? null : createReorderController(D, helperOptions);
  const C = helper?.controller ?? D.createController(controllerOptions),
    lease = helper?.admission.mount() ?? null;
  const context = {
    definitionKey: schema.id,
    scopeKey: "synthetic-pretoken",
    access: true,
  };
  let initial = true;
  const P = createCriteriaPublication({
    controller: C,
    definition: C.getDefinition(),
    retirement: {
      retire() {
        if (!initial)
          throw Error("Fixture only certifies its initial publication");
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
    P.complete(pending.ticket).status !== "settled"
  )
    throw Error("Real settled publication required");
  type Q = ReturnType<typeof C.getSnapshot>["query"];
  const resource = createResourceAdapter<Item, Q>(context),
    stopResource = resource.connect();
  let request: ResourceRequest<Q> | null = null,
    acceptedRequest: ResourceRequest<Q> | null = null,
    serial = 0;
  let submitted: RowMoveOperation | null = null,
    receivedThis: unknown = null;
  let onNotify: ((operation: RowMoveOperation) => unknown) | null = null;
  const rowConfig =
    helper && lease
      ? {
          admission: helper.admission,
          lease,
          handleColumnId: "title",
          onSubmit(operation: RowMoveOperation) {
            receivedThis = this;
            counts.notifications++;
            trace.push("notification");
            submitted = operation;
            return onNotify?.(operation);
          },
        }
      : null;
  const collection = {
    label: "Pretoken synthetic table",
    rowHeaderColumnId: "title",
    selectionColumnId: "select",
    rowTextValue(row: NativeRow<Item>) {
      counts.text++;
      return row.id;
    },
    columnTextValue(column: { id: string }) {
      counts.text++;
      return column.id;
    },
    cellTextValue(cell: { row: NativeRow<Item>; column: { id: string } }) {
      counts.text++;
      return `${cell.row.id}:${cell.column.id}`;
    },
  };
  const config: TableRendererConfig<S, Item> = {
    collection,
    reordering: { columns: true, ...(rowConfig ? { rows: rowConfig } : {}) },
    renderState() {
      counts.state++;
      return <p>Application state</p>;
    },
  };
  const criteria = () => {
    const current = P.getSnapshot().current;
    if (!current) throw Error("Real current P required");
    return P.issue({
      controller: C,
      definition: C.getDefinition(),
      context: current.expected,
      epoch: current.epoch,
    });
  };
  const binding = (token: ResourceRequest<Q> | null) =>
    token ? getControlsRequestBinding(D.native, C, resource, token) : null;
  return {
    D,
    C,
    P,
    schema,
    helper,
    lease,
    resource,
    get records() {
      return records;
    },
    metadata,
    counts,
    trace,
    rowConfig,
    collection,
    config,
    options(): DataTableOptions<S, Item> {
      const view = resource.getSnapshot();
      return {
        controller: C,
        publication: P,
        criteria: criteria(),
        expected: context,
        manualOrder: true,
        source: options.remote
          ? {
              mode: options.unpaged ? "server-complete" : "server",
              resource,
              view,
              bindings: {
                request: binding(view.request),
                snapshot: binding(acceptedRequest),
              },
            }
          : { mode: "client", context, records },
      };
    },
    start() {
      const value = beginControlsRequest(D.native, C, resource, {
        ...context,
        queryKey: C.getSnapshot().queryIdentity,
        requestKey: `pretoken-${++serial}`,
        extent: options.unpaged
          ? { kind: "complete" }
          : { kind: "page", ...C.getSnapshot().query.pagination },
      });
      if (!value) throw Error("Actual resource request required");
      request = value.request;
      return request;
    },
    succeed() {
      if (!request) throw Error("Actual request required");
      const current = request;
      acceptedRequest = current;
      return resource.succeed(current, {
        source: "fresh",
        records: options.unpaged ? records : records.slice(0, 10),
        page: { kind: "known", total: records.length },
        emptyKind: "unknown",
        receivedAt: "2026-11-25T00:00:00Z",
      });
    },
    setMetadataHook(hook: (() => void) | null) {
      onMetadata = hook;
    },
    setEligibilityHook(hook: ((row: NativeRow<Item>) => boolean) | null) {
      onEligible = hook;
    },
    setNotify(hook: ((operation: RowMoveOperation) => unknown) | null) {
      onNotify = hook;
    },
    operation: () => submitted,
    publishAppliedSource() {
      // Explicit synthetic application producer event, not renderer inference,
      // transport success or an invented library/backend revision.
      if (!submitted) throw Error("Transferred application operation required");
      const moved = records.find((row) => row.id === submitted?.move.movedId);
      if (!moved) throw Error("Application source member required");
      const rest = records.filter((row) => row !== moved),
        before = submitted.move.beforeId;
      const index =
        before === null
          ? rest.length
          : rest.findIndex((row) => row.id === before);
      if (index < 0) throw Error("Application source anchor required");
      records = [...rest.slice(0, index), moved, ...rest.slice(index)];
      metadata.sourceVersion++;
      metadata.revision++;
      metadata.baseRevision = String(metadata.revision);
    },
    receiverMatches: () => receivedThis === rowConfig,
    acceptColumns() {
      if (!proposal) throw Error("Actual controlled proposal required");
      const value = proposal;
      proposal = null;
      return C.accept(value);
    },
    dispose() {
      stopResource();
      resource.dispose();
      P.dispose();
      if (helper && lease) helper.admission.disconnect(lease);
      helper?.admission.dispose();
      C.dispose();
    },
  };
}
export type Fixture = ReturnType<typeof createFixture>;
export type Model = DataTableModel<Fixture["schema"], Item>;
export type Target = TableRendererTarget<Fixture["schema"], Item>;
/** Actual useDataTable + registered R/core/N + production native compounds. */
export function mountDirect(f = createFixture({ unpaged: true })) {
  const container = document.createElement("section");
  document.body.append(container);
  const root = createRoot(container);
  let model: Model | null = null,
    target: Target | null = null,
    lease: TableRendererLease<Fixture["schema"], Item> | null = null;
  let cell: Target["cell"] | null = null,
    renders = 0;
  let saved: ReturnType<typeof nativeRowRef<Fixture["schema"], Item>> | null =
    null;
  let savedCleanup: (() => void) | null = null,
    shown = true;
  function Source() {
    const value = useDataTable(f.D, f.options());
    model = value;
    const [native] = useState(() => createDataTableRendererCell(value));
    cell = native;
    const [visible, setVisible] = useState<Target | null>(null);
    useLayoutEffect(() => {
      const token = native.connect();
      lease = token;
      return () => {
        native.disconnect(token);
        if (lease === token) lease = null;
      };
    }, [native]);
    useLayoutEffect(() => {
      if (!lease) return;
      try {
        requireDataTableModel(value, f.D);
        if (!value.sourceTarget) return;
        if (
          f.helper &&
          f.lease &&
          value.phase === "display" &&
          !value.presentation?.busy &&
          !value.presentation?.stale
        )
          f.helper.admission.commitModel(f.lease, value);
        const actor = native.commit(lease, value, f.config),
          next = { cell: native, actor };
        publishTableReordering(next);
        target = next;
        setVisible(next);
      } catch {
        /* Genuine waits/denials do not authorize fallback model/actors. */
      }
    }, [native, value]);
    renders++;
    return visible && shown ? (
      <>
        <TableReorderingHost target={visible} />
        <DataTableState target={visible} />
        <TableRendererCollection target={visible} />
      </>
    ) : null;
  }
  const render = () =>
    flushSync(() =>
      root.render(
        <StrictMode>
          <Source />
        </StrictMode>,
      ),
    );
  render();
  const requireTarget = () => {
    if (!target || !cell || !lease || !model)
      throw Error("Actual mounted renderer required");
    return { target, cell, lease, model };
  };
  return {
    f,
    container,
    render,
    requireTarget,
    status() {
      const value = requireTarget(),
        binding = getTableReorderingBinding(value.target);
      return {
        phase: value.model.phase,
        ready: binding ? reorderingSnapshot(binding).ready : false,
        notifications: f.counts.notifications,
        pending:
          (f.helper?.admission.getSnapshot().moves.pending ?? null) !== null,
        rows: container.querySelectorAll("tbody tr").length,
        renders,
      };
    },
    update() {
      const value = requireTarget();
      value.cell.updateModel(value.lease, value.model);
    },
    replace(fail = false, columnsOnly = false) {
      const value = requireTarget();
      const config = columnsOnly
        ? { ...f.config, reordering: { columns: true as const } }
        : f.config;
      return value.cell.commit(
        value.lease,
        value.model,
        fail
          ? {
              ...config,
              collection: {
                ...f.collection,
                get label(): string {
                  throw Error("Synthetic failed B capture");
                },
              },
            }
          : config,
      );
    },
    disconnect() {
      const value = requireTarget();
      value.cell.disconnect(value.lease);
    },
    async p2Reject() {
      const current = requireTarget(),
        base = f.options(),
        context = base.expected;
      const P2 = createCriteriaPublication({
        controller: f.C,
        definition: f.C.getDefinition(),
        retirement: { retire: () => undefined },
      });
      const pending = P2.begin({
        controller: f.C,
        definition: f.C.getDefinition(),
        expected: context,
        actual: context,
      });
      if (
        pending.status !== "pending" ||
        P2.complete(pending.ticket).status !== "settled"
      )
        throw Error("Actual P2 required");
      const frame = P2.getSnapshot().current;
      if (!frame) throw Error("Actual P2 current required");
      const criteria = P2.issue({
        controller: f.C,
        definition: f.C.getDefinition(),
        context: frame.expected,
        epoch: frame.epoch,
      });
      const node = document.createElement("section"),
        probe = createRoot(node);
      document.body.append(node);
      let localeReads = 0;
      let resolve:
        | ((result: {
            denied: boolean;
            localeReads: number;
            genuineP2: boolean;
          }) => void)
        | null = null;
      const answer = new Promise<{
        denied: boolean;
        localeReads: number;
        genuineP2: boolean;
      }>((done) => {
        resolve = done;
      });
      function Foreign() {
        const model = useDataTable(f.D, { ...base, publication: P2, criteria });
        useLayoutEffect(() => {
          if (model.phase !== "display" || !model.sourceTarget) return;
          requireDataTableModel(model, f.D);
          let denied = false;
          try {
            current.cell.commit(current.lease, model, {
              ...f.config,
              get locale(): typeof englishDataTableLocale {
                localeReads++;
                throw Error("Private P2 locale must not be entered");
              },
            });
          } catch {
            denied = true;
          }
          resolve?.({
            denied,
            localeReads,
            genuineP2: model.sourceTarget.owner.publication === P2,
          });
        }, [model]);
        return null;
      }
      try {
        flushSync(() => probe.render(<Foreign />));
        return await answer;
      } finally {
        flushSync(() => probe.unmount());
        node.remove();
        P2.dispose();
      }
    },
    detachRow() {
      const value = requireTarget(),
        row = requireTableRendererTarget(value.target).model.view?.rows[0];
      if (!row) throw Error("Actual row required");
      const ticket = issueNativeRow(value.target, row);
      saved = nativeRowRef(ticket);
      saved(null);
      return nativeRefStatus(ticket);
    },
    saveCleanup() {
      const value = requireTarget(),
        row = requireTableRendererTarget(value.target).model.view?.rows[0],
        node = container.querySelector<HTMLTableRowElement>("tbody tr");
      if (!row || !node) throw Error("Mounted row required");
      saved = nativeRowRef(issueNativeRow(value.target, row));
      const cleanup = saved(node);
      savedCleanup = typeof cleanup === "function" ? cleanup : null;
    },
    staleCleanup() {
      savedCleanup?.();
      saved?.(null);
    },
    navigation(value: unknown, intent: "index" | "size" = "index") {
      const current = requireTarget(),
        binding = getTableReorderingBinding(current.target);
      if (!binding) throw Error("Actual binding required");
      const token = captureTableNavigation(binding),
        authority = current.model.authority;
      if (!token || !authority) throw Error("Actual navigation required");
      return () => navigateTable(token, authority, intent, value);
    },
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
      f.dispose();
    },
  };
}
export function mountDataTable(f = createFixture(), arabic = false) {
  const container = document.createElement("section");
  document.body.append(container);
  const root = createRoot(container);
  let shown = true,
    model: Model | null = null;
  function Source() {
    const value = useDataTable(f.D, f.options());
    model = value;
    const [published, setPublished] = useState<Model | null>(null);
    const displayReady =
      value.phase === "display" &&
      !value.presentation?.busy &&
      !value.presentation?.stale;
    useLayoutEffect(() => {
      if (
        f.helper &&
        f.lease &&
        value.phase === "display" &&
        !value.presentation?.busy &&
        !value.presentation?.stale
      )
        f.helper.admission.commitModel(f.lease, value);
      if (displayReady)
        setPublished((previous) => (previous === value ? previous : value));
    }, [value, displayReady]);
    return shown && (!displayReady || published === value) ? (
      <DataTable
        table={value}
        {...f.config}
        collection={f.collection}
        locale={arabic ? arabicDataTableLocale : englishDataTableLocale}
      />
    ) : null;
  }
  const render = () =>
    flushSync(() =>
      root.render(
        <StrictMode>
          <Source />
        </StrictMode>,
      ),
    );
  render();
  return {
    f,
    container,
    render,
    model: () => model,
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
      f.dispose();
    },
  };
}
