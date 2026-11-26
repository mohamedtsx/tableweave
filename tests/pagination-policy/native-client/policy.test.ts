import { expect, test } from "vitest";
import { createQuery } from "../../../packages/react/src/contracts/query.js";
import { createTableController } from "../../../packages/react/src/controller/store.js";
import { ControllerError } from "../../../packages/react/src/controller/validation.js";
import { createNativeAdapter } from "../../../packages/react/src/tanstack/adapter.js";
import { createNativeBoundary } from "../../../packages/react/src/tanstack/boundary.js";
import {
  createNativeController,
  defineNativeTable,
  NativeBridgeError,
} from "../../../packages/react/src/tanstack/definition.js";
import { predicateCarrierId } from "../../../packages/react/src/tanstack/features.js";
import type { NativeInput } from "../../../packages/react/src/tanstack/types.js";
import type { Item } from "./fixtures.js";
import { expected, records, schemaFor, setup } from "./fixtures.js";

function nativeError(action: () => unknown, code: string) {
  let caught = false;
  try {
    action();
  } catch (error) {
    caught = true;
    expect(error).toBeInstanceOf(NativeBridgeError);
    if (error instanceof NativeBridgeError) expect(error.code).toBe(code);
  }
  expect(caught).toBe(true);
}
for (const count of [0, 3, 173, 311])
  for (const custom of [false, true])
    test(`real native complete client count=${count}, custom dormant=${custom}`, () => {
      const f = setup(false, custom);
      const rows: Item[] = Array.from({ length: count }, (_, i) => ({
        id: `row${i}`,
        amount: i % 7,
        title: `label-${String(count - i).padStart(4, "0")}`,
        eligible: i % 4 !== 0,
      }));
      const old = JSON.stringify(rows),
        before = f.controller.getSnapshot(),
        m = f.mount({ mode: "client", records: rows }),
        view = m.view();
      expect(view.rows.map((row) => row.id)).toEqual(expected(rows));
      expect(view.rows).toBe(m.table.getRowModel().rows);
      expect(m.table.getRowModel()).toBe(m.table.getSortedRowModel());
      expect(view.pagination).toEqual({
        enabled: false,
        pageInfo: { kind: "known", total: expected(rows).length },
        pageCount: null,
        canPreviousPage: false,
        canNextPage: false,
      });
      expect([
        m.options.manualFiltering,
        m.options.manualSorting,
        m.options.manualPagination,
      ]).toEqual([false, false, true]);
      expect(m.options.data).toBe(rows);
      expect(m.options.state?.pagination).toEqual({
        pageIndex: 0,
        pageSize: custom ? 7 : 10,
      });
      expect(Object.hasOwn(m.options, "rowCount")).toBe(true);
      expect(m.options.rowCount).toBeUndefined();
      expect(Object.hasOwn(m.options, "pageCount")).toBe(true);
      expect(m.options.pageCount).toBeUndefined();
      if (count >= 173)
        expect(view.rows.length).toBeGreaterThan(f.schema.limits.maxPageRows);
      const byId = new Map(rows.map((row) => [row.id, row]));
      for (const row of view.rows) expect(row.original).toBe(byId.get(row.id));
      expect(JSON.stringify(rows)).toBe(old);
      expect(Object.isFrozen(rows)).toBe(false);
      expect(rows.every((r) => !Object.isFrozen(r))).toBe(true);
      expect(f.controller.getSnapshot()).toBe(before);
    });
for (const enabled of [undefined, true, false])
  test(`resolved definition/view boolean is derived from normalized controller schema: ${enabled}`, () => {
    const f = setup(enabled),
      m = f.mount({ mode: "client", records });
    expect(f.definition.paginationEnabled).toBe(enabled !== false);
    expect(m.view().pagination.enabled).toBe(enabled !== false);
    expect(Object.isFrozen(f.definition)).toBe(true);
    expect(f.definition.controllerDefinition.schema.pagination.enabled).toBe(
      enabled === false ? false : undefined,
    );
  });
