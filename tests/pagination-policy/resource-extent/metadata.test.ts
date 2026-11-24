import { expect, test } from "vitest";
import type { QueryExecutionExtent } from "../../../packages/react/src/contracts/execution.js";
import { createResourceAdapter } from "../../../packages/react/src/resource/adapter.js";
import type { ResourceRequestInput } from "../../../packages/react/src/resource/types.js";
import { context, fixture, input, requireToken, success } from "./fixtures.js";

function invalid(action: () => unknown) {
  let caught = false;
  try {
    action();
  } catch (error) {
    caught = true;
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Invalid Tableweave resource input.");
    expect(Object.hasOwn(error as object, "cause")).toBe(false);
  }
  expect(caught).toBe(true);
}
const complete = { kind: "complete" } as const;
const badMetadata: unknown[] = [
  { evaluatedAt: 0 },
  { extent: complete },
  { extent: undefined, evaluatedAt: 0 },
  { extent: complete, evaluatedAt: undefined },
  { extent: null, evaluatedAt: 0 },
  { extent: { kind: "page", pageIndex: 1, pageSize: 25 }, evaluatedAt: 0 },
  { extent: { kind: "page", pageIndex: 0, pageSize: 10 }, evaluatedAt: 0 },
  {
    extent: { kind: "page", pageIndex: 0, pageSize: 25, extra: true },
    evaluatedAt: 0,
  },
  { extent: { kind: "complete", offset: 0 }, evaluatedAt: 0 },
  { extent: { kind: "complete", [Symbol("extra")]: true }, evaluatedAt: 0 },
  {
    extent: Object.defineProperty({ kind: "complete" }, "hidden", {
      value: true,
    }),
    evaluatedAt: 0,
  },
  { extent: Object.create({ kind: "complete" }), evaluatedAt: 0 },
  ...[NaN, Infinity, -Infinity, 8.64e15 + 1, -8.64e15 - 1, "0", null].map(
    (evaluatedAt) => ({ extent: complete, evaluatedAt }),
  ),
];
for (const [index, patch] of badMetadata.entries())
  test(`invalid raw metadata${index} preserves current generation, retry and snapshot`, () => {
    const f = fixture();
    let retried: unknown;
    const prior = requireToken(
      f.adapter.begin(
        input("prior", 0, {
          extent: complete,
          evaluatedAt: 0,
          retry(next) {
            retried = next;
          },
        }),
      ),
    );
    const before = f.adapter.getSnapshot(),
      notifications = f.notifications();
    invalid(() => f.adapter.begin({ ...input("bad"), ...(patch as object) }));
    expect(f.adapter.getSnapshot()).toBe(before);
    expect(f.notifications()).toBe(notifications);
    expect(f.adapter.fail(prior, "timeout")).toBe(true);
    const next = requireToken(f.adapter.retry());
    expect(next).toBe(retried);
    expect(next.generation).toBe(prior.generation + 1);
    expect(next.extent).toEqual(complete);
    expect(next.evaluatedAt).toBe(0);
    expect(f.adapter.succeed(next, success(0))).toBe(true);
  });
for (const now of [0, -1, 0.5, 8.64e15, -8.64e15])
  for (const extent of [
    complete,
    { kind: "page", pageIndex: 0, pageSize: 25 },
  ] as const)
    test(`explicit Date-valid${now}/${extent.kind} metadata stays exact`, () => {
      const f = fixture(),
        raw = input("exact", 0, { extent, evaluatedAt: now }),
        token = requireToken(f.adapter.begin(raw));
      expect(token.extent).toEqual(extent);
      expect(token.extent).not.toBe(extent);
      expect(Object.isFrozen(token.extent)).toBe(true);
      expect(Object.isFrozen(extent)).toBe(false);
      expect(Object.isFrozen(raw)).toBe(false);
      expect(token.evaluatedAt).toBe(now);
      expect(f.adapter.succeed(token, success(0))).toBe(true);
      expect(f.adapter.getSnapshot().snapshot?.extent).toBe(token.extent);
      expect(f.adapter.getSnapshot().snapshot?.evaluatedAt).toBe(now);
      expect(f.adapter.getSnapshot().canNavigate).toBe(
        extent.kind !== "complete",
      );
    });
