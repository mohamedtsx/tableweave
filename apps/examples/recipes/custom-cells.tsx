import { Button } from "@heroui/react/button";
import { TableDetailsTrigger } from "@tableweave/heroui";
import type { NativeColumnDef } from "@tableweave/react";
import type { Transaction } from "../shared/records.js";

/** App-provided columns, composed ONCE into a genuine definition. */
export function transactionRecipeColumns(
  review: (id: string) => void,
): readonly NativeColumnDef<Transaction>[] {
  return [
    {
      id: "signedValue",
      header: "Signed value",
      accessorFn: (record) => record.amount,
      cell: ({ row }) => (
        <bdi className="font-mono tabular-nums">
          {new Intl.NumberFormat("en-US", {
            signDisplay: "always",
            minimumFractionDigits: 2,
          }).format(row.original.amount)}
        </bdi>
      ),
    },
    {
      id: "recipeDetails",
      header: "Details",
      meta: { utility: true },
      cell: ({ row }) => (
        <TableDetailsTrigger rowId={row.id} label={`View details ${row.id}`}>
          View details
        </TableDetailsTrigger>
      ),
    },
    {
      id: "review",
      header: "Application action",
      meta: { utility: true },
      cell: ({ row }) => (
        <Button variant="tertiary" size="sm" onPress={() => review(row.id)}>
          Review {row.id}
        </Button>
      ),
    },
  ];
}
