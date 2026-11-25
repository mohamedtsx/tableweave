import { describe, expect, it } from "vitest";
import {
  createRowMoveCoordinator,
  ReorderError,
  type ReorderStamp,
  type RowMoveAcknowledgement,
  type RowMoveOperation,
  type RowMoveSettlement,
} from "../../../packages/react/src/reordering/index.js";
import { fixture, frame, move } from "./fixtures.js";

describe("anchored intent, not a persistence/order owner", () => {
  it("captures one immutable complete-page intent and all unique guard targets", () => {
    const app = fixture();
    const original = app.current;
    const token = app.start();
    expect(app.calls).toEqual([["a", "c", "b"]]);
    expect(Object.isFrozen(app.calls[0])).toBe(true);
    expect(token.move).toEqual({
      ...move,
      operationId: "synthetic-table:1",
      scopeKey: "scope-a",
      pageIds: ["a", "b", "c"],
      baseRevision: "wire-r1",
    });
    expect(token.origin).toEqual(original.stamp);
    expect(token.origin).not.toBe(original.stamp);
    expect(token.move.pageIds).not.toBe(original.pageIds);
    for (const value of [
      token,
      token.origin,
      token.move,
      token.move.pageIds,
      app.coordinator.getSnapshot(),
      app.coordinator.getSnapshot().pending,
    ])
      expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(original)).toBe(false);
    expect(Object.isFrozen(original.stamp)).toBe(false);
    expect(app.coordinator.begin(original, move)).toEqual({
      status: "blocked",
      reason: "pending",
    });
    expect(app.calls).toHaveLength(1);
  });

  it("exhaustively accepts adjacent insertion gaps and recognizes no-ops", () => {
    const page = ["a", "b", "c", "d"];
    for (const movedId of page) {
      const remaining = page.filter((id) => id !== movedId);
      for (let index = 0; index <= remaining.length; index++) {
        const current = frame({}, [...page]);
        const coordinator = createRowMoveCoordinator({
          instanceId: "gaps",
          readCurrent: () => current,
        });
        const result = coordinator.begin(current, {
          movedId,
          beforeId: remaining[index] ?? null,
          afterId: remaining[index - 1] ?? null,
        });
        expect(result.status).toBe(
          index === page.indexOf(movedId) ? "noop" : "started",
        );
        expect(current.pageIds).toEqual(page);
      }
    }
  });

  for (const placement of [
    { movedId: "x", beforeId: null, afterId: "c" },
    { movedId: "a", beforeId: "x", afterId: "b" },
    { movedId: "a", beforeId: "c", afterId: "x" },
  ])
    it(`rejects off-page membership: ${JSON.stringify(placement)}`, () => {
      const app = fixture();
      expect(app.coordinator.begin(app.current, placement)).toEqual({
        status: "blocked",
        reason: "membership",
      });
      expect(app.coordinator.getSnapshot().pending).toBeNull();
    });
  for (const placement of [
    { movedId: "a", beforeId: "a", afterId: null },
    { movedId: "a", beforeId: null, afterId: "a" },
    { movedId: "a", beforeId: "b", afterId: "b" },
    { movedId: "a", beforeId: null, afterId: null },
    { movedId: "a", beforeId: "b", afterId: "c" },
    { movedId: "a", beforeId: "c", afterId: null },
  ])
    it(`rejects inconsistent gaps: ${JSON.stringify(placement)}`, () => {
      const app = fixture();
      expect(app.coordinator.begin(app.current, placement)).toEqual({
        status: "blocked",
        reason: "anchors",
      });
    });

  it("a one-row unchanged gap is noop, not a mutation", () => {
    const current = frame({}, ["a"]);
    const coordinator = createRowMoveCoordinator({
      instanceId: "one",
      readCurrent: () => current,
    });
    expect(
      coordinator.begin(current, {
        movedId: "a",
        beforeId: null,
        afterId: null,
      }),
    ).toEqual({ status: "noop" });
  });

  it("calls only the explicit metadata guard, with no implicit persistence port", () => {
    const app = fixture();
    app.start();
    expect(app.calls).toEqual([["a", "c", "b"]]);
    expect(Object.keys(app.coordinator.getSnapshot())).toEqual([
      "pending",
      "feedback",
    ]);
  });
});

