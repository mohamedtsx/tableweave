import { canonicalJson } from "../contracts/json.js";
import type { WireQuery } from "../contracts/types.js";
import type {
  ResourceContext,
  ResourceError,
  ResourceErrorCode,
  ResourceRequest,
  ResourceView,
} from "./types.js";

const errors: Readonly<Record<ResourceErrorCode, ResourceError>> =
  Object.freeze({
    unavailable: Object.freeze({
      code: "unavailable",
      message: "Records could not be loaded.",
    }),
    offline: Object.freeze({
      code: "offline",
      message: "Records are unavailable while offline.",
    }),
    timeout: Object.freeze({
      code: "timeout",
      message: "The request timed out.",
    }),
    "access-lost": Object.freeze({
      code: "access-lost",
      message: "Access to these records is unavailable.",
    }),
  });

export function publicResourceError(code: unknown): ResourceError {
  return typeof code === "string" && Object.hasOwn(errors, code)
    ? errors[code as ResourceErrorCode]
    : errors.unavailable;
}

export function sameResourceContext(
  a: ResourceContext,
  b: ResourceContext,
): boolean {
  return (
    a.definitionKey === b.definitionKey &&
    a.scopeKey === b.scopeKey &&
    a.access === b.access
  );
}

export type ResourceCore<T, Q extends WireQuery> = Pick<
  ResourceView<T, Q>,
  | "context"
  | "active"
  | "kind"
  | "request"
  | "snapshot"
  | "error"
  | "invalidationFailed"
>;

function sameExtent(a: ResourceRequest, b: ResourceRequest): boolean {
  const left = a.extent;
  const right = b.extent;
  if (left?.kind === "complete" || right?.kind === "complete")
    return left?.kind === right?.kind;
  return (
    (left?.pageIndex ?? a.query.pagination.pageIndex) ===
      (right?.pageIndex ?? b.query.pagination.pageIndex) &&
    (left?.pageSize ?? a.query.pagination.pageSize) ===
      (right?.pageSize ?? b.query.pagination.pageSize)
  );
}

export function resourceView<T, Q extends WireQuery>(
  core: ResourceCore<T, Q>,
  retryAvailable = false,
): ResourceView<T, Q> {
  const { kind, snapshot, request, active, context } = core;
  const busy = kind === "pending";
  const stale = snapshot !== null && (busy || kind === "failure");
  const obsolete =
    snapshot !== null &&
    request !== null &&
    (snapshot.queryKey !== request.queryKey ||
      snapshot.requestKey !== request.requestKey ||
      !sameExtent(snapshot, request) ||
      canonicalJson(snapshot.query) !== canonicalJson(request.query));
  const usable =
    active &&
    context.access &&
    !core.invalidationFailed &&
    snapshot !== null &&
    !obsolete;
  return Object.freeze({
    ...core,
    display:
      kind === "blocked" || kind === "disposed"
        ? "blocked"
        : snapshot
          ? snapshot.records.length
            ? "records"
            : stale
              ? "updating-empty"
              : "empty"
          : busy
            ? "loading"
            : kind === "failure"
              ? "error"
              : "idle",
    notice: stale ? (busy ? "updating" : "update-failed") : null,
    busy,
    stale,
    obsolete,
    canSelect: usable,
    canReorder: usable && !busy && kind === "ready",
    canNavigate:
      usable && kind === "ready" && snapshot?.extent?.kind !== "complete",
    canRetry: kind === "failure" && active && context.access && retryAvailable,
  });
}

/** Pure render-time privacy guard. It never commits or adopts data. */
export function projectResourceView<T, Q extends WireQuery>(
  view: ResourceView<T, Q>,
  expected: ResourceContext,
): ResourceView<T, Q> {
  if (sameResourceContext(view.context, expected)) return view;
  // A current-request access failure remains terminal even if the application
  // has not yet updated its permission prop. Rendering cannot restore access.
  if (
    view.context.definitionKey === expected.definitionKey &&
    view.context.scopeKey === expected.scopeKey &&
    !view.context.access &&
    expected.access
  )
    return view;
  return resourceView({
    context: Object.freeze({
      definitionKey: expected.definitionKey,
      scopeKey: expected.scopeKey,
      access: expected.access,
    }),
    active: view.active,
    kind: expected.access && view.kind !== "disposed" ? "idle" : "blocked",
    request: null,
    snapshot: null,
    error: expected.access ? null : publicResourceError("access-lost"),
    invalidationFailed: view.invalidationFailed,
  });
}
