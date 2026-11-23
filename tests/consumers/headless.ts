import type * as headless from "@tableweave/react";
import type {
  FieldAccessors,
  QueryFor,
  QuerySchemaDefinition,
  RuleFor,
} from "@tableweave/react/contracts";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import {
  createFilterEvaluator,
  createOperatorRegistry,
  defineOperator,
} from "@tableweave/react/filters";

export const rootIsStillScaffold: keyof typeof headless extends never
  ? true
  : false = true;
const threshold = defineOperator({
  id: "custom.threshold",
  labelKey: "synthetic.threshold",
  types: ["number"],
  cardinality: "one",
  validate(value: unknown): value is { threshold: number } {
    return (
      typeof value === "object" &&
      value !== null &&
      "threshold" in value &&
      typeof value.threshold === "number"
    );
  },
  evaluate(raw: unknown, value: { threshold: number }) {
    return typeof raw === "number" && raw > value.threshold;
  },
});
const registry = createOperatorRegistry([threshold]);
export const schema = defineQuerySchema(
  {
    id: "typed",
    version: 1,
    fields: {
      amount: { type: "number", owner: "builder", sort: true },
      score: {
        type: "number",
        owner: "builder",
        operators: ["custom.threshold"],
      },
      title: {
        type: "text",
        owner: "builder",
        operators: ["text.contains", "empty"],
      },
      state: { type: "enum", owner: "builder", values: ["open", "closed"] },
      tags: { type: "set", owner: "builder", idType: "number" },
      active: { type: "boolean", owner: "builder" },
      maybe: { type: "boolean", owner: "builder", nullable: true },
      search: { type: "text", owner: "search" },
    },
    tabs: [{ id: "all", rules: [] }],
  },
  registry,
);
type Rule = RuleFor<typeof schema>;
export const validRules: readonly Rule[] = [
  { id: "r1", field: "amount", operator: "number.between", value: [0, 5] },
  { id: "r2", field: "title", operator: "empty" },
  {
    id: "r3",
    field: "score",
    operator: "custom.threshold",
    value: { threshold: 1 },
  },
  { id: "r4", field: "state", operator: "enum.is", value: "open" },
  { id: "r5", field: "tags", operator: "set.anyOf", value: [0] },
  { id: "r6", field: "active", operator: "boolean.isFalse" },
  { id: "r7", field: "maybe", operator: "empty" },
];
export const query = createQuery(
  schema,
  {
    locale: "en-US",
    timeZone: "UTC",
    builder: { join: "or", rules: validRules },
    tabId: "all",
    sorting: [{ id: "amount", desc: false }],
  },
  { registry },
);
// @ts-expect-error Unknown field.
export const badField: Rule = { id: "x", field: "missing", operator: "empty" };
export const badOwner: Rule = {
  id: "x",
  // @ts-expect-error Search-owned fields cannot enter the builder.
  field: "search",
  operator: "text.contains",
  value: "x",
};
// @ts-expect-error Operator family is field-specific.
export const badOperator: Rule = {
  id: "x",
  field: "amount",
  operator: "text.contains",
  value: "x",
};
// @ts-expect-error Numeric strings are not numbers.
export const badNumber: Rule = {
  id: "x",
  field: "amount",
  operator: "number.eq",
  value: "1",
};
// @ts-expect-error Complete ranges only.
export const badRange: Rule = {
  id: "x",
  field: "amount",
  operator: "number.between",
  value: [1],
};
export const notExposed: Rule = {
  id: "x",
  field: "title",
  // @ts-expect-error Not exposed on title.
  operator: "text.is",
  value: "a",
};
// @ts-expect-error Static stable IDs narrow the enum.
export const badEnum: Rule = {
  id: "x",
  field: "state",
  operator: "enum.is",
  value: "pending",
};
export const badSet: Rule = {
  id: "x",
  field: "tags",
  operator: "set.anyOf",
  // @ts-expect-error Membership sets are nonempty.
  value: [],
};
export const badId: Rule = {
  id: "x",
  field: "tags",
  operator: "set.anyOf",
  // @ts-expect-error Numeric ID family, not labels.
  value: ["label"],
};
// @ts-expect-error Nonnullable boolean has no empty operator.
export const badEmpty: Rule = { id: "x", field: "active", operator: "empty" };
export const badNone: Rule = {
  id: "x",
  field: "title",
  operator: "empty",
  // @ts-expect-error Value-less operators reject operands.
  value: null,
};
export const badCustom: Rule = {
  id: "x",
  field: "score",
  operator: "custom.threshold",
  // @ts-expect-error Custom value type survives the registry and schema.
  value: { threshold: "a" },
};
defineQuerySchema({
  id: "invalid",
  version: 1,
  fields: {
    // @ts-expect-error Explicit operator allowlists must match field families.
    x: { type: "number", owner: "builder", operators: ["text.contains"] },
  },
});
createQuery(schema, {
  locale: "en-US",
  timeZone: "UTC",
  // @ts-expect-error Only configured sort fields.
  sorting: [{ id: "title", desc: true }],
});
// @ts-expect-error Only configured tabs.
createQuery(schema, { locale: "en-US", timeZone: "UTC", tabId: "unknown" });
createQuery(schema, {
  locale: "en-US",
  timeZone: "UTC",
  // @ts-expect-error No standalone date owner.
  date: { operator: "date.on", value: { kind: "day", value: "2026-01-01" } },
});
type Row = { nested: { amount: number }; title: string };
export const accessors: FieldAccessors<typeof schema, Row> = {
  amount: (row) => row.nested.amount,
  title: (row) => row.title,
};
export const wrongAccessor: FieldAccessors<typeof schema, Row> = {
  // @ts-expect-error Computed accessor output must match semantic family.
  amount: (row) => row.title,
};
export const evaluate = createFilterEvaluator<typeof schema, Row>(
  schema,
  query,
  { now: 0, registry, accessors },
);

