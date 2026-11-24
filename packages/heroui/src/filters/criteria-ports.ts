import type {
  AnyCustomOperator,
  DatePoint,
  DateValue,
  FieldType,
  OperatorDescriptor,
  OperatorRegistry,
  QueryFor,
  QuerySchema,
  RelativePreset,
  ScalarId,
} from "@tableweave/react/contracts";
import type { BuilderFieldId, FilterOption } from "@tableweave/react/filters";
import type { DateEditorMessages } from "../date/date-types.js";
import type {
  FilterDateMessages,
  FilterDateProps,
} from "../toolbar/filter-date.js";
import type {
  FilterSearchMessages,
  FilterSearchProps,
} from "../toolbar/filter-search.js";
import type {
  FilterTabPresentation,
  FilterTabsMessages,
  FilterTabsProps,
} from "../toolbar/filter-tabs.js";
import type {
  FilterBuilderMessages,
  FilterBuilderProps,
  FilterFieldPresentation,
  FilterOptionPort,
} from "./types.js";

/** Internal future actor check, NOT a public permission prop or provenance proof. */
export type CriteriaPortsCheck = () => undefined;

/** Preserve own optional undefined where the existing component actually allows it. */
type Owned<T> = T extends object
  ? {
      readonly [K in keyof T]: {} extends Pick<T, K> ? T[K] | undefined : T[K];
    }
  : T;
type SearchInput<S extends QuerySchema> = Pick<
  FilterSearchProps<S>,
  "messages" | "onMutation"
>;
type TabsInput<S extends QuerySchema> = Pick<
  FilterTabsProps<S>,
  "tabs" | "neutralTab" | "activation" | "messages" | "children" | "onMutation"
>;
type DateInput<S extends QuerySchema> = Pick<
  FilterDateProps<S>,
  "registry" | "presets" | "messages" | "onMutation"
>;
type BuilderInput<S extends QuerySchema> = Pick<
  FilterBuilderProps<S>,
  | "evaluationMode"
  | "fields"
  | "registry"
  | "messages"
  | "dateMessages"
  | "createRuleId"
  | "onMutation"
>;

type OwnedMessages<T extends { readonly messages?: object }> = Omit<
  Owned<T>,
  "messages"
> & {
  readonly messages?: Readonly<NonNullable<T["messages"]>> | undefined;
};
export type FilterSearchPorts<S extends QuerySchema> = OwnedMessages<
  SearchInput<S>
>;
export type FilterTabsPorts<S extends QuerySchema> = OwnedMessages<
  TabsInput<S>
>;
export type FilterDatePorts<S extends QuerySchema> = OwnedMessages<
  DateInput<S>
>;
export type FilterFieldPorts<S extends QuerySchema> = Owned<
  FilterFieldPresentation<S>
>;
export type FilterBuilderPorts<S extends QuerySchema> = Omit<
  OwnedMessages<BuilderInput<S>>,
  "fields" | "dateMessages"
> & {
  readonly fields: Readonly<
    Partial<Record<BuilderFieldId<S>, FilterFieldPorts<S> | undefined>>
  >;
  readonly dateMessages?:
    | Readonly<NonNullable<FilterBuilderProps<S>["dateMessages"]>>
    | undefined;
};

export class CriteriaPortsError extends Error {
  readonly code = "criteria.ports.unavailable";
  constructor() {
    super("Criteria UI ports are unavailable.");
    this.name = "CriteriaPortsError";
  }
}
function deny(): never {
  throw new CriteriaPortsError();
}
function gate(check: CriteriaPortsCheck): void {
  try {
    if (
      typeof check !== "function" ||
      Reflect.apply(check, undefined, []) !== undefined
    )
      deny();
  } catch {
    deny();
  }
}

type Callable = (...args: never[]) => unknown;
type Receiver =
  | { readonly kind: "bare" }
  | {
      readonly kind: "fixed" | "member-or-bare" | "messages";
      readonly owner: object;
    };
type Slot =
  | { readonly present: false }
  | { readonly present: true; readonly value: unknown };
type MessageSchema<T> = {
  readonly [K in keyof T]-?: T[K] extends Callable ? "callback" : "text";
};

