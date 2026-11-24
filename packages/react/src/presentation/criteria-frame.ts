import type { RowData } from "@tanstack/react-table";
import type { QueryFor, QuerySchema } from "../contracts/types.js";
import {
  type CriteriaAuthority,
  type CriteriaOrigin,
  requireCriteriaAuthority,
} from "../controller/criteria.js";
import {
  type CriteriaPublication,
  getCriteriaPublicationBinding,
} from "../controller/criteria-publication.js";
import type {
  ControllerDefinition,
  TableController,
} from "../controller/types.js";
import type {
  PageInfo,
  ResourceAdapter,
  ResourceContext,
  ResourceRequest,
  ResourceView,
} from "../resource/types.js";
import { createNativeBoundary } from "../tanstack/boundary.js";
import {
  assertNativeController,
  assertNativeState,
} from "../tanstack/definition.js";
import type {
  NativeDefinition,
  NativeInput,
  NativeTableView,
} from "../tanstack/types.js";
import { createControlsAuthority } from "./authority.js";
import { getControlsRequestBinding, hasBindingProof } from "./binding.js";
import {
  CriteriaCapture,
  type CriteriaCheck,
  createCriteriaCallbacks,
  safeCriteriaFrameError,
} from "./criteria-callbacks.js";
import type {
  ControlsAuthority,
  ControlsInput,
  ControlsRequestBinding,
} from "./types.js";

export {
  CriteriaFrameError,
  safeCriteriaFrameError,
} from "./criteria-callbacks.js";

declare const ownerBrand: unique symbol;
declare const ticketBrand: unique symbol;
declare const frameBrand: unique symbol;
declare const toolBrand: unique symbol;
export interface CriteriaFrameOwner<S extends QuerySchema> {
  readonly [ownerBrand]: (schema: S) => S;
  readonly controller: TableController<S>;
  readonly definition: ControllerDefinition<S>;
  readonly publication: CriteriaPublication<S>;
}
export interface CriteriaFrameTicket<S extends QuerySchema, T extends RowData> {
  readonly [ticketBrand]: (schema: S, record: T) => readonly [S, T];
}
export interface CriteriaCommittedFrame<
  S extends QuerySchema,
  T extends RowData,
> {
  readonly [frameBrand]: (schema: S, record: T) => readonly [S, T];
  readonly view: NativeTableView<S, T>;
}
export interface CriteriaToolAuthority<S extends QuerySchema> {
  readonly [toolBrand]: (schema: S) => S;
}
export interface CriteriaFrameInput<S extends QuerySchema, T extends RowData> {
  readonly criteria: CriteriaAuthority<S>;
  readonly expected: CriteriaOrigin<S>["context"];
  readonly source: ControlsInput<S, T>["source"];
  readonly nativeInput: NativeInput<T>;
}
export interface CriteriaFramePair<S extends QuerySchema, T extends RowData> {
  readonly owner: CriteriaFrameOwner<S>;
  readonly controls: ControlsAuthority<S, T>;
  readonly criteria: CriteriaAuthority<S>;
  readonly tool: CriteriaToolAuthority<S>;
}
export interface CriteriaFrameSnapshot {
  readonly phase: "empty" | "committed" | "closed";
  readonly version: object;
}
export interface CriteriaFrameObserver {
  readonly notify: () => undefined;
}
export interface CriteriaFrames<S extends QuerySchema, T extends RowData>
  extends CriteriaFrameOwner<S> {
  readonly prepare: (
    this: CriteriaFrames<S, T>,
    input: CriteriaFrameInput<NoInfer<S>, NoInfer<T>>,
  ) => CriteriaFrameTicket<S, T>;
  readonly commit: (
    this: CriteriaFrames<S, T>,
    ticket: CriteriaFrameTicket<NoInfer<S>, NoInfer<T>>,
  ) => CriteriaCommittedFrame<S, T>;
  readonly issue: (
    this: CriteriaFrames<S, T>,
    frame: CriteriaCommittedFrame<NoInfer<S>, NoInfer<T>>,
  ) => CriteriaFramePair<S, T>;
  readonly disconnect: (
    this: CriteriaFrames<S, T>,
    frame: CriteriaCommittedFrame<NoInfer<S>, NoInfer<T>>,
  ) => void;
  readonly getSnapshot: (this: CriteriaFrames<S, T>) => CriteriaFrameSnapshot;
  readonly subscribe: (
    this: CriteriaFrames<S, T>,
    observer: CriteriaFrameObserver,
  ) => () => void;
  readonly close: (this: CriteriaFrames<S, T>) => void;
}
export interface CriteriaFramesOptions<
  S extends QuerySchema,
  T extends RowData,
