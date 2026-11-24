import { afterEach, expect, it, vi } from "vitest";
import { createCriteriaToolbarStore } from "../../packages/heroui/src/toolbar/criteria-tool-host.js";
import {
  createCriteriaSearchLocal,
  criteriaSearch,
} from "../../packages/heroui/src/toolbar/filter-search.js";
import type { S } from "./fixtures.js";
import { fixture, required } from "./fixtures.js";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("ineffective native cancellation cannot make A's saved timer call B's observer", () => {
  const { f, store, stop } = setup();
  const callbacks: (() => void)[] = [];
  vi.stubGlobal("setTimeout", (run: () => void) => {
    callbacks.push(run);
    return callbacks.length;
  });
  vi.stubGlobal("clearTimeout", () => undefined);
  let now = 1000;
  vi.spyOn(Date, "now").mockImplementation(() => now);
  let aCalls = 0,
    bCalls = 0;
  store.commit(
    f.search({
      onMutation(result) {
        aCalls++;
        f.observe(result);
      },
    }),
  );
  const a = required(store.read());
  criteriaSearch.edit(store, a.actor, "captured");
  now = 1100;
  store.commit(
    f.search({
      onMutation(result) {
        bCalls++;
        f.observe(result);
      },
    }),
  );
  const b = required(store.read());
  criteriaSearch.arm(store, b.actor);
  expect(callbacks).toHaveLength(2);
  now = 1300;
  required(callbacks[0])();
  expect(aCalls).toBe(0);
  expect(bCalls).toBe(0);
  required(callbacks[1])();
  expect(aCalls).toBe(0);
  expect(bCalls).toBe(1);
  expect(required(f.pendingUI).transition.state.query.search).toBe("captured");
  f.rejectUI();
  stop();
});
function setup() {
  const f = fixture(),
    store = createCriteriaToolbarStore("search", createCriteriaSearchLocal<S>),
    stop = store.mount();
  store.commit(f.search());
  return { f, store, stop, frame: () => required(store.read()) };
}
it("rearms B from A's exact remaining deadline; A handlers never dispatch/read B", () => {
  vi.useFakeTimers();
  const { f, store, stop, frame } = setup();
  const a = frame();
  criteriaSearch.edit(store, a.actor, "new");
  const deadline = required(a.local.draft.read(a.actor)).deadline;
  vi.advanceTimersByTime(120);
  store.commit(f.search());
  const b = frame();
  criteriaSearch.reconcile(store, b.actor);
  criteriaSearch.arm(store, b.actor);
  expect(b.local.draft.read(b.actor)?.deadline).toBe(deadline);
  criteriaSearch.edit(store, a.actor, "stale A");
  criteriaSearch.clear(store, a.actor);
  criteriaSearch.submit(store, a.actor);
  vi.advanceTimersByTime(179);
  expect(f.observed).toHaveLength(0);
  vi.advanceTimersByTime(1);
  expect(f.observed).toHaveLength(1);
  expect(required(f.pendingUI).transition.state.query.search).toBe("new");
  f.rejectUI();
  stop();
});
it("IME has no intermediate dispatch; Escape cancel and immediate Clear are distinct", () => {
  vi.useFakeTimers();
  const { f, store, stop, frame } = setup(),
    a = frame();
  criteriaSearch.composition(store, a.actor, true);
  criteriaSearch.edit(store, a.actor, "composing");
  criteriaSearch.submit(store, a.actor);
  vi.advanceTimersByTime(1000);
  expect(f.observed).toHaveLength(0);
  criteriaSearch.composition(store, a.actor, false, "complete");
  vi.advanceTimersByTime(299);
  expect(f.observed).toHaveLength(0);
  criteriaSearch.cancel(store, a.actor);
  vi.advanceTimersByTime(1);
  expect(f.observed).toHaveLength(0);
  expect(a.local.draft.read(a.actor)).toBeNull();
  criteriaSearch.edit(store, a.actor, "accepted");
  criteriaSearch.submit(store, a.actor);
  f.acceptUI();
  criteriaSearch.clear(store, a.actor);
  expect(required(f.pendingUI).transition.state.query.search).toBe("");
  expect(f.app.C.getSnapshot().query.search).toBe("accepted");
  f.rejectUI();
  stop();
});
it("older acceptance uses original proposal query OBJECT/revision and rebases a newer edit (selection override included)", () => {
  vi.useFakeTimers();
  const { f, store, stop, frame } = setup(),
    a = frame();
  criteriaSearch.edit(store, a.actor, "first");
  criteriaSearch.submit(store, a.actor);
  const proposal = required(f.pendingUI);
  criteriaSearch.edit(store, a.actor, "newer");
  f.acceptUI({ selection: { one: true } });
  expect(f.app.C.getSnapshot().query).toBe(proposal.transition.state.query);
  criteriaSearch.reconcile(store, a.actor);
  criteriaSearch.arm(store, a.actor);
  expect(a.local.draft.read(a.actor)).toMatchObject({
    text: "newer",
    base: "first",
  });
  vi.advanceTimersByTime(300);
  expect(required(f.pendingUI).transition.state.query.search).toBe("newer");
  f.rejectUI();
  stop();
});
it("reject and independently normalized equal text cannot counterfeit acceptance; page/sort keep eligible draft", () => {
  vi.useFakeTimers();
  const { f, store, stop, frame } = setup(),
    a = frame();
  criteriaSearch.edit(store, a.actor, "first");
  criteriaSearch.submit(store, a.actor);
  const original = required(f.pendingUI);
  criteriaSearch.edit(store, a.actor, "newer");
  f.rejectUI();
  f.external({ type: "search.commit", search: "first" });
  expect(f.app.C.getSnapshot().query).not.toBe(original.transition.state.query);
  criteriaSearch.reconcile(store, a.actor);
  expect(a.local.draft.read(a.actor)).toBeNull();
  criteriaSearch.edit(store, a.actor, "survives");
  const deadline = a.local.draft.read(a.actor)?.deadline;
  f.external({
    type: "sorting.change",
    update: [{ id: "amount", desc: true }],
  });
  f.external({
    type: "pagination.change",
    update: { pageIndex: 1, pageSize: 25 },
  });
  criteriaSearch.reconcile(store, a.actor);
  expect(a.local.draft.read(a.actor)).toMatchObject({
    text: "survives",
    base: "first",
    deadline,
  });
  stop();
});
it("callback reset/reentry cannot read B or treat failed onRequest as acceptance", () => {
  vi.useFakeTimers();
  const { f, store, stop, frame } = setup(),
    a = frame();
  f.app.faults.onRequest = () => {
    throw new Error("Synthetic request failure");
  };
  criteriaSearch.edit(store, a.actor, "bad");
  criteriaSearch.submit(store, a.actor);
  expect(f.app.C.getSnapshot().query.search).toBe("");
  expect(f.pendingUI).toBeNull();
  expect(a.local.draft.read(a.actor)?.text).toBe("bad");
  delete f.app.faults.onRequest;
  store.commit(
    f.search({
      onMutation(result) {
        f.observe(result);
        f.reset();
        store.commit(f.search());
      },
    }),
  );
  const b = frame();
  criteriaSearch.edit(store, b.actor, "revoked");
  criteriaSearch.submit(store, b.actor);
  expect(() => store.require(b.actor)).toThrow();
  expect(
    required(store.read()).local.notice.read(required(store.read()).actor),
  ).toBeNull();
  stop();
});

