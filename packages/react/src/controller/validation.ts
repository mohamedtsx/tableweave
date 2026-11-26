import { ContractError } from "../contracts/errors.js";
import { getFilterIdentity, getQueryIdentity } from "../contracts/identity.js";
import {
  canonicalJson,
  cloneJson,
  freeze,
  isRecord,
  validId,
} from "../contracts/json.js";
import { normalizeQuery } from "../contracts/query.js";
import { defineQuerySchema } from "../contracts/schema.js";
import type {
  OperatorRegistry,
  QuerySchema,
  QuerySchemaDefinition,
} from "../contracts/types.js";
import type {
  ColumnState,
  ControllerDefinition,
  ControllerDefinitionInput,
  DetailsState,
  SelectionState,
  StateSeed,
  TableState,
  TransitionContext,
  Updater,
} from "./types.js";

export type StateErrorCode =
  | "state.invalid"
  | "state.command"
  | "state.capability"
  | "state.rule"
  | "state.columns"
  | "state.ownership"
  | "state.stale"
  | "state.disposed"
  | "state.reentrant"
  | "state.definition";
export class ControllerError extends Error {
  constructor(readonly code: StateErrorCode) {
    super("Invalid Tableweave state transition.");
    this.name = "ControllerError";
  }
}
export function stateFail(code: StateErrorCode): never {
  throw new ControllerError(code);
}
export function withStateErrors<T>(action: () => T): T {
  try {
    return action();
  } catch (error) {
    if (error instanceof ControllerError || error instanceof ContractError)
      throw error;
    return stateFail("state.invalid");
  }
}
export function same(a: unknown, b: unknown): boolean {
  return canonicalJson(a) === canonicalJson(b);
}
export function recordId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
export function ids(value: unknown): readonly string[] {
  if (!Array.isArray(value)) stateFail("state.invalid");
  const seen = new Set<string>();
  for (let i = 0; i < value.length; i++) {
    const item: unknown = value[i];
    if (!Object.hasOwn(value, i) || !recordId(item) || seen.has(item))
      stateFail("state.invalid");
    seen.add(item);
  }
  return value as string[];
}
function keys(
  value: Record<string, unknown>,
  allowed: readonly string[],
): void {
  if (Object.keys(value).some((key) => !allowed.includes(key)))
    stateFail("state.invalid");
}
function defineControllerImpl<S extends QuerySchema>(
  input: ControllerDefinitionInput<S>,
  registry?: OperatorRegistry,
): ControllerDefinition<S> {
  const data: unknown = cloneJson(input);
  if (!isRecord(data)) stateFail("state.definition");
  keys(data, ["schema", "columns", "selection", "details"]);
  const descriptor: QuerySchemaDefinition = input.schema;
  const schema = defineQuerySchema(descriptor, registry);
  if (
    (data.selection !== undefined && typeof data.selection !== "boolean") ||
    (data.details !== undefined && typeof data.details !== "boolean")
  )
    stateFail("state.definition");
  const columns: unknown = Object.hasOwn(data, "columns") ? data.columns : [];
  if (!Array.isArray(columns)) stateFail("state.columns");
  const seen = new Set<string>();
  for (const column of columns as unknown[]) {
    if (!isRecord(column)) stateFail("state.columns");
    keys(column, ["id", "hideable", "utility", "reorderGroup"]);
    if (
      !validId(column.id) ||
      seen.has(column.id) ||
      (column.hideable !== undefined && typeof column.hideable !== "boolean") ||
      (column.utility !== undefined && typeof column.utility !== "boolean") ||
      (column.reorderGroup !== undefined && !validId(column.reorderGroup)) ||
      (column.utility === true && column.hideable === true)
    )
      stateFail("state.columns");
    seen.add(column.id);
  }
  // Both schemas are validated JSON clones with unchanged literal identity/types.
  return freeze({
    schema: schema as S,
    columns: columns as ControllerDefinition<S>["columns"],
    selection: data.selection ?? false,
    details: data.details ?? false,
  });
}
export function selectionState(
  definition: ControllerDefinition,
  input: unknown,
): SelectionState {
  const value: unknown = cloneJson(input);
  if (!isRecord(value)) stateFail("state.invalid");
  const selected: Record<string, boolean> = Object.create(null) as Record<
    string,
    boolean
  >;
  for (const [id, state] of Object.entries(value)) {
    if (!recordId(id) || typeof state !== "boolean") stateFail("state.invalid");
    if (state) selected[id] = true;
  }
  if (!definition.selection && Object.keys(selected).length)
    stateFail("state.capability");
  return freeze(selected);
}
export function columnState(
  definition: ControllerDefinition,
  input: unknown,
  previous?: ColumnState,
): ColumnState {
  const value: unknown = cloneJson(input);
  if (!isRecord(value)) stateFail("state.columns");
  keys(value, ["order", "visibility"]);
  if (
    previous &&
    (!Object.hasOwn(value, "order") || !Object.hasOwn(value, "visibility"))
  )
    stateFail("state.columns");
  const policy = new Map(definition.columns.map((item) => [item.id, item]));
  const order = ids(
    Object.hasOwn(value, "order")
      ? value.order
      : definition.columns.map((item) => item.id),
  );
  if (order.length !== policy.size || order.some((id) => !policy.has(id)))
    stateFail("state.columns");
  // Contiguous group/utility runs are immutable partitions, even for repeated groups.
  const partitions = new Map<string, number>();
  let partition = 0;
  let group: string | undefined;
  for (const column of definition.columns) {
    if (column.utility || group !== (column.reorderGroup ?? "")) partition++;
    partitions.set(column.id, partition);
    if (column.utility) {
      partition++;
      group = undefined;
    } else group = column.reorderGroup ?? "";
  }
  for (let index = 0; index < order.length; index++) {
    const id = order[index];
    const expected = definition.columns[index];
    if (
      !id ||
      !expected ||
      (expected.utility && id !== expected.id) ||
      partitions.get(id) !== partitions.get(expected.id)
    )
      stateFail("state.columns");
    const hidden = previous?.order[index];
    if (hidden && previous?.visibility[hidden] === false && id !== hidden)
      stateFail("state.columns");
  }
  const rawVisibility = Object.hasOwn(value, "visibility")
    ? value.visibility
    : {};
  if (!isRecord(rawVisibility)) stateFail("state.columns");
  const visibility: Record<string, boolean> = Object.create(null) as Record<
    string,
    boolean
  >;
  for (const [id, visible] of Object.entries(rawVisibility)) {
    const column = policy.get(id);
    if (
      !column ||
      typeof visible !== "boolean" ||
      (!visible && (column.utility || column.hideable === false))
    )
      stateFail("state.columns");
    if (!visible) visibility[id] = false;
  }
  const data = definition.columns.filter((column) => !column.utility);
  if (data.length && data.every((column) => visibility[column.id] === false))
    stateFail("state.columns");
  return freeze({ order: [...order], visibility });
}
export function detailsState(
  definition: ControllerDefinition,
  input: unknown,
): DetailsState {
  const value: unknown = cloneJson(input);
  if (
    !isRecord(value) ||
    Object.keys(value).length !== 1 ||
    !Object.hasOwn(value, "rowId") ||
    (value.rowId !== null && !recordId(value.rowId))
  )
    stateFail("state.invalid");
  if (!definition.details && value.rowId !== null)
    stateFail("state.capability");
  return freeze({ rowId: value.rowId as string | null });
}
function createTableStateImpl<S extends QuerySchema>(
  definition: ControllerDefinition<S>,
  seed: StateSeed<S>,
  context: TransitionContext,
): TableState<S> {
  const value: unknown = cloneJson(seed);
  if (!isRecord(value)) stateFail("state.invalid");
  keys(value, ["query", "selection", "columns", "details"]);
  const query = normalizeQuery(definition.schema, value.query, context);
  return freeze({
    definitionIdentity: canonicalJson(definition),
    revision: 0,
    query,
    selection: selectionState(
      definition,
      Object.hasOwn(value, "selection") ? value.selection : {},
    ),
    columns: columnState(
      definition,
      Object.hasOwn(value, "columns") ? value.columns : {},
    ),
    details: detailsState(
      definition,
      Object.hasOwn(value, "details") ? value.details : { rowId: null },
    ),
    filterIdentity: getFilterIdentity(definition.schema, query, context),
    queryIdentity: getQueryIdentity(definition.schema, query, context),
    evaluatedAt: context.now,
  });
}
export function update<T>(updater: Updater<T>, previous: T): T {
  try {
    return typeof updater === "function"
      ? (updater as (value: T) => T)(previous)
      : updater;
  } catch {
    return stateFail("state.invalid");
  }
}
export function defineController<S extends QuerySchema>(
  input: ControllerDefinitionInput<S>,
  registry?: OperatorRegistry,
): ControllerDefinition<S> {
  return withStateErrors(() => defineControllerImpl(input, registry));
}
export function createTableState<S extends QuerySchema>(
  definition: ControllerDefinition<S>,
  seed: StateSeed<S>,
  context: TransitionContext,
): TableState<S> {
  return withStateErrors(() => createTableStateImpl(definition, seed, context));
}
