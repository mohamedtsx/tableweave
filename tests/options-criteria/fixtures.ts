import assert from "node:assert/strict";
import { createQuery } from "../../packages/react/src/contracts/query.js";
import { defineQuerySchema } from "../../packages/react/src/contracts/schema.js";
import type {
  CriteriaPublicationEvent,
  CriteriaPublicationTicket,
} from "../../packages/react/src/controller/criteria-publication.js";
import { createCriteriaPublication } from "../../packages/react/src/controller/criteria-publication.js";
import { createTableController } from "../../packages/react/src/controller/store.js";
import type { ResourceContext } from "../../packages/react/src/resource/types.js";

export const schema = defineQuerySchema({
  id: "option-criteria",
  version: 1,
  fields: {
    choice: { type: "enum", owner: "builder", idType: "string" },
    other: { type: "enum", owner: "builder", idType: "string" },
    search: { type: "text", owner: "search" },
  },
});
export type S = typeof schema;
export const context = Object.freeze({
  definitionKey: "option-v1",
  scopeKey: "scope-a",
  access: true,
});
export const optionContext = Object.freeze({ ...context, fieldId: "choice" });

/** Application-owned plain-controller fixture, not a permitting publisher mock.
 * The fixture owns every controller command (uncontrolled, so no pending receipt),
 * a fresh domain incarnation and all source lifetimes created after adoption.
 */
export function owner() {
  const controller = createTableController(
    { schema, selection: true },
    {
      initial: {
        query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
      },
      now: () => 0,
    },
  );
  const definition = controller.getDefinition();
  let incarnation: object = {};
  let actual: ResourceContext = context;
  const constructed = controller.getSnapshot();
  let certificate: {
    ticket: CriteriaPublicationTicket<S>;
    candidate: object;
    incarnation: object;
  } | null = null;
  let retirements = 0;
  const publication = createCriteriaPublication({
    controller,
    definition,
    retirement: {
      retire(event: CriteriaPublicationEvent<S>): undefined {
        retirements++;
        if (certificate) {
          assert.equal(event.previous, null);
          assert.equal(event.next, certificate.candidate);
          assert.equal(
            publication.getSnapshot().pending,
            certificate.candidate,
          );
          assert.equal(certificate.incarnation, incarnation);
          assert.equal(controller.getSnapshot(), constructed);
          assert.equal(controller.getDefinition(), definition);
          assert.equal(controller.isDisposed(), false);
          assert.equal(Object.keys(constructed.selection).length, 0);
          certificate = null; // one-use certified empty predecessor obligations
          return undefined;
        }
        const result = controller.dispatch({ type: "selection.cancel" });
        assert.ok(result.status === "noop" || result.status === "committed");
        assert.equal(Object.keys(controller.getSnapshot().selection).length, 0);
        return undefined;
      },
    },
  });
  const initial = publication.begin({
    controller,
    definition,
    expected: actual,
    actual,
  });
  assert.equal(initial.status, "pending");
  if (initial.status !== "pending" || !initial.snapshot.pending)
    throw new Error("Fixture admission failed");
  certificate = {
    ticket: initial.ticket,
    candidate: initial.snapshot.pending,
    incarnation,
  };
  assert.equal(publication.complete(certificate.ticket).status, "settled");
  const issue = () => {
    const current = publication.getSnapshot().current;
    if (!current) throw new Error("Fixture domain is not settled");
    return publication.issue({
      controller,
      definition,
      context: current.expected,
      epoch: current.epoch,
    });
  };
  return {
    controller,
    definition,
    publication,
    issue,
    get retirements() {
      return retirements;
    },
    begin(next: ResourceContext = actual) {
      actual = next;
      incarnation = {}; // equal public tags do not retain an incarnation
      return publication.begin({
        controller,
        definition,
        expected: actual,
        actual,
      });
    },
    complete(ticket: CriteriaPublicationTicket<S>) {
      return publication.complete(ticket);
    },
  };
}

export function request(term = "synthetic") {
  return { ...optionContext, term, pageKey: "first" };
}
