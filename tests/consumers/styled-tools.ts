import {
  FilterBuilder,
  type FilterBuilderProps,
  FilterDate,
  type FilterDateProps,
  FilterSearch,
  type FilterSearchProps,
  FilterTabs,
  type FilterTabsProps,
} from "@tableweave/heroui";
import { createTableController } from "@tableweave/react";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import { createOptionSource } from "@tableweave/react/filters";
import { createElement } from "react";

const schema = defineQuerySchema({
  id: "packed-styled-tools",
  version: 1,
  fields: {
    amount: { type: "number", owner: "builder" },
    tags: { type: "set", owner: "builder" },
    title: { type: "text", owner: "search" },
    phase: { type: "enum", owner: "tabs" },
    at: { type: "datetime", owner: "date" },
  },
  tabs: [
    { id: "all", rules: [] },
    {
      id: "open",
      rules: [{ field: "phase", operator: "enum.is", value: "open" }],
    },
  ],
});
const controller = createTableController(
  { schema },
  {
    initial: {
      query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
    },
    now: () => 0,
  },
);
const context = { definitionKey: "v1", scopeKey: "synthetic", access: true };
const source = createOptionSource<number>({ ...context, fieldId: "tags" });
export const builder: FilterBuilderProps<typeof schema> = {
  controller,
  evaluationMode: "client",
  expectedResourceContext: context,
  invalidationKey: 0,
  fields: {
    amount: {
      label: "Amount",
      formatValue(rule) {
        return createElement("b", null, rule.field);
      },
      renderEditor(props) {
        const field: "amount" | "tags" = props.fieldId;
        // @ts-expect-error Custom editor field context excludes independent owners.
        const independent: "title" = props.fieldId;
        void field;
        void independent;
        props.onChange(0);
        // @ts-expect-error Draft operands are JSON values, not native Date instances.
        props.onChange(new Date());
        return "Synthetic custom editor";
      },
    },
    tags: {
      label: "Tags",
      asyncOptions: {
        idType: "number",
        source,
        onRequest(token) {
          const field: string = token.fieldId;
          void field;
        },
      },
    },
  },
};
export const search: FilterSearchProps<typeof schema> = {
  controller,
  expectedContext: context,
};
export const tabs: FilterTabsProps<typeof schema> = {
  ...search,
  tabs: {
    all: { label: "All" },
    open: {
      label: "Open",
      count: { value: 0, description: "Matching synthetic rows" },
    },
  },
  neutralTab: { label: "Neutral" },
  children: createElement("div", null, "Actual shared results slot"),
};
export const date: FilterDateProps<typeof schema> = {
  ...search,
  presets: [
    {
      id: "today",
      label: "Today",
      date: {
        operator: "date.on",
        value: { kind: "relative", preset: "today" },
      },
    },
  ],
};
export function PackedTools() {
  return [
    createElement(FilterBuilder<typeof schema>, builder),
    createElement(FilterSearch<typeof schema>, search),
    createElement(FilterTabs<typeof schema>, tabs),
    createElement(FilterDate<typeof schema>, date),
  ];
}
export const forbidden: FilterBuilderProps<typeof schema>["fields"] = {
  // @ts-expect-error Configured search ownership is excluded even while neutral.
  title: { label: "Not a builder field" },
};
// @ts-expect-error Evaluation owner must be explicit; it cannot be guessed by UI.
export const noEvaluation: FilterBuilderProps<typeof schema> = {
  controller,
  expectedResourceContext: context,
  invalidationKey: 0,
  fields: {},
};
// @ts-expect-error A schema-defined tab cannot silently lack its presentation.
export const missingTab: FilterTabsProps<typeof schema>["tabs"] = {
  all: { label: "All" },
};

// @ts-expect-error Private value-editor implementations are not export subpaths.
import "@tableweave/heroui/filters/value-editors";
