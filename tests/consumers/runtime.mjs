import assert from "node:assert/strict";
import { registerHooks } from "node:module";

const blocked = [
  "react",
  "react-dom",
  "@heroui/react",
  "@heroui/styles",
  "react-aria",
  "react-aria-components",
  "tailwindcss",
  "@dnd-kit/react",
  "@tanstack/react-query",
  "@tanstack/react-router",
  "next",
  "node:http",
  "node:https",
  "node:net",
  "node:fs",
  "node:child_process",
];
const hook = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      blocked.some(
        (name) => specifier === name || specifier.startsWith(`${name}/`),
      )
    ) {
      throw new Error(`Forbidden runtime import: ${specifier}`);
    }
    return nextResolve(specifier, context);
  },
});
const { createQuery, defineQuerySchema, parseQuery, getFilterIdentity } =
  await import("@tableweave/react/contracts");
const { createFilterEvaluator, resolveDateValue } = await import(
  "@tableweave/react/filters"
);
const schema = defineQuerySchema({
  id: "packed",
  version: 1,
  fields: {
    amount: { type: "number", owner: "builder" },
    at: { type: "datetime", owner: "date" },
  },
});
const query = createQuery(schema, {
  locale: "en-US",
  timeZone: "America/New_York",
  builder: {
    join: "and",
    rules: [{ id: "r1", field: "amount", operator: "number.gte", value: 0 }],
  },
  date: {
    operator: "date.between",
    value: [
      { kind: "day", value: "2026-03-08" },
      { kind: "day", value: "2026-03-08" },
    ],
  },
});
assert.equal(parseQuery(schema, query).success, true);
assert.equal(
  parseQuery(schema, { ...query, schemaVersion: 99 }).success,
  false,
);
const evaluate = createFilterEvaluator(schema, query, { now: 0 });
assert.equal(evaluate({ amount: 0, at: "2026-03-09T03:59:59Z" }), true);
assert.equal(evaluate({ amount: 0, at: "2026-03-09T04:00:00Z" }), false);
assert.equal(evaluate({ amount: null, at: "2026-03-08T12:00:00Z" }), false);
assert.equal(
  getFilterIdentity(schema, query, { now: 0 }),
  getFilterIdentity(schema, query, { now: 1 }),
);
const reviewSchema = defineQuerySchema({
  id: "packed-review",
  version: 1,
  fields: {
    tags: { type: "set", owner: "builder" },
    price: { type: "number", owner: "none", sort: true },
  },
  tabs: [{ id: "all", rules: [] }],
});
const reviewQuery = createQuery(reviewSchema, {
  locale: "en-US",
  timeZone: "UTC",
  builder: {
    join: "and",
    rules: [{ id: "r1", field: "tags", operator: "set.noneOf", value: ["a"] }],
  },
  sorting: [{ id: "price", desc: false }],
  tabId: "all",
});
const reviewEvaluator = createFilterEvaluator(reviewSchema, reviewQuery, {
  now: 0,
});
assert.equal(reviewEvaluator({ tags: [""] }), false);
assert.equal(reviewEvaluator({ tags: Array(1) }), false);
assert.equal(reviewEvaluator({ tags: ["b"] }), true);
assert.throws(
  () =>
    resolveDateValue(
      { type: "datetime", owner: "builder" },
      { kind: "day", value: "2011-12-30" },
      { locale: "en-US", timeZone: "Pacific/Apia", now: 0 },
    ),
  { name: "ContractError" },
);
hook.deregister();
const { createTableController, useTableweaveQuery } = await import(
  "@tableweave/react"
);
assert.equal(typeof useTableweaveQuery, "function");
const controller = createTableController(
  { schema: reviewSchema, selection: true },
  {
    initial: { query: reviewQuery, selection: { offpage: true } },
    now: () => 0,
    controlled: ["query"],
    onRequest() {},
  },
);
const initialState = controller.getSnapshot();
let notifications = 0;
controller.subscribe(() => {
  notifications++;
});
const result = controller.dispatch({ type: "builder.clear" });
assert.equal(result.status, "proposed");
assert.equal(controller.getSnapshot(), initialState);
controller.accept(result.proposal);
assert.deepEqual(controller.getSnapshot().query.builder.rules, []);
assert.equal(Object.keys(controller.getSnapshot().selection).length, 0);
assert.equal(notifications, 1);
const { createElement } = await import("react");
const { renderToString } = await import("react-dom/server");
function ServerQuery() {
  return createElement(
    "span",
    null,
    useTableweaveQuery(controller).builder.rules.length,
  );
}
assert.equal(renderToString(createElement(ServerQuery)), "<span>1</span>");
for (const slice of ["order", "visibility"]) {
  for (const functional of [false, true]) {
    const columns =
      slice === "order"
        ? { order: ["price", "tags"] }
        : { visibility: { tags: false } };
    const layout = createTableController(
      { schema: reviewSchema, columns: [{ id: "tags" }, { id: "price" }] },
      { initial: { query: reviewQuery, columns }, now: () => 0 },
    );
    const before = layout.getSnapshot();
    let notifications = 0;
    layout.subscribe(() => {
      notifications++;
    });
    assert.throws(
      () =>
        layout.dispatch({
          type: `columns.${slice}`,
          update: functional ? () => null : null,
        }),
      { name: "ControllerError" },
    );
    assert.equal(layout.getSnapshot(), before);
    assert.equal(layout.getSnapshot().revision, 0);
    assert.equal(notifications, 0);
  }
}
await assert.rejects(import("@tableweave/react/src/contracts/index.js"), {
  code: "ERR_PACKAGE_PATH_NOT_EXPORTED",
});
if (process.argv.includes("--styled")) {
  for (const entry of ["@tableweave/heroui", "@tableweave/heroui/sortable"]) {
    assert.deepEqual(Object.keys(await import(entry)), []);
  }
  await assert.rejects(import("@tableweave/heroui/dist/sortable/index.js"), {
    code: "ERR_PACKAGE_PATH_NOT_EXPORTED",
  });
}
