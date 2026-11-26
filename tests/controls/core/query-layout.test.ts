import { expect, it } from "vitest";
import type { QueryFor } from "../../../packages/react/src/contracts/types.js";
import {
  beginControlsRequest,
  ControlsError,
  createControlsAuthority,
} from "../../../packages/react/src/presentation/index.js";
import type { ControlsIntent } from "../../../packages/react/src/presentation/types.js";
import { createResourceAdapter } from "../../../packages/react/src/resource/adapter.js";
import { createNativeController } from "../../../packages/react/src/tanstack/index.js";
import { context, fixture, type RecordRow, type schema } from "./fixtures.js";

function authority(
  f: ReturnType<typeof fixture>,
  mode: "client" | "server" = "server",
) {
  const input = mode === "client" ? f.client() : f.server();
  const base = {
    definition: f.definition,
    controller: f.controller,
    queryIdentity: input.native.state.queryIdentity,
    context,
    readCommitted: f.readCommitted,
  };
  return {
    input,
    actions:
      mode === "server"
        ? createControlsAuthority({ ...base, mode, resource: f.resource })
        : createControlsAuthority({ ...base, mode }),
  };
}

for (const type of ["sort", "columns"] as const)
  it(`query/layout ${type} survives accepted B before begin(B) while old-query row actions remain denied`, () => {
    const f = fixture();
    f.begin();
    f.succeed();
    const input = f.server();
    const actions = createControlsAuthority({
      definition: f.definition,
      controller: f.controller,
      queryIdentity: input.native.state.queryIdentity,
      context,
      mode: "server",
      resource: f.resource,
      readCommitted: f.readCommitted,
    });
    f.controller.dispatch({
      type: "pagination.change",
      update: { pageIndex: 1, pageSize: 2 },
    });
    expect(actions.read().blockedReason).toBe("query");
    expect(() => actions.require({ type: "select-row", id: "a" })).toThrow();
    expect(() => actions.require({ type: "navigate" })).toThrow();
    expect(() => actions.require({ type })).not.toThrow();
    expect(actions.require({ type }).canSelect).toBe(false);
  });

for (const phase of [
  "boot",
  "pending-empty",
  "failure-empty",
  "refresh",
  "failure-retained",
] as const)
  it(`query/layout is usable during same-owner ${phase} without changing row guards or owner state`, () => {
    const f = fixture();
    if (phase === "refresh" || phase === "failure-retained") {
      f.begin();
      f.succeed();
    }
    if (phase !== "boot") {
      const token = f.begin();
      if (phase === "failure-empty" || phase === "failure-retained")
        f.resource.fail(token, "offline");
    }
    const { actions } = authority(f);
    const before = f.controller.getSnapshot();
    const resourceBefore = f.resource.getSnapshot();
    const readBefore = actions.read();
    for (const type of ["sort", "columns"] as const)
      expect(actions.require({ type })).toEqual(readBefore);
    expect(f.controller.getSnapshot()).toBe(before);
    expect(f.resource.getSnapshot()).toBe(resourceBefore);
    if (
      phase === "boot" ||
      phase === "pending-empty" ||
      phase === "failure-empty"
    ) {
      expect(readBefore.displayed).toBeNull();
      expect(readBefore.canSelect).toBe(false);
      expect(() => actions.require({ type: "select-row", id: "a" })).toThrow();
    }
    expect(() => actions.require({ type: "navigate" })).toThrow();
  });

it("query/layout checks current access, unlike same-owner access-loss Cancel cleanup", () => {
  const f = fixture();
  f.controller.dispatch({ type: "selection.change", update: { a: true } });
  const { input, actions } = authority(f);
  f.resource.setContext({ ...context, access: false });
  f.setCommitted({ ...input, expected: { ...context, access: false } });
  for (const type of ["sort", "columns"] as const)
    expect(() => actions.require({ type })).toThrow(
      new ControlsError("controls.unavailable"),
    );
  actions.cancelSelection();
  expect(f.controller.getSnapshot().selection).toEqual({});
});

