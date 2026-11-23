import type { WireQuery } from "../../packages/react/dist/contracts/index.js";
import type {
  PageInfo,
  ResourceAdapter,
  ResourceRequest,
} from "../../packages/react/dist/resource/index.js";

// Compile-only emitted declaration consumer; actual runtime uses the same dist.
function declarations(
  adapter: ResourceAdapter<{ id: string }>,
  token: ResourceRequest,
) {
  const query: WireQuery = token.query;
  void query;
  // @ts-expect-error unknown totals must specify hasNextPage
  const invalidUnknown: PageInfo = { kind: "unknown" };
  // @ts-expect-error known totals must specify total
  const invalidKnown: PageInfo = { kind: "known", hasNextPage: true };
  void invalidUnknown;
  void invalidKnown;
  // @ts-expect-error provenance is readonly
  token.scopeKey = "wrong";
  adapter.succeed(token, {
    source: "fresh",
    // @ts-expect-error records retain their application shape
    records: [{ wrong: true }],
    page: { kind: "known", total: 1 },
    emptyKind: "unknown",
    receivedAt: "2026-11-24T00:00:00Z",
  });
  // @ts-expect-error begin requires both keys and a query
  adapter.begin({
    scopeKey: "scope",
    definitionKey: "definition",
    requestKey: "request",
  });
}
void declarations;
