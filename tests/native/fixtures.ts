import { createRequire } from "node:module";
import {
  constructTable,
  type RowData,
  type TableOptions,
} from "../../packages/react/node_modules/@tanstack/react-table/dist/index.js";
import {
  createQuery,
  defineQuerySchema,
} from "../../packages/react/src/contracts/index.js";
import { createNativeAdapter } from "../../packages/react/src/tanstack/adapter.js";
import {
  createNativeController,
  defineNativeTable,
  type NativeControllerOptions,
  type NativeFeatures,
  type NativeInput,
} from "../../packages/react/src/tanstack/index.js";

// Resolve exactly the installed core matching the pinned React adapter; main
// declares that same core release as the native boundary's runtime dependency.
const vendor = createRequire(
  new URL("../../packages/react/package.json", import.meta.url),
);
const core = createRequire(vendor.resolve("@tanstack/react-table"));
const bindings = core("@tanstack/table-core/store-reactivity-bindings") as {
  storeReactivityBindings(): NonNullable<
    Parameters<typeof constructTable>[0]["features"]["coreReactivityFeature"]
  >;
};
export function constructNativeFixture<T extends RowData>(
  options: TableOptions<NativeFeatures, T>,
) {
  return constructTable<NativeFeatures, T>({
    ...options,
    features: Object.assign({}, options.features, {
      coreReactivityFeature: bindings.storeReactivityBindings(),
    }),
  });
}
export interface RecordRow {
  id: string;
  amount: number;
  title: string;
  category: string;
  eligible: boolean;
}
export const schema = defineQuerySchema({
  id: "native-fixture",
  version: 1,
  sorting: { multi: true },
  pagination: { defaultSize: 2, sizes: [2, 10, 25, 50, 100] },
  fields: {
    amount: { type: "number", owner: "builder", sort: true },
    title: { type: "text", owner: "search", sort: true },
    category: { type: "text", owner: "builder" },
  },
});
export const records: readonly RecordRow[] = [
  { id: "a", amount: 30, title: "alpha", category: "one", eligible: true },
  { id: "b", amount: 10, title: "beta", category: "two", eligible: false },
  { id: "c", amount: 20, title: "gamma", category: "one", eligible: true },
  { id: "d", amount: 40, title: "delta", category: "two", eligible: true },
];
export function definition(multiSort = false) {
  return defineNativeTable<typeof schema, RecordRow>({
    schema,
    getRowId: (row) => row.id,
    selection: true,
    multiSort,
    isRowSelectable: (row) => row.eligible,
    columns: [
      { id: "selection", header: "Select", meta: { utility: true } },
      {
        id: "data",
        header: "Data",
        columns: [
          { id: "title", accessorKey: "title", meta: { rowHeader: true } },
          { id: "amount", accessorKey: "amount" },
          { id: "category", accessorKey: "category" },
        ],
      },
    ],
  });
}
export function initial() {
  return createQuery(schema, {
    locale: "en-US",
    timeZone: "UTC",
    pagination: { pageIndex: 0, pageSize: 2 },
  });
}
export function fixture(
  options: Partial<NativeControllerOptions<typeof schema>> = {},
  multiSort = false,
) {
  const def = definition(multiSort);
  const controller = createNativeController(def, {
    initial: { query: initial() },
    now: () => 0,
    ...options,
  });
  const adapter = createNativeAdapter(def, controller);
  let input: NativeInput<RecordRow> = { mode: "client", records };
  const optionsFor = () => adapter.getOptions(input);
  const optionsAtMount = optionsFor();
  const table = constructNativeFixture(optionsAtMount);
  adapter.bindTable(table);
  const sync = (next?: NativeInput<RecordRow>) => {
    if (next) input = next;
    table.setOptions(adapter.getOptions(input));
  };
  return { def, controller, adapter, table, sync, optionsFor };
}
export type FixtureOptions = TableOptions<NativeFeatures, RecordRow>;
