import { harness } from "./harness.js";
import {
  actualBody,
  foreign,
  metadataOnly,
  noOp,
  pendingABA,
  queued,
  reentry,
  releasePending,
  replaced,
  rowSlot,
  settlementCleanup,
  sourceTag,
  wrongInputs,
} from "./probes.js";
const client = harness();
const remote = harness(true);
const complete = harness(false, true);
const api = {
  ready: () => client.information().joined,
  metadataOnly: () => metadataOnly(client),
  pendingABA: () => pendingABA(client),
  rowSlot: () => rowSlot(client),
  replaced: () => replaced(client),
  releasePending: () => releasePending(client),
  wrongInputs: () => wrongInputs(client),
  sourceTag: () => sourceTag(client),
  queued: () => queued(client),
  noOp: () => noOp(client),
  reentry: () => reentry(client),
  foreign: () => foreign(client),
  body: () => actualBody(client),
  settlementCleanup: (kind: "release" | "suspend") =>
    settlementCleanup(client, kind),
  waiting() {
    remote.begin();
    remote.hide();
    remote.refresh();
    remote.recordNotice({ kind: "accepted", revision: "transport" });
    return {
      pending: remote.f.admission.getSnapshot().moves.pending !== null,
      delivered: remote.delivered(),
    };
  },
  authoritative() {
    remote.authoritative();
    remote.acknowledge();
    return {
      delivered: remote.delivered(),
      pending: remote.f.admission.getSnapshot().moves.pending === null,
      feedback: remote.f.admission.getSnapshot().moves.feedback?.code,
    };
  },
  complete() {
    const operation = complete.begin();
    complete.accepted();
    complete.authoritative();
    complete.acknowledge();
    return {
      extent: operation.origin.extent,
      pageSize: operation.origin.pageSize,
      ids: operation.move.pageIds.length,
      feedback: complete.f.admission.getSnapshot().moves.feedback?.code,
    };
  },
};
declare global {
  interface Window {
    admissionBridge: typeof api;
  }
}
window.admissionBridge = api;
