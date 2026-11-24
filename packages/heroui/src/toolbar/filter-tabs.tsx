"use client";

import { Tabs } from "@heroui/react/tabs";
import type { QueryFor, QuerySchema } from "@tableweave/react/contracts";
import type { ReactNode } from "react";
import { useId, useLayoutEffect, useRef, useState } from "react";
import type {
  CriteriaActor,
  CriteriaCommitCell,
  CriteriaLocalCell,
} from "../filters/criteria-commit.js";
import type {
  CriteriaToolbarStore,
  ToolbarCommitted,
} from "./criteria-tool-host.js";
import {
  CriteriaToolbarNeutral,
  CriteriaToolHost,
  useCriteriaToolbarVersion,
} from "./criteria-tool-host.js";
import type { FilterToolMessages, FilterToolProps } from "./filter-shared.js";
import {
  filterToolMessages,
  observeMutation,
  useFilterOwner,
} from "./filter-shared.js";

export interface FilterTabPresentation {
  readonly label: string;
  readonly disabled?: boolean;
  readonly count?: {
    readonly value: number;
    /** Application-defined meaning; never inferred from a loaded page. */
    readonly description: string;
  };
}
export interface FilterTabsMessages extends FilterToolMessages {
  readonly label: string;
  readonly previousTabsLabel: string;
  readonly nextTabsLabel: string;
}
export interface FilterTabsProps<S extends QuerySchema>
  extends FilterToolProps<S> {
  readonly tabs: Readonly<
    Record<NonNullable<QueryFor<S>["tabId"]>, FilterTabPresentation>
  >;
  /** Required to present the accepted nullable/neutral tab state. */
  readonly neutralTab?: FilterTabPresentation;
  readonly activation?: "manual" | "automatic";
  readonly messages?: Partial<FilterTabsMessages>;
  /** The single actual results subtree, not a per-tab renderer. */
  readonly children: ReactNode;
}
const defaults: FilterTabsMessages = {
  ...filterToolMessages,
  label: "Filter records by tab",
  previousTabsLabel: "Previous filter tabs",
  nextTabsLabel: "Next filter tabs",
};

export function FilterTabs<S extends QuerySchema>(props: FilterTabsProps<S>) {
  return (
    <CriteriaToolHost<"tabs", S, CriteriaTabsLocal<S>, FilterTabsProps<S>>
      kind="tabs"
      input={props}
      createLocal={createCriteriaTabsLocal}
      Legacy={LegacyFilterTabs}
      Surface={CriteriaTabsSurface}
    />
  );
}

