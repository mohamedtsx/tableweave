import { memo, useEffect, useRef, useState } from "react";
import { NativeCollection } from "../../../packages/heroui/src/table/native-collection.js";
import {
  createQuery,
  defineQuerySchema,
} from "../../../packages/react/src/contracts/index.js";
import type { StateProposal } from "../../../packages/react/src/controller/types.js";
import type {
  NativeCell,
  NativeColumn,
  NativeInput,
  NativeRow,
  NativeTableHandle,
} from "../../../packages/react/src/tanstack/index.js";
import {
  createNativeController,
  defineNativeTable,
  useNativeTable,
} from "../../../packages/react/src/tanstack/index.js";

interface Inventory {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  location: string;
  eligible: boolean;
}
const schema = defineQuerySchema({
  id: "grouped-native-browser",
  version: 1,
  sorting: { multi: true },
  pagination: { defaultSize: 2, sizes: [2, 10] },
  fields: {
    name: { type: "text", owner: "builder", sort: true },
    quantity: { type: "number", owner: "builder", sort: true },
    location: { type: "text", owner: "builder" },
    sku: { type: "text", owner: "none" },
  },
});
const records: readonly Inventory[] = [
  {
    id: "a",
    name: "Alpha",
    sku: "A-01",
    quantity: 2,
    location: "West",
    eligible: true,
  },
  {
    id: "b",
    name: "Beta",
    sku: "B-02",
    quantity: 1,
    location: "East",
    eligible: false,
  },
  {
    id: "d",
    name: "Delta",
    sku: "D-04",
    quantity: 1,
    location: "East",
    eligible: true,
  },
  {
    id: "c",
    name: "Gamma",
    sku: "C-03",
    quantity: 2,
    location: "North",
    eligible: true,
  },
  {
    id: "e",
    name: "Epsilon",
    sku: "E-05",
    quantity: 3,
    location: "West",
    eligible: true,
  },
  {
    id: "f",
    name: "Zeta",
    sku: "F-06",
    quantity: 3,
    location: "South",
    eligible: true,
  },
];
const definition = defineNativeTable<typeof schema, Inventory>({
  schema,
  selection: true,
  multiSort: true,
  getRowId: (record) => record.id,
  isRowSelectable: (record) => record.eligible,
  columns: [
    { id: "selection", header: "Selection", meta: { utility: true } },
    {
      id: "identity",
      header: "Identity",
      columns: [
        {
          id: "name",
          header: "Name",
          accessorKey: "name",
          enableHiding: false,
          meta: { rowHeader: true },
          cell: (context) => <strong>{String(context.getValue())}</strong>,
        },
        { id: "sku", header: "SKU", accessorKey: "sku" },
      ],
    },
    {
      id: "stock",
      header: "Stock",
      columns: [
        {
          id: "metrics",
          header: "Metrics",
          columns: [
            {
              id: "quantity",
              header: "Quantity",
              accessorKey: "quantity",
              sortDescFirst: false,
            },
          ],
        },
        { id: "location", header: "Location", accessorKey: "location" },
      ],
    },
  ],
});
let hold = false;
let pending: StateProposal<typeof schema> | undefined;
const controller = createNativeController(definition, {
  initial: {
    query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
    selection: { offpage: true },
  },
  controlled: ["query", "selection", "columns"],
  now: () => 0,
  onRequest: (proposal) => {
    pending = proposal;
    if (!hold)
      queueMicrotask(() => {
        controller.accept(proposal);
        if (pending === proposal) pending = undefined;
      });
  },
});
const columnTextValue = (column: NativeColumn<Inventory>) =>
  typeof column.columnDef.header === "string"
    ? column.columnDef.header
    : column.id;
const rowTextValue = (row: NativeRow<Inventory>) => row.original.name;
const cellTextValue = (cell: NativeCell<Inventory>) =>
  String(cell.getValue() ?? "");

function SortValue({ value }: { readonly value: string }) {
  const ref = useRef<HTMLOutputElement>(null);
  const effects = useRef(0);
  useEffect(() => {
    effects.current++;
    ref.current?.setAttribute("data-effects", String(effects.current));
  }, [value]);
  return (
    <output ref={ref} aria-label="Subscribed sorting">
      {value || "none"}
    </output>
  );
}
const SortProbe = memo(function SortProbe({
  native,
}: {
  readonly native: NativeTableHandle<Inventory>;
}) {
  return (
    <native.Subscribe
      source={native.atoms.sorting}
      selector={(sorting) =>
        sorting.map((sort) => `${sort.id}:${sort.desc}`).join(",")
      }
    >
      {(value) => <SortValue value={value} />}
    </native.Subscribe>
  );
});

