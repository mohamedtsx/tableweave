"use client";

import type {
  MutationResult,
  ResourceContext,
  TableController,
} from "@tableweave/react";
import { useTableweaveState } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import type { CriteriaToolTarget } from "../filters/criteria-commit.js";

export interface FilterToolProps<S extends QuerySchema> {
  /** Opt into genuine committed criteria ownership. Omission alone is legacy. */
  readonly criteria?: CriteriaToolTarget<NoInfer<S>>;
  readonly controller: TableController<S>;
  readonly expectedContext: ResourceContext;
  readonly disabled?: boolean;
  readonly className?: string;
  /** Application-owned resource invalidation, including same-context reset. */
  readonly invalidationKey?: string | number;
  /** Observation after dispatch, never a second acceptance callback. */
  readonly onMutation?: (result: MutationResult<S>) => void;
}

export interface FilterToolMessages {
  readonly unavailable: string;
  readonly invalidConfiguration: string;
  readonly submitted: string;
  readonly failed: string;
}

export const filterToolMessages: FilterToolMessages = {
  unavailable: "Filtering is unavailable.",
  invalidConfiguration: "This filter is not configured correctly.",
  submitted: "Filter change submitted.",
  failed: "The filter could not be changed.",
};

/** A render-owned lease masks stale drafts before effects, without render mutations. */
export function useFilterOwner<S extends QuerySchema>(
  props: FilterToolProps<S>,
) {
  const state = useTableweaveState(props.controller);
  const { definitionKey, scopeKey, access } = props.expectedContext;
  const owner = useMemo(
    () => ({
      controller: props.controller,
      definition: state.definitionIdentity,
      locale: state.query.locale,
      timeZone: state.query.timeZone,
      definitionKey,
      scopeKey,
      access,
      invalidationKey: props.invalidationKey,
      disabled: props.disabled,
    }),
    [
      props.controller,
      state.definitionIdentity,
      state.query.locale,
      state.query.timeZone,
      definitionKey,
      scopeKey,
      access,
      props.invalidationKey,
      props.disabled,
    ],
  );
  const active = access && !props.disabled && !props.controller.isDisposed();
  const committed = useRef<object | null>(null);
  useLayoutEffect(() => {
    committed.current = active ? owner : null;
    return () => {
      committed.current = null;
    };
  }, [owner, active]);
  const isCurrent = useCallback(
    () =>
      active && committed.current === owner && !props.controller.isDisposed(),
    [owner, active, props.controller],
  );
  return { state, owner, active, isCurrent };
}

/** Observer failures cannot roll back a mutation already published by the owner. */
export function observeMutation<S extends QuerySchema>(
  observer: FilterToolProps<S>["onMutation"],
  result: MutationResult<S>,
): void {
  try {
    observer?.(result);
  } catch {
    // Deliberately do not expose/log callback payloads or pretend commit failed.
  }
}
