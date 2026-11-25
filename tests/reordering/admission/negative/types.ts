import type { QuerySchema } from "../../../../packages/react/src/contracts/types.js";
import type {
  DataTableModel,
  TableDefinition,
} from "../../../../packages/react/src/table/types.js";
import {
  createReorderController,
  type ReorderControllerOptions,
  type ReorderInteraction,
} from "../../../../packages/react/src/reordering-controller/index.js";
import type { Fixture, S, Item } from "../fixtures.js";

declare const f: Fixture;
declare const wrong: DataTableModel<QuerySchema, { wrong: number }>;
declare const lease: ReturnType<Fixture["admission"]["mount"]>;
declare const foreign: ReorderInteraction<QuerySchema, { wrong: number }>;
declare const D: TableDefinition<S, Item>;
declare const options: ReorderControllerOptions<QuerySchema, { wrong: number }>;
f.admission.commitModel(lease, wrong);
f.admission.begin(foreign, { movedId: "one", beforeId: null, afterId: null });
createReorderController(D, options);
createReorderController(D, {
  controller: f.settings.controller,
  instanceId: "wrong-port",
  readCurrent: async () => f.metadata(),
});