const commonMessages = {
  unavailable: "text",
  invalidConfiguration: "text",
  submitted: "text",
  failed: "text",
} as const;
const searchMessages = {
  ...commonMessages,
  label: "text",
  placeholder: "text",
  clearLabel: "text",
  cancelled: "text",
  invalidValue: "text",
} as const satisfies MessageSchema<FilterSearchMessages>;
const tabsMessages = {
  ...commonMessages,
  label: "text",
  previousTabsLabel: "text",
  nextTabsLabel: "text",
} as const satisfies MessageSchema<FilterTabsMessages>;
const editorMessages = {
  pointLabel: "text",
  startLabel: "text",
  endLabel: "text",
  timeLabel: "text",
  exactInstantLabel: "text",
  exactInstantHint: "text",
  modeLabel: "text",
  dayModeLabel: "text",
  instantModeLabel: "text",
  relativeModeLabel: "text",
  presetsLabel: "text",
  chooseDateLabel: "text",
  previousMonthLabel: "text",
  nextMonthLabel: "text",
  invalidValue: "text",
  incompleteValue: "text",
  ambiguousTime: "text",
  formatRelative: "callback",
} as const satisfies MessageSchema<DateEditorMessages>;
const dateMessages = {
  ...commonMessages,
  ...editorMessages,
  label: "text",
  applyLabel: "text",
  cancelLabel: "text",
  clearLabel: "text",
  emptySummary: "text",
  formatSummary: "callback",
  formatTimeZone: "callback",
} as const satisfies MessageSchema<FilterDateMessages>;
const builderMessages = {
  filters: "text",
  addRule: "text",
  field: "text",
  operator: "text",
  value: "text",
  options: "text",
  all: "text",
  any: "text",
  join: "text",
  clear: "text",
  clearLabel: "text",
  duplicate: "text",
  negate: "text",
  remove: "text",
  cancel: "text",
  apply: "text",
  editorTitle: "text",
  chooseField: "text",
  chooseOperator: "text",
  chooseValue: "text",
  searchFields: "text",
  searchOptions: "text",
  loading: "text",
  emptyOptions: "text",
  optionsFailed: "text",
  retry: "text",
  nextOptions: "text",
  noFields: "text",
  incomplete: "text",
  invalid: "text",
  mutationFailed: "text",
  staleDraft: "text",
  submitted: "text",
  applied: "text",
  removed: "text",
  cleared: "text",
  accessUnavailable: "text",
  unavailableValue: "text",
  customEditorMissing: "text",
  from: "text",
  to: "text",
} as const satisfies MessageSchema<FilterBuilderMessages>;
const fieldTypes: readonly FieldType[] = [
  "text",
  "number",
  "enum",
  "set",
  "boolean",
  "date",
  "datetime",
];
const relativePresets: readonly RelativePreset[] = [
  "today",
  "yesterday",
  "tomorrow",
  "thisWeek",
  "lastWeek",
  "nextWeek",
  "thisMonth",
  "lastMonth",
  "nextMonth",
  "thisYear",
  "lastYear",
  "nextYear",
];

/** One capture operation owns all reflection/alias/wrapper caches. No global latest refs. */
class Capture {
  private readonly descriptors = new WeakMap<
    object,
    Map<PropertyKey, PropertyDescriptor | undefined>
  >();
  private readonly prototypes = new WeakMap<object, unknown>();
  private readonly inherited = new WeakMap<object, Map<PropertyKey, boolean>>();
  private readonly keys = new WeakMap<object, readonly PropertyKey[]>();
  private readonly containers = new WeakMap<object, Map<string, object>>();
  private readonly originals = new WeakMap<object, object>();
  private readonly wrappers = new WeakMap<
    Callable,
    Map<object, Map<Receiver["kind"], Callable>>
  >();
  private readonly bare = {};

