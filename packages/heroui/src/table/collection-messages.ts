/** Tableweave-owned copy. No vendor or application business types escape. */
export interface CollectionMessages {
  readonly pageCheckbox: string;
  readonly rowCheckbox: (rowText: string) => string;
  readonly sortButton: (
    columnText: string,
    direction: "ascending" | "descending" | null,
    priority: number | null,
  ) => string;
  readonly sortEntry: (
    columnId: string,
    direction: "ascending" | "descending",
    priority: number,
  ) => string;
  readonly sortPriority: (priority: number) => string;
  readonly sortOrderLabel: string;
  readonly sortSeparator: string;
  readonly notSorted: string;
  readonly selectedCount: (count: number) => string;
  readonly subscribedCountLabel: string;
  readonly subscribedCount: (count: number) => string;
  readonly invalidColumns: string;
  readonly invalidRows: string;
  readonly invalidRowHeader: string;
  readonly invalidSelectionColumn: string;
  readonly missingCell: string;
}

export const defaultCollectionMessages: CollectionMessages = Object.freeze({
  pageCheckbox: "Select eligible rows on this page",
  rowCheckbox: (text: string) => `Select ${text}`,
  sortButton: (
    text: string,
    direction: "ascending" | "descending" | null,
    priority: number | null,
  ) =>
    `Sort ${text}${direction ? `, ${direction}, priority ${priority}` : ", not sorted"}`,
  sortEntry: (
    id: string,
    direction: "ascending" | "descending",
    priority: number,
  ) => `${id} ${direction}, priority ${priority}`,
  sortPriority: (priority: number) => ` (${priority})`,
  sortOrderLabel: "Sort order",
  sortSeparator: "; ",
  notSorted: "Not sorted",
  selectedCount: (count: number) => `${count} selected`,
  subscribedCountLabel: "Subscribed selected count",
  subscribedCount: (count: number) => String(count),
  invalidColumns:
    "Collection columns must have unique identities and a visible data row header",
  invalidRows:
    "Collection rows and eligible page IDs must have stable unique identities",
  invalidRowHeader:
    "NativeCollection requires a data row-header column and visible data leaf",
  invalidSelectionColumn:
    "NativeCollection selection column must be a visible utility",
  missingCell: "Collection visible cell is missing",
});
