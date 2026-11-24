import type {
  CollectionMessages,
  ColumnChooserMessages,
  PaginationMessages,
  SelectionToolbarMessages,
  SortingMessages,
} from "@tableweave/heroui";

const direction = (value: "ascending" | "descending") =>
  value === "ascending" ? "تصاعدي" : "تنازلي";
export const arabicCollection: CollectionMessages = {
  pageCheckbox: "اختيار الصفوف المؤهلة في الصفحة",
  rowCheckbox: (name) => `اختيار ${name}`,
  sortButton: (name, value, priority) =>
    `ترتيب ${name}، ${value ? `${direction(value)}، أولوية ${priority}` : "بدون ترتيب"}`,
  sortEntry: (id, value, priority) =>
    `${id} ${direction(value)}، أولوية ${priority}`,
  sortPriority: (priority) => ` (${priority})`,
  sortOrderLabel: "أولوية الأعمدة",
  sortSeparator: "؛ ",
  notSorted: "بدون ترتيب",
  selectedCount: (count) => `${count} اختيارات`,
  subscribedCountLabel: "عدد الاختيارات المشترك",
  subscribedCount: (count) => String(count),
  invalidColumns: "أعمدة غير صالحة",
  invalidRows: "صفوف غير صالحة",
  invalidRowHeader: "عنوان صف غير صالح",
  invalidSelectionColumn: "عمود اختيار غير صالح",
  missingCell: "خلية مفقودة",
};
export const arabicSelection: SelectionToolbarMessages = {
  normalLabel: "أدوات الجدول",
  selectionLabel: "اختيار الصفوف",
  actionsLabel: "إجراءات الاختيار",
  selectedCount: (count) => `${count} اختيارات`,
  cancel: "إلغاء الاختيار",
  cancelLabel: "مسح اختيار الصفوف",
};
export const arabicChooser: ColumnChooserMessages = {
  trigger: "الأعمدة",
  title: "الأعمدة المعروضة",
  required: "عمود مطلوب",
  finalVisible: "يجب إبقاء عمود بيانات واحد ظاهرًا",
  unavailable: "الأعمدة غير متاحة",
  disabled: "تغييرات الأعمدة معطلة",
};
export const arabicSorting: SortingMessages = {
  trigger: "ترتيب",
  title: "الترتيب",
  priorities: "أولوية الترتيب",
  none: "بدون ترتيب",
  ascending: "تصاعدي",
  descending: "تنازلي",
  remove: "إزالة",
  addAscending: "إضافة تصاعدي",
  addDescending: "إضافة تنازلي",
  hidden: "عمود مخفي",
  unavailable: "الترتيب غير متاح",
  disabled: "تغييرات الترتيب معطلة",
  unsortable: "الترتيب غير مفعل لهذا العمود",
  singleOnly: "ترتيب منفرد فقط",
  actionName: (action, label) => `${action}: ${label}`,
  priority: (position, label, value, visibility) =>
    `${position}. ${label}: ${value}${visibility ? ` (${visibility})` : ""}`,
};
export const arabicPagination: PaginationMessages = {
  navigation: "التنقل بين الصفحات",
  rowsPerPage: "عدد الصفوف في الصفحة",
  previous: "الصفحة السابقة",
  next: "الصفحة التالية",
  retry: "إعادة المحاولة",
  noPages: "لا توجد صفحات",
  unavailable: "تفاصيل الصفحات غير متاحة بعد.",
  unknownRange: "نطاق الصفحة المعروضة غير متاح.",
  updating: "جار تحديث النتائج.",
  retained: "تظهر النتائج السابقة للصفحة المعروضة.",
  stale: "قد تكون النتائج المعروضة غير محدثة.",
  navigationUnavailable: "التنقل غير متاح حتى تصبح النتائج الحالية جاهزة.",
  firstPage: "لا توجد صفحة سابقة.",
  lastPage: "لا توجد صفحة تالية.",
  page: (page) => `الصفحة ${page}`,
  knownPage: (page, count) => `الصفحة ${page} من ${count}`,
  outOfRange: (page, count) =>
    `الصفحة المعروضة ${page} خارج نطاق ${count} صفحات.`,
  knownRange: (from, to, total) => `${from}–${to} من ${total} سجل`,
  unknownTotalRange: (from, to) => `${from}–${to} سجل`,
  unknownRangeKnownTotal: (total) =>
    `نطاق الصفحة المعروضة غير متاح. إجمالي ${total} سجل.`,
};
