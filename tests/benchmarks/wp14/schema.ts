import {
  defineQuerySchema,
  createQuery,
  normalizeQuery,
  type QuerySchema,
  type RuleFor,
} from "@tableweave/react/contracts";
import type { Plan } from "./fixture.js";
const fields = {
  recordLabel: { type: "text", owner: "search", sort: true },
  status: { type: "enum", owner: "builder", values: ["posted", "draft"] },
  amount: { type: "number", owner: "builder", sort: true },
  quantity: { type: "number", owner: "builder" },
  unitPrice: { type: "number", owner: "builder" },
  balance: { type: "number", owner: "builder", nullable: true },
  score: { type: "number", owner: "builder" },
  occurredAt: { type: "datetime", owner: "builder" },
  bookingDay: { type: "date", owner: "builder" },
  updatedAt: { type: "datetime", owner: "builder" },
  category: {
    type: "enum",
    owner: "builder",
    values: ["equipment", "supplies"],
  },
  region: { type: "enum", owner: "builder", values: ["north", "south"] },
  currency: { type: "enum", owner: "builder", values: ["USD", "EUR"] },
  reference: { type: "text", owner: "builder", nullable: true },
  note: { type: "text", owner: "builder", nullable: true },
  accountCode: { type: "text", owner: "builder" },
  active: { type: "boolean", owner: "builder" },
  cleared: { type: "boolean", owner: "builder", nullable: true },
  tags: { type: "set", owner: "builder", values: ["local", "review"] },
  locations: { type: "set", owner: "builder", values: ["a", "b"] },
} as const;
const policy = {
  version: 1,
  pagination: { defaultSize: 100, sizes: [100] },
  sorting: { multi: true },
  search: { debounceMs: 300 },
} as const;
export const clientSchema = defineQuerySchema({
  ...policy,
  id: "wp14-client-reference",
  fields,
});
export const serverSchema = defineQuerySchema({
  ...policy,
  id: "wp14-server-reference",
  fields: {
    ...fields,
    tax: { type: "number", owner: "builder" },
    discount: { type: "number", owner: "builder" },
    weight: { type: "number", owner: "builder", nullable: true },
    leadDays: { type: "number", owner: "builder" },
    expiresOn: { type: "date", owner: "builder", nullable: true },
    createdAt: { type: "datetime", owner: "builder" },
    supplier: { type: "text", owner: "builder" },
    warehouse: { type: "enum", owner: "builder", values: ["a", "b"] },
    priority: { type: "enum", owner: "builder", values: ["normal", "urgent"] },
    batchRef: { type: "text", owner: "builder", nullable: true },
  },
});
export function query<S extends QuerySchema>(schema: S, plan: Plan) {
  const rules: readonly RuleFor<typeof clientSchema>[] = [
    {
      id: "amount-rule",
      field: "amount",
      operator: "number.gte",
      value: plan.variant ? 2000 : 1000,
    },
    {
      id: "quantity-rule",
      field: "quantity",
      operator: "number.lt",
      value: 90,
    },
    {
      id: "category-rule",
      field: "category",
      operator: "enum.is",
      value: "equipment",
    },
    {
      id: "note-rule",
      field: "note",
      operator: "text.contains",
      value: "local",
    },
    {
      id: "day-rule",
      field: "bookingDay",
      operator: "date.onOrAfter",
      value: { kind: "day", value: "2026-11-05" },
    },
  ];
  const base = createQuery(schema, {
    locale: "en-US",
    timeZone: "UTC",
    pagination: { pageIndex: plan.page, pageSize: 100 },
  });
  return normalizeQuery(schema, {
    ...base,
    search: plan.search,
    builder: { join: plan.join, rules: plan.rules ? rules : [] },
    sorting:
      plan.sort === "none"
        ? []
        : [
            { id: "amount", desc: plan.sort === "desc" },
            { id: "recordLabel", desc: false },
          ],
  });
}
