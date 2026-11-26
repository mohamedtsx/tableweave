import {
  beginControlsRequest,
  createCriteriaPublication,
  createResourceAdapter,
  getControlsRequestBinding,
  type DataTableOptions,
  type ResourceRequest,
  type ResourceSuccess,
  type TableDefinition,
} from "@tableweave/react";
import type { QueryFor, QuerySchema } from "@tableweave/react/contracts";
import { SourceEnded } from "./types.js";

export interface SourcePort<S extends QuerySchema, T extends object> {
  readonly scopeKey: string;
  readonly clock: number;
  readonly query: QueryFor<S>;
  isCurrent(): boolean;
  read(
    request: ResourceRequest<QueryFor<S>>,
    force: boolean,
  ): Promise<ResourceSuccess<T>>;
  lost(): void;
}
/** Retained APPLICATION source. Its UI borrower never owns connect/dispose. */
export function createTableSource<S extends QuerySchema, T extends object>(
  D: TableDefinition<S, T>,
  port: SourcePort<S, T>,
) {
  const context = {
    definitionKey: D.native.controllerDefinition.schema.id,
    scopeKey: port.scopeKey,
    access: true,
  };
  let live = true,
    disposed = false,
    activated = false;
  let pending: ResourceRequest<QueryFor<S>> | null = null,
    accepted: ResourceRequest<QueryFor<S>> | null = null;
  const drafts = new Set<() => void>();
  const resource = createResourceAdapter<T, QueryFor<S>>(context);
  const C = D.createController({
    initial: { query: port.query },
    now: () => port.clock,
    validateCommand(command) {
      if (
        (!live || !port.isCurrent()) &&
        command.type !== "selection.cancel" &&
        !(
          command.type === "details.change" &&
          typeof command.update === "object" &&
          command.update.rowId === null
        )
      )
        throw new SourceEnded();
    },
    onQueryChange() {
      if (activated && live && port.isCurrent()) load();
    },
  });
  function purge(): undefined {
    pending = null;
    accepted = null;
    resource.clear();
    for (const clear of drafts) clear();
    C.dispatch({ type: "selection.cancel" });
    C.dispatch({ type: "details.change", update: { rowId: null } });
    return undefined;
  }
  const P = createCriteriaPublication({
    controller: C,
    definition: C.getDefinition(),
    retirement: {
      retire() {
        purge();
        if (
          resource.getSnapshot().snapshot !== null ||
          C.getSnapshot().details.rowId !== null ||
          Object.values(C.getSnapshot().selection).some(Boolean)
        )
          throw new SourceEnded();
        return undefined;
      },
    },
  });
  const begin = P.begin({
    controller: C,
    definition: C.getDefinition(),
    expected: context,
    actual: context,
  });
  if (
    begin.status !== "pending" ||
    P.complete(begin.ticket).status !== "settled"
  )
    throw new SourceEnded();
  const current = P.getSnapshot().current;
  if (!current || !port.isCurrent()) throw new SourceEnded();
  const criteria = P.issue({
    controller: C,
    definition: C.getDefinition(),
    context,
    epoch: current.epoch,
  });
  const unregister = P.registerParticipant(criteria, { purge });
  const stop = resource.connect();
  let serial = 0;
  async function execute(
    request: ResourceRequest<QueryFor<S>>,
    force: boolean,
  ) {
    if (!live || !port.isCurrent()) return;
    pending = request;
    try {
      const result = await port.read(request, force);
      if (
        !live ||
        !port.isCurrent() ||
        pending !== request ||
        resource.getSnapshot().request !== request
      )
        return;
      const previous = accepted;
      accepted = request;
      try {
        if (
          !resource.succeed(request, result) &&
          live &&
          port.isCurrent() &&
          pending === request
        )
          accepted = previous;
      } catch (error) {
        if (live && port.isCurrent() && pending === request)
          accepted = previous;
        throw error;
      }
    } catch (error) {
      if (!live || !port.isCurrent() || pending !== request) return;
      if (error instanceof SourceEnded) port.lost();
      else resource.fail(request, "unavailable");
    }
  }
  function load(force = false) {
    if (!live || !port.isCurrent()) return;
    const state = C.getSnapshot();
    const started = beginControlsRequest(D.native, C, resource, {
      ...context,
      queryKey: state.queryIdentity,
      requestKey: `read-${++serial}`,
      extent: { kind: "page", ...state.query.pagination },
      retry(request) {
        void execute(request, true);
      },
    });
    if (started) void execute(started.request, force);
  }
  return {
    D,
    C,
    P,
    resource,
    criteria,
    activate() {
      if (!activated && live && port.isCurrent()) {
        activated = true;
        load();
      }
    },
    refresh() {
      load(true);
    },
    isCurrent: () => live && port.isCurrent(),
    registerDraft(clear: () => void) {
      drafts.add(clear);
      return () => {
        drafts.delete(clear);
        clear();
      };
    },
    modelOptions(): DataTableOptions<S, T> {
      const view = resource.getSnapshot();
      return {
        controller: C,
        publication: P,
        criteria,
        expected: context,
        source: {
          mode: "server",
          resource,
          view,
          bindings: {
            request: view.request
              ? getControlsRequestBinding(D.native, C, resource, view.request)
              : null,
            snapshot:
              view.snapshot && accepted
                ? getControlsRequestBinding(D.native, C, resource, accepted)
                : null,
          },
        },
      };
    },
    retire(): boolean {
      if (disposed) return true;
      live = false;
      const ended = P.dispose();
      if (ended.status !== "disposed") return false;
      unregister();
      stop();
      drafts.clear();
      resource.dispose();
      C.dispose();
      disposed = true;
      return true;
    },
  };
}
export type TableSource<S extends QuerySchema, T extends object> = ReturnType<
  typeof createTableSource<S, T>
>;
