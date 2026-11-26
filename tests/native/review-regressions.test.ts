import { describe, expect, it } from "vitest";
import {
  createQuery,
  defineQuerySchema,
} from "../../packages/react/src/contracts/index.js";
import type { StateProposal } from "../../packages/react/src/controller/types.js";
import { createNativeBoundary } from "../../packages/react/src/tanstack/boundary.js";
import {
  createNativeController,
  defineNativeTable,
} from "../../packages/react/src/tanstack/index.js";
import { fixture, type RecordRow, schema } from "./fixtures.js";

describe("independent native review regressions", () => {
  it("n2 rejects a controller sort forbidden by native definition before commit", () => {
    const definition = defineNativeTable<typeof schema, RecordRow>({
      schema,
      getRowId: (row) => row.id,
      columns: [
        { id: "amount", accessorKey: "amount", enableSorting: false },
        { id: "title", accessorKey: "title" },
      ],
    });
    let notifications = 0;
    const controller = createNativeController(definition, {
      initial: {
        query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
      },
      now: () => 0,
      onCommit: () => {
        notifications++;
      },
    });
    const before = controller.getSnapshot();
    expect(() =>
      controller.dispatch({
        type: "sorting.change",
        update: [{ id: "amount", desc: false }],
      }),
    ).toThrow();
    expect(controller.getSnapshot()).toBe(before);
    expect(notifications).toBe(0);
  });
  it("n2 rejects a controlled multi-sort forbidden by native definition before proposal publication", () => {
    let requests = 0;
    const { controller } = fixture({
      controlled: ["query"],
      onRequest: () => {
        requests++;
      },
    });
    const before = controller.getSnapshot();
    expect(() =>
      controller.dispatch({
        type: "sorting.change",
        update: [
          { id: "amount", desc: false },
          { id: "title", desc: false },
        ],
      }),
    ).toThrow();
    expect(controller.getSnapshot()).toBe(before);
    expect(requests).toBe(0);
  });
  it("n4 composes two same-turn native column toggle intents against accepted sorting", () => {
    const { table, controller } = fixture();
    const amount = table.getColumn("amount");
    if (!amount) throw new Error("Missing synthetic column");
    amount.toggleSorting();
    expect(controller.getSnapshot().query.sorting).toEqual([
      { id: "amount", desc: true },
    ]);
    amount.toggleSorting();
    expect(controller.getSnapshot().query.sorting).toEqual([
      { id: "amount", desc: false },
    ]);
  });
  it("n4 composes visibility toggles against accepted visibility without a render", () => {
    const { table, controller } = fixture();
    const category = table.getColumn("category");
    if (!category) throw new Error("Missing synthetic column");
    category.toggleVisibility();
    expect(controller.getSnapshot().columns.visibility.category).toBe(false);
    category.toggleVisibility();
    expect(controller.getSnapshot().columns.visibility.category).not.toBe(
      false,
    );
  });
  it("n4 applies grouped visibility methods and handlers atomically to descendant leaves", () => {
    const groupedSchema = defineQuerySchema({
      id: "native-grouped-visibility",
      version: 1,
      fields: {},
    });
    const definition = defineNativeTable({
      schema: groupedSchema,
      getRowId: (row: { id: string; a: number; b: number; c: number }) =>
        row.id,
      columns: [
        {
          id: "g",
          columns: [
            { id: "a", accessorKey: "a" },
            { id: "b", accessorKey: "b" },
          ],
        },
        { id: "c", accessorKey: "c" },
      ],
    });
    let commits = 0;
    const controller = createNativeController(definition, {
      initial: {
        query: createQuery(groupedSchema, { locale: "en-US", timeZone: "UTC" }),
      },
      now: () => 0,
      onCommit: () => {
        commits++;
      },
    });
    const boundary = createNativeBoundary(definition, controller);
    const frame = boundary.prepare(
      { mode: "client", records: [{ id: "row", a: 1, b: 2, c: 3 }] },
      controller.getSnapshot(),
    );
    boundary.commit(frame);
    const group = boundary.getView(frame).native.getColumn("g");
    if (!group) throw new Error("Missing synthetic group");
    group.toggleVisibility(false);
    expect(controller.getSnapshot().columns.visibility).toEqual({
      a: false,
      b: false,
    });
    group.toggleVisibility();
    // Accepted visibility canonicalizes visible leaves to omitted/default keys.
    expect(controller.getSnapshot().columns.visibility).toEqual({});
    group.getToggleVisibilityHandler()({ target: { checked: false } });
    expect(controller.getSnapshot().columns.visibility).toEqual({
      a: false,
      b: false,
    });
    expect(commits).toBe(3);
    const before = controller.getSnapshot();
    const root = boundary.getView(frame).native.getColumn("c");
    expect(() => root?.toggleVisibility(false)).toThrow();
    expect(controller.getSnapshot()).toBe(before);
    expect(commits).toBe(3);
  });
  it("n2 preserves an earlier valid controlled proposal when native validation rejects a newer candidate", () => {
    let proposal: StateProposal<typeof schema> | undefined;
    let requests = 0;
    const { controller } = fixture({
      controlled: ["query"],
      onRequest: (next) => {
        proposal = next;
        requests++;
      },
    });
    controller.dispatch({
      type: "sorting.change",
      update: [{ id: "amount", desc: true }],
    });
    const valid = proposal;
    if (!valid) throw new Error("Missing valid proposal");
    expect(() =>
      controller.dispatch({
        type: "sorting.change",
        update: [
          { id: "amount", desc: true },
          { id: "title", desc: false },
        ],
      }),
    ).toThrow();
    expect(requests).toBe(1);
    controller.accept(valid);
    expect(controller.getSnapshot().query.sorting).toEqual([
      { id: "amount", desc: true },
    ]);
  });
  it("n2 composes application validation without dropping asynchronous failures", async () => {
    for (const validateState of [null, false, "invalid"]) {
      expect(() =>
        fixture({ validateState: validateState as never }),
      ).toThrow();
    }
    expect(() =>
      fixture({
        validateState: () =>
          Promise.reject(new Error("synthetic-private-native-validation")),
      }),
    ).toThrow();
    await Promise.resolve();
  });
  it("n4 modeled header/row handlers dispatch each intent once using the latest owner", () => {
    let commits = 0;
    const { table, controller } = fixture({
      onCommit: () => {
        commits++;
      },
    });
    const header = table
      .getHeaderGroups()
      .flatMap((group) => group.headers)
      .find((entry) => entry.column.id === "amount");
    const toggle = header?.column.getToggleSortingHandler();
    if (!toggle) throw new Error("Missing synthetic header handler");
    toggle({ shiftKey: false });
    toggle({ shiftKey: false });
    expect(controller.getSnapshot().query.sorting).toEqual([
      { id: "amount", desc: false },
    ]);
    expect(commits).toBe(2);
    const row = table.getRow("a");
    row.toggleSelected();
    row.toggleSelected();
    expect(controller.getSnapshot().selection).toEqual({});
    expect(commits).toBe(4);
  });
});