> {
  readonly nativeDefinition: NativeDefinition<S, T>;
  readonly controller: TableController<NoInfer<S>>;
  readonly publication: CriteriaPublication<NoInfer<S>>;
  readonly criteria: CriteriaAuthority<NoInfer<S>>;
}

function deny(): never {
  throw safeCriteriaFrameError();
}
function object(value: unknown): value is object {
  return value !== null && typeof value === "object";
}
function sameContext(a: ResourceContext, b: ResourceContext): boolean {
  return (
    a.definitionKey === b.definitionKey &&
    a.scopeKey === b.scopeKey &&
    a.access === b.access
  );
}
function sameOrigin<S extends QuerySchema>(
  a: CriteriaOrigin<S>,
  b: CriteriaOrigin<S>,
): boolean {
  return (
    a.controller === b.controller &&
    a.definition === b.definition &&
    a.epoch === b.epoch &&
    sameContext(a.context, b.context)
  );
}
type Boundary<S extends QuerySchema, T extends RowData> = ReturnType<
  typeof createNativeBoundary<S, T>
>;
type NativeFrame<S extends QuerySchema, T extends RowData> = ReturnType<
  Boundary<S, T>["prepare"]
>;
interface Source<S extends QuerySchema, T extends RowData> {
  readonly captured: ControlsInput<S, T>["source"];
  readonly native: NativeInput<T>;
  readonly check: (strict: boolean) => undefined;
  readonly resource: ResourceAdapter<T, QueryFor<S>> | null;
}
interface Entry<S extends QuerySchema, T extends RowData> {
  readonly owner: State<S, T>;
  readonly origin: CriteriaOrigin<S>;
  readonly criteria: CriteriaAuthority<S>;
  readonly source: Source<S, T>;
  readonly expected: ResourceContext;
  operation: object;
  phase: "building" | "prepared" | "committing" | "committed" | "invalid";
  native?: NativeFrame<S, T>;
  view?: NativeTableView<S, T>;
  input?: ControlsInput<S, T>;
  committed?: CriteriaCommittedFrame<S, T>;
}
interface State<S extends QuerySchema, T extends RowData> {
  readonly nativeDefinition: NativeDefinition<S, T>;
  readonly controller: TableController<S>;
  readonly definition: ControllerDefinition<S>;
  readonly publication: CriteriaPublication<S>;
  readonly readPublication: CriteriaPublication<S>["getSnapshot"];
  readonly issueCriteria: CriteriaPublication<S>["issue"];
  owner: CriteriaFrames<S, T>;
  boundary: Boundary<S, T> | null;
  cell: Entry<S, T> | null;
  prepared: Entry<S, T> | null;
  pin: {
    mode: ControlsInput<S, T>["source"]["mode"];
    resource: object | null;
  } | null;
  operation: object;
  busy: boolean;
  closed: boolean;
  snapshot: CriteriaFrameSnapshot;
  readonly observers: Set<{
    receiver: object;
    notify: (...args: never[]) => unknown;
  }>;
}
interface Tool<S extends QuerySchema> {
  readonly owner: CriteriaFrameOwner<S>;
  readonly criteria: CriteriaAuthority<S>;
  readonly origin: CriteriaOrigin<S>;
  readonly controls: object;
}
const owners = new WeakMap<object, unknown>(),
  tickets = new WeakMap<object, unknown>(),
  frames = new WeakMap<object, unknown>(),
  tools = new WeakMap<object, unknown>();
