import type {
  CriteriaSourceAuthority,
  DataTableModel,
} from "@tableweave/react";
import {
  defineQuerySchema,
  type QuerySchema,
} from "@tableweave/react/contracts";
import type { CriteriaActor } from "../../packages/heroui/src/filters/criteria-commit.js";
import { createTableRendererCell } from "../../packages/heroui/src/table/renderer-commit.js";
import type {
  TableRendererActor,
  TableRendererConfig,
} from "../../packages/heroui/src/table/types.js";

const other = defineQuerySchema({
  id: "other",
  version: 1,
  fields: { other: { type: "boolean", owner: "builder" } },
});
export function negative<S extends QuerySchema>(
  model: DataTableModel<S, { id: string; amount: number }>,
  source: CriteriaSourceAuthority<S>,
  tool: CriteriaActor<"search", S>,
  otherModel: DataTableModel<S, { id: string; secret: boolean }>,
  foreignModel: DataTableModel<typeof other, { id: string; amount: number }>,
) {
  const cell = createTableRendererCell(model),
    lease = cell.connect();
  // @ts-expect-error S1-N1 renderer actor is distinct from a tool actor
  cell.require(tool);
  // @ts-expect-error S1-N2 source authority is not a renderer actor
  cell.require(source);
  // @ts-expect-error S1-N3 model record type remains anchored, never widened to object
  cell.updateModel(lease, otherModel);
  // @ts-expect-error S1-N4 text callback receives actual NativeRow<T>
  cell.commit(lease, model, {
    collection: {
      label: "Synthetic",
      rowHeaderColumnId: "amount",
      rowTextValue: (row: { secret: boolean }) => String(row.secret),
      columnTextValue: (column) => column.id,
      cellTextValue: (value) => value.id,
    },
  });
  const config: TableRendererConfig<S, { id: string; amount: number }> = {};
  // @ts-expect-error S1-N5 configuration is readonly
  config.onRetry = () => {};
  // @ts-expect-error S1-N6 opaque brand cannot be manufactured
  const actor: TableRendererActor<S, { id: string; amount: number }> = {};
  cell.commit(lease, model, {
    actions: [
      {
        id: "a",
        label: "Synthetic",
        onAction(context) {
          // @ts-expect-error S1-N7 loaded selection records remain actual T
          const value: boolean | undefined =
            context.loadedSelected[0]?.record.amount;
          void value;
        },
      },
    ],
  });
  // @ts-expect-error S1-N8 no invented NativeCollection renderCell prop
  cell.commit(lease, model, {
    collection: {
      label: "Synthetic",
      rowHeaderColumnId: "amount",
      rowTextValue: (row) => row.original.id,
      columnTextValue: (column) => column.id,
      cellTextValue: (value) => value.id,
      renderCell: () => null,
    },
  });
  // @ts-expect-error S1-N9 schema cannot be inferred from a foreign model update
  cell.updateModel(lease, foreignModel);
  // @ts-expect-error S1-N10 committed opaque child references are readonly
  cell.require(actor).ports.toolConfigs.search = {};
  return actor;
}
