import type { ReactNode } from "react";

export interface CollectionLeaf {
  readonly kind: "leaf";
  readonly id: string;
  readonly label: ReactNode;
  readonly textValue: string;
  readonly isRowHeader?: boolean;
  readonly allowsSorting?: boolean;
  readonly isSelection?: boolean;
  readonly isVisible?: boolean;
  readonly isInternal?: boolean;
}

export interface CollectionGroup {
  readonly kind: "group";
  readonly id: string;
  readonly label: ReactNode;
  readonly textValue: string;
  readonly children: readonly CollectionColumn[];
  readonly isPlaceholder?: boolean;
}

export type CollectionColumn = CollectionLeaf | CollectionGroup;

/** Pure presentation projection; never filters, sorts, or pages records. */
export function projectCollectionColumns(
  columns: readonly CollectionColumn[],
): {
  readonly columns: readonly CollectionColumn[];
  readonly leaves: readonly CollectionLeaf[];
} {
  const ids = new Set<string>();
  const leaves: CollectionLeaf[] = [];
  function prune(items: readonly CollectionColumn[]): CollectionColumn[] {
    return items.flatMap((column): CollectionColumn[] => {
      if (ids.has(column.id) || column.id.startsWith("__tw_placeholder:")) {
        throw new Error("Duplicate or reserved collection column ID");
      }
      ids.add(column.id);
      if (column.kind === "leaf") {
        if (column.isInternal || column.isVisible === false) return [];
        leaves.push(column);
        return [column];
      }
      const children = prune(column.children);
      return children.length ? [{ ...column, children }] : [];
    });
  }
  const pruned = prune(columns);
  if (!leaves.some((column) => !column.isSelection && column.isRowHeader)) {
    throw new Error("A visible data row-header column is required");
  }
  function depth(column: CollectionColumn): number {
    return column.kind === "leaf"
      ? 1
      : 1 + Math.max(...column.children.map(depth));
  }
  const maxDepth = Math.max(...pruned.map(depth));
  function pad(column: CollectionColumn, remaining: number): CollectionColumn {
    if (column.kind === "group") {
      return {
        ...column,
        children: column.children.map((child) => pad(child, remaining - 1)),
      };
    }
    if (remaining === 1) return column;
    // Explicit empty collection branches balance all leaves. Without this,
    // React Stately creates placeholder nodes with no renderer, and the default
    // RAC CollectionBranch calls their missing render function.
    return {
      kind: "group",
      id: `__tw_placeholder:${remaining}:${column.id}`,
      label: null,
      textValue: "",
      isPlaceholder: true,
      children: [pad(column, remaining - 1)],
    };
  }
  return { columns: pruned.map((column) => pad(column, maxDepth)), leaves };
}
