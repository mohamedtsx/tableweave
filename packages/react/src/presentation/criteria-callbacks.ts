import type { RowData } from "@tanstack/react-table";
import { isRecord } from "../contracts/json.js";
import type {
  AnyCustomOperator,
  OperatorDescriptor,
  OperatorRegistry,
  QuerySchema,
} from "../contracts/types.js";
import type { FieldAccessors } from "../definition/schema-types.js";
import type { SearchMatcher } from "../filters/evaluate.js";
import { defaultOperatorRegistry } from "../filters/registry.js";
import { guardTableSortFn } from "../tanstack/sort.js";
import type { NativeColumnDef, NativeDefinition } from "../tanstack/types.js";

export type CriteriaCheck = () => undefined;
export class CriteriaFrameError extends Error {
  readonly code = "criteria.frame.unavailable";
  constructor() {
    super("Criteria frame is unavailable.");
    this.name = "CriteriaFrameError";
  }
}
export function safeCriteriaFrameError(): CriteriaFrameError {
  return new CriteriaFrameError();
}
function deny(): never {
  throw safeCriteriaFrameError();
}

/** One operation's consumed-data cache, including aliased objects. Reflection can
 * run Proxy traps, so even a throwing trap must pass the post-call gate. */
export class CriteriaCapture {
  private readonly fields = new WeakMap<
    object,
    Map<PropertyKey, PropertyDescriptor | undefined>
  >();
  constructor(private readonly check: CriteriaCheck) {}
  reflect<T>(read: () => T): T {
    this.check();
    try {
      return read();
    } finally {
      this.check();
    }
  }
  descriptor(value: unknown, key: PropertyKey): PropertyDescriptor | undefined {
    if (!value || typeof value !== "object") return deny();
    let fields = this.fields.get(value);
    if (!fields) {
      fields = new Map();
      this.fields.set(value, fields);
    }
    if (!fields.has(key))
      fields.set(
        key,
        this.reflect(() => Object.getOwnPropertyDescriptor(value, key)),
      );
    return fields.get(key);
  }
  data(value: unknown, key: PropertyKey, optional = false): unknown {
    const field = this.descriptor(value, key);
    if (!field && optional) return undefined;
    if (!field || !Object.hasOwn(field, "value")) return deny();
    return field.value;
  }
  keys(value: object): readonly PropertyKey[] {
    return this.reflect(() => Reflect.ownKeys(value));
  }
  copy(value: object): Record<PropertyKey, unknown> {
    const result: Record<PropertyKey, unknown> = {};
    for (const key of this.keys(value)) {
      const field = this.descriptor(value, key);
      if (field?.enumerable)
        Object.defineProperty(result, key, {
          value: this.data(value, key),
          enumerable: true,
          configurable: true,
          writable: true,
        });
    }
    return result;
  }
  context(value: unknown) {
    const definitionKey = this.data(value, "definitionKey"),
      scopeKey = this.data(value, "scopeKey"),
      access = this.data(value, "access");
    if (
      typeof definitionKey !== "string" ||
      !definitionKey ||
      typeof scopeKey !== "string" ||
      !scopeKey ||
      typeof access !== "boolean"
    )
      return deny();
    return Object.freeze({ definitionKey, scopeKey, access });
  }
}

type Callback = (...args: never[]) => unknown;
/** Preserve fixed host receivers, or the vendor's actual dynamic receiver. */
export function guardCriteriaCallback<F extends Callback>(
  fn: F,
  receiver: unknown,
  check: CriteriaCheck,
  dynamic = false,
): F {
  return function (this: unknown, ...args: unknown[]) {
    check();
    try {
      return Reflect.apply(fn, dynamic ? this : receiver, args);
    } finally {
      check();
    }
  } as unknown as F;
}
function callback<F extends Callback>(
  capture: CriteriaCapture,
  object: object,
  key: string,
  check: CriteriaCheck,
  optional = false,
  dynamic = false,
): F | undefined {
  const fn = capture.data(object, key, optional);
  if (fn === undefined && optional) return undefined;
  if (typeof fn !== "function") return deny();
  return guardCriteriaCallback(fn as F, object, check, dynamic);
}

export interface CriteriaNativeCallbacks<
  S extends QuerySchema,
  T extends RowData,
> {
  readonly check: CriteriaCheck;
  readonly columns: readonly NativeColumnDef<T>[];
  readonly evaluation: NativeDefinition<S, T>["evaluation"];
  readonly getRowId: NativeDefinition<S, T>["getRowId"];
  readonly isRowSelectable?: NativeDefinition<S, T>["isRowSelectable"];
}

/** Creates only local callback/evaluation/vendor options, never a registered ND
 * replacement. No host registry, function, column or record is frozen here. */
export function createCriteriaCallbacks<
  S extends QuerySchema,
  T extends RowData,
