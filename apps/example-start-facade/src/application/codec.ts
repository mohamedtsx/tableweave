import {
  canonicalJson,
  getQueryIdentity,
  parseQuery,
  type JsonValue,
} from "@tableweave/react/contracts";
import {
  fixedNow,
  type InventoryItem,
  type Transaction,
} from "../../../examples/shared/records.js";
import {
  exampleOperators,
  inventorySchema,
  transactionSchema,
} from "../../../examples/shared/schemas.js";
import {
  SourceUnavailable,
  type Bootstrap,
  type Canary,
  type Dataset,
  type Envelope,
  type ReadInput,
} from "./types.js";

/** Own JSON capture: accessors/prototype tricks/cycles/non-finite values are rejected. */
function capture(value: unknown, seen = new Set<object>()): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "object" || value === null || seen.has(value))
    throw new SourceUnavailable();
  seen.add(value);
  try {
    if (
      !Array.isArray(value) &&
      Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null
    )
      throw new SourceUnavailable();
    const result: Record<string, JsonValue> = {};
    const elements: JsonValue[] = [];
    const length = Array.isArray(value)
      ? Object.getOwnPropertyDescriptor(value, "length")
      : null;
    if (
      length &&
      (!Object.hasOwn(length, "value") ||
        !Number.isSafeInteger(length.value) ||
        length.value < 0 ||
        length.value > 10000)
    )
      throw new SourceUnavailable();
    const keys = length
      ? Array.from({ length: length.value }, (_, index) => String(index))
      : Object.keys(value);
    if (keys.length > 10000) throw new SourceUnavailable();
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (
        !descriptor ||
        !Object.hasOwn(descriptor, "value") ||
        !descriptor.enumerable ||
        key === "__proto__"
      )
        throw new SourceUnavailable();
      const child = capture(descriptor.value, seen);
      if (Array.isArray(value)) elements.push(child);
      else result[key] = child;
    }
    return Array.isArray(value) ? elements : result;
  } finally {
    seen.delete(value);
  }
}
function object(value: unknown): Readonly<Record<string, JsonValue>> {
  const copy = capture(value);
  if (!copy || typeof copy !== "object" || list(copy))
    throw new SourceUnavailable();
  return copy;
}
function list(value: JsonValue): value is readonly JsonValue[] {
  return Array.isArray(value);
}
function text(value: JsonValue | undefined): string {
  if (typeof value !== "string") throw new SourceUnavailable();
  return value;
}
function number(value: JsonValue | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new SourceUnavailable();
  return value;
}
function bool(value: JsonValue | undefined): boolean {
  if (typeof value !== "boolean") throw new SourceUnavailable();
  return value;
}
function strings(value: JsonValue | undefined): readonly string[] {
  if (!Array.isArray(value)) throw new SourceUnavailable();
  return value.map(text);
}
function nullableText(value: JsonValue | undefined): string | null {
  return value === null ? null : text(value);
}
export function dataset(value: unknown): Dataset {
  if (value !== "alpha" && value !== "beta") throw new SourceUnavailable();
  return value;
}
export function readInput(value: unknown): ReadInput {
  const input = object(value);
  const selected = dataset(input.dataset),
    domain = input.domain;
  const bootstrapId = text(input.bootstrapId),
    scopeKey = text(input.scopeKey),
    clock = number(input.clock);
  if (
    input.version !== 1 ||
    !/^[a-f0-9-]{36}$/.test(bootstrapId) ||
    clock !== fixedNow ||
    scopeKey !== `synthetic:${selected}:${domain}`
  )
    throw new SourceUnavailable();
  const base = {
    version: 1 as const,
    bootstrapId,
    dataset: selected,
    scopeKey,
    clock,
  };
  if (domain === "transactions") {
    const parsed = parseQuery(transactionSchema, input.query, {
      registry: exampleOperators,
    });
    if (
      !parsed.success ||
      parsed.data.locale !== "en-US" ||
      parsed.data.timeZone !== "UTC"
    )
      throw new SourceUnavailable();
    return Object.freeze({ ...base, domain, query: parsed.data });
  }
  if (domain === "inventory") {
    const parsed = parseQuery(inventorySchema, input.query);
    if (
      !parsed.success ||
      parsed.data.locale !== "en-US" ||
      parsed.data.timeZone !== "UTC"
    )
      throw new SourceUnavailable();
    return Object.freeze({ ...base, domain, query: parsed.data });
  }
  throw new SourceUnavailable();
}
export function inputIdentity(input: ReadInput): string {
  return input.domain === "transactions"
    ? getQueryIdentity(transactionSchema, input.query, {
        now: input.clock,
        registry: exampleOperators,
      })
    : getQueryIdentity(inventorySchema, input.query, { now: input.clock });
}
export function sameInput(a: ReadInput, b: ReadInput): boolean {
  return (
    a.bootstrapId === b.bootstrapId &&
    a.domain === b.domain &&
    a.scopeKey === b.scopeKey &&
    a.dataset === b.dataset &&
    a.clock === b.clock &&
    inputIdentity(a) === inputIdentity(b)
  );
}
export function bootstrap(value: unknown): Bootstrap {
  const input = object(value),
    id = text(input.id),
    selected = dataset(input.dataset),
    clock = number(input.clock);
  const transactions = readInput(input.transactions),
    inventory = readInput(input.inventory);
  const canary = text(input.canary);
  if (
    input.version !== 1 ||
    transactions.domain !== "transactions" ||
    inventory.domain !== "inventory" ||
    clock !== fixedNow ||
    transactions.bootstrapId !== id ||
    inventory.bootstrapId !== id ||
    transactions.dataset !== selected ||
    inventory.dataset !== selected ||
    canary !== `public-canary:${selected}:${id}`
  )
    throw new SourceUnavailable();
  return Object.freeze({
    version: 1,
    id,
    dataset: selected,
    clock,
    canary,
    transactions,
    inventory,
  });
}
function transaction(value: JsonValue): Transaction {
  const row = object(value),
    status = row.status,
    cleared = row.cleared;
  if (
    (status !== "posted" && status !== "draft") ||
    (cleared !== null && typeof cleared !== "boolean")
  )
    throw new SourceUnavailable();
  return Object.freeze({
    id: text(row.id),
    description: text(row.description),
    status,
    occurred: text(row.occurred),
    amount: number(row.amount),
    reference: nullableText(row.reference),
    account: number(row.account),
    tags: strings(row.tags),
    cleared,
    bookingDay: text(row.bookingDay),
  });
}
function inventoryItem(value: JsonValue): InventoryItem {
  const row = object(value),
    status = row.status,
    category = row.category;
  if (
    (status !== "available" && status !== "archived") ||
    (category !== "equipment" && category !== "supplies")
  )
    throw new SourceUnavailable();
  return Object.freeze({
    id: text(row.id),
    title: text(row.title),
    status,
    category,
    updated: text(row.updated),
    quantity: number(row.quantity),
    locations: strings(row.locations),
    reserved: bool(row.reserved),
    note: nullableText(row.note),
  });
}
export function envelope(value: unknown): Envelope {
  const raw = object(value),
    input = readInput(raw.input),
    result = object(raw.result),
    page = object(result.page);
  if (
    raw.kind !== "rows" ||
    raw.domain !== input.domain ||
    result.source !== "fresh" ||
    !Array.isArray(result.records)
  )
    throw new SourceUnavailable();
  const total = number(page.total);
  if (
    page.kind !== "known" ||
    !Number.isSafeInteger(total) ||
    total < 0 ||
    result.records.length > input.query.pagination.pageSize
  )
    throw new SourceUnavailable();
  const emptyKind = result.emptyKind;
  if (
    emptyKind !== "dataset" &&
    emptyKind !== "filtered" &&
    emptyKind !== "unknown"
  )
    throw new SourceUnavailable();
  const common = {
    source: "fresh",
    page: { kind: "known", total },
    emptyKind,
    receivedAt: text(result.receivedAt),
  } as const;
  function checked<T extends { readonly id: string }>(
    records: readonly T[],
  ): readonly T[] {
    const ids = new Set(records.map((row) => row.id));
    const prefix = `${input.dataset}:${input.domain === "transactions" ? "tx" : "it"}-`;
    if (
      ids.size !== records.length ||
      records.some((row) => !row.id.startsWith(prefix)) ||
      (records.length > 0 &&
        total <
          input.query.pagination.pageIndex * input.query.pagination.pageSize +
            records.length)
    )
      throw new SourceUnavailable();
    return Object.freeze(records);
  }
  if (input.domain === "transactions")
    return Object.freeze({
      kind: "rows",
      domain: input.domain,
      input,
      result: { ...common, records: checked(result.records.map(transaction)) },
    });
  return Object.freeze({
    kind: "rows",
    domain: input.domain,
    input,
    result: { ...common, records: checked(result.records.map(inventoryItem)) },
  });
}
export function bootstrapOutcome(value: unknown): Bootstrap {
  const raw = object(value);
  if (raw.kind === "denied") throw new SourceEndedError();
  if (raw.kind !== "ready") throw new SourceUnavailable();
  return bootstrap(raw.bootstrap);
}
// Keep typed denial distinct from malformed/unavailable transport; no raw error data.
import { SourceEnded as SourceEndedError } from "./types.js";
export function rowsOutcome(value: unknown): Envelope {
  const raw = object(value);
  if (raw.kind === "denied") throw new SourceEndedError();
  if (raw.kind !== "ready") throw new SourceUnavailable();
  return envelope(raw.envelope);
}
export const wireEqual = (a: Bootstrap, b: Bootstrap) =>
  canonicalJson(a) === canonicalJson(b);
export function canary(value: unknown): Canary {
  const raw = object(value),
    id = text(raw.bootstrapId),
    selected = dataset(raw.dataset),
    label = text(raw.value);
  if (
    raw.kind !== "canary" ||
    !/^[a-f0-9-]{36}$/.test(id) ||
    label !== `public-canary:${selected}:${id}`
  )
    throw new SourceUnavailable();
  return Object.freeze({
    kind: "canary",
    bootstrapId: id,
    dataset: selected,
    value: label,
  });
}
export function cacheValue(value: unknown) {
  const raw = object(value);
  return raw.kind === "canary" ? canary(raw) : envelope(raw);
}
export function canaryOutcome(value: unknown): Canary {
  const raw = object(value);
  if (raw.kind === "denied") throw new SourceEndedError();
  if (raw.kind !== "ready") throw new SourceUnavailable();
  return canary(raw.canary);
}
