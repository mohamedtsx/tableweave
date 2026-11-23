import {
  createQuery,
  defineQuerySchema,
} from "../../packages/react/src/contracts/index.js";
import { defineController } from "../../packages/react/src/index.js";

export const schema = defineQuerySchema({
  id: "coordinator",
  version: 1,
  fields: {
    amount: { type: "number", owner: "builder", sort: true },
    title: { type: "text", owner: "search" },
    state: { type: "enum", owner: "tabs" },
    at: { type: "date", owner: "date" },
  },
  tabs: [
    { id: "all", rules: [] },
    {
      id: "open",
      rules: [{ field: "state", operator: "enum.is", value: "open" }],
    },
  ],
});
export const definition = () =>
  defineController({
    schema,
    selection: true,
    details: true,
    columns: [{ id: "amount" }, { id: "title" }],
  });
export const query = () =>
  createQuery(schema, {
    locale: "en-US",
    timeZone: "UTC",
    search: "synthetic",
    tabId: "open",
    date: {
      operator: "date.between",
      value: [
        { kind: "day", value: "2026-01-01" },
        { kind: "day", value: "2026-01-31" },
      ],
    },
    builder: {
      join: "or",
      rules: [{ id: "r1", field: "amount", operator: "number.eq", value: 1 }],
    },
    pagination: { pageIndex: 3, pageSize: 25 },
  });
