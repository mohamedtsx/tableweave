/** Application revisions are opaque equality tags, never credentials or clocks. */
export type ReorderRevision = string | number | null;

export interface ReorderStamp {
  readonly ownerEpoch: number;
  readonly sourceVersion: number;
  readonly definitionKey: string;
  readonly scopeKey: string;
  readonly queryIdentity: string;
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly revision: ReorderRevision;
  /** Omitted/page is one displayed page; complete is an unsliced unpaged extent. */
  readonly extent?: "page" | "complete";
}

export interface RowReorderFrame {
  readonly stamp: ReorderStamp;
  readonly pageIds: readonly string[];
  /** Explicit application wire representation; numeric revisions are not coerced. */
  readonly baseRevision: string | null;
}

export interface RowReorderPort {
  /**
   * One atomic committed read. Nonempty IDs require current row-move authority
   * for EVERY moved/anchor ID. Empty IDs observe metadata only, including while
   * busy or when a former target disappeared; they never grant move permission.
   */
  readonly readCurrent: (ids: readonly string[]) => RowReorderFrame;
}

export interface RowMovePlacement {
  readonly movedId: string;
  /** Immediate successor after removing movedId; null is the end boundary. */
  readonly beforeId: string | null;
  /** Immediate predecessor after removing movedId; null is the start boundary. */
  readonly afterId: string | null;
}

export interface RowMove extends RowMovePlacement {
  readonly operationId: string;
  readonly scopeKey: string;
  readonly pageIds: readonly string[];
  readonly baseRevision: string | null;
}

declare const operationBrand: unique symbol;
export interface RowMoveOperation {
  readonly [operationBrand]: true;
  readonly generation: number;
  readonly origin: ReorderStamp;
  readonly move: RowMove;
}

export type RowMoveSettlement =
  | { readonly kind: "accepted"; readonly revision?: string }
  | { readonly kind: "rejected"; readonly code: "rejected" | "conflict" }
  | {
      readonly kind: "indeterminate";
      readonly code: "unavailable" | "timeout" | "cancel-requested";
    };

export interface RowMoveAcknowledgement {
  readonly stamp: ReorderStamp;
  /** Application-established TERMINAL disposition, not an inferred array match. */
  readonly disposition: "applied" | "not-applied" | "superseded";
}

export type RowMoveFeedbackCode =
  | "applied"
  | "rejected"
  | "conflict"
  | "unavailable"
  | "superseded";

export interface RowMoveState {
  readonly pending: null | {
    readonly operation: RowMoveOperation;
    readonly phase: "submitted" | "awaiting-authority";
    readonly superseded: boolean;
  };
  readonly feedback: null | {
    readonly operationId: string;
    readonly code: RowMoveFeedbackCode;
  };
}

export type RowMoveBlockedReason =
  | "invalid"
  | "unavailable"
  | "origin"
  | "pending"
  | "membership"
  | "anchors"
  | "eligibility";
export type RowMoveBeginResult =
  | { readonly status: "started"; readonly operation: RowMoveOperation }
  | { readonly status: "noop" }
  | { readonly status: "blocked"; readonly reason: RowMoveBlockedReason };
export type RowMoveEventResult =
  | { readonly status: "changed" }
  | {
      readonly status: "ignored";
      readonly reason:
        | "invalid"
        | "operation"
        | "authority"
        | "disposed"
        | "reentrant"
        | "unchanged";
    };

export type ReorderInvalidationReason = "context" | "access" | "unmount";
export interface RowMoveCoordinatorOptions extends RowReorderPort {
  /** Application supplies a lifetime-unique, non-secret namespace for IDs. */
  readonly instanceId: string;
}
export interface RowMoveCoordinator {
  readonly getSnapshot: () => RowMoveState;
  readonly subscribe: (listener: () => void) => () => void;
  readonly begin: (
    origin: RowReorderFrame,
    placement: RowMovePlacement,
  ) => RowMoveBeginResult;
  readonly settle: (
    operation: RowMoveOperation,
    outcome: RowMoveSettlement,
  ) => RowMoveEventResult;
  readonly acknowledge: (
    operation: RowMoveOperation,
    acknowledgement: RowMoveAcknowledgement,
  ) => RowMoveEventResult;
  /** Explicit application commit/authoritative-update boundary, never render. */
  readonly reconcile: () => RowMoveEventResult;
  readonly invalidate: (reason: ReorderInvalidationReason) => void;
  readonly dispose: () => void;
}

export type ReorderErrorCode =
  | "reorder.invalid"
  | "reorder.unavailable"
  | "reorder.eligibility"
  | "reorder.columns";

/** Structural own types; compatible with original controller public policies. */
export interface ReorderColumnPolicy {
  readonly id: string;
  readonly hideable?: boolean;
  readonly utility?: boolean;
  readonly reorderGroup?: string;
}
export interface ReorderColumnState {
  readonly order: readonly string[];
  readonly visibility: Readonly<Record<string, boolean>>;
}
