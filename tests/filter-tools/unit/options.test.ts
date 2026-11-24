import { describe, expect, it } from "vitest";
import type {
  FilterOption,
  OptionRequest,
} from "../../../packages/react/src/filters/editor-types.js";
import {
  createOptionSource,
  projectOptionSourceView,
} from "../../../packages/react/src/filters/options-source.js";
import { context, page, request } from "./fixtures.js";

describe("option term/page/source generation guards", () => {
  it("accepts B before uncancellable late A and rejects a late access-failure A", async () => {
    const source = createOptionSource(context);
    let resolveA: (result: ReturnType<typeof page>) => void = () => {};
    const pending = new Promise<ReturnType<typeof page>>((resolve) => {
      resolveA = resolve;
    });
    const a = source.begin(request("a"));
    if (!a) throw new Error("Missing token");
    const acceptedA = pending.then((result) => source.succeed(a, result));
    const b = source.begin(request("b"));
    if (!b) throw new Error("Missing token");
    expect(source.succeed(b, page(["b"], true))).toBe(true);
    const before = source.getSnapshot();
    resolveA(page(["late-a"]));
    expect(await acceptedA).toBe(false);
    expect(source.fail(a, "access-lost")).toBe(false);
    expect(source.getSnapshot()).toBe(before);
    expect(before.page?.options.map(({ id }) => id)).toEqual(["b"]);
    expect(before.context.access).toBe(true);
  });

  it("rejects same-key ABA, copied tokens and tokens from another source", () => {
    const source = createOptionSource(context);
    const other = createOptionSource(context);
    const a = source.begin(request("a"));
    source.begin(request("b"));
    const a2 = source.begin(request("a"));
    const cross = other.begin(request("a"));
    if (!a || !a2 || !cross) throw new Error("Missing token");
    expect(a2.generation).toBeGreaterThan(a.generation);
    expect(a2.sourceId).toBe(a.sourceId);
    expect(cross.sourceId).not.toBe(a.sourceId);
    for (const stale of [
      a,
      cross,
      { ...a2 },
      { ...a2, generation: a2.generation + 1 },
      { ...a2, fieldId: "other" },
      { ...a2, term: "other" },
      { ...a2, pageKey: "other" },
    ]) {
      const before = source.getSnapshot();
      expect(source.succeed(stale, page(["wrong"]))).toBe(false);
      expect(source.recoverSelectedLabels(stale, page(["wrong"]).options)).toBe(
        false,
      );
      expect(source.fail(stale, "access-lost")).toBe(false);
      expect(source.getSnapshot()).toBe(before);
    }
    expect(source.succeed(a2, page(["a2"]))).toBe(true);
    expect(source.succeed(a2, page(["duplicate"]))).toBe(false);
    expect(source.fail(a2, "timeout")).toBe(false);
  });

  it("keeps one current page, never previous search pages, and does not infer hasMore", () => {
    const source = createOptionSource(context);
    source.setSelectedIds(context, ["selected"]);
    const a = source.begin(request("a", "1"));
    if (!a) throw new Error("Missing token");
    source.succeed(a, page(["selected", "not-selected"], false));
    expect(source.getSnapshot().canLoadMore).toBe(false);
    const b = source.begin(request("a", "2"));
    if (!b) throw new Error("Missing token");
    expect(source.getSnapshot()).toMatchObject({
      page: null,
      display: "loading",
      selected: [
        { id: "selected", label: "Label string:selected", known: true },
      ],
    });
    source.succeed(b, page([], true));
    expect(source.getSnapshot()).toMatchObject({
      display: "empty",
      canLoadMore: true,
    });
    const c = source.begin(request("b", "2"));
    if (!c) throw new Error("Missing token");
    source.fail(c, "offline");
    expect(source.getSnapshot()).toMatchObject({
      display: "error",
      page: null,
      canChoose: false,
    });
    const next = source.begin(request("a", "1"));
    if (!next) throw new Error("Missing token");
    expect(source.getSnapshot().page).toBeNull();
    source.setSelectedIds(context, ["not-selected"]);
    expect(source.getSnapshot().selected).toEqual([
      { id: "not-selected", label: "not-selected", known: false },
    ]);
  });

  it("retains the actual same-key page with local loading/error precedence, not false empty", () => {
    const source = createOptionSource(context);
    const a = source.begin(request());
    if (!a) throw new Error("Missing token");
    source.succeed(a, page(["a"]));
    const acceptedPage = source.getSnapshot().page;
    const refresh = source.begin(request());
    if (!refresh) throw new Error("Missing token");
    expect(source.getSnapshot()).toMatchObject({
      display: "options",
      notice: "loading",
      stale: true,
      busy: true,
      canChoose: false,
    });
    expect(source.getSnapshot().page).toBe(acceptedPage);
    source.fail(refresh, "timeout");
    expect(source.getSnapshot()).toMatchObject({
      display: "options",
      notice: "load-failed",
      stale: true,
    });
    expect(source.getSnapshot().page?.request).toBe(a);
    const fresh = source.begin(request());
    if (!fresh) throw new Error("Missing token");
    source.succeed(fresh, page([]));
    expect(source.getSnapshot()).toMatchObject({
      display: "empty",
      notice: null,
      stale: false,
      page: { options: [] },
    });
  });
});

