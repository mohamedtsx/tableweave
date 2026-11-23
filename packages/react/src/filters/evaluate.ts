import { fail } from "../contracts/errors.js";
import { isRecord } from "../contracts/json.js";
import type {
  FieldDefinition,
  OperatorContext,
  QuerySchema,
} from "../contracts/types.js";
import type { FieldAccessors } from "../definition/schema-types.js";
import { dateRecordValue } from "./dates.js";
import type { CompiledRule, CompileOptions } from "./plan.js";
import { compileFilter } from "./plan.js";
import { defaultOperatorRegistry, validScalarId } from "./registry.js";

export type SearchMatcher = (
  value: unknown,
  search: string,
  field: FieldDefinition,
  context: OperatorContext,
) => boolean;
export interface EvaluationOptions<S extends QuerySchema, Row>
  extends CompileOptions {
  readonly accessors?: FieldAccessors<S, Row>;
  readonly searchMatchers?: Readonly<Record<string, SearchMatcher>>;
}
function empty(field: FieldDefinition, value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (value === "" &&
      ["text", "enum", "date", "datetime"].includes(field.type)) ||
    (field.type === "set" && Array.isArray(value) && value.length === 0)
  );
}
function validCollection(
  field: Extract<FieldDefinition, { type: "enum" | "set" }>,
  value: unknown,
): boolean {
  if (!Array.isArray(value)) return false;
  for (let index = 0; index < value.length; index++) {
    if (!Object.hasOwn(value, index) || !validScalarId(field, value[index]))
      return false;
  }
  return true;
}
function present(
  field: FieldDefinition,
  value: unknown,
  timeZone: string,
): boolean {
  if (empty(field, value)) return false;
  switch (field.type) {
    case "text":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "enum":
      return validScalarId(field, value);
    case "set":
      return validCollection(field, value);
    case "date":
    case "datetime":
      return dateRecordValue(field, value, timeZone) !== undefined;
  }
}
function builtin(
  rule: CompiledRule,
  field: FieldDefinition,
  raw: unknown,
  context: OperatorContext,
): boolean {
  const value =
    field.type === "text" && field.trim && typeof raw === "string"
      ? raw.trim()
      : raw;
  if (rule.operator === "empty") return empty(field, value);
  if (rule.operator === "notEmpty")
    return present(field, value, context.timeZone);
  if (!present(field, value, context.timeZone)) return false;
  const operand = rule.value;
  if (
    field.type === "text" &&
    typeof value === "string" &&
    typeof operand === "string"
  ) {
    const a = field.caseSensitive
      ? value
      : value.toLocaleLowerCase(context.locale);
    const b = field.caseSensitive
      ? operand
      : operand.toLocaleLowerCase(context.locale);
    switch (rule.operator) {
      case "text.contains":
        return a.includes(b);
      case "text.notContains":
        return !a.includes(b);
      case "text.is":
        return a === b;
      case "text.isNot":
        return a !== b;
      case "text.startsWith":
        return a.startsWith(b);
      case "text.notStartsWith":
        return !a.startsWith(b);
      case "text.endsWith":
        return a.endsWith(b);
      case "text.notEndsWith":
        return !a.endsWith(b);
    }
  }
  if (field.type === "number" && typeof value === "number") {
    if (Array.isArray(operand)) {
      const match = value >= Number(operand[0]) && value <= Number(operand[1]);
      return rule.operator === "number.between" ? match : !match;
    }
    if (typeof operand !== "number") return false;
    switch (rule.operator) {
      case "number.eq":
        return value === operand;
      case "number.ne":
        return value !== operand;
      case "number.gt":
        return value > operand;
      case "number.gte":
        return value >= operand;
      case "number.lt":
        return value < operand;
      case "number.lte":
        return value <= operand;
    }
  }
  if (field.type === "enum") {
    if (rule.operator === "enum.is") return value === operand;
    if (rule.operator === "enum.isNot") return value !== operand;
    const match = Array.isArray(operand) && operand.includes(value);
    return rule.operator === "enum.anyOf" ? match : !match;
  }
  if (field.type === "set" && Array.isArray(value) && Array.isArray(operand)) {
    const any = operand.some((item) => value.includes(item));
    const all = operand.every((item) => value.includes(item));
    switch (rule.operator) {
      case "set.anyOf":
        return any;
      case "set.noneOf":
        return !any;
      case "set.allOf":
        return all;
      case "set.notAllOf":
        return !all;
    }
  }
  if (field.type === "boolean")
    return rule.operator === "boolean.isTrue"
      ? value === true
      : value === false;
  if ((field.type === "date" || field.type === "datetime") && rule.interval) {
    const point = dateRecordValue(field, value, context.timeZone);
    if (point === undefined) return false;
    const { start, endExclusive } = rule.interval;
    const inside = point >= start && point < endExclusive;
    switch (rule.operator) {
      case "date.on":
      case "date.between":
        return inside;
      case "date.notOn":
      case "date.notBetween":
        return !inside;
      case "date.before":
        return point < start;
      case "date.onOrBefore":
        return point < endExclusive;
      case "date.after":
        return point >= endExclusive;
      case "date.onOrAfter":
        return point >= start;
    }
  }
  return false;
}

