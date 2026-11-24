import {
  createQuery,
  defineQuerySchema,
} from "../../../packages/react/src/contracts/index.js";
import type {
  OperatorContext,
  QueryInput,
} from "../../../packages/react/src/contracts/types.js";
import {
  createOperatorRegistry,
  defineOperator,
} from "../../../packages/react/src/filters/registry.js";
import type { QueryTranslator } from "../../../packages/react/src/filters/translate.js";

export const T1 = Date.parse("2026-03-08T12:00:00Z");
export const T2 = Date.parse("2026-03-09T12:00:00Z");
export const context = {
  locale: "en-US",
  timeZone: "America/New_York",
} as const;
export function schemaFor(enabled = true) {
  return defineQuerySchema({
    id: "execution-descriptor",
    version: 9,
    fields: {
      amount: { type: "number", owner: "builder", sort: true },
      label: { type: "text", owner: "search", sort: true },
      tags: { type: "set", owner: "builder", values: ["basic", "vip"] },
      status: { type: "enum", owner: "tabs", values: ["open", "closed"] },
      day: {
        type: "datetime",
        owner: "date",
        relativePresets: ["today"],
        rollingDays: [3],
      },
    },
    tabs: [
      { id: "all", rules: [] },
      {
        id: "open",
        rules: [{ field: "status", operator: "enum.is", value: "open" }],
      },
    ],
    defaultTabId: "all",
    search: { trim: true },
    date: { mode: "single" },
    sorting: { multi: true },
    pagination: { enabled, defaultSize: 25, sizes: [10, 25, 50] },
  });
}
export function active(
  schema: ReturnType<typeof schemaFor>,
): QueryInput<typeof schema> {
  return {
    ...context,
    builder: {
      join: "and",
      rules: [
        { id: "amount", field: "amount", operator: "number.gte", value: 7 },
        {
          id: "tags",
          field: "tags",
          operator: "set.anyOf",
          value: ["vip", "basic", "vip"],
        },
      ],
    },
    search: " ALPHA ",
    tabId: "open",
    date: { operator: "date.on", value: { kind: "relative", preset: "today" } },
    sorting: [
      { id: "amount", desc: true },
      { id: "label", desc: false },
    ],
    pagination: {
      pageIndex: schema.pagination.enabled === false ? 0 : 2,
      pageSize: 25,
    },
  };
}
export interface RecordRow {
  id: string;
  amount: number;
  label: string;
  status: string;
  tags: readonly string[];
  day: string;
}
export const records: readonly RecordRow[] = [
  {
    id: "mar8",
    amount: 8,
    label: "alpha",
    status: "open",
    tags: ["vip"],
    day: "2026-03-08T06:00:00Z",
  },
  {
    id: "mar9",
    amount: 9,
    label: "ALPHA",
    status: "open",
    tags: ["basic"],
    day: "2026-03-09T04:00:00Z",
  },
  {
    id: "filtered",
    amount: 1,
    label: "other",
    status: "closed",
    tags: [],
    day: "2026-03-08T06:00:00Z",
  },
];
export type Predicate = (row: RecordRow) => boolean;
/** Synthetic allowlisted function target; not a database/SQL/auth backend. */
export function translator(now: number): QueryTranslator<Predicate> {
  return {
    operators: {
      "number.gte": (rule) => (row) =>
        typeof rule.value === "number" && row.amount >= rule.value,
      "set.anyOf": (rule) => {
        const values = rule.value;
        return (row) =>
          Array.isArray(values) && row.tags.some((tag) => values.includes(tag));
      },
      "enum.is": (rule) => (row) => row.status === rule.value,
      "date.on": (rule) => (row) => {
        const interval = rule.interval;
        if (!interval) return false;
        const value =
          interval.kind === "instants" ? Date.parse(row.day) : row.day;
        return value >= interval.start && value < interval.endExclusive;
      },
      "custom.roundedClock": (rule) => (row) =>
        typeof rule.value === "number" && row.amount >= rule.value && now >= T2,
    },
    all: (items) => (row) => items.every((item) => item(row)),
    any: (items) => (row) => items.some((item) => item(row)),
    search: (field, text, policy, plan) => (row) => {
      if (field !== "label") return false;
      const raw = policy.trim ? row.label.trim() : row.label;
      return policy.caseSensitive
        ? raw.includes(text)
        : raw
            .toLocaleLowerCase(plan.locale)
            .includes(text.toLocaleLowerCase(plan.locale));
    },
  };
}
export function customFixture(enabled = true) {
  const calls = { validate: 0, normalize: 0, evaluate: 0 };
  const operator = defineOperator({
    id: "custom.roundedClock",
    labelKey: "synthetic.roundedClock",
    types: ["number"],
    cardinality: "one",
    validate(value: unknown): value is number {
      calls.validate++;
      return typeof value === "number" && Number.isFinite(value);
    },
    normalize(value: number) {
      calls.normalize++;
      return Math.round(value);
    },
    evaluate(raw: unknown, value: number, captured: OperatorContext) {
      calls.evaluate++;
      return typeof raw === "number" && raw >= value && captured.now >= T2;
    },
  });
  const registry = createOperatorRegistry([operator]);
  const schema = defineQuerySchema(
    {
      id: "custom-execution",
      version: 11,
      fields: {
        amount: {
          type: "number",
          owner: "builder",
          sort: true,
          operators: ["custom.roundedClock"],
        },
        label: { type: "text", owner: "search" },
      },
      pagination: { enabled, defaultSize: 10, sizes: [10, 25] },
    },
    registry,
  );
  const query = createQuery(
    schema,
    {
      ...context,
      builder: {
        join: "and",
        rules: [
          {
            id: "r1",
            field: "amount",
            operator: "custom.roundedClock",
            value: 7.4,
          },
        ],
      },
    },
    { registry },
  );
  calls.validate = calls.normalize = calls.evaluate = 0;
  return { calls, schema, registry, query };
}
