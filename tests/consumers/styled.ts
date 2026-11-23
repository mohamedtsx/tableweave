import type * as styled from "@tableweave/heroui";
import type * as sortable from "@tableweave/heroui/sortable";

type Empty<T> = keyof T extends never ? true : false;
export const entriesAreScaffolds: [
  Empty<typeof styled>,
  Empty<typeof sortable>,
] = [true, true];

// @ts-expect-error WP-01 does not implement or fake DataTable.
import { DataTable } from "@tableweave/heroui";
// @ts-expect-error Private output paths must remain encapsulated.
import "@tableweave/heroui/dist/sortable/index.js";

void DataTable;
