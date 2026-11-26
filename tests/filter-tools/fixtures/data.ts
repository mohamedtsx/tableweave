import type {
  NativeControllerOptions,
  ResourceContext,
} from "@tableweave/react";
import { createNativeController, defineNativeTable } from "@tableweave/react";
import type { QueryFor } from "@tableweave/react/contracts";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import type { FilterOption } from "@tableweave/react/filters";
import {
  createOperatorRegistry,
  defineOperator,
  getBuilderFields,
} from "@tableweave/react/filters";

export const evaluatedAt = Date.parse("2025-03-09T17:00:00.123Z");
export const fixtureRegistry = createOperatorRegistry([
  defineOperator({
    id: "fixture.multiple-of",
    labelKey: "Multiple of",
    types: ["number"],
    cardinality: "one",
    validate(value): value is number {
      return typeof value === "number" && Number.isFinite(value) && value > 0;
    },
    evaluate(record, value) {
      return (
        typeof record === "number" &&
        typeof value === "number" &&
        record % value === 0
      );
    },
  }),
] as const);

export const fixtureSchema = defineQuerySchema(
  {
    id: "wp07-combined-fixture",
    version: 1,
    fields: {
      description: { type: "text", owner: "search", sort: true },
      category: { type: "enum", owner: "tabs", values: ["ready", "paused"] },
      happened: { type: "datetime", owner: "date", rollingDays: [7] },
      amount: { type: "number", owner: "builder", sort: true },
      note: { type: "text", owner: "builder", nullable: true },
      entityNumber: {
        type: "enum",
        owner: "builder",
        idType: "number",
        values: [0, 1, 2],
      },
      entityText: { type: "enum", owner: "builder", values: ["0", "1"] },
      tags: { type: "set", owner: "builder", values: ["red", "blue"] },
      flag: { type: "boolean", owner: "builder", nullable: true },
      day: { type: "date", owner: "builder", rollingDays: [7] },
      customScore: {
        type: "number",
        owner: "builder",
        operators: ["number.eq", "fixture.multiple-of"],
      },
      internalCode: { type: "text", owner: "none" },
    },
    tabs: [
      {
        id: "ready",
        rules: [{ field: "category", operator: "enum.is", value: "ready" }],
      },
      {
        id: "paused",
        rules: [{ field: "category", operator: "enum.is", value: "paused" }],
      },
    ],
    search: { debounceMs: 180 },
    sorting: { multi: true },
    pagination: { defaultSize: 10, sizes: [2, 10, 25] },
  },
  fixtureRegistry,
);
export type FixtureSchema = typeof fixtureSchema;
export interface FixtureRecord {
  readonly id: string;
  readonly description: string;
  readonly category: "ready" | "paused";
  readonly happened: string;
  readonly amount: number;
  readonly note: string | null;
  readonly entityNumber: number;
  readonly entityText: string;
  readonly tags: readonly string[];
  readonly flag: boolean | null;
  readonly day: string;
  readonly internalCode: string;
}

// Complete synthetic client input, never a partial server page. Dates straddle
// the New York spring DST boundary, including millisecond end-of-day precision.
export const completeRows: readonly FixtureRecord[] = Object.freeze([
  {
    id: "a",
    description: "Alpha zero",
    category: "ready",
    happened: "2025-03-09T06:59:59.123Z",
    amount: 0,
    note: " ",
    entityNumber: 0,
    entityText: "0",
    tags: [],
    flag: false,
    day: "2025-03-09",
    internalCode: "sample-a",
  },
  {
    id: "b",
    description: "Alpha one",
    category: "ready",
    happened: "2025-03-09T07:00:00.456Z",
    amount: 10,
    note: "alpha",
    entityNumber: 1,
    entityText: "1",
    tags: ["red"],
    flag: true,
    day: "2025-03-09",
    internalCode: "sample-b",
  },
  {
    id: "c",
    description: "Beta two",
    category: "paused",
    happened: "2025-03-10T03:59:59.999Z",
    amount: 20,
    note: "",
    entityNumber: 2,
    entityText: "0",
    tags: ["blue"],
    flag: null,
    day: "2025-03-09",
    internalCode: "sample-c",
  },
  {
    id: "d",
    description: "Alpha three",
    category: "paused",
    happened: "2025-03-10T04:00:00.000Z",
    amount: 30,
    note: null,
    entityNumber: 0,
    entityText: "1",
    tags: ["red", "blue"],
    flag: false,
    day: "2025-03-10",
    internalCode: "sample-d",
  },
  {
    id: "e",
    description: "Gamma four",
    category: "ready",
    happened: "2025-03-08T12:00:00.000Z",
    amount: 40,
    note: "notes",
    entityNumber: 1,
    entityText: "0",
    tags: [],
    flag: true,
    day: "2025-03-08",
    internalCode: "sample-e",
  },
  {
    id: "f",
    description: "Beta five",
    category: "ready",
    happened: "2025-03-09T17:00:00.001Z",
    amount: 50,
    note: "  ",
    entityNumber: 2,
    entityText: "1",
    tags: ["blue"],
    flag: false,
    day: "2025-03-09",
    internalCode: "sample-f",
  },
  {
    id: "g",
    description: "Alpha six",
    category: "ready",
    happened: "2025-03-09T23:12:30.999Z",
    amount: 60,
    note: "tail",
    entityNumber: 0,
    entityText: "0",
    tags: ["red"],
    flag: null,
    day: "2025-03-09",
    internalCode: "sample-g",
  },
  {
    id: "h",
    description: "Delta seven",
    category: "paused",
    happened: "2025-03-11T00:00:00.000Z",
    amount: 70,
    note: "",
    entityNumber: 2,
    entityText: "1",
    tags: [],
    flag: false,
    day: "2025-03-10",
    internalCode: "sample-h",
  },
]);
export const secondScopeRows: readonly FixtureRecord[] = Object.freeze(
  completeRows.map((row) => ({
    ...row,
    id: `second-${row.id}`,
    description: `Second ${row.description}`,
  })),
);

