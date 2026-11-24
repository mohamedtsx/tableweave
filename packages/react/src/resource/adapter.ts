import type { QueryExecutionExtent } from "../contracts/execution.js";
import { cloneJson, freeze } from "../contracts/json.js";
import type { WireQuery } from "../contracts/types.js";
import type {
  PageInfo,
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

// Capture only consumed own data; unrelated envelope fields (including retry's
// generation) are not enumerated. The cache also covers aliased payload objects.
class Capture {
  private readonly fields = new WeakMap<
    object,
    Map<string, PropertyDescriptor | undefined>
  >();

  descriptor(input: unknown, key: string): PropertyDescriptor | undefined {
    if (
      input === null ||
      (typeof input !== "object" && typeof input !== "function")
    )
      return invalid();
    let fields = this.fields.get(input);
    if (!fields) {
      fields = new Map();
      this.fields.set(input, fields);
    }
    if (!fields.has(key))
      fields.set(key, Object.getOwnPropertyDescriptor(input, key));
    return fields.get(key);
  }

  data(input: unknown, key: string, optional = false): unknown {
    const field = this.descriptor(input, key);
    if (!field && optional) return undefined;
    if (!field || !Object.hasOwn(field, "value")) return invalid();
    return field.value;
  }

  extent(input: unknown, query: WireQuery): QueryExecutionExtent {
    if (!input || typeof input !== "object" || Array.isArray(input))
      return invalid();
    const prototype: unknown = Object.getPrototypeOf(input);
    if (prototype !== Object.prototype && prototype !== null) return invalid();
    const keys = Reflect.ownKeys(input);
    for (const key of keys) {
      if (
        typeof key !== "string" ||
        !["kind", "pageIndex", "pageSize"].includes(key) ||
        !this.descriptor(input, key)?.enumerable
      )
        return invalid();
      this.data(input, key);
    }
    const kind = this.data(input, "kind");
    if (kind === "complete" && keys.length === 1)
      return Object.freeze({ kind });
    if (kind !== "page" || keys.length !== 3) return invalid();
    const pageIndex = this.data(input, "pageIndex");
    const pageSize = this.data(input, "pageSize");
    if (
      pageIndex !== query.pagination.pageIndex ||
      pageSize !== query.pagination.pageSize
    )
      return invalid();
    return Object.freeze({ kind, pageIndex, pageSize });
  }
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
        core.invalidationFailed
      )
        return null;
      const currentContext = core.context;
      const capture = new Capture();
      let query: Q;
      let definitionKey: string;
      let scopeKey: string;
      let queryKey: string;
      let requestKey: string;
      let retry: ResourceRequestInput<Q>["retry"];
      let metadata: {
        readonly extent?: QueryExecutionExtent;
        readonly evaluatedAt?: number;
      } = {};
      try {
        const definition = capture.data(input, "definitionKey", true);
        if (definition !== currentContext.definitionKey) return null;
        const scope = capture.data(input, "scopeKey", true);
        if (scope !== currentContext.scopeKey) return null;
        definitionKey = definition;
        scopeKey = scope;
        const key = capture.data(input, "queryKey");
        const request = capture.data(input, "requestKey");
        const callback = capture.data(input, "retry", true);
        if (
          typeof key !== "string" ||
          !key ||
          typeof request !== "string" ||
          !request ||
          (callback !== undefined && typeof callback !== "function")
        )
          invalid();
        queryKey = key;
        requestKey = request;
        retry = callback as ResourceRequestInput<Q>["retry"];
        query = freeze(cloneJson(capture.data(input, "query"))) as Q;
        if (
          query.version !== 1 ||
          !Number.isSafeInteger(query.pagination.pageIndex) ||
          query.pagination.pageIndex < 0 ||
          !Number.isSafeInteger(query.pagination.pageSize) ||
          query.pagination.pageSize < 1
        )
          invalid();
        const extent = capture.descriptor(input, "extent");
        const time = capture.descriptor(input, "evaluatedAt");
        if (extent || time) {
          if (!extent?.enumerable || !time?.enumerable) invalid();
          const now = capture.data(input, "evaluatedAt");
          if (
            typeof now !== "number" ||
            !Number.isFinite(now) ||
            !Number.isFinite(new Date(now).getTime())
          )
            invalid();
          metadata = {
            extent: capture.extent(capture.data(input, "extent"), query),
            evaluatedAt: now,
          };
        }
      } catch {
        return invalid();
      }
      if (
        core.context !== currentContext ||
        !core.active ||
        !core.context.access ||
        core.invalidationFailed ||
        notifying
      )
        return null;
      const request = Object.freeze({
        definitionKey,
        scopeKey,
        queryKey,
        requestKey,
        generation: ++sequence,
        query,
        ...metadata,
      });
      open = true;
      retryCallback = retry;
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
        if (!accepts(request)) return false;
        const currentContext = core.context;
        const capture = new Capture();
        const records: T[] = [];
        let page: PageInfo;
        let emptyKind: ResourceSuccess<T>["emptyKind"];
        let receivedAt: string;
        try {
          const source = capture.data(result, "source");
          if (source === "placeholder") return false;
          if (
            source !== "fresh" ||
            capture.descriptor(result, "extent") ||
            capture.descriptor(result, "evaluatedAt")
          )
            invalid();
          const provided = capture.data(result, "records");
          const empty = capture.data(result, "emptyKind");
          const received = capture.data(result, "receivedAt");
          if (
            !Array.isArray(provided) ||
            typeof empty !== "string" ||
            !["dataset", "filtered", "unknown"].includes(empty) ||
            typeof received !== "string" ||
            !Number.isFinite(Date.parse(received))
          )
            invalid();
          emptyKind = empty as ResourceSuccess<T>["emptyKind"];
          receivedAt = received;
          const suppliedPage = capture.data(result, "page");
          const kind = capture.data(suppliedPage, "kind");
          if (kind === "known") {
            const total = capture.data(suppliedPage, "total");
            if (
              typeof total !== "number" ||
              !Number.isSafeInteger(total) ||
              total < 0
            )
              invalid();
            page = Object.freeze({ kind, total });
          } else if (kind === "unknown") {
            const hasNextPage = capture.data(suppliedPage, "hasNextPage");
            if (typeof hasNextPage !== "boolean") invalid();
            page = Object.freeze({ kind, hasNextPage });
          } else invalid();
          const length = capture.data(provided, "length");
          if (
            typeof length !== "number" ||
            !Number.isSafeInteger(length) ||
            length < 0
          )
            invalid();
          for (let index = 0; index < length; index++) {
            const field = capture.descriptor(provided, String(index));
            if (!field && request.extent?.kind === "complete") invalid();
            // Legacy/page holes still materialize undefined, as the old array
            // spread did. Accessor indices are never invoked in either mode.
            records.push(capture.data(provided, String(index), true) as T);
          }
          if (
            request.extent?.kind === "complete" &&
            (page.kind !== "known" || page.total !== records.length)
          )
            invalid();
        } catch {
          return invalid();
        }
        if (!accepts(request) || core.context !== currentContext) return false;
        const snapshot = Object.freeze({
          ...request,
          records: Object.freeze(records),
          page,
          emptyKind,
          receivedAt,
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
