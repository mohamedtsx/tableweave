"use client";

import { Button } from "@heroui/react/button";
import { Drawer } from "@heroui/react/drawer";
import type { QuerySchema } from "@tableweave/react/contracts";
import { type ReactNode, useId, useLayoutEffect, useRef } from "react";
import {
  getBoundShell,
  getDetailsBinding,
} from "../data-table/details-binding.js";
import { requireDetailsDisplay } from "./committed-details.js";
import { ownData } from "./identity.js";
import { NoSwipeDialog } from "./no-swipe-dialog.js";
import type {
  DetailsAccessory,
  DetailsCommitActor,
  DetailsMessages,
  DetailsSession,
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

function BoundInterior<S extends QuerySchema, T extends object>({
  props,
  bound,
  titleId,
  descriptionId,
}: {
  props: DetailsShellProps<S, T>;
  bound: NonNullable<ReturnType<typeof getBoundShell<S, T>>>;
  titleId: string;
  descriptionId: string;
}) {
  const { binding, actor } = bound;
  useLayoutEffect(() => {
    binding.focusOnce(actor);
  });
  let ready = false;
  try {
    requireDetailsDisplay(binding.cell.require(actor));
    ready = props.session.context !== null;
  } catch {
    /* No private render/focus port while waiting. */
  }
  const messages = ready
    ? { ...englishDetailsMessages, ...props.messages }
    : englishDetailsMessages;
  return (
    <>
      <Drawer.Header className="tw-details__header">
        <Drawer.Heading
          id={titleId}
          ref={(node) => binding.headingNode(actor, node)}
          tabIndex={-1}
        >
          {ready ? props.title : "Record details"}
        </Drawer.Heading>
        <Button
          variant="tertiary"
          aria-label={messages.close}
          onPress={() => {
            void binding.request(actor, null, "close-button");
          }}
        >
          {messages.cancel}
        </Button>
      </Drawer.Header>
      {ready && props.description ? (
        <p id={descriptionId} className="tw-details__description">
          {props.description}
        </p>
      ) : null}
      {ready && props.session.context?.policyBusy ? (
        <p role="status" className="tw-details__status">
          {messages.checking}
        </p>
      ) : null}
      <BoundContent props={props} bound={bound} />
    </>
  );
}

function BoundContent<S extends QuerySchema, T extends object>({
  props,
  bound,
}: {
  props: DetailsShellProps<S, T>;
  bound: NonNullable<ReturnType<typeof getBoundShell<S, T>>>;
}) {
  const { binding, actor } = bound,
    key = props.session.contentKey;
  let context = props.session.context;
  try {
    requireDetailsDisplay(binding.cell.require(actor));
  } catch {
    context = null;
  }
  let content: ReactNode = null;
  const messages = context
    ? { ...englishDetailsMessages, ...props.messages }
    : englishDetailsMessages;
  if (context) {
    const value = binding.cell.require(actor),
      ports = value.ports;
    if (!ports) throw new Error("Bound details are unavailable.");
    content = ports.renderInterior ? (
      binding.renderSlot(actor, "renderInterior", context)
    ) : (
      <>
        {binding.renderSlot(actor, "renderHeader", context)}
        <Drawer.Body className="tw-details__body">
          {context.status !== "ready" ? (
            <p role="status">
              {context.status === "loading"
                ? messages.loading
                : context.status === "missing"
                  ? messages.missing
                  : context.errorCode
                    ? messages[context.errorCode]
                    : messages.unavailable}
            </p>
          ) : null}
          {props.session.canRetry ? (
            <Button
              variant="secondary"
              onPress={() => {
                void binding.retry(actor);
              }}
            >
              {messages.retry}
            </Button>
          ) : null}
          {binding.renderSlot(actor, "renderBody", context)}
        </Drawer.Body>
        <Drawer.Footer className="tw-details__footer">
          {ports.renderFooter ? (
            binding.renderSlot(actor, "renderFooter", context)
          ) : (
            <Button
              variant="secondary"
              onPress={() => {
                void binding.request(actor, null, "footer");
              }}
            >
              {messages.cancel}
            </Button>
          )}
        </Drawer.Footer>
      </>
    );
  } else content = binding.held(actor, key);
  useLayoutEffect(() => {
    if (context) {
      binding.retain(actor, key, content);
      binding.restoreWaitingFocus(actor, key);
    }
  });
  return (
    <div
      ref={(node) => binding.contentNode(actor, node)}
      hidden={!context}
      inert={!context}
      style={{ display: context ? "contents" : undefined }}
    >
      {content}
    </div>
  );
}

export function DetailsShell<S extends QuerySchema, T extends object>(
  props: DetailsShellProps<S, T>,
) {
  const titleId = useId();
  const descriptionId = useId();
  return shellSurface(props, titleId, descriptionId, null);
}

/** Internal strict entry; only registry-owned metadata is consumed before gates. */
export function BoundDetailsShell<
  S extends QuerySchema,
  T extends object,
>(input: {
  readonly accessory: DetailsAccessory<S, T>;
  readonly actor: DetailsCommitActor<S, T>;
  readonly session: DetailsSession<S, T>;
  readonly token: object;
  readonly direction: "ltr" | "rtl";
}) {
  const titleId = useId(),
    descriptionId = useId();
  try {
    const accessory = ownData(input, "accessory") as DetailsAccessory<S, T>,
      binding = getDetailsBinding(accessory);
    const actor = ownData(input, "actor") as DetailsCommitActor<S, T>,
      session = ownData(input, "session") as DetailsSession<S, T>,
      token = ownData(input, "token"),
      direction = ownData(input, "direction");
    if (!token || typeof token !== "object") return null;
    if (direction !== "ltr" && direction !== "rtl") return null;
    const captured = binding.shell(actor, session, token),
      bound = getBoundShell(captured),
      props: DetailsShellProps<S, T> = { ...captured, direction };
    return shellSurface(props, titleId, descriptionId, bound);
  } catch {
    return null;
  }
}

function shellSurface<S extends QuerySchema, T extends object>(
  props: DetailsShellProps<S, T>,
  titleId: string,
  descriptionId: string,
  bound: ReturnType<typeof getBoundShell<S, T>>,
) {
  // Unmount immediately on accepted close/privacy loss: never animate private data
  // after revocation. Responsive changes never key/remount this overlay.
  if (!props.session.isOpen || (!props.session.context && !bound)) return null;
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
            {bound ? (
              <BoundInterior
                key={props.session.contentKey}
                props={props}
                titleId={titleId}
                descriptionId={descriptionId}
                bound={bound}
              />
            ) : (
              <Interior
                key={props.session.contentKey}
                props={props}
                titleId={titleId}
                descriptionId={descriptionId}
              />
            )}
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
