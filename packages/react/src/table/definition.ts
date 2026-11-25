import type { QuerySchema } from "../contracts/types.js";
import type {
  ColumnState,
  ControllerDefinition,
  TableController,
} from "../controller/types.js";
import { columnState, stateFail } from "../controller/validation.js";
import {
  assertNativeController,
  createNativeController,
  defineNativeTable,
} from "../tanstack/definition.js";
import type { NativeControllerOptions } from "../tanstack/types.js";
import {
  type DefineTableInput,
  type TableDefinition,
  type TableReorderCapabilities,
  type TableToolPlacement,
  tableDefinitionType,
} from "./types.js";

export class TableDefinitionError extends Error {
  readonly code = "table.definition.invalid";
  constructor() {
    super("Invalid Tableweave table definition.");
    this.name = "TableDefinitionError";
  }
}
function invalid(): never {
  throw new TableDefinitionError();
}

const definitions = new WeakMap<object, object>();
const controllers = new WeakMap<
  object,
  { readonly definition: object; readonly controllerDefinition: object }
>();

/** Snapshot own data exactly once. Reflection can run Proxy traps; it does not
 * promise to suppress arbitrary effects of configuration supplied by an app. */
function captureData<T extends object>(
  input: T,
  allowed?: readonly string[],
  fail: () => never = invalid,
): T {
  try {
    if (!input || typeof input !== "object" || Array.isArray(input))
      return fail();
    const prototype: unknown = Object.getPrototypeOf(input);
    if (prototype !== Object.prototype && prototype !== null) return fail();
    const descriptors = Object.getOwnPropertyDescriptors(input);
    for (const key of Reflect.ownKeys(descriptors)) {
      if (typeof key !== "string" || (allowed && !allowed.includes(key)))
        return fail();
      const descriptor = Object.getOwnPropertyDescriptor(
        descriptors,
        key,
      )?.value;
      if (!descriptor?.enumerable || !("value" in descriptor)) return fail();
    }
    // Object.create transfers only the already captured data descriptors; no
    // second spread/getter read of caller input and no nested application freeze.
    const copy: T = Object.create(null, descriptors);
    Object.freeze(copy);
    return copy;
  } catch {
    return fail();
  }
}

const inputKeys = [
  "schema",
  "columns",
  "getRowId",
  "isRowSelectable",
  "selection",
  "details",
  "multiSort",
  "evaluation",
  "tools",
  "reordering",
  "defaultColumns",
];
const toolKeys = ["builder", "search", "columnChooser", "tabs", "date"];
const optionKeys = [
  "initial",
  "controlled",
  "now",
  "validateState",
  "validateCommand",
  "onRequest",
  "onCommit",
  "onQueryChange",
];

function resolveTools(
  input: TableToolPlacement,
  builder: boolean,
): Readonly<Required<TableToolPlacement>> {
  const captured = captureData(input, toolKeys);
  for (const key of toolKeys) {
    if (!Object.hasOwn(captured, key)) continue;
    const value: unknown = Object.getOwnPropertyDescriptor(
      captured,
      key,
    )?.value;
    if (
      value !== "external" &&
      value !== "hidden" &&
      (value !== "toolbar" || key === "tabs" || key === "date")
    )
      invalid();
  }
  return Object.freeze({
    builder: captured.builder ?? (builder ? "toolbar" : "hidden"),
    search: captured.search ?? "hidden",
    columnChooser: captured.columnChooser ?? "hidden",
    tabs: captured.tabs ?? "hidden",
    date: captured.date ?? "hidden",
  });
}

function resolveReordering(
  input: Partial<TableReorderCapabilities>,
): Readonly<TableReorderCapabilities> {
  const keys = ["rows", "columns"] as const;
  const captured = captureData(input, keys);
  for (const key of keys) {
    if (!Object.hasOwn(captured, key)) {
      let inherited: boolean;
      try {
        inherited = Reflect.has(input, key);
      } catch {
        return invalid();
      }
      if (inherited) invalid();
      continue;
    }
    if (typeof captured[key] !== "boolean") invalid();
  }
  return Object.freeze({
    rows: captured.rows ?? false,
    columns: captured.columns ?? false,
  });
}

