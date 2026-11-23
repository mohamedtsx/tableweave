import { validContext } from "../contracts/context.js";
import { fail } from "../contracts/errors.js";
import { freeze } from "../contracts/json.js";
import { knownRuleId, validatePredicate } from "../contracts/schema.js";
import type {
  JsonValue,
  OperatorRegistry,
  QuerySchema,
  WireRule,
} from "../contracts/types.js";
import { defaultOperatorRegistry, operatorAllowed } from "./registry.js";

export interface InverseOptions {
  readonly locale: string;
  readonly timeZone: string;
  readonly registry?: OperatorRegistry;
  readonly replacement?: JsonValue;
}
// Pure rule-value helper, not a query/controller command. The editor retains its ID.
export function invertRule(
  schema: QuerySchema,
  input: WireRule,
  options: InverseOptions,
): WireRule {
  if (!validContext(options.locale, options.timeZone)) fail("query.context");
  knownRuleId(input);
  const registry = options.registry ?? defaultOperatorRegistry;
  const rule = validatePredicate(schema, input, "builder", registry, options);
  const descriptor = registry.get(rule.operator);
  const inverse = descriptor?.inverse
    ? registry.get(descriptor.inverse)
    : undefined;
  const field = schema.fields[rule.field];
  if (!descriptor || !inverse || !field || !operatorAllowed(field, inverse))
    fail("rule.operator", rule.field);
  const replacing = Object.hasOwn(options, "replacement");
  if (
    !replacing &&
    descriptor.cardinality !== inverse.cardinality &&
    inverse.cardinality !== "none"
  )
    fail("operator.replacement", rule.field);
  const value =
    inverse.cardinality === "none"
      ? undefined
      : replacing
        ? options.replacement
        : rule.value;
  const next = (() => {
    try {
      return validatePredicate(
        schema,
        {
          field: rule.field,
          operator: inverse.id,
          ...(value === undefined ? {} : { value }),
        },
        "builder",
        registry,
        options,
      );
    } catch {
      return fail(
        !replacing && inverse.cardinality !== "none"
          ? "operator.replacement"
          : "rule.value",
        rule.field,
      );
    }
  })();
  return freeze({ id: input.id, ...next });
}
