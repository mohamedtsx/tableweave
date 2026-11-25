import type { QuerySchema } from "@tableweave/react/contracts";
import type {
  ReorderAdmission,
  ReorderAdmissionLease,
} from "@tableweave/react/reordering-controller";
import type { RowMoveOperation } from "@tableweave/react/reordering";

export interface TableRendererReorderingConfig<
  S extends QuerySchema,
  T extends object,
> {
  readonly rows?: {
    readonly admission: ReorderAdmission<S, T>;
    readonly lease: ReorderAdmissionLease<S, T>;
    readonly handleColumnId: string;
    readonly onSubmit: (operation: RowMoveOperation) => void;
  };
  readonly columns?: true;
}
declare const config: unique symbol;
declare const binding: unique symbol;
declare const collection: unique symbol;
declare const navigation: unique symbol;
export interface CapturedTableReordering<
  S extends QuerySchema,
  T extends object,
> {
  readonly [config]: (schema: S, row: T) => readonly [S, T];
}
export interface TableReorderingBinding<
  S extends QuerySchema,
  T extends object,
> {
  readonly [binding]: (schema: S, row: T) => readonly [S, T];
}
export interface CollectionReorderingBinding {
  readonly [collection]: never;
}
export interface TableReorderingNavigation<
  S extends QuerySchema,
  T extends object,
> {
  readonly [navigation]: (schema: S, row: T) => readonly [S, T];
}
export interface ReorderingMessages {
  readonly column: string;
  readonly before: string;
  readonly after: string;
  readonly unavailable: string;
  readonly pending: string;
  readonly boundary: string;
  readonly submitted: string;
  readonly rowUnavailable: string;
}
export interface ReorderingSnapshot {
  readonly version: object;
  readonly refPass: object;
  readonly ready: boolean;
  readonly pending: boolean;
  readonly rowConfigured: boolean;
}
