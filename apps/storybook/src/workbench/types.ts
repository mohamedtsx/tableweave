import type {
  DataTableProps,
  DetailsAccessoryOptions,
} from "@tableweave/heroui";
import type { TableDefinition } from "@tableweave/react";
import type { ReorderControllerOptions } from "@tableweave/react/reordering-controller";
import type { RowMoveOperation } from "@tableweave/react/reordering";
import type { Transaction } from "../../../examples/shared/records.js";
import type { TransactionSchema } from "../../../examples/shared/schemas.js";

/** Positive source consumer only. No deep imports or guessed root type exports. */
export type TransactionContracts = readonly [
  NonNullable<DataTableProps<TransactionSchema, Transaction>["reordering"]>,
  DataTableProps<TransactionSchema, Transaction>["messages"],
  TableDefinition<TransactionSchema, Transaction>["reordering"],
  DetailsAccessoryOptions<TransactionSchema, Transaction>,
  ReorderControllerOptions<TransactionSchema, Transaction>,
  RowMoveOperation,
];
