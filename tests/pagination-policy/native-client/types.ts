import {
  createQuery,
  defineQuerySchema,
} from "../../../packages/react/src/contracts/index.js";
import type { TableCommand } from "../../../packages/react/src/controller/types.js";
import {
  createOperatorRegistry,
  defineOperator,
} from "../../../packages/react/src/filters/registry.js";
import { createNativeAdapter } from "../../../packages/react/src/tanstack/adapter.js";
import {
  createNativeColumnHelper,
  createNativeController,
  defineNativeTable,
} from "../../../packages/react/src/tanstack/definition.js";
import type {
  NativeDefinitionInput,
  NativeInput,
  NativeTableView,
} from "../../../packages/react/src/tanstack/types.js";

export interface Item {
  id: string;
  amount: number;
  title: string;
}
export const helper = createNativeColumnHelper<Item>();
export const columns = helper.columns([
  helper.accessor("amount", {
    id: "amount",
    cell(info) {
      const amount: number = info.getValue();
      // @ts-expect-error native column accessor value stays numeric
      const bad: string = info.getValue();
      void bad;
      return amount.toFixed(2);
    },
  }),
  helper.accessor("title", { id: "title" }),
]);
export const schema = defineQuerySchema({
  id: "u2-types",
  version: 1,
  pagination: { enabled: false },
  fields: {
    amount: { type: "number", owner: "builder", sort: true },
    title: { type: "text", owner: "search" },
    day: { type: "date", owner: "date", relativePresets: ["today"] },
  },
  date: { mode: "single" },
});
export const input: NativeDefinitionInput<typeof schema, Item> = {
  schema,
  columns,
  getRowId: (row) => row.id,
  selection: "multiple",
  evaluation: {
    accessors: { amount: (row) => row.amount, title: (row) => row.title },
  },
};
export const definition = defineNativeTable(input);
export const enabled: boolean = definition.paginationEnabled;
// @ts-expect-error resolved policy is readonly metadata, not caller configuration
definition.paginationEnabled = true;
// @ts-expect-error normalized runtime policy is exposed as boolean, not a promised literal type
export const literal: false = definition.paginationEnabled;
export const query = createQuery(schema, { locale: "en-US", timeZone: "UTC" });
export const controller = createNativeController(definition, {
  initial: { query },
  now: () => 0,
});
export const adapter = createNativeAdapter(definition, controller);
declare const view: NativeTableView<typeof schema, Item>;
export const viewEnabled: boolean = view.pagination.enabled;
export const row: Item | undefined = view.rows[0]?.original;
// @ts-expect-error view flag is readonly
view.pagination.enabled = true;
// @ts-expect-error native definition input has no extra paging policy flag
defineNativeTable({ ...input, paginationEnabled: false });
export const flagged: NativeInput<Item> = {
  mode: "client",
  records: [],
  // @ts-expect-error a client input cannot declare its own pagination-enabled state
  enabled: false,
};
// @ts-expect-error complete server input is not introduced by this client-only stage
export const future: NativeInput<Item> = { mode: "complete", records: [] };
const foreign = {
  id: "r",
  field: "title",
  operator: "text.contains",
  value: "x",
} as const;
// @ts-expect-error exclusive search field ownership remains inferred
export const badOwner: Extract<
  TableCommand<typeof schema>,
  { type: "builder.commit" }
>["rule"] = foreign;
const operand = {
  id: "r",
  field: "amount",
  operator: "number.eq",
  value: "7",
} as const;
// @ts-expect-error numeric rule operands retain their type
export const badNumber: Extract<
  TableCommand<typeof schema>,
  { type: "builder.commit" }
>["rule"] = operand;
const sorting = [{ id: "title", desc: true }] as const;
// @ts-expect-error native controller sorting retains configured sortable fields
export const badSort: typeof query.sorting = sorting;
const date = {
  operator: "date.on",
  value: { kind: "relative", preset: "tomorrow" },
} as const;
// @ts-expect-error configured date presets remain inferred
export const badDate: typeof query.date = date;
// @ts-expect-error selection accepts only supported modes
defineNativeTable({ ...input, selection: "all" });
adapter.getOptions({
  mode: "client",
  // @ts-expect-error records cannot substitute a wrong row field type
  records: [{ id: "r", amount: "7", title: "label" }],
});
export const badFlag: NativeDefinitionInput<typeof schema, Item> = {
  ...input,
  // @ts-expect-error resolved native definition cannot be added to input
  paginationEnabled: true,
};
export const registry = createOperatorRegistry([
  defineOperator({
    id: "custom.typed",
    labelKey: "synthetic.typed",
    types: ["number"],
    cardinality: "one",
    validate(value: unknown): value is number {
      return typeof value === "number";
    },
  }),
]);
export const customSchema = defineQuerySchema(
  {
    id: "u2-custom-types",
    version: 1,
    pagination: { enabled: false },
    fields: {
      amount: { type: "number", owner: "builder", operators: ["custom.typed"] },
    },
  },
  registry,
);
export const customDefinition = defineNativeTable({
  schema: customSchema,
  columns,
  getRowId: (row: Item) => row.id,
  evaluation: { registry, accessors: { amount: (row) => row.amount } },
});
export const customController = createNativeController(customDefinition, {
  initial: {
    query: createQuery(
      customSchema,
      { locale: "en-US", timeZone: "UTC" },
      { registry },
    ),
  },
  now: () => 0,
});
const customOperand = {
  id: "r",
  field: "amount",
  operator: "custom.typed",
  value: "7",
} as const;
// @ts-expect-error custom operator operands preserve registry inference
export const badCustom: Extract<
  TableCommand<typeof customSchema>,
  { type: "builder.commit" }
>["rule"] = customOperand;
// @ts-expect-error managed supported native handles cannot override manualPagination options
view.native.setOptions({ manualPagination: false });
