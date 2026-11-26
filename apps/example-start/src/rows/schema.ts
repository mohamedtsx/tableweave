import {
  createQuery,
  defineQuerySchema,
  getQueryIdentity,
  type QueryFor,
} from "@tableweave/react/contracts";

export const schema = defineQuerySchema({
  id: "wp06-synthetic-records",
  version: 1,
  fields: {
    label: { type: "text", owner: "search", sort: true },
    amount: {
      type: "number",
      owner: "builder",
      operators: ["number.gte", "number.lt", "number.eq"],
      sort: true,
    },
    status: { type: "enum", owner: "tabs", values: ["active", "paused"] },
  },
  tabs: [
    { id: "all", rules: [] },
    {
      id: "active",
      rules: [{ field: "status", operator: "enum.is", value: "active" }],
    },
  ],
  defaultTabId: "all",
  sorting: { multi: true },
  pagination: { defaultSize: 10, sizes: [10, 25, 50, 100] },
});

export type DemoQuery = QueryFor<typeof schema>;
export const definitionKey = "wp06-synthetic-records:1:label-amount-status";
export const alternateDefinitionKey = `${definitionKey}:alternate-layout`;
export const fixtureClock = 1_795_478_400_000;
export function initialQuery(): DemoQuery {
  return createQuery(schema, { locale: "en-US", timeZone: "UTC" });
}
export function identity(query: DemoQuery, clock: number): string {
  return getQueryIdentity(schema, query, { now: clock });
}
