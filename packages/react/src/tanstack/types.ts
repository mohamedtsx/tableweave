import type {
  Cell,
  Column,
  ColumnDef,
  Header,
  HeaderGroup,
  ReactTable,
  Row,
  RowData,
} from "@tanstack/react-table";
import type { QuerySchema } from "../contracts/types.js";
import type {
  ControllerDefinition,
  ControllerOptions,
  MutationResult,
  TableController,
  TableState,
} from "../controller/types.js";
import type { EvaluationOptions } from "../filters/evaluate.js";
import type { nativeFeatures } from "./features.js";

export interface NativeColumnMeta {
  readonly utility?: boolean;
  readonly rowHeader?: boolean;
}
export type NativeSelectionMode = false | "single" | "multiple";
export type NativeFeatures = typeof nativeFeatures;
export type NativeColumnDef<T extends RowData, Value = unknown> = ColumnDef<
  NativeFeatures,
  T,
  Value
>;
export type NativeRow<T extends RowData> = Row<NativeFeatures, T>;
export type NativeColumn<T extends RowData> = Column<NativeFeatures, T>;
export type NativeHeader<T extends RowData> = Header<NativeFeatures, T>;
export type NativeCell<T extends RowData, Value = unknown> = Cell<
  NativeFeatures,
  T,
  Value
>;
export type NativeHeaderGroup<T extends RowData> = HeaderGroup<
  NativeFeatures,
  T
>;
export interface NativeDefinitionInput<
  S extends QuerySchema,
  T extends RowData,
> {
  readonly schema: S;
  readonly columns: readonly NativeColumnDef<T>[];
  readonly getRowId: (record: T) => string;
  readonly isRowSelectable?: (record: T) => boolean;
  readonly selection?: boolean | "single" | "multiple";
  readonly details?: boolean;
  readonly multiSort?: boolean;
  readonly evaluation?: Omit<EvaluationOptions<S, T>, "now">;
}
export interface NativeDefinition<S extends QuerySchema, T extends RowData> {
  readonly controllerDefinition: ControllerDefinition<S>;
  readonly paginationEnabled: boolean;
  readonly columns: readonly NativeColumnDef<T>[];
  readonly getRowId: (record: T) => string;
  readonly isRowSelectable?: (record: T) => boolean;
  readonly multiSort: boolean;
  readonly selectionMode: NativeSelectionMode;
  readonly evaluation: Omit<EvaluationOptions<S, T>, "now">;
}
export type NativeControllerOptions<S extends QuerySchema> = Omit<
  ControllerOptions<S>,
  "registry"
>;
export type NativePageInfo =
  | { readonly kind: "known"; readonly total: number }
  | { readonly kind: "unknown"; readonly hasNextPage: boolean };
export type NativeInput<T> =
  | { readonly mode: "client"; readonly records: readonly T[] }
  | {
      readonly mode: "server";
      readonly records: readonly T[];
      readonly pageInfo: NativePageInfo;
    }
  | {
      readonly mode: "server-complete";
      readonly records: readonly T[];
      readonly pageInfo: Extract<NativePageInfo, { readonly kind: "known" }>;
    };

// Supported native methods route only through controller callbacks. Native row /
// column contexts retain vendor internals; mutating those internals is unsupported,
// not a security boundary. No options spread, baseAtoms, setOptions or reset API.
export type NativeTableHandle<T extends RowData> = Pick<
  ReactTable<NativeFeatures, T>,
  | "Subscribe"
  | "FlexRender"
  | "store"
  | "getColumn"
  | "getRow"
  | "getRowModel"
  | "getFilteredRowModel"
  | "getSortedRowModel"
  | "getHeaderGroups"
  | "getVisibleLeafColumns"
  | "setSorting"
  | "setPagination"
  | "setRowSelection"
  | "setColumnVisibility"
  | "setColumnOrder"
> & {
  readonly atoms: Readonly<ReactTable<NativeFeatures, T>["atoms"]>;
};
export interface NativeTableView<S extends QuerySchema, T extends RowData> {
  readonly selectionMode: NativeSelectionMode;
  readonly native: NativeTableHandle<T>;
  readonly controller: TableController<S>;
  readonly state: TableState<S>;
  readonly rows: readonly NativeRow<T>[];
  readonly headerGroups: readonly NativeHeaderGroup<T>[];
  readonly visibleColumns: readonly NativeColumn<T>[];
  readonly selectedIds: readonly string[];
  readonly pageSelection: {
    readonly eligibleIds: readonly string[];
    readonly checked: boolean;
    readonly mixed: boolean;
  };
  readonly pagination: {
    readonly enabled: boolean;
    readonly pageInfo: NativePageInfo;
    readonly pageCount: number | null;
    readonly canPreviousPage: boolean;
    readonly canNextPage: boolean;
  };
  selectPage(selected: boolean): MutationResult<S>;
  cancelSelection(): MutationResult<S>;
  previousPage(): void;
  nextPage(): void;
}
