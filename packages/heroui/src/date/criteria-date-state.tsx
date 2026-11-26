"use client";

import type {
  CalendarDate,
  CalendarDateTime,
  DateValue as VendorDateValue,
} from "@internationalized/date";
import {
  parseDate,
  toCalendarDate,
  toCalendarDateTime,
} from "@internationalized/date";
import type {
  DatePoint,
  DateRange,
  DateValue,
  OperatorRegistry,
  QuerySchema,
  StandaloneDate,
} from "@tableweave/react/contracts";
import { canonicalJson } from "@tableweave/react/contracts";
import type { BuilderFieldId } from "@tableweave/react/filters";
import {
  defaultOperatorRegistry,
  getFieldOperators,
  relativePresets,
  resolveDateOperand,
} from "@tableweave/react/filters";
import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import type {
  CriteriaActor,
  CriteriaCommitCell,
  CriteriaLocalCell,
} from "../filters/criteria-commit.js";
import type {
  FilterBuilderPorts,
  FilterDatePorts,
} from "../filters/criteria-ports.js";
import type {
  DateDraft,
  DateEditorMessages,
  DateFieldDefinition,
  FilterDateContext,
} from "./date-types.js";
import { dateEditorMessages } from "./date-types.js";
import {
  dayWire,
  instantWallTime,
  parseInstantInput,
  wallTimeWire,
} from "./date-wire.js";

type Kind = "date" | "builder";
export type CriteriaDatePart = "point" | "start" | "end";
export type CriteriaDateChannel =
  | "operand"
  | "picker"
  | "range"
  | "instant"
  | "instant-day"
  | "day-observer"
  | "range-observer"
  | "time-observer";
type Mode = "day" | "instant" | "relative";
declare const handleBrand: unique symbol;
declare const bundleBrand: unique symbol;
/** Opaque: the private WeakMap, not a property/boolean/structural shape, proves it. */
export interface CriteriaDateStateHandle {
  readonly [handleBrand]: true;
}
export interface CriteriaDateStateProps {
  /** @internal Genuine registered library edit handle; presence never falls back. */
  readonly criteriaState?: CriteriaDateStateHandle;
}
export interface CriteriaDateBundle<K extends Kind, S extends QuerySchema> {
  readonly [bundleBrand]: (kind: K, schema: S) => readonly [K, S];
}
/** @internal Original Builder intent, not a rule/permission supplied to C.
 * id is required even for a new rule so null provenance can prove actual absence.
 * baseline is exactly JSON.stringify(the original actual accepted rule), or null
 * for that absent new id. value is the eligible parent draft's Date wire seed. */
export interface CriteriaBuilderDateDraft {
  readonly id: string;
  readonly baseline: string | null;
  readonly value: DateValue | DateRange | null;
}
export type CriteriaDateBinding =
  | Readonly<{ kind: "date" }>
  | Readonly<{
      kind: "builder";
      fieldId: string;
      operator: string;
      ruleId: string | null;
      /** True omission preserves the original accepted-field/operator contract. */
      draft?: CriteriaBuilderDateDraft;
    }>;
export class CriteriaDateStateError extends Error {
  readonly code = "criteria.date.unavailable";
  constructor() {
    super("Date editor state is unavailable.");
    this.name = "CriteriaDateStateError";
  }
}
function deny(): never {
  throw new CriteriaDateStateError();
}
function object(value: unknown): value is object {
  return value !== null && typeof value === "object";
}
/** Operation-local descriptor/alias cache. The only check is library-created
 * from the real F3 actor/C snapshot; callers cannot supply a permitting guard.
 * No caller object, reflection cache or callback survives in an edit handle. */
