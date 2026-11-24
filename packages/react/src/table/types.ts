import type { QuerySchema } from "../contracts/types.js";
import type { ColumnState, TableController } from "../controller/types.js";
import type {
  NativeControllerOptions,
  NativeDefinition,
  NativeDefinitionInput,
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

export interface DefineTableInput<S extends QuerySchema, T extends object>
  extends NativeDefinitionInput<S, T> {
  readonly tools?: TableToolPlacement;
  readonly defaultColumns?: Partial<ColumnState>;
}

export interface TableDefinition<S extends QuerySchema, T extends object> {
  readonly [tableDefinitionType]: (schema: S, record: T) => readonly [S, T];
  readonly native: NativeDefinition<S, T>;
  readonly tools: Readonly<Required<TableToolPlacement>>;
  readonly createController: (
    this: TableDefinition<S, T>,
    options: NativeControllerOptions<S>,
  ) => TableController<S>;
}
