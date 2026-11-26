import assert from "node:assert/strict";
import test from "node:test";
import { createQuery } from "../../packages/react/src/contracts/query.js";
import { createCriteriaAuthority, getCriteriaAuthorityOrigin, requireCriteriaAuthority } from "../../packages/react/src/controller/criteria.js";
import { createCriteriaPublication, getCriteriaPublicationBinding } from "../../packages/react/src/controller/criteria-publication.js";
import type { CriteriaPublicationTicket } from "../../packages/react/src/controller/criteria-publication.js";
import { createTableController, replaceTableDefinition } from "../../packages/react/src/controller/store.js";
import type { MutationResult, SelectionState, TableCommand } from "../../packages/react/src/controller/types.js";
import { assertNativeController, createNativeController } from "../../packages/react/src/tanstack/definition.js";
import { context, nativeFor, schemaFor, seedFor } from "./fixtures.js";
import type { S } from "./fixtures.js";
import { adoptSupplied, ApplicationOwner, prepareReplacement } from "./owner.js";

function owner(selection: SelectionState = { r1: true }) {
  return ApplicationOwner.create({ native: nativeFor(), initial: seedFor(schemaFor(), selection), context, now: () => 0 });
}
function proposal(result: MutationResult<S>) {
  assert.equal(result.status, "proposed");
  if (result.status !== "proposed") throw new Error("Expected actual proposal");
  return result.proposal;
}
function ticket(result: ReturnType<ReturnType<typeof owner>["prepareInitial"]>) {
  assert.equal(result.status, "pending");
  if (result.status !== "pending") throw new Error("Expected actual ticket");
  return result.ticket;
}
function callbackCounts(o: ReturnType<typeof owner>) {
  return { request: o.counts.request, commit: o.counts.commit, query: o.counts.query, subscriber: o.counts.subscriber };
}
const commands: readonly TableCommand<S>[] = [
  { type: "search.commit", search: "synthetic" },
  { type: "sorting.change", update: [{ id: "title", desc: true }] },
  { type: "selection.change", update: { r2: true } },
  { type: "columns.visibility", update: { title: false } },
];
for (const command of commands) {
  for (const resolution of ["accept", "reject"] as const) {
    test(`B01-03 certified adoption preserves exact ${command.type} receipt, then normal ${resolution}`, () => {
      const o = owner({ r1: true, r3: true });
      assertNativeController(o.ND, o.C);
      assert.equal(o.CD, o.C.getDefinition());
      assert.notEqual(o.CD, o.ND.controllerDefinition);
      assert(Object.isFrozen(o.C));
      const pending = proposal(o.propose(command));
      const before = o.C.getSnapshot(), counts = callbackCounts(o), generation = o.receiptGeneration;
      const query = before.query, selection = before.selection;
      assert.equal(o.adopt().status, "settled");
      assert.equal(o.counts.retire, 1);
      assert.equal(o.counts.emptyAcknowledgement, 1);
      assert.equal(o.C.getSnapshot(), before);
      assert.equal(o.C.getSnapshot().query, query);
      assert.equal(o.C.getSnapshot().selection, selection);
      assert.equal(o.C.getSnapshot().revision, before.revision);
      assert.equal(o.pending, pending);
      assert.equal(o.receiptGeneration, generation);
      assert.deepEqual(callbackCounts(o), counts);
      if (resolution === "accept") {
        assert.equal(o.acceptPending().status, "committed");
        assert.equal(o.C.getSnapshot().revision, before.revision + 1);
        if (command.type === "search.commit") {
          assert.equal(o.C.getSnapshot().query.search, "synthetic");
          assert.equal(Object.keys(o.C.getSnapshot().selection).length, 0);
        }
      } else {
        o.rejectPending();
        assert.equal(o.C.getSnapshot(), before);
      }
      assert.equal(o.pending, null);
      assert.throws(() => o.C.accept(pending), { code: "state.stale" });
    });
  }
}

test("B01 native single seed preserved; incompatible single/disabled cardinality rejects", () => {
  const o = ApplicationOwner.create({ native: nativeFor("single"), initial: seedFor(), context, now: () => 0 });
  const before = o.C.getSnapshot();
  assert.equal(o.adopt().status, "settled");
  assert.equal(o.C.getSnapshot(), before);
  for (const mode of ["single", false] as const) {
    assert.throws(() => ApplicationOwner.create({ native: nativeFor(mode), initial: seedFor(schemaFor(), { r1: true, r2: true }), context, now: () => 0 }));
  }
  const next = proposal(o.propose({ type: "selection.change", update: { r2: true } }));
  assert.equal(o.acceptPending().status, "committed");
  assert.deepEqual(Object.keys(next.transition.state.selection), ["r2"]);
});

