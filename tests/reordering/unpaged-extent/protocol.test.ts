import { describe, expect, it } from "vitest";
import {
  budget,
  frame,
  sameOrigin,
  sameStamp,
  stamp,
} from "../../../packages/react/src/reordering/capture.js";
import { reorderLimits } from "../../../packages/react/src/reordering/index.js";
import type {
  ReorderStamp,
  RowReorderFrame,
} from "../../../packages/react/src/reordering/index.js";
import {
  applicationFrame,
  placement,
  protocol,
  requireStarted,
} from "./protocol.js";

describe("legacy page compatibility and explicit complete extent", () => {
  it("omitted and explicit page normalize to the exact old own keys and wire shape", () => {
    const omitted = applicationFrame();
    const explicit = {
      ...omitted,
      stamp: { ...omitted.stamp, extent: "page" as const },
    };
    const oldKeys = [
      "ownerEpoch",
      "sourceVersion",
      "definitionKey",
      "scopeKey",
      "queryIdentity",
      "pageIndex",
      "pageSize",
      "revision",
    ];
    for (const input of [omitted, explicit]) {
      const captured = frame(input);
      expect(Reflect.ownKeys(captured.stamp)).toEqual(oldKeys);
      expect(captured).toEqual(omitted);
      const p = protocol(input);
      const initial = p.coordinator.getSnapshot();
      expect(initial).toEqual({ pending: null, feedback: null });
      expect(p.coordinator.getSnapshot()).toBe(initial);
      const operation = requireStarted(p.begin());
      expect(Reflect.ownKeys(operation)).toEqual([
        "generation",
        "origin",
        "move",
      ]);
      expect(Reflect.ownKeys(operation.origin)).toEqual(oldKeys);
      expect(Reflect.ownKeys(operation.move)).toEqual([
        "movedId",
        "beforeId",
        "afterId",
        "operationId",
        "scopeKey",
        "pageIds",
        "baseRevision",
      ]);
      expect(operation.move.pageIds).toEqual(input.pageIds);
      expect(operation.move.operationId).toBe("synthetic-extent:1");
      expect(Object.isFrozen(operation)).toBe(true);
      const next = p.newer({ extent: "page" });
      p.coordinator.acknowledge(operation, {
        stamp: next.stamp,
        disposition: "applied",
      });
      expect(p.coordinator.getSnapshot()).toEqual({
        pending: null,
        feedback: { operationId: operation.move.operationId, code: "applied" },
      });
    }
    expect(
      sameStamp(
        stamp(explicit.stamp, budget()),
        stamp(omitted.stamp, budget()),
      ),
    ).toBe(true);
  });

  it("page cannot exceed canonical size, complete11/default10 can without rewriting page fields", () => {
    for (const extent of [undefined, "page"] as const) {
      const input = applicationFrame(
        extent === undefined ? {} : { extent },
        11,
      );
      expect(protocol(input).begin()).toEqual({
        status: "blocked",
        reason: "invalid",
      });
    }
    const p = protocol();
    const operation = requireStarted(p.begin());
    expect(operation.origin).toEqual(
      applicationFrame({ extent: "complete" }, 11).stamp,
    );
    expect(operation.origin.pageIndex).toBe(0);
    expect(operation.origin.pageSize).toBe(10);
    expect(operation.move.pageIds).toHaveLength(11);
    expect(Reflect.ownKeys(operation.origin).at(-1)).toBe("extent");
  });

  it("complete requires zero pageIndex while page retains its prior nonzero semantics", () => {
    expect(
      protocol(
        applicationFrame({ extent: "complete", pageIndex: 1 }, 11),
      ).begin(),
    ).toEqual({ status: "blocked", reason: "invalid" });
    expect(protocol(applicationFrame({ pageIndex: 1 })).begin().status).toBe(
      "started",
    );
    expect(
      protocol(
        applicationFrame({ extent: "complete", pageSize: 0 }, 11),
      ).begin().status,
    ).toBe("blocked");
  });

  it("origin equality includes normalized extent and every original field", () => {
    const original = applicationFrame().stamp;
    expect(sameOrigin(original, { ...original, extent: "page" })).toBe(true);
    expect(sameOrigin(original, { ...original, extent: "complete" })).toBe(
      false,
    );
    for (const change of [
      { ownerEpoch: 1 },
      { definitionKey: "other" },
      { scopeKey: "other" },
      { queryIdentity: "other" },
      { pageIndex: 1 },
      { pageSize: 25 },
    ])
      expect(sameOrigin(original, { ...original, ...change })).toBe(false);
    expect(sameStamp(original, { ...original, sourceVersion: 1 })).toBe(false);
    expect(sameStamp(original, { ...original, revision: "0" })).toBe(false);
  });
});

