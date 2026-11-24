import { describe, expect, it } from "vitest";
import type {
  OptionPageResult,
  OptionRequestInput,
  OptionSourceContext,
} from "../../../packages/react/src/filters/editor-types.js";
import {
  createOptionSource,
  projectOptionSourceView,
} from "../../../packages/react/src/filters/options-source.js";
import { context, page, request } from "./fixtures.js";

const safeInputError = "Invalid Tableweave option source input.";

describe("n1 reported option envelope TOCTOU", () => {
  it("rejects an accessor hasMore rather than validating a boolean then storing its mutable second value", () => {
    const source = createOptionSource(context);
    const token = source.begin(request());
    if (!token) throw new Error("Missing token");
    const before = source.getSnapshot();
    const mutablePayload = { value: "synthetic-private-payload" };
    let reads = 0;
    const malicious = {
      options: [],
      get hasMore() {
        return (++reads === 1 ? false : mutablePayload) as boolean;
      },
    };
    expect(() => source.succeed(token, malicious)).toThrow(safeInputError);
    expect(reads).toBe(0);
    expect(source.getSnapshot()).toBe(before);
    expect(source.succeed(token, page(["valid"], false))).toBe(true);
    mutablePayload.value = "changed-after-rejection";
    expect(source.getSnapshot().page?.hasMore).toBe(false);
  });

  it("rejects an initial access getter instead of storing a second invalid truthy permission", () => {
    let reads = 0;
    const malicious = {
      ...context,
      get access() {
        return (++reads === 1 ? true : "not-a-boolean") as boolean;
      },
    };
    expect(() => createOptionSource(malicious)).toThrow(safeInputError);
    expect(reads).toBe(0);
  });
});