test("B05 unknown external equal keys/revision/query/IDs is unavailable, actual owner history can adopt", () => {
  const o = owner(), equal = owner();
  const receipt = proposal(o.propose(commands[0] as TableCommand<S>));
  const before = o.C.getSnapshot();
  assert.equal(before.revision, equal.C.getSnapshot().revision);
  assert.equal(before.queryIdentity, equal.C.getSnapshot().queryIdentity);
  assert.deepEqual(before.selection, equal.C.getSnapshot().selection);
  assert.equal(adoptSupplied(o.C).status, "unavailable");
  assert.equal(adoptSupplied(o.C, equal).status, "unavailable");
  assert.equal(o.P.getSnapshot().phase, "unready");
  assert.equal(o.C.getSnapshot(), before);
  assert.equal(o.pending, receipt);
  assert.equal(adoptSupplied(o.C, o).status, "settled");
  assert.equal(o.C.getSnapshot(), before);
  assert.equal(o.pending, receipt);
});

test("B06/B24 same current bundle borrow/release/remount changes only exact local participants/subscriptions", () => {
  const o = owner();
  const receipt = proposal(o.propose(commands[0] as TableCommand<S>));
  assert.equal(o.adopt().status, "settled");
  const before = o.C.getSnapshot(), domain = o.P.getSnapshot().current, incarnation = o.incarnation, counts = { ...o.counts };
  const first = adoptSupplied(o.C, o);
  assert.equal(first.status, "borrowed");
  if (first.status !== "borrowed") throw new Error("Expected borrow");
  first.view.release();
  const second = o.borrow();
  first.view.release(); // an old local release cannot release the newer participant
  assert.equal(second.local, "synthetic-view");
  assert.equal(second.authority.require().controller, o.C);
  second.release();
  assert.equal(o.C.getSnapshot(), before);
  assert.equal(o.P.getSnapshot().current, domain);
  assert.equal(o.incarnation, incarnation);
  assert.equal(o.pending, receipt);
  assert.equal(o.C.isDisposed(), false);
  assert.deepEqual(o.counts, counts);
});

test("B07 old-domain new P/previous=null/epoch1/equal A→B→A labels cannot establish provenance", () => {
  const o = owner();
  const before = o.C.getSnapshot(), firstIncarnation = o.incarnation;
  o.changeDomain({ ...context, scopeKey: "domain-b" });
  o.changeDomain(context);
  assert.notEqual(o.incarnation, firstIncarnation);
  assert.throws(() => o.prepareInitial(), /provenance/);
  const p = createCriteriaPublication({ controller: o.C, definition: o.CD, retirement: { retire(event) {
    assert.equal(event.previous, null);
    assert.equal(event.next?.epoch, 1);
    // No genuine owner certificate: equal tags are insufficient.
    throw new Error("No current-domain provenance");
  } } });
  const begun = p.begin({ controller: o.C, definition: o.CD, expected: context, actual: context });
  assert.equal(p.complete(ticket(begun)).status, "blocked");
  assert.equal(o.C.getSnapshot(), before);
  assert.equal(p.getSnapshot().current, null);
});

for (const mismatch of ["scope", "access", "revoked"] as const) {
  test(`B08 certificate denies ${mismatch} without destructive fallback`, () => {
    const o = owner();
    const receipt = proposal(o.propose(commands[0] as TableCommand<S>));
    const before = o.C.getSnapshot();
    const t = ticket(o.prepareInitial(context, mismatch === "scope" ? { ...context, scopeKey: "other" } : mismatch === "access" ? { ...context, access: false } : context));
    if (mismatch === "revoked") o.changeDomain({ ...context, access: false });
    if (mismatch === "revoked") assert.throws(() => o.completeInitial(t), /ticket/);
    else assert.equal(o.completeInitial(t).status, "blocked");
    assert.equal(o.P.getSnapshot().current, null);
    assert.equal(o.C.getSnapshot(), before);
    assert.equal(o.pending, receipt);
    assert.equal(o.counts.emptyAcknowledgement, 0);
  });
}

