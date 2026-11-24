import type {
  CriteriaOrigin,
  CriteriaSourceMetadata,
  DataTableModel,
  DataTableRecovery,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import type { ReactNode } from "react";
import type { ColumnChooserProps } from "../columns/types.js";
import type { FilterBuilderProps } from "../filters/types.js";
import type {
  TableweaveBuiltinOperatorLabels,
  TableweaveLocale,
  TableweaveMessages,
} from "../localization/types.js";
import type { PaginationProps } from "../pagination/types.js";
import type {
  SelectionAction,
  SelectionToolbarProps,
} from "../selection/types.js";
import type { FilterDateProps } from "../toolbar/filter-date.js";
import type { FilterSearchProps } from "../toolbar/filter-search.js";
import type { FilterTabsProps } from "../toolbar/filter-tabs.js";
import type { NativeCollectionProps } from "./native-collection.js";

export interface DataTableStateMessages {
  readonly uncommitted: string;
  readonly unavailable: string;
  readonly idle: string;
  readonly loading: string;
  readonly initialError: string;
  readonly offline: string;
  readonly timeout: string;
  readonly updating: string;
  readonly updateFailed: string;
  readonly emptyDataset: string;
  readonly noMatches: string;
  readonly unknownEmpty: string;
  readonly noRecordOnPage: string;
  readonly retry: string;
}
export interface DataTableMessages extends TableweaveMessages {
  readonly state: Readonly<DataTableStateMessages>;
}
export interface DataTableLocale extends Omit<TableweaveLocale, "messages"> {
  readonly messages: DataTableMessages;
}
export type TableRendererCollectionConfig<
  S extends QuerySchema,
  T extends object,
> = Pick<
  NativeCollectionProps<S, T>,
  | "label"
  | "rowHeaderColumnId"
  | "selectionColumnId"
  | "rowTextValue"
  | "columnTextValue"
  | "cellTextValue"
>;
export interface TableRendererStateContext<
  S extends QuerySchema,
  T extends object,
> {
  readonly model: DataTableModel<S, T>;
  readonly recovery: DataTableRecovery;
  readonly metadata: CriteriaSourceMetadata<S>;
}
export interface TableRendererToolbarContext<
  S extends QuerySchema,
  T extends object,
> extends TableRendererStateContext<S, T> {
  readonly frame: NonNullable<DataTableModel<S, T>["frame"]>;
  readonly view: NonNullable<DataTableModel<S, T>["view"]>;
  readonly presentation: NonNullable<DataTableModel<S, T>["presentation"]>;
  readonly defaultContent: ReactNode;
}
export interface TableRendererToolConfigs<S extends QuerySchema> {
  readonly builder?: Omit<
    FilterBuilderProps<S>,
    "controller" | "criteria" | "expectedResourceContext" | "invalidationKey"
  >;
  readonly search?: Omit<
    FilterSearchProps<S>,
    "controller" | "criteria" | "expectedContext" | "invalidationKey"
  >;
  readonly tabs?: Omit<
    FilterTabsProps<S>,
    "controller" | "criteria" | "expectedContext" | "invalidationKey"
  >;
  readonly date?: Omit<
    FilterDateProps<S>,
    "controller" | "criteria" | "expectedContext" | "invalidationKey"
  >;
}
export type TableRendererMessageConfig = Omit<
  Partial<DataTableMessages>,
  "collection" | "selectionToolbar"
> & {
  readonly collection?: Partial<TableweaveMessages["collection"]>;
  readonly selectionToolbar?: Partial<TableweaveMessages["selectionToolbar"]>;
};
export type TableRendererOwnedMessages = Pick<
  TableRendererMessageConfig,
  | "collection"
  | "sorting"
  | "columnChooser"
  | "selectionToolbar"
  | "pagination"
  | "state"
>;
export type TableRendererChildMessages = Pick<
  TableRendererMessageConfig,
  "builder" | "search" | "tabs" | "date" | "dateEditor" | "details"
>;
export interface TableRendererConfig<S extends QuerySchema, T extends object> {
  /** Optional outer branch permits source-only state without invented row ports. */
  readonly collection?: TableRendererCollectionConfig<S, T>;
  readonly renderToolbar?: (
    context: TableRendererToolbarContext<S, T>,
  ) => ReactNode;
  readonly renderState?: (
    context: TableRendererStateContext<S, T>,
  ) => ReactNode;
  readonly onRetry?: () => void | Promise<void>;
  readonly actions?: readonly SelectionAction<S, T>[];
  readonly getRestoreFocusTarget?: SelectionToolbarProps<
    S,
    T
  >["getRestoreFocusTarget"];
  readonly onError?: SelectionToolbarProps<S, T>["onError"];
  readonly formatNumber?: PaginationProps<S, T>["formatNumber"];
  readonly columns?: Pick<
    ColumnChooserProps<S, T>,
    "labels" | "isDisabled" | "disabledReason" | "id" | "className" | "onResult"
  >;
  readonly messages?: TableRendererMessageConfig;
  readonly locale?: DataTableLocale;
  /** Captured references only: each child owns its own later private capture. */
  readonly tools?: TableRendererToolConfigs<S>;
}
export interface TableRendererPorts<S extends QuerySchema, T extends object>
  extends Omit<TableRendererConfig<S, T>, "locale" | "messages" | "tools"> {
  readonly messages: Readonly<TableRendererOwnedMessages>;
  readonly locale?: Readonly<Pick<DataTableLocale, "locale" | "direction">>;
  readonly childDefaults: Readonly<{
    readonly messages: Readonly<TableRendererChildMessages>;
    readonly builtinOperatorLabels?: TableweaveBuiltinOperatorLabels;
  }>;
  readonly toolConfigs: Readonly<TableRendererToolConfigs<S>>;
}
declare const rendererLease: unique symbol;
declare const rendererActor: unique symbol;
declare const rendererLocal: unique symbol;
declare const rendererWork: unique symbol;
export interface TableRendererLease<S extends QuerySchema, T extends object> {
  readonly [rendererLease]: (schema: S, row: T) => readonly [S, T];
}
export interface TableRendererActor<S extends QuerySchema, T extends object> {
  readonly [rendererActor]: (schema: S, row: T) => readonly [S, T];
}
export interface TableRendererCommitted<
  S extends QuerySchema,
  T extends object,
> {
  readonly actor: TableRendererActor<S, T>;
  readonly ports: TableRendererPorts<S, T>;
  readonly origin: CriteriaOrigin<S>;
  readonly model: DataTableModel<S, T>;
  readonly metadata: CriteriaSourceMetadata<S>;
}
export interface TableRendererSnapshot<
  S extends QuerySchema,
  T extends object,
> {
  /** Original core actor/local version. Metadata-only updates do not change it. */
  readonly version: object;
  readonly actor: TableRendererActor<S, T> | null;
  readonly modelVersion: object;
}
export interface TableRendererLocal<
  S extends QuerySchema,
  T extends object,
  Value,
> {
  readonly [rendererLocal]: (
    schema: S,
    row: T,
    value: Value,
  ) => readonly [S, T, Value];
  readonly read: (
    actor: TableRendererActor<NoInfer<S>, NoInfer<T>>,
  ) => Value | null;
  readonly write: (
    actor: TableRendererActor<NoInfer<S>, NoInfer<T>>,
    value: Value,
  ) => void;
  readonly clear: (actor: TableRendererActor<NoInfer<S>, NoInfer<T>>) => void;
}
export interface TableRendererWork<S extends QuerySchema, T extends object> {
  readonly [rendererWork]: (schema: S, row: T) => readonly [S, T];
  readonly deadline: number | null;
}
export interface TableRendererCell<S extends QuerySchema, T extends object> {
  readonly getSnapshot: () => TableRendererSnapshot<S, T>;
  readonly subscribe: (listener: () => void) => () => void;
  readonly connect: () => TableRendererLease<S, T>;
  readonly commit: (
    lease: TableRendererLease<NoInfer<S>, NoInfer<T>>,
    model: DataTableModel<NoInfer<S>, NoInfer<T>>,
    opaqueConfig: TableRendererConfig<NoInfer<S>, NoInfer<T>>,
  ) => TableRendererActor<S, T>;
  readonly updateModel: (
    lease: TableRendererLease<NoInfer<S>, NoInfer<T>>,
    model: DataTableModel<NoInfer<S>, NoInfer<T>>,
  ) => void;
  readonly require: (
    actor: TableRendererActor<NoInfer<S>, NoInfer<T>>,
  ) => TableRendererCommitted<S, T>;
  readonly disconnect: (
    lease: TableRendererLease<NoInfer<S>, NoInfer<T>>,
  ) => void;
  createLocal<Value>(
    role: "draft" | "session" | "receipt",
  ): TableRendererLocal<S, T, Value>;
  createLocal(role: "notice" | "text"): TableRendererLocal<S, T, string>;
  createLocal(role: "ime"): TableRendererLocal<S, T, boolean>;
  readonly timeout: (
    actor: TableRendererActor<NoInfer<S>, NoInfer<T>>,
    delay: number,
    run: (committed: TableRendererCommitted<S, T>) => undefined,
  ) => TableRendererWork<S, T>;
  readonly animationFrame: (
    actor: TableRendererActor<NoInfer<S>, NoInfer<T>>,
    run: (committed: TableRendererCommitted<S, T>) => undefined,
  ) => TableRendererWork<S, T>;
  readonly cancelWork: (
    actor: TableRendererActor<NoInfer<S>, NoInfer<T>>,
    handle: TableRendererWork<NoInfer<S>, NoInfer<T>>,
  ) => void;
}
