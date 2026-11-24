"use client";

import type {
  CriteriaFrameOwner,
  CriteriaToolAuthority,
  TableController,
} from "@tableweave/react";
import { getCriteriaToolOwner, requireCriteriaTool } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import type { ComponentType } from "react";
import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import { prepareCriteriaDateCell } from "../date/criteria-date-state.js";
import type {
  CriteriaActor,
  CriteriaCommitCell,
  CriteriaCommitted,
  CriteriaLocalCell,
  CriteriaMountLease,
  CriteriaToolTarget,
} from "../filters/criteria-commit.js";
import { createCriteriaCommitCell } from "../filters/criteria-commit.js";
import type { FilterToolProps } from "./filter-shared.js";
import { filterToolMessages } from "./filter-shared.js";

export type ToolbarKind = "search" | "tabs" | "date";
export type CriteriaCandidate<S extends QuerySchema> =
  | Readonly<{ kind: "omitted" | "denied" }>
  | Readonly<{ kind: "target"; target: CriteriaToolTarget<S> }>;
export class CriteriaToolbarError extends Error {
  readonly code = "criteria.toolbar.unavailable";
  constructor() {
    super("Criteria toolbar is unavailable.");
    this.name = "CriteriaToolbarError";
  }
}
function deny(): never {
  throw new CriteriaToolbarError();
}
function object(value: unknown): value is object {
  return value !== null && typeof value === "object";
}
function own(input: unknown, key: string, optional = false): unknown {
  if (!object(input)) return deny();
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  if (!descriptor) {
    if (Reflect.has(input, key) || !optional) return deny();
    return undefined;
  }
  if (!Object.hasOwn(descriptor, "value")) return deny();
  return descriptor.value;
}
/** Render-safe discriminant/identity association only. No controller/private
 * configuration reader, constructor pin or render mutation. Envelopes are
 * structural; the contained authority and owner must be registry-exact. */
export function captureCriteriaCandidate<S extends QuerySchema>(
  input: unknown,
): CriteriaCandidate<S> {
  try {
    if (!object(input)) return { kind: "denied" };
    const descriptor = Object.getOwnPropertyDescriptor(input, "criteria");
    if (!descriptor)
      return { kind: Reflect.has(input, "criteria") ? "denied" : "omitted" };
    if (!Object.hasOwn(descriptor, "value") || !object(descriptor.value))
      return { kind: "denied" };
    const raw: object = descriptor.value;
    const authority = own(raw, "authority") as CriteriaToolAuthority<S>;
    const owner = getCriteriaToolOwner(authority);
    if (
      !owner ||
      own(raw, "owner") !== owner ||
      getCriteriaToolOwner(authority) !== owner
    )
      return { kind: "denied" };
    return { kind: "target", target: Object.freeze({ owner, authority }) };
  } catch {
    return { kind: "denied" };
  }
}

export interface ToolbarCommitted<
  K extends ToolbarKind,
  S extends QuerySchema,
  Local,
> extends CriteriaCommitted<K, S> {
  readonly cell: CriteriaCommitCell<K, S>;
  readonly local: Local;
  readonly disabled: boolean;
  readonly className: string;
}
export interface CriteriaToolbarStore<
  K extends ToolbarKind,
  S extends QuerySchema,
  Local,
> {
  readonly kind: K;
  readonly getSnapshot: () => object;
  readonly subscribe: (listener: () => void) => () => void;
  readonly getMode: () => "legacy" | "adopted" | null;
  readonly mount: () => () => void;
  readonly commit: (input: unknown, candidate?: CriteriaCandidate<S>) => void;
  readonly read: () => ToolbarCommitted<K, S, Local> | null;
  readonly require: (
    actor: CriteriaActor<NoInfer<K>, NoInfer<S>>,
  ) => ToolbarCommitted<K, S, Local>;
}

/** Library factory, not app reset/callback registration. It allocates empty F3
 * slots only after a genuine target supplies C in actual layout. */
export function createCriteriaToolbarStore<
  K extends ToolbarKind,
  S extends QuerySchema,
  Local,
