import { expect, test } from "vitest";
import { createCriteriaAuthority } from "../../packages/react/src/controller/criteria.js";
import {
  createCriteriaPublication,
  getCriteriaPublicationBinding,
} from "../../packages/react/src/controller/criteria-publication.js";
import {
  createControlsAuthority,
  getControlsAuthorityOwner,
} from "../../packages/react/src/presentation/authority.js";
import {
  createCriteriaFrames,
  getCriteriaToolOwner,
  requireCriteriaTool,
} from "../../packages/react/src/presentation/criteria-frame.js";
import { fixture, records, required } from "./fixtures.js";

test("inert genuine pending construction is provenance only; denied prepare never reads private payload", () => {
  const f = fixture();
  expect(Object.values(f.counts).every((count) => count === 0)).toBe(true);
  expect(f.frames.getSnapshot().phase).toBe("empty");
  let reads = 0;
  const input = {
    criteria: f.initialCriteria,
    get expected() {
      reads++;
      throw 0;
    },
    get source() {
      reads++;
      throw 0;
    },
    get nativeInput() {
      reads++;
      throw 0;
    },
  };
  expect(() => Reflect.apply(f.frames.prepare, f.frames, [input])).toThrow(
    expect.objectContaining({ code: "criteria.frame.unavailable" }),
  );
  expect(reads).toBe(0);
  expect(Object.values(f.counts).every((count) => count === 0)).toBe(true);
});
for (const enabled of [false, true])
  for (const mode of ["client", "server", "server-complete"] as const)
    for (const selection of [false, "single", "multiple"] as const)
      test(`real frame mode=${mode}/policy=${enabled}/selection=${selection}`, () => {
        const f = fixture(enabled, selection);
        f.settle();
        const supported =
          mode === "client" ||
          (enabled ? mode === "server" : mode === "server-complete");
        if (mode !== "client") f.startRemote();
        f.reset();
        if (!supported) {
          expect(() => f.commit(mode)).toThrow(
            expect.objectContaining({ code: "criteria.frame.unavailable" }),
          );
          expect(f.counts.rowId).toBe(0);
          return;
        }
        const frame = f.commit(mode),
          pair = f.frames.issue(frame);
        expect(frame.view.controller).toBe(f.app.C);
        expect(frame.view.native).toBe(frame.view.native);
        expect(pair.owner).toBe(f.frames);
        expect(getCriteriaToolOwner(pair.tool)).toBe(f.frames);
        expect(getControlsAuthorityOwner(pair.controls)).toEqual({
          definition: f.definition,
          controller: f.app.C,
        });
        expect(getCriteriaPublicationBinding(pair.criteria)?.publication).toBe(
          f.app.P,
        );
        f.reset();
        expect(requireCriteriaTool(pair.tool, f.frames).controller).toBe(
          f.app.C,
        );
        expect(Object.values(f.counts).every((count) => count === 0)).toBe(
          true,
        );
        const controls = pair.controls.read();
        expect(controls.paginationEnabled).toBe(enabled);
        expect(controls.canSelect).toBe(selection !== false);
        expect(controls.blockedReason).toBeNull();
        if (mode === "server-complete") {
          expect(frame.view.rows.map((row) => row.original)).toEqual(
            f.resource.getSnapshot().snapshot?.records,
          );
          expect(controls.displayed?.range).toEqual({ from: 1, to: 137 });
          expect(controls.canNavigate).toBe(false);
        }
      });
for (const empty of [false, true])
  test(`disabled client genuine filtered unsliced frame empty=${empty}`, () => {
    const f = fixture(false, "multiple", "custom");
    f.settle();
    const frame = f.commit("client", empty ? [] : records),
      pair = f.frames.issue(frame);
    expect(frame.view.rows).toHaveLength(empty ? 0 : 148);
    expect(requireCriteriaTool(pair.tool, f.frames).context.access).toBe(true);
    expect(pair.controls.read().displayed?.range).toEqual(
      empty ? { from: 0, to: 0 } : { from: 1, to: 148 },
    );
  });
