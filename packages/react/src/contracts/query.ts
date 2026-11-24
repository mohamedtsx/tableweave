import * as v from "valibot";
import { isDateRange, isDateValue } from "../filters/dates.js";
import { defaultOperatorRegistry } from "../filters/registry.js";
import { validContext } from "./context.js";
import { ContractError, fail } from "./errors.js";
import { cloneJson, freeze, isRecord } from "./json.js";
import { knownRuleId, validatePredicate } from "./schema.js";
import type {
  ContractResult,
  JsonValue,
  OperatorRegistry,
  PredicateRule,
  QueryFor,
  QueryInput,
  QuerySchema,
  StandaloneDate,
  WireQuery,
  WireRule,
} from "./types.js";

const integer = v.pipe(v.number(), v.integer(), v.safeInteger());
const ruleSchema = v.strictObject({
  id: v.string(),
  field: v.string(),
  operator: v.string(),
  value: v.optional(v.unknown()),
});
const wireSchema = v.strictObject({
  version: v.literal(1),
  schemaId: v.string(),
  schemaVersion: integer,
  builder: v.strictObject({
    join: v.picklist(["and", "or"]),
    rules: v.array(ruleSchema),
  }),
  search: v.string(),
  tabId: v.nullable(v.string()),
  date: v.nullable(
    v.strictObject({
      operator: v.picklist(["date.on", "date.between"]),
      value: v.unknown(),
    }),
  ),
  sorting: v.array(v.strictObject({ id: v.string(), desc: v.boolean() })),
  pagination: v.strictObject({ pageIndex: integer, pageSize: integer }),
  locale: v.string(),
  timeZone: v.string(),
});
export interface ParseOptions {
  readonly registry?: OperatorRegistry;
}
export function parseQuery<S extends QuerySchema>(
  schema: S,
  input: unknown,
  options: ParseOptions = {},
): ContractResult<QueryFor<S>> {
  try {
    const value: unknown = cloneJson(input);
    const parsed = v.safeParse(wireSchema, value);
    if (!parsed.success) fail("query.invalid");
    const query = parsed.output;
    const registry = options.registry ?? defaultOperatorRegistry;
    if (query.schemaId !== schema.id || query.schemaVersion !== schema.version)
      fail("schema.version");
    if (!validContext(query.locale, query.timeZone)) fail("query.context");
    if (
      query.builder.rules.length > schema.limits.maxRules ||
      [...query.search].length > schema.limits.maxSearchCharacters ||
      query.pagination.pageIndex < 0 ||
      !schema.pagination.sizes.includes(query.pagination.pageSize) ||
      query.pagination.pageSize > schema.limits.maxPageRows
    )
      fail("query.limit");
    if (
      schema.pagination.enabled === false &&
      (query.pagination.pageIndex !== 0 ||
        query.pagination.pageSize !== schema.pagination.defaultSize)
    )
      fail("query.invalid");
    if (
      query.search &&
      !Object.values(schema.fields).some((field) => field.owner === "search")
    )
      fail("query.invalid");
    if (
      query.tabId !== null &&
      !schema.tabs?.some((tab) => tab.id === query.tabId)
    )
      fail("query.tab");
    const ruleIds = new Set<string>();
    const rules = query.builder.rules.map((rule): WireRule => {
      const id = knownRuleId(rule as WireRule);
      if (ruleIds.has(id)) fail("rule.id");
      ruleIds.add(id);
      return {
        id,
        ...validatePredicate(
          schema,
          rule as PredicateRule,
          "builder",
          registry,
          query,
        ),
      };
    });
    const sortIds = new Set<string>();
    if (!schema.sorting?.multi && query.sorting.length > 1) fail("query.sort");
    for (const sort of query.sorting) {
      if (
        !Object.hasOwn(schema.fields, sort.id) ||
        !schema.fields[sort.id]?.sort ||
        sortIds.has(sort.id)
      )
        fail("query.sort");
      sortIds.add(sort.id);
    }
    let date: StandaloneDate | null = null;
    if (query.date !== null) {
      const found = Object.entries(schema.fields).find(
        ([, field]) => field.owner === "date",
      );
      if (!found || (found[1].type !== "date" && found[1].type !== "datetime"))
        fail("query.date");
      const [fieldId, field] = found;
      const operand = query.date.value;
      if (query.date.operator === "date.between") {
        if (
          (schema.date?.mode ?? "range") === "single" ||
          !isDateRange(operand, field)
        )
          fail("query.date");
      } else {
        if (!isDateValue(operand, field)) fail("query.date");
        if (
          (schema.date?.mode ?? "range") === "range" &&
          operand.kind !== "relative" &&
          operand.kind !== "rolling"
        )
          fail("query.date");
      }
      const validated = validatePredicate(
        schema,
        {
          field: fieldId,
          operator: query.date.operator,
          value: operand as JsonValue,
        },
        "date",
        registry,
        query,
      );
      date = {
        operator: query.date.operator,
        value: validated.value,
      } as StandaloneDate;
    }
    const search = schema.search?.trim ? query.search.trim() : query.search;
    const normalized: WireQuery = {
      ...query,
      search,
      builder: { join: query.builder.join, rules },
      date,
    };
    // The checks above establish the schema-dependent field/operator/value union.
    return {
      success: true,
      data: freeze(normalized) as unknown as QueryFor<S>,
    };
  } catch (error) {
    return {
      success: false,
      issues:
        error instanceof ContractError
          ? error.issues
          : [{ code: "query.invalid" }],
    };
  }
}
export function normalizeQuery<S extends QuerySchema>(
  schema: S,
  input: unknown,
  options: ParseOptions = {},
): QueryFor<S> {
  const parsed = parseQuery(schema, input, options);
  if (!parsed.success) throw new ContractError(parsed.issues);
  return parsed.data;
}
export function createQuery<S extends QuerySchema>(
  schema: S,
  input: QueryInput<S>,
  options: ParseOptions = {},
): QueryFor<S> {
  const supplied = cloneJson(input);
  const allowed = new Set([
    "builder",
    "search",
    "tabId",
    "date",
    "sorting",
    "pagination",
    "locale",
    "timeZone",
  ]);
  if (
    !isRecord(supplied) ||
    Object.keys(supplied).some((key) => !allowed.has(key))
  )
    fail("query.invalid");
  return normalizeQuery(
    schema,
    {
      builder: { join: schema.builder?.join ?? "and", rules: [] },
      search: "",
      tabId: schema.defaultTabId ?? null,
      date: null,
      sorting: [],
      pagination: { pageIndex: 0, pageSize: schema.pagination.defaultSize },
      ...supplied,
      version: 1,
      schemaId: schema.id,
      schemaVersion: schema.version,
    },
    options,
  );
}
