import type { OptionSourceContext } from "./editor-types.js";

/** Internal source/bridge handshake. No runtime imports or public source methods. */
export class OptionCriteriaError extends Error {
  readonly code = "options.criteria.unavailable";

  constructor() {
    super("Option criteria are unavailable.");
    this.name = "OptionCriteriaError";
  }
}

export function optionCriteriaUnavailable(): never {
  throw new OptionCriteriaError();
}

export interface OptionCriteriaClaim {
  activate(check: () => void): void;
  rollback(): void;
  purge(): object;
  cleanup(
    ticket: object,
    kind: "transition" | "release" | "dispose",
    next: OptionSourceContext | null,
    check: () => void,
  ): void;
}

export interface OptionCriteriaCapability {
  reserve(context: OptionSourceContext, check: () => void): OptionCriteriaClaim;
}

const capabilities = new WeakMap<object, OptionCriteriaCapability>();

/** Source-factory internal registration, not structural capability discovery. */
export function registerOptionCriteriaCapability(
  source: object,
  capability: OptionCriteriaCapability,
): void {
  if (capabilities.has(source)) optionCriteriaUnavailable();
  capabilities.set(source, capability);
}

/** Never inspects source properties, prototypes, snapshots or alleged methods. */
export function getOptionCriteriaCapability(
  source: unknown,
): OptionCriteriaCapability | null {
  return source !== null && typeof source === "object"
    ? (capabilities.get(source) ?? null)
    : null;
}
