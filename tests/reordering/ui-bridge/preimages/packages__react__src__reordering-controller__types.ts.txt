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