it("locale/time-zone session changes discard local intent, unlike page/sort refresh", () => {
  vi.useFakeTimers();
  const { f, store, stop, frame } = setup(),
    a = frame();
  criteriaSearch.edit(store, a.actor, "old locale draft");
  f.external({ type: "query.context", locale: "ar", timeZone: "UTC" });
  criteriaSearch.reconcile(store, a.actor);
  criteriaSearch.arm(store, a.actor);
  expect(a.local.draft.read(a.actor)).toBeNull();
  vi.advanceTimersByTime(1000);
  expect(f.observed).toHaveLength(0);
  stop();
});

it("newer text entered from a genuine onRequest callback survives the original proposal receipt", () => {
  vi.useFakeTimers();
  const { f, store, stop, frame } = setup(),
    a = frame();
  f.app.faults.onRequest = () =>
    criteriaSearch.edit(store, a.actor, "newer in callback");
  criteriaSearch.edit(store, a.actor, "first");
  criteriaSearch.submit(store, a.actor);
  delete f.app.faults.onRequest;
  expect(a.local.draft.read(a.actor)?.text).toBe("newer in callback");
  f.acceptUI();
  criteriaSearch.reconcile(store, a.actor);
  criteriaSearch.arm(store, a.actor);
  expect(a.local.draft.read(a.actor)).toMatchObject({
    text: "newer in callback",
    base: "first",
  });
  stop();
});
