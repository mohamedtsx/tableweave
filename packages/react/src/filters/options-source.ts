import { cloneJson, isRecord } from "../contracts/json.js";
import type { ScalarId } from "../contracts/types.js";
import type {
  FilterOption,
  OptionInvalidationReason,
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

function invalid(): never {
  throw new Error("Invalid Tableweave option source input.");
}

// Capture the data descriptors once, never validate a getter/proxy read and then
// reread the original object into a snapshot. Functions are allowed as captured
// callback values; only explicitly validated fields are retained by the source.
function captureEnvelope(input: unknown): Record<string, unknown> {
  try {
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

function copyContext(input: OptionSourceContext): OptionSourceContext {
  const { definitionKey, scopeKey, fieldId, access } = captureEnvelope(input);
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
function copyIds<Id extends ScalarId>(input: readonly Id[]): readonly Id[] {
  try {
    if (!Array.isArray(input)) invalid();
    const ids = cloneJson(input);
    if (ids.some((id) => !scalarId(id)) || new Set(ids).size !== ids.length)
      invalid();
    return Object.freeze(ids);
  } catch {
    return invalid();
  }
}
function copyOptions<Id extends ScalarId>(
  input: readonly FilterOption<Id>[],
): readonly FilterOption<Id>[] {
  try {
    if (!Array.isArray(input)) invalid();
    const options = cloneJson(input);
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
    !core.context.access || core.kind === "disposed" || core.invalidationFailed;
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
  const change = <R>(noop: R, action: () => R): R => {
    if (mutating || core.kind === "disposed") return noop;
    mutating = true;
    try {
      return action();
    } catch {
      return invalid();
    } finally {
      mutating = false;
    }
  };
  const publish = () => {
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
      }
    } finally {
      notifying--;
      mutating = previousMutation;
    }
  };
  const available = () =>
    core.active && core.context.access && !core.invalidationFailed;
  const current = (request: OptionRequest) =>
    available() && core.request === request;
  const invalidate = (
    reason: OptionInvalidationReason,
    next: OptionSourceContext,
    active = core.active,
  ) => {
    const previous = core.context;
    ids = Object.freeze([]);
    known = new Map();
    open = false;
    retryCallback = undefined;
    core = {
      context: next,
      active,
      kind:
        reason === "dispose" ? "disposed" : next.access ? "idle" : "blocked",
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
      if (
        result !== null &&
        (typeof result === "object" || typeof result === "function") &&
        typeof (result as { then?: unknown }).then === "function"
      ) {
        core = { ...core, invalidationFailed: true };
        void Promise.resolve(result).catch(() => {});
      }
    } catch {
      core = { ...core, invalidationFailed: true };
    }
    publish();
  };
  const begin = (input: OptionRequestInput): OptionRequest | null =>
    change(null, () => {
      if (!available() || notifying) return null;
      const { definitionKey, scopeKey, fieldId, term, pageKey, retry } =
        captureEnvelope(input);
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
      retryCallback = retry as OptionRequestInput["retry"];
      core = { ...core, kind: "pending", request, page, error: null };
      publish();
      return core.request === request ? request : null;
    });
  const fail = (request: OptionRequest, code: unknown): boolean =>
    change(false, () => {
      if (!current(request) || !open) return false;
      const error = publicError(code);
      if (error.code === "access-lost")
        invalidate(
          "access-loss",
          copyContext({ ...core.context, access: false }),
        );
      else {
        open = false;
        core = { ...core, kind: "failure", error };
        publish();
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
      return change(false, () => {
        if (!current(request) || !open) return false;
        const { options: suppliedOptions, hasMore } = captureEnvelope(result);
        const pageOptions = copyOptions(
          suppliedOptions as readonly FilterOption<Id>[],
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
        publish();
        return true;
      });
    },
    fail,
    retry() {
      if (!view.canRetry || !core.request || !retryCallback || mutating)
        return null;
      const callback = retryCallback;
      const request = begin({ ...core.request, retry: callback });
      if (!request) return null;
      try {
        const result = callback(request);
        if (result !== undefined)
          void Promise.resolve(result).catch(() =>
            fail(request, "unavailable"),
          );
      } catch {
        fail(request, "unavailable");
      }
      return request;
    },
    setSelectedIds(expected, selected) {
      return change(false, () => {
        if (!available()) return false;
        const captured = copyContext(expected);
        if (!sameContext(core.context, captured)) return false;
        const next = copyIds(selected);
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
        publish();
        return true;
      });
    },
    recoverSelectedLabels(request, labels) {
      return change(false, () => {
        if (!current(request)) return false;
        const recovered = copyOptions(labels);
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
        if (changed) publish();
        return true;
      });
    },
    setContext(nextInput) {
      change(undefined, () => {
        const next = copyContext(nextInput);
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
        invalidate(reason, next);
      });
    },
    clear(reason = "reset") {
      change(undefined, () => {
        if (reason !== "reset" && reason !== "unmount") invalid();
        invalidate(
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
      change(undefined, () => {
        if (!core.active) {
          core = { ...core, active: true };
          publish();
        }
      });
      return () => {
        if (lease !== currentLease) return;
        lease = null;
        source.clear("unmount");
      };
    },
    dispose() {
      change(undefined, () => {
        lease = null;
        invalidate("dispose", core.context, false);
        listeners.clear();
      });
    },
  };
  return Object.freeze(source);
}