for (const field of [
  "definitionKey",
  "scopeKey",
  "queryKey",
  "requestKey",
  "query",
  "retry",
  "extent",
  "evaluatedAt",
])
  test(`consumed request ${field} accessor is never invoked`, () => {
    const f = fixture();
    let reads = 0;
    const raw = Object.defineProperty(
      input("getter", 0, { extent: complete, evaluatedAt: 0 }),
      field,
      {
        enumerable: true,
        get() {
          reads++;
          throw new Error("synthetic private getter");
        },
      },
    );
    const before = f.adapter.getSnapshot();
    invalid(() => f.adapter.begin(raw));
    expect(reads).toBe(0);
    expect(f.adapter.getSnapshot()).toBe(before);
    expect(f.notifications()).toBe(0);
  });
for (const field of ["kind", "pageIndex", "pageSize"])
  test(`extent ${field} accessor cannot substitute validated data`, () => {
    const f = fixture();
    let reads = 0;
    const extent = Object.defineProperty(
      { kind: "page", pageIndex: 0, pageSize: 25 },
      field,
      {
        enumerable: true,
        get() {
          reads++;
          return field === "kind" ? "page" : 25;
        },
      },
    );
    invalid(() =>
      f.adapter.begin(
        input("extent-getter", 0, {
          extent: extent as QueryExecutionExtent,
          evaluatedAt: 0,
        }),
      ),
    );
    expect(reads).toBe(0);
  });
for (const field of ["extent", "evaluatedAt"] as const)
  test(`hidden new root ${field} is rejected without touching outstanding work`, () => {
    const f = fixture(),
      token = requireToken(f.adapter.begin(input("prior"))),
      before = f.adapter.getSnapshot();
    const raw = Object.defineProperty(
      input("hidden", 0, { extent: complete, evaluatedAt: 0 }),
      field,
      { enumerable: false },
    );
    invalid(() => f.adapter.begin(raw));
    expect(f.adapter.getSnapshot()).toBe(before);
    expect(f.adapter.succeed(token, success(1))).toBe(true);
  });
