import type { QuerySchema } from "../contracts/types.js";
import type { CriteriaPublication } from "../controller/criteria-publication.js";
import type {
  StateProposal,
  StateTransition,
  TableCommand,
  TableController,
  TableState,
} from "../controller/types.js";
import { getControlsAuthorityOwner } from "../presentation/authority.js";
import {
  requireCriteriaSource,
  requireCriteriaTool,
} from "../presentation/criteria-frame.js";
import {
  errorCode,
  frame as captureReorderFrame,
  observePromise,
  ReorderError,
} from "../reordering/capture.js";
import { createRowMoveCoordinator } from "../reordering/rows.js";
import type {
  RowMoveBeginResult,
  RowMoveOperation,
  RowReorderFrame,
} from "../reordering/types.js";
import {
  assertTableController,
  assertTableDefinition,
} from "../table/definition.js";
import type { DataTableModel, TableDefinition } from "../table/types.js";
import {
  getDataTableModelOwner,
  requireDataTableModel,
} from "../table/use-data-table.js";
import type { NativeRow } from "../tanstack/types.js";
import type {
  ReorderAdmission,
  ReorderAdmissionLease,
  ReorderAdmissionOwner,
  ReorderAdmissionSnapshot,
  ReorderApplicationMetadata,
  ReorderInteraction,
  ReorderModelJoin,
  ReorderNavigationOrigin,
  ReorderUIBinding,
  ReorderUIMetadata,
} from "./types.js";

export class ReorderAdmissionError extends Error {
  readonly code = "reorder.admission.unavailable";
  constructor() {
    super("Reorder admission is unavailable.");
    this.name = "ReorderAdmissionError";
  }
}
export function deny(): never {
  throw new ReorderAdmissionError();
}
/** Cached own descriptor capture. Reflection and callbacks are always fenced. */
export class AdmissionCapture {
  private readonly objects = new WeakMap<
    object,
    Map<string, PropertyDescriptor>
  >();
  constructor(private readonly check: () => void = () => {}) {}
  call<V>(read: () => V): V {
    this.check();
    try {
      const value = read();
      observePromise(value);
      return value;
    } catch (error) {
      observePromise(error);
      throw error;
    } finally {
      this.check();
    }
  }
  data(input: unknown, allowed: readonly string[]): Map<string, unknown> {
    if (!input || typeof input !== "object") return deny();
    let descriptors = this.objects.get(input);
    if (!descriptors) {
      const prototype = this.call(() => Object.getPrototypeOf(input));
      if (prototype !== null && prototype !== Object.prototype) {
        observePromise(input);
        return deny();
      }
      const captured = this.call(() => Object.getOwnPropertyDescriptors(input));
      descriptors = new Map();
      for (const key of this.call(() => Reflect.ownKeys(captured))) {
        if (typeof key !== "string") return deny();
        const descriptor = captured[key];
        if (!descriptor?.enumerable || !Object.hasOwn(descriptor, "value"))
          return deny();
        descriptors.set(key, descriptor);
      }
      this.objects.set(input, descriptors);
    }
    const result = new Map<string, unknown>();
    for (const [key, descriptor] of descriptors) {
      if (!allowed.includes(key)) return deny();
      result.set(key, descriptor.value);
    }
    for (const key of allowed) {
      if (!descriptors.has(key) && this.call(() => key in input)) return deny();
    }
    return result;
  }
}

