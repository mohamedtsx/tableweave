import {
  createCriteriaPublication,
  type DataTableOptions,
  type NativeControllerOptions,
  type StateProposal,
  type TableCommand,
  type TableDefinition,
} from "@tableweave/react";
import { createQuery, type QuerySchema } from "@tableweave/react/contracts";
import { createExampleOptions } from "./options.js";
import { fixedNow } from "./records.js";
import { createExampleReordering } from "./reordering.js";
import { createExampleResource } from "./resource.js";

export interface ExampleOwnerOptions {
  readonly id: string;
  readonly server?: boolean;
  readonly manualRows?: boolean;
  readonly controlled?: boolean;
}
/** One application source owner. Never a wrapper/proxy/replacement for C or P. */
export function createExampleOwner<S extends QuerySchema, T extends object>(
  D: TableDefinition<S, T>,
  seed: readonly T[],
  config: ExampleOwnerOptions,
) {
  const context = {
    definitionKey: D.native.controllerDefinition.schema.id,
    scopeKey: config.id,
    access: true,
  };
  let records: readonly T[] = [],
    live = true,
    connected = false,
    terminal = false;
  let proposal: StateProposal<S> | null = null,
    notice = "Synthetic local application; no network or persistence.";
  let snapshot: Readonly<{
    version: number;
    records: readonly T[];
    access: boolean;
    proposal: StateProposal<S> | null;
    notice: string;
  }> = Object.freeze({ version: 0, records, access: true, proposal, notice });
  const listeners = new Set<() => void>();
  const refreshSnapshot = () => {
    snapshot = Object.freeze({
      version: snapshot.version + 1,
      records,
      access: live,
      proposal,
      notice,
    });
  };
  const publish = () => {
    refreshSnapshot();
    for (const listener of listeners) listener();
  };
  function replaceRecords(next: readonly T[]) {
    if (!live) return;
    records = next;
    reorder?.sourceChanged();
    publish();
  }
  const controllerOptions: NativeControllerOptions<S> = {
    initial: {
      query: createQuery(D.native.controllerDefinition.schema, {
        locale: "en-US",
        timeZone: "UTC",
      }),
    },
    now: () => fixedNow,
    ...(config.controlled
      ? { controlled: ["query", "selection", "columns", "details"] as const }
      : {}),
    onRequest(value) {
      proposal = value;
      publish();
    },
    onQueryChange() {
      if (config.server && connected && live) remote.begin();
    },
  };
  const reorder = config.manualRows
    ? createExampleReordering(
        D,
        controllerOptions,
        `${config.id}:${globalThis.crypto.randomUUID()}`,
        context,
        () => records,
        replaceRecords,
        publish,
      )
    : null;
  const C = reorder?.controller ?? D.createController(controllerOptions);
  const remote = createExampleResource(D, C, context, () => records);
  const numericOptions = createExampleOptions<number>(
    { ...context, fieldId: "account" },
    [
      { id: 0, label: "Account zero" },
      { id: 1, label: "Account one" },
      { id: 2, label: "Account two" },
    ],
  );
  const stringOptions = createExampleOptions<string>(
    { ...context, fieldId: "tags" },
    [
      { id: "review", label: "Review" },
      { id: "local", label: "Local" },
    ],
  );
  function clearPrivateState() {
    live = false;
    records = [];
    if (proposal) C.reject(proposal);
    proposal = null;
    notice =
      "Application source retired; retained private inputs and notices were cleared.";
    refreshSnapshot();
    reorder?.disconnect();
    remote.clear();
    numericOptions.clear();
    stringOptions.clear();
    for (const command of [
      { type: "selection.cancel" },
      { type: "details.change", update: { rowId: null } },
    ] as const) {
      const result = C.dispatch(command);
      // Retire actual controlled proposals in sequence, never overwrite one.
      if (result.status === "proposed") C.accept(result.proposal);
      proposal = null;
    }
    refreshSnapshot();
  }
  const P = createCriteriaPublication({
    controller: C,
    definition: C.getDefinition(),
    retirement: {
      retire() {
        // This is actual app retirement on initial publication, every transition
        // and disposal, not an initial-only fixture certificate or allowing policy.
        clearPrivateState();
        if (
          Object.values(C.getSnapshot().selection).some(Boolean) ||
          C.getSnapshot().details.rowId !== null ||
          remote.resource.getSnapshot().snapshot !== null
        )
          throw new Error("Application retirement incomplete");
        return undefined;
      },
    },
  });
  const pending = P.begin({
    controller: C,
    definition: C.getDefinition(),
    expected: context,
    actual: context,
  });
  if (
    pending.status !== "pending" ||
    P.complete(pending.ticket).status !== "settled"
  )
    throw new Error("Application publication unavailable");
  // Publish actual authorized synthetic INPUT after retirement completes.
  records = seed;
  live = true;
  notice = "Synthetic local application; no network or persistence.";
  reorder?.connect();
  publish();
  const current = P.getSnapshot().current;
  if (!current) throw new Error("No settled application publication");
  const authority = P.issue({
    controller: C,
    definition: C.getDefinition(),
    context: current.expected,
    epoch: current.epoch,
  });
  // This owner has one publication domain. A terminal loss never mints a new
  // origin from latest state; a future real grant needs a new app owner.
  const criteria = () => authority;
  return {
    D,
    C,
    P,
    context,
    remote,
    numericOptions,
    stringOptions,
    reorder,
    criteria,
    getSnapshot: () => snapshot,
    getServerSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    connect() {
      if (terminal || connected) return () => {};
      connected = true;
      live = true;
      records = seed;
      notice =
        "Synthetic application source connected. No network or persistence.";
      const unregister = P.registerParticipant(authority, {
        purge() {
          clearPrivateState();
          return undefined;
        },
      });
      const stopResource = remote.resource.connect();
      reorder?.connect();
      publish();
      return () => {
        connected = false;
        unregister();
        clearPrivateState();
        stopResource();
        publish();
      };
    },
    modelOptions(): DataTableOptions<S, T> {
      return {
        controller: C,
        publication: P,
        criteria: criteria(),
        expected: context,
        manualOrder: config.manualRows ?? false,
        source: config.server
          ? {
              mode: "server",
              resource: remote.resource,
              view: remote.resource.getSnapshot(),
              bindings: remote.bindings(),
            }
          : { mode: "client", context: { ...context, access: live }, records },
      };
    },
    dispatch(command: TableCommand<S>) {
      if (!live || terminal) return;
      return C.dispatch(command);
    },
    decide(accept: boolean) {
      if (!proposal || !live) return;
      const value = proposal;
      proposal = null;
      if (accept) C.accept(value);
      else C.reject(value);
      publish();
    },
    replaceRecords,
    record(id: string) {
      return live
        ? records.find((record) => D.native.getRowId(record) === id)
        : undefined;
    },
    updateRecord(id: string, update: (record: T) => T) {
      if (!live) return;
      replaceRecords(
        records.map((record) =>
          D.native.getRowId(record) === id ? update(record) : record,
        ),
      );
    },
    setNotice(value: string) {
      if (!live) return;
      notice = value;
      publish();
    },
    revoke() {
      if (terminal) return;
      terminal = true;
      live = false;
      // App participants clear before P's observers can see a new publication.
      const denied = { ...context, access: false };
      const change = P.begin({
        controller: C,
        definition: C.getDefinition(),
        expected: context,
        actual: denied,
      });
      if (change.status === "pending") P.complete(change.ticket);
      remote.revoke(denied);
      numericOptions.revoke();
      stringOptions.revoke();
      publish();
    },
  };
}
export type ExampleOwner<S extends QuerySchema, T extends object> = ReturnType<
  typeof createExampleOwner<S, T>
>;
