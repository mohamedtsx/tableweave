import { expect, test } from "vitest";
import { requireCriteriaTool } from "../../packages/react/src/presentation/criteria-frame.js";
import { type CallbackName, fixture, records } from "./fixtures.js";

for (const callback of [
  "rowId",
  "eligible",
  "validate",
  "normalize",
  "evaluate",
  "accessor",
  "matcher",
  "vendor",
  "sorting",
] as const)
  test(`real ${callback} revocation fences the next library callback and frame exposure`, () => {
    const filter = ["validate", "normalize", "evaluate", "accessor"].includes(
      callback,
    )
      ? "custom"
      : callback === "matcher"
        ? "search"
        : "none";
    const f = fixture(true, "multiple", filter);
    f.settle();
    if (callback === "vendor" || callback === "sorting")
      f.accept({
        type: "sorting.change",
        update: [{ id: "amount", desc: false }],
      });
    let once = false;
    f.callbacks[callback] = () => {
      if (once) return;
      once = true;
      f.app.beginReset();
    };
    f.reset();
    expect(() => f.frames.prepare(f.input())).toThrow(
      expect.objectContaining({ code: "criteria.frame.unavailable" }),
    );
    expect(once).toBe(true);
    expect(f.counts[callback]).toBe(1);
    expect(f.frames.getSnapshot().phase).toBe("empty");
    if (callback === "normalize") expect(f.counts.evaluate).toBe(0);
    if (callback === "accessor") expect(f.counts.evaluate).toBe(0);
  });
test("swallowed normalizer/registry failures do not permit a later private callback", () => {
  const f = fixture(true, "multiple", "custom");
  f.settle();
  f.callbacks.validate = () => {
    f.app.beginReset();
    throw new Error("Synthetic private validator error must not escape");
  };
  f.reset();
  expect(() => f.frames.prepare(f.input())).toThrow(
    "Criteria frame is unavailable.",
  );
  expect(f.counts.validate).toBe(1);
  expect(f.counts.normalize).toBe(0);
  expect(f.counts.evaluate).toBe(0);
});
for (const operation of [
  "prepare",
  "commit",
  "issue",
  "disconnect",
  "close",
] as const)
  test(`nested same-owner ${operation} invalidates outer prepare even when app catches denial`, () => {
    const f = fixture();
    f.settle();
    let fired = false;
    f.callbacks.rowId = () => {
      if (fired) return;
      fired = true;
      try {
        if (operation === "prepare") f.frames.prepare(f.input());
        if (operation === "commit")
          Reflect.apply(f.frames.commit, f.frames, [{}]);
        if (operation === "issue")
          Reflect.apply(f.frames.issue, f.frames, [{}]);
        if (operation === "disconnect")
          Reflect.apply(f.frames.disconnect, f.frames, [{}]);
        if (operation === "close") f.frames.close();
      } catch {
        /* App catch cannot restore the invalidated operation. */
      }
    };
    expect(() => f.frames.prepare(f.input())).toThrow(
      expect.objectContaining({ code: "criteria.frame.unavailable" }),
    );
    expect(f.counts.rowId).toBe(1);
    expect(f.frames.getSnapshot().phase).toBe("empty");
  });
