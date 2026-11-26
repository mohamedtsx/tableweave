import {
  beginControlsRequest,
  createCriteriaPublication,
  createResourceAdapter,
  getControlsRequestBinding,
  type DataTableOptions,
  type ResourceRequest,
  type TableDefinition,
} from "@tableweave/react";
import {
  getQueryIdentity,
  type QueryFor,
  type QuerySchema,
} from "@tableweave/react/contracts";
import {
  CLOCK,
  digest,
  type BenchClient,
  type Oracle,
  type Plan,
} from "./fixture.js";
import { query } from "./schema.js";
import type { Mode } from "./scenarios.js";
import type { Timing } from "./timing.js";
export interface Prepared<S extends QuerySchema, T extends BenchClient> {
  readonly query: QueryFor<S>;
  readonly plan: Plan;
  readonly oracle: Oracle;
  readonly reply: readonly T[];
}
/** Genuine synthetic app owner. UI borrowing never ends it. */
export function createSource<S extends QuerySchema, T extends BenchClient>(
  D: TableDefinition<S, T>,
  mode: Mode,
  input: readonly T[],
  initial: Prepared<S, T>,
  timing: Timing,
  scope: string,
) {
  const context = Object.freeze({
    definitionKey: D.native.controllerDefinition.schema.id,
    scopeKey: scope,
    access: true,
  });
  let records: readonly T[] = [],
    live = false,
    disposed = false,
    queued: Prepared<S, T> | null = null;
  let accepted: ResourceRequest<QueryFor<S>> | null = null,
    serial = 0,
    version = 0;
  const drafts = new Set<() => void>(),
    listeners = new Set<() => void>();
  const resource = createResourceAdapter<T, QueryFor<S>>(context);
  const C = D.createController({
    initial: { query: initial.query },
    now: () => CLOCK,
    validateCommand(command) {
      if (
        !live &&
        command.type !== "selection.cancel" &&
        !(
          command.type === "details.change" &&
          typeof command.update === "object" &&
          command.update.rowId === null
        )
      )
        throw new Error("E_SOURCE_CLOSED");
    },
  });
  let snapshot = Object.freeze({
    records,
    view: resource.getSnapshot(),
    version,
  });
  const publish = () => {
    snapshot = Object.freeze({
      records,
      view: resource.getSnapshot(),
      version: ++version,
    });
    for (const notify of listeners) notify();
  };
  function deliver() {
    if (mode === "client") return;
    const next = queued,
      state = C.getSnapshot();
    if (
      !live ||
      !next ||
      getQueryIdentity(D.native.controllerDefinition.schema, next.query, {
        now: CLOCK,
      }) !== state.queryIdentity ||
      state.evaluatedAt !== CLOCK ||
      next.plan.page !== state.query.pagination.pageIndex ||
      next.reply.length !== 100
    )
      throw new Error("E_PREPARED_REPLY_MISMATCH");
    const started = beginControlsRequest(D.native, C, resource, {
      ...context,
      queryKey: state.queryIdentity,
      requestKey: `wp14-read-${++serial}`,
      extent: { kind: "page", ...state.query.pagination },
    });
    if (
      !started ||
      started.request !== resource.getSnapshot().request ||
      started.request.evaluatedAt !== CLOCK
    )
      throw new Error("E_REQUEST_BEGIN");
    const previous = accepted;
    accepted = started.request;
    if (
      !resource.succeed(started.request, {
        source: "fresh",
        records: next.reply,
        page:
          mode === "server-known"
            ? { kind: "known", total: next.oracle.total }
            : { kind: "unknown", hasNextPage: next.oracle.hasNextPage },
        emptyKind: "filtered",
        receivedAt: "2026-11-25T12:00:00Z",
      })
    ) {
      accepted = previous;
      throw new Error("E_REQUEST_NOT_ACCEPTED");
    }
    queued = null;
  }
  let observedQuery = C.getSnapshot().queryIdentity;
  // FIRST controller subscriber, before the hook/renderer. Observe acceptance
  // before doing ANY server request/reply work. No earlier onQueryChange callback.
  const stopController = C.subscribe(() => {
    if (!live) return;
    const state = C.getSnapshot();
    timing.observe(state);
    if (state.queryIdentity !== observedQuery) {
      observedQuery = state.queryIdentity;
      try {
        deliver();
      } catch {
        timing.fail("E_SERVER_DELIVERY");
        throw new Error("E_SERVER_DELIVERY");
      }
    }
  });
  function purge(): undefined {
    live = false;
    records = [];
    queued = null;
    accepted = null;
    snapshot = Object.freeze({
      records,
      view: resource.getSnapshot(),
      version: ++version,
    });
    resource.clear();
    for (const clear of drafts) clear();
    C.dispatch({ type: "selection.cancel" });
    C.dispatch({ type: "details.change", update: { rowId: null } });
    if (
      resource.getSnapshot().snapshot ||
      C.getSnapshot().details.rowId !== null ||
      Object.values(C.getSnapshot().selection).some(Boolean)
    )
      throw new Error("E_PURGE_INCOMPLETE");
    publish();
    return undefined;
  }
  const P = createCriteriaPublication({
    controller: C,
    definition: C.getDefinition(),
    retirement: { retire: purge },
  });
  const begun = P.begin({
    controller: C,
    definition: C.getDefinition(),
    expected: context,
    actual: context,
  });
  if (
    begun.status !== "pending" ||
    P.complete(begun.ticket).status !== "settled"
  )
    throw new Error("E_PUBLICATION_NOT_SETTLED");
  const current = P.getSnapshot().current;
  if (!current) throw new Error("E_PUBLICATION_ABSENT");
  const criteria = P.issue({
    controller: C,
    definition: C.getDefinition(),
    context,
    epoch: current.epoch,
  });
  const unregister = P.registerParticipant(criteria, { purge }),
    stopResource = resource.connect(),
    stopObserveResource = resource.subscribe(publish);
  records = mode === "client" ? input : [];
  live = true;
  queued = initial;
  deliver();
  queued = null;
  publish();
  return {
    D,
    C,
    P,
    resource,
    criteria,
    context,
    timing,
    mode,
    getSnapshot: () => snapshot,
    subscribe(notify: () => void) {
      listeners.add(notify);
      return () => {
        listeners.delete(notify);
      };
    },
    isCurrent: () => live && !disposed,
    registerDraft(clear: () => void) {
      drafts.add(clear);
      return () => {
        drafts.delete(clear);
        clear();
      };
    },
    set(next: Prepared<S, T>, visibilityOnly = false) {
      if (!live || disposed || queued) throw new Error("E_SOURCE_BLOCKED");
      queued = next;
      const result = visibilityOnly
        ? C.dispatch({
            type: "columns.visibility",
            update: { reference: !next.plan.hidden },
          })
        : C.dispatch({ type: "query.replace", update: next.query });
      if (result.status === "committed" && result.notificationFailures !== 0)
        throw new Error("E_COMMIT_NOTIFICATION");
      if (result.status !== "committed" && result.status !== "noop")
        throw new Error("E_COMMAND_NOT_COMMITTED");
      queued = null;
      // An already-correct untimed reset can be a C no-op. Notify the borrower
      // so it rechecks actual model/DOM readiness; this does not grant a frame.
      publish();
      return result;
    },
    prepareTyping(next: Prepared<S, T>) {
      if (!live || queued) throw new Error("E_SOURCE_BLOCKED");
      queued = next;
    },
    options(): DataTableOptions<S, T> {
      const view = resource.getSnapshot();
      return {
        controller: C,
        publication: P,
        criteria,
        expected: context,
        source:
          mode === "client"
            ? { mode: "client", context, records }
            : {
                mode: "server",
                resource,
                view,
                bindings: {
                  request: view.request
                    ? getControlsRequestBinding(
                        D.native,
                        C,
                        resource,
                        view.request,
                      )
                    : null,
                  snapshot:
                    view.snapshot && accepted
                      ? getControlsRequestBinding(
                          D.native,
                          C,
                          resource,
                          accepted,
                        )
                      : null,
                },
              },
      };
    },
    checkServer(request: ResourceRequest<QueryFor<S>> | null) {
      if (mode === "client") return null;
      const view = resource.getSnapshot();
      if (
        !accepted ||
        request !== accepted ||
        view.request !== accepted ||
        !view.snapshot ||
        view.snapshot.queryKey !== C.getSnapshot().queryIdentity ||
        view.snapshot.generation !== accepted.generation ||
        view.snapshot.extent?.kind !== "page" ||
        view.snapshot.extent.pageIndex !==
          C.getSnapshot().query.pagination.pageIndex ||
        view.snapshot.extent.pageSize !== 100 ||
        !getControlsRequestBinding(D.native, C, resource, accepted)
      )
        throw new Error("E_SNAPSHOT_BINDING");
      return {
        definition: context.definitionKey,
        scope: digest(context.scopeKey),
        query: digest(accepted.queryKey),
        generation: accepted.generation,
        request: accepted.requestKey,
        evaluatedAt: accepted.evaluatedAt,
        page: view.snapshot.extent.pageIndex,
        size: view.snapshot.extent.pageSize,
      };
    },
    retire() {
      if (disposed) return true;
      live = false;
      if (P.dispose().status !== "disposed") return false;
      unregister();
      stopController();
      stopObserveResource();
      stopResource();
      resource.dispose();
      C.dispose();
      drafts.clear();
      listeners.clear();
      disposed = true;
      return true;
    },
    normalized(plan: Plan) {
      return query(D.native.controllerDefinition.schema, plan);
    },
  };
}
export type Source<S extends QuerySchema, T extends BenchClient> = ReturnType<
  typeof createSource<S, T>
>;