>(
  kind: K,
  createLocal: (cell: CriteriaCommitCell<K, S>) => Local,
): CriteriaToolbarStore<K, S, Local> {
  const listeners = new Set<() => void>();
  let version: object = Object.freeze({});
  let mode: "legacy" | "adopted" | null = null;
  let mount: object | null = null;
  let cell: CriteriaCommitCell<K, S> | null = null;
  let local: Local;
  let lease: CriteriaMountLease<K, S> | null = null;
  let controller: TableController<S> | null = null;
  let ownerPin: CriteriaFrameOwner<S> | null = null;
  let target: CriteriaToolTarget<S> | null = null;
  type Presentation = Readonly<{
    actor: CriteriaActor<K, S>;
    disabled: boolean;
    className: string;
  }>;
  let presentation: CriteriaLocalCell<K, S, Presentation> | null = null;
  let stopCell: (() => void) | null = null,
    stopController: (() => void) | null = null;
  let committing = false,
    notifying = false;
  let operation: object = {};
  const publish = () => {
    if (committing) return;
    version = Object.freeze({});
    if (notifying) return;
    notifying = true;
    try {
      for (const listener of [...listeners]) {
        if (listeners.has(listener)) {
          try {
            listener();
          } catch {
            /* Version observation grants no permission. */
          }
        }
      }
    } finally {
      notifying = false;
    }
  };
  const retire = () => {
    // Actual F3 invalid commit purges edit lifetime without per-config mount
    // cleanup. Reuse only the genuine last target, NEVER old private props.
    if (cell && lease && target) {
      try {
        cell.commit(lease, target, Object.freeze({}));
      } catch {
        /* Expected deny; F3 owns purge/debt. */
      }
    }
  };
  const requireActor = (
    actor: CriteriaActor<K, S>,
  ): ToolbarCommitted<K, S, Local> => {
    if (!mount || !cell || !presentation || mode !== "adopted") return deny();
    const committed = cell.require(actor);
    const data = presentation.read(actor);
    if (!data || data.actor !== committed.actor) return deny();
    return Object.freeze({
      ...committed,
      cell,
      local,
      disabled: data.disabled,
      className: data.className,
    });
  };
  const store: CriteriaToolbarStore<K, S, Local> = Object.freeze({
    kind,
    getSnapshot: () => version,
    getMode: () => mode,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    mount() {
      if (mount || committing || notifying) return deny();
      const token = {};
      mount = token;
      operation = {};
      if (cell) lease = cell.connect();
      return () => {
        if (mount !== token) return;
        mount = null;
        operation = {};
        const exactCell = cell,
          exactLease = lease;
        lease = null;
        stopController?.();
        stopController = null;
        try {
          if (exactCell && exactLease) exactCell.disconnect(exactLease);
        } finally {
          publish();
        }
      };
    },
    commit(input: unknown, expected?: CriteriaCandidate<S>) {
      if (!mount) return deny();
      if (committing || notifying) {
        operation = {};
        retire();
        return deny();
      }
      const token = {},
        mounted = mount;
      operation = token;
      committing = true;
      try {
        const captured = captureCriteriaCandidate<S>(input);
        if (operation !== token || mount !== mounted) return deny();
        if (
          expected &&
          (expected.kind !== captured.kind ||
            (expected.kind === "target" &&
              captured.kind === "target" &&
              (expected.target.owner !== captured.target.owner ||
                expected.target.authority !== captured.target.authority)))
        )
          return deny();
        if (captured.kind === "omitted" && mode !== "adopted") {
          mode = "legacy";
          return;
        }
        if (captured.kind !== "target" || mode === "legacy") {
          retire();
          return;
        }
        const next = captured.target;
        // Recheck the real current target BEFORE private metadata or props.C.
        if (
          getCriteriaToolOwner(next.authority) !== next.owner ||
          (ownerPin && ownerPin !== next.owner)
        )
          return deny();
        const origin = requireCriteriaTool(next.authority, next.owner);
        const actualC = next.owner.controller;
        if (
          origin.controller !== actualC ||
          origin.definition !== next.owner.definition
        )
          return deny();
        const check = () => {
          if (
            mount !== mounted ||
            operation !== token ||
            getCriteriaToolOwner(next.authority) !== next.owner
          )
            return deny();
          requireCriteriaTool(next.authority, next.owner);
          if (mount !== mounted || operation !== token) return deny();
        };
        check();
        const disabled = own(input, "disabled", true);
        check();
        if (disabled !== undefined && typeof disabled !== "boolean")
          return deny();
        const className = own(input, "className", true);
        check();
        if (className !== undefined && typeof className !== "string")
          return deny();
        if (cell && controller !== actualC) {
          if (mode === "adopted") return deny();
          if (lease) cell.disconnect(lease);
          stopCell?.();
          stopController?.();
          stopController = null;
          cell = null;
          presentation = null;
          lease = null;
          target = null;
        }
        if (!cell) {
          controller = actualC;
          cell = createCriteriaCommitCell(kind, actualC);
          presentation = cell.createLocal<Presentation>("session");
          local = createLocal(cell);
          stopCell = cell.subscribe(publish);
          lease = cell.connect();
        }
        if (!lease || !presentation) return deny();
        target = next;
        const actor = cell.commit(lease, next, input);
        cell.require(actor);
        check();
        presentation.write(
          actor,
          Object.freeze({
            actor,
            disabled: disabled ?? false,
            className: className ?? "",
          }),
        );
        cell.require(actor);
        check();
        if (kind === "date") {
          prepareCriteriaDateCell(cell, actor);
          cell.require(actor);
          check();
        }
        ownerPin = next.owner;
        mode = "adopted";
        // No state mirror; controller notifications publish only a fresh version.
        stopController ??= actualC.subscribe(publish);
      } catch {
        retire();
      } finally {
        committing = false;
        publish();
      }
    },
    read() {
      try {
        const actor = cell?.getSnapshot().actor;
        return actor ? requireActor(actor) : null;
      } catch {
        return null;
      }
    },
    require: requireActor,
  });
  return store;
}

