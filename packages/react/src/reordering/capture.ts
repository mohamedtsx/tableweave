import type {
  ReorderErrorCode,
  ReorderStamp,
  RowMoveAcknowledgement,
  RowMovePlacement,
  RowMoveSettlement,
  RowReorderFrame,
} from "./types.js";

/** Capture safety budgets, not schema/page-size defaults; overflow rejects. */
export const reorderLimits = Object.freeze({
  items: 100_000,
  metadataCharacters: 1_048_576,
});
const errorCodes = new WeakMap<object, ReorderErrorCode>();
export class ReorderError extends Error {
  readonly code: ReorderErrorCode;
  constructor(code: ReorderErrorCode = "reorder.invalid") {
    super("Invalid Tableweave reorder operation.");
    this.name = "ReorderError";
    const safe = [
      "reorder.invalid",
      "reorder.unavailable",
      "reorder.eligibility",
      "reorder.columns",
    ].includes(code)
      ? code
      : "reorder.invalid";
    this.code = safe;
    Object.defineProperty(this, "code", { value: safe, writable: false });
    errorCodes.set(this, safe);
  }
}
export function errorCode(error: unknown): ReorderErrorCode | undefined {
  return error !== null && typeof error === "object"
    ? errorCodes.get(error)
    : undefined;
}
export function invalid(): never {
  throw new ReorderError();
}
export function safely<T>(action: () => T, code: ReorderErrorCode): T {
  try {
    return action();
  } catch (error) {
    observePromise(error);
    throw new ReorderError(code);
  }
}
export interface Budget {
  characters: number;
}
export const budget = (): Budget => ({ characters: 0 });
export function text(value: unknown, charge: Budget, empty = false): string {
  if (typeof value !== "string" || (!empty && !value)) invalid();
  charge.characters += value.length;
  if (charge.characters > reorderLimits.metadataCharacters) invalid();
  return value;
}
export function integer(value: unknown, minimum = 0): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum) invalid();
  return value as number;
}

/** Never read an input value via property access, spread, iteration or toJSON. */
export function data(
  value: unknown,
  allowed: readonly string[] | null,
  required: readonly string[] = allowed ?? [],
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    invalid();
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) invalid();
  const names = Reflect.ownKeys(value);
  if (names.length > reorderLimits.items) invalid();
  const result: Record<string, unknown> = Object.create(null);
  for (const name of names) {
    if (typeof name !== "string" || (allowed && !allowed.includes(name)))
      invalid();
    const descriptor = Object.getOwnPropertyDescriptor(value, name);
    if (!descriptor?.enumerable || !("value" in descriptor)) invalid();
    result[name] = descriptor.value as unknown;
  }
  if (required.some((key) => !Object.hasOwn(result, key))) invalid();
  return result;
}
export function array(value: unknown): readonly unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype)
    invalid();
  const descriptor = Object.getOwnPropertyDescriptor(value, "length");
  if (!descriptor || !("value" in descriptor)) invalid();
  const length = integer(descriptor.value);
  if (length > reorderLimits.items) invalid();
  const keys = Reflect.ownKeys(value);
  if (keys.length !== length + 1) invalid();
  const result: unknown[] = new Array(length);
  for (const key of keys) {
    if (key === "length") continue;
    if (
      typeof key !== "string" ||
      !/^(0|[1-9]\d*)$/.test(key) ||
      Number(key) >= length
    )
      invalid();
    const item = Object.getOwnPropertyDescriptor(value, key);
    if (!item?.enumerable || !("value" in item)) invalid();
    result[Number(key)] = item.value as unknown;
  }
  return Object.freeze(result);
}
export function ids(value: unknown, charge: Budget): readonly string[] {
  const result = array(value).map((id) => text(id, charge));
  if (new Set(result).size !== result.length) invalid();
  return Object.freeze(result);
}
export function stamp(value: unknown, charge: Budget): ReorderStamp {
  const required = [
    "ownerEpoch",
    "sourceVersion",
    "definitionKey",
    "scopeKey",
    "queryIdentity",
    "pageIndex",
    "pageSize",
    "revision",
  ];
  const fields = data(value, [...required, "extent"], required);
  const extent = fields.extent;
  if (Object.hasOwn(fields, "extent")) {
    if (extent !== "page" && extent !== "complete") invalid();
  } else if (Reflect.has(value as object, "extent")) invalid();
  const pageIndex = integer(fields.pageIndex);
  if (extent === "complete" && pageIndex !== 0) invalid();
  const revision = fields.revision;
  if (
    revision !== null &&
    typeof revision !== "string" &&
    !(typeof revision === "number" && Number.isFinite(revision))
  )
    invalid();
  return Object.freeze({
    ownerEpoch: integer(fields.ownerEpoch),
    sourceVersion: integer(fields.sourceVersion),
    definitionKey: text(fields.definitionKey, charge),
    scopeKey: text(fields.scopeKey, charge),
    queryIdentity: text(fields.queryIdentity, charge),
    pageIndex,
    pageSize: integer(fields.pageSize, 1),
    revision:
      typeof revision === "string" ? text(revision, charge, true) : revision,
    ...(extent === "complete" ? { extent } : {}),
  });
}
export function frame(value: unknown, charge = budget()): RowReorderFrame {
  const fields = data(value, ["stamp", "pageIds", "baseRevision"]);
  const capturedStamp = stamp(fields.stamp, charge);
  const pageIds = ids(fields.pageIds, charge);
  if (
    capturedStamp.extent !== "complete" &&
    pageIds.length > capturedStamp.pageSize
  )
    invalid();
  return Object.freeze({
    stamp: capturedStamp,
    pageIds,
    baseRevision:
      fields.baseRevision === null
        ? null
        : text(fields.baseRevision, charge, true),
  });
}
export function placement(value: unknown, charge = budget()): RowMovePlacement {
  const fields = data(value, ["movedId", "beforeId", "afterId"]);
  return Object.freeze({
    movedId: text(fields.movedId, charge),
    beforeId: fields.beforeId === null ? null : text(fields.beforeId, charge),
    afterId: fields.afterId === null ? null : text(fields.afterId, charge),
  });
}
export function settlement(value: unknown): RowMoveSettlement {
  const fields = data(value, ["kind", "revision", "code"], ["kind"]);
  if (fields.kind === "accepted") {
    if (Object.hasOwn(fields, "code")) invalid();
    return Object.freeze({
      kind: "accepted",
      ...(Object.hasOwn(fields, "revision")
        ? { revision: text(fields.revision, budget(), true) }
        : {}),
    });
  }
  if (Object.hasOwn(fields, "revision")) invalid();
  if (
    fields.kind === "rejected" &&
    (fields.code === "rejected" || fields.code === "conflict")
  )
    return Object.freeze({ kind: "rejected", code: fields.code });
  if (
    fields.kind === "indeterminate" &&
    (fields.code === "unavailable" ||
      fields.code === "timeout" ||
      fields.code === "cancel-requested")
  )
    return Object.freeze({ kind: "indeterminate", code: fields.code });
  return invalid();
}
export function acknowledgement(value: unknown): RowMoveAcknowledgement {
  const fields = data(value, ["stamp", "disposition"]);
  if (
    fields.disposition !== "applied" &&
    fields.disposition !== "not-applied" &&
    fields.disposition !== "superseded"
  )
    invalid();
  return Object.freeze({
    stamp: stamp(fields.stamp, budget()),
    disposition: fields.disposition,
  });
}

