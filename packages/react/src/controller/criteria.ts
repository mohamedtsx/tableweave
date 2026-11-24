import type { QuerySchema } from "../contracts/types.js";
import type { ResourceContext } from "../resource/types.js";
import type { ControllerDefinition, TableController } from "./types.js";

/** Application-owned lifecycle metadata, not query freshness or backend permission. */
export interface CriteriaOrigin<S extends QuerySchema> {
  readonly controller: TableController<S>;
  readonly definition: ControllerDefinition<S>;
  readonly context: ResourceContext;
  readonly epoch: string | number;
}

export interface CriteriaCurrent<S extends QuerySchema> {
  readonly controller: TableController<S>;
  readonly definition: ControllerDefinition<S>;
  readonly expected: ResourceContext;
  readonly actual: ResourceContext;
  readonly epoch: string | number;
}

export interface CriteriaAuthorityOptions<S extends QuerySchema> {
  readonly origin: CriteriaOrigin<S>;
  /** Pure synchronous own-data method. Publish actual revocation/epoch changes
   * before subsequent work. No query, records, subscription or lifetime here.
   * Unsupported async results deny; this protocol does not consume their promises.
   */
  readCurrent(): CriteriaCurrent<NoInfer<S>>;
}

export interface CriteriaAuthority<S extends QuerySchema> {
  /** Verifies the current domain only, not permission after a later callback/await.
   * Editor baselines and pending-proposal retirement remain separate obligations.
   */
  require(): CriteriaOrigin<S>;
}

export class CriteriaAuthorityError extends Error {
  readonly code = "criteria.unavailable";

  constructor() {
    super("Criteria are unavailable.");
    this.name = "CriteriaAuthorityError";
  }
}

function deny(): never {
  throw new CriteriaAuthorityError();
}

function object(value: unknown): value is object {
  return value !== null && typeof value === "object";
}

function envelope(value: unknown): value is object {
  if (!object(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/** Only consumed own data properties are read. No getter or input enumeration. */
function data(value: object, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor || !Object.hasOwn(descriptor, "value")) return deny();
  return descriptor.value;
}

function context(input: unknown): ResourceContext {
  if (!envelope(input)) return deny();
  const definitionKey = data(input, "definitionKey");
  const scopeKey = data(input, "scopeKey");
  const access = data(input, "access");
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

function epoch(input: unknown): string | number {
  if (
    typeof input === "string" ||
    (typeof input === "number" && Number.isFinite(input))
  )
    return input;
  return deny();
}

function origin<S extends QuerySchema>(input: unknown): CriteriaOrigin<S> {
  if (!envelope(input)) return deny();
  const controller = data(input, "controller");
  const definition = data(input, "definition");
  const capturedContext = context(data(input, "context"));
  const capturedEpoch = epoch(data(input, "epoch"));
  if (!object(controller) || !object(definition)) return deny();
  // Opaque references are checked against the actual controller only on require.
  // Never inspect/freeze application definitions, controllers or records here.
  return Object.freeze({
    controller: controller as TableController<S>,
    definition: definition as ControllerDefinition<S>,
    context: capturedContext,
    epoch: capturedEpoch,
  });
}

function sameContext(a: ResourceContext, b: ResourceContext): boolean {
  return (
    a.definitionKey === b.definitionKey &&
    a.scopeKey === b.scopeKey &&
    a.access === b.access
  );
}

function sameOrigin<S extends QuerySchema>(
  a: CriteriaOrigin<S>,
  b: CriteriaOrigin<S>,
): boolean {
  return (
    a.controller === b.controller &&
    a.definition === b.definition &&
    a.epoch === b.epoch &&
    sameContext(a.context, b.context)
  );
}

interface Registration<S extends QuerySchema> {
  readonly origin: CriteriaOrigin<S>;
  readonly read: () => unknown;
}

const registrations = new WeakMap<object, unknown>();

function registered<S extends QuerySchema>(
  authority: CriteriaAuthority<S>,
): Registration<S> | null {
  if (!object(authority)) return null;
  return (registrations.get(authority) as Registration<S> | undefined) ?? null;
}

/** This function sees only library-owned origin/callback captures. */
function requireRegistered<S extends QuerySchema>(
  entry: Registration<S>,
): CriteriaOrigin<S> {
  const captured = entry.origin;
  // An explicitly denied origin invokes neither the reader nor controller methods.
  if (!captured.context.access) return deny();
  const current = entry.read();
  if (!envelope(current)) return deny();
  const controller = data(current, "controller");
  const definition = data(current, "definition");
  const expected = context(data(current, "expected"));
  const actual = context(data(current, "actual"));
  const currentEpoch = epoch(data(current, "epoch"));
  if (
    controller !== captured.controller ||
    definition !== captured.definition ||
    !expected.access ||
    !actual.access ||
    !sameContext(captured.context, expected) ||
    !sameContext(captured.context, actual) ||
    currentEpoch !== captured.epoch
  )
    return deny();

  // Controller callbacks are not even captured until current metadata permits it.
  const isDisposed = data(captured.controller, "isDisposed");
  if (
    typeof isDisposed !== "function" ||
    Reflect.apply(isDisposed, captured.controller, []) !== false
  )
    return deny();
  const getDefinition = data(captured.controller, "getDefinition");
  if (
    typeof getDefinition !== "function" ||
    Reflect.apply(getDefinition, captured.controller, []) !==
      captured.definition
  )
    return deny();
  return captured;
}

/** Construction is inert: no controller/reader calls, subscription or resource lease. */
export function createCriteriaAuthority<S extends QuerySchema>(
  options: CriteriaAuthorityOptions<S>,
): CriteriaAuthority<S> {
  try {
    if (!envelope(options)) return deny();
    const captured = origin<S>(data(options, "origin"));
    const readCurrent = data(options, "readCurrent");
    if (typeof readCurrent !== "function") return deny();
    const entry: Registration<S> = Object.freeze({
      origin: captured,
      read: () => Reflect.apply(readCurrent, options, []),
    });
    const authority: CriteriaAuthority<S> = Object.freeze({
      require(): CriteriaOrigin<S> {
        try {
          if (registered(this) !== entry) return deny();
          return requireRegistered(entry);
        } catch {
          return deny();
        }
      },
    });
    registrations.set(authority, entry);
    return authority;
  } catch {
    return deny();
  }
}

/** Factory provenance only. This lookup invokes no application methods/getters. */
export function getCriteriaAuthorityOrigin<S extends QuerySchema>(
  authority: CriteriaAuthority<S>,
): CriteriaOrigin<S> | null {
  return registered(authority)?.origin ?? null;
}

/** Compare the exact target before entering the registered implementation.
 * Never call an arbitrary public require getter/method or accept a boolean proof.
 */
export function requireCriteriaAuthority<S extends QuerySchema>(
  authority: CriteriaAuthority<S>,
  targetOrigin: CriteriaOrigin<NoInfer<S>>,
): CriteriaOrigin<S> {
  try {
    const entry = registered(authority);
    if (!entry?.origin.context.access) return deny();
    const target = origin<S>(targetOrigin);
    if (!target.context.access || !sameOrigin(entry.origin, target))
      return deny();
    return requireRegistered(entry);
  } catch {
    return deny();
  }
}
