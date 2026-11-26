import assert from "node:assert/strict";
import {
  createNativeColumnHelper,
  createNativeController,
  defineNativeTable,
  useNativeTable,
} from "@tableweave/react";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

const schema = defineQuerySchema({
  id: "packed-native-runtime",
  version: 1,
  fields: {
    amount: { type: "number", owner: "builder", sort: true },
    status: { type: "text", owner: "builder" },
  },
});
const helper = createNativeColumnHelper();
const definition = defineNativeTable({
  schema,
  getRowId: (record) => record.id,
  selection: true,
  columns: helper.columns([
    helper.accessor("amount", { id: "amount" }),
    helper.accessor("status", { id: "status" }),
  ]),
});
const initial = createQuery(schema, {
  locale: "en-US",
  timeZone: "UTC",
  builder: {
    join: "or",
    rules: [
      { id: "one", field: "amount", operator: "number.lt", value: 10 },
      { id: "two", field: "status", operator: "text.is", value: "Y" },
    ],
  },
  sorting: [{ id: "amount", desc: true }],
});
let proposal;
let queryChanges = 0;
const controller = createNativeController(definition, {
  initial: { query: initial },
  now: () => 0,
  controlled: ["query"],
  onRequest(value) {
    proposal = value;
  },
  onQueryChange() {
    queryChanges++;
  },
});
const records = [
  { id: "a", amount: 5, status: "X" },
  { id: "b", amount: 25, status: "Y" },
  { id: "c", amount: 15, status: "X" },
  { id: "d", amount: 35, status: "Z" },
];
let input = { mode: "client", records };
let view;
function NativeServer() {
  view = useNativeTable(definition, controller, input);
  return createElement("span", null, view.rows.map((row) => row.id).join(","));
}
assert.equal(renderToString(createElement(NativeServer)), "<span>b,a</span>");
assert.deepEqual(
  view.visibleColumns.map((column) => column.id),
  ["amount", "status"],
);
assert.equal("reset" in view.native, false);
assert.equal("setOptions" in view.native, false);
assert.equal("set" in view.native.atoms.rowSelection, false);
const before = controller.getSnapshot();
view.native.setSorting([{ id: "amount", desc: false }]);
assert.equal(controller.getSnapshot(), before);
assert.equal(queryChanges, 0);
assert(proposal);
controller.reject(proposal);
assert.equal(renderToString(createElement(NativeServer)), "<span>b,a</span>");
view.native.setSorting([{ id: "amount", desc: false }]);
controller.accept(proposal);
assert.equal(queryChanges, 1);
assert.deepEqual(controller.getSnapshot().query.sorting, [
  { id: "amount", desc: false },
]);
// The server snapshot is deliberately pinned to the serialized initial state.
// Mounted browser fixtures, not repeated bare SSR, prove reactive accepted reads.
assert.equal(renderToString(createElement(NativeServer)), "<span>b,a</span>");

// A supplied partial server page deliberately violates local criteria and order.
input = {
  mode: "server",
  records: [records[3], records[2]],
  pageInfo: { kind: "unknown", hasNextPage: false },
};
assert.equal(renderToString(createElement(NativeServer)), "<span>d,c</span>");
assert.equal(view.pagination.canNextPage, false);
assert.equal(view.pagination.pageCount, null);
assert.equal(view.pagination.pageInfo.kind, "unknown");
controller.dispose();
console.log(
  "Packed native SSR/client/manual/controlled-boundary probes passed.",
);
