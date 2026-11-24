import type { RowData } from "@tanstack/react-table";
import type { QuerySchema } from "../contracts/types.js";
import type { MutationResult } from "../controller/types.js";
import type { ResourceContext } from "../resource/types.js";
import {
  assertNativeController,
  assertNativeState,
} from "../tanstack/definition.js";
import { getControlsRequestBinding, unavailable } from "./binding.js";
import { maskedControlsPresentation } from "./masked.js";
import { projectControlsState } from "./project.js";
import type {
  ControlsAuthority,
  ControlsAuthorityOptions,
  ControlsAuthorityOwner,
  ControlsInput,
  ControlsIntent,
  ControlsPresentation,
} from "./types.js";

const authorityOwners = new WeakMap<object, unknown>();

/** Factory provenance only; callers must still require each event-time intent. */
export function getControlsAuthorityOwner<
  S extends QuerySchema,
  T extends RowData,
>(authority: ControlsAuthority<S, T>): ControlsAuthorityOwner<S, T> | null {
  const owner = authorityOwners.get(authority);
  return (owner ?? null) as ControlsAuthorityOwner<S, T> | null;
}

export function createControlsAuthority<
  S extends QuerySchema,
  T extends RowData,
>(options: ControlsAuthorityOptions<S, T>): ControlsAuthority<S, T> {
  // Tags and ports only. No captured rows/view/resource snapshot and no leases.
  const {
    definition,
    controller,
    queryIdentity,
    resource,
    readCommitted,
    mode,
  } = options;
  const context = Object.freeze({ ...options.context });
  const latest = () => {
    const committed = { ...readCommitted() };
    const expected = Object.freeze({ ...committed.expected });
    const inputSource = { ...committed.source };
    const source =
      inputSource.mode === "server" || inputSource.mode === "server-complete"
        ? { ...inputSource, view: inputSource.resource.getSnapshot() }
        : inputSource.mode === "client"
          ? {
              ...inputSource,
              context: Object.freeze({ ...inputSource.context }),
            }
          : unavailable();
    const actualContext =
      source.mode === "client"
        ? source.context
        : Object.freeze({ ...source.view.context });
    return { committed: { ...committed, expected }, source, actualContext };
  };
  const sameScope = (a: ResourceContext, b: ResourceContext) =>
    a.definitionKey === b.definitionKey && a.scopeKey === b.scopeKey;
  const sameOrigin = (
    committed: ControlsInput<S, T>,
    source: ControlsInput<S, T>["source"],
    actual: ResourceContext,
  ) => {
    assertNativeController(definition, controller);
    assertNativeController(definition, committed.native.controller);
    assertNativeState(definition, controller.getSnapshot());
    assertNativeState(definition, committed.native.state);
    return (
      !controller.isDisposed() &&
      committed.native.controller === controller &&
      mode === source.mode &&
      sameScope(context, committed.expected) &&
      sameScope(context, actual) &&
      (source.mode === "server" || source.mode === "server-complete"
        ? source.resource === resource
        : resource === undefined)
    );
  };
  const readFrame = () => {
    try {
      const { committed, source, actualContext } = latest();
      // Reject origin changes before projecting any foreign aggregate/activity
      // facts. Only immutable origin configuration survives this boundary.
      if (!sameOrigin(committed, source, actualContext))
        return {
          queryLayout: false,
          facts: maskedControlsPresentation<S, T>(
            definition.selectionMode,
            definition.paginationEnabled,
            "context",
          ),
        };
      const owner = controller.getSnapshot();
      // Criteria/layout belong to the live authorized owner domain, not to a
      // captured query or any loaded row. No readiness/navigation flag is used.
      const remote =
        source.mode === "server" || source.mode === "server-complete"
          ? source
          : null;
      const request = remote ? remote.view.request : null;
      const queryLayout =
        committed.expected.access === true &&
        actualContext.access === true &&
        (!remote ||
          (!remote.view.invalidationFailed &&
            (!request ||
              getControlsRequestBinding(
                definition,
                controller,
                remote.resource,
                request,
              ) !== null)));
      const facts = projectControlsState(
        definition,
        { ...committed, source },
        owner,
      );
      return {
        queryLayout,
        facts:
          owner.queryIdentity === queryIdentity
            ? facts
            : Object.freeze({
                ...facts,
                blockedReason: "query" as const,
                canSelect: false,
                canNavigate: false,
                canPreviousPage: false,
                canNextPage: false,
                canReorder: false,
                canRetry: false,
              }),
      };
    } catch {
      return unavailable();
    }
  };
  const read = () => readFrame().facts;
  const requireIntent = (
    intent: ControlsIntent,
  ): ControlsPresentation<S, T> => {
    try {
      // Capture new discriminants (and existing payload ports) once, never check
      // an accessor kind and then consume a different kind on a later read.
      const captured = { ...intent };
      const { facts, queryLayout } = readFrame();
      const allowed =
        captured.type === "sort" || captured.type === "columns"
          ? queryLayout
          : captured.type === "select-row"
            ? facts.canSelect && facts.eligiblePageIds.includes(captured.id)
            : captured.type === "select-page"
              ? facts.canSelect && facts.pageSelection.supported
              : captured.type === "navigate"
                ? facts.canNavigate
                : captured.type === "retry"
                  ? facts.canRetry
                  : captured.type === "reorder" &&
                    facts.canReorder &&
                    Array.isArray(captured.ids) &&
                    captured.ids.length > 0 &&
                    new Set(captured.ids).size === captured.ids.length &&
                    captured.ids.every((id) =>
                      facts.rows.some((row) => row.id === id),
                    );
      if (!allowed) return unavailable();
      return facts;
    } catch {
      return unavailable();
    }
  };
  const noop = (): MutationResult<S> => ({ status: "noop" });
  const pageIndex = (index: number) => {
    const facts = requireIntent({ type: "navigate" });
    if (!Number.isSafeInteger(index) || index < 0 || !facts.displayed)
      return unavailable();
    const current = controller.getSnapshot().query.pagination.pageIndex;
    if (facts.displayed.pageCount === null) {
      if (
        index !== current &&
        !(index === current - 1 && facts.canPreviousPage) &&
        !(index === current + 1 && facts.canNextPage)
      )
        return unavailable();
    } else if (index > Math.max(0, facts.displayed.pageCount - 1))
      return unavailable();
    return controller.dispatch({
      type: "pagination.change",
      update: (previous) => ({ ...previous, pageIndex: index }),
    });
  };
  const authority: ControlsAuthority<S, T> = Object.freeze({
    read,
    require: requireIntent,
    selectRow(id: string, selected: boolean) {
      if (typeof selected !== "boolean" || typeof id !== "string" || !id)
        return unavailable();
      requireIntent({ type: "select-row", id });
      return controller.dispatch({
        type: "selection.change",
        update(previous) {
          const next = Object.assign(
            Object.create(null) as Record<string, boolean>,
            selected && definition.selectionMode === "single" ? {} : previous,
          );
          if (selected) next[id] = true;
          else delete next[id];
          return next;
        },
      });
    },
    selectPage(selected: boolean) {
      if (typeof selected !== "boolean") return unavailable();
      const facts = requireIntent({ type: "select-page" });
      return controller.dispatch({
        type: "selection.page",
        selected,
        pageIds: facts.rows.map((row) => row.id),
        eligibleIds: facts.eligiblePageIds,
        queryIdentity: controller.getSnapshot().queryIdentity,
      });
    },
    cancelSelection() {
      try {
        const { committed, source, actualContext } = latest();
        if (!sameOrigin(committed, source, actualContext)) return unavailable();
      } catch {
        return unavailable();
      }
      // Recovery ignores query freshness, but never the origin owner or scope.
      return controller.dispatch({ type: "selection.cancel" });
    },
    setPageIndex: pageIndex,
    setPageSize(size: number) {
      requireIntent({ type: "navigate" });
      return controller.dispatch({
        type: "pagination.change",
        update: (previous) => ({ ...previous, pageSize: size }),
      });
    },
    nextPage() {
      const facts = requireIntent({ type: "navigate" });
      return facts.canNextPage
        ? pageIndex(controller.getSnapshot().query.pagination.pageIndex + 1)
        : noop();
    },
    previousPage() {
      const facts = requireIntent({ type: "navigate" });
      return facts.canPreviousPage
        ? pageIndex(controller.getSnapshot().query.pagination.pageIndex - 1)
        : noop();
    },
    retry() {
      requireIntent({ type: "retry" });
      return resource?.retry() ?? null;
    },
  });
  authorityOwners.set(authority, Object.freeze({ definition, controller }));
  return authority;
}
