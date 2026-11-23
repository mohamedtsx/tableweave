import { fail } from "../contracts/errors.js";
import {
  canonicalJson,
  cloneJson,
  freeze,
  jsonValue,
  validId,
} from "../contracts/json.js";
import type {
  AnyCustomOperator,
  BuiltinOperator,
  Cardinality,
  FieldDefinition,
  FieldType,
  JsonValue,
  Limits,
  OperatorDescriptor,
  OperatorRegistry,
} from "../contracts/types.js";
import { isDateRange, isDateValue, resolveDateOperand } from "./dates.js";

const kinds: readonly FieldType[] = [
  "text",
  "number",
  "enum",
  "set",
  "boolean",
  "date",
  "datetime",
];
const descriptors: OperatorDescriptor[] = [];
function pair(
  a: BuiltinOperator,
  b: BuiltinOperator,
  types: readonly FieldType[],
  cardinality: Cardinality,
): void {
  descriptors.push(
    {
      id: a,
      inverse: b,
      labelKey: `operators.${a}`,
      types,
      cardinality,
      builtin: true,
    },
    {
      id: b,
      inverse: a,
      labelKey: `operators.${b}`,
      types,
      cardinality,
      builtin: true,
    },
  );
}
pair("empty", "notEmpty", kinds, "none");
for (const [a, b] of [
  ["text.contains", "text.notContains"],
  ["text.is", "text.isNot"],
  ["text.startsWith", "text.notStartsWith"],
  ["text.endsWith", "text.notEndsWith"],
] as const)
  pair(a, b, ["text"], "one");
pair("number.eq", "number.ne", ["number"], "one");
pair("number.gt", "number.lte", ["number"], "one");
pair("number.gte", "number.lt", ["number"], "one");
pair("number.between", "number.notBetween", ["number"], "range");
pair("enum.is", "enum.isNot", ["enum"], "one");
pair("enum.anyOf", "enum.noneOf", ["enum"], "many");
pair("set.anyOf", "set.noneOf", ["set"], "many");
pair("set.allOf", "set.notAllOf", ["set"], "many");
pair("boolean.isTrue", "boolean.isFalse", ["boolean"], "none");
pair("date.on", "date.notOn", ["date", "datetime"], "one");
pair("date.before", "date.onOrAfter", ["date", "datetime"], "one");
pair("date.after", "date.onOrBefore", ["date", "datetime"], "one");
pair("date.between", "date.notBetween", ["date", "datetime"], "range");
export const builtinOperators: readonly OperatorDescriptor[] =
  freeze(descriptors);

export function defineOperator<const D extends AnyCustomOperator>(
  definition: D,
): D {
  if (
    !validId(definition.id) ||
    !definition.labelKey ||
    !definition.types.length ||
    definition.types.some((type) => !kinds.includes(type)) ||
    !["none", "one", "many", "range"].includes(definition.cardinality) ||
    typeof definition.validate !== "function" ||
    (definition.normalize !== undefined &&
      typeof definition.normalize !== "function") ||
    (definition.evaluate !== undefined &&
      typeof definition.evaluate !== "function")
  )
    fail("operator.invalid");
  return Object.freeze({
    ...definition,
    types: Object.freeze([...definition.types]),
  }) as D;
}
export function createOperatorRegistry<
  const C extends readonly AnyCustomOperator[],
>(custom: C): OperatorRegistry<C> {
  const map = new Map<string, OperatorDescriptor>(
    builtinOperators.map((item) => [item.id, item]),
  );
  const retained: AnyCustomOperator[] = [];
  for (const input of custom) {
    const item = defineOperator(input);
    if (
      map.has(item.id) ||
      (item.inverse !== undefined && !validId(item.inverse))
    )
      fail("operator.invalid");
    retained.push(item);
    map.set(
      item.id,
      Object.freeze({
        id: item.id,
        labelKey: item.labelKey,
        types: item.types,
        cardinality: item.cardinality,
        builtin: false,
        custom: item,
        ...(item.inverse === undefined ? {} : { inverse: item.inverse }),
      }),
    );
  }
  for (const item of map.values()) {
    if (item.inverse !== undefined) {
      const inverse = map.get(item.inverse);
      if (
        !inverse ||
        inverse.inverse !== item.id ||
        !item.types.some((type) => inverse.types.includes(type))
      )
        fail("operator.invalid");
    }
  }
  return Object.freeze({
    custom: Object.freeze(retained) as unknown as C,
    descriptors: Object.freeze([...map.values()]),
    get: (id: string) => map.get(id),
  });
}
export const defaultOperatorRegistry = createOperatorRegistry([] as const);