function state<S extends QuerySchema, T extends RowData>(
  receiver: unknown,
): State<S, T> {
  if (!object(receiver)) return deny();
  const value = owners.get(receiver);
  return value ? (value as State<S, T>) : deny();
}
function checkDomain<S extends QuerySchema, T extends RowData>(
  owner: State<S, T>,
  criteria: CriteriaAuthority<S>,
  origin: CriteriaOrigin<S>,
): undefined {
  if (owner.closed) return deny();
  const binding = getCriteriaPublicationBinding(criteria);
  if (
    !binding ||
    binding.publication !== owner.publication ||
    binding.origin.controller !== owner.controller ||
    binding.origin.definition !== owner.definition ||
    !sameOrigin(binding.origin, origin)
  )
    return deny();
  requireCriteriaAuthority(criteria, origin);
  const snapshot = Reflect.apply(owner.readPublication, owner.publication, []);
  if (
    snapshot.phase !== "settled" ||
    snapshot.current.controller !== owner.controller ||
    snapshot.current.definition !== owner.definition ||
    snapshot.current.epoch !== origin.epoch ||
    !sameContext(snapshot.current.expected, origin.context) ||
    !sameContext(snapshot.current.actual, origin.context) ||
    !origin.context.access
  )
    return deny();
  return undefined;
}
function checkEntry<S extends QuerySchema, T extends RowData>(
  entry: Entry<S, T>,
): undefined {
  const owner = entry.owner;
  const invalidated = () => entry.phase === "invalid";
  if (entry.phase === "invalid" || owner.closed) return deny();
  if (entry.phase === "committed") {
    if (
      owner.cell !== entry ||
      (owner.busy && owner.operation !== entry.operation)
    )
      return deny();
  } else if (owner.operation !== entry.operation) return deny();
  checkDomain(owner, entry.criteria, entry.origin);
  entry.source.check(entry.phase !== "committed");
  if (
    invalidated() ||
    owner.closed ||
    (entry.phase === "committed"
      ? owner.cell !== entry
      : owner.operation !== entry.operation)
  )
    return deny();
  return undefined;
}
function publish<S extends QuerySchema, T extends RowData>(
  owner: State<S, T>,
  phase: CriteriaFrameSnapshot["phase"],
): void {
  owner.snapshot = Object.freeze({ phase, version: Object.freeze({}) });
  for (const observer of [...owner.observers]) {
    if (!owner.observers.has(observer)) continue;
    try {
      Reflect.apply(observer.notify, observer.receiver, []);
    } catch {
      /* Metadata observers cannot grant permission or expose raw errors. */
    }
  }
}
function mutation<S extends QuerySchema, T extends RowData, Result>(
  owner: State<S, T>,
  action: (operation: object) => Result,
  allowClosed = false,
): Result {
  if (owner.busy) {
    owner.operation = Object.freeze({});
    return deny();
  }
  if (owner.closed) return deny();
  owner.busy = true;
  const operation = Object.freeze({});
  owner.operation = operation;
  try {
    const result = action(operation);
    if (owner.operation !== operation || (owner.closed && !allowClosed))
      return deny();
    return result;
  } catch {
    return deny();
  } finally {
    owner.busy = false;
  }
}

/** Source metadata only. Never enumerates records, compiles queries or projects
 * controls. Binding proof is checked before any alleged binding payload is read. */
