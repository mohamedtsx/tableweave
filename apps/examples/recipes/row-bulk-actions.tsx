import type { DataTableProps } from "@tableweave/heroui";
import type { ExampleOwner } from "../shared/owner.js";
import type { Transaction } from "../shared/records.js";
import type { TransactionSchema } from "../shared/schemas.js";
type Owner = ExampleOwner<TransactionSchema, Transaction>;
export function reviewSyntheticRow(owner: Owner, id: string): void {
  if (!owner.getSnapshot().access || !owner.record(id)) return;
  owner.setNotice(
    `Synthetic row review queued for ${id}; no backend action was performed.`,
  );
}
export function syntheticBulkActions(
  owner: Owner,
): NonNullable<DataTableProps<TransactionSchema, Transaction>["actions"]> {
  return [
    {
      id: "review",
      label: "Queue synthetic review",
      onAction(context) {
        if (!owner.getSnapshot().access || context.busy || context.obsolete)
          return;
        owner.setNotice(
          `Synthetic review queue: ${context.selectedCount} IDs; ${context.loadedSelected.length} loaded records. Missing objects were not invented.`,
        );
      },
    },
  ];
}
