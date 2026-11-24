"use client";

import type {
  DatePoint,
  DateRange,
  DateValue,
} from "@tableweave/react/contracts";
import { canonicalJson } from "@tableweave/react/contracts";
import { relativePresets, resolveDateOperand } from "@tableweave/react/filters";
import { useLayoutEffect, useRef, useState } from "react";
import { I18nProvider } from "react-aria-components/I18nProvider";
import { InstantPointEditor } from "./date-instant.js";
import { DayPointPicker, DayRangePicker } from "./date-picker.js";
import type {
  DateDraft,
  DateOperandEditorProps,
  SymbolicDateValue,
} from "./date-types.js";
import { dateEditorMessages } from "./date-types.js";

export type {
  DateDraft,
  DateEditorMessages,
  DateFieldDefinition,
  DateOperandEditorProps,
  FilterDateContext,
  SymbolicDateValue,
} from "./date-types.js";
export { dateEditorMessages } from "./date-types.js";

/** Private builder/toolbar primitive. No dispatch or operator-policy duplication. */
export function DateOperandEditor(props: DateOperandEditorProps) {
  const sessionKey = canonicalJson([
    props.resetKey,
    props.field,
    props.context.locale,
    props.context.timeZone,
  ]);
  return (
    <I18nProvider locale={props.context.locale}>
      <DateOperandSession key={sessionKey} {...props} />
    </I18nProvider>
  );
}

