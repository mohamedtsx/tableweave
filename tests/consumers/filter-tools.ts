import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import {
  type BuilderFieldId,
  createOptionSource,
  getBuilderFields,
  getFieldOperators,
  projectOptionSourceView,
  validateRuleDraft,
} from "@tableweave/react/filters";

const schema = defineQuerySchema({
  id: "packed-filter-tools",
  version: 1,
  fields: {
    amount: { type: "number", owner: "builder", operators: ["number.eq"] },
    owner: { type: "enum", owner: "builder" },
    title: { type: "text", owner: "search" },
    created: { type: "datetime", owner: "date" },
  },
});
const fields = getBuilderFields(schema);
export const owner: BuilderFieldId<typeof schema> = "owner";
// @ts-expect-error Neutral search owners never become builder properties.
export const independent: BuilderFieldId<typeof schema> = "title";
export const fieldIds: readonly ("amount" | "owner")[] = fields.map(
  (field) => field.id,
);
const operators = getFieldOperators(schema, "amount");
export const operator: "number.eq" | undefined = operators[0]?.id;
// @ts-expect-error Builder operator helpers reject independently owned fields.
getFieldOperators(schema, "created");
const query = createQuery(schema, { locale: "en-US", timeZone: "UTC" });
const draft = validateRuleDraft(
  schema,
  query,
  {
    id: "amount-zero",
    field: "amount",
    operator: "number.eq",
    value: 0,
  },
  { now: 0 },
);
if (draft.status === "valid") {
  const field: "amount" | "owner" = draft.rule.field;
  // @ts-expect-error Valid builder rules cannot claim a date-tool owner.
  const invalid: "created" = draft.rule.field;
  void field;
  void invalid;
}
const context = {
  definitionKey: "synthetic-definition",
  scopeKey: "synthetic-scope",
  fieldId: "owner",
  access: true,
};
const source = createOptionSource<number>(context);
source.setSelectedIds(context, [0, 2]);
const request = source.begin({ ...context, term: "", pageKey: "first" });
if (request) {
  source.succeed(request, {
    options: [{ id: 0, label: "Zero" }],
    hasMore: false,
  });
  source.succeed(request, {
    // @ts-expect-error Numeric choice sources preserve IDs, not string coercion.
    options: [{ id: "0", label: "String zero" }],
    hasMore: false,
  });
}
export const view = projectOptionSourceView(source.getSnapshot(), context, [0]);
export const selectedId: number | undefined = view.selected[0]?.id;
// @ts-expect-error Selected IDs are numeric throughout the snapshot contract.
export const selectedString: string | undefined = view.selected[0]?.id;

// @ts-expect-error Internal helper files remain encapsulated by the public filters entry.
import "@tableweave/react/filters/options-source";
