import { expect, test } from "vitest";
import { createResourceAdapter } from "../../../packages/react/src/resource/adapter.js";
import { projectResourceView } from "../../../packages/react/src/resource/view.js";
import { context, fixture, input, requireToken, success } from "./fixtures.js";

const complete = { kind: "complete" } as const;
for (const reverse of [false, true])
  test(`page/complete same opaque keys and exact query are obsolete, reverse=${reverse}`, () => {
    const f = fixture(),
      page = { kind: "page", pageIndex: 0, pageSize: 25 } as const;
    const a = requireToken(
      f.adapter.begin(
        input("same", 0, { extent: reverse ? complete : page, evaluatedAt: 0 }),
      ),
    );
    f.adapter.succeed(a, success(1));
    const original = f.adapter.getSnapshot().snapshot;
    const b = requireToken(
      f.adapter.begin(
        input("same", 0, { extent: reverse ? page : complete, evaluatedAt: 0 }),
      ),
    );
    expect(b.query).toEqual(a.query);
    expect(f.adapter.getSnapshot().snapshot).toBe(original);
    expect(f.adapter.getSnapshot().obsolete).toBe(true);
    expect(f.adapter.getSnapshot().canSelect).toBe(false);
  });
for (const reverse of [false, true])
  test(`legacy and matching explicit page resolve equally, reverse=${reverse}`, () => {
    const f = fixture(),
      explicit = {
        extent: { kind: "page" as const, pageIndex: 0, pageSize: 25 },
        evaluatedAt: 0,
      };
    const a = requireToken(
      f.adapter.begin(input("same", 0, reverse ? explicit : {})),
    );
    f.adapter.succeed(a, success(1));
    f.adapter.begin(input("same", 0, reverse ? {} : explicit));
    const v = f.adapter.getSnapshot();
    expect(v.obsolete).toBe(false);
    expect(v.stale).toBe(true);
    expect(v.canSelect).toBe(true);
  });
test("evaluation time alone does not migrate semantic obsolescence or relabel retained snapshots", () => {
  const f = fixture(),
    a = requireToken(
      f.adapter.begin(input("same", 0, { extent: complete, evaluatedAt: -1 })),
    );
  f.adapter.succeed(a, success(1));
  const original = f.adapter.getSnapshot().snapshot;
  const b = requireToken(
    f.adapter.begin(input("same", 0, { extent: complete, evaluatedAt: 0.5 })),
  );
  expect(f.adapter.getSnapshot().obsolete).toBe(false);
  expect(f.adapter.getSnapshot().canSelect).toBe(true);
  expect(f.adapter.getSnapshot().snapshot).toBe(original);
  expect(original?.evaluatedAt).toBe(-1);
  expect(b.evaluatedAt).toBe(0.5);
});
test("A complete → pending/failure B page → retry B keeps original metadata until fresh0 permanently replaces A", () => {
  const f = fixture(),
    a = requireToken(
      f.adapter.begin(input("a", 0, { extent: complete, evaluatedAt: 0 })),
    );
  f.adapter.succeed(a, success(137));
  const original = f.adapter.getSnapshot().snapshot;
  let retryThis: unknown = "not-called",
    transported: unknown;
  const b = requireToken(
    f.adapter.begin(
      input("b", 3, {
        extent: { kind: "page", pageIndex: 3, pageSize: 25 },
        evaluatedAt: 0.5,
        retry: function (this: unknown, next) {
          retryThis = this;
          transported = next;
          expect(f.adapter.getSnapshot().request).toBe(next);
          expect(next.extent).toEqual(b.extent);
          expect(next.evaluatedAt).toBe(0.5);
          expect(next.query).toEqual(b.query);
          f.adapter.succeed(next, success(0));
        },
      }),
    ),
  );
  expect(f.adapter.getSnapshot().snapshot).toBe(original);
  expect(original?.extent).toBe(a.extent);
  expect(original?.evaluatedAt).toBe(0);
  f.adapter.fail(b, "timeout");
  expect(f.adapter.getSnapshot().canRetry).toBe(true);
  const retry = requireToken(f.adapter.retry());
  expect(retry).toBe(transported);
  expect(retry.generation).toBe(b.generation + 1);
  expect(retryThis).toBeUndefined();
  const empty = f.adapter.getSnapshot().snapshot;
  expect(empty?.records).toEqual([]);
  expect(empty?.extent).toEqual(b.extent);
  expect(empty?.evaluatedAt).toBe(0.5);
  expect(empty).not.toBe(original);
  const c = requireToken(
    f.adapter.begin(input("c", 0, { extent: complete, evaluatedAt: 10 })),
  );
  f.adapter.fail(c, "offline");
  expect(f.adapter.getSnapshot().snapshot).toBe(empty);
  expect(f.adapter.getSnapshot().display).toBe("updating-empty");
  expect(f.adapter.succeed(a, success(137))).toBe(false);
});
test("context privacy, last-fresh buffer and old connection cleanup remain real for complete metadata", () => {
  const f = fixture(),
    cleanup = f.adapter.connect(),
    token = requireToken(
      f.adapter.begin(
        input("private", 0, { extent: complete, evaluatedAt: 0 }),
      ),
    );
  f.adapter.succeed(token, success(137));
  const before = f.adapter.getSnapshot();
  const projected = projectResourceView(before, {
    ...context,
    scopeKey: "other",
  });
  expect(projected.snapshot).toBeNull();
  expect(f.adapter.getSnapshot()).toBe(before);
  cleanup();
  expect(f.adapter.getSnapshot().snapshot).toBeNull();
  const newCleanup = f.adapter.connect();
  const fresh = requireToken(
    f.adapter.begin(input("fresh", 0, { extent: complete, evaluatedAt: 0 })),
  );
  cleanup();
  expect(f.adapter.succeed(fresh, success(0))).toBe(true);
  newCleanup();
  expect(f.adapter.succeed(token, success(137))).toBe(false);
});
test("observer scope loss/disposal can revoke admission before transport; subscription reentry cannot mint a token", () => {
  for (const action of ["scope", "dispose"] as const) {
    const adapter = createResourceAdapter(context);
    const stop = adapter.subscribe(() => {
      if (adapter.getSnapshot().kind !== "pending") return;
      expect(adapter.begin(input())).toBeNull();
      if (action === "scope") adapter.setContext({ ...context, access: false });
      else adapter.dispose();
    });
    expect(
      adapter.begin(input("notify", 0, { extent: complete, evaluatedAt: 0 })),
    ).toBeNull();
    expect(adapter.getSnapshot().request).toBeNull();
    expect(adapter.getSnapshot().snapshot).toBeNull();
    stop();
  }
});