test("B09/B11 exact receipt generation detects replaced pending intent even with unchanged accepted reference", () => {
  const o = owner();
  const first = proposal(o.propose(commands[0] as TableCommand<S>));
  const before = o.C.getSnapshot(), generation = o.receiptGeneration;
  const t = ticket(o.prepareInitial());
  const second = proposal(o.propose(commands[2] as TableCommand<S>));
  assert.notEqual(second, first);
  assert.equal(o.C.getSnapshot(), before);
  assert(o.receiptGeneration > generation);
  assert.equal(o.completeInitial(t).status, "blocked");
  assert.equal(o.pending, second);
  assert.equal(o.C.getSnapshot(), before);
  assert.throws(() => o.completeInitial(t));
  assert.equal(o.P.complete(t).status, "blocked"); // consumed proof cannot be reused
  assert.equal(o.counts.emptyAcknowledgement, 0);
});

for (const action of ["cancel", "new-begin", "revoke", "dispose"] as const) {
  test(`B09 initial proof cannot survive ${action}`, () => {
    const o = owner();
    const before = o.C.getSnapshot();
    const t = ticket(o.prepareInitial());
    if (action === "cancel") o.P.cancel(t);
    else if (action === "new-begin") o.P.begin({ controller: o.C, definition: o.CD, expected: context, actual: context });
    else if (action === "revoke") o.revokeInitial();
    else { assert.equal(o.P.dispose().status, "blocked"); }
    if (action === "revoke" || action === "dispose") assert.throws(() => o.completeInitial(t));
    else assert.notEqual(o.completeInitial(t).status, "settled");
    assert.equal(o.C.getSnapshot(), before);
    assert.equal(o.counts.emptyAcknowledgement, 0);
    assert.equal(o.P.getSnapshot().current, null);
  });
}

test("B09 reentrant publication observer invalidates candidate, no preserving callback", () => {
  const o = owner();
  const before = o.C.getSnapshot();
  const unsubscribe = o.P.subscribe({ notify() {
    o.P.begin({ controller: o.C, definition: o.CD, expected: context, actual: context });
    return undefined;
  } });
  assert.equal(o.adopt().status, "blocked");
  unsubscribe();
  assert.equal(o.P.getSnapshot().failure, "reentrant");
  assert.equal(o.counts.retire, 0);
  assert.equal(o.C.getSnapshot(), before);
});

test("B10 competing writer blocks before ports; no controller reset or reflection", () => {
  const o = owner();
  assert.equal(o.adopt().status, "settled");
  const before = o.C.getSnapshot();
  let ports = 0, getters = 0;
  const competitor = createCriteriaPublication({ controller: o.C, definition: o.CD, retirement: { retire() { ports++; return undefined; } } });
  const next = { get controller() { getters++; return o.C; }, definition: o.CD, expected: context, actual: context };
  const result = competitor.begin(next);
  assert.equal(result.status, "blocked");
  if (result.status === "blocked") assert.equal(result.reason, "owner-conflict");
  assert.equal(getters, 0); assert.equal(ports, 0);
  assert.equal(o.C.getSnapshot(), before);
  o.authority().require();
});

test("B11 onRequest throwing is rejected, not a pending-proof capture; app boundary rejects reentry", () => {
  const o = owner();
  const before = o.C.getSnapshot();
  o.faults.onRequest = () => {
    assert.throws(() => o.prepareInitial(), /Unsafe/);
    throw new Error("Synthetic callback failure");
  };
  assert.equal(o.propose(commands[0] as TableCommand<S>).status, "rejected");
  assert.equal(o.pending, null);
  delete o.faults.onRequest;
  assert.equal(o.adopt().status, "settled");
  assert.equal(o.C.getSnapshot(), before);
  assert.equal(o.counts.request, 1);
  assert.equal(o.counts.commit, 0);
});

test("B12/B21 pure counterexample: legitimate late acceptance does not change constructor server snapshot", () => {
  const o = owner({});
  const server = o.C.getServerSnapshot();
  proposal(o.propose({ type: "selection.change", update: { r1: true } }));
  assert.equal(o.acceptPending().status, "committed");
  const accepted = o.C.getSnapshot(), counts = callbackCounts(o);
  assert.equal(o.adopt().status, "settled");
  assert.equal(o.C.getSnapshot(), accepted);
  assert.equal(o.C.getServerSnapshot(), server);
  assert.equal(Object.keys(server.selection).length, 0);
  assert.deepEqual(Object.keys(accepted.selection), ["r1"]);
  assert.deepEqual(callbackCounts(o), counts);
  // This is snapshot semantics, NOT hydration execution.
});

