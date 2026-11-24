import type {
  ColumnOrderState,
  ColumnVisibilityState,
  PaginationState,
  ReactTable,
  Row,
  RowData,
  RowSelectionState,
  SortingState,
  Table,
  TableOptions,
  Updater,
} from "@tanstack/react-table";
import { normalizeQuery } from "../contracts/query.js";
import type { QuerySchema } from "../contracts/types.js";
import type { TableController, TableState } from "../controller/types.js";
import { createFilterEvaluator } from "../filters/evaluate.js";
import {
  type CriteriaCheck,
  type CriteriaNativeCallbacks,
  guardCriteriaCallback,
} from "../presentation/criteria-callbacks.js";
import {
  assertNativeController,
  assertNativeDefinition,
  assertNativeState,
  nativeFail,
} from "./definition.js";
import { nativeFeatures, predicateCarrierId } from "./features.js";
import { guardTableSortFn } from "./sort.js";
import type {
  NativeDefinition,
  NativeFeatures,
  NativeInput,
  NativePageInfo,
  NativeTableHandle,
  NativeTableView,
} from "./types.js";

function apply<T>(updater: Updater<T>, previous: T): T {
  try {
    return typeof updater === "function"
      ? (updater as (value: T) => T)(previous)
      : updater;
  } catch {
    return nativeFail("native.managed");
  }
}
interface Predicate<T> {
  readonly test: (record: T) => boolean;
}
// The controlled globalFilter VALUE carries the predicate. Changing only a
// globalFilterFn closure does not invalidate v9's filtered-row-model memo.
function compositeFilter<T extends RowData>(
  row: Row<NativeFeatures, T>,
  _id: string,
  value: unknown,
): boolean {
  if (
    value === null ||
    typeof value !== "object" ||
    !("test" in value) ||
    typeof value.test !== "function"
  )
    return nativeFail("native.managed");
  return (value as Predicate<T>).test(row.original);
}
function managedWrite(): never {
  return nativeFail("native.managed");
}