describe("origin, monotonic source and semantic fences", () => {
  for (const [key, value] of Object.entries({
    ownerEpoch: 2,
    sourceVersion: 2,
    definitionKey: "other",
    scopeKey: "other",
    queryIdentity: "other",
    pageIndex: 1,
    pageSize: 25,
    revision: 0,
  }))
    it(`rejects a changed origin ${key}`, () => {
      const app = fixture();
      const original = app.current;
      app.current = frame({ [key]: value });
      expect(app.coordinator.begin(original, move)).toEqual({
        status: "blocked",
        reason: "origin",
      });
    });
  it("distinguishes numeric zero/string zero and wire revision without coercion", () => {
    const app = fixture();
    const original = frame({ revision: 0 });
    app.current = frame({ revision: "0" });
    expect(app.coordinator.begin(original, move).status).toBe("blocked");
    app.current = frame({ revision: 0 });
    expect(
      app.coordinator.begin({ ...original, baseRevision: "different" }, move)
        .status,
    ).toBe("blocked");
  });
  it("rejects changed complete page order even with equal tags", () => {
    const app = fixture();
    const original = app.current;
    app.current = frame({}, ["b", "a", "c"]);
    expect(app.coordinator.begin(original, move)).toEqual({
      status: "blocked",
      reason: "origin",
    });
  });
  it("scope ABA cannot reauthorize an old origin or token", () => {
    const app = fixture();
    const original = app.current;
    const token = app.start();
    app.current = frame({ ownerEpoch: 2, scopeKey: "scope-b" });
    expect(app.coordinator.reconcile().status).toBe("changed");
    app.current = frame({ ownerEpoch: 3 });
    app.coordinator.reconcile();
    expect(app.coordinator.begin(original, move)).toEqual({
      status: "blocked",
      reason: "origin",
    });
    expect(app.coordinator.settle(token, { kind: "accepted" }).status).toBe(
      "ignored",
    );
    expect(app.start().generation).toBe(2);
  });
  for (const change of [
    { ownerEpoch: 0 },
    { sourceVersion: 0 },
    { scopeKey: "unannounced" },
    { definitionKey: "unannounced" },
    { queryIdentity: "unannounced" },
    { pageIndex: 1 },
    { revision: "unannounced" },
  ] satisfies Partial<ReorderStamp>[])
    it(`fails closed on rollback/reused epoch/version ${JSON.stringify(change)}`, () => {
      const app = fixture();
      const old = app.start();
      app.current = frame(change);
      app.coordinator.reconcile();
      expect(app.coordinator.getSnapshot().pending).toBeNull();
      expect(app.coordinator.begin(app.current, move).status).toBe("blocked");
      app.current = frame({ ownerEpoch: 2 });
      expect(app.start()).not.toBe(old);
    });
  it("rejects changed page membership under a reused source version", () => {
    const app = fixture();
    app.start();
    app.current = frame({}, ["a", "b", "d"]);
    app.coordinator.reconcile();
    expect(app.coordinator.getSnapshot().pending).toBeNull();
    expect(app.coordinator.begin(app.current, move).status).toBe("blocked");
  });
  it("keeps a pending lock through newer same-origin records, never storing records", () => {
    const app = fixture();
    const token = app.start();
    const record = { id: "d", nested: { label: "Synthetic latest" } };
    const records = [record];
    app.advance({ revision: "r2" }, ["a", "b", "d"]);
    app.coordinator.reconcile();
    expect(app.coordinator.getSnapshot().pending).toMatchObject({
      operation: token,
      superseded: true,
    });
    expect(
      app.coordinator.begin(app.current, {
        movedId: "a",
        beforeId: "d",
        afterId: "b",
      }),
    ).toEqual({ status: "blocked", reason: "pending" });
    app.coordinator.settle(token, { kind: "rejected", code: "conflict" });
    expect(records[0]).toBe(record);
    expect(Object.isFrozen(record)).toBe(false);
    expect(app.current.pageIds).toEqual(["a", "b", "d"]);
    expect(app.coordinator.getSnapshot().feedback?.code).toBe("conflict");
  });
  it("does not order arbitrary revision values; a newer sourceVersion fences revision ABA", () => {
    const app = fixture();
    const token = app.start();
    app.advance({ revision: 0 });
    app.coordinator.reconcile();
    app.advance({ revision: "r1" });
    app.coordinator.reconcile();
    expect(app.coordinator.getSnapshot().pending?.superseded).toBe(true);
    expect(
      app.coordinator.acknowledge(token, {
        stamp: token.origin,
        disposition: "applied",
      }).status,
    ).toBe("ignored");
    expect(app.coordinator.getSnapshot().pending?.operation).toBe(token);
  });
});

