import { expect, it } from "vitest";
import {
  beginControlsRequest,
  createControlsAuthority,
  projectControls,
} from "../../../packages/react/src/presentation/index.js";
import type {
  ControlsBlockedReason,
  ControlsPresentation,
} from "../../../packages/react/src/presentation/types.js";
import type { NativeSelectionMode } from "../../../packages/react/src/tanstack/types.js";
import { context, fixture, type RecordRow, type schema } from "./fixtures.js";

function neutral(
  facts: ControlsPresentation<typeof schema, RecordRow>,
  selectionMode: NativeSelectionMode = "multiple",
  blockedReason: ControlsBlockedReason = "context",
) {
  const expected: ControlsPresentation<typeof schema, RecordRow> = {
    paginationEnabled: true,
    selectionMode,
    selectedIds: [],
    loadedSelected: [],
    missingSelectedIds: [],
    rows: [],
    eligiblePageIds: [],
    pageSelection: {
      supported: selectionMode === "multiple",
      checked: false,
      mixed: false,
    },
    displayed: null,
    requestedQuery: null,
    busy: false,
    stale: false,
    obsolete: false,
    resourceObsolete: false,
    blockedReason,
    canSelect: false,
    canNavigate: false,
    canPreviousPage: false,
    canNextPage: false,
    canReorder: false,
    canRetry: false,
    canCancelSelection: false,
  };
  expect(facts).toStrictEqual(expected);
  expect(Object.isFrozen(facts)).toBe(true);
  expect(Object.isFrozen(facts.pageSelection)).toBe(true);
}

it("n9 old-scope authority cannot expose new-scope checked or mixed page selection", () => {
  const f = fixture();
  f.begin();
  f.succeed();
  const input = f.server();
  const old = createControlsAuthority({
    definition: f.definition,
    controller: f.controller,
    queryIdentity: input.native.state.queryIdentity,
    context,
    mode: "server",
    resource: f.resource,
    readCommitted: f.readCommitted,
  });
  const next = { ...context, scopeKey: "scope:two" };
  f.resource.setContext(next);
  const start = beginControlsRequest(f.definition, f.controller, f.resource, {
    ...next,
    queryKey: "opaque-query",
    requestKey: "opaque-request",
  });
  if (!start) throw new Error("Missing request");
  const rows = [
    { id: "B1", amount: 1, eligible: true },
    { id: "B2", amount: 2, eligible: true },
  ];
  f.resource.succeed(start.request, {
    source: "fresh",
    records: rows,
    page: { kind: "known", total: 2 },
    emptyKind: "unknown",
    receivedAt: "2026-11-24T00:00:00Z",
  });
  const commit = () => {
    const frame = f.boundary.prepare(
      { mode: "server", records: rows, pageInfo: { kind: "known", total: 2 } },
      f.controller.getSnapshot(),
    );
    f.setCommitted({
      native: f.boundary.getView(frame),
      expected: next,
      source: {
        mode: "server",
        resource: f.resource,
        view: f.resource.getSnapshot(),
        bindings: { request: start.binding, snapshot: start.binding },
      },
    });
  };
  f.controller.dispatch({
    type: "selection.change",
    update: { B1: true, B2: true },
  });
  commit();
  const all = old.read();
  expect(all.blockedReason).toBe("context");
  expect(all.rows).toEqual([]);
  expect(all.selectedIds).toEqual([]);
  f.controller.dispatch({ type: "selection.change", update: { B1: true } });
  commit();
  const some = old.read();
  expect(some.blockedReason).toBe("context");
  expect(some.rows).toEqual([]);
  expect(some.selectedIds).toEqual([]);
  expect({
    allChecked: all.pageSelection.checked,
    allMixed: all.pageSelection.mixed,
    someChecked: some.pageSelection.checked,
    someMixed: some.pageSelection.mixed,
  }).toEqual({
    allChecked: false,
    allMixed: false,
    someChecked: false,
    someMixed: false,
  });
  neutral(all);
  neutral(some);
});

