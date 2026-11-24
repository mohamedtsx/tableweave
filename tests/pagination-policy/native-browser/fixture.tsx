import { StrictMode, useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import { NativeCollection } from "../../../packages/heroui/src/table/native-collection.js";
import {
  createQuery,
  defineQuerySchema,
} from "../../../packages/react/src/contracts/index.js";
import { ControllerError } from "../../../packages/react/src/controller/validation.js";
import { createNativeAdapter } from "../../../packages/react/src/tanstack/adapter.js";
import type {
  NativeCell,
  NativeColumn,
  NativeRow,
  NativeSelectionMode,
  NativeTableView,
} from "../../../packages/react/src/tanstack/index.js";
import {
  createNativeColumnHelper,
  createNativeController,
  defineNativeTable,
  NativeBridgeError,
  useNativeTable,
} from "../../../packages/react/src/tanstack/index.js";
import "./fixture.css";
import "@heroui/styles/css";
import "../../../packages/heroui/src/styles.css";
import "../../controls/pagination/fixture.css";

export interface Item {
  id: string;
  amount: number;
  title: string;
  code: string;
  eligible: boolean;
}
const params = new URLSearchParams(location.search);
const policy = params.get("policy") ?? "false";
const count = Number(params.get("count") ?? 173);
const selection: NativeSelectionMode =
  params.get("selection") === "false"
    ? false
    : params.get("selection") === "single"
      ? "single"
      : "multiple";
const schema = defineQuerySchema({
  id: "native-browser-client",
  version: 1,
  fields: {
    amount: { type: "number", owner: "builder", sort: true },
    title: { type: "text", owner: "search", sort: true },
  },
  sorting: { multi: true },
  pagination: {
    ...(policy === "omitted" ? {} : { enabled: policy === "true" }),
    ...(params.has("custom") ? { defaultSize: 7, sizes: [7, 19, 100] } : {}),
  },
});
// Application-owned mutable records and stable genuine owner pair, outside render.
const records: Item[] = Array.from({ length: count }, (_, index) => ({
  id: `r${String(index).padStart(3, "0")}`,
  amount: index % 7,
  title: `label-${String(count - 1 - index).padStart(3, "0")}`,
  code: `code-${index}`,
  eligible: index % 4 !== 0,
}));
const originalJSON = JSON.stringify(records);
const originals = [...records];
let rowIdCalls = 0;
const columnHelper = createNativeColumnHelper<Item>();
const definition = defineNativeTable<typeof schema, Item>({
  schema,
  selection,
  multiSort: true,
  getRowId: (row) => {
    rowIdCalls++;
    return row.id;
  },
  isRowSelectable: (row) => row.eligible,
  columns: [
    { id: "selection", header: "Selection", meta: { utility: true } },
    {
      id: "identity",
      header: "Identity",
      columns: [
        {
          id: "title",
          header: "Title",
          accessorKey: "title",
          enableHiding: false,
          meta: { rowHeader: true },
          cell: (context) => <strong>{String(context.getValue())}</strong>,
        },
        { id: "code", header: "Code", accessorKey: "code" },
      ],
    },
    {
      id: "metrics",
      header: "Metrics",
      columns: columnHelper.columns([
        columnHelper.accessor("amount", {
          id: "amount",
          header: "Amount",
          sortDescFirst: false,
          cell: (context) => {
            const amount: number = context.getValue();
            return amount;
          },
        }),
      ]),
    },
  ],
});
const counters = { updater: 0, command: 0, state: 0, commit: 0, query: 0 };
const controller = createNativeController(definition, {
  initial: {
    query: createQuery(schema, {
      locale: "en-US",
      timeZone: "UTC",
      builder: {
        join: "and",
        rules: [
          { id: "positive", field: "amount", operator: "number.gte", value: 1 },
        ],
      },
      sorting: [
        { id: "amount", desc: true },
        { id: "title", desc: false },
      ],
    }),
    ...(selection === "multiple" ? { selection: { offscreen: true } } : {}),
  },
  now: () => 0,
  validateCommand: () => {
    counters.command++;
  },
  validateState: () => {
    counters.state++;
  },
  onCommit: () => {
    counters.commit++;
  },
  onQueryChange: () => {
    counters.query++;
  },
});
type View = NativeTableView<typeof schema, Item>;
let committed: View | undefined;
let saved: View | undefined;
let commits = 0;
function current() {
  if (!committed) throw new Error("Fixture has no committed native view");
  return committed;
}
// Only expected library denials are normalized. Unexpected exceptions propagate
// into Playwright/pageerror; they cannot silently become successful negatives.
function denial(action: () => void) {
  try {
    action();
    return "accepted";
  } catch (error) {
    if (error instanceof NativeBridgeError || error instanceof ControllerError)
      return error.code;
    throw error;
  }
}
export const port = {
  observe() {
    const view = current();
    return {
      commits,
      rows: view.rows.map((row) => row.id),
      nativeRows: view.native.getRowModel().rows.map((row) => row.id),
      sameRows: view.rows === view.native.getRowModel().rows,
      selected: view.selectedIds,
      loadedSelected: view.rows
        .filter((row) => row.getIsSelected())
        .map((row) => row.id),
      eligible: view.pageSelection.eligibleIds,
      columns: view.visibleColumns.map((column) => column.id),
      pagination: view.pagination,
      pair: view.state.query.pagination,
      sorting: view.state.query.sorting,
      revision: view.state.revision,
      originalsRetained: view.rows.every((row) =>
        originals.includes(row.original),
      ),
      unchanged:
        JSON.stringify(records) === originalJSON &&
        records.every((row, index) => row === originals[index]),
      mutable:
        !Object.isFrozen(records) &&
        records.every((row) => !Object.isFrozen(row)),
      selectionMode: view.selectionMode,
    };
  },
  denyPaging() {
    const before = controller.getSnapshot();
    const view = current();
    for (const key of Object.keys(counters) as (keyof typeof counters)[])
      counters[key] = 0;
    const codes = [
      denial(() => view.previousPage()),
      denial(() => view.nextPage()),
      denial(() =>
        view.native.setPagination((previous) => {
          counters.updater++;
          return { ...previous, pageIndex: 1 };
        }),
      ),
    ];
    return {
      codes,
      counters: { ...counters },
      sameState: before === controller.getSnapshot(),
    };
  },
  save() {
    saved = current();
  },
  savedActions() {
    const view = saved;
    if (!view) throw new Error("No saved native view");
    const before = controller.getSnapshot();
    const codes = [
      denial(() => view.nextPage()),
      denial(() => view.selectPage(true)),
    ];
    return { codes, sameState: before === controller.getSnapshot() };
  },
  dispose() {
    controller.dispose();
  },
  disposedActions() {
    const before = controller.getSnapshot();
    const view = current();
    let updater = 0;
    const codes = [
      denial(() => view.nextPage()),
      denial(() => view.previousPage()),
      denial(() =>
        view.native.setPagination((previous) => {
          updater++;
          return previous;
        }),
      ),
    ];
    return { codes, updater, sameState: before === controller.getSnapshot() };
  },
  denyOrdinaryServer() {
    const adapter = createNativeAdapter(definition, controller);
    const before = controller.getSnapshot();
    rowIdCalls = 0;
    const code = denial(() => {
      adapter.getOptions({
        mode: "server",
        records,
        pageInfo: { kind: "known", total: records.length },
      });
    });
    return { code, rowIdCalls, sameState: before === controller.getSnapshot() };
  },
};
declare global {
  interface Window {
    nativeBrowser: typeof port;
  }
}
window.nativeBrowser = port;
const columnText = (column: NativeColumn<Item>) =>
  typeof column.columnDef.header === "string"
    ? column.columnDef.header
    : column.id;
const rowText = (row: NativeRow<Item>) => row.original.title;
const cellText = (cell: NativeCell<Item>) => String(cell.getValue() ?? "");
function Fixture() {
  const view = useNativeTable(definition, controller, {
    mode: "client",
    records,
  });
  useLayoutEffect(() => {
    committed = view;
    commits++;
  }, [view]);
  return (
    <main>
      <h1>Native source browser fixture</h1>
      <nav aria-label="Application test controls">
        <button
          type="button"
          onClick={() => controller.dispatch({ type: "builder.clear" })}
        >
          Clear builder
        </button>
        <button
          type="button"
          onClick={() =>
            controller.dispatch({
              type: "query.replace",
              update: (query) => ({
                ...query,
                builder: {
                  join: "and",
                  rules: [
                    {
                      id: "positive",
                      field: "amount",
                      operator: "number.gte",
                      value: 1,
                    },
                  ],
                },
              }),
            })
          }
        >
          Apply positive filter
        </button>
        <button
          type="button"
          onClick={() =>
            controller.dispatch({ type: "sorting.change", update: [] })
          }
        >
          Clear sorting
        </button>
        <button
          type="button"
          onClick={() =>
            view.native.setColumnVisibility({ code: false, amount: false })
          }
        >
          Hide grouped leaves
        </button>
        <button
          type="button"
          onClick={() =>
            view.native.setColumnOrder(["selection", "code", "title", "amount"])
          }
        >
          Reorder leaves
        </button>
        {view.pagination.enabled ? (
          <>
            <button
              type="button"
              disabled={!view.pagination.canNextPage}
              onClick={() => view.nextPage()}
            >
              Native next page
            </button>
            <button
              type="button"
              disabled={!view.pagination.canPreviousPage}
              onClick={() => view.previousPage()}
            >
              Native previous page
            </button>
          </>
        ) : null}
      </nav>
      <NativeCollection
        view={view}
        label="Native client inventory"
        rowHeaderColumnId="title"
        selectionColumnId="selection"
        columnTextValue={columnText}
        rowTextValue={rowText}
        cellTextValue={cellText}
      />
      <output aria-label="Accepted row IDs">
        {view.rows.map((row) => row.id).join(",")}
      </output>
      <output aria-label="Accepted selected IDs">
        {view.selectedIds.join(",")}
      </output>
      <output aria-label="Accepted sorting">
        {view.state.query.sorting
          .map((sort) => `${sort.id}:${sort.desc}`)
          .join(",")}
      </output>
    </main>
  );
}
const element = document.getElementById("root");
if (!element) throw new Error("Missing fixture root");
createRoot(element).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