export function NativeFixture() {
  const [input, setInput] = useState<NativeInput<Inventory>>({
    mode: "client",
    records,
  });
  const [held, setHeld] = useState(false);
  const [unrelated, setUnrelated] = useState(0);
  const view = useNativeTable(definition, controller, input);
  const [filteredIds, setFilteredIds] = useState("");
  useEffect(() => {
    // The stable handle intentionally exposes committed frames, not speculative
    // render models. This test-only diagnostic reads after commit; input changes
    // are explicit dependencies because native state subscriptions omit records.
    setFilteredIds(
      view.native
        .getFilteredRowModel()
        .rows.map((row) => row.id)
        .join(","),
    );
  }, [view.native, view.state, input]);
  function setBuilder(repeated: boolean) {
    controller.dispatch({
      type: "query.replace",
      update: (query) => ({
        ...query,
        builder: {
          join: "or",
          rules: repeated
            ? [
                {
                  id: "low",
                  field: "quantity",
                  operator: "number.lt",
                  value: 2,
                },
                {
                  id: "high",
                  field: "quantity",
                  operator: "number.gt",
                  value: 2,
                },
              ]
            : [
                {
                  id: "low",
                  field: "quantity",
                  operator: "number.lt",
                  value: 2,
                },
                {
                  id: "west",
                  field: "location",
                  operator: "text.is",
                  value: "West",
                },
              ],
        },
      }),
    });
  }
  return (
    <main>
      <h1>Native grouped bridge</h1>
      <nav aria-label="Native fixture controls">
        <button type="button" onClick={() => setBuilder(false)}>
          Cross-field Any
        </button>
        <button type="button" onClick={() => setBuilder(true)}>
          Repeated-field Any
        </button>
        <button
          type="button"
          onClick={() => controller.dispatch({ type: "builder.clear" })}
        >
          Clear builder
        </button>
        <button
          type="button"
          onClick={() => {
            hold = !held;
            setHeld(!held);
          }}
          aria-pressed={held}
        >
          Hold native proposals
        </button>
        <button
          type="button"
          onClick={() => {
            if (pending) {
              controller.accept(pending);
              pending = undefined;
            }
          }}
        >
          Accept native proposal
        </button>
        <button
          type="button"
          onClick={() => {
            if (pending) {
              controller.reject(pending);
              pending = undefined;
            }
          }}
        >
          Reject native proposal
        </button>
        <button
          type="button"
          onClick={() => view.nextPage()}
          disabled={!view.pagination.canNextPage}
        >
          Native next page
        </button>
        <button
          type="button"
          onClick={() => view.previousPage()}
          disabled={!view.pagination.canPreviousPage}
        >
          Native previous page
        </button>
        <button
          type="button"
          onClick={() =>
            view.native.setPagination((previous) => ({
              ...previous,
              pageSize: 10,
            }))
          }
        >
          Native page size 10
        </button>
        <button
          type="button"
          onClick={() =>
            view.native.setColumnVisibility((previous) => ({
              ...previous,
              sku: previous.sku === false,
            }))
          }
        >
          Native toggle SKU
        </button>
        <button
          type="button"
          onClick={() =>
            view.native.setColumnVisibility((previous) => ({
              ...previous,
              quantity: previous.quantity === false,
              location: previous.location === false,
            }))
          }
        >
          Native toggle stock
        </button>
        <button
          type="button"
          onClick={() =>
            view.native.setColumnOrder((previous) => [
              "selection",
              "sku",
              "name",
              ...previous.filter(
                (id) => !["selection", "sku", "name"].includes(id),
              ),
            ])
          }
        >
          Native reorder identity
        </button>
        <button
          type="button"
          onClick={() =>
            setInput((previous) => ({
              ...previous,
              records: previous.records.map((record) =>
                record.id === "a"
                  ? { ...record, name: "Alpha refreshed", quantity: 8 }
                  : record,
              ),
            }))
          }
        >
          Native data refresh
        </button>
        <button
          type="button"
          onClick={() =>
            setInput({
              mode: "server",
              records: [records[5], records[0], records[2]].filter(
                (record): record is Inventory => record !== undefined,
              ),
              pageInfo: { kind: "unknown", hasNextPage: false },
            })
          }
        >
          Use server page
        </button>
        <button
          type="button"
          onClick={() =>
            setInput((previous) =>
              previous.mode === "server"
                ? {
                    ...previous,
                    pageInfo: { kind: "unknown", hasNextPage: true },
                  }
                : previous,
            )
          }
        >
          Server has next
        </button>
        <button
          type="button"
          onClick={() =>
            setInput((previous) =>
              previous.mode === "server"
                ? { ...previous, pageInfo: { kind: "known", total: 17 } }
                : previous,
            )
          }
        >
          Server known total
        </button>
        <button
          type="button"
          onClick={() => setInput({ mode: "client", records })}
        >
          Use complete client records
        </button>
        <button
          type="button"
          onClick={() =>
            view.native.setRowSelection((previous) => ({
              ...previous,
              a: true,
              offpage: true,
            }))
          }
        >
          Native select Alpha
        </button>
        <button type="button" onClick={() => view.cancelSelection()}>
          Native clear selection
        </button>
        <button type="button" onClick={() => setUnrelated(unrelated + 1)}>
          Unrelated native owner render
        </button>
      </nav>
      <NativeCollection
        view={view}
        label="Native grouped inventory"
        rowHeaderColumnId="name"
        selectionColumnId="selection"
        columnTextValue={columnTextValue}
        rowTextValue={rowTextValue}
        cellTextValue={cellTextValue}
      />
      <SortProbe native={view.native} />
      <output aria-label="Native row IDs">
        {view.rows.map((row) => row.id).join(",")}
      </output>
      <output aria-label="Native filtered IDs">{filteredIds}</output>
      <output aria-label="Native visible columns">
        {view.visibleColumns.map((column) => column.id).join(",")}
      </output>
      <output aria-label="Native accepted selected IDs">
        {view.selectedIds.join(",")}
      </output>
      <output aria-label="Native page metadata">
        {input.mode}/{view.state.query.pagination.pageIndex}/
        {view.state.query.pagination.pageSize}/{view.pagination.pageInfo.kind}/
        {view.pagination.pageInfo.kind === "known"
          ? view.pagination.pageInfo.total
          : String(view.pagination.pageInfo.hasNextPage)}
      </output>
      <output aria-label="Native builder rule count">
        {view.state.query.builder.rules.length}
      </output>
      <output aria-label="Native state revision">{view.state.revision}</output>
      <output aria-label="Unrelated native render count">{unrelated}</output>
    </main>
  );
}
