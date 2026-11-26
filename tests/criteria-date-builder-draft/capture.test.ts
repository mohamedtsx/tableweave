import type { OperatorRegistry } from "@tableweave/react/contracts";
import { defaultOperatorRegistry } from "@tableweave/react/filters";
import { expect, it } from "vitest";
import type { CriteriaDateBinding } from "../../packages/heroui/src/date/criteria-date-state.js";
import {
  beginCriteriaDateEdit,
  closeCriteriaDateEdit,
  criteriaDateChild,
  readCriteriaDateState,
  readCriteriaDateToolbar,
  reconcileCriteriaDateBundle,
  requireCriteriaDateState,
} from "../../packages/heroui/src/date/criteria-date-state.js";
import { fixture, rangeSeed, scalarRule } from "./fixtures.js";

it("captures each consumed descriptor once including aliased endpoint objects; cfg never rereads caller metadata", () => {
  const f = fixture(),
    counts = new Map<object, Map<PropertyKey, number>>();
  const wrap = <Value extends object>(value: Value): Value =>
    new Proxy(value, {
      getOwnPropertyDescriptor(target, key) {
        let fields = counts.get(target);
        if (!fields) {
          fields = new Map();
          counts.set(target, fields);
        }
        fields.set(key, (fields.get(key) ?? 0) + 1);
        return Reflect.getOwnPropertyDescriptor(target, key);
      },
      get() {
        throw new Error("No direct caller property get");
      },
    });
  const point = wrap({ ...rangeSeed[0] }),
    value = wrap([point, point] as const);
  const draft = wrap({ id: "r1", baseline: f.baseline(), value });
  const binding = wrap({
    kind: "builder" as const,
    fieldId: "created",
    operator: "date.between",
    ruleId: "r1",
    draft,
  });
  const handle = beginCriteriaDateEdit(f.bundle, f.actor, binding);
  const captured = JSON.stringify(
    [...counts.values()].map((fields) => [...fields.values()]),
  );
  for (const fields of counts.values())
    for (const count of fields.values()) expect(count).toBe(1);
  for (let i = 0; i < 3; i++) {
    requireCriteriaDateState(handle);
    readCriteriaDateToolbar(f.bundle, f.actor);
    readCriteriaDateState(criteriaDateChild(handle, "start", "instant"));
  }
  expect(
    JSON.stringify([...counts.values()].map((fields) => [...fields.values()])),
  ).toBe(captured);
  expect(readCriteriaDateToolbar(f.bundle, f.actor).draft).toEqual({
    status: "complete",
    value: [rangeSeed[0], rangeSeed[0]],
  });
  f.stop();
});

it("supplied undefined/accessor/inherited draft and malformed seed data deny without invoking getters or toJSON", () => {
  const f = fixture();
  let calls = 0;
  const forbidden = () => {
    calls++;
    throw new Error("Private getter/toJSON must not run");
  };
  const base = {
    kind: "builder",
    fieldId: "created",
    operator: "date.between",
    ruleId: "r1",
  } as const;
  const draft = (value: unknown) => ({
    id: "r1",
    baseline: f.baseline(),
    value,
  });
  const inputs: unknown[] = [
    { ...base, draft: undefined },
    Object.defineProperty({ ...base }, "draft", { get: forbidden }),
    Object.setPrototypeOf({ ...base }, { draft: draft(null) }),
    {
      ...base,
      draft: Object.defineProperty(
        { id: "r1", baseline: f.baseline() },
        "value",
        { enumerable: true, get: forbidden },
      ),
    },
    ...[
      undefined,
      forbidden,
      "not a date",
      [],
      [rangeSeed[0]],
      [...rangeSeed, rangeSeed[0]],
      [
        rangeSeed[0],
        Object.defineProperty({ kind: "instant" }, "value", {
          enumerable: true,
          get: forbidden,
        }),
      ],
      [rangeSeed[0], { kind: "instant", value: undefined }],
      [rangeSeed[0], { ...rangeSeed[1], toJSON: forbidden }],
      Object.create({ kind: "day", value: "2030-01-10" }),
    ].map((value) => ({ ...base, draft: draft(value) })),
  ];
  for (const binding of inputs)
    expect(() =>
      beginCriteriaDateEdit(f.bundle, f.actor, binding as CriteriaDateBinding),
    ).toThrow();
  expect(calls).toBe(0);
  expect(f.app.counts.request).toBe(0);
  f.stop();
});

