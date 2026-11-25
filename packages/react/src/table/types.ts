import type { QuerySchema } from "../contracts/types.js";
import type {
  CriteriaAuthority,
  CriteriaOrigin,
} from "../controller/criteria.js";
import type { CriteriaPublication } from "../controller/criteria-publication.js";
import type {
  ColumnState,
  TableController,
  TableState,
} from "../controller/types.js";
import type {
  CriteriaCommittedFrame,
  CriteriaFrameOwner,
  CriteriaSourceAuthority,
  CriteriaSourceMetadata,
  CriteriaToolAuthority,
} from "../presentation/criteria-frame.js";
import type {
  ControlsAuthority,
  ControlsInput,
  ControlsPresentation,
} from "../presentation/types.js";
import type {
  NativeControllerOptions,
  NativeDefinition,
  NativeDefinitionInput,
  NativeTableView,
} from "../tanstack/types.js";

// Source-private brand, not a caller registration capability. Runtime proof is
// separate: even an object copying this symbol is not a factory-issued definition.
export const tableDefinitionType: unique symbol = Symbol(
  "Tableweave definition",
);

export type ToolPlacement = "toolbar" | "external" | "hidden";
export interface TableToolPlacement {
  readonly builder?: ToolPlacement;
  readonly search?: ToolPlacement;
  readonly columnChooser?: ToolPlacement;
  readonly tabs?: "external" | "hidden";
  readonly date?: "external" | "hidden";
}

/** Feature configuration only; current authority and explicit UI remain separate. */
export interface TableReorderCapabilities {
  readonly rows: boolean;
  readonly columns: boolean;
}

export interface DefineTableInput<S extends QuerySchema, T extends object>
  extends NativeDefinitionInput<S, T> {
  readonly tools?: TableToolPlacement;
  readonly reordering?: Partial<TableReorderCapabilities>;
  readonly defaultColumns?: Partial<ColumnState>;
}

export interface TableDefinition<S extends QuerySchema, T extends object> {
  readonly [tableDefinitionType]: (schema: S, record: T) => readonly [S, T];
  readonly native: NativeDefinition<S, T>;
  readonly tools: Readonly<Required<TableToolPlacement>>;
  readonly reordering: Readonly<TableReorderCapabilities>;
  readonly createController: (
    this: TableDefinition<S, T>,
    options: NativeControllerOptions<S>,
  ) => TableController<S>;
}

export interface DataTableOptions<S extends QuerySchema, T extends object> {
  readonly controller: TableController<S>;
  readonly publication: CriteriaPublication<S>;
  readonly criteria: CriteriaAuthority<S>;
  readonly expected: CriteriaOrigin<S>["context"];
  readonly source: ControlsInput<S, T>["source"];
  readonly manualOrder?: boolean;
}
export interface DataTableToolTarget<S extends QuerySchema> {
  readonly owner: CriteriaFrameOwner<S>;
  readonly authority: CriteriaToolAuthority<S>;
}
export interface DataTableSourceTarget<S extends QuerySchema> {
  readonly owner: CriteriaFrameOwner<S>;
  readonly authority: CriteriaSourceAuthority<S>;
}
export type DataTableEmptyCause =
  | "dataset"
  | "filtered"
  | "unknown"
  | "no-record-on-page";
export type DataTablePublicError = "unavailable" | "offline" | "timeout";
export type DataTableRecovery =
  | Readonly<{ kind: "uncommitted" | "unavailable" | "idle" | "loading" }>
  | Readonly<{
      kind: "initial-error";
      error: DataTablePublicError;
      canRetry: boolean;
    }>
  | Readonly<{
      kind: "records";
      notice: "updating" | "update-failed" | null;
      busy: boolean;
      stale: boolean;
      obsolete: boolean;
      canRetry: boolean;
    }>
  | Readonly<{
      kind: "empty" | "updating-empty";
      cause: DataTableEmptyCause;
      notice: "updating" | "update-failed" | null;
      busy: boolean;
      stale: boolean;
      obsolete: boolean;
      canRetry: boolean;
    }>;
declare const dataTableModelType: unique symbol;
/** Declaration brand plus separate exact runtime issuance. No structural permission. */
export interface DataTableModel<S extends QuerySchema, T extends object> {
  readonly [dataTableModelType]: (schema: S, record: T) => readonly [S, T];
  readonly definition: TableDefinition<S, T> | null;
  readonly controller: TableController<S> | null;
  readonly state: TableState<S> | null;
  readonly phase: "uncommitted" | "display" | "no-display" | "unavailable";
  readonly frame: CriteriaCommittedFrame<S, T> | null;
  readonly view: NativeTableView<S, T> | null;
  readonly presentation: ControlsPresentation<S, T> | null;
  readonly authority: ControlsAuthority<S, T> | null;
  readonly toolTarget: DataTableToolTarget<S> | null;
  readonly sourceTarget: DataTableSourceTarget<S> | null;
  readonly metadata: CriteriaSourceMetadata<S> | null;
  readonly recovery: DataTableRecovery;
}
