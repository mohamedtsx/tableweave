import type { ReorderingMessages } from "../../../packages/heroui/src/table/reordering-types.js";
import type { TableweaveLocale } from "../../../packages/heroui/src/localization/types.js";
import { englishDataTableLocale } from "../../../packages/heroui/src/localization/data-table.js";
// Positive compatibility only: original eight-key custom groups remain valid.
export const original: ReorderingMessages = {
  column: "Column",
  before: "Before",
  after: "After",
  unavailable: "Unavailable",
  pending: "Pending",
  boundary: "Boundary",
  submitted: "Submitted",
  rowUnavailable: "Row unavailable",
};
export const oldLocale: TableweaveLocale = {
  ...englishDataTableLocale,
  messages: { ...englishDataTableLocale.messages, reordering: original },
};
export const optionalRow: ReorderingMessages = {
  ...original,
  row: "Row",
  up: "Up",
  down: "Down",
  rowSubmitted: "Requested",
  rowUncertain: "Await reconciliation",
};
