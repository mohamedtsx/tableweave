import type {
  DatePoint,
  DateRange,
  DateValue,
} from "@tableweave/react/contracts";
import { relativePresets } from "@tableweave/react/filters";

function point(value: unknown): DatePoint | undefined {
  if (
    typeof value !== "object" ||
    value === null ||
    !("kind" in value) ||
    !("value" in value) ||
    typeof value.value !== "string"
  )
    return undefined;
  return value.kind === "day" || value.kind === "instant"
    ? { kind: value.kind, value: value.value }
    : undefined;
}

/** Shape bridge only. The shared date producer and headless validator own semantics. */
export function dateOperandValue(
  value: unknown,
): DateValue | DateRange | undefined {
  const scalar = point(value);
  if (scalar) return scalar;
  if (Array.isArray(value) && value.length === 2) {
    const first = point(value[0]);
    const last = point(value[1]);
    return first && last ? [first, last] : undefined;
  }
  if (typeof value !== "object" || value === null || !("kind" in value))
    return undefined;
  if (value.kind === "relative" && "preset" in value) {
    const preset = relativePresets.find(
      (candidate) => candidate === value.preset,
    );
    return preset ? { kind: "relative", preset } : undefined;
  }
  if (
    value.kind === "rolling" &&
    "days" in value &&
    typeof value.days === "number" &&
    "direction" in value &&
    (value.direction === "past" || value.direction === "future")
  )
    return { kind: "rolling", days: value.days, direction: value.direction };
  return undefined;
}
