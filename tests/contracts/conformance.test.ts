import { describe, expect, it } from "vitest";
import {
  createQuery,
  defineQuerySchema,
} from "../../packages/react/src/contracts/index.js";
import {
  builtinOperators,
  createFilterEvaluator,
  fieldPresets,
  translateQuery,
} from "../../packages/react/src/filters/index.js";
import { translator } from "./translator.js";
import { vectors, vectorVersion } from "./vectors.js";

describe("versioned shared local/application translator vectors", () => {
  it("compares numeric stable IDs without string coercion", () => {
    const schema = defineQuerySchema({
      id: "numeric-ids",
      version: 1,
      fields: { value: { type: "enum", owner: "builder", values: [0, 1] } },
    });
    const query = createQuery(schema, {
      locale: "en-US",
      timeZone: "UTC",
      builder: {
        join: "and",
        rules: [{ id: "a", field: "value", operator: "enum.is", value: 0 }],
      },
    });
    const local = createFilterEvaluator(schema, query, { now: 0 });
    const server = translateQuery(schema, query, translator, { now: 0 });
    for (const [value, expected] of [
      [0, true],
      ["0", false],
      [false, false],
      [null, false],
    ] as const) {
      expect(local({ value })).toBe(expected);
      expect(server.matches({ value })).toBe(expected);
    }
  });
  it("honors explicit case sensitivity and locale-aware string comparisons", () => {
    const schema = defineQuerySchema({
      id: "case",
      version: 1,
      fields: {
        value: { type: "text", owner: "builder", caseSensitive: true },
      },
    });
    const query = createQuery(schema, {
      locale: "en-US",
      timeZone: "UTC",
      builder: {
        join: "and",
        rules: [
          { id: "a", field: "value", operator: "text.is", value: "Alpha" },
        ],
      },
    });
    expect(
      createFilterEvaluator(schema, query, { now: 0 })({ value: "alpha" }),
    ).toBe(false);
    expect(
      translateQuery(schema, query, translator, { now: 0 }).matches({
        value: "alpha",
      }),
    ).toBe(false);
    const insensitive = defineQuerySchema({
      id: "case",
      version: 1,
      fields: { value: { type: "text", owner: "builder" } },
    });
    const turkish = {
      ...query,
      locale: "tr-TR",
      builder: {
        join: "and",
        rules: [{ id: "a", field: "value", operator: "text.is", value: "ı" }],
      },
    };
    expect(
      createFilterEvaluator(insensitive, turkish, { now: 0 })({ value: "I" }),
    ).toBe(true);
    expect(
      translateQuery(insensitive, turkish, translator, { now: 0 }).matches({
        value: "I",
      }),
    ).toBe(true);
  });
  it("covers every built-in descriptor", () => {
    expect(vectorVersion).toBe(1);
    expect([...new Set(vectors.map((v) => v.operator))].sort()).toEqual(
      builtinOperators.map((op) => op.id).sort(),
    );
  });
  for (const vector of vectors)
    it(vector.name, () => {
      const schema = defineQuerySchema({
        id: "vectors",
        version: vectorVersion,
        fields: { value: vector.field },
      });
      const wire = {
        ...createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
        builder: {
          join: "and",
          rules: [
            {
              id: "r1",
              field: "value",
              operator: vector.operator,
              ...(vector.operand === undefined
                ? {}
                : { value: vector.operand }),
            },
          ],
        },
      };
      const local = createFilterEvaluator(schema, wire, { now: 0 });
      const translated = translateQuery(schema, wire, translator, { now: 0 });
      const rows = vector.values.map((value) => ({ value }));
      expect(rows.flatMap((row, index) => (local(row) ? [index] : []))).toEqual(
        vector.matches,
      );
      expect(
        rows.flatMap((row, index) => (translated.matches(row) ? [index] : [])),
      ).toEqual(vector.matches);
    });
  for (const vector of vectors.filter((v) => v.field.type === "date"))
    it(`datetime ${vector.name} preserves calendar comparison semantics`, () => {
      const schema = defineQuerySchema({
        id: "datetime-vectors",
        version: vectorVersion,
        fields: { value: { type: "datetime", owner: "builder" } },
      });
      const wire = {
        ...createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
        builder: {
          join: "and",
          rules: [
            {
              id: "r1",
              field: "value",
              operator: vector.operator,
              ...(vector.operand === undefined
                ? {}
                : { value: vector.operand }),
            },
          ],
        },
      };
      const rows = vector.values.map((value) => ({
        value:
          typeof value === "string" && value.startsWith("2026-")
            ? `${value}T12:00:00Z`
            : value,
      }));
      const local = createFilterEvaluator(schema, wire, { now: 0 });
      const server = translateQuery(schema, wire, translator, { now: 0 });
      expect(rows.flatMap((row, i) => (local(row) ? [i] : []))).toEqual(
        vector.matches,
      );
      expect(
        rows.flatMap((row, i) => (server.matches(row) ? [i] : [])),
      ).toEqual(vector.matches);
    });
  for (const [id, preset] of Object.entries(fieldPresets))
    it(`preset ${id} retains its value family`, () => {
      const schema = defineQuerySchema({
        id: "presets",
        version: 1,
        fields: { value: { ...preset, owner: "builder", nullable: true } },
      });
      const wire = {
        ...createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
        builder: {
          join: "and",
          rules: [{ id: "r1", field: "value", operator: "empty" }],
        },
      };
      expect(
        createFilterEvaluator(schema, wire, { now: 0 })({ value: null }),
      ).toBe(true);
      expect(
        translateQuery(schema, wire, translator, { now: 0 }).matches({
          value: null,
        }),
      ).toBe(true);
    });
  it("keeps cross-field Any, duplicate same-field rules, search OR and tool AND", () => {
    const schema = defineQuerySchema({
      id: "composition",
      version: 1,
      fields: {
        amount: { type: "number", owner: "builder" },
        value: { type: "text", owner: "builder" },
        title: { type: "text", owner: "search" },
        alias: { type: "text", owner: "search" },
        state: { type: "enum", owner: "tabs" },
        date: { type: "date", owner: "date" },
      },
      tabs: [
        {
          id: "open",
          rules: [{ field: "state", operator: "enum.is", value: "open" }],
        },
      ],
    });
    const wire = createQuery(schema, {
      locale: "en-US",
      timeZone: "UTC",
      builder: {
        join: "or",
        rules: [
          { id: "a", field: "amount", operator: "number.lt", value: 2 },
          { id: "b", field: "amount", operator: "number.gt", value: 8 },
          { id: "c", field: "value", operator: "text.is", value: "yes" },
        ],
      },
      search: "match",
      tabId: "open",
      date: {
        operator: "date.between",
        value: [
          { kind: "day", value: "2026-01-01" },
          { kind: "day", value: "2026-01-31" },
        ],
      },
    });
    const base = {
      amount: 1,
      value: "no",
      title: "",
      alias: "MATCH",
      state: "open",
      date: "2026-01-15",
    };
    const rows = [
      base,
      { ...base, amount: 9 },
      { ...base, amount: 5, value: "yes" },
      { ...base, amount: 5 },
      { ...base, alias: "no" },
      { ...base, state: "closed" },
      { ...base, date: "2026-02-01" },
    ];
    const local = createFilterEvaluator(schema, wire, { now: 0 });
    const server = translateQuery(schema, wire, translator, { now: 0 });
    expect(rows.map(local)).toEqual([
      true,
      true,
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(rows.map((row) => server.matches(row))).toEqual([
      true,
      true,
      true,
      false,
      false,
      false,
      false,
    ]);
    for (const join of ["and", "or"] as const) {
      const empty = {
        ...wire,
        search: "",
        tabId: null,
        date: null,
        builder: { join, rules: [] },
      };
      expect(createFilterEvaluator(schema, empty, { now: 0 })(base)).toBe(true);
      expect(
        translateQuery(schema, empty, translator, { now: 0 }).matches(base),
      ).toBe(true);
    }
  });
  it("binds injection-like text as data and rejects missing translators", () => {
    const schema = defineQuerySchema({
      id: "binding",
      version: 1,
      fields: { value: { type: "text", owner: "builder" } },
    });
    const malicious = "'; DROP TABLE synthetic; --";
    const query = createQuery(schema, {
      locale: "en-US",
      timeZone: "UTC",
      builder: {
        join: "and",
        rules: [
          { id: "a", field: "value", operator: "text.is", value: malicious },
        ],
      },
    });
    const result = translateQuery(schema, query, translator, { now: 0 });
    expect(result.sql).not.toContain(malicious);
    expect(result.parameters).toEqual([malicious]);
    expect(() =>
      translateQuery(
        schema,
        query,
        { ...translator, operators: {} },
        { now: 0 },
      ),
    ).toThrow("Invalid Tableweave contract.");
  });
});
