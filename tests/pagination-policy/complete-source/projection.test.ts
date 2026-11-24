import { expect, test } from "vitest";
import { projectControls } from "../../../packages/react/src/presentation/project.js";
import { context, fixture, records, required } from "./fixtures.js";

for (const kind of ["client", "known", "unknown"] as const)
  for (const empty of [false, true])
    for (const owner of [1, 2])
      test(`enabled controls ${kind}/empty${empty}/owner${owner} retain page behavior`, () => {
        const f = fixture(true),
          data = empty ? [] : records.slice(0, 2);
        if (kind === "client") {
          const facts = f.project(f.client(data));
          expect(facts.paginationEnabled).toBe(true);
          expect(facts.displayed?.extent).toEqual({
            kind: "page",
            pageIndex: 0,
            pageSize: 25,
          });
          expect(facts.displayed?.pageCount).toBe(empty ? 0 : 1);
          expect(facts.blockedReason).toBeNull();
          return;
        }
        const a = required(f.begin("page", undefined, owner === 2));
        f.succeed(
          a.request,
          data,
          kind === "known"
            ? { kind, total: data.length }
            : { kind, hasNextPage: !empty },
        );
        const facts = f.project(f.remote());
        expect(facts.paginationEnabled).toBe(true);
        expect(facts.blockedReason).toBeNull();
        expect(facts.canSelect).toBe(true);
        expect(facts.canNavigate).toBe(true);
        expect(facts.displayed?.extent.kind).toBe("page");
        expect(facts.displayed?.pageCount).toBe(
          kind === "known" ? (empty ? 0 : 1) : null,
        );
        expect(facts.canNextPage).toBe(kind === "unknown" && !empty);
      });

for (const count of [0, 137, 173])
  for (const owner of [1, 2])
    test(`genuine complete${count}/owner${owner}: selection and range without navigation`, () => {
      const f = fixture(false, { filtered: true, sorted: true }),
        start = required(f.begin()),
        supplied = records.slice(0, count).reverse();
      expect(f.succeed(start.request, supplied)).toBe(true);
      const input = f.remote();
      f.reset();
      const facts = f.project(input);
      expect(facts.paginationEnabled).toBe(false);
      expect(facts.blockedReason).toBeNull();
      expect(facts.canSelect).toBe(true);
      expect(facts.canNavigate).toBe(false);
      expect(facts.canPreviousPage).toBe(false);
      expect(facts.canNextPage).toBe(false);
      expect(facts.displayed?.extent).toEqual({ kind: "complete" });
      expect(facts.displayed?.pageCount).toBeNull();
      expect(facts.displayed?.range).toEqual(
        count ? { from: 1, to: count } : { from: 0, to: 0 },
      );
      expect(facts.rows.map((row) => row.original)).toEqual(supplied);
      expect(facts.displayed?.request?.extent).toEqual({ kind: "complete" });
      expect(facts.displayed?.request?.evaluatedAt).toBe(0);
      expect(facts.missingSelectedIds).toContain("offscreen");
      const authority = f.authority(input),
        previous = f.controller.getSnapshot();
      for (const action of [
        () => authority.nextPage(),
        () => authority.previousPage(),
        () => authority.setPageIndex(0),
        () => authority.setPageSize(25),
      ])
        expect(action).toThrow(
          expect.objectContaining({ code: "controls.unavailable" }),
        );
      expect(f.controller.getSnapshot()).toBe(previous);
      expect(authority.require({ type: "sort" }).paginationEnabled).toBe(false);
      expect(authority.require({ type: "columns" }).paginationEnabled).toBe(
        false,
      );
    });
for (const selection of [false, "single", "multiple"] as const)
  test(`disabled policy does not invent a blocked reason for selection mode ${selection}`, () => {
    const f = fixture(false, { selection }),
      a = required(f.begin());
    f.succeed(a.request, records.slice(0, 3));
    const input = f.remote(),
      facts = f.project(input);
    expect(facts.blockedReason).toBeNull();
    expect(facts.canSelect).toBe(selection !== false);
    expect(facts.pageSelection.supported).toBe(selection === "multiple");
  });
