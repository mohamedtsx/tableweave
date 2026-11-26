import {
  DataTable,
  useDetailsAccessory,
  type DetailsAccessoryOptions,
  type DetailsAccessory,
  englishDataTableLocale,
  type DataTableProps,
  type DetailsRenderContext,
} from "@tableweave/heroui";
import type { DataTableModel } from "@tableweave/react";
import type { schema, Row } from "./headless.js";

export function PackedFacade({
  model,
}: {
  readonly model: DataTableModel<typeof schema, Row>;
}) {
  const props: DataTableProps<typeof schema, Row> = {
    table: model,
    locale: englishDataTableLocale,
    collection: {
      label: "Public synthetic archive fixture",
      rowHeaderColumnId: "description",
      rowTextValue: (row) => {
        const record: Row = row.original;
        return record.description;
      },
      columnTextValue: (column) => column.id,
      cellTextValue: (cell) => String(cell.getValue() ?? ""),
    },
  };
  return <DataTable {...props} />;
}
export function customDetails(
  context: DetailsRenderContext<typeof schema, Row>,
) {
  const record: Row | undefined = context.record;
  return (
    <section aria-label="Synthetic detail">
      {record?.description ?? "Not loaded"}
    </section>
  );
}
export function usePackedDetails(
  model: DataTableModel<typeof schema, Row>,
  options: DetailsAccessoryOptions<typeof schema, Row>,
): DetailsAccessory<typeof schema, Row> {
  return useDetailsAccessory(model, options);
}
