# Query-safe manual row moves — selected correction contract

Authority: the user explicitly selects **Full query-safe flow** for the existing
manual scene. FR-02/04/12/13/15/16 and [shared rules](../../product/shared-rules.md)
remain unchanged. Drag/vendor/adapter work stays blocked. This is a bounded private
admission/example correction, not G-02 or stable/publication acceptance.

The initial read-only proposal is retained at
/tmp/opencode/storybook-query-safe-design-001/PLAN.md. Independent contract review
/tmp/opencode/storybook-query-safe-design-review-001/README.md rejects that first
proposal until F1–F4 are resolved. The following is main's selected revision for
review before implementation; the rejected proposal is not an implementation seal.
Independent revision review002 subsequently approves F1–F4's contract only. Main
now selects the bounded library lease below; application work waits for producer
source/API intake. This is not runtime, catalog or G-02 approval.

## Fixed witness, not a query-derived grant — F1

On the first genuine model commit, retain exact admission/D/C/controller-definition,
P, source/tool owners, mode/resource, physical mount lease and the criteria handle
already issued for participant registration, with its immutable origin. Require
that same handle/origin afresh for every retired operation event. Compare current
candidates to those fixed references/epoch/context. Query/page/application epoch
and sourceFence are not fixed identity. Never reissue criteria from a later model.

Retired settlement can read the live witness while model=null; it needs no stale
query authority. Retired reconciliation additionally needs the genuine current
model on that same lease/domain. Larger counters, equal scope labels or A/B/A do
not establish identity. Actual disconnect/advance, source-owner replacement, P
purge or C disposal permanently ends that witness. No automatic remount restores
an issued operation's grant. Keep a bounded negative ended-debt gate; old-token
APIs cannot act on a replacement. Private payloads may be purged without declaring
backend completion or erasing that gate. Application transport correlation survives
outside optional UI; disconnect cannot silently discard or resubmit it. A genuinely
new owner requires separately resolved app obligations and a new real grant.

## Atomic issuance and one effective pending gate — F2

Retain at most one issued token. Capture its witness/metadata before pure begin.
An internal coordinator notification may record a provisional candidate, never an
issued obligation. After the existing final callback-free started checks, promote
only the exact started token by private assignments before scheduling/app delivery.
Blocked/noop/failed handoff creates no issued debt. Renderer notification remains
exactly once; the app stores correlation before changed/user callbacks. Reentry or
a throwing notification cannot erase a completed handoff.

Preserve issued phase/settlement-consumed state before publish, reconcile,
invalidation or failed reads can detach pure pending. Empty core is not terminal.
Use one effectivePending predicate for aggregate moves snapshot, UI pending,
claim/touch, navigation/receipts, pre-token begin and pagination validation. Ordinary
pager stays locked; external query/filter/sort changes remain possible. Ended debt
also blocks new work; it is not represented as successful completion.

Unknown/copied/proxied tokens are rejected before alleged outcome/ack reflection.
Capture accepted payloads once under existing bounds, safe errors and live
pre/post-reflection/callback fences. Invalid/reentrant events do not consume a
settlement. Preserve exact original callback order, receiver and short-circuit.
Do not infer consumption from pure changed/empty pending: observe can detach before
pure settled=true. Carry one consumed bit across retirement. Pure Stage1 is unchanged.

## Authority versions and the distinct retired API — F3

Query departure advances only application ownerEpoch. sourceVersion is a global
monotonic count of authoritative input/explicit observations across query epochs,
never query/render/hide counts. Enforce its cross-epoch high-water. Actual data
changes advance revision/baseRevision; unchanged-input confirmation advances only
sourceVersion. Application counters never alias C/P/native revisions or clocks.

Selected new method, subject to final independent revision review:

```ts
reconcileRetired(
  operation: RowMoveOperation,
  acknowledgement: RowMoveAcknowledgement,
): RowMoveEventResult;
```

Require the exact issued retired token, live fixed witness/same physical lease,
current genuine model, acknowledgement stamp equal in EVERY field to current
readFrame([]).stamp and authoritative sourceVersion newer than issuance. Fixed
domain equality is separate from changed query/page/application epoch. Never send
a new-origin stamp through pure acknowledge. Change bookkeeping only, never rows,
query, persistence or authorization. A query-only publication cannot qualify.

Accepted awaits authority; timeout/unavailable/cancel-requested remain uncertain
with settlement consumed. Definitive rejected/conflict releases exact debt without
data/query writes. Explicit token-correlated applied/not-applied/superseded authority
releases debt, including before settlement; later outcomes are ignored. Malformed,
foreign, stale, non-newer or unavailable events retain debt. An undelivered receipt
remains unconsumed and cannot transfer to another source domain. No automatic ack
on commit, empty core, matching array or transport acceptance.

## Real display/input preflight — F4

Admit genuine blocked display without granting movement. Use fresh genuine
model.authority.read() facts rather than compiling/evaluating a second filter plan.
Match requested query/current state and actual model row identities; revalidate
source/model/input after every callbackful native read. Fresh facts.canReorder
selects the eligible manual-page path, which retains ALL original raw page/order/
record-pointer fences. All other display-only cases require the complete actual
frame input association, unique stable IDs, unchanged source input length and every
record reference. Table options.data is input association, not displayed-row proof.
Native authority still decides sorting/effective-filter eligibility at action time.