describe("transport outcomes versus authoritative acknowledgement", () => {
  it("accepted waits for a newer authoritative acknowledgement", () => {
    const app = fixture();
    const token = app.start();
    app.coordinator.settle(token, { kind: "accepted", revision: "backend-r2" });
    expect(app.coordinator.getSnapshot().pending).toMatchObject({
      operation: token,
      phase: "awaiting-authority",
    });
    expect(
      app.coordinator.acknowledge(token, {
        stamp: app.current.stamp,
        disposition: "applied",
      }).status,
    ).toBe("ignored");
    expect(app.coordinator.getSnapshot().pending).not.toBeNull();
    app.advance({ revision: "r3" });
    expect(
      app.coordinator.acknowledge(token, {
        stamp: app.current.stamp,
        disposition: "applied",
      }).status,
    ).toBe("changed");
    expect(app.coordinator.getSnapshot()).toEqual({
      pending: null,
      feedback: { operationId: token.move.operationId, code: "applied" },
    });
  });
  for (const code of ["unavailable", "timeout", "cancel-requested"] as const)
    it(`indeterminate ${code} retains lock; no automatic retry/undo`, () => {
      const app = fixture();
      const token = app.start();
      app.coordinator.settle(token, { kind: "indeterminate", code });
      expect(app.coordinator.getSnapshot().pending?.phase).toBe(
        "awaiting-authority",
      );
      expect(app.coordinator.getSnapshot().feedback?.code).toBe("unavailable");
      expect(app.calls).toEqual([["a", "c", "b"], []]);
      app.advance();
      app.coordinator.acknowledge(token, {
        stamp: app.current.stamp,
        disposition: "not-applied",
      });
      expect(app.coordinator.getSnapshot().feedback?.code).toBe("rejected");
    });
  for (const code of ["rejected", "conflict"] as const)
    it(`definitive ${code} releases pending without rollback`, () => {
      const app = fixture();
      const token = app.start();
      app.coordinator.settle(token, { kind: "rejected", code });
      expect(app.coordinator.getSnapshot().pending).toBeNull();
      expect(app.coordinator.getSnapshot().feedback?.code).toBe(code);
      expect(app.current.pageIds).toEqual(["a", "b", "c"]);
      expect(app.start().generation).toBe(2);
    });
  for (const disposition of ["applied", "not-applied", "superseded"] as const)
    it(`terminal ${disposition} ack can arrive before transport settlement`, () => {
      const app = fixture();
      const token = app.start();
      app.advance();
      app.coordinator.acknowledge(token, {
        stamp: app.current.stamp,
        disposition,
      });
      const state = app.coordinator.getSnapshot();
      expect(state.pending).toBeNull();
      expect(
        app.coordinator.settle(token, { kind: "rejected", code: "conflict" })
          .status,
      ).toBe("ignored");
      expect(app.coordinator.getSnapshot()).toBe(state);
    });
  it("accepts an explicit superseded acknowledgement even if the moved row left the page", () => {
    const app = fixture();
    const token = app.start();
    app.advance({}, ["b", "c", "d"]);
    app.coordinator.acknowledge(token, {
      stamp: app.current.stamp,
      disposition: "superseded",
    });
    expect(app.coordinator.getSnapshot().feedback?.code).toBe("superseded");
    expect(app.calls.at(-1)).toEqual([]);
  });
  it("requires the current ack stamp, including revision type and latest source version", () => {
    const app = fixture();
    const token = app.start();
    const previous = app.advance({ revision: 0 });
    app.advance({ revision: "0" });
    app.coordinator.acknowledge(token, {
      stamp: previous.stamp,
      disposition: "applied",
    });
    expect(app.coordinator.getSnapshot().pending?.operation).toBe(token);
    app.coordinator.acknowledge(token, {
      stamp: { ...app.current.stamp, revision: 0 },
      disposition: "applied",
    });
    expect(app.coordinator.getSnapshot().pending?.operation).toBe(token);
    app.coordinator.acknowledge(token, {
      stamp: app.current.stamp,
      disposition: "applied",
    });
    expect(app.coordinator.getSnapshot().pending).toBeNull();
  });
  it("only one transport settlement is accepted while ack is pending", () => {
    const app = fixture();
    const token = app.start();
    app.coordinator.settle(token, { kind: "accepted" });
    const state = app.coordinator.getSnapshot();
    expect(
      app.coordinator.settle(token, { kind: "rejected", code: "conflict" }),
    ).toEqual({ status: "ignored", reason: "operation" });
    expect(app.coordinator.getSnapshot()).toBe(state);
  });
  it("cannot settle a copied, proxy-wrapped, foreign or late operation", () => {
    const app = fixture();
    const token = app.start();
    const foreign = fixture().start();
    const state = app.coordinator.getSnapshot();
    for (const wrong of [
      { ...token },
      new Proxy(token, {}),
      foreign,
      Object.freeze({
        generation: token.generation,
        origin: token.origin,
        move: token.move,
      }),
    ]) {
      expect(
        app.coordinator.settle(wrong as RowMoveOperation, { kind: "accepted" })
          .status,
      ).toBe("ignored");
      expect(
        app.coordinator.acknowledge(wrong as RowMoveOperation, {
          stamp: app.current.stamp,
          disposition: "applied",
        }).status,
      ).toBe("ignored");
      expect(app.coordinator.getSnapshot()).toBe(state);
    }
    app.coordinator.settle(token, { kind: "rejected", code: "rejected" });
    const newToken = app.start();
    expect(newToken.move.operationId).not.toBe(token.move.operationId);
    expect(app.coordinator.settle(token, { kind: "accepted" }).status).toBe(
      "ignored",
    );
  });
  it("does not consume a valid operation on malformed outcome or acknowledgement", () => {
    const app = fixture();
    const token = app.start();
    const state = app.coordinator.getSnapshot();
    for (const input of [
      { kind: "accepted", revision: undefined },
      { kind: "accepted", code: "rejected" },
      { kind: "rejected", code: "synthetic-secret" },
      { kind: "indeterminate", code: "offline" },
      new Error("synthetic-secret"),
      null,
    ])
      expect(app.coordinator.settle(token, input as RowMoveSettlement)).toEqual(
        { status: "ignored", reason: "invalid" },
      );
    expect(
      app.coordinator.acknowledge(token, {
        stamp: app.current.stamp,
        disposition: "synthetic-secret",
      } as unknown as RowMoveAcknowledgement),
    ).toEqual({ status: "ignored", reason: "invalid" });
    expect(app.coordinator.getSnapshot()).toBe(state);
    expect(JSON.stringify(state)).not.toContain("synthetic-secret");
    expect(app.coordinator.settle(token, { kind: "accepted" }).status).toBe(
      "changed",
    );
  });
});

