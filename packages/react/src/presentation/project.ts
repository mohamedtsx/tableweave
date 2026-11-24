import type { RowData } from "@tanstack/react-table";
import type { QueryExecutionExtent } from "../contracts/execution.js";
import { getQueryIdentity } from "../contracts/identity.js";
import { canonicalJson } from "../contracts/json.js";
import type { QueryFor, QuerySchema } from "../contracts/types.js";
import type { TableState } from "../controller/types.js";
import { compileFilter } from "../filters/plan.js";
import type {
  PageInfo,
  ResourceContext,
  ResourceRequest,
} from "../resource/types.js";
import { projectResourceView } from "../resource/view.js";
import {
  assertNativeController,
  assertNativeState,
} from "../tanstack/definition.js";
import type { NativeDefinition } from "../tanstack/types.js";
import { getControlsRequestBinding, hasBindingProof } from "./binding.js";
import type { CriteriaNativeCallbacks } from "./criteria-callbacks.js";
import { maskedControlsPresentation } from "./masked.js";
import type {
  ControlsBlockedReason,
  ControlsDisplayed,
  ControlsInput,
  ControlsPresentation,
  ControlsRequestBinding,
} from "./types.js";

function sameRecords<T>(a: readonly T[], b: readonly T[]): boolean {
  return (
    a.length === b.length &&
    Object.keys(a).length === a.length &&
    Object.keys(b).length === b.length &&
    a.every((record, index) => record === b[index])
  );
}
function samePage(a: PageInfo, b: PageInfo): boolean {
  return (
    a.kind === b.kind &&
    (a.kind === "known"
      ? b.kind === "known" && a.total === b.total
      : b.kind === "unknown" && a.hasNextPage === b.hasNextPage)
  );
}
function resolvedExtent(request: ResourceRequest): QueryExecutionExtent {
  return request.extent ?? { kind: "page", ...request.query.pagination };
}
function sameExtent(a: QueryExecutionExtent, b: QueryExecutionExtent): boolean {
  return a.kind === "complete"
    ? b.kind === "complete"
    : b.kind === "page" &&
        a.pageIndex === b.pageIndex &&
        a.pageSize === b.pageSize;
}
export function projectControls<S extends QuerySchema, T extends RowData>(
  definition: NativeDefinition<S, T>,
  input: ControlsInput<S, T>,
): ControlsPresentation<S, T> {
  const captured = { ...input };
  return projectControlsState(definition, captured, captured.native.state);
}

