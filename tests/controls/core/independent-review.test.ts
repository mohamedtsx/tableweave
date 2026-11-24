import { expect, it } from "vitest";
import {
  createQuery,
  defineQuerySchema,
} from "../../../packages/react/src/contracts/index.js";
import type { QueryFor } from "../../../packages/react/src/contracts/types.js";
import type {
  ControllerOptions,
  TableCommand,
} from "../../../packages/react/src/controller/types.js";
import * as presentation from "../../../packages/react/src/presentation/index.js";
import {
  beginControlsRequest,
  createControlsAuthority,
  getControlsRequestBinding,
  projectControls,
} from "../../../packages/react/src/presentation/index.js";
import { createResourceAdapter } from "../../../packages/react/src/resource/adapter.js";
import { createNativeBoundary } from "../../../packages/react/src/tanstack/boundary.js";
import {
  createNativeController,
  defineNativeTable,
} from "../../../packages/react/src/tanstack/index.js";
import {
  context,
  fixture,
  type RecordRow,
  records,
  schema,
} from "./fixtures.js";

it("n1 rejects accessor commands without letting the kind change after validation", () => {
  const f = fixture("single");
  let reads = 0;
  const command = {
    get type() {
      return ++reads === 1 ? "selection.change" : "selection.page";
    },
    pageIds: ["a"],
    eligibleIds: ["a"],
    selected: true,
    queryIdentity: f.controller.getSnapshot().queryIdentity,
  };
  const before = f.controller.getSnapshot();
  expect(() =>
    f.controller.dispatch(command as TableCommand<typeof schema>),
  ).toThrow();
  expect(reads).toBe(0);
  expect(f.controller.getSnapshot()).toBe(before);
});

it("n1 retains original immutable proposal intent despite caller kind mutation", () => {
  let deny = false;
  const seen: string[] = [];
  const f = fixture("single", {
    controlled: ["selection"],
    onRequest() {},
    validateCommand(command) {
      seen.push(command.type);
      if (deny && command.type === "selection.change")
        throw new Error("denied");
    },
  });
  const command: {
    type: "selection.change" | "selection.cancel";
    update: Record<string, boolean>;
  } = { type: "selection.change", update: { a: true } };
  const pending = f.controller.dispatch(command);
  if (pending.status !== "proposed") throw new Error("Missing proposal");
  const before = f.controller.getSnapshot();
  deny = true;
  command.type = "selection.cancel";
  expect(() => f.controller.accept(pending.proposal)).toThrow();
  expect(seen).toEqual(["selection.change", "selection.change"]);
  expect(f.controller.getSnapshot()).toBe(before);
  deny = false;
  f.controller.accept(pending.proposal);
  expect(f.controller.getSnapshot().selection).toEqual({ a: true });
});

it("n1 retains nested constant payloads rather than mutable caller updates", () => {
  const seen: unknown[] = [];
  const f = fixture("single", {
    controlled: ["selection"],
    onRequest() {},
    validateCommand(command) {
      if (command.type === "selection.change") seen.push(command.update);
    },
  });
  const update = { a: true };
  const pending = f.controller.dispatch({ type: "selection.change", update });
  if (pending.status !== "proposed") throw new Error("Missing proposal");
  update.a = false;
  f.controller.accept(pending.proposal);
  expect(seen).toEqual([{ a: true }, { a: true }]);
  expect(Object.isFrozen(seen[0])).toBe(true);
  expect(Object.isFrozen(update)).toBe(false);
});

it("n2 old-scope Cancel cannot clear a newly committed scope's selection", () => {
  const f = fixture();
  const input = f.client();
  const events = createControlsAuthority({
    definition: f.definition,
    controller: f.controller,
    mode: "client",
    context,
    queryIdentity: input.native.state.queryIdentity,
    readCommitted: f.readCommitted,
  });
  const nextContext = { ...context, scopeKey: "scope:two" };
  const next = f.client();
  if (next.source.mode !== "client") throw new Error("Expected client");
  f.setCommitted({
    ...next,
    expected: nextContext,
    source: { ...next.source, context: nextContext },
  });
  f.controller.dispatch({ type: "selection.change", update: { c: true } });
  expect(events.read().blockedReason).toBe("context");
  expect(() => events.cancelSelection()).toThrow();
  expect(f.controller.getSnapshot().selection).toEqual({ c: true });
});