class BindingCapture {
  private readonly descriptors = new WeakMap<
    object,
    Map<PropertyKey, PropertyDescriptor | undefined>
  >();
  private readonly inherited = new WeakMap<object, Map<PropertyKey, boolean>>();
  private readonly prototypes = new WeakMap<object, unknown>();
  private readonly names = new WeakMap<object, readonly PropertyKey[]>();
  private readonly arrays = new WeakMap<object, boolean>();
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
  array(input: unknown): input is readonly unknown[] {
    this.check();
    if (!object(input)) return false;
    if (!this.arrays.has(input))
      this.arrays.set(
        input,
        this.reflect(() => Array.isArray(input)),
      );
    return this.arrays.get(input) === true;
  }
  record(input: unknown): object {
    this.check();
    if (!object(input) || this.array(input)) return deny();
    if (!this.prototypes.has(input))
      this.prototypes.set(
        input,
        this.reflect(() => Object.getPrototypeOf(input)),
      );
    const prototype = this.prototypes.get(input);
    if (prototype !== null && prototype !== Object.prototype) return deny();
    return input;
  }
  private descriptor(
    input: unknown,
    key: PropertyKey,
    optional: boolean,
  ): PropertyDescriptor | undefined {
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
    return descriptor;
  }
  data(input: unknown, key: PropertyKey, enumerable = false): unknown {
    const descriptor = this.descriptor(input, key, false);
    if (!descriptor || (enumerable && !descriptor.enumerable)) return deny();
    return descriptor.value;
  }
  optional(
    input: unknown,
    key: PropertyKey,
  ):
    | { readonly present: false }
    | { readonly present: true; readonly value: unknown } {
    const descriptor = this.descriptor(input, key, true);
    return descriptor
      ? { present: true, value: descriptor.value }
      : { present: false };
  }
  keys(input: object, expected: readonly string[]): void {
    if (!this.names.has(input))
      this.names.set(
        input,
        this.reflect(() => Reflect.ownKeys(input)),
      );
    const names = this.names.get(input);
    if (
      !names ||
      names.length !== expected.length ||
      names.some((name) => typeof name !== "string" || !expected.includes(name))
    )
      deny();
  }
  point(input: unknown): DatePoint {
    const source = this.record(input);
    this.keys(source, ["kind", "value"]);
    const kind = this.data(source, "kind", true),
      value = this.data(source, "value", true);
    if ((kind !== "day" && kind !== "instant") || typeof value !== "string")
      return deny();
    return Object.freeze({ kind, value });
  }
  wire(input: unknown): DateValue | DateRange | null {
    this.check();
    if (input === null) return null;
    if (this.array(input)) {
      this.keys(input, ["0", "1", "length"]);
      if (this.data(input, "length") !== 2) return deny();
      const first = this.point(this.data(input, "0", true)),
        last = this.point(this.data(input, "1", true));
      return Object.freeze([first, last] as const);
    }
    const source = this.record(input),
      kind = this.data(source, "kind", true);
    if (kind === "day" || kind === "instant") return this.point(source);
    if (kind === "relative") {
      this.keys(source, ["kind", "preset"]);
      const name = this.data(source, "preset", true),
        preset = relativePresets.find((item) => item === name);
      if (!preset) return deny();
      return Object.freeze({ kind, preset });
    }
    if (kind === "rolling") {
      this.keys(source, ["kind", "days", "direction"]);
      const days = this.data(source, "days", true),
        direction = this.data(source, "direction", true);
      if (
        typeof days !== "number" ||
        !Number.isSafeInteger(days) ||
        days <= 0 ||
        (direction !== "past" && direction !== "future")
      )
        return deny();
      return Object.freeze({ kind, days, direction });
    }
    return deny();
  }
}
const parts: readonly CriteriaDatePart[] = ["point", "start", "end"];
const channels: readonly CriteriaDateChannel[] = [
  "operand",
  "picker",
  "range",
  "instant",
  "instant-day",
  "day-observer",
  "range-observer",
  "time-observer",
];
const empty = { status: "empty", value: null } as const;
const fixedDateMessages = Object.freeze({ ...dateEditorMessages });
interface Configuration {
  readonly token: object;
  readonly binding: CriteriaDateBinding;
  readonly field: DateFieldDefinition;
  readonly cardinality: "one" | "range";
  readonly baseline: string;
  readonly seed: DateValue | DateRange | null;
  readonly messages: DateEditorMessages;
  readonly registry: OperatorRegistry | undefined;
}
interface RoleValues {
  readonly day: CalendarDate;
  readonly blocked: boolean;
  readonly draft: DateDraft<DatePoint>;
  readonly text: string;
  readonly time: CalendarDateTime;
  readonly error: string;
  readonly clockBlocked: boolean;
  readonly dirty: boolean;
  readonly instantDay: DateDraft<DatePoint>;
  readonly clock: DateDraft<CalendarDateTime>;
  readonly controlsRevision: number;
  readonly daySignature: string;
  readonly timeSignature: string;
}
interface RootValues {
  readonly config: Configuration;
  readonly family: Family;
  readonly mode: Mode;
  readonly operand: DateDraft<DateValue | DateRange>;
  readonly invalid: boolean;
  readonly report: string;
  readonly range: { readonly start: CalendarDate; readonly end: CalendarDate };
  readonly candidate: StandaloneDate;
  readonly toolbarDraft: DateDraft<DateValue | DateRange>;
  readonly notice: string;
  readonly open: boolean;
  readonly contextKey: string;
  readonly preparedActor: object;
}
type Slots<K extends Kind, S extends QuerySchema, Values> = {
  readonly [Key in keyof Values]: CriteriaLocalCell<K, S, Values[Key]>;
};
type Family = Readonly<Record<string, CriteriaDateStateHandle>>;
interface Snapshot {
  readonly field: DateFieldDefinition;
  readonly context: FilterDateContext;
  readonly messages: DateEditorMessages;
  readonly cardinality: "one" | "range";
  readonly mode: Mode;
  readonly part: CriteriaDatePart;
  readonly channel: CriteriaDateChannel;
  readonly draft: DateDraft<DateValue | DateRange>;
  readonly invalid: boolean;
  readonly day: CalendarDate | null;
  readonly range: RootValues["range"] | null;
  readonly text: string;
  readonly time: CalendarDateTime | null;
  readonly error: string;
  readonly controlsRevision: number;
}
export interface CriteriaDateToolbarState {
  readonly open: boolean;
  readonly handle: CriteriaDateStateHandle | null;
  readonly candidate: StandaloneDate | null;
  readonly draft: DateDraft<DateValue | DateRange>;
  readonly notice: string;
}
/** Erased ONLY in the private registry. All functions close over the real paired
 * F3 cell/actor types and F3 slot references, never an app permission/reset port
 * or a canonical plaintext backup. Caller objects are never read as records. */
interface Bridge {
  readonly cell: object;
  readonly prepare: (actor: object) => void;
  readonly begin: (
    actor: object,
    binding: CriteriaDateBinding,
  ) => CriteriaDateStateHandle;
  readonly close: (actor: object) => void;
  readonly toolbar: (actor: object) => CriteriaDateToolbarState;
  readonly notice: (actor: object, value: string) => void;
  readonly preset: (actor: object, value: StandaloneDate) => void;
  readonly guard: (entry: Entry) => void;
  readonly session: (entry: Entry) => void;
  readonly snapshot: (entry: Entry) => Snapshot;
  readonly mode: (entry: Entry, value: Mode) => void;
  readonly picker: (entry: Entry, value: CalendarDate | null) => void;
  readonly rangePicker: (
    entry: Entry,
    value: RootValues["range"] | null,
  ) => void;
  readonly editing: (entry: Entry, part?: CriteriaDatePart) => void;
  readonly calendar: (
    entry: Entry,
    value: CalendarDate | RootValues["range"],
  ) => void;
  readonly text: (entry: Entry, value: string) => void;
  readonly time: (entry: Entry, value: CalendarDateTime | null) => void;
  readonly dirty: (entry: Entry) => void;
  readonly timeEditing: (entry: Entry) => void;
  readonly observe: (
    entry: Entry,
    signature: string,
    value: DateDraft<VendorDateValue>,
  ) => void;
  readonly revalidate: (entry: Entry) => void;
  readonly operand: (
    entry: Entry,
    value: DateDraft<DateValue | DateRange>,
  ) => void;
  readonly version: () => object;
  readonly subscribe: (listener: () => void) => () => void;
}
interface Entry {
  readonly bridge: Bridge;
  readonly actor: object;
  readonly token: object;
  readonly part: CriteriaDatePart;
  readonly channel: CriteriaDateChannel;
  readonly family: Family;
  readonly controlsRevision: number;
}
const bundles = new WeakMap<object, Bridge>(),
  cells = new WeakMap<object, Bridge>(),
  handles = new WeakMap<object, Entry>();
function bundleRecord(value: unknown): Bridge {
  return object(value) ? (bundles.get(value) ?? deny()) : deny();
}
function entry(value: unknown): Entry {
  const known = object(value) ? handles.get(value) : undefined;
  if (!known) return deny();
  known.bridge.guard(known);
  return known;
}

/** Fixed library factories call this with a genuine F3 cell created by the host
 * (or later Builder producer), not with application-supplied cell implementations.
 * Allocation is empty/inert, finite and idempotent per exact cell identity. */
