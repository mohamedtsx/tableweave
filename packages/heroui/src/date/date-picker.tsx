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
import type {
  CriteriaDateStateHandle,
  CriteriaDateStateProps,
} from "./criteria-date-state.js";
import {
  criteriaDateChild,
  criteriaDateState,
  readCriteriaDateState,
  requireCriteriaDateState,
  useCriteriaDateRoute,
  useCriteriaDateVersion,
} from "./criteria-date-state.js";
import { DateSegmentsObserver } from "./date-segments.js";
import type {
  DateDraft,
  DateEditorMessages,
  DateFieldDefinition,
  FilterDateContext,
} from "./date-types.js";
import { calendarSeed, dayWire, pickerBounds } from "./date-wire.js";

interface DayPickerBase extends CriteriaDateStateProps {
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
  const route = useCriteriaDateRoute(props);
  if (route.kind === "legacy") return <LegacyDayPointPicker {...props} />;
  if (route.kind !== "adopted") return null;
  return <CriteriaDayPointPicker handle={route.handle} />;
}
function LegacyDayPointPicker(
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
  const route = useCriteriaDateRoute(props);
  if (route.kind === "legacy") return <LegacyDayRangePicker {...props} />;
  if (route.kind !== "adopted") return null;
  return <CriteriaDayRangePicker handle={route.handle} />;
}
function LegacyDayRangePicker(
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

function CriteriaDayPointPicker({
  handle,
}: {
  readonly handle: CriteriaDateStateHandle;
}) {
  useCriteriaDateVersion(handle);
  try {
    const state = readCriteriaDateState(handle),
      bounds = pickerBounds(state.field, state.context),
      seed = calendarSeed(state.context),
      messages = state.messages;
    const label =
      state.part === "start"
        ? messages.startLabel
        : state.part === "end"
          ? messages.endLabel
          : messages.pointLabel;
    const observer = criteriaDateChild(handle, state.part, "day-observer");
    const output = (
      <DatePicker
        value={state.day}
        onChange={(next) => {
          try {
            criteriaDateState.picker(handle, next);
          } catch {
            /* Denied. */
          }
        }}
        placeholderValue={seed}
        minValue={bounds.min}
        maxValue={bounds.max}
        granularity="day"
        isDisabled={false}
        validationBehavior="aria"
      >
        <Label>{label}</Label>
        <DateField.Group variant="secondary">
          <div
            onKeyDownCapture={(event) => {
              try {
                requireCriteriaDateState(handle);
                if (editingKey(event.key) && !event.ctrlKey && !event.metaKey)
                  criteriaDateState.editing(handle);
              } catch {
                /* Denied before event/DOM payload. */
              }
            }}
          >
            <DateField.Input>
              {(segment) => {
                try {
                  requireCriteriaDateState(handle);
                  const node = (
                    <>
                      {segment.type === "year" ? (
                        <DateSegmentsObserver
                          criteriaState={observer}
                          onDraft={(draft) =>
                            criteriaDateState.receive(observer, draft)
                          }
                        />
                      ) : null}
                      <DateField.Segment segment={segment} />
                    </>
                  );
                  requireCriteriaDateState(handle);
                  return node;
                } catch {
                  // biome-ignore lint/complexity/noUselessFragments: vendor render prop requires an element; denial renders no DOM.
                  return <></>;
                }
              }}
            </DateField.Input>
          </div>
          <DateField.Suffix>
            <DatePicker.Trigger aria-label={messages.chooseDateLabel}>
              <DatePicker.TriggerIndicator />
            </DatePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>
        <DatePicker.Popover>
          <Calendar
            aria-label={label}
            defaultFocusedValue={state.day ?? seed}
            minValue={bounds.min}
            maxValue={bounds.max}
            onChange={(next) => {
              try {
                requireCriteriaDateState(handle);
                const value = toCalendarDate(next);
                requireCriteriaDateState(handle);
                criteriaDateState.calendar(handle, value);
              } catch {
                /* Denied. */
              }
            }}
          >
            <Calendar.Header>
              <Calendar.Heading />
              <Calendar.NavButton
                slot="previous"
                aria-label={messages.previousMonthLabel}
              />
              <Calendar.NavButton
                slot="next"
                aria-label={messages.nextMonthLabel}
              />
            </Calendar.Header>
            <Calendar.Grid>
              <Calendar.GridHeader>
                {(day) => {
                  try {
                    requireCriteriaDateState(handle);
                    return <Calendar.HeaderCell>{day}</Calendar.HeaderCell>;
                  } catch {
                    // biome-ignore lint/complexity/noUselessFragments: vendor render prop requires an element; denial renders no DOM.
                    return <></>;
                  }
                }}
              </Calendar.GridHeader>
              <Calendar.GridBody>
                {(date) => {
                  try {
                    requireCriteriaDateState(handle);
                    return <Calendar.Cell date={date} />;
                  } catch {
                    // biome-ignore lint/complexity/noUselessFragments: vendor render prop requires an element; denial renders no DOM.
                    return <></>;
                  }
                }}
              </Calendar.GridBody>
            </Calendar.Grid>
          </Calendar>
        </DatePicker.Popover>
      </DatePicker>
    );
    requireCriteriaDateState(handle);
    return output;
  } catch {
    return null;
  }
}

function CriteriaDayRangePicker({
  handle,
}: {
  readonly handle: CriteriaDateStateHandle;
}) {
  useCriteriaDateVersion(handle);
  try {
    const state = readCriteriaDateState(handle),
      bounds = pickerBounds(state.field, state.context),
      seed = calendarSeed(state.context),
      messages = state.messages;
    const output = (
      <DateRangePicker
        value={state.range}
        onChange={(next) => {
          try {
            criteriaDateState.range(handle, next);
          } catch {
            /* Denied. */
          }
        }}
        placeholderValue={seed}
        minValue={bounds.min}
        maxValue={bounds.max}
        granularity="day"
        isDisabled={false}
        validationBehavior="aria"
      >
        <Label>{messages.pointLabel}</Label>
        <DateField.Group variant="secondary">
          <DateField.InputContainer>
            {(["start", "end"] as const).map((part) => {
              const observer = criteriaDateChild(
                handle,
                part,
                "range-observer",
              );
              return (
                <span
                  key={part}
                  className="tw-date-range-part"
                  onKeyDownCapture={(event) => {
                    try {
                      requireCriteriaDateState(handle);
                      if (
                        editingKey(event.key) &&
                        !event.ctrlKey &&
                        !event.metaKey
                      )
                        criteriaDateState.editing(handle, part);
                    } catch {
                      /* Denied. */
                    }
                  }}
                >
                  <DateField.Input
                    slot={part}
                    aria-label={
                      part === "start" ? messages.startLabel : messages.endLabel
                    }
                  >
                    {(segment) => {
                      try {
                        requireCriteriaDateState(observer);
                        const node = (
                          <>
                            {segment.type === "year" ? (
                              <DateSegmentsObserver
                                criteriaState={observer}
                                onDraft={(draft) =>
                                  criteriaDateState.receive(observer, draft)
                                }
                              />
                            ) : null}
                            <DateField.Segment segment={segment} />
                          </>
                        );
                        requireCriteriaDateState(observer);
                        return node;
                      } catch {
                        // biome-ignore lint/complexity/noUselessFragments: vendor render prop requires an element; denial renders no DOM.
                        return <></>;
                      }
                    }}
                  </DateField.Input>
                  {part === "start" ? <DateRangePicker.RangeSeparator /> : null}
                </span>
              );
            })}
          </DateField.InputContainer>
          <DateField.Suffix>
            <DateRangePicker.Trigger aria-label={messages.chooseDateLabel}>
              <DateRangePicker.TriggerIndicator />
            </DateRangePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>
        <DateRangePicker.Popover>
          <RangeCalendar
            aria-label={messages.pointLabel}
            defaultFocusedValue={state.range?.start ?? seed}
            minValue={bounds.min}
            maxValue={bounds.max}
            onChange={(next) => {
              try {
                requireCriteriaDateState(handle);
                const value = {
                  start: toCalendarDate(next.start),
                  end: toCalendarDate(next.end),
                };
                requireCriteriaDateState(handle);
                criteriaDateState.calendar(handle, value);
              } catch {
                /* Denied. */
              }
            }}
          >
            <RangeCalendar.Header>
              <RangeCalendar.Heading />
              <RangeCalendar.NavButton
                slot="previous"
                aria-label={messages.previousMonthLabel}
              />
              <RangeCalendar.NavButton
                slot="next"
                aria-label={messages.nextMonthLabel}
              />
            </RangeCalendar.Header>
            <RangeCalendar.Grid>
              <RangeCalendar.GridHeader>
                {(day) => {
                  try {
                    requireCriteriaDateState(handle);
                    return (
                      <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>
                    );
                  } catch {
                    // biome-ignore lint/complexity/noUselessFragments: vendor render prop requires an element; denial renders no DOM.
                    return <></>;
                  }
                }}
              </RangeCalendar.GridHeader>
              <RangeCalendar.GridBody>
                {(date) => {
                  try {
                    requireCriteriaDateState(handle);
                    return <RangeCalendar.Cell date={date} />;
                  } catch {
                    // biome-ignore lint/complexity/noUselessFragments: vendor render prop requires an element; denial renders no DOM.
                    return <></>;
                  }
                }}
              </RangeCalendar.GridBody>
            </RangeCalendar.Grid>
          </RangeCalendar>
        </DateRangePicker.Popover>
      </DateRangePicker>
    );
    requireCriteriaDateState(handle);
    return output;
  } catch {
    return null;
  }
}