  constructor(private readonly check: CriteriaPortsCheck) {
    this.ensure();
  }
  ensure(): void {
    gate(this.check);
  }
  reflect<T>(read: () => T): T {
    this.ensure();
    try {
      return read();
    } catch {
      return deny();
    } finally {
      this.ensure();
    }
  }
  object(input: unknown): object {
    this.ensure();
    if (
      input === null ||
      typeof input !== "object" ||
      this.reflect(() => Array.isArray(input))
    )
      return deny();
    if (!this.prototypes.has(input))
      this.prototypes.set(
        input,
        this.reflect(() => Object.getPrototypeOf(input)),
      );
    const prototype = this.prototypes.get(input);
    if (prototype !== null && prototype !== Object.prototype) return deny();
    return input;
  }
  slot(input: object, key: PropertyKey): Slot {
    this.ensure();
    let entries = this.descriptors.get(input);
    if (!entries) {
      entries = new Map();
      this.descriptors.set(input, entries);
    }
    if (!entries.has(key))
      entries.set(
        key,
        this.reflect(() => Object.getOwnPropertyDescriptor(input, key)),
      );
    const descriptor = entries.get(key);
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
      if (inherited.get(key)) return deny();
      return { present: false };
    }
    if (!Object.hasOwn(descriptor, "value")) return deny();
    return { present: true, value: descriptor.value };
  }
  required(input: object, key: PropertyKey): unknown {
    const slot = this.slot(input, key);
    return slot.present ? slot.value : deny();
  }
  names(input: object): readonly string[] {
    this.ensure();
    if (!this.keys.has(input))
      this.keys.set(
        input,
        this.reflect(() => Reflect.ownKeys(input)),
      );
    const keys = this.keys.get(input) ?? [];
    if (keys.some((key) => typeof key !== "string")) return deny();
    return keys as readonly string[];
  }
  owned<T extends object>(input: object, role: string, build: () => T): T {
    this.ensure();
    let roles = this.containers.get(input);
    if (!roles) {
      roles = new Map();
      this.containers.set(input, roles);
    }
    const previous = roles.get(role);
    if (previous) return previous as T;
    const result = build();
    this.ensure();
    roles.set(role, result);
    this.originals.set(result, input);
    return Object.freeze(result);
  }
  put(output: object, key: PropertyKey, value: unknown): void {
    Object.defineProperty(output, key, {
      value,
      enumerable: true,
      configurable: false,
      writable: false,
    });
  }
  optional(
    input: object,
    output: object,
    key: string,
    copy: (value: unknown) => unknown,
  ): void {
    const slot = this.slot(input, key);
    if (slot.present)
      this.put(
        output,
        key,
        slot.value === undefined ? undefined : copy(slot.value),
      );
  }
  text(input: unknown): string {
    if (typeof input !== "string") return deny();
    return input;
  }
  number(input: unknown): number {
    if (typeof input !== "number" || !Number.isFinite(input)) return deny();
    return input;
  }
  boolean(input: unknown): boolean {
    if (typeof input !== "boolean") return deny();
    return input;
  }
  enum<T extends string>(input: unknown, values: readonly T[]): T {
    if (typeof input !== "string" || !values.includes(input as T))
      return deny();
    return input as T;
  }
  array<T>(
    input: unknown,
    role: string,
    item: (value: unknown) => T,
  ): readonly T[] {
    this.ensure();
    if (!this.reflect(() => Array.isArray(input))) return deny();
    const array = input as object;
    return this.owned(array, role, () => {
      const length = this.required(array, "length");
      if (typeof length !== "number" || !Number.isInteger(length) || length < 0)
        return deny();
      const result: T[] = [];
      for (let index = 0; index < length; index++)
        result.push(item(this.required(array, String(index))));
      return result;
    });
  }
  callback<F extends Callable>(input: unknown, receiver: Receiver): F {
    this.ensure();
    if (typeof input !== "function") return deny();
    const fn = input as Callable;
    let receivers = this.wrappers.get(fn);
    if (!receivers) {
      receivers = new Map();
      this.wrappers.set(fn, receivers);
    }
    const owner = receiver.kind === "bare" ? this.bare : receiver.owner;
    let modes = receivers.get(owner);
    if (!modes) {
      modes = new Map();
      receivers.set(owner, modes);
    }
    const previous = modes.get(receiver.kind);
    if (previous) return previous as F;
    const capture = this;
    const wrapped = function (this: unknown, ...args: never[]): unknown {
      capture.ensure();
      let target: unknown;
      if (receiver.kind === "fixed") target = receiver.owner;
      else if (receiver.kind === "member-or-bare")
        target = this === undefined ? undefined : receiver.owner;
      else if (receiver.kind === "messages") {
        // Direct partial-dictionary calls retain their original object. Merged
        // message calls retain the actual component-created merged receiver;
        // defaults stay with that component, never reconstructed in this module.
        target =
          this !== null &&
          typeof this === "object" &&
          capture.originals.get(this) === receiver.owner
            ? receiver.owner
            : this;
      }
      try {
        try {
          return Reflect.apply(fn, target, args);
        } finally {
          capture.ensure();
        }
      } catch {
        return deny();
      }
    };
    modes.set(receiver.kind, wrapped);
    return wrapped as F;
  }
  messages<T extends object>(
    input: unknown,
    schema: MessageSchema<T>,
    role: string,
  ): Readonly<Partial<T>> {
    const source = this.object(input);
    return this.owned(source, role, () => {
      const output = Object.create(null) as Partial<T>;
      for (const key of Object.keys(schema) as (keyof T & string)[]) {
        const slot = this.slot(source, key);
        if (!slot.present) continue;
        // Required message overrides cannot replace a default with an invalid
        // undefined callable/text value. Root optional undefined is separate.
        this.put(
          output,
          key,
          schema[key] === "callback"
            ? this.callback(slot.value, { kind: "messages", owner: source })
            : this.text(slot.value),
        );
      }
      return output;
    });
  }
  labels(input: unknown): Readonly<Record<string, string>> {
    const source = this.object(input);
    return this.owned(source, "operator-labels", () => {
      const output: Record<string, string> = Object.create(null);
      for (const key of this.names(source))
        this.put(output, key, this.text(this.required(source, key)));
      return output;
    });
  }
  choice(input: unknown): FilterOption<ScalarId> {
    const source = this.object(input);
    return this.owned(source, "choice", () => {
      const id = this.required(source, "id");
      if (
        typeof id !== "string" &&
        (typeof id !== "number" || !Number.isFinite(id))
      )
        return deny();
      const output = { id, label: this.text(this.required(source, "label")) };
      this.optional(source, output, "disabled", (value) => this.boolean(value));
      return output;
    });
  }
  option(input: unknown): Owned<FilterOptionPort> {
    const source = this.object(input);
    return this.owned(source, "option-port", () => {
      const exactSource = this.required(source, "source");
      // Opaque identity only. F2, not this capture, proves genuine source ownership.
      if (exactSource === null || typeof exactSource !== "object")
        return deny();
      const output = {
        source: exactSource,
        onRequest: this.callback<FilterOptionPort["onRequest"]>(
          this.required(source, "onRequest"),
          { kind: "member-or-bare", owner: source },
        ),
      };
      this.optional(source, output, "idType", (value) =>
        this.enum(value, ["number", "string", "scalar"]),
      );
      this.optional(source, output, "nextPageKey", (value) =>
        this.callback<NonNullable<FilterOptionPort["nextPageKey"]>>(value, {
          kind: "fixed",
          owner: source,
        }),
      );
      return output as Owned<FilterOptionPort>;
    });
  }
  presentation<S extends QuerySchema>(input: unknown): FilterFieldPorts<S> {
    const source = this.object(input);
    return this.owned(source, "field-presentation", () => {
      const output = { label: this.text(this.required(source, "label")) };
      this.optional(source, output, "operatorLabels", (value) =>
        this.labels(value),
      );
      this.optional(source, output, "choices", (value) =>
        this.array(value, "choices", (item) => this.choice(item)),
      );
      this.optional(source, output, "asyncOptions", (value) =>
        this.option(value),
      );
      this.optional(source, output, "formatValue", (value) =>
        this.callback<NonNullable<FilterFieldPresentation<S>["formatValue"]>>(
          value,
          { kind: "fixed", owner: source },
        ),
      );
      this.optional(source, output, "renderEditor", (value) =>
        this.callback<NonNullable<FilterFieldPresentation<S>["renderEditor"]>>(
          value,
          { kind: "fixed", owner: source },
        ),
      );
      return output;
    });
  }
  custom(input: unknown): AnyCustomOperator {
    const source = this.object(input);
    return this.owned(source, "custom-operator", () => {
      const output = {
        id: this.text(this.required(source, "id")),
        labelKey: this.text(this.required(source, "labelKey")),
        types: this.array(
          this.required(source, "types"),
          "field-types",
          (value) => this.enum(value, fieldTypes),
        ),
        cardinality: this.enum(this.required(source, "cardinality"), [
          "none",
          "one",
          "many",
          "range",
        ] as const),
        validate: this.callback<AnyCustomOperator["validate"]>(
          this.required(source, "validate"),
          { kind: "fixed", owner: source },
        ),
      };
      this.optional(source, output, "inverse", (value) => this.text(value));
      this.optional(source, output, "normalize", (value) =>
        this.callback<NonNullable<AnyCustomOperator["normalize"]>>(value, {
          kind: "fixed",
          owner: source,
        }),
      );
      this.optional(source, output, "evaluate", (value) =>
        this.callback<NonNullable<AnyCustomOperator["evaluate"]>>(value, {
          kind: "fixed",
          owner: source,
        }),
      );
      return output;
    });
  }
  descriptor(input: unknown): OperatorDescriptor {
    const source = this.object(input);
    return this.owned(source, "operator-descriptor", () => {
      const output = {
        id: this.text(this.required(source, "id")),
        labelKey: this.text(this.required(source, "labelKey")),
        types: this.array(
          this.required(source, "types"),
          "field-types",
          (value) => this.enum(value, fieldTypes),
        ),
        cardinality: this.enum(this.required(source, "cardinality"), [
          "none",
          "one",
          "many",
          "range",
        ] as const),
        builtin: this.boolean(this.required(source, "builtin")),
      };
      this.optional(source, output, "inverse", (value) => this.text(value));
      this.optional(source, output, "custom", (value) => this.custom(value));
      return output;
    });
  }
  registry(input: unknown): OperatorRegistry {
    const source = this.object(input);
    return this.owned(source, "registry", () => {
      const custom = this.array(
        this.required(source, "custom"),
        "custom-operators",
        (value) => this.custom(value),
      );
      const descriptors = this.array(
        this.required(source, "descriptors"),
        "operator-descriptors",
        (value) => this.descriptor(value),
      );
      const get = this.callback<OperatorRegistry["get"]>(
        this.required(source, "get"),
        { kind: "fixed", owner: source },
      );
      const capture = this;
      return {
        custom,
        descriptors,
        get(id: string): OperatorDescriptor | undefined {
          capture.ensure();
          const descriptor = get(id);
          return descriptor === undefined
            ? undefined
            : capture.descriptor(descriptor);
        },
      };
    });
  }
  point(input: unknown): DatePoint {
    const source = this.object(input);
    return this.owned(source, "date-point", () => ({
      kind: this.enum(this.required(source, "kind"), [
        "day",
        "instant",
      ] as const),
      value: this.text(this.required(source, "value")),
    }));
  }
  dateValue(input: unknown): DateValue {
    const source = this.object(input);
    const kind = this.required(source, "kind");
    if (kind === "day" || kind === "instant") return this.point(source);
    return this.owned(source, "symbolic-date", () => {
      if (kind === "relative")
        return {
          kind,
          preset: this.enum(this.required(source, "preset"), relativePresets),
        };
      if (kind === "rolling")
        return {
          kind,
          days: this.number(this.required(source, "days")),
          direction: this.enum(this.required(source, "direction"), [
            "past",
            "future",
          ] as const),
        };
      return deny();
    });
  }
  preset<S extends QuerySchema>(
    input: unknown,
  ): NonNullable<FilterDateProps<S>["presets"]>[number] {
    const source = this.object(input);
    return this.owned(source, "date-preset", () => {
      const date = this.object(this.required(source, "date"));
      const captured = this.owned(date, "standalone-date", () => {
        const operator = this.required(date, "operator");
        if (operator === "date.on")
          return {
            operator,
            value: this.dateValue(this.required(date, "value")),
          };
        if (operator === "date.between") {
          const value = this.array(
            this.required(date, "value"),
            "date-range",
            (point) => this.point(point),
          );
          if (value.length !== 2) return deny();
          return { operator, value: Object.freeze([value[0], value[1]]) };
        }
        return deny();
      });
      return {
        id: this.text(this.required(source, "id")),
        label: this.text(this.required(source, "label")),
        date: captured as NonNullable<QueryFor<S>["date"]>,
      };
    });
  }
  tab(input: unknown): Owned<FilterTabPresentation> {
    const source = this.object(input);
    return this.owned(source, "tab-presentation", () => {
      const output = { label: this.text(this.required(source, "label")) };
      this.optional(source, output, "disabled", (value) => this.boolean(value));
      this.optional(source, output, "count", (value) => {
        const count = this.object(value);
        return this.owned(count, "tab-count", () => ({
          value: this.number(this.required(count, "value")),
          description: this.text(this.required(count, "description")),
        }));
      });
      return output;
    });
  }
}

