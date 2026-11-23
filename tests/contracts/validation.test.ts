import { describe, expect, it } from "vitest";
import {
  ContractError,
  canonicalJson,
  createQuery,
  defineQuerySchema,
  getFilterIdentity,
  getQueryIdentity,
  normalizeQuery,
  parseQuery,
} from "../../packages/react/src/contracts/index.js";

const schema = defineQuerySchema({
  id: "validation",
  version: 1,
  fields: {
    value: { type: "text", owner: "builder" },
    amount: { type: "number", owner: "builder", sort: true },
    tags: { type: "set", owner: "builder" },
    search: { type: "text", owner: "search" },
    status: { type: "enum", owner: "tabs" },
  },
  tabs: [{ id: "all", rules: [] }],
});
const base = createQuery(schema, { locale: "en-US", timeZone: "UTC" });
describe("strict unknown transport and immutable normalization", () => {
  it("rejects executable createQuery input before spreading/getting properties", () => {
    let invoked = false;
    const input = Object.defineProperty(
      { locale: "en-US", timeZone: "UTC" },
      "search",
      {
        enumerable: true,
        get() {
          invoked = true;
          return "synthetic";
        },
      },
    );
    expect(() => createQuery(schema, input)).toThrow(
      "Invalid Tableweave contract.",
    );
    expect(invoked).toBe(false);
  });
  for (const [name, patch] of Object.entries({
    version: { version: 2 },
    schema: { schemaId: "unknown" },
    revision: { schemaVersion: 2 },
    extra: { surprise: true },
    locale: { locale: "not-a-locale-!" },
    zone: { timeZone: "bad/zone" },
    page: { pagination: { pageIndex: -1, pageSize: 10 } },
    fraction: { pagination: { pageIndex: 0.5, pageSize: 10 } },
    size: { pagination: { pageIndex: 0, pageSize: 11 } },
    hugePage: {
      pagination: { pageIndex: Number.MAX_SAFE_INTEGER + 1, pageSize: 10 },
    },
    tab: { tabId: "unknown" },
    sort: { sorting: [{ id: "value", desc: false }] },
    duplicateSort: {
      sorting: [
        { id: "amount", desc: false },
        { id: "amount", desc: false },
      ],
    },
    rules: {
      builder: {
        join: "and",
        rules: Array.from({ length: 51 }, (_, i) => ({
          id: `r${i}`,
          field: "value",
          operator: "text.is",
          value: "same",
        })),
      },
    },
    search: { search: "a".repeat(513) },
  }))
    it(`rejects ${name}`, () =>
      expect(parseQuery(schema, { ...base, ...patch }).success).toBe(false));
  for (const [name, rule] of Object.entries({
    unknownField: { field: "unknown", operator: "empty" },
    owner: { field: "search", operator: "text.is", value: "x" },
    inactiveTab: { field: "status", operator: "enum.is", value: "open" },
    injection: { field: "value;DROP TABLE x", operator: "empty" },
    unknownOperator: { field: "value", operator: "unknown" },
    wrongFamily: { field: "value", operator: "number.eq", value: 1 },
    noneOperand: { field: "value", operator: "empty", value: null },
    emptyText: { field: "value", operator: "text.is", value: "" },
    numericString: { field: "amount", operator: "number.eq", value: "1" },
    nan: { field: "amount", operator: "number.eq", value: Number.NaN },
    infinity: {
      field: "amount",
      operator: "number.eq",
      value: Number.POSITIVE_INFINITY,
    },
    range: { field: "amount", operator: "number.between", value: [1] },
    reverse: { field: "amount", operator: "number.between", value: [2, 1] },
    membership: { field: "tags", operator: "set.anyOf", value: [] },
    wrongId: { field: "tags", operator: "set.anyOf", value: [1] },
    largeMembership: {
      field: "tags",
      operator: "set.anyOf",
      value: Array(101).fill("a"),
    },
  }))
    it(`rejects rule ${name}`, () =>
      expect(
        parseQuery(schema, {
          ...base,
          builder: { join: "and", rules: [{ id: "r1", ...rule }] },
        }).success,
      ).toBe(false));
  it("rejects duplicate/editable or unsafe rule IDs without echoing them", () => {
    const rule = { id: "r1", field: "value", operator: "empty" };
    expect(
      parseQuery(schema, {
        ...base,
        builder: { join: "and", rules: [rule, rule] },
      }).success,
    ).toBe(false);
    const result = parseQuery(schema, {
      ...base,
      builder: { join: "and", rules: [{ ...rule, id: "secret !@#$" }] },
    });
    expect(result).toEqual({ success: false, issues: [{ code: "rule.id" }] });
  });
  it("retains editable rule IDs while canonicalizing unordered membership values", () => {
    const input = {
      ...base,
      builder: {
        join: "or",
        rules: [
          {
            id: "r1",
            field: "tags",
            operator: "set.anyOf",
            value: ["b", "a", "b"],
          },
          { id: "r2", field: "tags", operator: "set.anyOf", value: ["a", "b"] },
        ],
      },
    };
    const result = normalizeQuery(schema, input);
    expect(result.builder.rules).toEqual([
      { id: "r1", field: "tags", operator: "set.anyOf", value: ["a", "b"] },
      { id: "r2", field: "tags", operator: "set.anyOf", value: ["a", "b"] },
    ]);
    expect(input.builder.rules[0]?.value).toEqual(["b", "a", "b"]);
    expect(Object.isFrozen(result.builder.rules)).toBe(true);
    expect(normalizeQuery(schema, result)).toEqual(result);
  });
  it("separates effective filtering from request identity and editor preference", () => {
    const query = createQuery(schema, {
      locale: "en-US",
      timeZone: "UTC",
      builder: {
        join: "and",
        rules: [
          { id: "a", field: "value", operator: "text.is", value: "ALPHA" },
          { id: "b", field: "amount", operator: "number.eq", value: 1 },
        ],
      },
    });
    const reordered = {
      ...query,
      builder: {
        join: "and",
        rules: [...query.builder.rules]
          .reverse()
          .map((rule) => ({ ...rule, id: `new.${rule.id}` })),
      },
    };
    expect(getFilterIdentity(schema, query, { now: 0 })).toBe(
      getFilterIdentity(schema, reordered, { now: 1 }),
    );
    const changedPage = {
      ...query,
      pagination: { pageIndex: 1, pageSize: 10 },
      sorting: [{ id: "amount", desc: true }],
    };
    expect(getFilterIdentity(schema, query, { now: 0 })).toBe(
      getFilterIdentity(schema, changedPage, { now: 0 }),
    );
    expect(getQueryIdentity(schema, query, { now: 0 })).not.toBe(
      getQueryIdentity(schema, changedPage, { now: 0 }),
    );
    expect(getFilterIdentity(schema, base, { now: 0 })).toBe(
      getFilterIdentity(
        schema,
        { ...base, builder: { join: "or", rules: [] } },
        { now: 0 },
      ),
    );
    expect(getFilterIdentity(schema, query, { now: 0 })).not.toBe(
      getFilterIdentity(schema, { ...query, locale: "tr-TR" }, { now: 0 }),
    );
  });
  it("produces safe errors for non-JSON, cyclic, getters and executable inputs", () => {
    const cyclic: unknown[] = [];
    cyclic.push(cyclic);
    let invoked = false;
    const getter = Object.defineProperty({}, "secret", {
      enumerable: true,
      get() {
        invoked = true;
        return "private";
      },
    });
    for (const invalid of [
      cyclic,
      getter,
      { ...base, secret: () => "private" },
      { ...base, secret: BigInt(1) },
      { ...base, secret: new Date() },
      { ...base, [Symbol("private")]: 1 },
      { ...base, search: undefined },
    ]) {
      const result = parseQuery(schema, invalid);
      expect(result).toEqual({
        success: false,
        issues: [{ code: "query.invalid" }],
      });
    }
    expect(invoked).toBe(false);
    try {
      normalizeQuery(schema, { private: "private" });
    } catch (error) {
      expect(error).toBeInstanceOf(ContractError);
      expect(String(error)).toBe("ContractError: Invalid Tableweave contract.");
      expect(JSON.stringify(error)).not.toContain("private");
    }
    expect(canonicalJson({ b: 1, a: [false, 0] })).toBe(
      '{"a":[false,0],"b":1}',
    );
    expect(() => canonicalJson(Array(2))).toThrow();
  });
  it("rejects schema ownership/preset/operator conflicts and unsafe definitions", () => {
    const invalid: unknown[] = [
      { id: "bad", version: 1, fields: { x: { type: "text", owner: "date" } } },
      {
        id: "bad",
        version: 1,
        fields: {
          x: { type: "date", owner: "date" },
          y: { type: "date", owner: "date" },
        },
      },
      {
        id: "bad",
        version: 1,
        fields: {
          x: { type: "number", owner: "builder", operators: ["text.is"] },
        },
      },
      {
        id: "bad",
        version: 1,
        fields: { x: { type: "set", owner: "builder", preset: "person" } },
      },
      {
        id: "bad",
        version: 1,
        fields: { x: { type: "enum", owner: "builder", values: ["a", 1] } },
      },
      { id: "bad", version: 1, fields: {}, defaultTabId: "missing" },
      { id: "bad", version: 1, fields: {}, limits: { maxRules: -1 } },
      {
        id: "bad",
        version: 1,
        fields: {},
        pagination: { sizes: [10], defaultSize: 25 },
      },
    ];
    for (const definition of invalid)
      expect(() =>
        defineQuerySchema(
          definition as Parameters<typeof defineQuerySchema>[0],
        ),
      ).toThrow("Invalid Tableweave contract.");
  });
});
