import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import type { StateProposal } from "../../packages/react/src/controller/types.js";
import { predicateCarrierId } from "../../packages/react/src/tanstack/features.js";
import {
  createNativeController,
  defineNativeTable,
  NativeBridgeError,
  type NativeDefinitionInput,
  type NativeTableView,
  useNativeTable,
} from "../../packages/react/src/tanstack/index.js";
import {
  definition,
  fixture,
  initial,
  type RecordRow,
  records,
  schema,
} from "./fixtures.js";

const vendor = createRequire(
  new URL("../../packages/react/package.json", import.meta.url),
);
const React = vendor("react") as typeof import("react");
const { renderToString } = vendor(
  "react-dom/server",
) as typeof import("react-dom/server");

describe("actual v9 native pipeline and accepted-state callbacks", () => {
  it("runs flat Any and repeated same-field rules before native sorting/pagination", () => {
    const { controller, table, sync } = fixture({}, true);
    controller.dispatch({
      type: "builder.commit",
      rule: { id: "r1", field: "amount", operator: "number.lt", value: 20 },
    });
    controller.dispatch({
      type: "builder.commit",
      rule: { id: "r2", field: "category", operator: "text.is", value: "one" },
    });
    controller.dispatch({ type: "builder.join", join: "or" });
    table.setSorting([{ id: "amount", desc: false }]);
    sync();
    expect(table.getFilteredRowModel().rows.map((row) => row.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(table.getSortedRowModel().rows.map((row) => row.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
    expect(table.getRowModel().rows.map((row) => row.id)).toEqual(["b", "c"]);
    controller.dispatch({ type: "builder.clear" });
    controller.dispatch({
      type: "builder.commit",
      rule: { id: "r3", field: "amount", operator: "number.lt", value: 20 },
    });
    controller.dispatch({
      type: "builder.commit",
      rule: { id: "r4", field: "amount", operator: "number.gt", value: 30 },
    });
    sync();
    expect(table.getFilteredRowModel().rows.map((row) => row.id)).toEqual([
      "b",
      "d",
    ]);
    controller.dispatch({ type: "search.commit", search: "beta" });
    sync();
    expect(table.getFilteredRowModel().rows.map((row) => row.id)).toEqual([
      "b",
    ]);
  });
  it("uses one hidden accessor carrier and rejects the competing filter path", () => {
    const { table } = fixture();
    expect(
      table
        .getAllLeafColumns()
        .filter((column) => column.getCanGlobalFilter())
        .map((column) => column.id),
    ).toEqual([predicateCarrierId]);
    expect(table.getVisibleLeafColumns().map((column) => column.id)).toEqual([
      "selection",
      "title",
      "amount",
      "category",
    ]);
    expect(
      table
        .getHeaderGroups()
        .flatMap((group) => group.headers)
        .every((header) => header.column.id !== predicateCarrierId),
    ).toBe(true);
    expect(
      table
        .getRowModel()
        .rows[0]?.getVisibleCells()
        .every((cell) => cell.column.id !== predicateCarrierId),
    ).toBe(true);
    expect(() => table.setGlobalFilter("bad")).toThrow(NativeBridgeError);
    expect(() => table.setColumnFilters([{ id: "amount", value: 1 }])).toThrow(
      NativeBridgeError,
    );
  });
  it("keeps controlled proposals rejected until acceptance and emits one complete query", () => {
    let proposal: StateProposal<typeof schema> | undefined;
    let queries = 0;
    const { controller, table, sync } = fixture({
      initial: {
        query: { ...initial(), pagination: { pageIndex: 1, pageSize: 2 } },
      },
      controlled: ["query"],
      onRequest: (next) => {
        proposal = next;
      },
      onQueryChange: () => {
        queries++;
      },
    });
    const before = controller.getSnapshot();
    table.setSorting([{ id: "amount", desc: false }]);
    expect(controller.getSnapshot()).toBe(before);
    sync();
    expect(table.getRowModel().rows.map((row) => row.id)).toEqual(["c", "d"]);
    if (!proposal) throw new Error("Missing proposal");
    controller.reject(proposal);
    table.setSorting([{ id: "amount", desc: false }]);
    if (!proposal) throw new Error("Missing proposal");
    controller.accept(proposal);
    sync();
    expect(controller.getSnapshot().query.pagination.pageIndex).toBe(0);
    expect(table.getRowModel().rows.map((row) => row.id)).toEqual(["b", "c"]);
    expect(queries).toBe(1);
  });
  it("applies same-turn functional updaters to latest accepted state without a render", () => {
    const { controller, table } = fixture({}, true);
    table.setSorting((old) => [...old, { id: "amount", desc: false }]);
    table.setSorting((old) => [...old, { id: "title", desc: false }]);
    expect(
      controller.getSnapshot().query.sorting.map((sort) => sort.id),
    ).toEqual(["amount", "title"]);
    table.setPagination((old) => ({ ...old, pageIndex: old.pageIndex + 1 }));
    table.setPagination((old) => ({ ...old, pageIndex: old.pageIndex + 1 }));
    expect(controller.getSnapshot().query.pagination.pageIndex).toBe(2);
    table.setPagination((old) => ({ ...old, pageSize: 25 }));
    expect(controller.getSnapshot().query.pagination).toEqual({
      pageIndex: 0,
      pageSize: 25,
    });
  });
  it("preserves off-page IDs and selects only eligible current-page rows", () => {
    const { controller, table, sync } = fixture();
    table.setRowSelection({ offpage: true });
    sync();
    table.toggleAllPageRowsSelected(true);
    expect(controller.getSnapshot().selection).toEqual({
      offpage: true,
      a: true,
    });
    sync();
    expect(table.getIsAllPageRowsSelected()).toBe(true);
    expect(table.getSelectedRowModel().rows.map((row) => row.id)).toEqual([
      "a",
    ]);
    table.toggleAllPageRowsSelected(false);
    expect(controller.getSnapshot().selection).toEqual({ offpage: true });
  });
  it("keeps carrier out of controller presentation and enforces hidden/group/utility order", () => {
    const { controller, table, sync } = fixture();
    table.getColumn("amount")?.toggleVisibility(false);
    sync();
    expect(controller.getSnapshot().columns.visibility).toEqual({
      amount: false,
    });
    table.setColumnVisibility((old) => ({
      ...old,
      [predicateCarrierId]: true,
    }));
    sync();
    expect(table.getColumn(predicateCarrierId)?.getIsVisible()).toBe(false);
    expect(() =>
      table.setColumnOrder([
        "selection",
        "amount",
        "title",
        "category",
        predicateCarrierId,
      ]),
    ).toThrow();
    expect(() =>
      table.setColumnOrder([
        "title",
        "selection",
        "amount",
        "category",
        predicateCarrierId,
      ]),
    ).toThrow();
    table.getColumn("amount")?.toggleVisibility(true);
    sync();
    table.setColumnOrder([
      "selection",
      "amount",
      "title",
      "category",
      predicateCarrierId,
    ]);
    sync();
    expect(controller.getSnapshot().columns.order).toEqual([
      "selection",
      "amount",
      "title",
      "category",
    ]);
    expect(table.getVisibleLeafColumns().map((column) => column.id)).toEqual([
      "selection",
      "amount",
      "title",
      "category",
    ]);
  });
  it("does not reprocess a partial manual page and refreshes same-query records", () => {
    const { controller, table, sync } = fixture();
    controller.dispatch({
      type: "builder.commit",
      rule: { id: "r1", field: "amount", operator: "number.gt", value: 1000 },
    });
    table.setSorting([{ id: "amount", desc: false }]);
    const page = [records[0], records[1], records[2]].filter(
      (row): row is RecordRow => row !== undefined,
    );
    sync({
      mode: "server",
      records: page,
      pageInfo: { kind: "known", total: 50 },
    });
    expect(table.getRowModel().rows.map((row) => row.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(table.getRowCount()).toBe(50);
    const replacement = [
      {
        id: "fresh",
        amount: 1,
        title: "fresh",
        category: "one",
        eligible: true,
      },
    ];
    sync({
      mode: "server",
      records: replacement,
      pageInfo: { kind: "known", total: 1 },
    });
    expect(table.getRowModel().rows.map((row) => row.id)).toEqual(["fresh"]);
    expect(table.getRowCount()).toBe(1);
  });
  it("keeps unrelated native projections stable on selection-only transitions", () => {
    const { table, controller, optionsFor, sync } = fixture();
    const before = optionsFor().state;
    const rows = table.getRowModel();
    controller.dispatch({ type: "selection.change", update: { a: true } });
    const after = optionsFor().state;
    expect(after?.sorting).toBe(before?.sorting);
    expect(after?.pagination).toBe(before?.pagination);
    expect(after?.columnFilters).toBe(before?.columnFilters);
    expect(after?.globalFilter).toBe(before?.globalFilter);
    expect(after?.rowSelection).not.toBe(before?.rowSelection);
    sync();
    expect(table.getRowModel()).toBe(rows);
  });
  it("clears previously resolved pagination metadata across known/unknown/client transitions", () => {
    const { table, sync } = fixture();
    sync({
      mode: "server",
      records,
      pageInfo: { kind: "unknown", hasNextPage: false },
    });
    expect(table.getPageCount()).toBe(-1);
    sync({ mode: "server", records, pageInfo: { kind: "known", total: 3 } });
    expect(table.getPageCount()).toBe(2);
    expect(table.getRowCount()).toBe(3);
    sync({
      mode: "server",
      records,
      pageInfo: { kind: "unknown", hasNextPage: false },
    });
    expect(table.getPageCount()).toBe(-1);
    expect(table.getRowCount()).toBe(4);
    sync({ mode: "client", records });
    expect(table.getPageCount()).toBe(2);
    expect(table.getRowCount()).toBe(4);
    expect(table.getRowModel().rows).toHaveLength(2);
  });
  it("rejects duplicate IDs, forbidden sorts, invalid metadata and disposed callbacks", () => {
    const { adapter, controller, table } = fixture();
    const first = records[0];
    if (!first) throw new Error("Missing synthetic record");
    expect(() =>
      adapter.getOptions({
        mode: "client",
        records: [first, first],
      }),
    ).toThrow(NativeBridgeError);
    expect(() => table.setSorting([{ id: "category", desc: false }])).toThrow();
    expect(() =>
      table.setSorting([
        { id: "amount", desc: false },
        { id: "title", desc: false },
      ]),
    ).toThrow();
    expect(() =>
      adapter.getOptions({
        mode: "server",
        records,
        pageInfo: { kind: "known", total: -1 },
      }),
    ).toThrow(NativeBridgeError);
    controller.dispose();
    expect(() => table.setPagination({ pageIndex: 1, pageSize: 2 })).toThrow();
  });
  it("requires explicit unique columns and full sort field coverage", () => {
    const base: NativeDefinitionInput<typeof schema, RecordRow> = {
      schema,
      getRowId: (row) => row.id,
      columns: [
        { id: "amount", accessorKey: "amount" },
        { id: "title", accessorKey: "title" },
      ],
    };
    expect(() =>
      defineNativeTable({ ...base, columns: [{ accessorKey: "amount" }] }),
    ).toThrow(NativeBridgeError);
    expect(() =>
      defineNativeTable({
        ...base,
        columns: [{ id: "amount", accessorKey: "amount" }],
      }),
    ).toThrow(NativeBridgeError);
    expect(() =>
      defineNativeTable({
        ...base,
        columns: [...base.columns, { id: "amount", accessorKey: "amount" }],
      }),
    ).toThrow(NativeBridgeError);
    expect(Object.isFrozen(definition().columns)).toBe(true);
  });
  it("server-renders the actual hook with explicit unknown next-page gating and narrow handles", () => {
    const def = definition();
    const controller = createNativeController(def, {
      initial: { query: initial() },
      now: () => 0,
    });
    let captured: NativeTableView<typeof schema, RecordRow> | undefined;
    function Capture() {
      captured = useNativeTable(def, controller, {
        mode: "server",
        records,
        pageInfo: { kind: "unknown", hasNextPage: false },
      });
      return React.createElement(
        "output",
        null,
        captured.rows.map((row) => row.id).join(","),
      );
    }
    expect(renderToString(React.createElement(Capture))).toContain("a,b,c,d");
    if (!captured) throw new Error("Missing hook view");
    expect(captured.pagination.pageCount).toBeNull();
    expect(captured.pagination.canNextPage).toBe(false);
    captured.nextPage();
    expect(controller.getSnapshot().query.pagination.pageIndex).toBe(0);
    expect("setOptions" in captured.native).toBe(false);
    expect("reset" in captured.native).toBe(false);
    expect("baseAtoms" in captured.native).toBe(false);
  });
});
