import type { ResourceSuccess } from "@tableweave/react";
import type { QueryFor } from "@tableweave/react/contracts";
import type {
  InventoryItem,
  Transaction,
} from "../../../examples/shared/records.js";
import type {
  InventorySchema,
  TransactionSchema,
} from "../../../examples/shared/schemas.js";

export type Dataset = "alpha" | "beta";
export type Domain = "transactions" | "inventory";
export interface InputBase {
  readonly version: 1;
  readonly bootstrapId: string;
  readonly dataset: Dataset;
  readonly scopeKey: string;
  readonly clock: number;
}
export interface TransactionInput extends InputBase {
  readonly domain: "transactions";
  readonly query: QueryFor<TransactionSchema>;
}
export interface InventoryInput extends InputBase {
  readonly domain: "inventory";
  readonly query: QueryFor<InventorySchema>;
}
export type ReadInput = TransactionInput | InventoryInput;
export interface Bootstrap {
  readonly version: 1;
  readonly id: string;
  readonly dataset: Dataset;
  readonly clock: number;
  readonly canary: string;
  readonly transactions: TransactionInput;
  readonly inventory: InventoryInput;
}
export type Envelope =
  | {
      readonly kind: "rows";
      readonly domain: "transactions";
      readonly input: TransactionInput;
      readonly result: ResourceSuccess<Transaction>;
    }
  | {
      readonly kind: "rows";
      readonly domain: "inventory";
      readonly input: InventoryInput;
      readonly result: ResourceSuccess<InventoryItem>;
    };
export interface ReaderPort {
  bootstrap(dataset: Dataset, signal: AbortSignal): Promise<unknown>;
  canary(input: Bootstrap, signal: AbortSignal): Promise<unknown>;
  rows(input: ReadInput, signal: AbortSignal): Promise<unknown>;
}
export type BootstrapOutcome =
  | { readonly kind: "ready"; readonly bootstrap: Bootstrap }
  | { readonly kind: "denied" };
export type RowsOutcome =
  | { readonly kind: "ready"; readonly envelope: Envelope }
  | { readonly kind: "denied" };
export interface Canary {
  readonly kind: "canary";
  readonly bootstrapId: string;
  readonly dataset: Dataset;
  readonly value: string;
}
export type CacheValue = Envelope | Canary;
export class SourceUnavailable extends Error {
  constructor() {
    super("Synthetic source unavailable.");
  }
}
export class SourceEnded extends Error {
  constructor() {
    super("Synthetic source ended.");
  }
}
