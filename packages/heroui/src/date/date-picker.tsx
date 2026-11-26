"use client";

import { Calendar } from "@heroui/react/calendar";
import { DateField } from "@heroui/react/date-field";
import { DatePicker } from "@heroui/react/date-picker";
import { DateRangePicker } from "@heroui/react/date-range-picker";
import { Label } from "@heroui/react/label";
import { RangeCalendar } from "@heroui/react/range-calendar";
import type {
  CalendarDate,
  DateValue as VendorDateValue,
} from "@internationalized/date";
import { parseDate, toCalendarDate } from "@internationalized/date";
import type { DatePoint, DateRange } from "@tableweave/react/contracts";
import { useRef, useState } from "react";
import { DateSegmentsObserver } from "./date-segments.js";
import type {
  DateDraft,
  DateEditorMessages,
  DateFieldDefinition,
  FilterDateContext,
} from "./date-types.js";
import { calendarSeed, dayWire, pickerBounds } from "./date-wire.js";

interface DayPickerBase {
  readonly field: DateFieldDefinition;
  readonly context: FilterDateContext;
  readonly disabled: boolean;
  readonly messages: DateEditorMessages;
}
function editingKey(key: string): boolean {
  return (
    key.length === 1 ||
    [
      "Backspace",
      "Delete",
      "ArrowUp",
      "ArrowDown",
      "PageUp",
      "PageDown",
      "Home",
      "End",
    ].includes(key)
  );
}

export function DayPointPicker(
  props: DayPickerBase & {
    readonly label: string;
    readonly initialValue: DatePoint | null;
    readonly onDraft: (draft: DateDraft<DatePoint>) => void;
  },
) {
  const [value, setValue] = useState<CalendarDate | null>(() =>
    props.initialValue?.kind === "day"
      ? parseDate(props.initialValue.value)
      : null,
  );
  const blocked = useRef(false);
  const bounds = pickerBounds(props.field, props.context);
  const seed = calendarSeed(props.context);
  function observe(draft: DateDraft<VendorDateValue>) {
    if (draft.status !== "complete") {
      if (draft.status === "invalid") blocked.current = true;
      props.onDraft(draft);
    } else if (blocked.current) {
      props.onDraft({ status: "invalid", value: null });
    } else {
      props.onDraft({
        status: "complete",
        value: dayWire(toCalendarDate(draft.value)),
      });
    }
  }
  return (
    <DatePicker
      value={value}
      onChange={(next) => {
        if (!blocked.current) setValue(next);
      }}
      placeholderValue={seed}
      minValue={bounds.min}
      maxValue={bounds.max}
      granularity="day"
      isDisabled={props.disabled}
      validationBehavior="aria"
    >
      <Label>{props.label}</Label>
      <DateField.Group variant="secondary">
        <div
          onKeyDownCapture={(event) => {
            if (editingKey(event.key) && !event.ctrlKey && !event.metaKey) {
              blocked.current = false;
              props.onDraft({ status: "incomplete", value: null });
            }
          }}
        >
          <DateField.Input>
            {(segment) => (
              <>
                {segment.type === "year" ? (
                  <DateSegmentsObserver onDraft={observe} />
                ) : null}
                <DateField.Segment segment={segment} />
              </>
            )}
          </DateField.Input>
        </div>
        <DateField.Suffix>
          <DatePicker.Trigger aria-label={props.messages.chooseDateLabel}>
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      <DatePicker.Popover>
        <Calendar
          aria-label={props.label}
          defaultFocusedValue={value ?? seed}
          minValue={bounds.min}
          maxValue={bounds.max}
          onChange={(next) => {
            blocked.current = false;
            setValue(toCalendarDate(next));
            props.onDraft({
              status: "complete",
              value: dayWire(toCalendarDate(next)),
            });
          }}
        >
          <Calendar.Header>
            <Calendar.Heading />
            <Calendar.NavButton
              slot="previous"
              aria-label={props.messages.previousMonthLabel}
            />
            <Calendar.NavButton
              slot="next"
              aria-label={props.messages.nextMonthLabel}
            />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>
              {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => <Calendar.Cell date={date} />}
            </Calendar.GridBody>
          </Calendar.Grid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  );
}

