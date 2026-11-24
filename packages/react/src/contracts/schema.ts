import * as v from "valibot";
import {
  isDatePoint,
  relativePresets,
  resolveDateOperand,
} from "../filters/dates.js";
import {
  defaultOperatorRegistry,
  fieldPresets,
  normalizeOperand,
  operatorAllowed,
} from "../filters/registry.js";
import { ContractError, fail } from "./errors.js";
import { cloneJson, freeze, isRecord, validId } from "./json.js";
import type {
  AnyCustomOperator,
  CheckedFields,
  DatePoint,
  FilterOwner,
  JsonValue,
  Limits,
  OperatorRegistry,
  PredicateRule,
  QuerySchema,
  QuerySchemaDefinition,
  WireRule,
} from "./types.js";

const integer = v.pipe(v.number(), v.integer(), v.safeInteger());
const fieldBase = {
  owner: v.picklist(["builder", "search", "tabs", "date", "none"]),
  operators: v.exactOptional(v.array(v.string())),
  sort: v.exactOptional(v.boolean()),
  nullable: v.exactOptional(v.boolean()),
};
const fieldSchema = v.variant("type", [
  v.strictObject({
    ...fieldBase,
    type: v.literal("text"),
    preset: v.exactOptional(v.picklist(["text", "email", "url", "phone"])),
    caseSensitive: v.exactOptional(v.boolean()),
    trim: v.exactOptional(v.boolean()),
  }),
  v.strictObject({
    ...fieldBase,
    type: v.literal("number"),
    preset: v.exactOptional(v.picklist(["number", "currency", "percentage"])),
  }),
  v.strictObject({
    ...fieldBase,
    type: v.picklist(["enum", "set"]),
    preset: v.exactOptional(
      v.picklist(["enum", "tags", "person", "people", "relation", "relations"]),
    ),
    values: v.exactOptional(v.array(v.union([v.string(), v.number()]))),
    idType: v.exactOptional(v.picklist(["string", "number"])),
  }),
  v.strictObject({
    ...fieldBase,
    type: v.literal("boolean"),
    preset: v.exactOptional(v.literal("boolean")),
  }),
  v.strictObject({
    ...fieldBase,
    type: v.picklist(["date", "datetime"]),
    preset: v.exactOptional(v.picklist(["date", "dateTime"])),
    relativePresets: v.exactOptional(v.array(v.picklist(relativePresets))),
    rollingDays: v.exactOptional(v.array(integer)),
    min: v.exactOptional(
      v.custom<DatePoint>((value) => isDatePoint(value, "datetime")),
    ),
    max: v.exactOptional(
      v.custom<DatePoint>((value) => isDatePoint(value, "datetime")),
    ),
  }),
]);
const predicateSchema = v.strictObject({
  field: v.string(),
  operator: v.string(),
  value: v.exactOptional(v.unknown()),
});
const definitionSchema = v.strictObject({
  id: v.string(),
  version: integer,
  fields: v.record(v.string(), fieldSchema),
  tabs: v.exactOptional(
    v.array(
      v.strictObject({
        id: v.string(),
        join: v.exactOptional(v.picklist(["and", "or"])),
        rules: v.array(predicateSchema),
      }),
    ),
  ),
  defaultTabId: v.exactOptional(v.nullable(v.string())),
  builder: v.exactOptional(
    v.strictObject({ join: v.exactOptional(v.picklist(["and", "or"])) }),
  ),
  search: v.exactOptional(
    v.strictObject({
      matcher: v.exactOptional(v.string()),
      caseSensitive: v.exactOptional(v.boolean()),
      trim: v.exactOptional(v.boolean()),
      debounceMs: v.exactOptional(integer),
    }),
  ),
  date: v.exactOptional(
    v.strictObject({ mode: v.exactOptional(v.picklist(["single", "range"])) }),
  ),
  sorting: v.exactOptional(
    v.strictObject({ multi: v.exactOptional(v.boolean()) }),
  ),
  pagination: v.exactOptional(
    v.strictObject({
      enabled: v.exactOptional(v.boolean()),
      defaultSize: v.exactOptional(integer),
      sizes: v.exactOptional(v.array(integer)),
    }),
  ),
  limits: v.exactOptional(
    v.strictObject({
      maxRules: v.exactOptional(integer),
      maxMembershipValues: v.exactOptional(integer),
      maxSearchCharacters: v.exactOptional(integer),
      maxPageRows: v.exactOptional(integer),
    }),
  ),
});
export const defaultLimits: Limits = Object.freeze({
  maxRules: 50,
  maxMembershipValues: 100,
  maxSearchCharacters: 512,
  maxPageRows: 100,
});

export function validatePredicate(
  schema: QuerySchema,
  input: PredicateRule,
  owner: FilterOwner,
  registry: OperatorRegistry,
  context: { locale: string; timeZone: string },
  id?: string,
): PredicateRule {
  const field = Object.hasOwn(schema.fields, input.field)
    ? schema.fields[input.field]
    : undefined;
  if (!field || field.owner !== owner)
    fail("rule.field", field ? input.field : undefined, id);
  const descriptor = registry.get(input.operator);
  if (!descriptor || !operatorAllowed(field, descriptor))
    fail("rule.operator", input.field, id);
  let value: JsonValue | undefined;
  try {
    value = normalizeOperand(
      field,
      descriptor,
      input.value,
      schema.limits,
      context.locale,
      context.timeZone,
    );
  } catch {
    return fail("rule.value", input.field, id);
  }
  return {
    field: input.field,
    operator: descriptor.id,
    ...(value === undefined ? {} : { value }),
  };
}

