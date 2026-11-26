import { expect, test } from "vitest";
import type { QueryFor } from "../../packages/react/src/contracts/types.js";
import { getControlsRequestBinding } from "../../packages/react/src/presentation/binding.js";
import { requireCriteriaSource } from "../../packages/react/src/presentation/criteria-frame.js";
import { createResourceAdapter } from "../../packages/react/src/resource/adapter.js";
import {
  begin,
  type Fixture,
  fixture,
  type Item,
  records,
  required,
  type Schema,
  sourceInput,
} from "../criteria-frame-react/fixtures.js";

function remoteInput(
  f: Fixture,
  mode: "server" | "server-complete" = "server",
) {
  const input = sourceInput(f, mode);
  if (input.source.mode === "client") throw new Error("Expected remote source");
  return { ...input, source: input.source };
}

function noRecordWork(f: Fixture) {
  expect(Object.values(f.counts).every((count) => count === 0)).toBe(true);
  expect(f.frames.getSnapshot().phase).toBe("empty");
}

for (const enabled of [true, false]) {
  const mode = enabled ? "server" : "server-complete";
  test(`owned idle/pending/failure/retry metadata keeps fresh actual bindings, policy=${enabled}`, () => {
    const f = fixture(enabled);
    f.settle();
    const authority = f.frames.commitSource(sourceInput(f, mode));
    const read = () => requireCriteriaSource(authority, f.frames);
    f.reset();
    expect(read()).toMatchObject({
      mode,
      kind: "idle",
      hasSnapshot: false,
      canRetry: false,
    });
    let retries = 0;
    const started = begin(f, () => {
      retries++;
    });
    expect(read()).toMatchObject({
      kind: "pending",
      busy: true,
      stale: false,
      hasSnapshot: false,
    });
    expect(f.resource.fail(started.request, "offline")).toBe(true);
    expect(read()).toMatchObject({
      kind: "failure",
      busy: false,
      error: "offline",
      canRetry: true,
    });
    expect(retries).toBe(0);
    const retried = required(f.resource.retry());
    expect(retried).not.toBe(started.request);
    expect(retries).toBe(1);
    expect(
      getControlsRequestBinding(f.definition, f.app.C, f.resource, retried),
    ).not.toBeNull();
    expect(read()).toMatchObject({ kind: "pending", canRetry: false });
    noRecordWork(f);
  });

  test(`owned ready/retained failure/successful empty replacement metadata, policy=${enabled}`, () => {
    const f = fixture(enabled);
    f.settle();
    f.startRemote(records.slice(0, 2));
    const authority = f.frames.commitSource(sourceInput(f, mode));
    const read = () => requireCriteriaSource(authority, f.frames);
    f.reset();
    expect(read()).toMatchObject({
      kind: "ready",
      busy: false,
      stale: false,
      hasSnapshot: true,
    });
    const refresh = begin(f, () => undefined);
    expect(read()).toMatchObject({
      kind: "pending",
      busy: true,
      stale: true,
      hasSnapshot: true,
    });
    expect(f.resource.fail(refresh.request, "timeout")).toBe(true);
    expect(read()).toMatchObject({
      kind: "failure",
      error: "timeout",
      stale: true,
      hasSnapshot: true,
      canRetry: true,
    });
    const replacement = begin(f);
    expect(
      f.resource.succeed(replacement.request, {
        source: "fresh",
        records: [],
        page: { kind: "known", total: 0 },
        emptyKind: "dataset",
        receivedAt: "2026-11-24T00:00:00Z",
      }),
    ).toBe(true);
    expect(read()).toMatchObject({
      kind: "ready",
      busy: false,
      stale: false,
      hasSnapshot: true,
      emptyKind: "dataset",
      error: null,
      canRetry: false,
    });
    noRecordWork(f);
  });
}

