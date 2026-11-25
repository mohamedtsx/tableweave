// Final-phase clean packed consumer only: intentionally no workspace aliases.
import { defineTable } from "@tableweave/react";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import { createReorderController } from "@tableweave/react/reordering-controller";

interface Item {
  readonly id: string;
  readonly amount: number;
}
const schema = defineQuerySchema({
  id: "packed-admission",
  version: 1,
  fields: { amount: { type: "number", owner: "builder" } },
});
const D = defineTable<Item>()({
  schema,
  selection: "multiple",
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
setup.controller.dispatch({ type: "selection.cancel" });
setup.admission.dispose();
setup.controller.dispose();