type Fn = (...args: never[]) => unknown;
export interface AdmissionCallbacks {
  readonly validateCommand?: Fn;
  readonly validateState?: Fn;
  readonly onRequest?: Fn;
  readonly onQueryChange?: Fn;
  readonly onCommit?: Fn;
}
interface Receipt {
  readonly fence: number;
  readonly lease: object | null;
  readonly revision: number;
  readonly metadata: ReorderApplicationMetadata | null;
  readonly guarded: boolean;
  readonly navigation: boolean;
  valid: boolean;
}
interface Registration<S extends QuerySchema> {
  readonly publication: CriteriaPublication<S>;
  release: (() => void) | null;
  stop: (() => void) | null;
  purged: boolean;
  cleaned: boolean;
}
const handles = new WeakMap<object, unknown>();
const controllers = new WeakMap<object, object>();
interface BridgeAccess {
  claim(lease: object, owner: object): object;
  join(binding: object, model: unknown, actor: object): object;
  requireModel(join: object, model: unknown): void;
  suspend(binding: object): void;
  release(binding: object): void;
  capture(join: object): object;
  navigate(origin: object, join: object, model: unknown): void;
}
interface UIBindingRecord {
  owner: BridgeAccess | null;
  lease: object | null;
  ui: object | null;
  suspended: boolean;
  metadata: ReorderUIMetadata;
}
interface ModelJoinRecord {
  binding: object | null;
  signature: readonly object[] | null;
  actor: object | null;
  revision: number;
}
interface NavigationRecord {
  join: object | null;
  lease: object | null;
  readonly fence: number;
  readonly revision: number;
  metadata: ReorderApplicationMetadata | null;
}
const uiBindings = new WeakMap<object, UIBindingRecord>();
const modelJoins = new WeakMap<object, ModelJoinRecord>();
const navigationOrigins = new WeakMap<object, NavigationRecord>();
const bridgeIdentities = new WeakMap<object, object>();
function bridgeIdentity(value: object): object {
  let identity = bridgeIdentities.get(value);
  if (!identity) {
    identity = Object.freeze({});
    bridgeIdentities.set(value, identity);
  }
  return identity;
}
function bindingRecord(value: object): UIBindingRecord {
  return uiBindings.get(value) ?? deny();
}
function joinOwner(value: object): BridgeAccess {
  const record = modelJoins.get(value);
  if (!record?.binding) return deny();
  return bindingRecord(record.binding).owner ?? deny();
}
/** Explicit D is the sole schema/record anchor. No alleged private payload read. */
export function claimReorderUI<S extends QuerySchema, T extends object>(
  definition: TableDefinition<S, T>,
  admission: ReorderAdmission<NoInfer<S>, NoInfer<T>>,
  lease: ReorderAdmissionLease<NoInfer<S>, NoInfer<T>>,
  uiOwner: object,
): ReorderUIBinding<S, T> {
  assertTableDefinition(definition);
  const owner = getReorderAdmissionOwner(admission);
  if (!owner || owner.definition !== definition) return deny();
  requireReorderAdmission(admission, definition, owner.controller);
  const record = handles.get(admission) as { bridge: BridgeAccess | null };
  if (!record.bridge) return deny();
  return record.bridge.claim(lease, uiOwner) as ReorderUIBinding<S, T>;
}
export function joinReorderModel<S extends QuerySchema, T extends object>(
  binding: ReorderUIBinding<S, T>,
  model: DataTableModel<NoInfer<S>, NoInfer<T>>,
  actor: object,
): ReorderModelJoin<S, T> {
  const owner = bindingRecord(binding).owner ?? deny();
  return owner.join(binding, model, actor) as ReorderModelJoin<S, T>;
}
export function requireReorderModel<S extends QuerySchema, T extends object>(
  join: ReorderModelJoin<S, T>,
  model: DataTableModel<NoInfer<S>, NoInfer<T>>,
): void {
  joinOwner(join).requireModel(join, model);
}
export function suspendReorderUI<S extends QuerySchema, T extends object>(
  binding: ReorderUIBinding<S, T>,
): void {
  bindingRecord(binding).owner?.suspend(binding);
}
export function releaseReorderUI<S extends QuerySchema, T extends object>(
  binding: ReorderUIBinding<S, T>,
): void {
  bindingRecord(binding).owner?.release(binding);
}
/** Stable metadata only, including an immutable last observation on ended bindings. */
export function observeReorderUI<S extends QuerySchema, T extends object>(
  binding: ReorderUIBinding<S, T>,
): ReorderUIMetadata {
  return bindingRecord(binding).metadata;
}
export function captureReorderNavigation<
  S extends QuerySchema,
  T extends object,
>(join: ReorderModelJoin<S, T>): ReorderNavigationOrigin<S, T> {
  return joinOwner(join).capture(join) as ReorderNavigationOrigin<S, T>;
}
export function requireReorderNavigation<
  S extends QuerySchema,
  T extends object,
>(
  origin: ReorderNavigationOrigin<S, T>,
  join: ReorderModelJoin<NoInfer<S>, NoInfer<T>>,
  model: DataTableModel<NoInfer<S>, NoInfer<T>>,
): void {
  const record = navigationOrigins.get(origin);
  if (!record?.join || record.join !== join) deny();
  joinOwner(join).navigate(origin, join, model);
}
export function getReorderAdmissionOwner<
  S extends QuerySchema,
  T extends object,
>(admission: ReorderAdmission<S, T>): ReorderAdmissionOwner<S, T> | null {
  const record = handles.get(admission) as
    | { owner: ReorderAdmissionOwner<S, T> | null }
    | undefined;
  return record?.owner ?? null;
}
export function requireReorderAdmission<
  S extends QuerySchema,
  T extends object,
>(
  admission: ReorderAdmission<S, T>,
  definition: TableDefinition<NoInfer<S>, NoInfer<T>>,
  controller: TableController<NoInfer<S>>,
): ReorderAdmissionOwner<S, T> {
  const owner = getReorderAdmissionOwner(admission);
  if (
    !owner ||
    owner.definition !== definition ||
    owner.controller !== controller ||
    controllers.get(controller) !== admission
  )
    return deny();
  assertTableController(definition, controller);
  return owner;
}
function sameMetadata(
  a: ReorderApplicationMetadata,
  b: ReorderApplicationMetadata,
) {
  return (
    a.ownerEpoch === b.ownerEpoch &&
    a.sourceVersion === b.sourceVersion &&
    Object.is(a.revision, b.revision) &&
    a.baseRevision === b.baseRevision
  );
}
function integer(value: unknown): value is number {
  return Number.isSafeInteger(value) && typeof value === "number" && value >= 0;
}

