import { createQuery } from "../../../packages/react/src/contracts/query.js";
import { defineQuerySchema } from "../../../packages/react/src/contracts/schema.js";
import type { QueryFor } from "../../../packages/react/src/contracts/types.js";
import {
  createOperatorRegistry,
  defineOperator,
} from "../../../packages/react/src/filters/registry.js";
import { createControlsAuthority } from "../../../packages/react/src/presentation/authority.js";
import {
  beginControlsRequest,
  getControlsRequestBinding,
} from "../../../packages/react/src/presentation/binding.js";
import { projectControls } from "../../../packages/react/src/presentation/project.js";
import type {
  ControlsInput,
  ControlsRequestInput,
} from "../../../packages/react/src/presentation/types.js";
import { createResourceAdapter } from "../../../packages/react/src/resource/adapter.js";
import type {
  PageInfo,
  ResourceRequest,
} from "../../../packages/react/src/resource/types.js";
import { createNativeAdapter } from "../../../packages/react/src/tanstack/adapter.js";
import { createNativeBoundary } from "../../../packages/react/src/tanstack/boundary.js";
import {
  createNativeController,
  defineNativeTable,
} from "../../../packages/react/src/tanstack/definition.js";
import type {
  NativeInput,
  NativeSelectionMode,
} from "../../../packages/react/src/tanstack/types.js";

