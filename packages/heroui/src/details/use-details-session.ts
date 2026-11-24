"use client";

import type {
  MutationResult,
  TableController,
  TableState,
} from "@tableweave/react";
import { useTableweaveState } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { getDetailsBinding } from "../data-table/details-binding.js";
import type { CapturedCallback } from "./identity.js";
import {
  captureAuthority,
  captureCallback,
  captureContext,
  currentNativeRow,
  currentSource,
  ownData,
  readCurrent,
  sameContext,
  sameLifecycle,
} from "./identity.js";
import {
  recordAdoptedDetailsSession,
  recordDetailsSession,
} from "./session-identity.js";
import type {
  DetailsAccessory,
  DetailsAuthority,
  DetailsChangeRequest,
  DetailsContext,
  DetailsOpenOptions,
  DetailsOptions,
  DetailsOutcome,
  DetailsReason,
  DetailsSession,
  DetailsSource,
} from "./types.js";

function observe<A extends readonly unknown[]>(
  callback: CapturedCallback<A, unknown>,
  ...args: A
): void {
  try {
    if (callback.invoke)
      void Promise.resolve(callback.invoke(...args)).catch(() => {});
  } catch {
    /* Observer/focus failures never alter a controller transition. */
  }
}

/** Genuine bound producer from its first render. Never calls the legacy hook. */
export function useBoundDetailsSession<S extends QuerySchema, T extends object>(
  accessory: DetailsAccessory<S, T>,
): DetailsSession<S, T> {
  const binding = getDetailsBinding(accessory);
  const snapshot = useSyncExternalStore(
    binding.subscribe,
    binding.getSnapshot,
    binding.getSnapshot,
  );
  const actor = snapshot.actor;
  const session: DetailsSession<S, T> = Object.freeze<DetailsSession<S, T>>({
    get contentKey() {
      return binding.readSession(actor).contentKey;
    },
    get isOpen() {
      return binding.readSession(actor).isOpen;
    },
    get context() {
      return binding.readSession(actor).context;
    },
    get canRetry() {
      return binding.readSession(actor).canRetry;
    },
    requestOpen: (id, options) =>
      actor
        ? binding.open(actor, id, options)
        : Promise.resolve({ status: "stale" }),
    requestClose: (reason = "programmatic") =>
      actor
        ? binding.request(actor, null, reason)
        : Promise.resolve({ status: "stale" }),
    retry: () => (actor ? binding.retry(actor) : Promise.resolve("stale")),
  });
  recordAdoptedDetailsSession(session, binding);
  return session;
}

function fieldIds(input: unknown): readonly string[] {
  try {
    return Array.isArray(input) ? input : [];
  } catch {
    return [];
  }
}

