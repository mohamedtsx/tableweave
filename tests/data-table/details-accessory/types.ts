import type { DataTableModel, NativeRow } from "@tableweave/react";
import { useDetailsAccessory } from "../../../packages/heroui/src/data-table/details-provider.js";
import type {
  DetailsAccessory,
  DetailsAccessoryOptions,
} from "../../../packages/heroui/src/details/types.js";
import type { Item, Schema } from "./fixtures.js";
export function inference(model: DataTableModel<Schema, Item>) {
  const options: DetailsAccessoryOptions<Schema, Item> = {
    expected: {
      definitionKey: "bound-details-fixture",
      datasetKey: "synthetic",
      scopeKey: "synthetic",
      access: true,
      epoch: 0,
    },
    authority: {
      context: {
        definitionKey: "bound-details-fixture",
        datasetKey: "synthetic",
        scopeKey: "synthetic",
        access: true,
        epoch: 0,
      },
      rowId: null,
      session: 0,
      generation: 0,
    },
    source: null,
    port: {
      read() {
        return { authority: options.authority };
      },
    },
    focusFallback() {},
    title: "Details",
    renderBody(context) {
      const item: Item | undefined = context.record;
      const row: NativeRow<Item> | undefined = context.row;
      return item?.title ?? row?.id ?? "Loading";
    },
  };
  const accessory: DetailsAccessory<Schema, Item> = useDetailsAccessory(
    model,
    options,
  );
  return accessory;
}
