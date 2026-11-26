import { queryOptions, type QueryClient } from "@tanstack/react-query";
import {
  inventoryDefinition,
  transactionDefinition,
} from "../../../examples/shared/definitions.js";
import type {
  InventoryItem,
  Transaction,
} from "../../../examples/shared/records.js";
import type {
  InventorySchema,
  TransactionSchema,
} from "../../../examples/shared/schemas.js";
import {
  bootstrap as decodeBootstrap,
  bootstrapOutcome,
  cacheValue,
  canaryOutcome,
  sameInput,
  wireEqual,
} from "./codec.js";
import {
  cachePrefix,
  initialInputs,
  rowsKey,
  rowsOptions,
} from "./query-options.js";
import { createTableSource, type TableSource } from "./table-source.js";
import {
  SourceEnded,
  SourceUnavailable,
  type Bootstrap,
  type CacheValue,
  type Dataset,
  type Envelope,
  type ReadInput,
  type ReaderPort,
} from "./types.js";

export interface Sources {
  readonly transactions: TableSource<TransactionSchema, Transaction>;
  readonly inventory: TableSource<InventorySchema, InventoryItem>;
}
export interface SessionSnapshot {
  readonly phase: "absent" | "preparing" | "adopted" | "retiring" | "ended";
  readonly receipt: Bootstrap | null;
  readonly sources: Sources | null;
  readonly notice: string;
}
const canaryKey = ["wp11-facade-request-canary"] as const;
/** Request/router-owned cache, distinct from every child resource's ownership. */
export function createBootstrapSession(
  client: QueryClient,
  reader: ReaderPort,
  realm: "server" | "client",
) {
  let phase: SessionSnapshot["phase"] = "absent",
    receipt: Bootstrap | null = null,
    sources: Sources | null = null;
  let operation: { readonly controller: AbortController } | null = null;
  let lease: object | null = null;
  const children: { retire(): boolean }[] = [];
  let retiredIds = new Set<string>(),
    ending = false,
    retiringNow = false,
    choice: Dataset | null = null;
  let notice =
    "Public synthetic data only; no production authentication or persistence.";
  let snapshot: SessionSnapshot = Object.freeze({
    phase,
    receipt,
    sources,
    notice,
  });
  const neutral: SessionSnapshot = Object.freeze({
    phase: "absent",
    receipt: null,
    sources: null,
    notice,
  });
  const listeners = new Set<() => void>(),
    removers = new Set<() => void>();
  function stageSnapshot() {
    snapshot = Object.freeze({ phase, receipt, sources, notice });
  }
  function publish() {
    stageSnapshot();
    for (const listener of listeners) listener();
  }
  const current = (value: Bootstrap) =>
    !ending &&
    receipt === value &&
    (phase === "preparing" || phase === "adopted");
  function owns(value: CacheValue, boot: Bootstrap, initial = false) {
    if (value.kind === "canary")
      return (
        value.bootstrapId === boot.id &&
        value.dataset === boot.dataset &&
        value.value === boot.canary
      );
    const input = boot[value.domain];
    return (
      value.input.bootstrapId === input.bootstrapId &&
      value.input.dataset === input.dataset &&
      value.input.scopeKey === input.scopeKey &&
      value.input.clock === input.clock &&
      (!initial || sameInput(value.input, input))
    );
  }
  function clearCache(id: string | null) {
    if (id) {
      void client.cancelQueries({ queryKey: cachePrefix(id) }).catch(() => {});
      client.removeQueries({ queryKey: cachePrefix(id) });
    }
    void client
      .cancelQueries({ queryKey: canaryKey, exact: true })
      .catch(() => {});
    client.removeQueries({ queryKey: canaryKey, exact: true });
  }
  function retire(reason = "Application source ended."): boolean {
    if (retiringNow) return false;
    retiringNow = true;
    try {
      const old = receipt;
      // Close app command/read guards before any child or Query observer can reenter.
      phase = "retiring";
      lease = null;
      if (old) retiredIds.add(old.id);
      const abandoned = operation;
      operation = null;
      sources = null;
      let complete = true;
      for (const child of children) {
        try {
          if (!child.retire()) complete = false;
        } catch {
          complete = false;
        }
      }
      notice = reason;
      receipt = null;
      // Query cancellation/removal can synchronously notify its own observers.
      // Their parent read must already see cleared bootstrap/source references.
      stageSnapshot();
      abandoned?.controller.abort();
      clearCache(old?.id ?? null);
      if (!complete) {
        notice =
          "Application retirement is blocked; retry cleanup. No new source is allowed.";
        publish();
        return false;
      }
      children.length = 0;
      if (ending) {
        let removed = true;
        for (const remove of [...removers]) {
          try {
            remove();
            removers.delete(remove);
          } catch {
            removed = false;
          }
        }
        if (!removed) {
          notice =
            "Application callbacks remain in cleanup debt; source stays closed.";
          publish();
          return false;
        }
      }
      phase = "ended";
      publish();
      return true;
    } finally {
      retiringNow = false;
    }
  }
  function validateCache(boot: Bootstrap) {
    const transaction = cacheValue(
      client.getQueryData(rowsKey(boot.transactions)),
    );
    const inventory = cacheValue(client.getQueryData(rowsKey(boot.inventory)));
    const canary = cacheValue(client.getQueryData(canaryKey));
    if (
      !owns(transaction, boot, true) ||
      !owns(inventory, boot, true) ||
      !owns(canary, boot, true)
    )
      throw new SourceEnded();
  }
  async function read(
    input: ReadInput,
    boot: Bootstrap,
    force: boolean,
  ): Promise<Envelope> {
    const origin = lease;
    if (!origin || !current(boot) || phase !== "adopted")
      throw new SourceEnded();
    if (force)
      await client.invalidateQueries({
        queryKey: rowsKey(input),
        exact: true,
        refetchType: "none",
      });
    if (!current(boot)) throw new SourceEnded();
    const result = await client.query(
      rowsOptions(input, reader, () => current(boot)),
    );
    if (lease !== origin || !current(boot) || !owns(result, boot))
      throw new SourceEnded();
    return result;
  }
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => neutral,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    requestedDataset: () => choice,
    selectDataset(selected: Dataset) {
      if (ending || !retire("Requesting another public synthetic dataset."))
        throw new SourceEnded();
      choice = selected;
    },
    serialize() {
      return { bootstrap: receipt && current(receipt) ? receipt : null };
    },
    shouldDehydrate(data: unknown) {
      try {
        const boot = receipt,
          origin = lease;
        if (!boot || !current(boot)) return false;
        const parsed = cacheValue(data);
        return (
          receipt === boot &&
          lease === origin &&
          current(boot) &&
          owns(parsed, boot, true)
        );
      } catch {
        return false;
      }
    },
    prepareHydration(value: unknown) {
      if (ending || children.length || receipt !== null || phase !== "absent")
        throw new SourceEnded();
      if (value === null) return;
      const parsed = decodeBootstrap(value);
      if (
        ending ||
        children.length ||
        receipt !== null ||
        phase !== "absent" ||
        retiredIds.has(parsed.id)
      )
        throw new SourceEnded();
      receipt = parsed;
      choice = parsed.dataset;
      phase = "preparing";
      publish();
    },
    deserializeData(value: unknown): CacheValue {
      const boot = receipt,
        origin = lease;
      if (!boot || !current(boot)) throw new SourceEnded();
      const parsed = cacheValue(value);
      // Query's actual deserialize hook runs BEFORE cache lookup/write, not after.
      if (
        receipt !== boot ||
        lease !== origin ||
        !current(boot) ||
        retiredIds.has(boot.id) ||
        !owns(parsed, boot, true)
      )
        throw new SourceEnded();
      return parsed;
    },
    adoptHydration() {
      const boot = receipt,
        origin = lease;
      if (!boot) return;
      if (phase !== "preparing" || !current(boot)) throw new SourceEnded();
      try {
        validateCache(boot);
        if (
          receipt !== boot ||
          lease !== origin ||
          phase !== "preparing" ||
          !current(boot)
        )
          throw new SourceEnded();
        lease = Object.freeze({});
        phase = "adopted";
        publish();
      } catch (error) {
        if (receipt === boot && lease === origin) retire();
        throw error;
      }
    },
    async load(
      selected: Dataset,
      signal: AbortSignal,
      preload: boolean,
    ): Promise<Bootstrap> {
      // This demo disables route preloading; a speculative candidate cannot retire
      // the committed app or manufacture an activation receipt.
      if (preload) throw new SourceUnavailable();
      if (ending || !retire("Preparing a genuine new synthetic bootstrap."))
        throw new SourceEnded();
      choice = selected;
      const controller = new AbortController(),
        token = { controller };
      operation = token;
      const abort = () => {
        controller.abort(signal.reason);
        if (operation === token)
          retire("Bootstrap request aborted; old data remains retired.");
      };
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) abort();
      try {
        controller.signal.throwIfAborted();
        const boot = bootstrapOutcome(
          await reader.bootstrap(selected, controller.signal),
        );
        controller.signal.throwIfAborted();
        if (
          operation !== token ||
          ending ||
          retiredIds.has(boot.id) ||
          boot.dataset !== selected
        )
          throw new SourceEnded();
        receipt = boot;
        phase = "preparing";
        const proof = () =>
          operation === token && current(boot) && !controller.signal.aborted;
        await Promise.all(
          initialInputs(boot).map((input) =>
            client.query(rowsOptions(input, reader, proof)),
          ),
        );
        await client.query(
          queryOptions({
            queryKey: canaryKey,
            staleTime: 30_000,
            retry: false,
            queryFn: async ({ signal: querySignal }) => {
              if (!proof()) throw new SourceEnded();
              const value = canaryOutcome(
                await reader.canary(boot, querySignal),
              );
              if (!proof() || !owns(value, boot)) throw new SourceEnded();
              return value;
            },
          }),
        );
        if (!proof()) throw new SourceEnded();
        validateCache(boot);
        if (!proof()) throw new SourceEnded();
        lease = Object.freeze({});
        phase = "adopted";
        operation = null;
        publish();
        return boot;
      } catch (error) {
        if (operation === token)
          retire(
            error instanceof SourceEnded
              ? "Synthetic server source denied access."
              : "Synthetic bootstrap unavailable; recheck explicitly.",
          );
        throw error;
      } finally {
        signal.removeEventListener("abort", abort);
      }
    },
    attach(value: Bootstrap): () => void {
      const boot = receipt,
        origin = lease;
      if (
        realm !== "client" ||
        !origin ||
        !boot ||
        phase !== "adopted" ||
        !current(boot) ||
        !wireEqual(decodeBootstrap(value), boot)
      )
        throw new SourceEnded();
      if (lease !== origin || !current(boot) || phase !== "adopted")
        throw new SourceEnded();
      if (!sources) {
        let transaction: Sources["transactions"] | null = null;
        try {
          transaction = createTableSource(
            transactionDefinition({ full: true }),
            {
              ...boot.transactions,
              isCurrent: () =>
                lease === origin && current(boot) && phase === "adopted",
              lost: () => {
                retire("Synthetic server source ended.");
              },
              read: async (request, force) => {
                if (request.evaluatedAt === undefined) throw new SourceEnded();
                const result = await read(
                  {
                    ...boot.transactions,
                    query: request.query,
                    clock: request.evaluatedAt,
                  },
                  boot,
                  force,
                );
                if (result.domain !== "transactions") throw new SourceEnded();
                return result.result;
              },
            },
          );
          children.push(transaction);
          const inventory = createTableSource(inventoryDefinition(), {
            ...boot.inventory,
            isCurrent: () =>
              lease === origin && current(boot) && phase === "adopted",
            lost: () => {
              retire("Synthetic server source ended.");
            },
            read: async (request, force) => {
              if (request.evaluatedAt === undefined) throw new SourceEnded();
              const result = await read(
                {
                  ...boot.inventory,
                  query: request.query,
                  clock: request.evaluatedAt,
                },
                boot,
                force,
              );
              if (result.domain !== "inventory") throw new SourceEnded();
              return result.result;
            },
          });
          children.push(inventory);
          sources = { transactions: transaction, inventory };
          transaction.activate();
          inventory.activate();
          publish();
        } catch (error) {
          if (lease === origin && current(boot)) retire();
          throw error;
        }
      }
      // Deliberately NOT a source disconnect/cache removal. Strict replay and UI
      // hiding detach the borrower, while the actual application owner remains.
      let attached = true;
      return () => {
        if (!attached) return;
        attached = false;
      };
    },
    retire,
    addRemover(remove: () => void) {
      removers.add(remove);
    },
    dispose() {
      ending = true;
      const complete = retire();
      if (complete) {
        retiredIds = new Set();
      }
      return complete;
    },
  };
}
export type BootstrapSession = ReturnType<typeof createBootstrapSession>;
