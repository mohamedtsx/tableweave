import type { DateValue } from "@tableweave/react/contracts";
import type { DateEditorMessages } from "../date/date-types.js";
import type {
  TableweaveBuiltinOperatorLabels,
  TableweaveLocale,
  TableweaveMessages,
} from "./types.js";

const relativeNames = Object.freeze({
  today: "اليوم",
  yesterday: "أمس",
  tomorrow: "غدًا",
  thisWeek: "هذا الأسبوع",
  lastWeek: "الأسبوع الماضي",
  nextWeek: "الأسبوع القادم",
  thisMonth: "هذا الشهر",
  lastMonth: "الشهر الماضي",
  nextMonth: "الشهر القادم",
  thisYear: "هذا العام",
  lastYear: "العام الماضي",
  nextYear: "العام القادم",
});

const dateEditor = Object.freeze({
  pointLabel: "التاريخ",
  startLabel: "تاريخ البداية",
  endLabel: "تاريخ النهاية",
  timeLabel: "الوقت",
  exactInstantLabel: "التاريخ والوقت الدقيقان",
  exactInstantHint:
    "أدخل تاريخًا ووقتًا بتنسيق ISO مع Z أو إزاحة صريحة عن UTC؛ يمكن تضمين أجزاء الألف من الثانية.",
  modeLabel: "نوع قيمة التاريخ",
  dayModeLabel: "يوم تقويمي",
  instantModeLabel: "لحظة زمنية دقيقة",
  relativeModeLabel: "تاريخ نسبي",
  presetsLabel: "خيار تاريخ نسبي جاهز",
  chooseDateLabel: "اختر التاريخ",
  previousMonthLabel: "الشهر السابق",
  nextMonthLabel: "الشهر التالي",
  invalidValue: "أدخل تاريخًا كاملًا وصحيحًا ضمن الحدود المحددة.",
  incompleteValue: "أكمل جميع أجزاء التاريخ والوقت قبل التطبيق.",
  ambiguousTime:
    "هذا الوقت المحلي ملتبس أو غير موجود. أدخل لحظة زمنية دقيقة بتنسيق ISO مع إزاحة صريحة.",
  formatRelative: (value) => {
    if (value.kind === "rolling")
      return `${value.direction === "past" ? "الفترة السابقة" : "الفترة القادمة"} — عدد الأيام التقويمية: ${value.days}`;
    return relativeNames[value.preset];
  },
} satisfies DateEditorMessages);

const filterTool = Object.freeze({
  unavailable: "التصفية غير متاحة.",
  invalidConfiguration: "إعدادات عامل التصفية هذا غير صحيحة.",
  submitted: "تم إرسال تغيير التصفية.",
  failed: "تعذر تغيير عامل التصفية.",
});

