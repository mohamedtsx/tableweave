"use client";

import type {
  ControlsAuthority,
  ControlsPresentation,
  NativeCell,
  NativeColumn,
  NativeDefinition,
  NativeHeader,
  NativeRow,
  NativeTableHandle,
  NativeTableView,
} from "@tableweave/react";
import { getControlsAuthorityOwner } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import { memo, useCallback, useMemo } from "react";
import {
  type CollectionMessages,
  defaultCollectionMessages,
} from "./collection-messages.js";
import type { CollectionColumn } from "./collection-projection.js";
import type { CollectionRow } from "./controlled-collection.js";
import { ControlledCollection } from "./controlled-collection.js";
import {
  TableRendererCollection,
  TableRendererNativeContent,
} from "./renderer-collection.js";
import {
  captureTableRendererProp,
  requireTableRendererMember,
  requireTableRendererTarget,
  TableRendererCommitError,
  tableRendererBoundary,
} from "./renderer-commit.js";
import type { TableRendererTarget } from "./types.js";

/** Presentation only: callers supply the current view, not just a stable handle. */
export interface NativeCollectionProps<
  S extends QuerySchema,
  T extends object,
> {
  /** @internal Presence opts into exact factory renderer ownership, never a grant. */
  readonly renderer?: TableRendererTarget<S, T>;
  readonly view: NativeTableView<S, T>;
  readonly label: string;
  readonly rowHeaderColumnId: string;
  readonly selectionColumnId?: string;
  readonly columnTextValue: (column: NativeColumn<T>) => string;
  readonly rowTextValue: (row: NativeRow<T>) => string;
  readonly cellTextValue: (cell: NativeCell<T>) => string;
  readonly controls?: {
    readonly definition: NativeDefinition<S, T>;
    readonly presentation: ControlsPresentation<S, T>;
    readonly authority: ControlsAuthority<S, T>;
  };
  readonly messages?: Partial<CollectionMessages>;
  readonly diagnostics?: boolean;
}

// Subscribe remains inside a memoized leaf receiving the stable native handle.
// Parent model/metadata refreshes cannot masquerade as its selection subscription.
const NativeSelectionCount = memo(function NativeSelectionCount({
  native,
  messages,
}: {
  readonly native: Pick<NativeTableHandle<object>, "Subscribe" | "atoms">;
  readonly messages: CollectionMessages;
}) {
  return (
    <native.Subscribe
      source={native.atoms.rowSelection}
      selector={(selection) => Object.values(selection).filter(Boolean).length}
    >
      {(count) => (
        <output aria-label={messages.subscribedCountLabel}>
          {messages.subscribedCount(count)}
        </output>
      )}
    </native.Subscribe>
  );
});

export function NativeCollection<S extends QuerySchema, T extends object>(
  props: NativeCollectionProps<S, T>,
) {
  const candidate = captureTableRendererProp<S, T>(props);
  if (candidate.kind === "denied") return null;
  if (candidate.kind === "target")
    return <TableRendererCollection target={candidate.target} />;
  return <NativeCollectionContent input={props} />;
}

/** Source-private shared producer; absence retains raw projection/event/JSX policy. */
export function NativeCollectionContent<
  S extends QuerySchema,
  T extends object,
