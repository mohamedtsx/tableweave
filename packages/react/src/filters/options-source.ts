import { cloneJson, isRecord } from "../contracts/json.js";
import type { ScalarId } from "../contracts/types.js";
import type {
  FilterOption,
  OptionInvalidationReason,
  OptionInvalidation,
  OptionRequest,
  OptionRequestInput,
  OptionSource,
  OptionSourceContext,
  OptionSourceError,
  OptionSourceErrorCode,
  OptionSourceOptions,
  OptionSourceView,
  SelectedOptionLabel,
} from "./editor-types.js";
import type { OptionCriteriaClaim } from "./options-criteria-core.js";
import {
  optionCriteriaUnavailable,
  registerOptionCriteriaCapability,
} from "./options-criteria-core.js";

function invalid(): never {
  throw new Error("Invalid Tableweave option source input.");
}

// Capture the data descriptors once, never validate a getter/proxy read and then
// reread the original object into a snapshot. Functions are allowed as captured
// callback values; only explicitly validated fields are retained by the source.
function captureEnvelope(
  input: unknown,
  check?: () => void,
): Record<string, unknown> {
  try {
    if (check) {
      const read = <T>(action: () => T): T => {
        try {
          return action();
        } finally {
          check();
        }
      };
      if (!read(() => isRecord(input))) invalid();
      const captured: Record<string, unknown> = Object.create(null);
      for (const key of read(() => Reflect.ownKeys(input as object))) {
        if (typeof key !== "string") invalid();
        const descriptor = read(() =>
          Object.getOwnPropertyDescriptor(input, key),
        );
        if (!descriptor?.enumerable || !Object.hasOwn(descriptor, "value"))
          invalid();
        captured[key] = descriptor.value;
      }
      return captured;
    }
    if (!isRecord(input)) invalid();
    const descriptors = Object.getOwnPropertyDescriptors(input);
    const captured: Record<string, unknown> = Object.create(null);
    for (const key of Reflect.ownKeys(descriptors)) {
      if (typeof key !== "string") invalid();
      const descriptor = descriptors[key];
      if (!descriptor?.enumerable || !Object.hasOwn(descriptor, "value"))
        invalid();
      captured[key] = descriptor.value;
    }
    return captured;
  } catch {
    return invalid();
  }
}

// Adopted mutation capture must stop after EACH hostile reflection, including an
// unsuccessful one. Keep the raw cloneJson path unchanged for unadopted sources.
function guardedClone<T>(input: T, check: () => void): T {
  const read = <R>(action: () => R): R => {
    try {
      return action();
    } finally {
      check();
    }
  };
  type Task =
    | { value: unknown; put: (value: unknown) => void }
    | { leave: object };
  let result: unknown;
  const stack: Task[] = [
    {
      value: input,
      put: (value) => {
        result = value;
      },
    },
  ];
  const active = new Set<object>();
  const captures = new WeakMap<object, readonly [string, unknown][]>();
  while (stack.length) {
    check();
    const task = stack.pop();
    if (!task) break;
    if ("leave" in task) {
      active.delete(task.leave);
      continue;
    }
    const value = task.value;
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "boolean" ||
      (typeof value === "number" && Number.isFinite(value))
    ) {
      task.put(typeof value === "number" && value === 0 ? 0 : value);
      continue;
    }
    if (typeof value !== "object" || active.has(value)) return invalid();
    const array = read(() => Array.isArray(value));
    if (!array && !read(() => isRecord(value))) return invalid();
    let entries = captures.get(value);
    if (!entries) {
      const keys = read(() => Reflect.ownKeys(value));
      const captured: [string, unknown][] = [];
      let length = 0;
      for (const key of keys) {
        if (typeof key !== "string") return invalid();
        const descriptor = read(() =>
          Object.getOwnPropertyDescriptor(value, key),
        );
        if (!descriptor || !Object.hasOwn(descriptor, "value"))
          return invalid();
        if (array && key === "length") {
          length = descriptor.value as number;
          continue;
        }
        if (!descriptor.enumerable) return invalid();
        captured.push([key, descriptor.value]);
      }
      if (
        array &&
        (captured.length !== length ||
          captured.some(
            ([key]) => !/^(0|[1-9]\d*)$/.test(key) || Number(key) >= length,
          ))
      )
        return invalid();
      captured.sort(([a], [b]) =>
        array ? Number(a) - Number(b) : a < b ? -1 : a > b ? 1 : 0,
      );
      entries = captured;
      captures.set(value, entries);
    }
    const output: object = array ? [] : {};
    task.put(output);
    active.add(value);
    stack.push({ leave: value });
    for (let index = entries.length - 1; index >= 0; index--) {
      const entry = entries[index];
      if (!entry) continue;
      const [key, child] = entry;
      stack.push({
        value: child,
        put: (copy) => {
          Object.defineProperty(output, key, {
            value: copy,
            enumerable: true,
            writable: true,
            configurable: true,
          });
        },
      });
    }
  }
  return result as T;
}

