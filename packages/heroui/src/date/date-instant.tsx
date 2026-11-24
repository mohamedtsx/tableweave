"use client";

import { Input } from "@heroui/react/input";
import { Label } from "@heroui/react/label";
import { TextField } from "@heroui/react/textfield";
import { TimeField } from "@heroui/react/time-field";
import type {
  CalendarDateTime,
  DateValue as VendorDateValue,
} from "@internationalized/date";
import {
  fromAbsolute,
  parseDate,
  toCalendarDateTime,
} from "@internationalized/date";
import type { DatePoint } from "@tableweave/react/contracts";
import { useId, useRef, useState } from "react";
import { DayPointPicker } from "./date-picker.js";
import { DateSegmentsObserver } from "./date-segments.js";
import type {
  DateDraft,
  DateEditorMessages,
  DateFieldDefinition,
  FilterDateContext,
} from "./date-types.js";
import {
  instantWallTime,
  parseInstantInput,
  wallTimeWire,
} from "./date-wire.js";

export function InstantPointEditor(props: {
  readonly label: string;
  readonly initialValue: DatePoint | null;
  readonly field: DateFieldDefinition;
  readonly context: FilterDateContext;
  readonly messages: DateEditorMessages;
  readonly disabled: boolean;
  readonly onDraft: (draft: DateDraft<DatePoint>) => void;
}) {
  const initial =
    props.initialValue?.kind === "instant" ? props.initialValue : null;
  const [text, setText] = useState(initial?.value ?? "");
  const [time, setTime] = useState<CalendarDateTime | null>(() =>
    initial ? instantWallTime(initial, props.context) : null,
  );
  const [error, setError] = useState("");
  const [controlsKey, setControlsKey] = useState(0);
  const blocked = useRef(false);
  const controlsDirty = useRef(false);
  const day = useRef<DateDraft<DatePoint>>(
    initial
      ? {
          status: "complete",
          value: {
            kind: "day",
            value: instantWallTime(initial, props.context)
              .toString()
              .slice(0, 10),
          },
        }
      : { status: "empty", value: null },
  );
  const clock = useRef<DateDraft<CalendarDateTime>>(
    initial
      ? { status: "complete", value: instantWallTime(initial, props.context) }
      : { status: "empty", value: null },
  );
  const hintId = useId();
  const seed = toCalendarDateTime(
    fromAbsolute(props.context.evaluatedAt, props.context.timeZone),
  );
  function combine() {
    // The exact ISO path is authoritative. Mounting convenience controls must not
    // re-resolve an already explicit fold offset or replace millisecond precision.
    if (!controlsDirty.current) return;
    const date = day.current;
    const timePart = clock.current;
    if (date.status !== "complete" || timePart.status !== "complete") {
      props.onDraft({
        status:
          date.status === "invalid" || timePart.status === "invalid"
            ? "invalid"
            : "incomplete",
        value: null,
      });
      return;
    }
    try {
      const parsed = parseDate(date.value.value);
      const wall = timePart.value.set({
        year: parsed.year,
        month: parsed.month,
        day: parsed.day,
      });
      const value = wallTimeWire(wall, props.context);
      setText(value.value);
      setError("");
      props.onDraft({ status: "complete", value });
    } catch {
      setError(props.messages.ambiguousTime);
      props.onDraft({ status: "invalid", value: null });
    }
  }
  function observeTime(draft: DateDraft<VendorDateValue>) {
    if (draft.status === "invalid") blocked.current = true;
    clock.current =
      draft.status === "complete"
        ? blocked.current
          ? { status: "invalid", value: null }
          : { status: "complete", value: toCalendarDateTime(draft.value) }
        : draft;
    combine();
  }
  return (
    <div className="tw-date-instant">
      <TextField
        value={text}
        onChange={(next) => {
          controlsDirty.current = false;
          setText(next);
          setError("");
          const value = parseInstantInput(next, props.field, props.context);
          if (value) {
            const wall = instantWallTime(value, props.context);
            day.current = {
              status: "complete",
              value: { kind: "day", value: wall.toString().slice(0, 10) },
            };
            clock.current = { status: "complete", value: wall };
            blocked.current = false;
            setTime(wall);
            // Reset only convenience inputs after an explicit exact ISO edit.
            setControlsKey((key) => key + 1);
            props.onDraft({ status: "complete", value });
          } else {
            props.onDraft({
              status: next === "" ? "empty" : "invalid",
              value: null,
            });
          }
        }}
        isDisabled={props.disabled}
        aria-describedby={hintId}
      >
        <Label>{`${props.label} — ${props.messages.exactInstantLabel}`}</Label>
        <Input spellCheck={false} autoComplete="off" />
      </TextField>
      <p id={hintId} className="tw-date-hint">
        {props.messages.exactInstantHint}
      </p>
      <div
        key={controlsKey}
        className="tw-date-instant-fields"
        onKeyDownCapture={() => {
          controlsDirty.current = true;
        }}
        onPointerDownCapture={() => {
          controlsDirty.current = true;
        }}
      >
        <DayPointPicker
          label={props.label}
          initialValue={
            day.current.status === "complete" ? day.current.value : null
          }
          field={props.field}
          context={props.context}
          disabled={props.disabled}
          messages={props.messages}
          onDraft={(draft) => {
            day.current = draft;
            combine();
          }}
        />
        <TimeField
          value={time}
          placeholderValue={seed}
          onChange={(next) => {
            if (!blocked.current) setTime(next);
          }}
          granularity="second"
          isDisabled={props.disabled}
          validationBehavior="aria"
        >
          <Label>{props.messages.timeLabel}</Label>
          <TimeField.Group variant="secondary">
            <div
              onKeyDownCapture={(event) => {
                if (
                  event.key !== "Tab" &&
                  event.key !== "Shift" &&
                  !event.ctrlKey &&
                  !event.metaKey
                ) {
                  blocked.current = false;
                  clock.current = { status: "incomplete", value: null };
                  props.onDraft({ status: "incomplete", value: null });
                }
              }}
            >
              <TimeField.Input>
                {(segment) => (
                  <>
                    {segment.type === "hour" ? (
                      <DateSegmentsObserver onDraft={observeTime} />
                    ) : null}
                    <TimeField.Segment segment={segment} />
                  </>
                )}
              </TimeField.Input>
            </div>
          </TimeField.Group>
        </TimeField>
      </div>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
