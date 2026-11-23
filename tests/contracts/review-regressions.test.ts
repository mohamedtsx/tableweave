import { describe, expect, it } from "vitest";
import type { QuerySchemaDefinition } from "../../packages/react/src/contracts/index.js";
import {
  createQuery,
  defineQuerySchema,
  parseQuery,
} from "../../packages/react/src/contracts/index.js";
import {
  compileFilter,
  createFilterEvaluator,
  resolveDateValue,
  translateQuery,
} from "../../packages/react/src/filters/index.js";
import { translator } from "./translator.js";

describe("WP-02 review session 1 regressions", () => {
  for (const operator of [
    "set.anyOf",
    "set.noneOf",
    "set.allOf",
    "set.notAllOf",
    "notEmpty",
  ] as const) {
    it(`n1: ${operator} excludes invalid and sparse collections`, () => {
      const schema = defineQuerySchema({
        id: "review-n1-edges",
        version: 1,
        fields: { value: { type: "set", owner: "builder" } },
      });
      const rule =
        operator === "notEmpty"
          ? { id: "r1", field: "value" as const, operator }
          : {
              id: "r1",
              field: "value" as const,
              operator,
              value: ["a"] as const,
            };
      const query = createQuery(schema, {
        locale: "en-US",
        timeZone: "UTC",
        builder: { join: "and", rules: [rule] },
      });
      const sparse: string[] = ["a"];
      sparse.length = 2;
      const inherited = Object.setPrototypeOf(
        Array(1),
        Object.assign(Object.create(Array.prototype), { 0: "b" }),
      );
      for (const value of [
        ["a", ""],
        sparse,
        inherited,
        [null],
        [undefined],
        [1],
        [],
      ]) {
        expect(
          createFilterEvaluator(schema, query, { now: 0 })({ value }),
        ).toBe(false);
        expect(
          translateQuery(schema, query, translator, { now: 0 }).matches({
            value,
          }),
        ).toBe(false);
      }
      expect(
        parseQuery(schema, {
          ...query,
          builder: {
            join: "and",
            rules: [
              { id: "r1", field: "value", operator: "set.noneOf", value: [""] },
            ],
          },
        }).success,
      ).toBe(false);
    });
  }
  it("n1: numeric collection IDs retain zero but reject nonfinite/mixed values", () => {
    const schema = defineQuerySchema({
      id: "review-n1-numeric",
      version: 1,
      fields: { value: { type: "set", owner: "builder", idType: "number" } },
    });
    const query = createQuery(schema, {
      locale: "en-US",
      timeZone: "UTC",
      builder: {
        join: "and",
        rules: [
          { id: "r1", field: "value", operator: "set.noneOf", value: [1] },
        ],
      },
    });
    const local = createFilterEvaluator(schema, query, { now: 0 });
    const server = translateQuery(schema, query, translator, { now: 0 });
    for (const value of [
      [Number.NaN],
      [Number.POSITIVE_INFINITY],
      [0, ""],
      Array(1),
    ]) {
      expect(local({ value })).toBe(false);
      expect(server.matches({ value })).toBe(false);
    }
    expect(local({ value: [0] })).toBe(true);
    expect(server.matches({ value: [0] })).toBe(true);
  });
  for (const [name, value] of [
    ["empty-string ID", [""]],
    ["sparse collection", Array(1)],
  ] as const) {
    it(`n1: rejects ${name} records for negative membership`, () => {
      const schema = defineQuerySchema({
        id: "review-n1",
        version: 1,
        fields: { value: { type: "set", owner: "builder" } },
      });
      const query = createQuery(schema, {
        locale: "en-US",
        timeZone: "UTC",
        builder: {
          join: "and",
          rules: [
            { id: "r1", field: "value", operator: "set.noneOf", value: ["a"] },
          ],
        },
      });
      expect(createFilterEvaluator(schema, query, { now: 0 })({ value })).toBe(
        false,
      );
      expect(
        translateQuery(schema, query, translator, { now: 0 }).matches({
          value,
        }),
      ).toBe(false);
    });
  }
  it("n2: rejects a nonexistent timezone-specific day, not date-only intent", () => {
    const field = { type: "datetime", owner: "builder" } as const;
    const day = { kind: "day", value: "2011-12-30" } as const;
    const context = { locale: "en-US", timeZone: "Pacific/Apia", now: 0 };
    const schema = defineQuerySchema({
      id: "review-n2",
      version: 1,
      fields: { value: field },
    });
    const query = {
      ...createQuery(schema, {
        locale: context.locale,
        timeZone: context.timeZone,
      }),
      builder: {
        join: "and",
        rules: [{ id: "r1", field: "value", operator: "date.on", value: day }],
      },
    };
    expect(() => compileFilter(schema, query, context)).toThrow(
      "Invalid Tableweave contract.",
    );
    expect(parseQuery(schema, query).success).toBe(false);
    expect(() => resolveDateValue(field, day, context)).toThrow(
      "Invalid Tableweave contract.",
    );
    expect(resolveDateValue({ ...field, type: "date" }, day, context)).toEqual({
      kind: "days",
      start: "2011-12-30",
      endExclusive: "2011-12-31",
    });
    expect(() =>
      resolveDateValue(
        field,
        { kind: "relative", preset: "yesterday" },
        { ...context, now: Date.parse("2011-12-30T12:00:00Z") },
      ),
    ).toThrow("Invalid Tableweave contract.");
    expect(
      resolveDateValue(field, { ...day, value: "2011-12-31" }, context),
    ).toEqual({
      kind: "instants",
      start: 1325239200000,
      endExclusive: 1325325600000,
    });
    expect(() => translateQuery(schema, query, translator, context)).toThrow(
      "Invalid Tableweave contract.",
    );
  });
  it("n3: widened schemas accept valid sorting/tabs and still validate unknown IDs", () => {
    const definition: QuerySchemaDefinition = {
      id: "review-n3",
      version: 1,
      fields: { price: { type: "number", owner: "builder", sort: true } },
      tabs: [{ id: "all", rules: [] }],
    };
    const schema = defineQuerySchema(definition);
    const input = {
      locale: "en-US",
      timeZone: "UTC",
      sorting: [{ id: "price", desc: false }],
      tabId: "all",
    };
    expect(parseQuery(schema, createQuery(schema, input)).success).toBe(true);
    expect(() =>
      createQuery(schema, {
        ...input,
        sorting: [{ id: "unknown", desc: false }],
      }),
    ).toThrow("Invalid Tableweave contract.");
    expect(() => createQuery(schema, { ...input, tabId: "unknown" })).toThrow(
      "Invalid Tableweave contract.",
    );
  });
});
