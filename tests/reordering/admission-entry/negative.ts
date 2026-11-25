// Authored rejection lane only; excluded from the positive LIGHT program.
import type { DataTableModel, TableDefinition } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import {
  claimReorderUI,
  type ReorderAdmission,
  type ReorderAdmissionLease,
  type ReorderModelJoin,
  type ReorderUIBinding,
  requireReorderModel,
} from "@tableweave/react/reordering-controller";

export function invalidEntry<S extends QuerySchema>(
  definition: TableDefinition<S, { id: string; amount: number }>,
  admission: ReorderAdmission<S, { id: string; amount: number }>,
  foreignLease: ReorderAdmissionLease<S, { id: string; label: string }>,
  join: ReorderModelJoin<S, { id: string; amount: number }>,
  foreignModel: DataTableModel<S, { id: string; label: string }>,
) {
  // @ts-expect-error A copied plain object is not an issued invariant binding.
  const copied: ReorderUIBinding<S, { id: string; amount: number }> = {};
  // @ts-expect-error The definition/admission anchor cannot widen to a foreign T.
  claimReorderUI(definition, admission, foreignLease, {});
  // @ts-expect-error A join cannot authorize a foreign record-model type.
  requireReorderModel(join, foreignModel);
  return copied;
}