/** Source-private constructor. The public helper alone binds its actual new C. */
export function createAdmission<S extends QuerySchema, T extends object>(
  definition: TableDefinition<S, T>,
  instanceId: string,
  readCurrent: Fn,
  receiver: object,
  movable: Fn | undefined,
  callbacks: AdmissionCallbacks,
) {
  let controller: TableController<S> | null = null;
  let fence = 0,
    disposed = false,
    working = false,
    notifying = false,
    commandDepth = 0,
    purging = 0,
    queued = false,
    dirty = false,
    beginLatch = false;
  let lease: ReorderAdmissionLease<S, T> | null = null;
  let model: DataTableModel<S, T> | null = null;
  let metadata: ReorderApplicationMetadata | null = null;
  let latestMetadata: ReorderApplicationMetadata | null = null;
  let retiredThrough = -1,
    committedRevision = -1;
  let registration: Registration<S> | null = null;
  let retiredRegistration: Registration<S> | null = null;
  let identity: {
    source: object;
    tool: object;
    mode: string;
    epoch: string | number;
  } | null = null;
  let currentReceipt: Receipt | null = null;
  let interaction: {
    token: ReorderInteraction<S, T>;
    lease: object;
    fence: number;
    frame: RowReorderFrame;
  } | null = null;
  let lastPending: RowMoveOperation | null = null;
  let ownBegin: {
    fence: number;
    operation: RowMoveOperation | null;
    credited: number | null;
  } | null = null;
  const commandReceipts = new WeakMap<object, Receipt>();
  const proposalReceipts = new WeakMap<object, Receipt>();
  const listeners = new Set<() => void>();
  let uiBinding: object | null = null;
  let uiRecord: UIBindingRecord | null = null;
  let modelJoin: object | null = null;
  let modelJoinRecord: ModelJoinRecord | null = null;
  let navigationOrigin: object | null = null;
  let navigationRecord: NavigationRecord | null = null;
  const ownerRecord: {
    owner: ReorderAdmissionOwner<S, T> | null;
    bridge: BridgeAccess | null;
  } = {
    owner: null,
    bridge: null,
  };
  const interactionProof = new WeakMap<object, object>();
  const invoke = (fn: Fn | undefined, args: readonly unknown[]) => {
    try {
      const result: unknown = fn
        ? Reflect.apply(fn, undefined, args)
        : undefined;
      observePromise(result);
      return result;
    } catch (error) {
      observePromise(error);
      throw error;
    }
  };
  const live = () => {
    if (disposed || !controller || controller.isDisposed()) return deny();
  };
  const advanceFence = () => {
    const hadInteraction = interaction !== null;
    interaction = null;
    if (fence === Number.MAX_SAFE_INTEGER) {
      disposed = true;
      return;
    }
    fence++;
    bridgeFenceChanged();
    if (hadInteraction) update();
  };
  const checkAt = (expected: number, mounted = lease) => {
    live();
    if (fence !== expected || lease !== mounted) return deny();
  };
  const readMetadata = (expected: number, mounted = lease) => {
    const capture = new AdmissionCapture(() => checkAt(expected, mounted));
    const raw = capture.call(() => Reflect.apply(readCurrent, receiver, []));
    const fields = capture.data(raw, [
      "ownerEpoch",
      "sourceVersion",
      "revision",
      "baseRevision",
    ]);
    const ownerEpoch = fields.get("ownerEpoch"),
      sourceVersion = fields.get("sourceVersion"),
      revision = fields.get("revision"),
      baseRevision = fields.get("baseRevision");
    if (
      !integer(ownerEpoch) ||
      !integer(sourceVersion) ||
      !(
        revision === null ||
        typeof revision === "string" ||
        (typeof revision === "number" && Number.isFinite(revision))
      ) ||
      !(baseRevision === null || typeof baseRevision === "string") ||
      (typeof revision === "string" && revision.length > 1_048_576) ||
      (typeof baseRevision === "string" && baseRevision.length > 1_048_576)
    )
      return deny();
    const value = Object.freeze({
      ownerEpoch,
      sourceVersion,
      revision,
      baseRevision,
    });
    if (
      latestMetadata &&
      (value.ownerEpoch < latestMetadata.ownerEpoch ||
        (value.ownerEpoch === latestMetadata.ownerEpoch &&
          (value.sourceVersion < latestMetadata.sourceVersion ||
            (value.sourceVersion === latestMetadata.sourceVersion &&
              (!Object.is(value.revision, latestMetadata.revision) ||
                value.baseRevision !== latestMetadata.baseRevision)))))
    )
      return deny();
    latestMetadata = value;
    return value;
  };
  const checkModel = (expected: number, mounted = lease) => {
    checkAt(expected, mounted);
    const value = model;
    if (
      !value ||
      !mounted ||
      !metadata ||
      metadata.ownerEpoch <= retiredThrough
    )
      return deny();
    requireDataTableModel(value, definition);
    if (
      value.controller !== controller ||
      !value.view ||
      !value.authority ||
      !value.sourceTarget ||
      !value.toolTarget ||
      !value.frame ||
      !value.metadata ||
      value.view.controller !== controller ||
      value.view.state !== controller?.getSnapshot()
    )
      return deny();
    const actualOwner = getControlsAuthorityOwner(value.authority);
    if (
      !actualOwner ||
      actualOwner.definition !== definition.native ||
      actualOwner.controller !== controller
    )
      return deny();
    requireCriteriaSource(
      value.sourceTarget.authority,
      value.sourceTarget.owner,
    );
    requireCriteriaTool(value.toolTarget.authority, value.toolTarget.owner);
    if (
      !registration ||
      registration.purged ||
      value.sourceTarget.owner.publication !== registration.publication
    )
      return deny();
    checkAt(expected, mounted);
    if (model !== value) return deny();
    return value;
  };
  const readFrame = (ids: readonly string[]): RowReorderFrame => {
    const expected = fence,
      mounted = lease;
    const value = checkModel(expected, mounted);
    const authority = value.authority;
    if (
      !authority ||
      !value.view ||
      !value.metadata ||
      !value.presentation?.displayed
    )
      return deny();
    const facts = ids.length
      ? authority.require({ type: "reorder", ids })
      : authority.read();
    checkModel(expected, mounted);
    if (
      !facts.displayed ||
      facts.obsolete ||
      facts.resourceObsolete ||
      facts.requestedQuery !== controller?.getSnapshot().query ||
      facts.displayed.queryIdentity !== value.view.state.queryIdentity ||
      facts.rows.length > 100_000 ||
      facts.rows.length !== value.view.rows.length ||
      facts.rows.some((row, index) => row !== value.view?.rows[index])
    )
      return deny();
    const before = readMetadata(expected, mounted);
    if (!metadata || !sameMetadata(before, metadata)) return deny();
    if (ids.length && movable) {
      for (const id of ids) {
        if (!sameMetadata(before, readMetadata(expected, mounted)))
          return deny();
        const row: NativeRow<T> | undefined = facts.rows.find(
          (item) => item.id === id,
        );
        if (!row) return deny();
        checkModel(expected, mounted);
        let allowed: unknown;
        try {
          allowed = Reflect.apply(movable, receiver, [row]);
          observePromise(allowed);
        } catch (error) {
          observePromise(error);
          throw error;
        } finally {
          checkModel(expected, mounted);
        }
        if (!sameMetadata(before, readMetadata(expected, mounted)))
          return deny();
        if (allowed !== true) throw new ReorderError("reorder.eligibility");
        authority.require({ type: "reorder", ids });
        checkModel(expected, mounted);
      }
    }
    const after = readMetadata(expected, mounted);
    if (!sameMetadata(before, after)) return deny();
    if (ids.length) authority.require({ type: "reorder", ids });
    checkModel(expected, mounted);
    const state = value.view.state;
    const complete =
      definition.native.controllerDefinition.schema.pagination.enabled ===
      false;
    if (
      definition.native.paginationEnabled !== !complete ||
      value.view.pagination.enabled !== !complete
    )
      return deny();
    return captureReorderFrame({
      stamp: Object.freeze({
        ownerEpoch: after.ownerEpoch,
        sourceVersion: after.sourceVersion,
        revision: after.revision,
        definitionKey: value.metadata.origin.context.definitionKey,
        scopeKey: value.metadata.origin.context.scopeKey,
        queryIdentity: state.queryIdentity,
        pageIndex: state.query.pagination.pageIndex,
        pageSize: state.query.pagination.pageSize,
        ...(complete ? { extent: "complete" } : {}),
      }),
      pageIds: Object.freeze(facts.rows.map((row) => row.id)),
      baseRevision: after.baseRevision,
    });
  };
  let failObservation = () => {};
  const coordinator = createRowMoveCoordinator({
    instanceId,
    readCurrent(ids) {
      try {
        return readFrame(ids);
      } catch (error) {
        if (errorCode(error) !== "reorder.eligibility") failObservation();
        throw error;
      }
    },
  });
  let snapshot: ReorderAdmissionSnapshot = Object.freeze({
    version: Object.freeze({}),
    phase: "unmounted",
    interaction: false,
    moves: coordinator.getSnapshot(),
  });
  const update = (force = false) => {
    const phase: ReorderAdmissionSnapshot["phase"] = disposed
      ? "disposed"
      : !lease
        ? "unmounted"
        : model
          ? "ready"
          : "unready";
    const moves = coordinator.getSnapshot();
    const active = interaction !== null;
    if (
      !force &&
      snapshot.phase === phase &&
      snapshot.moves === moves &&
      snapshot.interaction === active
    )
      return;
    snapshot = Object.freeze({
      version: Object.freeze({}),
      phase,
      interaction: active,
      moves,
    });
    dirty = true;
  };
  const emit = () => {
    if (!dirty || purging || commandDepth || notifying) return;
    dirty = false;
    notifying = true;
    try {
      for (const listener of [...listeners]) {
        if (!listeners.has(listener)) continue;
        try {
          observePromise(listener());
        } catch (error) {
          observePromise(error);
        }
      }
    } finally {
      notifying = false;
    }
  };
  const schedule = () => {
    if (queued || purging) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      const old = retiredRegistration;
      if (old) {
        const release = old.release;
        try {
          release?.();
          old.release = null;
          if (retiredRegistration === old) retiredRegistration = null;
        } catch (error) {
          observePromise(error);
          // Keep the real release obligation; no claimed cleanup acknowledgement.
        }
      }
      emit();
    });
  };
  const purge = () => {
    purging++;
    try {
      retireUI();
      if (metadata)
        retiredThrough = Math.max(retiredThrough, metadata.ownerEpoch);
      model = null;
      metadata = null;
      identity = null;
      interaction = null;
      advanceFence();
      coordinator.invalidate("context");
      update();
    } finally {
      purging--;
    }
  };
  failObservation = purge;
  coordinator.subscribe(() => {
    const pending = coordinator.getSnapshot().pending?.operation ?? null;
    if (pending !== lastPending) {
      lastPending = pending;
      const previous = fence;
      advanceFence();
      if (
        ownBegin &&
        pending &&
        ownBegin.operation === null &&
        ownBegin.fence === previous
      ) {
        ownBegin.operation = pending;
        ownBegin.credited = fence;
      }
    }
    touchUI();
    update();
    if (!working && !purging && !commandDepth) schedule();
  });
  const cleanupRegistration = () => {
    const old = registration;
    registration = null;
    if (!old) return;
    old.stop?.();
    old.stop = null;
    if (old.cleaned) {
      old.release = null;
      return;
    }
    if (retiredRegistration && retiredRegistration !== old) return deny();
    retiredRegistration = old;
    schedule();
  };
  const retire = () => {
    purge();
    cleanupRegistration();
  };
  const run = <V>(action: () => V): V => {
    live();
    if (working || notifying || commandDepth || purging) return deny();
    working = true;
    try {
      return action();
    } catch (error) {
      observePromise(error);
      retire();
      return deny();
    } finally {
      working = false;
      schedule();
    }
  };
  function clearNavigation(): void {
    if (navigationRecord) {
      navigationRecord.join = null;
      navigationRecord.lease = null;
      navigationRecord.metadata = null;
    }
    navigationOrigin = null;
    navigationRecord = null;
  }
  function clearModelJoin(): void {
    clearNavigation();
    if (modelJoinRecord) {
      modelJoinRecord.binding = null;
      modelJoinRecord.signature = null;
      modelJoinRecord.actor = null;
    }
    modelJoin = null;
    modelJoinRecord = null;
  }
  function touchUI(): void {
    if (!uiRecord) return;
    uiRecord.metadata = Object.freeze({
      version: Object.freeze({}),
      joined: modelJoin !== null,
      pending: coordinator.getSnapshot().pending !== null,
    });
    dirty = true;
  }
  function bridgeFenceChanged(): void {
    clearNavigation();
    touchUI();
  }
  function retireUI(): void {
    clearModelJoin();
    touchUI();
    if (uiRecord) {
      uiRecord.owner = null;
      uiRecord.lease = null;
      uiRecord.ui = null;
      uiRecord.suspended = true;
    }
    uiBinding = null;
    uiRecord = null;
  }
  function bridgeEntry<V>(action: () => V): V {
    live();
    if (working || notifying || commandDepth || purging) return deny();
    working = true;
    try {
      return action();
    } catch (error) {
      observePromise(error);
      return deny();
    } finally {
      working = false;
      if (dirty) schedule();
    }
  }
  function requireBinding(handle: object): UIBindingRecord {
    const record = bindingRecord(handle);
    if (
      uiBinding !== handle ||
      uiRecord !== record ||
      record.owner !== ownerRecord.bridge ||
      record.lease !== lease ||
      !lease
    )
      return deny();
    return record;
  }
  /** Only weak identity tokens escape this transient genuine-model inspection. */
  function modelSignature(value: DataTableModel<S, T>): readonly object[] {
    const source = value.sourceTarget,
      tool = value.toolTarget,
      view = value.view,
      details = value.metadata;
    const actualDefinition = controller
      ? assertTableController(definition, controller)
      : deny();
    if (
      !source ||
      !tool ||
      !view ||
      !details ||
      !value.frame ||
      !value.authority ||
      !controller ||
      tool.owner !== source.owner ||
      source.owner.controller !== controller ||
      source.owner.definition !== actualDefinition ||
      controller.getDefinition() !== source.owner.definition ||
      source.owner.publication !== registration?.publication
    )
      return deny();
    requireCriteriaSource(source.authority, source.owner);
    requireCriteriaTool(tool.authority, source.owner);
    return Object.freeze(
      [
        value,
        definition,
        definition.native,
        definition.native.controllerDefinition,
        source.owner.definition,
        controller,
        source.owner,
        source.owner.publication,
        source.authority,
        tool.authority,
        value.authority,
        value.frame,
        view.native,
        view.state.query,
        details.origin.context,
      ].map(bridgeIdentity),
    );
  }
  function requireJoin(handle: object, input: unknown): DataTableModel<S, T> {
    const record = modelJoins.get(handle);
    if (
      !record ||
      record !== modelJoinRecord ||
      modelJoin !== handle ||
      !record.binding ||
      !record.signature ||
      input !== model
    )
      return deny();
    const binding = requireBinding(record.binding);
    if (binding.suspended) return deny();
    const expected = fence,
      mounted = lease;
    const value = checkModel(expected, mounted);
    try {
      const current = modelSignature(value);
      if (
        current.length !== record.signature.length ||
        current.some((token, index) => token !== record.signature?.[index]) ||
        record.revision !== value.view?.state.revision
      )
        return deny();
      return value;
    } finally {
      checkAt(expected, mounted);
      if (
        model !== value ||
        modelJoinRecord !== record ||
        modelJoin !== handle ||
        uiRecord !== binding ||
        binding.suspended
      )
        deny();
    }
  }
  const bridge: BridgeAccess = Object.freeze({
    claim(token: object, owner: object) {
      if (!lease || token !== lease) return deny();
      if (!owner || typeof owner !== "object") return deny();
      return bridgeEntry(() => {
        const identity = bridgeIdentity(owner);
        if (uiBinding && uiRecord) {
          if (uiRecord.lease !== token || uiRecord.ui !== identity)
            return deny();
          return uiBinding;
        }
        const handle = Object.freeze({});
        const record: UIBindingRecord = {
          owner: bridge,
          lease: token,
          ui: identity,
          suspended: false,
          metadata: Object.freeze({
            version: Object.freeze({}),
            joined: false,
            pending: coordinator.getSnapshot().pending !== null,
          }),
        };
        uiBindings.set(handle, record);
        uiBinding = handle;
        uiRecord = record;
        advanceFence();
        return handle;
      });
    },
    join(handle: object, input: unknown, actor: object) {
      requireBinding(handle);
      // Exact private current model before any alleged model/actor payload read.
      if (input !== model || !model || !actor || typeof actor !== "object")
        return deny();
      return bridgeEntry(() => {
        const binding = requireBinding(handle);
        const expected = fence,
          mounted = lease;
        const value = checkModel(expected, mounted);
        const signature = modelSignature(value);
        checkAt(expected, mounted);
        if (
          input !== model ||
          value !== model ||
          requireBinding(handle) !== binding
        )
          return deny();
        const actorIdentity = bridgeIdentity(actor);
        if (
          modelJoin &&
          modelJoinRecord &&
          !binding.suspended &&
          modelJoinRecord.actor === actorIdentity &&
          modelJoinRecord.signature?.length === signature.length &&
          signature.every(
            (token, index) => token === modelJoinRecord?.signature?.[index],
          )
        )
          return modelJoin;
        clearModelJoin();
        advanceFence();
        const joined = Object.freeze({});
        modelJoinRecord = {
          binding: handle,
          signature,
          actor: actorIdentity,
          revision: value.view?.state.revision ?? deny(),
        };
        modelJoins.set(joined, modelJoinRecord);
        modelJoin = joined;
        binding.suspended = false;
        touchUI();
        return joined;
      });
    },
    requireModel(handle: object, input: unknown) {
      bridgeEntry(() => {
        requireJoin(handle, input);
      });
    },
    suspend(handle: object) {
      const record = requireBinding(handle);
      if (record.suspended) return;
      clearModelJoin();
      record.suspended = true;
      advanceFence();
      if (!purging && !commandDepth) schedule();
    },
    release(handle: object) {
      requireBinding(handle);
      // Pure private revocation: no app/P/C/source/coordinator mutation.
      advanceFence();
      retireUI();
      if (!purging && !commandDepth) schedule();
    },
    capture(handle: object) {
      const record = modelJoins.get(handle);
      if (
        disposed ||
        working ||
        notifying ||
        commandDepth ||
        purging ||
        !record ||
        record !== modelJoinRecord ||
        modelJoin !== handle ||
        !record.binding ||
        !record.signature ||
        !metadata ||
        !model
      )
        return deny();
      const binding = requireBinding(record.binding);
      if (binding.suspended) return deny();
      if (
        navigationOrigin &&
        navigationRecord?.join === handle &&
        navigationRecord?.fence === fence
      )
        return navigationOrigin;
      clearNavigation();
      const origin = Object.freeze({});
      navigationRecord = {
        join: handle,
        lease,
        fence,
        revision: record.revision,
        metadata,
      };
      navigationOrigins.set(origin, navigationRecord);
      navigationOrigin = origin;
      return origin;
    },
    navigate(origin: object, joined: object, input: unknown) {
      const receipt = navigationOrigins.get(origin);
      if (
        !receipt ||
        receipt !== navigationRecord ||
        origin !== navigationOrigin ||
        receipt.join !== joined ||
        receipt.lease !== lease ||
        receipt.fence !== fence ||
        !receipt.metadata ||
        beginLatch ||
        coordinator.getSnapshot().pending
      )
        return deny();
      bridgeEntry(() => {
        const value = requireJoin(joined, input);
        const expected = fence,
          mounted = lease;
        const before = readMetadata(expected, mounted);
        if (
          !sameMetadata(receipt.metadata ?? deny(), before) ||
          !metadata ||
          !sameMetadata(before, metadata)
        )
          return deny();
        value.authority?.require({ type: "navigate" });
        requireJoin(joined, input);
        const after = readMetadata(expected, mounted);
        checkModel(expected, mounted);
        if (
          !sameMetadata(before, after) ||
          navigationRecord !== receipt ||
          modelJoin !== joined ||
          model !== value ||
          controller?.getSnapshot().revision !== receipt.revision ||
          beginLatch ||
          coordinator.getSnapshot().pending
        )
          return deny();
      });
    },
  });
  const validateReceipt = (receipt: Receipt) => {
    live();
    if (!receipt.valid) return deny();
    if (!receipt.guarded) return;
    if (
      receipt.fence !== fence ||
      receipt.lease !== lease ||
      receipt.revision !== controller?.getSnapshot().revision
    )
      return deny();
    if (receipt.navigation) {
      if (beginLatch || coordinator.getSnapshot().pending) return deny();
      const value = checkModel(fence);
      value.authority?.require({ type: "navigate" });
      checkModel(fence);
    }
    const current = readMetadata(
      receipt.fence,
      receipt.lease as ReorderAdmissionLease<S, T> | null,
    );
    if (!receipt.metadata || !sameMetadata(receipt.metadata, current))
      return deny();
  };
  const callback = <V>(action: () => V): V => {
    commandDepth++;
    try {
      return action();
    } finally {
      commandDepth--;
      if (dirty) schedule();
    }
  };
  const validateCurrent = () => {
    if (!currentReceipt) return deny();
    try {
      validateReceipt(currentReceipt);
    } catch {
      const current =
        currentReceipt.guarded &&
        currentReceipt.fence === fence &&
        currentReceipt.lease === lease;
      currentReceipt.valid = false;
      if (current) purge();
      return deny();
    }
  };
  const publish = (transition: StateTransition<S>) => {
    if (transition.state.revision === committedRevision) return;
    committedRevision = transition.state.revision;
    const queryOrColumns =
      transition.changedGroups.includes("query") ||
      transition.changedGroups.includes("columns");
    if (queryOrColumns) {
      advanceFence();
      if (transition.queryChanged && metadata)
        retiredThrough = Math.max(retiredThrough, metadata.ownerEpoch);
    }
    clearModelJoin();
    touchUI();
    model = null;
    interaction = null;
    update(true);
  };
  const composed = {
    validateCommand(command: TableCommand<S>): unknown {
      return callback(() => {
        currentReceipt = null;
        live();
        if (typeof command.type !== "string") return deny();
        let receipt = commandReceipts.get(command);
        if (!receipt) {
          const navigation =
            command.type === "pagination.change" ||
            command.type === "pagination.clamp";
          const guarded =
            !command.type.startsWith("selection.") &&
            !command.type.startsWith("details.");
          if (guarded) advanceFence();
          receipt = {
            fence,
            lease,
            revision: controller?.getSnapshot().revision ?? -1,
            guarded,
            navigation,
            metadata: null,
            valid: false,
          };
          commandReceipts.set(command, receipt);
          currentReceipt = receipt;
          if (
            navigation &&
            (beginLatch || coordinator.getSnapshot().pending || !model)
          )
            return deny();
          let captured: ReorderApplicationMetadata | null;
          try {
            if (navigation) {
              const value = checkModel(fence);
              value.authority?.require({ type: "navigate" });
              checkModel(fence);
            }
            captured = guarded ? readMetadata(fence) : null;
          } catch (error) {
            observePromise(error);
            purge();
            return deny();
          }
          receipt = { ...receipt, metadata: captured, valid: true };
          commandReceipts.set(command, receipt);
        }
        currentReceipt = receipt;
        validateCurrent();
        let result: unknown;
        try {
          result = invoke(callbacks.validateCommand, [command]);
        } finally {
          validateCurrent();
        }
        return result;
      });
    },
    validateState(candidate: TableState<S>): unknown {
      return callback(() => {
        if (!controller) return invoke(callbacks.validateState, [candidate]);
        validateCurrent();
        let result: unknown;
        try {
          result = invoke(callbacks.validateState, [candidate]);
        } finally {
          validateCurrent();
        }
        return result;
      });
    },
    onRequest(proposal: StateProposal<S>): unknown {
      return callback(() => {
        validateCurrent();
        if (
          !currentReceipt ||
          proposal.baseRevision !== currentReceipt.revision
        )
          return deny();
        proposalReceipts.set(proposal, currentReceipt);
        let result: unknown;
        try {
          result = invoke(callbacks.onRequest, [proposal]);
        } finally {
          validateCurrent();
        }
        return result;
      });
    },
    onQueryChange(
      query: TableState<S>["query"],
      transition: StateTransition<S>,
    ): unknown {
      return callback(() => {
        publish(transition);
        return invoke(callbacks.onQueryChange, [query, transition]);
      });
    },
    onCommit(transition: StateTransition<S>): unknown {
      return callback(() => {
        publish(transition);
        return invoke(callbacks.onCommit, [transition]);
      });
    },
  };
  const implementation = {
    getSnapshot() {
      if (!disposed && controller?.isDisposed()) {
        retire();
        disposed = true;
        coordinator.dispose();
        update();
        schedule();
      }
      return snapshot;
    },
    subscribe(listener: () => void) {
      if (typeof listener !== "function") return deny();
      if (disposed) return () => {};
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    mount() {
      return run(() => {
        if (lease) return deny();
        advanceFence();
        lease = Object.freeze({}) as ReorderAdmissionLease<S, T>;
        update();
        return lease;
      });
    },
    commitModel(
      token: ReorderAdmissionLease<S, T>,
      value: DataTableModel<S, T>,
    ) {
      if (lease !== token) return deny();
      const candidateOwner = getDataTableModelOwner(value);
      if (
        !candidateOwner ||
        candidateOwner.definition !== definition ||
        candidateOwner.controller !== controller
      )
        return deny();
      return run(() => {
        if (lease !== token) return deny();
        if (registration?.purged) cleanupRegistration();
        if (retiredRegistration) return deny();
        const expected = fence;
        const owner = getDataTableModelOwner(value);
        if (
          !owner ||
          owner.definition !== definition ||
          owner.controller !== controller
        )
          return deny();
        requireDataTableModel(value, definition);
        if (
          !value.frame ||
          !value.view ||
          !value.metadata ||
          !value.sourceTarget ||
          !value.toolTarget ||
          !value.authority ||
          !value.presentation?.displayed
        )
          return deny();
        const current = readMetadata(expected, token);
        if (current.ownerEpoch <= retiredThrough) return deny();
        const nextIdentity = {
          source: value.sourceTarget.owner,
          tool: value.toolTarget.owner,
          mode: value.metadata.mode,
          epoch: value.metadata.origin.epoch,
        };
        if (
          identity &&
          metadata &&
          current.ownerEpoch === metadata.ownerEpoch &&
          (identity.source !== nextIdentity.source ||
            identity.tool !== nextIdentity.tool ||
            identity.mode !== nextIdentity.mode ||
            identity.epoch !== nextIdentity.epoch)
        )
          return deny();
        if (
          metadata &&
          current.ownerEpoch === metadata.ownerEpoch &&
          (current.sourceVersion < metadata.sourceVersion ||
            (current.sourceVersion === metadata.sourceVersion &&
              !sameMetadata(current, metadata)))
        )
          return deny();
        if (model === value && metadata && sameMetadata(metadata, current))
          return;
        const publication = value.sourceTarget.owner.publication;
        if (registration && registration.publication !== publication)
          return deny();
        if (!registration) {
          const record: Registration<S> = {
            publication,
            release: null,
            stop: null,
            purged: false,
            cleaned: false,
          };
          registration = record;
          const criteria = publication.issue(value.metadata.origin);
          record.release = publication.registerParticipant(criteria, {
            purge() {
              if (registration === record) {
                record.purged = true;
                purge();
              }
              return undefined;
            },
            cleanup() {
              record.cleaned = true;
              return undefined;
            },
          });
          record.stop = publication.subscribe({
            notify() {
              schedule();
              return undefined;
            },
          });
        }
        checkAt(expected, token);
        requireDataTableModel(value, definition);
        advanceFence();
        clearModelJoin();
        touchUI();
        model = value;
        metadata = current;
        identity = nextIdentity;
        checkModel(fence, token);
        coordinator.reconcile();
        if (!model || !metadata || metadata.ownerEpoch <= retiredThrough)
          return deny();
        update(true);
      });
    },
    disconnect(token: ReorderAdmissionLease<S, T>) {
      if (lease !== token) return;
      // Revocation is available inside a listener/guard; no stale lease touches B.
      lease = null;
      retire();
      schedule();
    },
    capture(token: ReorderAdmissionLease<S, T>) {
      if (lease !== token) return deny();
      return run(() => {
        if (lease !== token) return deny();
        const frame = readFrame([]);
        const handle = Object.freeze({}) as ReorderInteraction<S, T>;
        interactionProof.set(handle, token);
        interaction = { token: handle, lease: token, fence, frame };
        update(true);
        return handle;
      });
    },
    begin(
      handle: ReorderInteraction<S, T>,
      placement: Parameters<typeof coordinator.begin>[1],
    ): RowMoveBeginResult {
      if (
        !interaction ||
        interaction.token !== handle ||
        interactionProof.get(handle) !== lease ||
        interaction.lease !== lease ||
        interaction.fence !== fence
      )
        return deny();
      return run(() => {
        const slot = interaction;
        if (
          !slot ||
          slot.token !== handle ||
          interactionProof.get(handle) !== lease ||
          slot.lease !== lease ||
          slot.fence !== fence
        )
          return deny();
        const mounted = lease;
        advanceFence();
        const attempt = {
          fence,
          operation: null as RowMoveOperation | null,
          credited: null as number | null,
        };
        ownBegin = attempt;
        beginLatch = true;
        let result: RowMoveBeginResult;
        try {
          result = coordinator.begin(slot.frame, placement);
        } finally {
          beginLatch = false;
          ownBegin = null;
        }
        emit();
        const expected = attempt.credited ?? attempt.fence;
        checkAt(expected, mounted);
        if (
          result.status === "started" &&
          (attempt.operation !== result.operation ||
            coordinator.getSnapshot().pending?.operation !== result.operation)
        )
          return deny();
        return result;
      });
    },
    settle(
      operation: RowMoveOperation,
      outcome: Parameters<typeof coordinator.settle>[1],
    ) {
      return run(() => {
        const result = coordinator.settle(operation, outcome);
        if (!model) purge();
        return result;
      });
    },
    acknowledge(
      operation: RowMoveOperation,
      acknowledgement: Parameters<typeof coordinator.acknowledge>[1],
    ) {
      return run(() => {
        const result = coordinator.acknowledge(operation, acknowledgement);
        if (!model) purge();
        return result;
      });
    },
    reconcile() {
      return run(() => {
        const result = coordinator.reconcile();
        if (!model) purge();
        return result;
      });
    },
    advance(reason: Parameters<ReorderAdmission<S, T>["advance"]>[0]) {
      if (!["context", "access", "source", "configuration"].includes(reason))
        return deny();
      if (disposed) return;
      retire();
      schedule();
    },
    requireProposal(proposal: StateProposal<S>) {
      const candidate = proposalReceipts.get(proposal);
      if (
        !candidate ||
        proposal.baseRevision !== controller?.getSnapshot().revision
      )
        return deny();
      if (
        candidate.guarded &&
        (!candidate.valid ||
          candidate.fence !== fence ||
          candidate.lease !== lease)
      ) {
        candidate.valid = false;
        return deny();
      }
      return run(() => {
        const receipt = proposalReceipts.get(proposal);
        if (
          !receipt ||
          proposal.baseRevision !== controller?.getSnapshot().revision
        )
          return deny();
        validateReceipt(receipt);
      });
    },
    dispose() {
      if (disposed) return;
      retire();
      disposed = true;
      coordinator.dispose();
      update();
      schedule();
      listeners.clear();
    },
  };
  const methods = Object.fromEntries(
    Object.entries(implementation).map(([name, fn]) => [
      name,
      function (this: unknown, ...args: unknown[]) {
        if (this !== admission || !handles.has(admission)) return deny();
        return Reflect.apply(fn, undefined, args);
      },
    ]),
  );
  const admission = Object.freeze(methods) as unknown as ReorderAdmission<S, T>;
  ownerRecord.bridge = bridge;
  handles.set(admission, ownerRecord);
  return {
    admission,
    composed,
    bind(actual: TableController<S>) {
      if (controller || controllers.has(actual)) return deny();
      assertTableController(definition, actual);
      controller = actual;
      committedRevision = actual.getSnapshot().revision;
      ownerRecord.owner = Object.freeze({ definition, controller: actual });
      controllers.set(actual, admission);
    },
  };
}
