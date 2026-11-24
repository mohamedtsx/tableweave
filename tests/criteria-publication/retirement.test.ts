import { expect, test } from "vitest";
import { createQuery } from "../../packages/react/src/contracts/query.js";
import { CriteriaAuthorityError } from "../../packages/react/src/controller/criteria.js";
import type { CriteriaPublicationTicket } from "../../packages/react/src/controller/criteria-publication.js";
import type { StateProposal } from "../../packages/react/src/controller/types.js";
import type { S } from "./helpers.js";
import { controller, fixture, origin, pending, schema } from "./helpers.js";

test("real controlled retirement rejects original receipt FIRST then accepts genuine selection reset", () => {
  let proposal: StateProposal<S> | null = null;
  const log: string[] = [];
  const owner = controller({
    controlled: ["query", "selection"],
    initial: {
      query: {
        ...createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
        search: "accepted",
      },
      selection: { row: true },
    },
    onRequest(value) {
      proposal = value;
      log.push("request");
    },
  });
  const f = fixture(owner, () => {
    if (proposal) {
      owner.reject(proposal);
      proposal = null;
      log.push("reject");
    }
    const result = owner.dispatch({ type: "selection.cancel" });
    if (result.status === "rejected") throw new Error("Owner rejected reset");
    if (result.status === "proposed") {
      const accepted = owner.accept(result.proposal);
      if (accepted.status !== "committed" && accepted.status !== "noop")
        throw new Error("Reset not accepted");
      proposal = null;
      log.push("accept-reset");
    }
    expect(owner.getSnapshot().selection).toEqual({});
  });
  const receipt = pending(f.publication.begin(f.next()));
  const original = owner.dispatch({ type: "search.commit", search: "pending" });
  expect(original.status).toBe("proposed");
  const a = f.publication.issue(origin(f.publication));
  expect(f.publication.complete(receipt).status).toBe("settled");
  expect(log).toEqual(["request", "reject", "request", "accept-reset"]);
  expect(owner.getSnapshot().query.search).toBe("accepted");
  expect(owner.getSnapshot().selection).toEqual({});
  expect(a.require().epoch).toBe(1);
  if (original.status !== "proposed")
    throw new Error("Expected actual proposal");
  expect(() => owner.accept(original.proposal)).toThrow();
});

test("actual no-op selection.cancel alone does not retire a real pending receipt", () => {
  const owner = controller({ controlled: ["query"], onRequest() {} });
  const proposal = owner.dispatch({ type: "search.commit", search: "pending" });
  expect(owner.dispatch({ type: "selection.cancel" }).status).toBe("noop");
  if (proposal.status !== "proposed") throw new Error("Expected pending");
  expect(owner.accept(proposal.proposal).status).toBe("committed");
  expect(owner.getSnapshot().query.search).toBe("pending");
  // This diagnoses the real app obligation; it does not pretend the publisher can
  // discover an application that lies by returning undefined without rejecting.
});

test("real busy controller reject blocks retirement, explicit retry succeeds after mutation returns", () => {
  let proposal: StateProposal<S> | null = null;
  let attemptDuringRequest = false;
  let receipt: CriteriaPublicationTicket<S>;
  const owner = controller({
    controlled: ["query"],
    onRequest(value) {
      proposal = value;
      if (attemptDuringRequest) {
        attemptDuringRequest = false;
        expect(f.publication.complete(receipt)).toMatchObject({
          status: "blocked",
          reason: "retirement",
        });
      }
    },
  });
  const f = fixture(owner, () => {
    if (proposal) {
      owner.reject(proposal);
      proposal = null;
    }
    const reset = owner.dispatch({ type: "selection.cancel" });
    if (reset.status === "rejected" || reset.status === "proposed")
      throw new Error("Unaccepted reset");
  });
  receipt = pending(f.publication.begin(f.next()));
  const a = f.publication.issue(origin(f.publication));
  attemptDuringRequest = true;
  const original = owner.dispatch({ type: "search.commit", search: "pending" });
  expect(original.status).toBe("proposed");
  expect(() => a.require()).toThrow(CriteriaAuthorityError);
  expect(f.publication.complete(receipt).status).toBe("settled");
  expect(owner.getSnapshot().query.search).toBe("");
  expect(a.require().epoch).toBe(1);
  if (original.status !== "proposed")
    throw new Error("Expected actual receipt");
  expect(() => owner.accept(original.proposal)).toThrow();
});

test("real rejected controlled selection reset must not acknowledge retirement", () => {
  let rejectRequest = true;
  const owner = controller({
    controlled: ["selection"],
    initial: {
      query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
      selection: { row: true },
    },
    onRequest() {
      if (rejectRequest) throw new Error("App rejects request");
    },
  });
  const f = fixture(owner, () => {
    const reset = owner.dispatch({ type: "selection.cancel" });
    if (reset.status === "rejected")
      throw new Error("No reset acknowledgement");
    if (reset.status === "proposed") owner.accept(reset.proposal);
  });
  const receipt = pending(f.publication.begin(f.next()));
  expect(f.publication.complete(receipt)).toMatchObject({
    status: "blocked",
    reason: "retirement",
  });
  expect(owner.getSnapshot().selection).toEqual({ row: true });
  rejectRequest = false;
  expect(f.publication.complete(receipt).status).toBe("settled");
  expect(owner.getSnapshot().selection).toEqual({});
});
