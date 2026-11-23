import {
  fromAbsolute,
  parseAbsolute,
  parseDate,
  startOfMonth,
  startOfWeek,
  startOfYear,
  toCalendarDate,
  toZoned,
} from "@internationalized/date";
import { validContext } from "../contracts/context.js";
import { fail } from "../contracts/errors.js";
import { isRecord } from "../contracts/json.js";
import type {
  DatePoint,
  DateRange,
  DateValue,
  FieldDefinition,
  OperatorContext,
  RelativePreset,
} from "../contracts/types.js";

export const relativePresets: readonly RelativePreset[] = Object.freeze([
  "today",
  "yesterday",
  "tomorrow",
  "thisWeek",
  "lastWeek",
  "nextWeek",
  "thisMonth",
  "lastMonth",
  "nextMonth",
  "thisYear",
  "lastYear",
  "nextYear",
]);
export type DateInterval =
  | {
      readonly kind: "days";
      readonly start: string;
      readonly endExclusive: string;
    }
  | {
      readonly kind: "instants";
      readonly start: number;
      readonly endExclusive: number;
    };
type DateField = Extract<FieldDefinition, { type: "date" | "datetime" }>;

function keys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  return (
    Object.keys(value).length === expected.length &&
    expected.every((key) => Object.hasOwn(value, key))
  );
}
export function isDatePoint(
  value: unknown,
  type: "date" | "datetime",
): value is DatePoint {
  if (
    !isRecord(value) ||
    !keys(value, ["kind", "value"]) ||
    typeof value.value !== "string"
  )
    return false;
  try {
    if (value.kind === "day")
      return (
        /^\d{4}-\d{2}-\d{2}$/.test(value.value) &&
        parseDate(value.value).toString() === value.value
      );
    if (
      value.kind === "instant" &&
      type === "datetime" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
        value.value,
      )
    ) {
      return Number.isFinite(
        parseAbsolute(value.value, "UTC").toDate().getTime(),
      );
    }
  } catch {
    return false;
  }
  return false;
}
export function isDateValue(
  value: unknown,
  field: DateField,
): value is DateValue {
  if (isDatePoint(value, field.type)) return true;
  if (!isRecord(value)) return false;
  if (value.kind === "relative" && keys(value, ["kind", "preset"])) {
    return (
      typeof value.preset === "string" &&
      (field.relativePresets ?? relativePresets).includes(
        value.preset as RelativePreset,
      )
    );
  }
  return (
    value.kind === "rolling" &&
    keys(value, ["kind", "days", "direction"]) &&
    typeof value.days === "number" &&
    Number.isSafeInteger(value.days) &&
    value.days > 0 &&
    (field.rollingDays ?? []).includes(value.days) &&
    (value.direction === "past" || value.direction === "future")
  );
}
export function isDateRange(
  value: unknown,
  field: DateField,
): value is DateRange {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    isDatePoint(value[0], field.type) &&
    isDatePoint(value[1], field.type) &&
    value[0].kind === value[1].kind
  );
}
export function resolveDateValue(
  field: DateField,
  value: DateValue,
  context: Pick<OperatorContext, "locale" | "timeZone" | "now">,
): DateInterval {
  if (
    !Number.isFinite(context.now) ||
    !Number.isFinite(new Date(context.now).getTime()) ||
    !validContext(context.locale, context.timeZone)
  )
    fail("query.context");
  if (!isDateValue(value, field)) fail("query.date");
  if (value.kind === "instant") {
    const start = parseAbsolute(value.value, context.timeZone)
      .toDate()
      .getTime();
    return { kind: "instants", start, endExclusive: start + 1 };
  }
  let start =
    value.kind === "day"
      ? parseDate(value.value)
      : toCalendarDate(fromAbsolute(context.now, context.timeZone));
  let end = start.add({ days: 1 });
  if (value.kind === "relative") {
    const name = value.preset;
    const shift =
      name.startsWith("last") || name === "yesterday"
        ? -1
        : name.startsWith("next") || name === "tomorrow"
          ? 1
          : 0;
    if (name.endsWith("Week")) {
      start = startOfWeek(start, context.locale).add({ weeks: shift });
      end = start.add({ weeks: 1 });
    } else if (name.endsWith("Month")) {
      start = startOfMonth(start).add({ months: shift });
      end = start.add({ months: 1 });
    } else if (name.endsWith("Year")) {
      start = startOfYear(start).add({ years: shift });
      end = start.add({ years: 1 });
    } else {
      start = start.add({ days: shift });
      end = start.add({ days: 1 });
    }
  } else if (value.kind === "rolling") {
    if (value.direction === "past")
      start = start.subtract({ days: value.days - 1 });
    else end = start.add({ days: value.days });
  }
  // Calendar arithmetic can constrain at its supported year bounds. Reject
  // unrepresentable/clipped windows rather than silently shortening intent.
  if (
    !isDatePoint({ kind: "day", value: start.toString() }, "date") ||
    !isDatePoint({ kind: "day", value: end.toString() }, "date") ||
    parseDate(start.toString()).compare(start) !== 0 ||
    parseDate(end.toString()).compare(end) !== 0 ||
    end.compare(start) <= 0 ||
    (value.kind === "rolling" && end.compare(start) !== value.days)
  )
    fail("query.date");
  if (
    value.kind === "relative" &&
    (value.preset.endsWith("Week")
      ? end.compare(start) !== 7
      : value.preset.endsWith("Month")
        ? start.day !== 1 || end.day !== 1
        : value.preset.endsWith("Year")
          ? start.month !== 1 ||
            end.month !== 1 ||
            start.day !== 1 ||
            end.day !== 1
          : end.compare(start) !== 1)
  )
    fail("query.date");
  if (field.type === "date")
    return {
      kind: "days",
      start: start.toString(),
      endExclusive: end.toString(),
    };
  const startInstant = toZoned(start, context.timeZone).toDate().getTime();
  const endInstant = toZoned(end, context.timeZone).toDate().getTime();
  // A timezone can skip a complete calendar day (e.g. Pacific/Apia).
  // Calendar order alone does not guarantee a nonempty instant interval.
  if (
    !Number.isFinite(startInstant) ||
    !Number.isFinite(endInstant) ||
    startInstant >= endInstant
  )
    fail("query.date");
  return { kind: "instants", start: startInstant, endExclusive: endInstant };
}
export function resolveDateOperand(
  field: DateField,
  value: DateValue | DateRange,
  context: Pick<OperatorContext, "locale" | "timeZone" | "now">,
): DateInterval {
  let interval: DateInterval;
  if (Array.isArray(value)) {
    if (!isDateRange(value, field)) fail("rule.value");
    const first = resolveDateValue(field, value[0], context);
    const last = resolveDateValue(field, value[1], context);
    if (first.kind !== last.kind || first.start > last.start)
      fail("rule.value");
    interval =
      first.kind === "days" && last.kind === "days"
        ? { kind: "days", start: first.start, endExclusive: last.endExclusive }
        : {
            kind: "instants",
            start: Number(first.start),
            endExclusive: Number(last.endExclusive),
          };
  } else interval = resolveDateValue(field, value as DateValue, context);
  if (field.min) {
    const min = resolveDateValue(field, field.min, context);
    if (interval.kind !== min.kind || interval.start < min.start)
      fail("rule.value");
  }
  if (field.max) {
    const max = resolveDateValue(field, field.max, context);
    if (interval.kind !== max.kind || interval.endExclusive > max.endExclusive)
      fail("rule.value");
  }
  return interval;
}
export function dateRecordValue(
  field: DateField,
  value: unknown,
  timeZone: string,
): string | number | undefined {
  if (field.type === "date")
    return typeof value === "string" &&
      isDatePoint({ kind: "day", value }, "date")
      ? value
      : undefined;
  if (value instanceof Date)
    return Number.isFinite(value.getTime()) ? value.getTime() : undefined;
  if (
    typeof value !== "string" ||
    !isDatePoint({ kind: "instant", value }, "datetime")
  )
    return undefined;
  return parseAbsolute(value, timeZone).toDate().getTime();
}
