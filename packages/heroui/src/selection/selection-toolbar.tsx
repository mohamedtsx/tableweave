"use client";

import { Button } from "@heroui/react/button";
import { ButtonGroup } from "@heroui/react/button-group";
import type { QuerySchema } from "@tableweave/react/contracts";
import type { ReactNode } from "react";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import {
  captureTableRendererProp,
  requireTableRendererTarget,
  subscribeTableRenderer,
  TableRendererCommitError,
  tableRendererBoundary,
  tableRendererSnapshot,
  tableRendererStatus,
} from "../table/renderer-commit.js";
import type { TableRendererTarget } from "../table/types.js";
import { captureActions, selectionActionContext } from "./action.js";
import type {
  SelectionActionContext,
  SelectionToolbarFailure,
  SelectionToolbarMessages,
  SelectionToolbarProps,
} from "./types.js";

const defaults: SelectionToolbarMessages = Object.freeze({
  normalLabel: "Table tools",
  selectionLabel: "Row selection",
  actionsLabel: "Selection actions",
  selectedCount: (count: number) => `${count} selected`,
  cancel: "Cancel",
  cancelLabel: "Clear row selection",
});

/** Layout cleanup observes focus BEFORE removal, including React-owned portals. */
function FocusRegion({
  children,
  onRemove,
}: {
  readonly children: ReactNode;
  readonly onRemove: (focused: Element) => void;
}) {
  const region = useRef<HTMLDivElement>(null);
  const portalFocus = useRef<Element | null>(null);
  useLayoutEffect(() => {
    const node = region.current;
    return () => {
      const active = node?.ownerDocument.activeElement;
      if (active && (node?.contains(active) || portalFocus.current === active))
        onRemove(active);
    };
  }, [onRemove]);
  return (
    <div
      ref={region}
      style={{ minWidth: 0, width: "100%" }}
      onFocusCapture={(event) => {
        portalFocus.current = event.target;
      }}
    >
      {children}
    </div>
  );
}

/** Rendering only. Does not acquire a resource or own query/selection state. */
export function SelectionToolbar<S extends QuerySchema, T extends object>(
  props: SelectionToolbarProps<S, T>,
) {
  const candidate = captureTableRendererProp<S, T>(props);
  if (candidate.kind === "denied") return null;
  if (candidate.kind === "omitted")
    return <SelectionToolbarContent input={props} />;
  const { target } = candidate;
  // Only library-issued config fields are consumed in the adopted route. normal
  // remains an opaque node reference, never a child callback owner/config capture.
  const descriptor = Object.getOwnPropertyDescriptor(props, "normal");
  if (!descriptor || !Object.hasOwn(descriptor, "value")) return null;
  if (tableRendererStatus(target) === "denied") return null;
  return <RendererSelectionToolbar target={target} normal={descriptor.value} />;
}

function AdoptedSelectionToolbar<S extends QuerySchema, T extends object>({
  target,
  normal,
}: {
  readonly target: TableRendererTarget<S, T>;
  readonly normal: ReactNode;
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
    if (!model.authority || !model.presentation) return null;
    return (
      <SelectionToolbarContent
        input={{
          presentation: model.presentation,
          authority: model.authority,
          normal,
          ...(ports.actions === undefined ? {} : { actions: ports.actions }),
          ...(ports.messages.selectionToolbar === undefined
            ? {}
            : { messages: ports.messages.selectionToolbar }),
          ...(ports.onError === undefined ? {} : { onError: ports.onError }),
          ...(ports.getRestoreFocusTarget === undefined
            ? {}
            : { getRestoreFocusTarget: ports.getRestoreFocusTarget }),
        }}
        target={target}
      />
    );
  } catch (error) {
    if (error instanceof TableRendererCommitError) return null;
    throw error;
  }
}
const RendererSelectionToolbar = memo(
  AdoptedSelectionToolbar,
  (a, b) =>
    a.target.cell === b.target.cell &&
    a.target.actor === b.target.actor &&
    (a.normal === b.normal || tableRendererStatus(b.target) === "waiting"),
) as typeof AdoptedSelectionToolbar;

