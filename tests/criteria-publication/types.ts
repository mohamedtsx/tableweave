import type { QuerySchema } from "../../packages/react/src/contracts/types.js";
import type { CriteriaOrigin } from "../../packages/react/src/controller/criteria.js";
import type {
  CriteriaPublication,
  CriteriaPublicationNext,
  CriteriaPublicationTicket,
} from "../../packages/react/src/controller/criteria-publication.js";
import {
  createCriteriaPublication,
  getCriteriaPublicationBinding,
} from "../../packages/react/src/controller/criteria-publication.js";
import type {
  ControllerDefinition,
  TableController,
} from "../../packages/react/src/controller/types.js";

type S = QuerySchema<{
  readonly id: "alpha";
  readonly version: 1;
  readonly fields: {
    readonly amount: { readonly type: "number"; readonly owner: "builder" };
  };
}>;
type Other = QuerySchema<{
  readonly id: "beta";
  readonly version: 1;
  readonly fields: {
    readonly name: { readonly type: "text"; readonly owner: "builder" };
  };
}>;
declare const controller: TableController<S>;
declare const definition: ControllerDefinition<S>;
declare const other: CriteriaOrigin<Other>;
declare const otherTicket: CriteriaPublicationTicket<Other>;
declare const returnsVoid: () => void;
const context = { definitionKey: "d", scopeKey: "s", access: true };
const origin: CriteriaOrigin<S> = { controller, definition, context, epoch: 1 };
const next: CriteriaPublicationNext<S> = {
  controller,
  definition,
  expected: context,
  actual: context,
};
const publication = createCriteriaPublication({
  controller,
  definition,
  retirement: {
    retire(event) {
      const id: "alpha" = event.definition.schema.id;
      void id;
    },
  },
});
const precise: CriteriaPublication<S> = publication;
const result = publication.begin(next);
if (result.status === "pending") {
  const receipt: CriteriaPublicationTicket<S> = result.ticket;
  publication.complete(receipt);
  publication.cancel(receipt);
}
const authority = publication.issue(origin);
const binding = getCriteriaPublicationBinding(authority);
const id: "alpha" = authority.require().definition.schema.id;
const lookupId: "alpha" | undefined = binding?.origin.definition.schema.id;
const release = publication.registerParticipant(authority, {
  purge(event) {
    const exact: "alpha" = event.definition.schema.id;
    void exact;
  },
  cleanup() {},
});
const unsubscribe = publication.subscribe({ notify() {} });
release();
unsubscribe();
// @ts-expect-error N01 inferred schema is precise, not unknown/string.
const wrongId: "beta" = id;
// @ts-expect-error N02 foreign origin cannot substitute schema.
publication.issue(other);
// @ts-expect-error N03 foreign controller cannot replace fixed inferred schema.
publication.begin({ ...next, controller: other.controller });
// @ts-expect-error N04 foreign definition cannot replace fixed inferred schema.
publication.begin({ ...next, definition: other.definition });
// @ts-expect-error N05 foreign receipt cannot complete.
publication.complete(otherTicket);
// @ts-expect-error N06 foreign receipt cannot cancel.
publication.cancel(otherTicket);
// @ts-expect-error N07 receipt cannot be structurally manufactured.
publication.complete({});
// @ts-expect-error N08 caller epoch forbidden.
publication.begin({ ...next, epoch: 1 });
createCriteriaPublication({
  controller,
  definition,
  // @ts-expect-error N09 async retirement cannot acknowledge.
  retirement: { retire: async () => undefined },
});
createCriteriaPublication({
  controller,
  definition,
  // @ts-expect-error N10 false retirement cannot acknowledge.
  retirement: { retire: () => false },
});
createCriteriaPublication({
  controller,
  definition,
  // @ts-expect-error N11 void-opaque retirement is not an undefined acknowledgement.
  retirement: { retire: returnsVoid },
});
// @ts-expect-error N12 async purge cannot acknowledge.
publication.registerParticipant(authority, { purge: async () => undefined });
// @ts-expect-error N13 false purge cannot acknowledge.
publication.registerParticipant(authority, { purge: () => false });
publication.registerParticipant(authority, {
  purge() {},
  // @ts-expect-error N14 async cleanup cannot acknowledge.
  cleanup: async () => undefined,
});
publication.registerParticipant(authority, {
  purge() {},
  // @ts-expect-error N15 false cleanup cannot acknowledge.
  cleanup: () => false,
});
// @ts-expect-error N16 supplied undefined optional cleanup is not absent.
publication.registerParticipant(authority, { purge() {}, cleanup: undefined });
// @ts-expect-error N17 async observer is unsupported.
publication.subscribe({ notify: async () => undefined });
// @ts-expect-error N18 false observer is unsupported.
publication.subscribe({ notify: () => false });
// @ts-expect-error N19 context access must be boolean.
publication.begin({ ...next, actual: { ...context, access: "yes" } });
// @ts-expect-error N20 foreign authority cannot register a reset sink here.
publication.registerParticipant({ require: () => other }, { purge() {} });
const read = publication.getSnapshot;
// @ts-expect-error N21 exact receiver cannot be detached.
read();
const begin = publication.begin;
// @ts-expect-error N22 exact receiver cannot be detached.
begin(next);
const snapshot = publication.getSnapshot();
if (snapshot.phase === "settled") {
  // @ts-expect-error N23 captured current metadata readonly.
  snapshot.current.epoch = 2;
}
if (snapshot.phase === "blocked" && snapshot.pending) {
  // @ts-expect-error N24 captured context metadata readonly.
  snapshot.pending.expected.scopeKey = "mutated";
}
if (binding) {
  // @ts-expect-error N25 immutable publication association.
  binding.publication = publication;
}
void precise;
void lookupId;
void wrongId;