test("B13 relative pending query survives bootstrap but normal later acceptance expires under real clock", () => {
  let now = Date.UTC(2026, 10, 24, 12);
  const o = ApplicationOwner.create({ native: nativeFor(), initial: seedFor(), context, now: () => now });
  const receipt = proposal(o.propose({ type: "builder.commit", rule: { id: "today", field: "day", operator: "date.on", value: { kind: "relative", preset: "today" } } }));
  const before = o.C.getSnapshot(), counts = callbackCounts(o);
  assert.equal(o.adopt().status, "settled");
  assert.equal(o.pending, receipt);
  assert.equal(o.C.getSnapshot(), before);
  assert.deepEqual(callbackCounts(o), counts);
  now += 86_400_000;
  assert.throws(() => o.acceptPending(), { code: "state.stale" });
  assert.equal(o.C.getSnapshot(), before);
  assert.equal(o.pending, null);
});

test("B14/B15 real retirement rejects actual old query FIRST, then controlled clear; all actors deny in ports", () => {
  const o = owner();
  assert.equal(o.adopt().status, "settled");
  const issued = o.authority(), plain = o.plainAuthority();
  const original = getCriteriaAuthorityOrigin(issued);
  assert(original); assert.equal(original.controller, o.C);
  assert(Object.isFrozen(issued));
  assert.equal(getCriteriaPublicationBinding(issued)?.publication, o.P);
  const old = proposal(o.propose({ type: "search.commit", search: "obsolete" }));
  const before = o.C.getSnapshot();
  let purge = 0, cleanup = 0;
  o.P.registerParticipant(issued, { purge() { purge++; assert.throws(() => issued.require()); assert.throws(() => plain.require()); return undefined; }, cleanup() { cleanup++; assert.throws(() => plain.require()); return undefined; } });
  o.faults.beforeRetire = () => { assert.throws(() => issued.require()); assert.throws(() => plain.require()); };
  o.faults.onRequest = () => {
    assert.equal(o.counts.reject, 1);
    assert.equal(o.counts.clearDispatch, 1);
    assert.throws(() => issued.require());
    assert.throws(() => plain.require());
    assert.throws(() => o.userPropose(issued, { type: "selection.cancel" }));
    // Busy store cannot be used to infer a pending result inside onRequest.
    assert.throws(() => o.C.accept(old), { code: "state.reentrant" });
  };
  const begun = o.beginReset({ ...context, scopeKey: "domain-b" });
  assert.throws(() => issued.require());
  assert.equal(o.completeReset(ticket(begun)).status, "settled");
  assert.equal(purge, 1); assert.equal(cleanup, 1);
  assert.equal(o.counts.reject, 1); assert.equal(o.counts.clearAccept, 1);
  assert.equal(o.C.getSnapshot().revision, before.revision + 1);
  assert.equal(o.C.getSnapshot().query, before.query); // obsolete query not accepted with an override
  assert.equal(Object.keys(o.C.getSnapshot().selection).length, 0);
  assert.equal(o.appTransient, null);
  assert.throws(() => o.C.accept(old), { code: "state.stale" });
  o.authority().require();
});

test("B14 explicit same-context reset is still real retirement, including already-empty no-op command validation", () => {
  const o = owner({});
  assert.equal(o.adopt().status, "settled");
  const old = proposal(o.propose(commands[0] as TableCommand<S>));
  const before = o.C.getSnapshot();
  const begun = o.beginReset();
  o.faults.rejectClear = true;
  assert.equal(o.completeReset(ticket(begun)).status, "blocked");
  assert.equal(o.counts.reject, 1);
  assert.throws(() => o.C.accept(old), { code: "state.stale" });
  assert.equal(o.C.getSnapshot(), before);
  delete o.faults.rejectClear;
  assert.equal(o.completeReset(ticket(begun)).status, "settled");
  assert.equal(o.counts.reject, 1);
  assert.equal(o.C.getSnapshot(), before); // genuine no-op only AFTER old receipt rejection
});

