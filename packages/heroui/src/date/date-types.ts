import type {
  DatePoint,
  DateRange,
  DateValue,
  FieldDefinition,
} from "@tableweave/react/contracts";
import type { CriteriaDateStateProps } from "./criteria-date-state.js";

export interface FilterDateContext {
  readonly locale: string;
  readonly timeZone: string;
  readonly evaluatedAt: number;
}
export type DateFieldDefinition = Extract<
  FieldDefinition,
  { readonly type: "date" | "datetime" }
>;
export type SymbolicDateValue = Exclude<DateValue, DatePoint>;
export type DateDraft<V> =
  | {
      readonly status: "empty" | "incomplete" | "invalid";
      readonly value: null;
    }
  | { readonly status: "complete"; readonly value: V };

export interface DateEditorMessages {
  readonly pointLabel: string;
  readonly startLabel: string;
  readonly endLabel: string;
  readonly timeLabel: string;
  readonly exactInstantLabel: string;
  readonly exactInstantHint: string;
  readonly modeLabel: string;
  readonly dayModeLabel: string;
  readonly instantModeLabel: string;
  readonly relativeModeLabel: string;
  readonly presetsLabel: string;
  readonly chooseDateLabel: string;
  readonly previousMonthLabel: string;
  readonly nextMonthLabel: string;
  readonly invalidValue: string;
  readonly incompleteValue: string;
  readonly ambiguousTime: string;
  readonly formatRelative: (value: SymbolicDateValue) => string;
}

export const dateEditorMessages: DateEditorMessages = {
  pointLabel: "Date",
  startLabel: "Start date",
  endLabel: "End date",
  timeLabel: "Time",
  exactInstantLabel: "Exact date and time",
  exactInstantHint:
    "Use an ISO date and time with Z or an explicit UTC offset; milliseconds are supported.",
  modeLabel: "Date value type",
  dayModeLabel: "Calendar day",
  instantModeLabel: "Exact instant",
  relativeModeLabel: "Relative date",
  presetsLabel: "Relative date preset",
  chooseDateLabel: "Choose date",
  previousMonthLabel: "Previous month",
  nextMonthLabel: "Next month",
  invalidValue: "Enter a complete valid date within the configured bounds.",
  incompleteValue: "Complete every date and time segment before applying.",
  ambiguousTime:
    "This wall time is ambiguous or does not exist. Enter an exact ISO instant with an explicit offset.",
  formatRelative: (value) => {
    if (value.kind === "rolling")
      return `${value.direction === "past" ? "Past" : "Next"} ${value.days} calendar days`;
    const names: Record<typeof value.preset, string> = {
      today: "Today",
      yesterday: "Yesterday",
      tomorrow: "Tomorrow",
      thisWeek: "This week",
      lastWeek: "Last week",
      nextWeek: "Next week",
      thisMonth: "This month",
      lastMonth: "Last month",
      nextMonth: "Next month",
      thisYear: "This year",
      lastYear: "Last year",
      nextYear: "Next year",
    };
    return names[value.preset];
  },
};

interface DateOperandEditorBase extends CriteriaDateStateProps {
  readonly field: DateFieldDefinition;
  readonly context: FilterDateContext;
  /** New editing-session identity. value seeds the session; drafts stay local. */
  readonly resetKey: string | number;
  readonly disabled?: boolean;
  readonly messages?: Partial<DateEditorMessages>;
}
export type DateOperandEditorProps = DateOperandEditorBase &
  (
    | {
        readonly cardinality: "one";
        readonly value: DateValue | null;
        readonly onDraftChange: (draft: DateDraft<DateValue>) => void;
      }
    | {
        readonly cardinality: "range";
        readonly value: DateRange | null;
        readonly onDraftChange: (draft: DateDraft<DateRange>) => void;
      }
  );
