import { describe, expect, it } from "vitest";
import type {
  ResourceInvalidation,
  ResourceRequest,
  ResourceSuccess,
} from "../../packages/react/dist/resource/index.js";
import {
  createResourceAdapter,
  projectResourceView,
} from "../../packages/react/dist/resource/index.js";
import type { Row } from "./fixtures.js";
import { context, input, success } from "./fixtures.js";

describe("G-03 identity-tagged presentation buffer", () => {
  it("retains A's actual page through B failure; Retry B accepts empty B permanently", () => {
    const adapter = createResourceAdapter<Row>(context);
    const a = adapter.begin(input("a", 2));
    expect(a).not.toBeNull();
    if (!a) throw new Error("Missing token");
    adapter.succeed(a, success(["a"]));
    const snapshotA = adapter.getSnapshot().snapshot;
    let retried: ResourceRequest | undefined;
    const b = adapter.begin(
      input("b", 5, {
        retry(request) {
          retried = request;
        },
      }),
    );
    if (!b) throw new Error("Missing token");
    const pending = adapter.getSnapshot();
    expect(pending.snapshot).toBe(snapshotA);
    expect(pending.snapshot?.query.pagination.pageIndex).toBe(2);
    expect(pending.request?.query.pagination.pageIndex).toBe(5);
    expect(pending).toMatchObject({
      busy: true,
      stale: true,
      obsolete: true,
      display: "records",
      notice: "updating",
      canSelect: false,
      canReorder: false,
      canNavigate: false,
    });
    expect(adapter.fail(b, "timeout")).toBe(true);
    expect(adapter.getSnapshot()).toMatchObject({
      kind: "failure",
      display: "records",
      notice: "update-failed",
      canRetry: true,
      snapshot: snapshotA,
    });
    const retry = adapter.retry();
    expect(retry).toBe(retried);
    expect(retry).toMatchObject({
      queryKey: "b",
      requestKey: "b",
      scopeKey: context.scopeKey,
      definitionKey: context.definitionKey,
      query: b.query,
    });
    expect(retry?.generation).toBeGreaterThan(b.generation);
    if (!retry) throw new Error("Missing retry token");
    expect(adapter.succeed(retry, success([], { emptyKind: "filtered" }))).toBe(
      true,
    );
    expect(adapter.getSnapshot()).toMatchObject({
      kind: "ready",
      display: "empty",
      notice: null,
      stale: false,
      obsolete: false,
      snapshot: { records: [], queryKey: "b", emptyKind: "filtered" },
    });
    expect(adapter.succeed(a, success(["late-a"]))).toBe(false);
    expect(adapter.succeed(b, success(["late-b"]))).toBe(false);
    const c = adapter.begin(input("c"));
    if (!c) throw new Error("Missing token");
    adapter.fail(c, "offline");
    expect(adapter.getSnapshot().snapshot?.records).toEqual([]);
    expect(adapter.getSnapshot().display).toBe("updating-empty");
    expect(adapter.getSnapshot().snapshot).not.toBe(snapshotA);
  });

  it("rejects an uncancellable late A after B finishes, without an abort dependency", async () => {
    const adapter = createResourceAdapter<Row>(context);
    let resolveA: (value: ReturnType<typeof success>) => void = () => {};
    const pendingA = new Promise<ReturnType<typeof success>>((resolve) => {
      resolveA = resolve;
    });
    const a = adapter.begin(input("a"));
    if (!a) throw new Error("Missing token");
    const acceptedA = pendingA.then((result) => adapter.succeed(a, result));
    const b = adapter.begin(input("b"));
    if (!b) throw new Error("Missing token");
    expect(adapter.succeed(b, success(["b"]))).toBe(true);
    const before = adapter.getSnapshot();
    resolveA(success(["late-a"]));
    expect(await acceptedA).toBe(false);
    expect(adapter.getSnapshot()).toBe(before);
    expect(adapter.fail(a, "access-lost")).toBe(false);
    expect(adapter.getSnapshot().context.access).toBe(true);
  });

  it("guards same-key generations and same-key refetch failure without query resets", () => {
    const adapter = createResourceAdapter<Row>(context);
    const a = adapter.begin(input("a", 3));
    if (!a) throw new Error("Missing token");
    adapter.succeed(a, success());
    const original = adapter.getSnapshot().snapshot;
    const refresh = adapter.begin(input("a", 3));
    if (!refresh) throw new Error("Missing token");
    expect(refresh.generation).toBeGreaterThan(a.generation);
    expect(adapter.getSnapshot()).toMatchObject({
      busy: true,
      stale: true,
      obsolete: false,
      canSelect: true,
      canReorder: false,
      canNavigate: false,
    });
    adapter.fail(refresh, "unavailable");
    expect(adapter.getSnapshot().snapshot).toBe(original);
    expect(adapter.getSnapshot().request?.query).toEqual(a.query);
    expect(adapter.getSnapshot().canRetry).toBe(false);
    expect(adapter.retry()).toBeNull();
    expect(adapter.succeed(refresh, success(["too-late"]))).toBe(false);
  });

  it("does not treat matching string keys as permission to act on different query/page values", () => {
    const adapter = createResourceAdapter<Row>(context);
    const a = adapter.begin(input("same", 0));
    if (!a) throw new Error("Missing token");
    adapter.succeed(a, success());
    adapter.begin(input("same", 4));
    expect(adapter.getSnapshot().obsolete).toBe(true);
    expect(adapter.getSnapshot().canSelect).toBe(false);
  });

  it("never promotes placeholder records, even without a prior snapshot", () => {
    const adapter = createResourceAdapter<Row>(context);
    const a = adapter.begin(input());
    if (!a) throw new Error("Missing token");
    const before = adapter.getSnapshot();
    expect(
      adapter.succeed(a, success(["placeholder"], { source: "placeholder" })),
    ).toBe(false);
    expect(adapter.getSnapshot()).toBe(before);
    expect(adapter.getSnapshot().display).toBe("loading");
    expect(adapter.succeed(a, success())).toBe(true);
    const b = adapter.begin(input("b"));
    if (!b) throw new Error("Missing token");
    adapter.succeed(b, success(["placeholder-b"], { source: "placeholder" }));
    expect(adapter.getSnapshot().snapshot?.queryKey).toBe("a");
    expect(adapter.fail(b, "unavailable")).toBe(true);
  });

  it("requires exact tokens, rejecting copied, wrong-scope and cross-adapter completions", () => {
    const adapter = createResourceAdapter<Row>(context);
    const other = createResourceAdapter<Row>(context);
    const a = adapter.begin(input());
    const otherA = other.begin(input());
    if (!a || !otherA) throw new Error("Missing token");
    const before = adapter.getSnapshot();
    for (const wrong of [
      { ...a },
      { ...a, scopeKey: "other" },
      { ...a, queryKey: "other" },
      { ...a, definitionKey: "other" },
      { ...a, generation: a.generation + 1 },
      otherA,
    ]) {
      expect(adapter.succeed(wrong, success())).toBe(false);
      expect(adapter.fail(wrong, "access-lost")).toBe(false);
      expect(adapter.getSnapshot()).toBe(before);
    }
    expect(adapter.succeed(a, success())).toBe(true);
  });

  it("accepts only one fresh settlement and does not turn late failures into access loss", () => {
    const adapter = createResourceAdapter<Row>(context);
    const a = adapter.begin(input());
    if (!a) throw new Error("Missing token");
    adapter.succeed(a, success());
    const before = adapter.getSnapshot();
    expect(adapter.succeed(a, success(["duplicate"]))).toBe(false);
    expect(adapter.fail(a, "access-lost")).toBe(false);
    expect(adapter.getSnapshot()).toBe(before);
  });
});

