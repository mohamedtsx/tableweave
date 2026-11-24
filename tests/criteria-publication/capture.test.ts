import { expect, test } from "vitest";
import {
  CriteriaAuthorityError,
  createCriteriaAuthority,
} from "../../packages/react/src/controller/criteria.js";
import {
  createCriteriaPublication,
  getCriteriaPublicationBinding,
} from "../../packages/react/src/controller/criteria-publication.js";
import type { S } from "./helpers.js";
import {
  fixture,
  invalid,
  origin,
  pending,
  poison,
  settle,
  unsafe,
} from "./helpers.js";

test("construction, begin, issue and pure snapshot/binding never inspect opaque refs", () => {
  const opaque = poison();
  let calls = 0;
  const publication = createCriteriaPublication<S>(
    unsafe({
      controller: opaque.value,
      definition: opaque.value,
      retirement: {
        retire() {
          calls++;
        },
      },
    }),
  );
  const context = { definitionKey: "d", scopeKey: "s", access: true };
  const next = unsafe<Parameters<typeof publication.begin>[0]>({
    controller: opaque.value,
    definition: opaque.value,
    expected: context,
    actual: context,
  });
  const ticket = pending(publication.begin(next));
  const authority = publication.issue(origin(publication));
  expect(publication.getSnapshot().current).toBeNull();
  expect(getCriteriaPublicationBinding(authority)?.publication).toBe(
    publication,
  );
  expect(() => authority.require()).toThrow(CriteriaAuthorityError);
  expect([opaque.calls(), calls]).toEqual([0, 0]);
  publication.complete(ticket);
  expect([opaque.calls(), calls]).toEqual([0, 1]);
  expect(() => authority.require()).toThrow(CriteriaAuthorityError);
  expect(opaque.calls()).toBe(1); // Only the unchanged plain real-method check entered.
});

