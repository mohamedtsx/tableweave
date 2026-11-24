import type { CompileOptions, FilterPlan } from "../filters/plan.js";
import { compileFilter } from "../filters/plan.js";
import { fail } from "./errors.js";
import { getQueryIdentity } from "./identity.js";
import { freeze } from "./json.js";
import { normalizeQuery } from "./query.js";
import type { OperatorRegistry, QueryFor, QuerySchema } from "./types.js";

export type QueryExecutionExtent =
  | {
      readonly kind: "page";
      readonly pageIndex: number;
      readonly pageSize: number;
    }
  | { readonly kind: "complete" };

export interface QueryExecution<S extends QuerySchema> {
  readonly version: 1;
  readonly query: QueryFor<S>;
  readonly filter: FilterPlan;
  readonly extent: QueryExecutionExtent;
  readonly evaluatedAt: number;
  readonly queryIdentity: string;
}

function captureOptions(input: CompileOptions): CompileOptions {
  try {
    if (!input || typeof input !== "object" || Array.isArray(input))
      return fail("query.context");
    const prototype: unknown = Object.getPrototypeOf(input);
    if (prototype !== Object.prototype && prototype !== null)
      return fail("query.context");
    const descriptors = Object.getOwnPropertyDescriptors(input);
    const keys = Reflect.ownKeys(descriptors);
    if (
      !Object.hasOwn(descriptors, "now") ||
      keys.some((key) => {
        if (key !== "now" && key !== "registry") return true;
        const descriptor = descriptors[key];
        return (
          !descriptor?.enumerable ||
          !("value" in descriptor) ||
          descriptor.value === undefined
        );
      })
    )
      return fail("query.context");
    const now: unknown = descriptors.now?.value;
    if (
      typeof now !== "number" ||
      !Number.isFinite(now) ||
      !Number.isFinite(new Date(now).getTime())
    )
      return fail("query.context");
    const hasRegistry = Object.hasOwn(descriptors, "registry");
    const registry: unknown = hasRegistry
      ? descriptors.registry?.value
      : undefined;
    if (
      hasRegistry &&
      (registry === null ||
        (typeof registry !== "object" && typeof registry !== "function"))
    )
      return fail("query.context");
    // Freeze only this new envelope. The trusted registry remains the exact app
    // reference; its methods/prototype are neither cloned nor inspected here.
    return Object.freeze({
      now,
      ...(registry === undefined
        ? {}
        : { registry: registry as OperatorRegistry }),
    });
  } catch {
    return fail("query.context");
  }
}

/** Pure metadata, not transport, authorization or a backend completeness proof.
 * The application supplies its registered schema/registry and sanctioned clock.
 * Existing helpers may repeat pure/idempotent custom validation/normalization. */
export function compileQueryExecution<S extends QuerySchema>(
  registeredSchema: S,
  input: unknown,
  options: CompileOptions,
): QueryExecution<S> {
  const captured = captureOptions(options);
  const query = normalizeQuery(registeredSchema, input, captured);
  const filter = compileFilter(registeredSchema, query, captured);
  const queryIdentity = getQueryIdentity(registeredSchema, query, captured);
  const extent: QueryExecutionExtent =
    registeredSchema.pagination.enabled === false
      ? { kind: "complete" }
      : { kind: "page", ...query.pagination };
  return freeze({
    version: 1,
    query,
    filter,
    extent,
    evaluatedAt: captured.now,
    queryIdentity,
  });
}
