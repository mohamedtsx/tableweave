"use client";

import {
  type NativeCell,
  type NativeHeader,
  renderNativeComponent,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import { memo, useCallback, useSyncExternalStore } from "react";
import { NativeCollectionContent } from "./native-collection.js";
import {
  requireTableRendererMember,
  requireTableRendererTarget,
  subscribeTableRenderer,
  TableRendererCommitError,
  tableRendererBoundary,
  tableRendererSnapshot,
} from "./renderer-commit.js";
import type { TableRendererTarget } from "./types.js";

/** Stable type across config/model/query epochs; original app types remain React-owned.
 * Selection branches match installed TanStack9.3.1 FlexRender, not another engine. */
export function TableRendererNativeContent<
  S extends QuerySchema,
  T extends object,
>(props: {
  readonly target: TableRendererTarget<S, T>;
  readonly cell?: NativeCell<T>;
  readonly header?: NativeHeader<T>;
}) {
  const { target } = props;
  try {
    requireTableRendererTarget(target);
    const cell = tableRendererBoundary(target, () => props.cell);
    if (cell) {
      requireTableRendererMember(target, "cell", cell);
      return tableRendererBoundary(target, () => {
        const definition = cell.column.columnDef;
        // These optional grouping ports are exactly the vendor's optional branches;
        // the active NativeFeatures do not require rowGrouping in their type set.
        const groupingCell = cell as NativeCell<T> & {
          getIsAggregated?: () => boolean;
          getIsPlaceholder?: () => boolean;
        };
        const groupingDefinition = definition as typeof definition & {
          aggregatedCell?: typeof definition.cell;
        };
        const aggregated = tableRendererBoundary(target, () =>
          groupingCell.getIsAggregated?.(),
        );
        if (aggregated) {
          const renderer = groupingDefinition.aggregatedCell ?? definition.cell;
          const context = tableRendererBoundary(target, () =>
            cell.getContext(),
          );
          requireTableRendererMember(target, "cell", cell);
          return tableRendererBoundary(target, () =>
            renderNativeComponent(renderer, context),
          );
        }
        if (
          tableRendererBoundary(target, () => groupingCell.getIsPlaceholder?.())
        )
          return null;
        const renderer = definition.cell;
        const context = tableRendererBoundary(target, () => cell.getContext());
        requireTableRendererMember(target, "cell", cell);
        return tableRendererBoundary(target, () =>
          renderNativeComponent(renderer, context),
        );
      });
    }
    const header = tableRendererBoundary(target, () => props.header);
    if (header) {
      requireTableRendererMember(target, "header", header);
      return tableRendererBoundary(target, () => {
        const renderer = header.column.columnDef.header;
        const context = tableRendererBoundary(target, () =>
          header.getContext(),
        );
        requireTableRendererMember(target, "header", header);
        return tableRendererBoundary(target, () =>
          renderNativeComponent(renderer, context),
        );
      });
    }
    return null;
  } catch (error) {
    if (error instanceof TableRendererCommitError) return null;
    throw error; // Current app error/Suspense values remain React control flow.
  }
}

/** NativeCollection's adopted route: never traverse alleged caller private props. */
function RendererCollection<S extends QuerySchema, T extends object>({
  target,
}: {
  readonly target: TableRendererTarget<S, T>;
}) {
  useSyncExternalStore(
    useCallback(
      (listener) => subscribeTableRenderer(target, listener),
      [target],
    ),
    useCallback(() => tableRendererSnapshot(target), [target]),
    useCallback(() => tableRendererSnapshot(target), [target]),
  );
  try {
    const { model, ports } = requireTableRendererTarget(target);
    const collection = ports.collection;
    if (
      !collection ||
      !model.view ||
      !model.authority ||
      !model.presentation ||
      !model.definition
    )
      return null;
    return (
      <NativeCollectionContent
        input={{
          ...collection,
          view: model.view,
          controls: {
            definition: model.definition.native,
            authority: model.authority,
            presentation: model.presentation,
          },
          ...(ports.messages.collection === undefined
            ? {}
            : { messages: ports.messages.collection }),
        }}
        target={target}
      />
    );
  } catch (error) {
    if (error instanceof TableRendererCommitError) return null;
    throw error;
  }
}
// Parent query/model renders cannot turn a temporarily stale model into an
// unmount. Actual core metadata/actor subscriptions still rerender this leaf.
export const TableRendererCollection = memo(
  RendererCollection,
  (a, b) =>
    a.target.cell === b.target.cell && a.target.actor === b.target.actor,
) as typeof RendererCollection;