function SelectionToolbarContent<S extends QuerySchema, T extends object>({
  input: props,
  target,
}: {
  readonly input: SelectionToolbarProps<S, T>;
  readonly target?: TableRendererTarget<S, T>;
}) {
  // Exact library projection entry, not merely its parent's earlier JSX creation.
  if (target) requireTableRendererTarget(target);
  const entry = <Value,>(read: () => Value): Value =>
    target ? tableRendererBoundary(target, read) : read();
  const input = { ...props };
  const { selectedIds, canCancelSelection, requestedQuery, blockedReason } =
    input.presentation;
  // Neutral/masked IDs are withheld facts, not an authorized zero selection.
  // This must gate the FIRST render (including SSR), not an effect. Row readiness
  // is deliberately irrelevant: same-owner loading/error/stale tools still work.
  const hasPrivatePresentation =
    requestedQuery !== null &&
    blockedReason !== "context" &&
    blockedReason !== "definition";
  const selectedCount = selectedIds.length;
  const messages = { ...defaults, ...input.messages };
  for (const [key, value] of Object.entries(messages)) {
    if (
      key === "selectedCount"
        ? typeof value !== "function"
        : typeof value !== "string" || !value.trim()
    ) {
      throw new TypeError("Invalid selection toolbar messages");
    }
  }
  const actions = captureActions(
    hasPrivatePresentation ? (input.actions ?? []) : [],
  );
  const { read, cancelSelection } = input.authority;
  if (
    typeof read !== "function" ||
    typeof cancelSelection !== "function" ||
    (input.onError !== undefined && typeof input.onError !== "function") ||
    (input.getRestoreFocusTarget !== undefined &&
      typeof input.getRestoreFocusTarget !== "function")
  ) {
    throw new TypeError("Invalid selection toolbar port");
  }
  const config = {
    renderer: target,
    hasPrivatePresentation,
    authority: input.authority,
    read,
    cancelSelection,
    actions,
    onError: input.onError,
    getRestoreFocusTarget: input.getRestoreFocusTarget,
  };
  const committed = useRef<typeof config | null>(null);
  const root = useRef<HTMLFieldSetElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const removedFocus = useRef<Element | null>(null);
  const removedRenderer = useRef<TableRendererTarget<S, T> | null>(null);
  const selected = selectedCount > 0;
  // Only commit phase updates event ports; abandoned renders cannot acquire authority.
  useLayoutEffect(() => {
    committed.current = config;
    return () => {
      committed.current = null;
    };
  });
  // Modal descendants release background inert in passive cleanup. Keep capture
  // in layout cleanup, but restore only after that cleanup has finished.
  useEffect(() => {
    const removed = removedFocus.current;
    const receipt = removedRenderer.current;
    removedFocus.current = null;
    removedRenderer.current = null;
    // Do not call a previous private trigger/fallback or steal surviving external
    // focus on access/context loss. Clear the pending restoration on this commit.
    const canRestore = () => {
      if (
        !hasPrivatePresentation ||
        committed.current !== config ||
        !root.current?.isConnected
      )
        return false;
      try {
        if (config.renderer) {
          if (
            !receipt ||
            receipt.cell !== config.renderer.cell ||
            receipt.actor !== config.renderer.actor
          )
            return false;
          requireTableRendererTarget(config.renderer);
        }
        const live = config.read();
        if (config.renderer) requireTableRendererTarget(config.renderer);
        return (
          committed.current === config &&
          root.current?.isConnected === true &&
          live.requestedQuery !== null &&
          live.blockedReason !== "context" &&
          live.blockedReason !== "definition" &&
          live.selectedIds.length > 0 === selected &&
          (!selected || live.canCancelSelection)
        );
      } catch {
        return false;
      }
    };
    const survivingFocus = () => {
      const active = root.current?.ownerDocument.activeElement;
      return !!(
        active &&
        active !== removed &&
        active !== active.ownerDocument.body
      );
    };
    if (!removed || !canRestore() || survivingFocus()) return;
    let target: HTMLElement | null = selected ? cancel.current : null;
    if (!selected) {
      try {
        target = entry(() => config.getRestoreFocusTarget?.() ?? null);
      } catch {
        /* Safe local fallback. */
      }
    }
    if (!target?.isConnected) target = root.current;
    // The application fallback may synchronously change the owner or move focus.
    if (
      !canRestore() ||
      survivingFocus() ||
      target?.closest("[inert]") ||
      target?.matches(":disabled")
    )
      return;
    const focus = () => {
      if (
        !canRestore() ||
        survivingFocus() ||
        target?.closest("[inert]") ||
        target?.matches(":disabled")
      )
        return;
      const selectionRegion = target?.closest('[data-selection-active="true"]');
      if (
        config.renderer &&
        selectionRegion &&
        selectionRegion !== root.current
      )
        return;
      target?.focus({ preventScroll: true });
    };
    if (config.renderer) queueMicrotask(focus);
    else target?.focus({ preventScroll: true });
  });
  // Stable callback: FocusRegion cleanup must not run on ordinary rerenders.
  const onRemove = useRef((element: Element) => {
    removedFocus.current = element;
    removedRenderer.current = committed.current?.renderer ?? null;
  }).current;
  const current = () => {
    const latest = committed.current;
    if (
      !latest?.hasPrivatePresentation ||
      (!target && latest.authority !== config.authority)
    )
      return null;
    if (target) {
      if (
        !latest.renderer ||
        latest.renderer.cell !== target.cell ||
        latest.renderer.actor !== target.actor
      )
        return null;
      try {
        requireTableRendererTarget(target);
      } catch {
        return null;
      }
    } else if (latest.renderer) return null;
    return latest;
  };
  const report = (failure: SelectionToolbarFailure) => {
    try {
      const latest = current();
      if (
        !latest?.hasPrivatePresentation ||
        (!target && latest.authority !== config.authority)
      )
        return;
      const { blockedReason } = latest.read();
      if (target && current() !== latest) return;
      if (blockedReason === "context" || blockedReason === "definition") return;
      const result = entry(() => latest.onError?.(failure));
      void Promise.resolve(result).catch(() => {});
    } catch {
      /* App reporting must not create an unhandled error. */
    }
  };
  const invoke = (id: string | null) => {
    const latest = current();
    // Replacing an authority or unmounting invalidates saved old DOM callbacks.
    if (
      !latest?.hasPrivatePresentation ||
      (!target && latest.authority !== config.authority)
    )
      return;
    try {
      if (id === null) {
        entry(() => latest.cancelSelection());
        return;
      }
      const action = latest.actions.find((candidate) => candidate.id === id);
      if (!action || action.isDisabled || action.isPending) return;
      let context: SelectionActionContext<S, T>;
      try {
        context = entry(() => selectionActionContext(latest.read()));
        if (target && current() !== latest) return;
      } catch (error) {
        report({ actionId: id, reason: "unavailable", error });
        return;
      }
      // A callback may retain this snapshot; the app must discard its own pending
      // work on access loss and independently authorize every backend operation.
      const result = entry(() => action.onAction(context));
      void Promise.resolve(result).catch((error: unknown) =>
        report({ actionId: id, reason: "callback", error }),
      );
    } catch (error) {
      report({
        actionId: id,
        reason: id === null ? "unavailable" : "callback",
        error,
      });
    }
  };
  if (!hasPrivatePresentation || (target && !currentRenderTarget(target)))
    return null;
  let selectedText: string | undefined;
  if (target && selected) {
    try {
      selectedText = entry(() => messages.selectedCount(selectedCount));
    } catch (error) {
      if (error instanceof TableRendererCommitError) return null;
      throw error;
    }
  }
  return (
    <fieldset
      ref={root}
      tabIndex={-1}
      aria-label={selected ? messages.selectionLabel : messages.normalLabel}
      className={input.className}
      data-selection-active={selected ? "true" : "false"}
      style={{
        minWidth: 0,
        color: "var(--foreground)",
        borderRadius: "var(--radius-md)",
        outlineOffset: "4px",
        border: 0,
        margin: 0,
        padding: 0,
      }}
    >
      <FocusRegion key={selected ? "selection" : "normal"} onRemove={onRemove}>
        {selected ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: ".5rem",
              paddingBlock: ".25rem",
              minWidth: 0,
            }}
          >
            <span
              role="status"
              aria-live="polite"
              aria-atomic="true"
              style={{
                fontSize: ".875rem",
                fontVariantNumeric: "tabular-nums",
                overflowWrap: "anywhere",
                marginInlineEnd: "auto",
              }}
            >
              {target ? selectedText : messages.selectedCount(selectedCount)}
            </span>
            <ButtonGroup
              aria-label={messages.actionsLabel}
              size="sm"
              variant="tertiary"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: ".25rem",
                maxWidth: "100%",
              }}
            >
              {actions.map((action) => (
                <Button
                  key={action.id}
                  size="sm"
                  variant={action.variant ?? "secondary"}
                  isDisabled={
                    action.isDisabled === true || action.isPending === true
                  }
                  isPending={action.isPending === true}
                  onPress={() => invoke(action.id)}
                  style={{
                    minHeight: "2.75rem",
                    height: "auto",
                    whiteSpace: "normal",
                    overflowWrap: "anywhere",
                    maxWidth: "100%",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  {action.label}
                </Button>
              ))}
              <Button
                ref={cancel}
                size="sm"
                variant="tertiary"
                aria-label={`${messages.cancel} — ${messages.cancelLabel}`}
                isDisabled={!canCancelSelection}
                onPress={() => invoke(null)}
                style={{
                  minHeight: "2.75rem",
                  height: "auto",
                  whiteSpace: "normal",
                  maxWidth: "100%",
                  borderRadius: "var(--radius-md)",
                }}
              >
                {messages.cancel}
              </Button>
            </ButtonGroup>
          </div>
        ) : (
          input.normal
        )}
      </FocusRegion>
    </fieldset>
  );
}

function currentRenderTarget<S extends QuerySchema, T extends object>(
  target: TableRendererTarget<S, T>,
): boolean {
  try {
    requireTableRendererTarget(target);
    return true;
  } catch {
    return false;
  }
}
