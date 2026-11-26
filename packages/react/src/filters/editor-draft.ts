import { ContractError } from "../contracts/errors.js";
import { canonicalJson, isRecord, validId } from "../contracts/json.js";
import { normalizeQuery } from "../contracts/query.js";
import type {
  ContractIssue,
  IssueCode,
  QueryFor,
  QuerySchema,
  RuleFor,
} from "../contracts/types.js";
import { getBuilderFields, getFieldOperators } from "./editor-fields.js";
import type {
  BuilderFieldId,
  RuleDraftOptions,
  RuleDraftResult,
} from "./editor-types.js";
import { compileNormalizedFilter } from "./plan.js";
import { defaultOperatorRegistry } from "./registry.js";

const draftIssueCodes: ReadonlySet<string> = new Set<IssueCode>([
  "schema.invalid",
  "schema.version",
  "schema.owner",
  "schema.operator",
  "query.invalid",
  "query.context",
  "query.limit",
  "query.tab",
  "query.sort",
  "query.date",
  "rule.field",
  "rule.operator",
  "rule.value",
  "rule.id",
  "operator.invalid",
  "operator.client",
  "operator.translation",
  "operator.replacement",
]);

function safeIssues(error: unknown): readonly ContractIssue[] {
  try {
    if (error instanceof ContractError && error.issues.length) {
      return Object.freeze(
        error.issues.map((issue) => {
          const code: unknown = Object.getOwnPropertyDescriptor(
            issue,
            "code",
          )?.value;
          return Object.freeze({
            code:
              typeof code === "string" && draftIssueCodes.has(code)
                ? (code as IssueCode)
                : ("query.invalid" as const),
          });
        }),
      );
    }
  } catch {
    // Even a forged ContractError thrown by an input proxy is untrusted data.
  }
  return Object.freeze([Object.freeze({ code: "query.invalid" })]);
}

function result<S extends QuerySchema>(
  status: "invalid" | "incomplete",
  code: IssueCode,
): RuleDraftResult<S> {
  return Object.freeze({
    status,
    issues: Object.freeze([Object.freeze({ code })]),
  });
}

// Shape of unfinished local range input only. Operand semantics remain entirely
// with the existing normalizer/compiler (including custom and date operators).
function partialRange(value: unknown): boolean {
  if (!Array.isArray(value) || value.length > 2) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(descriptors).length !== value.length + 1) return false;
  const values: unknown[] = [];
  for (let index = 0; index < value.length; index++) {
    const descriptor = descriptors[String(index)];
    if (!descriptor?.enumerable || !("value" in descriptor)) return false;
    values.push(descriptor.value);
  }
  try {
    canonicalJson(values.map((item) => (item === undefined ? null : item)));
  } catch {
    return false;
  }
  return value.length < 2 || values.some((item) => item === undefined);
}

export function validateRuleDraft<S extends QuerySchema>(
  schema: S,
  accepted: QueryFor<S>,
  candidate: unknown,
  options: RuleDraftOptions,
): RuleDraftResult<S> {
  try {
    const query = normalizeQuery(schema, accepted, options);
    compileNormalizedFilter(schema, query, options);
    if (!isRecord(candidate)) return result("invalid", "query.invalid");
    const properties = Object.getOwnPropertyDescriptors(candidate);
    const keys = Reflect.ownKeys(properties);
    if (
      keys.some(
        (key) =>
          typeof key !== "string" ||
          !["id", "field", "operator", "value"].includes(key) ||
          !properties[key]?.enumerable ||
          !("value" in (properties[key] ?? {})),
      )
    )
      return result("invalid", "query.invalid");
    const draft: Record<string, unknown> = Object.fromEntries(
      keys.map((key) => [key, properties[key as string]?.value]),
    );
    if (draft.id === undefined || draft.id === "")
      return result("incomplete", "rule.id");
    if (!validId(draft.id)) return result("invalid", "rule.id");
    const replace = options.replaceRuleId;
    if (
      replace === undefined &&
      query.builder.rules.some((rule) => rule.id === draft.id)
    )
      return result("invalid", "rule.id");
    if (
      replace !== undefined &&
      (replace !== draft.id ||
        !query.builder.rules.some((rule) => rule.id === replace))
    )
      return result("invalid", "rule.id");
    if (draft.field === undefined || draft.field === "")
      return result("incomplete", "rule.field");
    const entry = getBuilderFields(schema).find(
      (item) => item.id === draft.field,
    );
    if (!entry) return result("invalid", "rule.field");
    if (draft.operator === undefined || draft.operator === "")
      return result("incomplete", "rule.operator");
    const registry = options.registry ?? defaultOperatorRegistry;
    const descriptor = getFieldOperators(
      schema,
      entry.id as BuilderFieldId<S>,
      registry,
    ).find((item) => item.id === draft.operator);
    if (!descriptor) return result("invalid", "rule.operator");
    if (descriptor.cardinality !== "none") {
      if (
        draft.value === undefined ||
        (descriptor.builtin && draft.value === "") ||
        (descriptor.builtin &&
          entry.field.type === "text" &&
          entry.field.trim &&
          typeof draft.value === "string" &&
          !draft.value.trim())
      )
        return result("incomplete", "rule.value");
      if (descriptor.cardinality === "range" && partialRange(draft.value))
        return result("incomplete", "rule.value");
      if (
        descriptor.cardinality === "many" &&
        Array.isArray(draft.value) &&
        draft.value.length === 0
      ) {
        canonicalJson(draft.value);
        return result("incomplete", "rule.value");
      }
    }
    const raw = {
      id: draft.id,
      field: draft.field,
      operator: draft.operator,
      ...(draft.value === undefined ? {} : { value: draft.value }),
    };
    const rules =
      replace === undefined
        ? [...query.builder.rules, raw]
        : query.builder.rules.map((rule) => (rule.id === replace ? raw : rule));
    const normalized = normalizeQuery(
      schema,
      {
        ...query,
        builder: { ...query.builder, rules },
      },
      options,
    );
    compileNormalizedFilter(schema, normalized, options);
    const rule = normalized.builder.rules.find((item) => item.id === draft.id);
    if (!rule) return result("invalid", "rule.id");
    return Object.freeze({
      status: "valid",
      rule: rule as RuleFor<S>,
      query: normalized,
    });
  } catch (error) {
    return Object.freeze({ status: "invalid", issues: safeIssues(error) });
  }
}