describe("AC-14/15 truthful precedence and provenance", () => {
  it("starts idle, distinguishes initial pending/error, and supplies no fake Retry", () => {
    const adapter = createResourceAdapter<Row>(context);
    expect(adapter.getSnapshot()).toMatchObject({
      kind: "idle",
      display: "idle",
      snapshot: null,
    });
    const a = adapter.begin(input());
    if (!a) throw new Error("Missing token");
    expect(adapter.getSnapshot()).toMatchObject({
      kind: "pending",
      display: "loading",
      snapshot: null,
      canSelect: false,
      canNavigate: false,
    });
    adapter.fail(a, "offline");
    expect(adapter.getSnapshot()).toMatchObject({
      kind: "failure",
      display: "error",
      snapshot: null,
      canRetry: false,
    });
    expect(adapter.retry()).toBeNull();
  });

  for (const emptyKind of ["dataset", "filtered", "unknown"] as const)
    it(`preserves explicit ${emptyKind} empty context without inferring from zero rows`, () => {
      const adapter = createResourceAdapter<Row>(context);
      const a = adapter.begin(input());
      if (!a) throw new Error("Missing token");
      adapter.succeed(
        a,
        success([], {
          emptyKind,
          page: { kind: "unknown", hasNextPage: true },
        }),
      );
      expect(adapter.getSnapshot()).toMatchObject({
        display: "empty",
        snapshot: { emptyKind, page: { kind: "unknown", hasNextPage: true } },
      });
      const b = adapter.begin(input("b"));
      if (!b) throw new Error("Missing token");
      expect(adapter.getSnapshot().display).toBe("updating-empty");
      adapter.fail(b, "timeout");
      expect(adapter.getSnapshot()).toMatchObject({
        display: "updating-empty",
        notice: "update-failed",
      });
    });

  it("copies known/unknown metadata but never guesses unknown totals or new page metadata", () => {
    const adapter = createResourceAdapter<Row>(context);
    const a = adapter.begin(input("a", 1));
    if (!a) throw new Error("Missing token");
    adapter.succeed(
      a,
      success(["a"], { page: { kind: "unknown", hasNextPage: false } }),
    );
    expect(adapter.getSnapshot().snapshot?.page).toEqual({
      kind: "unknown",
      hasNextPage: false,
    });
    adapter.begin(input("b", 2));
    expect(adapter.getSnapshot().snapshot?.page).toEqual({
      kind: "unknown",
      hasNextPage: false,
    });
    expect(adapter.getSnapshot().snapshot?.query.pagination.pageIndex).toBe(1);
    expect(adapter.getSnapshot().canNavigate).toBe(false);
  });

  it("copies/freezes producer structures, not application record objects", () => {
    const adapter = createResourceAdapter<Row>(context);
    const requestInput = input();
    const a = adapter.begin(requestInput);
    if (!a) throw new Error("Missing token");
    expect(a.query).not.toBe(requestInput.query);
    expect(Object.isFrozen(a.query.pagination)).toBe(true);
    const record = { id: "a" };
    const records = [record];
    const page = { kind: "known" as const, total: 10 };
    adapter.succeed(a, success([], { records, page }));
    records.push({ id: "b" });
    page.total = 20;
    const view = adapter.getSnapshot();
    expect(view.snapshot?.records).toEqual([record]);
    expect(view.snapshot?.page).toEqual({ kind: "known", total: 10 });
    expect(view.snapshot?.records[0]).toBe(record);
    expect(Object.isFrozen(record)).toBe(false);
    expect(Object.isFrozen(view.snapshot?.records)).toBe(true);
    expect(Object.isFrozen(view)).toBe(true);
  });

  for (const patch of [
    { page: { kind: "known", total: -1 } },
    { page: { kind: "known", total: 1.5 } },
    { page: { kind: "known", total: Number.POSITIVE_INFINITY } },
    { page: { kind: "unknown" } },
    { page: { kind: "unknown", hasNextPage: "maybe" } },
    { page: { kind: "invented", total: 2 } },
    { emptyKind: "invented" },
    { source: "cached" },
    { records: { length: 1 } },
    { receivedAt: "invalid-synthetic-timestamp" },
  ])
    it(`rejects malformed fresh provenance atomically: ${JSON.stringify(patch)}`, () => {
      const adapter = createResourceAdapter<Row>(context);
      const a = adapter.begin(input());
      if (!a) throw new Error("Missing token");
      const before = adapter.getSnapshot();
      expect(() =>
        adapter.succeed(a, {
          ...success(),
          ...patch,
        } as unknown as ResourceSuccess<Row>),
      ).toThrow("Invalid Tableweave resource input.");
      expect(adapter.getSnapshot()).toBe(before);
      expect(adapter.succeed(a, success())).toBe(true);
    });

  it("rejects invalid request input without invalidating the outstanding valid generation", () => {
    const adapter = createResourceAdapter<Row>(context);
    const a = adapter.begin(input());
    if (!a) throw new Error("Missing token");
    const before = adapter.getSnapshot();
    expect(() =>
      adapter.begin(
        input("b", 0, {
          query: { ...a.query, pagination: { pageIndex: -1, pageSize: 25 } },
        }),
      ),
    ).toThrow("Invalid Tableweave resource input.");
    expect(() => adapter.begin(input("b", 0, { requestKey: "" }))).toThrow(
      "Invalid Tableweave resource input.",
    );
    expect(adapter.getSnapshot()).toBe(before);
    expect(adapter.succeed(a, success())).toBe(true);
  });
});

