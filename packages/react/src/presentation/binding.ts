import type { RowData } from "@tanstack/react-table";
import {
  compileQueryExecution,
  type QueryExecutionExtent,
} from "../contracts/execution.js";
import { getQueryIdentity } from "../contracts/identity.js";
import { canonicalJson } from "../contracts/json.js";
import type { QueryFor, QuerySchema } from "../contracts/types.js";
import type { TableController } from "../controller/types.js";
import type { ResourceAdapter, ResourceRequest } from "../resource/types.js";
import {
  assertNativeController,
  assertNativeState,
} from "../tanstack/definition.js";
import type { NativeDefinition } from "../tanstack/types.js";
import type {
  ControlsRequestBinding,
  ControlsRequestInput,
  ControlsRequestStart,
} from "./types.js";

export class ControlsError extends Error {
  constructor(readonly code: "controls.binding" | "controls.unavailable") {
    super("Invalid Tableweave controls operation.");
    this.name = "ControlsError";
  }
}
export function unavailable(): never {
  throw new ControlsError("controls.unavailable");
}
const proofs = new WeakMap<
  object,
  { definition: object; controller: object; resource: object }
>();
const requests = new WeakMap<object, object>();

function bindingFail(): never {
  throw new ControlsError("controls.binding");
}

// Own descriptor capture prevents validation of A followed by a getter's B.
class RequestCapture {
  private readonly fields = new WeakMap<
    object,
    Map<string, PropertyDescriptor | undefined>
  >();
  descriptor(input: unknown, key: string): PropertyDescriptor | undefined {
    if (!input || typeof input !== "object") return bindingFail();
    let fields = this.fields.get(input);
    if (!fields) {
      fields = new Map();
      this.fields.set(input, fields);
    }
    if (!fields.has(key))
      fields.set(key, Object.getOwnPropertyDescriptor(input, key));
    return fields.get(key);
  }
  data(input: unknown, key: string, optional = false): unknown {
    const field = this.descriptor(input, key);
    if (!field && optional) return undefined;
    if (!field || !Object.hasOwn(field, "value")) return bindingFail();
    return field.value;
  }
  text(input: unknown, key: string): string {
    const value = this.data(input, key);
    return typeof value === "string" && value ? value : bindingFail();
  }
  extent(
    input: unknown,
    pagination: QueryExecutionExtent,
  ): QueryExecutionExtent {
    if (!input || typeof input !== "object" || Array.isArray(input))
      return bindingFail();
    const prototype: unknown = Object.getPrototypeOf(input);
    if (prototype !== Object.prototype && prototype !== null)
      return bindingFail();
    const keys = Reflect.ownKeys(input);
    for (const key of keys) {
      if (
        typeof key !== "string" ||
        !["kind", "pageIndex", "pageSize"].includes(key) ||
        !this.descriptor(input, key)?.enumerable
      )
        return bindingFail();
      this.data(input, key);
    }
    const kind = this.data(input, "kind");
    if (
      kind === "complete" &&
      keys.length === 1 &&
      pagination.kind === "complete"
    )
      return Object.freeze({ kind });
    if (kind !== "page" || keys.length !== 3 || pagination.kind !== "page")
      return bindingFail();
    const pageIndex = this.data(input, "pageIndex"),
      pageSize = this.data(input, "pageSize");
    if (pageIndex !== pagination.pageIndex || pageSize !== pagination.pageSize)
      return bindingFail();
    return Object.freeze({ kind, pageIndex, pageSize });
  }
}

/** Captures accepted provenance BEFORE begin can synchronously notify observers.
 * Does not invoke transport, acquire a lifetime, or own another request buffer. */