function DateOperandSession(props: DateOperandEditorProps) {
  const messages = { ...dateEditorMessages, ...props.messages };
  const initial = props.value;
  const [mode, setMode] = useState<"day" | "instant" | "relative">(() => {
    if (!initial) return "day";
    if (Array.isArray(initial))
      return initial[0]?.kind === "instant" ? "instant" : "day";
    return "kind" in initial &&
      (initial.kind === "relative" || initial.kind === "rolling")
      ? "relative"
      : "kind" in initial && initial.kind === "instant"
        ? "instant"
        : "day";
  });
  const [editorKey, setEditorKey] = useState(0);
  const [invalidOperand, setInvalidOperand] = useState(false);
  const [draft, setDraft] = useState<DateDraft<DateValue | DateRange>>(() =>
    initial
      ? { status: "complete", value: initial }
      : { status: "empty", value: null },
  );
  const callback = useRef(props.onDraftChange);
  const parts = useRef<{
    start: DateDraft<DatePoint>;
    end: DateDraft<DatePoint>;
  }>(
    props.cardinality === "range" && props.value
      ? {
          start: { status: "complete", value: props.value[0] },
          end: { status: "complete", value: props.value[1] },
        }
      : {
          start: { status: "empty", value: null },
          end: { status: "empty", value: null },
        },
  );
  useLayoutEffect(() => {
    callback.current = props.onDraftChange;
  }, [props.onDraftChange]);
  const fingerprint = canonicalJson(draft);
  // biome-ignore lint/correctness/useExhaustiveDependencies: fingerprint represents draft; resetKey remounts field/context and callback ref carries the current handler.
  useLayoutEffect(() => {
    if (draft.status !== "complete") {
      setInvalidOperand(false);
      callback.current(draft);
      return;
    }
    try {
      resolveDateOperand(props.field, draft.value, {
        locale: props.context.locale,
        timeZone: props.context.timeZone,
        now: props.context.evaluatedAt,
      });
      setInvalidOperand(false);
      // The discriminant and input controls establish the operand cardinality.
      if (props.cardinality === "range" && Array.isArray(draft.value))
        props.onDraftChange({
          status: "complete",
          value: draft.value as DateRange,
        });
      else if (props.cardinality === "one" && !Array.isArray(draft.value))
        props.onDraftChange({
          status: "complete",
          value: draft.value as DateValue,
        });
      else callback.current({ status: "invalid", value: null });
    } catch {
      setInvalidOperand(true);
      callback.current({ status: "invalid", value: null });
    }
    // Callback identity must not republish the same draft during parent rerenders.
  }, [fingerprint, props.context.evaluatedAt]);
  function update(next: DateDraft<DateValue | DateRange>) {
    setDraft((previous) =>
      canonicalJson(previous) === canonicalJson(next) ? previous : next,
    );
  }
  function instantPart(part: "start" | "end", next: DateDraft<DatePoint>) {
    parts.current[part] = next;
    const { start, end } = parts.current;
    if (start.status === "complete" && end.status === "complete")
      update({ status: "complete", value: [start.value, end.value] });
    else
      update({
        status:
          start.status === "invalid" || end.status === "invalid"
            ? "invalid"
            : "incomplete",
        value: null,
      });
  }
  const presets: readonly SymbolicDateValue[] = [
    ...(props.field.relativePresets ?? relativePresets).map((preset) => ({
      kind: "relative" as const,
      preset,
    })),
    ...(props.field.rollingDays ?? []).flatMap((days) => [
      { kind: "rolling" as const, days, direction: "past" as const },
      { kind: "rolling" as const, days, direction: "future" as const },
    ]),
  ];
  const currentSymbol =
    draft.status === "complete" &&
    !Array.isArray(draft.value) &&
    "kind" in draft.value &&
    (draft.value.kind === "relative" || draft.value.kind === "rolling")
      ? canonicalJson(draft.value)
      : "";
  const scalarInitial: DatePoint | null =
    props.cardinality === "one" &&
    props.value &&
    (props.value.kind === "day" || props.value.kind === "instant")
      ? props.value
      : null;
  const rangeInitial = props.cardinality === "range" ? props.value : null;
  return (
    <div className="tw-date-editor">
      <label className="tw-date-mode">
        <span>{messages.modeLabel}</span>
        <select
          value={mode}
          disabled={props.disabled}
          onChange={(event) => {
            const next = event.currentTarget.value;
            if (next !== "day" && next !== "instant" && next !== "relative")
              return;
            setMode(next);
            setEditorKey((key) => key + 1);
            parts.current = {
              start: { status: "empty", value: null },
              end: { status: "empty", value: null },
            };
            update({ status: "empty", value: null });
          }}
        >
          <option value="day">{messages.dayModeLabel}</option>
          {props.field.type === "datetime" ? (
            <option value="instant">{messages.instantModeLabel}</option>
          ) : null}
          {props.cardinality === "one" && presets.length > 0 ? (
            <option value="relative">{messages.relativeModeLabel}</option>
          ) : null}
        </select>
      </label>
      <div key={`${mode}-${editorKey}`}>
        {mode === "relative" ? (
          <label className="tw-date-mode">
            <span>{messages.presetsLabel}</span>
            <select
              value={currentSymbol}
              disabled={props.disabled}
              onChange={(event) => {
                const value = presets.find(
                  (preset) =>
                    canonicalJson(preset) === event.currentTarget.value,
                );
                update(
                  value
                    ? { status: "complete", value }
                    : { status: "empty", value: null },
                );
              }}
            >
              <option value="">{messages.presetsLabel}</option>
              {presets.map((preset) => (
                <option
                  key={canonicalJson(preset)}
                  value={canonicalJson(preset)}
                >
                  {messages.formatRelative(preset)}
                </option>
              ))}
            </select>
          </label>
        ) : mode === "day" ? (
          props.cardinality === "range" ? (
            <DayRangePicker
              field={props.field}
              context={props.context}
              messages={messages}
              disabled={props.disabled ?? false}
              initialValue={editorKey === 0 ? rangeInitial : null}
              onDraft={update}
            />
          ) : (
            <DayPointPicker
              label={messages.pointLabel}
              field={props.field}
              context={props.context}
              messages={messages}
              disabled={props.disabled ?? false}
              initialValue={editorKey === 0 ? scalarInitial : null}
              onDraft={update}
            />
          )
        ) : props.cardinality === "one" ? (
          <InstantPointEditor
            label={messages.pointLabel}
            initialValue={editorKey === 0 ? scalarInitial : null}
            field={props.field}
            context={props.context}
            messages={messages}
            disabled={props.disabled ?? false}
            onDraft={update}
          />
        ) : (
          <div className="tw-date-instant-range">
            {(["start", "end"] as const).map((part) => (
              <InstantPointEditor
                key={part}
                label={
                  part === "start" ? messages.startLabel : messages.endLabel
                }
                initialValue={
                  editorKey === 0
                    ? (rangeInitial?.[part === "start" ? 0 : 1] ?? null)
                    : null
                }
                field={props.field}
                context={props.context}
                messages={messages}
                disabled={props.disabled ?? false}
                onDraft={(next) => instantPart(part, next)}
              />
            ))}
          </div>
        )}
      </div>
      {invalidOperand ||
      draft.status === "invalid" ||
      draft.status === "incomplete" ? (
        <p role="status">
          {invalidOperand || draft.status === "invalid"
            ? messages.invalidValue
            : messages.incompleteValue}
        </p>
      ) : null}
    </div>
  );
}
