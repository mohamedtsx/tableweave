import { defineTable } from "../../../packages/react/src/table/definition.js";
import { defineQuerySchema } from "../../../packages/react/src/contracts/schema.js";
import { createQuery } from "../../../packages/react/src/contracts/query.js";
import { createCriteriaPublication } from "../../../packages/react/src/controller/criteria-publication.js";
import { createReorderController } from "../../../packages/react/src/reordering-controller/controller.js";
import type { DataTableOptions } from "../../../packages/react/src/table/types.js";
import {
  records,
  required,
  type Fixture,
  type Item,
  type S,
} from "../admission/fixtures.js";
import type { HostFixture } from "./host.js";

/** Actual native isRowSelectable callback, not a substituted authority/read port. */
export function nativeFixture() {
  const enabled: boolean = Boolean(true);
  const schema: S = defineQuerySchema({
    id: "admission-synthetic",
    version: 1,
    fields: { amount: { type: "number", owner: "builder", sort: true } },
    pagination: { enabled, defaultSize: 10, sizes: [10, 25] },
  });
  const callbacks: Fixture["callbacks"] & { native?: () => void } = {};
  const D = defineTable<Item>()({
    schema,
    selection: "multiple",
    getRowId: (row) => row.id,
    isRowSelectable() {
      callbacks.native?.();
      return true;
    },
    columns: [
      { id: "amount", accessorKey: "amount" },
      { id: "name", cell: ({ row }) => row.original.id },
    ],
  });
  const metadata = Object.freeze({
    ownerEpoch: 0,
    sourceVersion: 0,
    revision: 0,
    baseRevision: "0",
  });
  const settings = {
    instanceId: "native-b2",
    readCurrent() {
      callbacks.metadata?.();
      return metadata;
    },
    isRowMovable() {
      callbacks.eligibility?.();
      return true;
    },
    controller: {
      initial: {
        query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
      },
      now: () => 0,
    },
  };
  const { controller: C, admission } = createReorderController(D, settings);
  const CD = C.getDefinition(),
    context = { definitionKey: schema.id, scopeKey: "native-b2", access: true };
  let initial = true;
  const P = createCriteriaPublication({
    controller: C,
    definition: CD,
    retirement: {
      retire(event) {
        if (initial) {
          if (event.next?.controller !== C || C.getSnapshot().revision !== 0)
            throw new Error("Actual initial publication certificate");
          initial = false;
        } else C.dispatch({ type: "selection.cancel" });
        return undefined;
      },
    },
  });
  const initialTicket = P.begin({
    controller: C,
    definition: CD,
    expected: context,
    actual: context,
  });
  if (
    initialTicket.status !== "pending" ||
    P.complete(initialTicket.ticket).status !== "settled"
  )
    throw new Error("Actual P required");
  const owner: HostFixture = {
    D,
    C,
    admission,
    callbacks,
    metadata: () => metadata,
    options(): DataTableOptions<S, Item> {
      const current = required(P.getSnapshot().current);
      return {
        controller: C,
        publication: P,
        criteria: P.issue({
          controller: C,
          definition: CD,
          context: current.expected,
          epoch: current.epoch,
        }),
        expected: context,
        manualOrder: true,
        source: { mode: "client", context, records },
      };
    },
    dispose() {
      admission.dispose();
      P.dispose();
      C.dispose();
    },
  };
  return { owner, callbacks };
}
