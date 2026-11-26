"use client";
import type { QuerySchema } from "@tableweave/react/contracts";
import { useLayoutEffect, useSyncExternalStore } from "react";
import {
  getTableReorderingBinding,
  publishTableReordering,
  reorderingSnapshot,
  sealTableReordering,
  subscribeReordering,
  subscribeRowReordering,
  suspendTableReordering,
} from "./reordering-binding.js";
import { tableRendererStatus } from "./renderer-commit.js";
import type { TableRendererTarget } from "./types.js";

const emptySubscribe = () => () => {};
const emptySnapshot = () => null;
/** Ordinary sibling outside CommittedShell's held memo and all collection ancestry. */
export function TableReorderingHost<S extends QuerySchema, T extends object>({
  target,
}: {
  readonly target: TableRendererTarget<S, T>;
}) {
  useSyncExternalStore(
    target.cell.subscribe,
    target.cell.getSnapshot,
    target.cell.getSnapshot,
  );
  const binding = getTableReorderingBinding(target);
  useSyncExternalStore(
    binding
      ? (listener) => subscribeReordering(binding, listener)
      : emptySubscribe,
    binding ? () => reorderingSnapshot(binding) : emptySnapshot,
    emptySnapshot,
  );
  useLayoutEffect(() => {
    if (!binding) return;
    const synchronize = () => {
      try {
        if (tableRendererStatus(target) !== "ready") {
          suspendTableReordering(binding);
          return;
        }
        publishTableReordering(target);
        sealTableReordering(binding);
      } catch {
        suspendTableReordering(binding);
      }
    };
    synchronize();
    return subscribeRowReordering(binding, synchronize);
  });
  // Strict effect replay does not end app ownership or stable geometry tickets.
  // Actual renderer clearMetadata retires the exact UI claim synchronously.
  return null;
}
