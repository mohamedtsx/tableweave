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
import { getDetailsBinding } from "../data-table/details-binding.js";
import type { DetailsAccessory } from "../details/types.js";
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
  TableRendererTarget,
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
export type TableRendererMemberKind = "row" | "column" | "header" | "cell";

function member<S extends QuerySchema, T extends object>(
  binding: Binding<S, T>,
  kind: TableRendererMemberKind,
  argument: unknown,
  check: () => void,
): void {
  if (
    kind !== "row" &&
    kind !== "column" &&
    kind !== "header" &&
    kind !== "cell"
  )
    deny();
  check();
  const view = binding.model.view;
  if (!view || binding.model.phase !== "display") deny();
  const identities = new Set<unknown>();
  if (kind === "row") for (const row of view.rows) identities.add(row);
  else if (kind === "cell")
    for (const row of view.rows) {
      check();
      const cells = row.getVisibleCells();
      check();
      for (const cell of cells) identities.add(cell);
    }
  else {
    if (kind === "column")
      for (const column of view.visibleColumns) identities.add(column);
    const visit = (
      header: (typeof view.headerGroups)[number]["headers"][number],
    ) => {
      check();
      identities.add(kind === "header" ? header : header.column);
      for (const child of header.subHeaders) visit(child);
      check();
    };
    for (const group of view.headerGroups)
      for (const header of group.headers) visit(header);
  }
  check();
  // No alleged argument property, id, getter or prototype was inspected.
  if (!identities.has(argument)) deny();
}
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
    private readonly binding: Binding<S, T>,
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
  neutralText(value: unknown): string {
    const text = this.text(value);
    if (!text.trim()) deny();
    return text;
  }
  neutralMessages(value: unknown) {
    const input = this.object(value);
    return Object.freeze({
      uncommitted: this.neutralText(this.data(input, "uncommitted")),
      unavailable: this.neutralText(this.data(input, "unavailable")),
    });
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
      const argumentKind =
        name === "rowTextValue"
          ? "row"
          : name === "columnTextValue"
            ? "column"
            : name === "cellTextValue"
              ? "cell"
              : null;
      if (argumentKind) member(before, argumentKind, args[0], finish);
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
      let receiver: unknown = message ? this : owner;
      if (message && this && typeof this === "object") {
        let copied = capture.originals.get(this) === owner;
        if (!copied) {
          finish();
          try {
            const descriptor = Object.getOwnPropertyDescriptor(
              this,
              name.slice(name.lastIndexOf(".") + 1),
            );
            copied =
              !!descriptor &&
              Object.hasOwn(descriptor, "value") &&
              descriptor.value === wrapped;
          } finally {
            finish();
          }
        }
        if (copied) receiver = owner;
      }
      let result: unknown;
      finish(); // Argument reflection/context construction cannot authorize stale entry.
      try {
        result = Reflect.apply(fn, receiver, callArgs);
      } finally {
        finish();
        if (argumentKind) member(before, argumentKind, args[0], finish);
      }
      // These are owned callback-return promises, not arbitrary React component
      // bodies/effects. Keep opaque synchronous React nodes React-owned.
      if (
        (behavior === "state" || behavior === "toolbar") &&
        result !== null &&
        typeof result === "object"
      ) {
        let prototype: unknown;
        try {
          prototype = Object.getPrototypeOf(result);
        } finally {
          finish();
        }
        if (prototype === promisePrototype) {
          try {
            return Reflect.apply(promiseThen, result, [
              (node: unknown) => {
                finish();
                return node;
              },
              (error: unknown) => {
                finish();
                throw error;
              },
            ]);
          } finally {
            finish();
          }
        }
        let thenable: boolean;
        try {
          thenable = Reflect.has(result, "then");
        } finally {
          finish();
        }
        if (thenable) return deny(); // Unsupported thenables never acquire React delivery.
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
      if (
        key === "pagination" &&
        this.binding.origin.definition.schema.pagination.enabled === false
      )
        continue;
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
      if (this.cache.has(value, "detailsRegionLabel"))
        result.detailsRegionLabel = this.neutralText(
          this.data(value, "detailsRegionLabel"),
        );
      if (this.cache.has(value, "neutralMessages"))
        result.neutralMessages = this.neutralMessages(
          this.data(value, "neutralMessages"),
        );
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
    if (this.cache.has(source, "layout")) {
      const layout = this.object(this.data(source, "layout")),
        out: Record<string, unknown> = Object.create(null);
      for (const key of ["id", "className"])
        if (this.cache.has(layout, key))
          out[key] = this.text(this.data(layout, key));
      result.layout = Object.freeze(out);
    }
    if (this.cache.has(source, "neutralMessages"))
      result.neutralMessages = this.neutralMessages(
        this.data(source, "neutralMessages"),
      );
    if (this.cache.has(source, "accessory")) {
      const accessory = this.data(source, "accessory") as DetailsAccessory<
          S,
          T
        >,
        binding = getDetailsBinding(accessory);
      if (
        binding.definition !==
          getDataTableModelOwner(this.binding.model)?.definition ||
        binding.controller !== this.binding.origin.controller
      )
        deny();
      result.accessory = accessory;
    }
    if (this.cache.has(source, "detailsRegionLabel"))
      result.detailsRegionLabel = this.neutralText(
        this.data(source, "detailsRegionLabel"),
      );
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
    if (this.binding.origin.definition.schema.pagination.enabled !== false) {
      this.optional(source, result, "formatNumber", (value) =>
        this.callback(value, source, "formatNumber", "display"),
      );
      this.optional(source, result, "paginationCorrection", (v) => {
        const context = this.object(v),
          out: Record<string, unknown> = Object.create(null);
        const owner = getDataTableModelOwner(this.binding.model) ?? deny();
        if (this.data(context, "definition") !== owner.definition.native)
          deny();
        out.definition = owner.definition.native;
        out.context = this.cache.context(this.data(context, "context"));
        const epoch = this.data(context, "epoch");
        if (
          typeof epoch !== "string" &&
          (typeof epoch !== "number" || !Number.isFinite(epoch))
        )
          deny();
        out.epoch = epoch;
        out.readCurrent = this.callback(
          this.data(context, "readCurrent"),
          context,
          "readCurrent",
          "display",
          "value",
        );
        return Object.freeze(out);
      });
    }
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
  const owner = getDataTableModelOwner(model);
  if (!owner) return deny();
  const cell = createRendererCommitCore(model);
  const require = cell.require;
  rendererCells.set(
    cell,
    Object.freeze({
      owner,
      require,
      snapshot: cell.getSnapshot,
      subscribe: cell.subscribe,
      models: new WeakMap<object, DataTableModel<S, T>>(),
    }),
  );
  return cell;
}
// Shell display subscribers retain only their last snapshot identity during a
// same-actor source-only wait. The source surface still reads the real core
// snapshot. This is never event/callback permission or a private output cache.
const shellRendererCells = new WeakSet<object>();
const shellDisplaySnapshots = new WeakMap<object, object>();
export function createDataTableRendererCell<
  S extends QuerySchema,
  T extends object,
>(model: DataTableModel<S, T>): TableRendererCell<S, T> {
  const cell = createTableRendererCell(model);
  shellRendererCells.add(cell);
  return cell;
}

// No exported registration function and no allegedly supplied cell method reads.
const rendererCells = new WeakMap<object, object>();
interface RendererRegistration<S extends QuerySchema, T extends object> {
  readonly owner: NonNullable<ReturnType<typeof getDataTableModelOwner<S, T>>>;
  readonly require: TableRendererCell<S, T>["require"];
  readonly snapshot: TableRendererCell<S, T>["getSnapshot"];
  readonly subscribe: TableRendererCell<S, T>["subscribe"];
  readonly models: WeakMap<object, DataTableModel<S, T>>;
}
export function getTableRendererOwner<S extends QuerySchema, T extends object>(
  cell: TableRendererCell<S, T>,
): RendererRegistration<S, T>["owner"] | null {
  return (
    (rendererCells.get(cell) as RendererRegistration<S, T> | undefined)
      ?.owner ?? null
  );
}
function ownData(input: unknown, key: string): unknown {
  if (!input || typeof input !== "object") return deny();
  let descriptor: PropertyDescriptor | undefined;
  try {
    descriptor = Object.getOwnPropertyDescriptor(input, key);
  } catch {
    return deny();
  }
  if (!descriptor || !Object.hasOwn(descriptor, "value")) return deny();
  return descriptor.value;
}
export function captureTableRendererTarget<
  S extends QuerySchema,
  T extends object,
>(input: unknown): TableRendererTarget<S, T> {
  const cell = ownData(input, "cell");
  if (!cell || typeof cell !== "object" || !rendererCells.has(cell))
    return deny();
  const actor = ownData(input, "actor");
  // Only exact registered core.require knows actor issuance. No actor payload read.
  const registration = rendererCells.get(cell) as RendererRegistration<S, T>;
  registration.require(actor as TableRendererActor<S, T>);
  return Object.freeze({
    cell: cell as TableRendererCell<S, T>,
    actor: actor as TableRendererActor<S, T>,
  });
}
export function requireTableRendererTarget<
  S extends QuerySchema,
  T extends object,
>(target: TableRendererTarget<S, T>): TableRendererCommitted<S, T> {
  const cell = ownData(target, "cell");
  if (!cell || typeof cell !== "object") return deny();
  const registration = rendererCells.get(cell) as
    | RendererRegistration<S, T>
    | undefined;
  if (!registration) return deny();
  const actor = ownData(target, "actor");
  const committed = registration.require(actor as TableRendererActor<S, T>);
  const { model, origin } = committed;
  requireDataTableModel(model, registration.owner.definition);
  const tool = model.toolTarget,
    source = model.sourceTarget;
  if (
    model.phase !== "display" ||
    !model.view ||
    !model.frame ||
    !model.presentation ||
    !model.authority ||
    !tool ||
    !source ||
    tool.owner !== source.owner ||
    getCriteriaToolOwner(tool.authority) !== source.owner ||
    !sameCommitOrigin(requireCriteriaTool(tool.authority, tool.owner), origin)
  )
    return deny();
  requireCriteriaSource(source.authority, source.owner);
  const after = registration.require(actor as TableRendererActor<S, T>);
  if (after.model !== model) return deny();
  registration.models.set(actor as object, model);
  return after;
}
/** Source role only. Exact real cell/actor and current P2/F1 metadata; no tool,
 * frame or empty collection is fabricated for loading/initial-error callbacks. */
export function requireTableRendererSourceTarget<
  S extends QuerySchema,
  T extends object,
>(target: TableRendererTarget<S, T>): TableRendererCommitted<S, T> {
  const cell = ownData(target, "cell");
  if (!cell || typeof cell !== "object") return deny();
  const registration = rendererCells.get(cell) as
    | RendererRegistration<S, T>
    | undefined;
  if (!registration) return deny();
  const actor = ownData(target, "actor") as TableRendererActor<S, T>,
    value = registration.require(actor),
    model = value.model;
  const identity = getDataTableModelOwner(model);
  if (
    identity?.definition !== registration.owner.definition ||
    identity.controller !== registration.owner.controller
  )
    deny();
  requireDataTableModel(model, registration.owner.definition);
  const source = model.sourceTarget;
  if (!source || getCriteriaSourceOwner(source.authority) !== source.owner)
    deny();
  const metadata = requireCriteriaSource(source.authority, source.owner);
  if (
    !sameCommitOrigin(metadata.origin, value.origin) ||
    metadata.mode !== value.metadata.mode ||
    source.owner.controller !== registration.owner.controller ||
    source.owner.definition !== value.origin.definition
  )
    deny();
  const after = registration.require(actor);
  if (after.model !== model) deny();
  return after;
}
/** Metadata-only waiting classification, NEVER event/callback permission. A prior
 * genuine display model may retain a subtree while a same-origin model refresh is
 * not yet committed. Every private entry still requires the fresh exact model. */
export function tableRendererStatus<S extends QuerySchema, T extends object>(
  target: TableRendererTarget<S, T>,
): "ready" | "waiting" | "denied" {
  try {
    const cell = ownData(target, "cell");
    if (!cell || typeof cell !== "object") return "denied";
    const registration = rendererCells.get(cell) as
      | RendererRegistration<S, T>
      | undefined;
    if (!registration) return "denied";
    const actor = ownData(target, "actor");
    if (
      !actor ||
      typeof actor !== "object" ||
      registration.snapshot().actor !== actor
    )
      return "denied";
    try {
      requireTableRendererTarget(target);
      return "ready";
    } catch {
      /* Classify only, never permit a callback. */
    }
    const model = registration.models.get(actor),
      source = model?.sourceTarget;
    if (!model || !source || !model.metadata) return "denied";
    const metadata = requireCriteriaSource(source.authority, source.owner);
    if (
      !sameCommitOrigin(metadata.origin, model.metadata.origin) ||
      metadata.mode !== model.metadata.mode ||
      registration.snapshot().actor !== actor
    )
      return "denied";
    return "waiting";
  } catch {
    return "denied";
  }
}
export function subscribeTableRenderer<S extends QuerySchema, T extends object>(
  target: TableRendererTarget<S, T>,
  listener: () => void,
): () => void {
  const cell = ownData(target, "cell");
  if (!cell || typeof cell !== "object") return deny();
  const registration = rendererCells.get(cell) as
    | RendererRegistration<S, T>
    | undefined;
  if (!registration) return deny();
  return registration.subscribe(listener);
}
export function tableRendererSnapshot<S extends QuerySchema, T extends object>(
  target: TableRendererTarget<S, T>,
): ReturnType<TableRendererCell<S, T>["getSnapshot"]> {
  const cell = ownData(target, "cell");
  if (!cell || typeof cell !== "object") return deny();
  const registration = rendererCells.get(cell) as
    | RendererRegistration<S, T>
    | undefined;
  if (!registration) return deny();
  const snapshot = registration.snapshot();
  if (!shellRendererCells.has(cell)) return snapshot;
  const previous = shellDisplaySnapshots.get(cell) as
    | ReturnType<TableRendererCell<S, T>["getSnapshot"]>
    | undefined;
  if (
    snapshot.actor &&
    previous?.actor === snapshot.actor &&
    tableRendererStatus(target) === "waiting"
  )
    return previous;
  if (snapshot.actor) shellDisplaySnapshots.set(cell, snapshot);
  else shellDisplaySnapshots.delete(cell);
  return snapshot;
}
/** Presence semantics: only actual absence is the raw legacy route. */
export function captureTableRendererProp<
  S extends QuerySchema,
  T extends object,
>(
  input: object,
):
  | Readonly<{ kind: "omitted" }>
  | Readonly<{ kind: "denied" }>
  | Readonly<{ kind: "target"; target: TableRendererTarget<S, T> }> {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(input, "renderer");
    if (!descriptor)
      return Reflect.has(input, "renderer")
        ? { kind: "denied" }
        : { kind: "omitted" };
    if (!Object.hasOwn(descriptor, "value")) return { kind: "denied" };
    const cell = ownData(descriptor.value, "cell");
    if (!cell || typeof cell !== "object") return { kind: "denied" };
    const registration = rendererCells.get(cell) as
      | RendererRegistration<S, T>
      | undefined;
    if (!registration) return { kind: "denied" };
    const actor = ownData(descriptor.value, "actor");
    if (
      !actor ||
      typeof actor !== "object" ||
      registration.snapshot().actor !== actor
    )
      return { kind: "denied" };
    const target = Object.freeze({
      cell: cell as TableRendererCell<S, T>,
      actor: actor as TableRendererActor<S, T>,
    });
    if (tableRendererStatus(target) === "denied") return { kind: "denied" };
    return { kind: "target", target };
  } catch {
    return { kind: "denied" };
  }
}
export function requireTableRendererMember<
  S extends QuerySchema,
  T extends object,