>({
  input: props,
  target,
}: {
  readonly input: NativeCollectionProps<S, T>;
  readonly target?: TableRendererTarget<S, T>;
}) {
  // The shared projection may be scheduled after its parent. Deny before any
  // input view/message/action payload, not just before app formatter invocation.
  if (target) requireTableRendererTarget(target);
  const entry = useCallback(
    <Value,>(read: () => Value): Value =>
      target ? tableRendererBoundary(target, read) : read(),
    [target],
  );
  const eligible = () => {
    if (!target) return true;
    try {
      requireTableRendererTarget(target);
      return true;
    } catch {
      return false;
    }
  };
  const { view } = props;
  const messages = useMemo(() => {
    try {
      return entry(() => ({ ...defaultCollectionMessages, ...props.messages }));
    } catch (error) {
      if (target && error instanceof TableRendererCommitError)
        return defaultCollectionMessages;
      throw error;
    }
  }, [props.messages, target, entry]);
  const controls = props.controls;
  const presentation = controls?.presentation;
  const authority = controls?.authority;
  const suppliedDefinition = controls?.definition;
  const matchesOwner = () => {
    if (!authority) return controls === undefined;
    const owner = getControlsAuthorityOwner(authority);
    return (
      owner !== null &&
      owner.definition === suppliedDefinition &&
      owner.controller === view.controller
    );
  };
  const sameRows = (a: readonly NativeRow<T>[], b: readonly NativeRow<T>[]) =>
    a.length === b.length && a.every((row, index) => row === b[index]);
  const masked =
    (controls !== undefined && presentation === undefined) ||
    !matchesOwner() ||
    (presentation !== undefined &&
      (presentation.requestedQuery === null ||
        presentation.selectionMode !== view.selectionMode ||
        presentation.selectedIds.length !== view.selectedIds.length ||
        presentation.selectedIds.some((id) => !view.selectedIds.includes(id)) ||
        (presentation.rows.length > 0 &&
          !sameRows(presentation.rows, view.rows))));
  const renderRows = presentation?.rows ?? view.rows;
  const selected = presentation?.selectedIds ?? view.selectedIds;
  const eligibleIds =
    presentation?.eligiblePageIds ??
    (view.selectionMode === false
      ? []
      : view.rows.filter((row) => row.getCanSelect()).map((row) => row.id));
  const projected = useMemo(() => {
    try {
      return entry(() => {
        if (masked) return null;
        const visible = new Map(
          view.visibleColumns.map((column) => [column.id, column]),
        );
        const preferred = view.controller
          .getDefinition()
          .columns.find((column) => column.id === props.rowHeaderColumnId);
        const rowHeader =
          visible.get(props.rowHeaderColumnId) ??
          view.visibleColumns.find((column) => !column.columnDef.meta?.utility);
        if (
          !preferred ||
          preferred.utility ||
          !rowHeader ||
          rowHeader.columnDef.meta?.utility
        ) {
          throw new Error(messages.invalidRowHeader);
        }
        const rowHeaderId = rowHeader.id;
        if (
          props.selectionColumnId &&
          !visible.get(props.selectionColumnId)?.columnDef.meta?.utility
        ) {
          throw new Error(messages.invalidSelectionColumn);
        }
        const native = view.native;
        function headerColumns(header: NativeHeader<T>): CollectionColumn[] {
          if (target) requireTableRendererMember(target, "header", header);
          if (header.isPlaceholder)
            return header.subHeaders.flatMap(headerColumns);
          const column = header.column;
          if (column.columns.length > 0) {
            const children = header.subHeaders.flatMap(headerColumns);
            return children.length
              ? [
                  {
                    kind: "group",
                    id: column.id,
                    label: target ? (
                      <TableRendererNativeContent
                        target={target}
                        header={header}
                      />
                    ) : (
                      <native.FlexRender header={header} />
                    ),
                    textValue: entry(() => props.columnTextValue(column)),
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
              label: target ? (
                <TableRendererNativeContent target={target} header={header} />
              ) : (
                <native.FlexRender header={header} />
              ),
              textValue: entry(() => props.columnTextValue(column)),
              isRowHeader: column.id === rowHeaderId,
              allowsSorting: entry(() => column.getCanSort()),
              isSelection: column.id === props.selectionColumnId,
            },
          ];
        }
        const columns =
          view.headerGroups[0]?.headers.flatMap(headerColumns) ?? [];
        const rows: CollectionRow[] = renderRows.map((row) => {
          if (target) requireTableRendererTarget(target);
          const nativeCells = new Map(
            entry(() => row.getVisibleCells()).map((cell) => [
              cell.column.id,
              cell,
            ]),
          );
          const cells: CollectionRow["cells"] = Object.fromEntries(
            view.visibleColumns.map((column) => {
              const cell = nativeCells.get(column.id);
              if (!cell) throw new Error(messages.missingCell);
              return [
                column.id,
                {
                  content: target ? (
                    <TableRendererNativeContent target={target} cell={cell} />
                  ) : (
                    <native.FlexRender cell={cell} />
                  ),
                  textValue: entry(() => props.cellTextValue(cell)),
                },
              ];
            }),
          );
          return {
            id: row.id,
            textValue: entry(() => props.rowTextValue(row)),
            cells,
          };
        });
        return { columns, rows };
      });
    } catch (error) {
      if (target && error instanceof TableRendererCommitError) return null;
      throw error;
    }
  }, [
    view.native,
    view.headerGroups,
    view.visibleColumns,
    props.rowHeaderColumnId,
    props.selectionColumnId,
    props.columnTextValue,
    props.rowTextValue,
    props.cellTextValue,
    view.controller,
    renderRows,
    masked,
    messages,
    target,
    entry,
  ]);

  if (!projected || masked || !eligible())
    return <div className="tw-native-collection" />;
  const sameSelection = (selection: Readonly<Record<string, boolean>>) => {
    const keys = Object.keys(selection).filter((id) => selection[id]);
    return (
      keys.length === selected.length &&
      keys.every((id) => selected.includes(id))
    );
  };
  function guard(ids: readonly string[], page = false): boolean {
    if (!eligible()) return false;
    if (!matchesOwner()) return false;
    const state = view.controller.getSnapshot();
    if (
      view.controller.isDisposed() ||
      state.definitionIdentity !== view.state.definitionIdentity ||
      state.queryIdentity !== view.state.queryIdentity ||
      !sameSelection(state.selection)
    )
      return false;
    if (authority) {
      const facts = authority.require(
        page
          ? { type: "select-page" }
          : { type: "select-row", id: ids[0] ?? "" },
      );
      if (
        !sameRows(facts.rows, renderRows) ||
        !sameSelection(
          Object.fromEntries(facts.selectedIds.map((id) => [id, true])),
        )
      )
        return false;
      if (page && facts.eligiblePageIds.length !== ids.length) return false;
      for (const id of ids) {
        if (!facts.eligiblePageIds.includes(id)) return false;
        if (!page) authority.require({ type: "select-row", id });
      }
    } else {
      if (
        !sameRows(view.native.getRowModel().rows, renderRows) ||
        ids.some((id) => !eligibleIds.includes(id))
      )
        return false;
    }
    return eligible();
  }
  function changeSelection(ids: ReadonlySet<string>) {
    try {
      const requested = new Set(ids);
      const changed = eligibleIds.filter(
        (id) => requested.has(id) !== selected.includes(id),
      );
      if (!changed.length || !guard(changed)) return;
      if (authority && view.selectionMode === "single") {
        const target = eligibleIds.find((id) => requested.has(id));
        const removed = changed.find((id) => !requested.has(id));
        if (target) authority.selectRow(target, true);
        else if (removed) authority.selectRow(removed, false);
        return;
      }
      if (authority && changed.length === 1) {
        const id = changed[0];
        if (id) authority.selectRow(id, requested.has(id));
        return;
      }
      view.native.setRowSelection((previous) => {
        // RAC may deliver a batch/range. Recheck domain, query, actual row models,
        // eligibility AND accepted baseline inside the one final updater too.
        try {
          if (!sameSelection(previous) || !guard(changed)) return previous;
          const replace =
            view.selectionMode === "single" &&
            changed.some((id) => requested.has(id));
          const next = Object.assign(
            Object.create(null) as Record<string, boolean>,
            replace ? {} : previous,
          );
          for (const id of changed) {
            if (requested.has(id)) next[id] = true;
            else delete next[id];
          }
          return next;
        } catch {
          return previous;
        }
      });
    } catch {
      /* Rejected/obsolete UI intent: no optimistic selection or raw error. */
    }
  }

  return (
    <>
      <ControlledCollection
        label={props.label}
        selectionMode={
          view.selectionMode === false ? "none" : view.selectionMode
        }
        columns={projected.columns}
        rows={projected.rows}
        selectedIds={new Set(selected)}
        eligiblePageIds={eligibleIds}
        isSelectionDisabled={
          presentation ? !presentation.canSelect : view.selectionMode === false
        }
        sorting={
          presentation?.requestedQuery?.sorting ?? view.state.query.sorting
        }
        messages={messages}
        diagnostics={props.diagnostics ?? true}
        onPageSelectionChange={(selected) => {
          try {
            if (view.selectionMode !== "multiple" || !guard(eligibleIds, true))
              return;
            if (authority) authority.selectPage(selected);
            else view.selectPage(selected);
          } catch {
            /* Denied by current authority. */
          }
        }}
        onSelectedIdsChange={changeSelection}
        onCancelSelection={() => {
          try {
            if (!eligible() || !matchesOwner()) return;
            if (authority) authority.cancelSelection();
            else view.cancelSelection();
          } catch {
            /* Cancel is scoped recovery, not a captured-row clear. */
          }
        }}
        onSort={(id, additive) => {
          try {
            if (!eligible() || !matchesOwner()) return;
            if (authority) {
              authority.require({ type: "sort" });
            }
            const column = view.visibleColumns.find(
              (column) => column.id === id,
            );
            if (column?.getCanSort()) column.toggleSorting(undefined, additive);
          } catch {
            /* Denied by current owner; never duplicate sorting policy. */
          }
        }}
      />
      {props.diagnostics !== false ? (
        presentation ? (
          <output aria-label={messages.subscribedCountLabel}>
            {messages.subscribedCount(selected.length)}
          </output>
        ) : (
          <NativeSelectionCount native={view.native} messages={messages} />
        )
      ) : null}
    </>
  );
}
