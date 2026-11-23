import {
  columnFilteringFeature,
  columnOrderingFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";
import type { NativeColumnMeta } from "./types.js";

// Constructed once. v9 features/model slots cannot be replaced after mount.
export const nativeFeatures = Object.freeze(
  tableFeatures({
    columnFilteringFeature,
    globalFilteringFeature,
    rowSortingFeature,
    rowPaginationFeature,
    rowSelectionFeature,
    columnVisibilityFeature,
    columnOrderingFeature,
    filteredRowModel: createFilteredRowModel(),
    sortedRowModel: createSortedRowModel(),
    paginatedRowModel: createPaginatedRowModel(),
    columnMeta: {} as NativeColumnMeta,
  }),
);
export const predicateCarrierId = "__tableweave_predicate__";