export const nativeDefinition = defineNativeTable<FixtureSchema, FixtureRecord>(
  {
    schema: fixtureSchema,
    getRowId: (row) => row.id,
    selection: true,
    details: true,
    multiSort: true,
    evaluation: {
      registry: fixtureRegistry,
      accessors: { customScore: (row) => row.amount },
    },
    columns: [
      { id: "selection", header: "Select", meta: { utility: true } },
      {
        id: "description",
        header: "Record",
        accessorKey: "description",
        meta: { rowHeader: true },
      },
      { id: "amount", header: "Amount", accessorKey: "amount" },
      {
        id: "note",
        header: "Note",
        accessorKey: "note",
        cell: ({ getValue }) => String(getValue() ?? "Empty"),
      },
      { id: "category", header: "Category", accessorKey: "category" },
      { id: "happened", header: "Occurred", accessorKey: "happened" },
    ],
  },
);

export const builderExamples = {
  none: { join: "and", rules: [] },
  repeated: {
    join: "and",
    rules: [
      { id: "amount-low", field: "amount", operator: "number.gte", value: 10 },
      { id: "amount-high", field: "amount", operator: "number.lte", value: 30 },
    ],
  },
  crossAny: {
    join: "or",
    rules: [
      { id: "amount-rule", field: "amount", operator: "number.gte", value: 30 },
      {
        id: "note-rule",
        field: "note",
        operator: "text.contains",
        value: "alpha",
      },
    ],
  },
  entities: {
    join: "and",
    rules: [
      {
        id: "number-zero",
        field: "entityNumber",
        operator: "enum.is",
        value: 0,
      },
      { id: "text-zero", field: "entityText", operator: "enum.is", value: "0" },
    ],
  },
  families: {
    join: "or",
    rules: [
      {
        id: "family-number",
        field: "amount",
        operator: "number.between",
        value: [10, 30],
      },
      {
        id: "family-text",
        field: "note",
        operator: "text.contains",
        value: "alpha",
      },
      {
        id: "family-enum",
        field: "entityNumber",
        operator: "enum.is",
        value: 0,
      },
      {
        id: "family-set",
        field: "tags",
        operator: "set.anyOf",
        value: ["red"],
      },
      { id: "family-boolean", field: "flag", operator: "boolean.isFalse" },
      {
        id: "family-date",
        field: "day",
        operator: "date.on",
        value: { kind: "relative", preset: "today" },
      },
      {
        id: "family-custom",
        field: "customScore",
        operator: "fixture.multiple-of",
        value: 20,
      },
    ],
  },
} as const satisfies Readonly<
  Record<string, QueryFor<FixtureSchema>["builder"]>
>;
export type BuilderExample = keyof typeof builderExamples;

export function initialQuery(
  locale = "en-US",
  example: BuilderExample = "none",
  independent = false,
) {
  return createQuery(
    fixtureSchema,
    {
      locale,
      timeZone: "America/New_York",
      builder: builderExamples[example],
      ...(independent
        ? ({
            search: "Alpha",
            tabId: "ready",
            date: acceptedDatePresets[0].date,
            sorting: [{ id: "amount", desc: true }],
          } as const)
        : {}),
    },
    { registry: fixtureRegistry },
  );
}
export function createFixtureController(
  options: Partial<NativeControllerOptions<FixtureSchema>> = {},
  locale = "en-US",
  example: BuilderExample = "none",
  independent = false,
) {
  return createNativeController(nativeDefinition, {
    initial: {
      query: initialQuery(locale, example, independent),
      columns: { visibility: { note: false } },
    },
    now: () => evaluatedAt,
    ...options,
  });
}
export const builderFieldIds = getBuilderFields(fixtureSchema).map(
  ({ id }) => id,
);
export const entityNumberOptions: readonly FilterOption<number>[] = [
  { id: 0, label: "Numeric zero" },
  { id: 1, label: "Numeric one" },
  { id: 2, label: "Numeric two" },
];
export const entityTextOptions: readonly FilterOption<string>[] = [
  { id: "0", label: "Text zero" },
  { id: "1", label: "Text one" },
];
export const acceptedDatePresets = [
  {
    id: "dst-day",
    label: "DST day — March 9",
    date: {
      operator: "date.between",
      value: [
        { kind: "day", value: "2025-03-09" },
        { kind: "day", value: "2025-03-09" },
      ],
    },
  },
  {
    id: "today",
    label: "Today (symbolic)",
    date: { operator: "date.on", value: { kind: "relative", preset: "today" } },
  },
] as const satisfies readonly {
  readonly id: string;
  readonly label: string;
  readonly date: NonNullable<QueryFor<FixtureSchema>["date"]>;
}[];

export function optionContext(
  context: ResourceContext,
  fieldId: "entityNumber" | "entityText",
) {
  return { ...context, fieldId };
}