it("n3 copied authentic views cannot launder foreign snapshots with colliding provenance", () => {
  const f = fixture();
  const token = f.begin();
  f.succeed(records.slice(0, 2));
  const input = f.server();
  if (input.source.mode !== "server") throw new Error("Expected server");
  const other = createResourceAdapter<RecordRow, QueryFor<typeof schema>>(
    context,
  );
  const request = other.begin({
    ...context,
    queryKey: token.queryKey,
    requestKey: token.requestKey,
    query: token.query,
  });
  if (!request) throw new Error("Missing request");
  other.succeed(request, {
    source: "fresh",
    records: [{ id: "other", amount: 99, eligible: true }],
    page: { kind: "known", total: 1 },
    emptyKind: "unknown",
    receivedAt: "2026-11-24T00:00:00Z",
  });
  const snapshot = other.getSnapshot().snapshot;
  if (!snapshot) throw new Error("Missing snapshot");
  const frame = f.boundary.prepare(
    { mode: "server", records: snapshot.records, pageInfo: snapshot.page },
    f.controller.getSnapshot(),
  );
  f.boundary.commit(frame);
  const facts = projectControls(f.definition, {
    ...input,
    native: f.boundary.getView(frame),
    source: { ...input.source, view: { ...input.source.view, snapshot } },
  });
  expect(facts.rows).toEqual([]);
  expect(facts.canSelect).toBe(false);
  expect(facts.displayed).toBeNull();
  let reads = 0;
  const source = input.source;
  const getterFacts = projectControls(f.definition, {
    ...input,
    native: f.boundary.getView(frame),
    source: {
      ...source,
      get view() {
        return ++reads === 1 ? source.view : { ...source.view, snapshot };
      },
    },
  });
  expect(getterFacts.rows).toEqual([]);
  expect(reads).toBe(1);
});

it("n4 deleting installed native command guard options cannot weaken the controller", () => {
  const f = fixture("single");
  const options: ControllerOptions<typeof schema> = {
    initial: { query: f.controller.getSnapshot().query },
    now: () => 0,
    validateCommand() {
      throw new Error("deny");
    },
  };
  const c = createNativeController(f.definition, options);
  Reflect.deleteProperty(options, "validateCommand");
  expect(() =>
    c.dispatch({ type: "selection.change", update: { a: true } }),
  ).toThrow();
  expect(c.getSnapshot().selection).toEqual({});
});

it("n4 replacing installed native state guard options cannot weaken the controller", () => {
  const f = fixture("single");
  const options = {
    initial: { query: f.controller.getSnapshot().query },
    now: () => 0,
    validateState(state: ReturnType<typeof f.controller.getSnapshot>) {
      if (state.selection.a) throw new Error("deny");
    },
  };
  const c = createNativeController(f.definition, options);
  options.validateState = () => {};
  expect(() =>
    c.dispatch({ type: "selection.change", update: { a: true } }),
  ).toThrow();
  expect(c.getSnapshot().selection).toEqual({});
});