/** Source-private shared policy/transition implementation, not an authority factory. */
export interface DetailsRequestRuntime<S extends QuerySchema> {
  readonly origin: () => DetailsAuthority | null;
  readonly baseline: () => TableState<S>["details"];
  readonly store: (token: object, data: DetailsRequestData<S>) => void;
  readonly load: (token: object) => DetailsRequestData<S> | null;
  readonly forget: (token: object) => void;
  readonly current: () => {
    readonly binding: {
      readonly controller: TableController<S>;
      readonly beforeChange: CapturedCallback<
        [DetailsChangeRequest],
        boolean | Promise<boolean>
      >;
    };
    readonly authority: DetailsAuthority;
  } | null;
  readonly observer: () =>
    | CapturedCallback<[DetailsOutcome<S>, DetailsChangeRequest], void>
    | undefined;
  readonly mounted: () => boolean;
  readonly pending: () => object | null;
  readonly setPending: (value: object | null) => void;
  readonly setBusy: (value: boolean) => void;
  readonly captureRestore: (
    options: DetailsOpenOptions | undefined,
  ) => CapturedCallback<[], boolean>;
  readonly restore: (context: DetailsContext, focus: () => boolean) => void;
  readonly result?: (
    result: MutationResult<S>,
    change: DetailsChangeRequest,
  ) => void;
}
export interface DetailsRequestData<S extends QuerySchema> {
  readonly change: DetailsChangeRequest;
  readonly baseline: TableState<S>["details"];
  readonly observer:
    | CapturedCallback<[DetailsOutcome<S>, DetailsChangeRequest], void>
    | undefined;
  readonly options: DetailsOpenOptions | undefined;
  readonly controller: TableController<S>;
}
function reportRequest<S extends QuerySchema>(
  runtime: DetailsRequestRuntime<S>,
  data: Pick<DetailsRequestData<S>, "observer" | "change">,
  outcome: DetailsOutcome<S>,
): DetailsOutcome<S> {
  if (runtime.mounted() && data.observer)
    observe(data.observer, outcome, data.change);
  return outcome;
}
function beginRequest<S extends QuerySchema>(
  runtime: DetailsRequestRuntime<S>,
  toId: string | null,
  reason: DetailsReason,
  openOptions?: DetailsOpenOptions,
):
  | { outcome: DetailsOutcome<S> }
  | { token: object; decision: boolean | Promise<boolean> } {
  const origin = runtime.origin();
  if (!origin) return { outcome: { status: "stale" } };
  const currentAtStart = runtime.current(),
    observer = runtime.observer();
  const change: DetailsChangeRequest = Object.freeze({
    authority: currentAtStart?.authority ?? origin,
    fromId: origin.rowId,
    toId,
    reason,
  });
  const report = (outcome: DetailsOutcome<S>) => ({
    outcome: reportRequest(runtime, { observer, change }, outcome),
  });
  if (toId !== null && (!toId || typeof toId !== "string"))
    return report({ status: "failed" });
  if (!currentAtStart) return report({ status: "stale" });
  const latest = currentAtStart.binding;
  if (!latest.beforeChange.valid) return report({ status: "blocked" });
  if (toId === origin.rowId) return report({ status: "noop" });
  if (runtime.pending()) return report({ status: "busy" });
  const token = {};
  try {
    runtime.store(token, {
      change,
      baseline: runtime.baseline(),
      observer,
      options: openOptions,
      controller: latest.controller,
    });
    runtime.setPending(token);
    runtime.setBusy(true);
    const decision = latest.beforeChange.invoke
      ? latest.beforeChange.invoke(change)
      : true;
    return { token, decision };
  } catch {
    const data = runtime.load(token);
    const outcome = data
      ? reportRequest(runtime, data, { status: "failed" })
      : ({ status: "stale" } as const);
    finishActivity(runtime, token);
    return { outcome };
  }
}
function finishActivity<S extends QuerySchema>(
  runtime: DetailsRequestRuntime<S>,
  token: object,
): void {
  try {
    if (runtime.pending() === token) {
      runtime.setPending(null);
      if (runtime.mounted()) runtime.setBusy(false);
    }
  } catch {
    /* An owner retired during cleanup; never touch its replacement. */
  } finally {
    runtime.forget(token);
  }
}
function completeRequest<S extends QuerySchema>(
  runtime: DetailsRequestRuntime<S>,
  token: object,
  allowed: boolean,
): DetailsOutcome<S> {
  const data = runtime.load(token);
  if (!data) return { status: "stale" };
  const report = (outcome: DetailsOutcome<S>) =>
    reportRequest(runtime, data, outcome);
  const after = runtime.current();
  if (!after || runtime.pending() !== token) return report({ status: "stale" });
  if (!after.binding.beforeChange.valid) return report({ status: "blocked" });
  if (allowed !== true) return report({ status: "blocked" });
  const restore = runtime.captureRestore(data.options);
  if (data.change.toId !== null && restore.invoke)
    runtime.restore(data.change.authority.context, restore.invoke);
  const result = data.controller.dispatch({
    type: "details.change",
    update(previous) {
      const now = runtime.current();
      const current = runtime.load(token);
      if (
        !now?.binding.beforeChange.valid ||
        !current ||
        previous !== current.baseline
      )
        return previous;
      return { rowId: current.change.toId };
    },
  });
  runtime.result?.(result, data.change);
  switch (result.status) {
    case "proposed":
      return report({ status: "submitted", proposal: result.proposal });
    case "committed":
      return report({
        status: "committed",
        notificationFailures: result.notificationFailures,
      });
    case "rejected":
      return report({ status: "rejected" });
    case "noop":
      return report({ status: "noop" });
  }
}
/** Sole async policy/accepted-transition engine. Across await retain only opaque
 * token/runtime and the application's decision promise, never a private request. */
export function runDetailsRequest<S extends QuerySchema>(
  runtime: DetailsRequestRuntime<S>,
  toId: string | null,
  reason: DetailsReason,
  options?: DetailsOpenOptions,
): Promise<DetailsOutcome<S>> {
  try {
    const begun = beginRequest(runtime, toId, reason, options);
    return "outcome" in begun
      ? Promise.resolve(begun.outcome)
      : continueRequest(runtime, begun.token, begun.decision);
  } catch {
    return Promise.resolve({ status: "stale" });
  }
}
async function continueRequest<S extends QuerySchema>(
  runtime: DetailsRequestRuntime<S>,
  token: object,
  decision: boolean | Promise<boolean>,
): Promise<DetailsOutcome<S>> {
  try {
    const allowed = typeof decision === "boolean" ? decision : await decision;
    return completeRequest(runtime, token, allowed);
  } catch {
    const data = runtime.load(token);
    return data
      ? reportRequest(runtime, data, { status: "failed" })
      : { status: "stale" };
  } finally {
    finishActivity(runtime, token);
  }
}

