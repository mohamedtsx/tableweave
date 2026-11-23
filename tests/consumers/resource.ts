import {
  createResourceAdapter,
  projectResourceView,
  type ResourceRequest,
  type ResourceSuccess,
  useTableweaveResource,
} from "@tableweave/react";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";

const schema = defineQuerySchema({
  id: "packed-resource",
  version: 1,
  fields: {},
});
const query = createQuery(schema, { locale: "en-US", timeZone: "UTC" });
const context = {
  definitionKey: "definition-v1",
  scopeKey: "synthetic-scope",
  access: true,
};
const adapter = createResourceAdapter<{ id: string }, typeof query>(context);
export const request = adapter.begin({
  ...context,
  queryKey: "query-one",
  requestKey: "request-one",
  query,
  retry(token) {
    const sameSchema: "packed-resource" = token.query.schemaId;
    void sameSchema;
  },
});
export function ResourceConsumer() {
  const view = useTableweaveResource(adapter, context);
  const rowId: string | undefined = view.snapshot?.records[0]?.id;
  // @ts-expect-error Resource records retain the application's row type.
  const amount: number | undefined = view.snapshot?.records[0]?.amount;
  void amount;
  // @ts-expect-error Snapshot metadata is readonly.
  if (view.snapshot) view.snapshot.page = { kind: "known", total: 0 };
  return { rowId, projection: projectResourceView(view, context) };
}
export function typedToken(token: ResourceRequest<typeof query>) {
  const id: "packed-resource" = token.query.schemaId;
  return id;
}
export const incomplete: ResourceSuccess<{ id: string }> = {
  source: "fresh",
  records: [],
  // @ts-expect-error Unknown pagination requires an explicit application next flag.
  page: { kind: "unknown" },
  emptyKind: "unknown",
  receivedAt: "2026-11-24T00:00:00Z",
};

// @ts-expect-error The resource implementation remains a private deep path.
import "@tableweave/react/resource/adapter";
