import { describe, expect, it, vi } from "vitest";
import {
  canonicalJson,
  createQuery,
} from "../../../packages/react/src/contracts/index.js";
import {
  assertTableController,
  assertTableDefinition,
  TableDefinitionError,
} from "../../../packages/react/src/table/definition.js";
import type { DefineTableInput } from "../../../packages/react/src/table/types.js";
import { input, type Item, make, schema } from "./fixtures.js";

describe("explicit reorder definition metadata — authored, not runtime verified", () => {
  it("defaults both axes off, independently of selection, tools or manual ordering", () => {
    for (const reordering of [undefined, {}]) {
      const definition = make({
        ...input(),
        selection: "multiple",
        tools: { builder: "hidden" },
        ...(reordering === undefined ? {} : { reordering }),
      });
      expect(definition.reordering).toEqual({ rows: false, columns: false });
      expect(Object.isFrozen(definition.reordering)).toBe(true);
      expect(() => assertTableDefinition(definition)).not.toThrow();
    }
  });

  it.each([
    [{ rows: true }, { rows: true, columns: false }],
    [{ columns: true }, { rows: false, columns: true }],
    [
      { rows: false, columns: true },
      { rows: false, columns: true },
    ],
    [
      { rows: true, columns: true },
      { rows: true, columns: true },
    ],
  ])("captures explicit axis flags %j", (flags, expected) => {
    const definition = make({ ...input(), reordering: flags });
    expect(definition.reordering).toEqual(expected);
    expect(Object.isFrozen(flags)).toBe(false);
    expect(definition.reordering).not.toBe(flags);
  });

  it("captures values once without freezing caller containers or invoking record ports", () => {
    const getRowId = vi.fn((record: Item) => record.id);
    const flags = { rows: true, columns: false };
    const config = { ...input(), getRowId, reordering: flags };
    const definition = make(config);
    flags.rows = false;
    flags.columns = true;
    expect(definition.reordering).toEqual({ rows: true, columns: false });
    expect(Object.isFrozen(config)).toBe(false);
    expect(Object.isFrozen(flags)).toBe(false);
    expect(getRowId).not.toHaveBeenCalled();
  });

  it("does not add flags to native/controller definition identity or create another controller", () => {
    const plain = make(input());
    const enabled = make({
      ...input(),
      reordering: { rows: true, columns: true },
    });
    expect(canonicalJson(plain.native.controllerDefinition)).toBe(
      canonicalJson(enabled.native.controllerDefinition),
    );
    expect(Reflect.ownKeys(enabled.native)).toEqual(
      Reflect.ownKeys(plain.native),
    );
    const controller = enabled.createController({
      now: () => 0,
      initial: {
        query: createQuery(schema, { locale: "en", timeZone: "UTC" }),
      },
    });
    expect(assertTableController(enabled, controller)).toBe(
      enabled.native.controllerDefinition,
    );
    expect(controller.getSnapshot().selection).toEqual({});
    controller.dispose();
  });

  it("captures own flag descriptors once without ordinary value gets", () => {
    const reads: string[] = [];
    const flags = new Proxy(
      { rows: true, columns: false },
      {
        get(target, key, receiver) {
          reads.push(`get:${String(key)}`);
          return Reflect.get(target, key, receiver);
        },
        getOwnPropertyDescriptor(target, key) {
          reads.push(`descriptor:${String(key)}`);
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      },
    );
    const definition = make({ ...input(), reordering: flags });
    expect(definition.reordering.rows).toBe(true);
    expect(reads).toEqual(["descriptor:rows", "descriptor:columns"]);
  });

  it.each([
    undefined,
    null,
    true,
    [],
    { rows: undefined },
    { columns: null },
    { rows: "true" },
    { columns: 1 },
    { rows: true, unknown: true },
    { [Symbol("not-a-flag")]: true },
    Object.create({ rows: true }),
  ])("rejects malformed present configuration %j", (reordering) => {
    // Adversarial structural values are denial fixtures, never allowing proofs.
    const config = { ...input(), reordering } as DefineTableInput<
      typeof schema,
      Item
    >;
    expect(() => make(config)).toThrow(TableDefinitionError);
  });

  it("rejects accessors without invoking their bodies", () => {
    const getter = vi.fn(() => true);
    const flags = Object.defineProperty({}, "rows", {
      enumerable: true,
      get: getter,
    });
    expect(() => make({ ...input(), reordering: flags })).toThrow(
      TableDefinitionError,
    );
    expect(getter).not.toHaveBeenCalled();
  });

  it("rejects nonenumerable consumed flags without freezing the source", () => {
    const flags = Object.defineProperty({}, "columns", { value: true });
    expect(() => make({ ...input(), reordering: flags })).toThrow(
      TableDefinitionError,
    );
    expect(Object.isFrozen(flags)).toBe(false);
  });

  it("does not expose a throwing inherited-flag reflection error", () => {
    const flags = new Proxy(
      {},
      {
        has() {
          throw new Error("Synthetic reflection failure");
        },
      },
    );
    expect(() => make({ ...input(), reordering: flags })).toThrow(
      TableDefinitionError,
    );
  });
});
