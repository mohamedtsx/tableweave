import {
  createQuery,
  defineQuerySchema,
} from "../../../packages/react/src/contracts/index.js";
import type { TableCommand } from "../../../packages/react/src/controller/types.js";
import {
  createOperatorRegistry,
  defineOperator,
} from "../../../packages/react/src/filters/registry.js";
import {
  assertTableController,
  defineTable,
} from "../../../packages/react/src/table/definition.js";
import type { TableDefinition } from "../../../packages/react/src/table/types.js";
import { createNativeColumnHelper } from "../../../packages/react/src/tanstack/definition.js";
import type {
  NativeCell,
  NativeHeader,
  NativeRow,
} from "../../../packages/react/src/tanstack/types.js";

export interface Row {
  id: string;
  amount: number;
  title: string;
}
export const helper = createNativeColumnHelper<Row>();
export const columns = helper.columns([
  helper.accessor("amount", {
    id: "amount",
    enableSorting: true,
    cell(info) {
      const value: number = info.getValue();
      const row: Row = info.row.original;
      return `${row.id}:${value.toFixed(2)}`;
    },
    header(info) {
      const id: string = info.column.id;
      return id;
    },
  }),
  helper.accessor((row) => row.title.length, {
    id: "titleLength",
    cell(info) {
      const value: number = info.getValue();
      return value;
    },
  }),
  helper.accessor("title", { id: "title" }),
]);
export const schema = defineQuerySchema({
  id: "facade-positive",
  version: 1,
  fields: {
    amount: { type: "number", owner: "builder", sort: true },
    title: { type: "text", owner: "search" },
    computed: { type: "number", owner: "builder" },
  },
});
export const definition = defineTable<Row>()({
  schema,
  columns,
  getRowId: (row) => row.id,
  tools: {
    builder: "toolbar",
    search: "external",
    tabs: "external",
    date: "external",
    columnChooser: "hidden",
  },
  defaultColumns: { visibility: { title: false } },
  evaluation: { accessors: { computed: (row) => row.title.length } },
});
export const typed: TableDefinition<typeof schema, Row> = definition;
export const query = createQuery(schema, { locale: "en-US", timeZone: "UTC" });
export const controller = definition.createController({
  initial: { query },
  now: () => 0,
});
export const actualCD = assertTableController(definition, controller);
export const command: TableCommand<typeof schema> = {
  type: "builder.commit",
  rule: { id: "r", field: "computed", operator: "number.gte", value: 2 },
};
export const customRegistry = createOperatorRegistry([
  defineOperator({
    id: "custom.amount",
    labelKey: "synthetic.amount",
    types: ["number"],
    cardinality: "one",
    validate(value: unknown): value is number {
      return typeof value === "number";
    },
  }),
]);
export const customSchema = defineQuerySchema(
  {
    id: "facade-custom",
    version: 1,
    fields: {
      amount: {
        type: "number",
        owner: "builder",
        operators: ["custom.amount"],
      },
    },
  },
  customRegistry,
);
export const customDefinition = defineTable<Row>()({
  schema: customSchema,
  columns: helper.columns([helper.accessor("amount", { id: "amount" })]),
  getRowId: (row) => row.id,
  evaluation: { registry: customRegistry },
});
export const customCommand: TableCommand<typeof customSchema> = {
  type: "builder.commit",
  rule: { id: "custom", field: "amount", operator: "custom.amount", value: 3 },
};
export function nativeContexts(
  row: NativeRow<Row>,
  cell: NativeCell<Row, number>,
  header: NativeHeader<Row>,
): string {
  const record: Row = row.original;
  const value: number = cell.getValue();
  return `${record.id}:${value}:${header.column.id}`;
}