describe("extent is part of the actual coordinator high-water and acknowledgement protocol", () => {
  it("same-owner page to complete cannot upgrade an old gesture; a higher honest owner can", () => {
    const p = protocol(applicationFrame());
    const first = requireStarted(p.begin());
    p.coordinator.settle(first, { kind: "rejected", code: "conflict" });
    const old = p.current();
    p.publish(applicationFrame({ extent: "complete", sourceVersion: 1 }, 11));
    expect(p.coordinator.begin(old, placement).status).toBe("blocked");
    expect(p.begin()).toEqual({ status: "blocked", reason: "origin" });
    p.publish(
      applicationFrame(
        { extent: "complete", ownerEpoch: 1, sourceVersion: 0 },
        11,
      ),
    );
    expect(p.coordinator.begin(old, placement).status).toBe("blocked");
    const fresh = requireStarted(p.begin());
    expect(fresh.origin.extent).toBe("complete");
    expect(fresh.origin.ownerEpoch).toBe(1);
    expect(fresh).not.toBe(first);
  });

  it("accepted transport waits for matching complete, strictly newer authoritative acknowledgement", () => {
    const p = protocol();
    const operation = requireStarted(p.begin());
    p.coordinator.settle(operation, {
      kind: "accepted",
      revision: "transport-only",
    });
    expect(p.coordinator.getSnapshot().pending?.phase).toBe(
      "awaiting-authority",
    );
    p.coordinator.acknowledge(operation, {
      stamp: p.current().stamp,
      disposition: "applied",
    });
    expect(p.coordinator.getSnapshot().pending?.operation).toBe(operation);
    const next = p.newer({ revision: "authoritative" });
    const { extent: _extent, ...omitted } = next.stamp;
    for (const candidate of [
      omitted,
      { ...omitted, extent: "page" as const },
    ]) {
      p.coordinator.acknowledge(operation, {
        stamp: candidate,
        disposition: "applied",
      });
      expect(p.coordinator.getSnapshot().pending?.operation).toBe(operation);
    }
    p.coordinator.acknowledge(
      { ...operation },
      { stamp: next.stamp, disposition: "applied" },
    );
    expect(p.coordinator.getSnapshot().pending?.operation).toBe(operation);
    expect(
      p.coordinator.acknowledge(operation, {
        stamp: next.stamp,
        disposition: "applied",
      }).status,
    ).toBe("changed");
    expect(p.coordinator.getSnapshot().pending).toBeNull();
    expect(p.coordinator.getSnapshot().feedback?.code).toBe("applied");
    expect(p.reads.at(-1)).toEqual([]);
  });

  it("complete to page with the same owner retires, not a permissive extent downgrade", () => {
    const p = protocol();
    const operation = requireStarted(p.begin());
    p.publish(applicationFrame({ sourceVersion: 1 }));
    p.coordinator.acknowledge(operation, {
      stamp: p.current().stamp,
      disposition: "applied",
    });
    expect(p.coordinator.getSnapshot().feedback).toBeNull();
    expect(p.coordinator.getSnapshot().pending).toBeNull();
    expect(p.begin().status).toBe("blocked");
    p.publish(applicationFrame({ ownerEpoch: 1 }));
    expect(p.begin().status).toBe("started");
  });

  for (const disposition of ["applied", "not-applied", "superseded"] as const) {
    it(`authoritative ${disposition} can beat transport without a second settlement engine`, () => {
      const p = protocol();
      const operation = requireStarted(p.begin());
      const next = p.newer();
      p.coordinator.acknowledge(operation, { stamp: next.stamp, disposition });
      expect(p.coordinator.getSnapshot().pending).toBeNull();
      expect(p.coordinator.getSnapshot().feedback?.code).toBe(
        disposition === "not-applied" ? "rejected" : disposition,
      );
      expect(p.coordinator.settle(operation, { kind: "accepted" })).toEqual({
        status: "ignored",
        reason: "operation",
      });
    });
  }

  it("cancel-requested remains uncertain and requires the actual newer complete source", () => {
    const p = protocol();
    const operation = requireStarted(p.begin());
    p.coordinator.settle(operation, {
      kind: "indeterminate",
      code: "cancel-requested",
    });
    expect(p.coordinator.getSnapshot().pending?.phase).toBe(
      "awaiting-authority",
    );
    expect(p.coordinator.getSnapshot().feedback?.code).toBe("unavailable");
    const next = p.newer();
    p.coordinator.reconcile();
    expect(p.coordinator.getSnapshot().pending?.operation).toBe(operation);
    p.coordinator.acknowledge(operation, {
      stamp: next.stamp,
      disposition: "not-applied",
    });
    expect(p.coordinator.getSnapshot().feedback?.code).toBe("rejected");
  });

  it("same-stamp changed IDs still invalidate; complete is no bypass for version honesty", () => {
    const p = protocol();
    const operation = requireStarted(p.begin());
    p.publish({ ...p.current(), pageIds: [...p.current().pageIds].reverse() });
    p.coordinator.acknowledge(operation, {
      stamp: p.current().stamp,
      disposition: "applied",
    });
    expect(p.coordinator.getSnapshot()).toEqual({
      pending: null,
      feedback: null,
    });
    expect(p.begin().status).toBe("blocked");
  });
});