function copyContext(
  input: OptionSourceContext,
  check?: () => void,
): OptionSourceContext {
  const { definitionKey, scopeKey, fieldId, access } = captureEnvelope(
    input,
    check,
  );
  if (
    typeof definitionKey !== "string" ||
    !definitionKey ||
    typeof scopeKey !== "string" ||
    !scopeKey ||
    typeof fieldId !== "string" ||
    !fieldId ||
    typeof access !== "boolean"
  )
    invalid();
  return Object.freeze({ definitionKey, scopeKey, fieldId, access });
}
function sameIdentity(a: OptionSourceContext, b: OptionSourceContext): boolean {
  return (
    a.definitionKey === b.definitionKey &&
    a.scopeKey === b.scopeKey &&
    a.fieldId === b.fieldId
  );
}
function sameContext(a: OptionSourceContext, b: OptionSourceContext): boolean {
  return sameIdentity(a, b) && a.access === b.access;
}
function scalarId(value: unknown): value is ScalarId {
  return (
    (typeof value === "string" && value !== "") ||
    (typeof value === "number" && Number.isFinite(value))
  );
}
function copyIds<Id extends ScalarId>(
  input: readonly Id[],
  check?: () => void,
): readonly Id[] {
  try {
    if (!Array.isArray(input)) invalid();
    const ids = check ? guardedClone(input, check) : cloneJson(input);
    if (ids.some((id) => !scalarId(id)) || new Set(ids).size !== ids.length)
      invalid();
    return Object.freeze(ids);
  } catch {
    return invalid();
  }
}
function copyOptions<Id extends ScalarId>(
  input: readonly FilterOption<Id>[],
  check?: () => void,
): readonly FilterOption<Id>[] {
  try {
    if (!Array.isArray(input)) invalid();
    const options = check ? guardedClone(input, check) : cloneJson(input);
    const seen = new Set<ScalarId>();
    return Object.freeze(
      options.map((option) => {
        if (
          !option ||
          !scalarId(option.id) ||
          seen.has(option.id) ||
          typeof option.label !== "string" ||
          !option.label.length ||
          (option.disabled !== undefined &&
            typeof option.disabled !== "boolean")
        )
          invalid();
        seen.add(option.id);
        return Object.freeze({
          id: option.id,
          label: option.label,
          ...(option.disabled === undefined
            ? {}
            : { disabled: option.disabled }),
        });
      }),
    );
  } catch {
    return invalid();
  }
}
const errors: Readonly<Record<OptionSourceErrorCode, OptionSourceError>> =
  Object.freeze({
    unavailable: Object.freeze({
      code: "unavailable",
      message: "Options could not be loaded.",
    }),
    offline: Object.freeze({
      code: "offline",
      message: "Options are unavailable while offline.",
    }),
    timeout: Object.freeze({
      code: "timeout",
      message: "The options request timed out.",
    }),
    "access-lost": Object.freeze({
      code: "access-lost",
      message: "Access to these options is unavailable.",
    }),
  });
function publicError(code: unknown): OptionSourceError {
  return typeof code === "string" && Object.hasOwn(errors, code)
    ? errors[code as OptionSourceErrorCode]
    : errors.unavailable;
}
type Core<Id extends ScalarId> = Pick<
  OptionSourceView<Id>,
  | "context"
  | "active"
  | "kind"
  | "request"
  | "page"
  | "selected"
  | "error"
  | "invalidationFailed"
