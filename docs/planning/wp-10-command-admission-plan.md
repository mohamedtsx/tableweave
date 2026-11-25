# WP-10 guarded controller/admission — provisional Stage2 prerequisite

TASK-018 / FR-02/03/06/15, AC-12/13/16/21/25. Main reads the external command-admission
report and actual store.ts dispatch/accept/validate/request/commit and table factory.
The exact core-captured command reaches final validation; onQueryChange precedes
onCommit. Core/factory bodies need no change for the selected composition.

## Exclusive source lease

One shared writer owns only new react/src/reordering-controller/{types,controller,
admission,index}.ts and new tests/reordering/admission/**. All145 existing sources,
pure Stage1 bodies/entry, core controller/native/table/model/publication/resources,
styled tools/refs/pager/shell, exports/manifests/lock/old tests/docs/Git freeze. Main
owns future client entry/export/API intake. No DnD dependency/install/build/runtime
suite. Other read-only ref/handle/pager design is not an implementation dependency.

## Selected factory and committed input

Proposed createReorderController(D,options) explicitly calls actual D.createController
once and returns that same C plus a registry-issued admission handle. Authenticate
real D before alleged option callbacks; capture consumed own data/receivers once.
Private exact-C/command/proposal registries prove this producer path. No proxy/C
wrapper/accept method, public retrofit setter, app allowing flag or global claim.
Constructor/initial validateState does not read source metadata or claim C/P/UI.

Main refines the report's app port to avoid a hook-model publication cycle: options'
own synchronous readCurrent returns only explicit app ownerEpoch/sourceVersion/
revision/baseRevision metadata, not a render-ref model. The admission's real mount
lease commits a genuine DataTableModel separately at the actual commit boundary.
Derive page IDs/query/page/native facts from that exact current model; retain only
its genuine references/caps and primitive metadata, never clone records/accepted
query/order. Optional isRowMovable callback is separately captured/fenced; it cannot
replace actual ControlsAuthority.require({type:reorder,ids}) for all moved/anchor IDs.
Empty-ID settlement observation uses real owner/source/model proof, never an empty
reorder grant or a fabricated frame. App integer counters are not P/C clocks.

Returned handle exposes precise typed snapshot/subscription, mount/commit/disconnect,
gesture/origin capture + begin, settle/acknowledge/reconcile/advance and proposal
preflight as needed; choose/document actual names/signatures in the source handoff.
Use the unchanged real Stage1 coordinator internally, not another operation state
machine or raw unguarded begin bypass. Gesture handles contain metadata-only proof;
private page-ID capture lives in finite owned storage, cleared on real retirement.
Do not keep plaintext records/query strings/ID backups in saved handler closures.

## Command/proposal admission

Install private validateCommand/validateState/onRequest/onQueryChange/onCommit
composition through the real factory. Preserve original bare callback receiver and
return/error/nonvoid/async behavior; never hide a user's returned Promise as void.
Pure user validators stay pure; private identity/fence bookkeeping emits no commands,
transport, P transitions or accepted-state mutations.

Associate exact core-captured command on first validation; later acceptance rechecks
its original receipt instead of issuing a current one. Associate the exact genuine
proposal before the original onRequest. Private final command/state checks enforce
receipt even if the app bypasses preflight and calls ordinary C.accept directly.
Check before/after user validator/updater/clock/request effects at the real available
seams. Failed stale receipt can never retag to B; core identity/baseRevision checks
remain authoritative. Excluded cleanup commands replace the current receipt context
explicitly, never inherit preceding navigation admission.

Only pagination.change/clamp conflicts with row begin/pending. Fresh external query/
sort/columns changes remain possible but advance interaction/config fences and close
stale model admission before user query/commit observers. Selection Cancel, reject/
dispose and allowed bare cleanup stay live. Pending-null after resolution cannot
revive an older queued proposal. No fake ControlsPresentation/Authority wrapper.

Advance checked monotonic interaction fences before begin, origin/config/lease changes
and operation identity transitions. Begin latch denies reentrant navigation while
actual read/eligibility runs. Distinguish the coordinator's own null→submitted
notification from an external invalidation: do not reject every valid started token
because its own pending publication advanced the fence, nor credit unrelated listener
changes as that self-event. Recheck after listeners before exposing submission.

## Lifetime/source purity

No subscription/exclusive claim during render/construction. Actual model commit
pins real D/C/CD/P/source owner/frame/domain. Register only real publication-issued
participation at that safe boundary if required; purge clears authoritative owned
metadata/interactions/work without app callbacks/transport/C commands. Only library
internal coordinator subscription exists; suppress app notifications during purge.
Cleanup/disconnect is exact-lease, with no stale release of B or silent old-epoch
regrant. App owns backend reconciliation; invalidation/cancellation never undoes a
submitted effect or fabricates authoritative acknowledgement.

Keep pure ./reordering's five-body graph unchanged. The new helper belongs to a
separate explicit client entry after actual handoff, not the pure/default root.
No React UI/drag library enters contracts/criteria/pure metadata. Registry identity,
selected IDs and query facts never authorize backend actors or prove dishonest app
revision tags. Unexpected excluded producer needs stop with an exact source trace.

## Provisional proof/handoff

Author genuine D-created C/P/resources/models and direct dispatch/C.accept tests:
pre/during/post-lock proposals, self pending versus listener reset, callback returns/
receivers/reentry, post-updater/state/request source change, query-first notification,
controlled/uncontrolled columns, no-op/clamp/disabled paging, cleanup liveness,
forged/raw/unregistered C/handle, empty observation, source ABA/new P/equal strings,
lease/Strict/Suspense inertness and uncertainty/ack races. No permitting fake models.
Only light positive TS6/syntax/full scoped formatting/static scope now; all runtime/
React/SSR/negative/dual/emitted/packed/G-02/independent checks stay final. Preserve
failed logs/preimages; do not re-sign historical seals. Own README records actual
API/limits/fences/receiver semantics/hash/light results/deferred commands.

Active base848c94b; canonical145 source map31da43d6873e3c73604244cc72142f2e62081727bf3df7e3c5d1ebf93feb0ebe is
/tmp/opencode/wp10-before-core-entry-source145.json. Source bytes are unchanged by
the additive manifest entry. Protect all145 sources and old tests/config/seals.

## Held provisional implementation

[Actual admission handoff](../../tests/reordering/admission/README.md) authors four
new modules but is **held, not Stage2 activation-ready**. Main reads actual factory/
capture/commit/command interfaces, matches29 own inputs/all145 original source hashes
and passes one own positive source TS6 program. Four-source aggregatedb7eee30… and
29-input aggregate5185a970… remain exact original stage identities. New149-source map:
c49ff0b5a5ffae020fbdef637a037fcd5ccf038b5831a9a62fa81876469f6689.

The [source-traced blocker](../../tests/reordering/admission/BLOCKER.md) identifies
genuine unpaged rows beyond canonical pageSize conflicting with pure Stage1's bound.
No protected workaround or runtime reproduction occurred. Main preserves this held
producer before allocating the separate explicit extent compatibility correction;
its authored11-row unpaged requirement remains unskipped/unverified. Native/handle/
pager consumers cannot activate until that selected correction actually hands off.
