import { describe, expect, it } from "vitest";
import { ContractError } from "../../../packages/react/src/contracts/errors.js";
import {
  createQuery,
  defineQuerySchema,
} from "../../../packages/react/src/contracts/index.js";
import type { QuerySchema } from "../../../packages/react/src/contracts/types.js";
import { validateRuleDraft } from "../../../packages/react/src/filters/editor-draft.js";
import {
  getBuilderFields,
  getFieldOperators,
} from "../../../packages/react/src/filters/editor-fields.js";
import { invertRule } from "../../../packages/react/src/filters/inverse.js";
import { compileFilter } from "../../../packages/react/src/filters/plan.js";
import {
  builtinOperators,
  operatorAllowed,
} from "../../../packages/react/src/filters/registry.js";
import { now, query, registry, schema, validation } from "./fixtures.js";

describe("configured builder fields and authoritative operators", () => {
  it("excludes search/tabs/date/none even when neutral; hidden builder fields remain available", () => {
    const accepted = query();
    expect(accepted.search).toBe("");
    expect(accepted.tabId).toBe("all");
    expect(accepted.date).toBeNull();
    const fields = getBuilderFields(schema);
    expect(fields.map(({ id }) => id)).toEqual([
      "amount",
      "customBool",
      "customText",
      "day",
      "enabled",
      "hidden",
      "instant",
      "name",
      "nullable",
      "restricted",
      "status",
      "tags",
      "trimmed",
    ]);
    expect(fields.find(({ id }) => id === "hidden")?.field).toBe(
      schema.fields.hidden,
    );
    expect(Object.isFrozen(fields)).toBe(true);
    expect(Object.isFrozen(fields[0])).toBe(true);
  });

  it("uses the existing family/nullable/explicit/custom policy rather than guessing from labels", () => {
    for (const { id, field } of getBuilderFields(schema))
      expect(
        getFieldOperators(schema, id, registry).map((operator) => operator.id),
      ).toEqual(
        registry.descriptors
          .filter((operator) => operatorAllowed(field, operator))
          .map(({ id: operator }) => operator),
      );
    expect(getFieldOperators(schema, "enabled").map(({ id }) => id)).toEqual([
      "boolean.isTrue",
      "boolean.isFalse",
    ]);
    expect(getFieldOperators(schema, "nullable").map(({ id }) => id)).toEqual([
      "empty",
      "notEmpty",
      "boolean.isTrue",
      "boolean.isFalse",
    ]);
    expect(getFieldOperators(schema, "restricted").map(({ id }) => id)).toEqual(
      ["number.eq", "number.gt"],
    );
    expect(
      getFieldOperators(schema, "customBool", registry).map(({ id }) => id),
    ).toEqual(["custom.false"]);
    expect(getFieldOperators(schema, "customBool")).toEqual([]);
    expect(getFieldOperators(schema as QuerySchema, "search")).toEqual([]);
    expect(getFieldOperators(schema as QuerySchema, "toString")).toEqual([]);
    expect(getFieldOperators(schema as QuerySchema, "unknown")).toEqual([]);
  });

  for (const type of [
    "text",
    "number",
    "enum",
    "set",
    "boolean",
    "date",
    "datetime",
  ] as const)
    it(`offers the actual ${type} family, not another family's predicates`, () => {
      const dynamic = defineQuerySchema({
        id: "family",
        version: 1,
        fields: { value: { type, owner: "builder" } },
      });
      expect(getFieldOperators(dynamic, "value").map(({ id }) => id)).toEqual(
        builtinOperators
          .filter(
            (operator) =>
              operator.types.includes(type) &&
              (type !== "boolean" ||
                (operator.cardinality === "none" &&
                  !["empty", "notEmpty"].includes(operator.id))),
          )
          .map(({ id }) => id),
      );
    });
});