export function createCriteriaDateBundle<K extends Kind, S extends QuerySchema>(
  cell: CriteriaCommitCell<K, S>,
  builtins: DateEditorMessages = fixedDateMessages,
): CriteriaDateBundle<K, S> {
  const existing = cells.get(cell);
  if (existing) {
    // A fresh opaque bundle key may refer to the same finite tracked allocation.
    const key = Object.freeze({}) as CriteriaDateBundle<K, S>;
    bundles.set(key, existing);
    return key;
  }
  const root: Slots<K, S, RootValues> = {
    config: cell.createLocal<Configuration>("session"),
    family: cell.createLocal<Family>("session"),
    mode: cell.createLocal<Mode>("session"),
    operand: cell.createLocal<DateDraft<DateValue | DateRange>>("draft"),
    invalid: cell.createLocal<boolean>("session"),
    report: cell.createLocal<string>("session"),
    range: cell.createLocal<RootValues["range"]>("session"),
    candidate: cell.createLocal<StandaloneDate>("draft"),
    toolbarDraft: cell.createLocal<DateDraft<DateValue | DateRange>>("draft"),
    notice: cell.createLocal("notice"),
    open: cell.createLocal<boolean>("session"),
    contextKey: cell.createLocal<string>("session"),
    preparedActor: cell.createLocal<object>("session"),
  };
  const role = Object.fromEntries(
    parts.map((part) => [
      part,
      {
        day: cell.createLocal<CalendarDate>("session"),
        blocked: cell.createLocal<boolean>("session"),
        draft: cell.createLocal<DateDraft<DatePoint>>("draft"),
        text: cell.createLocal("text"),
        time: cell.createLocal<CalendarDateTime>("session"),
        error: cell.createLocal("notice"),
        clockBlocked: cell.createLocal<boolean>("session"),
        dirty: cell.createLocal<boolean>("session"),
        instantDay: cell.createLocal<DateDraft<DatePoint>>("draft"),
        clock: cell.createLocal<DateDraft<CalendarDateTime>>("draft"),
        controlsRevision: cell.createLocal<number>("session"),
        daySignature: cell.createLocal<string>("session"),
        timeSignature: cell.createLocal<string>("session"),
      },
    ]),
  ) as Readonly<Record<CriteriaDatePart, Slots<K, S, RoleValues>>>;
  const actualActor = (actor: object): CriteriaActor<K, S> => {
    const typed = actor as CriteriaActor<K, S>;
    cell.require(typed);
    return typed;
  };
  const live = (actor: CriteriaActor<K, S>) => {
    const committed = cell.require(actor),
      controller = committed.origin.controller;
    const definition = controller.getDefinition();
    cell.require(actor);
    // Real C's snapshot read is pure. Read it after the final origin/permission
    // gate, rather than carrying a snapshot across that gate's possible reentry.
    const state = controller.getSnapshot();
    if (definition !== committed.origin.definition) return deny();
    const ports = committed.ports;
    const registry = ports.registry;
    const overrides =
      cell.kind === "date"
        ? (ports as FilterDatePorts<S>).messages
        : (ports as FilterBuilderPorts<S>).dateMessages;
    const messages = Object.freeze({ ...builtins, ...overrides });
    return {
      definition,
      state,
      registry,
      messages,
      context: {
        locale: state.query.locale,
        timeZone: state.query.timeZone,
        evaluatedAt: state.evaluatedAt,
      },
    };
  };
  const bindingValue = (
    actor: CriteriaActor<K, S>,
    binding: CriteriaDateBinding,
  ) => {
    const current = live(actor),
      schema = current.definition.schema;
    const fieldId =
      binding.kind === "date"
        ? Object.entries(schema.fields).find(
            ([, field]) => field.owner === "date",
          )?.[0]
        : binding.fieldId;
    const field =
      fieldId && Object.hasOwn(schema.fields, fieldId)
        ? schema.fields[fieldId]
        : undefined;
    if (
      !field ||
      (field.type !== "date" && field.type !== "datetime") ||
      field.owner !== (binding.kind === "date" ? "date" : "builder")
    )
      return deny();
    let cardinality: "one" | "range",
      seed: DateValue | DateRange | null,
      accepted: unknown;
    if (binding.kind === "date") {
      if (cell.kind !== "date") return deny();
      cardinality = schema.date?.mode === "single" ? "one" : "range";
      accepted = current.state.query.date;
      seed =
        current.state.query.date?.operator ===
        (cardinality === "one" ? "date.on" : "date.between")
          ? current.state.query.date.value
          : null;
    } else {
      if (cell.kind !== "builder") return deny();
      // Captured omission stays omission even if a caller later pollutes the
      // ambient object prototype. Never resolve an optional owned input there.
      const intent = Object.hasOwn(binding, "draft")
        ? binding.draft
        : undefined;
      const descriptor = (
        intent
          ? getFieldOperators(
              schema,
              fieldId as BuilderFieldId<S>,
              current.registry ?? defaultOperatorRegistry,
            )
          : (current.registry ?? defaultOperatorRegistry).descriptors
      ).find((item) => item.id === binding.operator);
      if (
        !descriptor?.types.includes(field.type) ||
        (descriptor.cardinality !== "one" && descriptor.cardinality !== "range")
      )
        return deny();
      cardinality = descriptor.cardinality;
      const rule =
        binding.ruleId === null
          ? null
          : current.state.query.builder.rules.find(
              (item) => item.id === binding.ruleId,
            );
      if (intent) {
        if (binding.ruleId === null) {
          if (
            intent.baseline !== null ||
            current.state.query.builder.rules.some(
              (item) => item.id === intent.id,
            )
          )
            return deny();
        } else if (
          intent.id !== binding.ruleId ||
          intent.baseline === null ||
          !rule ||
          JSON.stringify(rule) !== intent.baseline
        )
          return deny();
      } else if (
        binding.ruleId !== null &&
        (!rule || rule.field !== fieldId || rule.operator !== binding.operator)
      )
        return deny();
      accepted = rule ?? null;
      // Legacy seeds come from the accepted rule; explicit targets use only the
      // captured parent seed. Neither is an operator/backend authorization API.
      seed = intent
        ? intent.value
        : rule && "value" in rule
          ? (rule.value as DateValue | DateRange)
          : null;
    }
    const baseline = canonicalJson([
      binding,
      fieldId,
      field,
      cardinality,
      accepted,
      current.context.locale,
      current.context.timeZone,
    ]);
    return { ...current, field, cardinality, seed, baseline };
  };
  const captureBinding = (
    actor: CriteriaActor<K, S>,
    input: CriteriaDateBinding,
  ): CriteriaDateBinding => {
    const initial = live(actor),
      version = cell.getSnapshot().version;
    let id: string | null = null;
    const check = () => {
      const current = live(actor);
      if (
        cell.getSnapshot().version !== version ||
        current.context.locale !== initial.context.locale ||
        current.context.timeZone !== initial.context.timeZone
      )
        return deny();
      if (
        id !== null &&
        JSON.stringify(
          current.state.query.builder.rules.find((rule) => rule.id === id),
        ) !==
          JSON.stringify(
            initial.state.query.builder.rules.find((rule) => rule.id === id),
          )
      )
        return deny();
    };
    const capture = new BindingCapture(check),
      source = capture.record(input),
      kind = capture.data(source, "kind");
    if (kind === "date") {
      check();
      return Object.freeze({ kind });
    }
    if (kind !== "builder" || cell.kind !== "builder") return deny();
    const ruleId = capture.data(source, "ruleId");
    if (ruleId !== null && (typeof ruleId !== "string" || !ruleId))
      return deny();
    id = ruleId;
    check();
    const supplied = capture.optional(source, "draft");
    let intent: {
        readonly id: string;
        readonly baseline: string | null;
      } | null = null,
      draftSource: object | null = null;
    if (supplied.present) {
      draftSource = capture.record(supplied.value);
      capture.keys(draftSource, ["id", "baseline", "value"]);
      const draftId = capture.data(draftSource, "id", true);
      if (typeof draftId !== "string" || !draftId) return deny();
      if (ruleId !== null && ruleId !== draftId) return deny();
      id = draftId;
      check();
      const baseline = capture.data(draftSource, "baseline", true);
      if (baseline !== null && typeof baseline !== "string") return deny();
      const accepted = initial.state.query.builder.rules.find(
        (rule) => rule.id === draftId,
      );
      if (
        ruleId === null
          ? baseline !== null || accepted !== undefined
          : baseline === null ||
            accepted === undefined ||
            JSON.stringify(accepted) !== baseline
      )
        return deny();
      intent = Object.freeze({ id: draftId, baseline });
      check();
    }
    const fieldId = capture.data(source, "fieldId"),
      operator = capture.data(source, "operator");
    if (
      typeof fieldId !== "string" ||
      !fieldId ||
      typeof operator !== "string" ||
      !operator
    )
      return deny();
    // Prove real target/provenance before reading the private seed descriptor.
    // This temporary owned empty seed is never stored, exposed or treated as C data.
    const target = Object.freeze({
      kind,
      fieldId,
      operator,
      ruleId,
      ...(intent ? { draft: Object.freeze({ ...intent, value: null }) } : {}),
    });
    bindingValue(actor, target);
    check();
    if (!intent || !draftSource) return target;
    const value = capture.wire(capture.data(draftSource, "value", true));
    check();
    return Object.freeze({
      ...target,
      draft: Object.freeze({ ...intent, value }),
    });
  };
  const put = <Value,>(
    slot: CriteriaLocalCell<K, S, Value>,
    actor: CriteriaActor<K, S>,
    value: Value,
  ) => {
    if (!Object.is(slot.read(actor), value)) slot.write(actor, value);
  };
  const draftPut = (
    slot: CriteriaLocalCell<K, S, DateDraft<DateValue | DateRange>>,
    actor: CriteriaActor<K, S>,
    value: DateDraft<DateValue | DateRange>,
  ) => {
    if (canonicalJson(slot.read(actor)) !== canonicalJson(value))
      slot.write(actor, value);
  };
  const clearRoles = (actor: CriteriaActor<K, S>) => {
    for (const part of parts)
      for (const slot of Object.values(role[part])) slot.clear(actor);
    root.range.clear(actor);
    root.report.clear(actor);
    root.invalid.clear(actor);
  };
  const close = (actor: CriteriaActor<K, S>) => {
    clearRoles(actor);
    root.config.clear(actor);
    root.family.clear(actor);
    root.mode.clear(actor);
    root.operand.clear(actor);
    root.candidate.clear(actor);
    root.toolbarDraft.clear(actor);
    root.open.clear(actor);
  };
  let bridge: Bridge;
  const family = (actor: CriteriaActor<K, S>, token: object): Family => {
    const result: Record<string, CriteriaDateStateHandle> = Object.create(null);
    for (const part of parts)
      for (const channel of channels) {
        const handle = Object.freeze({}) as CriteriaDateStateHandle;
        result[`${part}:${channel}`] = handle;
        handles.set(handle, {
          bridge,
          actor,
          token,
          part,
          channel,
          family: result,
          controlsRevision: role[part].controlsRevision.read(actor) ?? 0,
        });
      }
    return Object.freeze(result);
  };
  const cfg = (actor: CriteriaActor<K, S>, token?: object) => {
    const version = cell.getSnapshot().version;
    const value = root.config.read(actor);
    if (!value || (token && value.token !== token)) return deny();
    const current = bindingValue(actor, value.binding);
    if (
      current.baseline !== value.baseline ||
      cell.getSnapshot().version !== version
    )
      return deny();
    return { value, current };
  };
  const renew = (actor: CriteriaActor<K, S>) => {
    const value = root.config.read(actor);
    if (!value) return deny();
    const token = Object.freeze({});
    root.config.write(actor, Object.freeze({ ...value, token }));
    root.family.write(actor, family(actor, token));
  };
  const point = (
    actor: CriteriaActor<K, S>,
    part: CriteriaDatePart,
    next: DateDraft<DatePoint>,
  ) => {
    role[part].draft.write(actor, next);
    const current = cfg(actor),
      draft: DateDraft<DateValue | DateRange> =
        part === "point"
          ? next
          : (() => {
              const start = role.start.draft.read(actor) ?? empty,
                end = role.end.draft.read(actor) ?? empty;
              return start.status === "complete" && end.status === "complete"
                ? {
                    status: "complete",
                    value: [start.value, end.value] as DateRange,
                  }
                : {
                    status:
                      start.status === "invalid" || end.status === "invalid"
                        ? "invalid"
                        : start.status === "empty" && end.status === "empty"
                          ? "empty"
                          : "incomplete",
                    value: null,
                  };
            })();
    draftPut(root.operand, actor, draft);
    report(actor, current);
  };
  const report = (
    actor: CriteriaActor<K, S>,
    provided?: ReturnType<typeof cfg>,
  ) => {
    const current = provided ?? cfg(actor),
      draft = root.operand.read(actor) ?? empty;
    const signature = canonicalJson([
      draft,
      current.current.context.evaluatedAt,
    ]);
    if (root.report.read(actor) === signature) return;
    put(root.report, actor, signature);
    let next = draft;
    if (draft.status === "complete") {
      try {
        cell.require(actor);
        if (
          Array.isArray(draft.value) !==
          (current.value.cardinality === "range")
        )
          return deny();
        resolveDateOperand(current.value.field, draft.value, {
          locale: current.current.context.locale,
          timeZone: current.current.context.timeZone,
          now: current.current.context.evaluatedAt,
        });
        cfg(actor, current.value.token);
        put(root.invalid, actor, false);
      } catch {
        cfg(actor, current.value.token);
        put(root.invalid, actor, true);
        next = { status: "invalid", value: null };
      }
    } else put(root.invalid, actor, false);
    draftPut(root.toolbarDraft, actor, next);
    if (cell.kind === "date") {
      if (next.status === "complete")
        put<StandaloneDate>(
          root.candidate,
          actor,
          Array.isArray(next.value)
            ? { operator: "date.between", value: next.value as DateRange }
            : { operator: "date.on", value: next.value as DateValue },
        );
      else root.candidate.clear(actor);
    }
  };
  const combineInstant = (
    actor: CriteriaActor<K, S>,
    part: CriteriaDatePart,
  ) => {
    const current = cfg(actor),
      values = role[part];
    if (!values.dirty.read(actor)) return;
    const day = values.instantDay.read(actor) ?? empty,
      time = values.clock.read(actor) ?? empty;
    if (day.status !== "complete" || time.status !== "complete") {
      point(actor, part, {
        status:
          day.status === "invalid" || time.status === "invalid"
            ? "invalid"
            : "incomplete",
        value: null,
      });
      return;
    }
    try {
      const parsed = parseDate(day.value.value),
        wall = time.value.set({
          year: parsed.year,
          month: parsed.month,
          day: parsed.day,
        });
      const value = wallTimeWire(wall, current.current.context);
      cfg(actor, current.value.token);
      put(values.text, actor, value.value);
      put(values.error, actor, "");
      point(actor, part, { status: "complete", value });
    } catch {
      cfg(actor, current.value.token);
      put(values.error, actor, current.value.messages.ambiguousTime);
      point(actor, part, { status: "invalid", value: null });
    }
  };
  const initialize = (actor: CriteriaActor<K, S>, value: Configuration) => {
    const initial = value.seed;
    const mode: Mode = !initial
      ? "day"
      : Array.isArray(initial)
        ? initial[0]?.kind === "instant"
          ? "instant"
          : "day"
        : "kind" in initial &&
            (initial.kind === "relative" || initial.kind === "rolling")
          ? "relative"
          : "kind" in initial && initial.kind === "instant"
            ? "instant"
            : "day";
    put(root.mode, actor, mode);
    draftPut(
      root.operand,
      actor,
      initial ? { status: "complete", value: initial } : empty,
    );
    for (const part of parts) {
      const source = Array.isArray(initial)
        ? part === "start"
          ? initial[0]
          : part === "end"
            ? initial[1]
            : null
        : part === "point"
          ? initial
          : null;
      if (!source || (source.kind !== "day" && source.kind !== "instant"))
        continue;
      const values = role[part];
      values.draft.write(actor, { status: "complete", value: source });
      if (source.kind === "day")
        put(values.day, actor, parseDate(source.value));
      else {
        const context = live(actor).context,
          wall = instantWallTime(source, context);
        put(values.text, actor, source.value);
        put(values.time, actor, wall);
        put(values.day, actor, parseDate(wall.toString().slice(0, 10)));
        values.instantDay.write(actor, {
          status: "complete",
          value: { kind: "day", value: wall.toString().slice(0, 10) },
        });
        values.clock.write(actor, { status: "complete", value: wall });
      }
    }
    if (
      Array.isArray(initial) &&
      initial[0].kind === "day" &&
      initial[1].kind === "day"
    )
      put(root.range, actor, {
        start: parseDate(initial[0].value),
        end: parseDate(initial[1].value),
      });
  };
  bridge = Object.freeze({
    cell,
    prepare(opaque: object) {
      const actor = actualActor(opaque),
        current = live(actor);
      if (cell.kind === "date") {
        const field = Object.entries(current.definition.schema.fields).find(
          ([, item]) => item.owner === "date",
        );
        const key = canonicalJson([
          field ?? null,
          current.definition.schema.date?.mode ?? "range",
          current.context.locale,
          current.context.timeZone,
        ]);
        const prior = root.contextKey.read(actor);
        if (prior !== null && prior !== key) {
          close(actor);
          root.notice.clear(actor);
        }
        put(root.contextKey, actor, key);
      }
      const value = root.config.read(actor);
      if (value) {
        let actual: ReturnType<typeof bindingValue>;
        try {
          actual = bindingValue(actor, value.binding);
        } catch {
          close(actor);
          return;
        }
        if (actual.baseline !== value.baseline) {
          close(actor);
          return;
        }
        if (root.preparedActor.read(actor) !== actor) {
          root.config.write(
            actor,
            Object.freeze({
              ...value,
              messages: actual.messages,
              registry: actual.registry,
            }),
          );
          root.family.write(actor, family(actor, value.token));
        }
      }
      put(root.preparedActor, actor, actor);
    },
    begin(opaque: object, input: CriteriaDateBinding) {
      const actor = actualActor(opaque),
        binding = captureBinding(actor, input),
        actual = bindingValue(actor, binding);
      const token = Object.freeze({}),
        value: Configuration = Object.freeze({
          token,
          binding,
          field: actual.field,
          cardinality: actual.cardinality,
          baseline: actual.baseline,
          seed: actual.seed,
          messages: actual.messages,
          registry: actual.registry,
        });
      // Seed validation is Date-wire/bounds validation, not a Builder mutation or
      // custom-operator normalization. The parent retains final rule validation.
      if (cell.kind === "builder" && actual.seed !== null) {
        if (
          binding.kind === "builder" &&
          Object.hasOwn(binding, "draft") &&
          binding.draft &&
          Array.isArray(actual.seed) !== (actual.cardinality === "range")
        )
          return deny();
        resolveDateOperand(actual.field, actual.seed, {
          locale: actual.context.locale,
          timeZone: actual.context.timeZone,
          now: actual.context.evaluatedAt,
        });
        cell.require(actor);
      }
      const checked = bindingValue(actor, binding);
      if (
        checked.baseline !== actual.baseline ||
        checked.context.evaluatedAt !== actual.context.evaluatedAt
      )
        return deny();
      close(actor);
      root.config.write(actor, value);
      root.family.write(actor, family(actor, token));
      put(root.open, actor, true);
      root.notice.clear(actor);
      initialize(actor, value);
      if (
        binding.kind === "builder" &&
        Object.hasOwn(binding, "draft") &&
        binding.draft
      )
        report(actor);
      if (cell.kind === "date") {
        const date = actual.state.query.date;
        if (date) root.candidate.write(actor, date);
        draftPut(
          root.toolbarDraft,
          actor,
          date ? { status: "complete", value: date.value } : empty,
        );
      }
      const handle = root.family.read(actor)?.["point:operand"] ?? deny();
      cfg(actor, value.token);
      return handle;
    },
    close(opaque: object) {
      close(actualActor(opaque));
    },
    toolbar(opaque: object) {
      const actor = actualActor(opaque);
      let open = root.open.read(actor) === true;
      if (open) {
        try {
          cfg(actor);
        } catch {
          open = false;
        }
      }
      return {
        open,
        handle: open
          ? (root.family.read(actor)?.["point:operand"] ?? null)
          : null,
        candidate: open ? root.candidate.read(actor) : null,
        draft: open ? (root.toolbarDraft.read(actor) ?? empty) : empty,
        notice: root.notice.read(actor) ?? "",
      };
    },
    notice(opaque: object, value: string) {
      put(root.notice, actualActor(opaque), value);
    },
    preset(opaque: object, value: StandaloneDate) {
      const actor = actualActor(opaque);
      cfg(actor);
      put(root.candidate, actor, value);
      draftPut(root.toolbarDraft, actor, {
        status: "complete",
        value: value.value,
      });
    },
    guard(known: Entry) {
      const actor = actualActor(known.actor),
        current = cfg(actor, known.token),
        mode = root.mode.read(actor) ?? "day";
      if (
        (known.channel === "picker" && mode !== "day") ||
        (known.channel === "range" &&
          (mode !== "day" || current.value.cardinality !== "range")) ||
        ((known.channel === "instant" ||
          known.channel === "instant-day" ||
          known.channel === "time-observer") &&
          mode !== "instant")
      )
        return deny();
      if (known.part !== "point" && current.value.cardinality !== "range")
        return deny();
      if (
        current.value.cardinality === "range" &&
        known.part === "point" &&
        [
          "picker",
          "instant",
          "instant-day",
          "day-observer",
          "time-observer",
        ].includes(known.channel)
      )
        return deny();
      if (
        known.channel === "range-observer" &&
        (mode !== "day" || current.value.cardinality !== "range")
      )
        return deny();
      if (
        known.channel === "day-observer" &&
        mode !== "day" &&
        mode !== "instant"
      )
        return deny();
      if (
        (known.channel === "instant-day" ||
          known.channel === "time-observer" ||
          (known.channel === "day-observer" && mode === "instant")) &&
        known.controlsRevision !==
          (role[known.part].controlsRevision.read(actor) ?? 0)
      )
        return deny();
      cell.require(actor);
    },
    session(known: Entry) {
      // Identity-only completion fence, NOT a replacement for guard/permissions.
      // Own accepted Date dispatch may change the baseline before its old edit
      // is closed. A reentrant new edit must never be closed in its place.
      const actor = actualActor(known.actor),
        value = root.config.read(actor);
      if (known.channel !== "operand") return deny();
      if (known.bridge !== bridge || !value || value.token !== known.token)
        return deny();
      cell.require(actor);
    },
    snapshot(known: Entry) {
      this.guard(known);
      const actor = actualActor(known.actor),
        current = cfg(actor, known.token),
        values = role[known.part];
      const result = {
        field: current.value.field,
        context: current.current.context,
        messages: current.value.messages,
        cardinality: current.value.cardinality,
        mode: root.mode.read(actor) ?? "day",
        part: known.part,
        channel: known.channel,
        draft: root.operand.read(actor) ?? empty,
        invalid: root.invalid.read(actor) ?? false,
        day: values.day.read(actor),
        range: root.range.read(actor),
        text: values.text.read(actor) ?? "",
        time: values.time.read(actor),
        error: values.error.read(actor) ?? "",
        controlsRevision: values.controlsRevision.read(actor) ?? 0,
      };
      this.guard(known);
      return result;
    },
    mode(known: Entry, value: Mode) {
      this.guard(known);
      if (known.channel !== "operand") return deny();
      const actor = actualActor(known.actor),
        current = cfg(actor, known.token);
      if (
        (value === "instant" && current.value.field.type !== "datetime") ||
        (value === "relative" && current.value.cardinality !== "one")
      )
        return deny();
      if (root.mode.read(actor) === value) return;
      clearRoles(actor);
      put(root.mode, actor, value);
      draftPut(root.operand, actor, empty);
      draftPut(root.toolbarDraft, actor, empty);
      root.candidate.clear(actor);
      renew(actor);
    },
    picker(known: Entry, value: CalendarDate | null) {
      this.guard(known);
      if (known.channel !== "picker" && known.channel !== "instant-day")
        return deny();
      const actor = actualActor(known.actor),
        values = role[known.part];
      if (!values.blocked.read(actor)) {
        if (value) put(values.day, actor, value);
        else values.day.clear(actor);
      }
    },
    rangePicker(known: Entry, value: RootValues["range"] | null) {
      this.guard(known);
      if (known.channel !== "range") return deny();
      const actor = actualActor(known.actor);
      if (!role.start.blocked.read(actor) && !role.end.blocked.read(actor)) {
        if (value) put(root.range, actor, value);
        else root.range.clear(actor);
      }
    },
    editing(known: Entry, part: CriteriaDatePart = known.part) {
      this.guard(known);
      if (
        known.channel === "range"
          ? part !== "start" && part !== "end"
          : (known.channel !== "picker" && known.channel !== "instant-day") ||
            part !== known.part
      )
        return deny();
      const actor = actualActor(known.actor);
      put(role[part].blocked, actor, false);
      if (known.channel === "instant-day") {
        role[part].instantDay.write(actor, {
          status: "incomplete",
          value: null,
        });
        combineInstant(actor, part);
      } else {
        draftPut(root.operand, actor, { status: "incomplete", value: null });
        report(actor);
      }
    },
    calendar(known: Entry, value: CalendarDate | RootValues["range"]) {
      this.guard(known);
      if (!["picker", "instant-day", "range"].includes(known.channel))
        return deny();
      const actor = actualActor(known.actor);
      if ("start" in value) {
        if (known.channel !== "range") return deny();
        put(role.start.blocked, actor, false);
        put(role.end.blocked, actor, false);
        put(root.range, actor, value);
        role.start.draft.write(actor, {
          status: "complete",
          value: dayWire(value.start),
        });
        point(actor, "end", { status: "complete", value: dayWire(value.end) });
      } else {
        if (known.channel === "range") return deny();
        put(role[known.part].blocked, actor, false);
        put(role[known.part].day, actor, toCalendarDate(value));
        const draft = { status: "complete", value: dayWire(value) } as const;
        if (known.channel === "instant-day") {
          role[known.part].instantDay.write(actor, draft);
          combineInstant(actor, known.part);
        } else point(actor, known.part, draft);
      }
    },
    text(known: Entry, value: string) {
      this.guard(known);
      if (known.channel !== "instant") return deny();
      const actor = actualActor(known.actor),
        current = cfg(actor, known.token),
        values = role[known.part];
      put(values.dirty, actor, false);
      put(values.text, actor, value);
      put(values.error, actor, "");
      const parsed = parseInstantInput(
        value,
        current.value.field,
        current.current.context,
      );
      this.guard(known);
      if (parsed) {
        const wall = instantWallTime(parsed, current.current.context);
        this.guard(known);
        values.instantDay.write(actor, {
          status: "complete",
          value: { kind: "day", value: wall.toString().slice(0, 10) },
        });
        values.clock.write(actor, { status: "complete", value: wall });
        put(values.day, actor, parseDate(wall.toString().slice(0, 10)));
        put(values.blocked, actor, false);
        put(values.clockBlocked, actor, false);
        put(values.time, actor, wall);
        put(
          values.controlsRevision,
          actor,
          (values.controlsRevision.read(actor) ?? 0) + 1,
        );
        point(actor, known.part, { status: "complete", value: parsed });
        // Reset only the explicitly edited convenience-control generation.
        // The freeform input and overall edit token remain the same lifetime.
        root.family.write(actor, family(actor, current.value.token));
      } else
        point(actor, known.part, {
          status: value === "" ? "empty" : "invalid",
          value: null,
        });
    },
    time(known: Entry, value: CalendarDateTime | null) {
      this.guard(known);
      if (known.channel !== "instant") return deny();
      const actor = actualActor(known.actor),
        values = role[known.part];
      if (!values.clockBlocked.read(actor)) {
        if (value) put(values.time, actor, value);
        else values.time.clear(actor);
      }
    },
    dirty(known: Entry) {
      this.guard(known);
      if (known.channel !== "instant") return deny();
      put(role[known.part].dirty, actualActor(known.actor), true);
    },
    timeEditing(known: Entry) {
      this.guard(known);
      if (known.channel !== "instant") return deny();
      const actor = actualActor(known.actor);
      put(role[known.part].clockBlocked, actor, false);
      role[known.part].clock.write(actor, {
        status: "incomplete",
        value: null,
      });
      draftPut(root.operand, actor, { status: "incomplete", value: null });
      report(actor);
    },
    observe(
      known: Entry,
      signature: string,
      value: DateDraft<VendorDateValue>,
    ) {
      this.guard(known);
      if (
        !["day-observer", "range-observer", "time-observer"].includes(
          known.channel,
        )
      )
        return deny();
      const actor = actualActor(known.actor),
        values = role[known.part],
        time = known.channel === "time-observer",
        signatureSlot = time ? values.timeSignature : values.daySignature;
      if (signatureSlot.read(actor) === signature) return;
      put(signatureSlot, actor, signature);
      if (time) {
        if (value.status === "invalid") put(values.clockBlocked, actor, true);
        values.clock.write(
          actor,
          value.status === "complete"
            ? values.clockBlocked.read(actor)
              ? { status: "invalid", value: null }
              : { status: "complete", value: toCalendarDateTime(value.value) }
            : value,
        );
        combineInstant(actor, known.part);
      } else {
        if (value.status === "invalid") put(values.blocked, actor, true);
        const next: DateDraft<DatePoint> =
          value.status === "complete"
            ? values.blocked.read(actor)
              ? { status: "invalid", value: null }
              : {
                  status: "complete",
                  value: dayWire(toCalendarDate(value.value)),
                }
            : value;
        if (root.mode.read(actor) === "instant") {
          values.instantDay.write(actor, next);
          combineInstant(actor, known.part);
        } else point(actor, known.part, next);
      }
    },
    revalidate(known: Entry) {
      this.guard(known);
      if (known.channel !== "operand") return deny();
      report(actualActor(known.actor));
    },
    operand(known: Entry, value: DateDraft<DateValue | DateRange>) {
      this.guard(known);
      if (known.channel !== "operand") return deny();
      const actor = actualActor(known.actor);
      draftPut(root.operand, actor, value);
      report(actor);
    },
    version: () => cell.getSnapshot().version,
    subscribe: cell.subscribe,
  });
  const key = Object.freeze({}) as CriteriaDateBundle<K, S>;
  bundles.set(key, bridge);
  cells.set(cell, bridge);
  return key;
}

