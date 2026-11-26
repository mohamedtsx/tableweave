import { expect, test } from "vitest";
import { createResourceAdapter } from "../../../packages/react/src/resource/adapter.js";
import type { ResourceSuccess } from "../../../packages/react/src/resource/types.js";
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
for (const count of [0, 137, 311])
  test(`complete known dense success${count} keeps metadata and copies only containers`, () => {
    const f = fixture(),
      token = requireToken(
        f.adapter.begin(
          input("complete", 4, { extent: complete, evaluatedAt: 0.5 }),
        ),
      ),
      result = success(count),
      original = result.records;
    expect(f.adapter.succeed(token, result)).toBe(true);
    const view = f.adapter.getSnapshot(),
      snapshot = view.snapshot;
    expect(snapshot?.extent).toBe(token.extent);
    expect(snapshot?.evaluatedAt).toBe(0.5);
    expect(snapshot?.records).not.toBe(original);
    expect(snapshot?.records).toHaveLength(count);
    expect(Object.isFrozen(snapshot?.records)).toBe(true);
    expect(Object.isFrozen(original)).toBe(false);
    expect(
      snapshot?.records.every(
        (row, i) => row === original[i] && !Object.isFrozen(row),
      ),
    ).toBe(true);
    expect(view.canSelect).toBe(true);
    expect(view.canReorder).toBe(true);
    expect(view.canNavigate).toBe(false);
    expect(view.display).toBe(count ? "records" : "empty");
    expect(snapshot?.query.pagination.pageIndex).toBe(4);
  });
for (const kind of [
  "unknown",
  "mismatch",
  "sparse",
  "accessor-index",
  "error",
] as const)
  test(`invalid complete ${kind} cannot close or mutate current token`, () => {
    const f = fixture(),
      token = requireToken(
        f.adapter.begin(
          input("bad-result", 0, { extent: complete, evaluatedAt: 0 }),
        ),
      ),
      old = f.adapter.getSnapshot();
    const notices = f.notifications();
    let reads = 0;
    const result: Record<string, unknown> = { ...success(137) };
    if (kind === "unknown")
      result.page = { kind: "unknown", hasNextPage: false };
    if (kind === "mismatch") result.page = { kind: "known", total: 136 };
    if (kind === "sparse") result.records = new Array(137);
    if (kind === "accessor-index") {
      const records = [...success(137).records];
      Object.defineProperty(records, "0", {
        get() {
          reads++;
          throw 0;
        },
      });
      result.records = records;
    }
    if (kind === "error") result.source = "error";
    invalid(() =>
      f.adapter.succeed(
        token,
        result as unknown as ResourceSuccess<{ id: string }>,
      ),
    );
    expect(reads).toBe(0);
    expect(f.adapter.getSnapshot()).toBe(old);
    expect(f.notifications()).toBe(notices);
    expect(f.adapter.succeed(token, success(137))).toBe(true);
  });
for (const origin of ["legacy", "page", "complete"] as const)
  for (const key of ["extent", "evaluatedAt"] as const)
    test(`no ${key} override can promote/relabel ${origin} token`, () => {
      const f = fixture(),
        token = requireToken(
          f.adapter.begin(
            input(
              "origin",
              0,
              origin === "legacy"
                ? {}
                : {
                    extent:
                      origin === "complete"
                        ? complete
                        : { kind: "page", pageIndex: 0, pageSize: 25 },
                    evaluatedAt: 0,
                  },
            ),
          ),
        );
      const before = f.adapter.getSnapshot();
      let reads = 0;
      const result = Object.defineProperty({ ...success(137) }, key, {
        get() {
          reads++;
          return key === "extent" ? complete : 0;
        },
      });
      invalid(() => f.adapter.succeed(token, result));
      expect(reads).toBe(0);
      expect(f.adapter.getSnapshot()).toBe(before);
      invalid(() =>
        Reflect.apply(f.adapter.succeed, undefined, [
          token,
          {
            ...success(137),
            [key]: key === "extent" ? token.extent : token.evaluatedAt,
          },
        ]),
      );
      expect(f.adapter.getSnapshot()).toBe(before);
      expect(f.adapter.succeed(token, success(137))).toBe(true);
      expect(f.adapter.getSnapshot().canNavigate).toBe(origin !== "complete");
    });
