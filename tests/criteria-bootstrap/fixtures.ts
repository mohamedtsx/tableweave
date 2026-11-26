import { createQuery } from "../../packages/react/src/contracts/query.js";
import { defineQuerySchema } from "../../packages/react/src/contracts/schema.js";
import type { SelectionState } from "../../packages/react/src/controller/types.js";
import { defineNativeTable } from "../../packages/react/src/tanstack/definition.js";
import type { NativeSelectionMode } from "../../packages/react/src/tanstack/types.js";

export interface Item { id: string; title: string; amount: number; day: string }
export function schemaFor(version = 1, changed = false) {
  return defineQuerySchema({
    id: "bootstrap", version,
    fields: {
      title: { type: "text", owner: "search", sort: true },
      amount: { type: "number", owner: "builder", nullable: changed },
      day: { type: "date", owner: "builder", relativePresets: ["today"] },
    },
  });
}
export type S = ReturnType<typeof schemaFor>;
export function nativeFor(selection: NativeSelectionMode = "multiple", schema = schemaFor()) {
  return defineNativeTable<S, Item>({
    schema, selection, getRowId: (row) => row.id,
    columns: [{ id: "title", accessorKey: "title" }, { id: "amount", accessorKey: "amount" }, { id: "day", accessorKey: "day" }],
  });
}
export function seedFor(schema = schemaFor(), selection: SelectionState = { r1: true }) {
  return { query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }), selection };
}
export const context = Object.freeze({ definitionKey: "bootstrap-v1", scopeKey: "domain-a", access: true });
