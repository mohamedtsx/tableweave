import type { WireQuery } from "../contracts/types.js";

export interface ResourceContext {
  readonly definitionKey: string;
  readonly scopeKey: string;
  readonly access: boolean;
}

export type PageInfo =
  | { readonly kind: "known"; readonly total: number }
  | { readonly kind: "unknown"; readonly hasNextPage: boolean };
export type EmptyKind = "dataset" | "filtered" | "unknown";

export interface ResourceRequest<Q extends WireQuery = WireQuery> {
  readonly definitionKey: string;
  readonly scopeKey: string;
  readonly queryKey: string;
  readonly requestKey: string;
  readonly generation: number;
  readonly query: Q;
}

export interface ResourceRequestInput<Q extends WireQuery = WireQuery> {
  readonly definitionKey: string;
  readonly scopeKey: string;
  readonly queryKey: string;
  readonly requestKey: string;
  /** Already accepted/validated query. Keys must describe this exact request. */
  readonly query: Q;
  /** Application starts the request using the NEW token, including its query. */
  // biome-ignore lint/suspicious/noConfusingVoidType: Application callbacks can finish synchronously or asynchronously.
  readonly retry?: (request: ResourceRequest<Q>) => void | Promise<unknown>;
}

export interface ResourceSuccess<T> {
  readonly source: "fresh" | "placeholder";
  readonly records: readonly T[];
  readonly page: PageInfo;
  readonly emptyKind: EmptyKind;
  readonly receivedAt: string;
}

export interface ResourceSnapshot<T, Q extends WireQuery = WireQuery>
  extends ResourceRequest<Q> {
  readonly records: readonly T[];
  readonly page: PageInfo;
  readonly emptyKind: EmptyKind;
  readonly receivedAt: string;
}

export type ResourceErrorCode =
  | "unavailable"
  | "offline"
  | "timeout"
  | "access-lost";
export interface ResourceError {
  readonly code: ResourceErrorCode;
  readonly message: string;
}

export type ResourceInvalidationReason =
  | "scope-change"
  | "definition-change"
  | "access-change"
  | "access-loss"
  | "unmount"
  | "reset"
  | "dispose";
export interface ResourceInvalidation {
  readonly reason: ResourceInvalidationReason;
  readonly previous: ResourceContext;
  readonly next: ResourceContext;
}
export interface ResourceAdapterOptions {
  /**
   * Synchronously clear app-owned selection, details, option labels and transient
   * operations. This port is not backend authorization. Internal rows/tokens are
   * cleared first; an exception is reported as invalidationFailed, never exposed.
   */
  readonly onInvalidate?: (event: ResourceInvalidation) => void;
}

export interface ResourceView<T, Q extends WireQuery = WireQuery> {
  readonly context: ResourceContext;
  readonly active: boolean;
  readonly kind:
    | "idle"
    | "pending"
    | "ready"
    | "failure"
    | "blocked"
    | "disposed";
  readonly request: ResourceRequest<Q> | null;
  /** At most one accepted fresh snapshot, including successful empty results. */
  readonly snapshot: ResourceSnapshot<T, Q> | null;
  readonly error: ResourceError | null;
  readonly invalidationFailed: boolean;
  readonly display:
    | "idle"
    | "loading"
    | "error"
    | "records"
    | "empty"
    | "updating-empty"
    | "blocked";
  readonly notice: "updating" | "update-failed" | null;
  readonly busy: boolean;
  readonly stale: boolean;
  readonly obsolete: boolean;
  readonly canSelect: boolean;
  readonly canReorder: boolean;
  readonly canNavigate: boolean;
  readonly canRetry: boolean;
}

export interface ResourceAdapter<T, Q extends WireQuery = WireQuery> {
  readonly getSnapshot: () => ResourceView<T, Q>;
  /** Stable initial empty view, not an SSR dehydration/cache implementation. */
  readonly getServerSnapshot: () => ResourceView<T, Q>;
  readonly subscribe: (listener: () => void) => () => void;
  readonly begin: (input: ResourceRequestInput<Q>) => ResourceRequest<Q> | null;
  readonly succeed: (
    request: ResourceRequest<Q>,
    result: ResourceSuccess<T>,
  ) => boolean;
  /** Raw errors are accepted only to map them to a fixed generic public error. */
  readonly fail: (request: ResourceRequest<Q>, code: unknown) => boolean;
  readonly retry: () => ResourceRequest<Q> | null;
  readonly setContext: (context: ResourceContext) => void;
  readonly clear: (reason?: "reset" | "unmount") => void;
  /** One hook owner; cleanup clears the buffer without permanently disposing. */
  readonly connect: () => () => void;
  readonly dispose: () => void;
}