function LegacyFilterTabs<S extends QuerySchema>(props: FilterTabsProps<S>) {
  const messages = { ...defaults, ...props.messages };
  const { state, owner, active, isCurrent } = useFilterOwner(props);
  const schema = props.controller.getDefinition().schema;
  const id = useId();
  const scroller = useRef<HTMLDivElement | null>(null);
  const root = useRef<HTMLDivElement | null>(null);
  const [panelLink, setPanelLink] = useState<{
    key: string;
    id: string;
  } | null>(null);
  const [notice, setNotice] = useState<{ owner: object; text: string } | null>(
    null,
  );
  // Not a schema ID: '#' cannot occur in a validated schema tab ID.
  const neutralKey = `#neutral${id}`;
  const entries = (schema.tabs ?? []).map((tab) => ({
    key: tab.id,
    tabId: tab.id,
    presentation: props.tabs[tab.id as NonNullable<QueryFor<S>["tabId"]>],
  }));
  const configured =
    entries.length > 0 &&
    entries.every((entry) => !!entry.presentation?.label) &&
    (state.query.tabId !== null || !!props.neutralTab?.label);
  const acceptedKey = state.query.tabId ?? neutralKey;
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const associate = () => {
      const selected = element.querySelector(
        '[role="tab"][aria-selected="true"]',
      );
      const target = selected?.getAttribute("aria-controls");
      if (target)
        setPanelLink((previous) =>
          previous?.key === acceptedKey && previous.id === target
            ? previous
            : { key: acceptedKey, id: target },
        );
    };
    associate();
    // RAC can populate its collection after the parent's initial layout effect.
    const observer = new MutationObserver(associate);
    observer.observe(element, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-controls", "aria-selected"],
    });
    return () => observer.disconnect();
  }, [acceptedKey]);
  const allEntries =
    props.neutralTab || state.query.tabId === null
      ? [
          {
            key: neutralKey,
            tabId: null,
            presentation: props.neutralTab ?? {
              label: messages.invalidConfiguration,
              disabled: true,
            },
          },
          ...entries,
        ]
      : entries;
  function scroll(direction: number) {
    const element = scroller.current;
    if (!element) return;
    const rtl = getComputedStyle(element).direction === "rtl";
    element.scrollBy({
      left: direction * element.clientWidth * 0.8 * (rtl ? -1 : 1),
      behavior: "smooth",
    });
  }
  return (
    <div ref={root} className={`tw-filter-tabs ${props.className ?? ""}`}>
      {!configured ? <p role="alert">{messages.invalidConfiguration}</p> : null}
      {!active ? <p role="status">{messages.unavailable}</p> : null}
      <Tabs
        selectedKey={acceptedKey}
        keyboardActivation={props.activation ?? "manual"}
        isDisabled={!active || !configured}
        variant="secondary"
        onSelectionChange={(key) => {
          if (!isCurrent() || !configured) return;
          const entry = allEntries.find((item) => item.key === key);
          if (!entry || entry.presentation?.disabled) return;
          try {
            // Collection entries originate only from this controller's schema.
            const result = props.controller.dispatch({
              type: "tabs.change",
              tabId: entry.tabId as QueryFor<S>["tabId"],
            });
            setNotice({
              owner,
              text:
                result.status === "proposed"
                  ? messages.submitted
                  : result.status === "rejected"
                    ? messages.failed
                    : "",
            });
            observeMutation(props.onMutation, result);
          } catch {
            setNotice({ owner, text: messages.failed });
          }
        }}
      >
        <div className="tw-filter-tabs-navigation">
          <button
            type="button"
            aria-label={messages.previousTabsLabel}
            onClick={() => scroll(-1)}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <div className="tw-filter-tabs-scroll" ref={scroller}>
            <Tabs.List aria-label={messages.label}>
              {allEntries.map((entry) => {
                const presentation = entry.presentation;
                const count = presentation?.count;
                return (
                  <Tabs.Tab
                    key={entry.key}
                    id={entry.key}
                    isDisabled={!configured || presentation?.disabled === true}
                    {...(count
                      ? { "aria-describedby": `${id}-${entry.key}-count` }
                      : {})}
                  >
                    {presentation?.label ?? messages.invalidConfiguration}
                    {count ? (
                      <span
                        className="tw-filter-tabs-count"
                        id={`${id}-${entry.key}-count`}
                        aria-hidden="true"
                      >
                        <span className="tw-filter-status">
                          {count.description}:{" "}
                        </span>
                        {new Intl.NumberFormat(state.query.locale).format(
                          count.value,
                        )}
                      </span>
                    ) : null}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                );
              })}
            </Tabs.List>
          </div>
          <button
            type="button"
            aria-label={messages.nextTabsLabel}
            onClick={() => scroll(1)}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
        {/* Changing collection id is intentional; a React key would remount results. */}
        <Tabs.Panel
          id={acceptedKey}
          render={(domProps) => (
            <div
              {...domProps}
              // RAC useLabels retains the original DOM id when the collection id
              // changes. Reuse the selected tab's public aria-controls verbatim.
              id={panelLink?.key === acceptedKey ? panelLink.id : domProps.id}
            />
          )}
        >
          {props.children}
        </Tabs.Panel>
      </Tabs>
      <span className="tw-filter-status" role="status">
        {notice?.owner === owner && active ? notice.text : ""}
      </span>
    </div>
  );
}

export interface CriteriaTabsLocal<S extends QuerySchema> {
  readonly notice: CriteriaLocalCell<"tabs", S, string>;
  readonly panelLink: CriteriaLocalCell<
    "tabs",
    S,
    Readonly<{ key: string; id: string }>
  >;
}
export function createCriteriaTabsLocal<S extends QuerySchema>(
  cell: CriteriaCommitCell<"tabs", S>,
): CriteriaTabsLocal<S> {
  return Object.freeze({
    notice: cell.createLocal("notice"),
    panelLink:
      cell.createLocal<Readonly<{ key: string; id: string }>>("session"),
  });
}
type TabsStore<S extends QuerySchema> = CriteriaToolbarStore<
  "tabs",
  S,
  CriteriaTabsLocal<S>