describe("accepted selected-ID labels, not a selection reducer", () => {
  it("preserves numeric 0 versus string '0', missing-ID fallback and recovered off-page labels", () => {
    const source = createOptionSource(context);
    const acceptedIds = Object.freeze([0, "0", "off-page"]);
    source.setSelectedIds(context, acceptedIds);
    expect(source.getSnapshot().selected).toEqual([
      { id: 0, label: "0", known: false },
      { id: "0", label: "0", known: false },
      { id: "off-page", label: "off-page", known: false },
    ]);
    const a = source.begin(request());
    if (!a) throw new Error("Missing token");
    source.succeed(a, {
      options: [
        { id: 0, label: "Number zero" },
        { id: "0", label: "String zero" },
      ],
      hasMore: false,
    });
    const b = source.begin(request("new-term"));
    if (!b) throw new Error("Missing token");
    source.fail(b, "offline");
    expect(source.getSnapshot().selected).toEqual([
      { id: 0, label: "Number zero", known: true },
      { id: "0", label: "String zero", known: true },
      { id: "off-page", label: "off-page", known: false },
    ]);
    expect(
      source.recoverSelectedLabels(b, [
        { id: "off-page", label: "Recovered person" },
        { id: "unselected", label: "Do not retain" },
      ]),
    ).toBe(true);
    expect(source.getSnapshot().selected.at(-1)).toEqual({
      id: "off-page",
      label: "Recovered person",
      known: true,
    });
    expect(acceptedIds).toEqual([0, "0", "off-page"]);
    source.setSelectedIds(context, ["off-page"]);
    source.setSelectedIds(context, [0, "unselected", "off-page"]);
    expect(source.getSnapshot().selected).toEqual([
      { id: 0, label: "0", known: false },
      { id: "unselected", label: "unselected", known: false },
      { id: "off-page", label: "Recovered person", known: true },
    ]);
  });

  it("recovers labels after current failure but rejects obsolete/other-context recoveries", () => {
    const source = createOptionSource(context);
    source.setSelectedIds(context, ["selected"]);
    const a = source.begin(request("a"));
    const b = source.begin(request("b"));
    if (!a || !b) throw new Error("Missing token");
    source.fail(b, "unavailable");
    expect(
      source.recoverSelectedLabels(a, [
        { id: "selected", label: "Late label" },
      ]),
    ).toBe(false);
    expect(
      source.recoverSelectedLabels(b, [
        { id: "selected", label: "Recovered label" },
      ]),
    ).toBe(true);
    expect(source.getSnapshot()).toMatchObject({
      kind: "failure",
      selected: [{ id: "selected", label: "Recovered label", known: true }],
    });
    source.setSelectedIds(context, []);
    expect(
      source.recoverSelectedLabels(b, [
        { id: "selected", label: "No longer selected" },
      ]),
    ).toBe(true);
    source.setSelectedIds(context, ["selected"]);
    expect(source.getSnapshot().selected[0]?.known).toBe(false);
    source.setContext({ ...context, fieldId: "another" });
    expect(
      source.recoverSelectedLabels(b, [
        { id: "selected", label: "Wrong field" },
      ]),
    ).toBe(false);
  });

  it("bounds retained labels by all accepted selected IDs, without a lossy arbitrary cap", () => {
    const source = createOptionSource(context);
    const selected = Array.from(
      { length: 350 },
      (_, index) => `selected-${index}`,
    );
    source.setSelectedIds(context, selected);
    const a = source.begin(request());
    if (!a) throw new Error("Missing token");
    source.succeed(a, page([...selected, "unselected"]));
    source.begin(request("new-page"));
    expect(source.getSnapshot().page).toBeNull();
    expect(source.getSnapshot().selected).toHaveLength(350);
    expect(source.getSnapshot().selected.every((label) => label.known)).toBe(
      true,
    );
    source.setSelectedIds(context, [selected[349] ?? "missing"]);
    expect(source.getSnapshot().selected).toHaveLength(1);
    source.setSelectedIds(context, ["selected-0", "unselected"]);
    expect(source.getSnapshot().selected.every((label) => !label.known)).toBe(
      true,
    );
  });

  it("copies/freezes pages and labels without retaining arbitrary application payloads", () => {
    const source = createOptionSource(context);
    const a = source.begin(request());
    if (!a) throw new Error("Missing token");
    const record = {
      id: "a",
      label: "Label A",
      privateExtra: "synthetic-private-extra",
    };
    const options = [record];
    source.succeed(a, { options, hasMore: false });
    record.label = "mutated";
    options.push({ ...record, id: "b" });
    source.setSelectedIds(context, ["a"]);
    expect(source.getSnapshot().page?.options).toEqual([
      { id: "a", label: "Label A" },
    ]);
    expect(source.getSnapshot().selected).toEqual([
      { id: "a", label: "Label A", known: true },
    ]);
    expect(Object.isFrozen(source.getSnapshot().page?.options[0])).toBe(true);
    expect(Object.isFrozen(source.getSnapshot().selected)).toBe(true);
    expect(JSON.stringify(source.getSnapshot())).not.toContain(
      "synthetic-private-extra",
    );
  });
});

