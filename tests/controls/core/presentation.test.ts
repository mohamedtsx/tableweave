import { describe, expect, it } from "vitest";
import type { StateProposal } from "../../../packages/react/src/controller/types.js";
import {
  createControlsAuthority,
  getControlsRequestBinding,
  projectControls,
} from "../../../packages/react/src/presentation/index.js";
import type { ControlsInput } from "../../../packages/react/src/presentation/types.js";
import {
  context,
  fixture,
  type RecordRow,
  records,
  type schema,
} from "./fixtures.js";

function authority(
  f: ReturnType<typeof fixture>,
  input: ControlsInput<typeof schema, RecordRow>,
) {
  const ports = {
    definition: f.definition,
    controller: f.controller,
    queryIdentity: input.native.state.queryIdentity,
    context: input.expected,
    readCommitted: f.readCommitted,
  };
  return input.source.mode === "server"
    ? createControlsAuthority({
        ...ports,
        mode: "server",
        resource: input.source.resource,
      })
    : createControlsAuthority({ ...ports, mode: "client" });
}
describe("pure controls projection and committed event authority", () => {
  it("separates all accepted IDs from complete-client and partial-server loaded subsets", () => {
    const f = fixture();
    f.controller.dispatch({
      type: "selection.change",
      update: { a: true, c: true, missing: true },
    });
    const client = projectControls(f.definition, f.client());
    expect(client.selectedIds).toEqual(["a", "c", "missing"]);
    expect(client.loadedSelected.map((entry) => entry.id)).toEqual(["a", "c"]);
    expect(client.missingSelectedIds).toEqual(["missing"]);
    expect(client.rows.map((row) => row.id)).toEqual(["a", "b"]);
    f.begin();
    f.succeed();
    const server = projectControls(f.definition, f.server());
    expect(server.loadedSelected.map((entry) => entry.id)).toEqual(["a"]);
    expect(server.missingSelectedIds).toEqual(["c", "missing"]);
    expect(server.pageSelection.checked).toBe(true); // b is ineligible
  });
  it("keeps initial missing snapshots null rather than inventing authoritative zero metadata", () => {
    const f = fixture();
    const input = f.server();
    const before = f.resource.getSnapshot();
    const facts = projectControls(f.definition, input);
    expect(facts.displayed).toBeNull();
    expect(facts.rows).toEqual([]);
    expect(facts.canSelect).toBe(false);
    expect(facts.canNavigate).toBe(false);
    expect(f.resource.getSnapshot()).toBe(before);
  });
  it("binds opaque app keys without equating them to the controller identity", () => {
    const f = fixture();
    const token = f.begin("app-query-label", "app-request-99");
    f.succeed();
    const input = f.server();
    const facts = projectControls(f.definition, input);
    expect(token.queryKey).not.toBe(f.controller.getSnapshot().queryIdentity);
    expect(facts.canSelect).toBe(true);
    expect(facts.displayed?.request?.queryKey).toBe("app-query-label");
    expect(Object.isFrozen(facts)).toBe(true);
    expect(Object.isFrozen(facts.loadedSelected)).toBe(true);
  });
  it("blocks A immediately after accepted B, before application begin(B), while showing actual A metadata", () => {
    const f = fixture();
    f.begin();
    f.succeed();
    const input = f.server();
    const events = authority(f, input);
    f.controller.dispatch({
      type: "pagination.change",
      update: (previous) => ({ ...previous, pageIndex: 1 }),
    });
    expect(f.resource.getSnapshot().canSelect).toBe(true);
    const facts = events.read();
    expect(facts.obsolete).toBe(true);
    expect(facts.displayed?.pagination.pageIndex).toBe(0);
    expect(facts.displayed?.range).toEqual({ from: 1, to: 2 });
    expect(facts.canSelect).toBe(false);
    expect(facts.canNavigate).toBe(false);
    expect(() => events.selectRow("a", true)).toThrow();
    expect(
      getControlsRequestBinding(
        f.definition,
        f.controller,
        f.resource,
        f.resource.getSnapshot().request as NonNullable<
          ReturnType<typeof f.resource.getSnapshot>["request"]
        >,
      )?.queryIdentity,
    ).toBe(input.native.state.queryIdentity);
  });
  it("retains A provenance while pending/failed B and leaves Cancel/recovery separate", () => {
    const f = fixture();
    f.begin();
    f.succeed();
    f.controller.dispatch({ type: "selection.change", update: { a: true } });
    f.controller.dispatch({
      type: "pagination.change",
      update: (previous) => ({ ...previous, pageIndex: 1 }),
    });
    const request = f.begin("query-B", "request-B", true);
    let input = f.server();
    let facts = projectControls(f.definition, input);
    expect(facts.displayed?.pagination.pageIndex).toBe(0);
    expect(facts.busy).toBe(true);
    expect(facts.stale).toBe(true);
    expect(facts.obsolete).toBe(true);
    expect(facts.canReorder).toBe(false);
    f.resource.fail(request, "offline");
    input = f.server();
    const events = authority(f, input);
    facts = events.read();
    expect(facts.canRetry).toBe(true);
    expect(facts.loadedSelected[0]?.record).toBe(records[0]);
    const query = f.controller.getSnapshot().query;
    events.cancelSelection();
    expect(f.controller.getSnapshot().selection).toEqual({});
    expect(f.controller.getSnapshot().query).toBe(query);
    expect(events.retry()?.generation).toBe(request.generation + 1);
  });
  it("uses semantic query identities rather than editor IDs or object reference equality", () => {
    const f = fixture();
    f.controller.dispatch({
      type: "builder.commit",
      rule: {
        id: "original",
        field: "amount",
        operator: "number.gt",
        value: 0,
      },
    });
    f.begin();
    f.succeed();
    const identity = f.controller.getSnapshot().queryIdentity;
    f.controller.dispatch({
      type: "builder.duplicate",
      ruleId: "original",
      newRuleId: "another-editor-id",
    });
    expect(f.controller.getSnapshot().queryIdentity).toBe(identity);
    const facts = projectControls(f.definition, f.server());
    expect(facts.obsolete).toBe(false);
    expect(facts.canSelect).toBe(true);
  });
  it("masks wrong scope/access/definition contexts using the actual resource projection", () => {
    const f = fixture();
    f.begin();
    f.succeed();
    const input = f.server();
    for (const expected of [
      { ...context, scopeKey: "other" },
      { ...context, definitionKey: "other" },
      { ...context, access: false },
    ]) {
      const facts = projectControls(f.definition, { ...input, expected });
      expect(facts.displayed).toBeNull();
      expect(facts.rows).toEqual([]);
      expect(facts.canSelect).toBe(false);
    }
    f.resource.fail(f.begin(), "access-lost");
    expect(
      projectControls(f.definition, {
        ...input,
        source:
          input.source.mode === "server"
            ? { ...input.source, view: f.resource.getSnapshot() }
            : input.source,
      }).rows,
    ).toEqual([]);
  });
  it("rejects wrong native records or page metadata before calling anything fresh", () => {
    const f = fixture();
    f.begin();
    f.succeed();
    const wrongRecords = [
      { id: "a", amount: 99, eligible: true },
      { id: "b", amount: 2, eligible: false },
    ];
    expect(
      projectControls(f.definition, f.server({ records: wrongRecords }))
        .displayed,
    ).toBeNull();
    const wrongPage = projectControls(
      f.definition,
      f.server({ page: { kind: "known", total: 1000 } }),
    );
    expect(wrongPage.displayed).toBeNull();
    expect(wrongPage.canNavigate).toBe(false);
  });
  it("does not let matching strings/generations bind another resource/controller instance", () => {
    const a = fixture();
    const b = fixture();
    a.begin();
    a.succeed();
    b.begin();
    b.succeed();
    const av = a.server();
    const bv = b.server();
    if (av.source.mode !== "server" || bv.source.mode !== "server")
      throw new Error("Expected server input");
    expect(
      projectControls(a.definition, {
        ...av,
        source: { ...av.source, view: bv.source.view },
      }).rows,
    ).toEqual([]);
    expect(
      projectControls(a.definition, {
        ...av,
        source: { ...av.source, bindings: bv.source.bindings },
      }).rows,
    ).toEqual([]);
    expect(projectControls(a.definition, bv).blockedReason).toBe("definition");
  });
  it("old callbacks recheck latest resource metadata and committed native input, not render flags", () => {
    const f = fixture();
    f.begin();
    f.succeed(records.slice(0, 2), { kind: "unknown", hasNextPage: true });
    const input = f.server();
    const events = authority(f, input);
    const oldNext = events.nextPage;
    f.begin();
    f.succeed(records.slice(0, 2), { kind: "unknown", hasNextPage: false });
    expect(() => oldNext()).toThrow(); // current resource differs from committed bindings
    f.server();
    expect(events.read().canNextPage).toBe(false);
    expect(oldNext().status).toBe("noop");
    expect(f.controller.getSnapshot().query.pagination.pageIndex).toBe(0);
  });
  it("same-ID eligibility refresh and old scope/query callbacks cannot select stale targets", () => {
    const f = fixture();
    const input = f.client();
    const events = authority(f, input);
    f.client(records.map((row) => ({ ...row, eligible: false })));
    expect(() => events.selectRow("a", true)).toThrow();
    expect(f.controller.getSnapshot().selection).toEqual({});
    f.controller.dispatch({
      type: "pagination.change",
      update: (previous) => ({ ...previous, pageIndex: 1 }),
    });
    f.client();
    expect(() => events.nextPage()).toThrow();
    expect(() =>
      events.require({ type: "reorder", ids: ["a", "c"] }),
    ).toThrow();
  });
  it("keeps same-query refresh resource guards authoritative and never mutates source values", () => {
    const f = fixture();
    f.begin();
    f.succeed();
    f.begin();
    const input = f.server();
    const state = f.controller.getSnapshot();
    const resource = f.resource.getSnapshot();
    const facts = projectControls(f.definition, input);
    expect(facts.obsolete).toBe(false);
    expect(facts.canSelect).toBe(true);
    expect(facts.canNavigate).toBe(false);
    expect(facts.canReorder).toBe(false);
    expect(f.controller.getSnapshot()).toBe(state);
    expect(f.resource.getSnapshot()).toBe(resource);
  });
  it("reports real fresh-empty zero separately from missing metadata and uses native filtering for clients", () => {
    const f = fixture();
    f.begin();
    f.succeed([], { kind: "known", total: 0 });
    const zero = projectControls(f.definition, f.server());
    expect(zero.displayed?.pageInfo).toEqual({ kind: "known", total: 0 });
    expect(zero.displayed?.pageCount).toBe(0);
    expect(zero.displayed?.range).toEqual({ from: 0, to: 0 });
    expect(zero.canNextPage).toBe(false);
    f.controller.dispatch({
      type: "builder.commit",
      rule: { id: "gt", field: "amount", operator: "number.gt", value: 2 },
    });
    const client = projectControls(f.definition, f.client());
    expect(client.rows.map((row) => row.id)).toEqual(["c"]);
    expect(client.displayed?.pageInfo).toEqual({ kind: "known", total: 1 });
    expect(client.canReorder).toBe(false);
  });
  it("single authority replaces row IDs but never offers a one-row page-all shortcut", () => {
    const f = fixture("single");
    const a = records[0];
    const c = records[2];
    if (!a || !c) throw new Error("Missing fixture records");
    const events = authority(f, f.client([a, c]));
    events.selectRow("a", true);
    events.selectRow("c", true);
    expect(events.read().selectedIds).toEqual(["c"]);
    expect(() => events.selectPage(true)).toThrow();
    f.client([c]);
    expect(() => events.selectPage(false)).toThrow();
  });
  it("scope mismatch suppresses private projection facts without taking ownership of Cancel", () => {
    const f = fixture();
    f.controller.dispatch({ type: "selection.change", update: { a: true } });
    f.begin();
    f.succeed();
    const input = f.server();
    const events = authority(f, input);
    const next = { ...context, scopeKey: "scope:two" };
    const facts = projectControls(f.definition, { ...input, expected: next });
    expect(facts.selectedIds).toEqual([]);
    expect(facts.requestedQuery).toBeNull();
    expect(facts.canCancelSelection).toBe(false);
    f.setCommitted({ ...input, expected: next });
    expect(events.read().rows).toEqual([]);
    expect(events.read().selectedIds).toEqual([]);
    expect(() => events.cancelSelection()).toThrow();
    expect(f.controller.getSnapshot().selection).toEqual({ a: true });
  });
  it("reorder authority checks every target ID after a same-query data refresh", () => {
    const f = fixture();
    const a = records[0];
    const c = records[2];
    if (!a || !c) throw new Error("Missing fixture records");
    const events = authority(f, f.client([a, c]));
    expect(
      events.require({ type: "reorder", ids: ["a", "c"] }).canReorder,
    ).toBe(true);
    f.client([
      { id: "x", amount: 1, eligible: true },
      { id: "y", amount: 2, eligible: true },
    ]);
    expect(() =>
      events.require({ type: "reorder", ids: ["a", "c"] }),
    ).toThrow();
    expect(
      events.require({ type: "reorder", ids: ["x", "y"] }).canReorder,
    ).toBe(true);
  });
  it("honors resource-side opaque-request revocation even for semantically equal queries", () => {
    const f = fixture();
    f.begin();
    f.succeed();
    f.begin("opaque-query", "new-opaque-request");
    const facts = projectControls(f.definition, f.server());
    expect(facts.obsolete).toBe(false);
    expect(facts.resourceObsolete).toBe(true);
    expect(facts.canSelect).toBe(false);
    expect(facts.canNavigate).toBe(false);
  });
  it("rejects an oversized manual page and a locally processed server snapshot", () => {
    const f = fixture();
    f.begin();
    f.succeed(records);
    expect(projectControls(f.definition, f.server()).displayed).toBeNull();
    f.begin();
    f.succeed(records.slice(0, 2));
    const server = f.server();
    const snapshot = f.resource.getSnapshot().snapshot;
    if (!snapshot) throw new Error("Missing snapshot");
    const client = f.client(snapshot.records);
    expect(
      projectControls(f.definition, { ...server, native: client.native })
        .displayed,
    ).toBeNull();
  });
  it("preserves arbitrary stable IDs through single native and guarded selection intents", () => {
    const f = fixture("single");
    const input = f.client([
      { id: "__proto__", amount: 1, eligible: true },
      { id: "constructor", amount: 2, eligible: true },
    ]);
    input.native.native.getRow("__proto__").toggleSelected(true);
    expect(Object.keys(f.controller.getSnapshot().selection)).toEqual([
      "__proto__",
    ]);
    const events = authority(f, input);
    events.selectRow("constructor", true);
    expect(events.read().selectedIds).toEqual(["constructor"]);
    events.selectRow("__proto__", true);
    expect(events.read().loadedSelected[0]?.id).toBe("__proto__");
  });
  it("a controlled Cancel proposal never optimistically changes the selected-ID projection", () => {
    let proposal: StateProposal<typeof schema> | undefined;
    const f = fixture(true, {
      controlled: ["selection"],
      onRequest: (next) => {
        proposal = next;
      },
    });
    f.controller.dispatch({ type: "selection.change", update: { a: true } });
    if (!proposal) throw new Error("Missing selection proposal");
    f.controller.accept(proposal);
    const input = f.client();
    const events = authority(f, input);
    const query = f.controller.getSnapshot().query;
    expect(events.cancelSelection().status).toBe("proposed");
    const pending = proposal;
    expect(events.read().selectedIds).toEqual(["a"]);
    f.controller.reject(pending);
    expect(events.read().selectedIds).toEqual(["a"]);
    events.cancelSelection();
    const accepted = proposal;
    if (!accepted) throw new Error("Missing Cancel proposal");
    f.controller.accept(accepted);
    expect(events.read().selectedIds).toEqual([]);
    expect(f.controller.getSnapshot().query).toBe(query);
  });
  it("unknown totals allow only explicit adjacent navigation, never numbered/last-page guesses", () => {
    const f = fixture();
    f.controller.dispatch({
      type: "pagination.change",
      update: (previous) => ({ ...previous, pageIndex: 3 }),
    });
    f.begin();
    f.succeed([], { kind: "unknown", hasNextPage: true });
    const events = authority(f, f.server());
    expect(() => events.setPageIndex(0)).toThrow();
    expect(() => events.setPageIndex(5)).toThrow();
    expect(f.controller.getSnapshot().query.pagination.pageIndex).toBe(3);
    events.previousPage();
    expect(f.controller.getSnapshot().query.pagination.pageIndex).toBe(2);
  });
  it("fresh known shrink exposes actual out-of-range provenance without impossible Previous targets", () => {
    const f = fixture();
    f.controller.dispatch({
      type: "pagination.change",
      update: (previous) => ({ ...previous, pageIndex: 4 }),
    });
    f.begin();
    f.succeed([], { kind: "known", total: 3 });
    const input = f.server();
    const events = authority(f, input);
    const facts = events.read();
    expect(facts.displayed?.pagination.pageIndex).toBe(4);
    expect(facts.displayed?.pageCount).toBe(2);
    expect(facts.displayed?.range).toBeNull();
    expect(facts.canPreviousPage).toBe(false);
    expect(events.previousPage().status).toBe("noop");
    events.setPageIndex(1);
    expect(f.controller.getSnapshot().query.pagination.pageIndex).toBe(1);
  });
});
