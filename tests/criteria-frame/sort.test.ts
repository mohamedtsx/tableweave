import {
  constructSortFn,
  type SortFn,
  type SortFnDef,
  sortFn_alphanumeric,
  sortFn_alphanumericCaseSensitive,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  sortFn_textCaseSensitive,
} from "../../packages/react/node_modules/@tanstack/react-table/dist/index.js";
import { requireCriteriaTool } from "../../packages/react/src/presentation/criteria-frame.js";
import { createNativeBoundary } from "../../packages/react/src/tanstack/boundary.js";
import {
  createTableSortFn,
  guardTableSortFn,
} from "../../packages/react/src/tanstack/sort.js";
import type { NativeFeatures } from "../../packages/react/src/tanstack/types.js";
import { fixture, type Item, records, required } from "./fixtures.js";

test("explicit helper construction is inert and freezes only its new vendor function/config", () => {
  let calls = 0;
  const definition: SortFnDef<NativeFeatures, Item> = {
    sort() {
      calls++;
      return 0;
    },
    resolveDataValue(value) {
      calls++;
      return value;
    },
  };
  const created = createTableSortFn(definition);
  expect(calls).toBe(0);
  expect(Object.isFrozen(created)).toBe(true);
  expect(Object.isFrozen(definition)).toBe(false);
  expect(Object.isFrozen(definition.sort)).toBe(false);
  expect(Object.isFrozen(definition.resolveDataValue)).toBe(false);
  expect(created.sort).toBe(definition.sort);
  expect(created.resolveDataValue).toBe(definition.resolveDataValue);
});

test("real protected model helper resolver revocation stops before resolver B and sort", () => {
  let resolves = 0,
    sorts = 0;
  let f: ReturnType<typeof fixture>;
  const sortFn = createTableSortFn<Item>({
    resolveDataValue(value) {
      resolves++;
      if (resolves === 1) f.app.beginReset();
      return value;
    },
    sort() {
      sorts++;
      return 0;
    },
  });
  f = fixture(true, "multiple", "none", sortFn);
  f.settle();
  f.accept({ type: "sorting.change", update: [{ id: "amount", desc: false }] });
  expect(() => f.frames.prepare(f.input())).toThrow(
    expect.objectContaining({ code: "criteria.frame.unavailable" }),
  );
  expect(resolves).toBe(1);
  expect(sorts).toBe(0);
  expect(f.frames.getSnapshot().phase).toBe("empty");
});

test("helper materialization preserves original created receiver, bare resolver, argument order and values", () => {
  const f = fixture();
  f.settle();
  const frame = f.commit(),
    pair = f.frames.issue(frame),
    seen: unknown[] = [];
  const definition: SortFnDef<NativeFeatures, Item> = {
    resolveDataValue: function (this: unknown, value) {
      seen.push(["resolve", this, value]);
      return Number(value) + 1;
    },
    sort: function (this: unknown, a, b, rowA, rowB, id) {
      seen.push(["sort", this, a, b, rowA, rowB, id]);
      return Number(a) - Number(b);
    },
  };
  const original = createTableSortFn(definition),
    check = () => {
      requireCriteriaTool(pair.tool, f.frames);
      return undefined;
    };
  const guarded = guardTableSortFn<Item>(original, check),
    a = required(frame.view.rows[0]),
    b = required(frame.view.rows[1]);
  expect(guarded(a, b, "amount")).toBe(original(a, b, "amount"));
  expect(seen.slice(0, 3)).toEqual(seen.slice(3));
  expect(seen[0]).toEqual(["resolve", undefined, a.original.amount]);
  expect(seen[1]).toEqual(["resolve", undefined, b.original.amount]);
  expect(seen[2]).toEqual([
    "sort",
    original,
    a.original.amount + 1,
    b.original.amount + 1,
    a,
    b,
    "amount",
  ]);
});

