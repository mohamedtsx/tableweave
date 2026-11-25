import type { DataTableModel, TableDefinition } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import type { RowMovePlacement } from "@tableweave/react/reordering";
import {
  captureReorderNavigation,
  claimReorderUI,
  createReorderController,
  getReorderAdmissionOwner,
  joinReorderModel,
  observeReorderUI,
  releaseReorderUI,
  ReorderAdmissionError,
  type ReorderAdmission,
  type ReorderAdmissionLease,
  type ReorderAdmissionOwner,
  type ReorderAdmissionSnapshot,
  type ReorderAdvanceReason,
  type ReorderApplicationMetadata,
  type ReorderControllerOptions,
  type ReorderControllerResult,
  type ReorderInteraction,
  type ReorderModelJoin,
  type ReorderNavigationOrigin,
  type ReorderUIBinding,
  type ReorderUIMetadata,
  requireReorderAdmission,
  requireReorderModel,
  requireReorderNavigation,
  suspendReorderUI,
} from "@tableweave/react/reordering-controller";

// Compile-only source discovery. No function here is executed by the LIGHT lane.
export function clientSurface<S extends QuerySchema, T extends object>(
  definition: TableDefinition<S, T>,
  options: ReorderControllerOptions<NoInfer<S>, NoInfer<T>>,
  model: DataTableModel<NoInfer<S>, NoInfer<T>>,
  actor: object,
  placement: RowMovePlacement,
) {
  const result: ReorderControllerResult<S, T> = createReorderController(
    definition,
    options,
  );
  const admission: ReorderAdmission<S, T> = result.admission;
  const lease: ReorderAdmissionLease<S, T> = admission.mount();
  admission.commitModel(lease, model);
  const binding: ReorderUIBinding<S, T> = claimReorderUI(
    definition,
    admission,
    lease,
    actor,
  );
  const join: ReorderModelJoin<S, T> = joinReorderModel(binding, model, actor);
  const navigation: ReorderNavigationOrigin<S, T> =
    captureReorderNavigation(join);
  const metadata: ReorderUIMetadata = observeReorderUI(binding);
  const owner: ReorderAdmissionOwner<S, T> | null =
    getReorderAdmissionOwner(admission);
  requireReorderAdmission(admission, definition, result.controller);
  requireReorderModel(join, model);
  requireReorderNavigation(navigation, join, model);
  const interaction: ReorderInteraction<S, T> = admission.capture(lease);
  const begun = admission.begin(interaction, placement);
  const snapshot: ReorderAdmissionSnapshot = admission.getSnapshot();
  suspendReorderUI(binding);
  releaseReorderUI(binding);
  return { result, metadata, owner, begun, snapshot };
}

export function applicationMetadata(value: ReorderApplicationMetadata) {
  return value;
}
export function explicitAdvance<S extends QuerySchema, T extends object>(
  admission: ReorderAdmission<S, T>,
  reason: ReorderAdvanceReason,
) {
  admission.advance(reason);
}
export { ReorderAdmissionError };
