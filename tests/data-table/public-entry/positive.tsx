import type { DataTableModel } from "@tableweave/react";
import { defineQuerySchema } from "@tableweave/react/contracts";
import {
  arabicDataTableLocale,
  arabicDataTableNeutralMessages,
  DataTable,
  type DataTableCollectionConfig,
  type DataTableProps,
  type DataTableStateContext,
  type DataTableToolConfigs,
  type DetailsAccessory,
  DetailsTrigger,
  RecordDetails,
  TableDetailsTrigger,
  useDetailsAccessory,
} from "@tableweave/heroui";

export const schema = defineQuerySchema({
  id: "public-entry-synthetic",
  version: 1,
  fields: {
    title: { type: "text", owner: "search" },
    amount: { type: "number", owner: "builder" },
  },
  pagination: { defaultSize: 10, sizes: [10, 20] },
});
export type S = typeof schema;
export interface Item {
  readonly id: string;
  readonly title: string;
  readonly amount: number;
}

export const collection: DataTableCollectionConfig<S, Item> = {
  label: "Synthetic records",
  rowHeaderColumnId: "title",
  rowTextValue: (row) => row.original.title,
  columnTextValue: (column) => column.id,
  cellTextValue: (cell) => cell.row.original.title,
};
export const tools: DataTableToolConfigs<S> = {
  builder: {
    messages: { filters: "Synthetic criteria" },
    fields: {
      amount: {
        renderEditor: (context) => (
          <input aria-label={context.fieldId} defaultValue="Synthetic draft" />
        ),
      },
    },
  },
};

/** Type-only consumer feasibility; no hook/model/accessory is fabricated or run. */
export function Consumer({
  table,
  accessory,
}: {
  readonly table: DataTableModel<S, Item>;
  readonly accessory: DetailsAccessory<S, Item>;
}) {
  return (
    <DataTable
      table={table}
      collection={collection}
      accessory={accessory}
      tools={tools}
      locale={arabicDataTableLocale}
      neutralMessages={arabicDataTableNeutralMessages}
      renderState={(context) => {
        const typed: DataTableStateContext<S, Item> = context;
        return <span>{typed.recovery.kind}</span>;
      }}
      renderToolbar={(context) => context.defaultContent}
      actions={[
        {
          id: "inspect",
          label: "Inspect synthetic selection",
          onAction: (context) => {
            for (const item of context.loadedSelected) {
              const title: string = item.record.title;
              void title;
            }
          },
        },
      ]}
    />
  );
}
export const minimalOverride: DataTableProps<S, Item>["tools"] = {
  builder: { messages: { filters: "Criteria" } },
};
export const contextTrigger = (
  <TableDetailsTrigger rowId="one" label="Details" />
);
export const legacyTrigger: typeof import("../../../packages/heroui/src/details/details-shell.js").DetailsTrigger =
  DetailsTrigger;
export const accessoryHook = useDetailsAccessory;
export const detailsShell = RecordDetails;
