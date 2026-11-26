import assert from "node:assert/strict";
import test from "node:test";
import { createCriteriaPublication } from "../../packages/react/src/controller/criteria-publication.js";
import { createNativeController } from "../../packages/react/src/tanstack/definition.js";
import { context, nativeFor, seedFor } from "./fixtures.js";

test("B04 counterfactual: unconditional mount reset really loses accepted IDs and pending intent (composition defect)", () => {
  const ND = nativeFor();
  const C = createNativeController(ND, { initial: seedFor(), now: () => 0, controlled: ["query", "selection"], onRequest() {} });
  const before = C.getSnapshot();
  const result = C.dispatch({ type: "search.commit", search: "synthetic" });
  assert.equal(result.status, "proposed");
  if (result.status !== "proposed") throw new Error("Expected real receipt");
  const P = createCriteriaPublication({ controller: C, definition: C.getDefinition(), retirement: {
    retire() {
      C.reject(result.proposal);
      const clear = C.dispatch({ type: "selection.cancel" });
      assert.equal(clear.status, "proposed");
      if (clear.status === "proposed") assert.equal(C.accept(clear.proposal).status, "committed");
      return undefined;
    },
  } });
  const begun = P.begin({ controller: C, definition: C.getDefinition(), expected: context, actual: context });
  assert.equal(begun.status, "pending");
  if (begun.status !== "pending") throw new Error("Expected ticket");
  assert.equal(P.complete(begun.ticket).status, "settled");
  assert.equal(Object.keys(C.getSnapshot().selection).length, 0);
  assert.notEqual(C.getSnapshot(), before);
  assert.equal(C.getSnapshot().revision, before.revision + 1);
  assert.throws(() => C.accept(result.proposal), { code: "state.stale" });
});
