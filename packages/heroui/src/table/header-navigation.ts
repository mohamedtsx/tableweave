import type { KeyboardEvent } from "react";
import type { CollectionColumn } from "./collection-projection.js";

/** Skip presentation-only padding nodes, without replacing ordinary Aria navigation. */
export function skipPlaceholderHeader(
  event: KeyboardEvent<HTMLDivElement>,
  columns: readonly CollectionColumn[],
): void {
  const isEdgeKey = event.key === "Home" || event.key === "End";
  // Global Ctrl/Meta navigation (including range-selection chords) stays with
  // Aria. Shift+Home/End may still target a local hidden padding sibling.
  if (
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    (event.shiftKey && !isEdgeKey)
  )
    return;
  if (!(event.target instanceof Element)) return;
  const current = event.target.closest<HTMLTableCellElement>(
    "thead th[data-column-id]",
  );
  if (!current) return;
  const nodes = new Map<string, CollectionColumn>();
  const parents = new Map<string, CollectionColumn>();
  function visit(
    items: readonly CollectionColumn[],
    parent?: CollectionColumn,
  ) {
    for (const column of items) {
      nodes.set(column.id, column);
      if (parent) parents.set(column.id, parent);
      if (column.kind === "group") visit(column.children, column);
    }
  }
  visit(columns);
  const id = current.dataset.columnId;
  const node = id ? nodes.get(id) : undefined;
  if (!node) return;
  let target: CollectionColumn | undefined;
  let handled = false;
  if (isEdgeKey) {
    // Match Aria's collection-parent scope, not the flattened DOM header row.
    // A real leaf beneath a padding branch must keep its ordinary Home/End
    // behavior; only replace an endpoint that would itself be hidden padding.
    const parent = parents.get(node.id);
    const siblings = parent?.kind === "group" ? parent.children : columns;
    const ordered = event.key === "Home" ? siblings : [...siblings].reverse();
    const endpoint = ordered[0];
    if (endpoint?.kind === "group" && endpoint.isPlaceholder) {
      handled = true;
      target = ordered.find(
        (column) => column.kind !== "group" || !column.isPlaceholder,
      );
    }
  } else if (event.key === "ArrowUp") {
    target = parents.get(node.id);
    while (target?.kind === "group" && target.isPlaceholder) {
      handled = true;
      target = parents.get(target.id);
    }
  } else if (event.key === "ArrowDown" && node.kind === "group") {
    target = node.children[0];
    while (target?.kind === "group" && target.isPlaceholder) {
      handled = true;
      target = target.children[0];
    }
  } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    const siblings = Array.from(
      current.parentElement?.querySelectorAll<HTMLTableCellElement>(
        "th[data-column-id]",
      ) ?? [],
    );
    const rtl = getComputedStyle(current).direction === "rtl";
    const delta = (event.key === "ArrowRight") !== rtl ? 1 : -1;
    let index =
      (siblings.indexOf(current) + delta + siblings.length) % siblings.length;
    const next = siblings[index];
    if (next?.getAttribute("aria-hidden") === "true") {
      handled = true;
      for (let n = 0; n < siblings.length; n++) {
        const candidate = siblings[index];
        if (candidate?.getAttribute("aria-hidden") !== "true") {
          target = nodes.get(candidate?.dataset.columnId ?? "");
          break;
        }
        index = (index + delta + siblings.length) % siblings.length;
      }
    }
  }
  if (!handled) return;
  event.preventDefault();
  event.stopPropagation();
  if (!target) return;
  const targetId = target.id;
  const heading = Array.from(
    current
      .closest("thead")
      ?.querySelectorAll<HTMLTableCellElement>("th[data-column-id]") ?? [],
  ).find((element) => element.dataset.columnId === targetId);
  // Focusing the semantic cell lets Aria update its focused key and then marshal
  // focus to the interactive child when focusMode="child". No private state API.
  heading?.focus();
}
