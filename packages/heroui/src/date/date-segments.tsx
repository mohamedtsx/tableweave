"use client";

import type { DateValue as VendorDateValue } from "@internationalized/date";
import { useContext, useLayoutEffect, useRef } from "react";
import { DateFieldStateContext } from "react-aria-components/DateField";
import { TimeFieldStateContext } from "react-aria-components/TimeField";
import type { DateDraft } from "./date-types.js";

/** Scoped public RAC contexts expose raw segments even while onChange is silent. */
export function DateSegmentsObserver({
  onDraft,
}: {
  readonly onDraft: (draft: DateDraft<VendorDateValue>) => void;
}) {
  const date = useContext(DateFieldStateContext);
  const time = useContext(TimeFieldStateContext);
  const state = date ?? time;
  const handler = useRef(onDraft);
  useLayoutEffect(() => {
    handler.current = onDraft;
  }, [onDraft]);
  const fingerprint = JSON.stringify(
    state?.segments.map(
      ({ type, value, isPlaceholder, minValue, maxValue }) => [
        type,
        value,
        isPlaceholder,
        minValue,
        maxValue,
      ],
    ),
  );
  const valueKey = state?.value?.toString();
  // biome-ignore lint/correctness/useExhaustiveDependencies: raw fingerprint/valueKey represent the unstable RAC state handle.
  useLayoutEffect(() => {
    if (!state) return;
    const segments = state.segments.filter((segment) => segment.isEditable);
    if (segments.every((segment) => segment.isPlaceholder)) {
      handler.current({ status: "empty", value: null });
      return;
    }
    if (segments.some((segment) => segment.isPlaceholder)) {
      handler.current({ status: "incomplete", value: null });
      return;
    }
    const value = state.value;
    if (!value) {
      handler.current({ status: "invalid", value: null });
      return;
    }
    const hour = "hour" in value ? value.hour : 0;
    const hourCycle = state.dateFormatter.resolvedOptions().hourCycle;
    const expected: Record<string, number | undefined> = {
      era: state.calendar.getEras().indexOf(value.era),
      year: value.year,
      month: value.month,
      day: value.day,
      hour:
        hourCycle === "h12"
          ? hour % 12 || 12
          : hourCycle === "h11"
            ? hour % 12
            : hourCycle === "h24"
              ? hour || 24
              : hour,
      dayPeriod: hour >= 12 ? 1 : 0,
      minute: "minute" in value ? value.minute : undefined,
      second: "second" in value ? value.second : undefined,
    };
    const invalid = segments.some(
      (segment) =>
        segment.value !== expected[segment.type] ||
        (segment.value !== undefined &&
          segment.minValue !== undefined &&
          segment.value < segment.minValue) ||
        (segment.value !== undefined &&
          segment.maxValue !== undefined &&
          segment.value > segment.maxValue),
    );
    handler.current(
      invalid
        ? { status: "invalid", value: null }
        : { status: "complete", value },
    );
    // Fingerprints intentionally observe raw content, not the unstable state handle.
  }, [fingerprint, valueKey]);
  return null;
}
