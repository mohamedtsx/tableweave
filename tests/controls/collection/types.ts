import {
  type CollectionMessages,
  defaultCollectionMessages,
} from "../../../packages/heroui/src/table/collection-messages.js";
import type { ControlledCollectionProps } from "../../../packages/heroui/src/table/controlled-collection.js";
import type { NativeCollectionProps } from "../../../packages/heroui/src/table/native-collection.js";
import { defineQuerySchema } from "../../../packages/react/src/contracts/index.js";
import type {
  ControlsAuthority,
  ControlsPresentation,
  NativeDefinition,
  NativeTableView,
} from "../../../packages/react/src/index.js";

const schema = defineQuerySchema({
  id: "collection-type",
  version: 1,
  fields: { name: { type: "text", owner: "builder" } },
});
interface Item {
  readonly id: string;
  readonly name: string;
}
export function typed(
  view: NativeTableView<typeof schema, Item>,
  definition: NativeDefinition<typeof schema, Item>,
  presentation: ControlsPresentation<typeof schema, Item>,
  authority: ControlsAuthority<typeof schema, Item>,
) {
  const props: NativeCollectionProps<typeof schema, Item> = {
    view,
    label: "Items",
    rowHeaderColumnId: "name",
    controls: { definition, presentation, authority },
    diagnostics: false,
    columnTextValue: (column) => column.id,
    rowTextValue: (row) => row.original.name,
    cellTextValue: (cell) => String(cell.getValue()),
    messages: {
      rowCheckbox: (name) => `Pick ${name}`,
      sortPriority: (priority) => String(priority),
    },
  };
  const legacy: NativeCollectionProps<typeof schema, Item> = {
    view,
    label: "Items",
    rowHeaderColumnId: "name",
    columnTextValue: props.columnTextValue,
    rowTextValue: props.rowTextValue,
    cellTextValue: props.cellTextValue,
  };
  // @ts-expect-error explicit immutable definition metadata is required with guards
  const missingOwner: NonNullable<typeof props.controls> = {
    presentation,
    authority,
  };
  const badMessage: Partial<CollectionMessages> = {
    // @ts-expect-error message formatters retain own string inputs, not vendor callbacks
    rowCheckbox: (value: number) => String(value),
  };
  // @ts-expect-error native rows keep the application's record inference
  const wrong: string = view.rows[0]?.original.missing;
  const messages: CollectionMessages = {
    ...defaultCollectionMessages,
    sortSeparator: " / ",
  };
  const controlled: ControlledCollectionProps = {
    label: "Items",
    selectionMode: "single",
    diagnostics: false,
    messages,
    columns: [
      {
        kind: "leaf",
        id: "name",
        label: "Name",
        textValue: "Name",
        isRowHeader: true,
      },
    ],
    rows: [],
    selectedIds: new Set<string>(),
    eligiblePageIds: [],
    sorting: [],
    onSelectedIdsChange(ids) {
      // @ts-expect-error received IDs are readonly, not a writable state owner
      ids.add("not-owned");
    },
    onSort() {},
    onCancelSelection() {},
  };
  void legacy;
  void missingOwner;
  void badMessage;
  void wrong;
  return { props, controlled };
}