export function defineQuerySchema<
  const D extends QuerySchemaDefinition,
  const C extends readonly AnyCustomOperator[] = readonly [],
>(
  definition: D & { readonly fields: CheckedFields<D["fields"], C> },
  registry: OperatorRegistry<C> = defaultOperatorRegistry as unknown as OperatorRegistry<C>,
): QuerySchema<D, C> {
  try {
    const input: unknown = cloneJson(definition);
    const parsed = v.safeParse(definitionSchema, input);
    if (!parsed.success) fail("schema.invalid");
    const data = parsed.output;
    if (
      !validId(data.id) ||
      data.version < 1 ||
      Object.keys(data.fields).some((id) => !validId(id))
    )
      fail("schema.invalid");
    if (
      isRecord(input) &&
      isRecord(input.fields) &&
      Object.keys(input.fields).length !== Object.keys(data.fields).length
    )
      fail("schema.invalid");
    const limits = { ...defaultLimits, ...data.limits };
    if (
      limits.maxRules < 0 ||
      limits.maxMembershipValues < 1 ||
      limits.maxSearchCharacters < 0 ||
      limits.maxPageRows < 1
    )
      fail("schema.invalid");
    const pagination = {
      ...(data.pagination?.enabled === false
        ? { enabled: false as const }
        : {}),
      defaultSize: data.pagination?.defaultSize ?? 10,
      sizes: data.pagination?.sizes ?? [10, 25, 50, 100],
    };
    if (
      !pagination.sizes.length ||
      new Set(pagination.sizes).size !== pagination.sizes.length ||
      pagination.sizes.some((size) => size < 1 || size > limits.maxPageRows) ||
      !pagination.sizes.includes(pagination.defaultSize)
    )
      fail("schema.invalid");
    if (
      (data.search?.debounceMs ?? 300) < 0 ||
      (data.search?.matcher !== undefined && !validId(data.search.matcher))
    )
      fail("schema.invalid");
    let dates = 0;
    for (const [id, field] of Object.entries(data.fields)) {
      if (field.owner === "date") {
        dates++;
        if (dates > 1 || (field.type !== "date" && field.type !== "datetime"))
          fail("schema.owner", id);
      }
      if (field.preset && fieldPresets[field.preset].type !== field.type)
        fail("schema.invalid", id);
      if (field.type === "enum" || field.type === "set") {
        const kind =
          field.idType ??
          (field.values?.length ? typeof field.values[0] : "string");
        if (
          field.values?.some((value) => typeof value !== kind) ||
          (field.values && new Set(field.values).size !== field.values.length)
        )
          fail("schema.invalid", id);
      }
      if (field.type === "date" || field.type === "datetime") {
        if (field.min !== undefined && !isDatePoint(field.min, field.type))
          fail("schema.invalid", id);
        if (field.max !== undefined && !isDatePoint(field.max, field.type))
          fail("schema.invalid", id);
        if (
          field.rollingDays?.some((days) => days < 1) ||
          (field.relativePresets &&
            new Set(field.relativePresets).size !==
              field.relativePresets.length)
        )
          fail("schema.invalid", id);
        if (field.min && field.max)
          resolveDateOperand(field, [field.min, field.max], {
            locale: "en-US",
            timeZone: "UTC",
            now: 0,
          });
      }
      if (
        field.operators &&
        new Set(field.operators).size !== field.operators.length
      )
        fail("schema.operator", id);
      for (const operator of field.operators ?? []) {
        const descriptor = registry.get(operator);
        if (!descriptor || !operatorAllowed(field, descriptor))
          fail("schema.operator", id);
      }
    }
    const normalized = { ...data, limits, pagination } as QuerySchema;
    const tabIds = new Set<string>();
    for (const tab of data.tabs ?? []) {
      if (
        !validId(tab.id) ||
        tabIds.has(tab.id) ||
        tab.rules.length > limits.maxRules
      )
        fail("schema.invalid");
      tabIds.add(tab.id);
      for (const rule of tab.rules)
        validatePredicate(normalized, rule as PredicateRule, "tabs", registry, {
          locale: "en-US",
          timeZone: "UTC",
        });
    }
    if (
      data.defaultTabId !== undefined &&
      data.defaultTabId !== null &&
      !tabIds.has(data.defaultTabId)
    )
      fail("schema.invalid");
    return freeze(normalized) as QuerySchema<D, C>;
  } catch (error) {
    if (
      error instanceof ContractError &&
      error.issues.every((issue) => issue.code.startsWith("schema."))
    )
      throw error;
    return fail("schema.invalid");
  }
}

export function knownRuleId(rule: WireRule): string {
  if (!validId(rule.id)) fail("rule.id");
  return rule.id;
}
