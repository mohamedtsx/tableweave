import { englishDataTableLocale } from "../../packages/heroui/src/localization/data-table.js";
import type { DataTableStateMessages } from "../../packages/heroui/src/table/types.js";

declare const messages: DataTableStateMessages;
// @ts-expect-error NEGATIVE readonly captured state strings
messages.retry = "Changed";
// @ts-expect-error NEGATIVE readonly composed bundle
englishDataTableLocale.messages.state = messages;
// @ts-expect-error NEGATIVE unknown state key
export const exportLabel = messages.export;
// @ts-expect-error NEGATIVE action is not a message string
export const callback: string = () => "Retry";