for (const builtin of [
  sortFn_alphanumeric,
  sortFn_alphanumericCaseSensitive,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  sortFn_textCaseSensitive,
])
  test(`exact builtin ${builtin.name || "created"} parity on actual vendor rows`, () => {
    const f = fixture();
    f.settle();
    const frame = f.commit(),
      pair = f.frames.issue(frame),
      before = Object.getOwnPropertyDescriptors(builtin);
    const check = () => {
      requireCriteriaTool(pair.tool, f.frames);
      return undefined;
    };
    const guarded = guardTableSortFn<Item>(builtin, check);
    const actual = [...frame.view.rows]
      .sort((a, b) => guarded(a, b, "amount"))
      .map((row) => row.id);
    const expected = [...frame.view.rows]
      .sort((a, b) => builtin(a, b, "amount"))
      .map((row) => row.id);
    expect(actual).toEqual(expected);
    expect(Object.getOwnPropertyDescriptors(builtin)).toEqual(before);
  });

test("non-revoked real sorted model helper order matches raw vendor comparisons", () => {
  const sortFn = createTableSortFn<Item>({
    resolveDataValue: (value) => Number(value),
    sort: (a, b) => Number(b) - Number(a),
  });
  const f = fixture(true, "multiple", "none", sortFn);
  f.settle();
  const seed = f.commit(),
    expected = [...seed.view.rows]
      .sort((a, b) => sortFn(a, b, "amount"))
      .map((row) => row.id);
  // Seed has the first page. Compare the corresponding complete supplied rows by
  // a disabled client fixture so page slicing does not hide ordering differences.
  const full = fixture(false, "multiple", "none", sortFn);
  full.settle();
  const baseline = full.commit();
  const fullExpected = [...baseline.view.rows]
    .sort((a, b) => sortFn(a, b, "amount"))
    .map((row) => row.id);
  full.accept({
    type: "sorting.change",
    update: [{ id: "amount", desc: false }],
  });
  const sorted = full.commit();
  expect(sorted.view.rows.map((row) => row.id)).toEqual(fullExpected);
  expect(expected).toHaveLength(25);
});

for (const variation of ["ordinary", "auto"] as const)
  test(`ordinary comparator and actual vendor ${variation} route remain usable`, () => {
    const f = fixture(
      false,
      "multiple",
      "none",
      variation === "auto"
        ? "auto"
        : (a, b, id) => Number(a.getValue(id)) - Number(b.getValue(id)),
    );
    f.settle();
    f.accept({
      type: "sorting.change",
      update: [{ id: "amount", desc: false }],
    });
    const frame = f.commit();
    expect(frame.view.rows.map((row) => row.original.amount)).toEqual(
      [...records].map((row) => row.amount).sort((a, b) => a - b),
    );
  });

test("ordinary opaque callbacks remain one guarded app invocation, not a promise about their hidden closures", () => {
  const f = fixture();
  f.settle();
  const frame = f.commit(),
    pair = f.frames.issue(frame);
  let appCalls = 0;
  const plain: SortFn<NativeFeatures, Item> = () => {
    appCalls++;
    f.app.beginReset();
    appCalls++;
    return 0;
  };
  const guarded = guardTableSortFn(plain, () => {
    requireCriteriaTool(pair.tool, f.frames);
    return undefined;
  });
  expect(() =>
    guarded(
      required(frame.view.rows[0]),
      required(frame.view.rows[1]),
      "amount",
    ),
  ).toThrow();
  expect(appCalls).toBe(2);
});

for (const kind of [
  "vendor-created",
  "copy",
  "proxy",
  "own-accessor",
  "inherited-accessor",
  "undefined",
  "inherited-data",
] as const)
  test(`ambiguous/unregistered ${kind} rejects without invoking any app callback/getter`, () => {
    let calls = 0;
    const created = createTableSortFn<Item>({
      sort() {
        calls++;
        return 0;
      },
    });
    const bare = (() => {
      calls++;
      return 0;
    }) as SortFn<NativeFeatures, Item>;
    let input: SortFn<NativeFeatures, Item> = bare;
    if (kind === "vendor-created")
      input = constructSortFn<NativeFeatures, Item>({
        sort() {
          calls++;
          return 0;
        },
      });
    if (kind === "copy") input = Object.assign(bare, created);
    if (kind === "proxy") input = new Proxy(created, {});
    if (kind === "own-accessor")
      Object.defineProperty(input, "sort", {
        get() {
          calls++;
          throw 0;
        },
      });
    if (kind === "undefined")
      Object.defineProperty(input, "resolveDataValue", { value: undefined });
    if (kind === "inherited-accessor")
      Object.setPrototypeOf(
        input,
        Object.create(Function.prototype, {
          resolveDataValue: {
            get() {
              calls++;
              throw 0;
            },
          },
        }),
      );
    if (kind === "inherited-data")
      Object.setPrototypeOf(
        input,
        Object.create(Function.prototype, {
          sort: {
            value: () => {
              calls++;
              return 0;
            },
          },
        }),
      );
    expect(() => guardTableSortFn(input, () => undefined)).toThrow(
      expect.objectContaining({ code: "native.sorting" }),
    );
    expect(calls).toBe(0);
  });

