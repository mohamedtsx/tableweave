import {
  type CriteriaFrameOwner,
  type CriteriaOrigin,
  type CriteriaSourceMetadata,
  type DataTableModel,
  getControlsAuthorityOwner,
  getCriteriaSourceOwner,
  getCriteriaToolOwner,
  getDataTableModelOwner,
  requireCriteriaSource,
  requireCriteriaTool,
  requireDataTableModel,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import {
  type CommitAdapter,
  type CommitCheck,
  CommitMetadata,
  createRendererCommitCore,
  sameCommitOrigin,
} from "../filters/criteria-commit-core.js";
import type { TableweaveMessages } from "../localization/types.js";
import { selectionActionContext } from "../selection/action.js";
import type {
  DataTableStateMessages,
  TableRendererActor,
  TableRendererCell,
  TableRendererCommitted,
  TableRendererPorts,
} from "./types.js";

export class TableRendererCommitError extends Error {
  readonly code = "table.renderer.unavailable";
  constructor() {
    super("Committed table renderer ports are unavailable.");
    this.name = "TableRendererCommitError";
  }
}
function deny(): never {
  throw new TableRendererCommitError();
}
interface Binding<S extends QuerySchema, T extends object> {
  readonly model: DataTableModel<S, T>;
  readonly owner: CriteriaFrameOwner<S>;
  readonly origin: CriteriaOrigin<S>;
  readonly metadata: CriteriaSourceMetadata<S>;
}
type Role = "source" | "display" | "retry" | "selection" | "columns";
type Callable = (...args: never[]) => unknown;
type MessageSchema = Readonly<Record<string, "text" | "function">>;
type SchemaOf<T> = {
  readonly [K in keyof T]-?: T[K] extends Callable ? "function" : "text";
};
const stateMessages = {
  uncommitted: "text",
  unavailable: "text",
  idle: "text",
  loading: "text",
  initialError: "text",
  offline: "text",
  timeout: "text",
  updating: "text",
  updateFailed: "text",
  emptyDataset: "text",
  noMatches: "text",
  unknownEmpty: "text",
  noRecordOnPage: "text",
  retry: "text",
} as const;
const collectionMessages = {
  pageCheckbox: "text",
  rowCheckbox: "function",
  sortButton: "function",
  sortEntry: "function",
  sortPriority: "function",
  sortOrderLabel: "text",
  sortSeparator: "text",
  notSorted: "text",
  selectedCount: "function",
  subscribedCountLabel: "text",
  subscribedCount: "function",
  invalidColumns: "text",
  invalidRows: "text",
  invalidRowHeader: "text",
  invalidSelectionColumn: "text",
  missingCell: "text",
} as const;
const selectionMessages = {
  normalLabel: "text",
  selectionLabel: "text",
  actionsLabel: "text",
  selectedCount: "function",
  cancel: "text",
  cancelLabel: "text",
} as const;
const paginationMessages = {
  navigation: "text",
  rowsPerPage: "text",
  previous: "text",
  next: "text",
  retry: "text",
  noPages: "text",
  unavailable: "text",
  unknownRange: "text",
  updating: "text",
  retained: "text",
  stale: "text",
  navigationUnavailable: "text",
  firstPage: "text",
  lastPage: "text",
  page: "function",
  knownPage: "function",
  outOfRange: "function",
  knownRange: "function",
  unknownTotalRange: "function",
  unknownRangeKnownTotal: "function",
} as const;
const sortingMessages = {
  trigger: "text",
  title: "text",
  priorities: "text",
  none: "text",
  ascending: "text",
  descending: "text",
  remove: "text",
  addAscending: "text",
  addDescending: "text",
  hidden: "text",
  unavailable: "text",
  disabled: "text",
  unsortable: "text",
  singleOnly: "text",
  actionName: "function",
  priority: "function",
} as const;
const columnMessages = {
  trigger: "text",
  title: "text",
  required: "text",
  finalVisible: "text",
  unavailable: "text",
  disabled: "text",
} as const;
const schemas = {
  state: stateMessages satisfies SchemaOf<DataTableStateMessages>,
  collection: collectionMessages satisfies SchemaOf<
    TableweaveMessages["collection"]
  >,
  selectionToolbar: selectionMessages satisfies SchemaOf<
    TableweaveMessages["selectionToolbar"]
  >,
  pagination: paginationMessages satisfies SchemaOf<
    TableweaveMessages["pagination"]
  >,
  sorting: sortingMessages satisfies SchemaOf<TableweaveMessages["sorting"]>,
  columnChooser: columnMessages satisfies SchemaOf<
    TableweaveMessages["columnChooser"]
  >,
} satisfies Record<string, MessageSchema>;
const childMessages = [
  "builder",
  "search",
  "tabs",
  "date",
  "dateEditor",
  "details",
] as const;

/** Capture owns only its explicit renderer ports, not child config internals/nodes. */
class RendererCapture<S extends QuerySchema, T extends object> {
  private readonly cache: CommitMetadata;
  private readonly prototypes = new WeakMap<object, unknown>();
  private readonly dictionaries = new WeakMap<
    object,
    Map<string, Readonly<Record<string, unknown>>>
  >();
  private readonly originals = new WeakMap<object, object>();
  private readonly wrappers = new WeakMap<
    Callable,
    Map<object, Map<string, Callable>>
  >();
  constructor(
    private readonly check: CommitCheck,
    private readonly role: (role: Role) => Binding<S, T>,
  ) {
    this.cache = new CommitMetadata(check, deny);
  }
  object(value: unknown): object {
    this.check();
    if (
      !value ||
      typeof value !== "object" ||
      this.cache.reflect(() => Array.isArray(value))
    )
      return deny();
    if (!this.prototypes.has(value))
      this.prototypes.set(
        value,
        this.cache.reflect(() => Object.getPrototypeOf(value)),
      );
    const proto = this.prototypes.get(value);
    if (proto !== null && proto !== Object.prototype) return deny();
    return value;
  }
  data(value: object, name: string, optional = false): unknown {
    return this.cache.data(value, name, optional);
  }
  text(value: unknown): string {
    if (typeof value !== "string") return deny();
    return value;
  }
  flag(value: unknown): boolean {
    if (typeof value !== "boolean") return deny();
    return value;
  }
  opaque(value: unknown): object {
    if (!value || typeof value !== "object") return deny();
    return value;
  }
  /** Render control flow is preserved only while post-checks pass. Event void ports
   * observe ordinary current-realm native Promises, never arbitrary .then getters. */
  callback(
    value: unknown,
    owner: object,
    name: string,
    role: Role,
    behavior:
      | "render"
      | "event"
      | "value"
      | "state"
      | "toolbar"
      | "action" = "render",
    message = false,
    enabled = true,
  ): Callable {
    if (typeof value !== "function") return deny();
    const fn = value as Callable;
    let owners = this.wrappers.get(fn);
    if (!owners) {
      owners = new Map();
      this.wrappers.set(fn, owners);
    }
    let modes = owners.get(owner);
    if (!modes) {
      modes = new Map();
      owners.set(owner, modes);
    }
    const key = `${name}:${role}:${behavior}:${message}:${enabled}`;
    const previous = modes.get(key);
    if (previous) return previous;
    const capture = this,
      promisePrototype = Promise.prototype,
      promiseThen = Promise.prototype.then;
    const wrapped = function (this: unknown, ...args: never[]): unknown {
      capture.check();
      if (!enabled) return deny();
      const before = capture.role(role);
      const finish = () => {
        capture.check();
        const after = capture.role(role);
        if (after.model !== before.model) return deny();
        capture.check();
      };
      let callArgs: readonly unknown[] = args;
      if (behavior === "state")
        callArgs = [
          Object.freeze({
            model: before.model,
            metadata: before.metadata,
            recovery: before.model.recovery,
          }),
        ];
      else if (behavior === "toolbar") {
        const metadata = new CommitMetadata(() => {
          capture.check();
          capture.role(role);
        }, deny);
        const defaultContent = metadata.data(args[0], "defaultContent");
        callArgs = [
          Object.freeze({
            model: before.model,
            metadata: before.metadata,
            recovery: before.model.recovery,
            frame: before.model.frame,
            view: before.model.view,
            presentation: before.model.presentation,
            defaultContent,
          }),
        ];
      } else if (behavior === "action") {
        const authority = before.model.authority ?? deny();
        const context = selectionActionContext(authority.read());
        finish();
        callArgs = [context];
      } else if (name === "onRetry") callArgs = [];
      const receiver = message
        ? this &&
          typeof this === "object" &&
          capture.originals.get(this) === owner
          ? owner
          : this
        : owner;
      let result: unknown;
      finish(); // Argument reflection/context construction cannot authorize stale entry.
      try {
        result = Reflect.apply(fn, receiver, callArgs);
      } finally {
        finish();
      }
      if (behavior !== "event" && behavior !== "action") return result;
      // Void callbacks' ordinary non-Promise values are intentionally ignored.
      if (result === null || typeof result !== "object") return undefined;
      let prototype: unknown;
      try {
        prototype = Object.getPrototypeOf(result);
      } catch {
        return deny();
      } finally {
        finish();
      }
      if (prototype !== promisePrototype) return deny();
      try {
        return Reflect.apply(promiseThen, result, [
          () => {
            finish();
            return undefined;
          },
          (error: unknown) => {
            finish();
            throw error;
          },
        ]);
      } catch {
        return deny();
      } finally {
        finish();
      }
    };
    modes.set(key, wrapped);
    return wrapped;
  }
  optional(
    source: object,
    result: Record<string, unknown>,
    key: string,
    capture: (value: unknown) => unknown,
  ): void {
    const value = this.data(source, key, true);
    if (value !== undefined) result[key] = capture(value);
  }
  dictionary(
    value: unknown,
    schema: MessageSchema,
    name: string,
    complete: boolean,
  ): Readonly<Record<string, unknown>> {
    const source = this.object(value);
    let roles = this.dictionaries.get(source);
    if (!roles) {
      roles = new Map();
      this.dictionaries.set(source, roles);
    }
    const roleKey = `${name}:${complete}`,
      previous = roles.get(roleKey);
    if (previous) return previous;
    const result: Record<string, unknown> = Object.create(null);
    for (const [key, kind] of Object.entries(schema)) {
      const present = this.cache.has(source, key);
      if (!present && !complete) continue;
      const input = this.data(source, key, !complete);
      result[key] =
        kind === "text"
          ? this.text(input)
          : this.callback(
              input,
              source,
              `${name}.${key}`,
              name === "state" ? "source" : "display",
              "render",
              true,
            );
    }
    this.originals.set(result, source);
    const captured = Object.freeze(result);
    roles.set(roleKey, captured);
    return captured;
  }
  messages(value: unknown, complete: boolean) {
    const source = this.object(value),
      owned: Record<string, unknown> = Object.create(null),
      children: Record<string, unknown> = Object.create(null);
    for (const [key, schema] of Object.entries(schemas)) {
      const input = this.data(source, key, !complete);
      if (input === undefined && !complete) continue;
      owned[key] = this.dictionary(
        input,
        schema,
        key,
        complete || (key !== "collection" && key !== "selectionToolbar"),
      );
    }
    for (const key of childMessages) {
      const input = this.data(source, key, !complete);
      if (input !== undefined || complete) children[key] = this.opaque(input);
    }
    return { owned, children };
  }
  capture(input: unknown): TableRendererPorts<S, T> {
    const source = this.object(input),
      result: Record<string, unknown> = Object.create(null);
    const owned: Record<string, unknown> = Object.create(null),
      children: Record<string, unknown> = Object.create(null);
    let builtinOperatorLabels: object | undefined;
    const locale = this.data(source, "locale", true);
    if (locale !== undefined) {
      const value = this.object(locale),
        name = this.text(this.data(value, "locale")),
        direction = this.data(value, "direction");
      if (direction !== "ltr" && direction !== "rtl") return deny();
      result.locale = Object.freeze({ locale: name, direction });
      const messages = this.messages(this.data(value, "messages"), true);
      Object.assign(owned, messages.owned);
      Object.assign(children, messages.children);
      builtinOperatorLabels = this.opaque(
        this.data(value, "builtinOperatorLabels"),
      );
    }
    const messages = this.data(source, "messages", true);
    if (messages !== undefined) {
      const overrides = this.messages(messages, false);
      for (const [key, dictionary] of Object.entries(overrides.owned))
        owned[key] =
          owned[key] === undefined
            ? dictionary
            : Object.freeze(
                Object.assign(Object.create(null), owned[key], dictionary),
              );
      Object.assign(children, overrides.children);
    }
    result.messages = Object.freeze(owned);
    result.childDefaults = Object.freeze({
      messages: Object.freeze(children),
      ...(builtinOperatorLabels === undefined ? {} : { builtinOperatorLabels }),
    });
    const tools = this.data(source, "tools", true),
      toolConfigs: Record<string, unknown> = Object.create(null);
    if (tools !== undefined) {
      const value = this.object(tools);
      for (const key of ["builder", "search", "tabs", "date"]) {
        const config = this.data(value, key, true);
        if (config !== undefined) toolConfigs[key] = this.opaque(config);
      }
    }
    result.toolConfigs = Object.freeze(toolConfigs);
    this.optional(source, result, "collection", (value) => {
      const collection = this.object(value),
        out: Record<string, unknown> = Object.create(null);
      out.label = this.text(this.data(collection, "label"));
      out.rowHeaderColumnId = this.text(
        this.data(collection, "rowHeaderColumnId"),
      );
      this.optional(collection, out, "selectionColumnId", (v) => this.text(v));
      for (const key of ["rowTextValue", "columnTextValue", "cellTextValue"])
        out[key] = this.callback(
          this.data(collection, key),
          collection,
          key,
          "display",
        );
      return Object.freeze(out);
    });
    this.optional(source, result, "renderToolbar", (value) =>
      this.callback(value, source, "renderToolbar", "display", "toolbar"),
    );
    this.optional(source, result, "renderState", (value) =>
      this.callback(value, source, "renderState", "source", "state"),
    );
    this.optional(source, result, "onRetry", (value) =>
      this.callback(value, source, "onRetry", "retry", "event"),
    );
    this.optional(source, result, "getRestoreFocusTarget", (value) =>
      this.callback(value, source, "getRestoreFocusTarget", "display", "value"),
    );
    this.optional(source, result, "onError", (value) =>
      this.callback(value, source, "onError", "display", "event"),
    );
    this.optional(source, result, "formatNumber", (value) =>
      this.callback(value, source, "formatNumber", "display"),
    );
    this.optional(source, result, "actions", (value) => {
      if (!this.cache.reflect(() => Array.isArray(value))) return deny();
      const array = value as object,
        length = this.data(array, "length");
      if (
        typeof length !== "number" ||
        !Number.isSafeInteger(length) ||
        length < 0
      )
        return deny();
      const actions: Record<string, unknown>[] = [],
        ids = new Set<string>();
      for (let i = 0; i < length; i++) {
        const action = this.object(this.data(array, String(i))),
          out: Record<string, unknown> = Object.create(null);
        const id = this.text(this.data(action, "id")),
          label = this.text(this.data(action, "label"));
        if (!id.trim() || !label.trim() || ids.has(id)) return deny();
        ids.add(id);
        out.id = id;
        out.label = label;
        for (const key of ["isDisabled", "isPending"])
          this.optional(action, out, key, (v) => this.flag(v));
        this.optional(action, out, "variant", (v) => {
          if (v !== "secondary" && v !== "tertiary" && v !== "danger")
            return deny();
          return v;
        });
        out.onAction = this.callback(
          this.data(action, "onAction"),
          action,
          "onAction",
          "selection",
          "action",
          false,
          !out.isDisabled && !out.isPending,
        );
        actions.push(Object.freeze(out));
      }
      return Object.freeze(actions);
    });
    this.optional(source, result, "columns", (value) => {
      const columns = this.object(value),
        out: Record<string, unknown> = Object.create(null);
      for (const key of ["disabledReason", "id", "className"])
        this.optional(columns, out, key, (v) => this.text(v));
      this.optional(columns, out, "isDisabled", (v) => this.flag(v));
      this.optional(columns, out, "onResult", (v) =>
        this.callback(v, columns, "onResult", "columns", "event"),
      );
      this.optional(columns, out, "labels", (v) => {
        const labels = this.object(v),
          result: Record<string, string> = Object.create(null);
        const keys = this.cache.reflect(() => Reflect.ownKeys(labels));
        for (const key of keys) {
          if (typeof key !== "string") return deny();
          result[key] = this.text(this.data(labels, key));
        }
        return Object.freeze(result);
      });
      return Object.freeze(out);
    });
    this.check();
    // Sole validated envelope materialization: callback signatures are anchored by
    // the genuine model's S/T, never cast to object/any to accept consumer rows.
    const completed = {
      ...result,
      messages: result.messages as TableRendererPorts<S, T>["messages"],
      childDefaults: result.childDefaults as TableRendererPorts<
        S,
        T
      >["childDefaults"],
      toolConfigs: result.toolConfigs as TableRendererPorts<
        S,
        T
      >["toolConfigs"],
    };
    return Object.freeze(completed) as TableRendererPorts<S, T>;
  }
}

/** Inert provenance constructor. No candidate/model payload, P/R callback or lease. */
export function createTableRendererCell<
  S extends QuerySchema,
  T extends object,
>(model: DataTableModel<S, T>): TableRendererCell<S, T> {
  return createRendererCommitCore(model);
}

/** Closed library policy; not an application factory accepting permitting ports. */
export function createTableRendererAdapter<
  S extends QuerySchema,
  T extends object,
>(
  initialModel: DataTableModel<S, T>,
): CommitAdapter<
  S,
  Binding<S, T>,
  TableRendererPorts<S, T>,
  TableRendererActor<S, T>,
  TableRendererCommitted<S, T>
> {
  const initialOwner = getDataTableModelOwner(initialModel);
  if (!initialOwner) return deny();
  const { definition, controller } = initialOwner;
  let current: Binding<S, T> | null = null,
    pinnedOwner: CriteriaFrameOwner<S> | null = null,
    pinnedMode: CriteriaSourceMetadata<S>["mode"] | null = null;
  const read = (input: unknown): Binding<S, T> => {
    // Untrusted ref asserted only for exact issuance lookup, before payload access.
    const model = input as DataTableModel<S, T>,
      owner = getDataTableModelOwner(model);
    if (
      !owner ||
      owner.definition !== definition ||
      owner.controller !== controller
    )
      return deny();
    requireDataTableModel(model, definition);
    const target = model.sourceTarget;
    if (!target) return deny();
    const frameOwner = getCriteriaSourceOwner(target.authority);
    if (
      !frameOwner ||
      target.owner !== frameOwner ||
      (pinnedOwner && frameOwner !== pinnedOwner)
    )
      return deny();
    const metadata = requireCriteriaSource(target.authority, frameOwner),
      origin = metadata.origin;
    if (
      origin.controller !== controller ||
      origin.definition !== controller.getDefinition() ||
      frameOwner.controller !== controller ||
      frameOwner.definition !== origin.definition ||
      (pinnedMode !== null && metadata.mode !== pinnedMode)
    )
      return deny();
    requireDataTableModel(model, definition);
    return Object.freeze({ model, owner: frameOwner, origin, metadata });
  };
  const live = () => (current ? read(current.model) : deny());
  const role = (kind: Role): Binding<S, T> => {
    const binding = live(),
      { model, metadata } = binding;
    if (kind !== "source") {
      if (kind === "retry") {
        if (
          metadata.mode === "client" ||
          !metadata.canRetry ||
          !("canRetry" in model.recovery) ||
          !model.recovery.canRetry
        )
          return deny();
        if (model.frame) (model.authority ?? deny()).require({ type: "retry" });
      } else {
        const tool = model.toolTarget;
        if (
          model.phase !== "display" ||
          !model.frame ||
          !model.view ||
          !model.presentation ||
          !model.authority ||
          !tool ||
          tool.owner !== binding.owner ||
          getCriteriaToolOwner(tool.authority) !== binding.owner
        )
          return deny();
        if (
          !sameCommitOrigin(
            requireCriteriaTool(tool.authority, binding.owner),
            binding.origin,
          )
        )
          return deny();
        const controls = getControlsAuthorityOwner(model.authority);
        if (
          !controls ||
          controls.controller !== controller ||
          controls.definition !== definition.native
        )
          return deny();
        if (kind === "columns") model.authority.require({ type: "columns" });
      }
    }
    if (live().model !== model) return deny();
    return binding;
  };
  return {
    kind: "renderer",
    controller,
    deny,
    registerBeforeCapture: true,
    admit(input, _metadata, check) {
      const target = read(input);
      check();
      return { target, owner: target.owner, origin: target.origin };
    },
    genuine(target, origin, active) {
      const actual = active ? live() : read(target.model);
      if (
        actual.owner !== target.owner ||
        !sameCommitOrigin(actual.origin, origin)
      )
        return deny();
    },
    capture(admission, input, _metadata, check, pin) {
      if (pin && pin.mode !== admission.target.metadata.mode) return deny();
      const ports = new RendererCapture(check, role).capture(input);
      return { ports, stamp: undefined, mode: admission.target.metadata.mode };
    },
    activate(target) {
      current = target;
      pinnedOwner ??= target.owner;
      pinnedMode ??= target.metadata.mode;
    },
    clearMetadata() {
      current = null;
    },
    metadataReference: () => current?.model ?? null,
    validateUpdate(admission, pin, origin) {
      if (
        admission.target.metadata.mode !== pin.mode ||
        !sameCommitOrigin(admission.origin, origin)
      )
        return deny();
    },
    committed(actor, ports, origin) {
      const data = current ?? deny();
      return Object.freeze({
        actor,
        ports,
        origin,
        model: data.model,
        metadata: data.metadata,
      });
    },
    view(committed) {
      const data = current ?? deny();
      return Object.freeze({
        actor: committed.actor,
        ports: committed.ports,
        origin: committed.origin,
        model: data.model,
        metadata: data.metadata,
      });
    },
  };
}
