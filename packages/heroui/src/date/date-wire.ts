import type { CalendarDate, CalendarDateTime } from "@internationalized/date";
import {
  fromAbsolute,
  GregorianCalendar,
  parseAbsolute,
  parseDate,
  toCalendar,
  toCalendarDate,
  toCalendarDateTime,
  toZoned,
} from "@internationalized/date";
import type { DatePoint } from "@tableweave/react/contracts";
import { resolveDateOperand } from "@tableweave/react/filters";
import type { DateFieldDefinition, FilterDateContext } from "./date-types.js";

export const calendarFloor = parseDate("0001-01-01");
export const calendarCeiling = parseDate("9999-12-31");
const gregorian = new GregorianCalendar();

export function calendarSeed(context: FilterDateContext): CalendarDate {
  return toCalendarDate(fromAbsolute(context.evaluatedAt, context.timeZone));
}
export function dayWire(value: CalendarDate): DatePoint {
  return { kind: "day", value: toCalendar(value, gregorian).toString() };
}
export function parseInstantInput(
  text: string,
  field: DateFieldDefinition,
  context: FilterDateContext,
): DatePoint | null {
  // Validate exact wire shape using the accepted resolver, not permissive Date.parse.
  const value: DatePoint = { kind: "instant", value: text };
  try {
    resolveDateOperand(field, value, {
      locale: context.locale,
      timeZone: context.timeZone,
      now: context.evaluatedAt,
    });
    return value;
  } catch {
    return null;
  }
}
export function instantWallTime(
  point: DatePoint,
  context: FilterDateContext,
): CalendarDateTime {
  return toCalendarDateTime(parseAbsolute(point.value, context.timeZone));
}
export function wallTimeWire(
  value: CalendarDateTime,
  context: FilterDateContext,
): DatePoint {
  // Never silently choose a fold offset or move a gap time forward.
  return {
    kind: "instant",
    value: toZoned(value, context.timeZone, "reject").toAbsoluteString(),
  };
}
export function pickerBounds(
  field: DateFieldDefinition,
  context: FilterDateContext,
): { min: CalendarDate; max: CalendarDate } {
  const toDay = (point: DatePoint) =>
    point.kind === "day"
      ? parseDate(point.value)
      : toCalendarDate(parseAbsolute(point.value, context.timeZone));
  return {
    min: field.min ? toDay(field.min) : calendarFloor,
    max: field.max ? toDay(field.max) : calendarCeiling,
  };
}
