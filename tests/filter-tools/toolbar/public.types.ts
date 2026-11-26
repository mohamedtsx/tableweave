import type { TableController } from "@tableweave/react";
import { defineQuerySchema } from "@tableweave/react/contracts";
import type { FilterDateProps } from "../../../packages/heroui/src/toolbar/filter-date.js";
import type { FilterSearchProps } from "../../../packages/heroui/src/toolbar/filter-search.js";
import type { FilterTabsProps } from "../../../packages/heroui/src/toolbar/filter-tabs.js";

const schema = defineQuerySchema({
  id: "toolbar-types",
  version: 1,
  fields: {
    day: { type: "date", owner: "date" },
    text: { type: "text", owner: "search" },
    status: { type: "enum", owner: "tabs" },
  },
  date: { mode: "single" },
  tabs: [{ id: "available", rules: [] }],
});
type AssertFalse<T extends false> = T;
export type DateOnlyRejectsInstant = AssertFalse<
  {
    id: string;
    label: string;
    date: {
      operator: "date.on";
      value: { kind: "instant"; value: string };
    };
  } extends NonNullable<FilterDateProps<typeof schema>["presets"]>[number]
    ? true
    : false
>;
export function toolbarPublicTypes(controller: TableController<typeof schema>) {
  const common = {
    controller,
    expectedContext: {
      definitionKey: "types",
      scopeKey: "synthetic",
      access: true,
    },
  };
  const date: FilterDateProps<typeof schema> = {
    ...common,
    presets: [
      {
        id: "day",
        label: "Specific day",
        date: {
          operator: "date.on",
          value: { kind: "day", value: "2025-01-01" },
        },
      },
    ],
  };
  const search: FilterSearchProps<typeof schema> = {
    ...common,
    // @ts-expect-error HeroUI root props are not a public tool escape hatch.
    variant: "secondary",
  };
  const tabs: FilterTabsProps<typeof schema> = {
    ...common,
    children: null,
    tabs: {
      available: {
        label: "Available",
        // @ts-expect-error A count requires its application-owned meaning.
        count: { value: 0 },
      },
    },
  };
  return { date, search, tabs };
}
