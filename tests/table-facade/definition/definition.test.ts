import { describe, expect, it, vi } from "vitest";
import {
  createQuery,
  defineQuerySchema,
} from "../../../packages/react/src/contracts/index.js";
import type { StateProposal } from "../../../packages/react/src/controller/types.js";
import {
  assertTableController,
  assertTableDefinition,
  defineTable,
  TableDefinitionError,
} from "../../../packages/react/src/table/definition.js";
import {
  assertNativeController,
  createNativeColumnHelper,
  createNativeController,
} from "../../../packages/react/src/tanstack/definition.js";

interface Row {
  id: string;
  amount: number;
  title: string;
}
const helper = createNativeColumnHelper<Row>();
const columns = helper.columns([
  helper.display({ id: "select", meta: { utility: true } }),
  helper.accessor("amount", { id: "amount", enableSorting: true }),
  helper.accessor("title", { id: "title" }),
]);
const schema = defineQuerySchema({
  id: "facade-definition",
  version: 1,
  fields: {
    amount: { type: "number", owner: "builder", sort: true },
    title: { type: "text", owner: "search" },
  },
});
const query = () =>
  createQuery(schema, { locale: "ar", timeZone: "Asia/Riyadh" });
const input = () => ({ schema, columns, getRowId: (row: Row) => row.id });
const make = defineTable<Row>();

