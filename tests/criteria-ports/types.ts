import type {
  FilterBuilderProps,
  FilterCustomEditorProps,
  FilterFieldPresentation,
} from "../../packages/heroui/src/filters/types.js";
import type { FilterDateProps } from "../../packages/heroui/src/toolbar/filter-date.js";
import type { FilterSearchProps } from "../../packages/heroui/src/toolbar/filter-search.js";
import type { FilterTabsProps } from "../../packages/heroui/src/toolbar/filter-tabs.js";
import {
  captureFilterBuilderPorts,
  captureFilterDatePorts,
  captureFilterSearchPorts,
  captureFilterTabsPorts,
} from "../../packages/heroui/src/filters/criteria-ports.js";
import { schema, unitGate, type S } from "./fixtures.js";

export function fromActualProps(
  builder: FilterBuilderProps<S>,
  date: FilterDateProps<S>,
  search: FilterSearchProps<S>,
  tabs: FilterTabsProps<S>,
) {
  const gate = unitGate();
  return {
    builder: captureFilterBuilderPorts(schema, builder, gate.check),
    date: captureFilterDatePorts(date, gate.check),
    search: captureFilterSearchPorts(search, gate.check),
    tabs: captureFilterTabsPorts(schema, tabs, gate.check),
  };
}
export function customEditor(input: FilterCustomEditorProps<S>) {
  return input.fieldId;
}
export const field: FilterFieldPresentation<S> = {
  label: "First",
  renderEditor: customEditor,
};
