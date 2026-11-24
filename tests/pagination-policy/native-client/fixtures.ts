import { canonicalJson } from "../../../packages/react/src/contracts/json.js";
import { createQuery } from "../../../packages/react/src/contracts/query.js";
import { defineQuerySchema } from "../../../packages/react/src/contracts/schema.js";
import { createNativeAdapter } from "../../../packages/react/src/tanstack/adapter.js";
import { createNativeBoundary } from "../../../packages/react/src/tanstack/boundary.js";
import {
  createNativeController,
  defineNativeTable,
} from "../../../packages/react/src/tanstack/definition.js";
import type {
  NativeControllerOptions,
  NativeInput,
  NativeSelectionMode,
} from "../../../packages/react/src/tanstack/types.js";

export interface Item {
  id: string;
  amount: number;
  title: string;
  eligible: boolean;
}
export const records: Item[] = Array.from({ length: 173 }, (_, index) => ({
  id: `r${String(index).padStart(3, "0")}`,
  amount: index % 7,
  title: `label-${String(172 - index).padStart(3, "0")}`,
  eligible: index % 4 !== 0,
}));
export const expected = (rows: readonly Item[]) =>
  rows
    .filter((row) => row.amount >= 1)
    .sort((a, b) => b.amount - a.amount || a.title.localeCompare(b.title))
    .map((row) => row.id);
export function schemaFor(enabled?: boolean, custom = false) {
  return defineQuerySchema({
    id: "u2-native-client",
    version: 1,
    fields: {
      amount: { type: "number", owner: "builder", sort: true },
      title: { type: "text", owner: "search", sort: true },
    },
    sorting: { multi: true },
    pagination: {
      ...(enabled === undefined ? {} : { enabled }),
      ...(custom ? { defaultSize: 7, sizes: [7, 19, 100] } : {}),
    },
  });
}
export type S = ReturnType<typeof schemaFor>;
export function setup(
  enabled?: boolean,
  custom = false,
  selection: NativeSelectionMode = "multiple",
  pageIndex = 0,
  extra: Partial<NativeControllerOptions<S>> = {},
) {
  const counts = {
    rowId: 0,
    eligible: 0,
    accessor: 0,
    predicate: 0,
    command: 0,
    state: 0,
    clock: 0,
    request: 0,
    query: 0,
    commit: 0,
    subscriber: 0,
    updater: 0,
  };
  const schema = schemaFor(enabled, custom);
  const definition = defineNativeTable<S, Item>({
    schema,
    selection,
    multiSort: true,
    getRowId(row) {
      counts.rowId++;
      return row.id;
    },
    isRowSelectable(row) {
      counts.eligible++;
      return row.eligible;
    },
    evaluation: {
      accessors: {
        amount(row) {
          counts.predicate++;
          return row.amount;
        },
      },
    },
    columns: [
      { id: "selection", meta: { utility: true } },
      {
        id: "data",
        columns: [
          {
            id: "amount",
            accessorFn(row) {
              counts.accessor++;
              return row.amount;
            },
          },
          { id: "title", accessorKey: "title" },
        ],
      },
    ],
  });
  const controller = createNativeController(definition, {
    initial: {
      query: createQuery(schema, {
        locale: "en-US",
        timeZone: "UTC",
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
        sorting: [
          { id: "amount", desc: true },
          { id: "title", desc: false },
        ],
        pagination: { pageIndex, pageSize: schema.pagination.defaultSize },
      }),
      ...(selection === false ? {} : { selection: { offscreen: true } }),
    },
    now() {
      counts.clock++;
      return 0;
    },
    validateCommand() {
      counts.command++;
    },
    validateState() {
      counts.state++;
    },
    onRequest() {
      counts.request++;
    },
    onQueryChange() {
      counts.query++;
    },
    onCommit() {
      counts.commit++;
    },
    ...extra,
  });
  controller.subscribe(() => {
    counts.subscriber++;
  });
  const adapter = createNativeAdapter(definition, controller);
  const reset = () => {
    for (const key of Object.keys(counts) as (keyof typeof counts)[])
      counts[key] = 0;
  };
  const mount = (input: NativeInput<Item>) => {
    const options = adapter.getOptions(input);
    const boundary = createNativeBoundary(definition, controller);
    const frame = boundary.prepare(input, controller.getSnapshot());
    boundary.commit(frame);
    const table = frame.table,
      native = table;
    // Use this fixture adapter's captured predicate/slices from the first model
    // read, rather than comparing memo identity across two adapter instances.
    table.setOptions(options);
    const view = () => adapter.getView(native, input, controller.getSnapshot());
    return { table, native, options, view, input };
  };
  reset();
  return { schema, definition, controller, adapter, counts, reset, mount };
}
export function observation(
  f: ReturnType<typeof setup>,
  input: NativeInput<Item>,
  mounted?: ReturnType<ReturnType<typeof setup>["mount"]>,
) {
  const m = mounted ?? f.mount(input);
  if (mounted) m.table.setOptions(f.adapter.getOptions(input));
  const view = f.adapter.getView(m.native, input, f.controller.getSnapshot());
  return {
    query: canonicalJson(view.state.query),
    queryIdentity: view.state.queryIdentity,
    rows: view.rows.map((row) => row.id),
    sorted: m.table.getSortedRowModel().rows.map((row) => row.id),
    filtered: m.table.getFilteredRowModel().rows.map((row) => row.id),
    selected: view.selectedIds,
    eligible: view.pageSelection.eligibleIds,
    checked: view.pageSelection.checked,
    mixed: view.pageSelection.mixed,
    pagination: {
      pageInfo: view.pagination.pageInfo,
      pageCount: view.pagination.pageCount,
      canPreviousPage: view.pagination.canPreviousPage,
      canNextPage: view.pagination.canNextPage,
    },
    manual: [
      m.table.options.manualFiltering,
      m.table.options.manualSorting,
      m.table.options.manualPagination,
    ],
    vendorTotals: {
      rowCountOwn: Object.hasOwn(m.table.options, "rowCount"),
      rowCount: m.table.options.rowCount ?? null,
      pageCountOwn: Object.hasOwn(m.table.options, "pageCount"),
      pageCount: m.table.options.pageCount ?? null,
    },
    columns: view.visibleColumns.map((column) => column.id),
    headerGroups: view.headerGroups.map((group) =>
      group.headers.map((header) => header.column.id),
    ),
  };
}
