import type { RowData } from "@tanstack/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { ContractError } from "../contracts/errors.js";
import { canonicalJson, validId } from "../contracts/json.js";
import type { QuerySchema } from "../contracts/types.js";
import { createTableController } from "../controller/store.js";
import type {
  ColumnPolicy,
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
  if (
    typeof input.getRowId !== "function" ||
    (input.isRowSelectable !== undefined &&
      typeof input.isRowSelectable !== "function") ||
    !Array.isArray(input.columns) ||
    (input.multiSort !== undefined && typeof input.multiSort !== "boolean")
  )
    nativeFail("native.definition");
  if (input.multiSort && input.schema.sorting?.multi !== true)
    nativeFail("native.sorting");
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
      columns.map((column) => {
        if (!column || typeof column !== "object")
          nativeFail("native.definition");
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
        const field = Object.hasOwn(input.schema.fields, id)
          ? input.schema.fields[id]
          : undefined;
        if (
          field &&
          field.owner !== "none" &&
          (("accessorFn" in column && column.accessorFn !== undefined) ||
            ("accessorKey" in column && column.accessorKey !== id)) &&
          typeof input.evaluation?.accessors?.[id] !== "function"
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
            canSort &&
            input.multiSort === true &&
            column.enableMultiSort !== false,
        });
      }),
    );
  };
  const columns = walk(input.columns);
  for (const [id, field] of Object.entries(input.schema.fields))
    if (field.sort && !sortable.has(id)) nativeFail("native.definition");
  if (!policies.some((column) => !column.utility))
    nativeFail("native.definition");
  const evaluation = Object.freeze({
    ...input.evaluation,
    registry: input.evaluation?.registry ?? defaultOperatorRegistry,
    ...(input.evaluation?.accessors
      ? { accessors: Object.freeze({ ...input.evaluation.accessors }) }
      : {}),
    ...(input.evaluation?.searchMatchers
      ? {
          searchMatchers: Object.freeze({ ...input.evaluation.searchMatchers }),
        }
      : {}),
  });
  const definition = Object.freeze({
    controllerDefinition: defineController(
      {
        schema: input.schema,
        columns: policies,
        ...(input.selection !== undefined
          ? { selection: input.selection }
          : {}),
        ...(input.details !== undefined ? { details: input.details } : {}),
      },
      evaluation.registry,
    ),
    columns,
    getRowId: input.getRowId,
    ...(input.isRowSelectable
      ? { isRowSelectable: input.isRowSelectable }
      : {}),
    multiSort: input.multiSort ?? false,
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
  if (
    options.validateState !== undefined &&
    typeof options.validateState !== "function"
  )
    stateFail("state.ownership");
  const controllerOptions = {
    ...options,
    registry: definition.evaluation.registry ?? defaultOperatorRegistry,
    validateState(state: TableState<S>) {
      assertNativeState(definition, state);
      return options.validateState?.(state);
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
