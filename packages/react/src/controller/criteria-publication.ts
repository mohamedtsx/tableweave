import type { QuerySchema } from "../contracts/types.js";
import type {
  CriteriaAuthority,
  CriteriaCurrent,
  CriteriaOrigin,
} from "./criteria.js";
import {
  CriteriaAuthorityError,
  createCriteriaAuthority,
  getCriteriaAuthorityOrigin,
} from "./criteria.js";
import type { ControllerDefinition, TableController } from "./types.js";

export type CriteriaPublicationNext<S extends QuerySchema> = Readonly<{
  controller: TableController<S>;
  definition: ControllerDefinition<S>;
  expected: CriteriaCurrent<S>["expected"];
  actual: CriteriaCurrent<S>["actual"];
}>;

export type CriteriaPublicationFailure =
  | "owner-conflict"
  | "invalid-input"
  | "purge"
  | "cleanup"
  | "retirement"
  | "reentrant"
  | "cancelled"
  | "epoch-exhausted"
  | "closing";

declare const snapshotVersionType: unique symbol;
interface SnapshotVersion {
  readonly [snapshotVersionType]: true;
}
export type CriteriaPublicationSnapshot<S extends QuerySchema> =
  | Readonly<{
      phase: "unready";
      version: SnapshotVersion;
      current: null;
      pending: null;
      failure: null;
    }>
  | Readonly<{
      phase: "blocked";
      version: SnapshotVersion;
      current: null;
      pending: CriteriaCurrent<S> | null;
      failure: CriteriaPublicationFailure | null;
    }>
  | Readonly<{
      phase: "settled";
      version: SnapshotVersion;
      current: CriteriaCurrent<S>;
      pending: null;
      failure: null;
    }>
  | Readonly<{
      phase: "disposed";
      version: SnapshotVersion;
      current: null;
      pending: null;
      failure: null;
    }>;

declare const ticketType: unique symbol;
export interface CriteriaPublicationTicket<S extends QuerySchema> {
  readonly [ticketType]: S;
}
export interface CriteriaPublicationEvent<S extends QuerySchema> {
  readonly kind: "transition" | "release" | "dispose";
  readonly controller: TableController<S>;
  readonly definition: ControllerDefinition<S>;
  readonly previous: CriteriaCurrent<S> | null;
  readonly next: CriteriaCurrent<S> | null;
}
export interface CriteriaPublicationParticipant<S extends QuerySchema> {
  readonly purge: (event: CriteriaPublicationEvent<S>) => undefined;
  readonly cleanup?: (event: CriteriaPublicationEvent<S>) => undefined;
}
export interface CriteriaPublicationRetirementPort<S extends QuerySchema> {
  readonly retire: (event: CriteriaPublicationEvent<S>) => undefined;
}
export interface CriteriaPublicationObserver {
  readonly notify: () => undefined;
}
export interface CriteriaPublicationOptions<S extends QuerySchema> {
  readonly controller: TableController<S>;
  readonly definition: ControllerDefinition<NoInfer<S>>;
  readonly retirement: CriteriaPublicationRetirementPort<NoInfer<S>>;
}
interface ResultInfo<S extends QuerySchema> {
  readonly snapshot: CriteriaPublicationSnapshot<S>;
  readonly notificationFailures: number;
}
export type CriteriaPublicationBeginResult<S extends QuerySchema> =
  | (ResultInfo<S> &
      Readonly<{ status: "pending"; ticket: CriteriaPublicationTicket<S> }>)
  | (ResultInfo<S> &
      Readonly<{
        status: "blocked";
        ticket: CriteriaPublicationTicket<S> | null;
        reason: CriteriaPublicationFailure;
      }>);
export type CriteriaPublicationCompleteResult<S extends QuerySchema> =
  | (ResultInfo<S> & Readonly<{ status: "settled" }>)
  | (ResultInfo<S> &
      Readonly<{ status: "blocked"; reason: CriteriaPublicationFailure }>)
  | (ResultInfo<S> & Readonly<{ status: "stale" }>);
