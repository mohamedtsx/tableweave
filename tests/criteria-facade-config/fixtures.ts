import {
  beginControlsRequest,
  createResourceAdapter,
  type DataTableOptions,
  getControlsRequestBinding,
} from "@tableweave/react";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import { defineTable } from "../../packages/react/src/table/definition.js";
import { ApplicationOwner } from "../table-facade/hook/owner.js";
export interface Item {
  readonly id: string;
  readonly amount: number;
  readonly otherAmount: number;
  readonly title: string;
  readonly day: string;
}
export const records: readonly Item[] = [
  {
    id: "one",
    amount: 1,
    otherAmount: 2,
    title: "Synthetic one",
    day: "2026-11-25",
  },
];
export function fixture(complete = false) {
  const schema = defineQuerySchema({
    id: "facade-source",
    version: 1,
    fields: {
      amount: { type: "number", owner: "builder", sort: true },
      otherAmount: { type: "number", owner: "builder" },
      title: { type: "text", owner: "search" },
      day: { type: "date", owner: "date", relativePresets: ["today"] },
    },
    date: { mode: "single" },
    tabs: [
      { id: "all", rules: [] },
      { id: "active", rules: [] },
    ],
    pagination: { enabled: !complete, defaultSize: 25, sizes: [25] },
  });
  const D = defineTable<Item>()({
    selection: "multiple",
    schema,
    getRowId: (row) => row.id,
    columns: [
      { id: "amount", accessorKey: "amount" },
      { id: "title", accessorKey: "title" },
    ],
  });
  const context = {
    definitionKey: schema.id,
    scopeKey: "synthetic",
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
  const resource = createResourceAdapter<
      Item,
      ReturnType<typeof app.C.getSnapshot>["query"]
    >(context),
    disconnect = resource.connect();
  const started = complete
    ? beginControlsRequest(D.native, app.C, resource, {
        ...context,
        queryKey: app.C.getSnapshot().queryIdentity,
        requestKey: "complete-1",
        extent: { kind: "complete" },
      })
    : null;
  if (complete && !started) throw new Error("Actual complete request required");
  if (started)
    resource.succeed(started.request, {
      records,
      source: "fresh",
      page: { kind: "known", total: 1 },
      emptyKind: "unknown",
      receivedAt: "2026-11-25T00:00:00Z",
    });
  return {
    D,
    app,
    resource,
    context,
    schema,
    options(): DataTableOptions<typeof schema, Item> {
      const base = {
        controller: app.C,
        publication: app.P,
        criteria: app.criteria(),
        expected: context,
      };
      if (!complete)
        return { ...base, source: { mode: "client", context, records } };
      const binding = started
        ? getControlsRequestBinding(D.native, app.C, resource, started.request)
        : null;
      return {
        ...base,
        source: {
          mode: "server-complete",
          resource,
          view: resource.getSnapshot(),
          bindings: { request: binding, snapshot: binding },
        },
      };
    },
    dispose() {
      disconnect();
      resource.dispose();
      app.P.dispose();
      app.C.dispose();
    },
  };
}
export type S = ReturnType<typeof fixture>["schema"];
