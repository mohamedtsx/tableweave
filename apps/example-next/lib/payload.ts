import type { QueryFor } from "@tableweave/react/contracts";
import type { Transaction } from "../../examples/shared/records.js";
import type { minimalTransactionSchema } from "../../examples/shared/schemas.js";

export type DemoInstance = "primary" | "comparison";
/** INITIAL INPUT ONLY. Public synthetic data, not a publication/authorization grant. */
export type InitialPayload = {
  readonly kind: "public-synthetic-initial-input";
  readonly version: 1;
  readonly instance: DemoInstance;
  readonly locale: "en-US";
  readonly timeZone: "UTC";
  readonly evaluatedAt: number;
  readonly receivedAt: string;
  readonly query: QueryFor<typeof minimalTransactionSchema>;
  readonly queryIdentity: string;
  readonly rows: readonly Transaction[];
};
