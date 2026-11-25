import {
  createReorderController,
  getReorderAdmissionOwner,
  requireReorderAdmission,
  ReorderAdmissionError,
  claimReorderUI,
  joinReorderModel,
  requireReorderModel,
  suspendReorderUI,
  releaseReorderUI,
  observeReorderUI,
  captureReorderNavigation,
  requireReorderNavigation,
  revokeReorderInteraction,
} from "@tableweave/react/reordering-controller";
import type {
  ReorderAdmission,
  ReorderAdmissionLease,
  ReorderAdmissionOwner,
  ReorderAdmissionSnapshot,
  ReorderAdvanceReason,
  ReorderApplicationMetadata,
  ReorderControllerOptions,
  ReorderControllerResult,
  ReorderInteraction,
  ReorderUIBinding,
  ReorderModelJoin,
  ReorderNavigationOrigin,
  ReorderUIMetadata,
} from "@tableweave/react/reordering-controller";
import type { Item, S } from "../admission/fixtures.js";

export const runtimeSource = {
  createReorderController,
  getReorderAdmissionOwner,
  requireReorderAdmission,
  ReorderAdmissionError,
  claimReorderUI,
  joinReorderModel,
  requireReorderModel,
  suspendReorderUI,
  releaseReorderUI,
  observeReorderUI,
  captureReorderNavigation,
  requireReorderNavigation,
  revokeReorderInteraction,
} satisfies Record<
  keyof typeof import("@tableweave/react/reordering-controller"),
  unknown
>;
export type ActualTypes = readonly [
  ReorderAdmission<S, Item>,
  ReorderAdmissionLease<S, Item>,
  ReorderAdmissionOwner<S, Item>,
  ReorderAdmissionSnapshot,
  ReorderAdvanceReason,
  ReorderApplicationMetadata,
  ReorderControllerOptions<S, Item>,
  ReorderControllerResult<S, Item>,
  ReorderInteraction<S, Item>,
  ReorderUIBinding<S, Item>,
  ReorderModelJoin<S, Item>,
  ReorderNavigationOrigin<S, Item>,
  ReorderUIMetadata,
];
export function releaseUnknown(value: unknown): undefined {
  const release: (interaction: unknown) => undefined = revokeReorderInteraction;
  return release(value);
}