const messages = Object.freeze({
  builder: Object.freeze({
    filters: "عوامل التصفية",
    addRule: "إضافة قاعدة تصفية",
    field: "الحقل",
    operator: "المعامل",
    value: "القيمة",
    options: "خيارات القاعدة",
    all: "الكل",
    any: "أي منها",
    join: "مطابقة قواعد التصفية",
    clear: "مسح",
    clearLabel: "مسح قواعد منشئ التصفية",
    duplicate: "تكرار",
    negate: "نفي",
    remove: "إزالة",
    cancel: "إلغاء تعديل التصفية",
    apply: "تطبيق التصفية",
    editorTitle: "تعديل عامل التصفية",
    chooseField: "اختر حقلًا",
    chooseOperator: "اختر معاملًا",
    chooseValue: "اختر قيمة",
    searchFields: "البحث في الحقول",
    searchOptions: "البحث في الخيارات",
    loading: "جارٍ تحميل الخيارات.",
    emptyOptions: "لا توجد خيارات متاحة.",
    optionsFailed: "تعذر تحميل الخيارات.",
    retry: "إعادة محاولة تحميل الخيارات",
    nextOptions: "الخيارات التالية",
    noFields: "لا توجد حقول متاحة لمنشئ التصفية.",
    incomplete: "أكمل قيمة عامل التصفية.",
    invalid: "أدخل قيمة صحيحة لعامل التصفية.",
    mutationFailed: "تعذر إرسال تغيير التصفية.",
    staleDraft: "تغير عامل التصفية هذا. أعد فتحه لتعديل أحدث قيمة.",
    submitted: "تم إرسال تغيير التصفية.",
    applied: "تم تطبيق التصفية.",
    removed: "تمت إزالة قاعدة التصفية.",
    cleared: "تم مسح قواعد منشئ التصفية.",
    accessUnavailable: "أدوات التصفية غير متاحة.",
    unavailableValue: "غير متاح",
    customEditorMissing: "يلزم محرر مخصص للقيمة.",
    from: "من",
    to: "إلى",
  }),
  search: Object.freeze({
    ...filterTool,
    label: "البحث في السجلات",
    placeholder: "بحث…",
    clearLabel: "مسح البحث",
    cancelled: "تم إلغاء تعديل البحث.",
    invalidValue: "أدخل عبارة بحث صحيحة.",
  }),
  tabs: Object.freeze({
    ...filterTool,
    label: "تصفية السجلات حسب علامة التبويب",
    previousTabsLabel: "علامات تبويب التصفية السابقة",
    nextTabsLabel: "علامات تبويب التصفية التالية",
  }),
  date: Object.freeze<TableweaveMessages["date"]>({
    ...filterTool,
    ...dateEditor,
    label: "التصفية حسب التاريخ",
    applyLabel: "تطبيق تصفية التاريخ",
    cancelLabel: "إلغاء تعديل التاريخ",
    clearLabel: "مسح تصفية التاريخ",
    emptySummary: "أي تاريخ",
    formatTimeZone: (timeZone) => `المنطقة الزمنية: ${timeZone}`,
    formatSummary: (date, context) => {
      function point(value: DateValue): string {
        if (value.kind === "relative" || value.kind === "rolling")
          return dateEditor.formatRelative(value);
        // ISO day strings are wire values, not translated identifiers. Format
        // only on an explicit call; never construct an eager Intl formatter.
        if (value.kind === "day") {
          const instant = new Date(`${value.value}T00:00:00.000Z`);
          return new Intl.DateTimeFormat(context.locale, {
            timeZone: "UTC",
            year: "numeric",
            month: "short",
            day: "numeric",
          }).format(instant);
        }
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
  collection: Object.freeze<TableweaveMessages["collection"]>({
    pageCheckbox: "تحديد الصفوف المؤهلة في هذه الصفحة",
    rowCheckbox: (text) => `تحديد ${text}`,
    sortButton: (text, direction, priority) =>
      `ترتيب ${text}${direction ? `، ${direction === "ascending" ? "تصاعدي" : "تنازلي"}، الأولوية ${priority}` : "، غير مرتب"}`,
    sortEntry: (id, direction, priority) =>
      `${id} ${direction === "ascending" ? "تصاعدي" : "تنازلي"}، الأولوية ${priority}`,
    sortPriority: (priority) => ` (${priority})`,
    sortOrderLabel: "تسلسل الترتيب",
    sortSeparator: "؛ ",
    notSorted: "غير مرتب",
    selectedCount: (count) => `عدد الصفوف المحددة: ${count}`,
    subscribedCountLabel: "العدد المشترك للصفوف المحددة",
    subscribedCount: (count) => String(count),
    invalidColumns:
      "يجب أن تكون لأعمدة المجموعة معرّفات فريدة وعمود بيانات ظاهر لعناوين الصفوف",
    invalidRows:
      "يجب أن تكون لصفوف المجموعة وللصفوف المؤهلة في الصفحة معرّفات ثابتة وفريدة",
    invalidRowHeader:
      "يتطلب NativeCollection عمود بيانات لعناوين الصفوف وعمود بيانات نهائيًا ظاهرًا",
    invalidSelectionColumn:
      "يجب أن يكون عمود التحديد في NativeCollection عمودًا مساعدًا ظاهرًا",
    missingCell: "إحدى الخلايا الظاهرة في المجموعة مفقودة",
  }),
  sorting: Object.freeze<TableweaveMessages["sorting"]>({
    trigger: "ترتيب",
    title: "الترتيب",
    priorities: "أولوية الترتيب",
    none: "لم يُطبَّق ترتيب",
    ascending: "تصاعدي",
    descending: "تنازلي",
    remove: "إزالة",
    addAscending: "إضافة ترتيب تصاعدي",
    addDescending: "إضافة ترتيب تنازلي",
    hidden: "عمود مخفي",
    unavailable: "أدوات الترتيب غير متاحة",
    disabled: "تغييرات الترتيب معطلة",
    unsortable: "الترتيب غير مفعّل لهذا العمود",
    singleOnly: "يدعم هذا العمود الترتيب المنفرد فقط",
    actionName: (action, label) => `${action}: ${label}`,
    priority: (position, label, direction, visibility) =>
      `${position}. ${label}: ${direction}${visibility ? ` (${visibility})` : ""}`,
  }),
  columnChooser: Object.freeze({
    trigger: "الأعمدة",
    title: "الأعمدة الظاهرة",
    required: "عمود مطلوب",
    finalVisible: "يجب أن يظل عمود بيانات واحد على الأقل ظاهرًا",
    unavailable: "أدوات الأعمدة غير متاحة",
    disabled: "تغييرات الأعمدة معطلة",
  }),
  selectionToolbar: Object.freeze<TableweaveMessages["selectionToolbar"]>({
    normalLabel: "أدوات الجدول",
    selectionLabel: "تحديد الصفوف",
    actionsLabel: "إجراءات التحديد",
    selectedCount: (count) => `عدد الصفوف المحددة: ${count}`,
    cancel: "إلغاء",
    cancelLabel: "مسح تحديد الصفوف",
  }),
  pagination: Object.freeze<TableweaveMessages["pagination"]>({
    navigation: "التنقل بين الصفحات",
    rowsPerPage: "عدد الصفوف في الصفحة",
    previous: "الصفحة السابقة",
    next: "الصفحة التالية",
    retry: "إعادة المحاولة",
    noPages: "لا توجد صفحات",
    unavailable: "تفاصيل الصفحات غير متاحة بعد.",
    unknownRange: "نطاق السجلات غير متاح للصفحة المعروضة.",
    updating: "جارٍ تحديث النتائج.",
    retained: "تُعرض النتائج السابقة للصفحة المعروضة.",
    stale: "قد تكون النتائج المعروضة غير محدثة.",
    navigationUnavailable: "التنقل غير متاح حتى تصبح النتائج الحالية جاهزة.",
    firstPage: "لا توجد صفحة سابقة.",
    lastPage: "لا توجد صفحة تالية.",
    page: (page) => `الصفحة ${page}`,
    knownPage: (page, count) => `الصفحة ${page} من ${count}`,
    outOfRange: (page, count) =>
      `الصفحة المعروضة ${page} خارج النطاق. عدد الصفحات الحالي: ${count}.`,
    knownRange: (from, to, total) => `${from}–${to} من إجمالي السجلات: ${total}`,
    unknownTotalRange: (from, to) => `نطاق السجلات: ${from}–${to}`,
    unknownRangeKnownTotal: (total) =>
      `نطاق السجلات غير متاح للصفحة المعروضة. إجمالي السجلات: ${total}.`,
  }),
  details: Object.freeze({
    close: "إغلاق التفاصيل",
    cancel: "إغلاق",
    loading: "جارٍ تحميل تفاصيل السجل.",
    missing: "هذا السجل غير متاح.",
    unavailable: "تعذر تحميل التفاصيل.",
    offline: "التفاصيل غير متاحة دون اتصال.",
    timeout: "انتهت مهلة تحميل التفاصيل.",
    retry: "إعادة المحاولة",
    checking: "جارٍ التحقق من إمكانية إغلاق التفاصيل.",
  }),
} satisfies TableweaveMessages);

const builtinOperatorLabels = Object.freeze({
  empty: "فارغ",
  notEmpty: "غير فارغ",
  "text.contains": "يحتوي على",
  "text.notContains": "لا يحتوي على",
  "text.is": "هو",
  "text.isNot": "ليس",
  "text.startsWith": "يبدأ بـ",
  "text.notStartsWith": "لا يبدأ بـ",
  "text.endsWith": "ينتهي بـ",
  "text.notEndsWith": "لا ينتهي بـ",
  "number.eq": "يساوي",
  "number.ne": "لا يساوي",
  "number.gt": "أكبر من",
  "number.gte": "أكبر من أو يساوي",
  "number.lt": "أقل من",
  "number.lte": "أقل من أو يساوي",
  "number.between": "بين",
  "number.notBetween": "ليس بين",
  "enum.is": "هو",
  "enum.isNot": "ليس",
  "enum.anyOf": "أحد الخيارات التالية",
  "enum.noneOf": "ليس أيًا من الخيارات التالية",
  "set.anyOf": "يحتوي على أي من",
  "set.noneOf": "لا يحتوي على أي من",
  "set.allOf": "يحتوي على جميع",
  "set.notAllOf": "لا يحتوي على جميع",
  "boolean.isTrue": "صحيح",
  "boolean.isFalse": "خطأ",
  "date.on": "في تاريخ",
  "date.notOn": "ليس في تاريخ",
  "date.before": "قبل",
  "date.onOrBefore": "في التاريخ أو قبله",
  "date.after": "بعد",
  "date.onOrAfter": "في التاريخ أو بعده",
  "date.between": "بين",
  "date.notBetween": "ليس بين",
} satisfies TableweaveBuiltinOperatorLabels);

export const arabicTableweaveLocale: TableweaveLocale = Object.freeze({
  locale: "ar",
  direction: "rtl",
  messages,
  builtinOperatorLabels,
} satisfies TableweaveLocale);