describe("local rule draft validation", () => {
  it("keeps same-field rules independently identified and replaces only the requested ID", () => {
    const first = validateRuleDraft(
      schema,
      query(),
      { id: "first", field: "amount", operator: "number.gte", value: 0 },
      validation,
    );
    if (first.status !== "valid") throw new Error("Expected first rule");
    const second = validateRuleDraft(
      schema,
      first.query,
      { id: "second", field: "amount", operator: "number.lte", value: 10 },
      validation,
    );
    if (second.status !== "valid")
      throw new Error("Expected independent second rule");
    const edited = validateRuleDraft(
      schema,
      second.query,
      { id: "first", field: "amount", operator: "number.gte", value: 2 },
      { ...validation, replaceRuleId: "first" },
    );
    expect(edited.status).toBe("valid");
    if (edited.status === "valid")
      expect(edited.query.builder.rules).toEqual([
        { id: "first", field: "amount", operator: "number.gte", value: 2 },
        { id: "second", field: "amount", operator: "number.lte", value: 10 },
      ]);
    expect(second.query.builder.rules[0]?.value).toBe(0);
  });

  it("appends/replaces one normalized candidate without changing accepted criteria or query context", () => {
    const accepted = query();
    const before = JSON.stringify(accepted);
    const added = validateRuleDraft(
      schema,
      accepted,
      { id: "rule-1", field: "amount", operator: "number.eq", value: 0 },
      validation,
    );
    expect(added.status).toBe("valid");
    if (added.status !== "valid") throw new Error("Expected valid draft");
    expect(added.rule).toEqual({
      id: "rule-1",
      field: "amount",
      operator: "number.eq",
      value: 0,
    });
    expect(added.query.pagination).toEqual(accepted.pagination);
    expect(added.query.sorting).toEqual(accepted.sorting);
    expect(added.query.tabId).toBe(accepted.tabId);
    const replaced = validateRuleDraft(
      schema,
      added.query,
      { id: "rule-1", field: "name", operator: "text.contains", value: "new" },
      { ...validation, replaceRuleId: "rule-1" },
    );
    expect(replaced.status).toBe("valid");
    if (replaced.status !== "valid")
      throw new Error("Expected valid replacement");
    expect(replaced.query.builder.rules).toEqual([
      { id: "rule-1", field: "name", operator: "text.contains", value: "new" },
    ]);
    expect(JSON.stringify(accepted)).toBe(before);
    expect(added.query.builder.rules[0]).toBe(added.rule);
    expect(Object.isFrozen(added.rule)).toBe(true);
    expect(accepted.builder.rules).toEqual([]);
  });

  for (const [field, operator, value] of [
    ["name", "text.contains", "   "],
    ["amount", "number.eq", 0],
    ["amount", "number.between", [0, 2]],
    ["status", "enum.is", 0],
    ["tags", "set.anyOf", ["red", "blue"]],
    ["customBool", "custom.false", false],
    ["customText", "custom.blank", ""],
    ["day", "date.on", { kind: "day", value: "2024-03-10" }],
    ["day", "date.on", { kind: "relative", preset: "today" }],
    ["day", "date.on", { kind: "rolling", direction: "past", days: 7 }],
    [
      "instant",
      "date.on",
      { kind: "instant", value: "2024-03-10T17:00:00.000Z" },
    ],
  ] as const)
    it(`validates typed ${field}/${operator} with authoritative zero/false/text/date semantics`, () => {
      const candidate = { id: "rule", field, operator, value };
      const result = validateRuleDraft(schema, query(), candidate, validation);
      expect(result.status).toBe("valid");
      if (result.status === "valid") {
        expect(result.rule.value).toEqual(
          field === "tags" ? ["blue", "red"] : value,
        );
        expect(
          compileFilter(schema, result.query, validation).builder.rules,
        ).toHaveLength(1);
      }
    });

  for (const operator of [
    "boolean.isTrue",
    "boolean.isFalse",
    "empty",
    "notEmpty",
  ])
    it(`validates ${operator} without inventing a false/null operand`, () => {
      const result = validateRuleDraft(
        schema,
        query(),
        { id: "rule", field: "nullable", operator },
        validation,
      );
      expect(result.status).toBe("valid");
      if (result.status === "valid")
        expect(Object.hasOwn(result.rule, "value")).toBe(false);
      expect(
        validateRuleDraft(
          schema,
          query(),
          { id: "rule", field: "nullable", operator, value: false },
          validation,
        ).status,
      ).toBe("invalid");
    });

  for (const candidate of [
    {},
    { id: "rule" },
    { id: "rule", field: "amount" },
    { id: "rule", field: "amount", operator: "number.eq" },
    { id: "rule", field: "amount", operator: "number.eq", value: "" },
    { id: "rule", field: "trimmed", operator: "text.is", value: "  " },
    { id: "rule", field: "amount", operator: "number.between", value: [0] },
    {
      id: "rule",
      field: "amount",
      operator: "number.between",
      value: [0, undefined],
    },
    {
      id: "rule",
      field: "day",
      operator: "date.between",
      value: [{ kind: "day", value: "2024-03-10" }],
    },
    { id: "rule", field: "tags", operator: "set.anyOf", value: [] },
  ])
    it(`keeps incomplete local draft out of applied state: ${JSON.stringify(candidate)}`, () => {
      const accepted = query();
      const result = validateRuleDraft(schema, accepted, candidate, validation);
      expect(result.status).toBe("incomplete");
      expect(Object.hasOwn(result, "query")).toBe(false);
      expect(accepted.builder.rules).toEqual([]);
    });

  for (const [field, operator, value] of [
    ["amount", "number.eq", "0"],
    ["amount", "number.eq", " "],
    ["amount", "number.eq", false],
    ["amount", "number.eq", null],
    ["amount", "number.eq", Number.NaN],
    ["amount", "number.eq", Number.POSITIVE_INFINITY],
    ["amount", "number.between", [2, 0]],
    ["amount", "number.between", [0, 1, 2]],
    ["status", "enum.is", "0"],
    ["status", "enum.is", 2],
    ["tags", "set.anyOf", ["red", "blue", "red"]],
    ["enabled", "empty", undefined],
    ["restricted", "number.ne", 1],
    ["amount", "text.contains", "x"],
    ["search", "text.contains", "x"],
    ["tab", "enum.is", "all"],
    ["dateTool", "date.on", { kind: "day", value: "2024-03-10" }],
    ["ignored", "text.contains", "x"],
    ["customBool", "custom.false", true],
    ["day", "date.on", { kind: "day", value: "2024-02-30" }],
    ["day", "date.on", { kind: "instant", value: "2024-03-10T00:00:00Z" }],
    ["day", "date.on", { kind: "rolling", direction: "past", days: 8 }],
    ["day", "date.on", { kind: "day", value: "2026-01-01" }],
  ] as const)
    it(`rejects ${field}/${operator}/${JSON.stringify(value)} without coercion or accepted-state mutation`, () => {
      const accepted = query();
      const result = validateRuleDraft(
        schema,
        accepted,
        {
          id: "rule",
          field,
          operator,
          ...(value === undefined ? {} : { value }),
        },
        validation,
      );
      expect(result.status).toBe("invalid");
      expect(Object.hasOwn(result, "query")).toBe(false);
      expect(accepted.builder.rules).toEqual([]);
    });

  it("uses actual numeric range/dense-array and membership normalization, not a second engine", () => {
    const member = validateRuleDraft(
      schema,
      query(),
      {
        id: "rule",
        field: "tags",
        operator: "set.anyOf",
        value: ["red", "red"],
      },
      validation,
    );
    expect(member.status === "valid" && member.rule.value).toEqual(["red"]);
    const sparse = new Array(2);
    sparse[0] = 0;
    expect(
      validateRuleDraft(
        schema,
        query(),
        {
          id: "rule",
          field: "amount",
          operator: "number.between",
          value: sparse,
        },
        validation,
      ).status,
    ).toBe("invalid");
    const sparseMembers = new Array(1);
    expect(
      validateRuleDraft(
        schema,
        query(),
        {
          id: "rule",
          field: "tags",
          operator: "set.anyOf",
          value: sparseMembers,
        },
        validation,
      ).status,
    ).toBe("invalid");
  });

  it("rejects duplicates, missing/stale replacements and identity changes", () => {
    const added = validateRuleDraft(
      schema,
      query(),
      { id: "rule", field: "amount", operator: "number.eq", value: 1 },
      validation,
    );
    if (added.status !== "valid") throw new Error("Expected valid draft");
    const candidate = { ...added.rule, value: 2 };
    expect(
      validateRuleDraft(schema, added.query, candidate, validation),
    ).toMatchObject({ status: "invalid", issues: [{ code: "rule.id" }] });
    expect(
      validateRuleDraft(schema, added.query, candidate, {
        ...validation,
        replaceRuleId: "missing",
      }).status,
    ).toBe("invalid");
    expect(
      validateRuleDraft(
        schema,
        added.query,
        { ...candidate, id: "changed" },
        { ...validation, replaceRuleId: "rule" },
      ).status,
    ).toBe("invalid");
  });

  it("rejects max-rules appends but permits replacing at the limit", () => {
    const limited = defineQuerySchema({
      id: "limited",
      version: 1,
      fields: { amount: { type: "number", owner: "builder" } },
      limits: { maxRules: 1 },
    });
    const accepted = createQuery(limited, {
      locale: "en-US",
      timeZone: "UTC",
      builder: {
        join: "or",
        rules: [{ id: "a", field: "amount", operator: "number.eq", value: 1 }],
      },
    });
    expect(
      validateRuleDraft(
        limited,
        accepted,
        { id: "b", field: "amount", operator: "number.eq", value: 0 },
        { now },
      ).status,
    ).toBe("invalid");
    expect(
      validateRuleDraft(
        limited,
        accepted,
        { id: "a", field: "amount", operator: "number.eq", value: 0 },
        { now, replaceRuleId: "a" },
      ).status,
    ).toBe("valid");
  });

  it("uses the existing compiler's explicit clock/timezone/bounds and preserves symbolic dates", () => {
    const candidate = {
      id: "date-rule",
      field: "day",
      operator: "date.between",
      value: [
        { kind: "day", value: "2024-03-09" },
        { kind: "day", value: "2024-03-10" },
      ],
    };
    const result = validateRuleDraft(schema, query(), candidate, validation);
    expect(result.status).toBe("valid");
    if (result.status === "valid") {
      const interval = compileFilter(schema, result.query, validation).builder
        .rules[0]?.interval;
      expect(interval).toBeDefined();
      expect(result.rule.value).toEqual(candidate.value);
    }
    expect(
      validateRuleDraft(
        schema,
        query(),
        {
          id: "rule",
          field: "day",
          operator: "date.on",
          value: { kind: "relative", preset: "today" },
        },
        { ...validation, now: Date.parse("2026-01-01T17:00:00Z") },
      ).status,
    ).toBe("invalid");
    expect(
      validateRuleDraft(
        schema,
        query(),
        { id: "rule", field: "amount", operator: "number.eq", value: 0 },
        { ...validation, now: Number.NaN },
      ).status,
    ).toBe("invalid");
  });

  it("composes with existing inverse rules; a disallowed inverse remains disallowed", () => {
    const candidate = {
      id: "rule",
      field: "amount",
      operator: "number.eq",
      value: 0,
    };
    const inverse = invertRule(schema, candidate, { ...query(), registry });
    expect(inverse.operator).toBe("number.ne");
    expect(validateRuleDraft(schema, query(), inverse, validation).status).toBe(
      "valid",
    );
    expect(() =>
      invertRule(
        schema,
        { ...candidate, field: "restricted" },
        { ...query(), registry },
      ),
    ).toThrow();
  });

  it("reports only safe issue codes and never evaluates hostile candidate accessors", () => {
    let getters = 0;
    const hostile = {
      id: "rule",
      field: "amount",
      operator: "number.eq",
      get value() {
        getters++;
        throw new Error("synthetic-private-draft");
      },
    };
    expect(validateRuleDraft(schema, query(), hostile, validation)).toEqual({
      status: "invalid",
      issues: [{ code: "query.invalid" }],
    });
    expect(getters).toBe(0);
    const result = validateRuleDraft(
      schema,
      query(),
      {
        id: "rule",
        field: "synthetic-private-field",
        operator: "synthetic-private-operator",
        value: "synthetic-private-value",
      },
      validation,
    );
    expect(JSON.stringify(result)).not.toContain("synthetic-private");
    const mismatch = validateRuleDraft(
      schema,
      query(),
      {
        id: "rule",
        field: "customBool",
        operator: "custom.false",
        value: false,
      },
      { now },
    );
    expect(mismatch.status).toBe("invalid");
  });

  it("does not trust a forged ContractError payload thrown by a raw candidate proxy", () => {
    const candidate = new Proxy(
      {},
      {
        ownKeys() {
          throw new ContractError([
            {
              code: "synthetic-private-error" as "rule.value",
              field: "synthetic-private-field",
            },
          ]);
        },
      },
    );
    const result = validateRuleDraft(schema, query(), candidate, validation);
    expect(result).toEqual({
      status: "invalid",
      issues: [{ code: "query.invalid" }],
    });
    expect(JSON.stringify(result)).not.toContain("synthetic-private");
  });
});