test("loaded selected uses full original client input, page eligibility uses actual filtered rendered rows", () => {
  const f = fixture(false, { filtered: true });
  f.controller.dispatch({
    type: "selection.change",
    update: { r0: true, r1: true, offscreen: true },
  });
  const input = f.client(),
    facts = f.project(input);
  expect(facts.loadedSelected.map((item) => item.id)).toEqual(["r0", "r1"]);
  expect(facts.missingSelectedIds).toEqual(["offscreen"]);
  expect(facts.rows.some((row) => row.id === "r0")).toBe(false);
  expect(facts.eligiblePageIds).toContain("r1");
  expect(facts.eligiblePageIds).not.toContain("r0");
});
test("A metadata/range retained through pending/failure B and retry; fresh0 replaces A permanently", () => {
  const f = fixture(),
    a = required(f.begin("a"));
  f.succeed(a.request, records.slice(0, 137));
  const first = f.project(f.remote()).displayed;
  f.setNow(0.5);
  f.controller.dispatch({ type: "clock.tick" });
  f.controller.dispatch({ type: "search.commit", search: "B" });
  const b = required(
    f.begin("b", (request) => {
      expect(request.extent).toEqual({ kind: "complete" });
      expect(request.evaluatedAt).toBe(0.5);
      f.succeed(request, []);
    }),
  );
  const pending = f.project(f.remote());
  expect(pending.displayed?.request?.generation).toBe(a.request.generation);
  expect(pending.displayed?.evaluatedAt).toBe(first?.evaluatedAt);
  expect(pending.displayed?.range).toEqual({ from: 1, to: 137 });
  expect(pending.displayed?.extent).toEqual({ kind: "complete" });
  expect(pending.canSelect).toBe(false);
  f.resource.fail(b.request, "timeout");
  const failure = f.project(f.remote());
  expect(failure.canRetry).toBe(true);
  expect(failure.displayed?.range).toEqual(first?.range);
  const retry = required(f.authority().retry());
  expect(retry.generation).toBe(b.request.generation + 1);
  const zero = f.project(f.remote());
  expect(zero.displayed?.recordCount).toBe(0);
  expect(zero.displayed?.range).toEqual({ from: 0, to: 0 });
  expect(zero.displayed?.evaluatedAt).toBe(0.5);
  const c = required(f.begin("c"));
  f.resource.fail(c.request, "offline");
  expect(f.project(f.remote()).displayed?.recordCount).toBe(0);
  expect(
    f.resource.succeed(a.request, {
      source: "fresh",
      records,
      page: { kind: "known", total: records.length },
      emptyKind: "unknown",
      receivedAt: "2026-11-24T00:00:00Z",
    }),
  ).toBe(false);
});
for (const forgery of [
  "copied-binding",
  "foreign-owner",
  "foreign-resource",
  "stripped",
  "wrong-time",
  "page-label",
  "unknown-mode",
] as const)
  test(`projection refuses ${forgery} before new private loaded-record work`, () => {
    const f = fixture(),
      g = fixture(),
      a = required(f.begin()),
      b = required(g.begin());
    f.succeed(a.request, records.slice(0, 3));
    g.succeed(b.request, records.slice(0, 3));
    const input = f.remote(),
      other = g.remote();
    if (input.source.mode === "client" || other.source.mode === "client")
      throw new Error("Expected actual remote fixtures");
    let source: unknown;
    if (forgery === "copied-binding")
      source = {
        ...input.source,
        bindings: { request: { ...a.binding }, snapshot: { ...a.binding } },
      };
    if (forgery === "foreign-owner")
      source = { ...input.source, bindings: other.source.bindings };
    if (forgery === "foreign-resource")
      source = { ...input.source, resource: g.resource };
    if (forgery === "page-label") source = { ...input.source, mode: "server" };
    if (forgery === "unknown-mode")
      source = { ...input.source, mode: "invented" };
    if (forgery === "stripped" || forgery === "wrong-time") {
      const actual = input.source.view,
        snapshot = required(actual.snapshot),
        altered = { ...snapshot };
      if (forgery === "stripped") {
        Reflect.deleteProperty(altered, "extent");
        Reflect.deleteProperty(altered, "evaluatedAt");
      } else Reflect.set(altered, "evaluatedAt", 1);
      source = { ...input.source, view: { ...actual, snapshot: altered } };
    }
    f.reset();
    const facts = Reflect.apply(projectControls, undefined, [
      f.definition,
      { ...input, source },
    ]);
    expect(facts.displayed).toBeNull();
    expect(facts.canSelect).toBe(false);
    expect(f.calls.rowId).toBe(0);
    expect(f.calls.eligible).toBe(0);
  });
