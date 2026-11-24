import type { RowData } from "@tanstack/react-table";
import type { QueryExecutionExtent } from "../contracts/execution.js";
import type { QueryFor, QuerySchema } from "../contracts/types.js";
import type { MutationResult, TableController } from "../controller/types.js";
import type {
  PageInfo,
  ResourceAdapter,
  ResourceContext,
  ResourceRequest,
  ResourceRequestInput,
  ResourceView,
} from "../resource/types.js";
import type {
  NativeDefinition,
  NativeRow,
  NativeSelectionMode,
  NativeTableView,
} from "../tanstack/types.js";

declare const bindingBrand: unique symbol;
export interface ControlsRequestBinding<S extends QuerySchema> {
  readonly [bindingBrand]: true;
  readonly request: ResourceRequest<QueryFor<S>>;
  readonly definitionIdentity: string;
  readonly queryIdentity: string;
  readonly evaluatedAt: number;
  readonly extent: QueryExecutionExtent;
}
export type ControlsRequestInput<S extends QuerySchema> = Omit<
  ResourceRequestInput<QueryFor<S>>,
  "query" | "evaluatedAt"
>;
export interface ControlsRequestStart<S extends QuerySchema> {
  readonly request: ResourceRequest<QueryFor<S>>;
  readonly binding: ControlsRequestBinding<S>;
}
export interface ControlsBindings<S extends QuerySchema> {
  /** Binding for the adapter's current request, including retries. */
  readonly request: ControlsRequestBinding<S> | null;
  /** Binding retained by the application for the adapter's displayed snapshot. */
  readonly snapshot: ControlsRequestBinding<S> | null;
}
export type ControlsSource<S extends QuerySchema, T> =
  | {
      readonly mode: "client";
      readonly context: ResourceContext;
      readonly records: readonly T[];
    }
  | {
      readonly mode: "server" | "server-complete";
      readonly resource: ResourceAdapter<T, QueryFor<S>>;
      readonly view: ResourceView<T, QueryFor<S>>;
      readonly bindings: ControlsBindings<S>;
    };
export interface ControlsInput<S extends QuerySchema, T extends RowData> {
  readonly native: NativeTableView<S, T>;
  readonly expected: ResourceContext;
  readonly source: ControlsSource<S, T>;
  readonly manualOrder?: boolean;
}
export interface ControlsDisplayed<S extends QuerySchema> {
  readonly mode: "client" | "server" | "server-complete";
  readonly extent: QueryExecutionExtent;
  readonly query: QueryFor<S>;
  readonly queryIdentity: string;
  readonly evaluatedAt: number;
  readonly pagination: QueryFor<S>["pagination"];
  readonly pageInfo: PageInfo;
  readonly pageCount: number | null;
  readonly recordCount: number;
  /** Null for an empty out-of-range page; genuine zero results are 0..0. */
  readonly range: { readonly from: number; readonly to: number } | null;
  readonly request: ResourceRequest<QueryFor<S>> | null;
  readonly receivedAt: string | null;
}
export type ControlsBlockedReason =
  | "definition"
  | "context"
  | "source"
  | "binding"
  | "query"
  | "resource"
  | null;
export interface ControlsPresentation<
  S extends QuerySchema,
  T extends RowData,
> {
  readonly paginationEnabled: boolean;
  readonly selectionMode: NativeSelectionMode;
  readonly selectedIds: readonly string[];
  readonly loadedSelected: readonly {
    readonly id: string;
    readonly record: T;
  }[];
  readonly missingSelectedIds: readonly string[];
  readonly rows: readonly NativeRow<T>[];
  readonly eligiblePageIds: readonly string[];
  readonly pageSelection: {
    readonly supported: boolean;
    readonly checked: boolean;
    readonly mixed: boolean;
  };
  readonly displayed: ControlsDisplayed<S> | null;
  readonly requestedQuery: QueryFor<S> | null;
  readonly busy: boolean;
  readonly stale: boolean;
  /** Semantic displayed-query mismatch, not opaque key or object inequality. */
  readonly obsolete: boolean;
  readonly resourceObsolete: boolean;
  readonly blockedReason: ControlsBlockedReason;
  readonly canSelect: boolean;
  readonly canNavigate: boolean;
  readonly canPreviousPage: boolean;
  readonly canNextPage: boolean;
  readonly canReorder: boolean;
  readonly canRetry: boolean;
  readonly canCancelSelection: boolean;
}
export type ControlsIntent =
  | { readonly type: "sort" }
  | { readonly type: "columns" }
  | { readonly type: "select-row"; readonly id: string }
  | { readonly type: "select-page" }
  | { readonly type: "navigate" }
  | { readonly type: "reorder"; readonly ids: readonly string[] }
  | { readonly type: "retry" };
export interface ControlsAuthority<S extends QuerySchema, T extends RowData> {
  /** Event-time read only. No subscription, lifetime, buffer or commit method. */
  read(): ControlsPresentation<S, T>;
  /** sort/columns check the current owner/access domain, not old query/row freshness. */
  require(intent: ControlsIntent): ControlsPresentation<S, T>;
  selectRow(id: string, selected: boolean): MutationResult<S>;
  selectPage(selected: boolean): MutationResult<S>;
  cancelSelection(): MutationResult<S>;
  setPageIndex(pageIndex: number): MutationResult<S>;
  setPageSize(pageSize: number): MutationResult<S>;
  nextPage(): MutationResult<S>;
  previousPage(): MutationResult<S>;
  retry(): ResourceRequest<QueryFor<S>> | null;
}
export interface ControlsAuthorityOwner<
  S extends QuerySchema,
  T extends RowData,
> {
  readonly definition: NativeDefinition<S, T>;
  readonly controller: TableController<S>;
}
interface ControlsAuthorityBase<S extends QuerySchema, T extends RowData> {
  /** Optional denial-only current gate. Captured as own data, never a grant. */
  readonly checkCurrent?: () => undefined;
  readonly definition: NativeDefinition<S, T>;
  readonly controller: TableController<S>;
  /** Capture render-origin tags, never an opaque application request key. */
  readonly queryIdentity: string;
  readonly context: ResourceContext;
  /** Application-owned commit-phase port. Never assign speculative render inputs. */
  readonly readCommitted: () => ControlsInput<S, T>;
}
export type ControlsAuthorityOptions<
  S extends QuerySchema,
  T extends RowData,
> = ControlsAuthorityBase<S, T> &
  (
    | { readonly mode: "client"; readonly resource?: never }
    | {
        readonly mode: "server" | "server-complete";
        readonly resource: ResourceAdapter<T, QueryFor<S>>;
      }
  );