describe("validation is atomic and diagnostics are public-safe", () => {
  for (const options of [
    [
      { id: "a", label: "A" },
      { id: "a", label: "Duplicate A" },
    ],
    [{ id: Number.NaN, label: "NaN" }],
    [{ id: Number.POSITIVE_INFINITY, label: "Infinite" }],
    [{ id: "", label: "Empty ID" }],
    [{ id: false, label: "Boolean ID" }],
    [{ id: "a", label: "" }],
    [{ id: "a", label: 0 }],
    [{ id: "a", label: "A", disabled: "yes" }],
    new Array(1),
  ])
    it(`rejects invalid/duplicate/dense option IDs atomically: ${JSON.stringify(options)}`, () => {
      const source = createOptionSource(context);
      source.setSelectedIds(context, ["a"]);
      const a = source.begin(request());
      if (!a) throw new Error("Missing token");
      const before = source.getSnapshot();
      expect(() =>
        source.succeed(a, {
          options: options as readonly FilterOption[],
          hasMore: false,
        }),
      ).toThrow("Invalid Tableweave option source input.");
      expect(source.getSnapshot()).toBe(before);
      expect(() =>
        source.recoverSelectedLabels(a, options as readonly FilterOption[]),
      ).toThrow("Invalid Tableweave option source input.");
      expect(source.getSnapshot()).toBe(before);
      expect(source.succeed(a, page(["a"]))).toBe(true);
    });

  for (const ids of [
    ["a", "a"],
    [Number.NaN],
    [Number.POSITIVE_INFINITY],
    [""],
    [false],
    new Array(1),
  ])
    it(`rejects invalid accepted-ID input rather than silently losing IDs: ${JSON.stringify(ids)}`, () => {
      const source = createOptionSource(context);
      const before = source.getSnapshot();
      expect(() =>
        source.setSelectedIds(context, ids as readonly (string | number)[]),
      ).toThrow("Invalid Tableweave option source input.");
      expect(source.getSnapshot()).toBe(before);
    });

  it("never forwards arbitrary error codes/messages/stacks/records, including hostile getters", () => {
    const dangerous = {
      get message(): never {
        throw new Error("synthetic-private-message");
      },
      code: "access-lost",
    };
    for (const raw of [
      dangerous,
      new Error("synthetic-private-stack"),
      "constructor",
      "__proto__",
      "synthetic-private-query",
      null,
    ]) {
      const source = createOptionSource(context);
      const a = source.begin(request());
      if (!a) throw new Error("Missing token");
      source.fail(a, raw);
      expect(source.getSnapshot().error).toEqual({
        code: "unavailable",
        message: "Options could not be loaded.",
      });
      expect(source.getSnapshot().context.access).toBe(true);
    }
  });

  it("rejects malformed page metadata and hostile option accessors without unsafe diagnostics", () => {
    const source = createOptionSource(context);
    const a = source.begin(request());
    if (!a) throw new Error("Missing token");
    const before = source.getSnapshot();
    expect(() =>
      source.succeed(a, {
        ...page(["a"]),
        hasMore: "maybe" as unknown as boolean,
      }),
    ).toThrow("Invalid Tableweave option source input.");
    let getters = 0;
    const options = [
      {
        id: "a",
        get label(): string {
          getters++;
          throw new Error("synthetic-private-label");
        },
      },
    ];
    expect(() => source.succeed(a, { options, hasMore: false })).toThrow(
      "Invalid Tableweave option source input.",
    );
    expect(getters).toBe(0);
    expect(source.getSnapshot()).toBe(before);
    expect(source.succeed(a, page(["a"]))).toBe(true);
  });
});

