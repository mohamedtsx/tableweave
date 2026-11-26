import { expect, it } from "vitest";
import {
  beginControlsRequest,
  createControlsAuthority,
  projectControls,
} from "../../../packages/react/src/presentation/index.js";
import type { ControlsPresentation } from "../../../packages/react/src/presentation/types.js";
import type { ResourceContext } from "../../../packages/react/src/resource/types.js";
import { createNativeBoundary } from "../../../packages/react/src/tanstack/boundary.js";
import { createNativeController } from "../../../packages/react/src/tanstack/index.js";
import {
  context,
  fixture,
  type RecordRow,
  records,
  type schema,
} from "./fixtures.js";

function privateMask(facts: ControlsPresentation<typeof schema, RecordRow>) {
  expect({
    checked: facts.pageSelection.checked,
    mixed: facts.pageSelection.mixed,
    busy: facts.busy,
    stale: facts.stale,
    obsolete: facts.obsolete,
    resourceObsolete: facts.resourceObsolete,
    previous: facts.canPreviousPage,
    next: facts.canNextPage,
    retry: facts.canRetry,
  }).toEqual({
    checked: false,
    mixed: false,
    busy: false,
    stale: false,
    obsolete: false,
    resourceObsolete: false,
    previous: false,
    next: false,
    retry: false,
  });
  expect({
    rows: facts.rows,
    loaded: facts.loadedSelected,
    ids: facts.selectedIds,
    missing: facts.missingSelectedIds,
    query: facts.requestedQuery,
    displayed: facts.displayed,
    canSelect: facts.canSelect,
    canNavigate: facts.canNavigate,
    canReorder: facts.canReorder,
  }).toEqual({
    rows: [],
    loaded: [],
    ids: [],
    missing: [],
    query: null,
    displayed: null,
    canSelect: false,
    canNavigate: false,
    canReorder: false,
  });
}

function selected() {
  const f = fixture();
  f.controller.dispatch({ type: "selection.change", update: { a: true } });
  f.begin();
  f.succeed();
  return { f, input: f.server() };
}

it("n7 natural stale same-owner view suppresses targets without hiding same-scope Cancel", () => {
  const f = fixture();
  f.controller.dispatch({ type: "selection.change", update: { a: true } });
  f.begin();
  f.succeed();
  const input = f.server();
  f.begin();
  const facts = projectControls(f.definition, input);
  expect(facts.rows).toEqual([]);
  expect(facts.canSelect).toBe(false);
  expect(facts.canCancelSelection).toBe(true);
});

it("n7 ordinary stale view with new expected scope masks private IDs and query", () => {
  const f = fixture();
  f.controller.dispatch({ type: "selection.change", update: { a: true } });
  f.begin();
  f.succeed();
  const input = f.server();
  const next = { ...context, scopeKey: "scope:two" };
  f.resource.setContext(next);
  const facts = projectControls(f.definition, { ...input, expected: next });
  expect(facts.rows).toEqual([]);
  expect(facts.selectedIds).toEqual([]);
  expect(facts.missingSelectedIds).toEqual([]);
  expect(facts.requestedQuery).toBeNull();
});

it("n7 ordinary stale view after access loss hides IDs and query under denied expected context", () => {
  const f = fixture();
  f.controller.dispatch({ type: "selection.change", update: { a: true } });
  f.begin();
  f.succeed();
  const input = f.server();
  const denied = { ...context, access: false };
  f.resource.setContext(denied);
  const facts = projectControls(f.definition, { ...input, expected: denied });
  expect({
    ids: facts.selectedIds,
    missing: facts.missingSelectedIds,
    queryHidden: facts.requestedQuery === null,
  }).toEqual({ ids: [], missing: [], queryHidden: true });
});

it("n8 saved own server snapshot cannot expose new-scope selection under old expected tags", () => {
  const f = fixture();
  f.begin();
  f.succeed();
  const input = f.server();
  const initial = f.resource.getServerSnapshot();
  f.resource.setContext({ ...context, scopeKey: "scope:two" });
  f.controller.dispatch({
    type: "selection.change",
    update: { "scope-two-private-id": true },
  });
  const frame = f.boundary.prepare(
    {
      mode: "server",
      records: [],
      pageInfo: { kind: "unknown", hasNextPage: false },
    },
    f.controller.getSnapshot(),
  );
  if (input.source.mode !== "server") throw new Error("Expected server");
  const facts = projectControls(f.definition, {
    ...input,
    native: f.boundary.getView(frame),
    source: {
      ...input.source,
      view: initial,
      bindings: { request: null, snapshot: null },
    },
  });
  expect({
    ids: facts.selectedIds,
    missing: facts.missingSelectedIds,
    queryHidden: facts.requestedQuery === null,
  }).toEqual({ ids: [], missing: [], queryHidden: true });
});