>(
  target: TableRendererTarget<S, T>,
  kind: TableRendererMemberKind,
  argument: unknown,
): TableRendererCommitted<S, T> {
  const current = requireTableRendererTarget(target);
  const check = () => {
    if (requireTableRendererTarget(target).model !== current.model) deny();
  };
  member(
    {
      model: current.model,
      owner: current.model.sourceTarget?.owner ?? deny(),
      origin: current.origin,
      metadata: current.metadata,
    },
    kind,
    argument,
    check,
  );
  check();
  return current;
}

/** Identity-only transient inspection for the closed native-ref owner. This is
 * not a controls grant and never reads an alleged member before real membership. */
const nativeLifetimeIdentities = new WeakMap<object, object>();
function nativeIdentity(value: object): object {
  let token = nativeLifetimeIdentities.get(value);
  if (!token) {
    token = Object.freeze({});
    nativeLifetimeIdentities.set(value, token);
  }
  return token;
}
export interface NativeLifetimeMember {
  readonly id: string;
  readonly token: object;
  readonly column?: object;
}
export interface NativeLifetimeReady {
  readonly kind: "ready";
  readonly domain: readonly (object | string | number | boolean)[];
  readonly frame: object;
  readonly native: object;
  readonly rows: readonly NativeLifetimeMember[];
  readonly leaves: readonly NativeLifetimeMember[];
  readonly cells: readonly Readonly<{
    token: object;
    row: object;
    column: object;
    columnId: string;
  }>[];
  readonly selected?: Readonly<{
    kind: "row" | "leaf" | "column" | "cell";
    id: string;
    token: object;
    row?: object;
    column?: object;
    columnId?: string;
  }>;
}
/** Association only, so a same-actor source wait can revoke native refs even
 * when the normal live renderer require is unavailable. Never a display grant. */
