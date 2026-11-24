import { createQuery } from "../../../packages/react/src/contracts/query.js";
import { defineQuerySchema } from "../../../packages/react/src/contracts/schema.js";
import type { QueryFor } from "../../../packages/react/src/contracts/types.js";
import {
  createOperatorRegistry,
  defineOperator,
} from "../../../packages/react/src/filters/registry.js";
import {
  beginControlsRequest,
  getControlsRequestBinding,
} from "../../../packages/react/src/presentation/binding.js";
import {
  captureCriteriaSourceFrameInput,
  createCriteriaFrames,
} from "../../../packages/react/src/presentation/criteria-frame.js";
import { createResourceAdapter } from "../../../packages/react/src/resource/adapter.js";
import type {
  EmptyKind,
  PageInfo,
  ResourceRequest,
} from "../../../packages/react/src/resource/types.js";
import { defineTable } from "../../../packages/react/src/table/definition.js";
import type { DataTableOptions } from "../../../packages/react/src/table/types.js";
import { ApplicationOwner } from "./owner.js";

export interface Item {
  id: string;
  amount: number;
  title: string;
  day: string;
  eligible: boolean;
}
export const records: readonly Item[] = Array.from({ length: 173 }, (_, i) => ({
  id: `r${i}`,
  amount: i % 7,
  title: `Synthetic ${i}`,
  day: "2026-01-15",
  eligible: i % 4 !== 0,
}));
export function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error("Actual fixture value missing");
  return value;
}
export function fixture(
  enabled = true,
  filter: "none" | "custom" | "relative" = "none",
  pending = false,
) {
  const context = {
    definitionKey: "facade",
    scopeKey: "synthetic",
    access: true,
  };
  const counts = {
    rowId: 0,
    eligible: 0,
    normalize: 0,
    evaluate: 0,
    accessor: 0,
    header: 0,
  };
  const faults: { onPrivate?: () => void } = {};
  function fire(key: keyof typeof counts) {
    counts[key]++;
    faults.onPrivate?.();
  }
  const registry = createOperatorRegistry([
    defineOperator({
      id: "custom.facade",
      labelKey: "synthetic",
      types: ["number"],
      cardinality: "one",
      validate: (v: unknown): v is number => typeof v === "number",
      normalize(v: number) {
        fire("normalize");
        return v;
      },
      evaluate(value: unknown, operand: number) {
        fire("evaluate");
        return typeof value === "number" && value >= operand;
      },
    }),
  ]);
  const schema = defineQuerySchema(
    {
      id: "facade",
      version: 1,
      fields: {
        amount: {
          type: "number",
          owner: "builder",
          sort: true,
          operators: ["number.gte", "custom.facade"],
        },
        title: { type: "text", owner: "search", sort: true },
        day: { type: "date", owner: "builder" },
      },
      pagination: { enabled, defaultSize: 25, sizes: [25, 100] },
    },
    registry,
  );
  const D = defineTable<Item>()({
    schema,
    selection: "multiple",
    getRowId(row) {
      fire("rowId");
      return row.id;
    },
    isRowSelectable(row) {
      fire("eligible");
      return row.eligible;
    },
    evaluation: {
      registry,
      accessors: {
        amount(row) {
          fire("accessor");
          return row.amount;
        },
      },
    },
    columns: [
      {
        id: "amount",
        accessorFn: (row) => row.amount,
        header(ctx) {
          fire("header");
          return ctx.column.id;
        },
      },
      { id: "title", accessorKey: "title" },
      { id: "computed", accessorFn: (row) => row.title.length },
    ],
  });
  let now = Date.parse("2026-01-15T12:00:00Z");
  const query = createQuery(
    schema,
    {
      locale: "en-US",
      timeZone: "UTC",
      builder: {
        join: "and",
        rules:
          filter === "custom"
            ? [
                {
                  id: "minimum",
                  field: "amount",
                  operator: "custom.facade",
                  value: 20,
                },
              ]
            : filter === "relative"
              ? [
                  {
                    id: "today",
                    field: "day",
                    operator: "date.on",
                    value: { kind: "relative", preset: "today" },
                  },
                ]
              : [],
      },
    },
    { registry },
  );
  const app = new ApplicationOwner(
    D,
    context,
    { query, selection: { initial: true } },
    () => now,
  );
  if (pending)
    app.propose({ type: "selection.change", update: { proposed: true } });
  app.prepare();
  const resource = createResourceAdapter<Item, QueryFor<typeof schema>>(
    context,
  );
  const tokens: ResourceRequest<QueryFor<typeof schema>>[] = [];
  function start(retry?: () => void) {
    const state = app.C.getSnapshot();
    const result = required(
      beginControlsRequest(D.native, app.C, resource, {
        ...context,
        queryKey: state.queryIdentity,
        requestKey: `r-${tokens.length}`,
        extent: enabled
          ? { kind: "page", ...state.query.pagination }
          : { kind: "complete" },
        ...(retry ? { retry } : {}),
      }),
    );
    tokens.push(result.request);
    return result;
  }
  function succeed(
    request: ResourceRequest<QueryFor<typeof schema>>,
    data: readonly Item[] = enabled ? records.slice(0, 25) : records,
    emptyKind: EmptyKind = data.length ? "unknown" : "dataset",
    page: PageInfo = { kind: "known", total: data.length },
  ) {
    return resource.succeed(request, {
      source: "fresh",
      records: data,
      page,
      emptyKind,
      receivedAt: "2026-11-24T00:00:00Z",
    });
  }
  function options(
    mode: "client" | "server" | "server-complete" = "client",
    data: readonly Item[] = records,
  ): DataTableOptions<typeof schema, Item> {
    const base = {
      controller: app.C,
      publication: app.P,
      criteria: app.criteria(),
      expected: context,
      manualOrder: true,
    };
    if (mode === "client")
      return { ...base, source: { mode, context, records: data } };
    const view = resource.getSnapshot(),
      request = view.request
        ? getControlsRequestBinding(D.native, app.C, resource, view.request)
        : null;
    const snapshotToken = view.snapshot
      ? tokens.find((token) => token.generation === view.snapshot?.generation)
      : null;
    const snapshot = snapshotToken
      ? getControlsRequestBinding(D.native, app.C, resource, snapshotToken)
      : null;
    return {
      ...base,
      source: { mode, resource, view, bindings: { request, snapshot } },
    };
  }
  function frames() {
    return createCriteriaFrames({
      nativeDefinition: D.native,
      controller: app.C,
      publication: app.P,
      criteria: app.criteria(),
    });
  }
  function commit(
    mode: "client" | "server" | "server-complete" = "client",
    data: readonly Item[] = records,
  ) {
    const owner = frames(),
      capture = captureCriteriaSourceFrameInput(
        owner,
        options(mode, data),
        null,
      ),
      source = owner.commitSource(capture.input);
    const frame = capture.native
      ? owner.commit(owner.prepare(capture.native))
      : null;
    const pair = frame ? owner.issue(frame) : null;
    const presentation = pair?.controls.read() ?? null;
    return {
      owner,
      source,
      frame,
      pair,
      presentation,
      clientInputCount: capture.clientInputCount,
    };
  }
  function resetCounts() {
    for (const key of Object.keys(counts) as (keyof typeof counts)[])
      counts[key] = 0;
  }
  resetCounts();
  return {
    D,
    app,
    schema,
    resource,
    context,
    options,
    counts,
    faults,
    start,
    succeed,
    frames,
    commit,
    resetCounts,
    tick() {
      now += 86_400_000;
      app.change({ type: "clock.tick" });
    },
  };
}
export type Fixture = ReturnType<typeof fixture>;
export type Schema = Fixture["schema"];
