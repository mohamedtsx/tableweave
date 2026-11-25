import { describe, expect, it } from "vitest";
import {
  createRowMoveCoordinator,
  ReorderError,
  type RowMoveCoordinatorOptions,
  type RowMoveSettlement,
  type RowReorderFrame,
  reorderLimits,
} from "../../../packages/react/src/reordering/index.js";
import { fixture, frame, move } from "./fixtures.js";

describe("own-data capture without application record access", () => {
  it("safely observes native Promise rejections thrown by malformed metadata traps", async () => {
    const origin = new Proxy(frame(), {
      ownKeys() {
        throw Promise.reject(new Error("synthetic-trap-private"));
      },
    });
    expect(fixture().coordinator.begin(origin, move)).toEqual({
      status: "blocked",
      reason: "invalid",
    });
    await Promise.resolve();
    await Promise.resolve();
  });
  for (const patch of [
    { ownerEpoch: -1 },
    { ownerEpoch: 1.5 },
    { ownerEpoch: Number.MAX_SAFE_INTEGER + 1 },
    { sourceVersion: -1 },
    { sourceVersion: Number.POSITIVE_INFINITY },
    { definitionKey: "" },
    { scopeKey: "" },
    { queryIdentity: "" },
    { pageIndex: -1 },
    { pageIndex: 0.5 },
    { pageSize: 0 },
    { revision: undefined },
    { revision: Number.NaN },
    { revision: Number.NEGATIVE_INFINITY },
    { revision: {} },
  ])
    it(`rejects malformed stamp ${JSON.stringify(patch)}`, () => {
      const app = fixture();
      expect(app.coordinator.begin(frame(patch as never), move)).toEqual({
        status: "blocked",
        reason: "invalid",
      });
    });

  for (const input of [
    null,
    [],
    {},
    { instanceId: "", readCurrent: () => frame() },
    { instanceId: "x", readCurrent: null },
    { instanceId: "x", readCurrent: () => frame(), fetch: () => {} },
    new Date(),
  ])
    it("rejects malformed configuration with a fixed ReorderError", () => {
      expect(() =>
        createRowMoveCoordinator(input as RowMoveCoordinatorOptions),
      ).toThrowError(ReorderError);
      try {
        createRowMoveCoordinator(input as RowMoveCoordinatorOptions);
      } catch (error) {
        expect((error as Error).message).toBe(
          "Invalid Tableweave reorder operation.",
        );
      }
    });

  it("rejects metadata getters at every boundary without executing them", () => {
    let gets = 0;
    const accessor = () => {
      gets++;
      throw new Error("synthetic-secret");
    };
    const badConfig = Object.defineProperty(
      { instanceId: "x" },
      "readCurrent",
      { enumerable: true, get: accessor },
    );
    expect(() =>
      createRowMoveCoordinator(
        badConfig as unknown as RowMoveCoordinatorOptions,
      ),
    ).toThrowError(ReorderError);
    const app = fixture();
    const origin = Object.defineProperty({ ...frame() }, "stamp", {
      enumerable: true,
      get: accessor,
    });
    expect(app.coordinator.begin(origin, move).status).toBe("blocked");
    const stamp = Object.defineProperty({ ...frame().stamp }, "revision", {
      enumerable: true,
      get: accessor,
    });
    expect(app.coordinator.begin({ ...frame(), stamp }, move).status).toBe(
      "blocked",
    );
    const ids = Object.defineProperty(["a", "b", "c"], "1", {
      enumerable: true,
      get: accessor,
    });
    expect(
      app.coordinator.begin({ ...frame(), pageIds: ids }, move).status,
    ).toBe("blocked");
    const placement = Object.defineProperty({ ...move }, "beforeId", {
      enumerable: true,
      get: accessor,
    });
    expect(app.coordinator.begin(frame(), placement).status).toBe("blocked");
    const token = app.start();
    const outcome = Object.defineProperty({ kind: "accepted" }, "revision", {
      enumerable: true,
      get: accessor,
    });
    expect(app.coordinator.settle(token, outcome as RowMoveSettlement)).toEqual(
      { status: "ignored", reason: "invalid" },
    );
    expect(gets).toBe(0);
    expect(app.coordinator.getSnapshot().pending?.operation).toBe(token);
  });

  it("captures options references once and invokes callbacks without exposing private receivers", () => {
    const current = frame();
    const receivers: unknown[] = [];
    const options = {
      instanceId: "original",
      readCurrent: function (this: unknown) {
        receivers.push(this);
        return current;
      },
    };
    const coordinator = createRowMoveCoordinator(options);
    options.instanceId = "mutated";
    options.readCurrent = () => {
      throw new Error("should not be used");
    };
    const result = coordinator.begin(current, move);
    expect(result.status).toBe("started");
    if (result.status === "started")
      expect(result.operation.move.operationId).toBe("original:1");
    expect(receivers).toEqual([undefined]);
  });

  it("uses captured descriptors rather than property gets or caller iteration", () => {
    const counts = new Map<PropertyKey, number>();
    const original = frame();
    const origin = new Proxy(original, {
      get() {
        throw new Error("property get forbidden");
      },
      getOwnPropertyDescriptor(target, key) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
        return Reflect.getOwnPropertyDescriptor(target, key);
      },
    });
    const coordinator = createRowMoveCoordinator({
      instanceId: "descriptors",
      readCurrent: () => original,
    });
    expect(coordinator.begin(origin, move).status).toBe("started");
    expect([...counts.entries()]).toEqual([
      ["stamp", 1],
      ["pageIds", 1],
      ["baseRevision", 1],
    ]);
  });

  it("rejects inconsistent/throwing/revoked proxies without exposing their traps", () => {
    const missing = new Proxy(frame(), {
      getOwnPropertyDescriptor(target, key) {
        return key === "pageIds"
          ? undefined
          : Reflect.getOwnPropertyDescriptor(target, key);
      },
    });
    const throwing = new Proxy(frame(), {
      ownKeys() {
        throw new Error("synthetic-private-proxy");
      },
    });
    const revoked = Proxy.revocable(frame(), {});
    revoked.revoke();
    for (const bad of [missing, throwing, revoked.proxy]) {
      const app = fixture();
      expect(app.coordinator.begin(bad, move)).toEqual({
        status: "blocked",
        reason: "invalid",
      });
      expect(JSON.stringify(app.coordinator.getSnapshot())).not.toContain(
        "synthetic-private",
      );
    }
  });

  it("rejects sparse, extended, symbol, non-enumerable and foreign-prototype metadata", () => {
    const sparse = new Array<string>(3);
    sparse[0] = "a";
    sparse[2] = "c";
    const extended = Object.assign(["a", "b", "c"], { extra: true });
    const symbols = Object.assign(["a", "b", "c"], {
      [Symbol("synthetic")]: true,
    });
    const nonenum = Object.defineProperty(["a", "b", "c"], "1", {
      enumerable: false,
      value: "b",
    });
    for (const pageIds of [
      sparse,
      extended,
      symbols,
      nonenum,
      ["a", "a", "c"],
      ["a", "", "c"],
    ]) {
      const app = fixture();
      expect(app.coordinator.begin({ ...frame(), pageIds }, move).status).toBe(
        "blocked",
      );
    }
    const foreign = Object.assign(
      Object.create({ inherited: true }) as RowReorderFrame,
      frame(),
    );
    expect(fixture().coordinator.begin(foreign, move).status).toBe("blocked");
    const hidden = Object.defineProperty({ ...frame() }, "baseRevision", {
      enumerable: false,
      value: null,
    });
    expect(fixture().coordinator.begin(hidden, move).status).toBe("blocked");
    expect(
      fixture().coordinator.begin({ ...frame(), [Symbol("x")]: true }, move)
        .status,
    ).toBe("blocked");
  });

  it("never traverses/freezes an unexpected application record or calls toJSON", () => {
    let gets = 0;
    const record = {
      get privateValue() {
        gets++;
        throw new Error("synthetic-private");
      },
      toJSON() {
        gets++;
        throw new Error("synthetic-private");
      },
    };
    const invalidOrigin = { ...frame(), record };
    expect(fixture().coordinator.begin(invalidOrigin, move).status).toBe(
      "blocked",
    );
    expect(gets).toBe(0);
    expect(Object.isFrozen(record)).toBe(false);
  });

  it("copies live origin metadata and accepts frozen/null-prototype own-data input", () => {
    const current = frame();
    const origin = Object.assign(
      Object.create(null) as RowReorderFrame,
      current,
    );
    Object.freeze(current.stamp);
    Object.freeze(current.pageIds);
    Object.freeze(origin);
    expect(
      createRowMoveCoordinator({
        instanceId: "frozen",
        readCurrent: () => current,
      }).begin(origin, move).status,
    ).toBe("started");
  });

  it("bounds capture cardinality and metadata allocation without truncation", () => {
    const current = frame(
      { pageSize: reorderLimits.items + 1 },
      Array.from({ length: reorderLimits.items + 1 }, (_, i) => `id-${i}`),
    );
    expect(fixture().coordinator.begin(current, move)).toEqual({
      status: "blocked",
      reason: "invalid",
    });
    expect(() =>
      createRowMoveCoordinator({
        instanceId: "x".repeat(reorderLimits.metadataCharacters + 1),
        readCurrent: () => frame(),
      }),
    ).toThrowError(ReorderError);
    expect(() =>
      createRowMoveCoordinator({
        instanceId: "x".repeat(reorderLimits.metadataCharacters),
        readCurrent: () => frame(),
      }),
    ).not.toThrow();
    expect(
      fixture().coordinator.begin(
        frame({ scopeKey: "x".repeat(reorderLimits.metadataCharacters) }),
        move,
      ).status,
    ).toBe("blocked");
  });

  it("enforces page cardinality but does not install a schema page-size ceiling", () => {
    expect(
      fixture().coordinator.begin(frame({ pageSize: 2 }), move).status,
    ).toBe("blocked");
    const current = frame({ pageSize: 1000 });
    expect(
      createRowMoveCoordinator({
        instanceId: "large-size",
        readCurrent: () => current,
      }).begin(current, move).status,
    ).toBe("started");
  });

  it("observes invalid native-Promise port/listener rejections without running arbitrary thenables", async () => {
    const coordinator = createRowMoveCoordinator({
      instanceId: "async",
      readCurrent: (async () => {
        throw new Error("synthetic-async-private");
      }) as unknown as RowMoveCoordinatorOptions["readCurrent"],
    });
    expect(coordinator.begin(frame(), move).status).toBe("blocked");
    let gets = 0;
    const thenable = {
      // biome-ignore lint/suspicious/noThenProperty: Deliberately hostile thenable must never be executed.
      get then() {
        gets++;
        throw new Error("synthetic-then-private");
      },
    };
    const other = createRowMoveCoordinator({
      instanceId: "thenable",
      readCurrent: (() =>
        thenable) as unknown as RowMoveCoordinatorOptions["readCurrent"],
    });
    expect(other.begin(frame(), move).status).toBe("blocked");
    const app = fixture();
    app.coordinator.subscribe((() => thenable) as () => void);
    app.start();
    await Promise.resolve();
    await Promise.resolve();
    expect(gets).toBe(0);
  });
  it("does not inspect arbitrary caught error.code getters", () => {
    let gets = 0;
    const fake = Object.create(ReorderError.prototype) as ReorderError;
    Object.defineProperty(fake, "code", {
      get() {
        gets++;
        throw new Error("private");
      },
    });
    const app = fixture();
    app.port(() => {
      throw fake;
    });
    expect(app.coordinator.begin(app.current, move)).toEqual({
      status: "blocked",
      reason: "unavailable",
    });
    expect(gets).toBe(0);
  });
});
