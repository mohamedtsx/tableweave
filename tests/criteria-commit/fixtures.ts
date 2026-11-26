import type { CriteriaFrameInput, CriteriaFrames } from "@tableweave/react";
import {
  beginControlsRequest,
  createCriteriaFrames,
  createResourceAdapter,
  defineNativeTable,
  getControlsRequestBinding,
} from "@tableweave/react";
import type { QueryFor } from "@tableweave/react/contracts";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import type { FilterBuilderProps } from "../../packages/heroui/src/filters/types.js";
import type { FilterSearchProps } from "../../packages/heroui/src/toolbar/filter-search.js";
import { ApplicationOwner } from "../criteria-bootstrap/owner.js";

export const schema = defineQuerySchema({
  id: "criteria-commit",
  version: 1,
  fields: {
    amount: { type: "number", owner: "builder", sort: true },
    title: { type: "text", owner: "search" },
    date: { type: "date", owner: "date" },
  },
  tabs: [
    { id: "all", rules: [] },
    { id: "active", rules: [] },
  ],
  pagination: { enabled: true, defaultSize: 25, sizes: [25] },
});
export type S = typeof schema;
export interface Item {
  id: string;
  amount: number;
  title: string;
}
export const records: readonly Item[] = [
  { id: "one", amount: 1, title: "Synthetic" },
];

/** Genuine app C/P/CD + native owner + real resource provenance; no permitting
 * closures, manufactured frame brands or patched producer methods. */
export function fixture() {
  const context = {
    definitionKey: "criteria-commit",
    scopeKey: "synthetic",
    access: true,
  };
  const native = defineNativeTable<S, Item>({
    schema,
    selection: "multiple",
    getRowId: (row) => row.id,
    columns: [
      { id: "amount", accessorKey: "amount" },
      { id: "title", accessorKey: "title" },
    ],
  });
  const app = ApplicationOwner.create({
    native,
    context,
    now: () => 0,
    initial: {
      query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
      selection: { one: true },
    },
  });
  const begun = app.prepareInitial();
  if (begun.status !== "pending" || !begun.snapshot.pending)
    throw new Error("Missing actual initial candidate");
  const initial = app.P.issue({
    controller: app.C,
    definition: app.CD,
    context,
    epoch: begun.snapshot.pending.epoch,
  });
  const frames = createCriteriaFrames({
    nativeDefinition: native,
    controller: app.C,
    publication: app.P,
    criteria: initial,
  });
  if (app.completeInitial(begun.ticket).status !== "settled")
    throw new Error("Missing actual initial certificate acknowledgement");
  const resource = createResourceAdapter<Item, QueryFor<S>>(context);
  const input = (): CriteriaFrameInput<S, Item> => ({
    criteria: app.authority(),
    expected: app.context,
    source: { mode: "client", context: app.context, records },
    nativeInput: { mode: "client", records },
  });
  function commit(owner: CriteriaFrames<S, Item> = frames) {
    const frame = owner.commit(owner.prepare(input()));
    const pair = owner.issue(frame);
    return { owner: pair.owner, authority: pair.tool };
  }
  function secondOwner() {
    return createCriteriaFrames({
      nativeDefinition: native,
      controller: app.C,
      publication: app.P,
      criteria: app.authority(),
    });
  }
  function remote() {
    const query = app.C.getSnapshot().query;
    const start = beginControlsRequest(native, app.C, resource, {
      ...app.context,
      queryKey: "synthetic-query",
      requestKey: "synthetic-request",
      extent: { kind: "page", ...query.pagination },
    });
    if (!start) throw new Error("Missing genuine resource request");
    resource.succeed(start.request, {
      records,
      source: "fresh",
      page: { kind: "known", total: 1 },
      emptyKind: "unknown",
      receivedAt: "2026-11-24T00:00:00Z",
    });
    const binding = getControlsRequestBinding(
      native,
      app.C,
      resource,
      start.request,
    );
    const frame = frames.commit(
      frames.prepare({
        criteria: app.authority(),
        expected: app.context,
        source: {
          mode: "server",
          resource,
          view: resource.getSnapshot(),
          bindings: { request: binding, snapshot: binding },
        },
        nativeInput: {
          mode: "server",
          records,
          pageInfo: { kind: "known", total: 1 },
        },
      }),
    );
    const pair = frames.issue(frame);
    return { owner: pair.owner, authority: pair.tool };
  }
  function reset() {
    const result = app.beginReset();
    if (result.status !== "pending") throw new Error("Actual reset blocked");
    if (app.completeReset(result.ticket).status !== "settled")
      throw new Error("Actual reset not acknowledged");
    return commit();
  }
  const search = (
    extra: Partial<FilterSearchProps<S>> = {},
  ): FilterSearchProps<S> => ({
    controller: app.C,
    expectedContext: app.context,
    ...extra,
  });
  const builder = (
    extra: Partial<FilterBuilderProps<S>> = {},
  ): FilterBuilderProps<S> => ({
    controller: app.C,
    expectedResourceContext: app.context,
    invalidationKey: "local-stamp",
    evaluationMode: "server",
    fields: { amount: { label: "Amount" } },
    ...extra,
  });
  return {
    app,
    native,
    frames,
    resource,
    context,
    commit,
    secondOwner,
    input,
    search,
    builder,
    remote,
    reset,
  };
}
export function required<Value>(value: Value | null | undefined): Value {
  if (value == null) throw new Error("Missing synthetic fixture value");
  return value;
}
