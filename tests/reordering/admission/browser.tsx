import { harness } from "./harness.js";
import {
  busyObservation,
  callbackBoundary,
  commandIdentity,
  copiedInteraction,
  foreignModel,
  positive,
  purge,
  queued,
  queryFirst,
  reentry,
  staleLease,
  uncontrolled,
  uncertainty,
} from "./probes.js";

const h = harness();
const server = harness(true, true);
const unpaged = harness(true, false, true);
const api = {
  ready: () => h.f.admission.getSnapshot().phase,
  positive: () => positive(h),
  queued: () => queued(h),
  commandIdentity: () => commandIdentity(h),
  reentry: (where: Parameters<typeof reentry>[1]) => reentry(h, where),
  purge: () => purge(h),
  uncertainty: () => uncertainty(h),
  uncontrolled,
  busyObservation: () => busyObservation(server),
  callbackBoundary: (where: Parameters<typeof callbackBoundary>[1]) =>
    callbackBoundary(h, where),
  queryFirst: () => queryFirst(h),
  copiedInteraction: (proxy: boolean) => copiedInteraction(h, proxy),
  foreignModel: () => foreignModel(h, server),
  staleLease: () => staleLease(h),
  unpagedContract: () => ({
    eligible: unpaged.model().presentation?.canReorder,
    rows: unpaged.model().view?.rows.length,
    canonicalPageSize: unpaged.f.C.getSnapshot().query.pagination.pageSize,
    admission: unpaged.f.admission.getSnapshot().phase,
  }),
};
declare global {
  interface Window {
    reorderAdmission: typeof api;
  }
}
window.reorderAdmission = api;