>;
type TabsFrame<S extends QuerySchema> = ToolbarCommitted<
  "tabs",
  S,
  CriteriaTabsLocal<S>
>;
function tabsLive<S extends QuerySchema>(
  frame: TabsFrame<S>,
  neutralKey: string,
) {
  frame.cell.require(frame.actor);
  const controller = frame.origin.controller,
    definition = controller.getDefinition(),
    state = controller.getSnapshot();
  frame.cell.require(frame.actor);
  if (definition !== frame.origin.definition)
    throw new Error("Criteria tabs unavailable.");
  const messages = { ...defaults, ...frame.ports.messages };
  const entries = (definition.schema.tabs ?? []).map((tab) => ({
    key: tab.id,
    tabId: tab.id as QueryFor<S>["tabId"],
    presentation: frame.ports.tabs[tab.id as NonNullable<QueryFor<S>["tabId"]>],
  }));
  const configured =
    entries.length > 0 &&
    entries.every((entry) => !!entry.presentation?.label) &&
    (state.query.tabId !== null || !!frame.ports.neutralTab?.label);
  const allEntries =
    frame.ports.neutralTab || state.query.tabId === null
      ? [
          {
            key: neutralKey,
            tabId: null as QueryFor<S>["tabId"],
            presentation: frame.ports.neutralTab ?? {
              label: messages.invalidConfiguration,
              disabled: true,
            },
          },
          ...entries,
        ]
      : entries;
  frame.cell.require(frame.actor);
  return {
    state,
    messages,
    configured,
    allEntries,
    acceptedKey: state.query.tabId ?? neutralKey,
  };
}
export function selectCriteriaTab<S extends QuerySchema>(
  store: TabsStore<S>,
  actor: CriteriaActor<"tabs", S>,
  key: string,
  neutralKey: string,
): void {
  try {
    const frame = store.require(actor),
      live = tabsLive(frame, neutralKey);
    if (frame.disabled || !live.configured) return;
    const entry = live.allEntries.find((item) => item.key === key);
    if (!entry || entry.presentation?.disabled) return;
    // Live schema/selection capability and baseline immediately before dispatch.
    store.require(actor);
    const final = tabsLive(frame, neutralKey);
    const eligible = final.allEntries.find((item) => item.key === key);
    if (
      !final.configured ||
      !eligible ||
      eligible.presentation?.disabled ||
      final.state.query.tabId !== live.state.query.tabId
    )
      return;
    const result = frame.origin.controller.dispatch({
      type: "tabs.change",
      tabId: eligible.tabId,
    });
    store.require(actor);
    const after = tabsLive(frame, neutralKey);
    frame.local.notice.write(
      actor,
      result.status === "proposed"
        ? after.messages.submitted
        : result.status === "rejected"
          ? after.messages.failed
          : "",
    );
    store.require(actor);
    tabsLive(frame, neutralKey);
    observeMutation(frame.ports.onMutation, result);
    store.require(actor);
    tabsLive(frame, neutralKey);
  } catch {
    try {
      const frame = store.require(actor);
      frame.local.notice.write(
        actor,
        tabsLive(frame, neutralKey).messages.failed,
      );
    } catch {
      /* Revoked actor never reads replacement ports. */
    }
  }
}