/** Host-only actual-commit bridge; no application/reset callback is registered.
 * Search/Tabs never call it. Runtime erasure is immediately checked by the
 * registered factory record and real cell.require of the exact actor. */
export function prepareCriteriaDateCell(cell: object, actor: object): void {
  const known = cells.get(cell);
  if (!known) deny();
  known.prepare(actor);
}
export function reconcileCriteriaDateBundle<
  K extends Kind,
  S extends QuerySchema,
>(
  bundle: CriteriaDateBundle<K, S>,
  actor: CriteriaActor<NoInfer<K>, NoInfer<S>>,
): void {
  bundleRecord(bundle).prepare(actor);
}
export function beginCriteriaDateEdit<K extends Kind, S extends QuerySchema>(
  bundle: CriteriaDateBundle<K, S>,
  actor: CriteriaActor<NoInfer<K>, NoInfer<S>>,
  binding: CriteriaDateBinding = { kind: "date" },
): CriteriaDateStateHandle {
  return bundleRecord(bundle).begin(actor, binding);
}
export function closeCriteriaDateEdit<K extends Kind, S extends QuerySchema>(
  bundle: CriteriaDateBundle<K, S>,
  actor: CriteriaActor<NoInfer<K>, NoInfer<S>>,
): void {
  bundleRecord(bundle).close(actor);
}
export function readCriteriaDateToolbar<K extends Kind, S extends QuerySchema>(
  bundle: CriteriaDateBundle<K, S>,
  actor: CriteriaActor<NoInfer<K>, NoInfer<S>>,
): CriteriaDateToolbarState {
  return bundleRecord(bundle).toolbar(actor);
}
export function setCriteriaDateNotice<K extends Kind, S extends QuerySchema>(
  bundle: CriteriaDateBundle<K, S>,
  actor: CriteriaActor<NoInfer<K>, NoInfer<S>>,
  value: string,
): void {
  bundleRecord(bundle).notice(actor, value);
}
export function selectCriteriaDatePreset<K extends Kind, S extends QuerySchema>(
  bundle: CriteriaDateBundle<K, S>,
  actor: CriteriaActor<NoInfer<K>, NoInfer<S>>,
  value: StandaloneDate,
): void {
  bundleRecord(bundle).preset(actor, value);
}
export function requireCriteriaDateState(
  handle: CriteriaDateStateHandle,
): void {
  entry(handle);
}
/** Root completion only: actual actor + exact still-allocated edit token. The
 * caller must independently require actual ports/current owner/baseline and the
 * accepted result. Nested reads/actions always use the stricter full guard. */
