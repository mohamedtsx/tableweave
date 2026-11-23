import { NativeCollection } from "@tableweave/heroui";
import type * as sortable from "@tableweave/heroui/sortable";
import type { NativeTableView } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";

type Empty<T> = keyof T extends never ? true : false;
export const sortableIsStillScaffold: Empty<typeof sortable> = true;

export function SyntheticCollection<S extends QuerySchema>(
  view: NativeTableView<S, { id: string; amount: number }>,
) {
  return NativeCollection({
    view,
    label: "Synthetic packed collection",
    rowHeaderColumnId: "amount",
    columnTextValue: (column) => column.id,
    rowTextValue: (row) => {
      const amount: number = row.original.amount;
      // @ts-expect-error Styled row contexts retain the application record type.
      const missing: string = row.original.missing;
      void missing;
      return `${row.original.id}:${amount}`;
    },
    cellTextValue: (cell) => String(cell.getValue()),
  });
}

// @ts-expect-error The bounded WP-04 renderer is not a whole DataTable facade.
import { DataTable } from "@tableweave/heroui";
// @ts-expect-error Private output paths must remain encapsulated.
import "@tableweave/heroui/dist/sortable/index.js";

void DataTable;
