import { describe, expect, test } from "vitest";
import { createQuery } from "../../packages/react/src/contracts/query.js";
import { defineQuerySchema } from "../../packages/react/src/contracts/schema.js";
import {
  CriteriaAuthorityError,
  type CriteriaOrigin,
  createCriteriaAuthority,
  getCriteriaAuthorityOrigin,
  requireCriteriaAuthority,
} from "../../packages/react/src/controller/criteria.js";
import { getCriteriaControllerMethods } from "../../packages/react/src/controller/criteria-controller-methods.js";
import {
  createCriteriaPublication,
  getCriteriaPublicationBinding,
} from "../../packages/react/src/controller/criteria-publication.js";
import {
  createTableController,
  replaceTableDefinition,
} from "../../packages/react/src/controller/store.js";
import type {
  ControllerDefinition,
  TableController,
} from "../../packages/react/src/controller/types.js";

const schema = defineQuerySchema({
  id: "factory-methods",
  version: 1,
  fields: { name: { type: "text", owner: "search" } },
});
type S = typeof schema;
const context = {
  definitionKey: "factory-a",
  scopeKey: "scope-a",
  access: true,
};

function controller() {
  return createTableController(
    { schema, columns: [{ id: "name" }] },
    {
      initial: {
        query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
      },
      now: () => 0,
    },
  );
}

function raw(
  owner: TableController<S>,
  definition: ControllerDefinition<S>,
  read: () => void = () => {},
) {
  const origin: CriteriaOrigin<S> = {
    controller: owner,
    definition,
    context,
    epoch: 1,
  };
  const options = {
    origin,
    readCurrent() {
      expect(this).toBe(options);
      read();
      return {
        controller: owner,
        definition,
        expected: context,
        actual: context,
        epoch: 1,
      };
    },
  };
  const authority = createCriteriaAuthority(options);
  const captured = getCriteriaAuthorityOrigin(authority);
  if (!captured) throw new Error("Expected registered raw authority");
  return { authority, captured };
}

function publication(
  owner: TableController<S>,
  definition: ControllerDefinition<S>,
) {
  const P = createCriteriaPublication({
    controller: owner,
    definition,
    retirement: { retire: () => undefined },
  });
  const begin = P.begin({
    controller: owner,
    definition,
    expected: context,
    actual: context,
  });
  if (begin.status !== "pending") throw new Error("Expected pending P");
  const pending = P.getSnapshot().pending;
  if (!pending) throw new Error("Expected P-owned pending metadata");
  const authority = P.issue({
    controller: owner,
    definition,
    context,
    epoch: pending.epoch,
  });
  expect(P.complete(begin.ticket).status).toBe("settled");
  const captured = getCriteriaAuthorityOrigin(authority);
  if (!captured) throw new Error("Expected P-issued authority");
  return { P, authority, captured };
}

function denied(action: () => unknown) {
  let failure: unknown;
  try {
    action();
  } catch (error) {
    failure = error;
  }
  expect(failure).toBeInstanceOf(CriteriaAuthorityError);
  if (!(failure instanceof CriteriaAuthorityError))
    throw new Error("Expected safe criteria failure");
  expect(failure.code).toBe("criteria.unavailable");
  expect(failure.message).toBe("Criteria are unavailable.");
  expect(Object.hasOwn(failure, "cause")).toBe(false);
}

