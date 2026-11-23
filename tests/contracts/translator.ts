// Synthetic application-owned translator: bound SQL-shaped expressions and an
// independent primitive interpreter. No production database/auth claim.
import type { FieldDefinition } from "../../packages/react/src/contracts/index.js";
import type {
  CompiledRule,
  QueryTranslator,
} from "../../packages/react/src/filters/index.js";

type Row = Readonly<Record<string, unknown>>;
export interface BoundExpression {
  readonly sql: string;
  readonly parameters: readonly unknown[];
  matches(row: Row): boolean;
}
const columns: Readonly<Record<string, string>> = {
  value: "synthetic_value",
  amount: "synthetic_amount",
  title: "synthetic_title",
  alias: "synthetic_alias",
  state: "synthetic_state",
  date: "synthetic_date",
};
const operators = [
  "empty",
  "notEmpty",
  "text.contains",
  "text.notContains",
  "text.is",
  "text.isNot",
  "text.startsWith",
  "text.notStartsWith",
  "text.endsWith",
  "text.notEndsWith",
  "number.eq",
  "number.ne",
  "number.gt",
  "number.gte",
  "number.lt",
  "number.lte",
  "number.between",
  "number.notBetween",
  "enum.is",
  "enum.isNot",
  "enum.anyOf",
  "enum.noneOf",
  "set.anyOf",
  "set.noneOf",
  "set.allOf",
  "set.notAllOf",
  "boolean.isTrue",
  "boolean.isFalse",
  "date.on",
  "date.notOn",
  "date.before",
  "date.onOrBefore",
  "date.after",
  "date.onOrAfter",
  "date.between",
  "date.notBetween",
];
function column(id: string): string {
  if (!Object.hasOwn(columns, id)) throw new Error("Unmapped synthetic column");
  return columns[id] as string;
}
function missing(value: unknown, field: FieldDefinition): boolean {
  return (
    value == null ||
    (["text", "enum", "date", "datetime"].includes(field.type) &&
      value === "") ||
    (field.type === "set" && Array.isArray(value) && !value.length)
  );
}
function valid(value: unknown, field: FieldDefinition): boolean {
  if (missing(value, field)) return false;
  const idType =
    field.type === "enum" || field.type === "set"
      ? (field.idType ??
        (field.values?.length ? typeof field.values[0] : "string"))
      : "string";
  if (field.type === "number")
    return typeof value === "number" && Number.isFinite(value);
  if (field.type === "boolean") return typeof value === "boolean";
  const validId = (id: unknown): boolean =>
    typeof id === idType &&
    id !== "" &&
    (typeof id !== "number" || Number.isFinite(id));
  if (field.type === "enum") return validId(value);
  if (field.type === "set") {
    if (!Array.isArray(value)) return false;
    return Array.from(
      { length: value.length },
      (_, index) => Object.hasOwn(value, index) && validId(value[index]),
    ).every(Boolean);
  }
  if (field.type === "datetime")
    return (
      typeof value === "string" &&
      /T.*(?:Z|[+-]\d\d:\d\d)$/.test(value) &&
      Number.isFinite(Date.parse(value))
    );
  if (field.type === "date")
    return (
      typeof value === "string" &&
      /^\d{4}-\d\d-\d\d$/.test(value) &&
      new Date(value).toISOString().slice(0, 10) === value
    );
  return typeof value === "string";
}
function test(
  rule: CompiledRule,
  field: FieldDefinition,
  raw: unknown,
  locale: string,
): boolean {
  const v =
    field.type === "text" && field.trim && typeof raw === "string"
      ? raw.trim()
      : raw;
  if (rule.operator === "empty") return missing(v, field);
  if (rule.operator === "notEmpty") return valid(v, field);
  if (!valid(v, field)) return false;
  const p = rule.value;
  if (rule.operator.startsWith("text.")) {
    const left = String(v);
    const right = String(p);
    const a =
      field.type === "text" && field.caseSensitive
        ? left
        : left.toLocaleLowerCase(locale);
    const b =
      field.type === "text" && field.caseSensitive
        ? right
        : right.toLocaleLowerCase(locale);
    const positive = rule.operator
      .replace("notContains", "contains")
      .replace("isNot", "is")
      .replace("notStartsWith", "startsWith")
      .replace("notEndsWith", "endsWith");
    const matched =
      positive === "text.is"
        ? a === b
        : positive === "text.startsWith"
          ? a.slice(0, b.length) === b
          : positive === "text.endsWith"
            ? a.slice(-b.length) === b
            : a.indexOf(b) !== -1;
    return positive === rule.operator ? matched : !matched;
  }
  if (rule.operator.startsWith("number.")) {
    const n = Number(v);
    switch (rule.operator) {
      case "number.eq":
        return n === p;
      case "number.ne":
        return n !== p;
      case "number.gt":
        return n > Number(p);
      case "number.gte":
        return n >= Number(p);
      case "number.lt":
        return n < Number(p);
      case "number.lte":
        return n <= Number(p);
      default: {
        const pair = p as readonly number[];
        const match = n >= (pair[0] as number) && n <= (pair[1] as number);
        return rule.operator === "number.between" ? match : !match;
      }
    }
  }
  if (rule.operator === "enum.is" || rule.operator === "enum.isNot")
    return (v === p) === (rule.operator === "enum.is");
  if (rule.operator === "enum.anyOf" || rule.operator === "enum.noneOf")
    return (
      (p as readonly unknown[]).some((id) => id === v) ===
      (rule.operator === "enum.anyOf")
    );
  if (rule.operator.startsWith("set.")) {
    const ids = new Set(v as readonly unknown[]);
    const requested = p as readonly unknown[];
    const count = requested.filter((id) => ids.has(id)).length;
    switch (rule.operator) {
      case "set.anyOf":
        return count > 0;
      case "set.noneOf":
        return count === 0;
      case "set.allOf":
        return count === requested.length;
      default:
        return count < requested.length;
    }
  }
  if (rule.operator.startsWith("boolean."))
    return v === (rule.operator === "boolean.isTrue");
  const interval = rule.interval;
  if (!interval) throw new Error("Missing resolved boundaries");
  const point = interval.kind === "days" ? String(v) : Date.parse(String(v));
  const lower = point >= interval.start;
  const upper = point < interval.endExclusive;
  switch (rule.operator) {
    case "date.on":
    case "date.between":
      return lower && upper;
    case "date.notOn":
    case "date.notBetween":
      return !lower || !upper;
    case "date.before":
      return !lower;
    case "date.onOrAfter":
      return lower;
    case "date.after":
      return !upper;
    case "date.onOrBefore":
      return upper;
    default:
      throw new Error("Unmapped synthetic operator");
  }
}
export const translator: QueryTranslator<BoundExpression> = {
  operators: Object.fromEntries(
    operators.map((op) => [
      op,
      (rule, field, plan) => ({
        // The SQL-shaped text illustrates binding only, not portable executable SQL.
        sql: `${op.replaceAll(".", "_")}(${column(rule.field)}, ?)`,
        parameters: [rule.interval ?? rule.value ?? null],
        matches: (row: Row) => test(rule, field, row[rule.field], plan.locale),
      }),
    ]),
  ),
  all(items) {
    return {
      sql: `(${items.map((x) => x.sql).join(" AND ") || "TRUE"})`,
      parameters: items.flatMap((x) => x.parameters),
      matches: (row) => items.every((x) => x.matches(row)),
    };
  },
  any(items) {
    return {
      sql: `(${items.map((x) => x.sql).join(" OR ") || "FALSE"})`,
      parameters: items.flatMap((x) => x.parameters),
      matches: (row) => items.some((x) => x.matches(row)),
    };
  },
  search(id, text, policy, plan) {
    return {
      sql: `contains(${column(id)}, ?)`,
      parameters: [text],
      matches(row) {
        if (typeof row[id] !== "string") return false;
        const value = policy.trim ? row[id].trim() : row[id];
        return policy.caseSensitive
          ? value.indexOf(text) >= 0
          : value
              .toLocaleLowerCase(plan.locale)
              .indexOf(text.toLocaleLowerCase(plan.locale)) >= 0;
      },
    };
  },
};
