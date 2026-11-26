import { expect, it } from "vitest";
import { fixture, required } from "./fixtures.js";
import { createCriteriaBuilderStore } from "../../packages/heroui/src/filters/criteria-builder-host.js";
import { captureCriteriaCandidate } from "../../packages/heroui/src/toolbar/criteria-tool-host.js";

it("present undefined/accessor/inherited criteria never reaches private props or falls back to legacy", () => {
  for (const candidate of [{ criteria: undefined }, Object.defineProperty({}, "criteria", { get() { throw new Error("unread"); } }), Object.create({ criteria: undefined })]) {
    const f = fixture(), stop = f.store.mount();
    let reads = 0;
    const input = new Proxy(candidate, { getOwnPropertyDescriptor(target, key) { if (key !== "criteria") reads++; return Reflect.getOwnPropertyDescriptor(target, key); } });
    f.store.commit(input);
    expect(reads).toBe(0);
    expect(f.store.read()).toBeNull();
    expect(f.store.mode()).not.toBe("legacy");
    stop();
  }
});
it("structural target copies work only with exact contained authorities; invalid B purges rather than downgrades", () => {
  const f = fixture(), stop = f.store.mount();
  f.store.commit(f.props({ criteria: { ...f.target } }));
  const frame = required(f.store.read());
  frame.local.search.write(frame.actor, "old-library-term");
  let privateReads = 0;
  f.store.commit(new Proxy({ criteria: { ...f.target, authority: { ...f.target.authority } } }, { getOwnPropertyDescriptor(target, key) { if (key !== "criteria") privateReads++; return Reflect.getOwnPropertyDescriptor(target, key); } }));
  expect(privateReads).toBe(0);
  expect(f.store.read()).toBeNull();
  f.store.commit(f.props());
  const b = required(f.store.read());
  expect(b.local.search.read(b.actor)).toBeNull();
  const raw = f.props();
  Reflect.deleteProperty(raw, "criteria");
  f.store.commit(raw);
  expect(f.store.mode()).toBe("adopted");
  expect(f.store.read()).toBeNull();
  stop();
});
it("render metadata capture alone cannot traverse fields or change committed state", () => {
  const f = fixture(), stop = f.store.mount();
  f.commit();
  const before = required(f.store.read());
  let reads = 0;
  const candidate = new Proxy(f.props(), { getOwnPropertyDescriptor(target, key) { if (key !== "criteria") reads++; return Reflect.getOwnPropertyDescriptor(target, key); } });
  expect(captureCriteriaCandidate(candidate).kind).toBe("target");
  expect(reads).toBe(0);
  const other = createCriteriaBuilderStore<typeof f.schema>();
  expect(other.read()).toBeNull();
  expect(f.store.read()?.actor).toBe(before.actor);
  stop();
});
it("configuration reflection reentry invalidates A before a next private field capture", () => {
  const f = fixture(), stop = f.store.mount(); f.commit();
  const a = required(f.store.read()).actor;
  let privateReads = 0, entered = false;
  const candidate = new Proxy(f.props(), { getOwnPropertyDescriptor(target, key) {
    if (key === "className" && !entered) { entered = true; f.store.commit(f.props()); }
    if (key === "fields" || key === "messages" || key === "registry") privateReads++;
    return Reflect.getOwnPropertyDescriptor(target, key);
  } });
  f.store.commit(candidate);
  expect(entered).toBe(true);
  expect(privateReads).toBe(0);
  expect(() => f.store.require(a)).toThrow();
  stop();
});
