import { parseDate } from "@internationalized/date";
import type { JsonValue, OperatorRegistry } from "@tableweave/react/contracts";
import {
  createOperatorRegistry,
  defaultOperatorRegistry,
  defineOperator,
} from "@tableweave/react/filters";
import { expect, it } from "vitest";
import {
  criteriaDateChild,
  criteriaDateState,
  readCriteriaDateToolbar,
  requireCriteriaDateState,
} from "../../packages/heroui/src/date/criteria-date-state.js";
import { criteriaDate } from "../../packages/heroui/src/toolbar/filter-date.js";
import { fixture, required } from "./fixtures.js";

it("Apply/Clear/Cancel preserve controlled owner receipt rules and never auto-accept", () => {
  const f = fixture("date"),
    stop = f.store.mount();
  f.store.commit(f.props());
  const a = required(f.store.read());
  criteriaDate.open(f.store, a.actor);
  const root = required(
    readCriteriaDateToolbar(a.local.bundle, a.actor).handle,
  );
  criteriaDateState.calendar(
    criteriaDateChild(root, "point", "picker"),
    parseDate("2030-01-10"),
  );
  criteriaDate.apply(f.store, a.actor);
  expect(f.app.C.getSnapshot().query.date).toBeNull();
  expect(required(f.pending).transition.state.query.date).toEqual({
    operator: "date.on",
    value: { kind: "day", value: "2030-01-10" },
  });
  f.accept();
  criteriaDate.open(f.store, a.actor);
  criteriaDate.cancel(f.store, a.actor);
  expect(f.observed).toHaveLength(1);
  expect(f.app.C.getSnapshot().query.date).not.toBeNull();
  criteriaDate.clear(f.store, a.actor);
  expect(required(f.pending).transition.state.query.date).toBeNull();
  expect(f.app.C.getSnapshot().query.date).not.toBeNull();
  f.reject();
  stop();
});

it("symbolic and rolling values use accepted C time; no wall-clock substitution or hidden resolution", () => {
  const f = fixture("date"),
    stop = f.store.mount();
  f.store.commit(
    f.props({
      presets: [
        {
          id: "rolling",
          label: "Synthetic rolling",
          date: {
            operator: "date.on",
            value: { kind: "rolling", days: 7, direction: "past" },
          },
        },
      ],
    }),
  );
  const a = required(f.store.read());
  criteriaDate.open(f.store, a.actor);
  criteriaDate.preset(f.store, a.actor, "rolling");
  criteriaDate.apply(f.store, a.actor);
  expect(required(f.pending).transition.state.query.date).toEqual({
    operator: "date.on",
    value: { kind: "rolling", days: 7, direction: "past" },
  });
  f.reject();
  criteriaDate.open(f.store, a.actor);
  let root = required(readCriteriaDateToolbar(a.local.bundle, a.actor).handle);
  criteriaDateState.mode(root, "relative");
  root = required(readCriteriaDateToolbar(a.local.bundle, a.actor).handle);
  criteriaDateState.operand(root, {
    status: "complete",
    value: { kind: "relative", preset: "today" },
  });
  criteriaDate.apply(f.store, a.actor);
  expect(required(f.pending).transition.state.query.date).toEqual({
    operator: "date.on",
    value: { kind: "relative", preset: "today" },
  });
  f.reject();
  stop();
});

it("custom committed formatter/registry reentry cannot continue or dispatch through a replacement", () => {
  const f = fixture(),
    stop = f.store.mount();
  let calls = 0;
  f.store.commit(
    f.props({
      messages: {
        formatTimeZone() {
          calls++;
          f.reset();
          return "Synthetic revoked";
        },
      },
    }),
  );
  const a = required(f.store.read());
  criteriaDate.open(f.store, a.actor);
  const root = required(
    readCriteriaDateToolbar(a.local.bundle, a.actor).handle,
  );
  // Invoke the actual committed wrapper, not an allowing mock. Its post-gate
  // must fail after the real publication reset and physical cell purge.
  expect(() => required(a.ports.messages?.formatTimeZone)("UTC")).toThrow();
  expect(calls).toBe(1);
  expect(() => requireCriteriaDateState(root)).toThrow();
  criteriaDate.apply(f.store, a.actor);
  expect(f.observed).toHaveLength(0);
  stop();
});