Capture app input/state/fixed witness/counters once per preflight. Fence every ID
and callback before and finally-after with original receiver/order/count; failure
stops before the next callback. Never clone/freeze record elements, promote displayed
rows to input, mirror native order or turn cached canReorder into a live grant.
Neutral All/empty search remain eligible; sorted/effectively filtered displays keep
visible disabled alternatives/reasons and ordinary table behavior.

## Application publication and producer-before-renderer staging

Record accepted queryChanged transitions once before the original callback with
its original undefined receiver/arguments/order/throw semantics. Proposals/noops/
renders do not count; A/B/A counts both departures. Admission retains debt before
the app query callback. Commit accepted-query publication only after genuine fixed
domain, current native/input proof and unchanged accepted state; failure retains
the obligation/unready state, never counter rollback or a substitute grant.

Return/stage an exact {model,lease} only after admission.commitModel succeeds.
Mount the optional row renderer only when both identities match current values.
Source/model/admission stay above visibility. No render-phase commit, boolean
readiness, caught join failure masquerading as success or copied model. Preserve a
valid same-pair pending handoff through hide/show; mismatch waits for a new commit.

Synthetic authoritative publication checks exact token/domain/baseRevision against
LATEST input under callback fences, then applies ID/anchor intent to that input.
Never restore an old array. Revision/anchor conflicts retain uncertainty. An explicit
token-correlated not-applied/superseded observation may advance sourceVersion without
changing rows. Only actual terminal bookkeeping clears app correlation. Synthetic
authority is not real persistence or backend authorization proof.

## Exclusive paths and verification

After revision review, one library writer owns only:

- packages/react/src/reordering-controller/admission.ts
- packages/react/src/reordering-controller/types.ts
- new tests/reordering/query-safe/fixtures.tsx and query-safe.spec.ts

After producer intake, one app writer owns only shared/reordering.ts, Workbench.tsx
and a new workbench reordering-query browser spec. Main owns test configs,
registration, public API/contract disposition, TASKS, evidence, maps and Git. Pure
reordering/*, renderer/native, criteria-frame, vendor, manifests/exports remain
outside these leases. Stop for review if those boundaries cannot implement this.

Use genuine React/C/P/native/admission models. Cover provisional/issued handoff,
notification reentry/throw, all effective pending gates, query A/B/A, source end/
same-label replacement, one settlement, authority-before-settlement, query-only
version rejection, hostile inputs, callback-level revocation, complete input
mismatch, neutral/effective filters, latest-input conflict, exact pre-child staging,
hide/show, narrow/RTL/keyboard disabled and pending reasons. Preserve all old tests,
failures and 53 catalog IDs. New tests are additional, not timeout/skip waivers.
Actual source/type/unit/browser/emission gates remain separately main-selected.

## Producer review001 — source recovery amendment for review

Independent implementation review001 rejects the first producer draft on R1–R3
and fixture T1. Preserve those bytes/results. Main selects the R1/R3/T1 corrections:
temporary witness-read failure is not source end; positively authenticated fixed-
owner replacement reaches the terminal branch before legacy epoch checks; fixture
publication retirement must actually complete P's transition, not certify begin.

R2 exposes a real unchanged Stage1 constraint: failed pure observation can permanently
retire its application ownerEpoch. Do not bypass that floor, privately bump counters
or claim a same-epoch model ready. The following narrow API/policy amendment requires
independent review before implementation:

- Add negative metadata `ReorderAdmissionSnapshot.readmissionRequired: boolean`.
  A transient observation cut or correlated terminal cleanup which invalidates the
  pure epoch records that application epoch as a floor. Pending debt/consumption
  remains exact; readiness and action checks deny epochs at/below the floor.
- A later genuine model clears the negative condition only with a strictly newer
  APPLICATION ownerEpoch under the same original live witness/lease and all current
  model/input fences. The library never changes the app's epoch or any C/P grant.
  Actual source/P/lease end is terminal, not this recoverable condition; ended debt
  cannot be unlocked by the new metadata or a newer counter.
- Application readmission is an explicit coherent-source publication after fresh
  fixed-domain/current-model/full-authoritative-input proof. It may follow transient
  recovery even with unchanged query. It advances only ownerEpoch, NOT sourceVersion,
  and supplies no terminal operation disposition. An already queued genuine query
  publication above the previous committed epoch can satisfy it without an extra
  counter increment. No unrelated query toggle is required for recovery.
- Preserve one pending obligation until exact refusal or token-correlated authority.
  No readmission, empty core, render or higher epoch acknowledges backend work.
  Expose unready while the floor is unsatisfied; never enable controls that pure
  begin must reject. Cover preflight-only failure AND failure inside pure.observe,
  recovery/refusal or authority, actual source readmission and a second successful
  eligible operation without changing the query. Retain end/replacement/once guards.

This is a source-publication obligation, not a new permission/grant or a Stage1
change. Main still owns API disposition and phase selection; the rejected producer
is not accepted merely by adding this proposal.
