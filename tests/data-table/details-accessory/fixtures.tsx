import { createResourceAdapter } from "@tableweave/react";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import { DetailsTrigger } from "../../../packages/heroui/src/data-table/details-trigger.js";
import type {
  DetailsAccessoryOptions,
  DetailsAuthority,
  DetailsSource,
} from "../../../packages/heroui/src/details/types.js";
import { defineTable } from "../../../packages/react/src/table/definition.js";
import type { DataTableOptions } from "../../../packages/react/src/table/types.js";
import { ApplicationOwner } from "../../table-facade/hook/owner.js";

export interface Item {
  readonly id: string;
  readonly title: string;
}
export const schema = defineQuerySchema({
  id: "bound-details-fixture",
  version: 1,
  fields: { title: { type: "text", owner: "search", sort: true } },
  pagination: { enabled: true, defaultSize: 1, sizes: [1, 2] },
});
export type Schema = typeof schema;
export const records: readonly Item[] = [
  { id: "one", title: "Synthetic one" },
  { id: "two", title: "Synthetic two" },
];
export function fixture(unselectable = false) {
  const context = {
    definitionKey: schema.id,
    scopeKey: "synthetic",
    access: true,
  };
  const D = defineTable<Item>()({
    schema,
    details: true,
    selection: unselectable ? "multiple" : false,
    isRowSelectable: () => false,
    getRowId: (row) => row.id,
    columns: [
      { id: "title", accessorKey: "title" },
      {
        id: "detail",
        meta: { utility: true },
        cell: (ctx) => (
          <DetailsTrigger rowId={ctx.row.id} label={`Details ${ctx.row.id}`} />
        ),
      },
    ],
  });
  const app = new ApplicationOwner(
    D,
    context,
    { query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }) },
    () => 0,
  );
  app.prepare();
  app.settle();
  const resource = createResourceAdapter<
    Item,
    ReturnType<typeof app.C.getSnapshot>["query"]
  >(context);
  const disconnectResource = resource.connect();
  const detailContext = { ...context, datasetKey: "synthetic-items", epoch: 0 };
  let authority: DetailsAuthority = {
    context: detailContext,
    rowId: null,
    session: 0,
    generation: 0,
  };
  let source: DetailsSource<Item> | null = null;
  let deferred: ((value: boolean) => void) | null = null;
  let dirty = false,
    autoAccept = true;
  let retryDeferred = false,
    retryResolve: ((value: unknown) => void) | null = null;
  const counters = {
    read: 0,
    body: 0,
    header: 0,
    footer: 0,
    before: 0,
    outcome: 0,
    focus: 0,
    retry: 0,
    badReceiver: 0,
  };
  let config: DetailsAccessoryOptions<Schema, Item>;
  let body: DetailsAccessoryOptions<Schema, Item>["renderBody"] = () => null;
  function configure() {
    const port = {
      read() {
        counters.read++;
        if (this !== port) counters.badReceiver++;
        return { authority };
      },
      retry() {
        counters.retry++;
        if (this !== port) counters.badReceiver++;
        return retryDeferred
          ? new Promise<unknown>((resolve) => {
              retryResolve = resolve;
            })
          : undefined;
      },
    };
    const value: DetailsAccessoryOptions<Schema, Item> = {
      expected: authority.context,
      authority,
      source,
      title: "Synthetic record details",
      port,
      beforeChange() {
        counters.before++;
        if (this !== value) counters.badReceiver++;
        return dirty
          ? new Promise<boolean>((resolve) => {
              deferred = resolve;
            })
          : true;
      },
      onOutcome(outcome) {
        counters.outcome++;
        if (this !== value) counters.badReceiver++;
        if (outcome.status === "submitted") {
          app.pending = outcome.proposal;
          if (autoAccept) app.accept();
        }
      },
      focusFallback() {
        counters.focus++;
        if (this !== value) counters.badReceiver++;
      },
      renderBody: body,
    };
    config = value;
  }
  function sync() {
    const id = app.C.getSnapshot().details.rowId;
    if (id === authority.rowId) return;
    authority = {
      ...authority,
      rowId: id,
      session: authority.session + 1,
      generation: authority.generation + 1,
    };
    const record = records.find((r) => r.id === id);
    source =
      id === null
        ? null
        : record
          ? { authority, status: "ready", record }
          : { authority, status: "missing" };
    configure();
  }
  const stop = app.C.subscribe(sync);
  configure();
  return {
    D,
    app,
    context,
    resource,
    counters,
    modelOptions(remote = false): DataTableOptions<Schema, Item> {
      return {
        controller: app.C,
        publication: app.P,
        criteria: app.criteria(),
        expected: context,
        source: remote
          ? {
              mode: "server",
              resource,
              view: resource.getSnapshot(),
              bindings: { request: null, snapshot: null },
            }
          : { mode: "client", context, records },
      };
    },
    options: () => config,
    setBody(renderBody: DetailsAccessoryOptions<Schema, Item>["renderBody"]) {
      body = renderBody;
      configure();
    },
    setDirty(value: boolean) {
      dirty = value;
    },
    setAutoAccept(value: boolean) {
      autoAccept = value;
    },
    deferRetry() {
      retryDeferred = true;
    },
    resolveRetry() {
      const resolve = retryResolve;
      retryResolve = null;
      resolve?.(undefined);
    },
    accept() {
      app.accept();
    },
    reject() {
      if (app.pending) {
        app.C.reject(app.pending);
        app.pending = null;
      }
    },
    authority: () => authority,
    error() {
      authority = { ...authority, generation: authority.generation + 1 };
      source = { authority, status: "error", code: "offline" };
      configure();
    },
    accessLoss() {
      authority = {
        ...authority,
        context: {
          ...authority.context,
          access: false,
          epoch: authority.context.epoch + 1,
        },
      };
      configure();
    },
    sessionABA() {
      authority = { ...authority, session: authority.session + 1 };
      const old = source;
      source = old ? { ...old, authority } : null;
      configure();
    },
    resolve(value: boolean) {
      const done = deferred;
      deferred = null;
      done?.(value);
    },
    refresh() {
      authority = { ...authority, generation: authority.generation + 1 };
      const old = source;
      source =
        old?.status === "ready"
          ? {
              authority,
              status: "ready",
              record: { ...old.record, title: "Refetched synthetic" },
            }
          : old;
      configure();
    },
    optionsB() {
      configure();
    },
    dispose() {
      stop();
      disconnectResource();
      resource.dispose();
      app.P.dispose();
      app.C.dispose();
    },
  };
}
