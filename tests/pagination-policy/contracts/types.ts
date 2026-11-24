import {
  type CustomOperator,
  createQuery,
  defineQuerySchema,
  type FieldAccessors,
  type OperatorRegistry,
  type QueryFor,
  type QuerySchemaDefinition,
  type RuleFor,
} from "../../../packages/react/src/contracts/index.js";

export const schema = defineQuerySchema({
  id: "typed-pagination",
  version: 4,
  fields: {
    amount: { type: "number", owner: "builder", sort: true },
    status: { type: "enum", owner: "builder", values: ["open", "closed"] },
    title: { type: "text", owner: "search" },
    day: { type: "date", owner: "date", relativePresets: ["today"] },
  },
  date: { mode: "single" },
  pagination: { enabled: false, defaultSize: 25, sizes: [10, 25] },
});
export const query = createQuery(schema, {
  locale: "en-US",
  timeZone: "UTC",
  builder: {
    join: "and",
    rules: [{ id: "r", field: "amount", operator: "number.gte", value: 7 }],
  },
  sorting: [{ id: "amount", desc: false }],
  date: { operator: "date.on", value: { kind: "relative", preset: "today" } },
});
export const normalized: false | undefined = schema.pagination.enabled;
export const wirePair: {
  readonly pageIndex: number;
  readonly pageSize: number;
} = query.pagination;
export const accessors: FieldAccessors<
  typeof schema,
  { amount: number; status: "open"; title: string; day: string }
> = {
  amount: (row) => row.amount,
  status: (row) => row.status,
};
export const defaults = defineQuerySchema({
  id: "default-typed-pagination",
  version: 1,
  fields: {},
});
export const trueInput = defineQuerySchema({
  id: "true-typed-pagination",
  version: 1,
  fields: {},
  pagination: { enabled: true },
});
export const trueNormalized: false | undefined = trueInput.pagination.enabled;
export function dynamicPolicy(enabled: boolean) {
  const definition: QuerySchemaDefinition = {
    id: "dynamic-policy",
    version: 1,
    fields: {},
    pagination: { enabled },
  };
  return defineQuerySchema(definition);
}
const invalidPolicy = { enabled: "false" } as const;
// @ts-expect-error input policy must be boolean, not a string
export const nonBoolean: NonNullable<QuerySchemaDefinition["pagination"]> =
  invalidPolicy;
// @ts-expect-error exact-optional input does not admit explicit undefined
export const explicitUndefined: NonNullable<
  QuerySchemaDefinition["pagination"]
> = { enabled: undefined };
// @ts-expect-error resolved normalized policy never materializes true
export const normalizedTrue: typeof schema.pagination.enabled = true;
// @ts-expect-error normalized policy remains readonly
schema.pagination.enabled = false;
const foreignOwner = {
  id: "bad",
  field: "title",
  operator: "text.contains",
  value: "x",
} as const;
// @ts-expect-error a search-owned field does not become a builder field
export const badOwner: RuleFor<typeof schema> = foreignOwner;
const stringNumber = {
  id: "bad",
  field: "amount",
  operator: "number.eq",
  value: "7",
} as const;
// @ts-expect-error inferred numeric operands do not become strings
export const badNumber: RuleFor<typeof schema> = stringNumber;
const missingEnum = {
  id: "bad",
  field: "status",
  operator: "enum.is",
  value: "missing",
} as const;
// @ts-expect-error inferred enum values retain their literal union
export const badEnum: RuleFor<typeof schema> = missingEnum;
const unsortable = [{ id: "title", desc: false }] as const;
// @ts-expect-error only explicitly sortable fields are inferred sort targets
export const badSort: QueryFor<typeof schema>["sorting"] = unsortable;
const unconfiguredDate = {
  operator: "date.on",
  value: { kind: "relative", preset: "tomorrow" },
} as const;
// @ts-expect-error configured relative presets remain narrow
export const badDate: QueryFor<typeof schema>["date"] = unconfiguredDate;

declare const registry: OperatorRegistry<
  readonly [CustomOperator<"custom.scaled", number, readonly ["number"]>]
>;
export const custom = defineQuerySchema(
  {
    id: "custom-typed-pagination",
    version: 1,
    fields: {
      amount: {
        type: "number",
        owner: "builder",
        operators: ["custom.scaled"],
      },
    },
    pagination: { enabled: false },
  },
  registry,
);
export const customRule: RuleFor<typeof custom> = {
  id: "valid",
  field: "amount",
  operator: "custom.scaled",
  value: 7,
};
const wrongCustomOperand = {
  id: "bad",
  field: "amount",
  operator: "custom.scaled",
  value: "7",
} as const;
// @ts-expect-error inferred custom operands retain the registry validator type
export const badCustom: RuleFor<typeof custom> = wrongCustomOperand;
