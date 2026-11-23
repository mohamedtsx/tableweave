import { describe, expect, it } from "vitest";
import {
  createQuery,
  defineQuerySchema,
  getFilterIdentity,
  parseQuery,
} from "../../packages/react/src/contracts/index.js";
import {
  createFilterEvaluator,
  createOperatorRegistry,
  defineOperator,
  invertRule,
  translateQuery,
} from "../../packages/react/src/filters/index.js";
import { translator } from "./translator.js";

const context = { locale: "en-US", timeZone: "UTC" };
const rounded = defineOperator({
  id: "custom.rounded",
  labelKey: "synthetic.rounded",
  types: ["number"],
  cardinality: "one",
  inverse: "custom.outside",
  validate(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
  },
  normalize(value: number) {
    return Math.round(value * 100) / 100;
  },
  evaluate(raw: unknown, operand: number) {
    return typeof raw === "number" && Math.round(raw * 100) / 100 === operand;
  },
});
const outside = defineOperator({
  id: "custom.outside",
  labelKey: "synthetic.outside",
  types: ["number"],
  cardinality: "range",
  inverse: "custom.rounded",
  validate(value: unknown): value is readonly [number, number] {
    return (
      Array.isArray(value) &&
      value.length === 2 &&
      value.every((n) => typeof n === "number" && Number.isFinite(n)) &&
      value[0] <= value[1]
    );
  },
  evaluate(raw: unknown, operand: readonly [number, number]) {
    return typeof raw === "number" && (raw < operand[0] || raw > operand[1]);
  },
});
describe("explicit custom operator and accessor producer contracts", () => {
  it("sanitizes application callback failures and supports custom value-less predicates", () => {
    const none = defineOperator({
      id: "custom.present",
      labelKey: "synthetic.present",
      types: ["text"],
      cardinality: "none",
      validate(value: unknown): value is null {
        return value === null;
      },
      evaluate(raw: unknown) {
        return raw !== undefined;
      },
    });
    const registry = createOperatorRegistry([none]);
    const schema = defineQuerySchema(
      {
        id: "none",
        version: 1,
        fields: {
          value: {
            type: "text",
            owner: "builder",
            operators: ["custom.present"],
          },
        },
      },
      registry,
    );
    const query = createQuery(
      schema,
      {
        ...context,
        builder: {
          join: "and",
          rules: [{ id: "a", field: "value", operator: "custom.present" }],
        },
      },
      { registry },
    );
    expect(
      createFilterEvaluator(schema, query, { now: 0, registry })({
        value: null,
      }),
    ).toBe(true);
    const badAccessor = createFilterEvaluator(schema, query, {
      now: 0,
      registry,
      accessors: {
        value() {
          throw new Error("synthetic-private-payload");
        },
      },
    });
    expect(() => badAccessor({ value: "a" })).toThrow(
      "Invalid Tableweave contract.",
    );
    expect(() =>
      translateQuery(
        schema,
        query,
        {
          ...translator,
          all() {
            throw new Error("synthetic-private-payload");
          },
        },
        { now: 0, registry },
      ),
    ).toThrow("Invalid Tableweave contract.");
    const throwing = defineOperator({
      ...none,
      id: "custom.throw",
      evaluate() {
        throw new Error("synthetic-private-payload");
      },
    });
    const throwingRegistry = createOperatorRegistry([throwing]);
    const throwingSchema = defineQuerySchema(
      {
        id: "throwing",
        version: 1,
        fields: {
          value: {
            type: "text",
            owner: "builder",
            operators: ["custom.throw"],
          },
        },
      },
      throwingRegistry,
    );
    const throwingQuery = createQuery(
      throwingSchema,
      {
        ...context,
        builder: {
          join: "and",
          rules: [{ id: "a", field: "value", operator: "custom.throw" }],
        },
      },
      { registry: throwingRegistry },
    );
    expect(() =>
      createFilterEvaluator(throwingSchema, throwingQuery, {
        now: 0,
        registry: throwingRegistry,
      })({ value: "a" }),
    ).toThrow("Invalid Tableweave contract.");
  });
  it("normalizes typed custom precision, preserves missing semantics and requires replacement on inversion", () => {
    const registry = createOperatorRegistry([rounded, outside]);
    const schema = defineQuerySchema(
      {
        id: "custom",
        version: 1,
        fields: {
          value: {
            type: "number",
            owner: "builder",
            operators: ["custom.rounded", "custom.outside"],
          },
        },
      },
      registry,
    );
    const query = createQuery(
      schema,
      {
        ...context,
        builder: {
          join: "and",
          rules: [
            {
              id: "a",
              field: "value",
              operator: "custom.rounded",
              value: 1.234,
            },
          ],
        },
      },
      { registry },
    );
    expect(query.builder.rules[0]?.value).toBe(1.23);
    const evaluate = createFilterEvaluator(schema, query, { now: 0, registry });
    expect(
      [null, undefined, 1.231, 0].map((value) => evaluate({ value })),
    ).toEqual([false, false, true, false]);
    const rule = {
      id: "a",
      field: "value",
      operator: "custom.rounded",
      value: 1.23,
    };
    expect(() => invertRule(schema, rule, { ...context, registry })).toThrow();
    expect(
      invertRule(schema, rule, { ...context, registry, replacement: [1, 2] }),
    ).toEqual({ ...rule, operator: "custom.outside", value: [1, 2] });
    expect(() =>
      invertRule(schema, rule, { ...context, registry, replacement: [2, 1] }),
    ).toThrow();
    expect(rule.value).toBe(1.23);
    const server = translateQuery(
      schema,
      query,
      {
        ...translator,
        operators: {
          ...translator.operators,
          "custom.rounded": (item) => ({
            sql: "rounded(synthetic_value, ?)",
            parameters: [item.value],
            matches: (row) =>
              typeof row.value === "number" &&
              Number(row.value.toFixed(2)) === item.value,
          }),
        },
      },
      { now: 0, registry },
    );
    expect(server.matches({ value: 1.231 })).toBe(true);
    expect(server.matches({ value: null })).toBe(false);
    expect(() =>
      translateQuery(schema, query, translator, { now: 0, registry }),
    ).toThrow();
  });
  it("rejects duplicate, builtin-shadowing, broken inverse and nondeterministic normalizers", () => {
    expect(() => createOperatorRegistry([rounded, rounded])).toThrow();
    expect(() =>
      createOperatorRegistry([{ ...rounded, id: "number.eq" }]),
    ).toThrow();
    expect(() => createOperatorRegistry([rounded])).toThrow();
    const drifting = defineOperator({
      id: "custom.drift",
      labelKey: "synthetic.drift",
      types: ["number"],
      cardinality: "one",
      validate: rounded.validate,
      normalize: (value: number) => value + 1,
    });
    const registry = createOperatorRegistry([drifting]);
    const schema = defineQuerySchema(
      {
        id: "drifting",
        version: 1,
        fields: {
          value: {
            type: "number",
            owner: "builder",
            operators: ["custom.drift"],
          },
        },
      },
      registry,
    );
    expect(() =>
      createQuery(
        schema,
        {
          ...context,
          builder: {
            join: "and",
            rules: [
              { id: "a", field: "value", operator: "custom.drift", value: 1 },
            ],
          },
        },
        { registry },
      ),
    ).toThrow();
  });
  it("rejects absent client callbacks, custom matcher registration and wrong cardinality", () => {
    const remote = defineOperator({
      id: "custom.remote",
      labelKey: "synthetic.remote",
      types: ["text"],
      cardinality: "many",
      validate(value: unknown): value is readonly string[] {
        return (
          Array.isArray(value) && value.every((v) => typeof v === "string")
        );
      },
    });
    const registry = createOperatorRegistry([remote]);
    const schema = defineQuerySchema(
      {
        id: "remote",
        version: 1,
        fields: {
          value: {
            type: "text",
            owner: "builder",
            operators: ["custom.remote"],
          },
        },
      },
      registry,
    );
    const query = createQuery(
      schema,
      {
        ...context,
        builder: {
          join: "and",
          rules: [
            {
              id: "a",
              field: "value",
              operator: "custom.remote",
              value: ["a"],
            },
          ],
        },
      },
      { registry },
    );
    expect(() =>
      createFilterEvaluator(schema, query, { now: 0, registry }),
    ).toThrow();
    expect(
      parseQuery(
        schema,
        {
          ...query,
          builder: {
            join: "and",
            rules: [
              { id: "a", field: "value", operator: "custom.remote", value: [] },
            ],
          },
        },
        { registry },
      ).success,
    ).toBe(false);
    const search = defineQuerySchema({
      id: "search",
      version: 1,
      fields: { value: { type: "text", owner: "search" } },
      search: { matcher: "prefix", debounceMs: 0 },
    });
    const searchQuery = createQuery(search, { ...context, search: "ab" });
    expect(() =>
      createFilterEvaluator(search, searchQuery, { now: 0 }),
    ).toThrow();
    const evaluate = createFilterEvaluator(search, searchQuery, {
      now: 0,
      searchMatchers: {
        prefix: (raw, text) => typeof raw === "string" && raw.startsWith(text),
      },
    });
    expect(evaluate({ value: "abc" })).toBe(true);
    expect(evaluate({ value: "zabc" })).toBe(false);
  });
  it("retains async IDs without requiring a loaded options page, and uses computed values", () => {
    const schema = defineQuerySchema({
      id: "async",
      version: 1,
      fields: {
        person: { type: "enum", preset: "person", owner: "builder" },
        total: { type: "number", owner: "builder" },
      },
    });
    const query = createQuery(schema, {
      ...context,
      builder: {
        join: "and",
        rules: [
          {
            id: "a",
            field: "person",
            operator: "enum.is",
            value: "person.not-loaded",
          },
          { id: "b", field: "total", operator: "number.eq", value: 0 },
        ],
      },
    });
    const evaluate = createFilterEvaluator<
      typeof schema,
      { nested: { personId: string; total: number } }
    >(schema, query, {
      now: 0,
      accessors: {
        person: (row) => row.nested.personId,
        total: (row) => row.nested.total,
      },
    });
    expect(
      evaluate({ nested: { personId: "person.not-loaded", total: 0 } }),
    ).toBe(true);
    expect(query.builder.rules[0]?.value).toBe("person.not-loaded");
  });
  it("keeps compatible inverse values and canonical duplicates without editing IDs", () => {
    const schema = defineQuerySchema({
      id: "inverse",
      version: 1,
      fields: { value: { type: "text", owner: "builder", trim: true } },
    });
    const rule = {
      id: "a",
      field: "value",
      operator: "text.contains",
      value: " alpha ",
    };
    expect(invertRule(schema, rule, context)).toEqual({
      ...rule,
      operator: "text.notContains",
      value: "alpha",
    });
    const one = createQuery(schema, {
      ...context,
      builder: {
        join: "and",
        rules: [
          {
            id: "a",
            field: "value",
            operator: "text.contains",
            value: "alpha",
          },
        ],
      },
    });
    const duplicate = {
      ...one,
      builder: {
        join: "or",
        rules: [...one.builder.rules, { ...one.builder.rules[0], id: "b" }],
      },
    };
    expect(getFilterIdentity(schema, one, { now: 0 })).toBe(
      getFilterIdentity(schema, duplicate, { now: 0 }),
    );
    expect(
      createFilterEvaluator(
        schema,
        createQuery(schema, {
          ...context,
          builder: {
            join: "and",
            rules: [{ id: "e", field: "value", operator: "empty" }],
          },
        }),
        { now: 0 },
      )({ value: "  " }),
    ).toBe(true);
  });
});