export function DayRangePicker(
  props: DayPickerBase & {
    readonly initialValue: DateRange | null;
    readonly onDraft: (draft: DateDraft<DateRange>) => void;
  },
) {
  const [value, setValue] = useState<{
    start: CalendarDate;
    end: CalendarDate;
  } | null>(() =>
    props.initialValue?.[0].kind === "day" &&
    props.initialValue[1].kind === "day"
      ? {
          start: parseDate(props.initialValue[0].value),
          end: parseDate(props.initialValue[1].value),
        }
      : null,
  );
  const parts = useRef<{
    start: DateDraft<DatePoint>;
    end: DateDraft<DatePoint>;
  }>({
    start: { status: "empty", value: null },
    end: { status: "empty", value: null },
  });
  const blocked = useRef({ start: false, end: false });
  const bounds = pickerBounds(props.field, props.context);
  const seed = calendarSeed(props.context);
  function observe(part: "start" | "end", draft: DateDraft<VendorDateValue>) {
    if (draft.status === "invalid") blocked.current[part] = true;
    parts.current[part] =
      draft.status === "complete"
        ? blocked.current[part]
          ? { status: "invalid", value: null }
          : { status: "complete", value: dayWire(toCalendarDate(draft.value)) }
        : draft;
    const { start, end } = parts.current;
    if (start.status === "complete" && end.status === "complete")
      props.onDraft({ status: "complete", value: [start.value, end.value] });
    else
      props.onDraft({
        status:
          start.status === "invalid" || end.status === "invalid"
            ? "invalid"
            : start.status === "empty" && end.status === "empty"
              ? "empty"
              : "incomplete",
        value: null,
      });
  }
  return (
    <DateRangePicker
      value={value}
      onChange={(next) => {
        if (!blocked.current.start && !blocked.current.end) setValue(next);
      }}
      placeholderValue={seed}
      minValue={bounds.min}
      maxValue={bounds.max}
      granularity="day"
      isDisabled={props.disabled}
      validationBehavior="aria"
    >
      <Label>{props.messages.pointLabel}</Label>
      <DateField.Group variant="secondary">
        <DateField.InputContainer>
          {(["start", "end"] as const).map((part) => (
            <span
              key={part}
              className="tw-date-range-part"
              onKeyDownCapture={(event) => {
                if (editingKey(event.key) && !event.ctrlKey && !event.metaKey) {
                  blocked.current[part] = false;
                  props.onDraft({ status: "incomplete", value: null });
                }
              }}
            >
              <DateField.Input
                slot={part}
                aria-label={
                  part === "start"
                    ? props.messages.startLabel
                    : props.messages.endLabel
                }
              >
                {(segment) => (
                  <>
                    {segment.type === "year" ? (
                      <DateSegmentsObserver
                        onDraft={(draft) => observe(part, draft)}
                      />
                    ) : null}
                    <DateField.Segment segment={segment} />
                  </>
                )}
              </DateField.Input>
              {part === "start" ? <DateRangePicker.RangeSeparator /> : null}
            </span>
          ))}
        </DateField.InputContainer>
        <DateField.Suffix>
          <DateRangePicker.Trigger aria-label={props.messages.chooseDateLabel}>
            <DateRangePicker.TriggerIndicator />
          </DateRangePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      <DateRangePicker.Popover>
        <RangeCalendar
          aria-label={props.messages.pointLabel}
          defaultFocusedValue={value?.start ?? seed}
          minValue={bounds.min}
          maxValue={bounds.max}
          onChange={(next) => {
            blocked.current = { start: false, end: false };
            setValue({
              start: toCalendarDate(next.start),
              end: toCalendarDate(next.end),
            });
            props.onDraft({
              status: "complete",
              value: [
                dayWire(toCalendarDate(next.start)),
                dayWire(toCalendarDate(next.end)),
              ],
            });
          }}
        >
          <RangeCalendar.Header>
            <RangeCalendar.Heading />
            <RangeCalendar.NavButton
              slot="previous"
              aria-label={props.messages.previousMonthLabel}
            />
            <RangeCalendar.NavButton
              slot="next"
              aria-label={props.messages.nextMonthLabel}
            />
          </RangeCalendar.Header>
          <RangeCalendar.Grid>
            <RangeCalendar.GridHeader>
              {(day) => (
                <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>
              )}
            </RangeCalendar.GridHeader>
            <RangeCalendar.GridBody>
              {(date) => <RangeCalendar.Cell date={date} />}
            </RangeCalendar.GridBody>
          </RangeCalendar.Grid>
        </RangeCalendar>
      </DateRangePicker.Popover>
    </DateRangePicker>
  );
}