for (const phase of ["ready", "pending", "failure", "obsolete"] as const)
  it(`n9 all foreign ${phase} aggregate/activity/recovery/navigation facts are neutral and old actions deny`, () => {
    const f = fixture();
    f.begin();
    f.succeed();
    const input = f.server();
    const old = createControlsAuthority({
      definition: f.definition,
      controller: f.controller,
      queryIdentity: input.native.state.queryIdentity,
      context,
      mode: "server",
      resource: f.resource,
      readCommitted: f.readCommitted,
    });
    const next = { ...context, scopeKey: "scope:two" };
    f.resource.setContext(next);
    const first = beginControlsRequest(f.definition, f.controller, f.resource, {
      ...next,
      queryKey: "B",
      requestKey: "B",
    });
    if (!first) throw new Error("Missing request");
    const rows = [
      { id: "B1", amount: 1, eligible: true },
      { id: "B2", amount: 2, eligible: true },
    ];
    f.resource.succeed(first.request, {
      source: "fresh",
      records: rows,
      page: { kind: "known", total: 4 },
      emptyKind: "unknown",
      receivedAt: "2026-11-24T00:00:00Z",
    });
    f.controller.dispatch({
      type: "selection.change",
      update: { B1: true, B2: true },
    });
    let requestBinding = first.binding;
    if (phase !== "ready") {
      if (phase === "obsolete")
        f.controller.dispatch({
          type: "pagination.change",
          update: { pageIndex: 1, pageSize: 2 },
        });
      const started = beginControlsRequest(
        f.definition,
        f.controller,
        f.resource,
        {
          ...next,
          queryKey: phase === "obsolete" ? "C" : "B",
          requestKey: phase === "obsolete" ? "C" : "B",
          retry() {},
        },
      );
      if (!started) throw new Error("Missing refresh");
      requestBinding = started.binding;
      if (phase === "failure") f.resource.fail(started.request, "offline");
    }
    const frame = f.boundary.prepare(
      { mode: "server", records: rows, pageInfo: { kind: "known", total: 4 } },
      f.controller.getSnapshot(),
    );
    const committed = {
      native: f.boundary.getView(frame),
      expected: next,
      source: {
        mode: "server" as const,
        resource: f.resource,
        view: f.resource.getSnapshot(),
        bindings: { request: requestBinding, snapshot: first.binding },
      },
      manualOrder: true,
    };
    f.setCommitted(committed);
    const current = projectControls(f.definition, committed);
    expect(current.pageSelection.checked).toBe(true);
    expect(current.canCancelSelection).toBe(true);
    if (phase === "ready") {
      expect(current.canNextPage).toBe(true);
      expect(current.canReorder).toBe(true);
    }
    if (phase === "pending") {
      expect(current.busy).toBe(true);
      expect(current.stale).toBe(true);
    }
    if (phase === "failure") expect(current.canRetry).toBe(true);
    if (phase === "obsolete") {
      expect(current.busy).toBe(true);
      expect(current.obsolete).toBe(true);
      expect(current.resourceObsolete).toBe(true);
    }
    const before = f.controller.getSnapshot();
    const resourceBefore = f.resource.getSnapshot();
    neutral(old.read());
    for (const action of [
      () => old.cancelSelection(),
      () => old.retry(),
      () => old.nextPage(),
      () => old.previousPage(),
      () => old.setPageIndex(0),
      () => old.setPageSize(2),
      () => old.selectRow("B1", true),
      () => old.selectPage(true),
      () => old.require({ type: "reorder", ids: ["B1", "B2"] }),
    ])
      expect(action).toThrow();
    expect(f.controller.getSnapshot()).toBe(before);
    expect(f.resource.getSnapshot()).toBe(resourceBefore);
  });

for (const selectionMode of [false, "single", "multiple"] as const)
  it(`n9 only immutable origin ${selectionMode} configuration survives a client context mask`, () => {
    const f = fixture(selectionMode);
    const input = f.client();
    const old = createControlsAuthority({
      definition: f.definition,
      controller: f.controller,
      queryIdentity: input.native.state.queryIdentity,
      context,
      mode: "client",
      readCommitted: f.readCommitted,
    });
    const next = { ...context, scopeKey: "scope:two" };
    const view = f.client([{ id: "B1", amount: 1, eligible: true }]);
    if (view.source.mode !== "client") throw new Error("Expected client");
    f.setCommitted({
      ...view,
      expected: next,
      source: { ...view.source, context: next },
    });
    if (selectionMode !== false)
      f.controller.dispatch({ type: "selection.change", update: { B1: true } });
    const before = f.controller.getSnapshot();
    neutral(old.read(), selectionMode);
    expect(() => old.cancelSelection()).toThrow();
    expect(f.controller.getSnapshot()).toBe(before);
  });

it("n9 invalid-definition projection masks activity instead of forwarding another owner's busy state", () => {
  const f = fixture();
  f.begin();
  f.succeed();
  f.begin();
  const input = f.server();
  const other = fixture();
  const foreign = other.client();
  expect(f.resource.getSnapshot().busy).toBe(true);
  neutral(projectControls(other.definition, input), "multiple", "definition");
  neutral(
    projectControls(f.definition, { ...input, native: foreign.native }),
    "multiple",
    "definition",
  );
  const disabled = fixture(false).client();
  neutral(
    projectControls(f.definition, {
      ...input,
      native: { ...input.native, state: disabled.native.state },
    }),
    "multiple",
    "definition",
  );
});

it("n9 genuine same-owner refresh retains activity, selected IDs and working Cancel", () => {
  const f = fixture();
  f.begin();
  f.succeed();
  const input = f.server();
  const old = createControlsAuthority({
    definition: f.definition,
    controller: f.controller,
    queryIdentity: input.native.state.queryIdentity,
    context,
    mode: "server",
    resource: f.resource,
    readCommitted: f.readCommitted,
  });
  f.controller.dispatch({ type: "selection.change", update: { a: true } });
  f.begin();
  f.server();
  const facts = old.read();
  expect(facts.busy).toBe(true);
  expect(facts.stale).toBe(true);
  expect(facts.selectedIds).toEqual(["a"]);
  expect(facts.canCancelSelection).toBe(true);
  const query = f.controller.getSnapshot().query;
  old.cancelSelection();
  expect(f.controller.getSnapshot().selection).toEqual({});
  expect(f.controller.getSnapshot().query).toBe(query);
});