export type CriteriaPublicationCancelResult<S extends QuerySchema> =
  ResultInfo<S> & Readonly<{ status: "cancelled" | "stale" }>;
export type CriteriaPublicationDisposeResult<S extends QuerySchema> =
  | (ResultInfo<S> & Readonly<{ status: "disposed" }>)
  | (ResultInfo<S> &
      Readonly<{ status: "blocked"; reason: CriteriaPublicationFailure }>);
export interface CriteriaPublication<S extends QuerySchema> {
  readonly getSnapshot: (
    this: CriteriaPublication<S>,
  ) => CriteriaPublicationSnapshot<S>;
  readonly issue: (
    this: CriteriaPublication<S>,
    origin: CriteriaOrigin<NoInfer<S>>,
  ) => CriteriaAuthority<S>;
  readonly begin: (
    this: CriteriaPublication<S>,
    next: CriteriaPublicationNext<NoInfer<S>>,
  ) => CriteriaPublicationBeginResult<S>;
  readonly complete: (
    this: CriteriaPublication<S>,
    ticket: CriteriaPublicationTicket<NoInfer<S>>,
  ) => CriteriaPublicationCompleteResult<S>;
  readonly cancel: (
    this: CriteriaPublication<S>,
    ticket: CriteriaPublicationTicket<NoInfer<S>>,
  ) => CriteriaPublicationCancelResult<S>;
  readonly dispose: (
    this: CriteriaPublication<S>,
  ) => CriteriaPublicationDisposeResult<S>;
  readonly registerParticipant: (
    this: CriteriaPublication<S>,
    authority: CriteriaAuthority<NoInfer<S>>,
    participant: CriteriaPublicationParticipant<NoInfer<S>>,
  ) => () => void;
  readonly subscribe: (
    this: CriteriaPublication<S>,
    observer: CriteriaPublicationObserver,
  ) => () => void;
}
export interface CriteriaPublicationBinding<S extends QuerySchema> {
  readonly publication: CriteriaPublication<S>;
  readonly origin: CriteriaOrigin<S>;
}

export class CriteriaPublicationError extends Error {
  readonly code = "criteria.publication.invalid";

  constructor() {
    super("Invalid criteria publication operation.");
    this.name = "CriteriaPublicationError";
  }
}

function invalid(): never {
  throw new CriteriaPublicationError();
}
function object(value: unknown): value is object {
  return value !== null && typeof value === "object";
}

/** Per-operation reflection cache. Checks also run when a trap throws. */
class Capture {
  private readonly prototypes = new WeakMap<object, unknown>();
  private readonly descriptors = new WeakMap<
    object,
    Map<string, PropertyDescriptor | undefined>
  >();

  constructor(private readonly check: () => void) {}

  private reflect<T>(action: () => T): T {
    try {
      return action();
    } finally {
      this.check();
    }
  }

  envelope(value: unknown): object {
    if (!object(value)) return invalid();
    if (!this.prototypes.has(value)) {
      if (this.reflect(() => Array.isArray(value))) return invalid();
      this.prototypes.set(
        value,
        this.reflect(() => Object.getPrototypeOf(value)),
      );
    }
    const prototype = this.prototypes.get(value);
    if (prototype !== Object.prototype && prototype !== null) return invalid();
    return value;
  }

  descriptor(value: object, key: string): PropertyDescriptor | undefined {
    let fields = this.descriptors.get(value);
    if (!fields) {
      fields = new Map();
      this.descriptors.set(value, fields);
    }
    if (!fields.has(key))
      fields.set(
        key,
        this.reflect(() => Object.getOwnPropertyDescriptor(value, key)),
      );
    return fields.get(key);
  }

