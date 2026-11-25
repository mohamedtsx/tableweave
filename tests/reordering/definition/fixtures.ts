import { defineQuerySchema } from "../../../packages/react/src/contracts/index.js";
import { defineTable } from "../../../packages/react/src/table/definition.js";
import { createNativeColumnHelper } from "../../../packages/react/src/tanstack/definition.js";

export interface Item {
  readonly id: string;
  readonly title: string;
}
export const schema = defineQuerySchema({
  id: "reorder-capability-synthetic",
  version: 1,
  fields: { title: { type: "text", owner: "none" } },
});
const helper = createNativeColumnHelper<Item>();
export const columns = helper.columns([
  helper.accessor("title", { id: "title" }),
]);
export const input = () => ({
  schema,
  columns,
  getRowId: (record: Item) => record.id,
});
export const make = defineTable<Item>();