/** Internal options producer, deliberately not exported from the public entry. */
export function createNativeAdapter<S extends QuerySchema, T extends RowData>(
  definition: NativeDefinition<S, T>,
  controller: TableController<S>,
) {
  assertNativeDefinition(definition);
  assertNativeController(definition, controller);
  const initialDefinition = controller.getDefinition();
  const columns = Object.freeze([
    ...definition.columns,
    Object.freeze({
      id: predicateCarrierId,
      accessorFn: () => true,
      enableGlobalFilter: true,
      enableColumnFilter: false,
      enableSorting: false,
      enableMultiSort: false,
      enableHiding: false,
    }),
  ]);
  let projected: TableState<S> | undefined;
  let slices: {
    sorting: SortingState;
    pagination: PaginationState;
    rowSelection: RowSelectionState;
    columnVisibility: ColumnVisibilityState;
    columnOrder: ColumnOrderState;
    columnFilters: [];
  };
  let predicateQuery: TableState<S>["query"] | undefined;
  let predicateTime: number | undefined;
  let predicate: Predicate<T> | undefined;
  let predicateGate: CriteriaCheck | undefined;
  const current = () => {
    if (
      controller.isDisposed() ||
      controller.getDefinition() !== initialDefinition
    )
      nativeFail("native.lifecycle");
    const state = controller.getSnapshot();
    assertNativeState(definition, state);
    return state;
  };
  current();

  const onSortingChange = (
    updater: Updater<SortingState>,
    work?: CriteriaNativeCallbacks<S, T>,
  ): void => {
    current();
    controller.dispatch({
      type: "sorting.change",
      update(previous) {
        const state = controller.getSnapshot();
        const sorting = apply<SortingState>(
          updater,
          previous.map((sort) => ({ ...sort })),
        );
        const query = normalizeQuery(
          definition.controllerDefinition.schema,
          { ...state.query, sorting },
          work?.evaluation ?? definition.evaluation,
        );
        assertNativeState(definition, { ...state, query });
        return query.sorting;
      },
    });
  };
  const onPaginationChange = (updater: Updater<PaginationState>): void => {
    current();
    controller.dispatch({
      type: "pagination.change",
      update: (previous) => apply(updater, { ...previous }),
    });
  };
  const onRowSelectionChange = (updater: Updater<RowSelectionState>): void => {
    current();
    controller.dispatch({
      type: "selection.change",
      update(previous) {
        const native: RowSelectionState = Object.create(
          null,
        ) as RowSelectionState;
        for (const [id, selected] of Object.entries(previous))
          if (selected) native[id] = true;
        return apply(updater, native);
      },
    });
  };
  const onColumnVisibilityChange = (
    updater: Updater<ColumnVisibilityState>,
  ): void => {
    current();
    controller.dispatch({
      type: "columns.visibility",
      update(previous) {
        const next = apply(updater, {
          ...previous,
          [predicateCarrierId]: false,
        });
        if (next === null || typeof next !== "object" || Array.isArray(next))
          return nativeFail("native.managed");
        const { [predicateCarrierId]: _carrier, ...visibility } = next;
        return visibility;
      },
    });
  };
  const onColumnOrderChange = (updater: Updater<ColumnOrderState>): void => {
    current();
    controller.dispatch({
      type: "columns.order",
      update(previous) {
        const next = apply(updater, [...previous, predicateCarrierId]);
        if (!Array.isArray(next)) return nativeFail("native.managed");
        return next.filter((id) => id !== predicateCarrierId);
      },
    });
  };
  const callbacks = {
    onSortingChange,
    onPaginationChange,
    onRowSelectionChange,
    onColumnVisibilityChange,
    onColumnOrderChange,
    onColumnFiltersChange: managedWrite,
    onGlobalFilterChange: managedWrite,
  };
  const guardedCallbacks = (work?: CriteriaNativeCallbacks<S, T>) => {
    if (!work) return callbacks;
    const guardedUpdater = <Value>(updater: Updater<Value>): Updater<Value> =>
      typeof updater === "function"
        ? guardCriteriaCallback(
            updater as (value: Value) => Value,
            undefined,
            work.check,
          )
        : updater;
    const invoke = <Value>(
      fn: (update: Updater<Value>) => void,
      update: Updater<Value>,
    ) => {
      work.check();
      try {
        fn(guardedUpdater(update));
      } finally {
        work.check();
      }
    };
    return {
      ...callbacks,
      onSortingChange: (update: Updater<SortingState>) =>
        invoke((next) => onSortingChange(next, work), update),
      onPaginationChange: (update: Updater<PaginationState>) =>
        invoke(onPaginationChange, update),
      onRowSelectionChange: (update: Updater<RowSelectionState>) =>
        invoke(onRowSelectionChange, update),
      onColumnVisibilityChange: (update: Updater<ColumnVisibilityState>) =>
        invoke(onColumnVisibilityChange, update),
      onColumnOrderChange: (update: Updater<ColumnOrderState>) =>
        invoke(onColumnOrderChange, update),
    };
  };
  const bindTable = (
    table: Table<NativeFeatures, T>,
    work?: CriteriaNativeCallbacks<S, T>,
  ) => {
    work?.check();
    const mutations = guardedCallbacks(work);
    if (definition.selectionMode !== "multiple") {
      table.toggleAllPageRowsSelected = managedWrite;
      table.toggleAllRowsSelected = managedWrite;
      table.getToggleAllPageRowsSelectedHandler = () => managedWrite;
      table.getToggleAllRowsSelectedHandler = () => managedWrite;
      table.getIsAllPageRowsSelected = () => false;
      table.getIsSomePageRowsSelected = () => false;
    }
    // Vendor toggles can derive direction/visibility/selection from stale state.
    // Route model-context intent through the accepted owner instead.
    // This decorates actual native model methods; it does not process any rows.
    const flatColumns = table.getAllFlatColumns();
    if (work) {
      for (const column of flatColumns) {
        if (column.accessorFn)
          column.accessorFn = guardCriteriaCallback(
            column.accessorFn,
            undefined,
            work.check,
            true,
          );
      }
      // v9's sorted model calls the static column_getSortFn, not the method slot.
      // Resolve auto/string through the real vendor, then capture the selected
      // comparator into this actual vendor-owned column def. No registry rewrite.
      if (!table.options.manualSorting)
        for (const sort of table.atoms.sorting.get()) {
          const column = table.getColumn(sort.id);
          if (column && typeof column.columnDef.sortFn !== "function") {
            work.check();
            const resolved = column.getSortFn();
            work.check();
            column.columnDef.sortFn = guardTableSortFn(resolved, work.check);
          }
        }
    }
    for (const column of flatColumns) {
      // Wrap the actual resolved vendor accessor, including accessorKey defaults.
      column.toggleVisibility = (visible) => {
        current();
        if (visible !== undefined && typeof visible !== "boolean")
          nativeFail("native.managed");
        if (!column.getCanHide()) return;
        const leaves = column.getLeafColumns();
        mutations.onColumnVisibilityChange((previous) => {
          const next = { ...previous };
          const nextVisible =
            visible ?? !leaves.some((leaf) => previous[leaf.id] !== false);
          for (const leaf of leaves)
            if (leaf.getCanHide()) next[leaf.id] = nextVisible;
          return next;
        });
      };
      column.getToggleVisibilityHandler = () => (event: unknown) => {
        if (event === null || typeof event !== "object" || !("target" in event))
          return nativeFail("native.managed");
        const target: unknown = event.target;
        if (
          target === null ||
          typeof target !== "object" ||
          !("checked" in target) ||
          typeof target.checked !== "boolean"
        )
          return nativeFail("native.managed");
        column.toggleVisibility(target.checked);
      };
      column.toggleSorting = (desc, multi) => {
        current();
        if (!column.getCanSort()) return;
        const first = column.getFirstSortDir() === "desc";
        const multiple = multi === true && column.getCanMultiSort();
        mutations.onSortingChange((previous) => {
          const existing = previous.find((sort) => sort.id === column.id);
          const nextDesc = desc ?? (existing ? !existing.desc : first);
          const remove =
            desc === undefined && existing && existing.desc !== first;
          if (remove)
            return multiple
              ? previous.filter((sort) => sort.id !== column.id)
              : [];
          if (!multiple) return [{ id: column.id, desc: nextDesc }];
          return existing
            ? previous.map((sort) =>
                sort.id === column.id ? { ...sort, desc: nextDesc } : sort,
              )
            : [...previous, { id: column.id, desc: nextDesc }];
        });
      };
      column.getToggleSortingHandler = () =>
        column.getCanSort()
          ? (event: unknown) => {
              const multi =
                event !== null &&
                typeof event === "object" &&
                "shiftKey" in event &&
                event.shiftKey === true;
              column.toggleSorting(undefined, multi);
            }
          : undefined;
    }
    for (const row of table.getCoreRowModel().flatRows) {
      row.toggleSelected = (selected) => {
        current();
        if (selected !== undefined && typeof selected !== "boolean")
          nativeFail("native.managed");
        mutations.onRowSelectionChange((previous) => {
          const nextSelected = selected ?? !previous[row.id];
          if (nextSelected && !row.getCanSelect()) return previous;
          const next = Object.assign(
            Object.create(null) as RowSelectionState,
            nextSelected && definition.selectionMode === "single"
              ? {}
              : previous,
          );
          if (nextSelected) next[row.id] = true;
          else delete next[row.id];
          return next;
        });
      };
      row.getToggleSelectedHandler = () => (event: unknown) => {
        if (event === null || typeof event !== "object" || !("target" in event))
          return nativeFail("native.managed");
        const target: unknown = event.target;
        if (
          target === null ||
          typeof target !== "object" ||
          !("checked" in target) ||
          typeof target.checked !== "boolean"
        )
          return nativeFail("native.managed");
        row.toggleSelected(target.checked);
      };
    }
    work?.check();
    return table;
  };
  const assertInput = (
    input: NativeInput<T>,
    work?: CriteriaNativeCallbacks<S, T>,
  ) => {
    work?.check();
    if (
      !input ||
      !Array.isArray(input.records) ||
      (input.mode !== "client" &&
        input.mode !== "server" &&
        input.mode !== "server-complete")
    )
      nativeFail("native.rows");
    if (!definition.paginationEnabled && input.mode === "server")
      nativeFail("native.page");
    if (input.mode === "server-complete") {
      if (definition.paginationEnabled) nativeFail("native.page");
      const page = input.pageInfo;
      if (
        page?.kind !== "known" ||
        !Number.isSafeInteger(page.total) ||
        page.total < 0 ||
        page.total !== input.records.length
      )
        nativeFail("native.page");
      // Complete shape/count denial precedes all private record callbacks.
      if (Object.keys(input.records).length !== input.records.length)
        nativeFail("native.rows");
      for (let index = 0; index < input.records.length; index++) {
        const field = Object.getOwnPropertyDescriptor(
          input.records,
          String(index),
        );
        if (
          !field ||
          !Object.hasOwn(field, "value") ||
          field.value === null ||
          typeof field.value !== "object"
        )
          nativeFail("native.rows");
      }
    }
    const seen = new Set<string>();
    const ids = input.records.map((record) => {
      let id: unknown;
      try {
        id = work ? work.getRowId(record) : definition.getRowId(record);
      } catch {
        return nativeFail("native.rows");
      }
      if (typeof id !== "string" || !id.length || seen.has(id))
        return nativeFail("native.rows");
      seen.add(id);
      return id;
    });
    if (ids.length !== Object.keys(input.records).length)
      nativeFail("native.rows");
    if (input.mode === "server") {
      const page = input.pageInfo;
      if (
        !page ||
        (page.kind !== "known" && page.kind !== "unknown") ||
        (page.kind === "known" &&
          (!Number.isSafeInteger(page.total) || page.total < 0)) ||
        (page.kind === "unknown" && typeof page.hasNextPage !== "boolean")
      )
        nativeFail("native.page");
    }
    work?.check();
    return ids;
  };

  const getOptions = (
    input: NativeInput<T>,
    state: TableState<S> = current(),
    work?: CriteriaNativeCallbacks<S, T>,
  ): TableOptions<NativeFeatures, T> => {
    current();
    assertNativeState(definition, state);
    work?.check();
    const ids = assertInput(input, work);
    if (projected !== state) {
      const rowSelection: RowSelectionState = Object.create(
        null,
      ) as RowSelectionState;
      for (const [id, selected] of Object.entries(state.selection))
        if (selected) rowSelection[id] = true;
      slices = {
        sorting:
          projected?.query.sorting === state.query.sorting
            ? slices.sorting
            : state.query.sorting.map((sort) => ({ ...sort })),
        pagination:
          projected?.query.pagination === state.query.pagination
            ? slices.pagination
            : { ...state.query.pagination },
        rowSelection:
          projected?.selection === state.selection
            ? slices.rowSelection
            : rowSelection,
        columnVisibility:
          projected?.columns.visibility === state.columns.visibility
            ? slices.columnVisibility
            : {
                ...state.columns.visibility,
                [predicateCarrierId]: false,
              },
        columnOrder:
          projected?.columns.order === state.columns.order
            ? slices.columnOrder
            : [...state.columns.order, predicateCarrierId],
        columnFilters: projected ? slices.columnFilters : [],
      };
      for (const value of Object.values(slices)) Object.freeze(value);
      for (const sort of slices.sorting) Object.freeze(sort);
      projected = state;
    }
    if (
      input.mode === "client" &&
      (predicateQuery !== state.query ||
        predicateTime !== state.evaluatedAt ||
        predicateGate !== work?.check)
    ) {
      predicate = Object.freeze({
        test: createFilterEvaluator(
          definition.controllerDefinition.schema,
          state.query,
          {
            ...(work?.evaluation ?? definition.evaluation),
            now: state.evaluatedAt,
          },
        ),
      });
      predicateQuery = state.query;
      predicateTime = state.evaluatedAt;
      predicateGate = work?.check;
    }
    const manual = input.mode === "server" || input.mode === "server-complete";
    const options: TableOptions<NativeFeatures, T> = {
      features: nativeFeatures,
      columns: work
        ? Object.freeze([
            ...work.columns,
            columns[columns.length - 1] ?? nativeFail("native.definition"),
          ])
        : columns,
      data: input.records,
      getRowId: (_record, index) => {
        work?.check();
        return ids[index] ?? nativeFail("native.rows");
      },
      state: { ...slices, globalFilter: manual ? undefined : predicate },
      ...guardedCallbacks(work),
      autoResetAll: false,
      autoResetPageIndex: false,
      autoResetSorting: false,
      enableFilters: true,
      enableColumnFilters: false,
      enableGlobalFilter: true,
      getColumnCanGlobalFilter: (column) => column.id === predicateCarrierId,
      globalFilterFn: compositeFilter,
      enableMultiSort: definition.multiSort,
      enableRowSelection: definition.controllerDefinition.selection
        ? (row) => {
            work?.check();
            const isRowSelectable =
              work?.isRowSelectable ?? definition.isRowSelectable;
            if (!isRowSelectable) return true;
            try {
              const eligible = work
                ? isRowSelectable(row.original)
                : definition.isRowSelectable?.(row.original);
              if (typeof eligible !== "boolean") nativeFail("native.rows");
              return eligible;
            } catch {
              return nativeFail("native.rows");
            }
          }
        : false,
      enableRowRangeSelection: false,
      enableMultiRowSelection: definition.selectionMode === "multiple",
      enableSubRowSelection: false,
      manualFiltering: manual,
      manualSorting: manual,
      manualPagination: manual || !definition.paginationEnabled,
    };
    // v9 shallow-merges options. Omission would retain an earlier total/-1 when
    // metadata or processing mode changes. Its exact optional declarations do
    // not admit explicit undefined, although its runtime uses it to clear these
    // options. Define those own keys deliberately, without widening vendor types.
    Object.defineProperties(options, {
      rowCount: {
        enumerable: true,
        value:
          (input.mode === "server" || input.mode === "server-complete") &&
          input.pageInfo.kind === "known"
            ? input.pageInfo.total
            : undefined,
      },
      pageCount: {
        enumerable: true,
        value:
          input.mode === "server"
            ? input.pageInfo.kind === "unknown"
              ? -1
              : Math.ceil(
                  input.pageInfo.total / state.query.pagination.pageSize,
                )
            : undefined,
      },
    });
    work?.check();
    return options;
  };

  const getView = (
    table: ReactTable<NativeFeatures, T>,
    input: NativeInput<T>,
    state: TableState<S>,
    work?: CriteriaNativeCallbacks<S, T>,
  ): NativeTableView<S, T> => {
    work?.check();
    const rows = table.getRowModel().rows;
    const eligibleIds =
      definition.selectionMode === "multiple"
        ? rows.filter((row) => row.getCanSelect()).map((row) => row.id)
        : [];
    const selectedOnPage = eligibleIds.filter(
      (id) => state.selection[id],
    ).length;
    const pageInfo: NativePageInfo =
      input.mode === "server" || input.mode === "server-complete"
        ? Object.freeze({ ...input.pageInfo })
        : Object.freeze({
            kind: "known",
            total: table.getFilteredRowModel().rows.length,
          });
    const pageCount =
      definition.paginationEnabled && pageInfo.kind === "known"
        ? Math.ceil(pageInfo.total / state.query.pagination.pageSize)
        : null;
    const canPreviousPage =
      definition.paginationEnabled && state.query.pagination.pageIndex > 0;
    const canNextPage =
      definition.paginationEnabled &&
      (pageInfo.kind === "unknown"
        ? pageInfo.hasNextPage
        : state.query.pagination.pageIndex + 1 < (pageCount ?? 0));
    const native: NativeTableHandle<T> = Object.freeze({
      Subscribe: table.Subscribe,
      FlexRender: table.FlexRender,
      atoms: Object.freeze({ ...table.atoms }),
      store: table.store,
      getColumn: table.getColumn,
      getRow: table.getRow,
      getRowModel: table.getRowModel,
      getFilteredRowModel: table.getFilteredRowModel,
      getSortedRowModel: table.getSortedRowModel,
      getHeaderGroups: table.getHeaderGroups,
      getVisibleLeafColumns: table.getVisibleLeafColumns,
      setSorting: table.setSorting,
      setPagination: table.setPagination,
      setRowSelection: table.setRowSelection,
      setColumnVisibility: table.setColumnVisibility,
      setColumnOrder: table.setColumnOrder,
    });
    const view: NativeTableView<S, T> = Object.freeze({
      selectionMode: definition.selectionMode,
      native,
      controller,
      state,
      rows,
      headerGroups: table.getHeaderGroups(),
      visibleColumns: table.getVisibleLeafColumns(),
      selectedIds: Object.freeze(Object.keys(state.selection)),
      pageSelection: Object.freeze({
        eligibleIds: Object.freeze(eligibleIds),
        checked:
          eligibleIds.length > 0 && selectedOnPage === eligibleIds.length,
        mixed: selectedOnPage > 0 && selectedOnPage < eligibleIds.length,
      }),
      pagination: Object.freeze({
        enabled: definition.paginationEnabled,
        pageInfo,
        pageCount,
        canPreviousPage,
        canNextPage,
      }),
      selectPage(selected: boolean) {
        work?.check();
        current();
        if (definition.selectionMode !== "multiple")
          nativeFail("native.managed");
        return controller.dispatch({
          type: "selection.page",
          pageIds: rows.map((row) => row.id),
          eligibleIds,
          selected,
          queryIdentity: state.queryIdentity,
        });
      },
      cancelSelection: () => {
        work?.check();
        return controller.dispatch({ type: "selection.cancel" });
      },
      previousPage() {
        work?.check();
        if (current().queryIdentity !== state.queryIdentity)
          nativeFail("native.page");
        if (!definition.paginationEnabled) nativeFail("native.page");
        if (canPreviousPage)
          onPaginationChange((previous) => ({
            ...previous,
            pageIndex: previous.pageIndex - 1,
          }));
      },
      nextPage() {
        work?.check();
        if (current().queryIdentity !== state.queryIdentity)
          nativeFail("native.page");
        if (!definition.paginationEnabled) nativeFail("native.page");
        if (canNextPage)
          onPaginationChange((previous) => ({
            ...previous,
            pageIndex: previous.pageIndex + 1,
          }));
      },
    });
    work?.check();
    return view;
  };
  return { getOptions, getView, bindTable };
}
