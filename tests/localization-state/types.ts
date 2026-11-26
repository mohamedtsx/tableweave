import {
  arabicDataTableLocale,
  englishDataTableLocale,
} from "../../packages/heroui/src/localization/data-table.js";
import type {
  DataTableLocale,
  DataTableStateMessages,
} from "../../packages/heroui/src/table/types.js";

export const locales: readonly DataTableLocale[] = [
  englishDataTableLocale,
  arabicDataTableLocale,
];
export function retryLabel(messages: Readonly<DataTableStateMessages>): string {
  return messages.retry;
}
