import { describe, expect, test } from "vitest";
import { createQuery } from "../../packages/react/src/contracts/query.js";
import { defineQuerySchema } from "../../packages/react/src/contracts/schema.js";
import {
  CriteriaAuthorityError,
  type CriteriaCurrent,
  type CriteriaOrigin,
  createCriteriaAuthority,
  getCriteriaAuthorityOrigin,
  requireCriteriaAuthority,
} from "../../packages/react/src/controller/criteria.js";
import {
  createCriteriaPublication,
  getCriteriaPublicationBinding,
} from "../../packages/react/src/controller/criteria-publication.js";
import { createTableController } from "../../packages/react/src/controller/store.js";

const schema = defineQuerySchema({
  id: "publication-metadata",
  version: 1,
  fields: { name: { type: "text", owner: "search" } },
});
type S = typeof schema;

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

/** Real C/P, with no private records, selected IDs or detail buffers to retire. */
function publication() {
  const C = controller(),
    definition = C.getDefinition();
  const retirements: string[] = [];
  const retirement = {
    retire(event: { readonly kind: string }): undefined {
      expect(this).toBe(retirement);
      retirements.push(event.kind);
      return undefined;
    },
  };
  const P = createCriteriaPublication({
    controller: C,
    definition,
    retirement,
  });
  const begin = (scopeKey = "scope-a", access = true) => {
    const context = { definitionKey: "table-a", scopeKey, access };
    const result = P.begin({
      controller: C,
      definition,
      expected: context,
      actual: context,
    });
    if (result.status !== "pending") throw new Error("Expected real pending P");
    return result.ticket;
  };
  const issue = () => {
    const snapshot = P.getSnapshot();
    const current = snapshot.current ?? snapshot.pending;
    if (!current) throw new Error("Expected captured publication metadata");
    return P.issue({
      controller: C,
      definition,
      context: current.expected,
      epoch: current.epoch,
    });
  };
  const ticket = begin();
  const authority = issue();
  expect(P.complete(ticket).status).toBe("settled");
  const origin = getCriteriaAuthorityOrigin(authority);
  if (!origin) throw new Error("Expected registered origin");
  return { C, P, authority, origin, begin, issue, retirements };
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

describe("exact immutable publication metadata is not cached permission", () => {
  test("both public require paths repeatedly accept the same real current/origin", () => {
    const f = publication();
    const before = f.P.getSnapshot();
    if (before.phase !== "settled") throw new Error("Expected settled P");
    expect(Object.isFrozen(before.current)).toBe(true);
    expect(Object.isFrozen(before.current.expected)).toBe(true);
    expect(Object.isFrozen(before.current.actual)).toBe(true);
    expect(getCriteriaPublicationBinding(f.authority)?.origin).toBe(f.origin);
    for (let i = 0; i < 3; i++) {
      expect(f.authority.require()).toBe(f.origin);
      expect(requireCriteriaAuthority(f.authority, f.origin)).toBe(f.origin);
    }
    expect(f.P.getSnapshot()).toBe(before);
    expect(f.retirements).toEqual(["transition"]);
  });

  test.each(["cancel", "complete", "revoke", "dispose"] as const)(
    "%s cannot restore the saved authority through immutable metadata",
    (operation) => {
      const f = publication();
      expect(f.authority.require()).toBe(f.origin);
      if (operation === "dispose") {
        expect(f.P.dispose().status).toBe("disposed");
      } else {
        const scopeKey = operation === "complete" ? "scope-a" : "scope-b";
        const ticket = f.begin(scopeKey, operation !== "revoke");
        denied(() => f.authority.require());
        denied(() => requireCriteriaAuthority(f.authority, f.origin));
        if (operation === "cancel") {
          expect(f.P.cancel(ticket).status).toBe("cancelled");
        } else {
          expect(f.P.complete(ticket).status).toBe("settled");
          const next = f.issue();
          if (operation === "revoke") denied(() => next.require());
          else {
            const origin = next.require();
            expect(origin.context.scopeKey).toBe(scopeKey);
            expect(origin.epoch).not.toBe(f.origin.epoch);
          }
        }
      }
      denied(() => f.authority.require());
      denied(() => requireCriteriaAuthority(f.authority, f.origin));
    },
  );

  test("settled genuine metadata does not bypass real controller disposal", () => {
    const f = publication();
    const before = f.P.getSnapshot();
    f.C.dispose();
    expect(f.P.getSnapshot()).toBe(before);
    denied(() => f.authority.require());
    denied(() => requireCriteriaAuthority(f.authority, f.origin));
  });

  test("copied and proxied origins are parsed, never trusted by frozen shape", () => {
    const f = publication();
    const copy = Object.freeze({ ...f.origin });
    expect(requireCriteriaAuthority(f.authority, copy)).toBe(f.origin);
    const descriptors: PropertyKey[] = [];
    const proxy = new Proxy(f.origin, {
      getOwnPropertyDescriptor(target, key) {
        descriptors.push(key);
        return Reflect.getOwnPropertyDescriptor(target, key);
      },
      get() {
        throw new Error("Origin capture must not invoke property getters");
      },
    });
    expect(requireCriteriaAuthority(f.authority, proxy)).toBe(f.origin);
    expect(descriptors).toEqual([
      "controller",
      "definition",
      "context",
      "epoch",
    ]);
    const poison = new Proxy(copy, {
      getOwnPropertyDescriptor() {
        throw new Error("Untrusted frozen target");
      },
    });
    denied(() => requireCriteriaAuthority(f.authority, poison));
  });
});

describe("raw protocol inputs retain descriptor and callback semantics", () => {
  test("an unbound raw reader still captures exact P current and hostile wrappers normally", () => {
    const f = publication();
    const snapshot = f.P.getSnapshot();
    if (snapshot.phase !== "settled") throw new Error("Expected settled P");
    let current: CriteriaCurrent<S> = snapshot.current;
    let reads = 0;
    const options = {
      origin: f.origin,
      readCurrent() {
        expect(this).toBe(options);
        reads++;
        return current;
      },
    };
    const raw = createCriteriaAuthority(options);
    expect(getCriteriaPublicationBinding(raw)).toBeNull();
    expect(raw.require().controller).toBe(f.C);
    expect(current).toBe(snapshot.current);
    const descriptors: PropertyKey[] = [];
    current = new Proxy(snapshot.current, {
      getOwnPropertyDescriptor(target, key) {
        descriptors.push(key);
        return Reflect.getOwnPropertyDescriptor(target, key);
      },
      get() {
        throw new Error("No dynamic current property reads");
      },
    });
    raw.require();
    expect(descriptors).toEqual([
      "controller",
      "definition",
      "expected",
      "actual",
      "epoch",
    ]);
    current = new Proxy(snapshot.current, {
      getOwnPropertyDescriptor() {
        throw new Error("Frozen factory copy is not a bound authority");
      },
    });
    denied(() => raw.require());
    current = Object.freeze({ ...snapshot.current, epoch: -1 });
    denied(() => raw.require());
    expect(reads).toBe(4);
  });

  test("the same mutable raw current is re-read, and consumed accessors stay rejected", () => {
    const f = publication();
    const actual = { ...f.origin.context };
    const current = {
      controller: f.C,
      definition: f.origin.definition,
      expected: { ...f.origin.context },
      actual,
      epoch: f.origin.epoch,
    };
    let returned: CriteriaCurrent<S> = current;
    let reads = 0,
      getters = 0;
    const raw = createCriteriaAuthority({
      origin: f.origin,
      readCurrent() {
        reads++;
        return returned;
      },
    });
    raw.require();
    actual.access = false;
    denied(() => raw.require());
    actual.access = true;
    current.epoch = -1;
    denied(() => raw.require());
    current.epoch = f.origin.epoch;
    returned = Object.defineProperty({ ...current }, "actual", {
      get() {
        getters++;
        return actual;
      },
    });
    denied(() => raw.require());
    expect(getters).toBe(0);
    expect(reads).toBe(4);
  });

  test("synthetic raw protocol delegates preserve one reader and ordered controller calls", () => {
    // Protocol instrumentation only; never used as a genuine P/native grant.
    const real = controller(),
      definition = real.getDefinition();
    const calls: string[] = [];
    const methods = {
      ...real,
      isDisposed() {
        expect(this).toBe(owner);
        calls.push("isDisposed");
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
    });
    const context = { definitionKey: "raw", scopeKey: "scope", access: true };
    const origin: CriteriaOrigin<S> = {
      controller: owner,
      definition,
      context,
      epoch: 1,
    };
    let fail = false;
    const options = {
      origin,
      readCurrent() {
        expect(this).toBe(options);
        calls.push("readCurrent");
        if (fail) throw new Error("Private reader failure");
        return {
          controller: owner,
          definition,
          expected: context,
          actual: context,
          epoch: 1,
        };
      },
    };
    const raw = createCriteriaAuthority(options);
    const captured = getCriteriaAuthorityOrigin(raw);
    if (!captured) throw new Error("Expected registered raw origin");
    raw.require();
    requireCriteriaAuthority(raw, captured);
    expect(calls).toEqual([
      "readCurrent",
      "capture:isDisposed",
      "isDisposed",
      "capture:getDefinition",
      "getDefinition",
      "readCurrent",
      "capture:isDisposed",
      "isDisposed",
      "capture:getDefinition",
      "getDefinition",
    ]);
    calls.length = 0;
    fail = true;
    denied(() => raw.require());
    expect(calls).toEqual(["readCurrent"]);
  });
});