it("n5 a relative request begun under A never acquires B's clock provenance", () => {
  let now = Date.parse("2026-01-01T12:00:00Z");
  const firstTime = now;
  const s = defineQuerySchema({
    id: "review-relative",
    version: 1,
    fields: {
      day: { type: "date", owner: "builder", relativePresets: ["today"] },
    },
  });
  const definition = defineNativeTable({
    schema: s,
    selection: true,
    getRowId: (record: { id: string; day: string }) => record.id,
    columns: [{ id: "day", accessorKey: "day" }],
  });
  const query = createQuery(s, {
    locale: "en-US",
    timeZone: "UTC",
    builder: {
      join: "and",
      rules: [
        {
          id: "today",
          field: "day",
          operator: "date.on",
          value: { kind: "relative", preset: "today" },
        },
      ],
    },
  });
  const controller = createNativeController(definition, {
    initial: { query },
    now: () => now,
  });
  const resource = createResourceAdapter<
    { id: string; day: string },
    QueryFor<typeof s>
  >(context);
  const original = controller.getSnapshot().queryIdentity;
  const started = beginControlsRequest(definition, controller, resource, {
    ...context,
    queryKey: "opaque",
    requestKey: "opaque",
  });
  if (!started) throw new Error("Missing request");
  const { request } = started;
  now = Date.parse("2026-01-02T12:00:00Z");
  controller.dispatch({ type: "clock.tick" });
  const binding = getControlsRequestBinding(
    definition,
    controller,
    resource,
    request,
  );
  if (!binding) throw new Error("Missing binding");
  expect(binding.queryIdentity).toBe(original);
  expect(binding.evaluatedAt).toBe(firstTime);
  resource.succeed(request, {
    source: "fresh",
    records: [{ id: "old", day: "2026-01-01" }],
    page: { kind: "known", total: 1 },
    emptyKind: "unknown",
    receivedAt: "2026-01-02T12:00:00Z",
  });
  const view = resource.getSnapshot();
  if (!view.snapshot) throw new Error("Missing snapshot");
  const boundary = createNativeBoundary(definition, controller);
  const frame = boundary.prepare(
    {
      mode: "server",
      records: view.snapshot.records,
      pageInfo: view.snapshot.page,
    },
    controller.getSnapshot(),
  );
  boundary.commit(frame);
  const facts = projectControls(definition, {
    native: boundary.getView(frame),
    expected: context,
    source: {
      mode: "server",
      resource,
      view,
      bindings: { request: binding, snapshot: binding },
    },
  });
  expect(facts.obsolete).toBe(true);
  expect(facts.canSelect).toBe(false);
});

it("n6 selection input is captured once and the exact published mode is validated", () => {
  const f = fixture("single");
  let reads = 0;
  const definition = defineNativeTable({
    schema,
    columns: f.definition.columns,
    getRowId: (record: RecordRow) => record.id,
    get selection() {
      return (++reads <= 6 ? "single" : "all") as "single";
    },
  });
  expect(reads).toBe(1);
  expect(definition.selectionMode).toBe("single");
  const c = createNativeController(definition, {
    initial: { query: f.controller.getSnapshot().query },
    now: () => 0,
  });
  expect(() =>
    c.dispatch({ type: "selection.change", update: { a: true, c: true } }),
  ).toThrow();
});

it("n2 Cancel checks the actual current resource scope even when the committed expected tags lag", () => {
  const f = fixture();
  f.begin();
  f.succeed();
  const input = f.server();
  const events = createControlsAuthority({
    definition: f.definition,
    controller: f.controller,
    mode: "server",
    resource: f.resource,
    context,
    queryIdentity: input.native.state.queryIdentity,
    readCommitted: f.readCommitted,
  });
  f.resource.setContext({ ...context, scopeKey: "scope:two" });
  f.controller.dispatch({ type: "selection.change", update: { c: true } });
  expect(events.read().canCancelSelection).toBe(false);
  expect(() => events.cancelSelection()).toThrow();
  expect(f.controller.getSnapshot().selection).toEqual({ c: true });
});

it("n2 same-owner access-loss Cancel remains available despite changed query and missing rows", () => {
  const f = fixture();
  f.begin();
  f.succeed();
  const input = f.server();
  const events = createControlsAuthority({
    definition: f.definition,
    controller: f.controller,
    mode: "server",
    resource: f.resource,
    context,
    queryIdentity: input.native.state.queryIdentity,
    readCommitted: f.readCommitted,
  });
  f.controller.dispatch({
    type: "pagination.change",
    update: { pageIndex: 1, pageSize: 2 },
  });
  f.resource.setContext({ ...context, access: false });
  f.controller.dispatch({ type: "selection.change", update: { a: true } });
  expect(events.read().canSelect).toBe(false);
  expect(events.read().canCancelSelection).toBe(true);
  events.cancelSelection();
  expect(f.controller.getSnapshot().selection).toEqual({});
});

