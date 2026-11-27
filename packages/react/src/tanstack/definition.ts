import type { RowData } from "@tanstack/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { ContractError } from "../contracts/errors.js";
import { canonicalJson, validId } from "../contracts/json.js";
import type { QuerySchema } from "../contracts/types.js";
import { createTableController } from "../controller/store.js";
import type {
  ColumnPolicy,
  TableCommand,
  TableController,
  TableState,
} from "../controller/types.js";
import { defineController, stateFail } from "../controller/validation.js";
import { defaultOperatorRegistry } from "../filters/registry.js";
import { predicateCarrierId } from "./features.js";
import type {
  NativeColumnDef,
  NativeControllerOptions,
  NativeDefinition,
  NativeDefinitionInput,
  NativeFeatures,
} from "./types.js";

export type NativeErrorCode =
  | "native.definition"
  | "native.lifecycle"
  | "native.rows"
  | "native.sorting"
  | "native.managed"
  | "native.page";
export class NativeBridgeError extends Error {
  constructor(readonly code: NativeErrorCode) {
    super("Invalid Tableweave native bridge operation.");
    this.name = "NativeBridgeError";
  }
}
export function nativeFail(code: NativeErrorCode): never {
  throw new NativeBridgeError(code);
}
const definitions = new WeakSet<object>();
const nativeControllers = new WeakMap<object, object>();

export function createNativeColumnHelper<T extends RowData>() {
  return createColumnHelper<NativeFeatures, T>();
}

function defineNativeTableImpl<S extends QuerySchema, T extends RowData>(
  input: NativeDefinitionInput<S, T>,
): NativeDefinition<S, T> {
  const {
    schema,
    columns: inputColumns,
    getRowId,
    isRowSelectable,
    selection,
    multiSort,
    details,
    evaluation: inputEvaluation,
  } = input;
  const evaluationConfig = { ...inputEvaluation };
  const evaluation = Object.freeze({
    ...evaluationConfig,
    registry: evaluationConfig.registry ?? defaultOperatorRegistry,
    ...(evaluationConfig.accessors
      ? { accessors: Object.freeze({ ...evaluationConfig.accessors }) }
      : {}),
    ...(evaluationConfig.searchMatchers
      ? {
          searchMatchers: Object.freeze({ ...evaluationConfig.searchMatchers }),
        }
      : {}),
  });
  if (
    typeof getRowId !== "function" ||
    (isRowSelectable !== undefined && typeof isRowSelectable !== "function") ||
    !Array.isArray(inputColumns) ||
    (selection !== undefined &&
      selection !== false &&
      selection !== true &&
      selection !== "multiple" &&
      selection !== "single") ||
    (multiSort !== undefined && typeof multiSort !== "boolean")
  )
    nativeFail("native.definition");
  const selectionMode = selection === true ? "multiple" : selection || false;
  if (multiSort && schema.sorting?.multi !== true) nativeFail("native.sorting");
  const seen = new Set<string>();
  const policies: ColumnPolicy[] = [];
  const sortable = new Set<string>();
  const walk = (
    columns: readonly NativeColumnDef<T>[],
    parent?: string,
    depth = 0,
  ): readonly NativeColumnDef<T>[] => {
    if (
      !Array.isArray(columns) ||
      Object.keys(columns).length !== columns.length ||
      depth > 32
    )
      nativeFail("native.definition");
    return Object.freeze(
      columns.map((sourceColumn) => {
        if (!sourceColumn || typeof sourceColumn !== "object")
          nativeFail("native.definition");
        const column = { ...sourceColumn };
        column.meta = { ...column.meta };
        const id = column.id;
        if (
          !validId(id) ||
          id === predicateCarrierId ||
          seen.has(id) ||
          (column.meta?.utility !== undefined &&
            typeof column.meta.utility !== "boolean") ||
          (column.meta?.rowHeader !== undefined &&
            typeof column.meta.rowHeader !== "boolean")
        )
          nativeFail("native.definition");
        seen.add(id);
        if ("columns" in column && column.columns) {
          if (!column.columns.length) nativeFail("native.definition");
          return Object.freeze({
            ...column,
            meta: Object.freeze({ ...column.meta }),
            columns: walk(column.columns, id, depth + 1),
            enableGlobalFilter: false,
            enableColumnFilter: false,
            enableSorting: false,
            enableMultiSort: false,
          });
        }
        const accessor =
          ("accessorFn" in column && typeof column.accessorFn === "function") ||
          ("accessorKey" in column && column.accessorKey !== undefined);
        // Native accessors accept an input index; filter field accessors are
        // index-independent semantic values. Never silently evaluate a computed /
        // aliased native column against an unrelated direct record property.
        const field = Object.hasOwn(schema.fields, id)
          ? schema.fields[id]
          : undefined;
        if (
          field &&
          field.owner !== "none" &&
          (("accessorFn" in column && column.accessorFn !== undefined) ||
            ("accessorKey" in column && column.accessorKey !== id)) &&
          typeof evaluation.accessors?.[id] !== "function"
        )
          nativeFail("native.definition");
        if (accessor) sortable.add(id);
        const utility = column.meta?.utility === true;
        const canSort =
          !utility &&
          accessor &&
          field?.sort === true &&
          column.enableSorting !== false;
        policies.push({
          id,
          hideable: !utility && column.enableHiding !== false,
          ...(utility ? { utility: true } : {}),
          ...(parent ? { reorderGroup: parent } : {}),
        });
        return Object.freeze({
          ...column,
          meta: Object.freeze({ ...column.meta }),
          enableHiding: !utility && column.enableHiding !== false,
          enableGlobalFilter: false,
          enableColumnFilter: false,
          enableSorting: canSort,
          enableMultiSort:
            canSort && multiSort === true && column.enableMultiSort !== false,
        });
      }),
    );
  };
  const columns = walk(inputColumns);
  for (const [id, field] of Object.entries(schema.fields))
    if (field.sort && !sortable.has(id)) nativeFail("native.definition");
  if (!policies.some((column) => !column.utility))
    nativeFail("native.definition");
  const definition = Object.freeze({
    controllerDefinition: defineController(
      {
        schema,
        columns: policies,
        selection: selectionMode !== false,
        ...(details !== undefined ? { details } : {}),
      },
      evaluation.registry,
    ),
    columns,
    getRowId,
    ...(isRowSelectable ? { isRowSelectable } : {}),
    multiSort: multiSort ?? false,
    selectionMode,
    evaluation,
  });
  definitions.add(definition);
  return definition;
}
export function defineNativeTable<S extends QuerySchema, T extends RowData>(
  input: NativeDefinitionInput<S, T>,
): NativeDefinition<S, T> {
  try {
    return defineNativeTableImpl(input);
  } catch (error) {
    if (error instanceof NativeBridgeError || error instanceof ContractError)
      throw error;
    return nativeFail("native.definition");
  }
}
export function assertNativeDefinition<
  S extends QuerySchema,
  T extends RowData,
