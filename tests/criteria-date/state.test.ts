import { parseDate, parseDateTime } from "@internationalized/date";
import { afterEach, expect, it, vi } from "vitest";
import {
  beginCriteriaDateEdit,
  closeCriteriaDateEdit,
  createCriteriaDateBundle,
  criteriaDateChild,
  criteriaDateState,
  readCriteriaDateState,
  readCriteriaDateToolbar,
  requireCriteriaDateState,
} from "../../packages/heroui/src/date/criteria-date-state.js";
import { createCriteriaCommitCell } from "../../packages/heroui/src/filters/criteria-commit.js";
import { criteriaDate } from "../../packages/heroui/src/toolbar/filter-date.js";
import { fixture, required } from "./fixtures.js";

afterEach(() => {
  vi.restoreAllMocks();
});

it("uses a finite actual F3 allocation; retained nested handles observe physical node nulling at real P purge", () => {
  const f = fixture("datetime", "range"),
    nodes: { value: unknown }[] = [];
  const add = Set.prototype.add;
  const capture = vi.spyOn(Set.prototype, "add").mockImplementation(function (
    this: Set<unknown>,
    value: unknown,
  ) {
    if (
      value !== null &&
      typeof value === "object" &&
      Object.hasOwn(value, "value") &&
      Object.hasOwn(value, "role")
    )
      nodes.push(value as { value: unknown });
    return Reflect.apply(add, this, [value]);
  });
  const stop = f.store.mount();
  f.store.commit(f.props());
  const initialCount = nodes.length;
  expect(initialCount).toBe(54); // presentation + 52 finite date cells + focus
  const a = required(f.store.read());
  criteriaDate.open(f.store, a.actor);
  let root = required(readCriteriaDateToolbar(a.local.bundle, a.actor).handle);
  criteriaDateState.mode(root, "instant");
  root = required(readCriteriaDateToolbar(a.local.bundle, a.actor).handle);
  const start = criteriaDateChild(root, "start", "instant"),
    end = criteriaDateChild(root, "end", "instant");
  criteriaDateState.text(start, "2030-01-01T12:34:56.789Z");
  root = required(readCriteriaDateToolbar(a.local.bundle, a.actor).handle);
  const currentEnd = criteriaDateChild(root, "end", "instant");
  criteriaDateState.text(currentEnd, "partial end");
  expect(nodes.some((node) => node.value === "partial end")).toBe(true);
  const retained = [root, start, end, currentEnd];
  let cleared = false;
  f.app.P.registerParticipant(f.app.authority(), {
    purge() {
      cleared = nodes.every((node) => node.value === null);
      return undefined;
    },
  });
  const begun = f.app.beginReset();
  expect(cleared).toBe(true);
  expect(a.cell.getSnapshot().actor).toBeNull();
  for (const handle of retained)
    expect(() => requireCriteriaDateState(handle)).toThrow();
  if (begun.status !== "pending") throw new Error("Actual reset missing");
  expect(f.app.completeReset(begun.ticket).status).toBe("settled");
  f.store.commit(f.props({ criteria: f.issue() }));
  const b = required(f.store.read());
  for (let i = 0; i < 5; i++) {
    createCriteriaDateBundle(b.cell);
    f.store.commit(f.props({ criteria: f.issue() }));
  }
  expect(nodes).toHaveLength(initialCount);
  capture.mockRestore();
  stop();
});