describe("safe public errors and application-owned retry", () => {
  for (const code of ["unavailable", "offline", "timeout"])
    it(`allowlists ${code} rather than reading an arbitrary error message`, () => {
      const adapter = createResourceAdapter<Row>(context);
      const a = adapter.begin(input());
      if (!a) throw new Error("Missing token");
      adapter.fail(a, code);
      expect(adapter.getSnapshot().error?.code).toBe(code);
      expect(Object.keys(adapter.getSnapshot().error ?? {})).toEqual([
        "code",
        "message",
      ]);
    });

  it("maps errors, attacker strings and inherited keys to a fixed safe message", () => {
    const dangerous = {
      get message(): never {
        throw new Error("synthetic-private-message");
      },
      code: "access-lost",
      records: ["synthetic-private-record"],
    };
    for (const error of [
      new Error("synthetic-private-stack"),
      dangerous,
      "constructor",
      "__proto__",
      "synthetic-private-token",
      null,
    ]) {
      const adapter = createResourceAdapter<Row>(context);
      const a = adapter.begin(input());
      if (!a) throw new Error("Missing token");
      expect(adapter.fail(a, error)).toBe(true);
      expect(adapter.getSnapshot().error).toEqual({
        code: "unavailable",
        message: "Records could not be loaded.",
      });
      expect(adapter.getSnapshot().context.access).toBe(true);
    }
  });

  it("allows synchronous retry completion without reentrancy dropping it", () => {
    const adapter = createResourceAdapter<Row>(context);
    const a = adapter.begin(
      input("a", 4, {
        retry(next) {
          adapter.succeed(next, success(["retry"]));
        },
      }),
    );
    if (!a) throw new Error("Missing token");
    adapter.fail(a, "timeout");
    const next = adapter.retry();
    expect(adapter.getSnapshot()).toMatchObject({
      kind: "ready",
      request: next,
      snapshot: { records: [{ id: "retry" }] },
    });
    expect(adapter.retry()).toBeNull();
  });

  it("maps thrown/rejected retry failures and ignores obsolete retry rejections", async () => {
    for (const retry of [
      () => {
        throw new Error("synthetic-secret");
      },
      () => Promise.reject(new Error("synthetic-secret")),
    ]) {
      const adapter = createResourceAdapter<Row>(context);
      const a = adapter.begin(input("a", 0, { retry }));
      if (!a) throw new Error("Missing token");
      adapter.fail(a, "timeout");
      adapter.retry();
      await Promise.resolve();
      await Promise.resolve();
      expect(adapter.getSnapshot().error).toEqual({
        code: "unavailable",
        message: "Records could not be loaded.",
      });
    }
    const adapter = createResourceAdapter<Row>(context);
    let reject: (error: Error) => void = () => {};
    const a = adapter.begin(
      input("a", 0, {
        retry: () =>
          new Promise((_resolve, fail) => {
            reject = fail;
          }),
      }),
    );
    if (!a) throw new Error("Missing token");
    adapter.fail(a, "timeout");
    adapter.retry();
    const b = adapter.begin(input("b"));
    if (!b) throw new Error("Missing token");
    adapter.succeed(b, success(["b"]));
    const before = adapter.getSnapshot();
    reject(new Error("synthetic-secret"));
    await Promise.resolve();
    await Promise.resolve();
    expect(adapter.getSnapshot()).toBe(before);
  });
});

