import type {
  CompiledRule,
  CompileOptions,
  FilterPlan,
} from "../filters/plan.js";
import { compileNormalizedFilter } from "../filters/plan.js";
import { defaultOperatorRegistry } from "../filters/registry.js";
import { canonicalJson } from "./json.js";
import { normalizeQuery } from "./query.js";
import type { QuerySchema } from "./types.js";

function filterKey(
  schema: QuerySchema,
  plan: FilterPlan,
  options: CompileOptions,
): string {
  const registry = options.registry ?? defaultOperatorRegistry;
  const rule = (item: CompiledRule): string => {
    const field = schema.fields[item.field];
    const descriptor = registry.get(item.operator);
    let value = item.value;
    if (
      descriptor?.builtin &&
      field?.type === "text" &&
      !field.caseSensitive &&
      typeof value === "string"
    )
      value = value.toLocaleLowerCase(plan.locale);
    return canonicalJson({
      field: item.field,
      operator: item.operator,
      ...(item.interval
        ? { interval: item.interval }
        : value === undefined
          ? {}
          : { value }),
    });
  };
  const group = (input: FilterPlan["builder"]) => {
    if (!input.rules.length) return null;
    const builtins = input.rules
      .filter((item) => registry.get(item.operator)?.builtin)
      .map(rule);
    const custom = input.rules
      .filter((item) => !registry.get(item.operator)?.builtin)
      .map(rule);
    const rules = [...new Set(builtins)].sort();
    return {
      join: rules.length + custom.length === 1 ? "and" : input.join,
      rules,
      custom,
    };
  };
  return canonicalJson({
    schemaId: schema.id,
    schemaVersion: schema.version,
    locale: plan.locale,
    timeZone: plan.timeZone,
    builder: group(plan.builder),
    tab: group(plan.tab),
    date: plan.date ? rule(plan.date) : null,
    search: !plan.search.text
      ? null
      : {
          ...plan.search,
          fields: [...plan.search.fields].sort(),
          text:
            plan.search.matcher === "contains" && !plan.search.caseSensitive
              ? plan.search.text.toLocaleLowerCase(plan.locale)
              : plan.search.text,
        },
  });
}
export function getFilterIdentity<S extends QuerySchema>(
  schema: S,
  input: unknown,
  options: CompileOptions,
): string {
  return filterKey(
    schema,
    compileNormalizedFilter(
      schema,
      normalizeQuery(schema, input, options),
      options,
    ),
    options,
  );
}
export function getQueryIdentity<S extends QuerySchema>(
  schema: S,
  input: unknown,
  options: CompileOptions,
): string {
  const query = normalizeQuery(schema, input, options);
  const plan = compileNormalizedFilter(schema, query, options);
  return canonicalJson({
    version: 1,
    schemaId: schema.id,
    schemaVersion: schema.version,
    filter: filterKey(schema, plan, options),
    tabId: query.tabId,
    sorting: query.sorting,
    pagination: query.pagination,
    locale: query.locale,
    timeZone: query.timeZone,
  });
}
