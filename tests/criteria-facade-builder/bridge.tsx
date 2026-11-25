import type { QuerySchema } from "@tableweave/react/contracts";
import { createElement, useSyncExternalStore } from "react";
import {
  type CriteriaFacadeSource,
  getCriteriaFacadeInput,
} from "../../packages/heroui/src/filters/criteria-facade-config.js";
import { FilterBuilder } from "../../packages/heroui/src/filters/filter-builder.js";
import type { FilterBuilderProps } from "../../packages/heroui/src/filters/types.js";
import type { TableRendererCell } from "../../packages/heroui/src/table/types.js";

/** Fixture of the source-private library bridge, not a consumer wrapper/API.
 * S/T stay anchored to the actual renderer factory and registered source. */
export function BuilderBridge<S extends QuerySchema, T extends object>({
  cell,
  source,
}: {
  readonly cell: TableRendererCell<S, T>;
  readonly source: CriteriaFacadeSource<"builder", NoInfer<S>, NoInfer<T>>;
}) {
  useSyncExternalStore(cell.subscribe, cell.getSnapshot, cell.getSnapshot);
  const input = getCriteriaFacadeInput(source);
  // Same private metadata-envelope boundary as CriteriaFacadeToolbar; no record,
  // operand, controller, authority or permitting props are manufactured/cast.
  return createElement(
    FilterBuilder<S>,
    input as unknown as FilterBuilderProps<S>,
  );
}