function captureSource<S extends QuerySchema, T extends RowData>(
  owner: State<S, T>,
  capture: CriteriaCapture,
  raw: unknown,
  rawNative: unknown,
  expected: ResourceContext,
  base: CriteriaCheck,
): Source<S, T> {
  const mode = capture.data(raw, "mode"),
    nativeMode = capture.data(rawNative, "mode");
  if (mode !== "client" && mode !== "server" && mode !== "server-complete")
    return deny();
  if (
    mode !== nativeMode ||
    (mode === "server" && !owner.nativeDefinition.paginationEnabled) ||
    (mode === "server-complete" && owner.nativeDefinition.paginationEnabled)
  )
    return deny();
  const records = capture.data(rawNative, "records");
  if (!Array.isArray(records)) return deny();
  if (mode === "client") {
    const contextRef = capture.data(raw, "context"),
      context = capture.context(contextRef),
      supplied = capture.data(raw, "records");
    if (supplied !== records || !sameContext(context, expected)) return deny();
    const source = Object.freeze({
      mode,
      context,
      records: records as readonly T[],
    });
    return {
      captured: source,
      native: Object.freeze({ mode, records: source.records }),
      resource: null,
      check() {
        base();
        if (
          !sameContext(new CriteriaCapture(base).context(contextRef), expected)
        )
          return deny();
        base();
        return undefined;
      },
    };
  }
  const resource = capture.data(raw, "resource");
  if (!object(resource)) return deny();
  const view = capture.data(raw, "view");
  if (!object(view)) return deny();
  const bindingsInput = capture.data(raw, "bindings"),
    requestBinding = capture.data(bindingsInput, "request"),
    snapshotBinding = capture.data(bindingsInput, "snapshot");
  const getSnapshot = capture.data(resource, "getSnapshot"),
    getServerSnapshot = capture.data(resource, "getServerSnapshot");
  if (
    typeof getSnapshot !== "function" ||
    typeof getServerSnapshot !== "function"
  )
    return deny();
  const port = resource as ResourceAdapter<T, QueryFor<S>>;
  const read = (): ResourceView<T, QueryFor<S>> => {
    base();
    try {
      return Reflect.apply(getSnapshot, resource, []);
    } finally {
      base();
    }
  };
  const server = (): ResourceView<T, QueryFor<S>> => {
    base();
    try {
      return Reflect.apply(getServerSnapshot, resource, []);
    } finally {
      base();
    }
  };
  const pageCopy = (value: unknown): PageInfo => {
    const kind = capture.data(value, "kind");
    if (kind === "known") {
      const total = capture.data(value, "total");
      if (
        typeof total !== "number" ||
        !Number.isSafeInteger(total) ||
        total < 0
      )
        return deny();
      return Object.freeze({ kind, total });
    }
    if (kind === "unknown") {
      const hasNextPage = capture.data(value, "hasNextPage");
      if (typeof hasNextPage !== "boolean") return deny();
      return Object.freeze({ kind, hasNextPage });
    }
    return deny();
  };
  const page = pageCopy(capture.data(rawNative, "pageInfo"));
  if (mode === "server-complete" && page.kind !== "known") return deny();
  const actual = read();
  if (view !== actual && view !== server()) return deny();
  const context = capture.context(capture.data(view, "context"));
  if (!sameContext(context, expected)) return deny();
  function proof(value: unknown): ControlsRequestBinding<S> {
    if (
      !object(value) ||
      !hasBindingProof(value, owner.nativeDefinition, owner.controller, port)
    )
      return deny();
    const binding = value as ControlsRequestBinding<S>;
    if (
      getControlsRequestBinding(
        owner.nativeDefinition,
        owner.controller,
        port,
        binding.request,
      ) !== binding ||
      binding.definitionIdentity !==
        owner.controller.getSnapshot().definitionIdentity
    )
      return deny();
    return binding;
  }
  function matches(
    value: unknown,
    envelope: ResourceRequest<QueryFor<S>>,
  ): undefined {
    const binding = proof(value),
      token = binding.request;
    for (const key of [
      "definitionKey",
      "scopeKey",
      "queryKey",
      "requestKey",
      "generation",
      "query",
    ] as const)
      if (capture.data(envelope, key) !== token[key]) return deny();
    if (
      token.definitionKey !== expected.definitionKey ||
      token.scopeKey !== expected.scopeKey
    )
      return deny();
    if (
      binding.extent.kind !== (mode === "server-complete" ? "complete" : "page")
    )
      return deny();
    const extent = capture.data(envelope, "extent", true),
      time = capture.data(envelope, "evaluatedAt", true);
    if (token.extent) {
      if (
        !extent ||
        capture.data(extent, "kind") !== binding.extent.kind ||
        time !== binding.evaluatedAt ||
        token.evaluatedAt !== binding.evaluatedAt
      )
        return deny();
      if (
        binding.extent.kind === "page" &&
        (capture.data(extent, "pageIndex") !== binding.extent.pageIndex ||
          capture.data(extent, "pageSize") !== binding.extent.pageSize)
      )
        return deny();
    } else if (
      capture.descriptor(envelope, "extent") ||
      capture.descriptor(envelope, "evaluatedAt") ||
      binding.extent.kind !== "page"
    )
      return deny();
    return undefined;
  }
  const snapshot = capture.data(view, "snapshot"),
    request = capture.data(view, "request");
  if (request === null) {
    if (requestBinding !== null) return deny();
  } else matches(requestBinding, request as ResourceRequest<QueryFor<S>>);
  if (snapshot === null) {
    if (
      snapshotBinding !== null ||
      capture.data(records, "length") !== 0 ||
      (page.kind === "known" ? page.total !== 0 : page.hasNextPage !== false)
    )
      return deny();
  } else {
    matches(snapshotBinding, snapshot as ResourceRequest<QueryFor<S>>);
    if (capture.data(snapshot, "records") !== records) return deny();
    const suppliedPage = pageCopy(capture.data(snapshot, "page"));
    if (
      suppliedPage.kind !== page.kind ||
      (page.kind === "known"
        ? suppliedPage.kind !== "known" || suppliedPage.total !== page.total
        : suppliedPage.kind !== "unknown" ||
          suppliedPage.hasNextPage !== page.hasNextPage)
    )
      return deny();
    const length = capture.data(records, "length");
    if (typeof length !== "number") return deny();
    if (mode === "server-complete") {
      if (page.kind !== "known" || page.total !== length) return deny();
    } else {
      const pagination = (snapshot as ResourceRequest<QueryFor<S>>).query
        .pagination;
      if (
        length > pagination.pageSize ||
        (page.kind === "known" &&
          length >
            Math.max(
              0,
              page.total - pagination.pageIndex * pagination.pageSize,
            ))
      )
        return deny();
    }
  }
  const captured = Object.freeze({
    mode,
    resource: port,
    view: view as ResourceView<T, QueryFor<S>>,
    bindings: Object.freeze({
      request: requestBinding as ControlsRequestBinding<S> | null,
      snapshot: snapshotBinding as ControlsRequestBinding<S> | null,
    }),
  });
  const native: NativeInput<T> =
    mode === "server-complete" && page.kind === "known"
      ? Object.freeze({
          mode,
          records: records as readonly T[],
          pageInfo: page,
        })
      : Object.freeze({
          mode: "server",
          records: records as readonly T[],
          pageInfo: page,
        });
  return {
    captured,
    native,
    resource: port,
    check(strict) {
      const fresh = read(),
        current = new CriteriaCapture(base);
      if (
        !sameContext(
          current.context(current.data(fresh, "context")),
          expected,
        ) ||
        current.data(fresh, "active") !== true ||
        current.data(fresh, "invalidationFailed") !== false ||
        current.data(fresh, "kind") === "disposed"
      )
        return deny();
      const request = current.data(fresh, "request");
      if (
        request !== null &&
        getControlsRequestBinding(
          owner.nativeDefinition,
          owner.controller,
          port,
          request as ResourceRequest<QueryFor<S>>,
        ) === null
      )
        return deny();
      if (strict && view !== fresh && view !== server()) return deny();
      base();
      return undefined;
    },
  };
}

