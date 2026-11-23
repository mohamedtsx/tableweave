import { createElement, memo, StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createQuery,
  defineQuerySchema,
} from "../../packages/react/src/contracts/index.js";
import type { StateProposal } from "../../packages/react/src/controller/types.js";
import {
  createNativeController,
  defineNativeTable,
  type NativeTableHandle,
  useNativeTable,
} from "../../packages/react/src/tanstack/index.js";

interface FixtureRow {
  id: string;
  amount: number;
  label: string;
}
const schema = defineQuerySchema({
  id: "native-browser",
  version: 1,
  sorting: { multi: true },
  fields: {
    amount: { type: "number", owner: "builder", sort: true },
    label: { type: "text", owner: "search", sort: true },
  },
});
const definition = defineNativeTable<typeof schema, FixtureRow>({
  schema,
  selection: true,
  multiSort: true,
  getRowId: (record) => record.id,
  columns: [
    {
      id: "info",
      header: "Info",
      columns: [
        { id: "label", accessorKey: "label", meta: { rowHeader: true } },
        { id: "amount", accessorKey: "amount" },
      ],
    },
  ],
});
let proposal: StateProposal<typeof schema> | undefined;
let queryNotifications = 0;
const controller = createNativeController(definition, {
  initial: { query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }) },
  controlled: ["query"],
  now: () => 0,
  onRequest: (next) => {
    proposal = next;
  },
  onQueryChange: () => {
    queryNotifications++;
  },
});
const initialRecords: readonly FixtureRow[] = [
  { id: "a", amount: 30, label: "alpha" },
  { id: "b", amount: 10, label: "beta" },
];
let selectionEffects = 0;
let sortingEffects = 0;
function EffectValue({
  value,
  kind,
}: {
  value: unknown;
  kind: "selection" | "sorting";
}) {
  useEffect(() => {
    if (kind === "selection") selectionEffects++;
    else sortingEffects++;
    const target = document.getElementById(`${kind}-effect`);
    if (target)
      target.textContent = String(
        kind === "selection" ? selectionEffects : sortingEffects,
      );
  }, [value, kind]);
  return null;
}
// Stable native atom/store handles are passed deliberately. Subscribe is INSIDE
// these memoized leaves; parent rerenders cannot masquerade as leaf reactivity.
const SelectionLeaf = memo(
  ({ native }: { native: NativeTableHandle<FixtureRow> }) =>
    createElement(native.Subscribe<Record<string, true>, boolean>, {
      source: native.atoms.rowSelection,
      selector: (selection: Record<string, true>) => selection.a === true,
      children: (selected: boolean) =>
        createElement(
          "div",
          null,
          createElement("output", { id: "selected-a" }, String(selected)),
          createElement(EffectValue, { kind: "selection", value: selected }),
        ),
    }),
);
const SortLeaf = memo(({ native }: { native: NativeTableHandle<FixtureRow> }) =>
  createElement(native.Subscribe<{ id: string; desc: boolean }[], string>, {
    source: native.atoms.sorting,
    selector: (sorting: { id: string; desc: boolean }[]) =>
      sorting.map((sort) => `${sort.id}:${sort.desc}`).join(","),
    children: (sorting: string) =>
      createElement(
        "div",
        null,
        createElement("output", { id: "sort-value" }, sorting),
        createElement(EffectValue, { kind: "sorting", value: sorting }),
      ),
  }),
);

function Fixture() {
  const [records, setRecords] = useState(initialRecords);
  const [hasNextPage, setHasNextPage] = useState(false);
  const view = useNativeTable(definition, controller, {
    mode: "server",
    records,
    pageInfo: { kind: "unknown", hasNextPage },
  });
  const button = (id: string, action: () => void) =>
    createElement("button", { id, type: "button", onClick: action }, id);
  return createElement(
    "main",
    null,
    createElement(SelectionLeaf, { native: view.native }),
    createElement(SortLeaf, { native: view.native }),
    createElement("output", { id: "selection-effect" }),
    createElement("output", { id: "sorting-effect" }),
    createElement(
      "output",
      { id: "rows" },
      view.rows.map((row) => row.id).join(","),
    ),
    createElement(
      "output",
      { id: "next-available" },
      String(view.pagination.canNextPage),
    ),
    createElement(
      "output",
      { id: "page" },
      String(view.state.query.pagination.pageIndex),
    ),
    createElement(
      "output",
      { id: "notifications" },
      String(queryNotifications),
    ),
    button("select-a", () =>
      view.native.setRowSelection({ a: true, offpage: true }),
    ),
    button("cancel-selection", () => {
      view.cancelSelection();
    }),
    button("sort", () =>
      view.native.setSorting([{ id: "amount", desc: false }]),
    ),
    button("accept", () => {
      if (proposal) controller.accept(proposal);
    }),
    button("reject", () => {
      if (proposal) controller.reject(proposal);
    }),
    button("refresh", () =>
      setRecords([{ id: "fresh", amount: 1, label: "fresh" }]),
    ),
    button("allow-next", () => setHasNextPage(true)),
    button("next", () => view.nextPage()),
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(
  createElement(StrictMode, null, createElement(Fixture)),
);