>(
  definition: NativeDefinition<S, T>,
  check: CriteriaCheck,
): CriteriaNativeCallbacks<S, T> {
  const capture = new CriteriaCapture(check);
  const customCache = new WeakMap<object, AnyCustomOperator>(),
    descriptorCache = new WeakMap<object, OperatorDescriptor>();
  function custom(original: AnyCustomOperator): AnyCustomOperator {
    const cached = customCache.get(original);
    if (cached) return cached;
    const copy = capture.copy(original);
    copy.validate = callback(capture, original, "validate", check);
    for (const name of ["normalize", "evaluate"] as const) {
      const fn = callback(capture, original, name, check, true);
      if (fn !== undefined) copy[name] = fn;
    }
    const result = Object.freeze(copy) as unknown as AnyCustomOperator;
    customCache.set(original, result);
    return result;
  }
  function descriptor(original: OperatorDescriptor): OperatorDescriptor {
    const cached = descriptorCache.get(original);
    if (cached) return cached;
    const copy = capture.copy(original),
      value = capture.data(original, "custom", true);
    if (value !== undefined) {
      if (!value || typeof value !== "object") return deny();
      copy.custom = custom(value as AnyCustomOperator);
    }
    const result = Object.freeze(copy) as unknown as OperatorDescriptor;
    descriptorCache.set(original, result);
    return result;
  }
  const originalRegistry =
    definition.evaluation.registry ?? defaultOperatorRegistry;
  const get = callback<OperatorRegistry["get"]>(
    capture,
    originalRegistry,
    "get",
    check,
  );
  if (!get) return deny();
  const customValues = capture.data(originalRegistry, "custom"),
    descriptors = capture.data(originalRegistry, "descriptors");
  if (!Array.isArray(customValues) || !Array.isArray(descriptors))
    return deny();
  const copyArray = <TValue>(
    input: unknown[],
    map: (item: TValue) => TValue,
  ): readonly TValue[] => {
    const length = capture.data(input, "length");
    if (typeof length !== "number") return deny();
    const result: TValue[] = [];
    for (let i = 0; i < length; i++)
      result.push(map(capture.data(input, String(i)) as TValue));
    return Object.freeze(result);
  };
  const registry: OperatorRegistry = Object.freeze({
    custom: copyArray<AnyCustomOperator>(customValues, custom),
    descriptors: copyArray<OperatorDescriptor>(descriptors, descriptor),
    get(id: string) {
      check();
      const value = get(id);
      const result = value === undefined ? undefined : descriptor(value);
      check();
      return result;
    },
  });
  const originalAccessors = definition.evaluation.accessors;
  const accessors: Record<string, (record: T) => unknown> = Object.create(
    null,
  ) as Record<string, (record: T) => unknown>;
  for (const id of Object.keys(definition.controllerDefinition.schema.fields)) {
    const fn = originalAccessors
      ? capture.data(originalAccessors, id, true)
      : undefined;
    if (fn !== undefined && typeof fn !== "function") return deny();
    accessors[id] =
      fn === undefined
        ? (record) =>
            capture.reflect(() => isRecord(record)) &&
            capture.reflect(() => Object.hasOwn(record as object, id))
              ? capture.reflect(() => (record as Record<string, unknown>)[id])
              : undefined
        : guardCriteriaCallback(fn as (record: T) => unknown, undefined, check);
  }
  const searchMatchers: Record<string, SearchMatcher> = Object.create(
    null,
  ) as Record<string, SearchMatcher>;
  const matchers = definition.evaluation.searchMatchers;
  if (matchers)
    for (const key of capture.keys(matchers)) {
      if (typeof key !== "string") continue;
      const fn = capture.data(matchers, key);
      if (typeof fn !== "function") return deny();
      searchMatchers[key] = guardCriteriaCallback(
        fn as SearchMatcher,
        undefined,
        check,
      );
    }
  function columns(
    input: readonly NativeColumnDef<T>[],
  ): readonly NativeColumnDef<T>[] {
    return Object.freeze(
      input.map((column) => {
        check();
        const copy = capture.copy(column);
        if (Array.isArray(copy.columns))
          copy.columns = columns(copy.columns as NativeColumnDef<T>[]);
        const accessor = capture.data(column, "accessorFn", true);
        if (accessor !== undefined) {
          if (typeof accessor !== "function") return deny();
          copy.accessorFn = guardCriteriaCallback(
            accessor as Callback,
            undefined,
            check,
            true,
          );
        }
        const sortFn = capture.data(column, "sortFn", true);
        if (typeof sortFn === "function")
          copy.sortFn = guardTableSortFn(
            sortFn as Parameters<typeof guardTableSortFn<T>>[0],
            check,
          );
        else if (sortFn !== undefined && typeof sortFn !== "string")
          return deny();
        check();
        return Object.freeze(copy) as unknown as NativeColumnDef<T>;
      }),
    );
  }
  const getRowId = callback<NativeDefinition<S, T>["getRowId"]>(
    capture,
    definition,
    "getRowId",
    check,
  );
  if (!getRowId) return deny();
  const isRowSelectable = callback<
    NonNullable<NativeDefinition<S, T>["isRowSelectable"]>
  >(capture, definition, "isRowSelectable", check, true);
  const result = Object.freeze({
    check,
    columns: columns(definition.columns),
    getRowId,
    ...(isRowSelectable ? { isRowSelectable } : {}),
    evaluation: Object.freeze({
      ...definition.evaluation,
      registry,
      accessors: Object.freeze(accessors) as FieldAccessors<S, T>,
      searchMatchers: Object.freeze(searchMatchers),
    }),
  });
  check();
  return result;
}
