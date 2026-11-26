import {
  createQuery,
  defineQuerySchema,
} from "../../../packages/react/src/contracts/index.js";
import type { QueryFor } from "../../../packages/react/src/contracts/types.js";
import { createTableController } from "../../../packages/react/src/controller/store.js";
import type { TableCommand } from "../../../packages/react/src/controller/types.js";
import {
  createOperatorRegistry,
  defineOperator,
} from "../../../packages/react/src/filters/registry.js";

export const schema = defineQuerySchema({
  id: "u1-types",
  version: 1,
  fields: {
    amount: { type: "number", owner: "builder", sort: true },
    title: { type: "text", owner: "search" },
    status: { type: "enum", owner: "builder", values: ["open", "closed"] },
    day: { type: "date", owner: "date", relativePresets: ["today"] },
  },
  date: { mode: "single" },
  pagination: { enabled: false },
});
export const query = createQuery(schema, { locale: "en-US", timeZone: "UTC" });
export const controller = createTableController(
  { schema },
  {
    initial: { query },
    now: () => 0,
    validateCommand(command) {
      const type: TableCommand<typeof schema>["type"] = command.type;
      void type;
      // @ts-expect-error captured command discriminant is readonly
      command.type = "clock.tick";
    },
  },
);
export const exact: QueryFor<typeof schema> = controller.getSnapshot().query;
controller.dispatch({
  type: "pagination.change",
  update(previous) {
    const n: number = previous.pageIndex;
    return { pageIndex: n + 1, pageSize: previous.pageSize };
  },
});
controller.dispatch({
  type: "query.replace",
  update(previous) {
    const id: "u1-types" = previous.schemaId;
    void id;
    return previous;
  },
});
controller.dispatch({
  type: "sorting.change",
  update(previous) {
    const field: "amount" | undefined = previous[0]?.id;
    void field;
    return [{ id: "amount", desc: true }];
  },
});
const owner = {
  id: "r",
  field: "title",
  operator: "text.contains",
  value: "x",
} as const;
// @ts-expect-error search owner cannot become a builder rule
export const badOwner: Extract<
  TableCommand<typeof schema>,
  { type: "builder.commit" }
>["rule"] = owner;
const number = {
  id: "r",
  field: "amount",
  operator: "number.eq",
  value: "7",
} as const;
// @ts-expect-error numeric operand remains number
export const badNumber: Extract<
  TableCommand<typeof schema>,
  { type: "builder.commit" }
>["rule"] = number;
const sort = [{ id: "title", desc: true }] as const;
// @ts-expect-error only configured sort fields are enabled
export const badSort: typeof query.sorting = sort;
const date = {
  operator: "date.on",
  value: { kind: "relative", preset: "tomorrow" },
} as const;
// @ts-expect-error relative presets retain the schema allowlist
export const badDate: typeof query.date = date;
const enumeration = {
  id: "r",
  field: "status",
  operator: "enum.is",
  value: "unknown",
} as const;
// @ts-expect-error enum operand retains literal values
export const badEnum: Extract<
  TableCommand<typeof schema>,
  { type: "builder.commit" }
>["rule"] = enumeration;
controller.dispatch({
  type: "pagination.change",
  // @ts-expect-error pagination updater must return a numeric pair
  update: () => ({ pageIndex: 0, pageSize: "10" }),
});
controller.dispatch({
  type: "sorting.change",
  // @ts-expect-error sorting updater cannot introduce a non-sortable field
  update: () => [{ id: "title", desc: false }],
});
// @ts-expect-error readonly accepted query pagination cannot be assigned
controller.getSnapshot().query.pagination.pageIndex = 3;
controller.dispatch({
  type: "query.replace",
  // @ts-expect-error query replacement cannot substitute an unowned builder rule
  update: (previous) => ({
    ...previous,
    builder: { join: "and", rules: [owner] },
  }),
});

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
    id: "u1-custom-types",
    version: 1,
    fields: {
      value: { type: "number", owner: "builder", operators: ["custom.typed"] },
    },
  },
  registry,
);
export const custom = createTableController(
  { schema: customSchema },
  {
    initial: {
      query: createQuery(
        customSchema,
        { locale: "en-US", timeZone: "UTC" },
        { registry },
      ),
    },
    registry,
    now: () => 0,
  },
);
custom.dispatch({
  type: "builder.commit",
  rule: { id: "r", field: "value", operator: "custom.typed", value: 7 },
});
const customValue = {
  id: "r",
  field: "value",
  operator: "custom.typed",
  value: "7",
} as const;
// @ts-expect-error custom registry operand inference is preserved
export const badCustom: Extract<
  TableCommand<typeof customSchema>,
  { type: "builder.commit" }
>["rule"] = customValue;
const customId = {
  id: "r",
  field: "value",
  operator: "custom.unknown",
  value: 7,
} as const;
// @ts-expect-error custom operator IDs retain their actual allowlist
export const badCustomId: Extract<
  TableCommand<typeof customSchema>,
  { type: "builder.commit" }
>["rule"] = customId;
controller.dispatch({
  type: "query.replace",
  // @ts-expect-error another query schema cannot replace this accepted query
  update: custom.getSnapshot().query,
});
controller.dispatch({
  type: "pagination.change",
  update(previous) {
    // @ts-expect-error pagination updater receives the readonly validated pair
    previous.pageSize = 25;
    return previous;
  },
});
