import type { ReorderingMessages } from "./reordering-types.js";
export const englishReorderingMessages: Readonly<ReorderingMessages> =
  Object.freeze({
    column: "Move column",
    before: "Move before",
    after: "Move after",
    unavailable: "Reordering is unavailable.",
    pending: "A row move is awaiting resolution.",
    boundary: "No column can be moved in this direction.",
    submitted: "Column order change submitted.",
    rowUnavailable: "Row movement is unavailable.",
  });
export const arabicReorderingMessages: Readonly<ReorderingMessages> =
  Object.freeze({
    column: "نقل العمود",
    before: "نقل قبل",
    after: "نقل بعد",
    unavailable: "إعادة الترتيب غير متاحة.",
    pending: "طلب نقل صف بانتظار التسوية.",
    boundary: "لا يمكن نقل عمود في هذا الاتجاه.",
    submitted: "تم إرسال تغيير ترتيب الأعمدة.",
    rowUnavailable: "نقل الصفوف غير متاح.",
  });
