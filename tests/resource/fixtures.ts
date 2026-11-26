import {
  createQuery,
  defineQuerySchema,
} from "../../packages/react/dist/contracts/index.js";
import type {
  ResourceContext,
  ResourceRequestInput,
  ResourceSuccess,
} from "../../packages/react/dist/resource/index.js";

export interface Row {
  id: string;
}
export const context: ResourceContext = {
  scopeKey: "scope-a",
  definitionKey: "definition-1",
  access: true,
};
const schema = defineQuerySchema({
  id: "resource-fixture",
  version: 1,
  fields: { name: { type: "text", owner: "search" } },
});
export function input(
  key = "a",
  pageIndex = 0,
  extra: Partial<ResourceRequestInput> = {},
): ResourceRequestInput {
  return {
    definitionKey: context.definitionKey,
    scopeKey: context.scopeKey,
    queryKey: key,
    requestKey: key,
    query: createQuery(schema, {
      locale: "en-US",
      timeZone: "UTC",
      search: key,
      pagination: { pageIndex, pageSize: 25 },
    }),
    ...extra,
  };
}
export function success(
  ids: readonly string[] = ["a"],
  extra: Partial<ResourceSuccess<Row>> = {},
): ResourceSuccess<Row> {
  return {
    source: "fresh",
    records: ids.map((id) => ({ id })),
    page: { kind: "known", total: 100 },
    emptyKind: "unknown",
    receivedAt: "2026-11-24T00:00:00.000Z",
    ...extra,
  };
}
