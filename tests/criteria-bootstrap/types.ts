import { createQuery } from "../../packages/react/src/contracts/query.js";
import { defineQuerySchema } from "../../packages/react/src/contracts/schema.js";
import { createCriteriaAuthority } from "../../packages/react/src/controller/criteria.js";
import { createCriteriaPublication } from "../../packages/react/src/controller/criteria-publication.js";
import type { CriteriaPublicationNext, CriteriaPublicationParticipant, CriteriaPublicationRetirementPort, CriteriaPublicationTicket } from "../../packages/react/src/controller/criteria-publication.js";
import type { StateProposal, TableCommand } from "../../packages/react/src/controller/types.js";
import { createNativeController, defineNativeTable } from "../../packages/react/src/tanstack/definition.js";
import { context, nativeFor, seedFor } from "./fixtures.js";
import type { S } from "./fixtures.js";
import { adoptSupplied, ApplicationOwner, prepareReplacement } from "./owner.js";

const o = ApplicationOwner.create({ native: nativeFor(), initial: seedFor(), context, now: () => 0 });
const C = o.C, CD = C.getDefinition(), P = o.P;
const result = o.propose({ type: "selection.change", update: { r2: true } });
if (result.status === "proposed") {
  const receipt: StateProposal<S> = result.proposal;
  C.reject(receipt);
}
const begun = o.prepareInitial();
if (begun.status === "pending") {
  const ticket: CriteriaPublicationTicket<S> = begun.ticket;
  o.completeInitial(ticket);
}
const port: CriteriaPublicationRetirementPort<S> = { retire: () => undefined };
const participant: CriteriaPublicationParticipant<S> = { purge: () => undefined, cleanup: () => undefined };
const next: CriteriaPublicationNext<S> = { controller: C, definition: CD, expected: context, actual: context };
const p = createCriteriaPublication({ controller: C, definition: CD, retirement: port });
const first = p.begin(next);
if (first.status === "pending") { p.cancel(first.ticket); }
const authority = o.authority();
o.userPropose(authority, { type: "sorting.change", update: [{ id: "title", desc: true }] });
P.registerParticipant(authority, participant);
adoptSupplied(C, o);
prepareReplacement(o, { native: nativeFor(), initial: seedFor(), context, now: () => 0 });
const schema2 = defineQuerySchema({ id: "other", version: 1, fields: { active: { type: "boolean", owner: "builder" } } });
const native2 = defineNativeTable({ schema: schema2, columns: [{ id: "active", accessorKey: "active" }], getRowId: (row: { id: string; active: boolean }) => row.id });
const C2 = createNativeController(native2, { initial: { query: createQuery(schema2, { locale: "en-US", timeZone: "UTC" }) }, now: () => 0 });
const p2 = createCriteriaPublication({ controller: C2, definition: C2.getDefinition(), retirement: { retire: () => undefined } });
const first2 = p2.begin({ controller: C2, definition: C2.getDefinition(), expected: context, actual: context });
// @ts-expect-error readonly owner C cannot be retargeted
o.C = C2;
// @ts-expect-error readonly actual definition reference
o.CD = C2.getDefinition();
// @ts-expect-error readonly publication
o.P = p2;
// @ts-expect-error readonly accepted map
C.getSnapshot().selection.r1 = false;
// @ts-expect-error readonly accepted query
C.getSnapshot().query.search = "new";
// @ts-expect-error caller cannot choose publication epoch
P.begin({ controller: C, definition: CD, expected: context, actual: context, epoch: 1 });
// @ts-expect-error genuine opaque issued ticket required
P.complete({});
// @ts-expect-error wrong schema definition
createCriteriaPublication({ controller: C, definition: C2.getDefinition(), retirement: port });
// @ts-expect-error wrong schema native owner
adoptSupplied(C2, o);
// @ts-expect-error result union is not a receipt
C.accept(result);
// @ts-expect-error no pending getter API
C.getPending();
// @ts-expect-error no public preserve flag
o.adopt(true);
// @ts-expect-error private constructor: provenance cannot be asserted by caller flag
new ApplicationOwner({ native: nativeFor(), initial: seedFor(), context, now: () => 0 });
// @ts-expect-error exact undefined retirement acknowledgement, not false
const falsePort: CriteriaPublicationRetirementPort<S> = { retire: () => false };
// @ts-expect-error async retirement cannot acknowledge synchronously
const asyncPort: CriteriaPublicationRetirementPort<S> = { retire: async () => undefined };
// @ts-expect-error void is not exact undefined acknowledgement
const voidPort: CriteriaPublicationRetirementPort<S> = { retire: (): void => {} };
// @ts-expect-error async participant cleanup cannot acknowledge
const asyncParticipant: CriteriaPublicationParticipant<S> = { purge: () => undefined, cleanup: async () => undefined };
// @ts-expect-error application cleanup requires exact sync undefined
o.faults.cleanup = async () => undefined;
// @ts-expect-error unrelated schema command field
const wrongCommand: TableCommand<S> = { type: "builder.commit", rule: { id: "x", field: "active", operator: "boolean.isTrue" } };
// @ts-expect-error readonly candidate domain
next.actual.access = false;
// @ts-expect-error readonly snapshot union
P.getSnapshot().current = null;
if (first2.status === "pending") {
  // @ts-expect-error ticket carries schema, cannot retarget to unrelated owner schema
  P.complete(first2.ticket);
}
// @ts-expect-error plain reader must return current synchronously
createCriteriaAuthority({ origin: { controller: C, definition: CD, context, epoch: 1 }, readCurrent: async () => ({ controller: C, definition: CD, expected: context, actual: context, epoch: 1 }) });
void [falsePort, asyncPort, voidPort, asyncParticipant, wrongCommand];
