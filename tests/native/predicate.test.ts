import { describe, expect, it } from "vitest";
import {
  createQuery,
  defineQuerySchema,
} from "../../packages/react/src/contracts/index.js";
import {
  createOperatorRegistry,
  defineOperator,
} from "../../packages/react/src/filters/index.js";
import { createNativeAdapter } from "../../packages/react/src/tanstack/adapter.js";
import {
  createNativeController,
  defineNativeTable,
} from "../../packages/react/src/tanstack/index.js";
import { constructNativeFixture } from "./fixtures.js";

describe("composite carrier evaluation context", () => {
  it("requires explicit semantic accessors for computed/native aliases and evaluates them", () => {
    const schema = defineQuerySchema({
      id: "computed-native",
      version: 1,
      fields: { amount: { type: "number", owner: "builder", sort: true } },
    });
    const input = {
      schema,
      getRowId: (record: { id: string; money: { raw: number } }) => record.id,
      columns: [{ id: "amount", accessorKey: "money.raw" }],
    };
    expect(() => defineNativeTable(input)).toThrow();
    const def = defineNativeTable({
      ...input,
      evaluation: { accessors: { amount: (record) => record.money.raw } },
    });
    const query = createQuery(schema, {
      locale: "en-US",
      timeZone: "UTC",
      builder: {
        join: "and",
        rules: [
          { id: "amount", field: "amount", operator: "number.gt", value: 10 },
        ],
      },
    });
    const controller = createNativeController(def, {
      initial: { query },
      now: () => 0,
    });
    const adapter = createNativeAdapter(def, controller);
    const table = constructNativeFixture(
      adapter.getOptions({
        mode: "client",
        records: [
          { id: "small", money: { raw: 1 } },
          { id: "large", money: { raw: 20 } },
        ],
      }),
    );
    expect(table.getRowModel().rows.map((row) => row.id)).toEqual(["large"]);
  });
  it("evaluates exactly once per input row per recomputation with shared explicit registry", () => {
    let evaluations = 0;
    const operator = defineOperator({
      id: "custom.counted",
      labelKey: "synthetic.counted",
      types: ["number"],
      cardinality: "one",
      validate(value: unknown): value is number {
        return typeof value === "number" && Number.isFinite(value);
      },
      evaluate(raw: unknown, operand: number) {
        evaluations++;
        return typeof raw === "number" && raw >= operand;
      },
    });
    const registry = createOperatorRegistry([operator]);
    const schema = defineQuerySchema(
      {
        id: "counted",
        version: 1,
        fields: {
          amount: {
            type: "number",
            owner: "builder",
            operators: ["custom.counted"],
          },
        },
      },
      registry,
    );
    const def = defineNativeTable({
      schema,
      getRowId: (record: { id: string; amount: number }) => record.id,
      evaluation: { registry },
      columns: [{ id: "amount", accessorKey: "amount" }],
    });
    const query = createQuery(
      schema,
      {
        locale: "en-US",
        timeZone: "UTC",
        builder: {
          join: "and",
          rules: [
            {
              id: "count",
              field: "amount",
              operator: "custom.counted",
              value: 2,
            },
          ],
        },
      },
      { registry },
    );
    const controller = createNativeController(def, {
      initial: { query },
      now: () => 0,
    });
    const adapter = createNativeAdapter(def, controller);
    const input = {
      mode: "client" as const,
      records: [
        { id: "one", amount: 1 },
        { id: "two", amount: 2 },
        { id: "three", amount: 3 },
      ],
    };
    const table = constructNativeFixture(adapter.getOptions(input));
    expect(table.getRowModel().rows.map((row) => row.id)).toEqual([
      "two",
      "three",
    ]);
    expect(evaluations).toBe(3);
    table.getRowModel();
    expect(evaluations).toBe(3);
    controller.dispatch({
      type: "builder.commit",
      rule: {
        id: "count",
        field: "amount",
        operator: "custom.counted",
        value: 3,
      },
    });
    table.setOptions(adapter.getOptions(input));
    expect(table.getRowModel().rows.map((row) => row.id)).toEqual(["three"]);
    expect(evaluations).toBe(6);
  });
  it("does not require a client evaluator for a manual-server-only custom operator", () => {
    const operator = defineOperator({
      id: "custom.remote",
      labelKey: "synthetic.remote",
      types: ["number"],
      cardinality: "one",
      validate(value: unknown): value is number {
        return typeof value === "number";
      },
    });
    const registry = createOperatorRegistry([operator]);
    const schema = defineQuerySchema(
      {
        id: "remote",
        version: 1,
        fields: {
          amount: {
            type: "number",
            owner: "builder",
            operators: ["custom.remote"],
          },
        },
      },
      registry,
    );
    const def = defineNativeTable({
      schema,
      getRowId: (record: { id: string; amount: number }) => record.id,
      evaluation: { registry },
      columns: [{ id: "amount", accessorKey: "amount" }],
    });
    const query = createQuery(
      schema,
      {
        locale: "en-US",
        timeZone: "UTC",
        builder: {
          join: "and",
          rules: [
            {
              id: "remote",
              field: "amount",
              operator: "custom.remote",
              value: 2,
            },
          ],
        },
      },
      { registry },
    );
    const controller = createNativeController(def, {
      initial: { query },
      now: () => 0,
    });
    const adapter = createNativeAdapter(def, controller);
    const records = [{ id: "supplied", amount: 1 }];
    const table = constructNativeFixture(
      adapter.getOptions({
        mode: "server",
        records,
        pageInfo: { kind: "unknown", hasNextPage: false },
      }),
    );
    expect(table.getRowModel().rows.map((row) => row.id)).toEqual(["supplied"]);
    expect(() => adapter.getOptions({ mode: "client", records })).toThrow();
  });
  it("uses accepted evaluation time until an explicit relative-date tick changes the predicate", () => {
    let now = Date.parse("2026-01-01T12:00:00Z");
    const schema = defineQuerySchema({
      id: "relative-native",
      version: 1,
      fields: {
        day: { type: "date", owner: "builder", relativePresets: ["today"] },
      },
    });
    const def = defineNativeTable({
      schema,
      selection: true,
      getRowId: (record: { id: string; day: string }) => record.id,
      columns: [{ id: "day", accessorKey: "day" }],
    });
    const query = createQuery(schema, {
      locale: "en-US",
      timeZone: "UTC",
      builder: {
        join: "and",
        rules: [
          {
            id: "today",
            field: "day",
            operator: "date.on",
            value: { kind: "relative", preset: "today" },
          },
        ],
      },
    });
    const controller = createNativeController(def, {
      initial: { query },
      now: () => now,
    });
    const adapter = createNativeAdapter(def, controller);
    const input = {
      mode: "client" as const,
      records: [
        { id: "one", day: "2026-01-01" },
        { id: "two", day: "2026-01-02" },
      ],
    };
    const table = constructNativeFixture(adapter.getOptions(input));
    expect(table.getRowModel().rows.map((row) => row.id)).toEqual(["one"]);
    now = Date.parse("2026-01-02T12:00:00Z");
    controller.dispatch({ type: "selection.change", update: { one: true } });
    table.setOptions(adapter.getOptions(input));
    expect(table.getRowModel().rows.map((row) => row.id)).toEqual(["one"]);
    controller.dispatch({ type: "clock.tick" });
    table.setOptions(adapter.getOptions(input));
    expect(table.getRowModel().rows.map((row) => row.id)).toEqual(["two"]);
    expect(controller.getSnapshot().selection).toEqual({});
  });
});
