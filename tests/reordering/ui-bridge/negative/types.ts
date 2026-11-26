import type { QuerySchema } from "../../../../packages/react/src/contracts/types.js";
import type {
  DataTableModel,
  TableDefinition,
} from "../../../../packages/react/src/table/types.js";
import {
  claimReorderUI,
  joinReorderModel,
  observeReorderUI,
  requireReorderModel,
  requireReorderNavigation,
  type ReorderAdmissionLease,
  type ReorderModelJoin,
  type ReorderNavigationOrigin,
  type ReorderUIBinding,
} from "../../../../packages/react/src/reordering-controller/index.js";
import type { Fixture } from "../../admission/fixtures.js";
declare const f: Fixture;
declare const foreignLease: ReorderAdmissionLease<
  QuerySchema,
  { wrong: number }
>;
declare const foreignModel: DataTableModel<QuerySchema, { wrong: number }>;
declare const foreignDefinition: TableDefinition<
  QuerySchema,
  { wrong: number }
>;
declare const binding: ReorderUIBinding<
  Fixture["schema"],
  { id: string; amount: number }
>;
declare const join: ReorderModelJoin<
  Fixture["schema"],
  { id: string; amount: number }
>;
declare const origin: ReorderNavigationOrigin<
  Fixture["schema"],
  { id: string; amount: number }
>;
claimReorderUI(f.D, f.admission, foreignLease, {});
claimReorderUI(foreignDefinition, f.admission, f.admission.mount(), {});
joinReorderModel(binding, foreignModel, {});
requireReorderModel(join, foreignModel);
requireReorderNavigation(origin, {}, foreignModel);
observeReorderUI(binding).pending = false;