for (const fault of ["proposedOnly", "rejectClear", "callback"] as const) {
  test(`B16 ${fault} reset stays denied; explicit safe retry verifies real outcome`, () => {
    const o = owner();
    assert.equal(o.adopt().status, "settled");
    const before = o.C.getSnapshot();
    const begun = o.beginReset();
    if (fault === "callback") o.faults.onRequest = () => { throw new Error("Synthetic request refusal"); };
    else o.faults[fault] = true;
    assert.equal(o.completeReset(ticket(begun)).status, "blocked");
    assert.equal(o.C.getSnapshot(), before);
    assert.equal(o.P.getSnapshot().current, null);
    delete o.faults.proposedOnly; delete o.faults.rejectClear; delete o.faults.onRequest;
    assert.equal(o.completeReset(ticket(begun)).status, "settled");
    assert.equal(Object.keys(o.C.getSnapshot().selection).length, 0);
    assert.equal(o.C.getSnapshot().revision, before.revision + 1);
  });
}

test("B16 cleanup invoked during real busy onRequest cannot acknowledge; safe retry rejects exact receipt", () => {
  const o = owner();
  assert.equal(o.adopt().status, "settled");
  const begun = o.beginReset();
  o.faults.onRequest = () => {
    assert.equal(o.P.complete(ticket(begun)).status, "blocked");
  };
  const pending = proposal(o.propose(commands[0] as TableCommand<S>));
  assert.equal(o.pending, pending);
  assert.equal(o.counts.clearAccept, 0);
  assert.equal(o.P.getSnapshot().current, null);
  delete o.faults.onRequest;
  assert.equal(o.completeReset(ticket(begun)).status, "settled");
  assert.equal(o.counts.reject, 1);
  assert.equal(Object.keys(o.C.getSnapshot().selection).length, 0);
});

test("B16 actual publisher refuses nonvoid/Promise retirement acknowledgement, no automatic microtask settlement", async () => {
  for (const value of [false, Promise.resolve(undefined)] as const) {
    const ND = nativeFor(), C = createNativeController(ND, { initial: seedFor(), now: () => 0 });
    let calls = 0;
    const port = { retire() { calls++; return value; } };
    // Deliberately bad JS port at this negative boundary, not an authority factory.
    const P = Reflect.apply(createCriteriaPublication<S>, undefined, [{ controller: C, definition: C.getDefinition(), retirement: port }]);
    const begun = P.begin({ controller: C, definition: C.getDefinition(), expected: context, actual: context });
    assert.equal(P.complete(ticket(begun)).status, "blocked");
    await Promise.resolve();
    assert.equal(P.getSnapshot().phase, "blocked"); assert.equal(calls, 1);
    assert.deepEqual(Object.keys(C.getSnapshot().selection), ["r1"]);
  }
});

test("B17 accepted clear survives notification exception; cleanup debt stays fail-closed, explicit retry idempotent", () => {
  const o = owner();
  assert.equal(o.adopt().status, "settled");
  o.faults.onCommit = () => { throw new Error("Synthetic notification failure"); };
  const before = o.C.getSnapshot(), begun = o.beginReset();
  assert.equal(o.completeReset(ticket(begun)).status, "blocked");
  const cleared = o.C.getSnapshot();
  assert.equal(Object.keys(cleared.selection).length, 0);
  assert.equal(cleared.revision, before.revision + 1);
  assert.equal(o.pending, null); assert.equal(o.notificationDebt, true);
  assert.equal(o.counts.notificationFailures, 1);
  assert.equal(o.appTransient, null);
  assert.equal(o.P.getSnapshot().current, null);
  assert.equal(o.completeReset(ticket(begun)).status, "blocked");
  assert.equal(o.C.getSnapshot(), cleared); assert.equal(o.counts.clearAccept, 1);
  delete o.faults.onCommit;
  o.reconcileNotificationDebt();
  assert.equal(o.completeReset(ticket(begun)).status, "settled");
  assert.equal(o.C.getSnapshot(), cleared); assert.equal(o.counts.clearAccept, 1);
});

test("B17 remaining app cleanup failure retained after actual accepted clear, retries do not replay query/selection", () => {
  const o = owner(); assert.equal(o.adopt().status, "settled");
  o.faults.cleanup = () => { throw new Error("Synthetic cleanup debt"); };
  const begun = o.beginReset();
  assert.equal(o.completeReset(ticket(begun)).status, "blocked");
  const cleared = o.C.getSnapshot();
  assert.equal(Object.keys(cleared.selection).length, 0);
  assert.equal(o.appTransient, "synthetic-editor");
  delete o.faults.cleanup;
  assert.equal(o.completeReset(ticket(begun)).status, "settled");
  assert.equal(o.appTransient, null); assert.equal(o.C.getSnapshot(), cleared);
});