export function createCriteriaFrames<S extends QuerySchema, T extends RowData>(
  options: CriteriaFramesOptions<S, T>,
): CriteriaFrames<S, T> {
  try {
    const capture = new CriteriaCapture(() => undefined);
    const criteria = capture.data(options, "criteria") as CriteriaAuthority<S>;
    const binding = getCriteriaPublicationBinding(criteria);
    if (!binding) return deny();
    const publication = capture.data(options, "publication");
    if (publication !== binding.publication) return deny();
    const controller = capture.data(options, "controller");
    if (controller !== binding.origin.controller) return deny();
    const nativeDefinition = capture.data(
      options,
      "nativeDefinition",
    ) as NativeDefinition<S, T>;
    assertNativeController(nativeDefinition, binding.origin.controller);
    const readPublication = capture.data(publication, "getSnapshot"),
      issueCriteria = capture.data(publication, "issue");
    if (
      typeof readPublication !== "function" ||
      typeof issueCriteria !== "function"
    )
      return deny();
    const internal: State<S, T> = {
      nativeDefinition,
      controller: binding.origin.controller,
      definition: binding.origin.definition,
      publication: binding.publication,
      readPublication: readPublication as CriteriaPublication<S>["getSnapshot"],
      issueCriteria: issueCriteria as CriteriaPublication<S>["issue"],
      owner: null as unknown as CriteriaFrames<S, T>,
      boundary: null,
      cell: null,
      prepared: null,
      pin: null,
      operation: Object.freeze({}),
      busy: false,
      closed: false,
      snapshot: Object.freeze({ phase: "empty", version: Object.freeze({}) }),
      observers: new Set(),
    };
    const owner = Object.freeze({
      controller: internal.controller,
      definition: internal.definition,
      publication: internal.publication,
      prepare(this: CriteriaFrames<S, T>, input: CriteriaFrameInput<S, T>) {
        const actual = state<S, T>(this);
        if (actual !== internal) return deny();
        return mutation(actual, (operation) => {
          if (actual.prepared) actual.prepared.phase = "invalid";
          actual.prepared = null;
          const operationCheck: CriteriaCheck = () => {
            if (actual.operation !== operation || actual.closed) return deny();
            return undefined;
          };
          const first = new CriteriaCapture(operationCheck),
            criteria = first.data(input, "criteria") as CriteriaAuthority<S>,
            binding = getCriteriaPublicationBinding(criteria);
          if (
            !binding ||
            binding.publication !== actual.publication ||
            binding.origin.controller !== actual.controller ||
            binding.origin.definition !== actual.definition
          )
            return deny();
          const origin = binding.origin;
          let entry: Entry<S, T> | undefined;
          const localCheck: CriteriaCheck = () => {
            if (
              actual.closed ||
              (entry?.phase !== "committed" &&
                actual.operation !== (entry?.operation ?? operation))
            )
              return deny();
            return undefined;
          };
          const base: CriteriaCheck = () => {
            localCheck();
            checkDomain(actual, criteria, origin);
            localCheck();
            return undefined;
          };
          base();
          const capture = new CriteriaCapture(base),
            expected = capture.context(capture.data(input, "expected"));
          if (!sameContext(expected, origin.context)) return deny();
          const source = captureSource(
            actual,
            capture,
            capture.data(input, "source"),
            capture.data(input, "nativeInput"),
            expected,
            base,
          );
          source.check(true);
          if (
            actual.pin &&
            (actual.pin.mode !== source.captured.mode ||
              actual.pin.resource !== source.resource)
          )
            return deny();
          const captured: Entry<S, T> = {
            owner: actual,
            origin,
            criteria,
            source,
            expected,
            operation,
            phase: "building",
          };
          entry = captured;
          const check: CriteriaCheck = () => checkEntry(captured);
          try {
            const callbacks = createCriteriaCallbacks(
              actual.nativeDefinition,
              check,
            );
            actual.boundary ??= createNativeBoundary(
              actual.nativeDefinition,
              actual.controller,
            );
            const accepted = actual.controller.getSnapshot();
            assertNativeState(actual.nativeDefinition, accepted);
            check();
            entry.native = actual.boundary.prepare(
              source.native,
              accepted,
              callbacks,
            );
            entry.view = actual.boundary.getView(entry.native);
            entry.input = Object.freeze({
              native: entry.view,
              expected,
              source: source.captured,
            });
            check();
            entry.phase = "prepared";
            actual.prepared = entry;
            const ticket = Object.freeze({}) as CriteriaFrameTicket<S, T>;
            tickets.set(ticket, entry);
            return ticket;
          } catch {
            entry.phase = "invalid";
            return deny();
          }
        });
      },
      commit(this: CriteriaFrames<S, T>, ticket: CriteriaFrameTicket<S, T>) {
        const actual = state<S, T>(this);
        if (actual !== internal) return deny();
        if (actual.busy) {
          actual.operation = Object.freeze({});
          return deny();
        }
        const entry = object(ticket)
          ? (tickets.get(ticket) as Entry<S, T> | undefined)
          : undefined;
        if (
          !entry ||
          entry.owner !== actual ||
          entry !== actual.prepared ||
          entry.phase !== "prepared" ||
          entry.operation !== actual.operation
        )
          return deny();
        return mutation(actual, (operation) => {
          entry.operation = operation;
          entry.phase = "committing";
          actual.prepared = null;
          try {
            checkEntry(entry);
            if (!entry.native || !entry.view || !actual.boundary) return deny();
            actual.cell = null;
            actual.boundary.commit(entry.native); // May already publish its vendor atom.
            checkEntry(entry);
            const committed = Object.freeze({
              view: entry.view,
            }) as CriteriaCommittedFrame<S, T>;
            entry.committed = committed;
            frames.set(committed, entry);
            entry.phase = "committed";
            actual.cell = entry;
            actual.pin ??= {
              mode: entry.source.captured.mode,
              resource: entry.source.resource,
            };
            publish(actual, "committed");
            checkEntry(entry);
            if (actual.operation !== operation) return deny();
            return committed;
          } catch {
            entry.phase = "invalid";
            actual.cell = null;
            publish(actual, "empty");
            return deny();
          }
        });
      },
      issue(this: CriteriaFrames<S, T>, frame: CriteriaCommittedFrame<S, T>) {
        const actual = state<S, T>(this);
        if (actual !== internal) return deny();
        if (actual.busy) {
          actual.operation = Object.freeze({});
          return deny();
        }
        const entry = object(frame)
          ? (frames.get(frame) as Entry<S, T> | undefined)
          : undefined;
        if (
          !entry ||
          entry.owner !== actual ||
          actual.cell !== entry ||
          entry.committed !== frame ||
          entry.phase !== "committed"
        )
          return deny();
        return mutation(actual, (issuedOperation) => {
          const check: CriteriaCheck = () => {
            const current = actual.cell,
              operation = actual.operation;
            if (
              !current ||
              actual.closed ||
              current.phase !== "committed" ||
              !current.committed ||
              frames.get(current.committed) !== current ||
              !sameOrigin(current.origin, entry.origin) ||
              (actual.busy && operation !== issuedOperation)
            )
              return deny();
            checkDomain(actual, entry.criteria, entry.origin);
            current.source.check(false);
            if (
              actual.cell !== current ||
              actual.operation !== operation ||
              actual.closed
            )
              return deny();
            checkDomain(actual, entry.criteria, entry.origin);
            return undefined;
          };
          check();
          const readCommitted = () => {
            check();
            const input = actual.cell?.input;
            if (!input) return deny();
            return input;
          };
          const source = entry.source.captured;
          const base = {
            definition: actual.nativeDefinition,
            controller: actual.controller,
            queryIdentity: entry.view?.state.queryIdentity ?? deny(),
            context: entry.origin.context,
            readCommitted,
            checkCurrent: check,
          };
          const controls =
            source.mode === "client"
              ? createControlsAuthority({ ...base, mode: "client" })
              : createControlsAuthority({
                  ...base,
                  mode: source.mode,
                  resource: source.resource,
                });
          const criteria = Reflect.apply(
            actual.issueCriteria,
            actual.publication,
            [entry.origin],
          );
          const tool = Object.freeze({}) as CriteriaToolAuthority<S>;
          tools.set(tool, {
            owner: actual.owner,
            criteria,
            origin: entry.origin,
            controls,
          } satisfies Tool<S>);
          check();
          return Object.freeze({
            owner: actual.owner,
            controls,
            criteria,
            tool,
          });
        });
      },
      disconnect(
        this: CriteriaFrames<S, T>,
        frame: CriteriaCommittedFrame<S, T>,
      ) {
        const actual = state<S, T>(this);
        if (actual !== internal) return deny();
        mutation(actual, () => {
          const entry = object(frame)
            ? (frames.get(frame) as Entry<S, T> | undefined)
            : undefined;
          if (!entry || entry.owner !== actual) return deny();
          if (actual.cell !== entry) return;
          entry.phase = "invalid";
          actual.cell = null;
          if (actual.prepared) actual.prepared.phase = "invalid";
          actual.prepared = null;
          publish(actual, "empty");
        });
      },
      getSnapshot(this: CriteriaFrames<S, T>) {
        const actual = state<S, T>(this);
        if (actual !== internal) return deny();
        return actual.snapshot;
      },
      subscribe(this: CriteriaFrames<S, T>, observer: CriteriaFrameObserver) {
        const actual = state<S, T>(this);
        if (actual !== internal || actual.closed) return deny();
        const capture = new CriteriaCapture(() => {
            if (actual.closed) return deny();
            return undefined;
          }),
          notify = capture.data(observer, "notify");
        if (typeof notify !== "function") return deny();
        const entry = {
          receiver: observer,
          notify: notify as (...args: never[]) => unknown,
        };
        actual.observers.add(entry);
        return () => {
          actual.observers.delete(entry);
        };
      },
      close(this: CriteriaFrames<S, T>) {
        const actual = state<S, T>(this);
        if (actual !== internal) return deny();
        if (actual.busy) {
          actual.operation = Object.freeze({});
          return deny();
        }
        if (actual.closed) return;
        mutation(
          actual,
          () => {
            if (actual.cell) actual.cell.phase = "invalid";
            if (actual.prepared) actual.prepared.phase = "invalid";
            actual.cell = null;
            actual.prepared = null;
            actual.closed = true;
            publish(actual, "closed");
            actual.observers.clear();
          },
          true,
        );
      },
    }) as unknown as CriteriaFrames<S, T>;
    internal.owner = owner;
    owners.set(owner, internal);
    return owner;
  } catch {
    return deny();
  }
}

