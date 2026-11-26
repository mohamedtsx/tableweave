"use client";

import { Button } from "@heroui/react/button";
import { Popover } from "@heroui/react/popover";
import type { QuerySchema } from "@tableweave/react/contracts";
import { useId } from "react";
import {
  captureOptions,
  captureTarget,
  dataLeaves,
  isAvailable,
} from "../columns/model.js";
import type { SortAction } from "./model.js";
import { changeSort } from "./model.js";
import type { SortingMessages, SortingProps } from "./types.js";

export const defaultSortingMessages: SortingMessages = Object.freeze({
  trigger: "Sort",
  title: "Sorting",
  priorities: "Sort priority",
  none: "No sorting applied",
  ascending: "Ascending",
  descending: "Descending",
  remove: "Remove",
  addAscending: "Add ascending",
  addDescending: "Add descending",
  hidden: "Hidden column",
  unavailable: "Sorting controls are unavailable",
  disabled: "Sorting changes are disabled",
  unsortable: "Sorting is not enabled for this column",
  singleOnly: "This column supports single sorting only",
  actionName: (action: string, label: string) => `${action}: ${label}`,
  priority: (
    position: string,
    label: string,
    direction: string,
    visibility: string,
  ) =>
    `${position}. ${label}: ${direction}${visibility ? ` (${visibility})` : ""}`,
});

export function Sorting<S extends QuerySchema, T extends object>(
  input: SortingProps<S, T>,
) {
  const props = { ...input };
  const target = captureTarget(props);
  const options = captureOptions(props);
  const messages = Object.freeze({
    ...(props.messages ?? defaultSortingMessages),
  });
  for (const key of Object.keys(
    defaultSortingMessages,
  ) as (keyof SortingMessages)[]) {
    const value = messages[key];
    if (
      typeof value !== typeof defaultSortingMessages[key] ||
      (typeof value === "string" && !value.trim())
    )
      throw new TypeError("Invalid sorting messages");
  }
  const generated = useId();
  const id = props.id ?? generated;
  const available = isAvailable(target);
  const leaves = available ? dataLeaves(target, options.labels) : [];
  const sorting = available ? target.state.query.sorting : [];
  const disabled = options.isDisabled === true || !available;
  const reason = !available
    ? messages.unavailable
    : (options.disabledReason ?? messages.disabled);
  const actions: readonly (readonly [SortAction, string])[] = [
    ["ascending", messages.ascending],
    ["descending", messages.descending],
    ["remove", messages.remove],
    ...(target.definition.multiSort
      ? ([
          ["add-ascending", messages.addAscending],
          ["add-descending", messages.addDescending],
        ] as const)
      : []),
  ];
  return (
    <div id={id} className={`tw-sorting ${options.className ?? ""}`}>
      <Popover>
        <Button
          variant="tertiary"
          isDisabled={disabled}
          {...(disabled ? { "aria-describedby": `${id}-reason` } : {})}
        >
          {messages.trigger}
        </Button>
        {/* HeroUI 3.2.8: avoid exit-retained rapid-reopen focus/Escape loss here. */}
        <Popover.Content
          shouldSkipAnimation
          className="tw-column-controls-popover"
          placement="bottom end"
        >
          <Popover.Dialog>
            <Popover.Heading>{messages.title}</Popover.Heading>
            <h3 className="tw-sorting-priority">{messages.priorities}</h3>
            <div aria-live="polite" aria-atomic="true">
              {sorting.length ? (
                <ol
                  className="tw-sorting-priorities"
                  aria-label={messages.priorities}
                >
                  {sorting.map((sort, index) => (
                    <li key={sort.id}>
                      {messages.priority(
                        String(index + 1),
                        leaves.find((leaf) => leaf.id === sort.id)?.label ??
                          sort.id,
                        sort.desc ? messages.descending : messages.ascending,
                        target.state.columns.visibility[sort.id] === false
                          ? messages.hidden
                          : "",
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="tw-sorting-priority">{messages.none}</p>
              )}
            </div>
            <div className="tw-sorting-fields">
              {leaves.map((leaf, index) => {
                const fieldReasonId = `${id}-field-${index}-reason`;
                const restriction = !leaf.sortable
                  ? messages.unsortable
                  : target.definition.multiSort && !leaf.multiSortable
                    ? messages.singleOnly
                    : null;
                return (
                  <div className="tw-sorting-field" key={leaf.id}>
                    <strong>{leaf.label}</strong>
                    <div className="tw-sorting-actions">
                      {actions.map(([action, label]) => {
                        const additiveBlocked =
                          action.startsWith("add-") &&
                          (!leaf.multiSortable ||
                            sorting.some(
                              (sort) =>
                                !leaves.find((item) => item.id === sort.id)
                                  ?.multiSortable,
                            ));
                        return (
                          <Button
                            key={action}
                            size="sm"
                            variant="tertiary"
                            aria-label={messages.actionName(label, leaf.label)}
                            {...(restriction
                              ? { "aria-describedby": fieldReasonId }
                              : {})}
                            isDisabled={
                              disabled ||
                              !leaf.sortable ||
                              additiveBlocked ||
                              (action === "remove" &&
                                !sorting.some((item) => item.id === leaf.id))
                            }
                            onPress={() =>
                              changeSort(target, options, leaf.id, action)
                            }
                          >
                            {label}
                          </Button>
                        );
                      })}
                    </div>
                    {restriction ? (
                      <p
                        id={fieldReasonId}
                        className="tw-column-controls-reason"
                      >
                        {restriction}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
      {disabled ? (
        <p id={`${id}-reason`} className="tw-column-controls-reason">
          {reason}
        </p>
      ) : null}
    </div>
  );
}
