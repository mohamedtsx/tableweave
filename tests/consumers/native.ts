import {
  createNativeColumnHelper,
  createNativeController,
  defineNativeTable,
  type NativeInput,
  type NativeTableHandle,
  useNativeTable,
} from "@tableweave/react";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";

interface RecordValue {
  id: string;
  amount: number;
  nested: { label: string };
}
const schema = defineQuerySchema({
  id: "packed-native",
  version: 1,
  fields: { amount: { type: "number", owner: "builder", sort: true } },
});
const helper = createNativeColumnHelper<RecordValue>();
const definition = defineNativeTable({
  schema,
  getRowId: (record: RecordValue) => record.id,
  columns: helper.columns([
    helper.accessor("amount", {
      id: "amount",
      cell(info) {
        const value: number = info.getValue();
        // @ts-expect-error Native accessor cell values retain their numeric type.
        const invalid: string = info.getValue();
        void invalid;
        return value.toFixed(2);
      },
      header(info) {
        return info.column.id;
      },
    }),
    helper.accessor((record) => record.nested.label, {
      id: "label",
      cell(info) {
        const value: string = info.getValue();
        const record: RecordValue = info.row.original;
        return `${record.id}:${value}`;
      },
    }),
  ]),
});
const controller = createNativeController(definition, {
  initial: { query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }) },
  now: () => 0,
});
export function PackedNative() {
  const view = useNativeTable(definition, controller, {
    mode: "client",
    records: [],
  });
  const value: number | undefined = view.rows[0]?.original.amount;
  const native: NativeTableHandle<RecordValue> = view.native;
  native.setSorting([{ id: "amount", desc: false }]);
  // @ts-expect-error Whole-table resets must not bypass the coordinator.
  native.reset();
  // @ts-expect-error Managed options are not a native escape hatch.
  native.setOptions({ manualFiltering: false });
  // @ts-expect-error Native atoms are readonly subscription sources.
  native.atoms.rowSelection.set({ unsafe: true });
  return { value, native };
}
// @ts-expect-error Server pages require explicit known/unknown metadata.
export const noMetadata: NativeInput<RecordValue> = {
  mode: "server",
  records: [],
};

// @ts-expect-error Internal adapter seams are not exported subpaths.
import "@tableweave/react/tanstack/adapter";
