import { DataTable, type DataTableProps } from "@tableweave/heroui";
import type { QuerySchema } from "@tableweave/react/contracts";
import type {
  ReorderAdmission,
  ReorderAdmissionLease,
} from "@tableweave/react/reordering-controller";
import type { RowMoveOperation } from "@tableweave/react/reordering";
// Must be copied outside the workspace to a real packed consumer in the final
// selected phase. No source aliases, app token synthesis or fixture-only exports.
export function consumer<S extends QuerySchema, T extends object>(
  props: DataTableProps<S, T>,
  admission: ReorderAdmission<S, T>,
  lease: ReorderAdmissionLease<S, T>,
  notify: (operation: RowMoveOperation) => void,
) {
  return (
    <DataTable
      {...props}
      reordering={{
        columns: true,
        rows: { admission, lease, handleColumnId: "title", onSubmit: notify },
      }}
    />
  );
}
