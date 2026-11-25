# WP-10 staged reorder producer and feasibility plan

TASK-018 under the explicit WP-04–WP-15 delegated grant. Main approves **stage1
only** before code, based on the [read-only research](wp-10-research.md) and actual
reviewed WP-08 authority contract. No package install, optional adapter, renderer
change, G-02 approval, merge, deployment or publication is authorized by stage1.
Final packet stacks after reviewed WP-09; personal maintainer review is separate.

## Current provisional continuation

The user's [single final verification phase](final-verification-phase.md) supersedes
old per-stage exhaustive timing, not scope requirements. Pure Stage1 is preserved/
intakena7b8627 with source identity unchanged on provisional WP-09 head119c8d1;
the [explicit pure entry](wp-10-core-entry-plan.md) is848c94b, source discovery only.
Main now activates only the [guarded controller/admission prerequisite](wp-10-command-admission-plan.md).
Native ref/handle/pager contract is still read-only preparation; optional DnD
selection/install/adapter and G-02 remain separate. No whole-packet approval follows.
The [dependency preparation](wp-10-adapter-dependency-plan.md) records actual
versioned0.5.3 metadata and the unsafe optimistic DOM-sort default; it is not an
install/code lease or a passed collection-compatibility result.
The [closed native-ref lifetime](wp-10-native-lifetime-plan.md) is now selected as
an isolated prerequisite. It owns refs only; future adapter disposal and actual
native/handle/pager integration require separate actual handoffs and code leases.
Main separately owns the isolated [definition capability metadata](wp-10-definition-capabilities-plan.md)
addition. It creates no action grant/coordinator; both actual flags and genuine
current renderer/admission proofs are required by later integration.
The held admission handoffe9d1721 exposes the unpaged cardinality mismatch. Main
selects the bounded [explicit extent correction](wp-10-unpaged-extent-plan.md);
original pure/held seals and runtime requirements stay unchanged historical evidence.
The [deferred verification inventory](wp-10-deferred-verification.md) records actual
commands, historical/current lanes and missing runtime/consumer/input obligations.
It neither activates those checks now nor grants whole-packet approval.
After actual U1 source6326b97, main owns the separate [client entry discovery](wp-10-admission-entry-plan.md)
lease. Existing helper/pure bodies stay fixed; ordinary installed/archive/API/runtime
acceptance and the actual neutral/adapter integration remain deferred.

## Stage1 ownership and outcome

