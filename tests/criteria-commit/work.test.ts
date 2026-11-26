import { afterEach, expect, it, vi } from "vitest";
import type { CriteriaCommitted } from "../../packages/heroui/src/filters/criteria-commit.js";
import {
  CriteriaCommitError,
  createCriteriaCommitCell,
} from "../../packages/heroui/src/filters/criteria-commit.js";
import type { S } from "./fixtures.js";
import { fixture } from "./fixtures.js";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("constructor/connect/commit allocate no timers; replacement cancels A and only explicit B action rearms", () => {
  vi.useFakeTimers();
  const f = fixture(),
    target = f.commit(),
    cell = createCriteriaCommitCell("search", f.app.C);
  const lease = cell.connect(),
    a = cell.commit(lease, target, f.search());
  expect(vi.getTimerCount()).toBe(0);
  const runA = vi.fn(() => undefined),
    runB = vi.fn((_committed: CriteriaCommitted<"search", S>) => undefined);
  const handle = cell.timeout(a, 50, runA);
  expect(handle.deadline).toBe(Date.now() + 50);
  const b = cell.commit(lease, target, f.search());
  vi.advanceTimersByTime(100);
  expect(runA).not.toHaveBeenCalled();
  expect(runB).not.toHaveBeenCalled();
  cell.timeout(b, 10, runB);
  vi.advanceTimersByTime(10);
  expect(runB).toHaveBeenCalledTimes(1);
  expect(runB.mock.calls[0]?.[0]?.actor).toBe(b);
});

it("late timer/rAF callbacks remain actor-captured even if native cancellation is ineffective", () => {
  const queued: (() => void)[] = [];
  vi.stubGlobal("setTimeout", (run: () => void) => {
    queued.push(run);
    return 1;
  });
  vi.stubGlobal("clearTimeout", () => undefined);
  vi.stubGlobal("requestAnimationFrame", (run: () => void) => {
    queued.push(run);
    return 2;
  });
  vi.stubGlobal("cancelAnimationFrame", () => undefined);
  const f = fixture(),
    target = f.commit(),
    cell = createCriteriaCommitCell("search", f.app.C),
    lease = cell.connect();
  const a = cell.commit(lease, target, f.search()),
    run = vi.fn(() => undefined);
  cell.timeout(a, 1, run);
  cell.animationFrame(a, run);
  cell.commit(lease, target, f.search());
  for (const callback of queued) callback();
  expect(run).not.toHaveBeenCalled();
});

it("actual P retains purge/cancel debt until synchronous cancellation acknowledges", () => {
  let fail = true;
  const queued: (() => void)[] = [];
  vi.stubGlobal("setTimeout", (run: () => void) => {
    queued.push(run);
    return 1;
  });
  vi.stubGlobal("clearTimeout", () => {
    if (fail) throw new Error("Synthetic cancellation failure");
    return undefined;
  });
  const f = fixture(),
    target = f.commit(),
    cell = createCriteriaCommitCell("search", f.app.C),
    lease = cell.connect();
  const text = cell.createLocal("text"),
    a = cell.commit(lease, target, f.search()),
    run = vi.fn(() => undefined);
  text.write(a, "must purge");
  cell.timeout(a, 1, run);
  const begun = f.app.beginReset();
  expect(begun.status).toBe("blocked");
  expect(cell.getSnapshot().actor).toBeNull();
  if (!begun.ticket) throw new Error("Missing debt ticket");
  expect(f.app.completeReset(begun.ticket).status).toBe("blocked");
  fail = false;
  expect(f.app.completeReset(begun.ticket).status).toBe("settled");
  for (const callback of queued) callback();
  expect(run).not.toHaveBeenCalled();
  const b = cell.commit(lease, f.commit(), f.search());
  expect(text.read(b)).toBeNull();
});

it("library scheduler fences before/after action and never retags async work", () => {
  vi.useFakeTimers();
  const f = fixture(),
    target = f.commit(),
    cell = createCriteriaCommitCell("search", f.app.C),
    lease = cell.connect();
  const a = cell.commit(lease, target, f.search()),
    text = cell.createLocal("text");
  let oldDenied = false;
  cell.timeout(a, 1, ({ actor }) => {
    const b = cell.commit(lease, target, f.search());
    try {
      text.write(actor, "old");
    } catch (error) {
      oldDenied = error instanceof CriteriaCommitError;
    }
    text.write(b, "new");
    return undefined;
  });
  vi.advanceTimersByTime(1);
  const b = cell.getSnapshot().actor;
  if (!b) throw new Error("Missing replacement actor");
  expect(oldDenied).toBe(true);
  expect(text.read(b)).toBe("new");
});

it("a failed replacement cancellation hands persistent local debt to the actual P, never publishes B", () => {
  vi.stubGlobal("setTimeout", () => 1);
  vi.stubGlobal("clearTimeout", () => {
    throw new Error("Synthetic owned phase failure");
  });
  const f = fixture(),
    target = f.commit(),
    cell = createCriteriaCommitCell("search", f.app.C),
    lease = cell.connect();
  const a = cell.commit(lease, target, f.search());
  cell.timeout(a, 1, () => undefined);
  expect(() => cell.commit(lease, target, f.search())).toThrow(
    CriteriaCommitError,
  );
  expect(cell.getSnapshot().actor).toBeNull();
  expect(f.app.P.getSnapshot().phase).toBe("blocked");
  expect(() => cell.require(a)).toThrow(CriteriaCommitError);
  expect(() => f.app.C.dispatch({ type: "selection.cancel" })).not.toThrow();
});