test("request descriptors are captured once, ordinary gets/unused extras are untouched, stored values are those validated", () => {
  const f = fixture(),
    reads: Record<string, number> = {};
  let gets = 0,
    unrelated = 0;
  const raw = input("captured", 0, {
    extent: { kind: "page", pageIndex: 0, pageSize: 25 },
    evaluatedAt: 0,
  });
  Object.defineProperty(raw, "unused", {
    get() {
      unrelated++;
      throw 0;
    },
  });
  const capture = new Proxy(raw, {
    get() {
      gets++;
      throw 0;
    },
    getOwnPropertyDescriptor(target, key) {
      const name = String(key);
      reads[name] = (reads[name] ?? 0) + 1;
      const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
      if (key === "queryKey" && descriptor)
        return {
          ...descriptor,
          value: reads[name] === 1 ? "captured" : "poison",
        };
      return descriptor;
    },
  });
  const token = requireToken(f.adapter.begin(capture));
  expect(token.queryKey).toBe("captured");
  expect(gets).toBe(0);
  expect(unrelated).toBe(0);
  expect(Object.values(reads).every((count) => count === 1)).toBe(true);
  expect(Object.keys(reads).sort()).toEqual(
    [
      "definitionKey",
      "scopeKey",
      "queryKey",
      "requestKey",
      "retry",
      "query",
      "extent",
      "evaluatedAt",
    ].sort(),
  );
});
test("query JSON copy/version/page checks still happen without a schema or registry decision", () => {
  for (const patch of [
    { version: 2 },
    { pagination: { pageIndex: -1, pageSize: 25 } },
    { pagination: { pageIndex: 0, pageSize: 0 } },
  ]) {
    const f = fixture();
    invalid(() =>
      f.adapter.begin({
        ...input(),
        query: { ...input().query, ...patch },
      } as ResourceRequestInput),
    );
    expect(f.notifications()).toBe(0);
  }
  const f = fixture(),
    raw = input("complete-at-generic-index", 7, {
      extent: complete,
      evaluatedAt: 0,
    });
  const token = requireToken(f.adapter.begin(raw));
  expect(token.query.pagination.pageIndex).toBe(7);
  expect(token.query).not.toBe(raw.query);
  expect(Object.isFrozen(token.query.pagination)).toBe(true);
  expect(Object.isFrozen(raw.query)).toBe(false);
});
test("legacy retry explicit undefined and unrelated envelope fields retain their old meaning", () => {
  const f = fixture();
  const raw = {
    ...input(),
    retry: undefined,
    generation: 999,
    unrelated: true,
  };
  const token = requireToken(Reflect.apply(f.adapter.begin, undefined, [raw]));
  expect(token.generation).toBe(1);
  expect(Reflect.ownKeys(token)).toEqual([
    "definitionKey",
    "scopeKey",
    "queryKey",
    "requestKey",
    "generation",
    "query",
  ]);
  expect(Object.hasOwn(token, "extent")).toBe(false);
  expect(Object.hasOwn(token, "evaluatedAt")).toBe(false);
  expect(f.adapter.fail(token, "timeout")).toBe(true);
  expect(f.adapter.retry()).toBeNull();
});
test("mutating lock blocks lifecycle reentry during successful and throwing request reflection", () => {
  for (const throwing of [false, true]) {
    const f = fixture(),
      before = f.adapter.getSnapshot();
    let traps = 0;
    const raw = new Proxy(
      input("reflect", 0, { extent: complete, evaluatedAt: 0 }),
      {
        getOwnPropertyDescriptor(target, key) {
          if (key === "query") {
            traps++;
            expect(f.adapter.begin(input("nested"))).toBeNull();
            f.adapter.setContext({ ...context, scopeKey: "different" });
            f.adapter.dispose();
            expect(f.adapter.getSnapshot()).toBe(before);
            if (throwing) throw new Error("synthetic reflection");
          }
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      },
    );
    if (throwing) {
      invalid(() => f.adapter.begin(raw));
      expect(f.adapter.getSnapshot()).toBe(before);
      expect(requireToken(f.adapter.begin(input())).generation).toBe(1);
    } else {
      const token = requireToken(f.adapter.begin(raw));
      expect(token.scopeKey).toBe(context.scopeKey);
      expect(token.generation).toBe(1);
    }
    expect(traps).toBe(1);
  }
});
test("context/global refusals happen before irrelevant metadata capture", () => {
  for (const state of [
    "denied",
    "inactive",
    "disposed",
    "mismatch",
    "missing",
  ] as const) {
    const f = fixture();
    if (state === "denied") f.adapter.setContext({ ...context, access: false });
    if (state === "inactive") f.adapter.connect()();
    if (state === "disposed") f.adapter.dispose();
    let metadataReads = 0;
    const raw = Object.defineProperty(
      state === "mismatch"
        ? { ...input(), definitionKey: "wrong" }
        : state === "missing"
          ? {}
          : input(),
      "extent",
      {
        get() {
          metadataReads++;
          throw 0;
        },
      },
    );
    expect(f.adapter.begin(raw as ResourceRequestInput)).toBeNull();
    expect(metadataReads).toBe(0);
  }
  const adapter = createResourceAdapter(context, {
    onInvalidate() {
      throw new Error("synthetic invalidation");
    },
  });
  adapter.clear();
  let reads = 0;
  const raw = Object.defineProperty(input(), "extent", {
    get() {
      reads++;
      throw 0;
    },
  });
  expect(adapter.getSnapshot().invalidationFailed).toBe(true);
  expect(adapter.begin(raw)).toBeNull();
  expect(reads).toBe(0);
});
