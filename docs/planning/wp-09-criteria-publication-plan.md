# WP-09 criteria publication prerequisite

TASK-017 / FR-06/09/10/15/16, partial AC-16/25. Main approves this bounded pure
metadata producer before code under the delegated delivery grant. Existing plain
criteria source80da37… stays unchanged. No tool adoption, actual buffer/React/SSR/
native adapter, facade or complete AC acceptance is inferred.

## Exclusive source lease and chosen refinement

One worker owns only new packages/react/src/controller/criteria-publication.ts and
new tests/criteria-publication/**. All existing sources/tests/root exports/configs/
manifests/lock, details, pure pagination/execution work, docs/ledger/Git remain
read-only/main-owned. No install/shared build/browser/server/extra agents/vendor
or .repo changes. Private emissions/caches/probes stay in own allocated artifacts.

Main rejects constructor-time singleton admission. The selected reviewed design
has inert per-publication construction and **first-valid-begin writer admission**.
The refined design artifact SPEC-V2 has SHA
e4df97ca637a60883b6ca215579aad90e9bbc4b3b64bcf44564753f04f5d046b;
its PLAN-V2 has SHA48c2b1df16135aa35000d27e9cb918159c254fd828afecb0b743af06ca52e750.
These are design-provenance fingerprints, not executed tests or runtime dependencies.
The contract below governs the bounded implementation; actual accepted source/own
handoff must retain the complete measured interfaces and semantic counterexamples.

## Required proposed surface

All new types retain generic QuerySchema and actual TableController/ControllerDefinition
refs, NoInfer where binding to an existing owner. Export only from this new module:

- createCriteriaPublication(options), getCriteriaPublicationBinding(authority),
  CriteriaPublicationError(code criteria.publication.invalid; fixed message
  Invalid criteria publication operation.; no payload/cause).
- Options: own-data controller, definition, retirement:{retire(event):undefined}.
- Next: controller, definition, expected, actual, with real CriteriaCurrent context
  shapes and **no caller epoch**. Publication mints dedicated positive safe integers.
- Publication methods with exact receiver validation: getSnapshot, issue(origin),
  begin(next), complete(ticket), cancel(ticket), dispose, registerParticipant(authority,
  {purge(event):undefined,cleanup?(event):undefined}), subscribe({notify():undefined}).
  Registration/subscription return exact-record idempotent unsubscribe closures.
- Immutable opaque branded ticket and snapshot-version identities. Snapshot phases
  unready/blocked/settled/disposed; current only in settled, pending only in blocked,
  safe failure reason or null. Stable snapshot ref until actual metadata changes.
- Event: kind transition/release/dispose, fixed controller/definition, previous and
  next captured CriteriaCurrent or null. Results contain final snapshot plus bounded
  notificationFailures count, never exception payloads. begin yields pending ticket
  or blocked reason/ticket|null; complete settled/blocked/stale; cancel cancelled/stale;
  dispose disposed/blocked. Reasons: owner-conflict, invalid-input, purge, cleanup,
  retirement, reentrant, cancelled, epoch-exhausted, closing. Unknown/foreign receipts
  are fixed API errors; known obsolete receipts are stale.
- Binding lookup returns only an immutable exact {publication,origin} for an actually
  issued plain factory authority, or null. It performs no method/property traversal.

## Identity, capture and writer admission

1. Constructor captures opaque fixed refs/retire receiver+function and weak-registers
   only its new publication. No per-controller lookup/claim, controller/app calls,
   subscription/reset/resource work. Duplicate/speculative construction is harmless.
2. A private writer WeakMap admits one publication per controller per module instance.
   Unclaimed first begin checks an existing foreign claim before payload reflection:
   return local owner-conflict, no callbacks/epochs/tickets, real writer unchanged.
   Capture valid next once, then recheck claim/attempt after every trap. Only a final
   callback-free absent-entry check establishes writer + epoch1 + candidate/ticket.
   Invalid/reentrant pre-admission work takes no claim. Pending is never permission.
3. Fixed owner refs cannot change via begin. Capture only consumed own data from
   Object.prototype/null-prototype envelopes; no getter/inherited consumed fields.
   Context primitives validate nonempty keys/boolean access. Cache capture by exact
   object/property so aliased expected/actual is not reread. Ignore unrelated fields
   without enumeration; reject any supplied epoch by descriptor presence. Freeze
   only new envelopes, not host refs/ports/functions. Recheck after reflection.
4. Once admitted, begin denies current/invalidates old receipts **before** reflection
   or callbacks and burns a new dedicated epoch even for malformed reset input.
   Same-context begin is a real reset; page/sort/request/props allocation never calls
   it implicitly. Retain claim across cancellation, first-completion failure, reentry
   and closing debt. No takeover/automatic retry/timeouts or controller wrapper.
5. Internally minted epoch cannot wrap MAX_SAFE_INTEGER. Exhaustion denies while
   retaining claim; explicit dispose may finish cleanup. Do not add a public/private
   initialEpoch setter just for tests. Reduced-bound models are labeled as models.

## Deny-first cleanup, retirement and reentrancy

- Required participant purge clears exact library-owned local cells and invokes no
  app callbacks. Optional cleanup may perform captured explicit source/abort lifecycle
  work. Deactivate old records and retain exact event/acknowledgement debt. Finish
  purges before source cleanup, and all owed cleanup before app retirement.
- begin purges before new input reflection; transition purge next=null, later cleanup/
  retirement next=captured candidate. Previous is last settled metadata. Owed retries
  keep original events; acknowledged phases are not rearmed or called again.
- complete(ticket) grants only after owed cleanup and required app retire return
  exactly undefined synchronously, with still-current owner/ticket/candidate checks
  after every call. App retire must reject actual pending proposals first, then truly
  clear accepted selection/app state; a no-op selection.cancel alone is insufficient.
  Busy/rejected work must not acknowledge. Publisher never invokes controller methods.
- Throws/nonvoid/Promise/thenable cleanup/retirement results deny without probing then/
  constructor/species or exposing errors. Unsupported async work remains caller-owned;
  no universal rejection-containment claim. Retry is explicit/idempotent and only
  for owed phases/current tickets. No observer may acknowledge cleanup.
- Same-publication lifecycle reentry denies/interrupts and stops stale callback
  continuation, never recursively publishes/grants or runs cleanup. cancel invalidates
  pending, dispose latches closing; explicit outer retry required. Foreign unclaimed
  publication conflict must not mark the real current writer reentrant. Distinct
  controller lifetimes remain independent; no module-global busy guard.
- cancel never restores old grant, rejects/accepts proposals or cancels row selection.
  Claimed dispose denies first, performs owed cleanup/retirement and retains claim on
  failure. Full success compare/deletes only its exact writer **before** terminal
  observer notification. Never-admitted dispose is inert terminalization: no app/
  observer callbacks, writer lookup/deletion or foreign state effect. Old repeated
  dispose/unsubscribe cannot erase a replacement writer.

## Genuine authorities, participants and observers

- issue requires admitted exact writer/current settled or pending candidate before
  origin reflection, then captures/rechecks and invokes actual createCriteriaAuthority.
  Its pure internal reader returns only settled current captured metadata outside
  protected processing; otherwise throws existing CriteriaAuthorityError. Plain
  require keeps its actual isDisposed/getDefinition checks. No forged require wrapper.
- getDefinition origin is the actual controller reference, not the native normalized
  copy. Exact publication/candidate/authority binding is additional provenance: across
  disposed P1/new P2 epoch1, old readers deny forever, tickets remain foreign and
  bindings never relink. Plain require with equal-valued P1 origin may accept P2;
  future P1-owned receivers must compare their own expected publication ref first.
- Participant registration only on its bound current allowing settled candidate,
  before private port reflection; capture/recheck, no calls/subscriptions on admission.
  Same-port active duplicates reject. Successful old-domain cleanup retires/drops old
  callbacks; stale unsubscribe cannot target a reused/new registration. Ordinary
  release deactivates first and purges/cleans exact cells, without epoch/selection
  reset. Failure retains inactive debt and denial; void unsubscribe leaks no raw error.
- subscribe is inert explicit own-method capture, no initial notify or acquisition.
  Pre-admission failures/never-admitted disposal deliver none. After admitted operations
  notify only the original active cohort, once each, with no passed grant. Reentrant
  mutation stops stale delivery; remaining unvisited members may see latest blocked
  metadata. New members wait; no recursive drain. Observer failure is count-only and
  cannot veto/authorize settlement. Authority reads deny during protected callbacks.

## Required proof and limits

Use actual new producer + unchanged plain factory, real controllers for app retirement
actors. Source fixtures must cover duplicate/discarded construction, poison/conflict
preflight with zero reads/calls, competing descriptor traps, same-P capture interruption,
admission/complete failure/cancel/dispose/claim retention, exact post-disposal replacement
and stale releases, cross-publication equal origins/bindings, same-context/ABA resets,
partial phase retry debt, raw unsupported callback results, bounded observer mutation,
two independent controllers and actual reject-before-selection reset. No structural
authority/mock controller can substitute for those positive real-factory controls.

Run strict TS6/5.9 source/own-emitted positives and meaningful negatives for schema,
tickets, receivers, caller epoch and async/false ports. Private runtime graph is new
module + unchanged plain criteria only; no React/controller/store/native/resource/
filter/network/storage runtime. Measure declaration graph/bare Node import, full
scoped Biome and protected-input hashes. Own README records complete actual API,
commands/results/failure history and partial limits. No existing source/root export/
discovery changes. Stop for interface drift; do not silently add reset/read side effects.

Later tool cells/source late-token cleanup, committed callback/readiness lease,
publication-aware paired controls frame, details mapping, SSR/hydration and actual
consumer proof require separate contracts/allocations. No reader-side cleanup,
accepted query/selection mirror, hidden subscription, automatic fetch/storage/clock,
DOM/focus/inert mutation or complete AC-16/25 promise is part of this prerequisite.

## Source handoff

[Actual module API/commands](../../tests/criteria-publication/README.md) and
[measured evidence](../../tests/criteria-publication/EVIDENCE.md) record the new
producer at aggregatee06bb4212d9327dea7105f8e25005630ccb141cf8833c850ddd39218d0e625f3.
Worker checks report88 units, strict TS6/5.9/100 intended negative checks, two runtime
modules/five declarations, scoped Biome and72 original protected inputs unchanged.
Separate independent review is required; these are not new integrated tool/React/
SSR/private-buffer or whole-packet acceptance results.

Independent review subsequently passes110 fresh+88 rerun cases/1296 finite traces,
strict TS6/5.9/136 meaningful negatives and the measured two-runtime/five-declaration
graph. Original72/extended130 and historical279/289 seals verify unchanged. Main
grants bounded source approval at e06bb4212d9327dea7105f8e25005630ccb141cf8833c850ddd39218d0e625f3,
not actual buffer/React/SSR/paired-frame/complete-server/native/facade acceptance.

The later [initial-domain adoption contract](wp-09-bootstrap-readiness.md) clarifies
the application's first acknowledgement: certified current-domain state is not
obsolete state to clear on mount. Real old-domain resets/disposal retain the full
retirement recipe above. Approved producer API/source stays unchanged; a future
combined-source adapter fixture must prove the distinction before adoption.
