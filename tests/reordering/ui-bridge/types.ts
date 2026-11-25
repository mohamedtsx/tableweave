import type { DataTableModel } from "../../../packages/react/src/table/types.js";
import {
  captureReorderNavigation,
  claimReorderUI,
  joinReorderModel,
  observeReorderUI,
  requireReorderModel,
  requireReorderNavigation,
  type ReorderAdmissionLease,
  type ReorderModelJoin,
  type ReorderNavigationOrigin,
  type ReorderUIBinding,
  type ReorderUIMetadata,
} from "../../../packages/react/src/reordering-controller/index.js";
import type { Fixture, Item, S } from "../admission/fixtures.js";

export function actualTypes(
  f: Fixture,
  lease: ReorderAdmissionLease<S, Item>,
  model: DataTableModel<S, Item>,
  actor: object,
) {
  const binding: ReorderUIBinding<S, Item> = claimReorderUI(
    f.D,
    f.admission,
    lease,
    {},
  );
  const join: ReorderModelJoin<S, Item> = joinReorderModel(
    binding,
    model,
    actor,
  );
  const origin: ReorderNavigationOrigin<S, Item> =
    captureReorderNavigation(join);
  const metadata: ReorderUIMetadata = observeReorderUI(binding);
  requireReorderModel(join, model);
  requireReorderNavigation(origin, join, model);
  return metadata;
}