test("B24 owner finalizes P-before-C; disposed C-first negative cannot acknowledge cleanup", () => {
  const o = owner(); assert.equal(o.adopt().status, "settled");
  proposal(o.propose(commands[0] as TableCommand<S>));
  assert.equal(o.finalize().status, "disposed");
  assert.equal(o.counts.reject, 1); assert.equal(o.counts.clearAccept, 1);
  assert.equal(o.P.getSnapshot().phase, "disposed"); assert.equal(o.C.isDisposed(), true);
  assert.equal(Object.keys(o.C.getSnapshot().selection).length, 0);
  assert.equal(o.finalize().status, "disposed");
  const wrong = owner(); assert.equal(wrong.adopt().status, "settled");
  proposal(wrong.propose(commands[0] as TableCommand<S>));
  wrong.beginReset(); // explicitly authorize actual retirement before C-first error
  wrong.C.dispose();
  assert.equal(wrong.P.dispose().status, "blocked");
  assert.equal(wrong.P.getSnapshot().phase, "blocked");
  assert.equal(wrong.counts.rejectAttempt, 1);
  assert.equal(wrong.counts.reject, 0);
  assert.equal(wrong.counts.clearDispatch, 0);
  assert.deepEqual(Object.keys(wrong.C.getSnapshot().selection), ["r1"]);
});

test("B25 real native replacement rejects incompatible state/schema policy; valid new registration independent", () => {
  const old = owner(); assert.equal(old.adopt().status, "settled");
  const before = old.C.getSnapshot();
  const invalid = { native: nativeFor("single", schemaFor(2)), initial: seedFor(schemaFor(2), { r1: true, r2: true }), context: { ...context, definitionKey: "bootstrap-v2" }, now: () => 0 };
  assert.throws(() => prepareReplacement(old, invalid));
  assert.equal(old.C.isDisposed(), false); assert.equal(old.C.getSnapshot(), before); old.authority().require();
  assert.throws(() => prepareReplacement(old, { ...invalid, native: nativeFor("multiple", schemaFor(1, true)), initial: seedFor(schemaFor(1, true)) }), /new ID\/version/);
  const replacement = prepareReplacement(old, { ...invalid, initial: seedFor(schemaFor(2), { r9: true }) });
  assertNativeController(replacement.ND, replacement.C);
  assert.throws(() => assertNativeController(old.ND, replacement.C));
  assert.equal(old.finalize().status, "disposed");
  assert.equal(replacement.adopt().status, "settled");
  assert.deepEqual(Object.keys(replacement.C.getSnapshot().selection), ["r9"]);
  assert.notEqual(old.incarnation, replacement.incarnation);
});

test("B25 generic replace real policy is not native registration and invalid replacement keeps old alive", () => {
  const native = nativeFor(), C = createNativeController(native, { initial: seedFor(), now: () => 0 });
  const changed = nativeFor("multiple", schemaFor(1, true));
  assert.throws(() => replaceTableDefinition(C, changed.controllerDefinition, { initial: seedFor(schemaFor(1, true)), now: () => 0 }), { code: "state.definition" });
  assert.equal(C.isDisposed(), false);
  const nextND = nativeFor("multiple", schemaFor(2));
  const next = replaceTableDefinition(C, nextND.controllerDefinition, { initial: seedFor(schemaFor(2)), now: () => 0 });
  assert.equal(C.isDisposed(), true);
  assert.throws(() => assertNativeController(nextND, next));
  const plain = createTableController(nextND.controllerDefinition, { initial: seedFor(schemaFor(2)), now: () => 0 });
  assert.throws(() => assertNativeController(nextND, plain));
});