export function getCriteriaToolOwner<S extends QuerySchema>(
  authority: CriteriaToolAuthority<S>,
): CriteriaFrameOwner<S> | null {
  return object(authority)
    ? ((tools.get(authority) as Tool<S> | undefined)?.owner ?? null)
    : null;
}
export function requireCriteriaTool<S extends QuerySchema>(
  authority: CriteriaToolAuthority<S>,
  expected: CriteriaFrameOwner<NoInfer<S>>,
): CriteriaOrigin<S> {
  try {
    const proof = object(authority)
      ? (tools.get(authority) as Tool<S> | undefined)
      : undefined;
    if (
      !proof ||
      proof.owner !== expected ||
      !object(expected) ||
      !owners.has(expected)
    )
      return deny();
    const owner = state<S, RowData>(expected),
      binding = getCriteriaPublicationBinding(proof.criteria);
    const operation = owner.operation;
    if (
      !binding ||
      binding.publication !== owner.publication ||
      binding.origin.controller !== owner.controller ||
      binding.origin.definition !== owner.definition
    )
      return deny();
    checkDomain(owner, proof.criteria, proof.origin);
    const current = owner.cell;
    if (
      owner.busy ||
      !current ||
      current.phase !== "committed" ||
      !current.committed ||
      frames.get(current.committed) !== current ||
      !sameOrigin(current.origin, proof.origin)
    )
      return deny();
    current.source.check(false);
    checkDomain(owner, proof.criteria, proof.origin);
    if (
      owner.cell !== current ||
      owner.operation !== operation ||
      owner.busy ||
      owner.closed
    )
      return deny();
    return proof.origin;
  } catch {
    return deny();
  }
}
