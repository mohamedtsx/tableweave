"use client";

import {
  getControlsAuthorityOwner,
  getDataTableModelOwner,
  requireDataTableModel,
  type ControlsAuthority,
  type DataTableModel,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import { moveVisibleColumn } from "@tableweave/react/reordering";
import {
  captureReorderNavigation,
  claimReorderUI,
  getReorderAdmissionOwner,
  joinReorderModel,
  observeReorderUI,
  releaseReorderUI,
  requireReorderAdmission,
  requireReorderModel,
  requireReorderNavigation,
  suspendReorderUI,
  type ReorderAdmission,
  type ReorderAdmissionLease,
  type ReorderModelJoin,
  type ReorderNavigationOrigin,
  type ReorderUIBinding,
} from "@tableweave/react/reordering-controller";
import type { CommitMetadata } from "../filters/criteria-commit-core.js";
import type { CollectionColumn } from "./collection-projection.js";
import type { CollectionRow } from "./controlled-collection.js";
import {
  issueNativeLeaf,
  issueNativeLeafHandle,
  issueNativeRow,
  issueNativeScope,
  nativeHandleRef,
  nativeLeafRef,
  nativeRefStatus,
  nativeRowRef,
  nativeScopeRef,
  sealNativeRefs,
  type NativeHandleTicket,
  type NativeLeafTicket,
  type NativeRowTicket,
} from "./native-resource-lifetime.js";
import {
  requireTableRendererMember,
  requireTableRendererTarget,
  TableRendererCommitError,
  tableRendererBoundary,
} from "./renderer-commit.js";
import type {
  CapturedTableReordering,
  CollectionReorderingBinding,
  ReorderingSnapshot,
  TableReorderingBinding,
  TableReorderingNavigation,
} from "./reordering-types.js";
import type { TableRendererTarget } from "./types.js";
import { englishReorderingMessages } from "./reordering-messages.js";
import type { PaginationProps } from "../pagination/types.js";

const identities = new WeakMap<object, object>();
function identity(value: object): object {
  let token = identities.get(value);
  if (!token) {
    token = Object.freeze({});
    identities.set(value, token);
  }
  return token;
}
const configs = new WeakMap<object, unknown>();
const owners = new WeakMap<object, object>();
const bindings = new WeakMap<object, unknown>();
const collections = new WeakMap<object, unknown>();
const presentations = new WeakMap<object, unknown>();
const navigation = new WeakMap<object, unknown>();
const activeCells = new WeakMap<object, object>();
const rowChoices = new WeakMap<
  object,
  { frame: object; native: object; column: object }
>();
interface Config<S extends QuerySchema, T extends object> {
  readonly columns: boolean;
  rows: {
    admission: ReorderAdmission<S, T>;
    lease: ReorderAdmissionLease<S, T>;
    handleColumnId: string;
    notification: unknown;
    ui: ReorderUIBinding<S, T>;
  } | null;
  binding: TableReorderingBinding<S, T> | null;
  ended: boolean;
}
interface Binding<S extends QuerySchema, T extends object> {
  readonly target: TableRendererTarget<S, T>;
  readonly config: Config<S, T>;
  model: object;
  join: ReorderModelJoin<S, T> | null;
  snapshot: ReorderingSnapshot;
  readonly listeners: Set<() => void>;
  collection: CollectionReorderingBinding | null;
}
interface Collection<S extends QuerySchema, T extends object> {
  presentation: CollectionPresentation | null;
  readonly messages: typeof englishReorderingMessages;
  readonly binding: TableReorderingBinding<S, T>;
  readonly columns: object;
  readonly rows: object;
  readonly scope: ReturnType<typeof nativeScopeRef<S, T>>;
  readonly rowRefs: ReadonlyMap<string, ReturnType<typeof nativeRowRef<S, T>>>;
  readonly leaves: ReadonlyMap<
    string,
    {
      leaf: NativeLeafTicket<S, T>;
      handle: NativeHandleTicket<S, T>;
      ref: ReturnType<typeof nativeLeafRef<S, T>>;
      handleRef: ReturnType<typeof nativeHandleRef<S, T>>;
    }
  >;
}
/** Only frozen nonsensitive metadata/issued refs escape the private ticket maps. */
interface CollectionPresentation {
  readonly binding: TableReorderingBinding<QuerySchema, object>;
  readonly messages: typeof englishReorderingMessages;
  readonly scope: ReturnType<typeof nativeScopeRef<QuerySchema, object>>;
}
interface Navigation<S extends QuerySchema, T extends object> {
  readonly pendingReason: string;
  readonly binding: TableReorderingBinding<S, T>;
  readonly join: ReorderModelJoin<S, T>;
  readonly origin: ReorderNavigationOrigin<S, T>;
  readonly model: object;
  readonly authority: object;
}
function deny(): never {
  throw new TableRendererCommitError();
}
function known<V>(map: WeakMap<object, unknown>, value: unknown): V {
  if (!value || typeof value !== "object") return deny();
  return (map.get(value) as V | undefined) ?? deny();
}
function changed<S extends QuerySchema, T extends object>(
  record: Binding<S, T>,
  values: Partial<Omit<ReorderingSnapshot, "version">>,
) {
  if (
    Object.entries(values).every(
      ([key, value]) =>
        record.snapshot[key as keyof ReorderingSnapshot] === value,
    )
  )
    return;
  record.snapshot = Object.freeze({
    ...record.snapshot,
    ...values,
    version: Object.freeze({}),
  });
  for (const listener of [...record.listeners]) {
    if (!record.listeners.has(listener)) continue;
    try {
      listener();
    } catch {
      /* Metadata observers are never policy/cleanup authority. */
    }
  }
}
/** Capture-time only. Original private notification is wrapped and never exposed/called. */
export function captureTableReordering<S extends QuerySchema, T extends object>(
  raw: unknown,
  model: DataTableModel<S, T>,
  owner: object,
  capture: CommitMetadata,
  wrapNotification: (value: unknown, receiver: object) => unknown,
  selectionId?: unknown,
): CapturedTableReordering<S, T> {
  const object = (value: unknown): object => {
    if (!value || typeof value !== "object") return deny();
    const proto = capture.reflect(() => Object.getPrototypeOf(value));
    if (proto !== null && proto !== Object.prototype) return deny();
    return value;
  };
  const input = object(raw),
    actual = getDataTableModelOwner(model) ?? deny();
  const fields = (value: object, allowed: readonly string[]) => {
    for (const key of capture.reflect(() => Reflect.ownKeys(value))) {
      if (typeof key !== "string" || !allowed.includes(key)) deny();
      capture.data(value, key);
    }
  };
  fields(input, ["rows", "columns"]);
  requireDataTableModel(model, actual.definition);
  const columns = capture.data(input, "columns", true);
  if (
    columns !== undefined &&
    (columns !== true || !actual.definition.reordering.columns)
  )
    deny();
  const rowsInput = capture.data(input, "rows", true);
  if (
    (capture.has(input, "columns") && columns === undefined) ||
    (capture.has(input, "rows") && rowsInput === undefined)
  )
    deny();
  let rows: Config<S, T>["rows"] = null;
  if (rowsInput !== undefined) {
    if (!actual.definition.reordering.rows) deny();
    const value = object(rowsInput);
    fields(value, ["admission", "lease", "handleColumnId", "onSubmit"]);
    const admission = capture.data(value, "admission") as ReorderAdmission<
      S,
      T
    >;
    // Exact registry lookup precedes any allegedly supplied admission method.
    const admissionOwner = getReorderAdmissionOwner(admission);
    if (
      admissionOwner?.definition !== actual.definition ||
      admissionOwner.controller !== actual.controller
    )
      deny();
    requireReorderAdmission(admission, actual.definition, actual.controller);
    const lease = capture.data(value, "lease") as ReorderAdmissionLease<S, T>;
    const handleColumnId = capture.data(value, "handleColumnId");
    if (typeof handleColumnId !== "string" || !handleColumnId.trim()) deny();
    if (
      handleColumnId === selectionId ||
      !actual.definition.native.controllerDefinition.columns.some(
        (item) => item.id === handleColumnId,
      )
    )
      deny();
    const view = model.view;
    if (view) {
      const column = view.visibleColumns.find(
        (item) => item.id === handleColumnId,
      );
      if (!column || column.columns.length) deny();
      const frameToken = identity(model.frame ?? deny()),
        nativeToken = identity(view.native),
        columnToken = identity(column);
      const previous = rowChoices.get(owner);
      if (
        previous?.frame === frameToken &&
        previous.native === nativeToken &&
        previous.column !== columnToken
      )
        deny();
      rowChoices.set(owner, {
        frame: frameToken,
        native: nativeToken,
        column: columnToken,
      });
    }
    const notification = capture.data(value, "onSubmit");
    if (typeof notification !== "function") deny();
    const ui = claimReorderUI(actual.definition, admission, lease, owner);
    try {
      // B2's actor argument is an association tag, not renderer authority. Use
      // this private capture tag only to authenticate the exact helper-committed
      // model/P/source BEFORE any private locale capture, then suspend it. This
      // proof is never returned, rendered or used for events/navigation. The
      // genuine registered renderer actor gets its separate join after commit.
      const preflight = joinReorderModel(ui, model, owner);
      requireReorderModel(preflight, model);
      suspendReorderUI(ui);
      rows = {
        admission,
        lease,
        handleColumnId,
        ui,
        notification: wrapNotification(notification, value),
      };
    } catch (error) {
      releaseReorderUI(ui);
      throw error;
    }
  }
  if (!rows && columns !== true) deny();
  const token = Object.freeze({}) as CapturedTableReordering<S, T>;
  configs.set(token, {
    columns: columns === true,
    rows,
    binding: null,
    ended: false,
  } satisfies Config<S, T>);
  owners.set(owner, token);
  return token;
}
/** Exact UI retirement only. Never disconnects admission/app C/P/source. */
export function retireTableReordering(owner: object): void {
  const token = owners.get(owner);
  owners.delete(owner);
  if (!token) return;
  const record = known<Config<QuerySchema, object>>(configs, token);
  record.ended = true;
  const rows = record.rows,
    prior = record.binding;
  record.rows = null;
  record.binding = null;
  if (rows) rows.notification = null;
  try {
    if (rows) releaseReorderUI(rows.ui);
  } finally {
    if (prior) {
      const binding = known<Binding<QuerySchema, object>>(bindings, prior);
      if (activeCells.get(binding.target.cell) === prior)
        activeCells.delete(binding.target.cell);
      binding.join = null;
      binding.collection = null;
      changed(binding, { ready: false, pending: false, rowConfigured: false });
      binding.listeners.clear();
    }
  }
}
export function publishTableReordering<S extends QuerySchema, T extends object>(
  target: TableRendererTarget<S, T>,
): TableReorderingBinding<S, T> | null {
  const current = requireTableRendererTarget(target),
    token = current.ports.reordering;
  if (!token) return null;
  const config = known<Config<S, T>>(configs, token);
  if (config.ended) deny();
  let binding = config.binding;
  let record = binding ? known<Binding<S, T>>(bindings, binding) : null;
  if (
    !record ||
    record.target.cell !== target.cell ||
    record.target.actor !== target.actor
  ) {
    binding = Object.freeze({}) as TableReorderingBinding<S, T>;
    record = {
      target: Object.freeze({ ...target }),
      config,
      model: identity(current.model),
      join: null,
      snapshot: Object.freeze({
        version: Object.freeze({}),
        refPass: Object.freeze({}),
        ready: false,
        pending: false,
        rowConfigured: config.rows !== null,
      }),
      listeners: new Set(),
      collection: null,
    };
    bindings.set(binding, record);
    config.binding = binding;
    activeCells.set(target.cell, binding);
  }
  const modelToken = identity(current.model);
  if (record.model !== modelToken) {
    record.collection = null;
    record.model = modelToken;
    changed(record, { ready: false, refPass: Object.freeze({}) });
  }
  if (config.rows) {
    try {
      record.join = joinReorderModel(
        config.rows.ui,
        current.model,
        target.actor,
      );
      requireReorderModel(record.join, current.model);
    } catch {
      // Genuine app commit may follow this UI layout. Retain its source owner;
      // the admission subscription wakes registration after actual publication.
      record.join = null;
      changed(record, { ready: false });
    }
    const metadata = observeReorderUI(config.rows.ui);
    changed(record, { pending: metadata.pending });
  }
  return binding;
}
export function getTableReorderingBinding<
  S extends QuerySchema,
  T extends object,
>(target: TableRendererTarget<S, T>): TableReorderingBinding<S, T> | null {
  const value = activeCells.get(target.cell);
  if (!value) return null;
  const record = known<Binding<S, T>>(bindings, value);
  return !record.config.ended && record.target.actor === target.actor
    ? (value as TableReorderingBinding<S, T>)
    : null;
}
export function requireTableReordering<S extends QuerySchema, T extends object>(
  binding: TableReorderingBinding<S, T>,
  target?: TableRendererTarget<S, T>,
) {
  const record = known<Binding<S, T>>(bindings, binding);
  const current = requireReorderingRenderer(binding, record, target);
  if (record.config.rows) {
    try {
      requireReorderModel(record.join ?? deny(), current.model);
    } catch {
      deny();
    }
  }
  return current;
}
function requireReorderingRenderer<S extends QuerySchema, T extends object>(
  binding: TableReorderingBinding<S, T>,
  record: Binding<S, T>,
  target?: TableRendererTarget<S, T>,
) {
  if (
    record.config.ended ||
    activeCells.get(record.target.cell) !== binding ||
    (target &&
      (target.cell !== record.target.cell ||
        target.actor !== record.target.actor))
  )
    deny();
  const current = requireTableRendererTarget(record.target);
  if (
    identity(current.model) !== record.model ||
    current.ports.reordering === undefined ||
    known<Config<S, T>>(configs, current.ports.reordering) !== record.config
  )
    deny();
  return current;
}
export function reorderingSnapshot<S extends QuerySchema, T extends object>(
  binding: TableReorderingBinding<S, T>,
): ReorderingSnapshot {
  return known<Binding<S, T>>(bindings, binding).snapshot;
}
export function reorderingRefPass<S extends QuerySchema, T extends object>(
  binding: TableReorderingBinding<S, T>,
): object {
  return known<Binding<S, T>>(bindings, binding).snapshot.refPass;
}
export function subscribeReordering<S extends QuerySchema, T extends object>(
  binding: TableReorderingBinding<S, T>,
  listener: () => void,
): () => void {
  const record = known<Binding<S, T>>(bindings, binding);
  if (record.config.ended) return () => {};
  record.listeners.add(listener);
  return () => {
    record.listeners.delete(listener);
  };
}
export function suspendTableReordering<S extends QuerySchema, T extends object>(
  binding: TableReorderingBinding<S, T>,
): void {
  const record = known<Binding<S, T>>(bindings, binding);
  if (record.config.ended) return;
  if (record.config.rows) suspendReorderUI(record.config.rows.ui);
  record.join = null;
  changed(record, { ready: false });
}
/** Registration layout only. Incomplete never schedules another render. */
export function sealTableReordering<S extends QuerySchema, T extends object>(
  binding: TableReorderingBinding<S, T>,
): void {
  const record = known<Binding<S, T>>(bindings, binding);
  requireTableReordering(binding);
  if (record.config.rows)
    changed(record, {
      pending: observeReorderUI(record.config.rows.ui).pending,
    });
  if (!record.collection) return;
  const status = sealNativeRefs(record.target);
  if (status === "refresh-refs") {
    record.collection = null;
    changed(record, { ready: false, refPass: Object.freeze({}) });
  } else changed(record, { ready: status === "ready" });
}
export function subscribeRowReordering<S extends QuerySchema, T extends object>(
  binding: TableReorderingBinding<S, T>,
  listener: () => void,
): () => void {
  const record = known<Binding<S, T>>(bindings, binding);
  return record.config.rows
    ? record.config.rows.admission.subscribe(listener)
    : () => {};
}
/** Must run before app text/cell/message callbacks. Row handles remain intentionally absent. */
export function prepareTableReordering<S extends QuerySchema, T extends object>(
  binding: TableReorderingBinding<S, T>,
): void {
  const current = requireTableReordering(binding),
    record = known<Binding<S, T>>(bindings, binding);
  const id = record.config.rows?.handleColumnId;
  const column = id
    ? current.model.view?.visibleColumns.find((item) => item.id === id)
    : undefined;
  if (id && (!column || id === current.ports.collection?.selectionColumnId))
    deny();
  // Do not issue a fresh ticket here: if projection memoization holds its old
  // props, that would consume an ended scope's refresh mark without updating
  // the cached node.props.ref. Issuance belongs to the actual projection pass.
}
export function acquireTableReorderingScope<
  S extends QuerySchema,
  T extends object,
>(binding: TableReorderingBinding<S, T>, expectedPass?: object) {
  prepareTableReordering(binding);
  const current = requireTableReordering(binding),
    record = known<Binding<S, T>>(bindings, binding);
  if (expectedPass !== undefined && expectedPass !== record.snapshot.refPass)
    deny();
  const id = record.config.rows?.handleColumnId;
  const column = id
    ? current.model.view?.visibleColumns.find((item) => item.id === id)
    : undefined;
  const scope = issueNativeScope(record.target, column);
  if (expectedPass !== undefined && expectedPass !== record.snapshot.refPass)
    deny();
  return scope;
}
export function projectTableReordering<S extends QuerySchema, T extends object>(
  binding: TableReorderingBinding<S, T>,
  columns: readonly CollectionColumn[],
  rows: readonly CollectionRow[],
  expectedPass?: object,
): CollectionReorderingBinding {
  const projected = requireTableReordering(binding);
  if (!projected.model.view) deny();
  if (!Object.isFrozen(columns) || !Object.isFrozen(rows)) deny();
  const scope = acquireTableReorderingScope(binding, expectedPass);
  const current = requireTableReordering(binding),
    record = known<Binding<S, T>>(bindings, binding),
    view = current.model.view ?? deny();
  const leaves = new Map<
    string,
    {
      leaf: NativeLeafTicket<S, T>;
      handle: NativeHandleTicket<S, T>;
      ref: ReturnType<typeof nativeLeafRef<S, T>>;
      handleRef: ReturnType<typeof nativeHandleRef<S, T>>;
    }
  >();
  const visit = (
    header: (typeof view.headerGroups)[number]["headers"][number],
  ) => {
    requireTableRendererMember(record.target, "header", header);
    if (
      !header.isPlaceholder &&
      !header.subHeaders.length &&
      !leaves.has(header.column.id) &&
      record.config.columns &&
      view.visibleColumns.includes(header.column) &&
      current.model.definition?.native.controllerDefinition.columns.some(
        (policy) => policy.id === header.column.id && !policy.utility,
      ) &&
      header.column.id !== current.ports.collection?.selectionColumnId
    ) {
      const leaf = issueNativeLeaf(record.target, header);
      const handle = issueNativeLeafHandle(record.target, leaf);
      leaves.set(header.column.id, {
        leaf,
        handle,
        ref: nativeLeafRef(leaf),
        handleRef: nativeHandleRef(handle),
      });
    }
    for (const child of header.subHeaders) visit(child);
  };
  for (const group of view.headerGroups)
    for (const header of group.headers) visit(header);
  const rowRefs = new Map<string, ReturnType<typeof nativeRowRef<S, T>>>();
  for (const row of view.rows) {
    const ticket: NativeRowTicket<S, T> = issueNativeRow(record.target, row);
    rowRefs.set(row.id, nativeRowRef(ticket));
  }
  const token = Object.freeze({}) as CollectionReorderingBinding;
  collections.set(token, {
    presentation: null,
    binding,
    messages: Object.freeze({
      ...englishReorderingMessages,
      ...current.ports.messages.reordering,
    }),
    columns: identity(columns),
    rows: identity(rows),
    scope: nativeScopeRef(scope),
    rowRefs,
    leaves,
  } satisfies Collection<S, T>);
  record.collection = token;
  return token;
}
export function requireCollectionReordering(
  input: unknown,
  columns: unknown,
  rows: unknown,
) {
  const record = known<Collection<QuerySchema, object>>(collections, input);
  if (
    known<Binding<QuerySchema, object>>(bindings, record.binding).collection !==
    input
  )
    deny();
  if (
    !columns ||
    typeof columns !== "object" ||
    !rows ||
    typeof rows !== "object" ||
    identity(columns) !== record.columns ||
    identity(rows) !== record.rows
  )
    deny();
  requireTableReordering(record.binding);
  if (!record.presentation) {
    record.presentation = Object.freeze({
      binding: record.binding,
      messages: record.messages,
      scope: record.scope,
    });
    presentations.set(record.presentation, record);
  }
  return record.presentation;
}
/** Metadata-only issuance check. Safe while source waits; never an action grant. */
export function collectionReorderingPresentation(
  value: unknown,
): CollectionPresentation {
  known<Collection<QuerySchema, object>>(presentations, value);
  return value as CollectionPresentation;
}
export function captureCollectionReordering(input: object, token: unknown) {
  known<Collection<QuerySchema, object>>(collections, token);
  const own = (key: string) => {
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor || !Object.hasOwn(descriptor, "value")) deny();
    return descriptor.value;
  };
  // A genuine foreign token cannot invoke alleged rows/columns accessors merely
  // while discovering that their projection identity does not match.
  return requireCollectionReordering(token, own("columns"), own("rows"));
}
/** Presence gate used before any consumer private props. Own undefined also denies. */
export function captureReorderingProp(
  input: object,
  key: "reordering" | "reorderInterlock",
  kind: "native" | "collection" | "navigation",
): unknown | undefined {
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  if (!descriptor) {
    if (Reflect.has(input, key)) deny();
    return undefined;
  }
  if (!Object.hasOwn(descriptor, "value")) deny();
  const value = descriptor.value;
  known(
    kind === "native"
      ? bindings
      : kind === "collection"
        ? collections
        : navigation,
    value,
  );
  return value;
}
export function leafCollectionRefs(
  presentation: ReturnType<typeof requireCollectionReordering>,
  id: string,
) {
  const record = known<Collection<QuerySchema, object>>(
    presentations,
    presentation,
  );
  const leaf = record.leaves.get(id);
  return leaf ? Object.freeze({ ref: leaf.ref, handle: leaf.handleRef }) : null;
}
export function collectionRowRef(
  presentation: ReturnType<typeof requireCollectionReordering>,
  id: string,
) {
  return known<Collection<QuerySchema, object>>(
    presentations,
    presentation,
  ).rowRefs.get(id);
}
export function requireCurrentCollection(
  presentation: ReturnType<typeof requireCollectionReordering>,
): void {
  const record = known<Collection<QuerySchema, object>>(
    presentations,
    presentation,
  );
  const binding = known<Binding<QuerySchema, object>>(bindings, record.binding);
  if (
    !binding.collection ||
    known<Collection<QuerySchema, object>>(collections, binding.collection) !==
      record
  )
    deny();
  requireTableReordering(record.binding);
}
export function columnMove<S extends QuerySchema, T extends object>(
  binding: TableReorderingBinding<S, T>,
  id: string,
  direction: -1 | 1,
  commit: boolean,
): boolean {
  const record = known<Binding<S, T>>(bindings, binding);
  if (
    typeof id !== "string" ||
    !id ||
    (direction !== -1 && direction !== 1) ||
    typeof commit !== "boolean"
  )
    return false;
  const readRenderer = () => {
    const current = requireReorderingRenderer(binding, record);
    if (
      !record.config.columns ||
      !record.snapshot.ready ||
      record.snapshot.pending
    )
      deny();
    if (record.config.rows && observeReorderUI(record.config.rows.ui).pending)
      deny();
    const lower = record.collection
      ? known<Collection<S, T>>(collections, record.collection)
      : deny();
    const leaf = lower.leaves.get(id) ?? deny();
    if (
      nativeRefStatus(leaf.leaf) !== "sealed" ||
      nativeRefStatus(leaf.handle) !== "sealed"
    )
      deny();
    const authority = current.model.authority ?? deny();
    tableRendererBoundary(record.target, () =>
      authority.require({ type: "columns" }),
    );
    if (
      requireReorderingRenderer(binding, record).model !== current.model ||
      nativeRefStatus(leaf.leaf) !== "sealed" ||
      nativeRefStatus(leaf.handle) !== "sealed"
    )
      deny();
    if (record.config.rows && observeReorderUI(record.config.rows.ui).pending)
      deny();
    return current;
  };
  const read = () => {
    requireTableReordering(binding);
    return readRenderer();
  };
  try {
    const current = read(),
      C = current.model.controller ?? deny(),
      D = current.model.definition ?? deny();
    const state = tableRendererBoundary(record.target, () => C.getSnapshot());
    const policies = D.native.controllerDefinition.columns;
    let partition = 0,
      previous: string | undefined;
    const partitions = new Map<string, number>();
    for (const policy of policies) {
      const group = policy.reorderGroup ?? "";
      if (policy.utility || previous !== group) partition++;
      partitions.set(policy.id, partition);
      if (policy.utility) {
        partition++;
        previous = undefined;
      } else previous = group;
    }
    const visible = state.columns.order.filter(
      (key) =>
        state.columns.visibility[key] !== false &&
        !policies.find((p) => p.id === key)?.utility &&
        partitions.get(key) === partitions.get(id),
    );
    const index = visible.indexOf(id),
      destination = index + direction;
    if (index < 0 || destination < 0 || destination >= visible.length)
      return false;
    const rest = visible.filter((key) => key !== id);
    const order = tableRendererBoundary(record.target, () =>
      moveVisibleColumn(policies, state.columns, {
        movedId: id,
        beforeId: rest[destination] ?? null,
        afterId: rest[destination - 1] ?? null,
      }),
    );
    read();
    if (C.getSnapshot() !== state) deny();
    if (!commit) return true;
    const result = C.dispatch({
      type: "columns.order",
      update(previousOrder) {
        // During actual factory C's command callback, its original receipt owns
        // headless admission. Reentering bridgeEntry here is expressly forbidden.
        // Recheck real renderer/N/columns authority, plus pure pending metadata.
        readRenderer();
        if (C.getSnapshot() !== state || previousOrder !== state.columns.order)
          deny();
        return order;
      },
    });
    return result.status === "proposed" || result.status === "committed";
  } catch {
    return false;
  }
}
export function captureTableNavigation<S extends QuerySchema, T extends object>(
  binding: TableReorderingBinding<S, T>,
): TableReorderingNavigation<S, T> | null {
  const record = known<Binding<S, T>>(bindings, binding);
  if (!record.config.rows) return null;
  const current = requireTableReordering(binding),
    join = record.join ?? deny();
  const token = Object.freeze({}) as TableReorderingNavigation<S, T>;
  navigation.set(token, {
    binding,
    join,
    origin: captureReorderNavigation(join),
    model: identity(current.model),
    authority: identity(current.model.authority ?? deny()),
    pendingReason:
      current.ports.messages.reordering?.pending ??
      englishReorderingMessages.pending,
  } satisfies Navigation<S, T>);
  return token;
}
export function requireTableNavigation<S extends QuerySchema, T extends object>(
  token: TableReorderingNavigation<S, T>,
  authority: ControlsAuthority<S, T>,
) {
  const nav = known<Navigation<S, T>>(navigation, token),
    current = requireTableReordering(nav.binding);
  if (
    identity(authority) !== nav.authority ||
    current.model.authority !== authority ||
    identity(current.model) !== nav.model ||
    getControlsAuthorityOwner(authority)?.controller !==
      current.model.controller
  )
    deny();
  requireReorderNavigation(nav.origin, nav.join, current.model);
  return current;
}
export function observeTableNavigation<S extends QuerySchema, T extends object>(
  token: TableReorderingNavigation<S, T>,
  authority: ControlsAuthority<S, T>,
) {
  const nav = known<Navigation<S, T>>(navigation, token),
    record = known<Binding<S, T>>(bindings, nav.binding);
  if (identity(authority) !== nav.authority) deny();
  const current = requireTableReordering(nav.binding);
  if (
    current.model.authority !== authority ||
    identity(current.model) !== nav.model
  )
    deny();
  return observeReorderUI(record.config.rows?.ui ?? deny());
}
/** Pure stable external-store snapshot; never a source/action grant. */
export function tableNavigationMetadata<
  S extends QuerySchema,
  T extends object,
