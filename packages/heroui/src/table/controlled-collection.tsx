"use client";

import { Button } from "@heroui/react/button";
import { Checkbox } from "@heroui/react/checkbox";
import { Table } from "@heroui/react/table";
import type { ReactNode } from "react";
import { useMemo } from "react";
import type {
  CollectionColumn,
  CollectionLeaf,
} from "./collection-projection.js";
import { projectCollectionColumns } from "./collection-projection.js";
import { GroupColumn } from "./group-column.js";
import { skipPlaceholderHeader } from "./header-navigation.js";

export interface CollectionRow {
  readonly id: string;
  readonly textValue: string;
  readonly cells: Readonly<
    Record<string, { readonly content: ReactNode; readonly textValue: string }>
  >;
}

export interface CollectionSort {
  readonly id: string;
  readonly desc: boolean;
}

/** Minimal, controlled collection boundary, not the final Tableweave renderer. */
export interface ControlledCollectionProps {
  readonly label: string;
  readonly selectionMode?: "none" | "multiple";
  readonly columns: readonly CollectionColumn[];
  readonly rows: readonly CollectionRow[];
  readonly selectedIds: ReadonlySet<string>;
  readonly eligiblePageIds: readonly string[];
  readonly onSelectedIdsChange: (ids: ReadonlySet<string>) => void;
  readonly onPageSelectionChange?: (selected: boolean) => void;
  readonly sorting: readonly CollectionSort[];
  readonly onSort: (columnId: string, additive: boolean) => void;
}

function CheckboxContents() {
  return (
    <Checkbox.Content>
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
    </Checkbox.Content>
  );
}

export function ControlledCollection(props: ControlledCollectionProps) {
  const projected = useMemo(
    () => projectCollectionColumns(props.columns),
    [props.columns],
  );
  const eligible = new Set(props.eligiblePageIds);
  const loaded = new Set(props.rows.map((row) => row.id));
  if (
    loaded.size !== props.rows.length ||
    [...eligible].some((id) => !loaded.has(id))
  ) {
    throw new Error(
      "Collection rows and eligible page IDs must have stable unique identities",
    );
  }
  const checked =
    eligible.size > 0 && [...eligible].every((id) => props.selectedIds.has(id));
  const mixed =
    !checked && [...eligible].some((id) => props.selectedIds.has(id));
  const primary = props.sorting[0];
  function setPageSelected(selected: boolean) {
    if (props.onPageSelectionChange) {
      props.onPageSelectionChange(selected);
      return;
    }
    const next = new Set(props.selectedIds);
    for (const id of eligible) selected ? next.add(id) : next.delete(id);
    props.onSelectedIdsChange(next);
  }
  function renderColumn(column: CollectionColumn): ReactNode {
    if (column.kind === "group") {
      return (
        <GroupColumn
          key={column.id}
          id={column.id}
          label={column.label}
          textValue={column.textValue}
          {...(column.isPlaceholder ? { isPlaceholder: true } : {})}
        >
          {column.children.map(renderColumn)}
        </GroupColumn>
      );
    }
    const index = props.sorting.findIndex((sort) => sort.id === column.id);
    const sort = props.sorting[index];
    const direction = sort
      ? sort.desc
        ? "descending"
        : "ascending"
      : undefined;
    return (
      <Table.Column
        key={column.id}
        id={column.id}
        textValue={column.textValue}
        isRowHeader={column.isRowHeader === true}
        allowsSorting={index === 0}
        focusMode={
          column.isSelection || column.allowsSorting ? "child" : "cell"
        }
        allowsArrowNavigation
        data-column-id={column.id}
      >
        {column.isSelection ? (
          <Checkbox
            slot={null}
            aria-label="Select eligible rows on this page"
            isSelected={checked}
            isIndeterminate={mixed}
            isDisabled={eligible.size === 0}
            onChange={setPageSelected}
          >
            <CheckboxContents />
          </Checkbox>
        ) : column.allowsSorting ? (
          <Button
            variant="tertiary"
            onPress={(event) => props.onSort(column.id, event.shiftKey)}
            aria-label={`Sort ${column.textValue}${direction ? `, ${direction}, priority ${index + 1}` : ", not sorted"}`}
          >
            <Table.SortableColumnHeader
              {...(direction ? { sortDirection: direction } : {})}
            >
              {column.label}
              {sort ? ` (${index + 1})` : null}
            </Table.SortableColumnHeader>
          </Button>
        ) : (
          column.label
        )}
      </Table.Column>
    );
  }
  function renderCell(row: CollectionRow, column: CollectionLeaf) {
    if (column.isSelection) {
      return (
        <Table.Cell
          key={column.id}
          id={JSON.stringify([row.id, column.id])}
          textValue={`Select ${row.textValue}`}
          focusMode="child"
          allowsArrowNavigation
          data-column-id={column.id}
        >
          <Checkbox slot="selection" aria-label="Select">
            <CheckboxContents />
          </Checkbox>
        </Table.Cell>
      );
    }
    const cell = row.cells[column.id];
    if (!cell) throw new Error("Projected collection cell is missing");
    return (
      <Table.Cell
        key={column.id}
        id={JSON.stringify([row.id, column.id])}
        textValue={cell.textValue}
        data-column-id={column.id}
      >
        {cell.content}
      </Table.Cell>
    );
  }
  return (
    <Table variant="secondary" className="tw-native-collection">
      <Table.ScrollContainer
        onKeyDownCapture={(event) =>
          skipPlaceholderHeader(event, projected.columns)
        }
      >
        <Table.Content
          aria-label={props.label}
          selectionMode={props.selectionMode ?? "multiple"}
          selectionBehavior="toggle"
          selectedKeys={new Set(props.selectedIds)}
          disabledKeys={props.rows
            .filter((row) => !eligible.has(row.id))
            .map((row) => row.id)}
          disabledBehavior="selection"
          {...(primary
            ? {
                sortDescriptor: {
                  column: primary.id,
                  direction: primary.desc
                    ? ("descending" as const)
                    : ("ascending" as const),
                },
              }
            : {})}
          onSortChange={(sort) => {
            if (typeof sort.column === "string")
              props.onSort(sort.column, false);
          }}
          onSelectionChange={(keys) => {
            if (keys === "all") {
              setPageSelected(true);
              return;
            }
            const next = new Set(
              [...props.selectedIds].filter((id) => !eligible.has(id)),
            );
            for (const key of keys)
              if (typeof key === "string" && eligible.has(key)) next.add(key);
            props.onSelectedIdsChange(next);
          }}
        >
          <Table.Header>{projected.columns.map(renderColumn)}</Table.Header>
          <Table.Body>
            {props.rows.map((row) => (
              <Table.Row key={row.id} id={row.id} textValue={row.textValue}>
                {projected.leaves.map((column) => renderCell(row, column))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
      <Table.Footer>
        <span data-selected-count>{props.selectedIds.size} selected</span>
        <span role="status" aria-label="Sort order">
          {props.sorting.length
            ? props.sorting
                .map(
                  (sort, index) =>
                    `${sort.id} ${sort.desc ? "descending" : "ascending"}, priority ${index + 1}`,
                )
                .join("; ")
            : "Not sorted"}
        </span>
      </Table.Footer>
    </Table>
  );
}
