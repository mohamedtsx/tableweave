import type {
  FilterBuilderProps,
  FilterTabsProps,
  NativeCollectionProps,
  PaginationProps,
} from "@tableweave/heroui";
import type {
  ControlsAuthority,
  ControlsInput,
  TableController,
} from "@tableweave/react";
import { getControlsAuthorityOwner } from "@tableweave/react";
import type { BuilderFieldId } from "@tableweave/react/filters";
import type {
  CompositionRecord,
  compositionSchema,
} from "../../../apps/storybook/src/controls/FilterControlsComposition.js";

type Schema = typeof compositionSchema;
export const builderField: BuilderFieldId<Schema> = "team";
// @ts-expect-error search ownership must not be admitted as builder ownership
export const searchIsNotBuilder: BuilderFieldId<Schema> = "description";
// @ts-expect-error date ownership remains exclusive even in neutral tool state
export const dateIsNotBuilder: BuilderFieldId<Schema> = "day";
export const fields: FilterBuilderProps<Schema>["fields"] = {
  team: { label: "Team", choices: [{ id: "red", label: "Red" }] },
  // @ts-expect-error tabs-owned fields are not builder presentation keys
  status: { label: "Status" },
};
export function contracts(
  controller: TableController<Schema>,
  input: ControlsInput<Schema, CompositionRecord>,
  authority: ControlsAuthority<Schema, CompositionRecord>,
  collection: NativeCollectionProps<Schema, CompositionRecord>,
) {
  controller.dispatch({ type: "tabs.change", tabId: null });
  controller.dispatch({ type: "tabs.change", tabId: "ready" });
  // @ts-expect-error only configured tab IDs or null are valid
  controller.dispatch({ type: "tabs.change", tabId: "missing" });
  const source: typeof input.source = {
    mode: "client",
    context: input.expected,
    records: [],
  };
  const owner = getControlsAuthorityOwner(authority);
  void owner;
  void source;
  if (collection.controls) {
    // @ts-expect-error explicit real definition metadata is required
    const bad: NonNullable<typeof collection.controls> = {
      authority,
      presentation: collection.controls.presentation,
    };
    void bad;
  }
  const neutral: FilterTabsProps<Schema>["neutralTab"] = {
    label: "All records",
  };
  void neutral;
}

export function paginationContracts(
  props: PaginationProps<Schema, CompositionRecord>,
) {
  const requiredSchema: Schema = props.schema;
  const valid: PaginationProps<Schema, CompositionRecord> = {
    schema: requiredSchema,
    presentation: props.presentation,
    authority: props.authority,
  };
  // @ts-expect-error the public pager requires the actual query schema
  const missingSchema: PaginationProps<Schema, CompositionRecord> = {
    presentation: props.presentation,
    authority: props.authority,
  };
  const inventedSizes: PaginationProps<Schema, CompositionRecord> = {
    ...valid,
    // @ts-expect-error sizes derive from schema.pagination, not an invented pager prop
    pageSizes: [3, 6],
  };
  void valid;
  void missingSchema;
  void inventedSizes;
}
