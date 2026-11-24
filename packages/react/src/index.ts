"use client";

export { reduceTableState } from "./controller/reducer.js";
export {
  createTableController,
  replaceTableDefinition,
} from "./controller/store.js";
export type * from "./controller/types.js";
export type * from "./controller/criteria.js";
export {
  createCriteriaAuthority,
  CriteriaAuthorityError,
  getCriteriaAuthorityOrigin,
  requireCriteriaAuthority,
} from "./controller/criteria.js";
export type * from "./controller/criteria-publication.js";
export {
  createCriteriaPublication,
  CriteriaPublicationError,
  getCriteriaPublicationBinding,
} from "./controller/criteria-publication.js";
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
  CriteriaCommittedFrame,
  CriteriaFrameInput,
  CriteriaFrameObserver,
  CriteriaFrameOwner,
  CriteriaFramePair,
  CriteriaFrames,
  CriteriaFramesOptions,
  CriteriaFrameSnapshot,
  CriteriaFrameTicket,
  CriteriaSourceAuthority,
  CriteriaSourceInput,
  CriteriaSourceMetadata,
  CriteriaToolAuthority,
} from "./presentation/criteria-frame.js";
export {
  createCriteriaFrames,
  CriteriaFrameError,
  getCriteriaSourceOwner,
  getCriteriaToolOwner,
  requireCriteriaSource,
  requireCriteriaTool,
} from "./presentation/criteria-frame.js";
export type {
  CriteriaFrameReactInput,
  CriteriaFrameReactResult,
} from "./presentation/criteria-frame-react.js";
export { useCriteriaFrame } from "./presentation/criteria-frame-react.js";
export {
  defineTable,
  TableDefinitionError,
} from "./table/definition.js";
export type {
  DataTableEmptyCause,
  DataTableModel,
  DataTableOptions,
  DataTablePublicError,
  DataTableRecovery,
  DataTableSourceTarget,
  DataTableToolTarget,
  DefineTableInput,
  TableDefinition,
  TableToolPlacement,
  ToolPlacement,
} from "./table/types.js";
export {
  assertDataTableModel,
  DataTableModelError,
  getDataTableModelOwner,
  requireDataTableModel,
  useDataTable,
} from "./table/use-data-table.js";
export { createTableSortFn } from "./tanstack/sort.js";
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
