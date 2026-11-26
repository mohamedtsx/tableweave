interface CriteriaControllerMethods {
  readonly getDefinition: () => unknown;
  readonly isDisposed: () => boolean;
}

const methods = new WeakMap<object, CriteriaControllerMethods>();

/** Store-internal registration of its just-created frozen controller literal.
 * Never register application inputs, wrappers or structural controller matches.
 * Only references are retained; results and permission are always read live.
 */
export function registerCriteriaControllerMethods(
  controller: object,
  getDefinition: () => unknown,
  isDisposed: () => boolean,
): void {
  methods.set(controller, Object.freeze({ getDefinition, isDisposed }));
}

/** Exact factory identity only; no property access, reflection or proxy traps. */
export function getCriteriaControllerMethods(
  controller: unknown,
): CriteriaControllerMethods | null {
  if (controller === null || typeof controller !== "object") return null;
  return methods.get(controller) ?? null;
}
