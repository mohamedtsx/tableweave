import type {
  DataTableLocale,
  DataTableNeutralMessages,
  DataTableStateMessages,
} from "../table/types.js";
import { arabicTableweaveLocale } from "./arabic.js";
import { englishTableweaveLocale } from "./english.js";
export const englishDataTableNeutralMessages = Object.freeze({
  uncommitted: "Preparing the table.",
  unavailable: "The table is unavailable.",
} satisfies DataTableNeutralMessages);
export const arabicDataTableNeutralMessages = Object.freeze({
  uncommitted: "جارٍ تجهيز الجدول.",
  unavailable: "الجدول غير متاح.",
} satisfies DataTableNeutralMessages);

const englishState = Object.freeze({
  uncommitted: "Preparing the table.",
  unavailable: "The table is unavailable.",
  idle: "Records have not been loaded yet.",
  loading: "Loading records…",
  initialError: "Records could not be loaded.",
  offline: "The connection is unavailable.",
  timeout: "Loading records timed out.",
  updating: "Updating records…",
  updateFailed:
    "Records could not be updated. Showing the last available data.",
  emptyDataset: "There are no records.",
  noMatches: "No records match.",
  unknownEmpty: "There are no records to display.",
  noRecordOnPage: "There are no records on this page.",
  retry: "Retry",
} satisfies DataTableStateMessages);

const arabicState = Object.freeze({
  uncommitted: "جارٍ تجهيز الجدول.",
  unavailable: "الجدول غير متاح.",
  idle: "لم يبدأ تحميل السجلات بعد.",
  loading: "جارٍ تحميل السجلات…",
  initialError: "تعذّر تحميل السجلات.",
  offline: "الاتصال غير متاح.",
  timeout: "انتهت مهلة تحميل السجلات.",
  updating: "جارٍ تحديث السجلات…",
  updateFailed: "تعذّر تحديث السجلات. تظهر آخر بيانات متاحة.",
  emptyDataset: "لا توجد سجلات.",
  noMatches: "لا توجد سجلات مطابقة.",
  unknownEmpty: "لا توجد سجلات لعرضها.",
  noRecordOnPage: "لا توجد سجلات في هذه الصفحة.",
  retry: "إعادة المحاولة",
} satisfies DataTableStateMessages);

/** Source-module composition only; existing eleven-port bundles are unchanged. */
export const englishDataTableLocale = Object.freeze({
  neutralMessages: englishDataTableNeutralMessages,
  detailsRegionLabel: "Record details region",
  ...englishTableweaveLocale,
  messages: Object.freeze({
    ...englishTableweaveLocale.messages,
    state: englishState,
  }),
} satisfies DataTableLocale);

export const arabicDataTableLocale = Object.freeze({
  neutralMessages: arabicDataTableNeutralMessages,
  detailsRegionLabel: "منطقة تفاصيل السجل",
  ...arabicTableweaveLocale,
  messages: Object.freeze({
    ...arabicTableweaveLocale.messages,
    state: arabicState,
  }),
} satisfies DataTableLocale);