>(token: TableReorderingNavigation<S, T>) {
  const nav = known<Navigation<S, T>>(navigation, token),
    record = known<Binding<S, T>>(bindings, nav.binding);
  return observeReorderUI(record.config.rows?.ui ?? deny());
}
export function tableNavigationPendingReason<
  S extends QuerySchema,
  T extends object,
>(token: TableReorderingNavigation<S, T>): string {
  return known<Navigation<S, T>>(navigation, token).pendingReason;
}
/** Adopted pager route, like adopted NativeCollection: only registered ports. */
export function tableNavigationPaginationInput<
  S extends QuerySchema,
  T extends object,
>(token: TableReorderingNavigation<S, T>, schema: S): PaginationProps<S, T> {
  const nav = known<Navigation<S, T>>(navigation, token),
    current = requireTableReordering(nav.binding),
    { model, ports } = current;
  const definition = model.definition ?? deny();
  if (schema !== definition.native.controllerDefinition.schema) deny();
  return {
    schema,
    presentation: model.presentation ?? deny(),
    authority: model.authority ?? deny(),
    ...(ports.locale ? { locale: ports.locale.locale } : {}),
    ...(ports.messages.pagination
      ? { messages: ports.messages.pagination }
      : {}),
    ...(ports.formatNumber ? { formatNumber: ports.formatNumber } : {}),
    ...(ports.onRetry
      ? {
          onRetry: () => {
            try {
              void ports.onRetry?.()?.catch(() => {});
            } catch {
              /* Application retains transport. */
            }
          },
        }
      : {}),
  };
}
export function subscribeTableNavigation<
  S extends QuerySchema,
  T extends object,