>(definition: NativeDefinition<S, T>): void {
  if (!definitions.has(definition)) nativeFail("native.definition");
}
export function assertNativeController<
  S extends QuerySchema,
  T extends RowData,
>(definition: NativeDefinition<S, T>, controller: TableController<S>): void {
  if (nativeControllers.get(controller) !== definition)
    nativeFail("native.definition");
}
export function assertNativeState<S extends QuerySchema, T extends RowData>(
  definition: NativeDefinition<S, T>,
  state: TableState<S>,
): void {
  if (
    state.definitionIdentity !== canonicalJson(definition.controllerDefinition)
  )
    nativeFail("native.definition");
  const selectedCount = Object.keys(state.selection).length;
  if (
    (definition.selectionMode === false && selectedCount !== 0) ||
    (definition.selectionMode === "single" && selectedCount > 1)
  )
    nativeFail("native.managed");
  const leaves = new Map<string, NativeColumnDef<T>>();
  const walk = (columns: readonly NativeColumnDef<T>[]) => {
    for (const column of columns) {
      if ("columns" in column && column.columns) walk(column.columns);
      else if (column.id) leaves.set(column.id, column);
    }
  };
  walk(definition.columns);
  if (
    (!definition.multiSort && state.query.sorting.length > 1) ||
    state.query.sorting.some(
      (sort) => leaves.get(sort.id)?.enableSorting !== true,
    ) ||
    (state.query.sorting.length > 1 &&
      state.query.sorting.some(
        (sort) => leaves.get(sort.id)?.enableMultiSort !== true,
      ))
  )
    nativeFail("native.sorting");
}
export function createNativeController<
  S extends QuerySchema,
  T extends RowData,
>(
  definition: NativeDefinition<S, T>,
  options: NativeControllerOptions<S>,
): TableController<S> {
  assertNativeDefinition(definition);
  let captured: NativeControllerOptions<S>;
  try {
    captured = { ...options };
  } catch {
    return stateFail("state.ownership");
  }
  const { validateCommand, validateState } = captured;
  if (
    (validateState !== undefined && typeof validateState !== "function") ||
    (validateCommand !== undefined && typeof validateCommand !== "function")
  )
    stateFail("state.ownership");
  const controllerOptions = {
    ...captured,
    registry: definition.evaluation.registry ?? defaultOperatorRegistry,
    validateCommand(command: TableCommand<S>) {
      if (
        definition.selectionMode !== "multiple" &&
        command.type === "selection.page"
      )
        nativeFail("native.managed");
      return validateCommand?.(command);
    },
    validateState(state: TableState<S>) {
      assertNativeState(definition, state);
      return validateState?.(state);
    },
  };
  const controller = createTableController(
    definition.controllerDefinition,
    controllerOptions,
  );
  try {
    assertNativeState(definition, controller.getSnapshot());
  } catch (error) {
    controller.dispose();
    throw error;
  }
  nativeControllers.set(controller, definition);
  return controller;
}
