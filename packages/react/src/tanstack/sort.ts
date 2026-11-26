import {
  type CreatedSortFn,
  constructSortFn,
  type RowData,
  type SortFn,
  type SortFnDef,
  sortFn_alphanumeric,
  sortFn_alphanumericCaseSensitive,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  sortFn_textCaseSensitive,
} from "@tanstack/react-table";
import { nativeFail } from "./definition.js";
import type { NativeFeatures } from "./types.js";

type Check = () => undefined;
type Comparator = (...args: never[]) => unknown;
interface Ports {
  readonly definition: object;
  readonly sort: Comparator;
  readonly resolve?: Comparator;
  readonly receiver: object;
}
const registrations = new WeakMap<object, Ports>();
const builtins = new Set<object>([
  sortFn_alphanumeric,
  sortFn_alphanumericCaseSensitive,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  sortFn_textCaseSensitive,
]);
function invalid(): never {
  return nativeFail("native.sorting");
}
function reflect<T>(check: Check, read: () => T): T {
  check();
  try {
    try {
      return read();
    } catch {
      return invalid();
    }
  } finally {
    check();
  }
}
function capture(definition: object, check: Check): Omit<Ports, "receiver"> {
  const sort = reflect(check, () =>
    Object.getOwnPropertyDescriptor(definition, "sort"),
  );
  const resolve = reflect(check, () =>
    Object.getOwnPropertyDescriptor(definition, "resolveDataValue"),
  );
  if (
    !sort ||
    !Object.hasOwn(sort, "value") ||
    typeof sort.value !== "function"
  )
    return invalid();
  if (
    resolve &&
    (!Object.hasOwn(resolve, "value") || typeof resolve.value !== "function")
  )
    return invalid();
  // Omitted optional metadata must not silently consume an inherited callback.
  if (!resolve && inheritedMetadata(definition, "resolveDataValue", check))
    return invalid();
  return {
    definition,
    sort: sort.value as Comparator,
    ...(resolve ? { resolve: resolve.value as Comparator } : {}),
  };
}
function inheritedMetadata(value: object, key: string, check: Check): boolean {
  let current: object | null = reflect(check, () =>
    Object.getPrototypeOf(value),
  );
  const seen = new Set<object>();
  for (let depth = 0; current; depth++) {
    if (depth === 64 || seen.has(current)) return invalid();
    seen.add(current);
    const selected = current;
    if (reflect(check, () => Object.getOwnPropertyDescriptor(selected, key)))
      return true;
    current = reflect(check, () => Object.getPrototypeOf(selected));
  }
  return false;
}

/** Explicit source-module opt-in. The real vendor factory creates the comparator;
 * only its new function/config are frozen, never the caller's definition or ports. */
export function createTableSortFn<T extends object>(
  definition: SortFnDef<NativeFeatures, T>,
): CreatedSortFn<NativeFeatures, T> {
  try {
    if (
      !definition ||
      (typeof definition !== "object" && typeof definition !== "function") ||
      Array.isArray(definition)
    )
      return invalid();
    const ports = capture(definition, () => undefined);
    const config: SortFnDef<NativeFeatures, T> = Object.freeze({
      sort: ports.sort as SortFnDef<NativeFeatures, T>["sort"],
      ...(ports.resolve
        ? {
            resolveDataValue: ports.resolve as NonNullable<
              SortFnDef<NativeFeatures, T>["resolveDataValue"]
            >,
          }
        : {}),
    });
    const created = constructSortFn<NativeFeatures, T>(config);
    registrations.set(created, Object.freeze({ ...ports, receiver: created }));
    return Object.freeze(created);
  } catch {
    return invalid();
  }
}

/** Internal materializer, not a registration/permission API. Only exact helper or
 * vendor identities permit reconstruction; ambiguous unregistered functions deny.
 * Ordinary bare callbacks remain opaque app calls with entry/exit gates. */
export function guardTableSortFn<T extends RowData>(
  input: SortFn<NativeFeatures, T>,
  check: Check,
): SortFn<NativeFeatures, T> {
  check();
  if (typeof input !== "function") return invalid();
  let ports = registrations.get(input);
  if (!ports && builtins.has(input))
    ports = { ...capture(input, check), receiver: input };
  let actual: SortFn<NativeFeatures, T> = input;
  if (ports) {
    const original = ports;
    const config: SortFnDef<NativeFeatures, T> = Object.freeze({
      sort(...args: Parameters<SortFnDef<NativeFeatures, T>["sort"]>) {
        check();
        try {
          return Reflect.apply(original.sort, original.receiver, args);
        } finally {
          check();
        }
      },
      ...(original.resolve
        ? {
            resolveDataValue(...args: unknown[]) {
              check();
              try {
                return Reflect.apply(
                  original.resolve as Comparator,
                  undefined,
                  args,
                );
              } finally {
                check();
              }
            },
          }
        : {}),
    });
    actual = constructSortFn<NativeFeatures, T>(config);
    Object.freeze(actual);
  } else {
    for (const key of ["sort", "resolveDataValue"]) {
      if (
        reflect(check, () => Object.getOwnPropertyDescriptor(input, key)) ||
        inheritedMetadata(input, key, check)
      )
        return invalid();
    }
  }
  const captured = actual;
  check();
  return function (this: unknown, ...args) {
    check();
    try {
      return Reflect.apply(captured, this, args);
    } finally {
      check();
    }
  };
}
