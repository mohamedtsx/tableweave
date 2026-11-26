import type {
  ControlsAuthority,
  ControlsPresentation,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import type { ReactNode } from "react";
import type { TableRendererTarget } from "../table/types.js";

/** An event-time snapshot, not authorization or a promise that records are loaded. */
export interface SelectionActionContext<
  S extends QuerySchema,
  T extends object,
> {
  readonly selectedIds: readonly string[];
  readonly selectedCount: number;
  readonly loadedSelected: ControlsPresentation<S, T>["loadedSelected"];
  readonly missingSelectedIds: readonly string[];
  readonly busy: boolean;
  readonly stale: boolean;
  readonly obsolete: boolean;
  readonly resourceObsolete: boolean;
  readonly blockedReason: ControlsPresentation<S, T>["blockedReason"];
  readonly displayed: ControlsPresentation<S, T>["displayed"];
  readonly requestedQuery: ControlsPresentation<S, T>["requestedQuery"];
}

/** App-owned mutations, permission, pending state and errors. No default actions. */
export interface SelectionAction<S extends QuerySchema, T extends object> {
  readonly id: string;
  readonly label: string;
  readonly onAction: (
    context: SelectionActionContext<S, T>,
  ) => void | Promise<void>;
  readonly isDisabled?: boolean;
  readonly isPending?: boolean;
  readonly variant?: "secondary" | "tertiary" | "danger";
}

export interface SelectionToolbarMessages {
  readonly normalLabel: string;
  readonly selectionLabel: string;
  readonly actionsLabel: string;
  readonly selectedCount: (count: number) => string;
  readonly cancel: string;
  readonly cancelLabel: string;
}

export interface SelectionToolbarFailure {
  readonly actionId: string | null;
  readonly reason: "unavailable" | "callback";
  /** Never rendered or logged by Tableweave. */
  readonly error: unknown;
}

export interface SelectionToolbarProps<
  S extends QuerySchema,
  T extends object,
> {
  /** @internal Exact renderer event identity; absence alone selects raw behavior. */
  readonly renderer?: TableRendererTarget<S, T>;
  /** Current accepted render projection; never a speculative selection mirror.
   * A withheld requestedQuery/context/definition renders no private region. */
  readonly presentation: ControlsPresentation<S, T>;
  /** Keep stable within an origin when practical. Replacing it invalidates old handlers. */
  readonly authority: ControlsAuthority<S, T>;
  /** All embedded tools, including their chips. Unmounted whenever any ID is selected. */
  readonly normal: ReactNode;
  readonly actions?: readonly SelectionAction<S, T>[];
  readonly messages?: Partial<SelectionToolbarMessages>;
  readonly className?: string;
  /** Restored normal trigger or app-provided safe fallback; called only after a focus-owning swap. */
  readonly getRestoreFocusTarget?: () => HTMLElement | null;
  /** Includes rejected async callbacks. Reporting errors must not throw/reject either. */
  readonly onError?: (failure: SelectionToolbarFailure) => void | Promise<void>;
}
