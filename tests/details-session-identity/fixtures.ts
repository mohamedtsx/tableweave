import { createTableController } from "@tableweave/react";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import type {
  DetailsAuthority,
  DetailsOptions,
  DetailsSource,
} from "../../packages/heroui/src/details/types.js";

export const schema = defineQuerySchema({
  id: "details-session-identity",
  version: 1,
  fields: { title: { type: "text", owner: "none" } },
});
export type Schema = typeof schema;
export interface Item {
  readonly id: string;
  readonly title: string;
}

/** Actual raw controller factory. No native/adopted authority is claimed. */
export function fixture() {
  const controller = createTableController(
    { schema, details: true },
    {
      now: () => 0,
      initial: {
        query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
        details: { rowId: "synthetic-one" },
      },
    },
  );
  const context = {
    definitionKey: controller.getSnapshot().definitionIdentity,
    datasetKey: "synthetic-records",
    scopeKey: "synthetic-scope",
    access: true,
    epoch: 0,
  };
  const authority: DetailsAuthority = {
    context,
    rowId: "synthetic-one",
    session: 0,
    generation: 0,
  };
  const record: Item = { id: "synthetic-one", title: "Synthetic record" };
  const source: DetailsSource<Item> = { authority, status: "ready", record };
  const calls = { read: 0, retry: 0, beforeChange: 0, outcome: 0, focus: 0 };
  const options: DetailsOptions<Schema, Item> = {
    controller,
    expected: context,
    authority,
    source,
    visibleFieldIds: ["title"],
    hiddenFieldIds: [],
    port: {
      read() {
        calls.read++;
        return { authority };
      },
      retry() {
        calls.retry++;
      },
    },
    beforeChange() {
      calls.beforeChange++;
      return false;
    },
    onOutcome() {
      calls.outcome++;
    },
    focusFallback() {
      calls.focus++;
    },
  };
  return { controller, record, authority, source, calls, options };
}