describe("retry is explicit and always uses the latest failed term/page", () => {
  it("has no fake retry and does not start any request on begin", () => {
    const source = createOptionSource(context);
    let calls = 0;
    const a = source.begin(
      request("a", "1", {
        retry() {
          calls++;
        },
      }),
    );
    if (!a) throw new Error("Missing token");
    expect(calls).toBe(0);
    source.fail(a, "timeout");
    const b = source.begin(request("b", "2"));
    if (!b) throw new Error("Missing token");
    source.fail(b, "timeout");
    expect(source.retry()).toBeNull();
    expect(source.getSnapshot().canRetry).toBe(false);
    expect(calls).toBe(0);
  });

  it("provides a fresh latest-token generation and permits synchronous app completion", () => {
    const source = createOptionSource(context);
    let retried: OptionRequest | undefined;
    const a = source.begin(
      request("term-b", "page-2", {
        retry(next) {
          retried = next;
          source.succeed(next, page(["b"]));
        },
      }),
    );
    if (!a) throw new Error("Missing token");
    source.fail(a, "offline");
    const next = source.retry();
    expect(next).toBe(retried);
    expect(next).toMatchObject({
      term: "term-b",
      pageKey: "page-2",
      fieldId: context.fieldId,
    });
    expect(next?.generation).toBeGreaterThan(a.generation);
    expect(source.getSnapshot()).toMatchObject({
      kind: "ready",
      page: { options: [{ id: "b" }] },
    });
    expect(source.retry()).toBeNull();
  });

  it("safely maps callback throws/rejections; obsolete rejection cannot replace a new page", async () => {
    for (const retry of [
      () => {
        throw new Error("synthetic-private-retry");
      },
      () => Promise.reject(new Error("synthetic-private-retry")),
    ]) {
      const source = createOptionSource(context);
      const a = source.begin(request("a", "0", { retry }));
      if (!a) throw new Error("Missing token");
      source.fail(a, "timeout");
      source.retry();
      await Promise.resolve();
      await Promise.resolve();
      expect(source.getSnapshot().error?.code).toBe("unavailable");
    }
    const source = createOptionSource(context);
    let reject: (reason: Error) => void = () => {};
    const a = source.begin(
      request("a", "0", {
        retry: () =>
          new Promise((_resolve, fail) => {
            reject = fail;
          }),
      }),
    );
    if (!a) throw new Error("Missing token");
    source.fail(a, "timeout");
    source.retry();
    const b = source.begin(request("b"));
    if (!b) throw new Error("Missing token");
    source.succeed(b, page(["b"]));
    const before = source.getSnapshot();
    reject(new Error("synthetic-private-obsolete"));
    await Promise.resolve();
    await Promise.resolve();
    expect(source.getSnapshot()).toBe(before);
  });
});

