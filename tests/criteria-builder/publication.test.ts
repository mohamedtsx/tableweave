import { expect, it } from "vitest";
import { createCriteriaFrames, createCriteriaPublication } from "@tableweave/react";
import type { CriteriaPublication } from "@tableweave/react";
import { requireCriteriaTool } from "@tableweave/react";
import { editorActions } from "../../packages/heroui/src/filters/criteria-builder-host.js";
import { fixture, required } from "./fixtures.js";

it("a genuine P2 over the exact same C/CD/context/epoch cannot relink P1's committed Builder or callbacks", () => {
  const f = fixture(), stop = f.store.mount(), a = f.commit(), saved = f.open("n1");
  const origin = requireCriteriaTool(f.target.authority, f.target.owner);
  const accepted = f.app.C.getSnapshot(), incarnation = f.app.incarnation;
  const p1Current = required(f.app.P.getSnapshot().current);
  // The actual application's fresh, one-use initial certificate is tied to its
  // already-established accepted C lineage. No caller-created authority or
  // readCurrent/onAllow stub, public clear, or unconditional retirement grant.
  let available = true;
  const p2: CriteriaPublication<typeof f.schema> = createCriteriaPublication({ controller: f.app.C, definition: f.app.CD, retirement: {
    retire(event) {
      if (!available || event.kind !== "transition" || event.previous !== null || event.controller !== f.app.C || event.definition !== f.app.CD || event.next !== p2.getSnapshot().pending || !event.next || event.next.expected.scopeKey !== f.context.scopeKey || event.next.actual.scopeKey !== f.context.scopeKey || !event.next.expected.access || !event.next.actual.access || f.app.C.isDisposed() || f.app.C.getSnapshot() !== accepted || f.app.incarnation !== incarnation || f.pending !== null || f.app.pending !== null || f.app.P.getSnapshot().current !== p1Current) throw new Error("Initial P2 certificate unavailable");
      available = false;
      return undefined;
    },
  } });
  const begun = p2.begin({ controller: f.app.C, definition: f.app.CD, expected: f.context, actual: f.context });
  if (begun.status !== "pending" || !begun.snapshot.pending) throw new Error("Actual P2 ticket missing");
  const authority = p2.issue({ ...origin, epoch: begun.snapshot.pending.epoch });
  const frames = createCriteriaFrames({ nativeDefinition: f.native, controller: f.app.C, publication: p2, criteria: authority });
  expect(p2.complete(begun.ticket).status).toBe("settled");
  const frame = frames.commit(frames.prepare({ criteria: authority, expected: f.context, source: { mode: "client", context: f.context, records: f.records }, nativeInput: { mode: "client", records: f.records } }));
  const pair = frames.issue(frame), target = { owner: pair.owner, authority: pair.tool };
  const nextOrigin = requireCriteriaTool(target.authority, target.owner);
  expect(nextOrigin.controller).toBe(origin.controller);
  expect(nextOrigin.definition).toBe(origin.definition);
  expect(nextOrigin.epoch).toBe(origin.epoch);
  expect(target.owner.publication).not.toBe(f.target.owner.publication);
  let privateReads = 0;
  f.store.commit(new Proxy(f.props({ criteria: target }), { getOwnPropertyDescriptor(input, key) { if (key !== "criteria") privateReads++; return Reflect.getOwnPropertyDescriptor(input, key); } }));
  expect(privateReads).toBe(0);
  expect(f.store.read()).toBeNull();
  expect(() => f.store.require(a)).toThrow();
  expect(() => editorActions.number(saved, 0, "999")).toThrow();
  expect(f.app.C.getSnapshot()).toBe(accepted);
  stop();
});
