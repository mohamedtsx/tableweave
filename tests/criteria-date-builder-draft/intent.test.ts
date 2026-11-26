import { parseDate } from "@internationalized/date";
import { afterEach, expect, it, vi } from "vitest";
import type { CriteriaDateBinding } from "../../packages/heroui/src/date/criteria-date-state.js";
import {
  beginCriteriaDateEdit,
  closeCriteriaDateEdit,
  createCriteriaDateBundle,
  criteriaDateChild,
  criteriaDateState,
  readCriteriaDateState,
  readCriteriaDateToolbar,
  reconcileCriteriaDateBundle,
  requireCriteriaDateState,
} from "../../packages/heroui/src/date/criteria-date-state.js";
import { createCriteriaCommitCell } from "../../packages/heroui/src/filters/criteria-commit.js";
import {
  fixture,
  numberRule,
  rangeSeed,
  required,
  scalarRule,
} from "./fixtures.js";

afterEach(() => vi.restoreAllMocks());

it("existing real r1 date.on can draft date.between with its original JSON baseline and explicit empty seed", () => {
  const f = fixture(),
    before = f.app.C.getSnapshot();
  const handle = beginCriteriaDateEdit(f.bundle, f.actor, {
    kind: "builder",
    fieldId: "created",
    operator: "date.between",
    ruleId: "r1",
    draft: { id: "r1", baseline: f.baseline(), value: null },
  });
  expect(readCriteriaDateState(handle).cardinality).toBe("range");
  expect(readCriteriaDateToolbar(f.bundle, f.actor).draft).toEqual({
    status: "empty",
    value: null,
  });
  criteriaDateState.calendar(criteriaDateChild(handle, "point", "range"), {
    start: parseDate("2030-01-10"),
    end: parseDate("2030-01-11"),
  });
  expect(readCriteriaDateToolbar(f.bundle, f.actor).draft.status).toBe(
    "complete",
  );
  expect(f.app.C.getSnapshot()).toBe(before);
  closeCriteriaDateEdit(f.bundle, f.actor);
  expect(f.app.C.getSnapshot()).toBe(before);
  f.stop();
});
it("existing non-Date rule targets a Date field with the same real ID, never null provenance", () => {
  const f = fixture([numberRule]);
  const handle = beginCriteriaDateEdit(f.bundle, f.actor, {
    kind: "builder",
    fieldId: "created",
    operator: "date.between",
    ruleId: "r1",
    draft: { id: "r1", baseline: f.baseline(), value: rangeSeed },
  });
  expect(readCriteriaDateState(handle).cardinality).toBe("range");
  expect(readCriteriaDateToolbar(f.bundle, f.actor).draft).toEqual({
    status: "complete",
    value: rangeSeed,
  });
  expect(f.rule().field).toBe("amount");
  expect(f.app.counts.request).toBe(0);
  f.stop();
});
it("captured compatible target seed, containers and range endpoints do not alias the caller", () => {
  const f = fixture(),
    value: [
      { kind: "instant"; value: string },
      { kind: "instant"; value: string },
    ] = [{ ...rangeSeed[0] }, { ...rangeSeed[1] }];
  const intent = { id: "r1", baseline: f.baseline(), value },
    binding = {
      kind: "builder" as const,
      fieldId: "created",
      operator: "date.between",
      ruleId: "r1",
      draft: intent,
    };
  const handle = beginCriteriaDateEdit(f.bundle, f.actor, binding);
  value[0].value = "mutated";
  intent.baseline = "changed";
  binding.fieldId = "amount";
  binding.operator = "number.eq";
  expect(readCriteriaDateToolbar(f.bundle, f.actor).draft).toEqual({
    status: "complete",
    value: rangeSeed,
  });
  expect(Object.isFrozen(value)).toBe(false);
  expect(Object.isFrozen(binding)).toBe(false);
  expect(Object.isFrozen(intent)).toBe(false);
  const start = readCriteriaDateState(
      criteriaDateChild(handle, "start", "instant"),
    ),
    end = readCriteriaDateState(criteriaDateChild(handle, "end", "instant"));
  expect(start.text).toBe(rangeSeed[0].value);
  expect(end.text).toBe(rangeSeed[1].value);
  expect(f.rule()).toEqual(scalarRule);
  f.stop();
});
it("new explicit intent proves its allocated ID is absent, and null provenance cannot hide an existing ID", () => {
  const f = fixture();
  const handle = beginCriteriaDateEdit(f.bundle, f.actor, {
    kind: "builder",
    fieldId: "created",
    operator: "date.on",
    ruleId: null,
    draft: { id: "new-1", baseline: null, value: scalarRule.value },
  });
  expect(readCriteriaDateToolbar(f.bundle, f.actor).draft).toEqual({
    status: "complete",
    value: scalarRule.value,
  });
  expect(() =>
    beginCriteriaDateEdit(f.bundle, f.actor, {
      kind: "builder",
      fieldId: "created",
      operator: "date.on",
      ruleId: null,
      draft: { id: "r1", baseline: null, value: null },
    }),
  ).toThrow();
  requireCriteriaDateState(handle);
  f.external({
    type: "builder.commit",
    rule: { id: "new-1", field: "amount", operator: "number.eq", value: 9 },
  });
  expect(() => requireCriteriaDateState(handle)).toThrow();
  f.stop();
});
it("original bindings retain accepted field/operator seeding and old mismatch denial", () => {
  const f = fixture();
  const handle = beginCriteriaDateEdit(f.bundle, f.actor, {
    kind: "builder",
    fieldId: "created",
    operator: "date.on",
    ruleId: "r1",
  });
  expect(
    readCriteriaDateState(criteriaDateChild(handle, "point", "instant")).text,
  ).toBe(scalarRule.value.value);
  expect(() =>
    beginCriteriaDateEdit(f.bundle, f.actor, {
      kind: "builder",
      fieldId: "created",
      operator: "date.between",
      ruleId: "r1",
    }),
  ).toThrow();
  const blank = beginCriteriaDateEdit(f.bundle, f.actor, {
    kind: "builder",
    fieldId: "created",
    operator: "date.between",
    ruleId: null,
  });
  expect(readCriteriaDateState(blank).cardinality).toBe("range");
  f.stop();
});
it("wrong baseline, missing rule, wrong ID, owner, type and disallowed operator deny before seed exposure", () => {
  const f = fixture();
  let reads = 0;
  const value = () => {
    reads++;
    throw new Error("Must not inspect rejected intent's seed");
  };
  const badDraft = (id: string, baseline: string | null) =>
    Object.defineProperty({ id, baseline }, "value", {
      enumerable: true,
      get: value,
    });
  const candidates = [
    {
      kind: "builder",
      fieldId: "created",
      operator: "date.between",
      ruleId: "r1",
      draft: badDraft("r1", "stale"),
    },
    {
      kind: "builder",
      fieldId: "created",
      operator: "date.between",
      ruleId: "missing",
      draft: badDraft("missing", f.baseline()),
    },
    {
      kind: "builder",
      fieldId: "created",
      operator: "date.between",
      ruleId: "r1",
      draft: badDraft("other", f.baseline()),
    },
    ...[
      ["standalone", "date.on"],
      ["amount", "number.eq"],
      ["created", "date.after"],
      ["created", "unregistered"],
    ].map(([fieldId, operator]) => ({
      kind: "builder",
      fieldId,
      operator,
      ruleId: "r1",
      draft: badDraft("r1", f.baseline()),
    })),
  ];
  for (const binding of candidates)
    expect(() =>
      beginCriteriaDateEdit(f.bundle, f.actor, binding as CriteriaDateBinding),
    ).toThrow();
  expect(reads).toBe(0);
  f.stop();
});
it("original baseline, not current r1 recaptured as fresh intent, remains the full handle guard", () => {
  const f = fixture(),
    baseline = f.baseline(),
    handle = beginCriteriaDateEdit(f.bundle, f.actor, {
      kind: "builder",
      fieldId: "created",
      operator: "date.between",
      ruleId: "r1",
      draft: { id: "r1", baseline, value: null },
    });
  f.external({ type: "sorting.change", update: [{ id: "id", desc: true }] });
  f.external({
    type: "pagination.change",
    update: { pageIndex: 1, pageSize: 25 },
  });
  requireCriteriaDateState(handle);
  const b = f.commit();
  reconcileCriteriaDateBundle(f.bundle, b);
  const fresh = required(readCriteriaDateToolbar(f.bundle, b).handle);
  expect(() => requireCriteriaDateState(handle)).toThrow();
  requireCriteriaDateState(fresh);
  f.external({
    type: "builder.commit",
    rule: { ...scalarRule, value: { kind: "day", value: "2030-01-12" } },
  });
  expect(() => requireCriteriaDateState(fresh)).toThrow();
  expect(() =>
    beginCriteriaDateEdit(f.bundle, b, {
      kind: "builder",
      fieldId: "created",
      operator: "date.between",
      ruleId: "r1",
      draft: { id: "r1", baseline, value: null },
    }),
  ).toThrow();
  reconcileCriteriaDateBundle(f.bundle, b);
  f.external({ type: "builder.commit", rule: scalarRule });
  expect(() => requireCriteriaDateState(fresh)).toThrow();
  f.stop();
});
it("accepted removal or locale/time-zone change ends the edit; unrelated builder-rule changes do not", () => {
  const f = fixture(),
    binding: CriteriaDateBinding = {
      kind: "builder",
      fieldId: "created",
      operator: "date.between",
      ruleId: "r1",
      draft: { id: "r1", baseline: f.baseline(), value: null },
    },
    handle = beginCriteriaDateEdit(f.bundle, f.actor, binding);
  f.external({
    type: "builder.commit",
    rule: { id: "other", field: "amount", operator: "number.eq", value: 8 },
  });
  requireCriteriaDateState(handle);
  f.external({
    type: "query.context",
    locale: "fr-FR",
    timeZone: "Europe/Paris",
  });
  expect(() => requireCriteriaDateState(handle)).toThrow();
  reconcileCriteriaDateBundle(f.bundle, f.actor);
  const next = beginCriteriaDateEdit(f.bundle, f.actor, binding);
  f.external({ type: "builder.remove", ruleId: "r1" });
  expect(() => requireCriteriaDateState(next)).toThrow();
  f.stop();
});

