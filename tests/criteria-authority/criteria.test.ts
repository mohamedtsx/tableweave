import { describe, expect, test } from "vitest";
import { createQuery } from "../../packages/react/src/contracts/query.js";
import { defineQuerySchema } from "../../packages/react/src/contracts/schema.js";
import type {
  CriteriaAuthority,
  CriteriaAuthorityOptions,
  CriteriaCurrent,
  CriteriaOrigin,
} from "../../packages/react/src/controller/criteria.js";
import {
  CriteriaAuthorityError,
  createCriteriaAuthority,
  getCriteriaAuthorityOrigin,
  requireCriteriaAuthority,
} from "../../packages/react/src/controller/criteria.js";
import {
  createTableController,
  replaceTableDefinition,
} from "../../packages/react/src/controller/store.js";
import type { TableController } from "../../packages/react/src/controller/types.js";

const schema = defineQuerySchema({
  id: "criteria-alpha",
  version: 1,
  fields: {
    name: { type: "text", owner: "search", sort: true },
    amount: { type: "number", owner: "builder", sort: true },
  },
});
type S = typeof schema;

function controller() {
  return createTableController(
    {
      schema,
      selection: true,
      details: true,
      columns: [{ id: "name" }, { id: "amount" }],
    },
    {
      initial: {
        query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
      },
      now: () => 0,
    },
  );
}

