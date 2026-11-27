import { describe, expect, it } from "vitest";
import { createQuery } from "../../../packages/react/src/contracts/index.js";
import type { StateProposal } from "../../../packages/react/src/controller/types.js";
import { ControllerError } from "../../../packages/react/src/controller/validation.js";
import {
  createNativeController,
  defineNativeTable,
} from "../../../packages/react/src/tanstack/index.js";
import { fixture, type RecordRow, records, schema } from "./fixtures.js";

describe("native selection modes share coordinator acceptance", () => {
  for (const mode of ["single", false] as const)
    for (const controlled of [[], ["selection"]] as const)
      it(`rejects generic ${mode}-mode page commands including one-ID and empty no-ops (${controlled.length ? "controlled" : "uncontrolled"})`, () => {
        let requests = 0;
        const f = fixture(mode, {
          controlled,
          onRequest: () => {
            requests++;
          },
        });
        const before = f.controller.getSnapshot();
        for (const [pageIds, selected] of [
          [["a"], true],
          [[], true],
          [["a"], false],
          [[], false],
        ] as const) {
          expect(() =>
            f.controller.dispatch({
              type: "selection.page",
              pageIds,
              eligibleIds: pageIds,
              selected,
              queryIdentity: before.queryIdentity,
            }),
          ).toThrow();
          expect(f.controller.getSnapshot()).toBe(before);
          expect(requests).toBe(0);
        }
      });
  it("blocks generic page deselect-all on a selected single ID without consuming valid pending intent", () => {
    let requests = 0;
    const f = fixture("single", {
      initial: {
        query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
        selection: { a: true },
      },
      controlled: ["selection"],
      onRequest: () => {
        requests++;
      },
    });
    const before = f.controller.getSnapshot();
    const pending = f.controller.dispatch({
      type: "selection.change",
      update: { c: true },
    });
    if (pending.status !== "proposed") throw new Error("Missing proposal");
    for (const pageIds of [["a"], []])
      expect(() =>
        f.controller.dispatch({
          type: "selection.page",
          pageIds,
          eligibleIds: pageIds,
          selected: false,
          queryIdentity: before.queryIdentity,
        }),
      ).toThrow();
    expect(f.controller.getSnapshot()).toBe(before);
    expect(requests).toBe(1);
    f.controller.accept(pending.proposal);
    expect(f.controller.getSnapshot().selection).toEqual({ c: true });
  });
  for (const mode of [true, "multiple"] as const)
    it(`keeps generic ${mode} page selection and app command constraints in the same coordinator`, () => {
      const seen: string[] = [];
      const f = fixture(mode, {
        validateCommand(command) {
          seen.push(command.type);
        },
      });
      expect(seen).toEqual([]);
      f.controller.dispatch({
        type: "selection.page",
        pageIds: ["a", "c"],
        eligibleIds: ["a", "c"],
        selected: true,
        queryIdentity: f.controller.getSnapshot().queryIdentity,
      });
      expect(f.controller.getSnapshot().selection).toEqual({
        a: true,
        c: true,
      });
      expect(seen).toEqual(["selection.page"]);
    });
  it("does not hide invalid native app guard types, including null", () => {
    for (const value of [null, false, 1, "invalid", {}])
      expect(() =>
        fixture("single", { validateCommand: value as never }),
      ).toThrow(new ControllerError("state.ownership"));
  });
  it("composes app constraints through final native acceptance without swallowing async/nonvoid returns", async () => {
    for (const invalid of [
      () => false,
      () => Promise.reject(new Error("synthetic-private-native-command")),
    ]) {
      let deny = false;
      const seen: string[] = [];
      const f = fixture("single", {
        controlled: ["selection"],
        onRequest: () => {},
        validateCommand(command) {
          seen.push(command.type);
          return deny ? invalid() : undefined;
        },
      });
      expect(seen).toEqual([]);
      const result = f.controller.dispatch({
        type: "selection.change",
        update: { a: true },
      });
      if (result.status !== "proposed") throw new Error("Missing proposal");
      const before = f.controller.getSnapshot();
      deny = true;
      expect(() => f.controller.accept(result.proposal)).toThrow(
        new ControllerError("state.invalid"),
      );
      expect(() => f.controller.dispatch({ type: "selection.cancel" })).toThrow(
        new ControllerError("state.invalid"),
      );
      expect(f.controller.getSnapshot()).toBe(before);
      await Promise.resolve();
      deny = false;
      f.controller.accept(result.proposal);
      expect(f.controller.getSnapshot().selection).toEqual({ a: true });
      expect(seen).toEqual([
        "selection.change",
        "selection.change",
        "selection.cancel",
        "selection.change",
      ]);
    }
  });
  for (const selection of [true, "multiple", "single", false] as const)
    it(`exposes immutable ${selection} mode and actual native multi-select capability`, () => {
      const f = fixture(selection);
      const view = f.client();
      expect(f.definition.selectionMode).toBe(
        selection === true ? "multiple" : selection,
      );
      expect(view.native.selectionMode).toBe(f.definition.selectionMode);
      expect(view.native.native.getRow("a").getCanMultiSelect()).toBe(
        selection === true || selection === "multiple",
      );
      expect(f.definition.controllerDefinition.selection).toBe(
        selection !== false,
      );
      expect(Object.isFrozen(f.definition)).toBe(true);
    });
  it("rejects multiple initial and reduced IDs before any proposal or observer", () => {
    let requests = 0;
    const f = fixture("single", {
      controlled: ["selection"],
      onRequest: () => {
        requests++;
      },
    });
    const before = f.controller.getSnapshot();
    const view = f.client();
    expect(() =>
      view.native.native.setRowSelection({ a: true, c: true }),
    ).toThrow();
    expect(() =>
      f.controller.dispatch({
        type: "selection.change",
        update: { a: true, c: true },
      }),
    ).toThrow();
    expect(f.controller.getSnapshot()).toBe(before);
    expect(requests).toBe(0);
    expect(() =>
      createNativeController(f.definition, {
        initial: { query: before.query, selection: { a: true, c: true } },
        now: () => 0,
      }),
    ).toThrow();
  });
  it("single native row/model handlers replace IDs and preserve double-toggle parity", () => {
    const f = fixture("single");
    const view = f.client();
    view.native.native.getRow("a").toggleSelected(true);
    view.native.native.getRow("c").toggleSelected(true);
    expect(f.controller.getSnapshot().selection).toEqual({ c: true });
    view.native.native.getRow("c").toggleSelected();
    expect(f.controller.getSnapshot().selection).toEqual({});
    view.native.native.getRow("c").getToggleSelectedHandler()({
      target: { checked: true },
    });
    expect(f.controller.getSnapshot().selection).toEqual({ c: true });
  });
  it("rejects every supported page-all path in single mode even on a one-row page", () => {
    const f = fixture("single");
    const record = records[0];
    if (!record) throw new Error("Missing fixture record");
    const view = f.client([record]);
    expect(view.native.pageSelection.checked).toBe(false);
    expect(() => view.native.selectPage(true)).toThrow();
    expect(() => view.native.selectPage(false)).toThrow();
    const table = view.native.rows[0]?.table;
    if (!table) throw new Error("Missing native model");
    expect(() => table.toggleAllPageRowsSelected(true)).toThrow();
    expect(() =>
      table.getToggleAllPageRowsSelectedHandler()({
        target: { checked: true },
      }),
    ).toThrow();
    expect(f.controller.getSnapshot().selection).toEqual({});
  });
  it("validates final controlled overrides without consuming the valid pending proposal", () => {
    let proposal: StateProposal<typeof schema> | undefined;
    const f = fixture("single", {
      initial: {
        query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
        selection: { a: true },
      },
      controlled: ["selection"],
      onRequest: (next) => {
        proposal = next;
      },
    });
    const before = f.controller.getSnapshot();
    f.controller.dispatch({
      type: "builder.commit",
      rule: { id: "r", field: "amount", operator: "number.gt", value: 1 },
    });
    if (!proposal) throw new Error("Missing proposal");
    const pending = proposal;
    expect(() =>
      f.controller.accept(pending, { selection: { a: true, c: true } }),
    ).toThrow();
    expect(f.controller.getSnapshot()).toBe(before);
    f.controller.accept(pending, { selection: { c: true } });
    expect(f.controller.getSnapshot().selection).toEqual({ c: true });
    expect(f.controller.getSnapshot().query.builder.rules).toHaveLength(1);
  });
  it("keeps omission disabled and rejects unsupported runtime mode values", () => {
    const definition = defineNativeTable<typeof schema, RecordRow>({
      schema,
      getRowId: (record) => record.id,
      columns: [{ id: "amount", accessorKey: "amount" }],
    });
    expect(definition.selectionMode).toBe(false);
    const bad: unknown = "all";
    expect(() =>
      defineNativeTable({
        ...definition,
        schema,
        selection: bad as "single",
        columns: definition.columns,
      }),
    ).toThrow();
  });
});