test("input paging flags cannot force the resolved policy or forge native registration", () => {
  const schema = schemaFor(false);
  const input = {
    schema,
    paginationEnabled: true,
    pagination: { enabled: true },
    getRowId: (row: Item) => row.id,
    columns: [
      { id: "amount", accessorKey: "amount" },
      { id: "title", accessorKey: "title" },
    ],
  };
  const def = Reflect.apply(defineNativeTable, undefined, [
    input,
  ]) as ReturnType<typeof setup>["definition"];
  expect(def.paginationEnabled).toBe(false);
  nativeError(
    () =>
      createNativeController(
        { ...def, paginationEnabled: true },
        {
          initial: {
            query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
          },
          now: () => 0,
        },
      ),
    "native.definition",
  );
  const plain = createTableController(def.controllerDefinition, {
    initial: {
      query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
    },
    now: () => 0,
  });
  nativeError(() => createNativeAdapter(def, plain), "native.definition");
});
for (const malformed of [
  null,
  { mode: "server", records: null },
  { mode: "unknown", records: [] },
])
  test(`legacy input-shape diagnostics before disabled policy ${JSON.stringify(malformed)}`, () => {
    const f = setup(false);
    nativeError(
      () => f.adapter.getOptions(malformed as NativeInput<Item>),
      "native.rows",
    );
    expect(Object.values(f.counts).every((n) => n === 0)).toBe(true);
  });
for (const info of [
  { kind: "known", total: 173 },
  { kind: "unknown", hasNextPage: true },
  { kind: "unknown", hasNextPage: false },
  undefined,
])
  test(`all ordinary server page metadata deny before row callbacks ${JSON.stringify(info)}`, () => {
    const f = setup(false);
    nativeError(
      () =>
        f.adapter.getOptions({
          mode: "server",
          records,
          pageInfo: info,
        } as NativeInput<Item>),
      "native.page",
    );
    expect(Object.values(f.counts).every((n) => n === 0)).toBe(true);
    const bad = [
      Object.defineProperty({}, "id", {
        get() {
          throw new Error("private id");
        },
      }),
    ];
    nativeError(
      () =>
        f.adapter.getOptions({
          mode: "server",
          records: bad,
          pageInfo: info,
        } as unknown as NativeInput<Item>),
      "native.page",
    );
    expect(f.counts.rowId).toBe(0);
  });
test("actual shallow-merging vendor options clear old totals with own undefined client properties", () => {
  const f = setup(false),
    input = { mode: "client" as const, records },
    m = f.mount(input);
  // Seeding internal vendor state is a test of its shallow merge, not a supported handle API.
  m.table.setOptions({ ...m.table.options, rowCount: 999, pageCount: 123 });
  expect(m.table.options.rowCount).toBe(999);
  m.table.setOptions(f.adapter.getOptions(input));
  expect(Object.hasOwn(m.table.options, "rowCount")).toBe(true);
  expect(m.table.options.rowCount).toBeUndefined();
  expect(Object.hasOwn(m.table.options, "pageCount")).toBe(true);
  expect(m.table.options.pageCount).toBeUndefined();
  expect(m.view().pagination.pageCount).toBeNull();
  expect(m.view().rows.map((r) => r.id)).toEqual(expected(records));
});
for (const controlled of [false, true])
  test(`supported native setPagination denies before updater/private callbacks; controlled=${controlled}`, () => {
    const f = setup(
        false,
        false,
        "multiple",
        0,
        controlled ? { controlled: ["query"] } : {},
      ),
      m = f.mount({ mode: "client", records }),
      view = m.view(),
      old = f.controller.getSnapshot();
    f.reset();
    expect(() =>
      view.native.setPagination((previous) => {
        f.counts.updater++;
        return { ...previous, pageIndex: 1 };
      }),
    ).toThrow(ControllerError);
    try {
      view.native.setPagination((previous) => {
        f.counts.updater++;
        return previous;
      });
    } catch (error) {
      expect(error).toMatchObject({ code: "state.capability" });
    }
    expect(Object.values(f.counts).every((n) => n === 0)).toBe(true);
    expect(f.controller.getSnapshot()).toBe(old);
    nativeError(() => view.previousPage(), "native.page");
    nativeError(() => view.nextPage(), "native.page");
    expect(Object.values(f.counts).every((n) => n === 0)).toBe(true);
  });
