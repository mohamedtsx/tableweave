import type { ReorderingMessages } from "./reordering-types.js";
export const englishReorderingMessages: Readonly<ReorderingMessages> =
  Object.freeze({
    column: "Move column",
    row: "Move row",
    up: "Move up",
    down: "Move down",
    rowSubmitted: "Row move submitted.",
    rowUncertain:
      "The row move status is uncertain. Await application reconciliation.",
    rowBoundary: "No row can be moved in this direction.",
    before: "Move before",
    after: "Move after",
    unavailable: "Reordering is unavailable.",
    pending: "A row move is awaiting resolution.",
    boundary: "No column can be moved in this direction.",
    submitted: "Column order change submitted.",
    rowUnavailable:
      "Row moves require current eligible rows in manual order, with no active sorting or filtering.",
  });
export const arabicReorderingMessages: Readonly<ReorderingMessages> =
  Object.freeze({
    column: "نقل العمود",
    row: "نقل الصف",
    up: "نقل لأعلى",
    down: "نقل لأسفل",
    rowSubmitted: "تم إرسال طلب نقل الصف.",
    rowUncertain: "حالة نقل الصف غير مؤكدة. بانتظار التسوية من التطبيق.",
    rowBoundary: "لا يمكن نقل صف في هذا الاتجاه.",
    before: "نقل قبل",
    after: "نقل بعد",
    unavailable: "إعادة الترتيب غير متاحة.",
    pending: "طلب نقل صف بانتظار التسوية.",
    boundary: "لا يمكن نقل عمود في هذا الاتجاه.",
    submitted: "تم إرسال تغيير ترتيب الأعمدة.",
    rowUnavailable:
      "يتطلب نقل الصفوف بيانات حالية مؤهلة بترتيب يدوي، دون فرز أو تصفية نشطة.",
  });
