import type { SortFnDef } from "../../packages/react/node_modules/@tanstack/react-table/dist/index.js";
import { defineQuerySchema } from "../../packages/react/src/contracts/schema.js";
import type {
  CriteriaCommittedFrame,
  CriteriaFrameInput,
  CriteriaFrameOwner,
  CriteriaFrames,
  CriteriaFramesOptions,
  CriteriaFrameTicket,
  CriteriaToolAuthority,
} from "../../packages/react/src/presentation/criteria-frame.js";
import {
  createCriteriaFrames,
  requireCriteriaTool,
} from "../../packages/react/src/presentation/criteria-frame.js";
import type { ControlsAuthorityOptions } from "../../packages/react/src/presentation/types.js";
import { createTableSortFn } from "../../packages/react/src/tanstack/sort.js";
import type { NativeFeatures } from "../../packages/react/src/tanstack/types.js";
export const schema = defineQuerySchema({
  id: "frame-types",
  version: 1,
  fields: { amount: { type: "number", owner: "builder" } },
});
export const other = defineQuerySchema({
  id: "other-frame",
  version: 1,
  fields: { title: { type: "text", owner: "search" } },
});
type S = typeof schema;
type Other = typeof other;
interface Row {
  id: string;
  amount: number;
}
interface Different {
  id: string;
  title: string;
}
declare const frames: CriteriaFrames<S, Row>,
  ticket: CriteriaFrameTicket<S, Row>,
  frame: CriteriaCommittedFrame<S, Row>,
  tool: CriteriaToolAuthority<S>,
  owner: CriteriaFrameOwner<S>;
declare const wrongTicket: CriteriaFrameTicket<Other, Row>,
  wrongRow: CriteriaFrameTicket<S, Different>,
  wrongFrame: CriteriaCommittedFrame<Other, Row>,
  wrongOwner: CriteriaFrameOwner<Other>;
declare const input: CriteriaFrameInput<S, Row>,
  options: CriteriaFramesOptions<S, Row>;
export const created = createCriteriaFrames(options);
export const prepared = frames.prepare(input),
  committed = frames.commit(ticket),
  pair = frames.issue(frame),
  origin = requireCriteriaTool(tool, owner);
// @ts-expect-error F1-N01 exact schema ticket invariance
frames.commit(wrongTicket);
// @ts-expect-error F1-N02 exact record ticket invariance
frames.commit(wrongRow);
// @ts-expect-error F1-N03 committed frames cannot cross schemas
frames.issue(wrongFrame);
// @ts-expect-error F1-N04 NoInfer owner rejects schema widening
requireCriteriaTool(tool, wrongOwner);
// @ts-expect-error F1-N05 structural owner is not a branded frame owner
export const forgedOwner: CriteriaFrameOwner<S> = {
  controller: owner.controller,
  definition: owner.definition,
  publication: owner.publication,
};
// @ts-expect-error F1-N06 an uncommitted ticket is not a committed frame
frames.issue(ticket);
const unbound = frames.commit;
// @ts-expect-error F1-N07 method requires genuine typed receiver
unbound(ticket);
// @ts-expect-error F1-N08 readonly immutable publisher ref
frames.publication = wrongOwner.publication;
// @ts-expect-error F1-N09 readonly exact genuine view
frame.view = committed.view;
declare const controls: ControlsAuthorityOptions<S, Row>;
export const validGate: ControlsAuthorityOptions<S, Row> = {
  ...controls,
  checkCurrent: () => undefined,
};
export const invalidGate: ControlsAuthorityOptions<S, Row> = {
  ...controls,
  // @ts-expect-error F1-N10 nonvoid gate result is not an allowing boolean
  checkCurrent: () => true,
};
export const sorted = createTableSortFn<Row>({
  sort(_a, _b, rowA, rowB, columnId) {
    const amount: number = rowA.original.amount;
    const same: Row = rowB.original;
    const id: string = columnId;
    return amount - same.amount + id.length;
  },
});
const readonlyDefinition: Readonly<SortFnDef<NativeFeatures, Row>> = {
  sort: () => 0,
};
export const readonlySorted = createTableSortFn<Row>(readonlyDefinition);
// @ts-expect-error F1-N11 explicit comparator is required
createTableSortFn<Row>({});
export const badComparator = createTableSortFn<Row>({
  // @ts-expect-error F1-N12 comparator must return the real numeric vendor result
  sort: () => "no",
});
declare const differentDefinition: SortFnDef<NativeFeatures, Different>;
// @ts-expect-error F1-N13 actual native row contexts cannot cross record types
createTableSortFn<Row>(differentDefinition);
// @ts-expect-error F1-N14 readonly callback configuration stays readonly
readonlyDefinition.sort = () => 0;
export const badResolver = createTableSortFn<Row>({
  sort: () => 0,
  // @ts-expect-error F1-N15 resolver metadata is a callback, not a permissive value
  resolveDataValue: 1,
});
