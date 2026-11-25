import type { QuerySchema } from "../../../../packages/react/src/contracts/types.js";
import {
  claimReorderUI,
  joinReorderModel,
  requireReorderNavigation,
  observeReorderUI,
  type ReorderAdmissionLease,
  type ReorderNavigationOrigin,
} from "../../../../packages/react/src/reordering-controller/index.js";
import type { Fixture } from "../../admission/fixtures.js";
declare const f: Fixture;
declare const lease: ReorderAdmissionLease<QuerySchema, { foreign: true }>;
declare const origin: ReorderNavigationOrigin<QuerySchema, { foreign: true }>;
const binding = claimReorderUI(f.D, f.admission, lease, {});
joinReorderModel(binding, {}, {});
requireReorderNavigation(origin, {}, {});
observeReorderUI(binding).version = {};