  data(value: object, key: string): unknown {
    const descriptor = this.descriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, "value")) return invalid();
    return descriptor.value;
  }

  context(input: unknown): CriteriaCurrent<QuerySchema>["expected"] {
    const value = this.envelope(input);
    const definitionKey = this.data(value, "definitionKey");
    const scopeKey = this.data(value, "scopeKey");
    const access = this.data(value, "access");
    if (
      typeof definitionKey !== "string" ||
      !definitionKey ||
      typeof scopeKey !== "string" ||
      !scopeKey ||
      typeof access !== "boolean"
    )
      return invalid();
    return Object.freeze({ definitionKey, scopeKey, access });
  }

  callback(input: unknown, name: string): Callback {
    const receiver = this.envelope(input);
    const fn = this.data(receiver, name);
    if (typeof fn !== "function") return invalid();
    return { receiver, fn: fn as Callback["fn"] };
  }
}

interface Callback {
  readonly receiver: object;
  readonly fn: (...args: never[]) => unknown;
}
interface Issued<S extends QuerySchema> {
  readonly owner: object;
  readonly candidate: CriteriaCurrent<S>;
  readonly binding: CriteriaPublicationBinding<S>;
}
const publications = new WeakMap<object, object>();
const writers = new WeakMap<object, object>();
const tickets = new WeakMap<object, object>();
const authorities = new WeakMap<object, unknown>();

/** Association only; neither property traversal nor current permission. */
export function getCriteriaPublicationBinding<S extends QuerySchema>(
  authority: CriteriaAuthority<S>,
): CriteriaPublicationBinding<S> | null {
  if (!object(authority)) return null;
  return (authorities.get(authority) as Issued<S> | undefined)?.binding ?? null;
}

function sameContext(
  a: CriteriaCurrent<QuerySchema>["expected"],
  b: CriteriaCurrent<QuerySchema>["expected"],
): boolean {
  return (
    a.definitionKey === b.definitionKey &&
    a.scopeKey === b.scopeKey &&
    a.access === b.access
  );
}

interface Participant<S extends QuerySchema> {
  port: object | null;
  purge: Callback | null;
  cleanup: Callback | null;
  readonly domain: CriteriaCurrent<S>;
  active: boolean;
  purged: boolean;
  cleaned: boolean;
  purgeEvent: CriteriaPublicationEvent<S>;
  cleanupEvent: CriteriaPublicationEvent<S>;
}
interface Observer {
  callback: Callback | null;
}