describe("extent never widens existing metadata, reflection, array or size safety", () => {
  for (const extent of [
    undefined,
    null,
    "",
    "all",
    true,
    1,
    [],
    {},
    ["complete"],
  ]) {
    it(`rejects supplied malformed extent (${typeof extent}/${String(extent)})`, () => {
      const input = applicationFrame();
      const malformed = { ...input, stamp: { ...input.stamp, extent } };
      const p = protocol(input);
      expect(
        p.coordinator.begin(malformed as RowReorderFrame, placement),
      ).toEqual({ status: "blocked", reason: "invalid" });
    });
  }

  it("does not invoke extent accessors or inherit consumed metadata", () => {
    let calls = 0;
    const own = Object.defineProperty(
      { ...applicationFrame().stamp },
      "extent",
      {
        enumerable: true,
        get() {
          calls++;
          return "complete";
        },
      },
    );
    const inherited = Object.assign(
      Object.create({ extent: "complete" }),
      applicationFrame().stamp,
    );
    for (const value of [own, inherited]) {
      const input = { ...applicationFrame(), stamp: value };
      expect(protocol(input).begin().status).toBe("blocked");
    }
    expect(calls).toBe(0);
  });

  it("treats throwing reflection as invalid without exposing a cause or coercing extent", () => {
    for (const trap of [
      "getPrototypeOf",
      "ownKeys",
      "getOwnPropertyDescriptor",
      "has",
    ] as const) {
      const value = new Proxy(applicationFrame().stamp, {
        [trap]() {
          throw new Error("Synthetic reflection failure");
        },
      });
      const input = { ...applicationFrame(), stamp: value };
      expect(protocol(input).begin()).toEqual({
        status: "blocked",
        reason: "invalid",
      });
    }
    let conversions = 0;
    const value = {
      toString() {
        conversions++;
        return "complete";
      },
    };
    expect(
      protocol({
        ...applicationFrame(),
        stamp: { ...applicationFrame().stamp, extent: value },
      } as unknown as RowReorderFrame).begin().status,
    ).toBe("blocked");
    expect(conversions).toBe(0);
  });

  it("retains simple dense unique ID requirements under complete extent", () => {
    const sparse = Array<string>(3);
    const accessor = ["row-0", "row-1", "row-2"];
    let reads = 0;
    Object.defineProperty(accessor, "0", {
      enumerable: true,
      get() {
        reads++;
        return "row-0";
      },
    });
    for (const pageIds of [
      sparse,
      accessor,
      ["row-0", "row-0", "row-2"],
      ["row-0", "", "row-2"],
    ]) {
      expect(
        protocol({
          ...applicationFrame({ extent: "complete" }),
          pageIds,
        }).begin().status,
      ).toBe("blocked");
    }
    expect(reads).toBe(0);
  });

  it("keeps count 100000 and the 1048576-character budget, including a 100001 rejection", () => {
    const maximum = applicationFrame(
      { extent: "complete" },
      reorderLimits.items,
    );
    expect(frame(maximum).pageIds).toHaveLength(100_000);
    const largeMove = requireStarted(protocol(maximum).begin());
    expect(largeMove.move.pageIds).toHaveLength(100_000);
    expect(
      protocol(
        applicationFrame({ extent: "complete" }, reorderLimits.items + 1),
      ).begin().status,
    ).toBe("blocked");
    const exact: RowReorderFrame = {
      stamp: {
        ...applicationFrame({ extent: "complete" }).stamp,
        definitionKey: "d",
        scopeKey: "s",
        queryIdentity: "q".repeat(reorderLimits.metadataCharacters - 5),
      },
      pageIds: ["a", "b", "c"],
      baseRevision: null,
    };
    expect(frame(exact).stamp.extent).toBe("complete");
    const overflow = {
      ...exact,
      stamp: { ...exact.stamp, queryIdentity: `${exact.stamp.queryIdentity}q` },
    };
    expect(() => frame(overflow)).toThrow();
    expect(protocol(overflow).begin().status).toBe("blocked");
  });

  it("retains finite revision and integer/page safety independent of extent", () => {
    for (const change of [
      { ownerEpoch: -1 },
      { ownerEpoch: Number.MAX_SAFE_INTEGER + 1 },
      { sourceVersion: -1 },
      { sourceVersion: 0.5 },
      { pageSize: 0 },
      { pageSize: Number.POSITIVE_INFINITY },
      { revision: Number.NaN },
    ] satisfies Partial<ReorderStamp>[]) {
      expect(
        protocol(
          applicationFrame({ extent: "complete", ...change }, 11),
        ).begin().status,
      ).toBe("blocked");
    }
  });
});
