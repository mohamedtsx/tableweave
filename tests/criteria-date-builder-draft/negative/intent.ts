// AUTHORED ONLY. Excluded from the current positive program; execute only in the
// authorized final negative/removal phase, never as evidence from this lane.
import type {
  CriteriaBuilderDateDraft,
  CriteriaDateBinding,
} from "../../../packages/heroui/src/date/criteria-date-state.js";

const intent: CriteriaBuilderDateDraft = {
  id: "new",
  baseline: null,
  value: null,
};
// @ts-expect-error Captured caller intent is readonly.
intent.baseline = "rebased";
// @ts-expect-error Target metadata still requires a string field id.
const wrongField: CriteriaDateBinding = {
  kind: "builder",
  fieldId: 42,
  operator: "date.on",
  ruleId: null,
};
// @ts-expect-error A scalar string is not a Date wire seed.
const wrongSeed: CriteriaBuilderDateDraft = {
  id: "new",
  baseline: null,
  value: "2030-01-10",
};
// @ts-expect-error New explicit intent must supply its allocated id for absence proof.
const noId: CriteriaBuilderDateDraft = { baseline: null, value: null };
// @ts-expect-error Supplied undefined is not draft omission (exact optional properties).
const undefinedDraft: CriteriaDateBinding = {
  kind: "builder",
  fieldId: "created",
  operator: "date.on",
  ruleId: null,
  draft: undefined,
};
void [intent, wrongField, wrongSeed, noId, undefinedDraft];
