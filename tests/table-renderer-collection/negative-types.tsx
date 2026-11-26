import type {
  CriteriaSourceAuthority,
  DataTableModel,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import {
  createTableRendererCell,
  requireTableRendererTarget,
} from "../../packages/heroui/src/table/renderer-commit.js";
import type { TableRendererTarget } from "../../packages/heroui/src/table/types.js";
export function negatives<S extends QuerySchema>(
  model: DataTableModel<S, { id: string; amount: number }>,
  other: DataTableModel<S, { id: string; secret: boolean }>,
  source: CriteriaSourceAuthority<S>,
) {
  const cell = createTableRendererCell(model),
    lease = cell.connect();
  const actor = cell.commit(lease, model, {});
  // @ts-expect-error S2-N1 source authority is not an issued renderer actor
  requireTableRendererTarget({ cell, actor: source });
  // @ts-expect-error S2-N2 foreign T is not widened through the cell
  cell.updateModel(lease, other);
  const target: TableRendererTarget<S, { id: string; amount: number }> = {
    cell,
    actor,
  };
  // @ts-expect-error S2-N3 target identities readonly
  target.actor = actor;
  cell.commit(lease, model, {
    collection: {
      label: "Synthetic",
      rowHeaderColumnId: "amount",
      rowTextValue: (row) => row.original.id,
      columnTextValue: (column) => column.id,
      // @ts-expect-error S2-N4 column/cell callbacks retain actual T
      cellTextValue: (cell) => cell.row.original.secret,
    },
  });
  return target;
}
