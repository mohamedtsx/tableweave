import { defineQuerySchema } from "../../packages/react/src/contracts/index.js";
import {
  createNativeColumnHelper,
  defineNativeTable,
  type NativeTableHandle,
} from "../../packages/react/src/tanstack/index.js";

interface SyntheticRow {
  id: string;
  amount: number;
  nested: { label: string };
}
const helper = createNativeColumnHelper<SyntheticRow>();
const columns = helper.columns([
  helper.accessor("amount", {
    id: "amount",
    cell(info) {
      const amount: number = info.getValue();
      // @ts-expect-error accessor values remain numeric in native contexts
      const incorrect: string = info.getValue();
      void incorrect;
      return amount.toFixed(2);
    },
    header(info) {
      const columnId: string = info.column.id;
      return columnId;
    },
  }),
  helper.accessor((record) => record.nested.label, {
    id: "label",
    cell(info) {
      const value: string = info.getValue();
      const record: SyntheticRow = info.row.original;
      return `${record.id}:${value}`;
    },
  }),
]);
const schema = defineQuerySchema({
  id: "native-type-fixture",
  version: 1,
  fields: { amount: { type: "number", owner: "builder", sort: true } },
});
export const definition = defineNativeTable({
  schema,
  columns,
  getRowId: (record: SyntheticRow) => record.id,
  evaluation: {
    accessors: {
      amount: (record) => record.amount,
    },
  },
});
function supported(handle: NativeTableHandle<SyntheticRow>) {
  handle.setSorting([{ id: "amount", desc: false }]);
  // @ts-expect-error no whole-table reset bypass
  handle.reset();
  // @ts-expect-error managed options cannot be overwritten
  handle.setOptions({ manualFiltering: false });
  // @ts-expect-error writable atoms are not a supported public surface
  handle.baseAtoms.rowSelection.set({ unsafe: true });
  // @ts-expect-error readonly native atom cannot be written
  handle.atoms.rowSelection.set({ unsafe: true });
  const selectionAtom = handle.atoms.rowSelection;
  // @ts-expect-error native readonly atom slots cannot be replaced
  handle.atoms.rowSelection = selectionAtom;
}
void supported;
