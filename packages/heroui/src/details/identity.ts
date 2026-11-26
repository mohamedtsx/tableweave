import type { NativeRow, TableController, TableState } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import type {
  DetailsAuthority,
  DetailsContext,
  DetailsSource,
} from "./types.js";

/** Never invoke metadata accessors. Proxy descriptor/prototype failures are opaque. */
export function ownData(
  input: unknown,
  key: string,
  check?: () => void,
): unknown {
  check?.();
  try {
    if (input === null || typeof input !== "object") return undefined;
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    return descriptor && Object.hasOwn(descriptor, "value")
      ? descriptor.value
      : undefined;
  } catch {
    return undefined;
  } finally {
    check?.();
  }
}

function plain(input: unknown, check?: () => void): boolean {
  check?.();
  try {
    if (input === null || typeof input !== "object") return false;
    const prototype = Object.getPrototypeOf(input);
    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  } finally {
    check?.();
  }
}
function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
function counter(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

/** Validate only captured descriptor values, never a later read of the input. */
export function captureContext(
  input: unknown,
  check?: () => void,
): DetailsContext | null {
  if (!plain(input, check)) return null;
  const definitionKey = ownData(input, "definitionKey", check);
  const datasetKey = ownData(input, "datasetKey", check);
  const scopeKey = ownData(input, "scopeKey", check);
  const access = ownData(input, "access", check);
  const epoch = ownData(input, "epoch", check);
  return nonempty(definitionKey) &&
    nonempty(datasetKey) &&
    nonempty(scopeKey) &&
    typeof access === "boolean" &&
    counter(epoch)
    ? Object.freeze({ definitionKey, datasetKey, scopeKey, access, epoch })
    : null;
}

export function captureAuthority(
  input: unknown,
  check?: () => void,
): DetailsAuthority | null {
  if (!plain(input, check)) return null;
  const context = captureContext(ownData(input, "context", check), check);
  if (!context) return null;
  const rowId = ownData(input, "rowId", check);
  const session = ownData(input, "session", check);
  const generation = ownData(input, "generation", check);
  return (rowId === null || nonempty(rowId)) &&
    counter(session) &&
    counter(generation)
    ? Object.freeze({ context, rowId, session, generation })
    : null;
}

/** These comparison functions receive our captured immutable primitive metadata. */
export function sameContext(a: DetailsContext, b: DetailsContext): boolean {
  return (
    a.definitionKey === b.definitionKey &&
    a.datasetKey === b.datasetKey &&
    a.scopeKey === b.scopeKey &&
    a.access === b.access &&
    a.epoch === b.epoch
  );
}
export function sameAuthority(
  a: DetailsAuthority,
  b: DetailsAuthority,
): boolean {
  return sameLifecycle(a, b) && a.generation === b.generation;
}
/** Request replacement is not a target/lifecycle replacement. */
export function sameLifecycle(
  a: DetailsAuthority,
  b: DetailsAuthority,
): boolean {
  return (
    sameContext(a.context, b.context) &&
    a.rowId === b.rowId &&
    a.session === b.session
  );
}

export interface CapturedCallback<A extends readonly unknown[], R> {
  readonly valid: boolean;
  readonly invoke: ((...args: A) => R) | null;
}

/** An absent optional callback is different from an invalid supplied callback.
 * Capture its exact function once and preserve its original receiver. Never invoke
 * accessors, inspect thrown payloads, or read the function again after validation.
 */
export function captureCallback<A extends readonly unknown[], R>(
  receiver: unknown,
  key: string,
  required = false,
  check?: () => void,
): CapturedCallback<A, R> {
  const absent = { valid: !required, invoke: null };
  const invalid = { valid: false, invoke: null };
  check?.();
  try {
    if (receiver === null || typeof receiver !== "object") return invalid;
    const descriptor = Object.getOwnPropertyDescriptor(receiver, key);
    check?.();
    if (!descriptor) {
      const inherited = key in receiver;
      check?.();
      return inherited ? invalid : absent;
    }
    if (!Object.hasOwn(descriptor, "value")) return invalid;
    const value: unknown = descriptor.value;
    if (value === undefined) return absent;
    if (typeof value !== "function") return invalid;
    return Object.freeze({
      valid: true,
      invoke: (...args: A) => {
        check?.();
        try {
          return Reflect.apply(value, receiver, args) as R;
        } finally {
          check?.();
        }
      },
    });
  } catch {
    return invalid;
  } finally {
    check?.();
  }
}
export function validAuthority(input: unknown): boolean {
  return captureAuthority(input) !== null;
}

export interface CapturedCurrent {
  readonly authority: DetailsAuthority;
  readonly frame: CapturedFrame | null;
}
interface CapturedFrame {
  readonly origin: DetailsContext;
  readonly owner: unknown;
  readonly viewOwner: unknown;
  readonly state: unknown;
  readonly rows: unknown;
}
function captureFrame(
  input: unknown,
  authority: DetailsAuthority,
  check?: () => void,
): CapturedFrame | null {
  if (!plain(input, check)) return null;
  const origin = captureContext(ownData(input, "origin", check), check);
  if (!origin?.access || !sameContext(origin, authority.context)) return null;
  const owner = ownData(input, "owner", check);
  const view = ownData(input, "view", check);
  return Object.freeze({
    origin,
    owner,
    viewOwner: ownData(view, "controller", check),
    state: ownData(view, "state", check),
    rows: ownData(view, "rows", check),
  });
}
export function captureCurrent(
  input: unknown,
  check?: () => void,
): CapturedCurrent | null {
  if (!plain(input, check)) return null;
  const authority = captureAuthority(ownData(input, "authority", check), check);
  // Denial precedes even inspection of the optional frame envelope.
  if (!authority?.context.access) return null;
  return Object.freeze({
    authority,
    frame: captureFrame(ownData(input, "nativeFrame", check), authority, check),
  });
}

export function readCurrent(port: unknown): CapturedCurrent | null {
  const read = captureCallback<[], unknown>(port, "read", true);
  if (!read.valid || !read.invoke) return null;
  try {
    return captureCurrent(read.invoke());
  } catch {
    return null;
  }
}

/** Copies primitive envelope metadata only. The record is neither cloned nor frozen. */
export function currentSource<T extends object>(
  authority: DetailsAuthority,
  input: unknown,
): DetailsSource<T> | null {
  if (!authority.context.access || !plain(input)) return null;
  const sourceAuthority = captureAuthority(ownData(input, "authority"));
  if (
    !sourceAuthority?.context.access ||
    !sameAuthority(authority, sourceAuthority)
  )
    return null;
  const status = ownData(input, "status");
  if (status === "loading" || status === "missing")
    return Object.freeze({ authority: sourceAuthority, status });
  if (status === "error") {
    const code = ownData(input, "code");
    return code === "unavailable" || code === "offline" || code === "timeout"
      ? Object.freeze({ authority: sourceAuthority, status, code })
      : null;
  }
  if (status !== "ready") return null;
  const record = ownData(input, "record");
  const busy = ownData(input, "busy");
  const stale = ownData(input, "stale");
  if (
    record === null ||
    typeof record !== "object" ||
    (busy !== undefined && typeof busy !== "boolean") ||
    (stale !== undefined && typeof stale !== "boolean")
  )
    return null;
  // T belongs to the application; only its opaque reference is carried through.
  return Object.freeze({
    authority: sourceAuthority,
    status,
    record: record as T,
    ...(busy === undefined ? {} : { busy }),
    ...(stale === undefined ? {} : { stale }),
  });
}

/** No handle getters or retagging helper: only the application's atomic committed
 * frame, with matching immutable origin and owner, may contribute a genuine row.
 */
export function currentNativeRow<S extends QuerySchema, T extends object>(
  frame: CapturedFrame | null,
  origin: DetailsAuthority,
  controller: TableController<S>,
  state: TableState<S>,
  record: T | undefined,
): NativeRow<T> | undefined {
  if (!record || !frame) return undefined;
  if (
    !sameContext(frame.origin, origin.context) ||
    frame.owner !== controller ||
    frame.viewOwner !== controller ||
    frame.state !== state
  )
    return undefined;
  const rows = frame.rows;
  try {
    if (!Array.isArray(rows)) return undefined;
    // Native row objects retain their actual table. Do not construct a substitute.
    return rows.find(
      (row: NativeRow<T>) =>
        ownData(row, "id") === origin.rowId &&
        ownData(row, "original") === record,
    );
  } catch {
    return undefined;
  }
}