function CriteriaTabsSurface<S extends QuerySchema>({
  store,
}: {
  readonly store: TabsStore<S>;
}) {
  useCriteriaToolbarVersion(store);
  const frame = store.read(),
    actor = frame?.actor;
  const id = useId(),
    neutralKey = `#neutral${id}`;
  const root = useRef<HTMLDivElement | null>(null),
    scroller = useRef<HTMLDivElement | null>(null);
  let live: ReturnType<typeof tabsLive<S>> | null = null;
  try {
    if (frame) live = tabsLive(frame, neutralKey);
  } catch {
    /* Neutral. */
  }
  const acceptedKey = live?.acceptedKey;
  useLayoutEffect(() => {
    if (!actor || !acceptedKey || !root.current) return;
    const element = root.current;
    const associate = () => {
      try {
        const current = store.require(actor),
          state = tabsLive(current, neutralKey);
        if (state.acceptedKey !== acceptedKey) return;
        const selected = element.querySelector(
            '[role="tab"][aria-selected="true"]',
          ),
          target = selected?.getAttribute("aria-controls");
        store.require(actor);
        if (target) {
          const prior = current.local.panelLink.read(actor);
          if (prior?.key !== acceptedKey || prior.id !== target)
            current.local.panelLink.write(actor, {
              key: acceptedKey,
              id: target,
            });
        }
      } catch {
        /* MutationObserver is not an authority or reset proof. */
      }
    };
    associate();
    const observer = new MutationObserver(associate);
    observer.observe(element, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-controls", "aria-selected"],
    });
    return () => observer.disconnect();
  }, [store, actor, acceptedKey, neutralKey]);
  if (!frame || !actor || !live) return <CriteriaToolbarNeutral kind="tabs" />;
  try {
    const {
      state,
      messages,
      configured,
      allEntries,
      acceptedKey: selectedKey,
    } = live;
    const active = !frame.disabled,
      panelLink = frame.local.panelLink.read(actor),
      notice = active ? (frame.local.notice.read(actor) ?? "") : "";
    const capturedActor = actor;
    function scroll(direction: number) {
      try {
        store.require(capturedActor);
        const element = scroller.current;
        if (!element) return;
        const rtl = getComputedStyle(element).direction === "rtl";
        store.require(capturedActor);
        element.scrollBy({
          left: direction * element.clientWidth * 0.8 * (rtl ? -1 : 1),
          behavior: "smooth",
        });
        store.require(capturedActor);
      } catch {
        /* Denied. */
      }
    }
    const output = (
      <div ref={root} className={`tw-filter-tabs ${frame.className}`}>
        {!configured ? (
          <p role="alert">{messages.invalidConfiguration}</p>
        ) : null}
        {!active ? <p role="status">{messages.unavailable}</p> : null}
        <Tabs
          selectedKey={selectedKey}
          keyboardActivation={frame.ports.activation ?? "manual"}
          isDisabled={!active || !configured}
          variant="secondary"
          onSelectionChange={(key) => {
            if (typeof key === "string")
              selectCriteriaTab(store, actor, key, neutralKey);
          }}
        >
          <div className="tw-filter-tabs-navigation">
            <button
              type="button"
              aria-label={messages.previousTabsLabel}
              onClick={() => scroll(-1)}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <div className="tw-filter-tabs-scroll" ref={scroller}>
              <Tabs.List aria-label={messages.label}>
                {allEntries.map((entry) => {
                  frame.cell.require(actor);
                  const presentation = entry.presentation,
                    count = presentation?.count;
                  return (
                    <Tabs.Tab
                      key={entry.key}
                      id={entry.key}
                      isDisabled={
                        !configured || presentation?.disabled === true
                      }
                      {...(count
                        ? { "aria-describedby": `${id}-${entry.key}-count` }
                        : {})}
                    >
                      {presentation?.label ?? messages.invalidConfiguration}
                      {count ? (
                        <span
                          className="tw-filter-tabs-count"
                          id={`${id}-${entry.key}-count`}
                          aria-hidden="true"
                        >
                          <span className="tw-filter-status">
                            {count.description}:{" "}
                          </span>
                          {new Intl.NumberFormat(state.query.locale).format(
                            count.value,
                          )}
                        </span>
                      ) : null}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  );
                })}
              </Tabs.List>
            </div>
            <button
              type="button"
              aria-label={messages.nextTabsLabel}
              onClick={() => scroll(1)}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
          <Tabs.Panel
            id={selectedKey}
            render={(domProps) => {
              try {
                store.require(actor);
                const node = (
                  <div
                    {...domProps}
                    id={
                      panelLink?.key === selectedKey
                        ? panelLink.id
                        : domProps.id
                    }
                  />
                );
                store.require(actor);
                return node;
              } catch {
                return <div />;
              }
            }}
          >
            {frame.ports.children}
          </Tabs.Panel>
        </Tabs>
        <span className="tw-filter-status" role="status">
          {notice}
        </span>
      </div>
    );
    frame.cell.require(actor);
    return output;
  } catch {
    return <CriteriaToolbarNeutral kind="tabs" />;
  }
}