for (const change of [
  "expected-access",
  "actual-access",
  "expected-scope",
  "actual-scope",
  "definition",
  "controller",
  "resource-owner",
] as const)
  it(`query/layout denies ${change} mismatches even without loaded rows`, () => {
    const f = fixture();
    const { input, actions } = authority(f);
    if (input.source.mode !== "server") throw new Error("Expected server");
    if (change === "expected-access")
      f.setCommitted({ ...input, expected: { ...context, access: false } });
    if (change === "actual-access")
      f.resource.setContext({ ...context, access: false });
    if (change === "expected-scope")
      f.setCommitted({
        ...input,
        expected: { ...context, scopeKey: "scope:two" },
      });
    if (change === "actual-scope")
      f.resource.setContext({ ...context, scopeKey: "scope:two" });
    if (change === "definition")
      f.resource.setContext({ ...context, definitionKey: "other" });
    if (change === "controller") {
      const other = fixture();
      const otherInput = other.server();
      f.setCommitted({ ...input, native: otherInput.native });
    }
    if (change === "resource-owner") {
      const other = createResourceAdapter<RecordRow, QueryFor<typeof schema>>(
        context,
      );
      f.setCommitted({
        ...input,
        source: { ...input.source, resource: other, view: other.getSnapshot() },
      });
    }
    const before = f.controller.getSnapshot();
    for (const type of ["sort", "columns"] as const)
      expect(() => actions.require({ type })).toThrow(
        new ControlsError("controls.unavailable"),
      );
    expect(f.controller.getSnapshot()).toBe(before);
  });

it("query/layout cannot borrow a live request registered for another controller sharing the definition", () => {
  const f = fixture();
  const { actions } = authority(f);
  const other = createNativeController(f.definition, {
    initial: { query: f.controller.getSnapshot().query },
    now: () => 0,
  });
  const started = beginControlsRequest(f.definition, other, f.resource, {
    ...context,
    queryKey: "other",
    requestKey: "other",
  });
  expect(started).not.toBeNull();
  for (const type of ["sort", "columns"] as const)
    expect(() => actions.require({ type })).toThrow(
      new ControlsError("controls.unavailable"),
    );
});

it("old-scope query/layout require never returns new-scope facts and does not clear new selection", () => {
  const f = fixture();
  const { input, actions } = authority(f, "client");
  if (input.source.mode !== "client") throw new Error("Expected client");
  const next = { ...context, scopeKey: "scope:two" };
  f.setCommitted({
    ...input,
    expected: next,
    source: { ...input.source, context: next },
  });
  f.controller.dispatch({
    type: "selection.change",
    update: { "B-private": true },
  });
  expect(actions.read().selectedIds).toEqual([]);
  expect(actions.read().requestedQuery).toBeNull();
  for (const type of ["sort", "columns"] as const) {
    let result: unknown;
    expect(() => {
      result = actions.require({ type });
    }).toThrow(new ControlsError("controls.unavailable"));
    expect(result).toBeUndefined();
  }
  expect(() => actions.cancelSelection()).toThrow();
  expect(f.controller.getSnapshot().selection).toEqual({ "B-private": true });
});

for (const initialAccess of [false, true])
  for (const field of ["expected", "actual"] as const)
    it(`query/layout captures ${field} access once (${initialAccess})`, () => {
      const f = fixture();
      const { input, actions } = authority(f, "client");
      if (input.source.mode !== "client") throw new Error("Expected client");
      let reads = 0;
      const dynamic = {
        ...context,
        get access() {
          return ++reads === 1 ? initialAccess : !initialAccess;
        },
      };
      f.setCommitted(
        field === "expected"
          ? { ...input, expected: dynamic }
          : { ...input, source: { ...input.source, context: dynamic } },
      );
      if (initialAccess)
        expect(() => actions.require({ type: "sort" })).not.toThrow();
      else
        expect(() => actions.require({ type: "sort" })).toThrow(
          new ControlsError("controls.unavailable"),
        );
      expect(reads).toBe(1);
    });

for (const first of ["sort", "columns", "navigate"] as const)
  it(`intent kind is captured once rather than changing ${first} authorization on reread`, () => {
    const f = fixture();
    const { actions } = authority(f);
    let reads = 0;
    const intent = {
      get type() {
        reads++;
        return first === "navigate"
          ? reads === 1
            ? "navigate"
            : "sort"
          : reads === 1
            ? first
            : "navigate";
      },
    } as ControlsIntent;
    if (first === "navigate") expect(() => actions.require(intent)).toThrow();
    else expect(() => actions.require(intent)).not.toThrow();
    expect(reads).toBe(1);
  });

for (const failure of [
  "current-getter",
  "server-getter",
  "current-call",
] as const)
  it(`query/layout fails closed with generic errors for throwing ${failure} ports`, () => {
    const f = fixture();
    const input = f.server();
    if (input.source.mode !== "server") throw new Error("Expected server");
    const resource = {
      ...f.resource,
      get getSnapshot() {
        if (failure === "current-getter")
          throw new Error("synthetic-private-port");
        return () => {
          if (failure === "current-call")
            throw new Error("synthetic-private-port");
          return f.resource.getSnapshot();
        };
      },
      get getServerSnapshot() {
        if (failure === "server-getter")
          throw new Error("synthetic-private-port");
        return f.resource.getServerSnapshot;
      },
    };
    f.setCommitted({ ...input, source: { ...input.source, resource } });
    const actions = createControlsAuthority({
      definition: f.definition,
      controller: f.controller,
      queryIdentity: input.native.state.queryIdentity,
      context,
      mode: "server",
      resource,
      readCommitted: f.readCommitted,
    });
    const before = f.controller.getSnapshot();
    const resourceBefore = f.resource.getSnapshot();
    for (const type of ["sort", "columns"] as const)
      expect(() => actions.require({ type })).toThrow(
        new ControlsError("controls.unavailable"),
      );
    expect(f.controller.getSnapshot()).toBe(before);
    expect(f.resource.getSnapshot()).toBe(resourceBefore);
  });

