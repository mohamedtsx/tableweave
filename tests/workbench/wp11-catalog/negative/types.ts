import { DataTable, type DataTableProps } from "@tableweave/heroui";
import type { DataTableModel } from "@tableweave/react";
import type {
  InventoryItem,
  Transaction,
} from "../../../../apps/examples/shared/records.js";
import type {
  InventorySchema,
  TransactionSchema,
} from "../../../../apps/examples/shared/schemas.js";
declare const model: DataTableModel<TransactionSchema, Transaction>;
declare const inventory: DataTableProps<InventorySchema, InventoryItem>;
DataTable({ ...inventory, table: model });
declare const props: DataTableProps<TransactionSchema, Transaction>;
props.collection.rowHeaderColumnId = "changed";
export const noPermit: boolean = props.reordering?.rows?.admission.getSnapshot;