export function requireCriteriaDateSession(
  handle: CriteriaDateStateHandle,
): void {
  const known = object(handle) ? handles.get(handle) : undefined;
  if (!known) deny();
  known.bridge.session(known);
}
export function readCriteriaDateState(
  handle: CriteriaDateStateHandle,
): Snapshot {
  const known = entry(handle);
  return known.bridge.snapshot(known);
}
export function criteriaDateChild(
  handle: CriteriaDateStateHandle,
  part: CriteriaDatePart,
  channel: CriteriaDateChannel,
): CriteriaDateStateHandle {
  const known = entry(handle);
  if (known.channel !== "operand") {
    const child =
      known.channel === "range"
        ? (part === "start" || part === "end") && channel === "range-observer"
        : part === known.part &&
          (((known.channel === "picker" || known.channel === "instant-day") &&
            channel === "day-observer") ||
            (known.channel === "instant" &&
              (channel === "instant-day" || channel === "time-observer")));
    if (!child) return deny();
  }
  return known.family[`${part}:${channel}`] ?? deny();
}
export const criteriaDateState = Object.freeze({
  mode(handle: CriteriaDateStateHandle, value: Mode) {
    const known = entry(handle);
    known.bridge.mode(known, value);
  },
  picker(handle: CriteriaDateStateHandle, value: CalendarDate | null) {
    const known = entry(handle);
    known.bridge.picker(known, value);
  },
  range(handle: CriteriaDateStateHandle, value: RootValues["range"] | null) {
    const known = entry(handle);
    known.bridge.rangePicker(known, value);
  },
  editing(handle: CriteriaDateStateHandle, part?: CriteriaDatePart) {
    const known = entry(handle);
    known.bridge.editing(known, part);
  },
  calendar(
    handle: CriteriaDateStateHandle,
    value: CalendarDate | RootValues["range"],
  ) {
    const known = entry(handle);
    known.bridge.calendar(known, value);
  },
  text(handle: CriteriaDateStateHandle, value: string) {
    const known = entry(handle);
    known.bridge.text(known, value);
  },
  time(handle: CriteriaDateStateHandle, value: CalendarDateTime | null) {
    const known = entry(handle);
    known.bridge.time(known, value);
  },
  dirty(handle: CriteriaDateStateHandle) {
    const known = entry(handle);
    known.bridge.dirty(known);
  },
  timeEditing(handle: CriteriaDateStateHandle) {
    const known = entry(handle);
    known.bridge.timeEditing(known);
  },
  observe(
    handle: CriteriaDateStateHandle,
    signature: string,
    value: DateDraft<VendorDateValue>,
  ) {
    const known = entry(handle);
    known.bridge.observe(known, signature, value);
  },
  receive(handle: CriteriaDateStateHandle, value: DateDraft<VendorDateValue>) {
    const known = entry(handle);
    const signature = canonicalJson([
      value.status,
      value.status === "complete" ? value.value.toString() : null,
    ]);
    known.bridge.guard(known);
    known.bridge.observe(known, signature, value);
  },
  revalidate(handle: CriteriaDateStateHandle) {
    const known = entry(handle);
    known.bridge.revalidate(known);
  },
  operand(
    handle: CriteriaDateStateHandle,
    value: DateDraft<DateValue | DateRange>,
  ) {
    const known = entry(handle);
    known.bridge.operand(known, value);
  },
});

