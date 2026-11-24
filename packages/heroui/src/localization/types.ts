import type { BuiltinOperator, QuerySchema } from "@tableweave/react/contracts";
import type { ColumnChooserMessages } from "../columns/types.js";
import type { DateEditorMessages } from "../date/date-types.js";
import type { DetailsMessages } from "../details/types.js";
import type {
  FilterBuilderMessages,
  FilterFieldPresentation,
} from "../filters/types.js";
import type { PaginationMessages } from "../pagination/types.js";
import type { SelectionToolbarMessages } from "../selection/types.js";
import type { SortingMessages } from "../sorting/types.js";
import type { CollectionMessages } from "../table/collection-messages.js";
import type { FilterDateMessages } from "../toolbar/filter-date.js";
import type { FilterSearchMessages } from "../toolbar/filter-search.js";
import type { FilterTabsMessages } from "../toolbar/filter-tabs.js";

/** Existing per-field presentation port, with all accepted built-in IDs required.
 * Custom operator presentation remains application-owned.
 */
export type TableweaveBuiltinOperatorLabels = NonNullable<
  FilterFieldPresentation<QuerySchema>["operatorLabels"]
> & Readonly<Record<BuiltinOperator, string>>;

/** Complete existing message ports only; no future table-state message contract. */
export interface TableweaveMessages {
  readonly builder: Readonly<FilterBuilderMessages>;
  readonly search: Readonly<FilterSearchMessages>;
  readonly tabs: Readonly<FilterTabsMessages>;
  readonly date: Readonly<FilterDateMessages>;
  readonly dateEditor: Readonly<DateEditorMessages>;
  readonly collection: Readonly<CollectionMessages>;
  readonly sorting: Readonly<SortingMessages>;
  readonly columnChooser: Readonly<ColumnChooserMessages>;
  readonly selectionToolbar: Readonly<SelectionToolbarMessages>;
  readonly pagination: Readonly<PaginationMessages>;
  readonly details: Readonly<DetailsMessages>;
}

export interface TableweaveLocale {
  readonly locale: string;
  /** Metadata only: never changes document direction or creates a provider. */
  readonly direction: "ltr" | "rtl";
  readonly messages: TableweaveMessages;
  /** Later wiring uses existing per-field operatorLabels; app overrides win. */
  readonly builtinOperatorLabels: TableweaveBuiltinOperatorLabels;
}
