import type { DataTableOptions } from "../../../packages/react/src/table/types.js";
import { defineTable } from "../../../packages/react/src/table/definition.js";
import { createQuery } from "../../../packages/react/src/contracts/query.js";
import { defineQuerySchema } from "../../../packages/react/src/contracts/schema.js";
import { createResourceAdapter } from "../../../packages/react/src/resource/adapter.js";
import {
  beginControlsRequest,
  getControlsRequestBinding,
} from "../../../packages/react/src/presentation/binding.js";
import {
  createCriteriaPublication,
  type CriteriaPublicationEvent,
  type CriteriaPublicationTicket,
} from "../../../packages/react/src/controller/criteria-publication.js";
import type {
  StateProposal,
  TableCommand,
  TableState,
} from "../../../packages/react/src/controller/types.js";
import {
  createReorderController,
  type ReorderApplicationMetadata,
} from "../../../packages/react/src/reordering-controller/index.js";

export interface Item {
  readonly id: string;
  readonly amount: number;
}
export const records: readonly Item[] = [
  { id: "one", amount: 1 },
  { id: "two", amount: 2 },
  { id: "three", amount: 3 },
];
export function fixture(controlled = true, server = false, unpaged = false) {
  const values = unpaged
    ? records.concat(
        Array.from({ length: 8 }, (_, index) => ({
          id: `synthetic-${index}`,
          amount: index + 4,
        })),
      )
    : records;
  const schema = defineQuerySchema({
    id: "admission-synthetic",
    version: 1,
    fields: { amount: { type: "number", owner: "builder", sort: true } },
    pagination: { enabled: !unpaged, defaultSize: 10, sizes: [10, 25] },
  });
  const D = defineTable<Item>()({
    schema,
    selection: "multiple",
    getRowId: (row) => row.id,
    columns: [
      { id: "amount", accessorKey: "amount" },
      {
        id: "name",
        header: "Synthetic name",
        cell: ({ row }) => row.original.id,
      },
    ],
  });
  type S = typeof schema;
  const counts = {
    metadata: 0,
    eligibility: 0,
    receiver: 0,
    query: 0,
    commit: 0,
    reset: 0,
  };
  const callbacks: {
    metadata?: () => void;
    eligibility?: () => void;
    command?: (command: TableCommand<S>) => unknown;
    state?: (state: TableState<S>) => unknown;
    request?: (proposal: StateProposal<S>) => void;
    query?: () => void;
    commit?: () => void;
    clock?: () => void;
  } = {};
  let metadata: ReorderApplicationMetadata = {
    ownerEpoch: 0,
    sourceVersion: 0,
    revision: 0,
    baseRevision: "0",
  };
  let pending: StateProposal<S> | null = null;
  const settings = {
    instanceId: "synthetic-owner-1",
    readCurrent() {
      counts.metadata++;
      if (this !== settings) counts.receiver++;
      callbacks.metadata?.();
      return metadata;
    },
    isRowMovable() {
      counts.eligibility++;
      if (this !== settings) counts.receiver++;
      callbacks.eligibility?.();
      return true;
    },
    controller: {
      initial: {
        query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
        selection: { one: true },
      },
      controlled: controlled ? (["query", "columns"] as const) : [],
      now() {
        callbacks.clock?.();
        return 0;
      },
      validateCommand(this: unknown, command: TableCommand<S>) {
        if (this !== undefined) counts.receiver++;
        return callbacks.command?.(command);
      },
      validateState(this: unknown, state: TableState<S>) {
        if (this !== undefined) counts.receiver++;
        return callbacks.state?.(state);
      },
      onRequest(this: unknown, proposal: StateProposal<S>) {
        if (this !== undefined) counts.receiver++;
        pending = proposal;
        callbacks.request?.(proposal);
      },
      onQueryChange(this: unknown) {
        if (this !== undefined) counts.receiver++;
        counts.query++;
        metadata = {
          ...metadata,
          ownerEpoch: metadata.ownerEpoch + 1,
          sourceVersion: metadata.sourceVersion + 1,
        };
        callbacks.query?.();
      },
      onCommit(this: unknown) {
        if (this !== undefined) counts.receiver++;
        counts.commit++;
        callbacks.commit?.();
      },
    },
  };
  const { controller: C, admission } = createReorderController(D, settings);
  const CD = C.getDefinition();
  const context = {
    definitionKey: schema.id,
    scopeKey: "synthetic",
    access: true,
  };
  let initial = true,
    resetting = false;
  let certificate: {
    state: TableState<S>;
    pending: StateProposal<S> | null;
    candidate: object;
  } | null = null;
  function retire(event: CriteriaPublicationEvent<S>): undefined {
    if (initial) {
      const cert = required(certificate);
      if (
        C.getSnapshot() !== cert.state ||
        pending !== cert.pending ||
        event.next !== cert.candidate
      )
        throw new Error("Synthetic initial certificate changed");
      initial = false;
      certificate = null;
      return undefined;
    }
    if (!resetting) throw new Error("Synthetic retirement not prepared");
    if (pending) {
      C.reject(pending);
      pending = null;
    }
    const result = C.dispatch({ type: "selection.cancel" });
    if (result.status === "proposed") C.accept(result.proposal);
    counts.reset++;
    return undefined;
  }
  const P = createCriteriaPublication({
    controller: C,
    definition: CD,
    retirement: { retire },
  });
  const begun = P.begin({
    controller: C,
    definition: CD,
    expected: context,
    actual: context,
  });
  if (begun.status !== "pending" || !begun.snapshot.pending)
    throw new Error("Actual initial P required");
  certificate = {
    state: C.getSnapshot(),
    pending,
    candidate: begun.snapshot.pending,
  };
  if (P.complete(begun.ticket).status !== "settled")
    throw new Error("Actual initial completion required");
  function criteria() {
    const current = required(P.getSnapshot().current);
    return P.issue({
      controller: C,
      definition: CD,
      context: current.expected,
      epoch: current.epoch,
    });
  }
  const resource = createResourceAdapter<Item, TableState<S>["query"]>(context);
  const disconnectResource = resource.connect();
  let sequence = 0;
  let request = server
    ? beginControlsRequest(D.native, C, resource, {
        ...context,
        queryKey: C.getSnapshot().queryIdentity,
        requestKey: `synthetic-${++sequence}`,
      })
    : null;
  let snapshotRequest = request;
  if (request)
    resource.succeed(request.request, {
      records: values,
      source: "fresh",
      page: { kind: "known", total: values.length },
      emptyKind: "unknown",
      receivedAt: "2026-11-25T12:00:00Z",
    });
  return {
    schema,
    D,
    C,
    CD,
    P,
    admission,
    context,
    settings,
    counts,
    callbacks,
    get pending() {
      return pending;
    },
    clearPending() {
      pending = null;
    },
    metadata: () => metadata,
    setMetadata(value: ReorderApplicationMetadata) {
      metadata = value;
    },
    newer() {
      metadata = { ...metadata, sourceVersion: metadata.sourceVersion + 1 };
    },
    epoch() {
      metadata = { ...metadata, ownerEpoch: metadata.ownerEpoch + 1 };
    },
    refresh() {
      metadata = { ...metadata, sourceVersion: metadata.sourceVersion + 1 };
      request = beginControlsRequest(D.native, C, resource, {
        ...context,
        queryKey: C.getSnapshot().queryIdentity,
        requestKey: `synthetic-${++sequence}`,
      });
      if (!request) throw new Error("Actual refresh required");
    },
    removeFormerRow() {
      if (!request) throw new Error("Actual request required");
      metadata = { ...metadata, sourceVersion: metadata.sourceVersion + 1 };
      resource.succeed(request.request, {
        records: values.slice(1),
        source: "fresh",
        page: { kind: "known", total: values.length - 1 },
        emptyKind: "unknown",
        receivedAt: "2026-11-25T12:01:00Z",
      });
      snapshotRequest = request;
    },
    options(): DataTableOptions<S, Item> {
      const base = {
        controller: C,
        publication: P,
        criteria: criteria(),
        expected: context,
        manualOrder: true,
      };
      if (!server)
        return {
          ...base,
          source: { mode: "client", context, records: values },
        };
      return {
        ...base,
        source: {
          mode: "server",
          resource,
          view: resource.getSnapshot(),
          bindings: {
            request: request
              ? getControlsRequestBinding(
                  D.native,
                  C,
                  resource,
                  request.request,
                )
              : null,
            snapshot: snapshotRequest
              ? getControlsRequestBinding(
                  D.native,
                  C,
                  resource,
                  snapshotRequest.request,
                )
              : null,
          },
        },
      };
    },
    reset(): CriteriaPublicationTicket<S> {
      metadata = { ...metadata, ownerEpoch: metadata.ownerEpoch + 1 };
      resetting = true;
      const next = P.begin({
        controller: C,
        definition: CD,
        expected: context,
        actual: context,
      });
      if (next.status !== "pending")
        throw new Error("Actual reset ticket required");
      return next.ticket;
    },
    finish(ticket: CriteriaPublicationTicket<S>) {
      const result = P.complete(ticket);
      resetting = false;
      return result;
    },
    dispose() {
      admission.dispose();
      resetting = true;
      P.dispose();
      disconnectResource();
      resource.dispose();
      C.dispose();
    },
  };
}
export type Fixture = ReturnType<typeof fixture>;
export type S = Fixture["schema"];
export function required<V>(value: V | undefined | null): V {
  if (value == null) throw new Error("Actual fixture value required");
  return value;
}