for (const [label, next] of [
  ["scope", { ...context, scopeKey: "scope:two" }],
  ["definition", { ...context, definitionKey: "other-definition" }],
  ["access", { ...context, access: false }],
] as const) {
  for (const expectedKind of ["old", "new"] as const)
    it(`n7 ${label} transition masks every private field with ${expectedKind} expected tags`, () => {
      const { f, input } = selected();
      f.resource.setContext(next);
      const facts = projectControls(f.definition, {
        ...input,
        expected: expectedKind === "old" ? context : next,
      });
      privateMask(facts);
      expect(facts.canCancelSelection).toBe(label === "access");
    });
}

it("n7 permission revoked in expected tags masks even an otherwise current ready view", () => {
  const { f, input } = selected();
  const facts = projectControls(f.definition, {
    ...input,
    expected: { ...context, access: false },
  });
  privateMask(facts);
  expect(facts.canCancelSelection).toBe(true);
});

for (const phase of ["ready", "pending", "failure"] as const)
  it(`n7 same-scope ${phase} retains accepted IDs/query and a usable Cancel`, () => {
    const { f, input } = selected();
    const events = createControlsAuthority({
      definition: f.definition,
      controller: f.controller,
      mode: "server",
      resource: f.resource,
      context,
      queryIdentity: input.native.state.queryIdentity,
      readCommitted: f.readCommitted,
    });
    if (phase !== "ready") {
      const token = f.begin();
      if (phase === "failure") f.resource.fail(token, "offline");
    }
    const facts = projectControls(f.definition, input);
    expect(facts.canCancelSelection).toBe(true);
    expect(facts.selectedIds).toEqual(["a"]);
    expect(facts.requestedQuery).toBe(input.native.state.query);
    if (phase !== "ready") {
      expect(facts.rows).toEqual([]);
      expect(facts.canSelect).toBe(false);
    }
    expect(events.read().canCancelSelection).toBe(true);
    const query = f.controller.getSnapshot().query;
    events.cancelSelection();
    expect(f.controller.getSnapshot().selection).toEqual({});
    expect(f.controller.getSnapshot().query).toBe(query);
  });

for (const [change, next] of [
  ["scope", { ...context, scopeKey: "scope:two" }],
  ["definition", { ...context, definitionKey: "other-definition" }],
  ["access", { ...context, access: false }],
] as const)
  for (const actualKind of ["old", "new"] as const)
    for (const expectedKind of ["old", "new"] as const)
      it(`n8 saved server view: ${change}, actual ${actualKind} / expected ${expectedKind} context`, () => {
        const { f, input } = selected();
        const server = f.resource.getServerSnapshot();
        if (actualKind === "new") f.resource.setContext(next);
        f.controller.dispatch({
          type: "selection.change",
          update: { "current-controller-private-id": true },
        });
        const frame = f.boundary.prepare(
          {
            mode: "server",
            records: [],
            pageInfo: { kind: "unknown", hasNextPage: false },
          },
          f.controller.getSnapshot(),
        );
        if (input.source.mode !== "server") throw new Error("Expected server");
        const facts = projectControls(f.definition, {
          ...input,
          expected: expectedKind === "old" ? context : next,
          native: f.boundary.getView(frame),
          source: {
            ...input.source,
            view: server,
            bindings: { request: null, snapshot: null },
          },
        });
        if (actualKind === "old" && expectedKind === "old") {
          expect(facts.rows).toEqual([]);
          expect(facts.displayed).toBeNull();
          expect(facts.selectedIds).toEqual(["current-controller-private-id"]);
          expect(facts.requestedQuery).toBe(f.controller.getSnapshot().query);
          expect(facts.canCancelSelection).toBe(true);
          expect(facts.canSelect).toBe(false);
        } else {
          privateMask(facts);
          expect(facts.canCancelSelection).toBe(change === "access");
        }
      });

it("n8 initial server snapshot stays valid without acquiring a resource lifetime or adopting rows", () => {
  const f = fixture();
  f.controller.dispatch({ type: "selection.change", update: { a: true } });
  const before = f.resource.getSnapshot();
  const server = f.resource.getServerSnapshot();
  const frame = f.boundary.prepare(
    {
      mode: "server",
      records: [],
      pageInfo: { kind: "unknown", hasNextPage: false },
    },
    f.controller.getSnapshot(),
  );
  const facts = projectControls(f.definition, {
    native: f.boundary.getView(frame),
    expected: context,
    source: {
      mode: "server",
      resource: f.resource,
      view: server,
      bindings: { request: null, snapshot: null },
    },
  });
  expect(facts.selectedIds).toEqual(["a"]);
  expect(facts.canCancelSelection).toBe(true);
  expect(facts.requestedQuery).toBe(f.controller.getSnapshot().query);
  expect(facts.displayed).toBeNull();
  expect(f.resource.getSnapshot()).toBe(before);
  expect(f.resource.getServerSnapshot()).toBe(server);
});

