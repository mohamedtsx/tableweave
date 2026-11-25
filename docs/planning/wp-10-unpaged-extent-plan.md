# WP-10 explicit reorder extent — selected provisional compatibility correction

TASK-018 / FR-02/03/16, AC-12/16/21, review19n1. Held admission is preservede9d1721;
its original README/BLOCKER/maps/11-row requirement remain immutable. Main selects
this engineering correction to reconcile already-required unpaged behavior, not a
new product restriction. No runtime reproduction or independent closure exists.

## Exclusive lease

One shared writer owns only existing react/src/reordering/{types,capture}.ts and
reordering-controller/admission.ts, plus new tests/reordering/unpaged-extent/**.
Protect all other146 sources, including pure rows/columns/index, controller helper/
types/index, core/native/table/P/resources/styled producers, all old tests/seals,
manifests/exports/config/lock/docs/Git. No intake of isolated definition/native
lifetime changes until this actual handoff. Main owns docs/preservation/intake.

Basee9d1721; canonical149 mapc49ff0b5a5ffae020fbdef637a037fcd5ccf038b5831a9a62fa81876469f6689 is
/tmp/opencode/wp10-after-held-admission-source149.json. Capture the three preimages
before changes. All historicalf0b483b7 pure/held admission seals stay exact stage
identities, not current-source expectations to rewrite automatically.

## Chosen stamp/origin contract

Add optional `extent?: "page" | "complete"` to ReorderStamp. Omission means page.
The pure stamp parser accepts only valid own data; explicit undefined/null/unknown/
getter values reject. Normalize explicit page to omission so all legacy page stamp/
frame/operation output shapes and semantics stay unchanged. Complete stays an own
`extent:"complete"` property; it requires actual stamp.pageIndex0, and preserves
the real positive pageSize/query identity/revision. No invented virtual size.

The pure frame parser retains `pageIds.length <= pageSize` for page extent only.
Complete can carry all actual IDs beyond that dormant pageSize, still under the
existing duplicate/finite IDs/count/character budgets. Do not remove a global safety
bound, accept sparse/accessor/proxy values by coercion or change row/column algorithms.
The existing pageIds name/wire move payload stays stable: it means the entire current
reorder extent, which is the displayed page when paged and unsliced full current
collection when disabled. No extra operation state/cache or persistence callback.

sameOrigin/sameStamp compare normalized extent in addition to every existing field.
Page↔complete is a real origin change, never a same-owner silent upgrade. Existing
high-water, ownerEpoch, sourceVersion, pending supersession, exact operation token
and acknowledgement constraints remain unchanged. Since ack parses the same stamp,
complete acknowledgement must explicitly match complete current provenance and
strictly newer truthful app sourceVersion; an omitted/page ack cannot settle it.
Accepted transport is still awaiting-authority; cancel-requested stays uncertain.

## Genuine helper derivation

The actual admission readFrame derives complete **only** from its authenticated
definition's normalized pagination-disabled policy and the real view's matching
unsliced policy; mismatches deny. Complete dataset source with pagination enabled
is still page extent. Client/server/server-complete mode is not alone the flag.
Keep canonical query pageIndex/pageSize untouched and include every real native
row ID, with all current source/member/app-metadata fences before/after as today.
An app extent field, row count, DOM order or allow boolean cannot mint this marker.
Empty-ID reconciliation uses the same validated extent without a fake reorder grant.

No raw controller/query/native/resource/publication changes are allocated. Do not
fix the blocker by slicing, increasing query size, relaxing acknowledged origin,
substituting numeric C/P clocks or disabling unpaged moves. The helper's original
readiness/receiver/fence/lifetime implementation is otherwise frozen for this lease.

## Authoring/checks and historical replay

Author pure genuine coordinator cases for legacy shape/default versus explicit page,
paged oversize rejection, complete11/default10 begin, nonzero complete pageIndex,
malformed extent and budget/duplicate/accessor boundaries, page↔complete same-owner
origin and old-ack rejection, matching newer complete acknowledgement, accepted/
indeterminate/ack-before-response and changed IDs/current provenance. Synthetic pure
app metadata is legitimate protocol input, not a fake criteria/frame authority.
Helper/UI allowing fixtures must use genuine D/C/P/resource/useDataTable/native
producers, retaining the original unskipped11-row requirement. Cover disabled client/
complete-server and paged complete-source distinction; never a fake allowing model.

Only own positive source TS6/noEmit, syntax/full scoped formatter/lint/static/scope
now. Runtime/unit/browser/SSR/negative/dual/emitted/ordinary/packed/G-02/independent
proof remains final. Author tests and exact deferred commands without running them.
Existing core/entry guards hardcode the old pure producer: replay them at that exact
historical commit and allocate a distinct current-source lane; do not re-sign them
to make this intentional correction green. Old admission maps/blocker/tests also
stay unchanged; new README links their held state to the selected correction.

Own handoff records actual three-source delta/hashes/light results, limits and
deferred proof. Main must independently verify review19n1 in the final phase; source
compatibility authoring does not close it or deliver the whole Stage2/adapter packet.
