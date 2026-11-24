import type {
  CriteriaFrameOwner,
  CriteriaOrigin,
  CriteriaToolAuthority,
  TableController,
} from "@tableweave/react";
import { getCriteriaToolOwner, requireCriteriaTool } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import {
  type CommitAdapter,
  createToolCommitCore,
  sameCommitContext,
  sameCommitOrigin,
} from "./criteria-commit-core.js";
import type {
  CriteriaPortsCheck,
  FilterBuilderPorts,
  FilterDatePorts,
  FilterSearchPorts,
  FilterTabsPorts,
} from "./criteria-ports.js";
import {
  captureFilterBuilderPorts,
  captureFilterDatePorts,
  captureFilterSearchPorts,
  captureFilterTabsPorts,
} from "./criteria-ports.js";

export type CriteriaToolKind = "search" | "tabs" | "date" | "builder";
export interface CriteriaToolTarget<S extends QuerySchema> {
  readonly owner: CriteriaFrameOwner<S>;
  readonly authority: CriteriaToolAuthority<S>;
}
export interface CriteriaPortsByKind<S extends QuerySchema> {
  readonly search: FilterSearchPorts<S>;
  readonly tabs: FilterTabsPorts<S>;
  readonly date: FilterDatePorts<S>;
  readonly builder: FilterBuilderPorts<S>;
}
declare const leaseBrand: unique symbol;
declare const actorBrand: unique symbol;
declare const localBrand: unique symbol;
declare const workBrand: unique symbol;
export interface CriteriaMountLease<
  K extends CriteriaToolKind,
  S extends QuerySchema,
> {
  readonly [leaseBrand]: (kind: K, schema: S) => readonly [K, S];
}
export interface CriteriaActor<
  K extends CriteriaToolKind,
  S extends QuerySchema,
> {
  readonly [actorBrand]: (kind: K, schema: S) => readonly [K, S];
}
export interface CriteriaCommitted<
  K extends CriteriaToolKind,
  S extends QuerySchema,
> {
  readonly actor: CriteriaActor<K, S>;
  readonly ports: CriteriaPortsByKind<S>[K];
  readonly origin: CriteriaOrigin<S>;
}
export interface CriteriaCommitSnapshot<
  K extends CriteriaToolKind,
  S extends QuerySchema,
> {
  readonly version: object;
  readonly actor: CriteriaActor<K, S> | null;
}
export type CriteriaLocalRole =
  | "draft"
  | "session"
  | "receipt"
  | "notice"
  | "text"
  | "ime";
export interface CriteriaLocalCell<
  K extends CriteriaToolKind,
  S extends QuerySchema,
  Value,
> {
  readonly [localBrand]: (
    kind: K,
    schema: S,
    value: Value,
  ) => readonly [K, S, Value];
  readonly read: (actor: CriteriaActor<NoInfer<K>, NoInfer<S>>) => Value | null;
  readonly write: (
    actor: CriteriaActor<NoInfer<K>, NoInfer<S>>,
    value: Value,
  ) => void;
  readonly clear: (actor: CriteriaActor<NoInfer<K>, NoInfer<S>>) => void;
}
export interface CriteriaWorkHandle<
  K extends CriteriaToolKind,
  S extends QuerySchema,
> {
  readonly [workBrand]: (kind: K, schema: S) => readonly [K, S];
  /** Library scheduler deadline only, never permission across callbacks/awaits. */
  readonly deadline: number | null;
}
export type CriteriaLibraryWork<
  K extends CriteriaToolKind,
  S extends QuerySchema,
> = (committed: CriteriaCommitted<K, S>) => undefined;
export interface CriteriaCommitCell<
  K extends CriteriaToolKind,
  S extends QuerySchema,
> {
  readonly kind: K;
  readonly getSnapshot: () => CriteriaCommitSnapshot<K, S>;
  readonly subscribe: (listener: () => void) => () => void;
  readonly connect: () => CriteriaMountLease<K, S>;
  readonly commit: (
    lease: CriteriaMountLease<NoInfer<K>, NoInfer<S>>,
    target: CriteriaToolTarget<NoInfer<S>>,
    opaqueProps: unknown,
  ) => CriteriaActor<K, S>;
  readonly require: (
    actor: CriteriaActor<NoInfer<K>, NoInfer<S>>,
  ) => CriteriaCommitted<K, S>;
  readonly disconnect: (
    lease: CriteriaMountLease<NoInfer<K>, NoInfer<S>>,
  ) => void;
  createLocal<Value>(
    role: "draft" | "session" | "receipt",
  ): CriteriaLocalCell<K, S, Value>;
  createLocal(role: "notice" | "text"): CriteriaLocalCell<K, S, string>;
  createLocal(role: "ime"): CriteriaLocalCell<K, S, boolean>;
  readonly timeout: (
    actor: CriteriaActor<NoInfer<K>, NoInfer<S>>,
    delayMs: number,
    run: CriteriaLibraryWork<NoInfer<K>, NoInfer<S>>,
  ) => CriteriaWorkHandle<K, S>;
  readonly animationFrame: (
    actor: CriteriaActor<NoInfer<K>, NoInfer<S>>,
    run: CriteriaLibraryWork<NoInfer<K>, NoInfer<S>>,
  ) => CriteriaWorkHandle<K, S>;
  readonly cancelWork: (
    actor: CriteriaActor<NoInfer<K>, NoInfer<S>>,
    handle: CriteriaWorkHandle<NoInfer<K>, NoInfer<S>>,
  ) => void;
}
export class CriteriaCommitError extends Error {
  readonly code = "criteria.commit.unavailable";
  constructor() {
    super("Committed criteria ports are unavailable.");
    this.name = "CriteriaCommitError";
  }
}
function deny(): never {
  throw new CriteriaCommitError();
}
function object(value: unknown): value is object {
  return value !== null && typeof value === "object";
}

