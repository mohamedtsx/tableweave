import type { NativeDefinition } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import { canonicalJson } from "@tableweave/react/contracts";

// Capture the realm intrinsics once. Observation below is deliberately limited
// to the original ordinary native Promise plumbing, not arbitrary thenables.
const getDescriptor = Object.getOwnPropertyDescriptor;
const getPrototype = Object.getPrototypeOf;
const ownKeys = Reflect.ownKeys;
const apply = Reflect.apply;
const NativePromise = Promise;
const promisePrototype = NativePromise.prototype;
const promiseParent = getPrototype(promisePrototype);
const constructorParent = getPrototype(NativePromise);
const thenDescriptor = getDescriptor(promisePrototype, "then");
const constructorDescriptor = getDescriptor(promisePrototype, "constructor");
const prototypeDescriptor = getDescriptor(NativePromise, "prototype");
const speciesDescriptor = getDescriptor(NativePromise, Symbol.species);
const nativeThen: unknown = thenDescriptor?.value;

/** Read one own data descriptor, never invoke an accessor or reread its value. */
export function correctionData(input: unknown, key: string): unknown {
  if (input === null || typeof input !== "object") throw new Error();
  const descriptor = getDescriptor(input, key);
  if (!descriptor || !("value" in descriptor)) throw new Error();
  return descriptor.value;
}
function text(value: unknown): string {
  if (typeof value !== "string") throw new Error();
  return value;
}
function integer(value: unknown, minimum = 0): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < minimum
  )
    throw new Error();
  return value;
}
function boolean(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error();
  return value;
}
function epochCapture(context: unknown, epoch: unknown) {
  const definitionKey = text(correctionData(context, "definitionKey"));
  const scopeKey = text(correctionData(context, "scopeKey"));
  const access = boolean(correctionData(context, "access"));
  if (
    typeof epoch !== "string" &&
    (typeof epoch !== "number" || !Number.isFinite(epoch))
  )
    throw new Error();
  return Object.freeze({
    access,
    stamp: canonicalJson({ definitionKey, scopeKey, access, epoch }),
  });
}
function sameDescriptor(
  actual: PropertyDescriptor | undefined,
  expected: PropertyDescriptor | undefined,
): boolean {
  return (
    actual !== undefined &&
    expected !== undefined &&
    actual.value === expected.value &&
    actual.get === expected.get &&
    actual.set === expected.set &&
    actual.writable === expected.writable &&
    actual.enumerable === expected.enumerable &&
    actual.configurable === expected.configurable
  );
}

function observeOrdinaryPromise(value: object): void {
  try {
    // Inspection uses descriptors, not property Get on user constructor/species
    // hooks. Own keys must be
    // empty and the exact prototype/constructor/then/species descriptors intact.
    // Inspect the application object BEFORE the final intrinsic-domain checks:
    // proxy descriptor/prototype traps cannot change that domain after validation.
    if (
      getPrototype(value) !== promisePrototype ||
      ownKeys(value).length !== 0 ||
      typeof nativeThen !== "function" ||
      typeof speciesDescriptor?.get !== "function" ||
      constructorDescriptor?.value !== NativePromise ||
      prototypeDescriptor?.value !== promisePrototype ||
      getPrototype(promisePrototype) !== promiseParent ||
      getPrototype(NativePromise) !== constructorParent ||
      !sameDescriptor(
        getDescriptor(promisePrototype, "constructor"),
        constructorDescriptor,
      ) ||
      !sameDescriptor(
        getDescriptor(promisePrototype, "then"),
        thenDescriptor,
      ) ||
      !sameDescriptor(
        getDescriptor(NativePromise, "prototype"),
        prototypeDescriptor,
      ) ||
      !sameDescriptor(
        getDescriptor(NativePromise, Symbol.species),
        speciesDescriptor,
      )
    )
      return;
    // The intrinsic brand check rejects non-Promises/proxies before constructor
    // lookup. For an ordinary Promise the checked native species getter is safe.
    void apply(nativeThen, value, [() => {}, () => {}]);
  } catch {}
}