/** Inert capture only. First valid explicit begin admits the metadata writer. */
export function createCriteriaPublication<S extends QuerySchema>(
  options: CriteriaPublicationOptions<S>,
): CriteriaPublication<S> {
  let controller: TableController<S>;
  let definition: ControllerDefinition<S>;
  let retirement: Callback | null;
  try {
    const capture = new Capture(() => {});
    const input = capture.envelope(options);
    const c = capture.data(input, "controller");
    const d = capture.data(input, "definition");
    if (!object(c) || !object(d)) return invalid();
    controller = c as TableController<S>;
    definition = d as ControllerDefinition<S>;
    retirement = capture.callback(capture.data(input, "retirement"), "retire");
  } catch {
    return invalid();
  }

  const key = Object.freeze({});
  const version = () => Object.freeze({}) as SnapshotVersion;
  let snapshot: CriteriaPublicationSnapshot<S> = Object.freeze({
    phase: "unready",
    version: version(),
    current: null,
    pending: null,
    failure: null,
  });
  let admitted = false;
  let closing = false;
  let exhausted = false;
  let epoch = 0;
  let generation: object = {};
  let depth = 0;
  let candidate: CriteriaCurrent<S> | null = null;
  let ticket: CriteriaPublicationTicket<S> | null = null;
  let lastSettled: CriteriaCurrent<S> | null = null;
  const participants = new Set<Participant<S>>();
  const participantPorts = new WeakMap<object, Participant<S>>();
  const observers = new Set<Observer>();

  function receiver(value: unknown): void {
    if (!object(value) || publications.get(value) !== key) invalid();
  }
  function blocked(
    failure: CriteriaPublicationFailure | null,
    pending: CriteriaCurrent<S> | null = null,
  ): void {
    if (snapshot.phase === "disposed") return;
    if (
      snapshot.phase === "blocked" &&
      snapshot.failure === failure &&
      snapshot.pending === pending
    )
      return;
    snapshot = Object.freeze({
      phase: "blocked",
      version: version(),
      current: null,
      pending,
      failure,
    });
  }
  function invalidate(failure: CriteriaPublicationFailure | null): void {
    generation = {};
    candidate = null;
    ticket = null;
    blocked(failure);
  }
  function reason(): CriteriaPublicationFailure {
    return snapshot.failure ?? (closing ? "closing" : "reentrant");
  }
  function live(token: object, allowClosing = false): boolean {
    return (
      generation === token &&
      snapshot.phase !== "disposed" &&
      (!closing || allowClosing) &&
      (!admitted || writers.get(controller) === key)
    );
  }
  function guard(
    token: object,
    owner: "none" | "vacant" | "owned",
  ): () => void {
    return () => {
      if (
        generation !== token ||
        snapshot.phase === "disposed" ||
        (owner !== "none" && closing)
      )
        return invalid();
      if (
        (owner === "vacant" && writers.has(controller)) ||
        (owner === "owned" && writers.get(controller) !== key)
      ) {
        invalidate("owner-conflict");
        return invalid();
      }
    };
  }
  function failure(value: CriteriaPublicationFailure): void {
    if (snapshot.phase !== "disposed" && !snapshot.failure) {
      if (snapshot.phase === "settled") {
        // Failed release is not a new pending transition/receipt.
        candidate = null;
        ticket = null;
      }
      blocked(value, candidate);
    }
  }
  function event(
    kind: CriteriaPublicationEvent<S>["kind"],
    next: CriteriaCurrent<S> | null,
    previous = lastSettled,
  ): CriteriaPublicationEvent<S> {
    return Object.freeze({ kind, controller, definition, previous, next });
  }
  function deactivate(
    entry: Participant<S>,
    kind: CriteriaPublicationEvent<S>["kind"],
  ): void {
    if (!entry.active) return;
    entry.active = false;
    entry.purged = false;
    entry.cleaned = entry.cleanup === null;
    entry.purgeEvent = event(
      kind,
      null,
      kind === "release" ? entry.domain : lastSettled,
    );
    entry.cleanupEvent = entry.purgeEvent;
  }
  function retireParticipant(entry: Participant<S>): void {
    if (entry.active || !entry.purged || !entry.cleaned) return;
    participants.delete(entry);
    if (entry.port && participantPorts.get(entry.port) === entry)
      participantPorts.delete(entry.port);
    entry.port = null;
    entry.purge = null;
    entry.cleanup = null;
  }
  function invoke(
    callback: Callback,
    value: CriteriaPublicationEvent<S>,
  ): boolean {
    try {
      return (
        Reflect.apply(callback.fn, callback.receiver, [value]) === undefined
      );
    } catch {
      return false;
    }
  }
  function drain(
    cohort: readonly Participant<S>[],
    phase: "purge" | "cleanup",
    token: object,
    allowClosing = false,
  ): void {
    for (const entry of cohort) {
      if (!live(token, allowClosing)) return;
      if (!participants.has(entry) || entry.active) continue;
      const done = phase === "purge" ? entry.purged : entry.cleaned;
      const callback = entry[phase];
      if (!done && callback) {
        const acknowledged = invoke(
          callback,
          phase === "purge" ? entry.purgeEvent : entry.cleanupEvent,
        );
        if (!live(token, allowClosing)) return;
        if (acknowledged) {
          if (phase === "purge") entry.purged = true;
          else entry.cleaned = true;
        } else failure(phase);
      }
      retireParticipant(entry);
    }
  }
  function debt(): boolean {
    for (const entry of participants)
      if (!entry.active && (!entry.purged || !entry.cleaned)) return true;
    return false;
  }
  function notify(): number {
    let failures = 0;
    for (const entry of [...observers]) {
      if (!observers.has(entry) || !entry.callback) continue;
      const callback = entry.callback;
      depth++;
      try {
        if (Reflect.apply(callback.fn, callback.receiver, []) !== undefined)
          failures++;
      } catch {
        failures++;
      } finally {
        depth--;
      }
    }
    return failures;
  }
  function info(notificationFailures = 0): ResultInfo<S> {
    return { snapshot, notificationFailures };
  }
  function blockedBegin(
    notificationFailures = 0,
    receipt: CriteriaPublicationTicket<S> | null = null,
  ): CriteriaPublicationBeginResult<S> {
    return Object.freeze({
      ...info(notificationFailures),
      status: "blocked",
      ticket: receipt,
      reason: reason(),
    });
  }
  function captureNext(
    input: unknown,
    capture: Capture,
  ): CriteriaPublicationNext<S> {
    const value = capture.envelope(input);
    if (capture.descriptor(value, "epoch")) return invalid();
    const c = capture.data(value, "controller");
    const d = capture.data(value, "definition");
    const expected = capture.context(capture.data(value, "expected"));
    const actual = capture.context(capture.data(value, "actual"));
    if (c !== controller || d !== definition) return invalid();
    return Object.freeze({ controller, definition, expected, actual });
  }
  function install(next: CriteriaCurrent<S>): void {
    candidate = next;
    ticket = Object.freeze({}) as CriteriaPublicationTicket<S>;
    tickets.set(ticket, key);
    blocked(snapshot.failure, candidate);
  }
  function ownTicket(input: unknown): void {
    if (!object(input) || tickets.get(input) !== key) invalid();
  }
  function terminal(): void {
    generation = {};
    candidate = null;
    ticket = null;
    lastSettled = null;
    retirement = null;
    snapshot = Object.freeze({
      phase: "disposed",
      version: version(),
      current: null,
      pending: null,
      failure: null,
    });
  }
  function release(entry: Participant<S>): void {
    if (!participants.has(entry) || !entry.active) return;
    deactivate(entry, "release");
    if (depth) {
      invalidate("reentrant");
      return;
    }
    const token = generation;
    depth++;
    try {
      drain([entry], "purge", token);
      drain([entry], "cleanup", token);
      if (live(token) && participants.has(entry)) invalidate(reason());
    } finally {
      depth--;
    }
    notify();
  }

  const publication: CriteriaPublication<S> = Object.freeze({
    getSnapshot(this: CriteriaPublication<S>) {
      receiver(this);
      return snapshot;
    },
    begin(
      this: CriteriaPublication<S>,
      next: CriteriaPublicationNext<S>,
    ): CriteriaPublicationBeginResult<S> {
      receiver(this);
      if (closing || snapshot.phase === "disposed") {
        return Object.freeze({
          ...info(),
          status: "blocked",
          ticket: null,
          reason: "closing",
        });
      }
      if (depth) {
        invalidate("reentrant");
        return blockedBegin();
      }
      if (exhausted) return blockedBegin();
      if (!admitted && writers.has(controller)) {
        blocked("owner-conflict");
        return blockedBegin();
      }
      invalidate(null);
      const token = generation;
      const cohort = [...participants];
      const newlyActive = cohort.filter((entry) => entry.active);
      if (admitted) {
        if (writers.get(controller) !== key) {
          blocked("owner-conflict");
          return blockedBegin();
        }
        if (epoch === Number.MAX_SAFE_INTEGER) {
          exhausted = true;
          failure("epoch-exhausted");
        } else epoch++;
        for (const entry of newlyActive) deactivate(entry, "transition");
      }
      depth++;
      try {
        if (admitted) drain(cohort, "purge", token);
        let captured: CriteriaPublicationNext<S> | null = null;
        if (live(token) && !exhausted) {
          try {
            captured = captureNext(
              next,
              new Capture(guard(token, admitted ? "owned" : "vacant")),
            );
          } catch {
            if (live(token)) failure("invalid-input");
          }
        }
        const proposed = captured
          ? Object.freeze({ ...captured, epoch: admitted ? epoch : 1 })
          : null;
        if (live(token) && admitted) {
          for (const entry of newlyActive) {
            if (participants.has(entry))
              entry.cleanupEvent = event("transition", proposed);
          }
          drain(cohort, "cleanup", token);
        }
        if (proposed && live(token) && !exhausted) {
          if (!admitted) {
            guard(token, "vacant")();
            // L-admit: no external work between the final check and pending state.
            epoch = 1;
            writers.set(controller, key);
            admitted = true;
          }
          install(proposed);
        }
      } finally {
        depth--;
      }
      const beforeNotify = generation;
      const notifications = admitted ? notify() : 0;
      if (generation !== beforeNotify || !candidate || !ticket || !live(token))
        return blockedBegin(notifications);
      if (snapshot.failure) return blockedBegin(notifications, ticket);
      return Object.freeze({
        ...info(notifications),
        status: "pending",
        ticket,
      });
    },
    complete(
      this: CriteriaPublication<S>,
      receipt: CriteriaPublicationTicket<S>,
    ): CriteriaPublicationCompleteResult<S> {
      receiver(this);
      ownTicket(receipt);
      if (receipt !== ticket || !candidate || snapshot.phase === "disposed")
        return Object.freeze({ ...info(), status: "stale" });
      if (snapshot.phase === "settled")
        return Object.freeze({ ...info(), status: "settled" });
      if (depth) {
        invalidate("reentrant");
        return Object.freeze({
          ...info(),
          status: "blocked",
          reason: reason(),
        });
      }
      const token = generation;
      const selected = candidate;
      blocked(null, selected);
      depth++;
      try {
        const cohort = [...participants];
        drain(cohort, "purge", token);
        drain(cohort, "cleanup", token);
        if (live(token) && !debt() && !snapshot.failure && retirement) {
          const acknowledged = invoke(
            retirement,
            event("transition", selected),
          );
          if (live(token)) {
            if (!acknowledged) failure("retirement");
            else {
              lastSettled = selected;
              snapshot = Object.freeze({
                phase: "settled",
                version: version(),
                current: selected,
                pending: null,
                failure: null,
              });
            }
          }
        }
      } finally {
        depth--;
      }
      const beforeNotify = generation;
      const notifications = notify();
      if (generation !== beforeNotify)
        return Object.freeze({ ...info(notifications), status: "stale" });
      if (snapshot.phase === "settled")
        return Object.freeze({ ...info(notifications), status: "settled" });
      return Object.freeze({
        ...info(notifications),
        status: "blocked",
        reason: reason(),
      });
    },
    cancel(
      this: CriteriaPublication<S>,
      receipt: CriteriaPublicationTicket<S>,
    ): CriteriaPublicationCancelResult<S> {
      receiver(this);
      ownTicket(receipt);
      if (receipt !== ticket || snapshot.phase !== "blocked")
        return Object.freeze({ ...info(), status: "stale" });
      invalidate("cancelled");
      const notifications = depth ? 0 : notify();
      return Object.freeze({ ...info(notifications), status: "cancelled" });
    },
    dispose(this: CriteriaPublication<S>): CriteriaPublicationDisposeResult<S> {
      receiver(this);
      if (snapshot.phase === "disposed")
        return Object.freeze({ ...info(), status: "disposed" });
      if (!admitted) {
        terminal();
        for (const entry of observers) entry.callback = null;
        observers.clear();
        return Object.freeze({ ...info(), status: "disposed" });
      }
      closing = true;
      if (depth) {
        invalidate("closing");
        return Object.freeze({
          ...info(),
          status: "blocked",
          reason: "closing",
        });
      }
      invalidate(null);
      if (writers.get(controller) !== key) {
        failure("owner-conflict");
        return Object.freeze({
          ...info(),
          status: "blocked",
          reason: reason(),
        });
      }
      const token = generation;
      depth++;
      try {
        const cohort = [...participants];
        for (const entry of cohort) deactivate(entry, "dispose");
        drain(cohort, "purge", token, true);
        drain(cohort, "cleanup", token, true);
        if (live(token, true) && !debt() && !snapshot.failure && retirement) {
          const acknowledged = invoke(retirement, event("dispose", null));
          if (live(token, true)) {
            if (!acknowledged) failure("retirement");
            else {
              terminal();
              // L-release precedes terminal notification, never a finally deletion.
              if (writers.get(controller) === key) writers.delete(controller);
            }
          }
        }
      } finally {
        depth--;
      }
      const notifications = notify();
      if (info().snapshot.phase === "disposed") {
        for (const entry of observers) entry.callback = null;
        observers.clear();
        return Object.freeze({ ...info(notifications), status: "disposed" });
      }
      return Object.freeze({
        ...info(notifications),
        status: "blocked",
        reason: reason(),
      });
    },
    issue(
      this: CriteriaPublication<S>,
      origin: CriteriaOrigin<S>,
    ): CriteriaAuthority<S> {
      receiver(this);
      if (!admitted || !candidate || !ticket || !live(generation) || depth)
        return invalid();
      const selected = candidate;
      const token = generation;
      depth++;
      try {
        const capture = new Capture(guard(token, "owned"));
        const input = capture.envelope(origin);
        const c = capture.data(input, "controller");
        const d = capture.data(input, "definition");
        const context = capture.context(capture.data(input, "context"));
        const value = capture.data(input, "epoch");
        if (
          c !== controller ||
          d !== definition ||
          value !== selected.epoch ||
          !sameContext(context, selected.expected)
        )
          return invalid();
        guard(token, "owned")();
        const authority = createCriteriaAuthority({
          origin: { controller, definition, context, epoch: selected.epoch },
          readCurrent() {
            if (
              depth ||
              !live(token) ||
              candidate !== selected ||
              snapshot.phase !== "settled" ||
              snapshot.current !== selected
            )
              throw new CriteriaAuthorityError();
            return selected;
          },
        });
        const captured = getCriteriaAuthorityOrigin(authority);
        if (!captured) return invalid();
        const entry: Issued<S> = {
          owner: key,
          candidate: selected,
          binding: Object.freeze({ publication, origin: captured }),
        };
        authorities.set(authority, entry);
        return authority;
      } catch {
        return invalid();
      } finally {
        depth--;
      }
    },
    registerParticipant(
      this: CriteriaPublication<S>,
      authority: CriteriaAuthority<S>,
      port: CriteriaPublicationParticipant<S>,
    ): () => void {
      receiver(this);
      const issued = object(authority)
        ? (authorities.get(authority) as Issued<S> | undefined)
        : undefined;
      if (
        !issued ||
        issued.owner !== key ||
        issued.candidate !== candidate ||
        !candidate ||
        snapshot.phase !== "settled" ||
        !candidate.expected.access ||
        !candidate.actual.access ||
        !sameContext(candidate.expected, candidate.actual) ||
        !live(generation) ||
        depth
      )
        return invalid();
      const token = generation;
      const selected = candidate;
      depth++;
      try {
        const capture = new Capture(guard(token, "owned"));
        const input = capture.envelope(port);
        if (participantPorts.has(input)) return invalid();
        const purge = capture.callback(input, "purge");
        const cleanup = capture.descriptor(input, "cleanup")
          ? capture.callback(input, "cleanup")
          : null;
        guard(token, "owned")();
        const entry: Participant<S> = {
          port: input,
          domain: selected,
          purge,
          cleanup,
          active: true,
          purged: false,
          cleaned: cleanup === null,
          purgeEvent: event("release", null, selected),
          cleanupEvent: event("release", null, selected),
        };
        participants.add(entry);
        participantPorts.set(input, entry);
        return () => release(entry);
      } catch {
        return invalid();
      } finally {
        depth--;
      }
    },
    subscribe(
      this: CriteriaPublication<S>,
      port: CriteriaPublicationObserver,
    ): () => void {
      receiver(this);
      if (depth || snapshot.phase === "disposed") return invalid();
      const token = generation;
      depth++;
      try {
        const capture = new Capture(guard(token, "none"));
        const entry: Observer = { callback: capture.callback(port, "notify") };
        guard(token, "none")();
        observers.add(entry);
        return () => {
          observers.delete(entry);
          entry.callback = null;
        };
      } catch {
        return invalid();
      } finally {
        depth--;
      }
    },
  });
  publications.set(publication, key);
  return publication;
}
