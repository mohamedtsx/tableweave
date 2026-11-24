"use client";

import type {
  ControlsAuthority,
  ControlsPresentation,
  TableController,
} from "@tableweave/react";
import { getControlsAuthorityOwner } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import { canonicalJson, getQueryIdentity } from "@tableweave/react/contracts";
import { useEffect, useRef } from "react";
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
): void {
  // Descriptors capture primitive tags and the callback/receiver exactly once.
  // No application lifecycle callback runs while rendering.
  const origin = captureCorrectionOrigin<S, T>(context);
  const attempted = useRef<{
    controller: TableController<S>;
    definition: object;
    epoch: string;
    semantic: string;
  } | null>(null);
  useEffect(() => {
    try {
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
      if (!currentEpoch?.access || currentEpoch.stamp !== epoch) return;
      if (
        canonicalJson(controller.getDefinition()) !==
        canonicalJson(definition.controllerDefinition)
      )
        return;
      const readAuthorized = () => {
        if (!ownsTarget()) return null;
        return captureKnownCorrection(
          Reflect.apply(requireIntent, authority, [{ type: "navigate" }]),
        );
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
      if (
        !latestEpoch?.access ||
        latestEpoch.stamp !== epoch ||
        controller.getSnapshot() !== state
      )
        return;
      const latest = readAuthorized();
      if (!latest || latest.stamp !== displayed.stamp) return;
      const finalEpoch = readCorrectionEpoch(origin);
      // Final mutation boundary repeats BOTH owner refs and current accepted state.
      if (
        !finalEpoch?.access ||
        finalEpoch.stamp !== epoch ||
        !ownsTarget() ||
        controller.isDisposed() ||
        controller.getSnapshot() !== state
      )
        return;
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
  }, [controller, presentation, authority, origin]);
}