export interface Item {
  id: string;
  amount: number;
  title: string;
  eligible: boolean;
}
export const records: Item[] = Array.from({ length: 173 }, (_, i) => ({
  id: `r${i}`,
  amount: i % 7,
  title: `title-${172 - i}`,
  eligible: i % 4 !== 0,
}));
export const context = Object.freeze({
  definitionKey: "u4-definition",
  scopeKey: "u4-scope",
  access: true,
});
export function fixture(
  enabled = false,
  options: {
    filtered?: boolean;
    sorted?: boolean;
    custom?: boolean;
    selection?: NativeSelectionMode;
    pageIndex?: number;
  } = {},
) {
  const calls = {
    rowId: 0,
    eligible: 0,
    accessor: 0,
    predicate: 0,
    normalize: 0,
    clock: 0,
  };
  let onNormalize: (() => void) | undefined;
  const registry = createOperatorRegistry([
    defineOperator({
      id: "custom.u4",
      labelKey: "synthetic.u4",
      types: ["number"],
      cardinality: "one",
      validate(value: unknown): value is number {
        return typeof value === "number";
      },
      normalize(value: number) {
        calls.normalize++;
        onNormalize?.();
        return value;
      },
      evaluate(value: unknown, threshold: number) {
        calls.predicate++;
        return typeof value === "number" && value >= threshold;
      },
    }),
  ]);
  const schema = defineQuerySchema(
    {
      id: "u4-complete",
      version: 1,
      fields: {
        amount: {
          type: "number",
          owner: "builder",
          sort: true,
          operators: ["number.gte", "custom.u4"],
        },
        title: { type: "text", owner: "search", sort: true },
      },
      pagination: { enabled, defaultSize: 25, sizes: [25, 100] },
      sorting: { multi: true },
    },
    registry,
  );
  type S = typeof schema;
  const definition = defineNativeTable<S, Item>({
    schema,
    selection: options.selection ?? "multiple",
    multiSort: true,
    getRowId(row) {
      calls.rowId++;
      return row.id;
    },
    isRowSelectable(row) {
      calls.eligible++;
      return row.eligible;
    },
    evaluation: {
      registry,
      accessors: {
        amount(row) {
          calls.predicate++;
          return row.amount;
        },
      },
    },
    columns: [
      {
        id: "amount",
        accessorFn(row) {
          calls.accessor++;
          return row.amount;
        },
      },
      { id: "title", accessorKey: "title" },
    ],
  });
  let now = 0;
  const controller = createNativeController(definition, {
    now() {
      calls.clock++;
      return now;
    },
    initial: {
      query: createQuery(
        schema,
        {
          locale: "en-US",
          timeZone: "UTC",
          builder: {
            join: "and",
            rules:
              options.filtered || options.custom
                ? [
                    {
                      id: "positive",
                      field: "amount",
                      operator: options.custom ? "custom.u4" : "number.gte",
                      value: 1,
                    },
                  ]
                : [],
          },
          sorting: options.sorted
            ? [
                { id: "amount", desc: true },
                { id: "title", desc: false },
              ]
            : [],
          pagination: { pageIndex: options.pageIndex ?? 0, pageSize: 25 },
        },
        { registry },
      ),
      ...(options.selection === false
        ? {}
        : { selection: { offscreen: true } }),
    },
  });
  const adapter = createNativeAdapter(definition, controller),
    boundary = createNativeBoundary(definition, controller);
  const resource = createResourceAdapter<Item, QueryFor<S>>(context);
  let committed: ControlsInput<S, Item>;
  const reset = () => {
    for (const key of Object.keys(calls) as (keyof typeof calls)[])
      calls[key] = 0;
  };
  function begin(
    key = "same",
    retry?: (request: ResourceRequest<QueryFor<S>>) => void,
    explicit = !enabled,
  ) {
    const state = controller.getSnapshot();
    return beginControlsRequest(definition, controller, resource, {
      ...context,
      queryKey: key,
      requestKey: key,
      ...(explicit
        ? {
            extent: enabled
              ? { kind: "page", ...state.query.pagination }
              : { kind: "complete" },
          }
        : {}),
      ...(retry ? { retry } : {}),
    });
  }
  function succeed(
    request: ResourceRequest<QueryFor<S>>,
    supplied: readonly Item[] = records,
    page: PageInfo = { kind: "known", total: supplied.length },
  ) {
    return resource.succeed(request, {
      source: "fresh",
      records: supplied,
      page,
      emptyKind: supplied.length ? "unknown" : "dataset",
      receivedAt: "2026-11-24T00:00:00Z",
    });
  }
  function native(input: NativeInput<Item>) {
    const frame = boundary.prepare(input, controller.getSnapshot());
    boundary.commit(frame);
    return boundary.getView(frame);
  }
  function remote(
    mode: "server" | "server-complete" = enabled ? "server" : "server-complete",
  ): ControlsInput<S, Item> {
    const view = resource.getSnapshot(),
      snapshot = view.snapshot;
    const data = snapshot?.records ?? [],
      page = snapshot?.page ?? { kind: "known" as const, total: 0 };
    if (mode === "server-complete" && page.kind !== "known")
      throw new Error("Complete fixture requires known total");
    const nativeInput: NativeInput<Item> =
      mode === "server-complete" && page.kind === "known"
        ? { mode, records: data, pageInfo: page }
        : { mode: "server", records: data, pageInfo: page };
    const request = view.request;
    const binding = request
      ? getControlsRequestBinding(definition, controller, resource, request)
      : null;
    const snapshotBinding = snapshot
      ? getControlsRequestBinding(
          definition,
          controller,
          resource,
          requestFor(snapshot),
        )
      : null;
    committed = {
      native: native(nativeInput),
      expected: context,
      source: {
        mode,
        resource,
        view,
        bindings: { request: binding, snapshot: snapshotBinding },
      },
      manualOrder: true,
    };
    return committed;
  }
  // The actual snapshot carries a copied envelope, not the token identity.
  // Retain genuine tokens in this application fixture's transport/request list.
  const tokens: ResourceRequest<QueryFor<S>>[] = [];
  resource.subscribe(() => {
    const token = resource.getSnapshot().request;
    if (token && !tokens.includes(token)) tokens.push(token);
  });
  function requestFor(
    snapshot: ResourceRequest<QueryFor<S>>,
  ): ResourceRequest<QueryFor<S>> {
    const token = tokens.find(
      (item) => item.generation === snapshot.generation,
    );
    if (!token) throw new Error("Missing actual captured token");
    return token;
  }
  function client(data: readonly Item[] = records): ControlsInput<S, Item> {
    committed = {
      native: native({ mode: "client", records: data }),
      expected: context,
      source: { mode: "client", context, records: data },
      manualOrder: true,
    };
    return committed;
  }
  function authority(input: ControlsInput<S, Item> = committed) {
    const base = {
      definition,
      controller,
      queryIdentity: input.native.state.queryIdentity,
      context,
      readCommitted: () => committed,
    };
    return input.source.mode === "client"
      ? createControlsAuthority({ ...base, mode: "client" })
      : createControlsAuthority({ ...base, mode: input.source.mode, resource });
  }
  reset();
  return {
    schema,
    definition,
    controller,
    adapter,
    boundary,
    resource,
    calls,
    reset,
    begin,
    succeed,
    native,
    remote,
    client,
    authority,
    project: (input: ControlsInput<S, Item> = committed) =>
      projectControls(definition, input),
    setCommitted(input: ControlsInput<S, Item>) {
      committed = input;
    },
    setNow(value: number) {
      now = value;
    },
    onNormalize(callback?: () => void) {
      onNormalize = callback;
    },
    rawInput(extra: Partial<ControlsRequestInput<S>> = {}) {
      return { ...context, queryKey: "same", requestKey: "same", ...extra };
    },
  };
}
export function required<T>(value: T | null): T {
  if (!value) throw new Error("Missing genuine fixture result");
  return value;
}
