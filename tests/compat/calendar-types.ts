import type { Calendar } from "@heroui/react/calendar";
import type { CalendarYearPickerCellProps } from "@heroui/react/calendar-year-picker";
import type { RangeCalendar } from "@heroui/react/range-calendar";

type Cell = Parameters<typeof Calendar.YearPickerCell>[0];
type RangeCell = Parameters<typeof RangeCalendar.YearPickerCell>[0];
export const cell: Cell = {
  year: 2026,
  children: ({ year, isSelected }) => `${year.toFixed(0)}:${isSelected}`,
};
export const scoped: CalendarYearPickerCellProps = cell;
export const range: RangeCell = scoped;
export const restored: Cell = range;
// @ts-expect-error The genuine scoped year remains numeric, not any/string.
export const invalidYear: Cell = { year: "2026" };
// @ts-expect-error The genuine scoped year is required.
export const missingYear: RangeCell = {};
export const trigger: Parameters<typeof Calendar.YearPickerTrigger>[0] = {
  children: ({ monthYear, isOpen }) => `${monthYear}:${isOpen}`,
};
// @ts-expect-error The genuine trigger requires accessible/renderable children.
export const missingChildren: Parameters<
  typeof RangeCalendar.YearPickerTrigger
>[0] = {};