it("n2 Cancel cannot cross a replacement native definition/controller or resource owner", () => {
  const f = fixture();
  const other = fixture();
  f.begin();
  f.succeed();
  const input = f.server();
  const events = createControlsAuthority({
    definition: f.definition,
    controller: f.controller,
    mode: "server",
    resource: f.resource,
    context,
    queryIdentity: input.native.state.queryIdentity,
    readCommitted: f.readCommitted,
  });
  f.controller.dispatch({ type: "selection.change", update: { a: true } });
  other.begin();
  other.succeed();
  f.setCommitted(other.server());
  expect(() => events.cancelSelection()).toThrow();
  expect(f.controller.getSnapshot().selection).toEqual({ a: true });
  if (input.source.mode !== "server") throw new Error("Expected server");
  f.setCommitted({
    ...input,
    source: {
      ...input.source,
      resource: other.resource,
      view: other.resource.getSnapshot(),
    },
  });
  expect(() => events.cancelSelection()).toThrow();
  expect(f.controller.getSnapshot().selection).toEqual({ a: true });
});

it("n3 rejects even same-record copies while accepting the actual unmasked server snapshot instance", () => {
  const f = fixture();
  f.begin();
  f.succeed();
  const input = f.server();
  if (input.source.mode !== "server") throw new Error("Expected server");
  expect(
    projectControls(f.definition, {
      ...input,
      source: { ...input.source, view: { ...input.source.view } },
    }).rows,
  ).toEqual([]);
  const server = projectControls(f.definition, {
    ...input,
    source: {
      ...input.source,
      view: f.resource.getServerSnapshot(),
      bindings: { request: null, snapshot: null },
    },
  });
  expect(server.blockedReason).toBe("binding");
  expect(server.displayed).toBeNull();
  expect(server.canSelect).toBe(false);
  expect(projectControls(f.definition, input).canSelect).toBe(true);
});

it("n4 native callback getters are captured once, including async guards", async () => {
  const f = fixture();
  let commandReads = 0;
  let stateReads = 0;
  const c = createNativeController(f.definition, {
    initial: { query: f.controller.getSnapshot().query },
    now: () => 0,
    get validateCommand() {
      commandReads++;
      return () => Promise.reject(new Error("synthetic-private-callback"));
    },
    get validateState() {
      stateReads++;
      return () => {};
    },
  });
  expect(commandReads).toBe(1);
  expect(stateReads).toBe(1);
  expect(() => c.dispatch({ type: "selection.cancel" })).toThrow();
  await Promise.resolve();
  expect(commandReads).toBe(1);
  expect(stateReads).toBe(1);
});

it("n6 multiSort and row callbacks are captured once without freezing business records", () => {
  const f = fixture();
  let sortReads = 0;
  let idReads = 0;
  let selectableReads = 0;
  const getRowId = (record: RecordRow) => record.id;
  const definition = defineNativeTable({
    schema,
    columns: f.definition.columns,
    get multiSort() {
      sortReads++;
      return false;
    },
    get getRowId() {
      idReads++;
      return getRowId;
    },
    get isRowSelectable() {
      selectableReads++;
      return (record: RecordRow) => record.eligible;
    },
  });
  expect(sortReads).toBe(1);
  expect(idReads).toBe(1);
  expect(selectableReads).toBe(1);
  expect(definition.multiSort).toBe(false);
  expect(definition.getRowId).toBe(getRowId);
  expect(Object.isFrozen(records[0])).toBe(false);
  expect(() =>
    defineNativeTable({
      schema,
      columns: f.definition.columns,
      getRowId,
      get selection() {
        return "all" as "single";
      },
    }),
  ).toThrow();
  let accessorReads = 0;
  const accessor = (record: RecordRow) => record.amount;
  const aliased = defineNativeTable({
    schema,
    getRowId,
    columns: [{ id: "amount", accessorFn: accessor }],
    evaluation: {
      accessors: {
        get amount() {
          accessorReads++;
          return accessor;
        },
      },
    },
  });
  expect(accessorReads).toBe(1);
  expect(aliased.evaluation.accessors?.amount).toBe(accessor);
});