function capture<T>(
  check: CriteriaPortsCheck,
  read: (capture: Capture) => T,
): T {
  try {
    const state = new Capture(check);
    const result = read(state);
    state.ensure();
    return result;
  } catch {
    return deny();
  }
}

export function captureFilterSearchPorts<S extends QuerySchema>(
  input: SearchInput<S>,
  check: CriteriaPortsCheck,
): FilterSearchPorts<S> {
  return capture(check, (state) => {
    const source = state.object(input);
    const output = {};
    state.optional(source, output, "messages", (value) =>
      state.messages<FilterSearchMessages>(
        value,
        searchMessages,
        "search-messages",
      ),
    );
    state.optional(source, output, "onMutation", (value) =>
      state.callback<NonNullable<FilterSearchProps<S>["onMutation"]>>(value, {
        kind: "bare",
      }),
    );
    return Object.freeze(output);
  });
}

export function captureFilterTabsPorts<S extends QuerySchema>(
  schema: S,
  input: TabsInput<NoInfer<S>>,
  check: CriteriaPortsCheck,
): FilterTabsPorts<S> {
  return capture(check, (state) => {
    const source = state.object(input);
    const definition = state.object(schema);
    const tabs = state.object(state.required(source, "tabs"));
    const captured: Record<string, FilterTabPresentation> = Object.create(null);
    const slot = state.slot(definition, "tabs");
    if (slot.present && slot.value !== undefined) {
      const ids = state.array(slot.value, "schema-tabs", (value) =>
        state.text(state.required(state.object(value), "id")),
      );
      for (const id of ids)
        state.put(captured, id, state.tab(state.required(tabs, id)));
    }
    const output = {
      tabs: Object.freeze(captured),
      children: state.required(source, "children"),
    };
    state.optional(source, output, "neutralTab", (value) => state.tab(value));
    state.optional(source, output, "activation", (value) =>
      state.enum(value, ["manual", "automatic"]),
    );
    state.optional(source, output, "messages", (value) =>
      state.messages<FilterTabsMessages>(value, tabsMessages, "tabs-messages"),
    );
    state.optional(source, output, "onMutation", (value) =>
      state.callback<NonNullable<FilterTabsProps<S>["onMutation"]>>(value, {
        kind: "bare",
      }),
    );
    return Object.freeze(output) as FilterTabsPorts<S>;
  });
}

