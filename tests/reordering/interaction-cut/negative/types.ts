import type { QuerySchema } from "../../../../packages/react/src/contracts/types.js";
import {
  revokeReorderInteraction,
  type ReorderInteraction,
} from "@tableweave/react/reordering-controller";
import type { Fixture, Item, S } from "../../admission/fixtures.js";
declare const f: Fixture;
declare const wrongS: ReorderInteraction<QuerySchema, Item>;
declare const wrongT: ReorderInteraction<S, { unrelated: true }>;
f.admission.begin(wrongS, { movedId: "one", beforeId: null, afterId: null });
f.admission.begin(wrongT, { movedId: "one", beforeId: null, afterId: null });
f.admission.getSnapshot().interaction = true;
const notBoolean: boolean = revokeReorderInteraction(wrongS);
export { notBoolean };
