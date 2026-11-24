import { expect, test } from "vitest";
import { createQuery } from "../../../packages/react/src/contracts/query.js";
import { defineQuerySchema } from "../../../packages/react/src/contracts/schema.js";
import {
  createOperatorRegistry,
  defineOperator,
} from "../../../packages/react/src/filters/registry.js";
import { createNativeAdapter } from "../../../packages/react/src/tanstack/adapter.js";
import {
  createNativeController,
  defineNativeTable,
} from "../../../packages/react/src/tanstack/definition.js";
import { constructNativeFixture } from "../../native/fixtures.js";

const T1 = Date.parse("2026-03-08T12:00:00Z"),
  T2 = Date.parse("2026-03-09T12:00:00Z");
test("actual disabled native datetime filter honors the23-hour DST day and accepted evaluation time", () => {
  const schema = defineQuerySchema({
    id: "u2-dst",
    version: 1,
    pagination: { enabled: false },
    fields: {
      at: { type: "datetime", owner: "builder", relativePresets: ["today"] },
      rank: { type: "number", owner: "none", sort: true },
    },
  });
  const definition = defineNativeTable({
    schema,
    selection: true,
    getRowId: (row: { id: string; at: string; rank: number }) => row.id,
    columns: [
      { id: "at", accessorKey: "at" },
      { id: "rank", accessorKey: "rank" },
    ],
  });
  const query = createQuery(schema, {
    locale: "en-US",
    timeZone: "America/New_York",
    sorting: [{ id: "rank", desc: true }],
    builder: {
      join: "and",
      rules: [
        {
          id: "today",
          field: "at",
          operator: "date.on",
          value: { kind: "relative", preset: "today" },
        },
      ],
    },
  });
  let now = T1;
  const controller = createNativeController(definition, {
      initial: { query },
      now: () => now,
    }),
    adapter = createNativeAdapter(definition, controller);
  const records = Array.from({ length: 173 }, (_, i) => ({
    id: `d${i}`,
    at:
      i === 0
        ? "2026-03-08T04:59:59Z"
        : i === 1
          ? "2026-03-08T05:00:00Z"
          : i < 148
            ? "2026-03-08T06:00:00Z"
            : "2026-03-09T04:00:00Z",
    rank: i,
  }));
  const input = { mode: "client" as const, records },
    table = constructNativeFixture(adapter.getOptions(input));
  adapter.bindTable(table);
  const ids = () => table.getRowModel().rows.map((r) => r.id);
  expect(ids()).toEqual(
    records
      .slice(1, 148)
      .reverse()
      .map((r) => r.id),
  );
  expect(ids()).toHaveLength(147);
  now = T2;
  controller.dispatch({ type: "selection.change", update: { d1: true } });
  table.setOptions(adapter.getOptions(input));
  expect(controller.getSnapshot().evaluatedAt).toBe(T1);
  expect(ids()).toHaveLength(147);
  controller.dispatch({ type: "clock.tick" });
  table.setOptions(adapter.getOptions(input));
  expect(controller.getSnapshot().evaluatedAt).toBe(T2);
  expect(ids()).toEqual(
    records
      .slice(148)
      .reverse()
      .map((r) => r.id),
  );
  expect(controller.getSnapshot().selection).toEqual({});
});
test("valid idempotent custom normalization/evaluation runs in the real unsliced native pipeline at accepted time", () => {
  const contexts: number[] = [];
  let normalizations = 0;
  const operator = defineOperator({
    id: "custom.rounded",
    labelKey: "synthetic.rounded",
    types: ["number"],
    cardinality: "one",
    validate(value: unknown): value is number {
      return typeof value === "number" && Number.isFinite(value);
    },
    normalize(value: number) {
      normalizations++;
      return Math.round(value);
    },
    evaluate(raw: unknown, value: number, context) {
      contexts.push(context.now);
      return typeof raw === "number" && raw >= value && context.now >= T1;
    },
  });
  const registry = createOperatorRegistry([operator]);
  const schema = defineQuerySchema(
    {
      id: "u2-custom",
      version: 1,
      pagination: { enabled: false, defaultSize: 7, sizes: [7, 100] },
      fields: {
        amount: {
          type: "number",
          owner: "builder",
          sort: true,
          operators: ["custom.rounded"],
        },
      },
    },
    registry,
  );
  const definition = defineNativeTable({
    schema,
    evaluation: { registry },
    getRowId: (row: { id: string; amount: number }) => row.id,
    columns: [{ id: "amount", accessorKey: "amount" }],
  });
  const query = createQuery(
    schema,
    {
      locale: "en-US",
      timeZone: "UTC",
      sorting: [{ id: "amount", desc: false }],
      builder: {
        join: "and",
        rules: [
          {
            id: "custom",
            field: "amount",
            operator: "custom.rounded",
            value: 1.2,
          },
        ],
      },
    },
    { registry },
  );
  let now = T1;
  const controller = createNativeController(definition, {
      initial: { query },
      now: () => now,
    }),
    adapter = createNativeAdapter(definition, controller);
  const records = Array.from({ length: 173 }, (_, i) => ({
      id: `c${i}`,
      amount: i,
    })),
    input = { mode: "client" as const, records },
    table = constructNativeFixture(adapter.getOptions(input));
  adapter.bindTable(table);
  expect(table.getRowModel().rows.map((r) => r.id)).toEqual(
    records.slice(1).map((r) => r.id),
  );
  expect(contexts).toHaveLength(173);
  expect(contexts.every((value) => value === T1)).toBe(true);
  expect(normalizations).toBeGreaterThan(0);
  expect(controller.getSnapshot().query.builder.rules[0]?.value).toBe(1);
  now = T2;
  table.setOptions(adapter.getOptions(input));
  expect(table.getRowModel().rows).toHaveLength(172);
  expect(contexts.every((value) => value === T1)).toBe(true);
  expect(controller.getSnapshot().evaluatedAt).toBe(T1);
});
