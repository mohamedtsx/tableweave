import type { CriteriaToolTarget } from "../../packages/heroui/src/filters/criteria-commit.js";
import { FilterBuilder } from "../../packages/heroui/src/filters/filter-builder.js";
import type { FilterBuilderProps } from "../../packages/heroui/src/filters/types.js";
import type { CriteriaBuilderEditorHandle, CriteriaBuilderStore } from "../../packages/heroui/src/filters/criteria-builder-host.js";
import { ValueEditor } from "../../packages/heroui/src/filters/value-editors.js";
import type { S } from "./fixtures.js";

// Positive actual-source consumer only. No negative/removal/emission inference.
export function consumer(raw: FilterBuilderProps<S>, target: CriteriaToolTarget<S>) {
  FilterBuilder(raw);
  return FilterBuilder({ ...raw, criteria: target });
}
export function nested(handle: CriteriaBuilderEditorHandle) { return ValueEditor({ criteriaEditor: handle }); }
export function lifetime(store: CriteriaBuilderStore<S>): () => void { return store.mount(); }
