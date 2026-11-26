"use client";

import { Button } from "@heroui/react/button";
import { Drawer } from "@heroui/react/drawer";
import type { QuerySchema } from "@tableweave/react/contracts";
import { useId, useLayoutEffect, useRef } from "react";
import { NoSwipeDialog } from "./no-swipe-dialog.js";
import type {
  DetailsMessages,
  DetailsShellProps,
  DetailsTriggerProps,
} from "./types.js";

export const englishDetailsMessages: DetailsMessages = Object.freeze({
  close: "Close details",
  cancel: "Close",
  loading: "Loading record details.",
  missing: "This record is not available.",
  unavailable: "Details could not be loaded.",
  offline: "Details are unavailable while offline.",
  timeout: "Loading details timed out.",
  retry: "Retry",
  checking: "Checking whether details can close.",
});

function Interior<S extends QuerySchema, T extends object>({
  props,
  titleId,
  descriptionId,
}: {
  props: DetailsShellProps<S, T>;
  titleId: string;
  descriptionId: string;
}) {
  const context = props.session.context;
  const heading = useRef<HTMLHeadingElement>(null);
  const initialFocus = useRef(props.focusInitial);
  useLayoutEffect(() => {
    if (initialFocus.current) initialFocus.current();
    else heading.current?.focus();
  }, []);
  if (!context) return null;
  const messages = { ...englishDetailsMessages, ...props.messages };
  return (
    <>
      <Drawer.Header className="tw-details__header">
        <Drawer.Heading id={titleId} ref={heading} tabIndex={-1}>
          {props.title}
        </Drawer.Heading>
        <Button
          variant="tertiary"
          aria-label={messages.close}
          onPress={() => {
            void context.requestClose("close-button");
          }}
        >
          {messages.cancel}
        </Button>
      </Drawer.Header>
      {props.description ? (
        <p id={descriptionId} className="tw-details__description">
          {props.description}
        </p>
      ) : null}
      {context.policyBusy ? (
        <p role="status" className="tw-details__status">
          {messages.checking}
        </p>
      ) : null}
      {props.renderInterior ? (
        props.renderInterior(context)
      ) : (
        <>
          {props.renderHeader?.(context)}
          <Drawer.Body className="tw-details__body">
            {context.status !== "ready" ? (
              <div role="status">
                <p>
                  {context.status === "loading"
                    ? messages.loading
                    : context.status === "missing"
                      ? messages.missing
                      : context.errorCode
                        ? messages[context.errorCode]
                        : messages.unavailable}
                </p>
                {props.session.canRetry ? (
                  <Button
                    variant="secondary"
                    onPress={() => {
                      void props.session.retry();
                    }}
                  >
                    {messages.retry}
                  </Button>
                ) : null}
              </div>
            ) : null}
            {props.renderBody(context)}
          </Drawer.Body>
          <Drawer.Footer className="tw-details__footer">
            {props.renderFooter ? (
              props.renderFooter(context)
            ) : (
              <Button
                variant="secondary"
                onPress={() => {
                  void context.requestClose("footer");
                }}
              >
                {messages.cancel}
              </Button>
            )}
          </Drawer.Footer>
        </>
      )}
    </>
  );
}

export function DetailsShell<S extends QuerySchema, T extends object>(
  props: DetailsShellProps<S, T>,
) {
  const titleId = useId();
  const descriptionId = useId();
  // Unmount immediately on accepted close/privacy loss: never animate private data
  // after revocation. Responsive changes never key/remount this overlay.
  if (!props.session.isOpen || !props.session.context) return null;
  if (!props.title.trim())
    throw new Error("DetailsShell requires a nonempty accessible title.");
  return (
    <Drawer.Backdrop
      isOpen
      onOpenChange={(open) => {
        if (!open) void props.session.requestClose("dismiss");
      }}
      isDismissable={props.dismissOnOutside ?? true}
      isKeyboardDismissDisabled={props.dismissOnEscape === false}
      className="tw-details__backdrop"
    >
      <Drawer.Content
        placement={props.direction === "rtl" ? "left" : "right"}
        className="tw-details__content"
      >
        <NoSwipeDialog
          dir={props.direction ?? "ltr"}
          aria-labelledby={titleId}
          {...(props.description ? { "aria-describedby": descriptionId } : {})}
          className={["tw-details__dialog", props.className]
            .filter(Boolean)
            .join(" ")}
        >
          <div dir={props.direction ?? "ltr"} className="tw-details__interior">
            <Interior
              key={props.session.contentKey}
              props={props}
              titleId={titleId}
              descriptionId={descriptionId}
            />
          </div>
        </NoSwipeDialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

export function DetailsTrigger<S extends QuerySchema, T extends object>(
  props: DetailsTriggerProps<S, T>,
) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <Button
      ref={ref}
      type="button"
      variant="tertiary"
      aria-label={props.label}
      isDisabled={props.isDisabled ?? false}
      className={["tw-details__trigger", props.className]
        .filter(Boolean)
        .join(" ")}
      onPress={() => {
        void props.session.requestOpen(props.rowId, {
          restoreFocus: () => {
            if (!ref.current?.isConnected) return false;
            ref.current.focus();
            return true;
          },
        });
      }}
    >
      {props.children ?? props.label}
    </Button>
  );
}
