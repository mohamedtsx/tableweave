import type { OptionSource } from "../../packages/react/src/filters/editor-types.js";
import { registerOptionCriteriaSource } from "../../packages/react/src/filters/options-criteria.js";
import { optionContext, owner } from "./fixtures.js";
import { createOptionSource } from "../../packages/react/src/filters/options-source.js";

const app = owner();
const source = createOptionSource<string>(optionContext);
// Deferred final phase: remove each directive independently and inspect its diagnostic.
// @ts-expect-error search ownership cannot satisfy BuilderFieldId
registerOptionCriteriaSource({
  publication: app.publication,
  criteria: app.issue(),
  fieldId: "search",
  source,
});
// @ts-expect-error unknown field cannot widen the publication's schema
registerOptionCriteriaSource({
  publication: app.publication,
  criteria: app.issue(),
  fieldId: "unknown",
  source,
});
// @ts-expect-error no reset method was added to the public source interface
source.reset();
// @ts-expect-error invalid scalar ID parameter
const invalid: OptionSource<boolean> = source;
void invalid;
