import type { DataTableModel, TableController } from "@tableweave/react";
import { defineQuerySchema } from "@tableweave/react/contracts";
import { useDetailsAccessory } from "../../../packages/heroui/src/data-table/details-provider.js";
import type {
  DetailsAccessory,
  DetailsAccessoryOptions,
  DetailsRenderContext,
} from "../../../packages/heroui/src/details/types.js";
import type { Item, Schema } from "./fixtures.js";

declare const model: DataTableModel<Schema, Item>;
declare const wrong: DetailsAccessoryOptions<Schema, { wrong: number }>;
// @ts-expect-error P4-N1 model anchors T; private options cannot widen it
useDetailsAccessory(model, wrong);
declare const accessory: DetailsAccessory<Schema, Item>;
// @ts-expect-error P4-N2 opaque record identity invariant
const foreign: DetailsAccessory<Schema, { wrong: number }> = accessory;
void foreign;
const anotherSchema = defineQuerySchema({
  id: "other-details",
  version: 1,
  fields: { amount: { type: "number", owner: "builder" } },
});
declare const otherOptions: DetailsAccessoryOptions<typeof anotherSchema, Item>;
// @ts-expect-error P4-N3 S comes from the genuine model, not private options
useDetailsAccessory(model, otherOptions);
declare const actualOptions: DetailsAccessoryOptions<Schema, Item>;
declare const otherController: TableController<Schema>;
// @ts-expect-error P4-N4 a caller cannot replace the model's controller in options
useDetailsAccessory(model, { ...actualOptions, controller: otherController });
// @ts-expect-error P4-N5 actual render context is not a row/record cast seam
const render: DetailsAccessoryOptions<Schema, Item>["renderBody"] = (
  context: DetailsRenderContext<Schema, { wrong: number }>,
) => context.record?.wrong;
void render;
const inferred: DetailsAccessoryOptions<Schema, Item>["renderBody"] = (
  context,
) => {
  // @ts-expect-error P4-N6 native row.original keeps the exact model record
  return context.row?.original.wrong;
};
void inferred;
