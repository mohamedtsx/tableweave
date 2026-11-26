import type { DataTableModel } from "../../../packages/react/src/table/types.js";
import {
  getReorderAdmissionOwner,
  requireReorderAdmission,
  type ReorderAdmissionLease,
  type ReorderInteraction,
} from "../../../packages/react/src/reordering-controller/index.js";
import type { RowMoveOperation } from "../../../packages/react/src/reordering/types.js";
import type { Fixture, Item, S } from "./fixtures.js";

export function actualTypes(f: Fixture, model: DataTableModel<S, Item>) {
  const owner = getReorderAdmissionOwner(f.admission);
  requireReorderAdmission(f.admission, f.D, f.C);
  const lease: ReorderAdmissionLease<S, Item> = f.admission.mount();
  f.admission.commitModel(lease, model);
  const origin: ReorderInteraction<S, Item> = f.admission.capture(lease);
  const result = f.admission.begin(origin, {
    movedId: "one",
    beforeId: "three",
    afterId: "two",
  });
  if (result.status === "started") {
    const operation: RowMoveOperation = result.operation;
    f.admission.settle(operation, {
      kind: "indeterminate",
      code: "cancel-requested",
    });
  }
  return owner;
}