test("throwing/reflection-revoking comparator metadata checks the gate after the trap", () => {
  const f = fixture();
  f.settle();
  const frame = f.commit(),
    pair = f.frames.issue(frame);
  let calls = 0,
    traps = 0;
  const input = new Proxy(
    (() => {
      calls++;
      return 0;
    }) as SortFn<NativeFeatures, Item>,
    {
      getOwnPropertyDescriptor() {
        traps++;
        f.app.beginReset();
        throw new Error("Synthetic private metadata error");
      },
    },
  );
  expect(() =>
    guardTableSortFn(input, () => {
      requireCriteriaTool(pair.tool, f.frames);
      return undefined;
    }),
  ).toThrow(expect.objectContaining({ code: "criteria.frame.unavailable" }));
  expect(calls).toBe(0);
  expect(traps).toBe(1);
});

test("source helper rejects accessor/supplied-invalid known configuration without invocation", () => {
  let calls = 0;
  const inputs = [
    Object.defineProperty({}, "sort", {
      get() {
        calls++;
        throw 0;
      },
    }),
    { sort: undefined },
    { sort: () => 0, resolveDataValue: undefined },
    Object.defineProperty({ sort: () => 0 }, "resolveDataValue", {
      get() {
        calls++;
        throw 0;
      },
    }),
  ];
  for (const input of inputs)
    expect(() => Reflect.apply(createTableSortFn, undefined, [input])).toThrow(
      expect.objectContaining({ code: "native.sorting" }),
    );
  expect(calls).toBe(0);
});

test("raw legacy native path still accepts unregistered genuine vendor constructors", () => {
  const original = constructSortFn<NativeFeatures, Item>({
    resolveDataValue: (value) => Number(value),
    sort: (a, b) => Number(a) - Number(b),
  });
  const f = fixture(false, "multiple", "none", original);
  f.settle();
  f.accept({ type: "sorting.change", update: [{ id: "amount", desc: false }] });
  // This raw route uses its own sole boundary; the inert F1 owner has not prepared.
  const boundary = createNativeBoundary(f.definition, f.app.C),
    frame = boundary.prepare(
      { mode: "client", records },
      f.app.C.getSnapshot(),
    );
  boundary.commit(frame);
  expect(
    boundary.getView(frame).rows.map((row) => row.original.amount),
  ).toEqual(records.map((row) => row.amount).sort((a, b) => a - b));
  f.reset();
  expect(() => f.frames.prepare(f.input())).toThrow(
    expect.objectContaining({ code: "criteria.frame.unavailable" }),
  );
  expect(f.counts.rowId).toBe(0);
});

test("helper guard preserves non-revoked callback exceptions and discards them when revoked", () => {
  const f = fixture();
  f.settle();
  const frame = f.commit(),
    pair = f.frames.issue(frame),
    failure = new Error("Synthetic comparator failure");
  const check = () => {
    requireCriteriaTool(pair.tool, f.frames);
    return undefined;
  };
  const throws = createTableSortFn<Item>({
    sort() {
      throw failure;
    },
  });
  try {
    guardTableSortFn<Item>(throws, check)(
      required(frame.view.rows[0]),
      required(frame.view.rows[1]),
      "amount",
    );
    throw new Error("Expected callback failure");
  } catch (error) {
    expect(error).toBe(failure);
  }
  const revokes = createTableSortFn<Item>({
    sort() {
      f.app.beginReset();
      throw failure;
    },
  });
  expect(() =>
    guardTableSortFn<Item>(revokes, check)(
      required(frame.view.rows[0]),
      required(frame.view.rows[1]),
      "amount",
    ),
  ).toThrow(expect.objectContaining({ code: "criteria.frame.unavailable" }));
});

import { expect, test } from "vitest";