function fixture(owner = controller()) {
  const origin: CriteriaOrigin<S> = {
    controller: owner,
    definition: owner.getDefinition(),
    context: { definitionKey: "table-a", scopeKey: "scope-a", access: true },
    epoch: 1,
  };
  let current: CriteriaCurrent<S> = {
    controller: owner,
    definition: origin.definition,
    expected: { ...origin.context },
    actual: { ...origin.context },
    epoch: 1,
  };
  let reads = 0;
  const options = {
    origin,
    readCurrent() {
      reads++;
      return current;
    },
  };
  const authority = createCriteriaAuthority(options);
  return {
    origin,
    authority,
    options,
    owner,
    read: () => current,
    set: (next: CriteriaCurrent<S>) => {
      current = next;
    },
    reads: () => reads,
  };
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

/** Deliberately instrumented delegates are used only for call-order/receiver probes.
 * All semantic positives/foreign definitions use the real accepted store factory.
 */
function instrument() {
  const real = controller();
  const definition = real.getDefinition();
  const calls = { definition: 0, disposal: 0 };
  const owner: TableController<S> = {
    ...real,
    getDefinition() {
      expect(this).toBe(owner);
      calls.definition++;
      return definition;
    },
    isDisposed() {
      expect(this).toBe(owner);
      calls.disposal++;
      return real.isDisposed();
    },
  };
  return { owner, real, definition, calls };
}

describe("actual accepted controller semantics", () => {
  test("construction/lookup are inert and both success paths return the SAME frozen origin", () => {
    const probe = instrument();
    const f = fixture(probe.owner);
    probe.calls.definition = 0;
    expect(f.reads()).toBe(0);
    const a = getCriteriaAuthorityOrigin(f.authority);
    expect(probe.calls).toEqual({ definition: 0, disposal: 0 });
    expect(f.reads()).toBe(0);
    expect(a).not.toBe(f.origin);
    expect(Object.isFrozen(a)).toBe(true);
    expect(Object.isFrozen(a?.context)).toBe(true);
    expect(Object.isFrozen(f.authority)).toBe(true);
    expect(f.authority.require()).toBe(a);
    expect(requireCriteriaAuthority(f.authority, f.origin)).toBe(a);
    expect(probe.calls).toEqual({ definition: 2, disposal: 2 });
    expect(f.reads()).toBe(2);
  });

  test("ordinary real owner/current/target succeeds and does not mutate accepted state", () => {
    const f = fixture();
    const before = f.owner.getSnapshot();
    expect(f.authority.require().controller).toBe(f.owner);
    expect(requireCriteriaAuthority(f.authority, f.origin).definition).toBe(
      f.owner.getDefinition(),
    );
    expect(f.owner.getSnapshot()).toBe(before);
  });

  test("unrelated accepted query, selection and details transitions do not deny", () => {
    const f = fixture();
    const saved = getCriteriaAuthorityOrigin(f.authority);
    for (const action of [
      () =>
        f.owner.dispatch({ type: "search.commit", search: "new criterion" }),
      () =>
        f.owner.dispatch({
          type: "sorting.change",
          update: [{ id: "amount", desc: true }],
        }),
      () =>
        f.owner.dispatch({
          type: "pagination.change",
          update: { pageIndex: 2, pageSize: 10 },
        }),
      () =>
        f.owner.dispatch({
          type: "selection.change",
          update: { "off-page": true },
        }),
      () =>
        f.owner.dispatch({
          type: "details.change",
          update: { rowId: "record-a" },
        }),
    ]) {
      action();
      expect(f.authority.require()).toBe(saved);
    }
  });

  test("same-query scope B and ABA epoch changes deny saved A without a React render", () => {
    const f = fixture();
    const query = f.owner.getSnapshot().query;
    const a = f.read();
    f.set({
      ...a,
      expected: { ...a.expected, scopeKey: "scope-b" },
      actual: { ...a.actual, scopeKey: "scope-b" },
      epoch: 2,
    });
    denied(() => f.authority.require());
    f.set({ ...a, epoch: 3 });
    denied(() => requireCriteriaAuthority(f.authority, f.origin));
    expect(f.owner.getSnapshot().query).toBe(query);
  });

  test("disposed/replaced real controller cannot retain event authority", () => {
    const f = fixture();
    replaceTableDefinition(
      f.owner,
      { schema },
      { initial: { query: f.owner.getSnapshot().query }, now: () => 0 },
    );
    expect(f.owner.isDisposed()).toBe(true);
    denied(() => f.authority.require());
  });

  test("independent same-valued owners never gain each other's definition/controller association", () => {
    const a = fixture();
    const b = fixture();
    expect(a.owner.getSnapshot().query).toEqual(b.owner.getSnapshot().query);
    expect(a.origin.definition).toEqual(b.origin.definition);
    expect(a.origin.definition).not.toBe(b.origin.definition);
    denied(() => requireCriteriaAuthority(a.authority, b.origin));
    a.set({
      ...a.read(),
      controller: b.owner,
      definition: b.origin.definition,
    });
    denied(() => a.authority.require());
    expect(b.authority.require().controller).toBe(b.owner);
  });
});

describe("denial ordering and exact metadata", () => {
  test("denied origins exist but call no reader/controller method and lookup stays inert", () => {
    const real = controller();
    let methodReads = 0;
    let readerCalls = 0;
    const owner = Object.defineProperty({ ...real }, "isDisposed", {
      get() {
        methodReads++;
        throw new Error("Must not touch controller");
      },
    });
    const origin: CriteriaOrigin<S> = {
      controller: owner,
      definition: real.getDefinition(),
      context: { definitionKey: "d", scopeKey: "s", access: false },
      epoch: 0,
    };
    const authority = createCriteriaAuthority({
      origin,
      readCurrent() {
        readerCalls++;
        throw new Error("Must not read denied current");
      },
    });
    expect(getCriteriaAuthorityOrigin(authority)?.context.access).toBe(false);
    denied(() => authority.require());
    denied(() => requireCriteriaAuthority(authority, origin));
    expect({ methodReads, readerCalls }).toEqual({
      methodReads: 0,
      readerCalls: 0,
    });
  });

  for (const field of [
    "controller",
    "definition",
    "definitionKey",
    "scopeKey",
    "access",
    "epoch",
  ] as const) {
    test(`target ${field} mismatch denies before reader or controller`, () => {
      const f = fixture();
      const foreign = fixture();
      const target =
        field === "controller"
          ? { ...f.origin, controller: foreign.owner }
          : field === "definition"
            ? { ...f.origin, definition: foreign.origin.definition }
            : field === "epoch"
              ? { ...f.origin, epoch: "1" }
              : {
                  ...f.origin,
                  context: {
                    ...f.origin.context,
                    [field]: field === "access" ? false : "different",
                  },
                };
      denied(() => requireCriteriaAuthority(f.authority, target));
      expect(f.reads()).toBe(0);
    });
  }

  for (const side of ["expected", "actual"] as const) {
    for (const field of ["definitionKey", "scopeKey", "access"] as const) {
      test(`current ${side}.${field} mismatch precedes controller method reads`, () => {
        const p = instrument();
        const f = fixture(p.owner);
        p.calls.definition = 0;
        const current = f.read();
        f.set({
          ...current,
          [side]: {
            ...current[side],
            [field]: field === "access" ? false : "different",
          },
        });
        denied(() => f.authority.require());
        expect(p.calls).toEqual({ definition: 0, disposal: 0 });
      });
    }
  }

  for (const value of [
    Number.NaN,
    Infinity,
    -Infinity,
    true,
    null,
    undefined,
    {},
    Symbol("epoch"),
  ]) {
    test(`invalid epoch ${typeof value}/${String(typeof value === "number" ? value : "value")} denies safely`, () => {
      const f = fixture();
      denied(() =>
        createCriteriaAuthority({
          ...f.options,
          origin: { ...f.origin, epoch: value } as CriteriaOrigin<S>,
        }),
      );
      f.set({ ...f.read(), epoch: value } as CriteriaCurrent<S>);
      denied(() => f.authority.require());
    });
  }

  test("strings/finite decimals/negative numbers are accepted; equality is strict", () => {
    for (const value of ["", "epoch-a", -2.5, 0, 0.5, Number.MAX_VALUE]) {
      const f = fixture();
      f.options.origin = { ...f.origin, epoch: value };
      f.set({ ...f.read(), epoch: value });
      const authority = createCriteriaAuthority(f.options);
      expect(authority.require().epoch).toBe(value);
    }
    const f = fixture();
    f.set({ ...f.read(), epoch: "1" });
    denied(() => f.authority.require());
  });

  test("current references are checked before all controller callbacks", () => {
    const p = instrument();
    const f = fixture(p.owner);
    p.calls.definition = 0;
    const foreign = controller();
    for (const current of [
      { ...f.read(), controller: foreign },
      { ...f.read(), definition: foreign.getDefinition() },
    ]) {
      f.set(current);
      denied(() => f.authority.require());
    }
    expect(p.calls).toEqual({ definition: 0, disposal: 0 });
  });

  test("metadata agreement does not bypass the actual getDefinition reference", () => {
    const p = instrument();
    const f = fixture(p.owner);
    const foreign = controller().getDefinition();
    p.owner.getDefinition = function () {
      expect(this).toBe(p.owner);
      return foreign;
    };
    denied(() => f.authority.require());
  });
});

describe("private registration and descriptor capture", () => {
  test("copies, inherited, proxies and revoked proxies cannot call or acquire provenance", () => {
    const f = fixture();
    const revoked = Proxy.revocable(f.authority, {});
    revoked.revoke();
    let invoked = 0;
    const getter = Object.defineProperty({}, "require", {
      get() {
        invoked++;
        throw new Error("Do not read arbitrary require");
      },
    }) as CriteriaAuthority<S>;
    for (const other of [
      { ...f.authority },
      Object.create(f.authority) as CriteriaAuthority<S>,
      new Proxy(f.authority, {}),
      revoked.proxy,
      getter,
    ]) {
      expect(getCriteriaAuthorityOrigin(other)).toBeNull();
      denied(() => requireCriteriaAuthority(other, f.origin));
    }
    denied(() => ({ ...f.authority }).require());
    denied(() => new Proxy(f.authority, {}).require());
    expect(invoked).toBe(0);
    expect(f.reads()).toBe(0);
  });

  test("unregistered lookup/helper does not inspect even poisoned target metadata", () => {
    let reads = 0;
    const f = fixture();
    const target = new Proxy(f.origin, {
      getPrototypeOf() {
        reads++;
        throw new Error("Must not inspect target");
      },
    });
    denied(() => requireCriteriaAuthority({ ...f.authority }, target));
    expect(reads).toBe(0);
  });

  for (const field of ["origin", "readCurrent"] as const) {
    test(`construction rejects ${field} accessors without invocation`, () => {
      const f = fixture();
      let reads = 0;
      const options = Object.defineProperty({ ...f.options }, field, {
        get() {
          reads++;
          throw new Error("Private options getter");
        },
      });
      denied(() => createCriteriaAuthority(options));
      expect(reads).toBe(0);
    });
  }

  for (const field of [
    "controller",
    "definition",
    "context",
    "epoch",
  ] as const) {
    test(`origin rejects ${field} accessors without invocation`, () => {
      const f = fixture();
      let reads = 0;
      const value = Object.defineProperty({ ...f.origin }, field, {
        get() {
          reads++;
          throw new Error("Private origin getter");
        },
      });
      denied(() => createCriteriaAuthority({ ...f.options, origin: value }));
      expect(reads).toBe(0);
    });
  }

  for (const field of [
    "controller",
    "definition",
    "expected",
    "actual",
    "epoch",
  ] as const) {
    test(`current rejects ${field} accessors without invocation`, () => {
      const f = fixture();
      let reads = 0;
      f.set(
        Object.defineProperty({ ...f.read() }, field, {
          get() {
            reads++;
            throw new Error("Private current getter");
          },
        }),
      );
      denied(() => f.authority.require());
      expect(reads).toBe(0);
    });
  }

  test("context access getter cannot validate true then supply false", () => {
    const f = fixture();
    let reads = 0;
    const actual = Object.defineProperty({ ...f.read().actual }, "access", {
      get() {
        return ++reads < 2;
      },
    });
    f.set({ ...f.read(), actual });
    denied(() => f.authority.require());
    expect(reads).toBe(0);
  });

  test("controller methods are captured once per check, with their controller receiver", () => {
    const real = controller();
    const definition = real.getDefinition();
    const captures = { isDisposed: 0, getDefinition: 0 };
    const owner = new Proxy(
      { ...real },
      {
        getOwnPropertyDescriptor(_target, key) {
          if (key === "isDisposed" || key === "getDefinition") {
            captures[key]++;
            return {
              configurable: true,
              enumerable: true,
              writable: true,
              value: function (this: unknown) {
                expect(this).toBe(owner);
                return key === "isDisposed" ? false : definition;
              },
            };
          }
          throw new Error(`Unconsumed controller field ${String(key)}`);
        },
      },
    );
    const origin: CriteriaOrigin<S> = {
      controller: owner,
      definition,
      context: { definitionKey: "d", scopeKey: "s", access: true },
      epoch: 0,
    };
    const authority = createCriteriaAuthority({
      origin,
      readCurrent: () => ({
        controller: owner,
        definition,
        expected: origin.context,
        actual: origin.context,
        epoch: 0,
      }),
    });
    expect(captures).toEqual({ isDisposed: 0, getDefinition: 0 });
    authority.require();
    expect(captures).toEqual({ isDisposed: 1, getDefinition: 1 });
  });

  test("malformed context tags/access deny rather than coerce", () => {
    const f = fixture();
    const current = f.read();
    for (const invalid of [
      { ...current.actual, definitionKey: "" },
      { ...current.actual, scopeKey: "" },
      { ...current.actual, scopeKey: 1 },
      { ...current.actual, access: "true" },
    ]) {
      f.set({ ...current, actual: invalid } as CriteriaCurrent<S>);
      denied(() => f.authority.require());
    }
  });

  test("one descriptor value per consumed key; ignore unrelated getters", () => {
    const f = fixture();
    const counts = new Map<string, number>();
    const current = Object.defineProperty({ ...f.read() }, "unused", {
      get() {
        throw new Error("Unconsumed field");
      },
    });
    f.set(
      new Proxy(current, {
        getOwnPropertyDescriptor(target, key) {
          if (typeof key === "string")
            counts.set(key, (counts.get(key) ?? 0) + 1);
          return Object.getOwnPropertyDescriptor(target, key);
        },
      }),
    );
    f.authority.require();
    expect(Object.fromEntries(counts)).toEqual({
      controller: 1,
      definition: 1,
      expected: 1,
      actual: 1,
      epoch: 1,
    });
  });

  test("reader reference is captured once and its original options receiver survives", () => {
    const f = fixture();
    let captures = 0;
    let correct = 0;
    let replacement = 0;
    const target = { ...f.options };
    const options = new Proxy(target, {
      getOwnPropertyDescriptor(target, key) {
        if (key === "readCurrent") {
          captures++;
          return {
            configurable: true,
            enumerable: true,
            value: function (this: unknown) {
              expect(this).toBe(options);
              correct++;
              return f.read();
            },
          };
        }
        return Object.getOwnPropertyDescriptor(target, key);
      },
    });
    const authority = createCriteriaAuthority(options);
    target.readCurrent = () => {
      replacement++;
      throw new Error("Replacement must not run");
    };
    authority.require();
    authority.require();
    expect({ captures, correct, replacement }).toEqual({
      captures: 1,
      correct: 2,
      replacement: 0,
    });
  });

  test("mutating caller origin/options does not alter captured provenance or freeze inputs", () => {
    const f = fixture();
    const options = {
      ...f.options,
      origin: { ...f.origin, context: { ...f.origin.context } },
    };
    const authority = createCriteriaAuthority(options);
    const captured = getCriteriaAuthorityOrigin(authority);
    options.origin.context.scopeKey = "changed";
    options.origin.epoch = 9;
    options.readCurrent = () => {
      throw new Error("Not the captured reader");
    };
    expect(captured?.context.scopeKey).toBe("scope-a");
    expect(captured?.epoch).toBe(1);
    expect(authority.require()).toBe(captured);
    expect(Object.isFrozen(options)).toBe(false);
    expect(Object.isFrozen(options.origin)).toBe(false);
    expect(Object.isFrozen(options.origin.context)).toBe(false);
  });

  test("construction does not inspect/freeze opaque application refs or irrelevant fields", () => {
    const f = fixture();
    let traps = 0;
    const opaque = new Proxy(
      {},
      {
        getOwnPropertyDescriptor() {
          traps++;
          throw new Error("Opaque ref");
        },
        getPrototypeOf() {
          traps++;
          throw new Error("Opaque ref");
        },
        preventExtensions() {
          traps++;
          throw new Error("Do not freeze");
        },
      },
    );
    const options = Object.defineProperty(
      {
        ...f.options,
        origin: {
          ...f.origin,
          controller: opaque as TableController<S>,
          definition: opaque as CriteriaOrigin<S>["definition"],
        },
      },
      "unused",
      {
        get() {
          traps++;
          throw new Error("Ignore unused getter");
        },
      },
    );
    const authority = createCriteriaAuthority(options);
    expect(getCriteriaAuthorityOrigin(authority)?.controller).toBe(opaque);
    expect(traps).toBe(0);
  });
});

describe("safe opaque failures and unsupported async inputs", () => {
  test("thrown reader/proxy values never expose message/stack/toString/cause", () => {
    const f = fixture();
    let reads = 0;
    const poison = Object.create(null) as object;
    for (const key of [
      "message",
      "stack",
      "toString",
      "cause",
      "then",
      "constructor",
    ])
      Object.defineProperty(poison, key, {
        get() {
          reads++;
          throw new Error("Do not inspect private throw");
        },
      });
    const authority = createCriteriaAuthority({
      ...f.options,
      readCurrent() {
        throw poison;
      },
    });
    denied(() => authority.require());
    const current = f.read();
    for (const traps of [
      {
        getPrototypeOf() {
          throw poison;
        },
      },
      {
        getOwnPropertyDescriptor() {
          throw poison;
        },
      },
    ]) {
      denied(() => createCriteriaAuthority(new Proxy(f.options, traps)));
      f.set(new Proxy(current, traps));
      denied(() => f.authority.require());
    }
    expect(reads).toBe(0);
  });

  test("native promises (including decorated ones) deny without then/constructor/species reads", () => {
    const f = fixture();
    let reads = 0;
    const promise = Promise.resolve(f.read());
    const promiseConstructor = Object.defineProperty({}, Symbol.species, {
      get() {
        reads++;
        throw new Error("No species reads");
      },
    });
    Object.defineProperties(promise, {
      // biome-ignore lint/suspicious/noThenProperty: Intentionally poisoned Promise metadata; the producer must not read it.
      then: {
        get() {
          reads++;
          throw new Error("No then reads");
        },
      },
      constructor: {
        get() {
          reads++;
          return promiseConstructor;
        },
      },
    });
    for (const result of [
      promise,
      Object.assign(Promise.resolve(), f.read()),
    ]) {
      const authority = createCriteriaAuthority({
        ...f.options,
        readCurrent: () => result as unknown as CriteriaCurrent<S>,
      });
      denied(() => authority.require());
    }
    expect(reads).toBe(0);
  });

  test("ordinary thenable/primitive/null/array outputs deny without asynchronous discovery", () => {
    const f = fixture();
    let reads = 0;
    // biome-ignore lint/suspicious/noThenProperty: A hostile thenable is an explicit unsupported-port regression input.
    const thenable = Object.defineProperty({}, "then", {
      get() {
        reads++;
        throw new Error("No then read");
      },
    });
    for (const result of [
      thenable,
      null,
      undefined,
      true,
      0,
      "current",
      [],
      () => f.read(),
    ]) {
      const authority = createCriteriaAuthority({
        ...f.options,
        readCurrent: () => result as CriteriaCurrent<S>,
      });
      denied(() => authority.require());
    }
    expect(reads).toBe(0);
  });

  test("controller method accessors, throws and non-synchronous results deny safely", () => {
    const real = controller();
    const definition = real.getDefinition();
    for (const name of ["isDisposed", "getDefinition"] as const) {
      let reads = 0;
      const owner = Object.defineProperty({ ...real }, name, {
        get() {
          reads++;
          throw new Error("Private controller accessor");
        },
      });
      const origin: CriteriaOrigin<S> = {
        controller: owner,
        definition,
        context: { definitionKey: "d", scopeKey: "s", access: true },
        epoch: 0,
      };
      const authority = createCriteriaAuthority({
        origin,
        readCurrent: () => ({
          controller: owner,
          definition,
          expected: origin.context,
          actual: origin.context,
          epoch: 0,
        }),
      });
      denied(() => authority.require());
      expect(reads).toBe(0);
    }
    for (const result of [undefined, true, Promise.resolve(false), {}]) {
      const owner = { ...real, isDisposed: () => result } as TableController<S>;
      const origin: CriteriaOrigin<S> = {
        controller: owner,
        definition,
        context: { definitionKey: "d", scopeKey: "s", access: true },
        epoch: 0,
      };
      const authority = createCriteriaAuthority({
        origin,
        readCurrent: () => ({
          controller: owner,
          definition,
          expected: origin.context,
          actual: origin.context,
          epoch: 0,
        }),
      });
      denied(() => authority.require());
    }
  });

  for (const name of ["getDefinition", "isDisposed"] as const) {
    test(`throwing ${name} payload is never inspected`, () => {
      const real = controller();
      const definition = real.getDefinition();
      let reads = 0;
      const payload = Object.defineProperty({}, "stack", {
        get() {
          reads++;
          throw new Error("No payload access");
        },
      });
      const owner = {
        ...real,
        [name]() {
          throw payload;
        },
      };
      const origin: CriteriaOrigin<S> = {
        controller: owner,
        definition,
        context: { definitionKey: "d", scopeKey: "s", access: true },
        epoch: 0,
      };
      const authority = createCriteriaAuthority({
        origin,
        readCurrent: () => ({
          controller: owner,
          definition,
          expected: origin.context,
          actual: origin.context,
          epoch: 0,
        }),
      });
      denied(() => authority.require());
      expect(reads).toBe(0);
    });
  }
});

// This assignment also checks that a real method-shaped options object retains S.
const staticFixture = fixture();
const typedOptions: CriteriaAuthorityOptions<S> = staticFixture.options;
void typedOptions;