it("an invalid wire or wrong seed cardinality cannot clear a still-eligible previous session", () => {
  const f = fixture(),
    handle = beginCriteriaDateEdit(f.bundle, f.actor, {
      kind: "builder",
      fieldId: "created",
      operator: "date.on",
      ruleId: "r1",
    });
  const base = {
    kind: "builder",
    fieldId: "created",
    operator: "date.between",
    ruleId: "r1",
  } as const;
  for (const value of [
    scalarRule.value,
    [
      { kind: "day", value: "2030-02-30" },
      { kind: "day", value: "2030-03-01" },
    ],
    [rangeSeed[1], rangeSeed[0]],
  ]) {
    expect(() =>
      beginCriteriaDateEdit(f.bundle, f.actor, {
        ...base,
        draft: { id: "r1", baseline: f.baseline(), value },
      } as CriteriaDateBinding),
    ).toThrow();
    requireCriteriaDateState(handle);
  }
  expect(
    readCriteriaDateState(criteriaDateChild(handle, "point", "instant")).text,
  ).toBe(scalarRule.value.value);
  f.stop();
});

it("a seed reflection trap which changes the accepted rule stops before further private seed reads", () => {
  const f = fixture(),
    baseline = f.baseline();
  let payloadReads = 0;
  const seed = new Proxy(
    { ...scalarRule.value },
    {
      getPrototypeOf(target) {
        f.external({
          type: "builder.commit",
          rule: { ...scalarRule, value: { kind: "day", value: "2030-01-12" } },
        });
        return Reflect.getPrototypeOf(target);
      },
      getOwnPropertyDescriptor(target, key) {
        payloadReads++;
        return Reflect.getOwnPropertyDescriptor(target, key);
      },
    },
  );
  expect(() =>
    beginCriteriaDateEdit(f.bundle, f.actor, {
      kind: "builder",
      fieldId: "created",
      operator: "date.on",
      ruleId: "r1",
      draft: { id: "r1", baseline, value: seed },
    }),
  ).toThrow();
  expect(payloadReads).toBe(0);
  expect(readCriteriaDateToolbar(f.bundle, f.actor).open).toBe(false);
  f.stop();
});

it("reflection reentry cannot recapture changed r1 as a new original baseline or borrow B's actor", () => {
  const f = fixture(),
    original = f.baseline();
  let reads = 0;
  const intent = Object.defineProperty({ id: "r1" }, "baseline", {
    enumerable: true,
    value: original,
  });
  Object.defineProperty(intent, "value", {
    enumerable: true,
    get() {
      reads++;
      return null;
    },
  });
  const binding = new Proxy(
    {
      kind: "builder",
      ruleId: "r1",
      fieldId: "created",
      operator: "date.between",
      draft: intent,
    },
    {
      getOwnPropertyDescriptor(target, key) {
        if (key === "ruleId")
          f.external({ type: "builder.remove", ruleId: "r1" });
        return Reflect.getOwnPropertyDescriptor(target, key);
      },
    },
  );
  expect(() =>
    beginCriteriaDateEdit(f.bundle, f.actor, binding as CriteriaDateBinding),
  ).toThrow();
  expect(reads).toBe(0);
  const fresh = fixture();
  let b = fresh.actor;
  const seed = new Proxy(
    { ...scalarRule.value },
    {
      getPrototypeOf(target) {
        b = fresh.commit();
        return Reflect.getPrototypeOf(target);
      },
    },
  );
  expect(() =>
    beginCriteriaDateEdit(fresh.bundle, fresh.actor, {
      kind: "builder",
      fieldId: "created",
      operator: "date.on",
      ruleId: "r1",
      draft: { id: "r1", baseline: fresh.baseline(), value: seed },
    }),
  ).toThrow();
  expect(() => fresh.cell.require(fresh.actor)).toThrow();
  fresh.cell.require(b);
  fresh.stop();
  f.stop();
});

