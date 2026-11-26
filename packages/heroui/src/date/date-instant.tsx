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

type InstantPointProps = CriteriaDateStateProps & {
  readonly label: string;
  readonly initialValue: DatePoint | null;
  readonly field: DateFieldDefinition;
  readonly context: FilterDateContext;
  readonly messages: DateEditorMessages;
  readonly disabled: boolean;
  readonly onDraft: (draft: DateDraft<DatePoint>) => void;
};
export function InstantPointEditor(props: InstantPointProps) {
  const route = useCriteriaDateRoute(props);
  if (route.kind === "legacy") return <LegacyInstantPointEditor {...props} />;
  if (route.kind !== "adopted") return null;
  return <CriteriaInstantPointEditor handle={route.handle} />;
}
function LegacyInstantPointEditor(props: InstantPointProps) {
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

function CriteriaInstantPointEditor({
  handle,
}: {
  readonly handle: CriteriaDateStateHandle;
}) {
  useCriteriaDateVersion(handle);
  const hintId = useId();
  try {
    const state = readCriteriaDateState(handle),
      messages = state.messages,
      label =
        state.part === "start"
          ? messages.startLabel
          : state.part === "end"
            ? messages.endLabel
            : messages.pointLabel;
    const seed = toCalendarDateTime(
      fromAbsolute(state.context.evaluatedAt, state.context.timeZone),
    );
    const day = criteriaDateChild(handle, state.part, "instant-day"),
      observer = criteriaDateChild(handle, state.part, "time-observer");
    const output = (
      <div className="tw-date-instant">
        <TextField
          value={state.text}
          onChange={(next) => {
            try {
              criteriaDateState.text(handle, next);
            } catch {
              /* Denied. */
            }
          }}
          isDisabled={false}
          aria-describedby={hintId}
        >
          <Label>{`${label} — ${messages.exactInstantLabel}`}</Label>
          <Input spellCheck={false} autoComplete="off" />
        </TextField>
        <p id={hintId} className="tw-date-hint">
          {messages.exactInstantHint}
        </p>
        {/* Only an explicit exact-ISO edit resets convenience inputs, never actor,
          configuration/query allocation or the authoritative freeform field. */}
        <div
          key={state.controlsRevision}
          className="tw-date-instant-fields"
          onKeyDownCapture={() => {
            try {
              criteriaDateState.dirty(handle);
            } catch {
              /* Denied. */
            }
          }}
          onPointerDownCapture={() => {
            try {
              criteriaDateState.dirty(handle);
            } catch {
              /* Denied. */
            }
          }}
        >
          <DayPointPicker
            criteriaState={day}
            label={label}
            initialValue={null}
            field={state.field}
            context={state.context}
            disabled={false}
            messages={messages}
            onDraft={(draft) => criteriaDateState.operand(handle, draft)}
          />
          <TimeField
            value={state.time}
            placeholderValue={seed}
            onChange={(next) => {
              try {
                criteriaDateState.time(handle, next);
              } catch {
                /* Denied. */
              }
            }}
            granularity="second"
            isDisabled={false}
            validationBehavior="aria"
          >
            <Label>{messages.timeLabel}</Label>
            <TimeField.Group variant="secondary">
              <div
                onKeyDownCapture={(event) => {
                  try {
                    requireCriteriaDateState(handle);
                    if (
                      event.key !== "Tab" &&
                      event.key !== "Shift" &&
                      !event.ctrlKey &&
                      !event.metaKey
                    )
                      criteriaDateState.timeEditing(handle);
                  } catch {
                    /* Denied before DOM/event reads. */
                  }
                }}
              >
                <TimeField.Input>
                  {(segment) => {
                    try {
                      requireCriteriaDateState(handle);
                      const node = (
                        <>
                          {segment.type === "hour" ? (
                            <DateSegmentsObserver
                              criteriaState={observer}
                              onDraft={(draft) =>
                                criteriaDateState.receive(observer, draft)
                              }
                            />
                          ) : null}
                          <TimeField.Segment segment={segment} />
                        </>
                      );
                      requireCriteriaDateState(handle);
                      return node;
                    } catch {
                      // biome-ignore lint/complexity/noUselessFragments: vendor render prop requires an element, not null; denial renders no DOM.
                      return <></>;
                    }
                  }}
                </TimeField.Input>
              </div>
            </TimeField.Group>
          </TimeField>
        </div>
        {state.error ? <p role="alert">{state.error}</p> : null}
      </div>
    );
    requireCriteriaDateState(handle);
    return output;
  } catch {
    return null;
  }
}