test("retry metadata still compares the actual accepted query identity", () => {
  const f = fixture();
  f.settle();
  const started = begin(f, () => undefined);
  f.resource.fail(started.request, "unavailable");
  const authority = f.frames.commitSource(sourceInput(f, "server"));
  expect(requireCriteriaSource(authority, f.frames)).toMatchObject({
    canRetry: true,
  });
  f.accept({ type: "search.commit", search: "changed" });
  f.reset();
  expect(requireCriteriaSource(authority, f.frames)).toMatchObject({
    kind: "failure",
    error: "unavailable",
    canRetry: false,
  });
  noRecordWork(f);
});

for (const loss of ["access", "scope", "unmount", "dispose"] as const) {
  test(`owned metadata is not cached across actual resource ${loss}`, () => {
    const f = fixture();
    f.settle();
    f.startRemote(records.slice(0, 1));
    const authority = f.frames.commitSource(sourceInput(f, "server"));
    expect(requireCriteriaSource(authority, f.frames)).toMatchObject({
      kind: "ready",
    });
    if (loss === "access")
      f.resource.setContext({ ...f.context, access: false });
    if (loss === "scope")
      f.resource.setContext({ ...f.context, scopeKey: "other" });
    if (loss === "unmount") f.resource.clear("unmount");
    if (loss === "dispose") f.resource.dispose();
    f.reset();
    expect(() => requireCriteriaSource(authority, f.frames)).toThrow(
      "Criteria frame is unavailable.",
    );
    noRecordWork(f);
  });
}

test("actual invalidation callback failure cannot be hidden by owned metadata", () => {
  const f = fixture();
  f.settle();
  let invalidations = 0;
  const resource = createResourceAdapter<Item, QueryFor<Schema>>(f.context, {
    onInvalidate() {
      invalidations++;
      throw new Error("Synthetic private invalidation failure");
    },
  });
  const input = remoteInput(f);
  const authority = f.frames.commitSource({
    ...input,
    source: { ...input.source, resource, view: resource.getSnapshot() },
  });
  expect(requireCriteriaSource(authority, f.frames)).toMatchObject({
    kind: "idle",
  });
  resource.clear();
  expect(invalidations).toBe(1);
  expect(resource.getSnapshot().invalidationFailed).toBe(true);
  expect(() => requireCriteriaSource(authority, f.frames)).toThrow();
});

for (const shape of ["copy", "proxy"] as const) {
  test(`${shape} supplied view never becomes owned metadata`, () => {
    const f = fixture();
    f.settle();
    f.startRemote(records.slice(0, 1));
    const input = remoteInput(f);
    let traps = 0;
    const view =
      shape === "copy"
        ? Object.freeze({ ...input.source.view })
        : new Proxy(input.source.view, {
            get() {
              traps++;
              throw new Error("Untrusted supplied view read");
            },
            getOwnPropertyDescriptor() {
              traps++;
              throw new Error("Untrusted supplied view capture");
            },
          });
    f.reset();
    expect(() =>
      f.frames.commitSource({ ...input, source: { ...input.source, view } }),
    ).toThrow();
    expect(traps).toBe(0);
    noRecordWork(f);
  });

  test(`${shape} supplied snapshot binding never becomes a genuine binding`, () => {
    const f = fixture();
    f.settle();
    f.startRemote(records.slice(0, 1));
    const input = remoteInput(f);
    const original = required(input.source.bindings.snapshot);
    let traps = 0;
    const snapshot =
      shape === "copy"
        ? Object.freeze({ ...original })
        : new Proxy(original, {
            get() {
              traps++;
              throw new Error("Unknown binding read");
            },
            getOwnPropertyDescriptor() {
              traps++;
              throw new Error("Unknown binding capture");
            },
          });
    f.reset();
    expect(() =>
      f.frames.commitSource({
        ...input,
        source: {
          ...input.source,
          bindings: { ...input.source.bindings, snapshot },
        },
      }),
    ).toThrow();
    expect(traps).toBe(0);
    noRecordWork(f);
  });
}

