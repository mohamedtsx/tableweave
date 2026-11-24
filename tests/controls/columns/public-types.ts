import type {
  ControlsAuthority,
  ControlsPresentation,
  NativeDefinition,
  NativeTableView,
} from "@tableweave/react";
import { defineQuerySchema } from "@tableweave/react/contracts";
import type {
  ColumnChooserMessages,
  ColumnChooserProps,
} from "columns-producer";
import { ColumnChooser } from "columns-producer";
import type { SortingMessages, SortingProps } from "sorting-producer";
import { Sorting } from "sorting-producer";

const schema = defineQuerySchema({
  id: "types",
  version: 1,
  fields: { name: { type: "text", owner: "none", sort: true } },
});
interface Row {
  id: string;
  name: string;
}
declare const definition: NativeDefinition<typeof schema, Row>;
declare const view: NativeTableView<typeof schema, Row>;
declare const authority: ControlsAuthority<typeof schema, Row>;
declare const presentation: ControlsPresentation<typeof schema, Row>;
const target = { definition, view, authority, presentation };
const chooser: ColumnChooserProps<typeof schema, Row> = {
  ...target,
  labels: { name: "Name" },
  onResult: (notice) => {
    notice satisfies string;
  },
};
const sorting: SortingProps<typeof schema, Row> = {
  ...target,
  disabledReason: "No permission",
  isDisabled: true,
};
ColumnChooser(chooser);
Sorting(sorting);
const vendor: ColumnChooserProps<typeof schema, Row> = {
  ...chooser,
  // @ts-expect-error no vendor/RAC state props
  selectedKeys: new Set(),
};
// @ts-expect-error target definition is mandatory for exact owner binding
ColumnChooser({ view, authority });
// @ts-expect-error messages must be a complete replacement
const partialChooser: ColumnChooserMessages = { trigger: "Columns" };
// @ts-expect-error no partial English/translated mixture
const partialSorting: SortingMessages = { ascending: "Up" };
const observer: SortingProps<typeof schema, Row> = {
  ...target,
  // @ts-expect-error proposed is deliberately not called committed/success
  onResult: (notice: "success") => {
    void notice;
  },
};
void vendor;
void partialChooser;
void partialSorting;
void observer;
