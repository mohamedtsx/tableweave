import type { QuerySchema } from "../../../packages/react/src/contracts/types.js";
import type { TableCommand } from "../../../packages/react/src/controller/types.js";
import { defineTable } from "../../../packages/react/src/table/definition.js";
import type { TableDefinition } from "../../../packages/react/src/table/types.js";
import {
  columns,
  type customSchema,
  definition,
  helper,
  query,
  type Row,
  schema,
} from "./positive.js";

// @ts-expect-error P1-N01 row/schema identity is invariant, not a generic object definition
export const widened: TableDefinition<typeof schema, object> = definition;
// @ts-expect-error P1-N02 schema identity is invariant
export const widenedSchema: TableDefinition<QuerySchema, Row> = definition;
const nativeReplacement = definition.native;
// @ts-expect-error P1-N03 native identity is readonly
definition.native = nativeReplacement;
// @ts-expect-error P1-N04 resolved tool placements are readonly
definition.tools.builder = "hidden";
// @ts-expect-error P1-N05 a search-owned field cannot become a builder rule
export const badOwner: TableCommand<typeof schema> = {
  type: "builder.commit",
  rule: { id: "x", field: "title", operator: "text.contains", value: "x" },
};
// @ts-expect-error P1-N06 numeric values remain numeric through the facade
export const badOperand: TableCommand<typeof schema> = {
  type: "builder.commit",
  rule: { id: "x", field: "amount", operator: "number.eq", value: "7" },
};
// @ts-expect-error P1-N07 custom operator operands retain registry inference
export const badCustom: TableCommand<typeof customSchema> = {
  type: "builder.commit",
  rule: { id: "x", field: "amount", operator: "custom.amount", value: "7" },
};
// @ts-expect-error P1-N08 clock is required
definition.createController({ initial: { query } });
// @ts-expect-error P1-N09 initial query is required
definition.createController({ initial: {}, now: () => 0 });
// @ts-expect-error P1-N10 initial ownership is required
definition.createController({ now: () => 0 });
// @ts-expect-error P1-N11 new API does not accept arbitrary placement strings
defineTable<Row>()({
  schema,
  columns,
  getRowId: (row) => row.id,
  tools: { builder: "false" },
});
// @ts-expect-error P1-N12 tabs are outside selection toolbar replacement
defineTable<Row>()({
  schema,
  columns,
  getRowId: (row) => row.id,
  tools: { tabs: "toolbar" },
});
// @ts-expect-error P1-N13 order defaults must remain stable string IDs
defineTable<Row>()({
  schema,
  columns,
  getRowId: (row) => row.id,
  defaultColumns: { order: [0] },
});
// @ts-expect-error P1-N14 visibility defaults are boolean
defineTable<Row>()({
  schema,
  columns,
  getRowId: (row) => row.id,
  defaultColumns: { visibility: { title: "hidden" } },
});
// @ts-expect-error P1-N15 identity callback keeps Row inference
defineTable<Row>()({ schema, columns, getRowId: (row) => row.missing });
// @ts-expect-error P1-N16 row IDs cannot be numeric
defineTable<Row>()({ schema, columns, getRowId: (row) => row.amount });
// @ts-expect-error P1-N17 computed numeric schema accessor cannot return text
defineTable<Row>()({
  schema,
  columns,
  getRowId: (row) => row.id,
  evaluation: { accessors: { computed: (row) => row.title } },
});
// @ts-expect-error P1-N18 native cell value remains numeric
helper.accessor("amount", {
  id: "amount",
  cell: (info) => info.getValue().toUpperCase(),
});
// @ts-expect-error P1-N19 wrong row columns do not widen the chosen Row type
defineTable<{ other: boolean }>()({
  schema,
  columns,
  getRowId: (row) => String(row.other),
});
// @ts-expect-error P1-N20 a detached controller factory lacks its actual definition receiver
definition.createController.call({}, { initial: { query }, now: () => 0 });