export function beginControlsRequest<S extends QuerySchema, T extends RowData>(
  definition: NativeDefinition<S, T>,
  controller: TableController<S>,
  resource: ResourceAdapter<T, QueryFor<S>>,
  input: ControlsRequestInput<S>,
): ControlsRequestStart<S> | null {
  try {
    assertNativeController(definition, controller);
    const state = controller.getSnapshot();
    const fixedDefinition = controller.getDefinition();
    const initialContext = resource.getSnapshot().context;
    const query = state.query;
    const queryIdentity = state.queryIdentity;
    const evaluatedAt = state.evaluatedAt;
    const definitionIdentity = state.definitionIdentity;
    assertNativeState(definition, state);
    if (controller.isDisposed()) throw new ControlsError("controls.binding");
    const capture = new RequestCapture();
    if (
      capture.descriptor(input, "query") ||
      capture.descriptor(input, "evaluatedAt")
    )
      return bindingFail();
    const definitionKey = capture.text(input, "definitionKey"),
      scopeKey = capture.text(input, "scopeKey"),
      queryKey = capture.text(input, "queryKey"),
      requestKey = capture.text(input, "requestKey");
    const retry = capture.data(
      input,
      "retry",
      true,
    ) as ControlsRequestInput<S>["retry"];
    if (retry !== undefined && typeof retry !== "function")
      return bindingFail();
    const resolved: QueryExecutionExtent = definition.paginationEnabled
      ? Object.freeze({ kind: "page", ...query.pagination })
      : Object.freeze({ kind: "complete" });
    const extentField = capture.descriptor(input, "extent");
    if (!extentField && !definition.paginationEnabled) return bindingFail();
    let extent = resolved;
    if (extentField) {
      if (!extentField.enumerable) return bindingFail();
      // Policy/shape mismatch is denied before custom query normalization.
      extent = capture.extent(capture.data(input, "extent"), resolved);
      const execution = compileQueryExecution(
        definition.controllerDefinition.schema,
        query,
        {
          now: evaluatedAt,
          ...(definition.evaluation.registry
            ? { registry: definition.evaluation.registry }
            : {}),
        },
      );
      if (
        execution.queryIdentity !== queryIdentity ||
        canonicalJson(execution.extent) !== canonicalJson(extent)
      )
        return bindingFail();
      extent = execution.extent;
    }
    const live = () => {
      const current = resource.getSnapshot();
      return (
        !controller.isDisposed() &&
        controller.getDefinition() === fixedDefinition &&
        current.context.definitionKey === initialContext.definitionKey &&
        current.context.scopeKey === initialContext.scopeKey &&
        current.context.access === true &&
        current.active &&
        !current.invalidationFailed &&
        current.kind !== "disposed"
      );
    };
    if (!live()) return null;
    const register = (
      request: ResourceRequest<QueryFor<S>>,
    ): ControlsRequestStart<S> => {
      if (
        getQueryIdentity(
          definition.controllerDefinition.schema,
          request.query,
          { ...definition.evaluation, now: evaluatedAt },
        ) !== queryIdentity ||
        canonicalJson(request.query) !== canonicalJson(query) ||
        canonicalJson(
          request.extent ?? { kind: "page", ...request.query.pagination },
        ) !== canonicalJson(extent) ||
        (extentField
          ? !Object.hasOwn(request, "extent") ||
            !Object.hasOwn(request, "evaluatedAt") ||
            request.evaluatedAt !== evaluatedAt
          : Object.hasOwn(request, "extent") ||
            Object.hasOwn(request, "evaluatedAt")) ||
        !live() ||
        resource.getSnapshot().request !== request
      )
        throw new ControlsError("controls.binding");
      const binding = Object.freeze({
        request,
        definitionIdentity,
        queryIdentity,
        evaluatedAt,
        extent,
      }) as ControlsRequestBinding<S>;
      proofs.set(binding, { definition, controller, resource });
      requests.set(request, binding);
      return Object.freeze({ request, binding });
    };
    const request = resource.begin({
      definitionKey,
      scopeKey,
      queryKey,
      requestKey,
      query,
      ...(extentField ? { extent, evaluatedAt } : {}),
      ...(retry
        ? {
            retry(request: ResourceRequest<QueryFor<S>>) {
              // Retry uses the original request query and evaluation, NEVER a newer
              // controller clock. Register before the application's explicit transport.
              register(request);
              return retry(request);
            },
          }
        : {}),
    });
    return request && live() ? register(request) : null;
  } catch {
    throw new ControlsError("controls.binding");
  }
}

/** Lookup only: arbitrary old or never-registered tokens can never be bound. */
export function getControlsRequestBinding<
  S extends QuerySchema,
  T extends RowData,
>(
  definition: NativeDefinition<S, T>,
  controller: TableController<S>,
  resource: ResourceAdapter<T, QueryFor<S>>,
  request: ResourceRequest<QueryFor<S>>,
): ControlsRequestBinding<S> | null {
  const binding = requests.get(request);
  return binding && hasBindingProof(binding, definition, controller, resource)
    ? (binding as ControlsRequestBinding<S>)
    : null;
}
export function hasBindingProof(
  binding: object,
  definition: object,
  controller: object,
  resource: object,
): boolean {
  const proof = proofs.get(binding);
  return (
    proof?.definition === definition &&
    proof.controller === controller &&
    proof.resource === resource
  );
}
