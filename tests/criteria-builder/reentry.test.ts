import { expect, it } from "vitest";
import { builderActions, builderEditor, editorActions, readBuilderEditor } from "../../packages/heroui/src/filters/criteria-builder-host.js";
import { fixture, required } from "./fixtures.js";
import { defaultOperatorRegistry } from "@tableweave/react/filters";

it("custom value descriptor reentry stops before the next private descriptor and cannot overwrite the reentrant draft", () => {
  const f = fixture(), stop = f.store.mount(); f.commit();
  const handle = f.open("n1");
  let reads = 0;
  const value = new Proxy({ first: "outer", last: "never read" }, { getOwnPropertyDescriptor(target, key) {
    reads++;
    if (key === "first") editorActions.change(handle, "inner");
    return Reflect.getOwnPropertyDescriptor(target, key);
  } });
  expect(() => editorActions.change(handle, value)).toThrow();
  expect(reads).toBe(1);
  expect(readBuilderEditor(handle).draft?.value).toBe("inner");
  stop();
});
it("allocated IDs are library-owned per-domain state; rejected/duplicate factories cannot invent a new rule", () => {
  const f = fixture(), stop = f.store.mount(), actor = f.commit({ createRuleId: () => "n1" });
  let frame = required(f.store.read());
  builderActions.open(f.store, actor, "filters", "field", required(frame.local.receipt.read(actor)).token);
  expect(frame.local.draft.read(actor)).toBeNull();
  const b = f.commit({ createRuleId: () => "new-rule" });
  frame = required(f.store.read());
  builderActions.open(f.store, b, "filters", "field", required(frame.local.receipt.read(b)).token);
  expect(readBuilderEditor(builderEditor(f.store, b)).draft).toMatchObject({ id: "new-rule", baseline: null });
  editorActions.cancel(builderEditor(f.store, b));
  builderActions.open(f.store, b, "filters", "field", required(frame.local.receipt.read(b)).token);
  expect(frame.local.draft.read(b)).toBeNull();
  expect(f.observed).toHaveLength(0);
  stop();
});
it("application registry get reentry stops before a next private callback or dispatch", () => {
  const f = fixture(), stop = f.store.mount();
  let calls = 0, reenter: (() => void) | null = null;
  f.commit({ registry: { ...defaultOperatorRegistry, get(id) {
    calls++;
    reenter?.();
    return defaultOperatorRegistry.get(id);
  } } });
  const handle = f.open("n1");
  editorActions.number(handle, 0, "12");
  calls = 0;
  reenter = () => editorActions.change(handle, "synthetic-inner-value");
  expect(() => editorActions.apply(handle)).toThrow();
  expect(calls).toBe(1);
  expect(f.observed).toHaveLength(0);
  expect(readBuilderEditor(handle).draft?.value).toBe("synthetic-inner-value");
  stop();
});