it("n7/n8 foreign controller/definition inputs cannot publish either controller's IDs or query", () => {
  const { f, input } = selected();
  const other = fixture();
  other.controller.dispatch({
    type: "selection.change",
    update: { "other-private-id": true },
  });
  const foreign = other.client();
  privateMask(
    projectControls(f.definition, { ...input, native: foreign.native }),
  );
  privateMask(projectControls(other.definition, input));
  // Even a replacement controller registered for the exact same definition must
  // not borrow the prior controller's request/snapshot owner proofs.
  const replacement = createNativeController(f.definition, {
    initial: {
      query: input.native.state.query,
      selection: { "replacement-private-id": true },
    },
    now: () => 0,
  });
  const boundary = createNativeBoundary(f.definition, replacement);
  const frame = boundary.prepare(
    {
      mode: "server",
      records: records.slice(0, 2),
      pageInfo: { kind: "known", total: 3 },
    },
    replacement.getSnapshot(),
  );
  const facts = projectControls(f.definition, {
    ...input,
    native: boundary.getView(frame),
  });
  privateMask(facts);
  expect(facts.canCancelSelection).toBe(false);
  if (input.source.mode !== "server") throw new Error("Expected server");
  // Dropping candidate bindings must not erase the actual current request's
  // registered owner and let a replacement controller borrow its context tags.
  privateMask(
    projectControls(f.definition, {
      ...input,
      native: boundary.getView(frame),
      source: { ...input.source, bindings: { request: null, snapshot: null } },
    }),
  );
});

for (const candidate of ["current", "server", "stale", "wrong-scope"] as const)
  it(`n7/n8 captures each resource port once and checks privacy before SSR authentication (${candidate})`, () => {
    const f = fixture();
    f.controller.dispatch({ type: "selection.change", update: { a: true } });
    let currentReads = 0;
    let serverReads = 0;
    let currentCalls = 0;
    let serverCalls = 0;
    // Test-only read instrumentation. No runtime bootstrap wrapper is introduced.
    const resource = {
      ...f.resource,
      get getSnapshot() {
        currentReads++;
        return () => {
          currentCalls++;
          return f.resource.getSnapshot();
        };
      },
      get getServerSnapshot() {
        serverReads++;
        return () => {
          serverCalls++;
          return f.resource.getServerSnapshot();
        };
      },
    };
    const started = beginControlsRequest(f.definition, f.controller, resource, {
      ...context,
      queryKey: "opaque",
      requestKey: "opaque",
    });
    if (!started) throw new Error("Missing request");
    f.resource.succeed(started.request, {
      source: "fresh",
      records: records.slice(0, 2),
      page: { kind: "known", total: 3 },
      emptyKind: "unknown",
      receivedAt: "2026-11-24T00:00:00Z",
    });
    const view =
      candidate === "server"
        ? f.resource.getServerSnapshot()
        : f.resource.getSnapshot();
    if (candidate === "stale")
      beginControlsRequest(f.definition, f.controller, resource, {
        ...context,
        queryKey: "next",
        requestKey: "next",
      });
    let expected: ResourceContext = context;
    if (candidate === "wrong-scope") {
      expected = { ...context, scopeKey: "scope:two" };
      f.resource.setContext(expected);
    }
    currentReads = 0;
    serverReads = 0;
    currentCalls = 0;
    serverCalls = 0;
    const frame = f.boundary.prepare(
      {
        mode: "server",
        records: records.slice(0, 2),
        pageInfo: { kind: "known", total: 3 },
      },
      f.controller.getSnapshot(),
    );
    const facts = projectControls(f.definition, {
      native: f.boundary.getView(frame),
      expected,
      source: {
        mode: "server",
        resource,
        view,
        bindings: { request: started.binding, snapshot: started.binding },
      },
    });
    expect(currentReads).toBe(1);
    expect(serverReads).toBe(1);
    expect(currentCalls).toBe(1);
    expect(serverCalls).toBe(
      candidate === "server" || candidate === "stale" ? 1 : 0,
    );
    if (candidate === "wrong-scope") privateMask(facts);
    else expect(facts.canCancelSelection).toBe(true);
  });