describe("AC-16/17 scope, permission and lifetime invalidation", () => {
  for (const transition of [
    { next: { ...context, scopeKey: "scope-b" }, reason: "scope-change" },
    {
      next: { ...context, definitionKey: "definition-2" },
      reason: "definition-change",
    },
    { next: { ...context, access: false }, reason: "access-loss" },
  ] as const)
    it(`clears rows, pending tokens and app lifecycle state on ${transition.reason}`, () => {
      const external = {
        selection: ["a"],
        details: "a",
        labels: ["Label A"],
        move: "a",
      };
      const events: ResourceInvalidation[] = [];
      const adapter = createResourceAdapter<Row>(context, {
        onInvalidate(event) {
          expect(adapter.getSnapshot().snapshot).toBeNull();
          external.selection = [];
          external.details = "";
          external.labels = [];
          external.move = "";
          events.push(event);
        },
      });
      const a = adapter.begin(input());
      if (!a) throw new Error("Missing token");
      adapter.succeed(a, success());
      const b = adapter.begin(input("b"));
      if (!b) throw new Error("Missing token");
      adapter.setContext(transition.next);
      expect(adapter.getSnapshot().snapshot).toBeNull();
      expect(adapter.getSnapshot().request).toBeNull();
      expect(adapter.getSnapshot().canRetry).toBe(false);
      expect(external).toEqual({
        selection: [],
        details: "",
        labels: [],
        move: "",
      });
      expect(events).toHaveLength(1);
      expect(events[0]?.reason).toBe(transition.reason);
      expect(adapter.succeed(b, success(["late-private"]))).toBe(false);
      expect(adapter.begin(input())).toBeNull();
      expect(adapter.retry()).toBeNull();
    });

  it("treats current access failure as terminal, never ordinary retained-row failure", () => {
    const reasons: string[] = [];
    const adapter = createResourceAdapter<Row>(context, {
      onInvalidate: ({ reason }) => {
        reasons.push(reason);
      },
    });
    const a = adapter.begin(input());
    if (!a) throw new Error("Missing token");
    adapter.succeed(a, success());
    const b = adapter.begin(
      input("b", 0, {
        retry() {
          throw new Error("Must not retry");
        },
      }),
    );
    if (!b) throw new Error("Missing token");
    expect(adapter.fail(b, "access-lost")).toBe(true);
    expect(adapter.getSnapshot()).toMatchObject({
      kind: "blocked",
      display: "blocked",
      snapshot: null,
      request: null,
      canRetry: false,
    });
    expect(adapter.begin(input("b"))).toBeNull();
    expect(adapter.succeed(b, success())).toBe(false);
    expect(adapter.retry()).toBeNull();
    expect(reasons).toEqual(["access-loss"]);
    adapter.setContext(context); // Explicit application permission restoration.
    expect(adapter.getSnapshot().snapshot).toBeNull();
    expect(adapter.succeed(b, success())).toBe(false);
    const fresh = adapter.begin(input("b"));
    if (!fresh) throw new Error("Missing token");
    expect(adapter.succeed(fresh, success(["newly-authorized"]))).toBe(true);
  });

  it("starts denied without requests and never assumes permission from a scope key", () => {
    const adapter = createResourceAdapter<Row>({ ...context, access: false });
    expect(adapter.getSnapshot()).toMatchObject({
      kind: "blocked",
      snapshot: null,
    });
    expect(adapter.begin(input())).toBeNull();
    adapter.setContext({ ...context, scopeKey: "scope-b", access: false });
    expect(adapter.begin(input("a", 0, { scopeKey: "scope-b" }))).toBeNull();
  });

  it("clears on unmount, reconnects after StrictMode replay and rejects old cleanup/tokens", () => {
    const adapter = createResourceAdapter<Row>(context);
    const cleanup = adapter.connect();
    const a = adapter.begin(input());
    if (!a) throw new Error("Missing token");
    adapter.succeed(a, success());
    cleanup();
    expect(adapter.getSnapshot()).toMatchObject({
      active: false,
      snapshot: null,
      request: null,
    });
    expect(adapter.begin(input())).toBeNull();
    const cleanup2 = adapter.connect();
    const b = adapter.begin(input("b"));
    if (!b) throw new Error("Missing token");
    cleanup(); // Old cleanup cannot disconnect the new owner.
    expect(adapter.succeed(a, success())).toBe(false);
    expect(adapter.succeed(b, success(["new"]))).toBe(true);
    cleanup2();
    expect(adapter.getSnapshot().snapshot).toBeNull();
  });

  it("clears on explicit reset/disposal and never revives disposed stores", () => {
    const adapter = createResourceAdapter<Row>(context);
    const a = adapter.begin(input());
    if (!a) throw new Error("Missing token");
    adapter.succeed(a, success());
    adapter.clear();
    expect(adapter.getSnapshot().snapshot).toBeNull();
    const b = adapter.begin(input("b"));
    if (!b) throw new Error("Missing token");
    adapter.dispose();
    const disposed = adapter.getSnapshot();
    adapter.setContext(context);
    adapter.clear();
    adapter.connect()();
    expect(adapter.getSnapshot()).toBe(disposed);
    expect(adapter.begin(input())).toBeNull();
    expect(adapter.succeed(b, success())).toBe(false);
  });

  it("fails closed if the app lifecycle clear throws, without exposing its error", () => {
    let broken = true;
    const adapter = createResourceAdapter<Row>(context, {
      onInvalidate() {
        if (broken) throw new Error("synthetic-private-state");
      },
    });
    const a = adapter.begin(input());
    if (!a) throw new Error("Missing token");
    adapter.succeed(a, success());
    adapter.setContext({ ...context, scopeKey: "scope-b" });
    expect(adapter.getSnapshot()).toMatchObject({
      snapshot: null,
      request: null,
      invalidationFailed: true,
      canSelect: false,
    });
    expect(adapter.begin(input("b", 0, { scopeKey: "scope-b" }))).toBeNull();
    expect(JSON.stringify(adapter.getSnapshot())).not.toContain(
      "synthetic-private-state",
    );
    broken = false;
    adapter.clear();
    expect(adapter.getSnapshot().invalidationFailed).toBe(false);
    expect(
      adapter.begin(input("b", 0, { scopeKey: "scope-b" })),
    ).not.toBeNull();
  });

  it("rejects deferred lifecycle clearing and handles rejected async callbacks safely", async () => {
    const adapter = createResourceAdapter<Row>(context, {
      async onInvalidate() {
        throw new Error("synthetic-private-async-state");
      },
    });
    const a = adapter.begin(input());
    if (!a) throw new Error("Missing token");
    adapter.succeed(a, success());
    adapter.clear();
    expect(adapter.getSnapshot()).toMatchObject({
      snapshot: null,
      request: null,
      invalidationFailed: true,
    });
    expect(adapter.begin(input())).toBeNull();
    await Promise.resolve();
    await Promise.resolve();
    expect(JSON.stringify(adapter.getSnapshot())).not.toContain(
      "synthetic-private-async-state",
    );
  });

  it("purely suppresses render-time scope, definition and permission mismatches", () => {
    const adapter = createResourceAdapter<Row>(context);
    const a = adapter.begin(input());
    if (!a) throw new Error("Missing token");
    adapter.succeed(a, success());
    const before = adapter.getSnapshot();
    expect(projectResourceView(before, context)).toBe(before);
    for (const expected of [
      { ...context, scopeKey: "scope-b" },
      { ...context, definitionKey: "definition-2" },
      { ...context, access: false },
    ]) {
      const projected = projectResourceView(before, expected);
      expect(projected.snapshot).toBeNull();
      expect(projected.request).toBeNull();
      expect(projected.canSelect).toBe(false);
      expect(adapter.getSnapshot()).toBe(before);
    }
  });
});

