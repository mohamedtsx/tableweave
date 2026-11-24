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
export {
  beginControlsRequest,
  ControlsError,
  createControlsAuthority,
  getControlsAuthorityOwner,
  getControlsRequestBinding,
  projectControls,
} from "./presentation/index.js";
export type * from "./presentation/types.js";
export type {
  EmptyKind,
  PageInfo,
  ResourceAdapter,
  ResourceAdapterOptions,
  ResourceContext,
  ResourceError,
  ResourceErrorCode,
  ResourceInvalidation,
  ResourceInvalidationReason,
  ResourceRequest,
  ResourceRequestInput,
  ResourceSnapshot,
  ResourceSuccess,
  ResourceView,
} from "./resource/index.js";
export {
  createResourceAdapter,
  projectResourceView,
  useTableweaveResource,
} from "./resource/index.js";
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
  NativeSelectionMode,
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