export function CriteriaToolbarNeutral({
  kind,
}: {
  readonly kind: ToolbarKind;
}) {
  return (
    <div
      className={
        kind === "search"
          ? "tw-filter-search"
          : kind === "date"
            ? "tw-filter-date"
            : "tw-filter-tabs"
      }
    >
      <p role="status">{filterToolMessages.unavailable}</p>
    </div>
  );
}
export function useCriteriaToolbarVersion<
  K extends ToolbarKind,
  S extends QuerySchema,
  Local,
>(store: CriteriaToolbarStore<K, S, Local>): object {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
}

/** Stable, unsubscribed host: notifications update only Route/Surface. No input
 * spread/destructure or candidate-private read before the omission discriminant. */
export function CriteriaToolHost<
  K extends ToolbarKind,
  S extends QuerySchema,
  Local,
  Props extends FilterToolProps<S>,
>({
  kind,
  input,
  createLocal,
  Legacy,
  Surface,
}: {
  readonly kind: K;
  readonly input: Props;
  readonly createLocal: (cell: CriteriaCommitCell<K, S>) => Local;
  readonly Legacy: ComponentType<Props>;
  readonly Surface: ComponentType<{
    readonly store: CriteriaToolbarStore<K, S, Local>;
  }>;
}) {
  const [store] = useState(() => createCriteriaToolbarStore(kind, createLocal));
  const candidate = captureCriteriaCandidate<S>(input);
  useLayoutEffect(() => store.mount(), [store]);
  useLayoutEffect(() => {
    store.commit(input, candidate);
  }); // No config cleanup.
  return (
    <Route
      store={store}
      candidate={candidate}
      input={input}
      Legacy={Legacy}
      Surface={Surface}
    />
  );
}
function Route<
  K extends ToolbarKind,
  S extends QuerySchema,
  Local,
  Props extends FilterToolProps<S>,
>({
  store,
  candidate,
  input,
  Legacy,
  Surface,
}: {
  readonly store: CriteriaToolbarStore<K, S, Local>;
  readonly candidate: CriteriaCandidate<S>;
  readonly input: Props;
  readonly Legacy: ComponentType<Props>;
  readonly Surface: ComponentType<{
    readonly store: CriteriaToolbarStore<K, S, Local>;
  }>;
}) {
  useCriteriaToolbarVersion(store);
  const mode = store.getMode();
  if (candidate.kind === "omitted" && mode !== "adopted")
    return <Legacy {...input} />;
  if (candidate.kind !== "target" || mode === "legacy")
    return <CriteriaToolbarNeutral kind={store.kind} />;
  return <Surface store={store} />;
}
