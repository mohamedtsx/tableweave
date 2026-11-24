import type {
  PaginationCorrectionContext,
  PaginationMessages,
  PaginationProps,
} from "@pagination-under-test";
import { Pagination, usePaginationCorrection } from "@pagination-under-test";
import type {
  ControlsAuthority,
  ControlsPresentation,
  TableController,
} from "@tableweave/react";
import { defineQuerySchema } from "@tableweave/react/contracts";

const schema = defineQuerySchema({
  id: "pagination-types",
  version: 1,
  fields: { amount: { type: "number", owner: "builder" } },
});
interface Record {
  id: string;
  amount: number;
}
declare const presentation: ControlsPresentation<typeof schema, Record>;
declare const authority: ControlsAuthority<typeof schema, Record>;
declare const controller: TableController<typeof schema>;
declare const correction: PaginationCorrectionContext<typeof schema, Record>;
declare const messages: PaginationMessages;
const props: PaginationProps<typeof schema, Record> = {
  schema,
  presentation,
  authority,
  messages,
  locale: "ar-EG",
  formatNumber: (value, locale) => new Intl.NumberFormat(locale).format(value),
  onRetry: (latest) => {
    latest.selectedIds satisfies readonly string[];
  },
};
Pagination(props);
usePaginationCorrection(controller, presentation, authority, correction);
const methodContext = {
  definition: correction.definition,
  context: correction.context,
  epoch: 0,
  readCurrent() {
    return { context: this.context, epoch: this.epoch };
  },
};
usePaginationCorrection(controller, presentation, authority, methodContext);
const asynchronousContext = {
  ...methodContext,
  readCurrent: async () => ({ context: correction.context, epoch: 0 }),
};
usePaginationCorrection(
  controller,
  presentation,
  authority,
  // @ts-expect-error an asynchronous current-read port is not a supported lifecycle contract
  asynchronousContext,
);
const vendorProps: PaginationProps<typeof schema, Record> = {
  ...props,
  // @ts-expect-error no vendor selection contract
  selectedKeys: new Set(),
};
// @ts-expect-error complete message dictionary, not English fallback under partial translation
const partial: PaginationMessages = { next: "Next" };
// @ts-expect-error app causality context is required, not a guessed query mirror
usePaginationCorrection(controller, presentation, authority, {
  definition: correction.definition,
  context: correction.context,
});
const badFormat: PaginationProps<typeof schema, Record> = {
  ...props,
  // @ts-expect-error formatter cannot return a UI node
  formatNumber: () => ({}),
};
void vendorProps;
void partial;
void badFormat;
