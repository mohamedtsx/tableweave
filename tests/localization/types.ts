import type { QuerySchema } from "../../packages/react/src/contracts/types.js";
import type { FilterFieldPresentation } from "../../packages/heroui/src/filters/types.js";
import {
  arabicTableweaveLocale,
  englishTableweaveLocale,
} from "../../packages/heroui/src/localization/index.js";
import type {
  TableweaveBuiltinOperatorLabels,
  TableweaveLocale,
  TableweaveMessages,
} from "../../packages/heroui/src/localization/index.js";

const en: TableweaveLocale = englishTableweaveLocale;
const ar: TableweaveLocale = arabicTableweaveLocale;
const messages: TableweaveMessages = ar.messages;
const labels: NonNullable<FilterFieldPresentation<QuerySchema>["operatorLabels"]> =
  ar.builtinOperatorLabels;
const allBuiltins: TableweaveBuiltinOperatorLabels = en.builtinOperatorLabels;
const page: string = ar.messages.pagination.knownPage("٢", "١٠");
const priority: string = ar.messages.sorting.priority("٢", "حقل", "تصاعدي", "");
void [messages, labels, allBuiltins, page, priority];

// These are compile-only rejection fixtures; removal proof belongs to final phase.
// @ts-expect-error locale metadata is readonly
ar.direction = "ltr";
// @ts-expect-error aggregate dictionaries cannot be retargeted
en.messages = ar.messages;
// @ts-expect-error builder's originally mutable port is readonly in the aggregate
ar.messages.builder.filters = "changed";
// @ts-expect-error all nested function references are readonly
ar.messages.pagination.page = () => "changed";
// @ts-expect-error built-in ID dictionary is readonly
ar.builtinOperatorLabels["text.contains"] = "changed";
// @ts-expect-error no invented builder message field for operator presentation
ar.messages.builder.operatorLabels;
// @ts-expect-error complete existing port, not a partial dictionary
const incomplete: TableweaveMessages["details"] = { close: "إغلاق" };
// @ts-expect-error all accepted built-in IDs are required
const incompleteOperators: TableweaveBuiltinOperatorLabels = { empty: "فارغ" };
// @ts-expect-error preformatted pager arguments stay strings
ar.messages.pagination.knownPage(2, 10);
// @ts-expect-error collection's actual port still takes a raw number
ar.messages.collection.selectedCount("٢");
void [incomplete, incompleteOperators];
