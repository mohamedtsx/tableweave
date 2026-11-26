import {
  createReorderController,
  captureReorderNavigation,
  claimReorderUI,
  getReorderAdmissionOwner,
  joinReorderModel,
  observeReorderUI,
  releaseReorderUI,
  ReorderAdmissionError,
  requireReorderAdmission,
  requireReorderModel,
  requireReorderNavigation,
  revokeReorderInteraction,
  suspendReorderUI,
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
  ReorderModelJoin,
  ReorderNavigationOrigin,
  ReorderUIBinding,
  ReorderUIMetadata,
} from "@tableweave/react/reordering-controller";
import type { QuerySchema } from "@tableweave/react/contracts";
import type { TableDefinition } from "@tableweave/react";

export const helperRuntime = {
  createReorderController,
  captureReorderNavigation,
  claimReorderUI,
  getReorderAdmissionOwner,
  joinReorderModel,
  observeReorderUI,
  releaseReorderUI,
  ReorderAdmissionError,
  requireReorderAdmission,
  requireReorderModel,
  requireReorderNavigation,
  revokeReorderInteraction,
  suspendReorderUI,
};
export type HelperTypes<S extends QuerySchema, T extends object> = readonly [
  ReorderAdmission<S, T>,
  ReorderAdmissionLease<S, T>,
  ReorderAdmissionOwner<S, T>,
  ReorderAdmissionSnapshot,
  ReorderAdvanceReason,
  ReorderApplicationMetadata,
  ReorderControllerOptions<S, T>,
  ReorderControllerResult<S, T>,
  ReorderInteraction<S, T>,
  ReorderModelJoin<S, T>,
  ReorderNavigationOrigin<S, T>,
  ReorderUIBinding<S, T>,
  ReorderUIMetadata,
];
export function actualFactory<S extends QuerySchema, T extends object>(
  definition: TableDefinition<S, T>,
  options: ReorderControllerOptions<S, T>,
): ReorderControllerResult<S, T> {
  return createReorderController(definition, options);
}
export const metadata: ReorderApplicationMetadata = {
  ownerEpoch: 1,
  sourceVersion: 0,
  revision: "synthetic-0",
  baseRevision: "0",
};