for (const explicit of [false, true])
  test(`raw genuine ${explicit ? "complete" : "legacy page"} resource cannot borrow a binding from a previous equal-looking generation`, () => {
    const f = fixture(),
      a = required(f.begin());
    f.succeed(a.request, records.slice(0, 3));
    const initial = f.remote();
    const raw = required(
      f.resource.begin({
        ...context,
        queryKey: "same",
        requestKey: "same",
        query: a.request.query,
        ...(explicit
          ? { extent: { kind: "complete" as const }, evaluatedAt: 9 }
          : {}),
      }),
    );
    f.succeed(raw, records.slice(0, 3));
    if (initial.source.mode === "client") throw new Error("Expected remote");
    const actual = f.remote(),
      source = { ...initial.source, view: f.resource.getSnapshot() };
    f.reset();
    const facts = f.project({ ...actual, source });
    expect(facts.blockedReason).toBe("binding");
    expect(facts.displayed).toBeNull();
    expect(f.calls.rowId).toBe(0);
  });
test("disabled origin mask keeps literal false through foreign enabled facts and current permission loss", () => {
  const f = fixture(),
    g = fixture(true);
  const origin = f.client([]),
    authority = f.authority(origin),
    foreign = g.client();
  // A real other-owner frame, not a manufactured native handle/table.
  f.setCommitted(foreign);
  const masked = authority.read();
  expect(masked.paginationEnabled).toBe(false);
  expect(masked.rows).toEqual([]);
  expect(masked.selectedIds).toEqual([]);
  expect(masked.displayed).toBeNull();
  expect(() => authority.cancelSelection()).toThrow(
    expect.objectContaining({ code: "controls.unavailable" }),
  );
  const a = required(f.begin());
  f.succeed(a.request, records.slice(0, 3));
  const input = f.remote();
  f.resource.setContext({ ...context, access: false });
  f.reset();
  const denied = f.project(input);
  expect(denied.paginationEnabled).toBe(false);
  expect(denied.displayed).toBeNull();
  expect(denied.rows).toEqual([]);
  expect(f.calls.rowId).toBe(0);
});
test("saved stale actors deny row/reorder/retry while same-owner Cancel remains recovery", () => {
  const f = fixture(),
    a = required(f.begin("a", () => {}));
  f.succeed(a.request, records.slice(0, 4));
  const input = f.remote(),
    old = f.authority(input);
  f.controller.dispatch({ type: "search.commit", search: "new" });
  for (const action of [
    () => old.selectRow("r1", true),
    () => old.selectPage(true),
    () => old.require({ type: "reorder", ids: ["r1", "r2"] }),
    () => old.retry(),
  ])
    expect(action).toThrow(
      expect.objectContaining({ code: "controls.unavailable" }),
    );
  expect(old.cancelSelection().status).toBe("committed");
});
test("complete selection/reorder are genuine supported actions, without all-matching authorization", () => {
  const f = fixture(),
    start = required(f.begin());
  f.succeed(start.request, records.slice(0, 4));
  const input = f.remote(),
    authority = f.authority(input);
  expect(f.project(input).canReorder).toBe(true);
  expect(
    authority.require({ type: "reorder", ids: ["r1", "r2"] }).paginationEnabled,
  ).toBe(false);
  expect(authority.selectPage(true).status).toBe("committed");
  expect(f.controller.getSnapshot().selection).toMatchObject({
    offscreen: true,
    r1: true,
    r2: true,
    r3: true,
  });
  expect(f.controller.getSnapshot().selection.r0).toBeUndefined();
  expect(() => authority.selectRow("not-loaded", true)).toThrow(
    expect.objectContaining({ code: "controls.unavailable" }),
  );
});