it("actual P participant observes physical clearing of all 52 nodes with retained new-intent endpoint handles", () => {
  const f = fixture(),
    nodes: { value: unknown }[] = [],
    add = Set.prototype.add;
  // A second genuine cell allocates its own finite bundle after observation begins.
  const spy = vi.spyOn(Set.prototype, "add").mockImplementation(function (
    this: Set<unknown>,
    value: unknown,
  ) {
    if (
      value &&
      typeof value === "object" &&
      Object.hasOwn(value, "value") &&
      Object.hasOwn(value, "role")
    )
      nodes.push(value as { value: unknown });
    return Reflect.apply(add, this, [value]);
  });
  // Reuse through the fixed producer is covered by the existing Date fixture;
  // this probe captures real node values from the producer, not a fake cell.
  const cell = createCriteriaCommitCell("builder", f.app.C),
    bundle = createCriteriaDateBundle(cell),
    lease = cell.connect(),
    actor = cell.commit(lease, f.issue(), f.props());
  spy.mockRestore();
  expect(nodes).toHaveLength(52);
  const handle = beginCriteriaDateEdit(bundle, actor, {
      kind: "builder",
      fieldId: "created",
      operator: "date.between",
      ruleId: "r1",
      draft: { id: "r1", baseline: f.baseline(), value: rangeSeed },
    }),
    start = criteriaDateChild(handle, "start", "instant"),
    end = criteriaDateChild(handle, "end", "instant");
  let purged = false;
  f.app.P.registerParticipant(f.app.authority(), {
    purge() {
      purged = nodes.every((node) => node.value === null);
      return undefined;
    },
  });
  const begun = f.app.beginReset();
  expect(purged).toBe(true);
  for (const retained of [handle, start, end])
    expect(() => requireCriteriaDateState(retained)).toThrow();
  if (begun.status !== "pending")
    throw new Error("Actual pending reset missing");
  expect(f.app.completeReset(begun.ticket).status).toBe("settled");
  cell.disconnect(lease);
  f.stop();
});