it("n5 no post-hoc bind exists and never-registered old tokens cannot acquire any provenance", () => {
  const f = fixture();
  const raw = f.resource.begin({
    ...context,
    queryKey: "raw",
    requestKey: "raw",
    query: f.controller.getSnapshot().query,
  });
  if (!raw) throw new Error("Missing raw request");
  expect("bindControlsRequest" in presentation).toBe(false);
  expect(
    getControlsRequestBinding(f.definition, f.controller, f.resource, raw),
  ).toBeNull();
  f.controller.dispatch({
    type: "pagination.change",
    update: { pageIndex: 1, pageSize: 2 },
  });
  expect(
    getControlsRequestBinding(f.definition, f.controller, f.resource, raw),
  ).toBeNull();
  const started = beginControlsRequest(f.definition, f.controller, f.resource, {
    ...context,
    queryKey: "new",
    requestKey: "new",
  });
  if (!started) throw new Error("Missing request");
  expect(started.request).not.toBe(raw);
  expect(started.request.query.pagination.pageIndex).toBe(1);
  expect(
    getControlsRequestBinding(f.definition, f.controller, f.resource, raw),
  ).toBeNull();
});

it("n5 controller observers during begin cannot relabel the captured accepted query", () => {
  const f = fixture();
  const before = f.controller.getSnapshot();
  let once = false;
  const unsubscribe = f.resource.subscribe(() => {
    if (!once) {
      once = true;
      f.controller.dispatch({
        type: "pagination.change",
        update: { pageIndex: 1, pageSize: 2 },
      });
    }
  });
  const started = beginControlsRequest(f.definition, f.controller, f.resource, {
    ...context,
    queryKey: "A",
    requestKey: "A",
  });
  unsubscribe();
  if (!started) throw new Error("Missing request");
  expect(started.binding.queryIdentity).toBe(before.queryIdentity);
  expect(started.request.query.pagination.pageIndex).toBe(0);
  expect(started.binding.queryIdentity).not.toBe(
    f.controller.getSnapshot().queryIdentity,
  );
  f.resource.succeed(started.request, {
    source: "fresh",
    records: records.slice(0, 2),
    page: { kind: "known", total: 3 },
    emptyKind: "unknown",
    receivedAt: "2026-11-24T00:00:00Z",
  });
  const input = f.server();
  if (input.source.mode !== "server") throw new Error("Expected server");
  const facts = projectControls(f.definition, {
    ...input,
    source: {
      ...input.source,
      bindings: { request: started.binding, snapshot: started.binding },
    },
  });
  expect(facts.obsolete).toBe(true);
  expect(facts.canSelect).toBe(false);
});

it("n5 retry registers only its original request provenance before explicit app transport", () => {
  const f = fixture();
  let callback = false;
  const started = beginControlsRequest(f.definition, f.controller, f.resource, {
    ...context,
    queryKey: "A",
    requestKey: "A",
    retry(request) {
      callback = true;
      const binding = getControlsRequestBinding(
        f.definition,
        f.controller,
        f.resource,
        request,
      );
      expect(binding?.queryIdentity).toBe(started?.binding.queryIdentity);
    },
  });
  if (!started) throw new Error("Missing request");
  expect(callback).toBe(false); // begin never starts transport
  f.resource.fail(started.request, "offline");
  f.controller.dispatch({
    type: "pagination.change",
    update: { pageIndex: 1, pageSize: 2 },
  });
  const retry = f.resource.retry();
  if (!retry) throw new Error("Missing retry");
  expect(callback).toBe(true);
  const binding = getControlsRequestBinding(
    f.definition,
    f.controller,
    f.resource,
    retry,
  );
  expect(binding?.queryIdentity).toBe(started.binding.queryIdentity);
  expect(binding?.queryIdentity).not.toBe(
    f.controller.getSnapshot().queryIdentity,
  );
});