test("mismatched real request/snapshot tuples and unbound extent cannot be admitted", () => {
  const f = fixture();
  f.settle();
  const old = f.startRemote(records.slice(0, 1));
  begin(f);
  const input = remoteInput(f);
  expect(() =>
    f.frames.commitSource({
      ...input,
      source: {
        ...input.source,
        bindings: { ...input.source.bindings, request: old.binding },
      },
    }),
  ).toThrow();
  const raw = required(
    f.resource.begin({
      ...f.context,
      queryKey: "unbound",
      requestKey: "unbound-complete",
      query: f.app.C.getSnapshot().query,
      extent: { kind: "complete" },
      evaluatedAt: 0,
    }),
  );
  expect(raw.extent?.kind).toBe("complete");
  expect(
    getControlsRequestBinding(f.definition, f.app.C, f.resource, raw),
  ).toBeNull();
  expect(() => f.frames.commitSource(remoteInput(f))).toThrow();
});

test("raw source and supplied-binding descriptor reentry still fence later captures", () => {
  for (const entry of ["source", "bindings"] as const) {
    const f = fixture();
    f.settle();
    const input = remoteInput(f);
    const fields: PropertyKey[] = [];
    const bindings =
      entry === "bindings"
        ? new Proxy(input.source.bindings, {
            getOwnPropertyDescriptor(target, key) {
              fields.push(key);
              f.app.beginReset();
              return Reflect.getOwnPropertyDescriptor(target, key);
            },
          })
        : input.source.bindings;
    const source =
      entry === "source"
        ? new Proxy(input.source, {
            getOwnPropertyDescriptor(target, key) {
              fields.push(key);
              if (key === "view") f.app.beginReset();
              return Reflect.getOwnPropertyDescriptor(target, key);
            },
          })
        : { ...input.source, bindings };
    f.reset();
    expect(() => f.frames.commitSource({ ...input, source })).toThrow();
    expect(fields).toEqual(
      entry === "source" ? ["mode", "resource", "view"] : ["request"],
    );
    noRecordWork(f);
  }
});

