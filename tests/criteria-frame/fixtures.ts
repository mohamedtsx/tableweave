import { createQuery } from "../../packages/react/src/contracts/query.js";
import { defineQuerySchema } from "../../packages/react/src/contracts/schema.js";
import type { QueryFor } from "../../packages/react/src/contracts/types.js";
import type { TableCommand } from "../../packages/react/src/controller/types.js";
import {
  createOperatorRegistry,
  defineOperator,
} from "../../packages/react/src/filters/registry.js";
import {
  beginControlsRequest,
  getControlsRequestBinding,
} from "../../packages/react/src/presentation/binding.js";
import type { CriteriaFrameInput } from "../../packages/react/src/presentation/criteria-frame.js";
import { createCriteriaFrames } from "../../packages/react/src/presentation/criteria-frame.js";
import { createResourceAdapter } from "../../packages/react/src/resource/adapter.js";
import { defineNativeTable } from "../../packages/react/src/tanstack/definition.js";
import type {
  NativeColumnDef,
  NativeSelectionMode,
} from "../../packages/react/src/tanstack/types.js";
import { ApplicationOwner } from "../criteria-bootstrap/owner.js";

export interface Item {
  id: string;
  amount: number;
  title: string;
  eligible: boolean;
}
export const records: readonly Item[] = Array.from({ length: 173 }, (_, i) => ({
  id: `r${i}`,
  amount: i % 7,
  title: `title-${172 - i}`,
  eligible: i % 4 !== 0,
}));
export type CallbackName =
  | "rowId"
  | "eligible"
  | "validate"
  | "normalize"
  | "evaluate"
  | "accessor"
  | "matcher"
  | "vendor"
  | "sorting";
