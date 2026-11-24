import type { OptionSource } from "../../packages/react/src/filters/editor-types.js";
import { registerOptionCriteriaSource } from "../../packages/react/src/filters/options-criteria.js";
import { createOptionSource } from "../../packages/react/src/filters/options-source.js";
import { optionContext, owner } from "./fixtures.js";

export function positive() {
  const app = owner();
  const source: OptionSource<string> =
    createOptionSource<string>(optionContext);
  const release: () => void = registerOptionCriteriaSource({
    publication: app.publication,
    criteria: app.issue(),
    fieldId: "choice",
    source,
  });
  return { release, source };
}