test("client contextRef remains untrusted and revocation stops its next descriptor", () => {
  const f = fixture();
  f.settle();
  const fields: PropertyKey[] = [];
  const context = new Proxy(f.context, {
    getOwnPropertyDescriptor(target, key) {
      fields.push(key);
      f.app.beginReset();
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
  });
  f.reset();
  expect(() =>
    f.frames.commitSource({
      criteria: f.app.authority(),
      expected: f.context,
      source: { mode: "client", context, records: [] },
    }),
  ).toThrow();
  expect(fields).toEqual(["definitionKey"]);
  noRecordWork(f);
});

test("a real native callback revoking P cannot reach a later callback or source exposure", () => {
  const f = fixture();
  f.settle();
  f.startRemote(records.slice(0, 2));
  const authority = f.frames.commitSource(sourceInput(f, "server"));
  f.callbacks.rowId = () => {
    f.app.beginReset();
  };
  f.reset();
  expect(() => f.frames.prepare(f.input("server"))).toThrow(
    "Criteria frame is unavailable.",
  );
  expect(f.counts.rowId).toBe(1);
  expect(f.counts.eligible).toBe(0);
  expect(f.counts.vendor).toBe(0);
  expect(() => requireCriteriaSource(authority, f.frames)).toThrow();
});

test("owned snapshot metadata does not inspect or freeze application record elements", () => {
  const f = fixture();
  f.settle();
  const started = begin(f);
  const target = { ...required(records[0]) };
  let touches = 0;
  const record = new Proxy(target, {
    get() {
      touches++;
      throw new Error("Record getter must stay opaque");
    },
    getOwnPropertyDescriptor() {
      touches++;
      throw new Error("Record capture must stay opaque");
    },
    preventExtensions() {
      touches++;
      throw new Error("Application record must not freeze");
    },
  });
  expect(
    f.resource.succeed(started.request, {
      source: "fresh",
      records: [record],
      page: { kind: "known", total: 1 },
      emptyKind: "unknown",
      receivedAt: "2026-11-24T00:00:00Z",
    }),
  ).toBe(true);
  f.reset();
  const authority = f.frames.commitSource(sourceInput(f, "server"));
  expect(requireCriteriaSource(authority, f.frames)).toMatchObject({
    kind: "ready",
    hasSnapshot: true,
    emptyKind: "unknown",
  });
  target.amount = 99;
  expect(requireCriteriaSource(authority, f.frames)).toMatchObject({
    kind: "ready",
  });
  expect(required(f.resource.getSnapshot().snapshot).records[0]).toBe(record);
  expect(Object.isFrozen(target)).toBe(false);
  expect(touches).toBe(0);
  noRecordWork(f);
});

// Third allocation: append-only safety vectors; the original19 cases stay intact.
function ownedClientInput(f: Fixture) {
  const input = f.input("client", records.slice(0, 2));
  if (input.source.mode !== "client") throw new Error("Expected client source");
  const context = input.criteria.require().context;
  return { ...input, source: { ...input.source, context } };
}

test("exact P-origin client context preserves real native callback order and values", () => {
  const results = [];
  for (const shape of ["owned", "copy"] as const) {
    const f = fixture();
    f.settle();
    const owned = ownedClientInput(f);
    const input =
      shape === "owned"
        ? owned
        : {
            ...owned,
            source: { ...owned.source, context: { ...owned.source.context } },
          };
    const order: string[] = [];
    for (const name of ["rowId", "eligible", "vendor"] as const)
      f.callbacks[name] = () => {
        order.push(name);
      };
    f.reset();
    const authority = f.frames.commitSource(input);
    expect(requireCriteriaSource(authority, f.frames).mode).toBe("client");
    const frame = f.frames.commit(f.frames.prepare(input));
    f.frames.issue(frame).controls.read();
    results.push({
      counts: { ...f.counts },
      order,
      ids: frame.view.rows.map((row) => row.id),
    });
  }
  expect(required(results[0]).order).toContain("rowId");
  expect(results[0]).toEqual(results[1]);
});

test("saved exact immutable client context cannot survive actual P revocation", () => {
  const f = fixture();
  f.settle();
  const input = ownedClientInput(f);
  const authority = f.frames.commitSource(input);
  f.frames.commit(f.frames.prepare(input));
  expect(requireCriteriaSource(authority, f.frames).mode).toBe("client");
  f.app.beginReset();
  expect(input.source.context.access).toBe(true);
  expect(Object.isFrozen(input.source.context)).toBe(true);
  f.reset();
  expect(() => requireCriteriaSource(authority, f.frames)).toThrow();
  expect(() => f.frames.prepare(input)).toThrow();
  expect(Object.values(f.counts).every((count) => count === 0)).toBe(true);
});

test("a mutable client context copy remains live in metadata and committed source checks", () => {
  const f = fixture();
  f.settle();
  const owned = ownedClientInput(f);
  const context = { ...owned.source.context };
  const input = { ...owned, source: { ...owned.source, context } };
  const authority = f.frames.commitSource(input);
  const frame = f.frames.commit(f.frames.prepare(input));
  const pair = f.frames.issue(frame);
  pair.controls.read();
  context.scopeKey = "changed-raw-scope";
  f.reset();
  expect(() => requireCriteriaSource(authority, f.frames)).toThrow();
  expect(() => pair.controls.read()).toThrow();
  expect(Object.values(f.counts).every((count) => count === 0)).toBe(true);
});

for (const targetShape of ["owned", "mutable-copy", "frozen-copy"] as const) {
  test(`${targetShape} context wrapped in a Proxy retains per-descriptor metadata fences`, () => {
    const f = fixture();
    f.settle();
    const owned = ownedClientInput(f);
    const target =
      targetShape === "owned"
        ? owned.source.context
        : targetShape === "frozen-copy"
          ? Object.freeze({ ...owned.source.context })
          : { ...owned.source.context };
    let armed = false;
    const fields: PropertyKey[] = [];
    const context = new Proxy(target, {
      getOwnPropertyDescriptor(object, key) {
        if (armed) {
          fields.push(key);
          f.app.beginReset();
        }
        return Reflect.getOwnPropertyDescriptor(object, key);
      },
    });
    const authority = f.frames.commitSource({
      ...owned,
      source: { ...owned.source, context },
    });
    f.reset();
    armed = true;
    expect(() => requireCriteriaSource(authority, f.frames)).toThrow();
    expect(fields).toEqual(["definitionKey"]);
    noRecordWork(f);
  });
}

test("client source fallback fences context descriptor reentry after a real row callback", () => {
  const f = fixture();
  f.settle();
  const owned = ownedClientInput(f);
  let armed = false;
  const fields: PropertyKey[] = [];
  const context = new Proxy(Object.freeze({ ...owned.source.context }), {
    getOwnPropertyDescriptor(target, key) {
      if (armed) {
        fields.push(key);
        f.app.beginReset();
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
  });
  f.callbacks.rowId = () => {
    armed = true;
  };
  f.reset();
  expect(() =>
    f.frames.prepare({
      ...owned,
      source: { ...owned.source, context },
    }),
  ).toThrow();
  expect(fields).toEqual(["definitionKey"]);
  expect(f.counts.rowId).toBe(1);
  expect(f.counts.eligible).toBe(0);
  expect(f.counts.vendor).toBe(0);
});

// Custom resource protocol vectors, not factory-adapter grants. Real C/P/native
// frames remain the producers; commitSource must still reject these resources.
for (const shape of ["custom", "frozen-copy", "proxy"] as const) {
  test(`stable ${shape} resource preserves the existing generic native prepare route`, () => {
    const f = fixture();
    f.settle();
    const input = f.input("server");
    if (input.source.mode === "client")
      throw new Error("Expected server input");
    const actual = f.resource.getSnapshot();
    let resource = f.resource;
    let reads = 0;
    const raw = {
      ...f.resource,
      getSnapshot() {
        expect(this).toBe(resource);
        reads++;
        return actual;
      },
      getServerSnapshot() {
        expect(this).toBe(resource);
        return actual;
      },
    };
    resource =
      shape === "proxy"
        ? new Proxy(raw, {})
        : shape === "frozen-copy"
          ? Object.freeze(raw)
          : raw;
    const candidate = { ...input, source: { ...input.source, resource } };
    expect(() => f.frames.commitSource(candidate)).toThrow();
    f.reset();
    const frame = f.frames.commit(f.frames.prepare(candidate));
    expect(frame.view.rows).toHaveLength(0);
    expect(reads).toBeGreaterThan(1);
    expect(Object.values(f.counts).every((count) => count === 0)).toBe(true);
  });

  for (const reentry of ["reader", "descriptor"] as const) {
    test(`${shape} resource keeps ${reentry} revocation fences in source.check`, () => {
      const f = fixture();
      f.settle();
      const input = f.input("server");
      if (input.source.mode === "client")
        throw new Error("Expected server input");
      const source = input.source;
      const actual = f.resource.getSnapshot();
      const fields: PropertyKey[] = [];
      const poisoned = new Proxy(actual, {
        getOwnPropertyDescriptor(target, key) {
          fields.push(key);
          f.app.beginReset();
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      });
      let resource = f.resource;
      let reads = 0;
      const raw = {
        ...f.resource,
        getSnapshot() {
          expect(this).toBe(resource);
          reads++;
          if (reads === 1) return actual;
          if (reentry === "reader") f.app.beginReset();
          return poisoned;
        },
        getServerSnapshot() {
          expect(this).toBe(resource);
          return actual;
        },
      };
      resource =
        shape === "proxy"
          ? new Proxy(raw, {})
          : shape === "frozen-copy"
            ? Object.freeze(raw)
            : raw;
      f.reset();
      expect(() =>
        f.frames.prepare({
          ...input,
          source: { ...source, resource },
        }),
      ).toThrow();
      expect(reads).toBe(2);
      expect(fields).toEqual(reentry === "reader" ? [] : ["context"]);
      noRecordWork(f);
    });
  }
}

// Fourth allocation: shape reuse must not cache any live decision or authority.
test("same owned failure view still follows fresh controller query identity on every read", () => {
  const f = fixture();
  f.settle();
  let retries = 0;
  const started = begin(f, () => {
    retries++;
  });
  expect(f.resource.fail(started.request, "timeout")).toBe(true);
  const view = f.resource.getSnapshot();
  const authority = f.frames.commitSource(sourceInput(f, "server"));
  const read = () => requireCriteriaSource(authority, f.frames);
  for (let i = 0; i < 3; i++)
    expect(read()).toMatchObject({ error: "timeout", canRetry: true });
  f.accept({ type: "search.commit", search: "different-current-query" });
  expect(f.resource.getSnapshot()).toBe(view);
  for (let i = 0; i < 3; i++)
    expect(read()).toMatchObject({ error: "timeout", canRetry: false });
  f.accept({ type: "search.commit", search: "" });
  expect(f.resource.getSnapshot()).toBe(view);
  expect(read()).toMatchObject({ error: "timeout", canRetry: true });
  expect(retries).toBe(0);
  noRecordWork(f);
});

test("a warmed owned view cannot rescue source exposure after actual P reset", () => {
  const f = fixture();
  f.settle();
  f.startRemote(records.slice(0, 2));
  const input = remoteInput(f);
  const nativeInput = f.input("server");
  const view = f.resource.getSnapshot();
  const authority = f.frames.commitSource(input);
  for (let i = 0; i < 3; i++)
    expect(requireCriteriaSource(authority, f.frames)).toMatchObject({
      kind: "ready",
      hasSnapshot: true,
    });
  f.app.beginReset();
  expect(f.resource.getSnapshot()).toBe(view);
  expect(view.context.access).toBe(true);
  f.reset();
  expect(() => requireCriteriaSource(authority, f.frames)).toThrow();
  expect(() => f.frames.commitSource(input)).toThrow();
  expect(() => f.frames.prepare(nativeInput)).toThrow();
  noRecordWork(f);
});

test("old parsed view and newly frozen view cannot retag a resource after scope loss", () => {
  const f = fixture();
  f.settle();
  f.startRemote(records.slice(0, 1));
  const input = remoteInput(f);
  const oldView = f.resource.getSnapshot();
  const authority = f.frames.commitSource(input);
  for (let i = 0; i < 3; i++)
    expect(requireCriteriaSource(authority, f.frames)).toMatchObject({
      kind: "ready",
    });
  f.resource.setContext({ ...f.context, scopeKey: "next-resource-scope" });
  const nextView = f.resource.getSnapshot();
  expect(nextView).not.toBe(oldView);
  expect(Object.isFrozen(nextView)).toBe(true);
  f.reset();
  expect(() => requireCriteriaSource(authority, f.frames)).toThrow();
  expect(() =>
    f.frames.commitSource({
      ...input,
      source: { ...input.source, view: oldView },
    }),
  ).toThrow();
  expect(() =>
    f.frames.commitSource({
      ...input,
      source: { ...input.source, view: nextView },
    }),
  ).toThrow();
  noRecordWork(f);
});

test("owned shape reuse does not carry retained failure fields into a cleared view", () => {
  const f = fixture();
  f.settle();
  f.startRemote(records.slice(0, 1));
  const authority = f.frames.commitSource(sourceInput(f, "server"));
  const read = () => requireCriteriaSource(authority, f.frames);
  expect(read()).toMatchObject({ kind: "ready", hasSnapshot: true });
  const refresh = begin(f, () => undefined);
  expect(f.resource.fail(refresh.request, "offline")).toBe(true);
  const failedView = f.resource.getSnapshot();
  for (let i = 0; i < 3; i++)
    expect(read()).toMatchObject({
      kind: "failure",
      hasSnapshot: true,
      stale: true,
      error: "offline",
      canRetry: true,
    });
  f.resource.clear();
  expect(f.resource.getSnapshot()).not.toBe(failedView);
  f.reset();
  for (let i = 0; i < 3; i++)
    expect(read()).toMatchObject({
      kind: "idle",
      hasSnapshot: false,
      stale: false,
      busy: false,
      error: null,
      emptyKind: null,
      canRetry: false,
    });
  noRecordWork(f);
});
