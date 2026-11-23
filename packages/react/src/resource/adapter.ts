import { cloneJson, freeze } from "../contracts/json.js";
import type { WireQuery } from "../contracts/types.js";
import type {
  ResourceAdapter,
  ResourceAdapterOptions,
  ResourceContext,
  ResourceInvalidationReason,
  ResourceRequest,
  ResourceRequestInput,
  ResourceSuccess,
} from "./types.js";
import type { ResourceCore } from "./view.js";
import {
  publicResourceError,
  resourceView,
  sameResourceContext,
} from "./view.js";

function invalid(): never {
  throw new Error("Invalid Tableweave resource input.");
}
function contextCopy(context: ResourceContext): ResourceContext {
  if (
    !context ||
    typeof context.definitionKey !== "string" ||
    !context.definitionKey ||
    typeof context.scopeKey !== "string" ||
    !context.scopeKey ||
    typeof context.access !== "boolean"
  )
    invalid();
  return Object.freeze({
    definitionKey: context.definitionKey,
    scopeKey: context.scopeKey,
    access: context.access,
  });
}

export function createResourceAdapter<T, Q extends WireQuery = WireQuery>(
  initial: ResourceContext,
  options: ResourceAdapterOptions = {},
): ResourceAdapter<T, Q> {
  const onInvalidate = options.onInvalidate;
  if (onInvalidate !== undefined && typeof onInvalidate !== "function")
    invalid();
  const context = contextCopy(initial);
  let core: ResourceCore<T, Q> = {
    context,
    active: true,
    kind: context.access ? "idle" : "blocked",
    request: null,
    snapshot: null,
    error: context.access ? null : publicResourceError("access-lost"),
    invalidationFailed: false,
  };
  let view = resourceView(core);
  const serverView = view;
  const listeners = new Set<{ notify: () => void }>();
  let sequence = 0;
  let open = false;
  let retryCallback: ResourceRequestInput<Q>["retry"];
  let lease: object | null = null;
  let mutating = false;
  let notifying = 0;
  const publish = () => {
    view = resourceView(core, retryCallback !== undefined);
    const previousMutation = mutating;
    mutating = false;
    notifying++;
    try {
      for (const listener of [...listeners]) {
        if (!listeners.has(listener)) continue;
        try {
          listener.notify();
        } catch {
          // One broken observer cannot prevent privacy invalidation/other readers.
        }
      }
    } finally {
      notifying--;
      mutating = previousMutation;
    }
  };
  const change = <R>(noop: R, action: () => R): R => {
    if (mutating || core.kind === "disposed") return noop;
    mutating = true;
    try {
      return action();
    } finally {
      mutating = false;
    }
  };
  const invalidate = (
    reason: ResourceInvalidationReason,
    next: ResourceContext,
    active = core.active,
  ) => {
    const previous = core.context;
    open = false;
    retryCallback = undefined;
    core = {
      context: next,
      active,
      kind:
        reason === "dispose" ? "disposed" : next.access ? "idle" : "blocked",
      request: null,
      snapshot: null,
      error: next.access ? null : publicResourceError("access-lost"),
      invalidationFailed: false,
    };
    // Publish the cleared read BEFORE the synchronous external lifecycle port.
    view = resourceView(core);
    try {
      const result: unknown = onInvalidate?.(
        Object.freeze({ reason, previous, next }),
      );
      // TypeScript permits async functions at void callback sites. A deferred
      // private-state clear cannot satisfy this synchronous lifecycle contract.
      if (
        result !== null &&
        (typeof result === "object" || typeof result === "function") &&
        typeof (result as { then?: unknown }).then === "function"
      ) {
        core = { ...core, invalidationFailed: true };
        void Promise.resolve(result).catch(() => {});
      }
    } catch {
      core = { ...core, invalidationFailed: true };
    }
    publish();
  };
  const accepts = (request: ResourceRequest<Q>) =>
    core.active && core.context.access && open && core.request === request;
  const begin = (input: ResourceRequestInput<Q>): ResourceRequest<Q> | null =>
    change(null, () => {
      if (
        notifying ||
        !core.active ||
        !core.context.access ||
        core.invalidationFailed ||
        input.definitionKey !== core.context.definitionKey ||
        input.scopeKey !== core.context.scopeKey
      )
        return null;
      if (
        typeof input.queryKey !== "string" ||
        !input.queryKey ||
        typeof input.requestKey !== "string" ||
        !input.requestKey ||
        (input.retry !== undefined && typeof input.retry !== "function")
      )
        invalid();
      let query: Q;
      try {
        query = freeze(cloneJson(input.query));
        if (
          query.version !== 1 ||
          !Number.isSafeInteger(query.pagination.pageIndex) ||
          query.pagination.pageIndex < 0 ||
          !Number.isSafeInteger(query.pagination.pageSize) ||
          query.pagination.pageSize < 1
        )
          invalid();
      } catch {
        return invalid();
      }
      const request = Object.freeze({
        definitionKey: input.definitionKey,
        scopeKey: input.scopeKey,
        queryKey: input.queryKey,
        requestKey: input.requestKey,
        generation: ++sequence,
        query,
      });
      open = true;
      retryCallback = input.retry;
      core = { ...core, kind: "pending", request, error: null };
      publish();
      // Observers may synchronously revoke/switch scope. Do not hand an obsolete
      // token back to an application about to start its transport.
      return core.request === request ? request : null;
    });
  const fail = (request: ResourceRequest<Q>, code: unknown): boolean =>
    change(false, () => {
      if (!accepts(request)) return false;
      const error = publicResourceError(code);
      if (error.code === "access-lost") {
        invalidate(
          "access-loss",
          contextCopy({ ...core.context, access: false }),
        );
      } else {
        open = false;
        core = { ...core, kind: "failure", error };
        publish();
      }
      return true;
    });
  const adapter: ResourceAdapter<T, Q> = {
    getSnapshot: () => view,
    getServerSnapshot: () => serverView,
    subscribe(listener) {
      if (core.kind === "disposed") return () => {};
      const entry = { notify: listener };
      listeners.add(entry);
      return () => listeners.delete(entry);
    },
    begin,
    succeed(request: ResourceRequest<Q>, result: ResourceSuccess<T>) {
      return change(false, () => {
        if (!accepts(request) || result.source === "placeholder") return false;
        if (
          result.source !== "fresh" ||
          !Array.isArray(result.records) ||
          !["dataset", "filtered", "unknown"].includes(result.emptyKind) ||
          typeof result.receivedAt !== "string" ||
          !Number.isFinite(Date.parse(result.receivedAt))
        )
          invalid();
        const page = result.page;
        if (
          !page ||
          (page.kind !== "known" && page.kind !== "unknown") ||
          (page.kind === "known" &&
            (!Number.isSafeInteger(page.total) || page.total < 0)) ||
          (page.kind === "unknown" && typeof page.hasNextPage !== "boolean")
        )
          invalid();
        const snapshot = Object.freeze({
          ...request,
          records: Object.freeze([...result.records]),
          page: Object.freeze(
            page.kind === "known"
              ? { kind: "known" as const, total: page.total }
              : { kind: "unknown" as const, hasNextPage: page.hasNextPage },
          ),
          emptyKind: result.emptyKind,
          receivedAt: result.receivedAt,
        });
        open = false;
        retryCallback = undefined;
        core = { ...core, kind: "ready", snapshot, error: null };
        publish();
        return true;
      });
    },
    fail,
    retry() {
      if (!view.canRetry || !core.request || !retryCallback || mutating)
        return null;
      const callback = retryCallback;
      const request = begin({ ...core.request, retry: callback });
      if (!request) return null;
      // Invoke outside mutation: applications may synchronously settle requests.
      try {
        const result = callback(request);
        if (result !== undefined)
          void Promise.resolve(result).catch(() =>
            fail(request, "unavailable"),
          );
      } catch {
        fail(request, "unavailable");
      }
      return request;
    },
    setContext(nextInput) {
      change(undefined, () => {
        const next = contextCopy(nextInput);
        if (sameResourceContext(core.context, next)) return;
        const reason =
          core.context.scopeKey !== next.scopeKey
            ? "scope-change"
            : core.context.definitionKey !== next.definitionKey
              ? "definition-change"
              : next.access
                ? "access-change"
                : "access-loss";
        invalidate(reason, next);
      });
    },
    clear(reason = "reset") {
      change(undefined, () => {
        if (reason !== "reset" && reason !== "unmount") invalid();
        invalidate(
          reason,
          core.context,
          reason === "unmount" ? false : core.active,
        );
      });
    },
    connect() {
      if (core.kind === "disposed") return () => {};
      if (lease !== null || mutating) invalid();
      const currentLease = {};
      lease = currentLease;
      change(undefined, () => {
        if (!core.active) {
          core = { ...core, active: true };
          publish();
        }
      });
      return () => {
        if (lease !== currentLease) return;
        lease = null;
        adapter.clear("unmount");
      };
    },
    dispose() {
      change(undefined, () => {
        lease = null;
        invalidate("dispose", core.context, false);
        listeners.clear();
      });
    },
  };
  return Object.freeze(adapter);
}
