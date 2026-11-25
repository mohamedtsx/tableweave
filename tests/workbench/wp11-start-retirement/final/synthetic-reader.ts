/** FINAL UNRUN: in-memory public synthetic protocol, NOT HTTP/backend authorization. */
import { createQuery } from "@tableweave/react/contracts";
import { createFilterEvaluator } from "@tableweave/react/filters";
import {
  fixedNow,
  inventory,
  receivedAt,
  transactions,
} from "../../../../apps/examples/shared/records.js";
import {
  exampleOperators,
  inventorySchema,
  transactionSchema,
} from "../../../../apps/examples/shared/schemas.js";
import {
  bootstrap,
  envelope,
  readInput,
} from "../../../../apps/example-start-facade/src/application/codec.js";
import type {
  Bootstrap,
  Dataset,
  ReaderPort,
} from "../../../../apps/example-start-facade/src/application/types.js";
export function syntheticReader(): ReaderPort & {
  readonly bootstrapCalls: number;
} {
  let serial = 0;
  const compare = (left: unknown, right: unknown) =>
    typeof left === "number" && typeof right === "number"
      ? left - right
      : String(left ?? "").localeCompare(String(right ?? ""), "en-US");
  return {
    get bootstrapCalls() {
      return serial;
    },
    async bootstrap(selected: Dataset, signal: AbortSignal) {
      signal.throwIfAborted();
      const id = `00000000-0000-4000-8000-${String(++serial).padStart(12, "0")}`;
      const base = {
        version: 1,
        bootstrapId: id,
        dataset: selected,
        clock: fixedNow,
      } as const;
      const value: Bootstrap = bootstrap({
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
      });
      return { kind: "ready", bootstrap: value };
    },
    async canary(value, signal) {
      signal.throwIfAborted();
      return {
        kind: "ready",
        canary: {
          kind: "canary",
          bootstrapId: value.id,
          dataset: value.dataset,
          value: value.canary,
        },
      };
    },
    async rows(value, signal) {
      signal.throwIfAborted();
      const input = readInput(value),
        prefix = input.dataset === "alpha" ? "Alpha" : "Beta";
      const { pageIndex, pageSize } = input.query.pagination;
      const result = {
        source: "fresh",
        emptyKind: "filtered",
        receivedAt,
      } as const;
      if (input.domain === "transactions") {
        const evaluate = createFilterEvaluator(transactionSchema, input.query, {
          now: input.clock,
          registry: exampleOperators,
        });
        const all = transactions
          .map((row) => ({
            ...row,
            id: `${input.dataset}:${row.id}`,
            description: `${prefix} ${row.description}`,
          }))
          .filter(evaluate)
          .sort((a, b) => {
            for (const sort of input.query.sorting) {
              const value = compare(a[sort.id], b[sort.id]);
              if (value) return sort.desc ? -value : value;
            }
            return a.id.localeCompare(b.id);
          });
        return {
          kind: "ready",
          envelope: envelope({
            kind: "rows",
            domain: input.domain,
            input,
            result: {
              ...result,
              records: all.slice(
                pageIndex * pageSize,
                (pageIndex + 1) * pageSize,
              ),
              page: { kind: "known", total: all.length },
            },
          }),
        };
      }
      const evaluate = createFilterEvaluator(inventorySchema, input.query, {
        now: input.clock,
      });
      const all = inventory
        .map((row) => ({
          ...row,
          id: `${input.dataset}:${row.id}`,
          title: `${prefix} ${row.title}`,
        }))
        .filter(evaluate)
        .sort((a, b) => {
          for (const sort of input.query.sorting) {
            const value = compare(a[sort.id], b[sort.id]);
            if (value) return sort.desc ? -value : value;
          }
          return a.id.localeCompare(b.id);
        });
      return {
        kind: "ready",
        envelope: envelope({
          kind: "rows",
          domain: input.domain,
          input,
          result: {
            ...result,
            records: all.slice(
              pageIndex * pageSize,
              (pageIndex + 1) * pageSize,
            ),
            page: { kind: "known", total: all.length },
          },
        }),
      };
    },
  };
}