describe("invalidation, observation and notifications", () => {
  it("invalid/absent tokens on an idle coordinator cannot trigger application reads", () => {
    const app = fixture();
    expect(
      app.coordinator.settle(undefined as unknown as RowMoveOperation, {
        kind: "accepted",
      }),
    ).toEqual({ status: "ignored", reason: "operation" });
    expect(
      app.coordinator.acknowledge(undefined as unknown as RowMoveOperation, {
        stamp: app.current.stamp,
        disposition: "applied",
      }),
    ).toEqual({ status: "ignored", reason: "operation" });
    expect(app.calls).toEqual([]);
  });
  it("disposal from hostile outcome capture cannot call the application port afterward", () => {
    const app = fixture();
    const token = app.start();
    const reads = app.calls.length;
    const outcome = new Proxy({ kind: "accepted" } as const, {
      getOwnPropertyDescriptor(target, key) {
        app.coordinator.dispose();
        return Reflect.getOwnPropertyDescriptor(target, key);
      },
    });
    expect(app.coordinator.settle(token, outcome).status).toBe("ignored");
    expect(app.calls).toHaveLength(reads);
    expect(app.coordinator.getSnapshot().pending).toBeNull();
  });
  it("access invalidation from acknowledgement capture cannot settle an old token", () => {
    const app = fixture();
    const token = app.start();
    const reads = app.calls.length;
    const ack = new Proxy(
      { stamp: app.current.stamp, disposition: "applied" } as const,
      {
        getOwnPropertyDescriptor(target, key) {
          app.coordinator.invalidate("access");
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      },
    );
    expect(app.coordinator.acknowledge(token, ack).status).toBe("ignored");
    expect(app.calls).toHaveLength(reads);
    expect(app.coordinator.getSnapshot()).toEqual({
      pending: null,
      feedback: null,
    });
  });
  it("pending-lock observation does not require the old moved row to remain eligible", () => {
    const app = fixture();
    const token = app.start();
    app.advance({}, ["b", "c", "d"]);
    app.port((ids) => {
      if (ids.length) throw new ReorderError("reorder.eligibility");
      return app.current;
    });
    app.coordinator.reconcile();
    expect(app.coordinator.getSnapshot().pending?.superseded).toBe(true);
    expect(
      app.coordinator.acknowledge(token, {
        stamp: app.current.stamp,
        disposition: "superseded",
      }).status,
    ).toBe("changed");
  });
  for (const reason of ["context", "access", "unmount"] as const)
    it(`${reason} clears operation metadata and requires a new owner epoch`, () => {
      const app = fixture();
      const token = app.start();
      app.coordinator.invalidate(reason);
      expect(app.coordinator.getSnapshot()).toEqual({
        pending: null,
        feedback: null,
      });
      expect(app.coordinator.settle(token, { kind: "accepted" }).status).toBe(
        "ignored",
      );
      expect(app.coordinator.begin(app.current, move)).toEqual({
        status: "blocked",
        reason: "origin",
      });
      app.current = frame({ ownerEpoch: 2 });
      expect(app.start().generation).toBe(2);
    });
  it("context change detected during settlement detaches rather than publishing old success", () => {
    const app = fixture();
    const token = app.start();
    app.current = frame({ ownerEpoch: 2, scopeKey: "scope-b" });
    app.coordinator.settle(token, { kind: "accepted" });
    expect(app.coordinator.getSnapshot()).toEqual({
      pending: null,
      feedback: null,
    });
    expect(app.start().origin.scopeKey).toBe("scope-b");
  });
  it("clears completed feedback on a fresh origin transition", () => {
    const app = fixture();
    const token = app.start();
    app.coordinator.settle(token, { kind: "rejected", code: "conflict" });
    app.current = frame({ ownerEpoch: 2 });
    app.coordinator.reconcile();
    expect(app.coordinator.getSnapshot().feedback).toBeNull();
  });
  it("port exceptions fail closed without publishing sensitive errors", () => {
    const app = fixture();
    const token = app.start();
    app.port(() => {
      throw new Error("synthetic-private");
    });
    app.coordinator.settle(token, { kind: "accepted" });
    expect(app.coordinator.getSnapshot()).toEqual({
      pending: null,
      feedback: null,
    });
    expect(JSON.stringify(app.coordinator.getSnapshot())).not.toContain(
      "synthetic-private",
    );
  });
  it("distinguishes explicit eligibility rejection from unknown port failures", () => {
    const app = fixture();
    app.port(() => {
      throw new ReorderError("reorder.eligibility");
    });
    expect(app.coordinator.begin(app.current, move)).toEqual({
      status: "blocked",
      reason: "eligibility",
    });
    app.port(() => {
      throw new Error("synthetic-private");
    });
    expect(app.coordinator.begin(app.current, move)).toEqual({
      status: "blocked",
      reason: "unavailable",
    });
  });
  it("has stable reads/no-op observations and safe independent subscriptions", () => {
    const app = fixture();
    const initial = app.coordinator.getSnapshot();
    expect(app.coordinator.reconcile().status).toBe("ignored");
    expect(app.coordinator.getSnapshot()).toBe(initial);
    let calls = 0;
    const off = app.coordinator.subscribe(() => {
      calls++;
    });
    const token = app.start();
    expect(calls).toBe(1);
    off();
    off();
    app.coordinator.settle(token, { kind: "accepted" });
    expect(calls).toBe(1);
  });
  it("isolates throwing/async listeners and rejects event reentrancy", async () => {
    const app = fixture();
    let later = 0;
    const results: unknown[] = [];
    app.coordinator.subscribe(() => {
      throw new Error("synthetic-private-listener");
    });
    app.coordinator.subscribe(async () => {
      throw new Error("synthetic-private-async");
    });
    app.coordinator.subscribe(() => {
      later++;
      results.push(app.coordinator.begin(app.current, move));
      results.push(app.coordinator.reconcile());
    });
    const token = app.start();
    await Promise.resolve();
    await Promise.resolve();
    expect(later).toBe(1);
    expect(results).toEqual([
      { status: "blocked", reason: "unavailable" },
      { status: "ignored", reason: "reentrant" },
    ]);
    expect(app.coordinator.getSnapshot().pending?.operation).toBe(token);
    app.coordinator.settle(token, { kind: "rejected", code: "rejected" });
    expect(later).toBe(2);
  });
  it("observer invalidation/disposal wins before begin returns a submission token", () => {
    for (const dispose of [false, true]) {
      const app = fixture();
      app.coordinator.subscribe(() => {
        if (app.coordinator.getSnapshot().pending) {
          if (dispose) app.coordinator.dispose();
          else app.coordinator.invalidate("access");
        }
      });
      expect(app.coordinator.begin(app.current, move)).toEqual({
        status: "blocked",
        reason: "unavailable",
      });
      expect(app.coordinator.getSnapshot().pending).toBeNull();
    }
  });
  it("port reentrancy cannot start another operation or undo synchronous revocation", () => {
    const app = fixture();
    const returned: unknown[] = [];
    app.port(() => {
      returned.push(app.coordinator.begin(app.current, move));
      app.coordinator.invalidate("access");
      return app.current;
    });
    expect(app.coordinator.begin(app.current, move).status).toBe("blocked");
    expect(returned).toEqual([{ status: "blocked", reason: "unavailable" }]);
    app.port(() => app.current);
    expect(app.coordinator.begin(app.current, move).status).toBe("blocked");
    app.current = frame({ ownerEpoch: 2 });
    expect(app.start().generation).toBe(1);
  });
  it("removed listeners are not called; disposed coordinator cannot revive or read app ports", () => {
    const app = fixture();
    let removed = 0;
    const off = app.coordinator.subscribe(() => {
      removed++;
    });
    off();
    const token = app.start();
    app.coordinator.dispose();
    const count = app.calls.length;
    const state = app.coordinator.getSnapshot();
    app.coordinator.dispose();
    app.coordinator.invalidate("access");
    expect(app.coordinator.begin(frame({ ownerEpoch: 100 }), move).status).toBe(
      "blocked",
    );
    expect(app.coordinator.settle(token, { kind: "accepted" }).status).toBe(
      "ignored",
    );
    expect(app.coordinator.reconcile().status).toBe("ignored");
    app.coordinator.subscribe(() => {
      removed++;
    })();
    expect(app.calls).toHaveLength(count);
    expect(app.coordinator.getSnapshot()).toBe(state);
    expect(removed).toBe(0);
  });
});
