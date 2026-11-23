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

```ts
type RowMove = {
  operationId: string; scopeKey: string;
  movedId: string; beforeId: string | null; afterId: string | null;
  pageIds: readonly string[];
  baseRevision: string | null;
};
type RowMoveOutcome =
  | { ok: true; revision?: string }
  | { ok: false; message: string };
```

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