test("aliased expected/actual context captures each prototype/descriptor once", () => {
  const f = fixture();
  const seen = new Map<PropertyKey, number>();
  let prototypes = 0;
  let gets = 0;
  const context = new Proxy(f.next().expected, {
    getPrototypeOf(target) {
      prototypes++;
      return Reflect.getPrototypeOf(target);
    },
    getOwnPropertyDescriptor(target, key) {
      seen.set(key, (seen.get(key) ?? 0) + 1);
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
    get() {
      gets++;
      throw 0;
    },
  });
  const ticket = pending(
    f.publication.begin({ ...f.next(), expected: context, actual: context }),
  );
  expect([...seen]).toEqual([
    ["definitionKey", 1],
    ["scopeKey", 1],
    ["access", 1],
  ]);
  expect([prototypes, gets]).toEqual([1, 0]);
  f.publication.complete(ticket);
  expect(f.publication.issue(origin(f.publication)).require().epoch).toBe(1);
  expect(Object.isFrozen(context)).toBe(false);
});

test("issue passes captured envelopes to plain factory without rereading caller", () => {
  const f = fixture();
  settle(f);
  const seen = new Map<PropertyKey, number>();
  const input = new Proxy(origin(f.publication), {
    get() {
      throw 0;
    },
    getOwnPropertyDescriptor(target, key) {
      seen.set(key, (seen.get(key) ?? 0) + 1);
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
  });
  expect(f.publication.issue(input).require().epoch).toBe(1);
  expect([...seen]).toEqual([
    ["controller", 1],
    ["definition", 1],
    ["context", 1],
    ["epoch", 1],
  ]);
});

test("own-data accessors and inherited consumed values never invoke getters", () => {
  const f = fixture();
  let getters = 0;
  const payload = {
    ...f.next(),
    get expected() {
      getters++;
      return f.next().expected;
    },
  };
  expect(f.publication.begin(payload)).toMatchObject({
    reason: "invalid-input",
  });
  const input = {
    controller: f.owner,
    definition: f.definition,
    get retirement() {
      getters++;
      return f.retirement;
    },
  };
  invalid(() => createCriteriaPublication(input));
  invalid(() => createCriteriaPublication(Object.create(input)));
  expect(getters).toBe(0);
  expect(settle(f).authority.require().epoch).toBe(1);
});

test("supplied epoch presence rejects without getter; unrelated getters ignored", () => {
  const f = fixture();
  let reads = 0;
  expect(
    f.publication.begin({
      ...f.next(),
      get epoch() {
        reads++;
        throw 0;
      },
    }),
  ).toMatchObject({ reason: "invalid-input" });
  const receipt = pending(
    f.publication.begin({
      ...f.next(),
      get unrelated() {
        reads++;
        throw 0;
      },
    }),
  );
  expect(f.publication.complete(receipt).status).toBe("settled");
  expect(reads).toBe(0);
});

test.each(["", 0, null, false, [], () => {}])(
  "invalid primitive/envelope begin input (%j) remains unclaimed",
  (value) => {
    const f = fixture();
    expect(f.publication.begin(unsafe(value))).toMatchObject({
      reason: "invalid-input",
      ticket: null,
    });
    expect(f.calls()).toBe(0);
    expect(settle(f).authority.require().epoch).toBe(1);
  },
);

test.each(["definitionKey", "scopeKey", "access"] as const)(
  "invalid context %s primitive denies without claim",
  (key) => {
    const f = fixture();
    const next = f.next();
    const bad = {
      ...next,
      actual: { ...next.actual, [key]: key === "access" ? 1 : "" },
    };
    expect(f.publication.begin(unsafe(bad))).toMatchObject({
      reason: "invalid-input",
    });
    expect(settle(f).authority.require().epoch).toBe(1);
  },
);

test("null-prototype envelopes accepted, host objects/ports/functions never frozen", () => {
  const f = fixture();
  const port = Object.assign(Object.create(null), { retire() {} });
  const input = Object.assign(Object.create(null), {
    controller: f.owner,
    definition: f.definition,
    retirement: port,
  });
  const p = createCriteriaPublication<S>(input);
  const ticket = pending(p.begin(Object.assign(Object.create(null), f.next())));
  const a = p.issue(origin(p));
  p.complete(ticket);
  expect(a.require().epoch).toBe(1);
  expect(Object.isFrozen(input)).toBe(false);
  expect(Object.isFrozen(port)).toBe(false);
  expect(Object.isFrozen(port.retire)).toBe(false);
});

test("fixed opaque owner refs reject replacements, not equal serialized schemas", () => {
  const f = fixture();
  const other = fixture();
  expect(
    f.publication.begin({ ...f.next(), controller: other.owner }),
  ).toMatchObject({ reason: "invalid-input" });
  expect(
    f.publication.begin({ ...f.next(), definition: { ...f.definition } }),
  ).toMatchObject({ reason: "invalid-input" });
  expect(settle(f).authority.require().epoch).toBe(1);
});

test("actual getDefinition identity remains checked only by unchanged plain require", () => {
  const f = fixture();
  const copied = { ...f.definition };
  const p = createCriteriaPublication({
    controller: f.owner,
    definition: copied,
    retirement: f.retirement,
  });
  const ticket = pending(p.begin({ ...f.next(), definition: copied }));
  const a = p.issue(origin(p));
  p.complete(ticket);
  expect(() => a.require()).toThrow(CriteriaAuthorityError);
});

test("real controller disposal denies permission but does not auto-clean or notify", () => {
  const f = fixture();
  const grant = settle(f);
  let calls = 0;
  f.publication.registerParticipant(grant.authority, {
    purge() {
      calls++;
    },
  });
  const before = f.publication.getSnapshot();
  f.owner.dispose();
  expect(() => grant.authority.require()).toThrow(CriteriaAuthorityError);
  expect(f.publication.getSnapshot()).toBe(before);
  expect(calls).toBe(0);
  expect(f.publication.dispose().status).toBe("disposed");
  expect(calls).toBe(1);
});

test("publisher disposal does not dispose the real controller", () => {
  const f = fixture();
  settle(f);
  f.publication.dispose();
  expect(f.owner.isDisposed()).toBe(false);
});

test("callbacks/receivers are captured once, mutable replacement properties ignored", () => {
  const f = fixture();
  let retire = 0;
  let purges = 0;
  let cleanups = 0;
  let notifications = 0;
  const retirement = {
    retire(): undefined {
      expect(this).toBe(retirement);
      retire++;
    },
  };
  const p = createCriteriaPublication({
    controller: f.owner,
    definition: f.definition,
    retirement,
  });
  retirement.retire = () => {
    throw 0;
  };
  const receipt = pending(p.begin(f.next()));
  p.complete(receipt);
  const port = {
    purge(): undefined {
      expect(this).toBe(port);
      purges++;
    },
    cleanup(): undefined {
      expect(this).toBe(port);
      cleanups++;
    },
  };
  p.registerParticipant(p.issue(origin(p)), port);
  port.purge = () => {
    throw 0;
  };
  port.cleanup = () => {
    throw 0;
  };
  const observer = {
    notify(): undefined {
      expect(this).toBe(observer);
      notifications++;
    },
  };
  p.subscribe(observer);
  observer.notify = () => {
    throw 0;
  };
  const next = pending(p.begin(f.next()));
  p.complete(next);
  expect([retire, purges, cleanups, notifications]).toEqual([2, 1, 1, 2]);
});

test.each([
  {},
  { cleanup: undefined },
  { cleanup: false },
  {
    get cleanup() {
      throw 0;
    },
  },
])("invalid participant port denies, no new cleanup", (extra) => {
  const f = fixture();
  const first = settle(f);
  let calls = 0;
  const port = Object.assign({}, Object.getOwnPropertyDescriptors(extra));
  // Preserve accessor descriptors for the accessor negative rather than reading it.
  const input = Object.defineProperties(
    {
      purge() {
        calls++;
      },
    },
    Object.getOwnPropertyDescriptors(extra),
  );
  if (Object.keys(port).length === 0) Reflect.deleteProperty(input, "purge");
  invalid(() =>
    f.publication.registerParticipant(first.authority, unsafe(input)),
  );
  expect(calls).toBe(0);
});

test("standalone genuine plain authority is unbound, no structural fallback", () => {
  const f = fixture();
  settle(f);
  let reads = 0;
  const a = createCriteriaAuthority({
    origin: origin(f.publication),
    readCurrent() {
      reads++;
      throw 0;
    },
  });
  const port = poison();
  expect(getCriteriaPublicationBinding(a)).toBeNull();
  invalid(() => f.publication.registerParticipant(a, unsafe(port.value)));
  expect([reads, port.calls()]).toEqual([0, 0]);
});

test("pending and stale authorities deny participant admission before port reflection", () => {
  const f = fixture();
  const receipt = pending(f.publication.begin(f.next()));
  const a = f.publication.issue(origin(f.publication));
  const port = poison();
  invalid(() => f.publication.registerParticipant(a, unsafe(port.value)));
  f.publication.complete(receipt);
  f.publication.begin(f.next());
  invalid(() => f.publication.registerParticipant(a, unsafe(port.value)));
  expect(port.calls()).toBe(0);
});

test("origin mismatch and reentrant origin capture cannot issue a stale capability", () => {
  const f = fixture();
  settle(f);
  const base = origin(f.publication);
  for (const input of [
    { ...base, epoch: NaN },
    { ...base, epoch: "1" },
    { ...base, context: { ...base.context, scopeKey: "other" } },
  ])
    invalid(() => f.publication.issue(input));
  const input = new Proxy(base, {
    getOwnPropertyDescriptor(target, key) {
      f.publication.begin(f.next());
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
  });
  invalid(() => f.publication.issue(input));
  expect(f.publication.getSnapshot().current).toBeNull();
});

test("throwing/false observers count safely without reading returned objects", () => {
  const f = fixture();
  const payload = poison();
  f.publication.subscribe(
    unsafe({
      notify() {
        return payload.value;
      },
    }),
  );
  f.publication.subscribe(
    unsafe({
      notify() {
        return false;
      },
    }),
  );
  f.publication.subscribe({
    notify() {
      throw payload.value;
    },
  });
  const result = f.publication.begin(f.next());
  expect(result).toMatchObject({ status: "pending", notificationFailures: 3 });
  expect(payload.calls()).toBe(0);
  expect(Object.hasOwn(result, "cause")).toBe(false);
});

test("new subscribe/participant registration during protected notification is rejected", () => {
  const f = fixture();
  const first = settle(f);
  let calls = 0;
  f.publication.subscribe({
    notify() {
      invalid(() =>
        f.publication.subscribe({
          notify() {
            calls++;
          },
        }),
      );
      invalid(() =>
        f.publication.registerParticipant(first.authority, {
          purge() {
            calls++;
          },
        }),
      );
    },
  });
  f.publication.begin(f.next());
  expect(calls).toBe(0);
});

test("settlement observer revocation returns stale with actual blocked final snapshot", () => {
  const f = fixture();
  const receipt = pending(f.publication.begin(f.next()));
  const a = f.publication.issue(origin(f.publication));
  f.publication.subscribe({
    notify() {
      if (f.publication.getSnapshot().phase === "settled")
        f.publication.begin(f.next());
    },
  });
  expect(f.publication.complete(receipt)).toMatchObject({
    status: "stale",
    snapshot: { phase: "blocked", current: null, failure: "reentrant" },
  });
  expect(() => a.require()).toThrow(CriteriaAuthorityError);
});
