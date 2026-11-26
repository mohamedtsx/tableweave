"use client";

import { Button } from "@heroui/react/button";
import { Checkbox } from "@heroui/react/checkbox";
import { Table } from "@heroui/react/table";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import {
  type CollectionMessages,
  defaultCollectionMessages,
} from "./collection-messages.js";
import type {
  CollectionColumn,
  CollectionLeaf,
} from "./collection-projection.js";
import { projectCollectionColumns } from "./collection-projection.js";
import { GroupColumn } from "./group-column.js";
import { skipPlaceholderHeader } from "./header-navigation.js";
import {
  captureCollectionReordering,
  captureReorderingProp,
  collectionRowRef,
  rowCollectionRefs,
  leafCollectionRefs,
  reorderingSnapshot,
  type requireCollectionReordering,
} from "./reordering-binding.js";
import type { CollectionReorderingBinding } from "./reordering-types.js";
import {
  ColumnMoveControls,
  RowMoveControls,
  ReorderingNotice,
} from "./reordering-controls.js";

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
  readonly reordering?: CollectionReorderingBinding;
  readonly label: string;
  readonly selectionMode?: "none" | "single" | "multiple";
  readonly messages?: Partial<CollectionMessages>;
  readonly diagnostics?: boolean;
  readonly isSelectionDisabled?: boolean;
  readonly columns: readonly CollectionColumn[];
  readonly rows: readonly CollectionRow[];
  readonly selectedIds: ReadonlySet<string>;
  readonly eligiblePageIds: readonly string[];
  readonly onSelectedIdsChange: (ids: ReadonlySet<string>) => void;
  readonly onPageSelectionChange?: (selected: boolean) => void;
  readonly onCancelSelection?: () => void;
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
  let reordering: ReturnType<typeof requireCollectionReordering> | undefined;
  try {
    const candidate = captureReorderingProp(props, "reordering", "collection");
    if (candidate) reordering = captureCollectionReordering(props, candidate);
  } catch {
    return null;
  }
  return (
    <ControlledCollectionContent
      input={props}
      {...(reordering ? { reordering } : {})}
    />
  );
}
function ControlledCollectionContent({
  input: props,
  reordering,
}: {
  readonly input: ControlledCollectionProps;
  readonly reordering?: ReturnType<typeof requireCollectionReordering>;
}) {
  const [menu, setMenu] = useState<{
    owner: NonNullable<typeof reordering>;
    id: string;
  } | null>(null);
  const openMenu = reordering && menu?.owner === reordering ? menu.id : null;
  const messages = { ...defaultCollectionMessages, ...props.messages };
  const mode = props.selectionMode ?? "multiple";
  const projected = useMemo(() => {
    try {
      return projectCollectionColumns(props.columns);
    } catch {
      throw new Error(messages.invalidColumns);
    }
  }, [props.columns, messages.invalidColumns]);
  const eligible = new Set(props.eligiblePageIds);
  // RAC's public Set also carries its range anchor. Reuse the received object
  // only after its exact IDs are accepted by the owner, never optimistically.
  // Do not mutate it, inspect vendor metadata, or put it in a collection node.
  const rangeKeys = useRef<{
    readonly proposed: Set<string | number>;
    readonly baseline: Set<string | number>;
  } | null>(null);
  const acceptedKeys = [
    rangeKeys.current?.proposed,
    rangeKeys.current?.baseline,
  ].find(
    (keys) =>
      keys &&
      keys.size === props.selectedIds.size &&
      [...keys].every(
        (key) => typeof key === "string" && props.selectedIds.has(key),
      ),
  );
  const selectedKeys = acceptedKeys ?? new Set(props.selectedIds);
  const loaded = new Set(props.rows.map((row) => row.id));
  if (
    loaded.size !== props.rows.length ||
    [...eligible].some((id) => !loaded.has(id))
  ) {
    throw new Error(messages.invalidRows);
  }
  const checked =
    eligible.size > 0 && [...eligible].every((id) => props.selectedIds.has(id));
  const mixed =
    !checked && [...eligible].some((id) => props.selectedIds.has(id));
  const primary = props.sorting[0];
  const visiblePrimary =
    primary &&
    projected.leaves.some(
      (column) => column.id === primary.id && column.allowsSorting,
    )
      ? primary
      : undefined;
  function setPageSelected(selected: boolean) {
    if (mode !== "multiple" || props.isSelectionDisabled) return;
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
    const move = reordering ? leafCollectionRefs(reordering, column.id) : null;
    return (
      <Table.Column
        key={column.id}
        id={column.id}
        ref={move?.ref}
        textValue={column.textValue}
        isRowHeader={column.isRowHeader === true}
        allowsSorting={index === 0 && column.allowsSorting === true}
        focusMode={
          (column.isSelection && mode === "multiple") ||
          column.allowsSorting ||
          move
            ? "child"
            : "cell"
        }
        allowsArrowNavigation
        data-column-id={column.id}
      >
        {move && reordering ? (
          <ColumnMoveControls
            collection={reordering}
            id={column.id}
            label={column.textValue}
            messages={reordering.messages}
            isOpen={openMenu === `column:${column.id}`}
            onOpenChange={(open) =>
              setMenu((current) =>
                open
                  ? { owner: reordering, id: `column:${column.id}` }
                  : current?.owner === reordering &&
                      current.id === `column:${column.id}`
                    ? null
                    : current,
              )
            }
          />
        ) : null}
        {column.isSelection && mode === "multiple" ? (
          <Checkbox
            slot={null}
            aria-label={messages.pageCheckbox}
            isSelected={checked}
            isIndeterminate={mixed}
            isDisabled={props.isSelectionDisabled || eligible.size === 0}
            onChange={setPageSelected}
          >
            <CheckboxContents />
          </Checkbox>
        ) : column.allowsSorting && !column.isSelection ? (
          <Button
            variant="tertiary"
            onPress={(event) => props.onSort(column.id, event.shiftKey)}
            aria-label={messages.sortButton(
              column.textValue,
              direction ?? null,
              sort ? index + 1 : null,
            )}
          >
            <Table.SortableColumnHeader
              {...(direction ? { sortDirection: direction } : {})}
            >
              {column.label}
              {sort ? messages.sortPriority(index + 1) : null}
            </Table.SortableColumnHeader>
          </Button>
        ) : (
          column.label
        )}
      </Table.Column>
    );
  }
  function renderCell(row: CollectionRow, column: CollectionLeaf) {
    if (column.isSelection && mode !== "none") {
      return (
        <Table.Cell
          key={column.id}
          id={JSON.stringify([row.id, column.id])}
          textValue={messages.rowCheckbox(row.textValue)}
          focusMode="child"
          allowsArrowNavigation
          data-column-id={column.id}
        >
          <Checkbox
            slot={null}
            aria-label={messages.rowCheckbox(row.textValue)}
            isSelected={props.selectedIds.has(row.id)}
            isDisabled={props.isSelectionDisabled || !eligible.has(row.id)}
            onChange={(selected) => {
              const next =
                mode === "single" && selected
                  ? new Set<string>()
                  : new Set(props.selectedIds);
              if (selected) next.add(row.id);
              else next.delete(row.id);
              props.onSelectedIdsChange(next);
            }}
          >
            <CheckboxContents />
          </Checkbox>
        </Table.Cell>
      );
    }
    if (column.isSelection)
      return (
        <Table.Cell
          key={column.id}
          id={JSON.stringify([row.id, column.id])}
          textValue={column.textValue}
          data-column-id={column.id}
        />
      );
    const cell = row.cells[column.id];
    if (!cell) throw new Error(messages.missingCell);
    const rowMove = reordering ? rowCollectionRefs(reordering, row.id) : null;
    const handle = rowMove?.columnId === column.id;
    return (
      <Table.Cell
        key={column.id}
        id={JSON.stringify([row.id, column.id])}
        textValue={cell.textValue}
        data-column-id={column.id}
        {...(handle
          ? { focusMode: "child" as const, allowsArrowNavigation: true }
          : {})}
      >
        {handle && reordering ? (
          <RowMoveControls
            collection={reordering}
            id={row.id}
            label={row.textValue}
            messages={reordering.messages}
            isOpen={openMenu === `row:${row.id}`}
            onOpenChange={(open) =>
              setMenu((current) =>
                open
                  ? { owner: reordering, id: `row:${row.id}` }
                  : current?.owner === reordering &&
                      current.id === `row:${row.id}`
                    ? null
                    : current,
              )
            }
          />
        ) : null}
        {cell.content}
      </Table.Cell>
    );
  }
  return (
    <Table variant="secondary" className="tw-native-collection">
      <Table.ScrollContainer
        onKeyDownCapture={(event) => {
          if (
            event.key === "Escape" &&
            openMenu !== null &&
            reordering &&
            reorderingSnapshot(reordering.binding).ready &&
            !reorderingSnapshot(reordering.binding).pending
          ) {
            event.preventDefault();
            event.stopPropagation();
            setMenu((current) =>
              current?.owner === reordering && current.id === openMenu
                ? null
                : current,
            );
            return;
          }
          if (
            mode !== "none" &&
            event.key === "Escape" &&
            props.onCancelSelection
          ) {
            event.preventDefault();
            event.stopPropagation();
            props.onCancelSelection();
            return;
          }
          if (
            mode !== "multiple" &&
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "a"
          ) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          skipPlaceholderHeader(event, projected.columns);
        }}
      >
        <Table.Content
          ref={reordering?.scope}
          aria-label={props.label}
          selectionMode={mode}
          selectionBehavior="toggle"
          selectedKeys={selectedKeys}
          disabledKeys={props.rows
            .filter((row) => props.isSelectionDisabled || !eligible.has(row.id))
            .map((row) => row.id)}
          disabledBehavior="selection"
          {...(visiblePrimary
            ? {
                sortDescriptor: {
                  column: visiblePrimary.id,
                  direction: visiblePrimary.desc
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
            if (mode === "none" || props.isSelectionDisabled) return;
            if (keys === "all") {
              setPageSelected(true);
              return;
            }
            rangeKeys.current = { proposed: keys, baseline: selectedKeys };
            if (mode === "single") {
              if (keys.size > 1) return;
              const next = new Set(
                [...keys].filter(
                  (key): key is string =>
                    typeof key === "string" && eligible.has(key),
                ),
              );
              props.onSelectedIdsChange(next);
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
              <Table.Row
                key={row.id}
                id={row.id}
                textValue={row.textValue}
                ref={
                  reordering ? collectionRowRef(reordering, row.id) : undefined
                }
              >
                {projected.leaves.map((column) => renderCell(row, column))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
      {reordering ? <ReorderingNotice collection={reordering} /> : null}
      {props.diagnostics !== false ? (
        <Table.Footer>
          <span data-selected-count>
            {messages.selectedCount(props.selectedIds.size)}
          </span>
          <span role="status" aria-label={messages.sortOrderLabel}>
            {props.sorting.length
              ? props.sorting
                  .map((sort, index) =>
                    messages.sortEntry(
                      sort.id,
                      sort.desc ? "descending" : "ascending",
                      index + 1,
                    ),
                  )
                  .join(messages.sortSeparator)
              : messages.notSorted}
          </span>
        </Table.Footer>
      ) : null}
    </Table>
  );
}