/** One accepted owner. Local state tracks policy activity/owner identity, never open or record state. */
export function useDetailsSession<S extends QuerySchema, T extends object>(
  options: DetailsOptions<S, T>,
): DetailsSession<S, T> {
  // A required owner is captured once. Invalid owner accessors fail with a safe
  // static error rather than invoking a getter or using two different owners.
  const controller = ownData(options, "controller") as DetailsOptions<
    S,
    T
  >["controller"];
  if (!controller || typeof controller !== "object")
    throw new Error("Details requires a controller data property.");
  const state = useTableweaveState(controller);
  const [mount] = useState(() => Object.freeze({}));
  type CapturedOptions = {
    controller: typeof controller;
    authority: DetailsAuthority | null;
    expected: DetailsContext | null;
    source: DetailsSource<T> | null;
    port: unknown;
    permitted: boolean;
    beforeChange: CapturedCallback<
      [DetailsChangeRequest],
      boolean | Promise<boolean>
    >;
    onOutcome: CapturedCallback<
      [DetailsOutcome<S>, DetailsChangeRequest],
      void
    >;
    focusFallback: CapturedCallback<
      ["closed" | "invalidated" | "unmounted"],
      void
    >;
    retry: CapturedCallback<[DetailsAuthority], unknown>;
  };
  const committed = useRef<CapturedOptions | null>(null);
  const pending = useRef<object | null>(null);
  const [policyBusy, setPolicyBusy] = useState(false);
  const [ownerVersion, setOwnerVersion] = useState(0);
  const restore = useRef<{
    context: DetailsOptions<S, T>["expected"];
    focus: () => boolean;
  } | null>(null);
  const wasOpen = useRef(false);
  const lastDetails = useRef(state.details);
  const mounted = useRef(false);
  const expected = captureContext(ownData(options, "expected"));
  const origin = expected?.access
    ? captureAuthority(ownData(options, "authority"))
    : null;
  const port = ownData(options, "port");
  const actual = origin?.context.access ? readCurrent(port) : null;
  const permitted = !!(
    (!committed.current || committed.current.controller === controller) &&
    expected?.access &&
    origin?.context.access &&
    actual &&
    sameLifecycle(origin, actual.authority) &&
    sameContext(expected, origin.context) &&
    expected.definitionKey === state.definitionIdentity &&
    origin.rowId === state.details.rowId
  );
  const isOpen = permitted && state.details.rowId !== null;
  // Denial must precede ALL source inspection, including its authority descriptor.
  const source =
    isOpen && actual
      ? currentSource<T>(actual.authority, ownData(options, "source"))
      : null;
  const beforeChange = captureCallback<
    [DetailsChangeRequest],
    boolean | Promise<boolean>
  >(options, "beforeChange");
  const onOutcome = captureCallback<
    [DetailsOutcome<S>, DetailsChangeRequest],
    void
  >(options, "onOutcome");
  const focusFallback = captureCallback<
    ["closed" | "invalidated" | "unmounted"],
    void
  >(options, "focusFallback", true);
  const retry = captureCallback<[DetailsAuthority], unknown>(port, "retry");
  const visibleFieldIds = fieldIds(ownData(options, "visibleFieldIds"));
  const hiddenFieldIds = fieldIds(ownData(options, "hiddenFieldIds"));
  const originDetails = state.details;

  useLayoutEffect(() => {
    const previous = committed.current;
    if (
      previous &&
      (previous.controller !== controller ||
        !permitted ||
        !previous.permitted ||
        !previous.authority ||
        !origin ||
        !sameLifecycle(previous.authority, origin) ||
        !previous.expected ||
        !expected ||
        !sameContext(previous.expected, expected) ||
        lastDetails.current !== state.details)
    ) {
      pending.current = null;
      setPolicyBusy(false);
      if (previous.controller !== controller) {
        restore.current = null;
        setOwnerVersion((version) => version + 1);
      }
    }
    lastDetails.current = state.details;
    committed.current = {
      controller,
      port,
      focusFallback,
      beforeChange,
      onOutcome,
      retry,
      permitted,
      expected,
      authority: origin,
      source,
    };
    mounted.current = true;
    if (wasOpen.current && !isOpen) {
      const reason = permitted ? "closed" : "invalidated";
      const target = restore.current;
      restore.current = null;
      // Run after modal cleanup; deliberate external focus prevents RAC's body-only
      // rAF restoration from landing on a formerly private row.
      queueMicrotask(() => {
        const latest = committed.current;
        if (!latest || !mounted.current) return;
        const actual = readCurrent(latest.port);
        const currentContext = !!(
          actual &&
          latest.expected?.access &&
          sameContext(actual.authority.context, latest.expected)
        );
        if (
          currentContext &&
          latest.expected?.access &&
          latest.permitted &&
          actual &&
          latest.authority &&
          sameLifecycle(actual.authority, latest.authority) &&
          actual.authority.rowId !== null &&
          actual.authority.rowId ===
            latest.controller.getSnapshot().details.rowId
        )
          return;
        if (
          currentContext &&
          reason === "closed" &&
          target &&
          latest.expected &&
          sameContext(target.context, latest.expected) &&
          (() => {
            try {
              return target.focus();
            } catch {
              return false;
            }
          })()
        )
          return;
        observe(latest.focusFallback, currentContext ? reason : "invalidated");
      });
    }
    wasOpen.current = isOpen;
  });

  useLayoutEffect(
    () => () => {
      const latest = committed.current;
      mounted.current = false;
      committed.current = null;
      pending.current = null;
      if (wasOpen.current) {
        wasOpen.current = false;
        queueMicrotask(() => {
          if (!mounted.current && latest)
            observe(latest.focusFallback, "unmounted");
        });
      }
    },
    [],
  );

  const current = () => {
    const latest = committed.current;
    if (
      !latest ||
      !origin ||
      !mounted.current ||
      latest.controller !== controller ||
      latest.controller.isDisposed() ||
      !latest.expected?.access ||
      !sameContext(latest.expected, origin.context) ||
      latest.controller.getSnapshot().details !== originDetails ||
      latest.controller.getSnapshot().definitionIdentity !==
        origin.context.definitionKey
    )
      return null;
    try {
      const actual = readCurrent(latest.port);
      return actual &&
        latest.authority &&
        sameLifecycle(origin, actual.authority) &&
        sameLifecycle(origin, latest.authority)
        ? { binding: latest, authority: actual.authority }
        : null;
    } catch {
      return null;
    }
  };

  const request = (
    toId: string | null,
    reason: DetailsReason,
    openOptions?: DetailsOpenOptions,
  ): Promise<DetailsOutcome<S>> => {
    const requests = new Map<object, DetailsRequestData<S>>();
    return runDetailsRequest(
      {
        origin: () => origin,
        baseline: () => originDetails,
        store: (token, data) => {
          requests.set(token, data);
        },
        load: (token) => requests.get(token) ?? null,
        forget: (token) => {
          requests.delete(token);
        },
        current,
        observer: () => committed.current?.onOutcome,
        mounted: () => mounted.current,
        pending: () => pending.current,
        setPending: (value) => {
          pending.current = value;
        },
        setBusy: setPolicyBusy,
        captureRestore: (value) =>
          captureCallback<[], boolean>(value, "restoreFocus"),
        restore: (context, focus) => {
          restore.current = { context, focus };
        },
      },
      toId,
      reason,
      openOptions,
    );
  };
  const requestClose = (reason: DetailsReason = "programmatic") =>
    request(null, reason);
  const requestOpen = (rowId: string, openOptions?: DetailsOpenOptions) =>
    request(rowId, origin?.rowId === null ? "trigger" : "replace", openOptions);
  const canRetry =
    isOpen && source?.status === "error" && retry.invoke !== null;
  const record = source?.status === "ready" ? source.record : undefined;
  const row =
    isOpen && actual
      ? currentNativeRow(
          actual.frame,
          actual.authority,
          controller,
          state,
          record,
        )
      : undefined;

  const session: DetailsSession<S, T> = {
    contentKey: JSON.stringify([
      ownerVersion,
      origin?.context.definitionKey,
      origin?.context.datasetKey,
      origin?.context.scopeKey,
      origin?.context.epoch,
      origin?.session,
      origin?.rowId,
    ]),
    isOpen,
    canRetry,
    requestClose,
    requestOpen,
    context:
      isOpen && state.details.rowId !== null
        ? {
            recordId: state.details.rowId,
            status: source?.status ?? "loading",
            record,
            row,
            isStale: source?.status === "ready" && source.stale === true,
            isBusy:
              !source ||
              source.status === "loading" ||
              (source.status === "ready" && source.busy === true),
            policyBusy,
            errorCode: source?.status === "error" ? source.code : null,
            visibleFieldIds,
            hiddenFieldIds,
            requestClose,
            requestOpen,
          }
        : null,
    async retry() {
      const latest = current();
      if (!latest) return "stale";
      const actual = currentSource<T>(latest.authority, latest.binding.source);
      const retry = latest.binding.retry;
      if (actual?.status !== "error" || !retry.invoke) return "unavailable";
      try {
        await retry.invoke(latest.authority);
        return "submitted";
      } catch {
        return "failed";
      }
    },
  };
  recordDetailsSession(session, controller, mount);
  return session;
}
