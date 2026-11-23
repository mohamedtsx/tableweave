import { describe, expect, it } from "vitest";
import {
  createQuery,
  defineQuerySchema,
  parseQuery,
} from "../../packages/react/src/contracts/index.js";

function schema() {
  return defineQuerySchema({
    id: "synthetic",
    version: 1,
    fields: {
      amount: { type: "number", owner: "builder", sort: true },
      description: { type: "text", owner: "search" },
      status: { type: "enum", owner: "tabs", values: ["open", "closed"] },
      booked: { type: "date", owner: "date" },
    },
    tabs: [
      { id: "all", rules: [] },
      {
        id: "open",
        rules: [{ field: "status", operator: "enum.is", value: "open" }],
      },
    ],
  });
}

describe("schema/query producer contract", () => {
  it("creates explicit-context defaults without fetching or hidden clocks", () => {
    const s = schema();
    const query = createQuery(s, { locale: "en-US", timeZone: "UTC" });
    expect(query.pagination).toEqual({ pageIndex: 0, pageSize: 10 });
    expect(query.builder).toEqual({ join: "and", rules: [] });
    expect(parseQuery(s, query).success).toBe(true);
    expect(JSON.parse(JSON.stringify(s)).fields.amount.owner).toBe("builder");
  });
  it("rejects owner bypass, stale versions and unknown sort fields", () => {
    const s = schema();
    const base = createQuery(s, { locale: "en-US", timeZone: "UTC" });
    for (const change of [
      { schemaVersion: 2 },
      {
        builder: {
          join: "and",
          rules: [
            { id: "r1", field: "status", operator: "enum.is", value: "open" },
          ],
        },
      },
      { sorting: [{ id: "description", desc: false }] },
    ])
      expect(parseQuery(s, { ...base, ...change }).success).toBe(false);
  });
  it("rejects incomplete ranges without altering existing input", () => {
    const s = schema();
    const base = createQuery(s, { locale: "en-US", timeZone: "UTC" });
    const invalid = {
      ...base,
      builder: {
        join: "and",
        rules: [
          { id: "r1", field: "amount", operator: "number.between", value: [0] },
        ],
      },
    };
    expect(parseQuery(s, invalid).success).toBe(false);
    expect(base.builder.rules).toEqual([]);
    expect(invalid.builder.rules[0]?.value).toEqual([0]);
  });
});
