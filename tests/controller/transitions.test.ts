import { describe, expect, it } from "vitest";
import { createQuery } from "../../packages/react/src/contracts/index.js";
import type { TableCommand } from "../../packages/react/src/index.js";
import {
  createTableController,
  createTableState,
  defineController,
  reduceTableState,
} from "../../packages/react/src/index.js";
import { definition, query, schema } from "./fixtures.js";

describe("accepted-state transition producer", () => {
  for (const command of [
    { type: "search.commit", search: "different" },
    { type: "tabs.change", tabId: "all" },
    { type: "date.commit", date: null },
    { type: "query.context", locale: "en-GB", timeZone: "UTC" },
  ] as const)
    it(`commits ${command.type} and its reset consequences exactly once`, () => {
      let callbacks = 0;
      let subscriptions = 0;
      const store = createTableController(definition(), {
        initial: {
          query: query(),
          selection: { retained: true },
          details: { rowId: "detail" },
        },
        now: () => 0,
        onQueryChange() {
          callbacks++;
        },
      });
      store.subscribe(() => {
        subscriptions++;
      });
      const before = store.getSnapshot();
      store.dispatch(command);
      expect(store.getSnapshot().query.pagination).toEqual({
        pageIndex: 0,
        pageSize: 25,
      });
      expect(store.getSnapshot().selection).toEqual({});
      expect(store.getSnapshot().columns).toBe(before.columns);
      expect(store.getSnapshot().details).toBe(before.details);
      expect(callbacks).toBe(1);
      expect(subscriptions).toBe(1);
    });
  it("rejects using a state with a different definition, even at the same schema version", () => {
    const def = definition();
    const state = createTableState(def, { query: query() }, { now: 0 });
    const changed = defineController({ ...def, columns: [{ id: "amount" }] });
    expect(() =>
      reduceTableState(
        changed,
        state,
        { type: "selection.cancel" },
        { now: 0 },
      ),
    ).toThrow("Invalid Tableweave state transition.");
    expect(state.revision).toBe(0);
  });
  it("rejects mutation attempts and malformed commands with safe diagnostics", () => {
    const store = createTableController(definition(), {
      initial: { query: query() },
      now: () => 0,
    });
    const before = store.getSnapshot();
    expect(Object.isFrozen(before.query.builder.rules)).toBe(true);
    expect(() =>
      store.dispatch({
        type: "query.replace",
        update(previous) {
          Object.assign(previous.pagination, { pageIndex: 99 });
          return previous;
        },
      }),
    ).toThrow("Invalid Tableweave state transition.");
    const bad = {
      type: "builder.commit",
      rule: null,
    } as unknown as TableCommand<typeof schema>;
    expect(() => store.dispatch(bad)).toThrow(
      "Invalid Tableweave state transition.",
    );
    expect(store.getSnapshot()).toBe(before);
  });
  it("retains semantic no-ops and independent duplicate editor identities", () => {
    let requests = 0;
    const store = createTableController(definition(), {
      initial: { query: query(), selection: { retained: true } },
      now: () => 0,
      onQueryChange() {
        requests++;
      },
    });
    const before = store.getSnapshot();
    expect(store.dispatch({ type: "clock.tick" }).status).toBe("noop");
    expect(store.getSnapshot()).toBe(before);
    store.dispatch({
      type: "builder.duplicate",
      ruleId: "r1",
      newRuleId: "r2",
    });
    expect(
      store.getSnapshot().query.builder.rules.map((rule) => rule.id),
    ).toEqual(["r1", "r2"]);
    expect(store.getSnapshot().selection).toBe(before.selection);
    expect(store.getSnapshot().query.pagination.pageIndex).toBe(3);
    expect(requests).toBe(0);
    store.dispatch({
      type: "builder.commit",
      rule: { id: "r2", field: "amount", operator: "number.eq", value: 2 },
    });
    expect(store.getSnapshot().query.builder.rules[0]?.value).toBe(1);
    expect(store.getSnapshot().query.builder.rules[1]?.value).toBe(2);
    expect(store.getSnapshot().query.pagination.pageIndex).toBe(0);
    expect(store.getSnapshot().selection).toEqual({});
    expect(requests).toBe(1);
    store.dispatch({ type: "builder.negate", ruleId: "r2" });
    expect(store.getSnapshot().query.builder.rules[1]?.operator).toBe(
      "number.ne",
    );
    store.dispatch({ type: "builder.remove", ruleId: "r2" });
    expect(store.getSnapshot().query.builder.rules).toHaveLength(1);
  });
  for (const command of [
    { type: "builder.duplicate", ruleId: "r1", newRuleId: "r1" },
    { type: "builder.remove", ruleId: "missing" },
    {
      type: "builder.commit",
      rule: {
        id: "r1",
        field: "amount",
        operator: "number.between",
        value: [1],
      },
    },
    {
      type: "builder.commit",
      rule: { id: "r1", field: "title", operator: "text.contains", value: "x" },
    },
    { type: "sorting.change", update: [{ id: "title", desc: false }] },
    { type: "pagination.change", update: { pageIndex: -1, pageSize: 25 } },
    { type: "date.commit", date: { operator: "date.between", value: [] } },
    { type: "unknown" },
  ])
    it(`rejects invalid ${command.type} without callbacks or mutation`, () => {
      let count = 0;
      const store = createTableController(definition(), {
        initial: { query: query() },
        now: () => 0,
        onCommit() {
          count++;
        },
      });
      const before = store.getSnapshot();
      expect(() =>
        store.dispatch(command as unknown as TableCommand<typeof schema>),
      ).toThrow();
      expect(store.getSnapshot()).toBe(before);
      expect(count).toBe(0);
    });
  it("applies sort and size functional updates as one accepted transaction", () => {
    const observations: number[] = [];
    let notifications = 0;
    const store = createTableController(definition(), {
      initial: { query: query(), selection: { offpage: true } },
      now: () => 0,
      onQueryChange(next) {
        observations.push(next.pagination.pageIndex);
      },
    });
    store.subscribe(() => {
      notifications++;
    });
    const selection = store.getSnapshot().selection;
    store.dispatch({
      type: "sorting.change",
      update: (previous) => [...previous, { id: "amount", desc: true }],
    });
    expect(store.getSnapshot().query.pagination.pageIndex).toBe(0);
    expect(store.getSnapshot().selection).toBe(selection);
    store.dispatch({
      type: "pagination.change",
      update: (page) => ({ ...page, pageIndex: 2 }),
    });
    store.dispatch({
      type: "pagination.change",
      update: { pageIndex: 9, pageSize: 50 },
    });
    expect(observations).toEqual([0, 2, 0]);
    expect(notifications).toBe(3);
    expect(store.getSnapshot().selection).toBe(selection);
  });
  it("changes an empty join preference without query/reset notifications", () => {
    const initial = createQuery(schema, {
      locale: "en-US",
      timeZone: "UTC",
      pagination: { pageIndex: 3, pageSize: 25 },
    });
    let calls = 0;
    const store = createTableController(definition(), {
      initial: { query: initial, selection: { offpage: true } },
      now: () => 0,
      onQueryChange() {
        calls++;
      },
    });
    store.dispatch({ type: "builder.join", join: "or" });
    expect(store.getSnapshot().query.builder.join).toBe("or");
    expect(store.getSnapshot().query.pagination.pageIndex).toBe(3);
    expect(store.getSnapshot().selection).toEqual({ offpage: true });
    expect(calls).toBe(0);
    store.dispatch({ type: "tabs.change", tabId: "all" });
    expect(store.getSnapshot().selection).toEqual({});
    expect(calls).toBe(1);
  });
  it("selection Cancel does not advance the query clock or clear criteria", () => {
    let reads = 0;
    const store = createTableController(definition(), {
      initial: { query: query(), selection: { offpage: true } },
      now: () => {
        reads++;
        return 0;
      },
    });
    const before = store.getSnapshot();
    const count = reads;
    store.dispatch({ type: "selection.cancel" });
    expect(store.getSnapshot().selection).toEqual({});
    expect(store.getSnapshot().query).toBe(before.query);
    expect(store.getSnapshot().queryIdentity).toBe(before.queryIdentity);
    expect(reads).toBe(count);
  });
  it("selects only eligible current-page IDs and retains off-page selection", () => {
    const store = createTableController(definition(), {
      initial: {
        query: query(),
        selection: { offpage: true, ineligible: true },
      },
      now: () => 0,
    });
    const queryIdentity = store.getSnapshot().queryIdentity;
    store.dispatch({
      type: "selection.page",
      pageIds: ["a", "b", "ineligible"],
      eligibleIds: ["a", "b"],
      selected: true,
      queryIdentity,
    });
    expect(store.getSnapshot().selection).toEqual({
      offpage: true,
      ineligible: true,
      a: true,
      b: true,
    });
    store.dispatch({
      type: "selection.page",
      pageIds: ["a", "b"],
      eligibleIds: ["a"],
      selected: false,
      queryIdentity,
    });
    expect(store.getSnapshot().selection).toEqual({
      offpage: true,
      ineligible: true,
      b: true,
    });
    expect(() =>
      store.dispatch({
        type: "selection.page",
        pageIds: ["a"],
        eligibleIds: ["other"],
        selected: true,
        queryIdentity,
      }),
    ).toThrow();
    expect(() =>
      store.dispatch({
        type: "selection.page",
        pageIds: ["a"],
        eligibleIds: ["a"],
        selected: true,
        queryIdentity: "obsolete",
      }),
    ).toThrow();
  });
  it("bounds known-page correction and rejects stale corrections", () => {
    const store = createTableController(definition(), {
      initial: { query: query(), selection: { offpage: true } },
      now: () => 0,
    });
    const source = store.getSnapshot().queryIdentity;
    store.dispatch({
      type: "pagination.clamp",
      pageCount: 2,
      queryIdentity: source,
    });
    expect(store.getSnapshot().query.pagination.pageIndex).toBe(1);
    expect(store.getSnapshot().selection).toEqual({ offpage: true });
    expect(() =>
      store.dispatch({
        type: "pagination.clamp",
        pageCount: 0,
        queryIdentity: source,
      }),
    ).toThrow();
    store.dispatch({
      type: "pagination.clamp",
      pageCount: 0,
      queryIdentity: store.getSnapshot().queryIdentity,
    });
    expect(store.getSnapshot().query.pagination.pageIndex).toBe(0);
    expect(
      store.dispatch({
        type: "pagination.clamp",
        pageCount: 0,
        queryIdentity: store.getSnapshot().queryIdentity,
      }).status,
    ).toBe("noop");
  });
  it("requires explicit capabilities and complete valid presentation state", () => {
    const bare = createTableController(
      { schema },
      { initial: { query: query() }, now: () => 0 },
    );
    expect(() =>
      bare.dispatch({ type: "selection.change", update: { x: true } }),
    ).toThrow();
    expect(() =>
      bare.dispatch({ type: "details.change", update: { rowId: "x" } }),
    ).toThrow();
    const def = defineController({
      schema,
      columns: [
        { id: "utility", utility: true },
        { id: "a", hideable: false, reorderGroup: "left" },
        { id: "b", reorderGroup: "left" },
        { id: "c", reorderGroup: "right" },
        { id: "d", reorderGroup: "right" },
      ],
    });
    const store = createTableController(def, {
      initial: { query: query() },
      now: () => 0,
    });
    for (const order of [
      ["utility", "b", "a", "d"],
      ["a", "utility", "b", "c", "d"],
      ["utility", "c", "b", "a", "d"],
      ["utility", "a", "a", "c", "d"],
    ])
      expect(() =>
        store.dispatch({ type: "columns.order", update: order }),
      ).toThrow();
    expect(() =>
      store.dispatch({ type: "columns.visibility", update: { a: false } }),
    ).toThrow();
    expect(() =>
      store.dispatch({
        type: "columns.visibility",
        update: { utility: false },
      }),
    ).toThrow();
    store.dispatch({ type: "columns.visibility", update: { b: false } });
    expect(() =>
      store.dispatch({
        type: "columns.order",
        update: ["utility", "b", "a", "c", "d"],
      }),
    ).toThrow();
    store.dispatch({
      type: "columns.order",
      update: ["utility", "a", "b", "d", "c"],
    });
    expect(store.getSnapshot().columns.order).toEqual([
      "utility",
      "a",
      "b",
      "d",
      "c",
    ]);
    expect(store.getSnapshot().query).toEqual(query());
  });
  it("clears builder only, resetting page/selection atomically", () => {
    const def = definition();
    const before = createTableState(
      def,
      {
        query: query(),
        selection: { offpage: true },
        columns: { order: ["title", "amount"], visibility: { title: false } },
        details: { rowId: "offpage" },
      },
      { now: 0 },
    );
    const result = reduceTableState(
      def,
      before,
      { type: "builder.clear" },
      { now: 0 },
    );
    expect(result.state.query.builder).toEqual({ join: "or", rules: [] });
    expect(result.state.query.pagination).toEqual({
      pageIndex: 0,
      pageSize: 25,
    });
    expect(result.state.selection).toEqual({});
    expect(result.state.query.search).toBe(before.query.search);
    expect(result.state.query.tabId).toBe(before.query.tabId);
    expect(result.state.query.date).toEqual(before.query.date);
    expect(result.state.columns).toBe(before.columns);
    expect(result.state.details).toBe(before.details);
    expect(before.query.builder.rules).toHaveLength(1);
  });
  it("keeps a controlled query rejection completely invisible", () => {
    let requests = 0;
    let notifications = 0;
    const controller = createTableController(definition(), {
      initial: { query: query(), selection: { offpage: true } },
      controlled: ["query"],
      now: () => 0,
      onRequest() {
        requests++;
      },
      onQueryChange() {
        notifications++;
      },
    });
    const before = controller.getSnapshot();
    let subscriptions = 0;
    controller.subscribe(() => {
      subscriptions++;
    });
    const result = controller.dispatch({ type: "builder.clear" });
    expect(result.status).toBe("proposed");
    expect(requests).toBe(1);
    expect(controller.getSnapshot()).toBe(before);
    if (result.status !== "proposed") throw new Error("Expected proposal");
    controller.reject(result.proposal);
    expect(controller.getSnapshot()).toBe(before);
    expect(notifications).toBe(0);
    expect(subscriptions).toBe(0);
  });
});
