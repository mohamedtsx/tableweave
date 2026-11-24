import {
  createQuery,
  defineQuerySchema,
} from "../../../packages/react/src/contracts/index.js";
import type {
  OptionPageResult,
  OptionRequestInput,
  OptionSourceContext,
} from "../../../packages/react/src/filters/editor-types.js";
import {
  createOperatorRegistry,
  defineOperator,
} from "../../../packages/react/src/filters/registry.js";

export const registry = createOperatorRegistry([
  defineOperator({
    id: "custom.false",
    labelKey: "operators.false",
    types: ["boolean"],
    cardinality: "one",
    validate(value): value is false {
      return value === false;
    },
  }),
  defineOperator({
    id: "custom.blank",
    labelKey: "operators.blank",
    types: ["text"],
    cardinality: "one",
    validate(value): value is "" {
      return value === "";
    },
  }),
] as const);
export const schema = defineQuerySchema(
  {
    id: "filter-editor-fixture",
    version: 1,
    fields: {
      name: { type: "text", owner: "builder" },
      trimmed: { type: "text", owner: "builder", trim: true },
      amount: { type: "number", owner: "builder", sort: true },
      restricted: {
        type: "number",
        owner: "builder",
        operators: ["number.eq", "number.gt"],
      },
      status: {
        type: "enum",
        owner: "builder",
        idType: "number",
        values: [0, 1],
      },
      tags: { type: "set", owner: "builder", values: ["red", "blue"] },
      enabled: { type: "boolean", owner: "builder" },
      nullable: { type: "boolean", owner: "builder", nullable: true },
      day: {
        type: "date",
        owner: "builder",
        rollingDays: [7],
        min: { kind: "day", value: "2024-01-01" },
        max: { kind: "day", value: "2025-12-31" },
      },
      instant: { type: "datetime", owner: "builder" },
      hidden: { type: "number", owner: "builder" },
      customBool: {
        type: "boolean",
        owner: "builder",
        operators: ["custom.false"],
      },
      customText: {
        type: "text",
        owner: "builder",
        trim: true,
        operators: ["custom.blank"],
      },
      search: { type: "text", owner: "search" },
      tab: { type: "enum", owner: "tabs", values: ["all", "other"] },
      dateTool: { type: "date", owner: "date" },
      ignored: { type: "text", owner: "none" },
    },
    tabs: [{ id: "all", rules: [] }],
    defaultTabId: "all",
    limits: { maxRules: 20, maxMembershipValues: 2 },
  },
  registry,
);
export const now = Date.parse("2024-03-10T17:00:00.000Z");
export const validation = { now, registry };
export function query() {
  return createQuery(
    schema,
    {
      locale: "en-US",
      timeZone: "America/New_York",
      pagination: { pageIndex: 3, pageSize: 25 },
      sorting: [{ id: "amount", desc: true }],
    },
    { registry },
  );
}
export const context: OptionSourceContext = {
  definitionKey: "definition-1",
  scopeKey: "scope-a",
  fieldId: "person",
  access: true,
};
export function request(
  term = "a",
  pageKey = "0",
  extra: Partial<OptionRequestInput> = {},
): OptionRequestInput {
  return {
    definitionKey: context.definitionKey,
    scopeKey: context.scopeKey,
    fieldId: context.fieldId,
    term,
    pageKey,
    ...extra,
  };
}
export function page(
  ids: readonly (string | number)[],
  hasMore = false,
): OptionPageResult {
  return {
    options: ids.map((id) => ({ id, label: `Label ${typeof id}:${id}` })),
    hasMore,
  };
}
