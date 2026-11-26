import type { DataTableModel, NativeCell, NativeRow } from "@tableweave/react";
import { defineQuerySchema } from "@tableweave/react/contracts";
import { DataTable } from "../../../packages/heroui/src/data-table/data-table.js";
import type { DetailsAccessory } from "../../../packages/heroui/src/details/types.js";
import type { DataTableProps } from "../../../packages/heroui/src/table/types.js";
import type { Item, S } from "./fixtures.js";
import { collection } from "./types.js";

declare const table: DataTableModel<S, Item>,
  foreignRows: DetailsAccessory<S, { different: number }>;
const rowMismatch = (
  <DataTable
    table={table}
    // @ts-expect-error SHELL-N1 only table anchors T, accessory cannot widen it
    accessory={foreignRows}
    collection={collection}
  />
);
void rowMismatch;
const other = defineQuerySchema({
  id: "other-shell",
  version: 1,
  fields: { other: { type: "boolean", owner: "builder" } },
});
declare const foreignSchema: DetailsAccessory<typeof other, Item>;
const schemaMismatch = (
  <DataTable
    table={table}
    // @ts-expect-error SHELL-N2 accessory cannot widen model schema
    accessory={foreignSchema}
    collection={collection}
  />
);
void schemaMismatch;
const missing = (
  <DataTable
    table={table}
    // @ts-expect-error SHELL-N3 required actual collection text contracts are not optional
    collection={{ label: "Records", rowHeaderColumnId: "title" }}
  />
);
void missing;
const callback = (
  <DataTable
    table={table}
    collection={{
      ...collection,
      // @ts-expect-error SHELL-N4 wrong native row callback cannot widen T
      rowTextValue: (row: NativeRow<{ wrong: string }>) => row.original.wrong,
    }}
  />
);
void callback;
declare const props: DataTableProps<S, Item>;
// @ts-expect-error SHELL-N5 props are readonly
props.table = table;
// @ts-expect-error SHELL-N6 collection text metadata stays readonly
props.collection.label = "Changed";
const wrongCell = (
  <DataTable
    table={table}
    collection={{
      ...collection,
      // @ts-expect-error SHELL-N7 native cell callbacks stay anchored to actual model rows
      cellTextValue: (cell: NativeCell<{ different: boolean }>) =>
        String(cell.row.original.different),
    }}
  />
);
void wrongCell;