for (const field of [
  "source",
  "records",
  "page",
  "emptyKind",
  "receivedAt",
] as const)
  test(`consumed result ${field} getter never executes`, () => {
    const f = fixture(),
      token = requireToken(
        f.adapter.begin(
          input("getter", 0, { extent: complete, evaluatedAt: 0 }),
        ),
      );
    let reads = 0;
    const result = Object.defineProperty({ ...success(1) }, field, {
      get() {
        reads++;
        throw new Error("synthetic private getter");
      },
    });
    invalid(() => f.adapter.succeed(token, result));
    expect(reads).toBe(0);
    expect(f.adapter.succeed(token, success(1))).toBe(true);
  });
for (const field of ["kind", "total", "hasNextPage"] as const)
  test(`consumed page ${field} getter cannot change validated metadata`, () => {
    const f = fixture(),
      token = requireToken(f.adapter.begin(input()));
    let reads = 0;
    const page = Object.defineProperty(
      field === "hasNextPage"
        ? { kind: "unknown", hasNextPage: false }
        : { kind: "known", total: 1 },
      field,
      {
        get() {
          reads++;
          return field === "kind" ? "known" : 1;
        },
      },
    );
    invalid(() =>
      f.adapter.succeed(token, { ...success(1), page } as ResourceSuccess<{
        id: string;
      }>),
    );
    expect(reads).toBe(0);
  });
