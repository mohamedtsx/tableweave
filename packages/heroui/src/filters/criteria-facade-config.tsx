"use client";

import {
  type CriteriaOrigin,
  requireCriteriaTool,
  type TableController,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import { defaultOperatorRegistry } from "@tableweave/react/filters";
import { createElement, useSyncExternalStore } from "react";
import {
  getTableRendererOwner,
  requireTableRendererTarget,
} from "../table/renderer-commit.js";
import type {
  TableRendererCell,
  TableRendererLocal,
  TableRendererTarget,
} from "../table/types.js";
import { FilterDate, type FilterDateProps } from "../toolbar/filter-date.js";
import {
  FilterSearch,
  type FilterSearchProps,
} from "../toolbar/filter-search.js";
import { FilterTabs, type FilterTabsProps } from "../toolbar/filter-tabs.js";
import type {
  CriteriaToolKind,
  CriteriaToolTarget,
} from "./criteria-commit.js";
import {
  type CommitCheck,
  CommitMetadata,
  sameCommitContext,
  sameCommitOrigin,
} from "./criteria-commit-core.js";

declare const sourceBrand: unique symbol;
export interface CriteriaFacadeSource<
  K extends CriteriaToolKind,
  S extends QuerySchema,
  T extends object,
> {
  readonly [sourceBrand]: {
    readonly kind: K;
    readonly types: (schema: S, record: T) => readonly [S, T];
  };
}
type Envelope = Readonly<Record<string, unknown>>;
interface Entry<S extends QuerySchema> {
  readonly source: Source<S, object>;
  readonly ticket: object | null;
  readonly target: CriteriaToolTarget<S> | null;
  readonly origin: CriteriaOrigin<S> | null;
  readonly mode: "client" | "server" | null;
  readonly handle: object;
  readonly input: Envelope;
}
interface Payload<S extends QuerySchema> {
  readonly entry: Entry<S>;
  readonly config: unknown;
  readonly messages: unknown;
  readonly editor: unknown;
  readonly labels: unknown;
  readonly locale: string | undefined;
  readonly direction: "ltr" | "rtl" | undefined;
  readonly sourceMode: string;
}
interface Source<S extends QuerySchema, T extends object> {
  readonly cell: TableRendererCell<S, T>;
  readonly kind: CriteriaToolKind;
  readonly owner: NonNullable<ReturnType<typeof getTableRendererOwner<S, T>>>;
  readonly slot: TableRendererLocal<S, T, Payload<S>>;
  unready: Entry<S>;
  last: Entry<S>;
}
const sources = new WeakMap<object, unknown>();
const byCell = new WeakMap<object, Map<CriteriaToolKind, object>>();
const handles = new WeakMap<object, unknown>(),
  envelopes = new WeakMap<object, unknown>();
function object(value: unknown): value is object {
  return value !== null && typeof value === "object";
}
export class CriteriaFacadeError extends Error {
  readonly code = "criteria.facade.unavailable";
  constructor() {
    super("Criteria facade configuration is unavailable.");
    this.name = "CriteriaFacadeError";
  }
}
function deny(): never {
  throw new CriteriaFacadeError();
}
function sourceOf<S extends QuerySchema, T extends object>(
  value: unknown,
): Source<S, T> {
  return (
    (object(value)
      ? (sources.get(value) as Source<S, T> | undefined)
      : undefined) ?? deny()
  );
}
function entryOf<S extends QuerySchema>(input: unknown): Entry<S> | null {
  return object(input) ? ((envelopes.get(input) as Entry<S>) ?? null) : null;
}
function makeEntry<S extends QuerySchema>(
  source: Source<S, object>,
  target: CriteriaToolTarget<S> | null,
  origin: CriteriaOrigin<S> | null,
  mode: "client" | "server" | null,
): Entry<S> {
  const handle = Object.freeze({}),
    ticket = target ? Object.freeze({}) : null;
  const input = Object.freeze({
    controller: source.owner.controller,
    criteria: handle,
    invalidationKey: 0,
    ...(origin
      ? {
          [source.kind === "builder"
            ? "expectedResourceContext"
            : "expectedContext"]: origin.context,
        }
      : {}),
    ...(source.kind === "builder" && mode ? { evaluationMode: mode } : {}),
  });
  const entry: Entry<S> = Object.freeze({
    source,
    ticket,
    target,
    origin,
    mode,
    handle,
    input,
  });
  handles.set(handle, entry);
  envelopes.set(input, entry);
  return entry;
}
/** Inert, finite allocation only after exact S2 cell provenance; no model/config read. */
export function createCriteriaFacadeSource<
  K extends CriteriaToolKind,
  S extends QuerySchema,
  T extends object,
>(cell: TableRendererCell<S, T>, kind: K): CriteriaFacadeSource<K, S, T> {
  const owner = getTableRendererOwner(cell) ?? deny();
  if (!["search", "tabs", "date", "builder"].includes(kind)) deny();
  let kinds = byCell.get(cell);
  if (!kinds) {
    kinds = new Map();
    byCell.set(cell, kinds);
  }
  const old = kinds.get(kind);
  if (old) return old as CriteriaFacadeSource<K, S, T>;
  // Erasure only at an exact registry boundary; no consumer row conversion.
  const state = {
    cell,
    kind,
    owner,
    slot: cell.createLocal<Payload<S>>("session"),
  } as Source<S, T>;
  state.unready = makeEntry(
    state as unknown as Source<S, object>,
    null,
    null,
    null,
  );
  state.last = state.unready;
  const source = Object.freeze({}) as CriteriaFacadeSource<K, S, T>;
  sources.set(source, state);
  kinds.set(kind, source);
  return source;
}
function current<S extends QuerySchema, T extends object>(
  source: Source<S, T>,
) {
  if (
    getTableRendererOwner(source.cell)?.controller !== source.owner.controller
  )
    deny();
  const actor = source.cell.getSnapshot().actor ?? deny();
  const value = requireTableRendererTarget({ cell: source.cell, actor });
  const tool = value.model.toolTarget ?? deny();
  if (
    tool.owner.controller !== source.owner.controller ||
    tool.owner.definition !== value.origin.definition
  )
    deny();
  return { actor, value, tool };
}
function payload<S extends QuerySchema>(
  entry: Entry<S>,
  exact: boolean,
): Payload<S> {
  if (!entry.target || !entry.origin || !entry.ticket) deny();
  const live = current(entry.source),
    stored = entry.source.slot.read(live.actor) ?? deny();
  if (
    stored.entry.source !== entry.source ||
    !stored.entry.origin ||
    !sameCommitOrigin(live.value.origin, entry.origin) ||
    !sameCommitOrigin(stored.entry.origin, entry.origin) ||
    stored.entry.target?.owner !== entry.target.owner ||
    stored.entry.mode !== entry.mode
  )
    deny();
  if (
    !sameCommitOrigin(
      requireCriteriaTool(entry.target.authority, entry.target.owner),
      entry.origin,
    )
  )
    deny();
  if (exact && stored.entry.ticket !== entry.ticket) deny();
  return stored;
}
/** No private slot read: last is only a finite issued metadata envelope, not config.
 * It can preserve an existing child through P2 snapshot staleness, never decode. */
function waiting<S extends QuerySchema>(entry: Entry<S>): boolean {
  const source = entry.source,
    last = source.last;
  if (
    !entry.target ||
    !entry.origin ||
    !last.target ||
    !last.origin ||
    !source.cell.getSnapshot().actor ||
    getTableRendererOwner(source.cell)?.controller !==
      source.owner.controller ||
    last.target.owner !== entry.target.owner ||
    !sameCommitOrigin(last.origin, entry.origin)
  )
    deny();
  if (
    !sameCommitOrigin(
      requireCriteriaTool(entry.target.authority, entry.target.owner),
      entry.origin,
    )
  )
    deny();
  return last.ticket === entry.ticket;
}
/** Parent layout only: consumes actual committed ports, never caller config/defaults. */
export function publishCriteriaFacadeSource<
  K extends CriteriaToolKind,
  S extends QuerySchema,
  T extends object,
>(
  handle: CriteriaFacadeSource<K, S, T>,
  target: TableRendererTarget<NoInfer<S>, NoInfer<T>>,
): Envelope {
  const source = sourceOf<S, T>(handle);
  if (target.cell !== source.cell) deny();
  const value = requireTableRendererTarget(target),
    tool = value.model.toolTarget ?? deny();
  const config = value.ports.toolConfigs[source.kind],
    messages = value.ports.childDefaults.messages[source.kind];
  const editor =
    source.kind === "date" || source.kind === "builder"
      ? value.ports.childDefaults.messages.dateEditor
      : undefined;
  const labels =
    source.kind === "builder"
      ? value.ports.childDefaults.builtinOperatorLabels
      : undefined;
  const locale = value.ports.locale?.locale,
    direction = value.ports.locale?.direction,
    sourceMode = value.metadata.mode;
  const mode = sourceMode === "client" ? "client" : "server";
  const previous = source.slot.read(target.actor);
  if (
    previous &&
    previous.config === config &&
    previous.messages === messages &&
    previous.editor === editor &&
    previous.labels === labels &&
    previous.locale === locale &&
    previous.direction === direction &&
    previous.sourceMode === sourceMode &&
    previous.entry.origin &&
    sameCommitOrigin(previous.entry.origin, value.origin) &&
    previous.entry.target?.owner === tool.owner
  ) {
    return previous.entry.input;
  }
  const entry = makeEntry(
    source as unknown as Source<S, object>,
    tool,
    value.origin,
    mode,
  );
  source.slot.write(
    target.actor,
    Object.freeze({
      entry,
      config,
      messages,
      editor,
      labels,
      locale,
      direction,
      sourceMode,
    }),
  );
  requireTableRendererTarget(target);
  source.last = entry;
  return entry.input;
}
export function getCriteriaFacadeInput<
  K extends CriteriaToolKind,
  S extends QuerySchema,
  T extends object,
>(handle: CriteriaFacadeSource<K, S, T>): Envelope {
  const source = sourceOf<S, T>(handle);
  try {
    const live = current(source),
      stored = source.slot.read(live.actor);
    if (stored) {
      payload(stored.entry, true);
      return stored.entry.input;
    }
  } catch {
    try {
      waiting(source.last);
      return source.last.input;
    } catch {
      /* Registered adopted-unready, never raw omission. */
    }
  }
  return source.unready.input;
}
/** React clones metadata props. Register only a genuine contained handle, without
 * inspecting any alleged private field; admission validates metadata later. */
export function bindCriteriaFacadeEnvelope<S extends QuerySchema>(
  input: unknown,
  handle: unknown,
): { readonly target: CriteriaToolTarget<S> | null } | null {
  const entry = object(handle)
    ? (handles.get(handle) as Entry<S> | undefined)
    : undefined;
  if (!entry || !object(input)) return null;
  envelopes.set(input, entry);
  return { target: entry.target };
}
export function criteriaFacadeIdentity(input: unknown): object | null {
  return entryOf(input)?.handle ?? null;
}
export function criteriaFacadeSameSource(
  input: unknown,
  previousHandle: object | null,
): boolean {
  const entry = entryOf(input),
    previous = previousHandle
      ? (handles.get(previousHandle) as Entry<QuerySchema> | undefined)
      : undefined;
  return !!entry && !!previous && entry.source === previous.source;
}
export function criteriaFacadeState(
  input: unknown,
): "current" | "waiting" | "superseded" | "unready" | "denied" | null {
  const entry = entryOf(input);
  if (!entry) return null;
  if (!entry.target) return "unready";
  try {
    return payload(entry, false).entry.ticket === entry.ticket
      ? "current"
      : "superseded";
  } catch {
    try {
      return waiting(entry) ? "waiting" : "superseded";
    } catch {
      return "denied";
    }
  }
}
/** Thin real toolbar producer; Builder UI intentionally has no integration here. */
export function CriteriaFacadeToolbar<
  K extends "search" | "tabs" | "date",
  S extends QuerySchema,
  T extends object,
>({ source }: { readonly source: CriteriaFacadeSource<K, S, T> }) {
  const state = sourceOf<S, T>(source);
  useSyncExternalStore(
    state.cell.subscribe,
    state.cell.getSnapshot,
    state.cell.getSnapshot,
  );
  const input = getCriteriaFacadeInput(source);
  // Only library metadata envelopes cross this source-private host bridge. The real
  // host recognizes their registry before any missing/private component props.
  if (state.kind === "search")
    return createElement(
      FilterSearch<S>,
      input as unknown as FilterSearchProps<S>,
    );
  if (state.kind === "tabs")
    return createElement(FilterTabs<S>, input as unknown as FilterTabsProps<S>);
  if (state.kind === "date")
    return createElement(FilterDate<S>, input as unknown as FilterDateProps<S>);
  return deny();
}

interface Handback {
  readonly input: object;
  readonly entry: Entry<QuerySchema>;
  attempt: object | null;
  value: { disabled: boolean; className: string } | null;
  closed: boolean;
}
const hostAttempts = new WeakMap<object, Handback>();
const handbacks = new WeakMap<object, Handback>();
export function prepareCriteriaFacadeHost(input: unknown): object | null {
  const entry = entryOf(input);
  if (!entry || !object(input)) return null;
  const token = Object.freeze({}),
    state: Handback = {
      input,
      entry,
      attempt: null,
      value: null,
      closed: false,
    };
  hostAttempts.set(input, state);
  handbacks.set(token, state);
  return token;
}
export function takeCriteriaFacadePresentation(
  token: object,
  input: unknown,
): { disabled: boolean; className: string } {
  const state = handbacks.get(token);
  if (!state || state.closed || state.input !== input || !state.value) deny();
  const value = state.value;
  closeCriteriaFacadeHost(token);
  return value;
}
export function closeCriteriaFacadeHost(token: object | null): void {
  if (!token) return;
  const state = handbacks.get(token);
  if (!state) return;
  state.value = null;
  state.closed = true;
  if (hostAttempts.get(state.input) === state) hostAttempts.delete(state.input);
  handbacks.delete(token);
}
interface Attempt<S extends QuerySchema> {
  readonly input: object;
  readonly entry: Entry<S>;
  readonly cell: object;
  readonly operation: object;
  readonly carrier: Handback | null;
  phase: "capturing" | "sealed" | "activated" | "denied" | "skipped";
  proof: object | null;
}
const attempts = new WeakMap<object, unknown>(),
  active = new WeakMap<object, object>(),
  proofs = new WeakMap<object, object>();
const skips = new WeakMap<
  object,
  { attempt: object; carrier: Handback | null; used: boolean }
>();
function attemptOf<S extends QuerySchema>(token: object): Attempt<S> {
  return (attempts.get(token) as Attempt<S>) ?? deny();
}
export function beginCriteriaFacadeCapture<S extends QuerySchema>(
  input: unknown,
  kind: string,
  controller: TableController<S>,
  target: CriteriaToolTarget<S>,
  origin: CriteriaOrigin<S>,
  cell: object,
  operation: object,
): object | null {
  const entry = entryOf<S>(input);
  if (!entry) return null;
  if (
    !object(input) ||
    entry.source.kind !== kind ||
    entry.source.owner.controller !== controller ||
    !entry.target ||
    !entry.origin ||
    entry.target.owner !== target.owner ||
    !sameCommitOrigin(entry.origin, origin)
  )
    deny();
  payload(entry, true); // Superseded BEFORE capture is not a cancellation proof.
  const token = Object.freeze({}),
    carrier = hostAttempts.get(input) ?? null;
  const state: Attempt<S> = {
    input,
    entry,
    cell,
    operation,
    carrier,
    phase: "capturing",
    proof: null,
  };
  attempts.set(token, state);
  active.set(input, token);
  if (carrier) carrier.attempt = token;
  return token;
}
export function criteriaFacadeAttemptSource(
  token: object | null,
): object | null {
  return token ? attemptOf(token).entry.source : null;
}
export function checkCriteriaFacadeCapture(token: object | null): undefined {
  if (!token) return undefined;
  const state = attemptOf(token);
  if (state.phase === "activated") return undefined;
  if (state.phase !== "capturing" && state.phase !== "sealed") deny();
  if (active.get(state.input) !== token) deny();
  const live = payload(state.entry, false);
  if (live.entry.ticket !== state.entry.ticket) {
    if (state.phase !== "capturing") deny();
    state.proof ??= Object.freeze(new Error("Superseded criteria capture."));
    proofs.set(state.proof, token);
    throw state.proof;
  }
  return undefined;
}
export function sealCriteriaFacadeCapture(token: object | null): void {
  if (token) {
    checkCriteriaFacadeCapture(token);
    attemptOf(token).phase = "sealed";
  }
}
export function activateCriteriaFacadeCapture(token: object | null): void {
  if (token) {
    checkCriteriaFacadeCapture(token);
    attemptOf(token).phase = "activated";
  }
}
export function endCriteriaFacadeCapture(token: object | null): void {
  if (!token) return;
  const state = attemptOf(token);
  if (active.get(state.input) === token) active.delete(state.input);
  if (state.phase !== "activated" && state.phase !== "skipped") {
    state.phase = "denied";
    if (state.carrier) state.carrier.value = null;
  }
}
/** Closed one-attempt proof. Core must independently establish unchanged A first. */
export function consumeCriteriaFacadeCancellation<S extends QuerySchema>(
  token: object,
  error: unknown,
  cell: object,
  operation: object,
  source: object,
  origin: CriteriaOrigin<S>,
  mode: string,
): object {
  const state = attemptOf<S>(token);
  if (
    !object(error) ||
    proofs.get(error) !== token ||
    state.proof !== error ||
    state.phase !== "capturing" ||
    active.get(state.input) !== token ||
    state.cell !== cell ||
    state.operation !== operation ||
    state.entry.source !== source ||
    !state.entry.origin ||
    !sameCommitOrigin(state.entry.origin, origin) ||
    mode !==
      (state.entry.source.kind === "builder" ? state.entry.mode : "paired")
  )
    deny();
  if (payload(state.entry, false).entry.ticket === state.entry.ticket) deny();
  proofs.delete(error);
  state.proof = null;
  state.phase = "skipped";
  if (state.carrier) state.carrier.value = null;
  const receipt = Object.freeze(new Error("Criteria facade layout skipped."));
  skips.set(receipt, { attempt: token, carrier: state.carrier, used: false });
  return receipt;
}
export function consumeCriteriaFacadeHostSkip(
  error: unknown,
  input: unknown,
  cell: object,
  carrier: object | null,
): boolean {
  if (!object(error) || !carrier) return false;
  const receipt = skips.get(error),
    host = handbacks.get(carrier);
  if (
    !receipt ||
    receipt.used ||
    !host ||
    receipt.carrier !== host ||
    host.attempt !== receipt.attempt ||
    host.closed ||
    host.input !== input
  )
    return false;
  const state = attemptOf(receipt.attempt);
  if (
    state.cell !== cell ||
    state.input !== input ||
    state.phase !== "skipped" ||
    entryOf(input) !== state.entry
  )
    return false;
  try {
    if (payload(state.entry, false).entry.ticket === state.entry.ticket)
      return false;
  } catch {
    return false;
  }
  receipt.used = true;
  skips.delete(error);
  return true;
}

const common = ["unavailable", "invalidConfiguration", "submitted", "failed"];
const editorKeys = [
  "pointLabel",
  "startLabel",
  "endLabel",
  "timeLabel",
  "exactInstantLabel",
  "exactInstantHint",
  "modeLabel",
  "dayModeLabel",
  "instantModeLabel",
  "relativeModeLabel",
  "presetsLabel",
  "chooseDateLabel",
  "previousMonthLabel",
  "nextMonthLabel",
  "invalidValue",
  "incompleteValue",
  "ambiguousTime",
  "formatRelative",
];
const messageKeys = {
  search: [
    ...common,
    "label",
    "placeholder",
    "clearLabel",
    "cancelled",
    "invalidValue",
  ],
  tabs: [...common, "label", "previousTabsLabel", "nextTabsLabel"],
  date: [
    ...common,
    ...editorKeys,
    "label",
    "applyLabel",
    "cancelLabel",
    "clearLabel",
    "emptySummary",
    "formatSummary",
    "formatTimeZone",
  ],
  builder: [
    "filters",
    "addRule",
    "field",
    "operator",
    "value",
    "options",
    "all",
    "any",
    "join",
    "clear",
    "clearLabel",
    "duplicate",
    "negate",
    "remove",
    "cancel",
    "apply",
    "editorTitle",
    "chooseField",
    "chooseOperator",
    "chooseValue",
    "searchFields",
    "searchOptions",
    "loading",
    "emptyOptions",
    "optionsFailed",
    "retry",
    "nextOptions",
    "noFields",
    "incomplete",
    "invalid",
    "mutationFailed",
    "staleDraft",
    "submitted",
    "applied",
    "removed",
    "cleared",
    "accessUnavailable",
    "unavailableValue",
    "customEditorMissing",
    "from",
    "to",
  ],
} as const;
/** Only own data snapshots here. F3a below remains the only callback actor owner. */
export function materializeCriteriaFacade<S extends QuerySchema>(
  input: unknown,
  kind: CriteriaToolKind,
  origin: CriteriaOrigin<S>,
  metadata: CommitMetadata,
  check: CommitCheck,
): unknown {
  const entry = entryOf<S>(input);
  if (!entry) return input;
  const token = object(input) ? active.get(input) : null;
  if (!token) deny();
  const ensure = () => {
    check();
    checkCriteriaFacadeCapture(token);
  };
  const objects = new WeakSet<object>();
  const capture = new CommitMetadata(ensure, deny),
    objectData = (value: unknown) => {
      ensure();
      if (!object(value)) deny();
      if (objects.has(value)) return value;
      if (capture.reflect(() => Array.isArray(value))) deny();
      const proto = capture.reflect(() => Object.getPrototypeOf(value));
      if (proto !== null && proto !== Object.prototype) deny();
      objects.add(value);
      return value;
    };
  const data = (value: unknown, key: string, optional = true) =>
    capture.data(value, key, optional);
  const bound = new WeakMap<object, WeakMap<object, object>>();
  const bind = (value: unknown, receiver: object) => {
    if (typeof value !== "function") return value;
    let receivers = bound.get(value);
    if (!receivers) {
      receivers = new WeakMap();
      bound.set(value, receivers);
    }
    let fn = receivers.get(receiver);
    if (!fn) {
      fn = function (this: unknown, ...args: unknown[]) {
        return Reflect.apply(value, receiver, args);
      };
      receivers.set(receiver, fn);
    }
    return fn;
  };
  const dictionaries = new WeakMap<object, Map<string, object>>();
  const keysCache = new WeakMap<object, readonly PropertyKey[]>();
  const keysOf = (value: unknown) => {
    ensure();
    const source = objectData(value);
    let keys = keysCache.get(source);
    if (!keys) {
      keys = capture.reflect(() => Reflect.ownKeys(source));
      keysCache.set(source, keys);
    }
    return keys;
  };
  const dictionary = (
    values: readonly unknown[],
    keys: readonly string[],
    role: string,
  ): object => {
    const result: Record<string, unknown> = Object.create(null);
    for (const value of values) {
      if (value === undefined) continue;
      const source = objectData(value);
      let cache = dictionaries.get(source);
      if (!cache) {
        cache = new Map();
        dictionaries.set(source, cache);
      }
      let owned = cache.get(role);
      if (!owned) {
        const out: Record<string, unknown> = Object.create(null);
        for (const key of keys) {
          const item = data(source, key);
          if (capture.has(source, key)) out[key] = bind(item, source);
        }
        owned = out;
        cache.set(role, out);
      }
      for (const key of keys)
        if (Object.hasOwn(owned, key)) result[key] = data(owned, key);
    }
    return Object.freeze(result);
  };
  try {
    ensure();
    if (metadata.data(input, "criteria") !== entry.handle) deny();
    if (
      kind === "builder" &&
      metadata.data(input, "evaluationMode") !== entry.mode
    )
      deny();
    const currentPayload = payload(entry, true),
      cfg =
        currentPayload.config === undefined
          ? Object.freeze({})
          : objectData(currentPayload.config);
    // Explicit conflicting metadata is a denial, never an override of ownership.
    for (const key of [
      "controller",
      "criteria",
      "expectedContext",
      "expectedResourceContext",
      "invalidationKey",
      "evaluationMode",
    ]) {
      const value = data(cfg, key);
      if (!capture.has(cfg, key)) continue;
      if (key === "controller" && value !== entry.source.owner.controller)
        deny();
      if (
        key === "criteria" &&
        value !== entry.target &&
        value !== entry.handle
      )
        deny();
      if (
        (key === "expectedContext" || key === "expectedResourceContext") &&
        !sameCommitContext(capture.context(value), origin.context)
      )
        deny();
      if (key === "invalidationKey" && value !== 0) deny();
      if (key === "evaluationMode" && value !== entry.mode) deny();
    }
    const out: Record<string, unknown> = Object.create(null);
    const keys =
      kind === "search"
        ? ["onMutation"]
        : kind === "tabs"
          ? ["tabs", "neutralTab", "activation", "children", "onMutation"]
          : kind === "date"
            ? ["registry", "presets", "onMutation"]
            : ["registry", "createRuleId", "onMutation"];
    for (const key of keys) {
      const value = data(cfg, key);
      if (capture.has(cfg, key))
        out[key] =
          kind === "builder" && (key === "createRuleId" || key === "onMutation")
            ? bind(value, cfg)
            : value;
    }
    out.messages = dictionary(
      [
        ...(kind === "date" ? [currentPayload.editor] : []),
        currentPayload.messages,
        data(cfg, "messages"),
      ],
      messageKeys[kind],
      kind + "-messages",
    );
    const disabled = data(cfg, "disabled"),
      className = data(cfg, "className");
    if (disabled !== undefined && typeof disabled !== "boolean") deny();
    if (className !== undefined && typeof className !== "string") deny();
    const state = attemptOf(token);
    if (state.carrier)
      state.carrier.value = {
        disabled: disabled === true,
        className: (className as string | undefined) ?? "",
      };
    const actualRegistry =
      entry.source.owner.definition.native.evaluation.registry ??
      defaultOperatorRegistry;
    if (kind === "date" || kind === "builder") {
      if (out.registry !== undefined && out.registry !== actualRegistry) deny();
      out.registry = actualRegistry;
    }
    if (kind === "builder") {
      out.evaluationMode = entry.mode;
      const fieldsInput = data(cfg, "fields"),
        fields =
          fieldsInput === undefined
            ? Object.freeze({})
            : objectData(fieldsInput),
        builtins = currentPayload.labels;
      const result: Record<string, unknown> = Object.create(null);
      const presentations = new WeakMap<object, Map<string, object>>();
      for (const id of Object.keys(origin.definition.schema.fields)) {
        const field = origin.definition.schema.fields[id];
        if (field?.owner !== "builder") continue;
        const raw = data(fields, id),
          value = raw === undefined ? Object.freeze({}) : objectData(raw);
        const label = data(value, "label");
        const explicit = capture.has(value, "label"),
          role = explicit ? "explicit-label" : id;
        let aliases = presentations.get(value);
        if (!aliases) {
          aliases = new Map();
          presentations.set(value, aliases);
        }
        const alias = aliases.get(role);
        if (alias) {
          result[id] = alias;
          continue;
        }
        const owned: Record<string, unknown> = Object.create(null);
        owned.label = explicit ? label : id;
        for (const key of [
          "choices",
          "asyncOptions",
          "formatValue",
          "renderEditor",
        ]) {
          const item = data(value, key);
          if (capture.has(value, key))
            owned[key] =
              key === "formatValue" || key === "renderEditor"
                ? bind(item, value)
                : item;
        }
        const custom = data(value, "operatorLabels"),
          names = new Set<string>();
        for (const labels of [builtins, custom])
          if (labels !== undefined)
            for (const key of keysOf(labels)) {
              if (typeof key !== "string") deny();
              names.add(key);
            }
        owned.operatorLabels = dictionary(
          [builtins, custom],
          [...names],
          "operator-labels",
        );
        const presentation = Object.freeze(owned);
        result[id] = presentation;
        aliases.set(role, presentation);
      }
      out.fields = Object.freeze(result);
      out.dateMessages = dictionary(
        [currentPayload.editor, data(cfg, "dateMessages")],
        editorKeys,
        "date-editor",
      );
    }
    // Admission metadata is checked separately by the actual tool adapter. Decode
    // never reads a candidate controller and never constructs a controller/source.
    metadata.data(input, "controller");
    ensure();
    return Object.freeze(out);
  } finally {
    ensure();
  }
}
