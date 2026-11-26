import type {
  CriteriaAuthority,
  CriteriaFrameOwner,
  CriteriaOrigin,
  CriteriaPublication,
  CriteriaPublicationEvent,
  CriteriaPublicationParticipant,
  CriteriaToolAuthority,
  TableController,
} from "@tableweave/react";
import {
  getCriteriaPublicationBinding,
  getCriteriaToolOwner,
  requireCriteriaTool,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import type {
  CriteriaPortsCheck,
  FilterBuilderPorts,
  FilterDatePorts,
  FilterSearchPorts,
  FilterTabsPorts,
} from "./criteria-ports.js";
import {
  captureFilterBuilderPorts,
  captureFilterDatePorts,
  captureFilterSearchPorts,
  captureFilterTabsPorts,
} from "./criteria-ports.js";

export type CriteriaToolKind = "search" | "tabs" | "date" | "builder";
export interface CriteriaToolTarget<S extends QuerySchema> {
  readonly owner: CriteriaFrameOwner<S>;
  readonly authority: CriteriaToolAuthority<S>;
}
export interface CriteriaPortsByKind<S extends QuerySchema> {
  readonly search: FilterSearchPorts<S>;
  readonly tabs: FilterTabsPorts<S>;
  readonly date: FilterDatePorts<S>;
  readonly builder: FilterBuilderPorts<S>;
}
declare const leaseBrand: unique symbol;
declare const actorBrand: unique symbol;
declare const localBrand: unique symbol;
declare const workBrand: unique symbol;
export interface CriteriaMountLease<
  K extends CriteriaToolKind,
  S extends QuerySchema,
> {
  readonly [leaseBrand]: (kind: K, schema: S) => readonly [K, S];
}
export interface CriteriaActor<
  K extends CriteriaToolKind,
  S extends QuerySchema,
> {
  readonly [actorBrand]: (kind: K, schema: S) => readonly [K, S];
}
export interface CriteriaCommitted<
  K extends CriteriaToolKind,
  S extends QuerySchema,
> {
  readonly actor: CriteriaActor<K, S>;
  readonly ports: CriteriaPortsByKind<S>[K];
  readonly origin: CriteriaOrigin<S>;
}
export interface CriteriaCommitSnapshot<
  K extends CriteriaToolKind,
  S extends QuerySchema,
> {
  readonly version: object;
  readonly actor: CriteriaActor<K, S> | null;
}
export type CriteriaLocalRole =
  | "draft"
  | "session"
  | "receipt"
  | "notice"
  | "text"
  | "ime";
export interface CriteriaLocalCell<
  K extends CriteriaToolKind,
  S extends QuerySchema,
  Value,
> {
  readonly [localBrand]: (
    kind: K,
    schema: S,
    value: Value,
  ) => readonly [K, S, Value];
  readonly read: (actor: CriteriaActor<NoInfer<K>, NoInfer<S>>) => Value | null;
  readonly write: (
    actor: CriteriaActor<NoInfer<K>, NoInfer<S>>,
    value: Value,
  ) => void;
  readonly clear: (actor: CriteriaActor<NoInfer<K>, NoInfer<S>>) => void;
}
export interface CriteriaWorkHandle<
  K extends CriteriaToolKind,
  S extends QuerySchema,
> {
  readonly [workBrand]: (kind: K, schema: S) => readonly [K, S];
  /** Library scheduler deadline only, never permission across callbacks/awaits. */
  readonly deadline: number | null;
}
export type CriteriaLibraryWork<
  K extends CriteriaToolKind,
  S extends QuerySchema,
> = (committed: CriteriaCommitted<K, S>) => undefined;
export interface CriteriaCommitCell<
  K extends CriteriaToolKind,
  S extends QuerySchema,
> {
  readonly kind: K;
  readonly getSnapshot: () => CriteriaCommitSnapshot<K, S>;
  readonly subscribe: (listener: () => void) => () => void;
  readonly connect: () => CriteriaMountLease<K, S>;
  readonly commit: (
    lease: CriteriaMountLease<NoInfer<K>, NoInfer<S>>,
    target: CriteriaToolTarget<NoInfer<S>>,
    opaqueProps: unknown,
  ) => CriteriaActor<K, S>;
  readonly require: (
    actor: CriteriaActor<NoInfer<K>, NoInfer<S>>,
  ) => CriteriaCommitted<K, S>;
  readonly disconnect: (
    lease: CriteriaMountLease<NoInfer<K>, NoInfer<S>>,
  ) => void;
  createLocal<Value>(
    role: "draft" | "session" | "receipt",
  ): CriteriaLocalCell<K, S, Value>;
  createLocal(role: "notice" | "text"): CriteriaLocalCell<K, S, string>;
  createLocal(role: "ime"): CriteriaLocalCell<K, S, boolean>;
  readonly timeout: (
    actor: CriteriaActor<NoInfer<K>, NoInfer<S>>,
    delayMs: number,
    run: CriteriaLibraryWork<NoInfer<K>, NoInfer<S>>,
  ) => CriteriaWorkHandle<K, S>;
  readonly animationFrame: (
    actor: CriteriaActor<NoInfer<K>, NoInfer<S>>,
    run: CriteriaLibraryWork<NoInfer<K>, NoInfer<S>>,
  ) => CriteriaWorkHandle<K, S>;
  readonly cancelWork: (
    actor: CriteriaActor<NoInfer<K>, NoInfer<S>>,
    handle: CriteriaWorkHandle<NoInfer<K>, NoInfer<S>>,
  ) => void;
}

export class CriteriaCommitError extends Error {
  readonly code = "criteria.commit.unavailable";
  constructor() {
    super("Committed criteria ports are unavailable.");
    this.name = "CriteriaCommitError";
  }
}
function deny(): never {
  throw new CriteriaCommitError();
}
function object(value: unknown): value is object {
  return value !== null && typeof value === "object";
}
function sameContext(
  a: CriteriaOrigin<QuerySchema>["context"],
  b: CriteriaOrigin<QuerySchema>["context"],
): boolean {
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

/** Metadata only. Private configuration capture remains the frozen F3a producer. */
class Metadata {
  private readonly descriptors = new WeakMap<
    object,
    Map<PropertyKey, PropertyDescriptor | undefined>
  >();
  private readonly inherited = new WeakMap<object, Map<PropertyKey, boolean>>();
  constructor(private readonly check: () => void) {}
  reflect<Value>(read: () => Value): Value {
    this.check();
    try {
      return read();
    } catch {
      return deny();
    } finally {
      this.check();
    }
  }
  data(input: unknown, key: PropertyKey, optional = false): unknown {
    this.check();
    if (!object(input)) return deny();
    let fields = this.descriptors.get(input);
    if (!fields) {
      fields = new Map();
      this.descriptors.set(input, fields);
    }
    if (!fields.has(key))
      fields.set(
        key,
        this.reflect(() => Object.getOwnPropertyDescriptor(input, key)),
      );
    const descriptor = fields.get(key);
    if (!descriptor) {
      let inherited = this.inherited.get(input);
      if (!inherited) {
        inherited = new Map();
        this.inherited.set(input, inherited);
      }
      if (!inherited.has(key))
        inherited.set(
          key,
          this.reflect(() => Reflect.has(input, key)),
        );
      if (inherited.get(key) || !optional) return deny();
      return undefined;
    }
    if (!Object.hasOwn(descriptor, "value")) return deny();
    return descriptor.value;
  }
  context(input: unknown): CriteriaOrigin<QuerySchema>["context"] {
    const definitionKey = this.data(input, "definitionKey"),
      scopeKey = this.data(input, "scopeKey"),
      access = this.data(input, "access");
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

type NativeFunction = (...args: never[]) => unknown;
interface LocalNode {
  value: unknown;
  readonly role: CriteriaLocalRole;
}
interface Registration<S extends QuerySchema> {
  readonly owner: CriteriaFrameOwner<S>;
  readonly origin: CriteriaOrigin<S>;
  readonly authority: CriteriaAuthority<S>;
  phase: "active" | "purged" | "cleaned";
  event: CriteriaPublicationEvent<S> | null;
  release: (() => void) | null;
}
interface Entry<K extends CriteriaToolKind, S extends QuerySchema> {
  phase: "capturing" | "active" | "retired";
  readonly lease: CriteriaMountLease<K, S>;
  readonly target: CriteriaToolTarget<S>;
  readonly origin: CriteriaOrigin<S>;
  actor: CriteriaActor<K, S> | null;
  ports: CriteriaPortsByKind<S>[K] | null;
  committed: CriteriaCommitted<K, S> | null;
}
interface Work<K extends CriteriaToolKind, S extends QuerySchema> {
  readonly actor: CriteriaActor<K, S>;
  readonly cancel: NativeFunction;
  callback: CriteriaLibraryWork<K, S> | null;
  native: unknown;
  armed: boolean;
  valid: boolean;
  finished: boolean;
}

/** One instance belongs to one raw-tool/controller lifetime. No React work occurs
 * here: the future stable host calls connect/commit/disconnect in actual layout. */
export function createCriteriaCommitCell<
  K extends CriteriaToolKind,
  S extends QuerySchema,
>(kind: K, controller: TableController<S>): CriteriaCommitCell<K, S> {
  if (
    (kind !== "search" &&
      kind !== "tabs" &&
      kind !== "date" &&
      kind !== "builder") ||
    !object(controller)
  )
    return deny();
  const leases = new WeakSet<object>(),
    actors = new WeakMap<object, Entry<K, S>>();
  const nodes = new Set<LocalNode>(),
    work = new Set<Work<K, S>>(),
    handles = new WeakMap<object, Work<K, S>>();
  const listeners = new Set<() => void>();
  let mount: CriteriaMountLease<K, S> | null = null;
  let current: Entry<K, S> | null = null;
  let registration: Registration<S> | null = null;
  let pin: Readonly<{
    owner: CriteriaFrameOwner<S>;
    publication: CriteriaPublication<S>;
    origin: CriteriaOrigin<S>;
    stamp: string | number | undefined;
    mode: "paired" | "client" | "server";
  }> | null = null;
  let operation: object = {};
  let busy = false,
    notifying = false;
  let snapshot: CriteriaCommitSnapshot<K, S> = Object.freeze({
    version: Object.freeze({}),
    actor: null,
  });

  const touch = () => {
    snapshot = Object.freeze({
      version: Object.freeze({}),
      actor: current?.actor ?? null,
    });
  };
  const notify = () => {
    if (notifying) return;
    notifying = true;
    try {
      for (const listener of [...listeners]) {
        if (!listeners.has(listener)) continue;
        try {
          listener();
        } catch {
          /* Metadata observers cannot grant readiness. */
        }
      }
    } finally {
      notifying = false;
    }
  };
  const cancel = (item: Work<K, S>) => {
    item.valid = false;
    item.callback = null;
    if (item.finished) {
      work.delete(item);
      return;
    }
    if (!item.armed) return deny(); // Native allocation still in progress: debt, not a void acknowledgement.
    if (Reflect.apply(item.cancel, globalThis, [item.native]) !== undefined)
      return deny();
    item.finished = true;
    item.native = null;
    work.delete(item);
  };
  const cancelAll = () => {
    let failed = false;
    for (const item of [...work]) {
      try {
        cancel(item);
      } catch {
        failed = true;
      }
    }
    if (failed) return deny();
  };
  const purge = () => {
    operation = {};
    if (current) {
      current.phase = "retired";
      current.ports = null;
      current.committed = null;
    }
    current = null;
    for (const node of nodes) node.value = null;
    for (const item of work) {
      item.valid = false;
      item.callback = null;
    }
    touch(); // Local snapshot changes without invoking an observer in purge.
    cancelAll();
  };
  const validLease = (lease: CriteriaMountLease<K, S>) =>
    object(lease) && leases.has(lease) && mount === lease;
  const genuine = (
    target: CriteriaToolTarget<S>,
    origin: CriteriaOrigin<S>,
  ) => {
    if (getCriteriaToolOwner(target.authority) !== target.owner) return deny();
    const actual = requireCriteriaTool(target.authority, target.owner);
    if (!sameOrigin(actual, origin) || actual.controller !== controller)
      return deny();
  };
  const requireEntry = (actor: CriteriaActor<K, S>): Entry<K, S> => {
    const entry = object(actor) ? actors.get(actor) : undefined;
    if (
      !entry ||
      current !== entry ||
      entry.phase !== "active" ||
      entry.actor !== actor ||
      mount !== entry.lease ||
      !entry.ports ||
      !entry.committed
    )
      return deny();
    genuine(entry.target, entry.origin);
    if (current !== entry || entry.phase !== "active" || mount !== entry.lease)
      return deny();
    return entry;
  };
  const requireActor = (
    actor: CriteriaActor<K, S>,
  ): CriteriaCommitted<K, S> => {
    try {
      return requireEntry(actor).committed ?? deny();
    } catch {
      return deny();
    }
  };

  function register(
    target: CriteriaToolTarget<S>,
    origin: CriteriaOrigin<S>,
    metadata: Metadata,
    check: CriteriaPortsCheck,
  ): Registration<S> {
    if (registration) {
      if (
        registration.phase === "active" &&
        registration.owner === target.owner &&
        sameOrigin(registration.origin, origin)
      )
        return registration;
      if (registration.phase !== "cleaned") return deny();
    }
    const publication = metadata.data(
      target.owner,
      "publication",
    ) as CriteriaPublication<S>;
    const issue = metadata.data(publication, "issue"),
      add = metadata.data(publication, "registerParticipant");
    if (typeof issue !== "function" || typeof add !== "function") return deny();
    check();
    const authority = Reflect.apply(issue, publication, [
      origin,
    ]) as CriteriaAuthority<S>;
    check();
    const binding = getCriteriaPublicationBinding(authority);
    if (
      !binding ||
      binding.publication !== publication ||
      !sameOrigin(binding.origin, origin)
    )
      return deny();
    const entry: Registration<S> = {
      owner: target.owner,
      origin,
      authority,
      phase: "active",
      event: null,
      release: null,
    };
    const owned = (event: CriteriaPublicationEvent<S>) => {
      if (
        event.controller !== controller ||
        event.definition !== origin.definition ||
        !event.previous ||
        event.previous.controller !== controller ||
        event.previous.definition !== origin.definition ||
        event.previous.epoch !== origin.epoch ||
        !sameContext(event.previous.expected, origin.context) ||
        !sameContext(event.previous.actual, origin.context)
      )
        return deny();
      if (
        entry.event &&
        (entry.event.kind !== event.kind ||
          entry.event.previous !== event.previous)
      )
        return deny();
    };
    const participant: CriteriaPublicationParticipant<S> = Object.freeze({
      purge(event: CriteriaPublicationEvent<S>): undefined {
        owned(event);
        if (entry.phase === "cleaned") return undefined;
        entry.event ??= event;
        entry.phase = "purged";
        if (registration === entry) purge();
        return undefined;
      },
      cleanup(event: CriteriaPublicationEvent<S>): undefined {
        owned(event);
        if (entry.phase === "cleaned") return undefined;
        if (!entry.event || entry.phase !== "purged") return deny();
        if (registration === entry) cancelAll(); // Do not acknowledge a failed local purge/cancel phase.
        entry.phase = "cleaned";
        if (registration === entry) registration = null;
        notify();
        return undefined;
      },
    });
    registration = entry;
    try {
      check();
      entry.release = Reflect.apply(add, publication, [
        authority,
        participant,
      ]) as () => void;
      check();
      return entry;
    } catch {
      if (entry.release) entry.release();
      else if (registration === entry) registration = null; // Unpublished reservation only.
      return deny();
    }
  }

  const captures: {
    [Tool in CriteriaToolKind]: (
      schema: S,
      input: unknown,
      check: CriteriaPortsCheck,
    ) => CriteriaPortsByKind<S>[Tool];
  } = {
    // These are untrusted input-shape assertions at the frozen F3a validators,
    // never authority/native/source proof or casts of their validated result.
    search: (_schema, input, check) =>
      captureFilterSearchPorts<S>(
        input as Parameters<typeof captureFilterSearchPorts<S>>[0],
        check,
      ),
    tabs: (schema, input, check) =>
      captureFilterTabsPorts<S>(
        schema,
        input as Parameters<typeof captureFilterTabsPorts<S>>[1],
        check,
      ),
    date: (_schema, input, check) =>
      captureFilterDatePorts<S>(
        input as Parameters<typeof captureFilterDatePorts<S>>[0],
        check,
      ),
    builder: (schema, input, check) =>
      captureFilterBuilderPorts<S>(
        schema,
        input as Parameters<typeof captureFilterBuilderPorts<S>>[1],
        check,
      ),
  };

  function commit(
    lease: CriteriaMountLease<K, S>,
    rawTarget: CriteriaToolTarget<S>,
    opaqueProps: unknown,
  ): CriteriaActor<K, S> {
    if (!validLease(lease)) return deny(); // Stale/foreign mounts cannot retire a replacement.
    if (busy || notifying) {
      try {
        purge();
      } catch {
        // Hand a failed owned phase to the real publisher; only its callback
        // acknowledgements can remove debt. A void release is not completion.
        registration?.release?.();
      }
      return deny();
    }
    busy = true;
    const token = {};
    operation = token;
    let candidate: Entry<K, S> | null = null;
    let added: Registration<S> | null = null;
    let actor: CriteriaActor<K, S>;
    const local = () => {
      if (operation !== token || mount !== lease) return deny();
    };
    const check: CriteriaPortsCheck = () => {
      if (candidate?.phase === "active") {
        if (!candidate.actor) return deny();
        requireEntry(candidate.actor);
      } else {
        local();
        if (candidate?.phase === "retired") return deny();
        if (candidate) genuine(candidate.target, candidate.origin);
        local();
      }
      return undefined;
    };
    try {
      const metadata = new Metadata(check);
      // Authority registry lookup precedes owner payload or any private props.
      const authority = metadata.data(
        rawTarget,
        "authority",
      ) as CriteriaToolAuthority<S>;
      const owner = getCriteriaToolOwner(authority);
      if (!owner || (pin && pin.owner !== owner)) return deny();
      if (metadata.data(rawTarget, "owner") !== owner) return deny();
      const origin = requireCriteriaTool(authority, owner);
      local();
      if (
        origin.controller !== controller ||
        metadata.data(owner, "controller") !== controller ||
        metadata.data(owner, "definition") !== origin.definition
      )
        return deny();
      const target = Object.freeze({ owner, authority });
      candidate = {
        phase: "capturing",
        lease,
        target,
        origin,
        actor: null,
        ports: null,
        committed: null,
      };
      check();
      const publication = owner.publication; // Registry-proved frozen owner, not target payload.
      if (
        pin &&
        (pin.origin.controller !== origin.controller ||
          pin.origin.definition !== origin.definition ||
          pin.publication !== publication)
      )
        return deny();
      if (metadata.data(opaqueProps, "controller") !== controller)
        return deny();
      const expected = metadata.context(
        metadata.data(
          opaqueProps,
          kind === "builder" ? "expectedResourceContext" : "expectedContext",
        ),
      );
      if (!sameContext(expected, origin.context)) return deny();
      const stamp = metadata.data(
        opaqueProps,
        "invalidationKey",
        kind !== "builder",
      );
      if (
        (stamp === undefined && kind === "builder") ||
        (stamp !== undefined &&
          typeof stamp !== "string" &&
          (typeof stamp !== "number" || !Number.isFinite(stamp)))
      )
        return deny();
      const capturedStamp = stamp as string | number | undefined;
      if (
        pin &&
        sameOrigin(pin.origin, origin) &&
        !Object.is(pin.stamp, capturedStamp)
      )
        return deny();
      // Actual controller definition reference/schema, NOT ND schema reference.
      const schema = metadata.data(origin.definition, "schema") as S;
      const ports = captures[kind](schema, opaqueProps, check);
      const mode =
        kind === "builder"
          ? (ports as FilterBuilderPorts<S>).evaluationMode
          : "paired";
      if (pin && sameOrigin(pin.origin, origin) && pin.mode !== mode)
        return deny();
      check();
      const previous = registration;
      const currentRegistration = register(target, origin, metadata, check);
      if (previous !== currentRegistration) added = currentRegistration;
      cancelAll();
      check();
      actor = Object.freeze({}) as CriteriaActor<K, S>;
      candidate.actor = actor;
      candidate.ports = ports;
      candidate.committed = Object.freeze({ actor, ports, origin });
      if (current) {
        current.phase = "retired";
        current.ports = null;
        current.committed = null;
      }
      candidate.phase = "active";
      actors.set(actor, candidate);
      current = candidate;
      pin = Object.freeze({
        owner,
        publication,
        origin,
        stamp: capturedStamp,
        mode,
      });
      touch(); // L-config: no app callback between final check and actor publication.
    } catch {
      if (candidate && candidate !== current) {
        candidate.phase = "retired";
        candidate.ports = null;
        candidate.committed = null;
      }
      let purgeFailed = false;
      try {
        purge();
      } catch {
        purgeFailed = true;
      }
      if (added?.release) added.release();
      else if (purgeFailed) registration?.release?.();
      busy = false;
      notify();
      return deny();
    } finally {
      busy = false;
    }
    notify();
    requireActor(actor); // Post-notification revocation cannot retag/return a stale actor.
    return actor;
  }

  function createLocal<Value>(
    role: CriteriaLocalRole,
  ): CriteriaLocalCell<K, S, Value> {
    if (
      role !== "draft" &&
      role !== "session" &&
      role !== "receipt" &&
      role !== "notice" &&
      role !== "text" &&
      role !== "ime"
    )
      return deny();
    const node: { value: Value | null; role: CriteriaLocalRole } = {
      value: null,
      role,
    };
    nodes.add(node);
    const write = (actor: CriteriaActor<K, S>, value: Value | null) => {
      if (busy || notifying) return deny();
      requireActor(actor);
      if (Object.is(node.value, value)) return;
      node.value = value;
      touch();
      notify();
      requireActor(actor);
    };
    return Object.freeze({
      read(actor: CriteriaActor<K, S>): Value | null {
        requireActor(actor);
        const value = node.value;
        requireActor(actor);
        return value;
      },
      write(actor: CriteriaActor<K, S>, value: Value) {
        write(actor, value);
      },
      clear(actor: CriteriaActor<K, S>) {
        write(actor, null);
      },
    }) as CriteriaLocalCell<K, S, Value>;
  }

  function schedule(
    actor: CriteriaActor<K, S>,
    delay: number | null,
    callback: CriteriaLibraryWork<K, S>,
  ): CriteriaWorkHandle<K, S> {
    if (busy || notifying) return deny();
    requireActor(actor);
    if (
      typeof callback !== "function" ||
      (delay !== null &&
        (typeof delay !== "number" ||
          !Number.isFinite(delay) ||
          delay < 0 ||
          delay > 2147483647))
    )
      return deny();
    const { allocate, stop, now } = (() => {
      try {
        const allocate =
          delay === null
            ? globalThis.requestAnimationFrame
            : globalThis.setTimeout;
        const stop =
          delay === null
            ? globalThis.cancelAnimationFrame
            : globalThis.clearTimeout;
        if (typeof allocate !== "function" || typeof stop !== "function")
          return deny();
        const now = delay === null ? null : Date.now();
        if (now !== null && !Number.isFinite(now)) return deny();
        requireActor(actor);
        return { allocate, stop, now };
      } catch {
        return deny();
      }
    })();
    const item: Work<K, S> = {
      actor,
      cancel: stop as NativeFunction,
      callback,
      native: null,
      armed: false,
      valid: true,
      finished: false,
    };
    const handle = Object.freeze({
      deadline: now === null ? null : now + (delay ?? 0),
    }) as CriteriaWorkHandle<K, S>;
    handles.set(handle, item);
    work.add(item);
    const run = () => {
      const action = item.callback;
      item.callback = null;
      item.finished = true;
      work.delete(item);
      if (!item.valid || !action) return;
      item.valid = false;
      try {
        const committed = requireActor(item.actor);
        const result: unknown = Reflect.apply(action, undefined, [committed]);
        requireActor(item.actor);
        if (result !== undefined) return deny();
      } catch {
        /* Denied/stale work performs no following private action. */
      }
    };
    try {
      item.native = Reflect.apply(
        allocate,
        globalThis,
        delay === null ? [run] : [run, delay],
      );
      item.armed = true;
      if (!item.valid) {
        cancel(item);
        return deny();
      }
      requireActor(actor);
      return handle;
    } catch {
      item.valid = false;
      item.callback = null;
      if (item.armed) {
        try {
          cancel(item);
        } catch {
          /* Retain exact owned cancellation debt. */
        }
      } else {
        item.finished = true;
        work.delete(item);
      }
      return deny();
    }
  }

  const cell: CriteriaCommitCell<K, S> = Object.freeze({
    kind,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      if (typeof listener !== "function") return deny();
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    connect() {
      if (busy || notifying || mount) return deny();
      const lease = Object.freeze({}) as CriteriaMountLease<K, S>;
      leases.add(lease);
      mount = lease;
      return lease;
    },
    commit,
    require: requireActor,
    disconnect(lease: CriteriaMountLease<K, S>) {
      if (!object(lease) || !leases.has(lease)) return deny();
      if (mount !== lease) return;
      mount = null;
      const entry = registration;
      try {
        purge();
      } finally {
        // Only the real cleanup callback, not this void call, retires local debt.
        if (entry?.release) entry.release();
        notify();
      }
    },
    createLocal,
    timeout: (
      actor: CriteriaActor<K, S>,
      delay: number,
      run: CriteriaLibraryWork<K, S>,
    ) => schedule(actor, delay, run),
    animationFrame: (
      actor: CriteriaActor<K, S>,
      run: CriteriaLibraryWork<K, S>,
    ) => schedule(actor, null, run),
    cancelWork(actor: CriteriaActor<K, S>, handle: CriteriaWorkHandle<K, S>) {
      requireActor(actor);
      const item = object(handle) ? handles.get(handle) : undefined;
      if (!item) return deny();
      try {
        cancel(item);
        requireActor(actor);
      } catch {
        return deny();
      }
    },
  });
  return cell;
}
