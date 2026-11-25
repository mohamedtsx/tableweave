import {
  defineTable,
  useDataTable,
  type DataTableModel,
  type DataTableOptions,
  type TableDefinition,
} from "@tableweave/react";
import {
  createQuery,
  defineQuerySchema,
  type RuleFor,
  type FieldAccessors,
} from "@tableweave/react/contracts";
import { createFilterEvaluator } from "@tableweave/react/filters";

export interface Row {
  readonly id: string;
  readonly description: string;
  readonly amount: number;
}
export const schema = defineQuerySchema({
  id: "wp13-synthetic",
  version: 1,
  fields: {
    amount: { type: "number", owner: "builder", sort: true },
    description: { type: "text", owner: "builder" },
  },
});
export type Rule = RuleFor<typeof schema>;
export const validRule: Rule = {
  id: "amount-zero",
  field: "amount",
  operator: "number.eq",
  value: 0,
};
export const query = createQuery(schema, {
  locale: "en-US",
  timeZone: "UTC",
  builder: { join: "and", rules: [validRule] },
});
export const accessors: FieldAccessors<typeof schema, Row> = {
  amount: (row) => row.amount,
  description: (row) => row.description,
};
export const evaluate = createFilterEvaluator<typeof schema, Row>(
  schema,
  query,
  { now: 0, accessors },
);
export const definition: TableDefinition<typeof schema, Row> =
  defineTable<Row>()({
    schema,
    getRowId: (row) => row.id,
    columns: [
      {
        id: "description",
        accessorKey: "description",
        meta: { rowHeader: true },
      },
      {
        id: "amount",
        accessorFn: (row) => {
          const value: number = row.amount;
          return value;
        },
      },
    ],
  });
export function useProjection(
  options: DataTableOptions<typeof schema, Row>,
): DataTableModel<typeof schema, Row> {
  return useDataTable(definition, options);
}
