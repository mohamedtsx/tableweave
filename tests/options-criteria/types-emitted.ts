// Final phase only: every API/type in this consumer comes from own actual emit.
import type { S } from "./.artifacts/emit/tests/options-criteria/fixtures.js";
import type { CriteriaPublication } from "./.artifacts/emit/packages/react/src/controller/criteria-publication.js";
import type { CriteriaAuthority } from "./.artifacts/emit/packages/react/src/controller/criteria.js";
import type { OptionSource } from "./.artifacts/emit/packages/react/src/filters/editor-types.js";
import { registerOptionCriteriaSource } from "./.artifacts/emit/packages/react/src/filters/options-criteria.js";

declare const publication: CriteriaPublication<S>;
declare const criteria: CriteriaAuthority<S>;
declare const source: OptionSource<string>;
export const release: () => void = registerOptionCriteriaSource({
  publication,
  criteria,
  fieldId: "choice",
  source,
});
