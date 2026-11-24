import type { QuerySchema } from "@tableweave/react/contracts";
import type {
  CriteriaBuilderDateDraft,
  CriteriaDateBinding,
} from "../../packages/heroui/src/date/criteria-date-state.js";
import {
  beginCriteriaDateEdit,
  createCriteriaDateBundle,
  readCriteriaDateToolbar,
} from "../../packages/heroui/src/date/criteria-date-state.js";
import type {
  CriteriaActor,
  CriteriaCommitCell,
} from "../../packages/heroui/src/filters/criteria-commit.js";
import type { S } from "./fixtures.js";
import { rangeSeed } from "./fixtures.js";

export const intent: CriteriaBuilderDateDraft = {
  id: "r1",
  baseline: '{"id":"r1"}',
  value: rangeSeed,
};
export const explicit: CriteriaDateBinding = {
  kind: "builder",
  fieldId: "created",
  operator: "date.between",
  ruleId: "r1",
  draft: intent,
};
export const original: CriteriaDateBinding = {
  kind: "builder",
  fieldId: "created",
  operator: "date.on",
  ruleId: "r1",
};
export const newRule: CriteriaDateBinding = {
  kind: "builder",
  fieldId: "otherDate",
  operator: "date.on",
  ruleId: null,
  draft: { id: "allocated-new", baseline: null, value: null },
};
export function positive(
  cell: CriteriaCommitCell<"builder", S>,
  actor: CriteriaActor<"builder", S>,
) {
  const bundle = createCriteriaDateBundle(cell),
    handle = beginCriteriaDateEdit(bundle, actor, explicit),
    draft = readCriteriaDateToolbar(bundle, actor).draft;
  return { bundle, handle, draft };
}
export function oldGeneric<Schema extends QuerySchema>(
  cell: CriteriaCommitCell<"builder", Schema>,
  actor: CriteriaActor<"builder", Schema>,
  binding: CriteriaDateBinding,
) {
  return beginCriteriaDateEdit(createCriteriaDateBundle(cell), actor, binding);
}