describe("field/scope/access/lifetime isolation", () => {
  for (const [property, value] of [
    ["scopeKey", "scope-b"],
    ["definitionKey", "definition-2"],
    ["fieldId", "team"],
  ] as const)
    it(`clears context ${property} A→B→A and rejects late original-key completions`, () => {
      const events: string[] = [];
      const source = createOptionSource(context, {
        onInvalidate({ reason }) {
          events.push(reason);
          expect(source.getSnapshot().selected).toEqual([]);
          expect(source.getSnapshot().page).toBeNull();
        },
      });
      source.setSelectedIds(context, ["selected"]);
      const a = source.begin(request());
      if (!a) throw new Error("Missing token");
      source.succeed(a, page(["selected"]));
      const pending = source.begin(request());
      if (!pending) throw new Error("Missing token");
      source.setContext({ ...context, [property]: value });
      expect(source.getSnapshot()).toMatchObject({
        page: null,
        request: null,
        selected: [],
      });
      expect(source.begin(request())).toBeNull();
      expect(source.setSelectedIds(context, ["selected"])).toBe(false);
      source.setContext(context);
      const latest = source.begin(request());
      if (!latest) throw new Error("Missing token");
      expect(latest.generation).toBeGreaterThan(pending.generation);
      expect(source.succeed(pending, page(["old-private"]))).toBe(false);
      expect(source.recoverSelectedLabels(a, page(["selected"]).options)).toBe(
        false,
      );
      expect(source.succeed(latest, page(["new"]))).toBe(true);
      expect(events).toHaveLength(2);
    });

  it("access loss clears all labels/pages and is terminal until explicit permission restoration", () => {
    const source = createOptionSource(context);
    source.setSelectedIds(context, ["selected"]);
    const a = source.begin(request());
    if (!a) throw new Error("Missing token");
    source.succeed(a, page(["selected"]));
    const b = source.begin(
      request("b", "0", {
        retry() {
          throw new Error("Must not retry");
        },
      }),
    );
    if (!b) throw new Error("Missing token");
    expect(source.fail(b, "access-lost")).toBe(true);
    expect(source.getSnapshot()).toMatchObject({
      kind: "blocked",
      display: "blocked",
      page: null,
      request: null,
      selected: [],
      canRetry: false,
    });
    expect(source.begin(request())).toBeNull();
    expect(source.setSelectedIds(context, ["selected"])).toBe(false);
    expect(source.recoverSelectedLabels(b, page(["selected"]).options)).toBe(
      false,
    );
    expect(source.retry()).toBeNull();
    expect(projectOptionSourceView(source.getSnapshot(), context)).toBe(
      source.getSnapshot(),
    );
    source.setContext(context); // Explicit app authorization assertion, not a render.
    expect(source.getSnapshot().selected).toEqual([]);
    expect(source.succeed(b, page(["old-private"]))).toBe(false);
    expect(source.begin(request())).not.toBeNull();
  });

  it("starts denied, clears through explicit revocation and never reads another source's state", () => {
    const denied = createOptionSource({ ...context, access: false });
    expect(denied.getSnapshot().display).toBe("blocked");
    expect(denied.begin(request())).toBeNull();
    const a = createOptionSource(context);
    const bContext = { ...context, scopeKey: "scope-b" };
    const b = createOptionSource(bContext);
    const token = b.begin(request("b", "0", { scopeKey: "scope-b" }));
    if (!token) throw new Error("Missing token");
    b.setSelectedIds(bContext, ["b"]);
    b.succeed(token, page(["b"]));
    const before = b.getSnapshot();
    a.setContext({ ...context, access: false });
    a.dispose();
    expect(b.getSnapshot()).toBe(before);
  });

  it("fails closed on thrown/async lifecycle callbacks without raw callback errors", async () => {
    for (const onInvalidate of [
      () => {
        throw new Error("synthetic-private-clear");
      },
      async () => {
        throw new Error("synthetic-private-async-clear");
      },
    ]) {
      const source = createOptionSource(context, { onInvalidate });
      source.setSelectedIds(context, ["selected"]);
      source.clear();
      expect(source.getSnapshot()).toMatchObject({
        page: null,
        selected: [],
        invalidationFailed: true,
        display: "blocked",
      });
      expect(source.begin(request())).toBeNull();
      expect(source.setSelectedIds(context, ["selected"])).toBe(false);
      expect(JSON.stringify(source.getSnapshot())).not.toContain(
        "synthetic-private",
      );
      await Promise.resolve();
      await Promise.resolve();
    }
  });

  it("can recover from a synchronous callback failure only with an explicit successful clear", () => {
    let broken = true;
    const source = createOptionSource(context, {
      onInvalidate() {
        if (broken) throw new Error("synthetic-failure");
      },
    });
    source.clear();
    expect(source.begin(request())).toBeNull();
    broken = false;
    source.clear();
    expect(source.getSnapshot().invalidationFailed).toBe(false);
    expect(source.begin(request())).not.toBeNull();
  });

  it("connect belongs to a stable passive owner, not picker-open or layout hide lifetime", () => {
    const source = createOptionSource(context);
    const cleanup = source.connect();
    source.setSelectedIds(context, ["selected"]);
    const a = source.begin(request());
    if (!a) throw new Error("Missing token");
    source.succeed(a, page(["selected"]));
    // Closing a picker or layout-only Suspense hide performs NO source cleanup.
    expect(source.getSnapshot().selected[0]?.known).toBe(true);
    const pending = source.begin(request("pending"));
    if (!pending) throw new Error("Missing token");
    cleanup(); // Real unmount / StrictMode passive cleanup.
    expect(source.getSnapshot()).toMatchObject({
      active: false,
      request: null,
      page: null,
      selected: [],
    });
    expect(source.succeed(pending, page(["late"]))).toBe(false);
    expect(source.begin(request())).toBeNull();
    const cleanup2 = source.connect();
    cleanup(); // Old cleanup cannot disconnect replay/remount.
    const fresh = source.begin(request());
    if (!fresh) throw new Error("Missing token");
    expect(source.succeed(fresh, page(["new"]))).toBe(true);
    cleanup2();
    expect(source.getSnapshot().page).toBeNull();
  });

  it("disposes terminally, clears all private buffers and ignores outstanding responses", () => {
    const source = createOptionSource(context);
    const a = source.begin(request());
    if (!a) throw new Error("Missing token");
    source.setSelectedIds(context, ["selected"]);
    source.dispose();
    const before = source.getSnapshot();
    source.connect()();
    source.setContext(context);
    source.clear();
    expect(source.getSnapshot()).toBe(before);
    expect(source.getSnapshot()).toMatchObject({
      kind: "disposed",
      active: false,
      selected: [],
      page: null,
      request: null,
    });
    expect(source.succeed(a, page(["late"]))).toBe(false);
    expect(source.recoverSelectedLabels(a, page(["selected"]).options)).toBe(
      false,
    );
  });

  it("projects expected context/selected IDs without writes or prior-scope labels", () => {
    const source = createOptionSource(context);
    source.setSelectedIds(context, ["selected"]);
    const a = source.begin(request());
    if (!a) throw new Error("Missing token");
    source.succeed(a, page(["selected", "page-only"]));
    const before = source.getSnapshot();
    expect(projectOptionSourceView(before, context)).toBe(before);
    expect(projectOptionSourceView(before, context, ["selected"])).toBe(before);
    expect(
      projectOptionSourceView(before, context, ["page-only", "missing"])
        .selected,
    ).toEqual([
      { id: "page-only", label: "Label string:page-only", known: true },
      { id: "missing", label: "missing", known: false },
    ]);
    for (const next of [
      { ...context, scopeKey: "scope-b" },
      { ...context, fieldId: "team" },
      { ...context, definitionKey: "definition-2" },
      { ...context, access: false },
    ]) {
      const projected = projectOptionSourceView(before, next);
      expect(projected.page).toBeNull();
      expect(projected.request).toBeNull();
      expect(projected.selected).toEqual([]);
      expect(projected.canChoose).toBe(false);
      expect(source.getSnapshot()).toBe(before);
    }
    const nextContext = {
      ...context,
      scopeKey: "scope-b",
      privateExtra: "synthetic-private",
    };
    expect(
      projectOptionSourceView(before, nextContext, ["new-id"]).selected,
    ).toEqual([{ id: "new-id", label: "new-id", known: false }]);
    expect(
      JSON.stringify(projectOptionSourceView(before, nextContext)),
    ).not.toContain("synthetic-private");
    expect(source.getSnapshot()).toBe(before);
  });
});

