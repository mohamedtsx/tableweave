import type {
  CriteriaDateBundle,
  CriteriaDateStateHandle,
} from "../../packages/heroui/src/date/criteria-date-state.js";
import {
  beginCriteriaDateEdit,
  closeCriteriaDateEdit,
  createCriteriaDateBundle,
  readCriteriaDateState,
  reconcileCriteriaDateBundle,
} from "../../packages/heroui/src/date/criteria-date-state.js";
import type { DateOperandEditorProps } from "../../packages/heroui/src/date/date-types.js";
import type {
  CriteriaActor,
  CriteriaCommitCell,
} from "../../packages/heroui/src/filters/criteria-commit.js";
import type { FilterDateProps } from "../../packages/heroui/src/toolbar/filter-date.js";
import type { S } from "./fixtures.js";
// Positive actual-source shape only. No negative-removal/dual/emission claim.
export function dateProducer(
  cell: CriteriaCommitCell<"date", S>,
  actor: CriteriaActor<"date", S>,
  props: FilterDateProps<S>,
): CriteriaDateStateHandle {
  const bundle: CriteriaDateBundle<"date", S> = createCriteriaDateBundle(cell);
  reconcileCriteriaDateBundle(bundle, actor);
  void props.criteria;
  return beginCriteriaDateEdit(bundle, actor);
}
export function builderProducer(
  cell: CriteriaCommitCell<"builder", S>,
  actor: CriteriaActor<"builder", S>,
  ruleId: string | null,
): CriteriaDateStateHandle {
  const bundle: CriteriaDateBundle<"builder", S> =
    createCriteriaDateBundle(cell);
  return beginCriteriaDateEdit(bundle, actor, {
    kind: "builder",
    fieldId: "builderDate",
    operator: "date.between",
    ruleId,
  });
}
export function internalProps(
  props: DateOperandEditorProps,
): CriteriaDateStateHandle | undefined {
  return props.criteriaState;
}
export function read(handle: CriteriaDateStateHandle) {
  return readCriteriaDateState(handle);
}
export function close(
  bundle: CriteriaDateBundle<"date", S>,
  actor: CriteriaActor<"date", S>,
) {
  closeCriteriaDateEdit(bundle, actor);
}
