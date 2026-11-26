import type {
  DefineTableInput,
  TableDefinition,
  TableReorderCapabilities,
} from "../../../packages/react/src/table/types.js";
import { input, type Item, make, type schema } from "./fixtures.js";

export const defaults = make(input());
export const rows = make({ ...input(), reordering: { rows: true } });
export const columns = make({ ...input(), reordering: { columns: true } });
export const disabled = make({
  ...input(),
  reordering: { rows: false, columns: false },
});
export const typed: TableDefinition<typeof schema, Item> = rows;
export const flags: Readonly<TableReorderCapabilities> = typed.reordering;
export const configure: DefineTableInput<typeof schema, Item> = {
  ...input(),
  reordering: { columns: true },
};
export const id: (record: Item) => string = typed.native.getRowId;