test("source descriptor and alias reflection reentry deny before native record work", () => {
  const f = fixture();
  f.settle();
  const raw = f.input();
  let reads = 0;
  const source = new Proxy(raw.source, {
    getOwnPropertyDescriptor(target, key) {
      if (key === "records") {
        reads++;
        f.app.beginReset();
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
  });
  f.reset();
  expect(() => f.frames.prepare({ ...raw, source })).toThrow(
    expect.objectContaining({ code: "criteria.frame.unavailable" }),
  );
  expect(reads).toBe(1);
  expect(f.counts.rowId).toBe(0);
});
test("record callbacks preserve source scope/access checks without borrowing query freshness", () => {
  const f = fixture(false);
  f.settle();
  const frame = f.commit(),
    pair = f.frames.issue(frame);
  f.context.access = false;
  f.reset();
  expect(() => requireCriteriaTool(pair.tool, f.frames)).toThrow();
  expect(() => pair.controls.read()).toThrow(
    expect.objectContaining({ code: "controls.unavailable" }),
  );
  expect(Object.values(f.counts).every((count) => count === 0)).toBe(true);
});
test("actual resource loss and unbound raw generation deny before controls projection callbacks", () => {
  const f = fixture(false);
  f.settle();
  f.startRemote();
  const frame = f.commit("server-complete"),
    pair = f.frames.issue(frame);
  f.resource.setContext({ ...f.context, access: false });
  f.reset();
  expect(() => requireCriteriaTool(pair.tool, f.frames)).toThrow();
  expect(() => pair.controls.read()).toThrow();
  expect(f.counts.rowId).toBe(0);
});
test("actual native commit subscriber reentry cannot mint a paired cell; vendor publication is not rolled back", () => {
  const f = fixture();
  f.settle();
  const first = f.commit(),
    pair = f.frames.issue(first);
  let fired = 0;
  const stop = first.view.native.store.subscribe(() => {
    fired++;
    try {
      f.frames.close();
    } catch {
      /* refused nested owner mutation */
    }
  });
  f.accept({ type: "sorting.change", update: [{ id: "amount", desc: true }] });
  const ticket = f.frames.prepare(f.input());
  expect(() => f.frames.commit(ticket)).toThrow(
    expect.objectContaining({ code: "criteria.frame.unavailable" }),
  );
  stop.unsubscribe();
  expect(fired).toBeGreaterThan(0);
  expect(f.frames.getSnapshot().phase).toBe("empty");
  expect(() => requireCriteriaTool(pair.tool, f.frames)).toThrow();
});
test("metadata notification reentry refuses an interrupted commit, without disposing application owners", () => {
  const f = fixture();
  f.settle();
  const ticket = f.frames.prepare(f.input());
  let committedNotifications = 0;
  f.frames.subscribe({
    notify() {
      if (f.frames.getSnapshot().phase === "committed") {
        committedNotifications++;
        try {
          Reflect.apply(f.frames.issue, f.frames, [{}]);
        } catch {
          /* no manufactured pair */
        }
      }
      return undefined;
    },
  });
  expect(() => f.frames.commit(ticket)).toThrow();
  expect(committedNotifications).toBe(1);
  expect(f.frames.getSnapshot().phase).toBe("empty");
  expect(f.app.C.isDisposed()).toBe(false);
  expect(f.app.P.getSnapshot().phase).toBe("settled");
});
for (const callback of ["rowId", "normalize", "eligible"] as CallbackName[])
  test(`paired controls fence ${callback} callback reentry without a replacement authority wrapper`, () => {
    const f = fixture(
      true,
      "multiple",
      callback === "normalize" ? "custom" : "none",
    );
    f.settle();
    const frame = f.commit(),
      pair = f.frames.issue(frame);
    let fired = false;
    f.callbacks[callback] = () => {
      if (fired) return;
      fired = true;
      f.app.beginReset();
    };
    f.reset();
    expect(() => pair.controls.read()).toThrow(
      expect.objectContaining({ code: "controls.unavailable" }),
    );
    expect(fired).toBe(true);
    expect(f.counts[callback]).toBe(1);
  });
test("prepared gate remains usable until real commit and does not expire at prepare return", () => {
  const f = fixture(false);
  f.settle();
  const ticket = f.frames.prepare(f.input("client", records.slice(0, 4)));
  expect(f.frames.getSnapshot().phase).toBe("empty");
  const frame = f.frames.commit(ticket),
    pair = f.frames.issue(frame);
  expect(requireCriteriaTool(pair.tool, f.frames).controller).toBe(f.app.C);
  expect(pair.controls.read().rows).toHaveLength(4);
});