export function sameOrigin(a: ReorderStamp, b: ReorderStamp): boolean {
  return (
    a.ownerEpoch === b.ownerEpoch &&
    a.definitionKey === b.definitionKey &&
    a.scopeKey === b.scopeKey &&
    a.queryIdentity === b.queryIdentity &&
    a.pageIndex === b.pageIndex &&
    a.pageSize === b.pageSize &&
    (a.extent ?? "page") === (b.extent ?? "page")
  );
}
export function sameStamp(a: ReorderStamp, b: ReorderStamp): boolean {
  return (
    sameOrigin(a, b) &&
    a.sourceVersion === b.sourceVersion &&
    Object.is(a.revision, b.revision)
  );
}
export const sameIds = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id, index) => id === b[index]);

/** Observe genuine ordinary Promise rejection, never invoke arbitrary thenables. */
export function observePromise(value: unknown): void {
  try {
    if (
      value !== null &&
      typeof value === "object" &&
      Object.getPrototypeOf(value) === Promise.prototype &&
      !Object.hasOwn(value, "constructor")
    )
      void Promise.prototype.then.call(value, undefined, () => {});
  } catch {
    // Malformed/proxy-wrapped thenables are not executed as library work.
  }
}

/** Index of the insertion gap after removing movedId. */
export function gap(
  order: readonly string[],
  move: RowMovePlacement,
): number | "membership" | "anchors" {
  if (
    !order.includes(move.movedId) ||
    (move.beforeId !== null && !order.includes(move.beforeId)) ||
    (move.afterId !== null && !order.includes(move.afterId))
  )
    return "membership";
  if (
    move.beforeId === move.movedId ||
    move.afterId === move.movedId ||
    (move.beforeId !== null && move.beforeId === move.afterId)
  )
    return "anchors";
  const remaining = order.filter((id) => id !== move.movedId);
  const index = move.afterId === null ? 0 : remaining.indexOf(move.afterId) + 1;
  return (remaining[index] ?? null) === move.beforeId &&
    (remaining[index - 1] ?? null) === move.afterId
    ? index
    : "anchors";
}
