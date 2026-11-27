"use client";

import { Button } from "@heroui/react/button";
import { Checkbox } from "@heroui/react/checkbox";
import { Popover } from "@heroui/react/popover";
import type { QuerySchema } from "@tableweave/react/contracts";
import { useId } from "react";
import {
  captureOptions,
  captureTarget,
  dataLeaves,
  isAvailable,
  setVisible,
  visibleCount,
} from "./model.js";
import type { ColumnChooserMessages, ColumnChooserProps } from "./types.js";

export const defaultColumnChooserMessages: ColumnChooserMessages =
  Object.freeze({
    trigger: "Columns",
    title: "Shown columns",
    required: "Required column",
    finalVisible: "At least one data column must remain visible",
    unavailable: "Column controls are unavailable",
    disabled: "Column changes are disabled",
  });

export function ColumnChooser<S extends QuerySchema, T extends object>(
  input: ColumnChooserProps<S, T>,
) {
  const props = { ...input };
  const target = captureTarget(props);
  const options = captureOptions(props);
  const messages = Object.freeze({
    ...(props.messages ?? defaultColumnChooserMessages),
  });
  if (
    Object.keys(defaultColumnChooserMessages).some(
      (key) =>
        typeof messages[key as keyof ColumnChooserMessages] !== "string" ||
        !messages[key as keyof ColumnChooserMessages].trim(),
    )
  )
    throw new TypeError("Invalid column chooser messages");
  const generated = useId();
  const id = props.id ?? generated;
  const available = isAvailable(target);
  const leaves = available ? dataLeaves(target, options.labels) : [];
  const count = visibleCount(target.state, leaves);
  const disabled = options.isDisabled === true || !available;
  const reason = !available
    ? messages.unavailable
    : (options.disabledReason ?? messages.disabled);
  return (
    <div className={`tw-column-chooser ${options.className ?? ""}`} id={id}>
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
            <div className="tw-column-chooser-list">
              {leaves.map((leaf, index) => {
                const checked =
                  target.state.columns.visibility[leaf.id] !== false;
                const restriction = !leaf.hideable
                  ? messages.required
                  : checked && count === 1
                    ? messages.finalVisible
                    : null;
                const descriptionId = `${id}-leaf-${index}-reason`;
                return (
                  <div key={leaf.id} className="tw-column-chooser-item">
                    <Checkbox
                      isSelected={checked}
                      isDisabled={disabled || restriction !== null}
                      {...(restriction
                        ? { "aria-describedby": descriptionId }
                        : {})}
                      onChange={(visible) =>
                        setVisible(target, options, leaf.id, visible)
                      }
                    >
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <bdi>{leaf.label}</bdi>
                      </Checkbox.Content>
                    </Checkbox>
                    {restriction ? (
                      <p
                        id={descriptionId}
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
