import type { DataTableProps } from "@tableweave/heroui";
import type {
  Transaction,
  InventoryItem,
} from "../../../../apps/examples/shared/records.js";
import type {
  TransactionSchema,
  InventorySchema,
} from "../../../../apps/examples/shared/schemas.js";
declare const source: DataTableProps<TransactionSchema, Transaction>;
export const mismatched: DataTableProps<InventorySchema, InventoryItem> =
  source;
source.collection.rowHeaderColumnId = "replacement";