>;
function makeView<Id extends ScalarId>(
  core: Core<Id>,
  retryAvailable = false,
): OptionSourceView<Id> {
  const busy = core.kind === "pending";
  const stale = core.page !== null && (busy || core.kind === "failure");
  const blocked =
    !core.context.access ||
    core.kind === "blocked" ||
    core.kind === "disposed" ||
    core.invalidationFailed;
  const usable = !blocked && core.active;
  return Object.freeze({
    ...core,
    display: blocked
      ? "blocked"
      : core.page
        ? core.page.options.length
          ? "options"
          : "empty"
        : busy
          ? "loading"
          : core.kind === "failure"
            ? "error"
            : "idle",
    notice: stale ? (busy ? "loading" : "load-failed") : null,
    busy,
    stale,
    canChoose: usable && core.kind === "ready" && core.page !== null,
    canLoadMore: usable && core.kind === "ready" && core.page?.hasMore === true,
    canRetry: usable && core.kind === "failure" && retryAvailable,
  });
}
function selectedLabels<Id extends ScalarId>(
  ids: readonly Id[],
  known: ReadonlyMap<Id, FilterOption<Id>>,
): readonly SelectedOptionLabel<Id>[] {
  return Object.freeze(
    ids.map((id) => {
      const option = known.get(id);
      return Object.freeze({
        id,
        label: option?.label ?? String(id),
        known: option !== undefined,
      });
    }),
  );
}

/** Pure privacy/accepted-ID projection. It never adopts data or changes context. */
export function projectOptionSourceView<Id extends ScalarId>(
  view: OptionSourceView<Id>,
  expected: OptionSourceContext,
  acceptedSelectedIds?: readonly Id[],
): OptionSourceView<Id> {
  const context = copyContext(expected);
  // A stale allowed prop must not conceal a current terminal access failure.
  if (
    sameIdentity(view.context, context) &&
    !view.context.access &&
    context.access
  )
    return view;
  if (sameContext(view.context, context)) {
    if (
      acceptedSelectedIds === undefined ||
      !context.access ||
      view.kind === "blocked" ||
      view.invalidationFailed ||
      view.kind === "disposed"
    )
      return view;
    const ids = copyIds(acceptedSelectedIds);
    if (
      ids.length === view.selected.length &&
      ids.every((id, index) => id === view.selected[index]?.id)
    )
      return view;
    const known = new Map<Id, FilterOption<Id>>();
    for (const label of view.selected)
      if (label.known) known.set(label.id, label);
    for (const option of view.page?.options ?? []) known.set(option.id, option);
    return Object.freeze({ ...view, selected: selectedLabels(ids, known) });
  }
  const ids =
    context.access &&
    view.kind !== "disposed" &&
    acceptedSelectedIds !== undefined
      ? copyIds(acceptedSelectedIds)
      : [];
  return makeView({
    context,
    active: view.active,
    kind:
      view.kind === "disposed"
        ? "disposed"
        : context.access
          ? "idle"
          : "blocked",
    request: null,
    page: null,
    selected: selectedLabels(ids, new Map()),
    error: context.access ? null : publicError("access-lost"),
    invalidationFailed: view.invalidationFailed,
  });
}