export function fixture(
  enabled = true,
  selection: NativeSelectionMode = "multiple",
  filter: "none" | "custom" | "search" = "none",
  sortFn?: NativeColumnDef<Item>["sortFn"],
) {
  const context = {
    definitionKey: "criteria-frame",
    scopeKey: "synthetic-domain",
    access: true,
  };
  const counts: Record<CallbackName, number> = {
    rowId: 0,
    eligible: 0,
    validate: 0,
    normalize: 0,
    evaluate: 0,
    accessor: 0,
    matcher: 0,
    vendor: 0,
    sorting: 0,
  };
  const callbacks: Partial<Record<CallbackName, () => void>> = {};
  const fire = (name: CallbackName) => {
    counts[name]++;
    callbacks[name]?.();
  };
  const registry = createOperatorRegistry([
    defineOperator({
      id: "custom.frame",
      labelKey: "synthetic.frame",
      types: ["number"],
      cardinality: "one",
      validate(value: unknown): value is number {
        fire("validate");
        return typeof value === "number";
      },
      normalize(value: number) {
        fire("normalize");
        return value;
      },
      evaluate(value: unknown, threshold: number) {
        fire("evaluate");
        return typeof value === "number" && value >= threshold;
      },
    }),
  ]);
  const schema = defineQuerySchema(
    {
      id: "criteria-frame",
      version: 1,
      fields: {
        amount: {
          type: "number",
          owner: "builder",
          sort: true,
          operators: ["number.gte", "custom.frame"],
        },
        title: { type: "text", owner: "search", sort: true },
      },
      search: { matcher: "synthetic" },
      pagination: { enabled, defaultSize: 25, sizes: [25, 100] },
      sorting: { multi: true },
    },
    registry,
  );
  type S = typeof schema;
  const definition = defineNativeTable<S, Item>({
    schema,
    selection,
    multiSort: true,
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
      searchMatchers: {
        synthetic(value, search) {
          fire("matcher");
          return typeof value === "string" && value.includes(search);
        },
      },
    },
    columns: [
      {
        id: "amount",
        accessorFn(row) {
          fire("vendor");
          return row.amount;
        },
        sortFn:
          sortFn ??
          ((a, b, column) => {
            fire("sorting");
            return Number(a.getValue(column)) - Number(b.getValue(column));
          }),
      },
      { id: "title", accessorKey: "title" },
    ],
  });
  const app = ApplicationOwner.create({
    native: definition,
    context,
    now: () => 0,
    initial: {
      query: createQuery(
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
                      id: "filter",
                      field: "amount",
                      operator: "custom.frame",
                      value: 1,
                    },
                  ]
                : [],
          },
          search: filter === "search" ? "title" : "",
        },
        { registry },
      ),
      ...(selection === false ? {} : { selection: { offscreen: true } }),
    },
  });
  const pending = app.prepareInitial();
  if (pending.status !== "pending" || !pending.snapshot.pending)
    throw new Error("Actual initial certificate missing");
  const candidate = pending.snapshot.pending;
  const initialTicket = pending.ticket;
  const initialCriteria = app.P.issue({
    controller: app.C,
    definition: app.CD,
    context: candidate.expected,
    epoch: candidate.epoch,
  });
  const frames = createCriteriaFrames({
    nativeDefinition: definition,
    controller: app.C,
    publication: app.P,
    criteria: initialCriteria,
  });
  const resource = createResourceAdapter<Item, QueryFor<S>>(context);
  const tokens: NonNullable<ReturnType<typeof resource.begin>>[] = [];
  const stopTokens = resource.subscribe(() => {
    const request = resource.getSnapshot().request;
    if (request && !tokens.includes(request)) tokens.push(request);
  });
  function settle() {
    const result = app.completeInitial(initialTicket);
    if (result.status !== "settled")
      throw new Error("Actual certified bootstrap did not settle");
    return result;
  }
  function accept(command: TableCommand<S>) {
    const result = app.propose(command);
    if (result.status === "proposed") return app.acceptPending();
    return result;
  }
  function startRemote(
    data: readonly Item[] = enabled
      ? records.slice(0, 25)
      : [...records.slice(0, 137)].reverse(),
  ) {
    const state = app.C.getSnapshot();
    const start = beginControlsRequest(definition, app.C, resource, {
      ...context,
      queryKey: "source",
      requestKey: `source-${tokens.length}`,
      extent: enabled
        ? { kind: "page", ...state.query.pagination }
        : { kind: "complete" },
    });
    if (!start) throw new Error("Real controls request missing");
    resource.succeed(start.request, {
      source: "fresh",
      records: data,
      page: { kind: "known", total: data.length },
      emptyKind: data.length ? "unknown" : "dataset",
      receivedAt: "2026-11-24T00:00:00Z",
    });
    return start;
  }
  function input(
    mode: "client" | "server" | "server-complete" = "client",
    data: readonly Item[] = records,
  ): CriteriaFrameInput<S, Item> {
    const criteria = app.authority();
    if (mode === "client")
      return {
        criteria,
        expected: context,
        source: { mode, context, records: data },
        nativeInput: { mode, records: data },
      };
    const view = resource.getSnapshot(),
      snapshot = view.snapshot,
      supplied = snapshot?.records ?? [],
      page = snapshot?.page ?? { kind: "known" as const, total: 0 };
    const requestBinding = view.request
      ? getControlsRequestBinding(definition, app.C, resource, view.request)
      : null;
    const snapshotToken = snapshot
      ? tokens.find((token) => token.generation === snapshot.generation)
      : undefined;
    const snapshotBinding = snapshotToken
      ? getControlsRequestBinding(definition, app.C, resource, snapshotToken)
      : null;
    if (mode === "server-complete" && page.kind !== "known")
      throw new Error("Complete fixture requires known page");
    return {
      criteria,
      expected: context,
      source: {
        mode,
        resource,
        view,
        bindings: { request: requestBinding, snapshot: snapshotBinding },
      },
      nativeInput:
        mode === "server-complete" && page.kind === "known"
          ? { mode, records: supplied, pageInfo: page }
          : { mode: "server", records: supplied, pageInfo: page },
    };
  }
  const reset = () => {
    for (const key of Object.keys(counts) as CallbackName[]) counts[key] = 0;
  };
  reset();
  return {
    app,
    schema,
    definition,
    frames,
    resource,
    context,
    counts,
    callbacks,
    reset,
    settle,
    initialCriteria,
    input,
    startRemote,
    accept,
    stopTokens,
    commit(
      mode: "client" | "server" | "server-complete" = "client",
      data: readonly Item[] = records,
    ) {
      return frames.commit(frames.prepare(input(mode, data)));
    },
  };
}
export function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error("Missing real fixture value");
  return value;
}
