import type {
  Bootstrap,
  ReadInput,
} from "../../../../apps/example-start-facade/src/application/types.js";
import type { TableSource } from "../../../../apps/example-start-facade/src/application/table-source.js";
import type { TransactionSchema } from "../../../../apps/examples/shared/schemas.js";
import type { Transaction } from "../../../../apps/examples/shared/records.js";
declare const source: TableSource<TransactionSchema, Transaction>;
export const notWire: Bootstrap = source;
export const notScope: ReadInput = { domain: "transactions", scopeKey: 1 };