/** Synthetic protocol instrumentation only, never a genuine native/table grant. */
function protocol() {
  const real = controller();
  const definition = real.getDefinition();
  const calls: string[] = [];
  let disposeOnCheck = false;
  const methods = {
    ...real,
    isDisposed() {
      expect(this).toBe(owner);
      calls.push("isDisposed");
      if (disposeOnCheck) real.dispose();
      return real.isDisposed();
    },
    getDefinition() {
      expect(this).toBe(owner);
      calls.push("getDefinition");
      return real.getDefinition();
    },
  };
  const owner = new Proxy(methods, {
    getOwnPropertyDescriptor(target, key) {
      if (key === "isDisposed" || key === "getDefinition")
        calls.push(`capture:${key}`);
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
    get() {
      throw new Error("Controller property getters must not run");
    },
  });
  return {
    real,
    definition,
    owner,
    methods,
    calls,
    disposeOnCheck: () => {
      disposeOnCheck = true;
    },
  };
}

describe("exact store-factory method references", () => {
  test("only the returned frozen C has its immutable, exact own function pair", () => {
    const C = controller();
    const pair = getCriteriaControllerMethods(C);
    if (!pair) throw new Error("Expected store-factory method references");
    expect(Object.isFrozen(C)).toBe(true);
    expect(Object.isFrozen(pair)).toBe(true);
    expect(pair.getDefinition).toBe(C.getDefinition);
    expect(pair.isDisposed).toBe(C.isDisposed);
    expect(getCriteriaControllerMethods(C)).toBe(pair);
    expect(Reflect.apply(pair.getDefinition, C, [])).toBe(C.getDefinition());
    expect(Reflect.apply(pair.isDisposed, C, [])).toBe(false);
    C.dispose();
    expect(getCriteriaControllerMethods(C)).toBe(pair);
    expect(Reflect.apply(pair.isDisposed, C, [])).toBe(true);
  });

  test("copies, structural frozen objects and every proxy miss without traps", () => {
    const C = controller();
    let traps = 0;
    const hostile = new Proxy(C, {
      get() {
        traps++;
        throw new Error("No property reads in exact lookup");
      },
      getOwnPropertyDescriptor() {
        traps++;
        throw new Error("No reflection in exact lookup");
      },
      getPrototypeOf() {
        traps++;
        throw new Error("No prototype reads in exact lookup");
      },
      isExtensible() {
        traps++;
        throw new Error("No frozen-shape trust");
      },
    });
    const revoked = Proxy.revocable(C, {});
    revoked.revoke();
    for (const other of [
      { ...C },
      Object.freeze({ ...C }),
      Object.freeze({
        getDefinition: C.getDefinition,
        isDisposed: C.isDisposed,
      }),
      Object.create(C),
      new Proxy(C, {}),
      hostile,
      revoked.proxy,
      null,
      undefined,
      1,
      () => C,
    ])
      expect(getCriteriaControllerMethods(other)).toBeNull();
    expect(traps).toBe(0);
  });

  test.each(["dispose", "replace"] as const)(
    "raw require paths re-read the genuine C after %s, including reader-time disposal",
    (operation) => {
      const C = controller();
      let reads = 0;
      let retire = false;
      const f = raw(C, C.getDefinition(), () => {
        reads++;
        if (retire) {
          if (operation === "dispose") C.dispose();
          else {
            const next = replaceTableDefinition(
              C,
              { schema },
              { initial: { query: C.getSnapshot().query }, now: () => 0 },
            );
            expect(getCriteriaControllerMethods(next)?.getDefinition).toBe(
              next.getDefinition,
            );
            retire = false;
          }
        }
      });
      expect(reads).toBe(0);
      expect(f.authority.require()).toBe(f.captured);
      expect(requireCriteriaAuthority(f.authority, f.captured)).toBe(
        f.captured,
      );
      retire = true;
      denied(() => f.authority.require());
      denied(() => requireCriteriaAuthority(f.authority, f.captured));
      expect(reads).toBe(4);
      expect(getCriteriaControllerMethods(C)?.isDisposed()).toBe(true);
    },
  );

  test("P-issued genuine immutable metadata never caches controller liveness", () => {
    const C = controller();
    const f = publication(C, C.getDefinition());
    const settled = f.P.getSnapshot();
    expect(getCriteriaPublicationBinding(f.authority)?.publication).toBe(f.P);
    for (let i = 0; i < 3; i++) {
      expect(f.authority.require()).toBe(f.captured);
      expect(requireCriteriaAuthority(f.authority, f.captured)).toBe(
        f.captured,
      );
    }
    C.dispose();
    expect(f.P.getSnapshot()).toBe(settled);
    denied(() => f.authority.require());
    denied(() => requireCriteriaAuthority(f.authority, f.captured));
  });
});

describe("unregistered controller protocol still captures every method", () => {
  test.each(["method", "helper"] as const)(
    "%s preserves inert construction, callback receiver/order and disposal short-circuit",
    (path) => {
      const p = protocol();
      Object.freeze(p.methods);
      expect(getCriteriaControllerMethods(p.owner)).toBeNull();
      expect(getCriteriaControllerMethods(p.methods)).toBeNull();
      const f = raw(p.owner, p.definition, () => p.calls.push("readCurrent"));
      const require = () =>
        path === "method"
          ? f.authority.require()
          : requireCriteriaAuthority(f.authority, f.captured);
      expect(p.calls).toEqual([]);
      for (let i = 0; i < 2; i++) {
        expect(require()).toBe(f.captured);
        expect(p.calls.splice(0)).toEqual([
          "readCurrent",
          "capture:isDisposed",
          "isDisposed",
          "capture:getDefinition",
          "getDefinition",
        ]);
      }
      p.disposeOnCheck();
      denied(require);
      expect(p.calls).toEqual([
        "readCurrent",
        "capture:isDisposed",
        "isDisposed",
      ]);
    },
  );

  test("genuine P binding alone cannot authenticate a synthetic controller pair", () => {
    const p = protocol();
    const f = publication(p.owner, p.definition);
    expect(getCriteriaPublicationBinding(f.authority)?.publication).toBe(f.P);
    expect(getCriteriaControllerMethods(p.owner)).toBeNull();
    expect(p.calls).toEqual([]);
    const expected = [
      "capture:isDisposed",
      "isDisposed",
      "capture:getDefinition",
      "getDefinition",
    ];
    expect(f.authority.require()).toBe(f.captured);
    expect(p.calls.splice(0)).toEqual(expected);
    expect(requireCriteriaAuthority(f.authority, f.captured)).toBe(f.captured);
    expect(p.calls.splice(0)).toEqual(expected);
    p.disposeOnCheck();
    denied(() => f.authority.require());
    expect(p.calls).toEqual(["capture:isDisposed", "isDisposed"]);
  });

  test("mutable structural methods are captured again rather than retained", () => {
    const p = protocol();
    const f = raw(p.owner, p.definition);
    f.authority.require();
    p.calls.length = 0;
    p.methods.isDisposed = function () {
      expect(this).toBe(p.owner);
      p.calls.push("replacement:isDisposed");
      return true;
    };
    denied(() => requireCriteriaAuthority(f.authority, f.captured));
    expect(p.calls).toEqual(["capture:isDisposed", "replacement:isDisposed"]);
  });

  for (const name of ["isDisposed", "getDefinition"] as const) {
    for (const kind of ["accessor", "throw"] as const) {
      test(`${name} ${kind} denies safely without invoking accessors or later callbacks`, () => {
        const p = protocol();
        let getters = 0;
        if (kind === "accessor") {
          Object.defineProperty(p.methods, name, {
            get() {
              getters++;
              throw new Error("Private accessor must not run");
            },
          });
        } else {
          Object.defineProperty(p.methods, name, {
            value() {
              expect(this).toBe(p.owner);
              p.calls.push(`throw:${name}`);
              throw new Error("Private controller failure");
            },
          });
        }
        const f = raw(p.owner, p.definition, () => p.calls.push("readCurrent"));
        expect(p.calls).toEqual([]);
        for (const require of [
          () => f.authority.require(),
          () => requireCriteriaAuthority(f.authority, f.captured),
        ]) {
          denied(require);
          expect(p.calls.splice(0)).toEqual([
            "readCurrent",
            "capture:isDisposed",
            ...(name === "getDefinition"
              ? ["isDisposed", "capture:getDefinition"]
              : []),
            ...(kind === "throw" ? [`throw:${name}`] : []),
          ]);
        }
        expect(getters).toBe(0);
      });
    }
  }
});
