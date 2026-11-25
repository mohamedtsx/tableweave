// For a future actual installed tarball consumer: no source aliases in that lane.
import {
  DataTable,
  englishDataTableLocale,
  useDetailsAccessory,
  type DataTableProps,
} from "@tableweave/heroui";
import {
  useDataTable,
  type DataTableOptions,
  type TableDefinition,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
export function PublicConsumer<S extends QuerySchema, T extends object>({
  definition,
  options,
  collection,
}: {
  definition: TableDefinition<S, T>;
  options: DataTableOptions<S, T>;
  collection: DataTableProps<S, T>["collection"];
}) {
  const table = useDataTable(definition, options);
  return (
    <DataTable
      table={table}
      collection={collection}
      locale={englishDataTableLocale}
    />
  );
}
export const detailsHook = useDetailsAccessory;
