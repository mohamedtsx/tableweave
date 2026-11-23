import { describe, expect, it } from "vitest";
import {
  createQuery,
  defineQuerySchema,
  getFilterIdentity,
  getQueryIdentity,
  parseQuery,
} from "../../packages/react/src/contracts/index.js";
import {
  compileFilter,
  createFilterEvaluator,
  relativePresets,
  resolveDateValue,
  translateQuery,
} from "../../packages/react/src/filters/index.js";
import { translator } from "./translator.js";

const context = {
  now: Date.parse("2026-01-15T12:00:00Z"),
  locale: "en-US",
  timeZone: "UTC",
};
const field = { type: "date", owner: "builder", rollingDays: [3] } as const;
describe("explicit symbolic calendar and instant contracts", () => {
  it("rejects missing clock/context and unrepresentable calendar windows", () => {
    expect(() =>
      resolveDateValue(
        field,
        { kind: "day", value: "2026-01-01" },
        { ...context, now: Number.NaN },
      ),
    ).toThrow("Invalid Tableweave contract.");
    expect(() =>
      resolveDateValue(
        field,
        { kind: "day", value: "2026-01-01" },
        { ...context, timeZone: "bad/zone" },
      ),
    ).toThrow("Invalid Tableweave contract.");
    expect(() =>
      resolveDateValue(field, { kind: "day", value: "9999-12-31" }, context),
    ).toThrow("Invalid Tableweave contract.");
  });
  const expected = {
    today: ["2026-01-15", "2026-01-16"],
    yesterday: ["2026-01-14", "2026-01-15"],
    tomorrow: ["2026-01-16", "2026-01-17"],
    thisWeek: ["2026-01-11", "2026-01-18"],
    lastWeek: ["2026-01-04", "2026-01-11"],
    nextWeek: ["2026-01-18", "2026-01-25"],
    thisMonth: ["2026-01-01", "2026-02-01"],
    lastMonth: ["2025-12-01", "2026-01-01"],
    nextMonth: ["2026-02-01", "2026-03-01"],
    thisYear: ["2026-01-01", "2027-01-01"],
    lastYear: ["2025-01-01", "2026-01-01"],
    nextYear: ["2027-01-01", "2028-01-01"],
  };
  for (const preset of relativePresets)
    it(`resolves ${preset} with the supplied clock`, () => {
      const [start, endExclusive] = expected[preset];
      expect(
        resolveDateValue(field, { kind: "relative", preset }, context),
      ).toEqual({ kind: "days", start, endExclusive });
    });
  it("uses locale week starts and configured rolling calendar days", () => {
    expect(
      resolveDateValue(
        field,
        { kind: "relative", preset: "thisWeek" },
        { ...context, locale: "en-GB" },
      ),
    ).toEqual({
      kind: "days",
      start: "2026-01-12",
      endExclusive: "2026-01-19",
    });
    expect(
      resolveDateValue(
        field,
        { kind: "rolling", days: 3, direction: "past" },
        context,
      ),
    ).toEqual({
      kind: "days",
      start: "2026-01-13",
      endExclusive: "2026-01-16",
    });
    expect(
      resolveDateValue(
        field,
        { kind: "rolling", days: 3, direction: "future" },
        context,
      ),
    ).toEqual({
      kind: "days",
      start: "2026-01-15",
      endExclusive: "2026-01-18",
    });
  });
  for (const [day, start, end, hours] of [
    ["2026-03-08", "2026-03-08T05:00:00Z", "2026-03-09T04:00:00Z", 23],
    ["2026-11-01", "2026-11-01T04:00:00Z", "2026-11-02T05:00:00Z", 25],
  ] as const)
    it(`includes the full ${hours}-hour DST end day`, () => {
      const schema = defineQuerySchema({
        id: "dst",
        version: 1,
        fields: { value: { type: "datetime", owner: "builder" } },
      });
      const query = createQuery(schema, {
        locale: "en-US",
        timeZone: "America/New_York",
        builder: {
          join: "and",
          rules: [
            {
              id: "r1",
              field: "value",
              operator: "date.between",
              value: [
                { kind: "day", value: day },
                { kind: "day", value: day },
              ],
            },
          ],
        },
      });
      const interval = compileFilter(schema, query, { now: 0 }).builder.rules[0]
        ?.interval;
      expect(interval).toEqual({
        kind: "instants",
        start: Date.parse(start),
        endExclusive: Date.parse(end),
      });
      expect(Date.parse(end) - Date.parse(start)).toBe(hours * 3_600_000);
      const values = [
        new Date(Date.parse(start) - 1).toISOString(),
        start,
        new Date(Date.parse(end) - 1).toISOString(),
        end,
      ];
      const local = createFilterEvaluator(schema, query, { now: 0 });
      const server = translateQuery(schema, query, translator, { now: 0 });
      expect(values.map((value) => local({ value }))).toEqual([
        false,
        true,
        true,
        false,
      ]);
      expect(values.map((value) => server.matches({ value }))).toEqual([
        false,
        true,
        true,
        false,
      ]);
    });
  it("preserves explicit instants across offsets and date-only days across zones", () => {
    const timestamp = { type: "datetime", owner: "builder" } as const;
    expect(
      resolveDateValue(
        timestamp,
        { kind: "instant", value: "2026-01-15T07:00:00-05:00" },
        context,
      ),
    ).toEqual({
      kind: "instants",
      start: context.now,
      endExclusive: context.now + 1,
    });
    expect(
      resolveDateValue(
        field,
        { kind: "day", value: "2026-01-15" },
        { ...context, timeZone: "Pacific/Auckland" },
      ),
    ).toEqual({
      kind: "days",
      start: "2026-01-15",
      endExclusive: "2026-01-16",
    });
    expect(
      resolveDateValue(
        field,
        { kind: "relative", preset: "today" },
        {
          ...context,
          now: Date.parse("2026-01-15T01:00:00Z"),
          timeZone: "America/New_York",
        },
      ),
    ).toEqual({
      kind: "days",
      start: "2026-01-14",
      endExclusive: "2026-01-15",
    });
  });
  it("keeps symbolic wire intent and stable same-boundary identities", () => {
    const schema = defineQuerySchema({
      id: "relative",
      version: 1,
      fields: { value: field },
    });
    const query = createQuery(schema, {
      locale: "en-US",
      timeZone: "UTC",
      builder: {
        join: "and",
        rules: [
          {
            id: "r1",
            field: "value",
            operator: "date.on",
            value: { kind: "relative", preset: "today" },
          },
        ],
      },
    });
    const first = getFilterIdentity(schema, query, context);
    expect(getFilterIdentity(schema, query, { now: context.now + 1 })).toBe(
      first,
    );
    expect(
      getFilterIdentity(schema, query, { now: context.now + 86_400_000 }),
    ).not.toBe(first);
    expect(getQueryIdentity(schema, query, context)).toBe(
      getQueryIdentity(schema, query, { now: context.now + 1 }),
    );
    expect(query.builder.rules[0]?.value).toEqual({
      kind: "relative",
      preset: "today",
    });
  });
  it("rejects invalid, incomplete, reversed and mixed-kind applied dates", () => {
    const schema = defineQuerySchema({
      id: "invalid-date",
      version: 1,
      fields: { value: field },
    });
    const base = createQuery(schema, { locale: "en-US", timeZone: "UTC" });
    for (const value of [
      "2026-01-01",
      { kind: "day", value: "2026-02-30" },
      { kind: "instant", value: "2026-01-01T00:00:00Z" },
      { kind: "rolling", days: 4, direction: "past" },
      { kind: "relative", preset: "unknown" },
    ]) {
      expect(
        parseQuery(schema, {
          ...base,
          builder: {
            join: "and",
            rules: [{ id: "a", field: "value", operator: "date.on", value }],
          },
        }).success,
      ).toBe(false);
    }
    for (const value of [
      [{ kind: "day", value: "2026-01-01" }],
      [
        { kind: "day", value: "2026-02-01" },
        { kind: "day", value: "2026-01-01" },
      ],
    ]) {
      expect(
        parseQuery(schema, {
          ...base,
          builder: {
            join: "and",
            rules: [
              { id: "a", field: "value", operator: "date.between", value },
            ],
          },
        }).success,
      ).toBe(false);
    }
    const timestamp = defineQuerySchema({
      id: "timestamp",
      version: 1,
      fields: { value: { type: "datetime", owner: "builder" } },
    });
    expect(
      parseQuery(timestamp, {
        ...base,
        schemaId: "timestamp",
        builder: {
          join: "and",
          rules: [
            {
              id: "a",
              field: "value",
              operator: "date.between",
              value: [
                { kind: "day", value: "2026-01-01" },
                { kind: "instant", value: "2026-01-01T12:00:00Z" },
              ],
            },
          ],
        },
      }).success,
    ).toBe(false);
  });
  it("enforces standalone range/single modes, presets and explicit bounds", () => {
    const definition = {
      id: "bounds",
      version: 1,
      fields: {
        value: {
          type: "date",
          owner: "date",
          relativePresets: ["today"],
          min: { kind: "day", value: "2026-01-01" },
          max: { kind: "day", value: "2026-01-31" },
        },
      },
    } as const;
    const schema = defineQuerySchema(definition);
    const query = createQuery(schema, { locale: "en-US", timeZone: "UTC" });
    const on = {
      operator: "date.on",
      value: { kind: "day", value: "2026-01-15" },
    };
    expect(parseQuery(schema, { ...query, date: on }).success).toBe(false);
    expect(
      parseQuery(
        defineQuerySchema({ ...definition, date: { mode: "single" } }),
        { ...query, date: on },
      ).success,
    ).toBe(true);
    expect(
      parseQuery(schema, {
        ...query,
        date: {
          operator: "date.on",
          value: { kind: "relative", preset: "yesterday" },
        },
      }).success,
    ).toBe(false);
    const relative = createQuery(schema, {
      locale: "en-US",
      timeZone: "UTC",
      date: {
        operator: "date.on",
        value: { kind: "relative", preset: "today" },
      },
    });
    expect(() => compileFilter(schema, relative, context)).not.toThrow();
    expect(() =>
      compileFilter(schema, relative, {
        now: Date.parse("2026-02-01T00:00:00Z"),
      }),
    ).toThrow();
    expect(
      parseQuery(schema, {
        ...query,
        date: {
          operator: "date.between",
          value: [
            { kind: "day", value: "2026-01-01" },
            { kind: "day", value: "2026-02-01" },
          ],
        },
      }).success,
    ).toBe(false);
  });
});
