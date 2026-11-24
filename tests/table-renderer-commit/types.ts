import type { DataTableModel } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import { createTableRendererCell } from "../../packages/heroui/src/table/renderer-commit.js";
import type { TableRendererConfig } from "../../packages/heroui/src/table/types.js";

export function positive<S extends QuerySchema>(
  model: DataTableModel<S, { id: string; amount: number }>,
) {
  const config: TableRendererConfig<S, { id: string; amount: number }> = {
    collection: {
      label: "Synthetic",
      rowHeaderColumnId: "amount",
      rowTextValue: (row) => row.original.id,
      columnTextValue: (column) => column.id,
      cellTextValue: (cell) => cell.row.original.amount.toFixed(0),
    },
    renderState: ({ recovery }) => recovery.kind,
    renderToolbar: ({ model: current, defaultContent }) =>
      current.state?.selection ? defaultContent : null,
    actions: [
      {
        id: "synthetic",
        label: "Synthetic",
        onAction(context) {
          const amount: number | undefined =
            context.loadedSelected[0]?.record.amount;
          void amount;
        },
      },
    ],
    onRetry: async () => {},
  };
  const cell = createTableRendererCell(model),
    lease = cell.connect();
  const actor = cell.commit(lease, model, config);
  cell.updateModel(lease, model);
  const local = cell.createLocal<{ text: string }>("draft");
  local.write(actor, { text: "Synthetic" });
  return { cell, actor, result: cell.require(actor), local };
}