it("a same-actor local session replacement during reflection cannot be overwritten by the outer begin", () => {
  const f = fixture();
  const previous = beginCriteriaDateEdit(f.bundle, f.actor, {
    kind: "builder",
    fieldId: "created",
    operator: "date.on",
    ruleId: "r1",
  });
  let replacement = previous;
  const seed = new Proxy(
    { ...scalarRule.value },
    {
      getPrototypeOf(target) {
        replacement = beginCriteriaDateEdit(f.bundle, f.actor, {
          kind: "builder",
          fieldId: "created",
          operator: "date.on",
          ruleId: "r1",
        });
        return Reflect.getPrototypeOf(target);
      },
    },
  );
  expect(() =>
    beginCriteriaDateEdit(f.bundle, f.actor, {
      kind: "builder",
      fieldId: "created",
      operator: "date.on",
      ruleId: "r1",
      draft: { id: "r1", baseline: f.baseline(), value: seed },
    }),
  ).toThrow();
  expect(() => requireCriteriaDateState(previous)).toThrow();
  requireCriteriaDateState(replacement);
  expect(readCriteriaDateToolbar(f.bundle, f.actor).handle).toBe(replacement);
  f.stop();
});

it("irrelevant sort during capture is not a baseline failure; symbolic/rolling seeds remain symbolic", () => {
  const f = fixture();
  let changed = false;
  const seed = new Proxy(
    { kind: "relative" as const, preset: "today" as const },
    {
      getPrototypeOf(target) {
        if (!changed) {
          changed = true;
          f.external({
            type: "sorting.change",
            update: [{ id: "id", desc: true }],
          });
        }
        return Reflect.getPrototypeOf(target);
      },
    },
  );
  const handle = beginCriteriaDateEdit(f.bundle, f.actor, {
    kind: "builder",
    fieldId: "created",
    operator: "date.before",
    ruleId: "r1",
    draft: { id: "r1", baseline: f.baseline(), value: seed },
  });
  expect(readCriteriaDateToolbar(f.bundle, f.actor).draft).toEqual({
    status: "complete",
    value: { kind: "relative", preset: "today" },
  });
  requireCriteriaDateState(handle);
  closeCriteriaDateEdit(f.bundle, f.actor);
  const rolling = { kind: "rolling", days: 7, direction: "past" } as const;
  beginCriteriaDateEdit(f.bundle, f.actor, {
    kind: "builder",
    fieldId: "created",
    operator: "date.on",
    ruleId: "r1",
    draft: { id: "r1", baseline: f.baseline(), value: rolling },
  });
  expect(readCriteriaDateToolbar(f.bundle, f.actor).draft).toEqual({
    status: "complete",
    value: rolling,
  });
  reconcileCriteriaDateBundle(f.bundle, f.actor);
  f.stop();
});

it("target eligibility uses the actual captured descriptor allowlist, not an eager registry callback or rule mutation", () => {
  const f = fixture();
  let callbackCalls = 0;
  const registry: OperatorRegistry = {
    custom: defaultOperatorRegistry.custom,
    descriptors: defaultOperatorRegistry.descriptors,
    get() {
      callbackCalls++;
      throw new Error("Parent rule validation owns registry resolution");
    },
  };
  const actor = f.commit({ registry });
  const handle = beginCriteriaDateEdit(f.bundle, actor, {
    kind: "builder",
    fieldId: "created",
    operator: "date.between",
    ruleId: "r1",
    draft: { id: "r1", baseline: f.baseline(), value: rangeSeed },
  });
  expect(callbackCalls).toBe(0);
  requireCriteriaDateState(handle);
  expect(f.app.counts.request).toBe(0);
  expect(f.rule()).toEqual(scalarRule);
  f.stop();
});

it("a real actor from another bundle and copied/proxied handles do not grant input traversal", () => {
  const f = fixture(),
    g = fixture();
  let reads = 0;
  const input = Object.defineProperty({}, "kind", {
    get() {
      reads++;
      throw new Error("Wrong bundle actor must deny first");
    },
  }) as CriteriaDateBinding;
  expect(() => beginCriteriaDateEdit(f.bundle, g.actor, input)).toThrow();
  expect(() =>
    beginCriteriaDateEdit(new Proxy(f.bundle, {}), f.actor, input),
  ).toThrow();
  expect(reads).toBe(0);
  const handle = beginCriteriaDateEdit(f.bundle, f.actor, {
    kind: "builder",
    fieldId: "created",
    operator: "date.on",
    ruleId: "r1",
    draft: { id: "r1", baseline: f.baseline(), value: scalarRule.value },
  });
  expect(() => requireCriteriaDateState({ ...handle })).toThrow();
  expect(() => requireCriteriaDateState(new Proxy(handle, {}))).toThrow();
  f.stop();
  g.stop();
});
