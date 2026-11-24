import assert from "node:assert/strict";
import {
  CriteriaCommitError,
  createCriteriaCommitCell,
} from "../../packages/heroui/src/filters/criteria-commit.js";
import { fixture, required } from "./fixtures.js";

/** FINAL PHASE ONLY: genuine factories in an explicitly private emitted graph.
 * This is not an installed/public/packed package consumer or real UI acceptance. */
export function consumePrivateEmission() {
  const f = fixture(),
    target = f.commit(),
    cell = createCriteriaCommitCell("builder", f.app.C),
    lease = cell.connect();
  assert.equal(cell.getSnapshot().actor, null);
  const draft = cell.createLocal<{ value: number }>("draft"),
    value = { value: 7 };
  const a = cell.commit(lease, target, f.builder({ createRuleId: () => "A" }));
  draft.write(a, value);
  const old = required(cell.require(a).ports.createRuleId);
  const b = cell.commit(lease, target, f.builder({ createRuleId: () => "B" }));
  assert.equal(draft.read(b), value);
  assert.throws(() => old());
  assert.equal(required(cell.require(b).ports.createRuleId)(), "B");
  cell.disconnect(lease);
  assert.throws(() => cell.require(b), CriteriaCommitError);
  assert.deepEqual(f.app.C.getSnapshot().selection, { one: true });
  assert.equal(f.app.P.getSnapshot().phase, "settled");
}
consumePrivateEmission();