describe("P1 actual definition/controller composition — authored, not an engine facade", () => {
  it("resolves immutable presentation defaults without invoking record callbacks", () => {
    const getRowId = vi.fn((row: Row) => row.id);
    const isRowSelectable = vi.fn(() => true);
    const accessor = vi.fn((row: Row) => row.amount);
    const config = {
      ...input(),
      getRowId,
      isRowSelectable,
      evaluation: { accessors: { amount: accessor } },
    };
    const definition = make(config);
    expect(definition.tools).toEqual({
      builder: "toolbar",
      search: "hidden",
      columnChooser: "hidden",
      tabs: "hidden",
      date: "hidden",
    });
    expect(Object.isFrozen(definition)).toBe(true);
    expect(Object.isFrozen(definition.tools)).toBe(true);
    for (const callback of [getRowId, isRowSelectable, accessor])
      expect(callback).not.toHaveBeenCalled();
    expect(Object.isFrozen(config)).toBe(false);
    expect(Object.isFrozen(config.evaluation.accessors)).toBe(false);
    expect(Object.isFrozen(getRowId)).toBe(false);
    expect(columns).toHaveLength(3);
    expect(() => assertTableDefinition(definition)).not.toThrow();
  });

  it("uses normalized builder ownership, not active values or presentation placement", () => {
    const noBuilder = defineQuerySchema({
      id: "no-builder",
      version: 1,
      fields: { title: { type: "text", owner: "search" } },
    });
    const d = make({
      schema: noBuilder,
      columns: helper.columns([helper.accessor("title", { id: "title" })]),
      getRowId: (row) => row.id,
    });
    expect(d.tools.builder).toBe("hidden");
    const hidden = make({
      ...input(),
      tools: {
        builder: "hidden",
        search: "external",
        tabs: "external",
        date: "external",
        columnChooser: "toolbar",
      },
    });
    const c = hidden.createController({
      initial: { query: query() },
      now: () => 0,
    });
    c.dispatch({
      type: "builder.commit",
      rule: { id: "rule", field: "amount", operator: "number.eq", value: 7 },
    });
    expect(c.getSnapshot().query.builder.rules).toHaveLength(1);
    expect(c.getDefinition().schema.fields.amount.owner).toBe("builder");
  });

  it("copies owned containers without changing application column metadata or tools", () => {
    const meta = { utility: false };
    const localColumns = helper.columns([
      helper.accessor("amount", { id: "amount", enableSorting: true, meta }),
      helper.accessor("title", { id: "title" }),
    ]);
    const tools = { builder: "external" as const };
    const d = make({ ...input(), columns: localColumns, tools });
    expect(Object.isFrozen(meta)).toBe(false);
    expect(Object.isFrozen(localColumns)).toBe(false);
    expect(Object.isFrozen(tools)).toBe(false);
    expect(meta).toEqual({ utility: false });
    expect(d.native.columns).not.toBe(localColumns);
    expect(d.tools).not.toBe(tools);
  });

  it.each([
    { builder: "invalid" },
    { search: false },
    { columnChooser: true },
    { tabs: "toolbar" },
    { date: "toolbar" },
    { unknown: "hidden" },
    { builder: undefined },
    undefined,
    null,
  ])(
    "rejects invalid supplied tool configuration without guessing: %j",
    (tools) => {
      expect(() =>
        Reflect.apply(make, undefined, [{ ...input(), tools }]),
      ).toThrow(TableDefinitionError);
    },
  );

  it("rejects hidden/symbol/accessor/inherited tool properties without reading accessors", () => {
    const getter = vi.fn(() => "toolbar");
    for (const tools of [
      Object.defineProperty({}, "builder", { enumerable: true, get: getter }),
      Object.defineProperty({}, "builder", {
        enumerable: false,
        value: "toolbar",
      }),
      { [Symbol("tool")]: "toolbar" },
      Object.create({ builder: "toolbar" }),
    ])
      expect(() =>
        Reflect.apply(make, undefined, [{ ...input(), tools }]),
      ).toThrow(TableDefinitionError);
    expect(getter).not.toHaveBeenCalled();
  });

  it("snapshots defaults, merges true visibility overrides, replaces order, isolates controllers", () => {
    const defaults = {
      order: ["select", "title", "amount"],
      visibility: { title: false },
    };
    const d = make({
      ...input(),
      defaultColumns: defaults,
      selection: "multiple",
      details: true,
    });
    defaults.visibility.title = true;
    defaults.order.reverse();
    expect(Object.isFrozen(defaults)).toBe(false);
    expect(Object.isFrozen(defaults.order)).toBe(false);
    expect(Object.isFrozen(defaults.visibility)).toBe(false);
    const selected = { remote: true };
    const details = { rowId: "remote" };
    const initialQuery = { ...query() };
    const first = d.createController({
      initial: { query: initialQuery, selection: selected, details },
      now: () => 100,
    });
    const second = d.createController({
      initial: {
        query: query(),
        columns: {
          order: ["select", "amount", "title"],
          visibility: { title: true, amount: false },
        },
      },
      now: () => 0,
    });
    expect(first.getSnapshot().columns).toEqual({
      order: ["select", "title", "amount"],
      visibility: { title: false },
    });
    expect(second.getSnapshot().columns).toEqual({
      order: ["select", "amount", "title"],
      visibility: { amount: false },
    });
    expect(first).not.toBe(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(() => assertNativeController(d.native, first)).not.toThrow();
    expect(assertTableController(d, first)).toBe(first.getDefinition());
    expect(first.getDefinition()).not.toBe(d.native.controllerDefinition);
    expect(first.getSnapshot().selection).toEqual({ remote: true });
    expect(first.getSnapshot().details).toEqual(details);
    expect(Object.isFrozen(selected)).toBe(false);
    expect(Object.isFrozen(details)).toBe(false);
    expect(Object.isFrozen(initialQuery)).toBe(false);
    first.dispatch({ type: "selection.cancel" });
    expect(second.getSnapshot().selection).toEqual({});
    expect(first.getSnapshot().query.locale).toBe("ar");
    expect(first.getSnapshot().query.timeZone).toBe("Asia/Riyadh");
    expect(first.getSnapshot().evaluatedAt).toBe(100);
  });

  it.each([
    { visibility: { unknown: false } },
    { visibility: { select: false } },
    { visibility: { amount: false, title: false } },
    { order: ["title", "select", "amount"] },
    { order: ["amount"] },
  ])(
    "delegates invalid default and initial columns to state.columns: %j",
    (defaultColumns) => {
      expect(() =>
        Reflect.apply(make, undefined, [{ ...input(), defaultColumns }]),
      ).toThrow(expect.objectContaining({ code: "state.columns" }));
      const d = make(input());
      expect(() =>
        Reflect.apply(d.createController, d, [
          {
            initial: { query: query(), columns: defaultColumns },
            now: () => 0,
          },
        ]),
      ).toThrow(expect.objectContaining({ code: "state.columns" }));
    },
  );

  it("preserves controlled accept/reject and app callbacks through the actual controller", () => {
    const d = make({ ...input(), selection: "multiple" });
    const requests: StateProposal<typeof schema>[] = [];
    const onCommit = vi.fn();
    const onQueryChange = vi.fn();
    const validateCommand = vi.fn(() => {});
    const validateState = vi.fn(() => {});
    const now = vi.fn(() => 123);
    const c = d.createController({
      initial: { query: query(), selection: { remote: true } },
      controlled: ["query"],
      now,
      validateCommand,
      validateState,
      onRequest: (proposal) => {
        requests.push(proposal);
      },
      onCommit,
      onQueryChange,
    });
    expect(now).toHaveBeenCalledTimes(1);
    const before = c.getSnapshot();
    const result = c.dispatch({ type: "search.commit", search: "new" });
    if (result.status !== "proposed") throw new Error("Expected real proposal");
    expect(requests[0]).toBe(result.proposal);
    expect(c.getSnapshot()).toBe(before);
    c.reject(result.proposal);
    expect(c.getSnapshot()).toBe(before);
    const next = c.dispatch({ type: "search.commit", search: "new" });
    if (next.status !== "proposed")
      throw new Error("Expected second real proposal");
    expect(c.accept(next.proposal).status).toBe("committed");
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(validateCommand).toHaveBeenCalledTimes(3);
    expect(c.getSnapshot().selection).toEqual({});
    expect(c.getSnapshot().query.search).toBe("new");
  });

  it("retains native capability errors, required clock, and schema paging defaults", () => {
    const d = make(input());
    expect(d.native.selectionMode).toBe(false);
    expect(d.native.multiSort).toBe(false);
    expect(d.native.controllerDefinition.details).toBe(false);
    expect(d.native.controllerDefinition.schema.pagination.defaultSize).toBe(
      10,
    );
    const c = d.createController({ initial: { query: query() }, now: () => 0 });
    expect(() =>
      c.dispatch({ type: "selection.change", update: { id: true } }),
    ).toThrow();
    expect(() =>
      c.dispatch({ type: "details.change", update: { rowId: "id" } }),
    ).toThrow();
    expect(() =>
      Reflect.apply(d.createController, d, [{ initial: { query: query() } }]),
    ).toThrow(expect.objectContaining({ code: "state.ownership" }));
    expect(() => make({ ...input(), multiSort: true })).toThrow(
      expect.objectContaining({ code: "native.sorting" }),
    );
    const single = make({ ...input(), selection: "single" });
    expect(() =>
      single.createController({
        initial: { query: query(), selection: { a: true, b: true } },
        now: () => 0,
      }),
    ).toThrow(expect.objectContaining({ code: "native.managed" }));
  });

  it("keeps disabled schema pagination guards and requires no new publication-ready validator", () => {
    const disabledSchema = defineQuerySchema({
      id: "disabled-facade",
      version: 1,
      fields: {
        amount: { type: "number", owner: "builder", sort: true },
        title: { type: "text", owner: "search" },
      },
      pagination: { enabled: false },
    });
    const d = make({
      ...input(),
      schema: disabledSchema,
      selection: "multiple",
    });
    const c = d.createController({
      initial: {
        query: createQuery(disabledSchema, {
          locale: "en-US",
          timeZone: "UTC",
        }),
        selection: { initial: true },
      },
      now: () => 0,
    });
    const updater = vi.fn(
      (previous: { readonly pageIndex: number; readonly pageSize: number }) =>
        previous,
    );
    expect(() =>
      c.dispatch({ type: "pagination.change", update: updater }),
    ).toThrow(expect.objectContaining({ code: "state.capability" }));
    expect(updater).not.toHaveBeenCalled();
    expect(c.dispatch({ type: "selection.cancel" }).status).toBe("committed");
    expect(c.getSnapshot().selection).toEqual({});
  });

  it("lookup denies copied/proxied/foreign/disposed identities before private getters", () => {
    const a = make(input());
    const b = make(input());
    const c = a.createController({ initial: { query: query() }, now: () => 0 });
    const getter = vi.fn(() => {
      throw new Error("private input");
    });
    const proxy = new Proxy(
      {},
      { get: getter, getPrototypeOf: getter, ownKeys: getter },
    );
    expect(() => assertTableDefinition(proxy)).toThrow(TableDefinitionError);
    expect(() => assertTableDefinition({ ...a })).toThrow(TableDefinitionError);
    for (const candidate of [proxy, { ...c }, new Proxy(c, { get: getter })]) {
      expect(() =>
        Reflect.apply(assertTableController, undefined, [a, candidate]),
      ).toThrow(TableDefinitionError);
    }
    expect(() => assertTableController(b, c)).toThrow(TableDefinitionError);
    const raw = createNativeController(a.native, {
      initial: { query: query() },
      now: () => 0,
    });
    expect(() => assertTableController(a, raw)).toThrow(TableDefinitionError);
    expect(() => Reflect.apply(a.createController, proxy, [proxy])).toThrow(
      TableDefinitionError,
    );
    expect(() => Reflect.apply(a.createController, b, [proxy])).toThrow(
      TableDefinitionError,
    );
    expect(getter).not.toHaveBeenCalled();
    c.dispose();
    expect(() => assertTableController(a, c)).toThrow(TableDefinitionError);
    expect(
      assertTableController(
        b,
        b.createController({ initial: { query: query() }, now: () => 0 }),
      ),
    ).not.toBe(a.native.controllerDefinition);
  });
});
