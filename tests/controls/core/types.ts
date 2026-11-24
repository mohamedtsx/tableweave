import type { QueryFor } from "../../../packages/react/src/contracts/types.js";
import type { ControllerOptions } from "../../../packages/react/src/controller/types.js";
import * as controls from "../../../packages/react/src/presentation/index.js";
import {
  beginControlsRequest,
  createControlsAuthority,
  projectControls,
} from "../../../packages/react/src/presentation/index.js";
import type {
  ControlsInput,
  ControlsIntent,
  ControlsRequestBinding,
} from "../../../packages/react/src/presentation/types.js";
import { createResourceAdapter } from "../../../packages/react/src/resource/adapter.js";
import { defineNativeTable } from "../../../packages/react/src/tanstack/index.js";
import type {
  NativeDefinition,
  NativeTableView,
} from "../../../packages/react/src/tanstack/types.js";
import { context, type RecordRow, schema } from "./fixtures.js";

export const intentKinds: Readonly<Record<ControlsIntent["type"], true>> = {
  sort: true,
  columns: true,
  "select-row": true,
  "select-page": true,
  navigate: true,
  reorder: true,
  retry: true,
};

export const commandConstraint: NonNullable<
  ControllerOptions<typeof schema>["validateCommand"]
> = (command) => {
  if (command.type === "builder.commit") {
    const field: "amount" = command.rule.field;
    void field;
  }
  // @ts-expect-error commands and their discriminants are readonly
  command.type = "selection.cancel";
  // @ts-expect-error command guard does not receive a replacement state
  command.selection;
};
// @ts-expect-error command constraints must be callable
export const invalidCommandConstraint: ControllerOptions<
  typeof schema
>["validateCommand"] = false;

export function protocol(
  definition: NativeDefinition<typeof schema, RecordRow>,
  view: NativeTableView<typeof schema, RecordRow>,
) {
  const resource = createResourceAdapter<RecordRow, QueryFor<typeof schema>>(
    context,
  );
  const controller = view.controller;
  const started = beginControlsRequest(definition, controller, resource, {
    ...context,
    queryKey: "application-opaque-query",
    requestKey: "application-opaque-request",
  });
  if (!started) throw new Error("Missing request");
  const { request, binding } = started;
  // @ts-expect-error arbitrary post-hoc token binding is not exposed
  controls.bindControlsRequest(definition, controller, resource, request);
  beginControlsRequest(definition, controller, resource, {
    ...context,
    queryKey: "opaque",
    requestKey: "opaque",
    // @ts-expect-error query comes from the actual accepted controller, not callers
    query: request.query,
  });
  const input: ControlsInput<typeof schema, RecordRow> = {
    native: view,
    expected: context,
    source: {
      mode: "server",
      resource,
      view: resource.getSnapshot(),
      bindings: { request: binding, snapshot: null },
    },
  };
  const facts = projectControls(definition, input);
  const loaded: readonly { readonly id: string; readonly record: RecordRow }[] =
    facts.loadedSelected;
  // @ts-expect-error selected IDs are not records
  const fabricated: readonly RecordRow[] = facts.selectedIds;
  // @ts-expect-error accepted row values retain their inferred type
  const wrong: string = loaded[0]?.record.amount;
  // @ts-expect-error raw structural objects cannot forge request bindings
  const forged: ControlsRequestBinding<typeof schema> = {
    request,
    queryIdentity: "fake",
    evaluatedAt: 0,
    definitionIdentity: "fake",
  };
  const actions = createControlsAuthority({
    mode: "server",
    definition,
    controller,
    queryIdentity: view.state.queryIdentity,
    context,
    resource,
    readCommitted: () => input,
  });
  // @ts-expect-error server event authority requires the actual resource owner
  createControlsAuthority({
    mode: "server",
    definition,
    controller,
    queryIdentity: view.state.queryIdentity,
    context,
    readCommitted: () => input,
  });
  actions.require({ type: "select-row", id: "a" });
  actions.require({ type: "sort" });
  actions.require({ type: "columns" });
  // @ts-expect-error query/layout intents do not accept mutation payloads
  actions.require({ type: "sort", update: [] });
  // @ts-expect-error no generic mutate/dispatch intent
  actions.require({ type: "mutate" });
  // @ts-expect-error no new sorting method on the authority; existing producers own events
  actions.setSorting([]);
  // @ts-expect-error owner-domain permission is not a public writable/read flag
  actions.read().queryLayout;
  // @ts-expect-error no fetching/ownership protocol on this read/event helper
  actions.connect();
  // @ts-expect-error no alternate writable query mirror
  actions.setState({});
  // @ts-expect-error immutable selection mode
  definition.selectionMode = "multiple";
  // @ts-expect-error current view mode is also immutable
  view.selectionMode = "multiple";
  defineNativeTable({
    schema,
    // @ts-expect-error no all-matching selection sentinel/mode
    selection: "all",
    getRowId: (record: RecordRow) => record.id,
    columns: definition.columns,
  });
  void fabricated;
  void forged;
  void wrong;
  return actions;
}