export function useCriteriaDateVersion(
  handle: CriteriaDateStateHandle,
): object {
  const known = object(handle) ? handles.get(handle) : undefined;
  const [emptyVersion] = useState(() => Object.freeze({}));
  return useSyncExternalStore(
    known?.bridge.subscribe ?? emptySubscribe,
    known?.bridge.version ?? (() => emptyVersion),
    known?.bridge.version ?? (() => emptyVersion),
  );
}
const emptySubscribe = () => () => {};
/** Own-data discriminant only. Unknown/proxied handles are never traversed. */
function candidate(
  input: unknown,
):
  | { kind: "legacy" | "denied" }
  | { kind: "known"; handle: CriteriaDateStateHandle } {
  try {
    if (!object(input)) return { kind: "denied" };
    const descriptor = Object.getOwnPropertyDescriptor(input, "criteriaState");
    if (!descriptor)
      return {
        kind: Reflect.has(input, "criteriaState") ? "denied" : "legacy",
      };
    if (
      !Object.hasOwn(descriptor, "value") ||
      !object(descriptor.value) ||
      !handles.has(descriptor.value)
    )
      return { kind: "denied" };
    return {
      kind: "known",
      handle: descriptor.value as CriteriaDateStateHandle,
    };
  } catch {
    return { kind: "denied" };
  }
}
/** Route metadata only in React. Actual private values stay in F3 slots. No
 * constructor/render pin; a supplied handle is neutral until its first layout. */