export function captureFilterDatePorts<S extends QuerySchema>(
  input: DateInput<S>,
  check: CriteriaPortsCheck,
): FilterDatePorts<S> {
  return capture(check, (state) => {
    const source = state.object(input);
    const output = {};
    state.optional(source, output, "registry", (value) =>
      state.registry(value),
    );
    state.optional(source, output, "presets", (value) =>
      state.array(value, "date-presets", (item) => state.preset<S>(item)),
    );
    state.optional(source, output, "messages", (value) =>
      state.messages<FilterDateMessages>(value, dateMessages, "date-messages"),
    );
    state.optional(source, output, "onMutation", (value) =>
      state.callback<NonNullable<FilterDateProps<S>["onMutation"]>>(value, {
        kind: "bare",
      }),
    );
    return Object.freeze(output);
  });
}

export function captureFilterBuilderPorts<S extends QuerySchema>(
  schema: S,
  input: BuilderInput<NoInfer<S>>,
  check: CriteriaPortsCheck,
): FilterBuilderPorts<S> {
  return capture(check, (state) => {
    const source = state.object(input);
    const definition = state.object(schema);
    const schemaFields = state.object(state.required(definition, "fields"));
    const fields = state.object(state.required(source, "fields"));
    const captured: Partial<
      Record<BuilderFieldId<S>, FilterFieldPorts<S> | undefined>
    > = Object.create(null);
    for (const id of state.names(schemaFields)) {
      const field = state.object(state.required(schemaFields, id));
      if (state.required(field, "owner") !== "builder") continue;
      state.optional(fields, captured, id, (value) =>
        state.presentation<S>(value),
      );
    }
    const output = {
      evaluationMode: state.enum(state.required(source, "evaluationMode"), [
        "client",
        "server",
      ] as const),
      fields: Object.freeze(captured),
    };
    state.optional(source, output, "registry", (value) =>
      state.registry(value),
    );
    state.optional(source, output, "messages", (value) =>
      state.messages<FilterBuilderMessages>(
        value,
        builderMessages,
        "builder-messages",
      ),
    );
    state.optional(source, output, "dateMessages", (value) =>
      state.messages<DateEditorMessages>(
        value,
        editorMessages,
        "editor-messages",
      ),
    );
    state.optional(source, output, "createRuleId", (value) =>
      state.callback<NonNullable<FilterBuilderProps<S>["createRuleId"]>>(
        value,
        { kind: "fixed", owner: source },
      ),
    );
    state.optional(source, output, "onMutation", (value) =>
      state.callback<NonNullable<FilterBuilderProps<S>["onMutation"]>>(value, {
        kind: "fixed",
        owner: source,
      }),
    );
    return Object.freeze(output);
  });
}
