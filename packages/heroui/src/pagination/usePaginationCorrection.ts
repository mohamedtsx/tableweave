"use client";

import type {
  ControlsAuthority,
  ControlsPresentation,
  TableController,
} from "@tableweave/react";
import { getControlsAuthorityOwner } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import { canonicalJson, getQueryIdentity } from "@tableweave/react/contracts";
import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  observeTableNavigation,
  renderTableNavigation,
  requireTableNavigation,
  subscribeTableNavigation,
  tableNavigationMetadata,
} from "../table/reordering-binding.js";
import type { TableReorderingNavigation } from "../table/reordering-types.js";
import {
  captureCorrectionOrigin,
  captureKnownCorrection,
  correctionData,
  readCorrectionEpoch,
} from "./correction-capture.js";
import type { PaginationCorrectionContext } from "./types.js";

/** Opt-in effect-only clamp; one attempt per owner/context/epoch/semantic chain.
 * No resource start/transport. Ports must be pure, synchronous own data methods.
 * Unsupported accessors/malformed/throwing/asynchronous ports cannot authorize a
 * clamp. Async output violates the contract; poisoned Promises may be unobservable. */
export function usePaginationCorrection<
  S extends QuerySchema,
  T extends object,
>(
  controller: TableController<S>,
  presentation: ControlsPresentation<S, T>,
  authority: ControlsAuthority<S, T>,
  context: PaginationCorrectionContext<S, T>,
  interlock?: TableReorderingNavigation<S, T>,
): void {
  // Read only the supplied controller's immutable definition before touching
  // context/authority ports. Normalized legacy enabled schemas omit the flag.
  let paginationEnabled = false;
  try {
    const policy: unknown =
      controller.getDefinition().schema.pagination.enabled;
    paginationEnabled = policy === undefined || policy === true;
  } catch {
    // Unusable controller metadata cannot authorize a correction attempt.
  }
  // Descriptors capture primitive tags and the callback/receiver exactly once.
  // No application lifecycle callback runs while rendering.
  let navigation: TableReorderingNavigation<S, T> | null = null,
    valid = true;
  if (paginationEnabled && interlock !== undefined) {
    try {
      observeTableNavigation(interlock, authority);
      navigation = renderTableNavigation(interlock, authority);
    } catch {
      valid = false;
    }
  }
  useSyncExternalStore(
    (listener) =>
      navigation ? subscribeTableNavigation(navigation, listener) : () => {},
    () => (navigation ? tableNavigationMetadata(navigation) : null),
    () => null,
  );
  const origin =
    paginationEnabled && valid ? captureCorrectionOrigin<S, T>(context) : null;
  const attempted = useRef<{
    controller: TableController<S>;
    definition: object;
    epoch: string;
    semantic: string;
  } | null>(null);
  useEffect(() => {
    if (!paginationEnabled) return;
    try {
      if (!valid) return;
      const gate = () => {
        if (navigation) requireTableNavigation(navigation, authority);
      };
      gate();
      if (!origin?.access) return;
      const { definition, stamp: epoch } = origin;
      const ownsTarget = () => {
        const owner = getControlsAuthorityOwner(authority);
        return (
          owner?.controller === controller && owner.definition === definition
        );
      };
      // Factory provenance, not equivalent strings, query objects or schemas.
      if (!ownsTarget()) return;
      const requireIntent = correctionData(authority, "require");
      if (typeof requireIntent !== "function") return;
      const rendered = captureKnownCorrection(presentation);
      if (!rendered || controller.isDisposed()) return;
      const currentEpoch = readCorrectionEpoch(origin);
      gate();
      if (!currentEpoch?.access || currentEpoch.stamp !== epoch) return;
      if (
        canonicalJson(controller.getDefinition()) !==
        canonicalJson(definition.controllerDefinition)
      )
        return;
      const readAuthorized = () => {
        gate();
        if (!ownsTarget()) return null;
        const value = captureKnownCorrection(
          Reflect.apply(requireIntent, authority, [{ type: "navigate" }]),
        );
        gate();
        return value;
      };
      const displayed = readAuthorized();
      if (!displayed || displayed.stamp !== rendered.stamp) return;
      const state = controller.getSnapshot();
      if (
        state.queryIdentity !== displayed.queryIdentity ||
        state.evaluatedAt !== displayed.evaluatedAt
      )
        return;
      const pageCount = displayed.pageCount;
      if (state.query.pagination.pageIndex <= Math.max(0, pageCount - 1))
        return;
      const semantic = getQueryIdentity(
        definition.controllerDefinition.schema,
        {
          ...state.query,
          pagination: { ...state.query.pagination, pageIndex: 0 },
        },
        { ...definition.evaluation, now: state.evaluatedAt },
      );
      const previous = attempted.current;
      if (
        previous?.controller === controller &&
        previous.definition === definition &&
        previous.epoch === epoch &&
        previous.semantic === semantic
      )
        return;
      const latestEpoch = readCorrectionEpoch(origin);
      gate();
      if (
        !latestEpoch?.access ||
        latestEpoch.stamp !== epoch ||
        controller.getSnapshot() !== state
      )
        return;
      const latest = readAuthorized();
      if (!latest || latest.stamp !== displayed.stamp) return;
      const finalEpoch = readCorrectionEpoch(origin);
      gate();
      // Final mutation boundary repeats BOTH owner refs and current accepted state.
      if (
        !finalEpoch?.access ||
        finalEpoch.stamp !== epoch ||
        !ownsTarget() ||
        controller.isDisposed() ||
        controller.getSnapshot() !== state
      )
        return;
      gate();
      attempted.current = { controller, definition, epoch, semantic };
      controller.dispatch({
        type: "pagination.clamp",
        pageCount,
        queryIdentity: state.queryIdentity,
      });
    } catch {
      // Synchronous app/read/validation exceptions stay out of the pager subtree.
      // This does not suppress unobservable application Promise rejections. A
      // dispatched attempt stays spent even if its callback rejects or throws.
    }
  }, [
    controller,
    presentation,
    authority,
    origin,
    paginationEnabled,
    valid,
    navigation,
  ]);
}
