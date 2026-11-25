import { createQuery, getQueryIdentity } from "@tableweave/react/contracts";
import {
  fixedNow,
  receivedAt,
  transactions,
} from "../../examples/shared/records.js";
import { minimalTransactionSchema } from "../../examples/shared/schemas.js";
import type { DemoInstance, InitialPayload } from "./payload.js";

/** Fresh wire envelope per call. No React roots, app owners, cache or transport. */
export function buildInitialPayload(instance: DemoInstance): InitialPayload {
  const query = createQuery(minimalTransactionSchema, {
    locale: "en-US",
    timeZone: "UTC",
  });
  return {
    kind: "public-synthetic-initial-input",
    version: 1,
    instance,
    locale: "en-US",
    timeZone: "UTC",
    evaluatedAt: fixedNow,
    receivedAt,
    query,
    queryIdentity: getQueryIdentity(minimalTransactionSchema, query, {
      now: fixedNow,
    }),
    rows: transactions.map((record) => ({ ...record, tags: [...record.tags] })),
  };
}