describe("option envelope accessor rejection and atomicity", () => {
  for (const key of ["definitionKey", "scopeKey", "fieldId", "access"] as const)
    it(`rejects ${key} accessors in context changes, selection guards and pure projections`, () => {
      const source = createOptionSource(context);
      source.setSelectedIds(context, [0, "0"]);
      const token = source.begin(request());
      if (!token) throw new Error("Missing token");
      const before = source.getSnapshot();
      let reads = 0;
      const malicious = Object.defineProperty({ ...context }, key, {
        enumerable: true,
        get() {
          reads++;
          throw new Error("synthetic-private-context-error");
        },
      });
      expect(() => source.setContext(malicious)).toThrow(safeInputError);
      expect(() => source.setSelectedIds(malicious, ["replacement"])).toThrow(
        safeInputError,
      );
      expect(() =>
        projectOptionSourceView(before, malicious, ["replacement"]),
      ).toThrow(safeInputError);
      expect(reads).toBe(0);
      expect(source.getSnapshot()).toBe(before);
      expect(source.succeed(token, page([0, "0"]))).toBe(true);
    });

  for (const key of [
    "definitionKey",
    "scopeKey",
    "fieldId",
    "term",
    "pageKey",
    "retry",
  ] as const)
    it(`rejects a begin ${key} accessor without replacing the outstanding valid token`, () => {
      const source = createOptionSource(context);
      const token = source.begin(request());
      if (!token) throw new Error("Missing token");
      const before = source.getSnapshot();
      let reads = 0;
      const mutablePayload = { value: "synthetic-private-request" };
      const original = request("next", "2", { retry() {} });
      const malicious = Object.defineProperty({ ...original }, key, {
        enumerable: true,
        get() {
          return ++reads === 1 ? original[key] : mutablePayload;
        },
      }) as OptionRequestInput;
      expect(() => source.begin(malicious)).toThrow(safeInputError);
      expect(reads).toBe(0);
      expect(source.getSnapshot()).toBe(before);
      expect(source.succeed(token, page(["valid"]))).toBe(true);
    });

  for (const key of ["options", "hasMore"] as const)
    it(`rejects throwing success ${key} getters generically and keeps settlement open`, () => {
      const source = createOptionSource(context);
      const token = source.begin(request());
      if (!token) throw new Error("Missing token");
      const before = source.getSnapshot();
      let reads = 0;
      const malicious = Object.defineProperty(
        { options: [], hasMore: false },
        key,
        {
          enumerable: true,
          get() {
            reads++;
            throw new Error("synthetic-private-page-error");
          },
        },
      ) as OptionPageResult;
      expect(() => source.succeed(token, malicious)).toThrow(safeInputError);
      expect(reads).toBe(0);
      expect(source.getSnapshot()).toBe(before);
      expect(source.succeed(token, page(["valid"]))).toBe(true);
    });

  it("rejects factory callback accessors rather than invoking an unsafe constructor getter", () => {
    let reads = 0;
    const malicious = {
      get onInvalidate(): () => void {
        reads++;
        throw new Error("synthetic-private-callback-error");
      },
    };
    expect(() => createOptionSource(context, malicious)).toThrow(
      safeInputError,
    );
    expect(reads).toBe(0);
  });

  for (const key of ["id", "label", "disabled"] as const)
    it(`rejects ${key} getters in pages and recovered labels without a partial cache update`, () => {
      const source = createOptionSource(context);
      source.setSelectedIds(context, ["a", "b"]);
      const token = source.begin(request());
      if (!token) throw new Error("Missing token");
      const before = source.getSnapshot();
      let reads = 0;
      const malicious = Object.defineProperty(
        { id: "b", label: "B", disabled: false },
        key,
        {
          enumerable: true,
          get() {
            reads++;
            throw new Error("synthetic-private-option-error");
          },
        },
      );
      const options = [
        { id: "a", label: "Do not partially retain" },
        malicious,
      ];
      expect(() => source.succeed(token, { options, hasMore: false })).toThrow(
        safeInputError,
      );
      expect(() => source.recoverSelectedLabels(token, options)).toThrow(
        safeInputError,
      );
      expect(reads).toBe(0);
      expect(source.getSnapshot()).toBe(before);
      expect(source.succeed(token, page(["a", "b"]))).toBe(true);
    });

  it("rejects selected-ID accessors while leaving source and selector fallback untouched", () => {
    const source = createOptionSource(context);
    source.setSelectedIds(context, [0]);
    const before = source.getSnapshot();
    let reads = 0;
    const ids = Object.defineProperty(["bad"], "0", {
      enumerable: true,
      get() {
        reads++;
        throw new Error("synthetic-private-id-error");
      },
    });
    expect(() => source.setSelectedIds(context, ids)).toThrow(safeInputError);
    expect(() => projectOptionSourceView(before, context, ids)).toThrow(
      safeInputError,
    );
    expect(reads).toBe(0);
    expect(source.getSnapshot()).toBe(before);
    expect(projectOptionSourceView(before, context, [0, "0"]).selected).toEqual(
      [
        { id: 0, label: "0", known: false },
        { id: "0", label: "0", known: false },
      ],
    );
  });

  it("copies ordinary inputs and projections without retaining mutable envelopes or extras", () => {
    const initial = { ...context, privateExtra: { mutable: true } };
    const source = createOptionSource(initial);
    initial.scopeKey = "mutated-scope";
    initial.access = false;
    expect(source.getSnapshot().context).toEqual(context);
    const input = request("captured-term", "captured-page");
    const token = source.begin(input);
    if (!token) throw new Error("Missing token");
    Object.assign(input, { term: "mutated-term", pageKey: "mutated-page" });
    expect(token).toMatchObject({
      term: "captured-term",
      pageKey: "captured-page",
    });
    const options = [{ id: 0, label: "Zero", disabled: false }];
    const result = { options, hasMore: false, privateExtra: { mutable: true } };
    expect(source.succeed(token, result)).toBe(true);
    result.hasMore = true;
    const first = options[0];
    if (!first) throw new Error("Missing option");
    first.label = "Mutated";
    first.disabled = true;
    source.setSelectedIds(context, [0]);
    const before = source.getSnapshot();
    expect(before.page?.hasMore).toBe(false);
    expect(before.page?.options).toEqual([
      { id: 0, label: "Zero", disabled: false },
    ]);
    const expected = {
      ...context,
      scopeKey: "next",
      privateExtra: { mutable: true },
    } satisfies OptionSourceContext & { privateExtra: object };
    const ids = [0, "0"];
    const projected = projectOptionSourceView(before, expected, ids);
    expected.scopeKey = "changed";
    ids.push("changed");
    expect(projected.context.scopeKey).toBe("next");
    expect(projected.selected).toEqual([
      { id: 0, label: "0", known: false },
      { id: "0", label: "0", known: false },
    ]);
    expect(Object.keys(projected.context)).not.toContain("privateExtra");
    expect(source.getSnapshot()).toBe(before);
  });

  it("uses captured proxy data descriptors once, not property get traps or their mutable payloads", () => {
    const mutablePayload = { value: "synthetic-private-proxy-payload" };
    let propertyReads = 0;
    const descriptorCounts: Map<PropertyKey, number>[] = [];
    const proxy = <T extends object>(input: T): T => {
      const counts = new Map<PropertyKey, number>();
      descriptorCounts.push(counts);
      return new Proxy(input, {
        get() {
          propertyReads++;
          return mutablePayload;
        },
        getOwnPropertyDescriptor(target, key) {
          counts.set(key, (counts.get(key) ?? 0) + 1);
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      });
    };
    const source = createOptionSource(
      proxy({ ...context }),
      proxy({ onInvalidate() {} }),
    );
    source.setSelectedIds(proxy({ ...context }), [0, "0"]);
    const token = source.begin(proxy(request("captured", "first")));
    if (!token) throw new Error("Missing token");
    expect(
      source.succeed(
        token,
        proxy({
          options: [proxy({ id: 0, label: "Number zero", disabled: false })],
          hasMore: false,
          privateExtra: mutablePayload,
        }),
      ),
    ).toBe(true);
    expect(
      source.recoverSelectedLabels(token, [
        proxy({ id: "0", label: "String zero", disabled: false }),
      ]),
    ).toBe(true);
    const before = source.getSnapshot();
    const projected = projectOptionSourceView(
      before,
      proxy({ ...context, scopeKey: "next" }),
      [0, "0"],
    );
    mutablePayload.value = "mutated-after-capture";
    expect(propertyReads).toBe(0);
    for (const counts of descriptorCounts) {
      expect(counts.size).toBeGreaterThan(0);
      expect([...counts.values()].every((count) => count === 1)).toBe(true);
    }
    expect(before.context).toEqual(context);
    expect(before.request).toMatchObject({
      term: "captured",
      pageKey: "first",
    });
    expect(before.page?.hasMore).toBe(false);
    expect(before.selected).toEqual([
      { id: 0, label: "Number zero", known: true },
      { id: "0", label: "String zero", known: true },
    ]);
    expect(projected.context.scopeKey).toBe("next");
    expect(projected.selected).toEqual([
      { id: 0, label: "0", known: false },
      { id: "0", label: "0", known: false },
    ]);
    expect(JSON.stringify(before)).not.toContain("synthetic-private");
    expect(JSON.stringify(before)).not.toContain("mutated-after-capture");
    expect(source.getSnapshot()).toBe(before);
  });

  it("sanitizes throwing proxy envelope traps without reading the thrown error's message", () => {
    const source = createOptionSource(context);
    const token = source.begin(request());
    if (!token) throw new Error("Missing token");
    const before = source.getSnapshot();
    let messageReads = 0;
    const raw = {
      get message() {
        messageReads++;
        throw new Error("synthetic-private-error-getter");
      },
    };
    const proxy = <T extends object>(input: T): T =>
      new Proxy(input, {
        ownKeys() {
          throw raw;
        },
      });
    const malformedContext = proxy({ ...context });
    for (const action of [
      () => createOptionSource(malformedContext),
      () => createOptionSource(context, proxy({ onInvalidate() {} })),
      () => source.setContext(malformedContext),
      () => source.setSelectedIds(malformedContext, ["a"]),
      () => source.begin(proxy(request())),
      () => source.succeed(token, proxy(page(["a"]))),
      () => projectOptionSourceView(before, malformedContext, ["a"]),
    ])
      expect(action).toThrow(safeInputError);
    expect(messageReads).toBe(0);
    expect(source.getSnapshot()).toBe(before);
    expect(source.succeed(token, page(["valid"]))).toBe(true);
  });

  it("accepts null-prototype data envelopes but rejects inherited, non-enumerable and symbol properties atomically", () => {
    const source = createOptionSource(
      Object.assign(Object.create(null), context),
    );
    const token = source.begin(Object.assign(Object.create(null), request()));
    if (!token) throw new Error("Missing token");
    const before = source.getSnapshot();
    const hidden = Object.defineProperty({ ...context }, "access", {
      value: true,
      enumerable: false,
    });
    const inherited = Object.assign(Object.create({ access: true }), {
      definitionKey: context.definitionKey,
      scopeKey: context.scopeKey,
      fieldId: context.fieldId,
    });
    const symbol = { ...context, [Symbol("private")]: { payload: true } };
    for (const malicious of [hidden, inherited, symbol]) {
      expect(() => source.setContext(malicious)).toThrow(safeInputError);
      expect(source.getSnapshot()).toBe(before);
    }
    expect(
      source.succeed(
        token,
        Object.assign(Object.create(null), page(["valid"])),
      ),
    ).toBe(true);
  });
});
