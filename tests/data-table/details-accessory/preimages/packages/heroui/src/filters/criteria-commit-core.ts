import {
  type CriteriaAuthority,
  type CriteriaFrameOwner,
  type CriteriaOrigin,
  type CriteriaPublication,
  type CriteriaPublicationEvent,
  type CriteriaPublicationParticipant,
  type DataTableModel,
  getCriteriaPublicationBinding,
  type TableController,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import { createTableRendererAdapter } from "../table/renderer-commit.js";
import type { TableRendererCell } from "../table/types.js";
import {
  type CriteriaCommitCell,
  type CriteriaToolKind,
  createCriteriaToolAdapter,
} from "./criteria-commit.js";

/** Source-private library policy. No exported factory accepts an application policy,
 * permission callback, participant or reset setter. The two closed entrypoints below
 * select only the actual library adapters. Imports are function-only cycles. */
export interface CommitAdapter<
  S extends QuerySchema,
  Target,
  Ports,
  Actor extends object,
  Committed,
> {
  readonly kind: string;
  readonly controller: TableController<S>;
  readonly deny: () => never;
  readonly registerBeforeCapture: boolean;
  readonly admit: (
    input: unknown,
    metadata: CommitMetadata,
    check: CommitCheck,
    pin: CommitPin<S> | null,
  ) => Admission<S, Target>;
  readonly genuine: (
    target: Target,
    origin: CriteriaOrigin<S>,
    active: boolean,
  ) => void;
  readonly capture: (
    admission: Admission<S, Target>,
    input: unknown,
    metadata: CommitMetadata,
    check: CommitCheck,
    pin: CommitPin<S> | null,
  ) => { ports: Ports; stamp: string | number | undefined; mode: string };
  readonly committed: (
    actor: Actor,
    ports: Ports,
    origin: CriteriaOrigin<S>,
  ) => Committed;
  readonly view: (committed: Committed) => Committed;
  readonly activate?: (target: Target) => void;
  readonly metadataReference?: () => object | null;
  readonly validateUpdate?: (
    admission: Admission<S, Target>,
    pin: CommitPin<S>,
    origin: CriteriaOrigin<S>,
  ) => void;
  readonly clearMetadata?: () => void;
}
export type CommitCheck = () => undefined;
export interface Admission<S extends QuerySchema, Target> {
  readonly target: Target;
  readonly owner: CriteriaFrameOwner<S>;
  readonly origin: CriteriaOrigin<S>;
}
export interface CommitPin<S extends QuerySchema> {
  readonly owner: CriteriaFrameOwner<S>;
  readonly publication: CriteriaPublication<S>;
  readonly origin: CriteriaOrigin<S>;
  readonly stamp: string | number | undefined;
  readonly mode: string;
}
export function sameCommitContext(
  a: CriteriaOrigin<QuerySchema>["context"],
  b: CriteriaOrigin<QuerySchema>["context"],
): boolean {
  return (
    a.definitionKey === b.definitionKey &&
    a.scopeKey === b.scopeKey &&
    a.access === b.access
  );
}
export function sameCommitOrigin<S extends QuerySchema>(
  a: CriteriaOrigin<S>,
  b: CriteriaOrigin<S>,
): boolean {
  return (
    a.controller === b.controller &&
    a.definition === b.definition &&
    a.epoch === b.epoch &&
    sameCommitContext(a.context, b.context)
  );
}
function object(value: unknown): value is object {
  return value !== null && typeof value === "object";
}
/** Original F3 metadata reflection cache, also used for renderer admission. */
export class CommitMetadata {
  private readonly descriptors = new WeakMap<
    object,
    Map<PropertyKey, PropertyDescriptor | undefined>
  >();
  private readonly inherited = new WeakMap<object, Map<PropertyKey, boolean>>();
  constructor(
    private readonly check: () => void,
    private readonly deny: () => never,
  ) {}
  reflect<Value>(read: () => Value): Value {
    this.check();
    try {
      return read();
    } catch {
      return this.deny();
    } finally {
      this.check();
    }
  }
  data(input: unknown, key: PropertyKey, optional = false): unknown {
    this.check();
    if (!object(input)) return this.deny();
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
      if (inherited.get(key) || !optional) return this.deny();
      return undefined;
    }
    if (!Object.hasOwn(descriptor, "value")) return this.deny();
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
      return this.deny();
    return Object.freeze({ definitionKey, scopeKey, access });
  }
  has(input: object, key: PropertyKey): boolean {
    this.data(input, key, true);
    return this.descriptors.get(input)?.get(key) !== undefined;
  }
}
export type CommitLocalRole =
  | "draft"
  | "session"
  | "receipt"
  | "notice"
  | "text"
  | "ime";
