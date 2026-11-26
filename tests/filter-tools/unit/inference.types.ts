import type {
  FieldDefinition,
  QuerySchemaDefinition,
  RuleFor,
} from "../../../packages/react/src/contracts/index.js";
import {
  createQuery,
  defineQuerySchema,
} from "../../../packages/react/src/contracts/index.js";
import { validateRuleDraft } from "../../../packages/react/src/filters/editor-draft.js";
import {
  getBuilderFields,
  getFieldOperators,
} from "../../../packages/react/src/filters/editor-fields.js";
import type {
  BuilderFieldId,
  FieldOperator,
  OptionPageResult,
  OptionRequest,
  RuleDraftResult,
} from "../../../packages/react/src/filters/editor-types.js";
import { createOptionSource } from "../../../packages/react/src/filters/options-source.js";
import { context, query, registry, schema, validation } from "./fixtures.js";

function inference() {
  const fields = getBuilderFields(schema);
  const allowedField: BuilderFieldId<typeof schema> = "hidden";
  // @ts-expect-error configured search ownership never becomes builder ownership
  const wrongField: BuilderFieldId<typeof schema> = "search";
  const possibleIds: readonly BuilderFieldId<typeof schema>[] = fields.map(
    ({ id }) => id,
  );
  void [allowedField, wrongField, possibleIds];
  const restricted = getFieldOperators(schema, "restricted");
  const restrictedIds: readonly ("number.eq" | "number.gt")[] = restricted.map(
    ({ id }) => id,
  );
  // @ts-expect-error runtime allowlist remains literal, not all number operators
  const wrongRestricted: FieldOperator<typeof schema, "restricted">["id"] =
    "number.ne";
  // @ts-expect-error a text predicate cannot enter a numeric field's operator list
  const wrongFamily: FieldOperator<typeof schema, "amount">["id"] =
    "text.contains";
  // @ts-expect-error nonnullable boolean fields expose no empty predicate
  const wrongBoolean: FieldOperator<typeof schema, "enabled">["id"] = "empty";
  const custom = getFieldOperators(schema, "customBool", registry);
  const customIds: readonly "custom.false"[] = custom.map(({ id }) => id);
  void [restrictedIds, wrongRestricted, wrongFamily, wrongBoolean, customIds];
  // @ts-expect-error other configured tool fields are absent, even if currently neutral
  getFieldOperators(schema, "dateTool");
  // @ts-expect-error unknown field IDs are not accepted for literal schemas
  getFieldOperators(schema, "unknown");

  const validated = validateRuleDraft(
    schema,
    query(),
    { id: "r", field: "status", operator: "enum.is", value: 0 },
    validation,
  );
  if (validated.status === "valid") {
    const rule: RuleFor<typeof schema> = validated.rule;
    if (rule.field === "status" && rule.operator === "enum.is") {
      const id: 0 | 1 = rule.value;
      // @ts-expect-error numeric enum IDs stay numeric in the returned typed rule
      const wrong: string = rule.value;
      void [id, wrong];
    }
    if (rule.field === "customBool") {
      const customValue: false = rule.value;
      void customValue;
    }
    if (rule.field === "customText") {
      const customValue: "" = rule.value;
      void customValue;
    }
  } else {
    // @ts-expect-error incomplete/invalid local input has no query to accidentally apply
    void validated.query;
  }
  const rejected: RuleDraftResult<typeof schema> = {
    status: "invalid",
    issues: [{ code: "rule.value" }],
  };
  void rejected;
  // @ts-expect-error returned applied-rule type rejects wrong enum operands
  const wrongRule: RuleFor<typeof schema> = {
    id: "r",
    field: "status",
    operator: "enum.is",
    value: "0",
  };
  void wrongRule;

  const numeric = createOptionSource<number>(context);
  numeric.setSelectedIds(context, [0, 1]);
  // @ts-expect-error source option IDs preserve their declared numeric type
  numeric.setSelectedIds(context, ["0"]);
  const good: OptionPageResult<number> = {
    options: [{ id: 0, label: "Zero" }],
    hasMore: false,
  };
  // @ts-expect-error actual paging capability is required, never inferred from a short page
  const badPage: OptionPageResult<number> = { options: [] };
  const token = numeric.begin({ ...context, term: "", pageKey: "first" });
  if (token) {
    numeric.succeed(token, good);
    numeric.succeed(token, {
      // @ts-expect-error a textual ID cannot settle the declared numeric source
      options: [{ id: "0", label: "String zero" }],
      hasMore: false,
    });
    // @ts-expect-error request provenance cannot be rewritten
    token.generation = 4;
    const publicRequest: OptionRequest = token;
    void publicRequest;
  }
  void badPage;
}
void inference;

// Widening runtime definitions must not collapse field/operator IDs to never.
const dynamicFields: Record<string, FieldDefinition> = {
  value: { type: "number", owner: "builder" },
};
const definition: QuerySchemaDefinition = {
  id: "dynamic-editor",
  version: 1,
  fields: dynamicFields,
};
const dynamic = defineQuerySchema(definition);
export const dynamicOperators = getFieldOperators(dynamic, "value");
const dynamicOperator: (typeof dynamicOperators)[number]["id"] = "number.eq";
const dynamicField: BuilderFieldId<typeof dynamic> = "value";
const dynamicQuery = createQuery(dynamic, { locale: "en-US", timeZone: "UTC" });
const dynamicResult = validateRuleDraft(
  dynamic,
  dynamicQuery,
  { id: "r", field: "value", operator: dynamicOperator, value: 0 },
  { now: 0 },
);
void [dynamicOperator, dynamicField, dynamicResult];

// Optional owner/allowlist information retains the known field vocabulary.
const optional: QuerySchemaDefinition<{
  maybe: {
    type: "number";
    owner: "builder" | "search";
    operators?: readonly ("number.eq" | "number.gt")[];
  };
  excluded: { type: "text"; owner: "search" };
}> = {
  id: "optional-editor",
  version: 1,
  fields: {
    maybe: { type: "number", owner: "builder" },
    excluded: { type: "text", owner: "search" },
  },
};
const optionalSchema = defineQuerySchema(optional);
const optionalField: BuilderFieldId<typeof optionalSchema> = "maybe";
// @ts-expect-error optional owner information does not admit a definitely excluded field
const excludedField: BuilderFieldId<typeof optionalSchema> = "excluded";
void [optionalField, excludedField];