/** Source-private provenance assertion; no structural/caller registration. */
export function assertTableDefinition(definition: unknown): void {
  if (
    !definition ||
    typeof definition !== "object" ||
    !definitions.has(definition)
  )
    invalid();
}

/** Returns the REAL controller definition reference for later consumers. Unknown
 * identities are rejected before getters; genuine controllers are frozen producers. */
export function assertTableController<S extends QuerySchema, T extends object>(
  definition: TableDefinition<S, T>,
  controller: TableController<NoInfer<S>>,
): ControllerDefinition<S> {
  assertTableDefinition(definition);
  const registered = controllers.get(controller);
  if (!registered || registered.definition !== definition) invalid();
  if (definitions.get(definition) !== definition.native) invalid();
  assertNativeController(definition.native, controller);
  if (controller.isDisposed()) invalid();
  const actual = controller.getDefinition();
  if (actual !== registered.controllerDefinition) invalid();
  return actual;
}

export function defineTable<T extends object>() {
  return function define<const S extends QuerySchema>(
    input: DefineTableInput<S, T>,
  ): TableDefinition<S, T> {
    const captured = captureData(input, inputKeys);
    const native = defineNativeTable(captured);
    if (
      Object.hasOwn(captured, "tools") &&
      (captured.tools === undefined || captured.tools === null)
    )
      invalid();
    const tools = resolveTools(
      captured.tools ?? {},
      Object.values(native.controllerDefinition.schema.fields).some(
        (field) => field.owner === "builder",
      ),
    );
    if (
      Object.hasOwn(captured, "reordering") &&
      (captured.reordering === undefined || captured.reordering === null)
    )
      invalid();
    const reordering = resolveReordering(captured.reordering ?? {});
    const defaults = columnState(
      native.controllerDefinition,
      Object.hasOwn(captured, "defaultColumns") ? captured.defaultColumns : {},
    );
    const definition: TableDefinition<S, T> = Object.freeze({
      [tableDefinitionType]: (schema: S, record: T): readonly [S, T] => [
        schema,
        record,
      ],
      native,
      tools,
      reordering,
      createController(
        this: TableDefinition<S, T>,
        options: NativeControllerOptions<S>,
      ) {
        assertTableDefinition(this);
        if (this !== definition) invalid();
        const config = captureData(options, optionKeys);
        const initial = captureData(config.initial, [
          "query",
          "selection",
          "columns",
          "details",
        ]);
        const failColumns = () => stateFail("state.columns");
        let columns: Partial<ColumnState> = {};
        if (Object.hasOwn(initial, "columns")) {
          if (initial.columns === undefined) stateFail("state.columns");
          columns = captureData(
            initial.columns,
            ["order", "visibility"],
            failColumns,
          );
        }
        let visibility: ColumnState["visibility"] = {};
        if (Object.hasOwn(columns, "visibility")) {
          if (columns.visibility === undefined) stateFail("state.columns");
          visibility = captureData(columns.visibility, undefined, failColumns);
        }
        // Merge raw true values BEFORE normalization: true must unhide a false
        // default even though normalized visibility stores only false entries.
        const merged = columnState(native.controllerDefinition, {
          order: Object.hasOwn(columns, "order")
            ? columns.order
            : defaults.order,
          visibility: { ...defaults.visibility, ...visibility },
        });
        const controller = createNativeController(native, {
          ...config,
          initial: { ...initial, columns: merged },
        });
        controllers.set(controller, {
          definition,
          controllerDefinition: controller.getDefinition(),
        });
        return controller;
      },
    });
    definitions.set(definition, native);
    return definition;
  };
}
