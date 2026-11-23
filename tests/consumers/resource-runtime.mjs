import assert from "node:assert/strict";
import {
  createResourceAdapter,
  projectResourceView,
  useTableweaveResource,
} from "@tableweave/react";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

const schema = defineQuerySchema({
  id: "packed-resource",
  version: 1,
  fields: {},
});
const query = createQuery(schema, { locale: "en-US", timeZone: "UTC" });
const context = { definitionKey: "v1", scopeKey: "synthetic-a", access: true };
const invalidations = [];
const adapter = createResourceAdapter(context, {
  onInvalidate(event) {
    invalidations.push(event.reason);
  },
});
const input = (key, extra = {}) => ({
  definitionKey: context.definitionKey,
  scopeKey: context.scopeKey,
  queryKey: key,
  requestKey: key,
  query,
  ...extra,
});
const fresh = (ids) => ({
  source: "fresh",
  records: ids.map((id) => ({ id })),
  page: { kind: "unknown", hasNextPage: false },
  emptyKind: "unknown",
  receivedAt: "2026-11-24T00:00:00Z",
});
const a = adapter.begin(input("a"));
assert(a);
assert.equal(adapter.succeed(a, fresh(["a"])), true);
let retried;
const b = adapter.begin(
  input("b", {
    retry: (token) => {
      retried = token;
    },
  }),
);
assert(b);
assert.equal(adapter.getSnapshot().snapshot.queryKey, "a");
assert.equal(adapter.getSnapshot().canSelect, false);
assert.equal(
  adapter.fail(b, new Error("synthetic-secret-must-not-escape")),
  true,
);
assert.equal(
  JSON.stringify(adapter.getSnapshot()).includes("synthetic-secret"),
  false,
);
const retry = adapter.retry();
assert.equal(retry, retried);
assert.equal(retry.queryKey, "b");
assert.equal(adapter.succeed(retry, fresh([])), true);
assert.deepEqual(adapter.getSnapshot().snapshot.records, []);
assert.equal(adapter.succeed(a, fresh(["late-a"])), false);
const oldA = adapter.begin(input("a"));
adapter.begin(input("b"));
const newA = adapter.begin(input("a"));
assert.equal(adapter.succeed(newA, fresh(["new-a"])), true);
assert.equal(adapter.fail(oldA, "access-lost"), false);
assert.equal(adapter.getSnapshot().context.access, true);
const denied = projectResourceView(adapter.getSnapshot(), {
  ...context,
  access: false,
});
assert.equal(denied.snapshot, null);
assert.equal(denied.canRetry, false);
function ResourceServer() {
  return createElement(
    "span",
    null,
    useTableweaveResource(adapter, context).kind,
  );
}
assert.equal(
  renderToString(createElement(ResourceServer)),
  "<span>idle</span>",
);
const outstanding = adapter.begin(input("pending"));
adapter.setContext({ ...context, scopeKey: "synthetic-b" });
assert.equal(adapter.getSnapshot().snapshot, null);
assert.equal(adapter.succeed(outstanding, fresh(["private-a"])), false);
assert.deepEqual(invalidations, ["scope-change"]);
adapter.dispose();
console.log(
  "Packed resource generation/retention/privacy/SSR-boundary probes passed.",
);