it("separates partial range endpoints and retains exact instant milliseconds without convenience-control migration", () => {
  const f = fixture("datetime", "range"),
    stop = f.store.mount();
  f.store.commit(f.props());
  const a = required(f.store.read());
  criteriaDate.open(f.store, a.actor);
  let root = required(readCriteriaDateToolbar(a.local.bundle, a.actor).handle);
  criteriaDateState.mode(root, "instant");
  root = required(readCriteriaDateToolbar(a.local.bundle, a.actor).handle);
  criteriaDateState.text(
    criteriaDateChild(root, "start", "instant"),
    "2030-01-01T01:02:03.456Z",
  );
  root = required(readCriteriaDateToolbar(a.local.bundle, a.actor).handle);
  criteriaDateState.text(
    criteriaDateChild(root, "end", "instant"),
    "2030-01-02T04:05:06.789Z",
  );
  root = required(readCriteriaDateToolbar(a.local.bundle, a.actor).handle);
  const start = criteriaDateChild(root, "start", "instant"),
    end = criteriaDateChild(root, "end", "instant");
  expect(readCriteriaDateState(start).text).toBe("2030-01-01T01:02:03.456Z");
  expect(readCriteriaDateState(end).text).toBe("2030-01-02T04:05:06.789Z");
  criteriaDateState.observe(
    criteriaDateChild(root, "start", "time-observer"),
    "initial convenience",
    { status: "complete", value: parseDateTime("2030-01-01T01:02:03") },
  );
  expect(readCriteriaDateState(start).text).toBe("2030-01-01T01:02:03.456Z");
  criteriaDateState.text(end, "invalid end");
  expect(readCriteriaDateState(start).text).toBe("2030-01-01T01:02:03.456Z");
  expect(readCriteriaDateToolbar(a.local.bundle, a.actor).candidate).toBeNull();
  stop();
});

it("same-domain B refresh preserves role cells but old A, mode ABA, copies and handle proxies deny", () => {
  const f = fixture(),
    stop = f.store.mount();
  f.store.commit(f.props());
  const a = required(f.store.read());
  criteriaDate.open(f.store, a.actor);
  let root = required(readCriteriaDateToolbar(a.local.bundle, a.actor).handle);
  criteriaDateState.mode(root, "instant");
  root = required(readCriteriaDateToolbar(a.local.bundle, a.actor).handle);
  const old = criteriaDateChild(root, "point", "instant");
  criteriaDateState.text(old, "partial");
  f.store.commit(f.props());
  const b = required(f.store.read()),
    fresh = required(readCriteriaDateToolbar(b.local.bundle, b.actor).handle),
    point = criteriaDateChild(fresh, "point", "instant");
  expect(readCriteriaDateState(point).text).toBe("partial");
  expect(() => readCriteriaDateState(old)).toThrow();
  expect(() => requireCriteriaDateState(new Proxy(point, {}))).toThrow();
  expect(() => requireCriteriaDateState({ ...point })).toThrow();
  criteriaDateState.mode(fresh, "day");
  let next = required(readCriteriaDateToolbar(b.local.bundle, b.actor).handle);
  criteriaDateState.mode(next, "instant");
  next = required(readCriteriaDateToolbar(b.local.bundle, b.actor).handle);
  expect(() => criteriaDateState.text(point, "stale mode")).toThrow();
  expect(
    readCriteriaDateState(criteriaDateChild(next, "point", "instant")).text,
  ).toBe("");
  stop();
});

it("accepted canonical baseline changes end only the local edit; sort/identical date and config refresh do not", () => {
  const f = fixture(),
    stop = f.store.mount();
  f.store.commit(f.props());
  let a = required(f.store.read());
  criteriaDate.open(f.store, a.actor);
  const root = required(
    readCriteriaDateToolbar(a.local.bundle, a.actor).handle,
  );
  criteriaDateState.calendar(
    criteriaDateChild(root, "point", "picker"),
    parseDate("2030-01-05"),
  );
  const before = readCriteriaDateToolbar(a.local.bundle, a.actor).candidate;
  f.external({ type: "sorting.change", update: [{ id: "id", desc: true }] });
  f.external({
    type: "pagination.change",
    update: { pageIndex: 1, pageSize: 25 },
  });
  expect(readCriteriaDateToolbar(a.local.bundle, a.actor).open).toBe(true);
  f.store.commit(f.props({ criteria: f.issue() }));
  a = required(f.store.read());
  expect(readCriteriaDateToolbar(a.local.bundle, a.actor).candidate).toEqual(
    before,
  );
  f.external({
    type: "date.commit",
    date: { operator: "date.on", value: { kind: "day", value: "2030-01-07" } },
  });
  expect(() => requireCriteriaDateState(root)).toThrow();
  criteriaDate.reconcile(f.store, a.actor);
  expect(readCriteriaDateToolbar(a.local.bundle, a.actor).open).toBe(false);
  expect(f.app.P.getSnapshot().phase).toBe("settled");
  stop();
});