/** Internal event seam: models remain COMMITTED, while owner state is read NOW. */
export function projectControlsState<S extends QuerySchema, T extends RowData>(
  definition: NativeDefinition<S, T>,
  input: ControlsInput<S, T>,
  owner: TableState<S>,
  work?: CriteriaNativeCallbacks<S, T>,
): ControlsPresentation<S, T> {
  work?.check();
  const { native } = input;
  const expected = { ...input.expected };
  // Authenticate and consume the same captured ports/view, not a getter that can
  // return an authentic view for the check and foreign data for the projection.
  const capturedSource = { ...input.source };
  const source =
    capturedSource.mode === "server" ||
    capturedSource.mode === "server-complete"
      ? { ...capturedSource, bindings: { ...capturedSource.bindings } }
      : capturedSource;
  const remoteSource =
    source.mode === "server" || source.mode === "server-complete"
      ? source
      : null;
  const ports = remoteSource
    ? {
        getSnapshot: remoteSource.resource.getSnapshot,
        getServerSnapshot: remoteSource.resource.getServerSnapshot,
      }
    : null;
  // Current permission/scope is authority even when the supplied candidate is an
  // ordinary discarded render view or the adapter's saved initial SSR snapshot.
  const actualView = ports?.getSnapshot() ?? null;
  const projectedCurrent = actualView
    ? projectResourceView(actualView, expected)
    : null;
  const actualContext = {
    ...(source.mode === "client" ? source.context : actualView?.context),
  };
  const suppliedContext =
    source.mode === "client"
      ? actualContext
      : { ...remoteSource?.view.context };
  const sameScope = (context: Partial<ResourceContext>) =>
    context.definitionKey === expected.definitionKey &&
    context.scopeKey === expected.scopeKey;
  const bindingOwnersMatch =
    !remoteSource ||
    ((!actualView?.request ||
      getControlsRequestBinding(
        definition,
        native.controller,
        remoteSource.resource,
        actualView.request,
      ) !== null) &&
      [remoteSource.bindings.request, remoteSource.bindings.snapshot].every(
        (binding) =>
          binding === null ||
          hasBindingProof(
            binding,
            definition,
            native.controller,
            remoteSource.resource,
          ),
      ));
  const cancelScope =
    sameScope(actualContext) &&
    sameScope(suppliedContext) &&
    bindingOwnersMatch;
  const privateVisible =
    cancelScope &&
    expected.access === true &&
    actualContext.access === true &&
    suppliedContext.access === true &&
    !actualView?.invalidationFailed;
  let resource = privateVisible ? projectedCurrent : null;
  let selectedIds: readonly string[] = Object.freeze([]);
  const blocked = (
    reason: ControlsBlockedReason,
    valid = true,
  ): ControlsPresentation<S, T> => {
    work?.check();
    const neutral = maskedControlsPresentation<S, T>(
      definition.selectionMode,
      definition.paginationEnabled,
      reason,
    );
    const canCancelSelection =
      valid &&
      cancelScope &&
      selectedIds.length > 0 &&
      !native.controller.isDisposed();
    if (!valid || !privateVisible)
      return Object.freeze({ ...neutral, canCancelSelection });
    // Explicit whitelist of facts from the already-validated SAME owner/scope.
    // Spreading only the neutral builder cannot carry unlisted private fields.
    return Object.freeze({
      ...neutral,
      selectedIds,
      missingSelectedIds: selectedIds,
      requestedQuery: owner.query,
      busy: resource?.busy ?? false,
      stale: resource?.stale ?? false,
      resourceObsolete: resource?.obsolete ?? false,
      canCancelSelection,
    });
  };
  try {
    assertNativeController(definition, native.controller);
    assertNativeState(definition, owner);
    assertNativeState(definition, native.state);
    if (native.controller.isDisposed()) return blocked("definition", false);
    selectedIds = Object.freeze(Object.keys(owner.selection));
  } catch {
    return blocked("definition", false);
  }
  if (!bindingOwnersMatch) return blocked("binding", false);
  if (!privateVisible) return blocked("context");
  const authenticView =
    !remoteSource ||
    remoteSource.view === actualView ||
    remoteSource.view === ports?.getServerSnapshot();
  if (!authenticView) return blocked("source");
  if (remoteSource) resource = projectResourceView(remoteSource.view, expected);
  if (
    (source.mode === "server" && !definition.paginationEnabled) ||
    (source.mode === "server-complete" && definition.paginationEnabled)
  )
    return blocked("source");

  const bindingMatches = (
    binding: ControlsRequestBinding<S> | null,
    request: ResourceRequest<QueryFor<S>>,
  ): boolean => {
    if (
      !binding ||
      !remoteSource ||
      !hasBindingProof(
        binding,
        definition,
        native.controller,
        remoteSource.resource,
      )
    )
      return false;
    const token = binding.request;
    return (
      binding.definitionIdentity === owner.definitionIdentity &&
      token.definitionKey === expected.definitionKey &&
      token.scopeKey === expected.scopeKey &&
      token.definitionKey === request.definitionKey &&
      token.scopeKey === request.scopeKey &&
      token.queryKey === request.queryKey &&
      token.requestKey === request.requestKey &&
      token.generation === request.generation &&
      sameExtent(binding.extent, resolvedExtent(token)) &&
      sameExtent(binding.extent, resolvedExtent(request)) &&
      (remoteSource.mode === "server-complete"
        ? binding.extent.kind === "complete"
        : binding.extent.kind === "page") &&
      Object.hasOwn(token, "extent") === Object.hasOwn(request, "extent") &&
      Object.hasOwn(token, "evaluatedAt") ===
        Object.hasOwn(request, "evaluatedAt") &&
      (token.extent === undefined
        ? !Object.hasOwn(token, "evaluatedAt")
        : token.evaluatedAt === binding.evaluatedAt &&
          request.evaluatedAt === binding.evaluatedAt) &&
      getQueryIdentity(definition.controllerDefinition.schema, request.query, {
        ...(work?.evaluation ?? definition.evaluation),
        now: binding.evaluatedAt,
      }) === binding.queryIdentity
    );
  };
  let records: readonly T[];
  let query: QueryFor<S>;
  let identity: string;
  let evaluatedAt: number;
  let page: PageInfo;
  let extent: QueryExecutionExtent;
  let request: ResourceRequest<QueryFor<S>> | null = null;
  let receivedAt: string | null = null;
  let requestCurrent = true;
  let sourceSelect = true;
  let sourceNavigate = true;
  let sourceReorder = true;
  let canRetry = false;
  const frameCurrent = native.state.queryIdentity === owner.queryIdentity;
  try {
    if (remoteSource && resource) {
      const current = remoteSource.bindings.request;
      const requestBound =
        resource.request !== null &&
        current !== null &&
        current.request === resource.request &&
        bindingMatches(current, resource.request);
      if (resource.request !== null && !requestBound) return blocked("binding");
      requestCurrent =
        requestBound &&
        current !== null &&
        current.queryIdentity === owner.queryIdentity;
      canRetry = requestCurrent && frameCurrent && resource.canRetry;
      if (!resource.active) return blocked("resource");
      const snapshot = resource.snapshot;
      if (!snapshot)
        return Object.freeze({
          ...blocked(requestCurrent ? "resource" : "binding"),
          canRetry,
        });
      if (!resource.request) return blocked("binding");
      const binding = remoteSource.bindings.snapshot;
      if (!binding || !bindingMatches(binding, snapshot))
        return Object.freeze({ ...blocked("binding"), canRetry });
      records = snapshot.records;
      query = snapshot.query;
      identity = binding.queryIdentity;
      evaluatedAt = binding.evaluatedAt;
      extent = binding.extent;
      page = snapshot.page;
      receivedAt = snapshot.receivedAt;
      request = Object.freeze({
        definitionKey: snapshot.definitionKey,
        scopeKey: snapshot.scopeKey,
        queryKey: snapshot.queryKey,
        requestKey: snapshot.requestKey,
        generation: snapshot.generation,
        query,
        ...(snapshot.extent !== undefined ? { extent: snapshot.extent } : {}),
        ...(snapshot.evaluatedAt !== undefined
          ? { evaluatedAt: snapshot.evaluatedAt }
          : {}),
      });
      sourceSelect = resource.canSelect;
      sourceNavigate = resource.canNavigate;
      sourceReorder = resource.canReorder;
      if (
        extent.kind === "complete"
          ? page.kind !== "known" || page.total !== records.length
          : records.length > query.pagination.pageSize ||
            (page.kind === "known" &&
              records.length >
                Math.max(
                  0,
                  page.total -
                    query.pagination.pageIndex * query.pagination.pageSize,
                ))
      )
        return Object.freeze({ ...blocked("source"), canRetry });
    } else if (source.mode === "client") {
      records = source.records;
      query = native.state.query;
      identity = native.state.queryIdentity;
      evaluatedAt = native.state.evaluatedAt;
      extent = Object.freeze(
        definition.paginationEnabled
          ? { kind: "page", ...query.pagination }
          : { kind: "complete" },
      );
      page = native.pagination.pageInfo;
      if (page.kind !== "known") return blocked("source");
    } else return blocked("source");

    // Read the actual CURRENT view's frame, not native's stable committed getter.
    // This works for empty models too, because definition policy keeps a data leaf.
    const table = native.visibleColumns[0]?.table;
    if (
      !table ||
      native.visibleColumns.some((column) => column.table !== table) ||
      native.rows.some((row) => row.table !== table) ||
      !sameRecords(table.options.data, records) ||
      table.getRowModel().rows.length !== native.rows.length ||
      !table
        .getRowModel()
        .rows.every((row, index) => row === native.rows[index]) ||
      canonicalJson(table.atoms.pagination.get()) !==
        canonicalJson(native.state.query.pagination) ||
      canonicalJson(table.atoms.sorting.get()) !==
        canonicalJson(native.state.query.sorting)
    )
      return Object.freeze({ ...blocked("source"), canRetry });
    const manual = remoteSource !== null;
    if (
      table.options.manualFiltering !== manual ||
      table.options.manualSorting !== manual ||
      table.options.manualPagination !==
        (manual || !definition.paginationEnabled) ||
      native.pagination.enabled !== definition.paginationEnabled ||
      !samePage(native.pagination.pageInfo, page) ||
      (manual
        ? table.options.rowCount !==
            (page.kind === "known" ? page.total : undefined) ||
          (extent.kind === "complete" &&
            (native.rows.length !== records.length ||
              table.options.pageCount !== undefined))
        : page.kind !== "known" ||
          page.total !== table.getFilteredRowModel().rows.length)
    )
      return Object.freeze({ ...blocked("source"), canRetry });
    const loaded = new Map<string, T>();
    for (const record of records) {
      if (record === null || typeof record !== "object")
        return blocked("source");
      const id = work ? work.getRowId(record) : definition.getRowId(record);
      if (typeof id !== "string" || !id || loaded.has(id))
        return blocked("source");
      loaded.set(id, record);
    }
    const obsolete = identity !== owner.queryIdentity;
    const current = frameCurrent && !obsolete && requestCurrent;
    const rows = Object.freeze([...native.rows]);
    const eligiblePageIds = Object.freeze(
      rows.filter((row) => row.getCanSelect()).map((row) => row.id),
    );
    const selectedOnPage = eligiblePageIds.filter(
      (id) => owner.selection[id],
    ).length;
    const pageCount =
      definition.paginationEnabled && page.kind === "known"
        ? Math.ceil(page.total / query.pagination.pageSize)
        : null;
    const offset = definition.paginationEnabled
      ? query.pagination.pageIndex * query.pagination.pageSize
      : 0;
    const range =
      rows.length && Number.isSafeInteger(offset + rows.length)
        ? Object.freeze({ from: offset + 1, to: offset + rows.length })
        : !rows.length && page.kind === "known" && page.total === 0
          ? Object.freeze({ from: 0, to: 0 })
          : null;
    const displayed: ControlsDisplayed<S> = Object.freeze({
      mode: source.mode,
      extent,
      query,
      queryIdentity: identity,
      evaluatedAt,
      pagination: Object.freeze({ ...query.pagination }),
      pageInfo: Object.freeze({ ...page }),
      pageCount,
      recordCount: rows.length,
      range,
      request,
      receivedAt,
    });
    const canSelect =
      current && sourceSelect && definition.selectionMode !== false;
    const canNavigate =
      definition.paginationEnabled && current && sourceNavigate;
    const plan = compileFilter(
      definition.controllerDefinition.schema,
      owner.query,
      {
        ...(work?.evaluation ?? definition.evaluation),
        now: owner.evaluatedAt,
      },
    );
    const filtering =
      plan.builder.rules.length > 0 ||
      plan.tab.rules.length > 0 ||
      plan.date !== null ||
      plan.search.text.length > 0;
    work?.check();
    return Object.freeze({
      paginationEnabled: definition.paginationEnabled,
      selectionMode: definition.selectionMode,
      selectedIds,
      rows,
      eligiblePageIds,
      loadedSelected: Object.freeze(
        selectedIds.flatMap((id) => {
          const record = loaded.get(id);
          return record === undefined ? [] : [Object.freeze({ id, record })];
        }),
      ),
      missingSelectedIds: Object.freeze(
        selectedIds.filter((id) => !loaded.has(id)),
      ),
      displayed,
      requestedQuery: owner.query,
      pageSelection: Object.freeze({
        supported: definition.selectionMode === "multiple",
        checked:
          definition.selectionMode === "multiple" &&
          eligiblePageIds.length > 0 &&
          selectedOnPage === eligiblePageIds.length,
        mixed:
          definition.selectionMode === "multiple" &&
          selectedOnPage > 0 &&
          selectedOnPage < eligiblePageIds.length,
      }),
      busy: resource?.busy ?? false,
      stale: (resource?.stale ?? false) || obsolete || !current,
      obsolete,
      resourceObsolete: resource?.obsolete ?? false,
      blockedReason: !current
        ? !frameCurrent || obsolete
          ? "query"
          : "binding"
        : !sourceSelect ||
            (!sourceNavigate &&
              !(
                source.mode === "server-complete" && resource?.kind === "ready"
              ))
          ? "resource"
          : null,
      canSelect,
      canNavigate,
      canPreviousPage:
        canNavigate &&
        query.pagination.pageIndex > 0 &&
        (pageCount === null ||
          (pageCount > 0 && query.pagination.pageIndex - 1 < pageCount)),
      canNextPage:
        canNavigate &&
        (page.kind === "unknown"
          ? page.hasNextPage
          : query.pagination.pageIndex + 1 < (pageCount ?? 0)),
      canReorder:
        current &&
        sourceReorder &&
        rows.length > 1 &&
        input.manualOrder === true &&
        !filtering &&
        owner.query.sorting.length === 0,
      canRetry,
      canCancelSelection: selectedIds.length > 0,
    });
  } catch {
    return Object.freeze({ ...blocked("source"), canRetry });
  }
}