export function createOptionSource<Id extends ScalarId = ScalarId>(
  initial: OptionSourceContext,
  options: OptionSourceOptions = {},
): OptionSource<Id> {
  const onInvalidate = captureEnvelope(options)
    .onInvalidate as OptionSourceOptions["onInvalidate"];
  if (onInvalidate !== undefined && typeof onInvalidate !== "function")
    invalid();
  const context = copyContext(initial);
  const sourceId = Object.freeze({});
  let ids: readonly Id[] = Object.freeze([]);
  let known = new Map<Id, FilterOption<Id>>();
  let core: Core<Id> = {
    context,
    active: true,
    kind: context.access ? "idle" : "blocked",
    request: null,
    page: null,
    selected: Object.freeze([]),
    error: context.access ? null : publicError("access-lost"),
    invalidationFailed: false,
  };
  let view = makeView(core);
  const serverView = view;
  const listeners = new Set<{ notify: () => void }>();
  let sequence = 0;
  let open = false;
  let retryCallback: OptionRequestInput["retry"];
  let mutating = false;
  let notifying = 0;
  let lease: object | null = null;
  // Only the private criteria purge advances this barrier. With no adopted reset,
  // raw mutation/refusal/notification ordering is unchanged.
  let barrier: object = {};
  let cleanHistory = true;
  let lifecycleVersion: object = {};
  let criteriaBlocked = false;
  type Listener = { notify: () => void };
  interface Reset {
    readonly id: object;
    readonly previous: OptionSourceContext;
    event: OptionInvalidation | null;
    invalidated: boolean;
    applied: boolean;
    cohort: readonly Listener[] | null;
    readonly notified: Set<Listener>;
    version: object | null;
    done: boolean;
  }
  interface Admission {
    readonly check: () => void;
    phase: "reserved" | "active" | "purged";
    reset: Reset | null;
  }
  let admission: Admission | null = null;
  const captureGuard = (check: () => void) =>
    admission || criteriaBlocked ? check : undefined;
  const checked = <T>(check: () => void, read: () => T): T => {
    try {
      return read();
    } finally {
      check();
    }
  };
  const change = <R>(noop: R, action: (check: () => void) => R): R => {
    if (mutating || core.kind === "disposed") return noop;
    const token = barrier;
    const check = () => {
      if (barrier !== token) optionCriteriaUnavailable();
    };
    mutating = true;
    try {
      const result = action(check);
      check();
      return result;
    } catch {
      if (barrier !== token) return noop;
      if (admission?.phase === "active" && !available()) return noop;
      return invalid();
    } finally {
      mutating = false;
    }
  };
  const publish = (check: () => void) => {
    check();
    core = { ...core, selected: selectedLabels(ids, known) };
    view = makeView(core, retryCallback !== undefined);
    const previousMutation = mutating;
    mutating = false;
    notifying++;
    try {
      for (const entry of [...listeners]) {
        if (!listeners.has(entry)) continue;
        try {
          entry.notify();
        } catch {
          /* Broken observers cannot retain private labels. */
        }
        check();
      }
    } finally {
      notifying--;
      mutating = previousMutation;
    }
  };
  const available = () => {
    if (
      !core.active ||
      !core.context.access ||
      core.invalidationFailed ||
      criteriaBlocked
    )
      return false;
    if (admission) {
      if (admission.phase !== "active") return false;
      try {
        admission.check();
      } catch {
        return false;
      }
    }
    return true;
  };
  const current = (request: OptionRequest) =>
    available() && core.request === request;
  const dataCheck = (check: () => void) => () => {
    check();
    if (admission && !available()) optionCriteriaUnavailable();
  };
  const invalidate = (
    check: () => void,
    reason: OptionInvalidationReason,
    next: OptionSourceContext,
    active = core.active,
  ) => {
    check();
    const previous = core.context;
    lifecycleVersion = {};
    cleanHistory = false;
    ids = Object.freeze([]);
    known = new Map();
    open = false;
    retryCallback = undefined;
    core = {
      context: next,
      active,
      kind:
        reason === "dispose"
          ? "disposed"
          : next.access && !criteriaBlocked
            ? "idle"
            : "blocked",
      request: null,
      page: null,
      selected: Object.freeze([]),
      error: next.access ? null : publicError("access-lost"),
      invalidationFailed: false,
    };
    view = makeView(core);
    try {
      const result: unknown = onInvalidate?.(
        Object.freeze({ reason, previous, next }),
      );
      check();
      cleanHistory = result === undefined;
      if (
        result !== null &&
        (typeof result === "object" || typeof result === "function") &&
        typeof checked(check, () => (result as { then?: unknown }).then) ===
          "function"
      ) {
        core = { ...core, invalidationFailed: true };
        void Promise.resolve(result).catch(() => {});
        check();
      }
    } catch {
      check();
      cleanHistory = false;
      core = { ...core, invalidationFailed: true };
    }
    publish(check);
  };
  const begin = (input: OptionRequestInput): OptionRequest | null =>
    change(null, (check) => {
      if (!available() || notifying) return null;
      const live = dataCheck(check);
      const { definitionKey, scopeKey, fieldId, term, pageKey, retry } =
        checked(live, () => captureEnvelope(input, captureGuard(live)));
      if (
        definitionKey !== core.context.definitionKey ||
        scopeKey !== core.context.scopeKey ||
        fieldId !== core.context.fieldId
      )
        return null;
      if (
        typeof term !== "string" ||
        typeof pageKey !== "string" ||
        (retry !== undefined && typeof retry !== "function")
      )
        invalid();
      const request = Object.freeze({
        definitionKey: core.context.definitionKey,
        scopeKey: core.context.scopeKey,
        fieldId: core.context.fieldId,
        sourceId,
        generation: ++sequence,
        term,
        pageKey,
      });
      const page =
        core.page?.request.term === request.term &&
        core.page.request.pageKey === request.pageKey
          ? core.page
          : null;
      open = true;
      cleanHistory = false;
      retryCallback = retry as OptionRequestInput["retry"];
      core = { ...core, kind: "pending", request, page, error: null };
      publish(live);
      return core.request === request ? request : null;
    });
  const fail = (request: OptionRequest, code: unknown): boolean =>
    change(false, (check) => {
      if (!current(request) || !open) return false;
      const error = publicError(code);
      if (error.code === "access-lost")
        invalidate(
          check,
          "access-loss",
          copyContext({ ...core.context, access: false }),
        );
      else {
        open = false;
        core = { ...core, kind: "failure", error };
        publish(check);
      }
      return true;
    });
  const source: OptionSource<Id> = {
    getSnapshot: () => view,
    getServerSnapshot: () => serverView,
    subscribe(listener) {
      if (core.kind === "disposed") return () => {};
      const entry = { notify: listener };
      listeners.add(entry);
      return () => listeners.delete(entry);
    },
    begin,
    succeed(request, result) {
      return change(false, (check) => {
        if (!current(request) || !open) return false;
        const live = dataCheck(check);
        const { options: suppliedOptions, hasMore } = checked(live, () =>
          captureEnvelope(result, captureGuard(live)),
        );
        const pageOptions = checked(live, () =>
          copyOptions(
            suppliedOptions as readonly FilterOption<Id>[],
            captureGuard(live),
          ),
        );
        if (typeof hasMore !== "boolean") invalid();
        const page = Object.freeze({
          request,
          options: pageOptions,
          hasMore,
        });
        const byId = new Map(pageOptions.map((option) => [option.id, option]));
        known = new Map(
          ids.flatMap((id) => {
            const label = byId.get(id) ?? known.get(id);
            return label ? [[id, label] as const] : [];
          }),
        );
        open = false;
        retryCallback = undefined;
        core = { ...core, kind: "ready", page, error: null };
        publish(live);
        return true;
      });
    },
    fail,
    retry() {
      if (!view.canRetry || !core.request || !retryCallback || mutating)
        return null;
      const callback = retryCallback;
      const token = barrier;
      const request = begin({ ...core.request, retry: callback });
      if (!request || token !== barrier || (admission && !available()))
        return null;
      try {
        const result = callback(request);
        if (token !== barrier || (admission && !available())) return null;
        if (result !== undefined)
          void Promise.resolve(result).catch(() =>
            fail(request, "unavailable"),
          );
      } catch {
        if (token !== barrier || (admission && !available())) return null;
        fail(request, "unavailable");
      }
      return token === barrier && (!admission || available()) ? request : null;
    },
    setSelectedIds(expected, selected) {
      return change(false, (check) => {
        if (!available()) return false;
        const live = dataCheck(check);
        const captured = checked(live, () =>
          copyContext(expected, captureGuard(live)),
        );
        if (!sameContext(core.context, captured)) return false;
        const next = checked(live, () => copyIds(selected, captureGuard(live)));
        if (
          next.length === ids.length &&
          next.every((id, index) => id === ids[index])
        )
          return true;
        const pageLabels = new Map(
          core.page?.options.map((option) => [option.id, option]) ?? [],
        );
        known = new Map(
          next.flatMap((id) => {
            const label = pageLabels.get(id) ?? known.get(id);
            return label ? [[id, label] as const] : [];
          }),
        );
        ids = next;
        cleanHistory = false;
        publish(live);
        return true;
      });
    },
    recoverSelectedLabels(request, labels) {
      return change(false, (check) => {
        if (!current(request)) return false;
        const live = dataCheck(check);
        const recovered = checked(live, () =>
          copyOptions(labels, captureGuard(live)),
        );
        let changed = false;
        for (const option of recovered) {
          if (
            !ids.includes(option.id) ||
            known.get(option.id)?.label === option.label
          )
            continue;
          known.set(option.id, option);
          changed = true;
        }
        if (changed) publish(live);
        return true;
      });
    },
    setContext(nextInput) {
      change(undefined, (check) => {
        const next = checked(check, () =>
          copyContext(nextInput, captureGuard(check)),
        );
        if (sameContext(core.context, next)) return;
        const reason =
          core.context.scopeKey !== next.scopeKey
            ? "scope-change"
            : core.context.definitionKey !== next.definitionKey
              ? "definition-change"
              : core.context.fieldId !== next.fieldId
                ? "field-change"
                : next.access
                  ? "access-change"
                  : "access-loss";
        invalidate(check, reason, next);
      });
    },
    clear(reason = "reset") {
      change(undefined, (check) => {
        if (reason !== "reset" && reason !== "unmount") invalid();
        invalidate(
          check,
          reason,
          core.context,
          reason === "unmount" ? false : core.active,
        );
      });
    },
    connect() {
      if (core.kind === "disposed") return () => {};
      if (lease !== null || mutating) invalid();
      const currentLease = {};
      lease = currentLease;
      change(undefined, (check) => {
        if (!core.active) {
          core = { ...core, active: true };
          publish(check);
        }
      });
      return () => {
        if (lease !== currentLease) return;
        lease = null;
        source.clear("unmount");
      };
    },
    dispose() {
      change(undefined, (check) => {
        lease = null;
        try {
          invalidate(check, "dispose", core.context, false);
        } finally {
          // A criteria purge can interrupt dispose's callback/notification. The
          // terminal source still owns releasing its listeners; no newer source
          // claim can be installed on a disposed factory object.
          if (core.kind === "disposed") listeners.clear();
        }
      });
    },
  };
  registerOptionCriteriaCapability(
    source,
    Object.freeze({
      reserve(
        expected: OptionSourceContext,
        authorityCheck: () => void,
      ): OptionCriteriaClaim {
        authorityCheck();
        if (
          admission ||
          mutating ||
          notifying ||
          core.kind === "disposed" ||
          core.invalidationFailed ||
          !expected.access ||
          !sameContext(core.context, expected) ||
          !cleanHistory ||
          ids.length ||
          known.size ||
          core.request ||
          core.page ||
          open ||
          retryCallback
        )
          return optionCriteriaUnavailable();
        const reservedView = view;
        const reservedBarrier = barrier;
        const entry: Admission = {
          check: authorityCheck,
          phase: "reserved",
          reset: null,
        };
        admission = entry;
        const owns = () => {
          if (admission !== entry) optionCriteriaUnavailable();
        };
        const quiescent = () => {
          owns();
          if (mutating || notifying) optionCriteriaUnavailable();
        };
        const claim: OptionCriteriaClaim = Object.freeze({
          activate(check: () => void) {
            quiescent();
            check();
            if (
              entry.phase !== "reserved" ||
              barrier !== reservedBarrier ||
              view !== reservedView ||
              core.kind === "disposed"
            )
              return optionCriteriaUnavailable();
            const token = barrier;
            const active = () => {
              owns();
              if (barrier !== token || entry.phase !== "active")
                optionCriteriaUnavailable();
              check();
            };
            entry.phase = "active";
            criteriaBlocked = false;
            core = { ...core, kind: "idle", invalidationFailed: false };
            mutating = true;
            try {
              publish(active);
            } finally {
              mutating = false;
            }
          },
          rollback() {
            if (admission === entry && entry.phase === "reserved")
              admission = null;
          },
          purge() {
            if (entry.reset) return entry.reset.id;
            owns();
            const reset: Reset = {
              id: Object.freeze({}),
              previous: core.context,
              event: null,
              invalidated: false,
              applied: false,
              cohort: null,
              notified: new Set(),
              version: lifecycleVersion,
              done: false,
            };
            entry.reset = reset;
            entry.phase = "purged";
            barrier = {};
            criteriaBlocked = true;
            cleanHistory = false;
            ids = Object.freeze([]);
            known = new Map();
            open = false;
            retryCallback = undefined;
            core = {
              ...core,
              kind: core.kind === "disposed" ? "disposed" : "blocked",
              request: null,
              page: null,
              selected: Object.freeze([]),
              error: null,
              invalidationFailed: false,
            };
            view = makeView(core);
            return reset.id;
          },
          cleanup(
            ticket: object,
            kind: "transition" | "release" | "dispose",
            next: OptionSourceContext | null,
            check: () => void,
          ) {
            const reset = entry.reset;
            if (!reset || reset.id !== ticket)
              return optionCriteriaUnavailable();
            if (reset.done) return;
            quiescent();
            if (entry.phase !== "purged") return optionCriteriaUnavailable();
            const token = barrier;
            const currentReset = () => {
              owns();
              if (barrier !== token || entry.reset !== reset)
                optionCriteriaUnavailable();
              check();
            };
            currentReset();
            if (!reset.event) {
              const target = next ?? reset.previous;
              const reason: OptionInvalidationReason =
                kind === "release"
                  ? "unmount"
                  : kind === "dispose"
                    ? "dispose"
                    : target.scopeKey !== reset.previous.scopeKey
                      ? "scope-change"
                      : target.definitionKey !== reset.previous.definitionKey
                        ? "definition-change"
                        : target.fieldId !== reset.previous.fieldId
                          ? "field-change"
                          : target.access !== reset.previous.access
                            ? target.access
                              ? "access-change"
                              : "access-loss"
                            : "reset";
              reset.event = Object.freeze({
                reason,
                previous: reset.previous,
                next: target,
              });
            }
            mutating = true;
            try {
              if (!reset.invalidated) {
                // Bare invocation preserves the legacy undefined receiver. Unlike
                // raw invalidate, adopted acknowledgement never reads .then.
                const result: unknown = onInvalidate?.(reset.event);
                currentReset();
                if (result !== undefined) return optionCriteriaUnavailable();
                reset.invalidated = true;
              }
              if (!reset.applied) {
                // An explicit newer raw context acceptance is never overwritten by
                // completion of this older, still-owed captured lifecycle operation.
                if (lifecycleVersion === reset.version) {
                  core = {
                    ...core,
                    context: reset.event.next,
                    active:
                      kind === "transition" && core.kind !== "disposed"
                        ? core.active
                        : false,
                    kind: core.kind === "disposed" ? "disposed" : "blocked",
                    invalidationFailed: false,
                  };
                  lifecycleVersion = {};
                  reset.version = lifecycleVersion;
                }
                reset.applied = true;
              }
              if (lifecycleVersion === reset.version)
                core = { ...core, invalidationFailed: false };
              view = makeView(core);
              reset.cohort ??= [...listeners];
              // Each successful observer is acknowledged once; failed/reentrant
              // observers remain owed without rerunning the invalidation callback.
              mutating = false;
              notifying++;
              try {
                for (const listener of reset.cohort) {
                  if (reset.notified.has(listener) || !listeners.has(listener))
                    continue;
                  const result: unknown = listener.notify();
                  currentReset();
                  if (result !== undefined) return optionCriteriaUnavailable();
                  reset.notified.add(listener);
                }
              } finally {
                notifying--;
                mutating = true;
              }
              currentReset();
              if (lifecycleVersion === reset.version) cleanHistory = true;
              reset.done = true;
              reset.cohort = null;
              reset.notified.clear();
              admission = null;
              // criteriaBlocked intentionally survives: only explicit registration
              // of a real newly settled domain can make this source usable again.
            } catch {
              if (admission === entry && barrier === token) {
                core = { ...core, invalidationFailed: true };
                view = makeView(core);
              }
              return optionCriteriaUnavailable();
            } finally {
              mutating = false;
            }
          },
        });
        try {
          authorityCheck();
        } catch {
          claim.rollback();
          return optionCriteriaUnavailable();
        }
        return claim;
      },
    }),
  );
  return Object.freeze(source);
}
