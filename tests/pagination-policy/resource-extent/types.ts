import {
  createQuery,
  defineQuerySchema,
} from "../../../packages/react/src/contracts/index.js";
import type { QueryFor } from "../../../packages/react/src/contracts/types.js";
import {
  createOperatorRegistry,
  defineOperator,
} from "../../../packages/react/src/filters/registry.js";
import { createResourceAdapter } from "../../../packages/react/src/resource/adapter.js";
import type {
  ResourceRequestInput,
  ResourceSnapshot,
  ResourceSuccess,
} from "../../../packages/react/src/resource/types.js";

export const schema = defineQuerySchema({
  id: "u3-types",
  version: 1,
  fields: {
    amount: { type: "number", owner: "builder", sort: true },
    title: { type: "text", owner: "search" },
    day: { type: "date", owner: "date", relativePresets: ["today"] },
  },
  date: { mode: "single" },
});
type Q = QueryFor<typeof schema>;
export const query = createQuery(schema, { locale: "en-US", timeZone: "UTC" });
export const raw: ResourceRequestInput<Q> = {
  definitionKey: "d",
  scopeKey: "s",
  queryKey: "q",
  requestKey: "r",
  query,
};
// Honest raw optional ports: these compile but require runtime validation.
export const timeOnly: ResourceRequestInput<Q> = { ...raw, evaluatedAt: 0 };
export const extentOnly: ResourceRequestInput<Q> = {
  ...raw,
  extent: { kind: "complete" },
};
export const adapter = createResourceAdapter<{ id: string }, Q>({
  definitionKey: "d",
  scopeKey: "s",
  access: true,
});
export const token = adapter.begin({
  ...raw,
  extent: { kind: "complete" },
  evaluatedAt: 0,
});
if (token) {
  const precise: "u3-types" = token.query.schemaId;
  const captured: Q = token.query;
  void precise;
  void captured;
  // @ts-expect-error request extent is readonly
  token.extent = { kind: "complete" };
  // @ts-expect-error captured evaluation is readonly
  token.evaluatedAt = 1;
  if (token.extent?.kind === "complete") {
    // @ts-expect-error complete extent has no page size
    token.extent.pageSize;
  }
  // @ts-expect-error captured query remains readonly
  token.query.pagination.pageIndex = 1;
}
export const badTime: ResourceRequestInput<Q> = {
  ...raw,
  extent: { kind: "complete" },
  // @ts-expect-error metadata evaluation is numeric
  evaluatedAt: "0",
};
export const badComplete: ResourceRequestInput<Q> = {
  ...raw,
  // @ts-expect-error complete extent has kind only
  extent: { kind: "complete", pageIndex: 0 },
  evaluatedAt: 0,
};
export const badPage: ResourceRequestInput<Q> = {
  ...raw,
  // @ts-expect-error explicit page extent requires both members
  extent: { kind: "page", pageIndex: 0 },
  evaluatedAt: 0,
};
// @ts-expect-error explicit undefined extent is not omission
export const badUndefined: ResourceRequestInput<Q> = {
  ...raw,
  extent: undefined,
};
export const badKind: ResourceRequestInput<Q> = {
  ...raw,
  // @ts-expect-error no unrecognized extent kind
  extent: { kind: "all" },
  evaluatedAt: 0,
};
declare const snapshot: ResourceSnapshot<{ id: string }, Q>;
// @ts-expect-error snapshot metadata is readonly too
snapshot.evaluatedAt = 1;
const result = {
  source: "fresh" as const,
  records: [{ id: "r" }],
  page: { kind: "known" as const, total: 1 },
  emptyKind: "unknown" as const,
  receivedAt: "2026-11-24T00:00:00Z",
};
export const badOverride: ResourceSuccess<{ id: string }> = {
  ...result,
  // @ts-expect-error success cannot override pre-begin extent provenance
  extent: { kind: "complete" },
};
const owner = {
  id: "r",
  field: "title",
  operator: "text.contains",
  value: "x",
} as const;
// @ts-expect-error generic Q retains exclusive builder ownership
export const badOwner: Q["builder"]["rules"][number] = owner;
const operand = {
  id: "r",
  field: "amount",
  operator: "number.eq",
  value: "1",
} as const;
// @ts-expect-error generic Q preserves numeric operands
export const badNumber: Q["builder"]["rules"][number] = operand;
const sort = [{ id: "title", desc: true }] as const;
// @ts-expect-error generic Q preserves enabled sort fields
export const badSort: Q["sorting"] = sort;
const date = {
  operator: "date.on",
  value: { kind: "relative", preset: "tomorrow" },
} as const;
// @ts-expect-error generic Q preserves configured date presets
export const badDate: Q["date"] = date;
export const registry = createOperatorRegistry([
  defineOperator({
    id: "custom.typed",
    labelKey: "synthetic.typed",
    types: ["number"],
    cardinality: "one",
    validate(value: unknown): value is number {
      return typeof value === "number";
    },
  }),
]);
export const customSchema = defineQuerySchema(
  {
    id: "u3-custom",
    version: 1,
    fields: {
      amount: { type: "number", owner: "builder", operators: ["custom.typed"] },
    },
  },
  registry,
);
type CQ = QueryFor<typeof customSchema>;
const custom = {
  id: "r",
  field: "amount",
  operator: "custom.typed",
  value: "1",
} as const;
// @ts-expect-error generic request query preserves custom operand inference
export const badCustom: CQ["builder"]["rules"][number] = custom;