test("request/server/client owner objects are independent, equal serialized state is not authority (no hydration)", () => {
  const serverA = owner(), serverB = owner({ r2: true }), clientA = owner();
  assert.equal("window" in globalThis, false); assert.equal("document" in globalThis, false);
  for (const o of [serverA, serverB, clientA]) assert.equal(o.adopt().status, "settled");
  assert.notEqual(serverA.C, clientA.C); assert.notEqual(serverA.P, clientA.P);
  assert.notEqual(serverA.incarnation, clientA.incarnation);
  const receipt = proposal(serverA.propose(commands[0] as TableCommand<S>));
  assert.equal(clientA.pending, null); assert.equal(serverB.pending, null);
  assert.throws(() => clientA.C.accept(receipt), { code: "state.stale" });
  const authority = serverA.authority(), clientOrigin = getCriteriaAuthorityOrigin(clientA.authority());
  assert(clientOrigin); assert.throws(() => requireCriteriaAuthority(authority, clientOrigin));
  assert.deepEqual(Object.keys(serverB.C.getSnapshot().selection), ["r2"]);
  assert.equal(adoptSupplied(clientA.C).status, "unavailable");
  const serialized = JSON.parse(JSON.stringify(serverA.C.getSnapshot()));
  assert.equal(serialized.queryIdentity, clientA.C.getSnapshot().queryIdentity);
  assert.throws(() => requireCriteriaAuthority<S>(serialized, clientOrigin));
});

test("real plain authority factory requires exact C.getDefinition, not native normalized copy", () => {
  const o = owner(); assert.equal(o.adopt().status, "settled");
  const domain = o.P.getSnapshot().current;
  assert(domain);
  const wrong = createCriteriaAuthority({ origin: { controller: o.C, definition: o.ND.controllerDefinition, context, epoch: domain.epoch }, readCurrent: () => ({ ...domain, definition: o.ND.controllerDefinition }) });
  assert.throws(() => wrong.require());
  assert.equal(o.plainAuthority().require().definition, o.C.getDefinition());
});

test("B09 wrong publication ticket cannot be used for exact initial certificate", () => {
  const a = owner(), b = owner();
  const ta: CriteriaPublicationTicket<S> = ticket(a.prepareInitial());
  const tb = ticket(b.prepareInitial());
  assert.throws(() => a.completeInitial(tb));
  assert.equal(a.completeInitial(ta).status, "settled");
  assert.throws(() => a.completeInitial(ta));
  assert.equal(b.completeInitial(tb).status, "settled");
});

test("B08/B09 revocation inside the captured retirement callback consumes proof and cannot preserve", () => {
  const o = owner();
  const pending = proposal(o.propose(commands[0] as TableCommand<S>));
  const before = o.C.getSnapshot(), t = ticket(o.prepareInitial());
  o.faults.beforeRetire = () => o.changeDomain({ ...context, access: false });
  assert.equal(o.completeInitial(t).status, "blocked");
  assert.equal(o.C.getSnapshot(), before);
  assert.equal(o.pending, pending);
  assert.equal(o.counts.emptyAcknowledgement, 0);
  assert.equal(o.P.getSnapshot().current, null);
  delete o.faults.beforeRetire;
  assert.throws(() => o.prepareInitial(), /provenance/);
});

test("B09 reentry during first retirement invalidates the actual candidate, never grants a reused certificate", () => {
  const o = owner(), before = o.C.getSnapshot();
  const t = ticket(o.prepareInitial());
  o.faults.beforeRetire = () => {
    assert.throws(() => o.prepareInitial(), /Unsafe/);
    const result = o.P.begin({ controller: o.C, definition: o.CD, expected: context, actual: context });
    assert.equal(result.status, "blocked");
  };
  assert.equal(o.completeInitial(t).status, "stale");
  assert.equal(o.C.getSnapshot(), before);
  assert.equal(o.P.getSnapshot().current, null);
  assert.equal(o.counts.emptyAcknowledgement, 0);
  assert.throws(() => o.completeInitial(t));
});

test("B09 accepted-state reference/revision change after arming denies, despite legitimate current owner acceptance", () => {
  const o = owner();
  proposal(o.propose(commands[2] as TableCommand<S>));
  const before = o.C.getSnapshot(), t = ticket(o.prepareInitial());
  assert.equal(o.acceptPending().status, "committed");
  const accepted = o.C.getSnapshot();
  assert.notEqual(accepted, before);
  assert.equal(o.completeInitial(t).status, "blocked");
  assert.equal(o.C.getSnapshot(), accepted);
  assert.equal(o.P.getSnapshot().current, null);
  assert.equal(o.counts.emptyAcknowledgement, 0);
});

test("B09 cancelled or replaced candidate cannot silently re-arm initial proof", () => {
  const o = owner();
  const t = ticket(o.prepareInitial());
  o.P.cancel(t);
  assert.throws(() => o.prepareInitial(), /provenance/);
  assert.equal(o.completeInitial(t).status, "stale");
});