const dateSchema = defineQuerySchema({
  id: "typed-date",
  version: 1,
  fields: {
    day: {
      type: "date",
      owner: "builder",
      relativePresets: ["today"],
      rollingDays: [7],
    },
    timestamp: { type: "datetime", owner: "builder" },
    standalone: { type: "date", owner: "date" },
  },
});
export const dateRules: readonly RuleFor<typeof dateSchema>[] = [
  {
    id: "d1",
    field: "day",
    operator: "date.on",
    value: { kind: "relative", preset: "today" },
  },
  {
    id: "d2",
    field: "day",
    operator: "date.on",
    value: { kind: "rolling", days: 7, direction: "past" },
  },
  {
    id: "d3",
    field: "timestamp",
    operator: "date.on",
    value: { kind: "instant", value: "2026-01-01T00:00:00Z" },
  },
];
// @ts-expect-error Date-only fields cannot accept instants.
export const badDay: RuleFor<typeof dateSchema> = {
  id: "x",
  field: "day",
  operator: "date.on",
  value: { kind: "instant", value: "2026-01-01T00:00:00Z" },
};
// @ts-expect-error Configured relative preset allowlist.
export const badPreset: RuleFor<typeof dateSchema> = {
  id: "x",
  field: "day",
  operator: "date.on",
  value: { kind: "relative", preset: "yesterday" },
};
export const badRolling: RuleFor<typeof dateSchema> = {
  id: "x",
  field: "day",
  operator: "date.on",
  // @ts-expect-error Only configured rolling lengths.
  value: { kind: "rolling", days: 3, direction: "past" },
};
createQuery(dateSchema, {
  locale: "en-US",
  timeZone: "UTC",
  // @ts-expect-error Default standalone range requires two endpoints, not a single day.
  date: { operator: "date.on", value: { kind: "day", value: "2026-01-01" } },
});
const none = defineOperator({
  id: "custom.none",
  labelKey: "synthetic.none",
  types: ["text"],
  cardinality: "none",
  validate(value: unknown): value is null {
    return value === null;
  },
});
const noneSchema = defineQuerySchema(
  {
    id: "none",
    version: 1,
    fields: {
      value: { type: "text", owner: "builder", operators: ["custom.none"] },
    },
  },
  createOperatorRegistry([none]),
);
export const noOperand: RuleFor<typeof noneSchema> = {
  id: "x",
  field: "value",
  operator: "custom.none",
};
export const extraOperand: RuleFor<typeof noneSchema> = {
  id: "x",
  field: "value",
  operator: "custom.none",
  // @ts-expect-error Custom value-less cardinality must not require or accept null.
  value: null,
};

const dynamicDefinition: QuerySchemaDefinition = {
  id: "packed-dynamic",
  version: 1,
  fields: { price: { type: "number", owner: "builder", sort: true } },
  tabs: [{ id: "all", rules: [] }],
};
const dynamicSchema = defineQuerySchema(dynamicDefinition);
export const dynamicQuery = createQuery(dynamicSchema, {
  locale: "en-US",
  timeZone: "UTC",
  sorting: [{ id: "price", desc: false }],
  tabId: "all",
});
const optionalDefinition: QuerySchemaDefinition<{
  price: { type: "number"; owner: "builder"; sort?: boolean };
  disabled: { type: "number"; owner: "builder"; sort: false };
  title: { type: "text"; owner: "builder" };
}> & { tabs?: readonly { id: "all"; rules: readonly [] }[] } = {
  id: "packed-optional",
  version: 1,
  fields: {
    price: { type: "number", owner: "builder", sort: true },
    disabled: { type: "number", owner: "builder", sort: false },
    title: { type: "text", owner: "builder" },
  },
  tabs: [{ id: "all", rules: [] }],
};
const optionalSchema = defineQuerySchema(optionalDefinition);
export const optionalQuery = createQuery(optionalSchema, {
  locale: "en-US",
  timeZone: "UTC",
  sorting: [{ id: "price", desc: false }],
  tabId: "all",
});
// @ts-expect-error Optional known tab IDs retain their precision.
export const badOptionalTab: QueryFor<typeof optionalSchema>["tabId"] = "other";
// @ts-expect-error Explicit false still forbids sorting.
export const badDisabledSort: QueryFor<
  typeof optionalSchema
>["sorting"][number]["id"] = "disabled";
// @ts-expect-error Omitted sort configuration does not enable sorting.
export const badUnconfiguredSort: QueryFor<
  typeof optionalSchema
>["sorting"][number]["id"] = "title";
const noTabs = defineQuerySchema({
  id: "packed-no-tabs",
  version: 1,
  fields: {},
});
// @ts-expect-error A literal schema without tabs accepts only null.
export const badUnconfiguredTab: QueryFor<typeof noTabs>["tabId"] = "all";

// @ts-expect-error Controllers are not implemented by WP-02.
import { createTableController } from "@tableweave/react";
// @ts-expect-error Internal source paths are not public exports.
import "@tableweave/react/src/contracts/index.js";

void createTableController;
