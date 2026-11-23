import { fail } from "../contracts/errors.js";
import type { FieldDefinition, QuerySchema } from "../contracts/types.js";
import type { CompiledRule, CompileOptions, FilterPlan } from "./plan.js";
import { compileFilter } from "./plan.js";

export interface QueryTranslator<T> {
  readonly operators: Readonly<
    Record<
      string,
      (rule: CompiledRule, field: FieldDefinition, plan: FilterPlan) => T
    >
  >;
  all(items: readonly T[]): T;
  any(items: readonly T[]): T;
  search?(
    fieldId: string,
    text: string,
    policy: FilterPlan["search"],
    plan: FilterPlan,
  ): T;
}
export function translateQuery<T>(
  schema: QuerySchema,
  input: unknown,
  translator: QueryTranslator<T>,
  options: CompileOptions,
): T {
  // Always validate the original query; never accept a client-supplied compiled plan.
  const plan = compileFilter(schema, input, options);
  try {
    const rule = (item: CompiledRule): T => {
      const adapter = Object.hasOwn(translator.operators, item.operator)
        ? translator.operators[item.operator]
        : undefined;
      const field = schema.fields[item.field];
      if (!adapter || !field) fail("operator.translation", item.field);
      return adapter(item, field, plan);
    };
    const group = (rules: readonly CompiledRule[], join: "and" | "or"): T =>
      rules.length && join === "or"
        ? translator.any(rules.map(rule))
        : translator.all(rules.map(rule));
    const conditions = [
      group(plan.builder.rules, plan.builder.join),
      group(plan.tab.rules, plan.tab.join),
    ];
    if (plan.date) conditions.push(rule(plan.date));
    if (plan.search.text) {
      if (!translator.search) fail("operator.translation");
      const search = translator.search.bind(translator);
      conditions.push(
        translator.any(
          plan.search.fields.map((id) =>
            search(id, plan.search.text, plan.search, plan),
          ),
        ),
      );
    }
    return translator.all(conditions);
  } catch {
    return fail("operator.translation");
  }
}