it("query/layout is only a synchronous guard; existing native/controller field constraints still reject invalid events", () => {
  const f = fixture();
  const { input, actions } = authority(f);
  const before = f.controller.getSnapshot();
  actions.require({ type: "sort" });
  expect(() =>
    input.native.native.setSorting([{ id: "not-a-column", desc: false }]),
  ).toThrow();
  actions.require({ type: "columns" });
  expect(() =>
    input.native.native.setColumnVisibility({ amount: false }),
  ).toThrow();
  expect(f.controller.getSnapshot()).toBe(before);
  f.begin(); // Empty pending request still permits editing criteria/layout.
  actions.require({ type: "sort" });
  f.controller.dispatch({
    type: "sorting.change",
    update: [{ id: "amount", desc: false }],
  });
  actions.require({ type: "columns" });
  expect(f.controller.getSnapshot().query.sorting).toEqual([
    { id: "amount", desc: false },
  ]);
});

it("old captured query A permits query/layout through pending and failed B but not row/navigation/retry intents", () => {
  const f = fixture();
  f.begin();
  f.succeed();
  const { actions } = authority(f);
  f.controller.dispatch({
    type: "pagination.change",
    update: { pageIndex: 1, pageSize: 2 },
  });
  const token = f.begin("B", "B", true);
  f.server();
  for (const phase of ["pending", "failure"] as const) {
    if (phase === "failure") {
      f.resource.fail(token, "offline");
      f.server();
      expect(f.resource.getSnapshot().canRetry).toBe(true);
    }
    for (const type of ["sort", "columns"] as const)
      expect(() => actions.require({ type })).not.toThrow();
    for (const intent of [
      { type: "select-row", id: "a" },
      { type: "select-page" },
      { type: "navigate" },
      { type: "retry" },
      { type: "reorder", ids: ["a"] },
    ] as const)
      expect(() => actions.require(intent)).toThrow(
        new ControlsError("controls.unavailable"),
      );
  }
});

it("empty authorized client rows still permit query/layout without a resource port", () => {
  const f = fixture();
  const input = f.client([]);
  const actions = createControlsAuthority({
    definition: f.definition,
    controller: f.controller,
    queryIdentity: input.native.state.queryIdentity,
    context,
    mode: "client",
    readCommitted: f.readCommitted,
  });
  for (const type of ["sort", "columns"] as const)
    expect(actions.require({ type }).rows).toEqual([]);
  expect(() => actions.require({ type: "select-row", id: "a" })).toThrow();
});

it("throwing new access fields return generic errors without state writes", () => {
  const f = fixture();
  const { input, actions } = authority(f, "client");
  const before = f.controller.getSnapshot();
  f.setCommitted({
    ...input,
    expected: {
      ...context,
      get access(): boolean {
        throw new Error("synthetic-private-access");
      },
    },
  });
  for (const type of ["sort", "columns"] as const)
    expect(() => actions.require({ type })).toThrow(
      new ControlsError("controls.unavailable"),
    );
  expect(f.controller.getSnapshot()).toBe(before);
});

it("query/layout require does not create a controlled proposal or invoke an updater", () => {
  let requests = 0;
  let updates = 0;
  const f = fixture(true, {
    controlled: ["query"],
    onRequest() {
      requests++;
    },
  });
  const { actions } = authority(f);
  const before = f.controller.getSnapshot();
  actions.require({ type: "sort" });
  actions.require({ type: "columns" });
  expect(requests).toBe(0);
  expect(f.controller.getSnapshot()).toBe(before);
  const proposal = f.controller.dispatch({
    type: "sorting.change",
    update() {
      updates++;
      return [{ id: "amount", desc: false }];
    },
  });
  expect(proposal.status).toBe("proposed");
  expect(requests).toBe(1);
  expect(updates).toBe(1);
  actions.require({ type: "sort" });
  actions.require({ type: "columns" });
  expect(requests).toBe(1);
  expect(updates).toBe(1);
  expect(f.controller.getSnapshot()).toBe(before);
});