function rejectAsync(value: unknown): void {
  if (value === null || typeof value !== "object") return;
  let current: object | null = value;
  for (let depth = 0; current !== null && depth < 32; depth++) {
    if (current === promisePrototype || getDescriptor(current, "then")) {
      // Best effort only. A poisoned already-rejected application Promise may
      // be impossible to observe without invoking hooks or mutating app objects.
      observeOrdinaryPromise(value);
      throw new Error();
    }
    current = getPrototype(current);
  }
  if (current !== null) throw new Error();
}

export function captureCorrectionOrigin<
  S extends QuerySchema,
  T extends object,
>(input: unknown) {
  try {
    const definition = correctionData(input, "definition") as NativeDefinition<
      S,
      T
    >;
    const context = correctionData(input, "context");
    const epoch = correctionData(input, "epoch");
    const readCurrent = correctionData(input, "readCurrent");
    if (typeof readCurrent !== "function") return null;
    const captured = epochCapture(context, epoch);
    return Object.freeze({
      definition,
      ...captured,
      readCurrent,
      receiver: input,
    });
  } catch {
    return null;
  }
}

export function readCorrectionEpoch(
  origin: Pick<
    NonNullable<ReturnType<typeof captureCorrectionOrigin>>,
    "readCurrent" | "receiver"
  >,
) {
  try {
    const result: unknown = apply(origin.readCurrent, origin.receiver, []);
    rejectAsync(result);
    const context = correctionData(result, "context");
    const epoch = correctionData(result, "epoch");
    return epochCapture(context, epoch);
  } catch {
    return null;
  }
}

/** Copy only correction metadata, never records, rows or a supplied query tree.
 * Its semantics are proved against the accepted query and current authority. */
export function captureKnownCorrection(input: unknown) {
  try {
    const canNavigate = boolean(correctionData(input, "canNavigate"));
    const busy = boolean(correctionData(input, "busy"));
    const stale = boolean(correctionData(input, "stale"));
    const obsolete = boolean(correctionData(input, "obsolete"));
    const resourceObsolete = boolean(correctionData(input, "resourceObsolete"));
    const blockedReason = correctionData(input, "blockedReason");
    if (
      !canNavigate ||
      busy ||
      stale ||
      obsolete ||
      resourceObsolete ||
      blockedReason !== null
    )
      return null;
    const displayed = correctionData(input, "displayed");
    const mode = correctionData(displayed, "mode");
    if (mode !== "client" && mode !== "server") return null;
    const queryIdentity = text(correctionData(displayed, "queryIdentity"));
    const evaluatedAt = correctionData(displayed, "evaluatedAt");
    if (typeof evaluatedAt !== "number" || !Number.isFinite(evaluatedAt))
      return null;
    const pagination = correctionData(displayed, "pagination");
    const pageIndex = integer(correctionData(pagination, "pageIndex"));
    const pageSize = integer(correctionData(pagination, "pageSize"), 1);
    const pageInfo = correctionData(displayed, "pageInfo");
    const kind = correctionData(pageInfo, "kind");
    if (kind !== "known") return null;
    const total = integer(correctionData(pageInfo, "total"));
    const pageCount = integer(correctionData(displayed, "pageCount"));
    if (pageCount !== Math.ceil(total / pageSize)) return null;
    const recordCount = integer(correctionData(displayed, "recordCount"));
    const inputRange = correctionData(displayed, "range");
    const range =
      inputRange === null
        ? null
        : {
            from: integer(correctionData(inputRange, "from")),
            to: integer(correctionData(inputRange, "to")),
          };
    const inputRequest = correctionData(displayed, "request");
    const request =
      inputRequest === null
        ? null
        : {
            definitionKey: text(correctionData(inputRequest, "definitionKey")),
            scopeKey: text(correctionData(inputRequest, "scopeKey")),
            queryKey: text(correctionData(inputRequest, "queryKey")),
            requestKey: text(correctionData(inputRequest, "requestKey")),
            generation: integer(correctionData(inputRequest, "generation"), 1),
          };
    const receivedAt = correctionData(displayed, "receivedAt");
    if (receivedAt !== null && typeof receivedAt !== "string") return null;
    return Object.freeze({
      queryIdentity,
      evaluatedAt,
      pageCount,
      stamp: canonicalJson({
        mode,
        queryIdentity,
        evaluatedAt,
        pagination: { pageIndex, pageSize },
        pageInfo: { kind, total },
        pageCount,
        recordCount,
        range,
        request,
        receivedAt,
      }),
    });
  } catch {
    return null;
  }
}