test("uncommitted/bootstrap/copy/proxy/foreign frame and ticket cannot issue or commit", () => {
  const f = fixture(),
    g = fixture();
  f.settle();
  g.settle();
  const ticket = f.frames.prepare(f.input());
  const foreign = g.commit();
  f.reset();
  for (const value of [
    ticket,
    {},
    { view: foreign.view },
    foreign,
    new Proxy(foreign, {}),
  ])
    expect(() => Reflect.apply(f.frames.issue, f.frames, [value])).toThrow(
      expect.objectContaining({ code: "criteria.frame.unavailable" }),
    );
  expect(() =>
    Reflect.apply(f.frames.commit, new Proxy(f.frames, {}), [ticket]),
  ).toThrow();
  expect(() =>
    Reflect.apply(f.frames.commit, f.frames, [{ ...ticket }]),
  ).toThrow();
  expect(Object.values(f.counts).every((count) => count === 0)).toBe(true);
  const frame = f.frames.commit(ticket);
  expect(f.frames.issue(frame).owner).toBe(f.frames);
});
test("old prepared tickets and exact stale disconnect cannot replace or clear newer committed cell", () => {
  const f = fixture();
  f.settle();
  const first = f.commit(),
    pair = f.frames.issue(first),
    old = f.frames.prepare(f.input());
  const next = f.frames.prepare(f.input("client", records.slice(0, 2)));
  expect(() => f.frames.commit(old)).toThrow();
  const frame = f.frames.commit(next);
  f.frames.disconnect(first);
  expect(requireCriteriaTool(pair.tool, f.frames).epoch).toBe(
    requireCriteriaTool(f.frames.issue(frame).tool, f.frames).epoch,
  );
  expect(f.frames.getSnapshot().phase).toBe("committed");
  f.frames.disconnect(frame);
  expect(() => requireCriteriaTool(pair.tool, f.frames)).toThrow();
  expect(f.frames.getSnapshot().phase).toBe("empty");
});
test("same-domain sort/page/query refresh follows registered frames, never full query identity", () => {
  const f = fixture();
  f.settle();
  const first = f.commit(),
    pair = f.frames.issue(first);
  f.accept({ type: "sorting.change", update: [{ id: "amount", desc: true }] });
  f.accept({
    type: "pagination.change",
    update: { pageIndex: 1, pageSize: 25 },
  });
  f.accept({ type: "search.commit", search: "new" });
  const next = f.commit();
  expect(next.view.state.queryIdentity).not.toBe(
    first.view.state.queryIdentity,
  );
  f.reset();
  expect(requireCriteriaTool(pair.tool, f.frames).epoch).toBe(
    requireCriteriaTool(f.frames.issue(next).tool, f.frames).epoch,
  );
  expect(Object.values(f.counts).every((count) => count === 0)).toBe(true);
  expect(() => pair.controls.selectPage(true)).toThrow(
    expect.objectContaining({ code: "controls.unavailable" }),
  );
});
test("raw plain/controls lookalikes and public require getter are not paired capability proof", () => {
  const f = fixture();
  f.settle();
  const committed = f.commit(),
    pair = f.frames.issue(committed);
  let reads = 0;
  const plain = createCriteriaAuthority({
    origin: requireCriteriaTool(pair.tool, f.frames),
    readCurrent: () => {
      reads++;
      return required(f.app.P.getSnapshot().current);
    },
  });
  expect(() =>
    createCriteriaFrames({
      nativeDefinition: f.definition,
      controller: f.app.C,
      publication: f.app.P,
      criteria: plain,
    }),
  ).toThrow();
  expect(reads).toBe(0);
  const raw = createControlsAuthority({
    definition: f.definition,
    controller: f.app.C,
    queryIdentity: committed.view.state.queryIdentity,
    context: f.context,
    mode: "client",
    readCommitted() {
      reads++;
      throw 0;
    },
  });
  const poisoned = Object.defineProperty({}, "require", {
    get() {
      reads++;
      throw 0;
    },
  });
  for (const authority of [
    plain,
    raw,
    poisoned,
    { ...pair.tool },
    new Proxy(pair.tool, {}),
  ])
    expect(() =>
      Reflect.apply(requireCriteriaTool, undefined, [authority, f.frames]),
    ).toThrow(expect.objectContaining({ code: "criteria.frame.unavailable" }));
  expect(reads).toBe(0);
});
test("first commit pins mode and exact remote resource; close is local, metadata snapshots stable", () => {
  const f = fixture(false),
    g = fixture(false);
  f.settle();
  g.settle();
  f.startRemote();
  g.startRemote();
  const frame = f.commit("server-complete"),
    pair = f.frames.issue(frame),
    snapshot = f.frames.getSnapshot();
  expect(f.frames.getSnapshot()).toBe(snapshot);
  expect(() => f.frames.prepare(f.input("client"))).toThrow();
  const foreign = g.input("server-complete"),
    own = f.input("server-complete");
  expect(() =>
    f.frames.prepare({
      ...own,
      source: foreign.source,
      nativeInput: foreign.nativeInput,
    }),
  ).toThrow();
  f.frames.close();
  expect(f.frames.getSnapshot().phase).toBe("closed");
  expect(f.app.C.isDisposed()).toBe(false);
  expect(f.app.P.getSnapshot().phase).toBe("settled");
  expect(f.resource.getSnapshot().kind).toBe("ready");
  expect(() => requireCriteriaTool(pair.tool, f.frames)).toThrow();
  f.frames.close();
});
test("P1 disposed/P2 equal C/CD/context/epoch cannot retag saved tool authority", () => {
  const f = fixture();
  f.settle();
  const first = f.commit(),
    pair = f.frames.issue(first),
    old = requireCriteriaTool(pair.tool, f.frames);
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
          publication.getSnapshot().pending !== event.next
        )
          throw new Error("Missing actual known-retired bootstrap certificate");
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
  if (begun.status !== "pending" || !begun.snapshot.pending)
    throw new Error("Missing P2 ticket");
  ticket = begun.ticket;
  expect(publication.complete(begun.ticket).status).toBe("settled");
  const current = required(publication.getSnapshot().current);
  expect(current.epoch).toBe(old.epoch);
  const criteria = publication.issue({
    controller: f.app.C,
    definition: f.app.CD,
    context: current.expected,
    epoch: current.epoch,
  });
  const next = createCriteriaFrames({
    nativeDefinition: f.definition,
    controller: f.app.C,
    publication,
    criteria,
  });
  const input = {
    criteria,
    expected: f.context,
    source: { mode: "client" as const, context: f.context, records },
    nativeInput: { mode: "client" as const, records },
  };
  const nextPair = next.issue(next.commit(next.prepare(input)));
  expect(requireCriteriaTool(nextPair.tool, next).epoch).toBe(old.epoch);
  f.reset();
  expect(() => requireCriteriaTool(pair.tool, next)).toThrow();
  expect(() => requireCriteriaTool(pair.tool, f.frames)).toThrow();
  expect(Object.values(f.counts).every((count) => count === 0)).toBe(true);
});
