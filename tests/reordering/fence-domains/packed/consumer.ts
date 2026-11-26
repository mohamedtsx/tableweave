// Ordinary installed consumer only: never source aliases or the own positive lane.
import {
  createReorderController,
  claimReorderUI,
  observeReorderUI,
  releaseReorderUI,
} from "@tableweave/react/reordering-controller";
import { defineTable } from "@tableweave/react";
import { defineQuerySchema, createQuery } from "@tableweave/react/contracts";
const schema = defineQuerySchema({
  id: "b2-packed",
  version: 1,
  fields: { amount: { type: "number", owner: "builder" } },
});
const D = defineTable<{ id: string; amount: number }>()({
  schema,
  getRowId: (row) => row.id,
  columns: [{ id: "amount", accessorKey: "amount" }],
});
const actual = createReorderController(D, {
  instanceId: "b2",
  controller: {
    initial: {
      query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
    },
    now: () => 0,
  },
  readCurrent() {
    return { ownerEpoch: 0, sourceVersion: 0, revision: 0, baseRevision: "0" };
  },
});
const lease = actual.admission.mount(),
  ui = claimReorderUI(D, actual.admission, lease, {});
observeReorderUI(ui);
releaseReorderUI(ui);
actual.admission.dispose();
actual.controller.dispose();