export function useCriteriaDateRoute(
  input: unknown,
):
  | { kind: "legacy" | "denied" }
  | { kind: "adopted"; handle: CriteriaDateStateHandle } {
  const [pin] = useState(() => {
    let mode: "legacy" | "adopted" | null = null,
      ready = false,
      version: object = Object.freeze({});
    const listeners = new Set<() => void>();
    const publish = () => {
      version = Object.freeze({});
      for (const listener of [...listeners]) listener();
    };
    return {
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      snapshot: () => version,
      mode: () => mode,
      ready: () => ready,
      commit: (value: ReturnType<typeof candidate>) => {
        if (value.kind === "legacy" && mode !== "adopted") {
          mode = "legacy";
          return;
        }
        if (value.kind !== "known" || mode === "legacy") {
          if (ready) {
            ready = false;
            publish();
          }
          return;
        }
        try {
          requireCriteriaDateState(value.handle);
          mode = "adopted";
          if (!ready) {
            ready = true;
            publish();
          }
        } catch {
          if (ready) {
            ready = false;
            publish();
          }
        }
      },
      disconnect: () => {
        if (ready) {
          ready = false;
          publish();
        }
      },
    };
  });
  useSyncExternalStore(pin.subscribe, pin.snapshot, pin.snapshot);
  const value = candidate(input);
  useLayoutEffect(() => () => pin.disconnect(), [pin]);
  useLayoutEffect(() => {
    pin.commit(value);
  });
  if (value.kind === "legacy" && pin.mode() !== "adopted")
    return { kind: "legacy" };
  if (value.kind !== "known" || pin.mode() === "legacy" || !pin.ready())
    return { kind: "denied" };
  return { kind: "adopted", handle: value.handle };
}
