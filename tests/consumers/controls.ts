import type {
  ColumnChooserProps,
  NativeCollectionProps,
  PaginationCorrectionContext,
  PaginationProps,
  SelectionToolbarProps,
  SortingProps,
} from "@tableweave/heroui";
import {
  ColumnChooser,
  defaultCollectionMessages,
  defaultColumnChooserMessages,
  defaultSortingMessages,
  NativeCollection,
  Pagination,
  SelectionToolbar,
  Sorting,
  usePaginationCorrection,
} from "@tableweave/heroui";
import type {
  ControlsInput,
  ControlsIntent,
  NativeDefinition,
} from "@tableweave/react";
import {
  createControlsAuthority,
  getControlsAuthorityOwner,
  projectControls,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import { createElement } from "react";

interface SyntheticRecord {
  readonly id: string;
  readonly amount: number;
}

/** Public types only: the host owns the committed port and all source lifetimes. */
export function PackedControls<S extends QuerySchema>(props: {
  readonly definition: NativeDefinition<S, SyntheticRecord>;
  readonly frame: ControlsInput<S, SyntheticRecord>;
  readonly readCommitted: () => ControlsInput<S, SyntheticRecord>;
  readonly correction: PaginationCorrectionContext<S, SyntheticRecord>;
}) {
  const { definition, frame } = props;
  const origin = {
    definition,
    controller: frame.native.controller,
    context: frame.expected,
    queryIdentity: frame.native.state.queryIdentity,
    readCommitted: props.readCommitted,
  };
  const authority =
    frame.source.mode === "server"
      ? createControlsAuthority({
          ...origin,
          mode: "server",
          resource: frame.source.resource,
        })
      : createControlsAuthority({ ...origin, mode: "client" });
  const presentation = projectControls(definition, frame);
  const owner = getControlsAuthorityOwner(authority);
  const definitionProof: NativeDefinition<S, SyntheticRecord> | undefined =
    owner?.definition;
  void definitionProof;
  const intent: ControlsIntent = { type: "columns" };
  void intent;

  const target = { definition, view: frame.native, presentation, authority };
  const sorting: SortingProps<S, SyntheticRecord> = {
    ...target,
    messages: defaultSortingMessages,
  };
  const columns: ColumnChooserProps<S, SyntheticRecord> = {
    ...target,
    messages: defaultColumnChooserMessages,
  };
  const normal = createElement(
    "div",
    null,
    createElement(Sorting<S, SyntheticRecord>, sorting),
    createElement(ColumnChooser<S, SyntheticRecord>, columns),
  );
  const selection: SelectionToolbarProps<S, SyntheticRecord> = {
    presentation,
    authority,
    normal,
    actions: [
      {
        id: "inspect",
        label: "Inspect synthetic selection",
        onAction(current) {
          const amount: number | undefined =
            current.loadedSelected[0]?.record.amount;
          const missing: readonly string[] = current.missingSelectedIds;
          // @ts-expect-error Loaded application records retain their precise type.
          const unknownField = current.loadedSelected[0]?.record.unknownField;
          void amount;
          void missing;
          void unknownField;
        },
      },
    ],
  };
  const pager: PaginationProps<S, SyntheticRecord> = {
    schema: definition.controllerDefinition.schema,
    presentation,
    authority,
  };
  const collection: NativeCollectionProps<S, SyntheticRecord> = {
    view: frame.native,
    controls: { definition, presentation, authority },
    messages: defaultCollectionMessages,
    diagnostics: false,
    label: "Synthetic current result",
    rowHeaderColumnId: "amount",
    columnTextValue: (column) => column.id,
    rowTextValue: (row) => `${row.original.id}: ${row.original.amount}`,
    cellTextValue: (cell) => String(cell.getValue()),
  };
  usePaginationCorrection(
    frame.native.controller,
    presentation,
    authority,
    props.correction,
  );

  const badPager: PaginationProps<S, SyntheticRecord> = {
    ...pager,
    // @ts-expect-error No vendor Select state/transport escapes the public props.
    selectedKeys: new Set(["10"]),
  };
  const badCollection: NativeCollectionProps<S, SyntheticRecord> = {
    ...collection,
    // @ts-expect-error A guarded collection requires an exact definition target.
    controls: { presentation, authority },
  };
  void badPager;
  void badCollection;
  return createElement(
    "section",
    null,
    createElement(SelectionToolbar<S, SyntheticRecord>, selection),
    createElement(NativeCollection<S, SyntheticRecord>, collection),
    createElement(Pagination<S, SyntheticRecord>, pager),
  );
}