export function captureNativeResourceTarget<
  S extends QuerySchema,
  T extends object,
>(input: unknown): TableRendererTarget<S, T> {
  const cell = ownData(input, "cell");
  if (!cell || typeof cell !== "object") deny();
  const registration = rendererCells.get(cell) as
    | RendererRegistration<S, T>
    | undefined;
  if (!registration) deny();
  const actor = ownData(input, "actor");
  if (
    !actor ||
    typeof actor !== "object" ||
    registration.snapshot().actor !== actor
  )
    deny();
  return Object.freeze({
    cell: cell as TableRendererCell<S, T>,
    actor: actor as TableRendererActor<S, T>,
  });
}
export function inspectRendererNativeLifetime(
  cell: unknown,
  actor: unknown,
  alleged?: Readonly<{
    kind: "row" | "leaf" | "column" | "cell";
    value: unknown;
  }>,
): NativeLifetimeReady | Readonly<{ kind: "blocked" }> {
  if (!cell || typeof cell !== "object" || !rendererCells.has(cell)) deny();
  // The erased envelope is only used for actual registry lookup/require. No row
  // payload or consumer cast is manufactured by the resource registry.
  const target = { cell, actor } as TableRendererTarget<QuerySchema, object>;
  const source = requireTableRendererSourceTarget(target);
  if (source.model.phase !== "display")
    return Object.freeze({ kind: "blocked" });
  const current = requireTableRendererTarget(target);
  const { model } = current;
  const view = model.view ?? deny();
  const definition = model.definition ?? deny();
  const check = () => {
    if (requireTableRendererTarget(target).model !== model) deny();
  };
  const policies = definition.native.controllerDefinition.columns;
  const selectionId = current.ports.collection?.selectionColumnId;
  const visible = new Set(view.visibleColumns.map((column) => column.id));
  const policy = (id: string) => policies.find((column) => column.id === id);
  const movable = (id: string) =>
    visible.has(id) &&
    id !== selectionId &&
    !!policy(id) &&
    policy(id)?.utility !== true;
  const rows: NativeLifetimeMember[] = [];
  const cells: {
    token: object;
    row: object;
    column: object;
    columnId: string;
  }[] = [];
  for (const row of view.rows) {
    check();
    rows.push(Object.freeze({ id: row.id, token: nativeIdentity(row) }));
    const visibleCells = row.getVisibleCells();
    check();
    for (const cell of visibleCells) {
      if (
        visible.has(cell.column.id) &&
        cell.column.id !== selectionId &&
        policy(cell.column.id)
      )
        cells.push(
          Object.freeze({
            token: nativeIdentity(cell),
            row: nativeIdentity(row),
            column: nativeIdentity(cell.column),
            columnId: cell.column.id,
          }),
        );
      check();
    }
    check();
  }
  const leaves: NativeLifetimeMember[] = [];
  const visit = (
    header: (typeof view.headerGroups)[number]["headers"][number],
  ) => {
    check();
    if (
      !header.isPlaceholder &&
      header.subHeaders.length === 0 &&
      movable(header.column.id)
    )
      leaves.push(
        Object.freeze({
          id: header.column.id,
          token: nativeIdentity(header),
          column: nativeIdentity(header.column),
        }),
      );
    for (const child of header.subHeaders) visit(child);
    check();
  };
  for (const group of view.headerGroups)
    for (const header of group.headers) visit(header);
  let selected: NativeLifetimeReady["selected"];
  if (alleged !== undefined) {
    const kind = ownData(alleged, "kind"),
      value = ownData(alleged, "value");
    if (
      kind !== "row" &&
      kind !== "leaf" &&
      kind !== "column" &&
      kind !== "cell"
    )
      deny();
    requireTableRendererMember(
      target,
      kind === "leaf" ? "header" : kind,
      value,
    );
    check();
    // Recover the genuine argument from the inspected real collection, not an
    // alleged object's id/prototype. All subsequent properties belong to it.
    if (kind === "row") {
      const row = view.rows.find((candidate) => candidate === value) ?? deny();
      selected = Object.freeze({
        kind,
        id: row.id,
        token: nativeIdentity(row),
      });
    } else if (kind === "leaf") {
      const leaf =
        leaves.find(
          (candidate) => candidate.token === nativeIdentity(value as object),
        ) ?? deny();
      selected = Object.freeze({ kind, ...leaf });
    } else if (kind === "column") {
      const column =
        view.visibleColumns.find((candidate) => candidate === value) ?? deny();
      if (column.id === selectionId || !policy(column.id)) deny();
      selected = Object.freeze({
        kind,
        id: column.id,
        token: nativeIdentity(column),
      });
    } else {
      let found: NativeLifetimeReady["selected"];
      for (const row of view.rows) {
        check();
        const cells = row.getVisibleCells();
        check();
        const cell = cells.find((candidate) => candidate === value);
        if (!cell) continue;
        if (
          !visible.has(cell.column.id) ||
          cell.column.id === selectionId ||
          !policy(cell.column.id)
        )
          deny();
        found = Object.freeze({
          kind,
          id: cell.id,
          token: nativeIdentity(cell),
          row: nativeIdentity(row),
          column: nativeIdentity(cell.column),
          columnId: cell.column.id,
        });
        break;
      }
      selected = found ?? deny();
    }
    check();
  }
  const owner = model.sourceTarget?.owner ?? deny();
  const controls = getControlsAuthorityOwner(model.authority ?? deny());
  if (
    controls?.definition !== definition.native ||
    controls.controller !== model.controller
  )
    deny();
  const origin = current.origin;
  const result: NativeLifetimeReady = Object.freeze({
    kind: "ready",
    domain: Object.freeze([
      nativeIdentity(definition),
      nativeIdentity(definition.native),
      nativeIdentity(definition.native.controllerDefinition),
      nativeIdentity(origin.controller),
      nativeIdentity(owner),
      nativeIdentity(owner.publication),
      origin.epoch,
      origin.context.definitionKey,
      origin.context.scopeKey,
      origin.context.access,
      current.metadata.mode,
    ]),
    frame: nativeIdentity(model.frame ?? deny()),
    native: nativeIdentity(view.native),
    rows: Object.freeze(rows),
    leaves: Object.freeze(leaves),
    cells: Object.freeze(cells),
    ...(selected ? { selected } : {}),
  });
  check();
  return result;
}
export function tableRendererBoundary<
  S extends QuerySchema,
  T extends object,
  Value,
>(target: TableRendererTarget<S, T>, read: () => Value): Value {
  const before = requireTableRendererTarget(target);
  try {
    return read();
  } finally {
    if (requireTableRendererTarget(target).model !== before.model) deny();
  }
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
      const ports = new RendererCapture(check, role, admission.target).capture(
        input,
      );
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
