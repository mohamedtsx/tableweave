import type { DataTableModel, NativeRow } from "@tableweave/react";
import {
  DataTable,
  type DataTableProps,
  type DataTableToolConfigs,
  type DetailsAccessory,
} from "@tableweave/heroui";
// @ts-expect-error NEGATIVE private cell constructor is not a root export
import { createTableRendererCell } from "@tableweave/heroui";
// @ts-expect-error NEGATIVE private details actor is not a root export
import type { DetailsCommitActor } from "@tableweave/heroui";
import type { FilterBuilderProps } from "@tableweave/heroui";
import { collection, type Item, type S } from "./positive.js";

interface Foreign {
  readonly id: string;
  readonly title: number;
}
declare const table: DataTableModel<S, Item>;
declare const foreignAccessory: DetailsAccessory<S, Foreign>;
declare const props: DataTableProps<S, Item>;
// @ts-expect-error NEGATIVE readonly public props
props.table = table;
// @ts-expect-error NEGATIVE actual native callback record type
props.collection.rowTextValue({} as NativeRow<Foreign>);
export const wrongAccessory = (
  <DataTable
    table={table}
    collection={collection}
    // @ts-expect-error NEGATIVE table is the sole record inference anchor
    accessory={foreignAccessory}
  />
);
export const wrongField: DataTableToolConfigs<S> = {
  builder: {
    fields: {
      // @ts-expect-error NEGATIVE search-owned field is not a Builder field
      title: { label: "Wrong owner" },
    },
  },
};
declare const raw: FilterBuilderProps<S>;
// @ts-expect-error NEGATIVE facade defaults do not weaken raw Builder requirements
export const rawWithoutMode: FilterBuilderProps<S> = {
  controller: raw.controller,
  expectedResourceContext: raw.expectedResourceContext,
  invalidationKey: raw.invalidationKey,
  fields: raw.fields,
};
void createTableRendererCell;
export type PrivateActor = DetailsCommitActor;