describe("stable subscriptions/server snapshots and observer races", () => {
  it("has stable immutable snapshots, no-op input and subscription cleanup", () => {
    const source = createOptionSource(context);
    const initial = source.getSnapshot();
    expect(source.getSnapshot()).toBe(initial);
    expect(source.getServerSnapshot()).toBe(initial);
    let calls = 0;
    const stop = source.subscribe(() => {
      calls++;
    });
    source.setSelectedIds(context, ["a"]);
    source.setSelectedIds(context, ["a"]);
    expect(calls).toBe(1);
    const a = source.begin(request());
    if (!a) throw new Error("Missing token");
    source.succeed(a, page(["a"]));
    expect(calls).toBe(3);
    expect(source.getServerSnapshot()).toBe(initial);
    expect(source.getServerSnapshot().selected).toEqual([]);
    stop();
    stop();
    source.clear();
    expect(calls).toBe(3);
    expect(Object.isFrozen(source.getSnapshot())).toBe(true);
  });

  it("honors synchronous observer revocation/disposal instead of handing an obsolete token to transport", () => {
    for (const action of [
      (source: ReturnType<typeof createOptionSource>) =>
        source.setContext({ ...context, access: false }),
      (source: ReturnType<typeof createOptionSource>) => source.dispose(),
    ]) {
      const source = createOptionSource(context);
      source.subscribe(() => {
        if (source.getSnapshot().kind === "pending") action(source);
      });
      expect(source.begin(request())).toBeNull();
      expect(source.getSnapshot().request).toBeNull();
      expect(source.getSnapshot().selected).toEqual([]);
    }
  });

  it("isolates throwing observers, removes subscriptions and blocks recursive request starts", () => {
    const source = createOptionSource(context);
    let calls = 0;
    source.subscribe(() => {
      throw new Error("synthetic-private-observer");
    });
    const stop = source.subscribe(() => {
      calls++;
    });
    stop();
    source.subscribe(() => {
      calls++;
      expect(source.begin(request("recursive"))).toBeNull();
    });
    const a = source.begin(request());
    if (!a) throw new Error("Missing token");
    source.succeed(a, page([]));
    expect(calls).toBe(2);
  });
});