it("locale/timeZone sessions end eligible editing without a P/domain reset or accepted date clearing", () => {
  const accepted = {
    operator: "date.on",
    value: { kind: "instant", value: "2030-01-01T01:02:03.456Z" },
  } as const;
  const f = fixture("datetime", "single", accepted),
    stop = f.store.mount();
  f.store.commit(f.props());
  const a = required(f.store.read());
  criteriaDate.open(f.store, a.actor);
  const root = required(
      readCriteriaDateToolbar(a.local.bundle, a.actor).handle,
    ),
    epoch = f.app.P.getSnapshot().current?.epoch;
  f.external({
    type: "query.context",
    locale: "fr-FR",
    timeZone: "Europe/Paris",
  });
  expect(() => requireCriteriaDateState(root)).toThrow();
  criteriaDate.reconcile(f.store, a.actor);
  expect(readCriteriaDateToolbar(a.local.bundle, a.actor).open).toBe(false);
  expect(f.app.C.getSnapshot().query.date).toEqual(accepted);
  expect(f.app.P.getSnapshot().current?.epoch).toBe(epoch);
  stop();
});

it("explicit convenience edit rejects a real timezone DST gap without clamping/migrating the accepted instant", () => {
  const accepted = {
    operator: "date.on",
    value: { kind: "instant", value: "2030-03-31T00:30:00.123Z" },
  } as const;
  const f = fixture("datetime", "single", accepted);
  f.external({
    type: "query.context",
    locale: "en-US",
    timeZone: "Europe/Paris",
  });
  const stop = f.store.mount();
  f.store.commit(f.props());
  const a = required(f.store.read());
  criteriaDate.open(f.store, a.actor);
  const root = required(
      readCriteriaDateToolbar(a.local.bundle, a.actor).handle,
    ),
    instant = criteriaDateChild(root, "point", "instant");
  criteriaDateState.dirty(instant);
  criteriaDateState.timeEditing(instant);
  criteriaDateState.observe(
    criteriaDateChild(root, "point", "time-observer"),
    "synthetic actual gap",
    { status: "complete", value: parseDateTime("2030-03-31T02:30:00") },
  );
  expect(readCriteriaDateState(instant).error).toContain(
    "ambiguous or does not exist",
  );
  expect(readCriteriaDateToolbar(a.local.bundle, a.actor).candidate).toBeNull();
  expect(f.app.C.getSnapshot().query.date).toEqual(accepted);
  stop();
});

it("Builder reuse is a genuine builder actor plus actual field/operator/rule baseline, not a caller check", () => {
  const f = fixture(),
    cell = createCriteriaCommitCell("builder", f.app.C),
    lease = cell.connect();
  const bundle = createCriteriaDateBundle(cell);
  const actor = cell.commit(lease, f.target, {
    controller: f.app.C,
    expectedResourceContext: f.context,
    invalidationKey: "builder",
    evaluationMode: "server",
    fields: { builderDate: { label: "Synthetic date" } },
  });
  const handle = beginCriteriaDateEdit(bundle, actor, {
    kind: "builder",
    fieldId: "builderDate",
    operator: "date.between",
    ruleId: null,
  });
  expect(readCriteriaDateState(handle).cardinality).toBe("range");
  criteriaDateState.mode(handle, "instant");
  const rangeRoot = required(readCriteriaDateToolbar(bundle, actor).handle),
    start = criteriaDateChild(rangeRoot, "start", "instant");
  criteriaDateState.text(start, "partial start");
  expect(() => criteriaDateChild(start, "end", "instant")).toThrow();
  const next = beginCriteriaDateEdit(bundle, actor, {
    kind: "builder",
    fieldId: "builderDate",
    operator: "date.on",
    ruleId: null,
  });
  expect(() => requireCriteriaDateState(start)).toThrow();
  criteriaDateState.mode(next, "instant");
  const pointRoot = required(readCriteriaDateToolbar(bundle, actor).handle);
  expect(
    readCriteriaDateState(criteriaDateChild(pointRoot, "point", "instant"))
      .text,
  ).toBe("");
  expect(() =>
    beginCriteriaDateEdit(bundle, actor, {
      kind: "builder",
      fieldId: "date",
      operator: "date.on",
      ruleId: null,
    }),
  ).toThrow();
  closeCriteriaDateEdit(bundle, actor);
  cell.disconnect(lease);
});
