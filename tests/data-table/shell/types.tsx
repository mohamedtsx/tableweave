import type {
  DataTableModel,
  NativeCell,
  NativeColumn,
  NativeRow,
} from "@tableweave/react";
import { DataTable } from "../../../packages/heroui/src/data-table/data-table.js";
import type { DetailsAccessory } from "../../../packages/heroui/src/details/types.js";
import type { DataTableProps } from "../../../packages/heroui/src/table/types.js";
import type { Item, S } from "./fixtures.js";
export function usage(
  table: DataTableModel<S, Item>,
  accessory: DetailsAccessory<S, Item>,
) {
  return (
    <DataTable
      table={table}
      accessory={accessory}
      collection={{
        label: "Records",
        rowHeaderColumnId: "title",
        rowTextValue: (row) => row.original.title,
        columnTextValue: (column) => column.id,
        cellTextValue: (cell) => cell.row.original.title,
      }}
      actions={[
        {
          id: "inspect",
          label: "Inspect selection",
          onAction(context) {
            context.loadedSelected.forEach((record) => {
              void record;
            });
          },
        },
      ]}
    />
  );
}
export const collection: DataTableProps<S, Item>["collection"] = {
  label: "Records",
  rowHeaderColumnId: "title",
  rowTextValue: (row: NativeRow<Item>) => row.original.title,
  columnTextValue: (column: NativeColumn<Item>) => column.id,
  cellTextValue: (cell: NativeCell<Item>) => cell.row.original.title,
};
