import { type DataTableModel, renderNativeComponent } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import { SelectionToolbar } from "../../packages/heroui/src/selection/selection-toolbar.js";
import { NativeCollection } from "../../packages/heroui/src/table/native-collection.js";
import {
  createTableRendererCell,
  getTableRendererOwner,
  requireTableRendererTarget,
} from "../../packages/heroui/src/table/renderer-commit.js";
import type { TableRendererTarget } from "../../packages/heroui/src/table/types.js";
export function positive<S extends QuerySchema>(
  model: DataTableModel<S, { id: string; amount: number }>,
) {
  const cell = createTableRendererCell(model),
    lease = cell.connect();
  const actor = cell.commit(lease, model, {
    collection: {
      label: "Synthetic",
      rowHeaderColumnId: "amount",
      rowTextValue: (row) => row.original.id,
      columnTextValue: (column) => column.id,
      cellTextValue: (value) => value.row.original.amount.toFixed(0),
    },
  });
  const target: TableRendererTarget<S, { id: string; amount: number }> = {
    cell,
    actor,
  };
  const current = requireTableRendererTarget(target);
  const element = renderNativeComponent(
    ({ value }: { value: number }) => <span>{value}</span>,
    { value: 1 },
  );
  if (
    !current.model.view ||
    !current.model.presentation ||
    !current.model.authority
  )
    return element;
  return (
    <>
      <NativeCollection
        renderer={target}
        view={current.model.view}
        label="Synthetic"
        rowHeaderColumnId="amount"
        rowTextValue={(row) => row.original.id}
        columnTextValue={(column) => column.id}
        cellTextValue={(value) => value.row.original.id}
      />
      <SelectionToolbar
        renderer={target}
        presentation={current.model.presentation}
        authority={current.model.authority}
        normal={
          getTableRendererOwner(cell)?.definition.native.controllerDefinition
            .schema.id
        }
      />
    </>
  );
}
