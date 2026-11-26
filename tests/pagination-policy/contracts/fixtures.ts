import { defineQuerySchema } from "../../../packages/react/src/contracts/index.js";
import type {
  QueryInput,
  QuerySchemaDefinition,
} from "../../../packages/react/src/contracts/types.js";

export const now = Date.parse("2026-01-15T12:00:00Z");
export const context = { locale: "en-US", timeZone: "UTC" } as const;

export function descriptor(pagination?: QuerySchemaDefinition["pagination"]) {
  return {
    id: "pagination-contracts",
    version: 7,
    fields: {
      amount: { type: "number", owner: "builder", sort: true },
      title: { type: "text", owner: "search" },
      day: { type: "date", owner: "date", relativePresets: ["today"] },
      status: { type: "enum", owner: "tabs", values: ["open", "closed"] },
    },
    tabs: [
      { id: "all", rules: [] },
      {
        id: "open",
        rules: [{ field: "status", operator: "enum.is", value: "open" }],
      },
    ],
    defaultTabId: "all",
    search: { trim: true },
    date: { mode: "single" },
    ...(pagination ? { pagination } : {}),
  } as const;
}
export function schemaFor(pagination?: QuerySchemaDefinition["pagination"]) {
  return defineQuerySchema(descriptor(pagination));
}
export const customSizes = { defaultSize: 25, sizes: [5, 25, 75] } as const;
export function active(
  schema: ReturnType<typeof schemaFor>,
): QueryInput<typeof schema> {
  return {
    ...context,
    builder: {
      join: "or",
      rules: [{ id: "r1", field: "amount", operator: "number.gte", value: 7 }],
    },
    search: " alpha ",
    tabId: "open",
    date: { operator: "date.on", value: { kind: "relative", preset: "today" } },
    sorting: [{ id: "amount", desc: true }],
    pagination: { pageIndex: 3, pageSize: schema.pagination.defaultSize },
  };
}