interface LocalNode {
  value: unknown;
  readonly role: CommitLocalRole;
}
type NativeFunction = (...args: never[]) => unknown;
interface Registration<S extends QuerySchema> {
  readonly owner: CriteriaFrameOwner<S>;
  readonly origin: CriteriaOrigin<S>;
  readonly authority: CriteriaAuthority<S>;
  phase: "active" | "purged" | "cleaned";
  event: CriteriaPublicationEvent<S> | null;
  release: (() => void) | null;
}
interface Entry<
  S extends QuerySchema,
  Target,
  Ports,
  Actor extends object,
  Lease extends object,
  Committed,
> {
  phase: "capturing" | "active" | "retired";
  readonly lease: Lease;
  readonly target: Target;
  readonly origin: CriteriaOrigin<S>;
  actor: Actor | null;
  ports: Ports | null;
  committed: Committed | null;
}
interface Work<Actor extends object, Committed> {
  readonly actor: Actor;
  readonly cancel: NativeFunction;
  callback: ((committed: Committed) => undefined) | null;
  native: unknown;
  armed: boolean;
  valid: boolean;
  finished: boolean;
}

/** Sole lifecycle implementation. Tool policy preserves original F3 ordering;
 * renderer policy requires real registration before inspecting private ports. */
function createCore<
  S extends QuerySchema,
  Target,
  Ports,
  Actor extends object,
  Lease extends object,
  Committed,
  Handle extends object,
