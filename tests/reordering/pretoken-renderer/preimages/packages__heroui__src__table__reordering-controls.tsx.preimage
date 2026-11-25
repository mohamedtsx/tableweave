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
  leafCollectionRefs,
  reorderingSnapshot,
  type requireCollectionReordering,
  requireCurrentCollection,
  subscribeReordering,
} from "./reordering-binding.js";
import type { ReorderingMessages } from "./reordering-types.js";
import type { RefCallback } from "react";

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
  const refs = leafCollectionRefs(collection, props.id);
  if (!refs) return null;
  return (
    <ColumnMoveContent
      collection={collection}
      id={props.id}
      label={props.label}
      messages={props.messages}
      isOpen={props.isOpen}
      onOpenChange={props.onOpenChange}
      handle={refs.handle}
    />
  );
}
/** Leaf-only controls; no row terminal callback or drag behavior in this packet. */
function ColumnMoveContent({
  collection,
  id,
  label,
  handle,
  messages,
  isOpen,
  onOpenChange,
}: ColumnMoveProps & {
  readonly handle: RefCallback<HTMLButtonElement>;
}) {
  const generated = useId(),
    [notice, setNotice] = useState("");
  const button = useRef<HTMLButtonElement | null>(null),
    restore = useRef(false);
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
  const before = columnMove(collection.binding, id, -1, false);
  const after = columnMove(collection.binding, id, 1, false);
  const disabled = !before && !after;
  const reason = snapshot.pending
    ? messages.pending
    : !snapshot.ready
      ? messages.unavailable
      : messages.boundary;
  useLayoutEffect(() => {
    if (!restore.current || !snapshot.ready) return;
    try {
      requireCurrentCollection(collection);
      const node = button.current;
      if (!node?.isConnected || !(before || after)) return;
      const document = node.ownerDocument;
      if (
        document.activeElement !== document.body &&
        document.activeElement !== node
      )
        return;
      restore.current = false;
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
    restore.current = false;
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
        isOpen={isOpen && snapshot.ready && !snapshot.pending}
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
          aria-label={`${messages.column}: ${label}`}
          {...(disabled ? { "aria-describedby": `${generated}-reason` } : {})}
        >
          {messages.column}
        </Button>
        <Dropdown.Popover placement="bottom end" shouldSkipAnimation>
          <Dropdown.Menu aria-label={`${messages.column}: ${label}`}>
            <Dropdown.Item
              id="before"
              textValue={messages.before}
              isDisabled={!before}
              {...(!before
                ? { "aria-describedby": `${generated}-reason` }
                : {})}
              onAction={() => move(-1)}
            >
              {messages.before}
            </Dropdown.Item>
            <Dropdown.Item
              id="after"
              textValue={messages.after}
              isDisabled={!after}
              {...(!after ? { "aria-describedby": `${generated}-reason` } : {})}
              onAction={() => move(1)}
            >
              {messages.after}
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      {!before || !after ? (
        <span id={`${generated}-reason`} hidden={!disabled}>
          {reason}
        </span>
      ) : null}
      <span role="status" aria-live="polite">
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
  return snapshot.rowConfigured ? (
    <p role="status">
      {snapshot.pending
        ? collection.messages.pending
        : collection.messages.rowUnavailable}
    </p>
  ) : null;
}
