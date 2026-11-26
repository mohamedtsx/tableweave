import {
  beginControlsRequest,
  createResourceAdapter,
  type DataTableOptions,
  getControlsRequestBinding,
  type ResourceRequest,
} from "@tableweave/react";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import { Component, forwardRef, memo } from "react";
import { DetailsTrigger } from "../../../packages/heroui/src/data-table/details-trigger.js";
import type {
  DetailsAccessoryOptions,
  DetailsAuthority,
  DetailsSource,
} from "../../../packages/heroui/src/details/types.js";
import type { TableRendererCollectionConfig } from "../../../packages/heroui/src/table/types.js";
import { defineTable } from "../../../packages/react/src/table/definition.js";
import { ApplicationOwner } from "../../table-facade/hook/owner.js";
export interface Item {
  readonly id: string;
  readonly title: string;
  readonly amount: number;
  readonly day: string;
}
export const records: readonly Item[] = [
  { id: "one", title: "Synthetic one", amount: 1, day: "2026-11-25" },
  { id: "two", title: "Synthetic two", amount: 2, day: "2026-11-24" },
];
const MemoForm = memo(function MemoForm() {
  return <input aria-label="Memo cell draft" defaultValue="Memo value" />;
});
const ForwardForm = forwardRef<HTMLInputElement, { readonly title: string }>(
  function ForwardForm({ title }, ref) {
    return (
      <input ref={ref} aria-label="Forward cell draft" defaultValue={title} />
    );
  },
);
class ClassForm extends Component<{ readonly title: string }> {
  override render() {
    return (
      <input aria-label="Class cell draft" defaultValue={this.props.title} />
    );
  }
}
export function fixture(enabled = true, configured = true) {
  const schema = defineQuerySchema({
    id: "shell-fixture",
    version: 1,
    fields: {
      title: { type: "text", owner: "search", sort: true },
      amount: { type: "number", owner: "builder", sort: true },
      day: { type: "date", owner: "date", relativePresets: ["today"] },
    },
    date: { mode: "single" },
    tabs: [
      { id: "all", rules: [] },
      { id: "active", rules: [] },
    ],
    pagination: { enabled, defaultSize: 1, sizes: [1, 2] },
  });
  const counters = {
    rows: 0,
    read: 0,
    body: 0,
    before: 0,
    outcome: 0,
    focus: 0,
    retry: 0,
    cell: 0,
  };
  const D = defineTable<Item>()({
    schema,
    details: true,
    selection: configured ? "multiple" : false,
    isRowSelectable: (row) => row.id !== "two",
    getRowId(row) {
      counters.rows++;
      return row.id;
    },
    tools: configured
      ? {
          search: "toolbar",
          columnChooser: "toolbar",
          tabs: "external",
          date: "external",
        }
      : {},
    columns: [
      {
        id: "select",
        meta: { utility: true },
        header: "Select",
        cell: () => null,
      },
      {
        id: "title",
        accessorKey: "title",
        header: "Record",
        meta: { rowHeader: true },
        cell(ctx) {
          counters.cell++;
          return (
            <>
              <span>{ctx.row.original.title}</span>
              <MemoForm />
            </>
          );
        },
      },
      {
        id: "amount",
        accessorKey: "amount",
        header: "Amount",
        cell: (ctx) => <ForwardForm title={String(ctx.row.original.amount)} />,
      },
      {
        id: "day",
        accessorKey: "day",
        header: "Day",
        cell: (ctx) => <ClassForm title={ctx.row.original.day} />,
      },
      {
        id: "details",
        meta: { utility: true },
        header: "Details",
        cell: (ctx) => (
          <DetailsTrigger rowId={ctx.row.id} label={`Details ${ctx.row.id}`} />
        ),
      },
    ],
  });
  const context = {
    definitionKey: schema.id,
    scopeKey: "synthetic-shell",
    access: true,
  };
  const app = new ApplicationOwner(
    D,
    context,
    { query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }) },
    () => 0,
  );
  app.prepare();
  app.settle();
  type S = typeof schema;
  type Q = ReturnType<typeof app.C.getSnapshot>["query"];
  const resource = createResourceAdapter<Item, Q>(context),
    stopResource = resource.connect();
  let mode: "client" | "server" | "server-complete" = "client",
    request: ResourceRequest<Q> | null = null,
    snapshot: ResourceRequest<Q> | null = null,
    version = 0;
  const detailContext = {
    ...context,
    datasetKey: "synthetic-shell-records",
    epoch: 0,
  };
  let authority: DetailsAuthority = {
      context: detailContext,
      rowId: null,
      session: 0,
      generation: 0,
    },
    source: DetailsSource<Item> | null = null,
    dirty = false,
    resolvePolicy: ((decision: boolean) => void) | null = null;
  let config: DetailsAccessoryOptions<S, Item>;
  function detailConfig() {
    const port = {
      read() {
        counters.read++;
        return { authority };
      },
      retry() {
        counters.retry++;
      },
    };
    config = {
      expected: authority.context,
      authority,
      source,
      port,
      title: "Synthetic details",
      focusFallback() {
        counters.focus++;
      },
      renderBody(ctx) {
        counters.body++;
        return (
          <form aria-label="Detail form">
            <input
              aria-label="Detail draft"
              defaultValue={ctx.record?.title ?? "Waiting"}
            />
            <button type="button" onClick={() => void ctx.requestClose()}>
              Close synthetic form
            </button>
            <output data-row-association={!!ctx.row}>
              {ctx.row ? "Exact row" : "Independent record"}
            </output>
          </form>
        );
      },
      beforeChange() {
        counters.before++;
        return dirty
          ? new Promise<boolean>((resolve) => {
              resolvePolicy = resolve;
            })
          : true;
      },
      onOutcome(outcome) {
        counters.outcome++;
        if (outcome.status === "submitted") {
          app.pending = outcome.proposal;
          app.accept();
        }
      },
    };
  }
  detailConfig();
  const stop = app.C.subscribe(() => {
    const id = app.C.getSnapshot().details.rowId;
    if (id === authority.rowId) return;
    authority = {
      ...authority,
      rowId: id,
      session: authority.session + 1,
      generation: authority.generation + 1,
    };
    const record = records.find((row) => row.id === id);
    source =
      id === null
        ? null
        : record
          ? { authority, status: "ready", record }
          : { authority, status: "missing" };
    detailConfig();
  });
  const collection: TableRendererCollectionConfig<S, Item> = {
    label: "Synthetic records",
    rowHeaderColumnId: "title",
    ...(configured ? { selectionColumnId: "select" } : {}),
    rowTextValue: (row) => row.original.title,
    columnTextValue: (column) => column.id,
    cellTextValue: (cell) => `${cell.row.original.title}: ${cell.column.id}`,
  };
  const binding = (token: ResourceRequest<Q> | null) =>
    token ? getControlsRequestBinding(D.native, app.C, resource, token) : null;
  return {
    D,
    app,
    schema,
    context,
    resource,
    counters,
    collection,
    options(): DataTableOptions<S, Item> {
      const view = resource.getSnapshot();
      return {
        controller: app.C,
        publication: app.P,
        criteria: app.criteria(),
        expected: context,
        source:
          mode === "client"
            ? { mode, context, records }
            : {
                mode,
                resource,
                view,
                bindings: {
                  request: binding(view.request),
                  snapshot: binding(
                    view.snapshot &&
                      view.snapshot.generation === snapshot?.generation
                      ? snapshot
                      : null,
                  ),
                },
              },
      };
    },
    details: () => config,
    remote(complete = false) {
      mode = complete ? "server-complete" : "server";
    },
    start() {
      const token = beginControlsRequest(D.native, app.C, resource, {
        ...context,
        queryKey: app.C.getSnapshot().queryIdentity,
        requestKey: `shell-${++version}`,
        extent:
          mode === "server-complete"
            ? { kind: "complete" }
            : {
                kind: "page",
                pageIndex: app.C.getSnapshot().query.pagination.pageIndex,
                pageSize: app.C.getSnapshot().query.pagination.pageSize,
              },
      });
      if (!token) throw new Error("Real request required");
      request = token.request;
      return token.request;
    },
    succeed(empty: "dataset" | "filtered" | "unknown" | null = null) {
      if (!request) throw new Error("Real request required");
      const first = records[0];
      if (!first) throw new Error("Synthetic record required");
      resource.succeed(request, {
        records: empty ? [] : mode === "server-complete" ? records : [first],
        source: "fresh",
        page: {
          kind: "known",
          total: empty ? 0 : mode === "server-complete" ? records.length : 7,
        },
        emptyKind: empty ?? "unknown",
        receivedAt: "2026-11-25T00:00:00Z",
      });
      snapshot = request;
    },
    fail() {
      if (!request) throw new Error("Real request required");
      resource.fail(request, "offline");
    },
    dirty(value: boolean) {
      dirty = value;
    },
    resolve(value: boolean) {
      const done = resolvePolicy;
      resolvePolicy = null;
      done?.(value);
    },
    refetch() {
      authority = { ...authority, generation: authority.generation + 1 };
      if (source?.status === "ready")
        source = {
          ...source,
          authority,
          record: { ...source.record, title: "Refetched synthetic" },
        };
      detailConfig();
    },
    optionsB() {
      detailConfig();
    },
    dispose() {
      stop();
      stopResource();
      resource.dispose();
      app.P.dispose();
      app.C.dispose();
    },
  };
}
export type Fixture = ReturnType<typeof fixture>;
export type S = Fixture["schema"];
