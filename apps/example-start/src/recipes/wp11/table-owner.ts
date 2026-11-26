import type { QueryClient } from "@tanstack/react-query";
import {
  beginControlsRequest,
  createCriteriaPublication,
  createResourceAdapter,
  getControlsRequestBinding,
  type DataTableOptions,
  type ResourceContext,
  type ResourceRequest,
} from "@tableweave/react";
import { createQuery, type QueryFor } from "@tableweave/react/contracts";
import { transactionDefinition } from "../../../../examples/shared/definitions.js";
import {
  fixedNow,
  type Transaction,
} from "../../../../examples/shared/records.js";
import type { TransactionSchema } from "../../../../examples/shared/schemas.js";
import {
  recipePrefix,
  recipeQueryOptions,
  recipeRequestInput,
  type RecipeReader,
} from "./query-options.js";

export interface RecipeOwnerInput {
  readonly queryClient: QueryClient;
  readonly read: RecipeReader;
  /** Already-authorized synthetic application context; never inferred from Query. */
  readonly context: ResourceContext;
  readonly namespace: string;
  readonly initialQuery?: QueryFor<TransactionSchema>;
}
/** Fresh D/C/P/resource per actual application lifetime, not the WP-06 runtime. */
export function createRecipeOwner(input: RecipeOwnerInput) {
  const D = transactionDefinition();
  const context = Object.freeze({ ...input.context });
  if (
    !context.access ||
    context.definitionKey !== D.native.controllerDefinition.schema.id ||
    !input.namespace
  )
    throw new Error("Recipe requires an explicit current application domain");
  let connected = false,
    terminal = false,
    disposed = false,
    serial = 0;
  let pending: ResourceRequest<QueryFor<TransactionSchema>> | null = null,
    accepted: ResourceRequest<QueryFor<TransactionSchema>> | null = null;
  const resource = createResourceAdapter<
    Transaction,
    QueryFor<TransactionSchema>
  >(context);
  const C = D.createController({
    now: () => fixedNow,
    initial: {
      query:
        input.initialQuery ??
        createQuery(D.native.controllerDefinition.schema, {
          locale: "en-US",
          timeZone: "UTC",
        }),
    },
    onQueryChange() {
      if (connected && !terminal) load();
    },
  });
  function clear(): undefined {
    pending = null;
    accepted = null;
    resource.clear();
    if (!C.isDisposed()) {
      C.dispatch({ type: "selection.cancel" });
      C.dispatch({ type: "details.change", update: { rowId: null } });
    }
    // Caller promises this namespace is exclusive to this real application owner.
    void input.queryClient
      .cancelQueries({
        queryKey: recipePrefix(input.namespace),
      })
      .catch(() => {});
    input.queryClient.removeQueries({
      queryKey: recipePrefix(input.namespace),
    });
    return undefined;
  }
  const P = createCriteriaPublication({
    controller: C,
    definition: C.getDefinition(),
    retirement: {
      retire() {
        clear();
        if (
          resource.getSnapshot().snapshot ||
          Object.values(C.getSnapshot().selection).some(Boolean)
        )
          throw new Error("Recipe application retirement incomplete");
        return undefined;
      },
    },
  });
  const ticket = P.begin({
    controller: C,
    definition: C.getDefinition(),
    expected: context,
    actual: context,
  });
  if (
    ticket.status !== "pending" ||
    P.complete(ticket.ticket).status !== "settled"
  )
    throw new Error("Recipe publication unavailable");
  const current = P.getSnapshot().current;
  if (!current) throw new Error("Recipe lacks settled publication");
  const criteria = P.issue({
    controller: C,
    definition: C.getDefinition(),
    context,
    epoch: current.epoch,
  });
  async function execute(
    request: ResourceRequest<QueryFor<TransactionSchema>>,
  ) {
    if (!connected || terminal) return;
    pending = request;
    try {
      const result = await input.queryClient.query(
        recipeQueryOptions(
          input.namespace,
          recipeRequestInput(request),
          input.read,
        ),
      );
      if (
        terminal ||
        !connected ||
        pending !== request ||
        resource.getSnapshot().request !== request
      )
        return;
      const previous = accepted;
      accepted = request;
      try {
        if (
          !resource.succeed(request, result) &&
          !terminal &&
          connected &&
          pending === request
        )
          accepted = previous;
      } catch (error) {
        if (!terminal && connected && pending === request) accepted = previous;
        throw error;
      }
    } catch {
      if (!terminal && connected && pending === request)
        resource.fail(request, "unavailable");
    }
  }
  function load() {
    if (!connected || terminal) return;
    const result = beginControlsRequest(D.native, C, resource, {
      ...context,
      queryKey: C.getSnapshot().queryIdentity,
      requestKey: `${input.namespace}:${++serial}`,
      extent: { kind: "page", ...C.getSnapshot().query.pagination },
      retry(request) {
        void execute(request);
      },
    });
    if (result) void execute(result.request);
  }
  return {
    D,
    C,
    P,
    resource,
    load,
    criteria,
    isActive() {
      return connected && !terminal;
    },
    /** Caller creates this owner BEFORE its loader preloads; mount reuses fresh Query data. */
    preload() {
      if (terminal) throw new Error("Recipe owner ended");
      return input.queryClient.query(
        recipeQueryOptions(
          input.namespace,
          {
            ...context,
            query: C.getSnapshot().query,
            evaluatedAt: C.getSnapshot().evaluatedAt,
          },
          input.read,
        ),
      );
    },
    connect() {
      if (terminal || connected) return () => {};
      connected = true;
      const unregister = P.registerParticipant(criteria, { purge: clear });
      const stop = resource.connect();
      load();
      return () => {
        connected = false;
        unregister();
        clear();
        stop();
      };
    },
    modelOptions(): DataTableOptions<TransactionSchema, Transaction> {
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
    revoke() {
      if (terminal) return;
      terminal = true;
      const denied = { ...context, access: false };
      const change = P.begin({
        controller: C,
        definition: C.getDefinition(),
        expected: context,
        actual: denied,
      });
      if (change.status === "pending") P.complete(change.ticket);
      resource.setContext(denied);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      terminal = true;
      connected = false;
      P.dispose();
      clear();
      resource.dispose();
      C.dispose();
    },
  };
}
export type RecipeOwner = ReturnType<typeof createRecipeOwner>;
