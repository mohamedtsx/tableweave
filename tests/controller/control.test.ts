import { describe, expect, it } from "vitest";
import {
  createQuery,
  defineQuerySchema,
} from "../../packages/react/src/contracts/index.js";
import type { StateGroup } from "../../packages/react/src/index.js";
import {
  createTableController,
  replaceTableDefinition,
} from "../../packages/react/src/index.js";
import { definition, query } from "./fixtures.js";

describe("transaction ownership, lifecycle and subscriptions", () => {
  for (const group of ["columns", "details"] as const)
    it(`keeps controlled ${group} separate from the accepted query`, () => {
      const command =
        group === "columns"
          ? { type: "columns.visibility" as const, update: { title: false } }
          : { type: "details.change" as const, update: { rowId: "synthetic" } };
      let queries = 0;
      const store = createTableController(definition(), {
        initial: { query: query() },
        controlled: [group],
        now: () => 0,
        onRequest() {},
        onQueryChange() {
          queries++;
        },
      });
      const before = store.getSnapshot();
      const first = store.dispatch(command);
      if (first.status !== "proposed") throw new Error("Expected proposal");
      expect(store.getSnapshot()).toBe(before);
      store.reject(first.proposal);
      expect(store.getSnapshot()).toBe(before);
      const second = store.dispatch(command);
      if (second.status !== "proposed") throw new Error("Expected proposal");
      store.accept(second.proposal);
      expect(store.getSnapshot().query).toBe(before.query);
      expect(store.getSnapshot().revision).toBe(1);
      expect(queries).toBe(0);
    });
  it("gives duplicate listener registrations independent cleanups and idempotent disposal", () => {
    const store = createTableController(definition(), {
      initial: { query: query() },
      now: () => 0,
    });
    let calls = 0;
    const listener = () => {
      calls++;
    };
    const first = store.subscribe(listener);
    const second = store.subscribe(listener);
    first();
    store.dispatch({ type: "builder.clear" });
    expect(calls).toBe(1);
    second();
    store.dispatch({ type: "search.commit", search: "next" });
    expect(calls).toBe(1);
    store.dispose();
    expect(() => store.dispose()).not.toThrow();
  });
  it("rejects invalid ownership, presentation and initial selected states", () => {
    expect(() =>
      createTableController(definition(), {
        initial: { query: query() },
        controlled: ["query"],
        now: () => 0,
      }),
    ).toThrow();
    expect(() =>
      createTableController(
        { schema: definition().schema },
        { initial: { query: query(), selection: { x: true } }, now: () => 0 },
      ),
    ).toThrow();
    expect(() =>
      createTableController(definition(), {
        initial: {
          query: query(),
          columns: { visibility: { amount: false, title: false } },
        },
        now: () => 0,
      }),
    ).toThrow();
    expect(() =>
      createTableController(definition(), {
        initial: {
          query: query(),
          columns: { visibility: { unknown: false } },
        },
        now: () => 0,
      }),
    ).toThrow();
  });
  for (const controlled of [
    ["query"],
    ["selection"],
    ["query", "selection"],
  ] as const)
    it(`waits atomically for ${controlled.join("+")}`, () => {
      let proposals = 0;
      let changes = 0;
      let callbacks = 0;
      const store = createTableController(definition(), {
        initial: { query: query(), selection: { offpage: true } },
        controlled,
        now: () => 0,
        onRequest() {
          proposals++;
        },
        onQueryChange(next) {
          changes++;
          expect(next.pagination.pageIndex).toBe(0);
          expect(store.getSnapshot().selection).toEqual({});
        },
        onCommit() {
          callbacks++;
        },
      });
      let subscribers = 0;
      const unsubscribe = store.subscribe(() => {
        subscribers++;
      });
      const before = store.getSnapshot();
      const result = store.dispatch({ type: "builder.clear" });
      expect(result.status).toBe("proposed");
      expect(store.getSnapshot()).toBe(before);
      expect(changes).toBe(0);
      expect(subscribers).toBe(0);
      if (result.status !== "proposed") throw new Error("Expected proposal");
      expect(result.proposal.transition.changedGroups).toEqual([
        "query",
        "selection",
      ]);
      expect(store.accept(result.proposal).status).toBe("committed");
      expect(store.getSnapshot().revision).toBe(1);
      expect(subscribers).toBe(1);
      expect(proposals).toBe(1);
      expect(changes).toBe(1);
      expect(callbacks).toBe(1);
      expect(() => store.accept(result.proposal)).toThrow();
      unsubscribe();
    });
  it("permits explicit controlled selection override, not an uncontrolled override", () => {
    const store = createTableController(definition(), {
      initial: { query: query(), selection: { offpage: true } },
      controlled: ["selection"],
      now: () => 0,
      onRequest() {},
    });
    const before = store.getSnapshot();
    const result = store.dispatch({ type: "builder.clear" });
    if (result.status !== "proposed") throw new Error("Expected proposal");
    store.accept(result.proposal, { selection: before.selection });
    expect(store.getSnapshot().query.builder.rules).toEqual([]);
    expect(store.getSnapshot().selection).toBe(before.selection);
    const other = createTableController(definition(), {
      initial: { query: query(), selection: { offpage: true } },
      controlled: ["query"],
      now: () => 0,
      onRequest() {},
    });
    const pending = other.dispatch({ type: "builder.clear" });
    if (pending.status !== "proposed") throw new Error("Expected proposal");
    expect(() =>
      other.accept(pending.proposal, { selection: { offpage: true } }),
    ).toThrow();
    expect(other.getSnapshot().revision).toBe(0);
    other.reject(pending.proposal);
  });
  it("rejects stale, forged and cross-controller proposals", () => {
    const options = {
      initial: { query: query() },
      controlled: ["query"] as readonly StateGroup[],
      now: () => 0,
      onRequest() {},
    };
    const a = createTableController(definition(), options);
    const b = createTableController(definition(), options);
    const first = a.dispatch({ type: "builder.clear" });
    const second = a.dispatch({ type: "search.commit", search: "new" });
    const foreign = b.dispatch({ type: "builder.clear" });
    if (
      first.status !== "proposed" ||
      second.status !== "proposed" ||
      foreign.status !== "proposed"
    )
      throw new Error("Expected proposals");
    expect(() => a.accept(first.proposal)).toThrow();
    expect(() => a.accept(foreign.proposal)).toThrow();
    expect(() => a.accept({ ...second.proposal })).toThrow();
    a.accept(second.proposal);
    expect(a.getSnapshot().query.search).toBe("new");
    expect(b.getSnapshot().query.search).toBe("synthetic");
    b.reject(foreign.proposal);
    expect(b.getSnapshot().revision).toBe(0);
  });
  it("contains updater/request failures and preserves committed state despite observer failures", () => {
    const store = createTableController(definition(), {
      initial: { query: query(), selection: { offpage: true } },
      now: () => 0,
      onQueryChange() {
        throw new Error("synthetic-private");
      },
      onCommit() {
        throw new Error("synthetic-private");
      },
    });
    const before = store.getSnapshot();
    expect(() =>
      store.dispatch({
        type: "query.replace",
        update() {
          throw new Error("synthetic-private");
        },
      }),
    ).toThrow("Invalid Tableweave state transition.");
    expect(store.getSnapshot()).toBe(before);
    let observed = 0;
    store.subscribe(() => {
      throw new Error("synthetic-private");
    });
    store.subscribe(() => {
      observed++;
      expect(store.getSnapshot().selection).toEqual({});
    });
    const committed = store.dispatch({ type: "builder.clear" });
    expect(committed.status).toBe("committed");
    if (committed.status !== "committed") throw new Error("Expected commit");
    expect(committed.notificationFailures).toBe(3);
    expect(observed).toBe(1);
    expect(store.getSnapshot().revision).toBe(1);
    const controlled = createTableController(definition(), {
      initial: { query: query() },
      controlled: ["query"],
      now: () => 0,
      onRequest() {
        throw new Error("synthetic-private");
      },
    });
    const initial = controlled.getSnapshot();
    expect(controlled.dispatch({ type: "builder.clear" })).toEqual({
      status: "rejected",
      code: "callback",
    });
    expect(controlled.getSnapshot()).toBe(initial);
  });
  it("blocks reentrant mutation without losing the first accepted event", () => {
    const store = createTableController(definition(), {
      initial: { query: query() },
      now: () => 0,
      onCommit() {
        store.dispatch({ type: "builder.clear" });
      },
    });
    const result = store.dispatch({ type: "search.commit", search: "next" });
    expect(result.status).toBe("committed");
    if (result.status !== "committed") throw new Error("Expected commit");
    expect(result.notificationFailures).toBe(1);
    expect(store.getSnapshot().revision).toBe(1);
    expect(store.getSnapshot().query.builder.rules).toHaveLength(1);
  });
  it("advances relative semantics only at explicit query/tick transitions", () => {
    const schema = defineQuerySchema({
      id: "clock",
      version: 1,
      fields: { day: { type: "date", owner: "builder" } },
    });
    const def = { schema, selection: true };
    let now = Date.parse("2026-01-15T12:00:00Z");
    let calls = 0;
    const q = createQuery(schema, {
      locale: "en-US",
      timeZone: "UTC",
      pagination: { pageIndex: 3, pageSize: 10 },
      builder: {
        join: "and",
        rules: [
          {
            id: "r1",
            field: "day",
            operator: "date.on",
            value: { kind: "relative", preset: "today" },
          },
        ],
      },
    });
    const store = createTableController(def, {
      initial: { query: q, selection: { x: true } },
      now: () => now,
      onQueryChange() {
        calls++;
      },
    });
    const initial = store.getSnapshot();
    now++;
    expect(store.dispatch({ type: "clock.tick" }).status).toBe("noop");
    expect(store.getSnapshot()).toBe(initial);
    now += 86_400_000;
    store.dispatch({ type: "clock.tick" });
    expect(store.getSnapshot().query.pagination.pageIndex).toBe(0);
    expect(store.getSnapshot().selection).toEqual({});
    expect(store.getSnapshot().filterIdentity).not.toBe(initial.filterIdentity);
    expect(calls).toBe(1);
    const controlled = createTableController(def, {
      initial: { query: q },
      controlled: ["query"],
      now: () => now,
      onRequest() {},
    });
    const proposal = controlled.dispatch({ type: "builder.clear" });
    if (proposal.status !== "proposed") throw new Error("Expected proposal");
    // Clearing removes the relative criterion, so its accepted identity is clock-independent.
    now += 86_400_000;
    expect(controlled.accept(proposal.proposal).status).toBe("committed");
    const relative = createTableController(def, {
      initial: { query: q },
      controlled: ["query"],
      now: () => now,
      onRequest() {},
    });
    const pending = relative.dispatch({
      type: "pagination.change",
      update: { pageIndex: 1, pageSize: 10 },
    });
    if (pending.status !== "proposed") throw new Error("Expected proposal");
    const before = relative.getSnapshot();
    now += 86_400_000;
    expect(() => relative.accept(pending.proposal)).toThrow();
    expect(relative.getSnapshot()).toBe(before);
  });
  it("revalidates explicit definition replacement without silent migration", () => {
    const old = createTableController(definition(), {
      initial: { query: query(), selection: { x: true } },
      now: () => 0,
    });
    const schema = defineQuerySchema({
      id: "coordinator",
      version: 2,
      fields: { amount: { type: "number", owner: "builder" } },
    });
    // Deliberately stale transport input, not a cast disguising a supported call.
    const stale = JSON.parse(JSON.stringify(query()));
    expect(() =>
      replaceTableDefinition(
        old,
        { schema },
        { initial: { query: stale }, now: () => 0 },
      ),
    ).toThrow();
    expect(old.isDisposed()).toBe(false);
    expect(old.getSnapshot().selection).toEqual({ x: true });
    const changedWithoutVersion = defineQuerySchema({
      id: "coordinator",
      version: 1,
      fields: {},
    });
    expect(() =>
      replaceTableDefinition(
        old,
        { schema: changedWithoutVersion },
        {
          initial: {
            query: createQuery(changedWithoutVersion, {
              locale: "en-US",
              timeZone: "UTC",
            }),
          },
          now: () => 0,
        },
      ),
    ).toThrow();
    const next = replaceTableDefinition(
      old,
      { schema },
      {
        initial: {
          query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
        },
        now: () => 0,
      },
    );
    expect(old.isDisposed()).toBe(true);
    expect(next.getSnapshot().query.schemaVersion).toBe(2);
    expect(next.getSnapshot().selection).toEqual({});
    expect(next.getSnapshot().details.rowId).toBeNull();
    expect(() => old.dispatch({ type: "selection.cancel" })).toThrow();
  });
  it("keeps stable server snapshots and cleans up subscriptions", () => {
    const store = createTableController(definition(), {
      initial: { query: query() },
      now: () => 0,
    });
    const server = store.getServerSnapshot();
    store.dispatch({ type: "search.commit", search: "changed" });
    expect(store.getServerSnapshot()).toBe(server);
    let notifications = 0;
    const unsubscribe = store.subscribe(() => {
      notifications++;
    });
    unsubscribe();
    store.dispatch({ type: "builder.clear" });
    expect(notifications).toBe(0);
    const accepted = store.getSnapshot();
    store.dispose();
    expect(store.getSnapshot()).toBe(accepted);
    expect(() => store.subscribe(() => {})).toThrow();
  });
});