test("success captures root/page/length/index descriptors once and ignores custom iterator/business getters", () => {
  class Host {
    get privateValue(): never {
      throw new Error("Business properties are not library-owned");
    }
  }
  const adapter = createResourceAdapter<Host>(context),
    token = requireToken(
      adapter.begin(input("host", 0, { extent: complete, evaluatedAt: 0 })),
    ),
    host = new Host(),
    other = new Host();
  let ordinaryGets = 0,
    iteratorReads = 0;
  const reads = new Map<object, Map<PropertyKey, number>>();
  const wrap = <T extends object>(target: T): T =>
    new Proxy(target, {
      get() {
        ordinaryGets++;
        throw 0;
      },
      getOwnPropertyDescriptor(object, key) {
        let counts = reads.get(object);
        if (!counts) {
          counts = new Map();
          reads.set(object, counts);
        }
        const count = (counts.get(key) ?? 0) + 1;
        counts.set(key, count);
        expect(count).toBe(1);
        const descriptor = Reflect.getOwnPropertyDescriptor(object, key);
        if (Array.isArray(object) && key === "0") {
          object[0] = other;
          object.push(other);
        }
        return descriptor;
      },
    });
  const raw = [host];
  Object.defineProperty(raw, Symbol.iterator, {
    get() {
      iteratorReads++;
      throw 0;
    },
  });
  const array = wrap(raw),
    page = wrap({ kind: "known" as const, total: 1 }),
    result = wrap({
      source: "fresh" as const,
      records: array,
      page,
      emptyKind: "unknown" as const,
      receivedAt: "2026-11-24T00:00:00Z",
    });
  expect(adapter.succeed(token, result)).toBe(true);
  const snapshot = adapter.getSnapshot().snapshot;
  expect(snapshot?.records).toHaveLength(1);
  expect(snapshot?.records[0]).toBe(host);
  expect(snapshot?.page).toEqual({ kind: "known", total: 1 });
  expect(raw).toHaveLength(2);
  expect(ordinaryGets).toBe(0);
  expect(iteratorReads).toBe(0);
  expect(Object.isFrozen(host)).toBe(false);
  expect(Object.isFrozen(raw)).toBe(false);
});
test("stale/copied/cross-adapter/placeholder refusals precede poison results and leave the current slot usable", () => {
  const f = fixture(),
    other = fixture(),
    a = requireToken(
      f.adapter.begin(input("a", 0, { extent: complete, evaluatedAt: 0 })),
    ),
    foreign = requireToken(
      other.adapter.begin(input("a", 0, { extent: complete, evaluatedAt: 0 })),
    ),
    b = requireToken(
      f.adapter.begin(input("b", 0, { extent: complete, evaluatedAt: 0 })),
    );
  let reads = 0;
  const poison = new Proxy(
    {},
    {
      get() {
        reads++;
        throw 0;
      },
      getOwnPropertyDescriptor() {
        reads++;
        throw 0;
      },
    },
  );
  for (const token of [a, { ...b }, foreign])
    expect(
      f.adapter.succeed(token, poison as ResourceSuccess<{ id: string }>),
    ).toBe(false);
  expect(reads).toBe(0);
  const placeholder = Object.defineProperty(
    { source: "placeholder" },
    "records",
    {
      get() {
        reads++;
        throw 0;
      },
    },
  );
  expect(
    f.adapter.succeed(b, placeholder as ResourceSuccess<{ id: string }>),
  ).toBe(false);
  expect(reads).toBe(0);
  expect(f.adapter.succeed(b, success(0))).toBe(true);
  expect(f.adapter.succeed(b, poison as ResourceSuccess<{ id: string }>)).toBe(
    false,
  );
  expect(reads).toBe(0);
});
test("legacy/page count coincidences cannot imply complete, and no new result cap is imposed", () => {
  for (const extent of [
    undefined,
    { kind: "page", pageIndex: 0, pageSize: 25 } as const,
  ]) {
    const f = fixture(),
      token = requireToken(
        f.adapter.begin(
          input("page", 0, extent ? { extent, evaluatedAt: 0 } : {}),
        ),
      );
    expect(f.adapter.succeed(token, success(137, 0))).toBe(true);
    const view = f.adapter.getSnapshot();
    expect(view.canNavigate).toBe(true);
    expect(view.snapshot?.records).toHaveLength(137);
    expect(view.snapshot?.extent?.kind).not.toBe("complete");
  }
});
test("legacy sparse arrays retain holes-as-undefined without a new complete-density obligation", () => {
  const adapter = createResourceAdapter<unknown>(context),
    token = requireToken(adapter.begin(input()));
  expect(
    adapter.succeed(token, {
      ...success(0),
      records: new Array(2),
      page: { kind: "known", total: 20 },
    }),
  ).toBe(true);
  expect(adapter.getSnapshot().snapshot?.records).toEqual([
    undefined,
    undefined,
  ]);
});
test("success descriptor reentry/throw remains atomic and the exact original request can still settle", () => {
  const f = fixture(),
    token = requireToken(
      f.adapter.begin(
        input("reentry", 0, { extent: complete, evaluatedAt: 0 }),
      ),
    ),
    before = f.adapter.getSnapshot();
  const result = new Proxy(success(1), {
    getOwnPropertyDescriptor(target, key) {
      if (key === "records") {
        expect(f.adapter.succeed(token, success(0))).toBe(false);
        expect(f.adapter.fail(token, "access-lost")).toBe(false);
        f.adapter.clear();
        f.adapter.dispose();
        throw new Error("synthetic trap");
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
  });
  invalid(() => f.adapter.succeed(token, result));
  expect(f.adapter.getSnapshot()).toBe(before);
  expect(f.adapter.succeed(token, success(1))).toBe(true);
});
test("aliased result/page fields use the same cached captured descriptor", () => {
  const f = fixture(),
    token = requireToken(
      f.adapter.begin(input("alias", 0, { extent: complete, evaluatedAt: 0 })),
    );
  const raw: Record<string, unknown> = {
    ...success(1),
    kind: "known",
    total: 1,
  };
  let reads = 0;
  const result = new Proxy(raw, {
    getOwnPropertyDescriptor(target, key) {
      if (key === "total") {
        reads++;
        return {
          configurable: true,
          enumerable: true,
          writable: true,
          value: reads === 1 ? 1 : 999,
        };
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
  });
  raw.page = result;
  expect(
    f.adapter.succeed(
      token,
      result as unknown as ResourceSuccess<{ id: string }>,
    ),
  ).toBe(true);
  expect(f.adapter.getSnapshot().snapshot?.page).toEqual({
    kind: "known",
    total: 1,
  });
  expect(reads).toBe(1);
});
