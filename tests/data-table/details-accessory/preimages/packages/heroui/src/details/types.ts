import type {
  NativeRow,
  NativeTableView,
  StateProposal,
  TableController,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import type { ReactNode } from "react";

/** Application lifecycle identity, not permission or a backend authorization token.
 * Primitive envelopes require plain own data properties; accessors fail closed.
 */
export interface DetailsContext {
  readonly definitionKey: string;
  readonly datasetKey: string;
  readonly scopeKey: string;
  readonly access: boolean;
  /** Increment on invalidation, including an A -> B -> A scope transition. */
  readonly epoch: number;
}

export interface DetailsAuthority {
  readonly context: DetailsContext;
  readonly rowId: string | null;
  /** Increment on every target session, including closing/reopening the same ID. */
  readonly session: number;
  /** Increment when replacing/retrying a detail request, not its target session.
   * Current-port generation governs data freshness even while render props lag.
   */
  readonly generation: number;
}

export type DetailsSource<T> = {
  readonly authority: DetailsAuthority;
} & (
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly record: T;
      readonly stale?: boolean;
      readonly busy?: boolean;
    }
  | { readonly status: "missing" }
  | {
      readonly status: "error";
      readonly code: "unavailable" | "offline" | "timeout";
    }
);

export type DetailsReason =
  | "trigger"
  | "replace"
  | "close-button"
  | "footer"
  | "dismiss" // RAC reports no gesture reason: Escape/backdrop use this same policy.
  | "programmatic";
export interface DetailsChangeRequest {
  readonly authority: DetailsAuthority;
  readonly fromId: string | null;
  readonly toId: string | null;
  readonly reason: DetailsReason;
}
export type DetailsOutcome<S extends QuerySchema> =
  | {
      readonly status:
        | "blocked"
        | "stale"
        | "busy"
        | "failed"
        | "rejected"
        | "noop";
    }
  | { readonly status: "submitted"; readonly proposal: StateProposal<S> }
  | { readonly status: "committed"; readonly notificationFailures: number };

/** App captures this association at the matching native-input frame's commit.
 * Origin is immutable: never attach a new scope to a retained view after the fact.
 * Do not derive origin from read-time authority. If association is unproven, omit
 * the frame; an independently supplied detail record remains fully supported.
 * This is application provenance, not backend authorization or a library attestation.
 */
export interface DetailsNativeFrame<S extends QuerySchema, T extends object> {
  readonly origin: DetailsContext;
  readonly owner: TableController<S>;
  readonly view: NativeTableView<S, T>;
}

/** One atomic application snapshot: authority plus its optional committed frame. */
export interface DetailsCurrent<S extends QuerySchema, T extends object> {
  readonly authority: DetailsAuthority;
  readonly nativeFrame?: DetailsNativeFrame<S, T>;
}

export interface DetailsPort<S extends QuerySchema, T extends object> {
  /** Pure atomic CURRENT read; called during render and events. No fetching/writes.
   * Metadata uses plain own data properties (no accessors). Missing frame is valid.
   */
  read(): DetailsCurrent<S, T>;
  /** Application starts its own request. Must mint/validate its next generation. */
  // biome-ignore lint/suspicious/noConfusingVoidType: Application ports may finish synchronously or asynchronously.
  retry?(authority: DetailsAuthority): void | Promise<unknown>;
}

export interface DetailsOptions<S extends QuerySchema, T extends object> {
  readonly controller: TableController<S>;
  readonly expected: DetailsContext;
  readonly authority: DetailsAuthority;
  readonly source: DetailsSource<T> | null;
  readonly port: DetailsPort<S, T>;
  readonly visibleFieldIds: readonly string[];
  readonly hiddenFieldIds: readonly string[];
  /** Optional own data callback. An accessor/invalid supplied callback blocks
   * destructive changes; it never becomes an absent/default-allow policy.
   * Callback receivers are preserved. A request retains its captured observer.
   */
  readonly beforeChange?: (
    request: DetailsChangeRequest,
  ) => boolean | Promise<boolean>;
  readonly onOutcome?: (
    outcome: DetailsOutcome<S>,
    request: DetailsChangeRequest,
  ) => void;
  readonly focusFallback: (
    reason: "closed" | "invalidated" | "unmounted",
  ) => void;
}

export interface DetailsOpenOptions {
  /** Return false when disconnected/invalid so the safe application fallback runs. */
  readonly restoreFocus?: () => boolean;
}

export interface DetailsRenderContext<S extends QuerySchema, T extends object> {
  readonly recordId: string;
  readonly status: "loading" | "ready" | "missing" | "error";
  readonly record: T | undefined;
  readonly row: NativeRow<T> | undefined;
  readonly isStale: boolean;
  readonly isBusy: boolean;
  readonly policyBusy: boolean;
  readonly errorCode: "unavailable" | "offline" | "timeout" | null;
  readonly visibleFieldIds: readonly string[];
  readonly hiddenFieldIds: readonly string[];
  requestClose(reason?: DetailsReason): Promise<DetailsOutcome<S>>;
  requestOpen(
    rowId: string,
    options?: DetailsOpenOptions,
  ): Promise<DetailsOutcome<S>>;
}

export interface DetailsSession<S extends QuerySchema, T extends object> {
  /** Interior identity changes only with target/lifecycle session, never resizing or refetch. */
  readonly contentKey: string;
  readonly isOpen: boolean;
  readonly context: DetailsRenderContext<S, T> | null;
  readonly canRetry: boolean;
  requestClose(reason?: DetailsReason): Promise<DetailsOutcome<S>>;
  requestOpen(
    rowId: string,
    options?: DetailsOpenOptions,
  ): Promise<DetailsOutcome<S>>;
  retry(): Promise<"submitted" | "stale" | "failed" | "unavailable">;
}

export interface DetailsMessages {
  readonly close: string;
  readonly cancel: string;
  readonly loading: string;
  readonly missing: string;
  readonly unavailable: string;
  readonly offline: string;
  readonly timeout: string;
  readonly retry: string;
  readonly checking: string;
}

export interface DetailsShellProps<S extends QuerySchema, T extends object> {
  readonly session: DetailsSession<S, T>;
  readonly title: string;
  readonly description?: string;
  readonly direction?: "ltr" | "rtl";
  readonly messages?: Partial<DetailsMessages>;
  readonly className?: string;
  readonly dismissOnOutside?: boolean;
  readonly dismissOnEscape?: boolean;
  readonly focusInitial?: () => void;
  readonly renderHeader?: (context: DetailsRenderContext<S, T>) => ReactNode;
  /** Called in every allowed session status, without unmounting on loading/error.
   * record/row are undefined unless current ready data exists. Consumers keep
   * their own draft state, not an old record borrowed from a previous lifecycle.
   */
  readonly renderBody: (context: DetailsRenderContext<S, T>) => ReactNode;
  readonly renderFooter?: (context: DetailsRenderContext<S, T>) => ReactNode;
  /** Replaces only the interior. Accessible title/close and overlay remain owned. */
  readonly renderInterior?: (context: DetailsRenderContext<S, T>) => ReactNode;
}

export interface DetailsTriggerProps<S extends QuerySchema, T extends object> {
  readonly session: DetailsSession<S, T>;
  readonly rowId: string;
  readonly label: string;
  readonly children?: ReactNode;
  readonly isDisabled?: boolean;
  readonly className?: string;
}