test("actual API own-data capture rejects context getters without running them or clearing state", () => {
  const o = owner(), before = o.C.getSnapshot();
  let getters = 0;
  const accessorContext = { ...context, get scopeKey() { getters++; return "domain-a"; } };
  assert.equal(o.prepareInitial(context, accessorContext).status, "blocked");
  assert.equal(getters, 0);
  assert.equal(o.counts.retire, 0);
  assert.equal(o.C.getSnapshot(), before);
  assert.equal(o.P.getSnapshot().current, null);
});

test("B14 actual access loss retires state but cannot issue an allowing criteria authority", () => {
  const o = owner();
  assert.equal(o.adopt().status, "settled");
  const oldAuthority = o.authority();
  const receipt = proposal(o.propose(commands[0] as TableCommand<S>));
  const begun = o.beginReset({ ...context, access: false });
  assert.throws(() => oldAuthority.require());
  assert.equal(o.completeReset(ticket(begun)).status, "settled");
  assert.equal(Object.keys(o.C.getSnapshot().selection).length, 0);
  assert.equal(o.counts.reject, 1);
  assert.throws(() => o.C.accept(receipt), { code: "state.stale" });
  assert.throws(() => o.authority().require());
});

test("B16 application cleanup nonvoid/Promise cannot acknowledge after actual clear, explicit synchronous retry only", async () => {
  for (const result of [false, Promise.resolve(undefined)] as const) {
    const o = owner();
    assert.equal(o.adopt().status, "settled");
    const begun = o.beginReset();
    // Deliberately invalid JavaScript input to the real captured application port.
    Reflect.set(o.faults, "cleanup", () => result);
    assert.equal(o.completeReset(ticket(begun)).status, "blocked");
    const cleared = o.C.getSnapshot();
    assert.equal(Object.keys(cleared.selection).length, 0);
    assert.equal(o.appTransient, "synthetic-editor");
    await Promise.resolve();
    assert.equal(o.P.getSnapshot().phase, "blocked");
    delete o.faults.cleanup;
    assert.equal(o.completeReset(ticket(begun)).status, "settled");
    assert.equal(o.C.getSnapshot(), cleared);
    assert.equal(o.appTransient, null);
  }
});

test("B16 participant cleanup debt prevents any retirement acknowledgement until explicit retry", () => {
  const o = owner();
  assert.equal(o.adopt().status, "settled");
  const authority = o.authority(), before = o.C.getSnapshot();
  let owed = true, purge = 0, cleanup = 0;
  o.P.registerParticipant(authority, {
    purge() { purge++; assert.throws(() => authority.require()); return undefined; },
    cleanup() { cleanup++; if (owed) throw new Error("Synthetic participant debt"); return undefined; },
  });
  const begun = o.beginReset();
  assert.equal(begun.status, "blocked");
  assert.equal(o.C.getSnapshot(), before);
  assert.equal(o.counts.retire, 1); // only the initial certified acknowledgement
  assert(begun.ticket);
  assert.equal(o.completeReset(begun.ticket).status, "blocked");
  assert.equal(o.counts.clearDispatch, 0);
  owed = false;
  assert.equal(o.completeReset(begun.ticket).status, "settled");
  assert.equal(purge, 1); assert.equal(cleanup, 3);
  assert.equal(Object.keys(o.C.getSnapshot().selection).length, 0);
});

test("construction-only discarded publication is inert; not a React Strict proof", () => {
  const o = owner(), before = o.C.getSnapshot();
  const discarded = createCriteriaPublication({ controller: o.C, definition: o.CD, retirement: { retire() { throw new Error("Never admitted"); } } });
  assert.equal(discarded.dispose().status, "disposed");
  assert.equal(o.counts.retire, 0); assert.equal(o.C.getSnapshot(), before);
  assert.equal(o.adopt().status, "settled");
});

test("test oracle creates real query semantics without a current accepted mirror", () => {
  const schema = schemaFor();
  const expected = createQuery(schema, { locale: "en-US", timeZone: "UTC", search: "synthetic" });
  const o = owner(); proposal(o.propose(commands[0] as TableCommand<S>));
  assert.equal(o.adopt().status, "settled"); assert.equal(o.acceptPending().status, "committed");
  assert.deepEqual(o.C.getSnapshot().query, expected);
});
