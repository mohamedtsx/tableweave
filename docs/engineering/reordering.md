# Reordering and column presentation

Source: HLD §10; ADR-08. Implements FR-02/FR-03/FR-06. G-02 must prove the
sortable adapter before freezing it. Persistence always stays application-owned.

## Optional sortable boundary

Explicit `@tableweave/heroui/sortable` plugin entry; no sortable import in default
renderer. Definition separately enables row/column capabilities. Missing plugin
with enabled drag produces a development diagnostic and accessible move controls
where available, never a silently dead handle.

Use one coordination layer per surface, new dnd-kit React generation, not mixed
legacy APIs or a competing React Aria drag manager. New dnd-kit's researched
optimistic DOM reordering must **not** reparent cached collection nodes behind
React. Use controlled transforms/previews; if unsupported, revise isolated
adapter/version, not PRD identity/accessibility. Pointer/touch/keyboard and simple
non-drag move buttons/menus share eligibility and boundaries.

## Row move contract

The actual bounded Stage1 protocol supersedes the HLD's illustrative `ok` outcome.
`RowMove` has operationId/scopeKey/movedId/beforeId/afterId/pageIds/baseRevision;
the complete current-page IDs and explicit string-or-null wire revision are captured
from one atomic application port. The operation itself is a factory-issued token,
not authenticated by a copied operationId or array resemblance.

| Actual event | Meaning |
| --- | --- |
| begin started | One issued operation; application may submit its ID intent |
| accepted settlement | Backend acceptance metadata; remain awaiting-authority |
| rejected/conflict settlement | Definitive refusal; release pending, never roll back rows |
| indeterminate unavailable/timeout/cancel-requested | Effect uncertain; keep reconciliation pending, no automatic retry/undo |
| authoritative acknowledgement | Exact token/current matching stamp/strictly newer sourceVersion plus app-established applied/not-applied/superseded disposition |

Acknowledgement may precede transport settlement; old/foreign completions cannot
settle a replacement operation. The coordinator holds only operation metadata and
safe feedback, no records/accepted query/order/rollback array. `changed` describes
bookkeeping, not successful persistence. Explicit application ownerEpoch and
sourceVersion integers are not aliases for criteria epoch, C revision or opaque P/
frame versions. The app must publish truthful committed transitions and authorize
all backend effects independently.

[Actual pure source contract](../../tests/reordering/core/README.md) owns signatures,
bounds and synthetic limits. Approved five-source identityf0b483b7… is intaken as
a7b8627; old worker131 tests and recorded independent151-case scope remain historical.
The [explicit pure entry](../planning/wp-10-core-entry-plan.md) adds source discovery,
not an installed/packed/native adapter/G-02 proof. Ref/command-origin/navigation and
new-generation adapter contracts still require separate actual allocations.

Eligibility: manual order, no active sort or effective filter, stable IDs, fresh
records, current-page scope, eligible row and no conflicting pending move.
Neutral All tab is not a filter. No cross-page moves. Apply identical restrictions
and understandable reasons to all alternatives, not just handles.

Preview is ephemeral. Confirmed drop emits one ID-based intent. App persists/
reconciles and supplies authoritative records/order. One pending operation per
table; prevent conflicting reorder/pagination while pending. Cancelled gestures
emit no successful write. No automatic mutation retry.

On failure discard preview and render **latest authoritative** order, not an old
snapshot over newer records. Restore focus and safe feedback. Prefer ID anchors
plus base revision to numeric indices. App server validates actor, scope, page
membership, eligibility and concurrency; operation IDs may support idempotency.

External query/scope changes remain possible while pending. Old completions
cannot overwrite the new view; app must reconcile any actual backend effect.
UI cancellation is not proof that a submitted mutation did not happen.

## Column order and visibility

Maintain a complete stable leaf order including hidden IDs. Validate every
proposed order is a permutation: no missing/duplicate/new IDs. Move visible data
leaves inside their current group/utility partition and merge into existing
visible slots so hidden IDs retain stored positions. Utilities cannot move **or
be crossed**; no whole-group or cross-group moves.

Header/body alignment and identity survive hide/reveal. Required fields cannot
hide; hiding never erases filter/sort identity. Choosers exclude internal carrier
fields and clearly expose required states. Prevent an unusable no-data-column
state or use explicit configured recovery. App may persist order/visibility via
callbacks; no automatic URL/localStorage behavior.
