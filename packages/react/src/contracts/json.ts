import { fail } from "./errors.js";
import type { JsonValue } from "./types.js";

export function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

// Iterative, deterministic JSON encoding: no toJSON, silent coercion or recursion.
export function canonicalJson(value: unknown): string {
  const output: string[] = [];
  const active = new Set<object>();
  type Task = { value: unknown } | { text: string } | { leave: object };
  const stack: Task[] = [{ value }];
  while (stack.length) {
    const task = stack.pop();
    if (!task) break;
    if ("text" in task) {
      output.push(task.text);
      continue;
    }
    if ("leave" in task) {
      active.delete(task.leave);
      continue;
    }
    const item = task.value;
    if (
      item === null ||
      typeof item === "boolean" ||
      typeof item === "string" ||
      (typeof item === "number" && Number.isFinite(item))
    ) {
      output.push(JSON.stringify(item));
      continue;
    }
    if (!Array.isArray(item) && !isRecord(item)) fail("query.invalid");
    if (active.has(item)) fail("query.invalid");
    active.add(item);
    stack.push({ leave: item });
    const array = Array.isArray(item);
    const properties = Object.getOwnPropertyDescriptors(item);
    const ownKeys = Reflect.ownKeys(properties);
    if (ownKeys.some((key) => typeof key !== "string")) fail("query.invalid");
    const names = Object.keys(properties).filter(
      (key) => !array || key !== "length",
    );
    if (array && names.length !== item.length) fail("query.invalid");
    if (
      names.some(
        (key) =>
          !properties[key]?.enumerable || !("value" in (properties[key] ?? {})),
      )
    )
      fail("query.invalid");
    if (
      array &&
      names.some(
        (key) => !/^(0|[1-9]\d*)$/.test(key) || Number(key) >= item.length,
      )
    )
      fail("query.invalid");
    const entries = (
      array ? names.sort((a, b) => Number(a) - Number(b)) : names.sort()
    ).map((key) => [key, properties[key]?.value as unknown] as const);
    stack.push({ text: array ? "]" : "}" });
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      if (!entry) continue;
      if (i < entries.length - 1) stack.push({ text: "," });
      stack.push({ value: entry[1] });
      if (!array) stack.push({ text: `${JSON.stringify(entry[0])}:` });
    }
    stack.push({ text: array ? "[" : "{" });
  }
  return output.join("");
}

export function cloneJson<T>(value: T): T {
  return JSON.parse(canonicalJson(value)) as T;
}
export function freeze<T>(value: T): T {
  const stack: unknown[] = [value];
  const seen = new Set<object>();
  while (stack.length) {
    const item = stack.pop();
    if (item && typeof item === "object" && !seen.has(item)) {
      seen.add(item);
      stack.push(...Object.values(item));
      Object.freeze(item);
    }
  }
  return value;
}
export function jsonValue(value: unknown): value is JsonValue {
  try {
    canonicalJson(value);
    return true;
  } catch {
    return false;
  }
}
export function validId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(value)
  );
}
