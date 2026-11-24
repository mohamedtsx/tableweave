import type { CriteriaToolTarget } from "../../../packages/heroui/src/filters/criteria-commit.js";
import type { CriteriaBuilderEditorHandle } from "../../../packages/heroui/src/filters/criteria-builder-host.js";
import type { FilterBuilderProps } from "../../../packages/heroui/src/filters/types.js";
import { FilterBuilder } from "../../../packages/heroui/src/filters/filter-builder.js";
import { ValueEditor } from "../../../packages/heroui/src/filters/value-editors.js";
import type { QuerySchema } from "@tableweave/react/contracts";
import type { S } from "../fixtures.js";

declare const props: FilterBuilderProps<S>;
declare const unrelated: CriteriaToolTarget<QuerySchema>;
declare const handle: CriteriaBuilderEditorHandle;
// Expected separate errors: exact optional semantics; NoInfer/invariant target;
// opaque editor provenance; no external callback as criteria permission.
FilterBuilder({ ...props, criteria: undefined });
FilterBuilder({ ...props, criteria: unrelated });
ValueEditor({ criteriaEditor: {} });
ValueEditor({ criteriaEditor: handle, onAllow: () => true });