export function operatorAllowed(
  field: FieldDefinition,
  operator: OperatorDescriptor,
): boolean {
  if (!operator.types.includes(field.type)) return false;
  if (
    (operator.id === "empty" || operator.id === "notEmpty") &&
    field.type === "boolean" &&
    !field.nullable
  )
    return false;
  return field.operators
    ? field.operators.includes(operator.id)
    : operator.builtin;
}
// Shared shape validation for operands and record IDs. Static option allowlists
// constrain selectable operands, not the validity of unloaded record IDs.
export function validScalarId(
  field: Extract<FieldDefinition, { type: "enum" | "set" }>,
  value: unknown,
): boolean {
  const type =
    field.idType ?? (field.values?.length ? typeof field.values[0] : "string");
  return (
    typeof value === type &&
    value !== "" &&
    (typeof value !== "number" || Number.isFinite(value))
  );
}
function scalarId(
  field: Extract<FieldDefinition, { type: "enum" | "set" }>,
  value: unknown,
): boolean {
  return (
    validScalarId(field, value) &&
    (!field.values || field.values.includes(value as string | number))
  );
}
export function normalizeOperand(
  field: FieldDefinition,
  descriptor: OperatorDescriptor,
  value: unknown,
  limits: Limits,
  locale: string,
  timeZone: string,
): JsonValue | undefined {
  if (!operatorAllowed(field, descriptor)) fail("rule.operator");
  if (descriptor.cardinality === "none") {
    if (value !== undefined) fail("rule.value");
    if (descriptor.custom && !descriptor.custom.validate(null))
      fail("rule.value");
    return undefined;
  }
  if (value === undefined || !jsonValue(value)) fail("rule.value");
  if (descriptor.custom) {
    const custom = descriptor.custom;
    const input = freeze(cloneJson(value));
    if (
      descriptor.cardinality === "many" &&
      (!Array.isArray(input) ||
        !input.length ||
        input.length > limits.maxMembershipValues)
    )
      fail("rule.value");
    if (
      descriptor.cardinality === "range" &&
      (!Array.isArray(input) || input.length !== 2)
    )
      fail("rule.value");
    try {
      if (!custom.validate(input)) fail("rule.value");
      const normalized = custom.normalize ? custom.normalize(input) : input;
      if (!jsonValue(normalized) || !custom.validate(normalized))
        fail("rule.value");
      if (
        custom.normalize &&
        canonicalJson(custom.normalize(freeze(cloneJson(normalized)))) !==
          canonicalJson(normalized)
      )
        fail("rule.value");
      if (
        descriptor.cardinality === "many" &&
        (!Array.isArray(normalized) ||
          !normalized.length ||
          normalized.length > limits.maxMembershipValues)
      )
        fail("rule.value");
      if (
        descriptor.cardinality === "range" &&
        (!Array.isArray(normalized) || normalized.length !== 2)
      )
        fail("rule.value");
      return cloneJson(normalized);
    } catch {
      return fail("rule.value");
    }
  }
  const id = descriptor.id;
  if (field.type === "text") {
    if (typeof value !== "string") fail("rule.value");
    const normalized = field.trim ? value.trim() : value;
    if (!normalized.length) fail("rule.value");
    return normalized;
  }
  if (field.type === "number") {
    if (descriptor.cardinality === "range") {
      if (
        !Array.isArray(value) ||
        value.length !== 2 ||
        value.some((v) => typeof v !== "number" || !Number.isFinite(v)) ||
        Number(value[0]) > Number(value[1])
      )
        fail("rule.value");
      return cloneJson(value);
    }
    if (typeof value !== "number" || !Number.isFinite(value))
      fail("rule.value");
    return value;
  }
  if (field.type === "enum" || field.type === "set") {
    if (descriptor.cardinality === "many") {
      if (
        !Array.isArray(value) ||
        !value.length ||
        value.length > limits.maxMembershipValues ||
        !value.every((v) => scalarId(field, v))
      )
        fail("rule.value");
      const unique = new Map(value.map((v) => [canonicalJson(v), v]));
      return [...unique]
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([, v]) => v);
    }
    if (!scalarId(field, value)) fail("rule.value");
    return value;
  }
  if (field.type === "date" || field.type === "datetime") {
    if (
      descriptor.cardinality === "range"
        ? !isDateRange(value, field)
        : !isDateValue(value, field)
    )
      fail("rule.value");
    if (
      Array.isArray(value) ||
      (typeof value === "object" &&
        value !== null &&
        "kind" in value &&
        (value.kind === "day" || value.kind === "instant"))
    ) {
      resolveDateOperand(
        field,
        value as unknown as Parameters<typeof resolveDateOperand>[1],
        { locale, timeZone, now: 0 },
      );
    }
    return cloneJson(value);
  }
  // Boolean operations are all value-less and have already returned above.
  return fail(id ? "rule.value" : "rule.operator");
}

export const fieldPresets = freeze({
  text: { type: "text", preset: "text" },
  email: { type: "text", preset: "email" },
  url: { type: "text", preset: "url" },
  phone: { type: "text", preset: "phone" },
  number: { type: "number", preset: "number" },
  currency: { type: "number", preset: "currency" },
  percentage: { type: "number", preset: "percentage" },
  enum: { type: "enum", preset: "enum" },
  tags: { type: "set", preset: "tags" },
  person: { type: "enum", preset: "person" },
  people: { type: "set", preset: "people" },
  relation: { type: "enum", preset: "relation" },
  relations: { type: "set", preset: "relations" },
  boolean: { type: "boolean", preset: "boolean" },
  date: { type: "date", preset: "date" },
  dateTime: { type: "datetime", preset: "dateTime" },
} as const);
