"use client";

import { useTableweaveState } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import { useLayoutEffect, useRef, useState } from "react";
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
import type {
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

function fieldIds(input: unknown): readonly string[] {
  try {
    return Array.isArray(input) ? input : [];
  } catch {
    return [];
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

  const request = async (
    toId: string | null,
    reason: DetailsReason,
    openOptions?: DetailsOpenOptions,
  ): Promise<DetailsOutcome<S>> => {
    if (!origin) return { status: "stale" };
    const currentAtStart = current();
    const observer = committed.current?.onOutcome;
    const change: DetailsChangeRequest = Object.freeze({
      authority: currentAtStart?.authority ?? origin,
      fromId: origin.rowId,
      toId,
      reason,
    });
    const report = (outcome: DetailsOutcome<S>) => {
      if (mounted.current && observer) observe(observer, outcome, change);
      return outcome;
    };
    if (toId !== null && (!toId || typeof toId !== "string"))
      return report({ status: "failed" });
    if (!currentAtStart) return report({ status: "stale" });
    const latest = currentAtStart.binding;
    if (!latest.beforeChange.valid) return report({ status: "blocked" });
    if (toId === origin.rowId) return report({ status: "noop" });
    if (pending.current) return report({ status: "busy" });
    const token = {};
    pending.current = token;
    setPolicyBusy(true);
    try {
      const decision = latest.beforeChange.invoke
        ? latest.beforeChange.invoke(change)
        : true;
      const allowed = typeof decision === "boolean" ? decision : await decision;
      const currentAfterPolicy = current();
      if (!currentAfterPolicy || pending.current !== token)
        return report({ status: "stale" });
      if (!currentAfterPolicy.binding.beforeChange.valid)
        return report({ status: "blocked" });
      if (allowed !== true) return report({ status: "blocked" });
      const restoreFocus = captureCallback<[], boolean>(
        openOptions,
        "restoreFocus",
      );
      if (toId !== null && restoreFocus.invoke)
        restore.current = {
          context: origin.context,
          focus: restoreFocus.invoke,
        };
      const result = latest.controller.dispatch({
        type: "details.change",
        update(previous) {
          const latest = current();
          if (!latest?.binding.beforeChange.valid || previous !== originDetails)
            return previous;
          return { rowId: toId };
        },
      });
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
    } catch {
      return report({ status: "failed" });
    } finally {
      if (pending.current === token) {
        pending.current = null;
        if (mounted.current) setPolicyBusy(false);
      }
    }
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

  return {
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
}
