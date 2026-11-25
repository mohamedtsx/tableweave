import type {
  NativeCell,
  NativeColumn,
  NativeHeader,
  NativeRow,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import type { RefCallback } from "react";
import { claimRendererNativeInstall } from "../filters/criteria-commit-core.js";
import {
  captureNativeResourceTarget,
  inspectRendererNativeLifetime,
  type NativeLifetimeReady,
  TableRendererCommitError,
} from "./renderer-commit.js";
import type { TableRendererTarget } from "./types.js";

declare const stampBrand: unique symbol;
export interface NativeCoreStamp {
  readonly [stampBrand]: never;
}
export interface NativeCoreLink {
  capture(): NativeCoreStamp;
  require(
    stamp: NativeCoreStamp,
    mode: "idle" | "transition",
  ): Readonly<{ mount: object; actor: object }>;
}
export interface NativeLifetimeHooks {
  revoke(): undefined;
  reconcile(): "kept" | "retired" | "blocked";
}
declare const ticketBrand: unique symbol;
export interface NativeRefTicket<
  S extends QuerySchema,
  T extends object,
  K extends Kind,
> {
  readonly [ticketBrand]: (schema: S, row: T, kind: K) => readonly [S, T, K];
}
export type NativeScopeTicket<
  S extends QuerySchema,
  T extends object,
> = NativeRefTicket<S, T, "scope">;
export type NativeRowTicket<
  S extends QuerySchema,
  T extends object,
> = NativeRefTicket<S, T, "row">;
export type NativeLeafTicket<
  S extends QuerySchema,
  T extends object,
> = NativeRefTicket<S, T, "leaf">;
export type NativeHandleTicket<
  S extends QuerySchema,
  T extends object,
> = NativeRefTicket<S, T, "handle">;
type Kind = "scope" | "row" | "leaf" | "handle";
type Phase = "issued" | "candidate" | "sealed";
interface Realm {
  readonly document: Document;
  readonly parent: (this: Node) => ParentNode | null;
  readonly owner: (this: Node) => Document | null;
  readonly nodeType: (this: Node) => number;
  readonly name: (this: Element) => string;
  readonly attribute: typeof Element.prototype.getAttribute;
  readonly prototypes: Readonly<Record<Kind, object>>;
}
interface State {
  readonly cell: object;
  readonly link: NativeCoreLink;
  generation: Generation | null;
}
interface Generation {
  state: State | null;
  mount: object | null;
  domain: NativeLifetimeReady["domain"] | null;
  frame: object | null;
  native: object | null;
  realm: Realm | null;
  column: { readonly id: string; readonly token: object } | null;
  sealed: boolean;
  readonly slots: Set<Slot>;
}
interface Slot {
  generation: Generation | null;
  kind: Kind;
  id: string | null;
  member: object | null;
  parent: Slot | null;
  columnId: string | null;
  cell: object | null;
  ticket: object | null;
  attachment: object | null;
  needsFreshTicket: boolean;
  refreshConsumed: boolean;
}
interface Ticket {
  slot: Slot | null;
  callback: RefCallback<HTMLElement> | null;
}
interface Attachment {
  slot: Slot | null;
  node: HTMLElement | null;
  phase: Phase;
}
const states = new WeakMap<object, State>();
const tickets = new WeakMap<object, Ticket>();
const attachments = new WeakMap<object, Attachment>();
const nativeNodes = new WeakMap<object, object>();
function deny(): never {
  throw new TableRendererCommitError();
}
function object(value: unknown): value is object {
  return value !== null && typeof value === "object";
}
function ticketRecord(value: unknown): Ticket {
  return (object(value) ? tickets.get(value) : undefined) ?? deny();
}
function endSlot(slot: Slot, refresh: boolean): void {
  if (slot.attachment) {
    const record = attachments.get(slot.attachment);
    if (record) {
      if (record.node && nativeNodes.get(record.node) === slot.attachment)
        nativeNodes.delete(record.node);
      record.node = null;
      record.slot = null;
    }
  }
  if (slot.ticket) {
    const record = tickets.get(slot.ticket);
    if (record) {
      record.slot = null;
      record.callback = null;
    }
  }
  slot.attachment = null;
  slot.ticket = null;
  slot.needsFreshTicket = refresh;
  slot.refreshConsumed = false;
  if (slot.generation) slot.generation.sealed = false;
}
function retire(state: State): undefined {
  const generation = state.generation;
  state.generation = null;
  if (!generation) return undefined;
  for (const slot of generation.slots) {
    endSlot(slot, false);
    slot.generation = null;
    slot.id = null;
    slot.member = null;
    slot.parent = null;
    slot.columnId = null;
    slot.cell = null;
  }
  generation.slots.clear();
  generation.state = null;
  generation.mount = null;
  generation.domain = null;
  generation.frame = null;
  generation.native = null;
  generation.realm = null;
  generation.column = null;
  generation.sealed = false;
  return undefined;
}
function sameGeneration(
  generation: Generation,
  proof: NativeLifetimeReady,
  mount: object,
): boolean {
  return (
    generation.mount === mount &&
    generation.frame === proof.frame &&
    generation.native === proof.native &&
    generation.domain?.length === proof.domain.length &&
    generation.domain.every((item, index) =>
      Object.is(item, proof.domain[index]),
    )
  );
}
function inspect(
  state: State,
  mode: "idle" | "transition",
  alleged?: Parameters<typeof inspectRendererNativeLifetime>[2],
) {
  const stamp = state.link.capture();
  const before = state.link.require(stamp, mode);
  const proof = inspectRendererNativeLifetime(
    state.cell,
    before.actor,
    alleged,
  );
  state.link.require(stamp, mode);
  return { stamp, mount: before.mount, actor: before.actor, proof };
}
function memberPresent(slot: Slot, proof: NativeLifetimeReady): boolean {
  if (slot.kind === "scope") return true;
  if (slot.kind === "handle")
    return (
      !!slot.parent &&
      memberPresent(slot.parent, proof) &&
      (slot.parent.kind === "leaf" ||
        proof.cells.some(
          (cell) =>
            cell.token === slot.cell &&
            cell.row === slot.member &&
            cell.column === slot.generation?.column?.token &&
            cell.columnId === slot.columnId,
        ))
    );
  return (slot.kind === "row" ? proof.rows : proof.leaves).some(
    (item) =>
      item.token === slot.member &&
      item.id === slot.id &&
      (slot.kind !== "leaf" || item.column === slot.cell),
  );
}
function reconcile(state: State): "kept" | "retired" | "blocked" {
  const generation = state.generation;
  if (!generation) return "kept"; // Omitted/raw cells gain no new model capture.
  const current = inspect(state, "transition");
  if (current.proof.kind === "blocked") {
    retire(state);
    return "blocked";
  }
  if (!sameGeneration(generation, current.proof, current.mount)) {
    retire(state);
    return "retired";
  }
  let retired = false;
  for (const slot of [...generation.slots]) {
    if (memberPresent(slot, current.proof)) continue;
    removeSlot(slot);
    retired = true;
  }
  state.link.require(current.stamp, "transition");
  return retired ? "retired" : "kept";
}
/** No model/ports/P/DOM read. Exact one-shot core provenance precedes cell use. */
export function installRendererNativeLifetime(
  cell: object,
  seed: unknown,
): NativeLifetimeHooks {
  const link = claimRendererNativeInstall(cell, seed);
  if (!link || states.has(cell)) deny();
  const state: State = { cell, link, generation: null };
  states.set(cell, state);
  return Object.freeze({
    revoke: () => retire(state),
    reconcile: () => reconcile(state),
  });
}
function acquisition<S extends QuerySchema, T extends object>(
  target: TableRendererTarget<S, T>,
  alleged?: Parameters<typeof inspectRendererNativeLifetime>[2],
) {
  const genuine = captureNativeResourceTarget<S, T>(target);
  const state = states.get(genuine.cell) ?? deny();
  try {
    const current = inspect(state, "idle", alleged);
    if (current.actor !== genuine.actor || current.proof.kind !== "ready")
      deny();
    if (
      state.generation &&
      !sameGeneration(state.generation, current.proof, current.mount)
    )
      retire(state);
    const generation = state.generation ?? {
      state,
      mount: current.mount,
      domain: current.proof.domain,
      frame: current.proof.frame,
      native: current.proof.native,
      realm: null,
      column: null,
      sealed: false,
      slots: new Set<Slot>(),
    };
    state.generation = generation;
    return { state, generation, ...current, proof: current.proof };
  } catch {
    retire(state);
    return deny();
  }
}
function issue<S extends QuerySchema, T extends object, K extends Kind>(
  generation: Generation,
  kind: K,
  id: string,
  member: object | null,
  parent: Slot | null = null,
  cell: object | null = null,
  columnId: string | null = null,
): NativeRefTicket<S, T, K> {
  let slot = [...generation.slots].find(
    (item) =>
      item.kind === kind &&
      item.id === id &&
      item.member === member &&
      item.parent === parent,
  );
  if (!slot) {
    slot = {
      generation,
      kind,
      id,
      member,
      parent,
      cell,
      columnId,
      ticket: null,
      attachment: null,
      needsFreshTicket: false,
      refreshConsumed: false,
    };
    generation.slots.add(slot);
  }
  if (slot.cell !== cell || slot.columnId !== columnId) deny();
  if (!slot.ticket) {
    generation.sealed = false;
    slot.ticket = Object.freeze({});
    slot.needsFreshTicket = false;
    slot.refreshConsumed = false;
    tickets.set(slot.ticket, { slot, callback: null });
  }
  return slot.ticket as NativeRefTicket<S, T, K>;
}
export function issueNativeScope<S extends QuerySchema, T extends object>(
  target: TableRendererTarget<S, T>,
  rowHandleColumn?: NativeColumn<NoInfer<T>>,
): NativeScopeTicket<S, T> {
  const current = acquisition(
    target,
    rowHandleColumn !== undefined
      ? { kind: "column", value: rowHandleColumn }
      : undefined,
  );
  const selected = current.proof.selected;
  if (rowHandleColumn !== undefined) {
    if (selected?.kind !== "column") deny();
    const prior = current.generation.column;
    if (prior && (prior.token !== selected.token || prior.id !== selected.id))
      deny();
    current.generation.column = Object.freeze({
      id: selected.id,
      token: selected.token,
    });
  }
  return issue(current.generation, "scope", "scope", null);
}
export function issueNativeRow<S extends QuerySchema, T extends object>(
  target: TableRendererTarget<S, T>,
  row: NativeRow<NoInfer<T>>,
): NativeRowTicket<S, T> {
  const current = acquisition(target, { kind: "row", value: row });
  const selected = current.proof.selected ?? deny();
  return issue(current.generation, "row", selected.id, selected.token);
}
export function issueNativeLeaf<S extends QuerySchema, T extends object>(
  target: TableRendererTarget<S, T>,
  header: NativeHeader<NoInfer<T>>,
): NativeLeafTicket<S, T> {
  const current = acquisition(target, { kind: "leaf", value: header });
  const selected = current.proof.selected ?? deny();
  return issue(
    current.generation,
    "leaf",
    selected.id,
    selected.token,
    null,
    selected.column ?? deny(),
  );
}
function parentSlot<S extends QuerySchema, T extends object>(
  parent: NativeRowTicket<S, T> | NativeLeafTicket<S, T>,
  generation: Generation,
  kind: "row" | "leaf",
): Slot {
  const slot = ticketRecord(parent).slot ?? deny();
  if (slot.generation !== generation || slot.kind !== kind) deny();
  return slot;
}
export function issueNativeRowHandle<S extends QuerySchema, T extends object>(
  target: TableRendererTarget<S, T>,
  parent: NativeRowTicket<NoInfer<S>, NoInfer<T>>,
  cell: NativeCell<NoInfer<T>>,
): NativeHandleTicket<S, T> {
  const current = acquisition(target, { kind: "cell", value: cell });
  const slot = parentSlot(parent, current.generation, "row");
  const selected = current.proof.selected ?? deny();
  const column = current.generation.column ?? deny();
  if (
    selected.row !== slot.member ||
    selected.column !== column.token ||
    selected.columnId !== column.id
  )
    deny();
  return issue(
    current.generation,
    "handle",
    slot.id ?? deny(),
    slot.member,
    slot,
    selected.token,
    column.id,
  );
}
export function issueNativeLeafHandle<S extends QuerySchema, T extends object>(
  target: TableRendererTarget<S, T>,
  parent: NativeLeafTicket<NoInfer<S>, NoInfer<T>>,
): NativeHandleTicket<S, T> {
  const current = acquisition(target);
  const slot = parentSlot(parent, current.generation, "leaf");
  return issue(
    current.generation,
    "handle",
    slot.id ?? deny(),
    slot.member,
    slot,
  );
}
function descendants(parent: Slot): Slot[] {
  const generation = parent.generation;
  if (!generation) return [];
  return [...generation.slots].filter((slot) =>
    parent.kind === "scope" ? slot !== parent : slot.parent === parent,
  );
}
function removeSlot(slot: Slot): void {
  for (const child of descendants(slot)) removeSlot(child);
  const generation = slot.generation;
  endSlot(slot, false);
  generation?.slots.delete(slot);
  slot.generation = null;
  slot.id = null;
  slot.member = null;
  slot.parent = null;
  slot.cell = null;
  slot.columnId = null;
}
/** Release only. No source/actor/permission/DOM/native callback read or invocation. */
export function releaseNativeAttachment(nonce: unknown): undefined {
  const record = object(nonce) ? attachments.get(nonce) : undefined;
  const slot = record?.slot;
  if (!record || !slot || slot.attachment !== nonce) return undefined;
  for (const child of descendants(slot))
    endSlot(child, child.attachment !== null || child.needsFreshTicket);
  endSlot(slot, true);
  return undefined;
}
function attachmentCleanup(nonce: object): () => void {
  // Separate activation: a returned cleanup does not capture the ref callback's
  // transient source proof, candidate node or current native inspection arrays.
  return () => {
    releaseNativeAttachment(nonce);
  };
}
function getter(prototype: object, key: string): (...args: never[]) => unknown {
  const get = Object.getOwnPropertyDescriptor(prototype, key)?.get;
  if (typeof get !== "function") deny();
  return get;
}
function realm(): Realm {
  // Pinned ambient realm, never allegedNode.ownerDocument.defaultView. Lazy so
  // factory/import/SSR do not require any browser global or touch a native port.
  const {
    Node,
    Element,
    HTMLTableElement,
    HTMLTableRowElement,
    HTMLTableCellElement,
    HTMLButtonElement,
    document,
  } = globalThis;
  if (
    !Node ||
    !Element ||
    !HTMLTableElement ||
    !HTMLTableRowElement ||
    !HTMLTableCellElement ||
    !HTMLButtonElement ||
    !document
  )
    deny();
  return Object.freeze({
    document,
    parent: getter(Node.prototype, "parentNode") as Realm["parent"],
    owner: getter(Node.prototype, "ownerDocument") as Realm["owner"],
    nodeType: getter(Node.prototype, "nodeType") as Realm["nodeType"],
    name: getter(Element.prototype, "localName") as Realm["name"],
    attribute: Element.prototype.getAttribute,
    prototypes: Object.freeze({
      scope: HTMLTableElement.prototype,
      row: HTMLTableRowElement.prototype,
      leaf: HTMLTableCellElement.prototype,
      handle: HTMLButtonElement.prototype,
    }),
  });
}
function tag(dom: Realm, node: Node): string {
  return Reflect.apply(dom.name, node, []) as string;
}
function parent(dom: Realm, node: Node): Node | null {
  return Reflect.apply(dom.parent, node, []) as Node | null;
}
function admitNode(dom: Realm, slot: Slot, node: HTMLElement): void {
  if (
    !Object.prototype.isPrototypeOf.call(dom.prototypes[slot.kind], node) ||
    Reflect.apply(dom.nodeType, node, []) !== 1 ||
    Reflect.apply(dom.owner, node, []) !== dom.document ||
    tag(dom, node) !==
      ({ scope: "table", row: "tr", leaf: "th", handle: "button" } as const)[
        slot.kind
      ]
  )
    deny();
  Reflect.apply(dom.parent, node, []); // Native brand check rejects proxies/spoofs.
}
function freshSlot(slot: Slot) {
  const generation = slot.generation ?? deny();
  const state = generation.state ?? deny();
  let current: ReturnType<typeof inspect>;
  try {
    current = inspect(state, "idle");
  } catch {
    retire(state);
    return deny();
  }
  if (
    current.proof.kind !== "ready" ||
    state.generation !== generation ||
    !sameGeneration(generation, current.proof, current.mount) ||
    !memberPresent(slot, current.proof)
  ) {
    retire(state);
    deny();
  }
  // Cell incarnation is also checked; equal row/column IDs are insufficient.
  if (slot.kind === "handle" && slot.parent?.kind === "row") {
    if (
      !generation.column ||
      slot.columnId !== generation.column.id ||
      !slot.cell
    )
      deny();
  }
  return { generation, state, ...current };
}
function ref<S extends QuerySchema, T extends object, K extends Kind>(
  value: NativeRefTicket<S, T, K>,
  kind: K,
): RefCallback<HTMLElement> {
  const record = ticketRecord(value);
  if (!record.slot || record.slot.kind !== kind) deny();
  if (record.callback) return record.callback;
  let nonce: object | null = null;
  const callback: RefCallback<HTMLElement> = (node) => {
    if (node === null) {
      if (nonce) releaseNativeAttachment(nonce);
      else {
        const slot = ticketRecord(value).slot;
        if (slot) {
          for (const child of descendants(slot))
            endSlot(child, child.attachment !== null || child.needsFreshTicket);
          endSlot(slot, false);
        }
      }
      return;
    }
    try {
      const slot = ticketRecord(value).slot;
      if (!slot) return; // Ended React callbacks are inert, never commit exceptions.
      const current = freshSlot(slot);
      const dom = current.generation.realm ?? realm();
      admitNode(dom, slot, node);
      current.state.link.require(current.stamp, "idle");
      if (slot.attachment) {
        const existing = attachments.get(slot.attachment);
        if (existing?.node !== node || slot.attachment !== nonce) deny();
      } else {
        if (nativeNodes.has(node)) deny();
        nonce = Object.freeze({});
        attachments.set(nonce, { slot, node, phase: "candidate" });
        nativeNodes.set(node, nonce);
        slot.attachment = nonce;
        current.generation.sealed = false;
        current.generation.realm = dom;
      }
      current.state.link.require(current.stamp, "idle");
      return attachmentCleanup(nonce ?? deny());
    } catch {
      // Denial/reentry/native-brand errors cannot escape React commit. No app
      // callback is invoked here; no arbitrary error is promoted into permission.
      if (nonce) releaseNativeAttachment(nonce);
      const slot = ticketRecord(value).slot;
      if (slot) {
        for (const child of descendants(slot))
          endSlot(child, child.attachment !== null || child.needsFreshTicket);
        endSlot(slot, slot.attachment !== null || slot.needsFreshTicket);
      }
    }
  };
  record.callback = callback;
  return callback;
}
export function nativeScopeRef<S extends QuerySchema, T extends object>(
  ticket: NativeScopeTicket<S, T>,
): RefCallback<HTMLTableElement | HTMLDivElement> {
  return ref(ticket, "scope");
}
export function nativeRowRef<S extends QuerySchema, T extends object>(
  ticket: NativeRowTicket<S, T>,
): RefCallback<HTMLTableRowElement | HTMLDivElement> {
  return ref(ticket, "row");
}
export function nativeLeafRef<S extends QuerySchema, T extends object>(
  ticket: NativeLeafTicket<S, T>,
): RefCallback<HTMLTableCellElement | HTMLDivElement> {
  return ref(ticket, "leaf");
}
export function nativeHandleRef<S extends QuerySchema, T extends object>(
  ticket: NativeHandleTicket<S, T>,
): RefCallback<HTMLButtonElement> {
  return ref(ticket, "handle");
}
function nodeOf(slot: Slot): HTMLElement | null {
  return slot.attachment
    ? (attachments.get(slot.attachment)?.node ?? null)
    : null;
}
function belongs(
  dom: Realm,
  slot: Slot,
  node: HTMLElement,
  table: HTMLElement,
): boolean {
  if (slot.kind === "scope") return node === table;
  if (slot.kind === "row") {
    const body = parent(dom, node);
    return !!body && tag(dom, body) === "tbody" && parent(dom, body) === table;
  }
  if (slot.kind === "leaf") {
    const row = parent(dom, node),
      head = row && parent(dom, row);
    return (
      !!row &&
      !!head &&
      tag(dom, row) === "tr" &&
      tag(dom, head) === "thead" &&
      parent(dom, head) === table &&
      Reflect.apply(dom.attribute, node, ["data-column-id"]) === slot.id
    );
  }
  const host = slot.parent && nodeOf(slot.parent);
  if (!host || !slot.parent) return false;
  let current: Node | null = node;
  for (let depth = 0; current && depth < 128; depth++) {
    current = parent(dom, current);
    if (!current) return false;
    if (slot.parent.kind === "leaf") {
      if (current === host) return true;
    } else if (
      (tag(dom, current) === "td" || tag(dom, current) === "th") &&
      parent(dom, current) === host
    )
      return (
        Reflect.apply(dom.attribute, current, ["data-column-id"]) ===
        slot.columnId
      );
    if (current === table || current === host) return false;
  }
  return false;
}
export function sealNativeRefs<S extends QuerySchema, T extends object>(
  target: TableRendererTarget<S, T>,
): "ready" | "incomplete" | "refresh-refs" {
  const { generation, state, stamp } = acquisition(target);
  let refresh = false;
  for (const slot of generation.slots)
    if (slot.needsFreshTicket && !slot.refreshConsumed) {
      slot.refreshConsumed = true;
      refresh = true;
    }
  if (refresh) return "refresh-refs";
  const scope = [...generation.slots].find((slot) => slot.kind === "scope");
  const table = scope && nodeOf(scope);
  const dom = generation.realm;
  if (!table || !scope || !dom) return "incomplete";
  let complete = true;
  try {
    for (const slot of generation.slots) {
      const node = nodeOf(slot);
      if (!node) {
        complete = false;
        continue;
      }
      freshSlot(slot);
      admitNode(dom, slot, node);
      if (!belongs(dom, slot, node, table)) {
        endSlot(slot, true);
        complete = false;
        continue;
      }
      state.link.require(stamp, "idle");
    }
    state.link.require(stamp, "idle");
    if (!complete) return "incomplete";
    for (const slot of generation.slots) {
      const record = slot.attachment && attachments.get(slot.attachment);
      if (record) record.phase = "sealed";
    }
    generation.sealed = true;
    return "ready";
  } catch {
    retire(state);
    return deny();
  }
}
/** Metadata observation only; sealed never grants a row/column action. */
export function nativeRefStatus(ticket: unknown): "ended" | Phase {
  const slot = object(ticket) ? tickets.get(ticket)?.slot : null;
  if (!slot) return "ended";
  if (!slot.attachment) return "issued";
  const phase = attachments.get(slot.attachment)?.phase ?? "issued";
  return phase === "sealed" && !slot.generation?.sealed ? "candidate" : phase;
}