describe("reactive external-store contract", () => {
  it("has stable current/server reads, notifies real changes, and unsubscribes safely", () => {
    const adapter = createResourceAdapter<Row>(context);
    const initial = adapter.getSnapshot();
    expect(adapter.getSnapshot()).toBe(initial);
    expect(adapter.getServerSnapshot()).toBe(initial);
    let notifications = 0;
    const stop = adapter.subscribe(() => {
      notifications++;
    });
    const a = adapter.begin(input());
    if (!a) throw new Error("Missing token");
    expect(notifications).toBe(1);
    adapter.succeed(a, success());
    expect(notifications).toBe(2);
    adapter.succeed(a, success());
    adapter.setContext(context);
    expect(notifications).toBe(2);
    expect(adapter.getServerSnapshot()).toBe(initial);
    expect(adapter.getServerSnapshot().snapshot).toBeNull();
    stop();
    stop();
    adapter.clear();
    expect(notifications).toBe(2);
  });

  it("isolates independent actors/stores without global buffers or disposal coupling", () => {
    const a = createResourceAdapter<Row>(context);
    const b = createResourceAdapter<Row>({ ...context, scopeKey: "scope-b" });
    const requestA = a.begin(input());
    const requestB = b.begin(input("b", 0, { scopeKey: "scope-b" }));
    if (!requestA || !requestB) throw new Error("Missing token");
    a.succeed(requestA, success(["actor-a"]));
    b.succeed(requestB, success(["actor-b"]));
    const beforeB = b.getSnapshot();
    a.dispose();
    expect(b.getSnapshot()).toBe(beforeB);
    expect(b.getSnapshot().snapshot?.records).toEqual([{ id: "actor-b" }]);
    expect(a.getServerSnapshot().snapshot).toBeNull();
    expect(b.getServerSnapshot().snapshot).toBeNull();
  });

  it("does not drop synchronous permission invalidation during observer notification", () => {
    const adapter = createResourceAdapter<Row>(context);
    const a = adapter.begin(input());
    if (!a) throw new Error("Missing token");
    adapter.succeed(a, success());
    let clearedSynchronously = false;
    adapter.subscribe(() => {
      if (adapter.getSnapshot().kind !== "pending") return;
      adapter.setContext({ ...context, access: false });
      clearedSynchronously = adapter.getSnapshot().snapshot === null;
    });
    expect(adapter.begin(input("b"))).toBeNull();
    expect(clearedSynchronously).toBe(true);
    expect(adapter.getSnapshot()).toMatchObject({
      kind: "blocked",
      snapshot: null,
      request: null,
    });
    expect(adapter.succeed(a, success(["obsolete"]))).toBe(false);
  });

  it("honors observer disposal before handing a request to the application", () => {
    const adapter = createResourceAdapter<Row>(context);
    adapter.subscribe(() => adapter.dispose());
    expect(adapter.begin(input())).toBeNull();
    expect(adapter.getSnapshot()).toMatchObject({
      kind: "disposed",
      snapshot: null,
      request: null,
    });
  });

  it("rejects observer reentrancy, isolates throwing listeners and cleans up removed listeners", () => {
    const adapter = createResourceAdapter<Row>(context);
    let received = 0;
    const off = adapter.subscribe(() => {
      throw new Error("synthetic-private-observer");
    });
    const stopRemoved = adapter.subscribe(() => {
      received++;
    });
    stopRemoved();
    adapter.subscribe(() => {
      received++;
      expect(adapter.begin(input("reentrant"))).toBeNull();
    });
    const a = adapter.begin(input());
    if (!a) throw new Error("Missing token");
    expect(adapter.getSnapshot().request).toBe(a);
    expect(received).toBe(1);
    off();
    adapter.succeed(a, success());
    expect(received).toBe(2);
  });

  it("bounds presentation state to one current snapshot through repeated query changes", () => {
    const adapter = createResourceAdapter<Row>(context);
    for (let index = 0; index < 50; index++) {
      const request = adapter.begin(input(`key-${index}`));
      if (!request) throw new Error("Missing token");
      adapter.succeed(request, success([`row-${index}`]));
    }
    expect(adapter.getSnapshot().snapshot?.records).toEqual([{ id: "row-49" }]);
    expect(
      Object.keys(adapter.getSnapshot()).filter((key) =>
        /snapshot|previous|cache/i.test(key),
      ),
    ).toEqual(["snapshot"]);
  });
});
