import type { RowData } from "@tanstack/react-table";
import { getQueryIdentity } from "../contracts/identity.js";
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
    assertNativeState(definition, state);
    if (controller.isDisposed()) throw new ControlsError("controls.binding");
    const { definitionKey, scopeKey, queryKey, requestKey, retry } = input;
    if (retry !== undefined && typeof retry !== "function")
      throw new ControlsError("controls.binding");
    const register = (
      request: ResourceRequest<QueryFor<S>>,
    ): ControlsRequestStart<S> => {
      if (
        getQueryIdentity(
          definition.controllerDefinition.schema,
          request.query,
          { ...definition.evaluation, now: state.evaluatedAt },
        ) !== state.queryIdentity
      )
        throw new ControlsError("controls.binding");
      const binding = Object.freeze({
        request,
        definitionIdentity: state.definitionIdentity,
        queryIdentity: state.queryIdentity,
        evaluatedAt: state.evaluatedAt,
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
      query: state.query,
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
    return request ? register(request) : null;
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
