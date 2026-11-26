import {
  type CriteriaFrameOwner,
  type CriteriaOrigin,
  type CriteriaSourceAuthority,
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
import {
  type CommitAdapter,
  type CommitCheck,
  type CommitMetadata,
  createDetailsCommitCore,
  sameCommitOrigin,
} from "../filters/criteria-commit-core.js";
import type {
  DetailsAccessoryOptions,
  DetailsAuthority,
  DetailsCommitActor,
  DetailsCommitCell,
  DetailsCommitted,
  DetailsContext,
  DetailsSource,
} from "./types.js";

export class DetailsCommitError extends Error {
  readonly code = "details.commit.unavailable";
  constructor() {
    super("Bound details are unavailable.");
    this.name = "DetailsCommitError";
  }
}
export function denyDetails(): never {
  throw new DetailsCommitError();
}
interface Binding<S extends QuerySchema, T extends object> {
  readonly model: DataTableModel<S, T>;
  readonly owner: CriteriaFrameOwner<S>;
  readonly source: CriteriaSourceAuthority<S>;
  readonly origin: CriteriaOrigin<S>;
  readonly metadata: CriteriaSourceMetadata<S>;
}

/** Exact display role, deliberately separate from source/domain actor liveness. */
export function requireDetailsDisplay<S extends QuerySchema, T extends object>(
  value: Pick<DetailsCommitted<S, T>, "model" | "owner" | "origin">,
): DataTableModel<S, T> {
  const owner = getDataTableModelOwner(value.model) ?? denyDetails();
  const model = requireDataTableModel(value.model, owner.definition);
  const tool = model.toolTarget;
  if (
    !model.frame ||
    !model.view ||
    !model.presentation ||
    !model.authority ||
    !tool ||
    model.phase !== "display" ||
    tool.owner !== value.owner ||
    getCriteriaToolOwner(tool.authority) !== value.owner
  )
    return denyDetails();
  // P2's strict issuance validator already revalidates its exact committed frame.
  // The frame helper is deliberately not a root export.
  if (model.frame.view !== model.view) return denyDetails();
  if (
    !sameCommitOrigin(
      requireCriteriaTool(tool.authority, value.owner),
      value.origin,
    )
  )
    return denyDetails();
  const controls = getControlsAuthorityOwner(model.authority);
  if (
    !controls ||
    controls.controller !== owner.controller ||
    controls.definition !== owner.definition.native
  )
    return denyDetails();
  requireDataTableModel(model, owner.definition);
  return model;
}

/** All private descriptor capture is checked and owned once at L-config. */
function capture<S extends QuerySchema, T extends object>(
  input: unknown,
  metadata: CommitMetadata,
  check: CommitCheck,
  origin: CriteriaOrigin<S>,
): DetailsAccessoryOptions<S, T> {
  const data = (value: unknown, name: string, optional = false) =>
    metadata.data(value, name, optional);
  const text = (value: unknown): string =>
    typeof value === "string" && value.length > 0 ? value : denyDetails();
  const count = (value: unknown): number =>
    typeof value === "number" && Number.isSafeInteger(value) && value >= 0
      ? value
      : denyDetails();
  const context = (value: unknown): DetailsContext => {
    const definitionKey = text(data(value, "definitionKey")),
      datasetKey = text(data(value, "datasetKey")),
      scopeKey = text(data(value, "scopeKey")),
      access = data(value, "access"),
      epoch = count(data(value, "epoch"));
    if (typeof access !== "boolean") return denyDetails();
    return Object.freeze({
      definitionKey,
      datasetKey,
      scopeKey,
      access,
      epoch,
    });
  };
  const authority = (value: unknown): DetailsAuthority => {
    const c = context(data(value, "context")),
      id = data(value, "rowId");
    return Object.freeze({
      context: c,
      rowId: id === null ? null : text(id),
      session: count(data(value, "session")),
      generation: count(data(value, "generation")),
    });
  };
  const expected = context(data(input, "expected")),
    declared = authority(data(input, "authority"));
  if (
    !expected.access ||
    expected.definitionKey !== origin.context.definitionKey ||
    expected.scopeKey !== origin.context.scopeKey ||
    !sameDetailsContext(expected, declared.context)
  )
    return denyDetails();
  const fn = <A extends readonly unknown[], R>(
    receiver: unknown,
    key: string,
    required = false,
  ): ((...args: A) => R) | undefined => {
    const value = data(receiver, key, !required);
    if (value === undefined && !required) return undefined;
    if (typeof value !== "function") return denyDetails();
    return (...args: A): R => {
      check();
      try {
        return Reflect.apply(value, receiver, args) as R;
      } finally {
        check();
      }
    };
  };
  const originalPort = data(input, "port");
  const read =
    fn<[], ReturnType<DetailsAccessoryOptions<S, T>["port"]["read"]>>(
      originalPort,
      "read",
      true,
    ) ?? denyDetails();
  const retry = fn<
    [DetailsAuthority],
    ReturnType<NonNullable<DetailsAccessoryOptions<S, T>["port"]["retry"]>>
  >(originalPort, "retry");
  const sourceInput = data(input, "source");
  let source: DetailsSource<T> | null = null;
  if (sourceInput !== null) {
    const a = authority(data(sourceInput, "authority"));
    if (!sameDetailsAuthority(a, declared)) return denyDetails();
    const status = data(sourceInput, "status");
    if (status === "loading" || status === "missing")
      source = Object.freeze({ authority: a, status });
    else if (status === "error") {
      const code = data(sourceInput, "code");
      if (code !== "unavailable" && code !== "offline" && code !== "timeout")
        return denyDetails();
      source = Object.freeze({ authority: a, status, code });
    } else if (status === "ready") {
      const record = data(sourceInput, "record"),
        stale = data(sourceInput, "stale", true),
        busy = data(sourceInput, "busy", true);
      if (
        !record ||
        typeof record !== "object" ||
        (stale !== undefined && typeof stale !== "boolean") ||
        (busy !== undefined && typeof busy !== "boolean")
      )
        return denyDetails();
      // T is an opaque app record ref; no structural conversion, clone or freeze.
      source = Object.freeze({
        authority: a,
        status,
        record: record as T,
        ...(stale === undefined ? {} : { stale }),
        ...(busy === undefined ? {} : { busy }),
      });
    } else return denyDetails();
  }
  const title = text(data(input, "title"));
  const renderBody =
    fn<
      [Parameters<DetailsAccessoryOptions<S, T>["renderBody"]>[0]],
      ReturnType<DetailsAccessoryOptions<S, T>["renderBody"]>
    >(input, "renderBody", true) ?? denyDetails();
  const focusFallback =
    fn<Parameters<DetailsAccessoryOptions<S, T>["focusFallback"]>, void>(
      input,
      "focusFallback",
      true,
    ) ?? denyDetails();
  const result: DetailsAccessoryOptions<S, T> = {
    expected,
    authority: declared,
    source,
    port: Object.freeze({ read, ...(retry ? { retry } : {}) }),
    title,
    renderBody,
    focusFallback,
  };
  // Captured functions are immutable core-owned ports, never latest-render refs.
  const callbacks = [
    "beforeChange",
    "onOutcome",
    "focusInitial",
    "renderHeader",
    "renderFooter",
    "renderInterior",
  ] as const;
  for (const key of callbacks) {
    const value = fn(input, key);
    if (value !== undefined)
      Object.defineProperty(result, key, { value, enumerable: true });
  }
  for (const key of ["description", "className"] as const) {
    const value = data(input, key, true);
    if (value !== undefined)
      Object.defineProperty(result, key, {
        value: text(value),
        enumerable: true,
      });
  }
  for (const key of ["dismissOnOutside", "dismissOnEscape"] as const) {
    const value = data(input, key, true);
    if (value !== undefined) {
      if (typeof value !== "boolean") return denyDetails();
      Object.defineProperty(result, key, { value, enumerable: true });
    }
  }
  const messages = data(input, "messages", true);
  if (messages !== undefined) {
    const owned: Record<string, string> = Object.create(null);
    for (const key of [
      "close",
      "cancel",
      "loading",
      "missing",
      "unavailable",
      "offline",
      "timeout",
      "retry",
      "checking",
    ]) {
      const value = data(messages, key, true);
      if (value !== undefined) owned[key] = text(value);
    }
    Object.defineProperty(result, "messages", {
      value: Object.freeze(owned),
      enumerable: true,
    });
  }
  check();
  return Object.freeze(result);
}
export function sameDetailsContext(
  a: DetailsContext,
  b: DetailsContext,
): boolean {
  return (
    a.definitionKey === b.definitionKey &&
    a.datasetKey === b.datasetKey &&
    a.scopeKey === b.scopeKey &&
    a.access === b.access &&
    a.epoch === b.epoch
  );
}
export function sameDetailsLifecycle(
  a: DetailsAuthority,
  b: DetailsAuthority,
): boolean {
  return (
    sameDetailsContext(a.context, b.context) &&
    a.rowId === b.rowId &&
    a.session === b.session
  );
}
export function sameDetailsAuthority(
  a: DetailsAuthority,
  b: DetailsAuthority,
): boolean {
  return sameDetailsLifecycle(a, b) && a.generation === b.generation;
}

export function createDetailsCommitCell<
  S extends QuerySchema,
  T extends object,
>(model: DataTableModel<S, T>): DetailsCommitCell<S, T> {
  return createDetailsCommitCore(model);
}
/** Third fixed library adapter, using the sole existing core lifecycle. */
export function createDetailsAdapter<S extends QuerySchema, T extends object>(
  initial: DataTableModel<S, T>,
): CommitAdapter<
  S,
  {
    reference: { model: DataTableModel<S, T> | null };
    binding: Omit<Binding<S, T>, "model">;
  },
  { value: DetailsAccessoryOptions<S, T> | null },
  DetailsCommitActor<S, T>,
  DetailsCommitted<S, T>
> {
  const initialOwner = getDataTableModelOwner(initial) ?? denyDetails();
  const { definition, controller } = initialOwner;
  type Target = {
    reference: { model: DataTableModel<S, T> | null };
    binding: Omit<Binding<S, T>, "model">;
  };
  let current: Target | null = null;
  let portsCell: { value: DetailsAccessoryOptions<S, T> | null } | null = null;
  let pin:
    | (Pick<Binding<S, T>, "owner" | "source" | "origin"> & {
        mode: CriteriaSourceMetadata<S>["mode"];
      })
    | null = null;
  const read = (input: unknown): Binding<S, T> => {
    const model = input as DataTableModel<S, T>,
      identity = getDataTableModelOwner(model);
    if (
      !identity ||
      identity.definition !== definition ||
      identity.controller !== controller
    )
      return denyDetails();
    const target = model.sourceTarget;
    if (
      !target ||
      getCriteriaSourceOwner(target.authority) !== target.owner ||
      (pin && pin.owner !== target.owner)
    )
      return denyDetails();
    const original = pin?.source ?? target.authority;
    const metadata = requireCriteriaSource(original, target.owner),
      origin = metadata.origin;
    const candidate = requireCriteriaSource(target.authority, target.owner);
    if (
      !sameCommitOrigin(candidate.origin, origin) ||
      candidate.mode !== metadata.mode
    )
      return denyDetails();
    if (
      origin.controller !== controller ||
      origin.definition !== controller.getDefinition() ||
      !origin.definition.details ||
      (pin &&
        (!sameCommitOrigin(pin.origin, origin) || pin.mode !== metadata.mode))
    )
      return denyDetails();
    return Object.freeze({
      model,
      owner: target.owner,
      source: original,
      origin,
      metadata,
    });
  };
  return {
    kind: "details",
    controller,
    deny: denyDetails,
    registerBeforeCapture: true,
    admit(input, _metadata, check) {
      const value = read(input);
      check();
      const { model, ...binding } = value;
      const target: Target = { reference: { model }, binding };
      return { target, owner: value.owner, origin: value.origin };
    },
    genuine(target, origin, active) {
      const actual = read(
        active ? current?.reference.model : target.reference.model,
      );
      if (
        actual.owner !== target.binding.owner ||
        !sameCommitOrigin(actual.origin, origin)
      )
        return denyDetails();
    },
    capture(admission, input, metadata, check) {
      // Empty owned ports are metadata only: no source-only candidate inspection.
      const v = read(admission.target.reference.model);
      let displayed = false;
      try {
        requireDetailsDisplay(v);
        displayed = true;
      } catch {
        /* source-only/wait */
      }
      const ports = displayed
        ? capture<S, T>(input, metadata, check, admission.origin)
        : null;
      // Core requires a truthy ports object; the tagged container is library-owned.
      return {
        ports: { value: ports },
        stamp: undefined,
        mode: v.metadata.mode,
      };
    },
    activate(target) {
      if (current && current !== target) current.reference.model = null;
      current = target;
      pin ??= { ...target.binding, mode: target.binding.metadata.mode };
    },
    clearMetadata() {
      if (current) current.reference.model = null;
      if (portsCell) portsCell.value = null;
      portsCell = null;
      current = null;
    },
    metadataReference: () => current?.reference.model ?? null,
    validateUpdate(admission, old, origin) {
      if (
        admission.target.binding.metadata.mode !== old.mode ||
        !sameCommitOrigin(admission.origin, origin)
      )
        return denyDetails();
    },
    committed(actor, container, origin) {
      if (portsCell && portsCell !== container) portsCell.value = null;
      portsCell = container;
      return Object.freeze({
        actor,
        origin,
        get model() {
          return read(current?.reference.model).model;
        },
        get owner() {
          return read(current?.reference.model).owner;
        },
        get source() {
          return read(current?.reference.model).source;
        },
        get metadata() {
          return read(current?.reference.model).metadata;
        },
        get ports() {
          return container.value;
        },
      });
    },
    view(committed) {
      read(current?.reference.model);
      return committed;
    },
  };
}
