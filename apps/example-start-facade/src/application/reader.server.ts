import { createQuery } from "@tableweave/react/contracts";
import { createFilterEvaluator } from "@tableweave/react/filters";
import {
  getCookie,
  getRequest,
  setResponseHeader,
} from "@tanstack/react-start/server";
import {
  fixedNow,
  inventory,
  receivedAt,
  transactions,
} from "../../../examples/shared/records.js";
import {
  exampleOperators,
  inventorySchema,
  transactionSchema,
} from "../../../examples/shared/schemas.js";
import { dataset, readInput } from "./codec.js";
import type {
  Bootstrap,
  BootstrapOutcome,
  Dataset,
  ReadInput,
  RowsOutcome,
} from "./types.js";

const serverOnlyMarker = "WP11_START_FACADE_READER_SERVER_ONLY";
function unavailable() {
  setResponseHeader("Cache-Control", "private, no-store");
  return getCookie("wp11-facade-availability") === "closed";
}
export const requestSignal = () => getRequest().signal;
export const initialDatasetReader = () =>
  dataset(getCookie("wp11-facade-dataset") ?? "alpha");
export async function canaryReader(input: Bootstrap, signal: AbortSignal) {
  signal.throwIfAborted();
  if (unavailable()) return { kind: "denied" as const };
  return {
    kind: "ready" as const,
    canary: {
      kind: "canary" as const,
      bootstrapId: input.id,
      dataset: input.dataset,
      value: `public-canary:${input.dataset}:${input.id}`,
    },
  };
}
export function bootstrapReader(selected: Dataset): BootstrapOutcome {
  if (unavailable()) return { kind: "denied" };
  const id = crypto.randomUUID();
  const base = {
    version: 1 as const,
    bootstrapId: id,
    dataset: selected,
    clock: fixedNow,
  };
  return {
    kind: "ready",
    bootstrap: {
      version: 1,
      id,
      dataset: selected,
      clock: fixedNow,
      canary: `public-canary:${selected}:${id}`,
      transactions: {
        ...base,
        domain: "transactions",
        scopeKey: `synthetic:${selected}:transactions`,
        query: createQuery(transactionSchema, {
          locale: "en-US",
          timeZone: "UTC",
        }),
      },
      inventory: {
        ...base,
        domain: "inventory",
        scopeKey: `synthetic:${selected}:inventory`,
        query: createQuery(inventorySchema, {
          locale: "en-US",
          timeZone: "UTC",
        }),
      },
    },
  };
}
function compare(left: unknown, right: unknown): number {
  return typeof left === "number" && typeof right === "number"
    ? left - right
    : String(left ?? "").localeCompare(String(right ?? ""), "en-US");
}
/** Full authoritative synthetic INPUT is filtered/sorted/paged exactly once here. */
export async function rowsReader(
  value: ReadInput,
  signal: AbortSignal,
): Promise<RowsOutcome> {
  const input = readInput(value);
  signal.throwIfAborted();
  if (unavailable()) return { kind: "denied" };
  if (!serverOnlyMarker) throw new Error("Missing synthetic server reader");
  const prefix = input.dataset === "alpha" ? "Alpha" : "Beta";
  if (input.domain === "transactions") {
    const all = transactions.map((row) => ({
      ...row,
      id: `${input.dataset}:${row.id}`,
      description: `${prefix} ${row.description}`,
    }));
    const evaluate = createFilterEvaluator(transactionSchema, input.query, {
      now: input.clock,
      registry: exampleOperators,
    });
    const filtered = all.filter(evaluate).sort((a, b) => {
      for (const sort of input.query.sorting) {
        const result = compare(a[sort.id], b[sort.id]);
        if (result) return sort.desc ? -result : result;
      }
      return a.id.localeCompare(b.id);
    });
    signal.throwIfAborted();
    const { pageIndex, pageSize } = input.query.pagination;
    return {
      kind: "ready",
      envelope: {
        kind: "rows",
        domain: input.domain,
        input,
        result: {
          source: "fresh",
          records: filtered.slice(
            pageIndex * pageSize,
            (pageIndex + 1) * pageSize,
          ),
          page: { kind: "known", total: filtered.length },
          emptyKind: "filtered",
          receivedAt,
        },
      },
    };
  }
  const all = inventory.map((row) => ({
    ...row,
    id: `${input.dataset}:${row.id}`,
    title: `${prefix} ${row.title}`,
  }));
  const evaluate = createFilterEvaluator(inventorySchema, input.query, {
    now: input.clock,
  });
  const filtered = all.filter(evaluate).sort((a, b) => {
    for (const sort of input.query.sorting) {
      const result = compare(a[sort.id], b[sort.id]);
      if (result) return sort.desc ? -result : result;
    }
    return a.id.localeCompare(b.id);
  });
  signal.throwIfAborted();
  const { pageIndex, pageSize } = input.query.pagination;
  return {
    kind: "ready",
    envelope: {
      kind: "rows",
      domain: input.domain,
      input,
      result: {
        source: "fresh",
        records: filtered.slice(
          pageIndex * pageSize,
          (pageIndex + 1) * pageSize,
        ),
        page: { kind: "known", total: filtered.length },
        emptyKind: "filtered",
        receivedAt,
      },
    },
  };
}