test("saved view and supported setter preserve disposed/lifecycle and stale-query guards", () => {
  const f = setup(false),
    m = f.mount({ mode: "client", records }),
    old = m.view();
  f.controller.dispatch({ type: "search.commit", search: "label" });
  nativeError(() => old.nextPage(), "native.page");
  nativeError(() => old.previousPage(), "native.page");
  f.controller.dispose();
  nativeError(() => old.nextPage(), "native.lifecycle");
  nativeError(() => old.previousPage(), "native.lifecycle");
  nativeError(
    () =>
      old.native.setPagination(() => {
        throw new Error("must not run");
      }),
    "native.lifecycle",
  );
});
test("native boundary returns actual unsliced models and revokes saved callbacks after accepted query change", () => {
  const f = setup(false),
    boundary = createNativeBoundary(f.definition, f.controller),
    input = { mode: "client" as const, records };
  const frame = boundary.prepare(input, f.controller.getSnapshot());
  boundary.commit(frame);
  const view = boundary.getView(frame);
  expect(view.rows.map((r) => r.id)).toEqual(expected(records));
  expect(view.rows).toBe(view.native.getRowModel().rows);
  f.controller.dispatch({
    type: "sorting.change",
    update: [{ id: "title", desc: true }],
  });
  const newer = boundary.prepare(input, f.controller.getSnapshot());
  boundary.commit(newer);
  nativeError(() => view.nextPage(), "native.page");
  nativeError(() => view.selectPage(true), "native.page");
  expect(boundary.getView(newer).rows[0]?.original.title).toBe("label-171");
});
for (const mode of [false, "single", "multiple"] as const)
  test(`selection ${mode} preserves eligible full-client subset and offscreen IDs`, () => {
    const f = setup(false, false, mode),
      input = { mode: "client" as const, records },
      m = f.mount(input),
      view = m.view();
    const eligible = view.rows
      .filter((r) => r.original.eligible)
      .map((r) => r.id);
    expect(view.selectionMode).toBe(mode);
    expect(view.pageSelection.eligibleIds).toEqual(
      mode === "multiple" ? eligible : [],
    );
    if (mode === "multiple") {
      view.selectPage(true);
      m.table.setOptions(f.adapter.getOptions(input));
      const selected = m.view();
      expect([...selected.selectedIds].sort()).toEqual(
        ["offscreen", ...eligible].sort(),
      );
      expect(selected.pageSelection.checked).toBe(true);
      expect(
        m.table.getSelectedRowModel().rows.some((r) => r.id === "offscreen"),
      ).toBe(false);
      selected.selectPage(false);
      expect(f.controller.getSnapshot().selection).toEqual({ offscreen: true });
    } else {
      nativeError(() => view.selectPage(true), "native.managed");
      if (mode === "single") {
        const id = eligible[0];
        expect(id).toBeDefined();
        if (!id) throw new Error("Missing eligible row");
        m.table.getRow(id).toggleSelected(true);
        expect(f.controller.getSnapshot().selection).toEqual({ [id]: true });
        const before = f.controller.getSnapshot();
        expect(() => view.native.setRowSelection({ a: true, b: true })).toThrow(
          ControllerError,
        );
        expect(f.controller.getSnapshot()).toBe(before);
      }
    }
  });