export function createFilterEvaluator<
  S extends QuerySchema,
  Row = Readonly<Record<string, unknown>>,
>(
  schema: S,
  input: unknown,
  options: EvaluationOptions<S, Row>,
): (record: Row) => boolean {
  const plan = compileFilter(schema, input, options);
  const registry = options.registry ?? defaultOperatorRegistry;
  const getValue = (record: Row, id: string): unknown => {
    const accessor =
      options.accessors && Object.hasOwn(options.accessors, id)
        ? options.accessors[id]
        : undefined;
    try {
      return accessor
        ? accessor(record)
        : isRecord(record) && Object.hasOwn(record, id)
          ? record[id]
          : undefined;
    } catch {
      return fail("operator.client", id);
    }
  };
  const makeRule = (rule: CompiledRule): ((record: Row) => boolean) => {
    const field = schema.fields[rule.field];
    const descriptor = registry.get(rule.operator);
    if (!field || !descriptor) fail("rule.operator");
    const context: OperatorContext = {
      field,
      locale: plan.locale,
      timeZone: plan.timeZone,
      now: options.now,
    };
    if (!descriptor.builtin && !descriptor.custom?.evaluate)
      fail("operator.client", rule.field);
    return (record) => {
      const raw = getValue(record, rule.field);
      if (descriptor.builtin) return builtin(rule, field, raw, context);
      if (descriptor.cardinality !== "none" && empty(field, raw)) return false;
      try {
        const result = descriptor.custom?.evaluate?.(
          raw,
          rule.value ?? null,
          context,
        );
        if (typeof result !== "boolean") fail("operator.client", rule.field);
        return result;
      } catch {
        return fail("operator.client", rule.field);
      }
    };
  };
  const builder = plan.builder.rules.map(makeRule);
  const tabs = plan.tab.rules.map(makeRule);
  const date = plan.date ? makeRule(plan.date) : null;
  const matcher =
    plan.search.matcher === "contains" ||
    !options.searchMatchers ||
    !Object.hasOwn(options.searchMatchers, plan.search.matcher)
      ? undefined
      : options.searchMatchers[plan.search.matcher];
  if (plan.search.text && plan.search.matcher !== "contains" && !matcher)
    fail("operator.client");
  const group = (
    rules: readonly ((record: Row) => boolean)[],
    join: "and" | "or",
    record: Row,
  ): boolean =>
    !rules.length ||
    (join === "and"
      ? rules.every((test) => test(record))
      : rules.some((test) => test(record)));
  return (record) => {
    if (
      !group(builder, plan.builder.join, record) ||
      !group(tabs, plan.tab.join, record) ||
      (date && !date(record))
    )
      return false;
    if (!plan.search.text) return true;
    return plan.search.fields.some((id) => {
      const field = schema.fields[id];
      if (!field) return false;
      const raw = getValue(record, id);
      if (matcher) {
        try {
          const result = matcher(raw, plan.search.text, field, {
            field,
            locale: plan.locale,
            timeZone: plan.timeZone,
            now: options.now,
          });
          if (typeof result !== "boolean") fail("operator.client", id);
          return result;
        } catch {
          return fail("operator.client", id);
        }
      }
      if (typeof raw !== "string") return false;
      const value = plan.search.trim ? raw.trim() : raw;
      const text = plan.search.text;
      return plan.search.caseSensitive
        ? value.includes(text)
        : value
            .toLocaleLowerCase(plan.locale)
            .includes(text.toLocaleLowerCase(plan.locale));
    });
  };
}
