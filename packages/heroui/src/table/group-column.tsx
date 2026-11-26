"use client";

import type { ComponentProps, ReactNode } from "react";
import { useContext } from "react";
import { createBranchComponent } from "react-aria/CollectionBuilder";
import { useObjectRef } from "react-aria/useObjectRef";
import { useTableColumnHeader } from "react-aria/useTable";
import { TableStateContext } from "react-aria-components/Table";

interface GroupColumnProps {
  readonly id: string;
  readonly label: ReactNode;
  readonly textValue: string;
  readonly isPlaceholder?: boolean;
  readonly children: ReactNode;
}

/**
 * Collection branch, not a nested DOM header. HeroUI's Column is a collection
 * leaf. Its parent header renderer positions this branch next to other headers.
 * Only nonvirtualized tables are supported by this bounded adapter.
 */
export const GroupColumn = createBranchComponent<
  unknown,
  GroupColumnProps,
  HTMLTableCellElement
>("column", function GroupColumnHeading(props, forwardedRef, node) {
  const state = useContext(TableStateContext);
  const ref = useObjectRef(forwardedRef);
  if (!state)
    throw new Error("GroupColumn requires a Table.Content collection");
  const { columnHeaderProps } = useTableColumnHeader({ node }, state, ref);
  const span = columnHeaderProps["aria-colspan"];
  return (
    <th
      {...columnHeaderProps}
      ref={ref}
      colSpan={typeof span === "number" ? span : 1}
      className="table__column"
      data-slot="table-column-group"
      data-column-id={String(node.key)}
      {...(props.isPlaceholder ? { "aria-hidden": true, tabIndex: -1 } : {})}
    >
      {props.isPlaceholder ? null : props.label}
    </th>
  );
});

export type CollectionGroupColumnProps = ComponentProps<typeof GroupColumn>;
