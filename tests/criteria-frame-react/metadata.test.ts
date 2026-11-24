import { expect, test } from "vitest";
import { createCriteriaPublication } from "../../packages/react/src/controller/criteria-publication.js";
import {
  type CriteriaSourceAuthority,
  createCriteriaFrames,
  getCriteriaSourceOwner,
  getCriteriaToolOwner,
  requireCriteriaSource,
  requireCriteriaTool,
} from "../../packages/react/src/presentation/criteria-frame.js";
import { hasResourceAdapterIdentity } from "../../packages/react/src/resource/adapter.js";
import {
  begin,
  fixture,
  records,
  required,
  type Schema,
  sourceInput,
} from "./fixtures.js";

test("pending constructor and rejected commitSource do not traverse private candidate fields", () => {
  const f = fixture();
  let reads = 0;
  expect(f.frames.getSnapshot()).toBe(f.frames.getSnapshot());
  expect(() =>
    Reflect.apply(f.frames.commitSource, f.frames, [
      {
        criteria: f.initialCriteria,
        get expected() {
          reads++;
          throw 0;
        },
        get source() {
          reads++;
          throw 0;
        },
      },
    ]),
  ).toThrow();
  expect(reads).toBe(0);
  expect(Object.values(f.counts).every((n) => n === 0)).toBe(true);
});
for (const enabled of [true, false]) {
  const mode = enabled ? "server" : "server-complete";
  test(`genuine initial idle is metadata-only, policy=${enabled}`, () => {
    const f = fixture(enabled);
    f.settle();
    f.reset();
    const authority = f.frames.commitSource(sourceInput(f, mode));
    expect(getCriteriaSourceOwner(authority)).toBe(f.frames);
    expect(getCriteriaToolOwner(authority as never)).toBeNull();
    expect(() =>
      requireCriteriaTool<Schema>(authority as never, f.frames),
    ).toThrow();
    expect(requireCriteriaSource(authority, f.frames)).toEqual({
      origin: expect.objectContaining({ controller: f.app.C }),
      mode,
      kind: "idle",
      busy: false,
      stale: false,
      hasSnapshot: false,
      error: null,
      emptyKind: null,
      canRetry: false,
    });
    expect(f.frames.getSnapshot().phase).toBe("empty");
    expect(Object.values(f.counts).every((n) => n === 0)).toBe(true);
    f.resource.dispose();
    expect(hasResourceAdapterIdentity(f.resource)).toBe(true);
    expect(() => requireCriteriaSource(authority, f.frames)).toThrow();
  });
  test(`pending/failure/retry original tuple, no snapshot or native, policy=${enabled}`, () => {
    const f = fixture(enabled);
    f.settle();
    let retries = 0;
    const request = begin(f, () => {
      retries++;
    });
    const authority = f.frames.commitSource(sourceInput(f, mode));
    f.reset();
    expect(requireCriteriaSource(authority, f.frames)).toMatchObject({
      kind: "pending",
      hasSnapshot: false,
      canRetry: false,
    });
    f.resource.fail(request.request, "offline");
    expect(requireCriteriaSource(authority, f.frames)).toMatchObject({
      kind: "failure",
      error: "offline",
      canRetry: true,
      hasSnapshot: false,
    });
    f.accept({ type: "clock.tick" });
    expect(requireCriteriaSource(authority, f.frames)).toMatchObject({
      canRetry: true,
    });
    f.accept({ type: "search.commit", search: "changed" });
    expect(requireCriteriaSource(authority, f.frames)).toMatchObject({
      canRetry: false,
    });
    expect(retries).toBe(0);
    expect(f.frames.getSnapshot().phase).toBe("empty");
    expect(Object.values(f.counts).every((n) => n === 0)).toBe(true);
  });
  test(`genuine snapshot metadata plus actual native full/complete commit, policy=${enabled}`, () => {
    const f = fixture(enabled);
    f.settle();
    f.startRemote();
    const authority = f.frames.commitSource(sourceInput(f, mode));
    expect(requireCriteriaSource(authority, f.frames)).toMatchObject({
      kind: "ready",
      hasSnapshot: true,
      canRetry: false,
    });
    const frame = f.frames.commit(
        f.frames.prepare({ ...f.input(mode), manualOrder: true }),
      ),
      pair = f.frames.issue(frame);
    expect(frame.view.rows.length).toBe(enabled ? 25 : 137);
    expect(pair.controls.read().canReorder).toBe(true);
    expect(() => f.frames.prepare(f.input("client"))).toThrow();
    const newer = f.frames.commitSource(sourceInput(f, mode));
    f.frames.disconnectSource(authority);
    expect(requireCriteriaSource(newer, f.frames).mode).toBe(mode);
    expect(requireCriteriaSource(authority, f.frames).mode).toBe(mode);
    f.frames.close();
    expect(() => requireCriteriaSource(newer, f.frames)).toThrow();
    expect(() => requireCriteriaTool(pair.tool, f.frames)).toThrow();
    expect(f.app.C.isDisposed()).toBe(false);
    expect(f.app.P.getSnapshot().phase).toBe("settled");
    expect(f.resource.getSnapshot().kind).toBe("ready");
  });
}
test("factory identity rejects stolen idle views/copies/proxies before alleged source payload or ports", () => {
  const f = fixture();
  f.settle();
  const actual = f.resource.getSnapshot();
  let traversals = 0;
  const copy = Object.freeze({
    ...f.resource,
    getSnapshot() {
      traversals++;
      return actual;
    },
  });
  const proxy = new Proxy(f.resource, {
    get() {
      traversals++;
      throw 0;
    },
    getOwnPropertyDescriptor() {
      traversals++;
      throw 0;
    },
  });
  for (const resource of [{}, copy, proxy]) {
    expect(hasResourceAdapterIdentity(resource)).toBe(false);
    const source = {
      mode: "server",
      resource,
      get view() {
        traversals++;
        return actual;
      },
      get bindings() {
        traversals++;
        throw 0;
      },
    };
    expect(() =>
      Reflect.apply(f.frames.commitSource, f.frames, [
        { criteria: f.app.authority(), expected: f.context, source },
      ]),
    ).toThrow();
  }
  expect(traversals).toBe(0);
});
test("client metadata never reads records/counts and capability identity precedes payload reflection", () => {
  const f = fixture();
  f.settle();
  let reads = 0;
  const source = {
    mode: "client",
    context: f.context,
    get records() {
      reads++;
      throw 0;
    },
  };
  const authority = Reflect.apply(f.frames.commitSource, f.frames, [
    { criteria: f.app.authority(), expected: f.context, source },
  ]) as CriteriaSourceAuthority<Schema>;
  expect(requireCriteriaSource(authority, f.frames)).toEqual({
    origin: expect.any(Object),
    mode: "client",
  });
  const poison = new Proxy(
    {},
    {
      get() {
        reads++;
        throw 0;
      },
      getOwnPropertyDescriptor() {
        reads++;
        throw 0;
      },
    },
  );
  for (const value of [{ ...authority }, new Proxy(authority, {}), poison]) {
    expect(getCriteriaSourceOwner(value as never)).toBeNull();
    expect(() =>
      requireCriteriaSource<Schema>(value as never, f.frames),
    ).toThrow();
  }
  expect(reads).toBe(0);
  expect(Object.values(f.counts).every((n) => n === 0)).toBe(true);
});
test("foreign owner, P2 and binding substitution cannot retag genuine source authorities", () => {
  const f = fixture(),
    g = fixture();
  f.settle();
  g.settle();
  const authority = f.frames.commitSource(sourceInput(f));
  expect(() => requireCriteriaSource(authority, g.frames)).toThrow();
  const p2 = createCriteriaPublication({
    controller: f.app.C,
    definition: f.app.CD,
    retirement: { retire: () => undefined },
  });
  expect(() =>
    createCriteriaFrames({
      nativeDefinition: f.definition,
      controller: f.app.C,
      publication: p2,
      criteria: f.app.authority(),
    }),
  ).toThrow();
  const reset = f.app.beginReset();
  if (reset.status !== "pending") throw new Error("Real reset ticket required");
  expect(f.app.completeReset(reset.ticket).status).toBe("settled");
  const next = f.frames.commitSource(sourceInput(f));
  expect(() => requireCriteriaSource(authority, f.frames)).toThrow();
  expect(requireCriteriaSource(next, f.frames).mode).toBe("client");
});
test("foreign and missing request/snapshot bindings deny despite genuine resource identity", () => {
  const f = fixture(),
    g = fixture();
  f.settle();
  g.settle();
  f.startRemote();
  g.startRemote();
  const input = sourceInput(f, "server"),
    foreign = sourceInput(g, "server");
  if (input.source.mode === "client" || foreign.source.mode === "client")
    throw 0;
  const source = input.source;
  for (const bindings of [
    { request: null, snapshot: null },
    foreign.source.bindings,
  ])
    expect(() =>
      f.frames.commitSource({ ...input, source: { ...source, bindings } }),
    ).toThrow();
  const authority = f.frames.commitSource(input);
  f.resource.setContext({ ...f.context, access: false });
  expect(() => requireCriteriaSource(authority, f.frames)).toThrow();
  expect(() => f.frames.commitSource(sourceInput(f, "server"))).toThrow();
});
test("source commit reentry invalidates the outer action; exact stale cleanup preserves replacement", () => {
  const f = fixture();
  f.settle();
  const input = sourceInput(f);
  let entered = false;
  const context = new Proxy(f.context, {
    getOwnPropertyDescriptor(target, key) {
      if (!entered) {
        entered = true;
        try {
          f.frames.commitSource(input);
        } catch {
          /* expected reentrant denial */
        }
      }
      return Object.getOwnPropertyDescriptor(target, key);
    },
  });
  expect(() =>
    f.frames.commitSource({
      ...input,
      source: { mode: "client", context, records },
    }),
  ).toThrow();
  const a = f.frames.commitSource(input),
    b = f.frames.commitSource(input);
  f.frames.disconnectSource(a);
  expect(requireCriteriaSource(b, f.frames).mode).toBe("client");
  f.frames.disconnectSource(b);
  expect(() => requireCriteriaSource(a, f.frames)).toThrow();
});
test("disposed P1 and genuine known-retired P2 with equal labels/epoch cannot retag a saved source capability", () => {
  const f = fixture();
  f.settle();
  const source = f.frames.commitSource(sourceInput(f));
  const old = requireCriteriaSource(source, f.frames);
  f.app.beginReset();
  expect(f.app.P.dispose().status).toBe("disposed");
  expect(f.app.C.isDisposed()).toBe(false);
  const before = f.app.C.getSnapshot();
  let ticket: object | null = null;
  const publication = createCriteriaPublication({
    controller: f.app.C,
    definition: f.app.CD,
    retirement: {
      retire(event) {
        if (
          !ticket ||
          event.kind !== "transition" ||
          f.app.pending ||
          f.app.C.getSnapshot() !== before ||
          Object.keys(before.selection).length !== 0 ||
          f.app.appTransient !== null ||
          publication.getSnapshot().pending !== event.next
        )
          throw new Error("Actual known-retired bootstrap certificate missing");
        return undefined;
      },
    },
  });
  const begun = publication.begin({
    controller: f.app.C,
    definition: f.app.CD,
    expected: f.context,
    actual: f.context,
  });
  if (begun.status !== "pending") throw new Error("Actual P2 ticket required");
  ticket = begun.ticket;
  expect(publication.complete(begun.ticket).status).toBe("settled");
  const current = required(publication.getSnapshot().current);
  expect(current.epoch).toBe(old.origin.epoch);
  const criteria = publication.issue({
    controller: f.app.C,
    definition: f.app.CD,
    context: current.expected,
    epoch: current.epoch,
  });
  const frames = createCriteriaFrames({
    nativeDefinition: f.definition,
    controller: f.app.C,
    publication,
    criteria,
  });
  const next = frames.commitSource({
    criteria,
    expected: f.context,
    source: { mode: "client", context: f.context, records },
  });
  expect(requireCriteriaSource(next, frames).mode).toBe("client");
  expect(() => requireCriteriaSource(source, frames)).toThrow();
  expect(() => requireCriteriaSource(source, f.frames)).toThrow();
});