One worker owns packages/react/src/reordering/{types,capture,rows,columns,index}.ts
and tests/reordering/core/**, isolated `/tmp/opencode/tableweave-wp10` from reviewed
WP-05 3e4aaa8. Main owns exports, manifests/lock, docs/TASKS/REVIEW/Git and later
renderer/adapter integration. No existing controller/native/resource/presentation
source edits or new dependencies. Exact installed local vendors may be linked for
scoped tooling only, never committed. Independent numbered review follows tests.

Deliver dependency-free metadata-only row operation coordination and visible-leaf
column permutation, following AC-12/13/21 and the original controller partitions.
No records, optimistic native row model, accepted order/query mirror, rollback
array, transport, resource lifetime or persistence implementation is stored.

## Current authority and explicit application stamp

The actual WP-08 ControlsAuthority.require({type:reorder, ids}) checks current
manual/fresh/unfiltered/unsorted current-page targets. It lacks durable application
data revision/client generation, so a new explicit application committed-read port
is required, not a change to that reviewed authority's semantics.

ReorderStamp contains ownerEpoch, sourceVersion (nonnegative checked integers),
definitionKey, scopeKey, queryIdentity, pageIndex, pageSize and revision:string|
number|null. RowReorderFrame contains stamp, complete ordered pageIds and explicit
wire baseRevision:string|null. RowReorderPort.readCurrent(ids) reads one atomic
application committed frame, invokes that frame's real authority for every moved/
anchor ID and applies application row eligibility. Throw on unavailable/blocked/
inconsistent input. Main later supplies the adapter; stage1 tests use an explicit
synthetic authoritative port, not pretend package integration.

Owner epoch is never reused across source/authorization/definition/scope/query/page
owner transitions including A→B→A. Source version advances for authoritative data,
revision and eligibility changes within that epoch. These are UI fences, not
credentials. Numeric revision0 and string0 remain distinct; the application chooses
wire baseRevision explicitly. Current render uses native view props/projectControls,
not stable committed-handle getters as render models. Never retag retained frames.

## Row coordinator candidate protocol

createRowMoveCoordinator({instanceId, readCurrent}) provides getSnapshot, subscribe,
begin(originFrame, placement), settle(exactOperation, outcome), acknowledge(exact
Operation, authoritativeAck), reconcile(), invalidate(context|access|unmount),
dispose(). These are new candidates, not existing exports. Exact tested signatures
are handed off before consumers. App instanceId is lifetime-unique/non-secret.

Placement is movedId plus beforeId (immediate successor) and afterId (immediate
predecessor), either anchor nullable at its respective boundary. Remove movedId
from the complete page sequence first; anchors must describe one adjacent gap.
Reject missing/off-page/self/duplicate/inconsistent anchors; unchanged gap is noop.
Recheck all origin stamp fields, source/revision and complete page order against
current port before starting. One pending operation; no unsafe index shortcut.

Started operation is an opaque exact token with generation, frozen origin stamp
and RowMove wire intent: operationId, scopeKey, movedId, beforeId, afterId, pageIds,
baseRevision. Checked monotonic sequence plus instanceId yields operation ID, but
only coordinator-issued object identity authenticates settlements. The application
alone starts persistence after begin returns. No callback is silently invoked as
successful persistence. Public feedback exposes fixed codes, no private errors.

Begin returns started/operation, noop, or blocked with fixed invalid/unavailable/
origin/pending/membership/anchors/eligibility reason. Malformed configuration throws
fixed ReorderError. Event results distinguish changed from ignored. Snapshots own
only pending operation metadata and safe feedback; freeze owned containers, never
application record objects. Exact array/cardinality bounds are documented/tested.

Settlement accepted means backend acceptance, **not** authoritative data arrival:
remain awaiting-authority. Definitive rejected/conflict releases pending and shows
failure while the application's latest rows remain untouched. Transport unavailable/
timeout/cancel-requested is indeterminate, not proof the backend did nothing;
retain reconciliation pending, no automatic retry. Gesture cancellation before
begin emits no operation. Submitted cancellation cannot claim an undo.

Authoritative acknowledgement requires exact operation, current matching stamp,
newer sourceVersion and app-established terminal applied/not-applied/superseded
disposition. Matching array order alone is not proof. Acknowledgement can precede
transport settlement; late settlement is ignored. reconcile runs only at explicit
app commit/authoritative-update boundaries: same-origin data changes clear preview/
mark pending superseded, but do not pretend transport stopped. Context/access loss
detaches pending token; old outcomes cannot affect the new owner. Source versions
and epochs must not roll back or repeat. Disposed operations cannot be revived.

## Column permutation helper

moveVisibleColumn(policies, acceptedColumnState, placement) consumes original
ColumnPolicy[] from native definition.controllerDefinition.columns—not cached
header padding/groups/all-native-carrier enumeration. Validate a complete exact
policy-ID permutation. Follow existing controller validation: contiguous original
reorderGroup runs, reset/split by every utility; repeated names separated by another
run are distinct partitions. Reject hidden targets/anchors, utility movement or
crossing and cross-partition gaps. Reorder visible IDs within the partition and
merge into existing visible slots. Hidden IDs keep exact stored indices; utilities
stay fixed. Revalidate full order/partitions and return frozen own ID array.

No controller dispatch is hidden inside the pure helper. Later event adapters use
reviewed columns owner intent and actual columns.order command. Proposed/rejected
controlled order is never locally mirrored. Visibility/row-header identity remains
unchanged. Unknown policy IDs, duplicate/extended/accessor arrays and wrong utility
configuration fail safely without mutating accepted input.

## Capture, tests and review

Capture inputs/callback references once through own data descriptors; reject
accessors, malformed prototypes, sparse/extended/symbol arrays and throwing or
inconsistent proxy traps. Do not promise universal transparent-Proxy detection.
Never validate then reread values. No raw error message/stack or private data in
feedback/logs. Subscribers/observers cannot corrupt accepted operation identity or
leave coordinator guards stuck after an exception; document safe notification
behavior and exercise unsubscribe/disposal/reentrancy/async rejection handling.

Required scoped strict TS6.0.3/5.9.3 and unit/type tests cover anchors/all boundaries,
origin/source/revision/ABA, forged/foreign/late tokens, one pending, indeterminate
cancel, acknowledgement before settlement, latest-authoritative failure without
rollback, disposal and input immutability. Column vectors include mixed utilities,
repeated contiguous group names, hidden slots, complete permutation and property/
boundary mutations. No story/mock is G-02 or actual application persistence proof.

## Later stages explicitly held

Stage2 needs exact approved renderer row/header ref and designated-cell handle
bindings, preserving cached static collection identity and semantic tr/th anatomy.
Hooks cannot be called in arbitrary lookup loops. Header handle is beside sort,
never nested in its button. Every registration must disable optimistic DOM sorting
and feedback manipulation; no second RAC drag manager. Main negotiates a current
pending-operation navigation interlock with the completed pager API; do not falsify
ControlsPresentation.canNavigate or guess unfinished consumer props.

Only after separate pinned optional-peer/install approval may the adapter use
researched dnd-kit0.5.3. G-02 requires real node/MutationObserver evidence of no
reparenting/placeholders, both axes pointer/touch/keyboard/simple controls, focus,
eligibility/pending/lifecycle races, hidden groups/utilities, own TS declarations,
actual packed optional entry and absence from default/headless bundles. Missing
plugin retains accessible alternatives with diagnostics. Incompatibility changes
adapter/config/version, never product requirements. Device/manual-AT/performance/
real-consumer/legal/publication gates remain honest separate inputs.

Stage1's delivered [exact source protocol](../../tests/reordering/core/README.md)
and [worker observations](../../tests/reordering/core/EVIDENCE.md) are available
for independent review. Their synthetic source checks are not G-02/persistence
or whole-packet acceptance. TASKS remains the live status owner.
