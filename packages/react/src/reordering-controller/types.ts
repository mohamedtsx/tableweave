import type { QuerySchema } from "../contracts/types.js";
import type { StateProposal, TableController } from "../controller/types.js";
import type {
  RowMoveAcknowledgement,
  RowMoveBeginResult,
  RowMoveEventResult,
  RowMoveOperation,
  RowMovePlacement,
  RowMoveSettlement,
  RowMoveState,
} from "../reordering/types.js";
import type { DataTableModel, TableDefinition } from "../table/types.js";
import type { NativeControllerOptions, NativeRow } from "../tanstack/types.js";

/** Application truth, never derived from C revision or opaque publication versions. */
export interface ReorderApplicationMetadata {
  readonly ownerEpoch: number;
  readonly sourceVersion: number;
  readonly revision: string | number | null;
  readonly baseRevision: string | null;
}
export interface ReorderControllerOptions<
  S extends QuerySchema,
  T extends object,
> {
  readonly controller: NativeControllerOptions<S>;
  readonly instanceId: string;
  /** Synchronous own method; invoked with the original options object as receiver. */
  readonly readCurrent: () => ReorderApplicationMetadata;
  readonly isRowMovable?: (row: NativeRow<T>) => boolean;
}
declare const leaseBrand: unique symbol;
export interface ReorderAdmissionLease<
  S extends QuerySchema,
  T extends object,
> {
  readonly [leaseBrand]: (schema: S, record: T) => readonly [S, T];
}
declare const interactionBrand: unique symbol;
export interface ReorderInteraction<S extends QuerySchema, T extends object> {
  readonly [interactionBrand]: (schema: S, record: T) => readonly [S, T];
}
export type ReorderAdvanceReason =
  | "context"
  | "access"
  | "source"
  | "configuration";
export interface ReorderAdmissionSnapshot {
  readonly version: object;
  readonly phase: "unmounted" | "unready" | "ready" | "disposed";
  readonly interaction: boolean;
  /** Negative source-publication obligation, never a grant or operation outcome.
   * Recover with a genuinely coherent application ownerEpoch above the retired
   * observation; do not advance sourceVersion merely to readmit unchanged input.
   */
  readonly readmissionRequired: boolean;
  readonly moves: RowMoveState;
}
declare const admissionBrand: unique symbol;
export interface ReorderAdmission<S extends QuerySchema, T extends object> {
  readonly [admissionBrand]: (schema: S, record: T) => readonly [S, T];
  /** Call methods on the genuine handle; borrowed/copied receivers are rejected. */
  readonly getSnapshot: () => ReorderAdmissionSnapshot;
  readonly subscribe: (listener: () => void) => () => void;
  readonly mount: () => ReorderAdmissionLease<S, T>;
  readonly commitModel: (
    lease: ReorderAdmissionLease<S, T>,
    model: DataTableModel<NoInfer<S>, NoInfer<T>>,
  ) => void;
  readonly disconnect: (lease: ReorderAdmissionLease<S, T>) => void;
  /** One finite private origin slot; replacing it revokes the preceding handle. */
  readonly capture: (
    lease: ReorderAdmissionLease<S, T>,
  ) => ReorderInteraction<S, T>;
  readonly begin: (
    interaction: ReorderInteraction<S, T>,
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
  /** Exact retired token + original live domain/lease + a fresh genuine model.
   * A strictly newer authoritative sourceVersion and every current stamp field
   * must match. Query publication, transport acceptance and UI remount are not ack.
   */
  readonly reconcileRetired: (
    operation: RowMoveOperation,
    acknowledgement: RowMoveAcknowledgement,
  ) => RowMoveEventResult;
  readonly reconcile: () => RowMoveEventResult;
  readonly advance: (reason: ReorderAdvanceReason) => void;
  readonly requireProposal: (proposal: StateProposal<S>) => void;
  /** Admission ownership only. Never disposes application C/P/resource. */
  readonly dispose: () => void;
}
export interface ReorderAdmissionOwner<
  S extends QuerySchema,
  T extends object,
> {
  readonly definition: TableDefinition<S, T>;
  readonly controller: TableController<S>;
}
export interface ReorderControllerResult<
  S extends QuerySchema,
  T extends object,
> {
  readonly controller: TableController<S>;
  readonly admission: ReorderAdmission<S, T>;
}

declare const uiBindingBrand: unique symbol;
/** Exclusive optional UI association, never application or renderer authority. */
export interface ReorderUIBinding<S extends QuerySchema, T extends object> {
  readonly [uiBindingBrand]: (schema: S, record: T) => readonly [S, T];
}
declare const modelJoinBrand: unique symbol;
export interface ReorderModelJoin<S extends QuerySchema, T extends object> {
  readonly [modelJoinBrand]: (schema: S, record: T) => readonly [S, T];
}
declare const navigationBrand: unique symbol;
/** Metadata only; deliberately separate from the row interaction's ID slot. */
export interface ReorderNavigationOrigin<
  S extends QuerySchema,
  T extends object,
> {
  readonly [navigationBrand]: (schema: S, record: T) => readonly [S, T];
}
export interface ReorderUIMetadata {
  readonly version: object;
  /** Physical association only, not a current source/action grant. */
  readonly joined: boolean;
  readonly pending: boolean;
}
