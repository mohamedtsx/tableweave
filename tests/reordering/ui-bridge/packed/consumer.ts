// Final clean installed consumer only. Not part of positive source compilation.
import { defineTable } from "@tableweave/react";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import {
  createReorderController,
  claimReorderUI,
  observeReorderUI,
  releaseReorderUI,
} from "@tableweave/react/reordering-controller";
const schema = defineQuerySchema({
  id: "bridge-packed",
  version: 1,
  fields: {
    amount: { type: "number", owner: "builder" },
  },
});
const D = defineTable<{ id: string; amount: number }>()({
  schema,
  getRowId: (row) => row.id,
  columns: [{ id: "amount", accessorKey: "amount" }],
});
const setup = createReorderController(D, {
  instanceId: "synthetic-packed",
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
const lease = setup.admission.mount();
const binding = claimReorderUI(D, setup.admission, lease, {});
observeReorderUI(binding);
releaseReorderUI(binding);
setup.admission.dispose();
setup.controller.dispose();