>(adapter: CommitAdapter<S, Target, Ports, Actor, Committed>) {
  const { controller } = adapter;
  function deny(): never {
    return adapter.deny();
  }
  type Item = Entry<S, Target, Ports, Actor, Lease, Committed>;
  const leases = new WeakSet<object>(),
    actors = new WeakMap<object, Item>();
  const nodes = new Set<LocalNode>(),
    work = new Set<Work<Actor, Committed>>(),
    handles = new WeakMap<object, Work<Actor, Committed>>();
  const listeners = new Set<() => void>();
  let mount: Lease | null = null,
    current: Item | null = null,
    registration: Registration<S> | null = null,
    pin: CommitPin<S> | null = null;
  let operation: object = {},
    busy = false,
    notifying = false,
    modelVersion: object = Object.freeze({});
  const makeSnapshot = (version: object) =>
    Object.freeze({
      version,
      actor: current?.actor ?? null,
      ...(adapter.metadataReference ? { modelVersion } : {}),
    });
  let snapshot = makeSnapshot(Object.freeze({}));
  const touch = () => {
    snapshot = makeSnapshot(Object.freeze({}));
  };
  const metadataTouch = () => {
    modelVersion = Object.freeze({});
    snapshot = makeSnapshot(snapshot.version);
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
          /* Metadata observation grants no permission. */
        }
      }
    } finally {
      notifying = false;
    }
  };
  const cancel = (item: Work<Actor, Committed>) => {
    item.valid = false;
    item.callback = null;
    if (item.finished) {
      work.delete(item);
      return;
    }
    if (!item.armed) return deny(); // Preserve exact native-allocation debt.
    if (Reflect.apply(item.cancel, globalThis, [item.native]) !== undefined)
      return deny();
    item.finished = true;
    item.native = null;
    work.delete(item);
  };
  const cancelAll = () => {
    let failed = false;
    for (const item of [...work])
      try {
        cancel(item);
      } catch {
        failed = true;
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
    adapter.clearMetadata?.();
    for (const item of work) {
      item.valid = false;
      item.callback = null;
    }
    touch();
    cancelAll(); // No app/reset/listener call in purge.
  };
  const validLease = (lease: Lease) =>
    object(lease) && leases.has(lease) && mount === lease;
  const requireEntry = (actor: Actor): Item => {
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
    adapter.genuine(entry.target, entry.origin, true);
    if (current !== entry || entry.phase !== "active" || mount !== entry.lease)
      return deny();
    return entry;
  };
  const requireActor = (actor: Actor): Committed => {
    try {
      return adapter.view(requireEntry(actor).committed ?? deny());
    } catch {
      return deny();
    }
  };
  function register(
    admission: Admission<S, Target>,
    metadata: CommitMetadata,
    check: CommitCheck,
  ): Registration<S> {
    const { owner, origin } = admission;
    if (registration) {
      if (
        registration.phase === "active" &&
        registration.owner === owner &&
        sameCommitOrigin(registration.origin, origin)
      )
        return registration;
      if (registration.phase !== "cleaned") return deny();
    }
    const publication = metadata.data(
      owner,
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
      !sameCommitOrigin(binding.origin, origin)
    )
      return deny();
    const entry: Registration<S> = {
      owner,
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
        !sameCommitContext(event.previous.expected, origin.context) ||
        !sameCommitContext(event.previous.actual, origin.context)
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
        if (registration === entry) cancelAll();
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
      else if (registration === entry) registration = null;
      return deny();
    }
  }
  function commit(
    lease: Lease,
    rawTarget: unknown,
    opaqueProps: unknown,
  ): Actor {
    if (!validLease(lease)) return deny();
    if (busy || notifying) {
      try {
        purge();
      } catch {
        registration?.release?.();
      }
      return deny();
    }
    busy = true;
    const token = {};
    operation = token;
    let candidate: Item | null = null;
    const added: { value: Registration<S> | null } = { value: null };
    let actor: Actor;
    const local = () => {
      if (operation !== token || mount !== lease) return deny();
    };
    const check: CommitCheck = () => {
      if (candidate?.phase === "active") {
        if (!candidate.actor) return deny();
        requireEntry(candidate.actor);
      } else {
        local();
        if (candidate?.phase === "retired") return deny();
        if (candidate)
          adapter.genuine(candidate.target, candidate.origin, false);
        local();
      }
      return undefined;
    };
    try {
      const metadata = new CommitMetadata(check, deny);
      const admission = adapter.admit(rawTarget, metadata, check, pin),
        { owner, origin, target } = admission;
      local();
      if (pin && pin.owner !== owner) return deny();
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
      const publication = owner.publication;
      if (
        pin &&
        (pin.origin.controller !== origin.controller ||
          pin.origin.definition !== origin.definition ||
          pin.publication !== publication)
      )
        return deny();
      const ensureRegistration = () => {
        const previous = registration;
        const active = register(admission, metadata, check);
        if (previous !== active) added.value = active;
      };
      if (adapter.registerBeforeCapture) ensureRegistration();
      const captured = adapter.capture(
        admission,
        opaqueProps,
        metadata,
        check,
        pin,
      );
      check();
      if (!adapter.registerBeforeCapture) ensureRegistration();
      cancelAll();
      check();
      actor = Object.freeze({}) as Actor;
      const beforeModel = adapter.metadataReference?.();
      adapter.activate?.(target);
      if (
        adapter.metadataReference &&
        beforeModel !== adapter.metadataReference()
      )
        modelVersion = Object.freeze({});
      candidate.actor = actor;
      candidate.ports = captured.ports;
      candidate.committed = adapter.committed(actor, captured.ports, origin);
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
        stamp: captured.stamp,
        mode: captured.mode,
      });
      touch(); // L-config, no app callback before actor publication.
    } catch {
      if (candidate && candidate !== current) {
        candidate.phase = "retired";
        candidate.ports = null;
        candidate.committed = null;
      }
      let failed = false;
      try {
        purge();
      } catch {
        failed = true;
      }
      if (added.value?.release) added.value.release();
      else if (failed) registration?.release?.();
      busy = false;
      notify();
      return deny();
    } finally {
      busy = false;
    }
    notify();
    requireActor(actor);
    return actor;
  }
  function updateModel(lease: Lease, rawTarget: unknown): void {
    if (
      !validLease(lease) ||
      !adapter.validateUpdate ||
      !adapter.activate ||
      !adapter.metadataReference ||
      !pin ||
      !current
    )
      deny();
    if (busy || notifying) {
      operation = {};
      deny();
    }
    busy = true;
    const token = {};
    operation = token;
    const prior = current;
    const check: CommitCheck = () => {
      if (
        operation !== token ||
        mount !== lease ||
        current !== prior ||
        prior.phase !== "active"
      )
        return deny();
      return undefined;
    };
    let changed = false;
    try {
      const metadata = new CommitMetadata(check, deny),
        admission = adapter.admit(rawTarget, metadata, check, pin);
      check();
      if (
        admission.owner !== pin.owner ||
        admission.owner.publication !== pin.publication ||
        !sameCommitOrigin(admission.origin, prior.origin)
      )
        deny();
      adapter.validateUpdate(admission, pin, prior.origin);
      check();
      adapter.genuine(admission.target, admission.origin, false);
      check();
      const before = adapter.metadataReference();
      adapter.activate(admission.target);
      changed = before !== adapter.metadataReference();
      if (changed) metadataTouch();
    } catch {
      deny();
    } finally {
      busy = false;
    }
    if (changed) notify();
    requireActor(prior.actor ?? deny());
  }
  function createLocal<Value>(role: CommitLocalRole) {
    if (
      !["draft", "session", "receipt", "notice", "text", "ime"].includes(role)
    )
      return deny();
    const node: { value: Value | null; role: CommitLocalRole } = {
      value: null,
      role,
    };
    nodes.add(node);
    const write = (actor: Actor, value: Value | null) => {
      if (busy || notifying) return deny();
      requireActor(actor);
      if (Object.is(node.value, value)) return;
      node.value = value;
      touch();
      notify();
      requireActor(actor);
    };
    return Object.freeze({
      read(actor: Actor): Value | null {
        requireActor(actor);
        const value = node.value;
        requireActor(actor);
        return value;
      },
      write(actor: Actor, value: Value) {
        write(actor, value);
      },
      clear(actor: Actor) {
        write(actor, null);
      },
    });
  }
  function schedule(
    actor: Actor,
    delay: number | null,
    callback: (committed: Committed) => undefined,
  ): Handle {
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
              : globalThis.setTimeout,
          stop =
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
    const item: Work<Actor, Committed> = {
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
    }) as Handle;
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
        /* Stale/denied work exposes nothing further. */
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
          /* Exact owned cancellation debt remains. */
        }
      } else {
        item.finished = true;
        work.delete(item);
      }
      return deny();
    }
  }
  const cell = {
    kind: adapter.kind,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      if (typeof listener !== "function") return deny();
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    connect(): Lease {
      if (busy || notifying || mount) return deny();
      const lease = Object.freeze({}) as Lease;
      leases.add(lease);
      mount = lease;
      return lease;
    },
    commit,
    require: requireActor,
    disconnect(lease: Lease) {
      if (!object(lease) || !leases.has(lease)) return deny();
      if (mount !== lease) return;
      mount = null;
      const entry = registration;
      try {
        purge();
      } finally {
        if (entry?.release) entry.release();
        notify();
      }
    },
    createLocal,
    timeout: (
      actor: Actor,
      delay: number,
      run: (committed: Committed) => undefined,
    ) => schedule(actor, delay, run),
    animationFrame: (actor: Actor, run: (committed: Committed) => undefined) =>
      schedule(actor, null, run),
    cancelWork(actor: Actor, handle: Handle) {
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
  };
  // Tool runtime own keys stay unchanged, not just its declaration signature.
  if (adapter.validateUpdate)
    Object.defineProperty(cell, "updateModel", {
      value: updateModel,
      enumerable: true,
    });
  return Object.freeze(cell);
}

export function createToolCommitCore<
  K extends CriteriaToolKind,
  S extends QuerySchema,
>(kind: K, controller: TableController<S>): CriteriaCommitCell<K, S> {
  const adapter = createCriteriaToolAdapter(kind, controller);
  // Only opaque library-issued lease/actor/local/work brands are materialized here.
  return createCore(adapter) as CriteriaCommitCell<K, S>;
}
export function createRendererCommitCore<
  S extends QuerySchema,
  T extends object,
>(model: DataTableModel<S, T>): TableRendererCell<S, T> {
  const adapter = createTableRendererAdapter(model);
  // The closed renderer adapter installs updateModel; all missing declaration
  // members are opaque lease/actor/local/work brands, not consumer data casts.
  return createCore(adapter) as unknown as TableRendererCell<S, T>;
}