test("grouped/hidden columns, predicate carrier and selection-only model references stay unchanged", () => {
  const f = setup(false),
    input = { mode: "client" as const, records },
    m = f.mount(input),
    before = m.view(),
    model = m.table.getRowModel(),
    options = f.adapter.getOptions(input);
  m.table.getColumn("amount")?.toggleVisibility(false);
  m.table.setOptions(f.adapter.getOptions(input));
  const hidden = m.view();
  expect(hidden.visibleColumns.map((c) => c.id)).toEqual([
    "selection",
    "title",
  ]);
  expect(hidden.rows.map((r) => r.id)).toEqual(expected(records));
  expect(
    hidden.headerGroups.some((g) =>
      g.headers.some((h) => h.column.id === "data"),
    ),
  ).toBe(true);
  expect(
    hidden.headerGroups.every((g) =>
      g.headers.every((h) => h.column.id !== predicateCarrierId),
    ),
  ).toBe(true);
  f.controller.dispatch({
    type: "selection.change",
    update: { offscreen: true, [before.rows[0]?.id ?? "none"]: true },
  });
  const after = f.adapter.getOptions(input);
  expect(after.state?.globalFilter).toBe(options.state?.globalFilter);
  expect(after.state?.pagination).toBe(options.state?.pagination);
  expect(after.state?.sorting).toBe(options.state?.sorting);
  m.table.setOptions(after);
  expect(m.table.getRowModel()).toBe(model);
});
test("real native controlled proposal rejection/acceptance and U1 denial preserve the pending intent", () => {
  const f = setup(false, false, "multiple", 0, { controlled: ["query"] }),
    input = { mode: "client" as const, records },
    m = f.mount(input),
    old = f.controller.getSnapshot();
  const proposal = f.controller.dispatch({
    type: "sorting.change",
    update: [{ id: "title", desc: true }],
  });
  if (proposal.status !== "proposed")
    throw new Error("Expected actual proposal");
  expect(() =>
    m.native.setPagination(() => {
      throw new Error("updater must not run");
    }),
  ).toThrow(ControllerError);
  expect(f.controller.getSnapshot()).toBe(old);
  f.controller.reject(proposal.proposal);
  const next = f.controller.dispatch({
    type: "sorting.change",
    update: [{ id: "title", desc: true }],
  });
  if (next.status !== "proposed") throw new Error("Expected actual retry");
  expect(f.controller.accept(next.proposal).status).toBe("committed");
  m.table.setOptions(f.adapter.getOptions(input));
  expect(m.view().rows).toHaveLength(expected(records).length);
});
test("current disposed and state-definition guards precede disabled-server denial", () => {
  const f = setup(false);
  const input = {
    mode: "server" as const,
    records,
    pageInfo: { kind: "known" as const, total: 173 },
  };
  nativeError(
    () =>
      f.adapter.getOptions(input, {
        ...f.controller.getSnapshot(),
        definitionIdentity: "wrong",
      }),
    "native.definition",
  );
  expect(f.counts.rowId).toBe(0);
  f.controller.dispose();
  nativeError(() => f.adapter.getOptions(input), "native.lifecycle");
  expect(f.counts.rowId).toBe(0);
});
test("same-controller native callback reentry keeps U1 mutation priority and cannot run a pagination updater", () => {
  let nestedCode: unknown,
    updater = 0;
  let attempt: () => void = () => {
    throw new Error("Native action not mounted");
  };
  const f = setup(false, false, "multiple", 0, {
    validateCommand(command) {
      if (command.type === "sorting.change") {
        try {
          attempt();
        } catch (error) {
          nestedCode =
            error instanceof ControllerError ? error.code : "unexpected";
        }
      }
    },
  });
  const m = f.mount({ mode: "client", records });
  attempt = () => {
    m.native.setPagination((previous) => {
      updater++;
      return previous;
    });
  };
  m.native.setSorting([{ id: "title", desc: true }]);
  expect(nestedCode).toBe("state.reentrant");
  expect(updater).toBe(0);
  expect(f.controller.getSnapshot().query.sorting).toEqual([
    { id: "title", desc: true },
  ]);
});
test("legacy enabled/omitted schemas retain paging rather than claiming complete rows", () => {
  for (const enabled of [undefined, true]) {
    const f = setup(enabled),
      m = f.mount({ mode: "client", records });
    expect(m.view().rows).toHaveLength(10);
    expect(m.view().pagination.enabled).toBe(true);
    expect(m.view().pagination.pageCount).toBe(
      Math.ceil(expected(records).length / 10),
    );
  }
});
