import type { QuerySchema } from "@tableweave/react/contracts";
import type {
  ColumnControlOptions,
  ColumnControlsTarget,
} from "../columns/types.js";

export interface SortingMessages {
  readonly trigger: string;
  readonly title: string;
  readonly priorities: string;
  readonly none: string;
  readonly ascending: string;
  readonly descending: string;
  readonly remove: string;
  readonly addAscending: string;
  readonly addDescending: string;
  readonly hidden: string;
  readonly unavailable: string;
  readonly disabled: string;
  readonly unsortable: string;
  readonly singleOnly: string;
  readonly actionName: (action: string, label: string) => string;
  readonly priority: (
    position: string,
    label: string,
    direction: string,
    visibility: string,
  ) => string;
}
export interface SortingProps<S extends QuerySchema, T extends object>
  extends ColumnControlsTarget<S, T>,
    ColumnControlOptions {
  readonly messages?: SortingMessages;
}
