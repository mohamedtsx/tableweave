import {
  createQuery,
  defineQuerySchema,
} from "../../../packages/react/src/contracts/index.js";
import type { QueryFor } from "../../../packages/react/src/contracts/types.js";
import type { ControllerOptions } from "../../../packages/react/src/controller/types.js";
import { beginControlsRequest } from "../../../packages/react/src/presentation/index.js";
import type {
  ControlsInput,
  ControlsRequestBinding,
} from "../../../packages/react/src/presentation/types.js";
import { createResourceAdapter } from "../../../packages/react/src/resource/adapter.js";
import { createNativeBoundary } from "../../../packages/react/src/tanstack/boundary.js";
import {
  createNativeController,
  defineNativeTable,
} from "../../../packages/react/src/tanstack/index.js";
import type {
  NativeDefinitionInput,
  NativePageInfo,
} from "../../../packages/react/src/tanstack/types.js";

export interface RecordRow {
  id: string;
  amount: number;
  eligible: boolean;
}
export const records: readonly RecordRow[] = [
  { id: "a", amount: 1, eligible: true },
  { id: "b", amount: 2, eligible: false },
  { id: "c", amount: 3, eligible: true },
];
export const context = Object.freeze({
  definitionKey: "app:definition",
  scopeKey: "scope:one",
  access: true,
});
export const schema = defineQuerySchema({
  id: "controls",
  version: 1,
  fields: { amount: { type: "number", owner: "builder", sort: true } },
  pagination: { defaultSize: 2, sizes: [2, 10, 25] },
});
export function fixture(
  selection: NativeDefinitionInput<
    typeof schema,
    RecordRow
  >["selection"] = true,
  options: Partial<ControllerOptions<typeof schema>> = {},
) {
  const definition = defineNativeTable<typeof schema, RecordRow>({
    schema,
    selection: selection ?? false,
    getRowId: (record) => record.id,
    isRowSelectable: (record) => record.eligible,
    columns: [
      {
        id: "group",
        header: "Data",
        columns: [{ id: "amount", accessorKey: "amount" }],
      },
    ],
  });
  const controller = createNativeController(definition, {
    initial: {
      query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
    },
    now: () => 0,
    ...options,
  });
  const boundary = createNativeBoundary(definition, controller);
  const resource = createResourceAdapter<RecordRow, QueryFor<typeof schema>>(
    context,
  );
  let requestBinding: ControlsRequestBinding<typeof schema> | null = null;
  let snapshotBinding: ControlsRequestBinding<typeof schema> | null = null;
  let committed: ControlsInput<typeof schema, RecordRow>;
  function client(
    inputRecords: readonly RecordRow[] = records,
  ): ControlsInput<typeof schema, RecordRow> {
    const frame = boundary.prepare(
      { mode: "client", records: inputRecords },
      controller.getSnapshot(),
    );
    boundary.commit(frame);
    committed = {
      native: boundary.getView(frame),
      expected: context,
      source: { mode: "client", context, records: inputRecords },
      manualOrder: true,
    };
    return committed;
  }
  function server(override?: {
    records?: readonly RecordRow[];
    page?: NativePageInfo;
  }): ControlsInput<typeof schema, RecordRow> {
    const view = resource.getSnapshot();
    const frame = boundary.prepare(
      {
        mode: "server",
        records: override?.records ?? view.snapshot?.records ?? [],
        pageInfo: override?.page ??
          view.snapshot?.page ?? { kind: "unknown", hasNextPage: false },
      },
      controller.getSnapshot(),
    );
    boundary.commit(frame);
    committed = {
      native: boundary.getView(frame),
      expected: context,
      source: {
        mode: "server",
        resource,
        view,
        bindings: { request: requestBinding, snapshot: snapshotBinding },
      },
      manualOrder: true,
    };
    return committed;
  }
  function begin(
    queryKey = "opaque-query",
    requestKey = "opaque-request",
    retry = false,
  ) {
    const started = beginControlsRequest(definition, controller, resource, {
      ...context,
      queryKey,
      requestKey,
      ...(retry ? { retry: () => {} } : {}),
    });
    if (!started) throw new Error("Missing synthetic request");
    requestBinding = started.binding;
    return started.request;
  }
  function succeed(
    inputRecords: readonly RecordRow[] = records.slice(0, 2),
    page: NativePageInfo = { kind: "known", total: 3 },
  ) {
    const request = resource.getSnapshot().request;
    if (!request) throw new Error("Missing synthetic request");
    resource.succeed(request, {
      source: "fresh",
      records: inputRecords,
      page,
      emptyKind: "unknown",
      receivedAt: "2026-11-24T00:00:00Z",
    });
    snapshotBinding = requestBinding;
  }
  return {
    definition,
    controller,
    boundary,
    resource,
    client,
    server,
    begin,
    succeed,
    readCommitted: () => committed,
    setCommitted: (input: ControlsInput<typeof schema, RecordRow>) => {
      committed = input;
    },
  };
}
