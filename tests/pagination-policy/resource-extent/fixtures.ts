import type { WireQuery } from "../../../packages/react/src/contracts/types.js";
import { createResourceAdapter } from "../../../packages/react/src/resource/adapter.js";
import type {
  ResourceRequestInput,
  ResourceSuccess,
} from "../../../packages/react/src/resource/types.js";
export interface Row {
  id: string;
}
export const context = {
  definitionKey: "u3-definition",
  scopeKey: "u3-scope",
  access: true,
};
export function query(pageIndex = 0): WireQuery {
  return {
    version: 1,
    schemaId: "u3-synthetic",
    schemaVersion: 1,
    locale: "en-US",
    timeZone: "UTC",
    builder: { join: "and", rules: [] },
    search: "",
    tabId: null,
    date: null,
    sorting: [],
    pagination: { pageIndex, pageSize: 25 },
  };
}
export function input(
  key = "same",
  pageIndex = 0,
  extra: Partial<ResourceRequestInput> = {},
): ResourceRequestInput {
  return {
    definitionKey: context.definitionKey,
    scopeKey: context.scopeKey,
    queryKey: key,
    requestKey: key,
    query: query(pageIndex),
    ...extra,
  };
}
export function success(length = 1, total = length): ResourceSuccess<Row> {
  return {
    source: "fresh",
    records: Array.from({ length }, (_, i) => ({ id: `synthetic-${i}` })),
    page: { kind: "known", total },
    emptyKind: length ? "unknown" : "dataset",
    receivedAt: "2026-11-24T00:00:00.000Z",
  };
}
export function fixture() {
  const adapter = createResourceAdapter<Row>(context);
  let notifications = 0;
  adapter.subscribe(() => {
    notifications++;
  });
  return { adapter, notifications: () => notifications };
}
export function requireToken<T>(token: T | null): T {
  if (!token) throw new Error("Missing real request token");
  return token;
}
