// Authored only. Excluded from every allowed positive program; do not execute
// negative/dual validation before the user's final phase.
import type { NativeRow } from "@tableweave/react";
import { defineQuerySchema } from "@tableweave/react/contracts";
import {
  issueNativeRow,
  issueNativeRowHandle,
  issueNativeScope,
  nativeRowRef,
} from "../../../packages/heroui/src/table/native-resource-lifetime.js";
import type { TableRendererTarget } from "../../../packages/heroui/src/table/types.js";

const schema = defineQuerySchema({
  id: "native-lifetime-negative",
  version: 1,
  fields: { amount: { type: "number", owner: "none" } },
});
declare const target: TableRendererTarget<typeof schema, { amount: number }>;
declare const foreignRow: NativeRow<{ title: string }>;
declare const ownRow: NativeRow<{ amount: number }>;
const scope = issueNativeScope(target);
// @ts-expect-error Ticket kind is not a row ref.
nativeRowRef(scope);
// @ts-expect-error Actual target alone anchors T; foreign row cannot widen it.
issueNativeRow(target, foreignRow);
// @ts-expect-error Arbitrary cleanup objects are not genuine column inputs.
issueNativeScope(target, { dispose() {} });
// @ts-expect-error No resource/disposer injection API exists.
issueNativeScope(target, undefined, () => {});
// @ts-expect-error A scope is not a row-handle parent and a row is not a cell.
issueNativeRowHandle(target, scope, ownRow);