/** Exact existing tool specialization; no model/channel or public policy API. */
export function createCriteriaCommitCell<
  K extends CriteriaToolKind,
  S extends QuerySchema,
>(kind: K, controller: TableController<S>): CriteriaCommitCell<K, S> {
  return createToolCommitCore(kind, controller);
}

/** Source-private fixed adapter selected by the core, never supplied by an app. */
export function createCriteriaToolAdapter<
  K extends CriteriaToolKind,
  S extends QuerySchema,
>(
  kind: K,
  controller: TableController<S>,
): CommitAdapter<
  S,
  CriteriaToolTarget<S>,
  CriteriaPortsByKind<S>[K],
  CriteriaActor<K, S>,
  CriteriaCommitted<K, S>
> {
  if (
    (kind !== "search" &&
      kind !== "tabs" &&
      kind !== "date" &&
      kind !== "builder") ||
    !object(controller)
  )
    return deny();
  const genuine = (
    target: CriteriaToolTarget<S>,
    origin: CriteriaOrigin<S>,
  ) => {
    if (getCriteriaToolOwner(target.authority) !== target.owner) return deny();
    const actual = requireCriteriaTool(target.authority, target.owner);
    if (!sameCommitOrigin(actual, origin) || actual.controller !== controller)
      return deny();
  };
  const captures: {
    [Tool in CriteriaToolKind]: (
      schema: S,
      input: unknown,
      check: CriteriaPortsCheck,
    ) => CriteriaPortsByKind<S>[Tool];
  } = {
    // Untrusted input-shape assertions at unchanged F3a validation, not grants.
    search: (_schema, input, check) =>
      captureFilterSearchPorts<S>(
        input as Parameters<typeof captureFilterSearchPorts<S>>[0],
        check,
      ),
    tabs: (schema, input, check) =>
      captureFilterTabsPorts<S>(
        schema,
        input as Parameters<typeof captureFilterTabsPorts<S>>[1],
        check,
      ),
    date: (_schema, input, check) =>
      captureFilterDatePorts<S>(
        input as Parameters<typeof captureFilterDatePorts<S>>[0],
        check,
      ),
    builder: (schema, input, check) =>
      captureFilterBuilderPorts<S>(
        schema,
        input as Parameters<typeof captureFilterBuilderPorts<S>>[1],
        check,
      ),
  };
  return {
    kind,
    controller,
    deny,
    registerBeforeCapture: false,
    admit(rawTarget, metadata, check, pin) {
      const authority = metadata.data(
        rawTarget,
        "authority",
      ) as CriteriaToolAuthority<S>;
      const owner = getCriteriaToolOwner(authority);
      if (!owner || (pin && pin.owner !== owner)) return deny();
      if (metadata.data(rawTarget, "owner") !== owner) return deny();
      const origin = requireCriteriaTool(authority, owner);
      check();
      if (
        origin.controller !== controller ||
        metadata.data(owner, "controller") !== controller ||
        metadata.data(owner, "definition") !== origin.definition
      )
        return deny();
      return { target: Object.freeze({ owner, authority }), owner, origin };
    },
    genuine,
    capture(admission, opaqueProps, metadata, check, pin) {
      const { origin } = admission;
      if (metadata.data(opaqueProps, "controller") !== controller)
        return deny();
      const expected = metadata.context(
        metadata.data(
          opaqueProps,
          kind === "builder" ? "expectedResourceContext" : "expectedContext",
        ),
      );
      if (!sameCommitContext(expected, origin.context)) return deny();
      const stamp = metadata.data(
        opaqueProps,
        "invalidationKey",
        kind !== "builder",
      );
      if (
        (stamp === undefined && kind === "builder") ||
        (stamp !== undefined &&
          typeof stamp !== "string" &&
          (typeof stamp !== "number" || !Number.isFinite(stamp)))
      )
        return deny();
      const capturedStamp = stamp as string | number | undefined;
      if (
        pin &&
        sameCommitOrigin(pin.origin, origin) &&
        !Object.is(pin.stamp, capturedStamp)
      )
        return deny();
      const schema = metadata.data(origin.definition, "schema") as S;
      const ports = captures[kind](schema, opaqueProps, check);
      const mode =
        kind === "builder"
          ? (ports as FilterBuilderPorts<S>).evaluationMode
          : "paired";
      if (pin && sameCommitOrigin(pin.origin, origin) && pin.mode !== mode)
        return deny();
      return { ports, stamp: capturedStamp, mode };
    },
    committed: (actor, ports, origin) =>
      Object.freeze({ actor, ports, origin }),
    view: (committed) => committed,
  };
}
