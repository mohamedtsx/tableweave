import {
  beginControlsRequest,
  createResourceAdapter,
  type DataTableOptions,
  getControlsRequestBinding,
  type MutationResult,
} from "@tableweave/react";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import { createOptionSource } from "@tableweave/react/filters";
import { defineTable } from "../../packages/react/src/table/definition.js";
import { ApplicationOwner } from "../table-facade/hook/owner.js";

export interface Item {
  readonly id: string;
  readonly amount: number;
  readonly created: string;
  readonly note: string;
  readonly status: "a" | "b";
}
export const records: readonly Item[] = [
  {
    id: "one",
    amount: 1,
    created: "2030-01-10T12:34:56.789Z",
    note: "synthetic note",
    status: "a",
  },
];
export function fixture(complete = false) {
  const schema = defineQuerySchema({
    id: "facade-builder",
    version: 1,
    fields: {
      id: { type: "text", owner: "search", sort: true },
      amount: { type: "number", owner: "builder", sort: true },
      created: {
        type: "datetime",
        owner: "builder",
        operators: ["date.on", "date.between", "date.before"],
      },
      note: { type: "text", owner: "builder" },
      status: { type: "enum", owner: "builder", values: ["a", "b"] },
    },
    pagination: { enabled: !complete, defaultSize: 25, sizes: [25] },
  });
  const D = defineTable<Item>()({
    schema,
    selection: "multiple",
    getRowId: (row) => row.id,
    columns: [
      { id: "id", accessorKey: "id" },
      { id: "amount", accessorKey: "amount" },
    ],
    evaluation: {
      accessors: {
        amount: (row) => row.amount,
        created: (row) => row.created,
        note: (row) => row.note,
        status: (row) => row.status,
      },
    },
  });
  const context = {
    definitionKey: schema.id,
    scopeKey: "synthetic-builder",
    access: true,
  };
  const query = createQuery(schema, {
    locale: "en-US",
    timeZone: "UTC",
    builder: {
      join: "and",
      rules: [
        { id: "n1", field: "amount", operator: "number.eq", value: 1 },
        {
          id: "d1",
          field: "created",
          operator: "date.on",
          value: { kind: "instant", value: "2030-01-10T12:34:56.789Z" },
        },
        {
          id: "d2",
          field: "created",
          operator: "date.between",
          value: [
            { kind: "instant", value: "2030-01-10T00:00:00Z" },
            { kind: "instant", value: "2030-01-11T00:00:00Z" },
          ],
        },
        {
          id: "t1",
          field: "note",
          operator: "text.contains",
          value: "synthetic",
        },
        {
          id: "c1",
          field: "status",
          operator: "enum.anyOf",
          value: ["a", "b"],
        },
      ],
    },
  });
  const app = new ApplicationOwner(
    D,
    context,
    { query, selection: { one: true } },
    () => Date.UTC(2030, 0, 10, 12),
  );
  app.prepare();
  if (app.settle().status !== "settled")
    throw new Error("Actual initial publication required");
  const resource = createResourceAdapter<
      Item,
      ReturnType<typeof app.C.getSnapshot>["query"]
    >(context),
    disconnect = resource.connect();
  const started = complete
    ? beginControlsRequest(D.native, app.C, resource, {
        ...context,
        queryKey: app.C.getSnapshot().queryIdentity,
        requestKey: "synthetic-complete-1",
        extent: { kind: "complete" },
      })
    : null;
  if (complete && !started) throw new Error("Actual complete binding required");
  if (started)
    resource.succeed(started.request, {
      records,
      source: "fresh",
      page: { kind: "known", total: 1 },
      emptyKind: "unknown",
      receivedAt: "2030-01-10T12:00:00Z",
    });
  const counts = { transport: 0, invalidation: 0, mutation: 0 };
  const faults = { resetRefusal: false };
  const invalidationOrigins: object[] = [];
  const options = createOptionSource<string>(
    { ...context, fieldId: "status" },
    {
      onInvalidate(event) {
        counts.invalidation++;
        invalidationOrigins.push(event.previous);
        if (faults.resetRefusal)
          throw new Error("Synthetic application reset refusal");
        return undefined;
      },
    },
  );
  function observe(result: MutationResult<typeof schema>) {
    counts.mutation++;
    app.pending = result.status === "proposed" ? result.proposal : null;
  }
  return {
    D,
    schema,
    app,
    context,
    resource,
    options,
    counts,
    faults,
    invalidationOrigins,
    observe,
    input(): DataTableOptions<typeof schema, Item> {
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
      options.dispose();
      disconnect();
      resource.dispose();
      app.P.dispose();
      app.C.dispose();
    },
  };
}
export type Fixture = ReturnType<typeof fixture>;
export type S = Fixture["schema"];
export function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error("Actual fixture value missing");
  return value;
}
