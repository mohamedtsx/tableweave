import type { QueryExecutionExtent } from "../../../packages/react/src/contracts/execution.js";
import { createQuery } from "../../../packages/react/src/contracts/query.js";
import { defineQuerySchema } from "../../../packages/react/src/contracts/schema.js";
import type { QueryFor } from "../../../packages/react/src/contracts/types.js";
import {
  createOperatorRegistry,
  defineOperator,
} from "../../../packages/react/src/filters/registry.js";
import type {
  ControlsAuthorityOptions,
  ControlsDisplayed,
  ControlsPresentation,
  ControlsRequestBinding,
  ControlsRequestInput,
  ControlsSource,
} from "../../../packages/react/src/presentation/types.js";
import type { NativeInput } from "../../../packages/react/src/tanstack/types.js";

export const registry = createOperatorRegistry([
  defineOperator({
    id: "custom.u4types",
    labelKey: "synthetic.u4types",
    types: ["number"],
    cardinality: "one",
    validate(value: unknown): value is number {
      return typeof value === "number";
    },
  }),
]);
export const schema = defineQuerySchema(
  {
    id: "u4-types",
    version: 1,
    fields: {
      amount: {
        type: "number",
        owner: "builder",
        sort: true,
        operators: ["number.gte", "custom.u4types"],
      },
      title: { type: "text", owner: "search" },
      day: { type: "date", owner: "date", relativePresets: ["today"] },
    },
    date: { mode: "single" },
  },
  registry,
);
type S = typeof schema;
type Q = QueryFor<S>;
type Item = { id: string; amount: number };
export const query = createQuery(
  schema,
  { locale: "en-US", timeZone: "UTC" },
  { registry },
);
export const complete: NativeInput<Item> = {
  mode: "server-complete",
  records: [{ id: "a", amount: 1 }],
  pageInfo: { kind: "known", total: 1 },
};
export const base: ControlsRequestInput<S> = {
  definitionKey: "d",
  scopeKey: "s",
  queryKey: "q",
  requestKey: "r",
  extent: { kind: "complete" },
};
// Raw optional extent remains runtime/policy validated, not a policy-typed union.
export const rawOmitted: ControlsRequestInput<S> = {
  definitionKey: "d",
  scopeKey: "s",
  queryKey: "q",
  requestKey: "r",
};
export const badTime: ControlsRequestInput<S> = {
  ...base,
  // @ts-expect-error U4-N01 captured time belongs to accepted owner
  evaluatedAt: 0,
};
export const badQuery: ControlsRequestInput<S> = {
  ...base,
  // @ts-expect-error U4-N02 accepted query is never caller input
  query,
};
export const badComplete: NativeInput<Item> = {
  mode: "server-complete",
  records: [],
  // @ts-expect-error U4-N03 complete mode admits known total only
  pageInfo: { kind: "unknown", hasNextPage: false },
};
export const badRow: NativeInput<Item> = {
  mode: "server-complete",
  pageInfo: { kind: "known", total: 1 },
  // @ts-expect-error U4-N04 generic rows do not widen
  records: [{ id: "a", amount: "1" }],
};
declare const binding: ControlsRequestBinding<S>;
// @ts-expect-error U4-N05 required captured extent is readonly
binding.extent = { kind: "complete" };
if (binding.extent.kind === "page") {
  // @ts-expect-error U4-N06 resolved extent members are readonly
  binding.extent.pageIndex = 1;
}
declare const displayed: ControlsDisplayed<S>;
// @ts-expect-error U4-N07 displayed extent is readonly
displayed.extent = { kind: "complete" };
declare const presentation: ControlsPresentation<S, Item>;
// @ts-expect-error U4-N08 immutable origin policy is readonly
presentation.paginationEnabled = true;
declare const source: Extract<ControlsSource<S, Item>, { resource: unknown }>;
export const remote: ControlsSource<S, Item> = {
  ...source,
  mode: "server-complete",
};
declare const authority: Extract<
  ControlsAuthorityOptions<S, Item>,
  { resource: unknown }
>;
export const remoteAuthority: ControlsAuthorityOptions<S, Item> = {
  ...authority,
  mode: "server-complete",
};
const operand = {
  id: "r",
  field: "amount",
  operator: "custom.u4types",
  value: "1",
} as const;
// @ts-expect-error U4-N09 custom query operands remain precise
export const badCustom: Q["builder"]["rules"][number] = operand;
const owner = {
  id: "r",
  field: "title",
  operator: "text.contains",
  value: "x",
} as const;
// @ts-expect-error U4-N10 exclusive filter ownership remains precise
export const badOwner: Q["builder"]["rules"][number] = owner;
const sorting = [{ id: "title", desc: true }] as const;
// @ts-expect-error U4-N11 sorting still requires enabled field
export const badSort: Q["sorting"] = sorting;
const date = {
  operator: "date.on",
  value: { kind: "relative", preset: "tomorrow" },
} as const;
// @ts-expect-error U4-N12 configured date presets remain precise
export const badDate: Q["date"] = date;
export const extent: QueryExecutionExtent = { kind: "complete" };
export const missingExtent: ControlsRequestBinding<S> = {
  ...binding,
  // @ts-expect-error U4-N13 required binding extent cannot be omitted
  extent: undefined,
};
