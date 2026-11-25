# Held: UI-only fence revocation can clear an already-submitted backend operation

**Source-traced counterexample, not a runtime reproduction or independent review.**
The three-source candidate is not implementation-ready. All147 protected production
sources and frozen U1/readFrame/original callback/receipt/method bodies remain intact.
No assertion is weakened; the new browser cases remain unskipped and unrun.

## Exact trace

1. A genuine helper-created C/P/useDataTable model is committed; a real row begin
   returns its exact operation token. The original coordinator owns submitted pending.
2. The application calls actual `admission.settle(operation, {kind:"accepted",…})`.
   It invokes original `coordinator.settle` → `observe` → the installed `readFrame([])`.
3. During the real captured application `readCurrent()` metadata call, adversarial
   synchronous UI cleanup invokes genuine `releaseReorderUI(binding)` or suspend.
   No C/P/resource/source/application-metadata mutation occurs. UI cleanup must revoke
   joins/row origins and queued command receipts synchronously, so the bridge advances
   the existing private interaction fence; it does not itself invalidate coordinator.
4. Original `readMetadata`'s finally `checkAt(expected, lease)` now fails solely due
   to that UI fence. The original readFrame adapter's catch calls `failObservation`.
5. Frozen `failObservation = purge` retires ownerEpoch/model and calls
   `coordinator.invalidate("context")`, clearing the already-submitted operation.
   Frozen settle also purges when model is absent. A transport accepted notice has
   therefore been mistaken for source loss, despite unchanged genuine source caps.

Locations in the immutable source150 preimage of `reordering-controller/admission.ts`:
`readMetadata`/`checkAt` (252–299), `readFrame` and adapter catch (346–440),
`purge`/`failObservation` (510–526), `run` (564–578), `settle` (951–960).
The unchanged pure coordinator path is `reordering/rows.ts:145–170,281–317,367–370`.
The exact helper preimage is retained in this fixture directory's `preimages/`.

`probes.ts:settlementCleanup` authors that call chain using genuine app/model/renderer
producers. `browser.spec.ts` requires the same operation to remain pending, alongside
unchanged C/app metadata and still-valid `requireDataTableModel`. Both release and
suspend cases are explicit, not allowing fake-frame or app-boolean fixtures.

## Why no local workaround was applied

- Delaying/refusing UI revocation during source reads breaks the synchronous cleanup/
  old-handler/queued-proposal contract and permits stale callbacks before publication.
- Keeping the shared fence unchanged leaves original queued guarded proposals valid;
  nav preflight alone cannot enforce direct ordinary C.accept.
- Suppressing every observation error, retagging receipts, fabricating a current
  frame, regranting an old app epoch or inventing backend rejection/acknowledgement
  would weaken existing source/operation semantics.

The application port is required to be pure; defensive reentry nevertheless belongs
to the explicitly requested safety matrix. Treating violation as denial must not
silently turn UI teardown into a successful source/backend retirement.

## Smallest newly allocated seam needed from main

Select separate **source/operation-observation generation** and **UI/interaction
generation**, with an internal closed distinction between UI-only revocation and
genuine source/authority loss. UI cleanup must synchronously fence joins/navigation/
row handles and original command receipts, but valid settlement/ack observation must
not purge existing backend pending solely for that UI generation change.

That requires revising protected original receipt issuance/final-validation and
failure classification (including metadata-read finally checks), plus row-begin's
final UI-generation check so no fresh token is exposed after a reentrant UI detach.
The original first core-captured command receipt is never retagged. Genuine P/access/
source loss still follows the real purge path. This can likely remain within the
same helper module/types lease, but **is beyond the authorized fixed bridge hooks
and frozen original bodies**; no excluded producer edit was made or implied.

No pure/controller/native/frame change, second coordinator, accepted state/order
mirror or offline continuation is selected. Main must allocate the precise original
helper seam before activation. The historical maps/failures stay preserved; all
runtime/negative/SSR/packed/G-02/independent evidence remains final-phase work.
