import type {
  ControlsAuthority,
  ControlsPresentation,
  TableController,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import type {
  ReorderAdmission,
  ReorderAdmissionLease,
} from "@tableweave/react/reordering-controller";
import type { TableRendererConfig } from "../../../packages/heroui/src/table/types.js";
import type { TableReorderingNavigation } from "../../../packages/heroui/src/table/reordering-types.js";
import { usePaginationCorrection } from "../../../packages/heroui/src/pagination/usePaginationCorrection.js";
import type { PaginationCorrectionContext } from "../../../packages/heroui/src/pagination/types.js";
export function configuration<S extends QuerySchema, T extends object>(
  admission: ReorderAdmission<S, T>,
  lease: ReorderAdmissionLease<S, T>,
): TableRendererConfig<S, T> {
  return {
    reordering: {
      rows: {
        admission,
        lease,
        handleColumnId: "title",
        onSubmit(operation) {
          void operation;
        },
      },
      columns: true,
    },
    messages: { reordering: { before: "Move before" } },
  };
}
export const columnOnly = <
  S extends QuerySchema,
  T extends object,
>(): TableRendererConfig<S, T> => ({ reordering: { columns: true } });
export const omitted = <
  S extends QuerySchema,
  T extends object,
>(): TableRendererConfig<S, T> => ({});
export function Correction<S extends QuerySchema, T extends object>(props: {
  controller: TableController<S>;
  presentation: ControlsPresentation<S, T>;
  authority: ControlsAuthority<S, T>;
  context: PaginationCorrectionContext<S, T>;
  navigation: TableReorderingNavigation<S, T>;
}) {
  usePaginationCorrection(
    props.controller,
    props.presentation,
    props.authority,
    props.context,
    props.navigation,
  );
  return null;
}
