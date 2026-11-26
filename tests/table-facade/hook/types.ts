import { defineQuerySchema } from "../../../packages/react/src/contracts/schema.js";
import { defineTable } from "../../../packages/react/src/table/definition.js";
import type {
  DataTableModel,
  DataTableOptions,
  TableDefinition,
} from "../../../packages/react/src/table/types.js";
import { useDataTable } from "../../../packages/react/src/table/use-data-table.js";
import type { Item, Schema } from "./fixtures.js";

export function usePositive(
  D: TableDefinition<Schema, Item>,
  options: DataTableOptions<Schema, Item>,
): DataTableModel<Schema, Item> {
  const result = useDataTable(D, options);
  const title: string | undefined = result.view?.rows[0]?.original.title;
  const amount: number | undefined =
    result.presentation?.loadedSelected[0]?.record.amount;
  void title;
  void amount;
  return result;
}
const schema = defineQuerySchema({
  id: "computed",
  version: 1,
  fields: { amount: { type: "number", owner: "builder" } },
});
export const computed = defineTable<{
  id: string;
  amount: number;
  title: string;
}>()({
  schema,
  getRowId: (row) => row.id,
  columns: [
    {
      id: "computed",
      accessorFn: (row) => row.amount * 2,
      header(context) {
        const rows = context.table.getRowModel().rows;
        return rows[0]?.original.title ?? "Amount";
      },
    },
  ],
});
