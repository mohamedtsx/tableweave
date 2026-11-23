import { fail } from "../contracts/errors.js";
import { freeze } from "../contracts/json.js";
import { normalizeQuery } from "../contracts/query.js";
import { validatePredicate } from "../contracts/schema.js";
import type {
  JsonValue,
  OperatorRegistry,
  PredicateRule,
  QuerySchema,
  WireQuery,
} from "../contracts/types.js";
import type { DateInterval } from "./dates.js";
import { resolveDateOperand } from "./dates.js";
import { defaultOperatorRegistry } from "./registry.js";

export interface CompileOptions {
  readonly now: number;
  readonly registry?: OperatorRegistry;
}
export interface CompiledRule extends PredicateRule {
  readonly interval?: DateInterval;
}
export interface FilterPlan {
  readonly version: 1;
  readonly schemaId: string;
  readonly schemaVersion: number;
  readonly locale: string;
  readonly timeZone: string;
  readonly builder: {
    readonly join: "and" | "or";
    readonly rules: readonly CompiledRule[];
  };
  readonly search: {
    readonly text: string;
    readonly fields: readonly string[];
    readonly matcher: string;
    readonly caseSensitive: boolean;
    readonly trim: boolean;
  };
  readonly tab: {
    readonly join: "and" | "or";
    readonly rules: readonly CompiledRule[];
  };
  readonly date: CompiledRule | null;
}

// Internal producer boundary; public callers must use compileFilter/translateQuery.
export function compileNormalizedFilter(
  schema: QuerySchema,
  query: WireQuery,
  options: CompileOptions,
): FilterPlan {
  if (
    !Number.isFinite(options.now) ||
    !Number.isFinite(new Date(options.now).getTime())
  )
    fail("query.context");
  const registry = options.registry ?? defaultOperatorRegistry;
  const resolve = (rule: PredicateRule): CompiledRule => {
    const field = schema.fields[rule.field];
    const descriptor = registry.get(rule.operator);
    if (!field || !descriptor) fail("rule.operator");
    const base = {
      field: rule.field,
      operator: rule.operator,
      ...(rule.value === undefined ? {} : { value: rule.value }),
    };
    if (
      descriptor.builtin &&
      rule.operator.startsWith("date.") &&
      (field.type === "date" || field.type === "datetime")
    ) {
      const interval = resolveDateOperand(
        field,
        rule.value as Parameters<typeof resolveDateOperand>[1],
        { ...query, now: options.now },
      );
      return { ...base, interval };
    }
    return base;
  };
  const tab = schema.tabs?.find((candidate) => candidate.id === query.tabId);
  let date: CompiledRule | null = null;
  if (query.date !== null) {
    const entry = Object.entries(schema.fields).find(
      ([, field]) => field.owner === "date",
    );
    if (!entry) fail("query.date");
    date = resolve({
      field: entry[0],
      operator: query.date.operator,
      value: query.date.value as JsonValue,
    });
  }
  return freeze({
    version: 1,
    schemaId: schema.id,
    schemaVersion: schema.version,
    locale: query.locale,
    timeZone: query.timeZone,
    builder: {
      join: query.builder.join,
      rules: query.builder.rules.map(resolve),
    },
    search: {
      text: query.search,
      fields: Object.entries(schema.fields)
        .filter(([, field]) => field.owner === "search")
        .map(([id]) => id),
      matcher: schema.search?.matcher ?? "contains",
      caseSensitive: schema.search?.caseSensitive ?? false,
      trim: schema.search?.trim ?? false,
    },
    tab: {
      join: tab?.join ?? "and",
      rules: (tab?.rules ?? []).map((rule) =>
        resolve(validatePredicate(schema, rule, "tabs", registry, query)),
      ),
    },
    date,
  });
}
export function compileFilter<S extends QuerySchema>(
  schema: S,
  input: unknown,
  options: CompileOptions,
): FilterPlan {
  return compileNormalizedFilter(
    schema,
    normalizeQuery(schema, input, options),
    options,
  );
}
