"use client";

import type {
  NativeCell,
  NativeColumn,
  NativeHeader,
  NativeRow,
  NativeTableHandle,
  NativeTableView,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import { memo, useMemo } from "react";
import type { CollectionColumn } from "./collection-projection.js";
import type { CollectionRow } from "./controlled-collection.js";
import { ControlledCollection } from "./controlled-collection.js";

/** Presentation only: callers supply the current view, not just a stable handle. */
export interface NativeCollectionProps<
  S extends QuerySchema,
  T extends object,
> {
  readonly view: NativeTableView<S, T>;
  readonly label: string;
  readonly rowHeaderColumnId: string;
  readonly selectionColumnId?: string;
  readonly columnTextValue: (column: NativeColumn<T>) => string;
  readonly rowTextValue: (row: NativeRow<T>) => string;
  readonly cellTextValue: (cell: NativeCell<T>) => string;
}

// Subscribe remains inside a memoized leaf receiving the stable native handle.
// Parent model/metadata refreshes cannot masquerade as its selection subscription.
const NativeSelectionCount = memo(function NativeSelectionCount({
  native,
}: {
  readonly native: Pick<NativeTableHandle<object>, "Subscribe" | "atoms">;
}) {
  return (
    <native.Subscribe
      source={native.atoms.rowSelection}
      selector={(selection) => Object.values(selection).filter(Boolean).length}
    >
      {(count) => (
        <output aria-label="Subscribed selected count">{count}</output>
      )}
    </native.Subscribe>
  );
});

export function NativeCollection<S extends QuerySchema, T extends object>(
  props: NativeCollectionProps<S, T>,
) {
  const { view } = props;
  const projected = useMemo(() => {
    const visible = new Map(
      view.visibleColumns.map((column) => [column.id, column]),
    );
    const rowHeader = visible.get(props.rowHeaderColumnId);
    if (!rowHeader || rowHeader.columnDef.meta?.utility) {
      throw new Error(
        "NativeCollection requires a visible data row-header column",
      );
    }
    if (
      props.selectionColumnId &&
      !visible.get(props.selectionColumnId)?.columnDef.meta?.utility
    ) {
      throw new Error(
        "NativeCollection selection column must be a visible utility",
      );
    }
    const native = view.native;
    function headerColumns(header: NativeHeader<T>): CollectionColumn[] {
      if (header.isPlaceholder) return header.subHeaders.flatMap(headerColumns);
      const column = header.column;
      if (column.columns.length > 0) {
        const children = header.subHeaders.flatMap(headerColumns);
        return children.length
          ? [
              {
                kind: "group",
                id: column.id,
                label: <native.FlexRender header={header} />,
                textValue: props.columnTextValue(column),
                children,
              },
            ]
          : [];
      }
      // The producer's explicit public leaf allowlist is the sole render policy.
      // No enumeration of all native columns, private carrier ID, or extra engine.
      if (!visible.has(column.id)) return [];
      return [
        {
          kind: "leaf",
          id: column.id,
          label: <native.FlexRender header={header} />,
          textValue: props.columnTextValue(column),
          isRowHeader: column.id === props.rowHeaderColumnId,
          allowsSorting: column.getCanSort(),
          isSelection: column.id === props.selectionColumnId,
        },
      ];
    }
    const columns = view.headerGroups[0]?.headers.flatMap(headerColumns) ?? [];
    const rows: CollectionRow[] = view.rows.map((row) => {
      const nativeCells = new Map(
        row.getVisibleCells().map((cell) => [cell.column.id, cell]),
      );
      const cells: CollectionRow["cells"] = Object.fromEntries(
        view.visibleColumns.map((column) => {
          const cell = nativeCells.get(column.id);
          if (!cell)
            throw new Error("NativeCollection visible cell is missing");
          return [
            column.id,
            {
              content: <native.FlexRender cell={cell} />,
              textValue: props.cellTextValue(cell),
            },
          ];
        }),
      );
      return { id: row.id, textValue: props.rowTextValue(row), cells };
    });
    return { columns, rows };
  }, [
    view.native,
    view.rows,
    view.headerGroups,
    view.visibleColumns,
    props.rowHeaderColumnId,
    props.selectionColumnId,
    props.columnTextValue,
    props.rowTextValue,
    props.cellTextValue,
  ]);

  return (
    <>
      <ControlledCollection
        label={props.label}
        selectionMode={
          view.controller.getDefinition().selection ? "multiple" : "none"
        }
        columns={projected.columns}
        rows={projected.rows}
        selectedIds={new Set(view.selectedIds)}
        eligiblePageIds={view.pageSelection.eligibleIds}
        sorting={view.state.query.sorting}
        onPageSelectionChange={(selected) => {
          view.selectPage(selected);
        }}
        onSelectedIdsChange={(ids) =>
          view.native.setRowSelection((previous) => {
            const next = { ...previous };
            for (const id of view.pageSelection.eligibleIds) {
              if (ids.has(id)) next[id] = true;
              else delete next[id];
            }
            return next;
          })
        }
        onSort={(id, additive) => {
          const column = view.native.getColumn(id);
          if (column?.getCanSort()) column.toggleSorting(undefined, additive);
        }}
      />
      <NativeSelectionCount native={view.native} />
    </>
  );
}
