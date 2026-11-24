import type { DateValue } from "@tableweave/react/contracts";
import { dateEditorMessages } from "../date/date-types.js";
import { builderMessages } from "../filters/messages.js";
import { paginationMessages } from "../pagination/messages.js";
import { defaultCollectionMessages } from "../table/collection-messages.js";
import type {
  TableweaveBuiltinOperatorLabels,
  TableweaveLocale,
  TableweaveMessages,
} from "./types.js";

// Clone library-owned dictionaries before freezing; never freeze old defaults.
const dateEditor = Object.freeze({ ...dateEditorMessages });
const filterTool = Object.freeze({
  unavailable: "Filtering is unavailable.",
  invalidConfiguration: "This filter is not configured correctly.",
  submitted: "Filter change submitted.",
  failed: "The filter could not be changed.",
});

const messages = Object.freeze({
  builder: Object.freeze({ ...builderMessages }),
  search: Object.freeze({
    ...filterTool,
    label: "Search records",
    placeholder: "Search…",
    clearLabel: "Clear search",
    cancelled: "Search edit cancelled.",
    invalidValue: "Enter a valid search query.",
  }),
  tabs: Object.freeze({
    ...filterTool,
    label: "Filter records by tab",
    previousTabsLabel: "Previous filter tabs",
    nextTabsLabel: "Next filter tabs",
  }),
  date: Object.freeze<TableweaveMessages["date"]>({
    ...filterTool,
    ...dateEditor,
    label: "Filter by date",
    applyLabel: "Apply date filter",
    cancelLabel: "Cancel date edit",
    clearLabel: "Clear date filter",
    emptySummary: "Any date",
    formatTimeZone: (timeZone) => `Time zone: ${timeZone}`,
    formatSummary: (date, context) => {
      function point(value: DateValue): string {
        if (value.kind === "relative" || value.kind === "rolling")
          return dateEditor.formatRelative(value);
        if (value.kind === "day") return value.value;
        return new Intl.DateTimeFormat(context.locale, {
          timeZone: context.timeZone,
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          fractionalSecondDigits: 3,
          timeZoneName: "short",
        }).format(new Date(value.value));
      }
      return date.operator === "date.between"
        ? `${point(date.value[0])} – ${point(date.value[1])}`
        : point(date.value);
    },
  }),
  dateEditor,
  collection: Object.freeze({ ...defaultCollectionMessages }),
  sorting: Object.freeze<TableweaveMessages["sorting"]>({
    trigger: "Sort",
    title: "Sorting",
    priorities: "Sort priority",
    none: "No sorting applied",
    ascending: "Ascending",
    descending: "Descending",
    remove: "Remove",
    addAscending: "Add ascending",
    addDescending: "Add descending",
    hidden: "Hidden column",
    unavailable: "Sorting controls are unavailable",
    disabled: "Sorting changes are disabled",
    unsortable: "Sorting is not enabled for this column",
    singleOnly: "This column supports single sorting only",
    actionName: (action, label) => `${action}: ${label}`,
    priority: (position, label, direction, visibility) =>
      `${position}. ${label}: ${direction}${visibility ? ` (${visibility})` : ""}`,
  }),
  columnChooser: Object.freeze({
    trigger: "Columns",
    title: "Shown columns",
    required: "Required column",
    finalVisible: "At least one data column must remain visible",
    unavailable: "Column controls are unavailable",
    disabled: "Column changes are disabled",
  }),
  selectionToolbar: Object.freeze<TableweaveMessages["selectionToolbar"]>({
    normalLabel: "Table tools",
    selectionLabel: "Row selection",
    actionsLabel: "Selection actions",
    selectedCount: (count) => `${count} selected`,
    cancel: "Cancel",
    cancelLabel: "Clear row selection",
  }),
  pagination: Object.freeze({ ...paginationMessages }),
  details: Object.freeze({
    close: "Close details",
    cancel: "Close",
    loading: "Loading record details.",
    missing: "This record is not available.",
    unavailable: "Details could not be loaded.",
    offline: "Details are unavailable while offline.",
    timeout: "Loading details timed out.",
    retry: "Retry",
    checking: "Checking whether details can close.",
  }),
} satisfies TableweaveMessages);

// Exact private builder labels copied as data, not translated stable IDs.
const builtinOperatorLabels = Object.freeze({
  empty: "is empty",
  notEmpty: "is not empty",
  "text.contains": "contains",
  "text.notContains": "does not contain",
  "text.is": "is",
  "text.isNot": "is not",
  "text.startsWith": "starts with",
  "text.notStartsWith": "does not start with",
  "text.endsWith": "ends with",
  "text.notEndsWith": "does not end with",
  "number.eq": "equals",
  "number.ne": "does not equal",
  "number.gt": "is greater than",
  "number.gte": "is at least",
  "number.lt": "is less than",
  "number.lte": "is at most",
  "number.between": "is between",
  "number.notBetween": "is not between",
  "enum.is": "is",
  "enum.isNot": "is not",
  "enum.anyOf": "is any of",
  "enum.noneOf": "is none of",
  "set.anyOf": "contains any of",
  "set.noneOf": "contains none of",
  "set.allOf": "contains all of",
  "set.notAllOf": "does not contain all of",
  "boolean.isTrue": "is true",
  "boolean.isFalse": "is false",
  "date.on": "is on",
  "date.notOn": "is not on",
  "date.before": "is before",
  "date.onOrBefore": "is on or before",
  "date.after": "is after",
  "date.onOrAfter": "is on or after",
  "date.between": "is between",
  "date.notBetween": "is not between",
} satisfies TableweaveBuiltinOperatorLabels);

export const englishTableweaveLocale: TableweaveLocale = Object.freeze({
  locale: "en-US",
  direction: "ltr",
  messages,
  builtinOperatorLabels,
} satisfies TableweaveLocale);
