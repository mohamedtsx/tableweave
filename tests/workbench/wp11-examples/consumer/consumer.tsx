import {
  DataTable,
  englishDataTableLocale,
  type DataTableProps,
} from "@tableweave/heroui";
import {
  useDataTable,
  type DataTableOptions,
  type TableDefinition,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import "@tableweave/heroui/styles.css";
/** An archive/ordinary declaration consumer, not a mounted/running application. */
export function ArchiveConsumer<S extends QuerySchema, T extends object>({
  definition,
  options,
  collection,
}: {
  definition: TableDefinition<S, T>;
  options: DataTableOptions<S, T>;
  collection: DataTableProps<S, T>["collection"];
}) {
  const model = useDataTable(definition, options);
  return (
    <DataTable
      table={model}
      collection={collection}
      locale={englishDataTableLocale}
    />
  );
}
