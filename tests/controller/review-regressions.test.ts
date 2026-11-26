import { describe, expect, it } from "vitest";
import type {
  ControllerDefinitionInput,
  StateSeed,
  TableCommand,
} from "../../packages/react/src/index.js";
import {
  createTableController,
  createTableState,
  reduceTableState,
} from "../../packages/react/src/index.js";
import { definition, query, type schema } from "./fixtures.js";

describe("WP-03 review session 1 runtime regressions", () => {
  for (const slice of ["order", "visibility"] as const) {
    for (const functional of [false, true]) {
      it(`n2: rejects ${functional ? "functional" : "direct"} null ${slice} without a layout reset`, () => {
        let commits = 0;
        let notifications = 0;
        const store = createTableController(definition(), {
          initial: {
            query: query(),
            columns:
              slice === "order"
                ? { order: ["title", "amount"] }
                : { visibility: { title: false } },
          },
          now: () => 0,
          onCommit() {
            commits++;
          },
        });
        store.subscribe(() => {
          notifications++;
        });
        const before = store.getSnapshot();
        // Invalid JavaScript input, deliberately outside the typed API.
        const command = {
          type: `columns.${slice}`,
          update: functional ? () => null : null,
        } as unknown as TableCommand<typeof schema>;
        expect(() => store.dispatch(command)).toThrow(
          "Invalid Tableweave state transition.",
        );
        expect(() =>
          reduceTableState(store.getDefinition(), before, command, { now: 0 }),
        ).toThrow("Invalid Tableweave state transition.");
        expect(store.getSnapshot()).toBe(before);
        expect(store.getSnapshot().columns).toBe(before.columns);
        expect(store.getSnapshot().revision).toBe(0);
        expect(commits).toBe(0);
        expect(notifications).toBe(0);
      });
    }
  }
  it("n2: defaults only omitted initialization and permits valid partial column seeds", () => {
    const def = definition();
    expect(
      createTableState(def, { query: query() }, { now: 0 }).columns,
    ).toEqual({ order: ["amount", "title"], visibility: {} });
    expect(
      createTableState(
        def,
        { query: query(), columns: { order: ["title", "amount"] } },
        { now: 0 },
      ).columns,
    ).toEqual({ order: ["title", "amount"], visibility: {} });
    expect(
      createTableState(
        def,
        { query: query(), columns: { visibility: { title: false } } },
        { now: 0 },
      ).columns,
    ).toEqual({ order: ["amount", "title"], visibility: { title: false } });
  });
  for (const [name, change] of [
    ["column group", { columns: null }],
    ["order", { columns: { order: null } }],
    ["visibility", { columns: { visibility: null } }],
    ["selection group", { selection: null }],
    ["details group", { details: null }],
  ] as const)
    it(`n2: rejects explicit null initialization for ${name}`, () => {
      const initial = { query: query(), ...change } as unknown as StateSeed<
        typeof schema
      >;
      expect(() => createTableState(definition(), initial, { now: 0 })).toThrow(
        "Invalid Tableweave state transition.",
      );
    });
  it("n2: invalid layout commands preserve a pending controlled proposal", () => {
    let requests = 0;
    let commits = 0;
    const store = createTableController(definition(), {
      initial: { query: query(), columns: { order: ["title", "amount"] } },
      controlled: ["columns"],
      now: () => 0,
      onRequest() {
        requests++;
      },
      onCommit() {
        commits++;
      },
    });
    const before = store.getSnapshot();
    const result = store.dispatch({
      type: "columns.visibility",
      update: { title: false },
    });
    if (result.status !== "proposed") throw new Error("Expected proposal");
    expect(() =>
      store.dispatch({
        type: "columns.order",
        update: null,
      } as unknown as TableCommand<typeof schema>),
    ).toThrow("Invalid Tableweave state transition.");
    expect(store.getSnapshot()).toBe(before);
    expect(requests).toBe(1);
    expect(commits).toBe(0);
    store.accept(result.proposal);
    expect(store.getSnapshot().columns.visibility).toEqual({ title: false });
    expect(commits).toBe(1);
  });
  it("n2: explicit null column metadata is not an omitted definition", () => {
    const invalid = {
      ...definition(),
      columns: null,
    } as unknown as ControllerDefinitionInput<typeof schema>;
    expect(() =>
      createTableController(invalid, {
        initial: { query: query() },
        now: () => 0,
      }),
    ).toThrow("Invalid Tableweave state transition.");
  });
});
