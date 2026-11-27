import {
  type CollectionMessages,
  type ColumnChooserMessages,
  defaultCollectionMessages,
  defaultColumnChooserMessages,
  defaultSortingMessages,
  type NativeCollectionProps,
  type PaginationCorrectionContext,
  type PaginationMessages,
  paginationMessages,
  type SelectionActionContext,
  type SortingMessages,
} from "@tableweave/heroui";
import {
  type ControlsAuthority,
  getControlsAuthorityOwner,
} from "@tableweave/react";
import type {
  ExampleRecord,
  schema,
} from "../../../apps/storybook/src/controls/model.js";

export const ownMessages: {
  collection: CollectionMessages;
  chooser: ColumnChooserMessages;
  sorting: SortingMessages;
  pagination: PaginationMessages;
} = {
  collection: defaultCollectionMessages,
  chooser: defaultColumnChooserMessages,
  sorting: defaultSortingMessages,
  pagination: paginationMessages,
};

export function publicContracts(
  authority: ControlsAuthority<typeof schema, ExampleRecord>,
  props: NativeCollectionProps<typeof schema, ExampleRecord>,
  action: SelectionActionContext<typeof schema, ExampleRecord>,
) {
  const owner = getControlsAuthorityOwner(authority);
  if (owner) {
    const correction: PaginationCorrectionContext<
      typeof schema,
      ExampleRecord
    > = {
      definition: owner.definition,
      context: { definitionKey: "synthetic", scopeKey: "A", access: true },
      epoch: 0,
      readCurrent() {
        return { context: this.context, epoch: this.epoch };
      },
    };
    void correction;
    const asyncCorrection: PaginationCorrectionContext<
      typeof schema,
      ExampleRecord
    > = {
      ...correction,
      // @ts-expect-error correction is synchronous own data, not an async envelope
      readCurrent: async () => ({
        context: correction.context,
        epoch: correction.epoch,
      }),
    };
    void asyncCorrection;
  }
  const guarded = props.controls;
  if (guarded) {
    // @ts-expect-error only the explicit actual definition metadata is missing
    const badGuard: NonNullable<typeof props.controls> = {
      presentation: guarded.presentation,
      authority,
    };
    void badGuard;
  }
  const ids: readonly string[] = action.selectedIds;
  const missing: readonly string[] = action.missingSelectedIds;
  const loaded: ExampleRecord | undefined = action.loadedSelected[0]?.record;
  void ids;
  void missing;
  void loaded;
}