>(token: TableReorderingNavigation<S, T>, listener: () => void) {
  const nav = known<Navigation<S, T>>(navigation, token);
  return subscribeRowReordering(nav.binding, listener);
}
/** Render-only fresh receipt; saved event closures retain their own returned token. */
export function renderTableNavigation<S extends QuerySchema, T extends object>(
  token: TableReorderingNavigation<S, T>,
  authority: ControlsAuthority<S, T>,
): TableReorderingNavigation<S, T> {
  observeTableNavigation(token, authority);
  return (
    captureTableNavigation(
      known<Navigation<S, T>>(navigation, token).binding,
    ) ?? deny()
  );
}
export function navigateTable<S extends QuerySchema, T extends object>(
  token: TableReorderingNavigation<S, T>,
  authority: ControlsAuthority<S, T>,
  intent: "size" | "index" | "previous" | "next",
  value?: unknown,
): void {
  let current = requireTableNavigation(token, authority);
  const nav = known<Navigation<S, T>>(navigation, token),
    binding = known<Binding<S, T>>(bindings, nav.binding);
  const facts = tableRendererBoundary(binding.target, () =>
    authority.require({ type: "navigate" }),
  );
  current = requireTableNavigation(token, authority);
  const C = current.model.controller ?? deny(),
    D = current.model.definition ?? deny(),
    state = C.getSnapshot();
  let { pageIndex, pageSize } = state.query.pagination;
  if (intent === "size") {
    pageSize = Number(value);
    pageIndex = 0;
    if (
      !D.native.controllerDefinition.schema.pagination.sizes.includes(pageSize)
    )
      deny();
  } else if (intent === "index") pageIndex = Number(value);
  else if (intent === "previous") {
    if (!facts.canPreviousPage) deny();
    pageIndex--;
  } else {
    if (!facts.canNextPage) deny();
    pageIndex++;
  }
  if (
    !Number.isSafeInteger(pageIndex) ||
    pageIndex < 0 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize <= 0 ||
    !facts.displayed
  )
    deny();
  if (intent !== "size") {
    const count = facts.displayed.pageCount;
    if (
      count === null
        ? pageIndex !== state.query.pagination.pageIndex &&
          !(
            pageIndex === state.query.pagination.pageIndex - 1 &&
            facts.canPreviousPage
          ) &&
          !(
            pageIndex === state.query.pagination.pageIndex + 1 &&
            facts.canNextPage
          )
        : pageIndex > Math.max(0, count - 1)
    )
      deny();
  }
  tableRendererBoundary(binding.target, () =>
    authority.require({ type: "navigate" }),
  );
  if (C.getSnapshot() !== state) deny();
  // No callbackful authority method after this retained-origin final gate.
  requireTableNavigation(token, authority);
  C.dispatch({ type: "pagination.change", update: { pageIndex, pageSize } });
}
