"use client";

export { reduceTableState } from "./controller/reducer.js";
export {
  createTableController,
  replaceTableDefinition,
} from "./controller/store.js";
export type * from "./controller/types.js";
export type { StateErrorCode } from "./controller/validation.js";
export {
  ControllerError,
  createTableState,
  defineController,
} from "./controller/validation.js";
export {
  useTableweaveQuery,
  useTableweaveSelector,
  useTableweaveState,
} from "./hooks/state.js";
export type {
  NativeCell,
  NativeColumn,
  NativeColumnDef,
  NativeColumnMeta,
  NativeControllerOptions,
  NativeDefinition,
  NativeDefinitionInput,
  NativeErrorCode,
  NativeFeatures,
  NativeHeader,
  NativeHeaderGroup,
  NativeInput,
  NativePageInfo,
  NativeRow,
  NativeTableHandle,
  NativeTableView,
} from "./tanstack/index.js";
export {
  createNativeColumnHelper,
  createNativeController,
  defineNativeTable,
  NativeBridgeError,
  useNativeTable,
} from "./tanstack/index.js";
