import type {
  CriteriaAuthority,
  CriteriaToolAuthority,
} from "@tableweave/react";
import { defineQuerySchema } from "@tableweave/react/contracts";
import type {
  CriteriaActor,
  CriteriaCommitSnapshot,
  CriteriaMountLease,
  CriteriaPortsByKind,
  CriteriaToolTarget,
} from "../../packages/heroui/src/filters/criteria-commit.js";
import { createCriteriaCommitCell } from "../../packages/heroui/src/filters/criteria-commit.js";
import type { fixture, S } from "./fixtures.js";

export const otherSchema = defineQuerySchema({
  id: "other",
  version: 1,
  fields: { only: { type: "boolean", owner: "builder" } },
});
export type Other = typeof otherSchema;
type Assert<Condition extends true> = Condition;
type NotAssignable<Left, Right> = [Left] extends [Right] ? false : true;
export type TypeContracts = [
  Assert<NotAssignable<CriteriaActor<"search", S>, CriteriaActor<"date", S>>>,
  Assert<
    NotAssignable<CriteriaActor<"search", S>, CriteriaActor<"search", Other>>
  >,
  Assert<
    NotAssignable<
      CriteriaMountLease<"search", S>,
      CriteriaMountLease<"builder", S>
    >
  >,
  Assert<NotAssignable<CriteriaToolAuthority<S>, CriteriaAuthority<S>>>,
  Assert<NotAssignable<CriteriaAuthority<S>, CriteriaToolAuthority<S>>>,
  Assert<
    "ports" extends keyof CriteriaCommitSnapshot<"builder", S> ? false : true
  >,
  Assert<
    "origin" extends keyof CriteriaCommitSnapshot<"builder", S> ? false : true
  >,
  Assert<
    NotAssignable<"only", keyof CriteriaPortsByKind<S>["builder"]["fields"]>
  >,
];

/** Positive source-level API use only; not executed by the light compile. */
export function positive(
  f: ReturnType<typeof fixture>,
  target: CriteriaToolTarget<S>,
) {
  const cell = createCriteriaCommitCell("builder", f.app.C);
  const lease = cell.connect(),
    actor = cell.commit(lease, target, f.builder());
  const draft = cell.createLocal<{ field: "amount"; value: number }>("draft");
  const text = cell.createLocal("text"),
    ime = cell.createLocal("ime");
  draft.write(actor, { field: "amount", value: 1 });
  text.write(actor, "raw");
  ime.write(actor, false);
  const captured = cell.require(actor);
  const field = captured.ports.fields.amount;
  const schema: S = captured.origin.definition.schema;
  const work = cell.timeout(actor, 5, (exact) => {
    cell.require(exact.actor);
    return undefined;
  });
  cell.cancelWork(actor, work);
  cell.disconnect(lease);
  return { schema, field };
}