it("onRequest rejection does not fabricate acceptance or clear the accepted date", () => {
  const f = fixture("date"),
    stop = f.store.mount();
  f.store.commit(f.props());
  const a = required(f.store.read());
  criteriaDate.open(f.store, a.actor);
  const root = required(
    readCriteriaDateToolbar(a.local.bundle, a.actor).handle,
  );
  criteriaDateState.calendar(
    criteriaDateChild(root, "point", "picker"),
    parseDate("2030-01-09"),
  );
  f.app.faults.onRequest = () => {
    throw new Error("Synthetic request failure");
  };
  criteriaDate.apply(f.store, a.actor);
  expect(f.app.C.getSnapshot().query.date).toBeNull();
  expect(f.pending).toBeNull();
  expect(readCriteriaDateToolbar(a.local.bundle, a.actor).open).toBe(true);
  stop();
});

it("actual parse/compile registry.get reentry retires A before final Date dispatch", () => {
  const f = fixture("date"),
    stop = f.store.mount();
  let armed = false,
    calls = 0;
  const registry: OperatorRegistry = {
    custom: defaultOperatorRegistry.custom,
    descriptors: defaultOperatorRegistry.descriptors,
    get(id) {
      calls++;
      if (armed) {
        armed = false;
        f.reset();
      }
      return defaultOperatorRegistry.get(id);
    },
  };
  f.store.commit(f.props({ registry }));
  const a = required(f.store.read());
  criteriaDate.open(f.store, a.actor);
  const root = required(
    readCriteriaDateToolbar(a.local.bundle, a.actor).handle,
  );
  criteriaDateState.calendar(
    criteriaDateChild(root, "point", "picker"),
    parseDate("2030-01-10"),
  );
  armed = true;
  criteriaDate.apply(f.store, a.actor);
  expect(calls).toBeGreaterThan(0);
  expect(f.observed).toHaveLength(0);
  expect(f.app.C.getSnapshot().query.date).toBeNull();
  expect(() => requireCriteriaDateState(root)).toThrow();
  stop();
});

it("onRequest can replace the local edit without old Apply closing it or swallowing its actual proposal receipt", () => {
  const f = fixture("date"),
    stop = f.store.mount();
  f.store.commit(f.props());
  const a = required(f.store.read());
  criteriaDate.open(f.store, a.actor);
  const old = required(readCriteriaDateToolbar(a.local.bundle, a.actor).handle);
  criteriaDateState.calendar(
    criteriaDateChild(old, "point", "picker"),
    parseDate("2030-01-10"),
  );
  f.app.faults.onRequest = () => {
    criteriaDate.cancel(f.store, a.actor);
    criteriaDate.open(f.store, a.actor);
  };
  criteriaDate.apply(f.store, a.actor);
  const current = readCriteriaDateToolbar(a.local.bundle, a.actor);
  expect(current.open).toBe(true);
  expect(current.handle).not.toBe(old);
  expect(current.notice).toBe("");
  expect(f.observed).toHaveLength(1);
  expect(f.pending).not.toBeNull();
  delete f.app.faults.onRequest;
  f.reject();
  stop();
});

it("custom validate/normalize/evaluate ports are actual committed captures and deny after callback reset", () => {
  // Directly probe each actual wrapped callback's post-gate. The operation is a
  // Date-port capture check, not a claim that this custom operator is a Date UI
  // operator or that Builder has adopted this bridge.
  for (const stage of ["validate", "normalize", "evaluate"] as const) {
    const f = fixture(),
      stop = f.store.mount();
    let armed = false,
      calls = 0;
    const reenter = () => {
      calls++;
      if (armed) {
        armed = false;
        f.reset();
      }
    };
    const custom = defineOperator({
      id: "synthetic.date",
      labelKey: "synthetic.date",
      types: ["datetime"] as const,
      cardinality: "one" as const,
      validate(value: unknown): value is JsonValue {
        reenter();
        return typeof value === "string";
      },
      normalize(value: JsonValue) {
        reenter();
        return value;
      },
      evaluate() {
        reenter();
        return true;
      },
    });
    f.store.commit(f.props({ registry: createOperatorRegistry([custom]) }));
    const a = required(f.store.read()),
      captured = required(a.ports.registry).custom[0];
    if (!captured) throw new Error("Actual custom capture missing");
    armed = true;
    expect(() => {
      if (stage === "validate") captured.validate("synthetic");
      else if (stage === "normalize") required(captured.normalize)("synthetic");
      else
        required(captured.evaluate)("synthetic", "synthetic", {
          field: f.schema.fields.date,
          locale: "en-US",
          timeZone: "UTC",
          now: Date.UTC(2030, 0, 1),
        });
    }).toThrow();
    expect(calls).toBe(1);
    expect(() => a.cell.require(a.actor)).toThrow();
    stop();
  }
});
