"use client";
import { Dropdown } from "@heroui/react/dropdown";
import { Button } from "@heroui/react/button";
import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  columnMove,
  collectionReorderingPresentation,
  hasCollectionReordering,
  leafCollectionRefs,
  rowCollectionRefs,
  rowMoveFacts,
  submitTableRowMove,
  reorderingSnapshot,
  type requireCollectionReordering,
  requireCurrentCollection,
  subscribeReordering,
} from "./reordering-binding.js";
import type { ReorderingMessages } from "./reordering-types.js";
import type { RefCallback } from "react";
import { englishReorderingMessages } from "./reordering-messages.js";

interface ColumnMoveProps {
  readonly collection: ReturnType<typeof requireCollectionReordering>;
  readonly id: string;
  readonly label: string;
  readonly messages: Readonly<ReorderingMessages>;
  readonly isOpen: boolean;
  readonly onOpenChange: (open: boolean) => void;
}
/** Issuance before other props. No application ref callback is accepted. */
export function ColumnMoveControls(props: ColumnMoveProps) {
  const collection = collectionReorderingPresentation(props.collection);
  if (!hasCollectionReordering(collection))
    return <span>{collection.messages.unavailable}</span>;
  const refs = leafCollectionRefs(collection, props.id);
  if (!refs) return <span>{collection.messages.unavailable}</span>;
  return (
    <ColumnMoveContent
      collection={collection}
      id={props.id}
      label={props.label}
      messages={props.messages}
      isOpen={props.isOpen}
      onOpenChange={props.onOpenChange}
      handle={refs.handle}
      axis="column"
    />
  );
}
export function RowMoveControls(props: ColumnMoveProps) {
  const collection = collectionReorderingPresentation(props.collection);
  if (!hasCollectionReordering(collection))
    return <span>{collection.messages.unavailable}</span>;
  const refs = rowCollectionRefs(collection, props.id);
  if (!refs) return <span>{collection.messages.unavailable}</span>;
  return (
    <ColumnMoveContent
      collection={collection}
      id={props.id}
      label={props.label}
      messages={props.messages}
      isOpen={props.isOpen}
      onOpenChange={props.onOpenChange}
      handle={refs.handle}
      axis="row"
    />
  );
}
/** Both axes use genuine issued refs; only row actions enter the R pre-token cut. */
function ColumnMoveContent({
  collection,
  id,
  label,
  handle,
  messages,
  isOpen,
  onOpenChange,
  axis,
}: ColumnMoveProps & {
  readonly handle: RefCallback<HTMLButtonElement>;
  readonly axis: "row" | "column";
}) {
  const generated = useId(),
    [notice, setNotice] = useState("");
  const button = useRef<HTMLButtonElement | null>(null),
    restore = useRef(false);
  const status = useRef<HTMLSpanElement | null>(null);
  const ref = useCallback<RefCallback<HTMLButtonElement>>(
    (node) => {
      const cleanup = handle(node);
      button.current = node;
      if (typeof cleanup === "function")
        return () => {
          if (button.current === node) button.current = null;
          cleanup();
        };
    },
    [handle],
  );
  const snapshot = useSyncExternalStore(
    (listener) => subscribeReordering(collection.binding, listener),
    () => reorderingSnapshot(collection.binding),
    () => reorderingSnapshot(collection.binding),
  );
  const rowBefore = axis === "row" ? rowMoveFacts(collection, id, -1) : null;
  const rowAfter = axis === "row" ? rowMoveFacts(collection, id, 1) : null;
  const before = rowBefore
    ? rowBefore.allowed
    : columnMove(collection.binding, id, -1, false);
  const after = rowAfter
    ? rowAfter.allowed
    : columnMove(collection.binding, id, 1, false);
  const pending = snapshot.pending || rowBefore?.reason === "pending";
  const title =
    axis === "row"
      ? (messages.row ?? englishReorderingMessages.row ?? "Move row")
      : messages.column;
  const beforeLabel =
    axis === "row"
      ? (messages.up ?? englishReorderingMessages.up ?? "Move up")
      : messages.before;
  const afterLabel =
    axis === "row"
      ? (messages.down ?? englishReorderingMessages.down ?? "Move down")
      : messages.after;
  const disabled = !before && !after;
  const reason = pending
    ? messages.pending
    : !snapshot.ready || rowBefore?.reason === "unavailable"
      ? messages.unavailable
      : rowBefore?.reason === "restricted"
        ? messages.rowUnavailable
        : axis === "row"
          ? (messages.rowBoundary ??
            englishReorderingMessages.rowBoundary ??
            messages.rowUnavailable)
          : messages.boundary;
  useLayoutEffect(() => {
    // The collection's exact-owner close is metadata only. Consume open intent
    // on a wait/pending transition so it cannot reopen when permission returns.
    if (isOpen && (!snapshot.ready || pending)) onOpenChange(false);
  }, [isOpen, snapshot.ready, pending, onOpenChange]);
  useLayoutEffect(() => {
    if (!restore.current || !snapshot.ready) return;
    try {
      requireCurrentCollection(collection);
      const row = axis === "row" ? rowMoveFacts(collection, id, -1) : null;
      if (
        row &&
        !row.allowed &&
        row.reason !== "pending" &&
        !rowMoveFacts(collection, id, 1).allowed
      )
        return;
      if (
        !row &&
        !columnMove(collection.binding, id, -1, false) &&
        !columnMove(collection.binding, id, 1, false)
      )
        return;
      const node = axis === "row" && pending ? status.current : button.current;
      if (
        !node?.isConnected ||
        (!(before || after) &&
          !(axis === "row" && rowBefore?.reason === "pending"))
      )
        return;
      const document = node.ownerDocument;
      if (
        document.activeElement !== document.body &&
        document.activeElement !== node &&
        document.activeElement !== button.current &&
        document.activeElement !== status.current
      ) {
        restore.current = false;
        return;
      }
      restore.current = axis === "row" && pending;
      node.focus();
      requireCurrentCollection(collection);
    } catch {
      /* Waiting/retired handles never acquire focus. */
    }
  });
  const move = (direction: -1 | 1) => {
    try {
      requireCurrentCollection(collection);
    } catch {
      return;
    }
    const freshRow = axis === "row" ? rowMoveFacts(collection, id, -1) : null;
    if (
      freshRow &&
      !freshRow.allowed &&
      freshRow.reason !== "pending" &&
      !rowMoveFacts(collection, id, 1).allowed
    )
      return;
    if (
      !freshRow &&
      !columnMove(collection.binding, id, -1, false) &&
      !columnMove(collection.binding, id, 1, false)
    )
      return;
    restore.current = false;
    if (axis === "row") {
      const submission = submitTableRowMove(collection, id, direction);
      if (!submission?.ui) return;
      try {
        requireCurrentCollection(collection);
        restore.current = submission.notified;
        setNotice(
          submission.notified
            ? submission.uncertain
              ? (messages.rowUncertain ??
                englishReorderingMessages.rowUncertain ??
                messages.unavailable)
              : (messages.rowSubmitted ??
                englishReorderingMessages.rowSubmitted ??
                messages.submitted)
            : submission.result.status === "blocked" &&
                submission.result.reason === "pending"
              ? messages.pending
              : messages.rowUnavailable,
        );
      } catch {
        /* Transferred intent remains application-owned; old UI stays inert. */
      }
      return;
    }
    const submitted = columnMove(collection.binding, id, direction, true);
    // Result is submission bookkeeping, never a backend persistence success.
    try {
      requireCurrentCollection(collection);
      restore.current = submitted;
      setNotice(submitted ? messages.submitted : messages.unavailable);
    } catch {
      /* A later publication owns presentation, not this saved handler. */
    }
  };
  return (
    <>
      <Dropdown
        isOpen={isOpen && snapshot.ready && !pending}
        onOpenChange={(open) => {
          try {
            requireCurrentCollection(collection);
            onOpenChange(open);
          } catch {
            /* Ended menu cannot open/close a replacement. */
          }
        }}
      >
        <Button
          ref={ref}
          slot={null}
          variant="tertiary"
          size="sm"
          isDisabled={disabled}
          aria-label={`${title}: ${label}`}
          {...(disabled ? { "aria-describedby": `${generated}-reason` } : {})}
        >
          {title}
        </Button>
        <Dropdown.Popover placement="bottom end" shouldSkipAnimation>
          <Dropdown.Menu aria-label={`${title}: ${label}`}>
            <Dropdown.Item
              id="before"
              textValue={beforeLabel}
              isDisabled={!before}
              {...(!before
                ? { "aria-describedby": `${generated}-reason` }
                : {})}
              onAction={() => move(-1)}
            >
              {beforeLabel}
            </Dropdown.Item>
            <Dropdown.Item
              id="after"
              textValue={afterLabel}
              isDisabled={!after}
              {...(!after ? { "aria-describedby": `${generated}-reason` } : {})}
              onAction={() => move(1)}
            >
              {afterLabel}
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      {!before || !after ? (
        <span id={`${generated}-reason`} hidden={!disabled}>
          {reason}
        </span>
      ) : null}
      <span ref={status} tabIndex={-1} role="status" aria-live="polite">
        {notice}
      </span>
    </>
  );
}

/** Nonsensitive pending/unavailable metadata; never re-renders native cell bodies. */
export function ReorderingNotice(props: {
  readonly collection: ReturnType<typeof requireCollectionReordering>;
}) {
  const collection = collectionReorderingPresentation(props.collection);
  const snapshot = useSyncExternalStore(
    (listener) => subscribeReordering(collection.binding, listener),
    () => reorderingSnapshot(collection.binding),
    () => reorderingSnapshot(collection.binding),
  );
  return snapshot.rowConfigured && (!snapshot.ready || snapshot.pending) ? (
    <p role="status">
      {snapshot.pending
        ? collection.messages.pending
        : collection.messages.rowUnavailable}
    </p>
  ) : null;
}
