# WP-09 details/localization/composition plan

TASK-017 under the explicit WP-04–WP-15 delegated delivery grant. Main approves
this bounded plan/provisional reference-informed direction before code. Isolated
`work/wp-09-details` starts reviewed WP-05 `3e4aaa8` in
`/tmp/opencode/tableweave-wp09`; final PR stacks after reviewed WP-08. No merge,
publication/deploy, external consumer change or personal/final Figma acceptance.

## Outcome and staged allocation

WP-09/FR-13–16, AC-18–AC-21/F-18–F-20: arbitrary details content, one responsive
accessible overlay, consistent controlled dirty-close policy, contained table/state
composition and fully replaceable English messages. Follow
[rendering](../engineering/rendering.md), [acceptance](../../product/acceptance.md),
[quality](../../product/quality.md), shared rules, recovery and design scenes.
All three maintainer references remain authoritative/read-only; thin composition,
quiet token hierarchy and reachable actions—not copied reference code/assets or
business defaults. No new dependencies planned.

1. **Details worker initially:** `packages/heroui/src/details/**` and
   `tests/details/**` only. Existing controller/native/resource sources are read-
   only. Exact candidate details props/ports and isolated tests precede consumers.
2. **Shell/state allocation later:** new `packages/heroui/src/table/data-table.tsx`
   and `states/**` plus tests/composition, only after tested WP-07/WP-08 handoffs.
   Existing collection files remain main-owned; never guess incomplete props.
3. **Localization integration later:** own aggregate English dictionary/context
   composes exact control/detail/state message interfaces. App replacement and
   Arabic RTL fixtures do not imply a maintained Arabic locale.
4. **Main:** root exports/styles/build/config/manifests/lockfile, existing renderer,
   facade handshake, shared fixtures/docs/TASKS/REVIEW and all Git/PR writes.

Only step1 is initially authorized for assignment. Scoped fixture port6447, ignored
`.artifacts/`; link existing exact installed vendors for isolated local tools only,
never commit links or infer dependency installation/publication rights.

Main separately approves the plain [criteria-authority producer](wp-09-criteria-authority-plan.md)
using already-accepted controller/context APIs while styled compatibility is reviewed.
Only its new module/test paths are allocated; existing details, full facade, tool
adoption, native controls and unpaged policy are not reopened by it.

The [pure pagination prerequisite](wp-09-pagination-contracts-plan.md) separately
allocates only four contract files and new isolated tests; no unpaged runtime follows.
The later [execution descriptor prerequisite](wp-09-execution-descriptor-plan.md)
allocates one new server-safe source/test folder, not backend/resource execution.
The [publication prerequisite](wp-09-criteria-publication-plan.md) separately
allocates one inert-first metadata producer and its own tests, not tool adoption.
The [next controller readiness](wp-09-controller-policy-readiness.md) reconciles
final WP-08 callback ordering, but grants no shared-core implementation lease yet.

The later read-only [readiness decisions](wp-09-next-stage-readiness.md) select
compatibility/provenance/lifecycle constraints and record a verified custom-time
limit. They allocate no implementation and do not replace final dependency review.

## Actual foundation and controlled ownership

Reuse existing details.change and subscribed accepted details.rowId. Proposed does
not mean open/closed; reject has no subscription notification. No optimistic open
boolean, controller remount/reset or second query/details store. Opening/closing
must not alter selection/filter/page/order. Render from current native view props,
never stable native-handle snapshot getters. Missing/off-page rows are not deletion.

Own DetailsShell props identify controller and expected definition/dataset/scope/
access plus invalidation epoch. App-owned current-context/target read port supplies
event-time authority; captured allowed render props alone cannot authorize old
callbacks after scope changes. Resolved detail input carries matching row/context/
session provenance, safe loading/ready/error/missing state, optional genuine record,
optional current native row and supplied Retry. No invented record/native row,
private lookup, fetch/cache service or row-query ResourceRequest forced onto detail
identity. Parent/application owns async requests, cancellation and generation tags;
the shell rejects stale/mismatched/closed-reopened generations before rendering.

Arbitrary header/body/footer and full-interior slots remain inside one named dialog
with shell lifecycle/focus policy. Current visible/hidden IDs are presentation facts,
not an automatic field template. Three substantially different synthetic contents
(form, arbitrary record summary, custom layout) must prove no fixed field-list API.
Business Save/actions are supplied real callbacks; success never implies persistence
or automatic closure unless the application explicitly requests it.

## Close/replace protocol and privacy

All enabled exits—header close, footer Cancel, Escape, backdrop—use one request
path with origin controller/definition/dataset/scope/row/session generation:

1. Ask optional synchronous/asynchronous application dirty/target-change policy.
2. Keep the mounted dialog/draft while confirmation is pending; suppress duplicates.
3. Recheck current authority/target/session after resolution before dispatch.
4. Submit details.change with a guarded updater so it cannot close/replace a newer
   accepted target. Report blocked/stale/submitted/committed/noop/callback failure
   distinctly; never announce a proposal as closed or await nonexistent rejection.

Programmatically accepted owner changes remain authoritative. A shell-provided
requestOpen(B) must run the same dirty replacement policy for A before B submission.
No app request is automatically authorized by a row ID or hidden UI affordance.
Scope/access/dataset/definition loss immediately masks private content and
invalidates pending decisions; security invalidation bypasses dirty prompts. App
owns controlled target cleanup, but rejected cleanup cannot restore old content.
No render-time controller/cache/resource writes, browser-only read or stale callback.

Default trigger is an explicit named button, not row-wide activation. Selection,
links/buttons/handles and text selection must stay independent. Initial focus is
meaningful, trap/name/scroll-lock are real, nested controls remain usable. Restore
the original trigger only while connected and valid in the same scope/dataset;
otherwise use an application/table fallback. Privacy invalidation must not focus
an old private-row trigger. Controlled close rejection retains usable focus/draft.

## Exact pinned Drawer adaptation

Official HeroUI3.2.8 Storybook Drawer controlled/form/scroll/non-dismissable and
Modal close stories were researched. Use the genuine compound Drawer surface,
not a swapped Modal/Drawer or invented responsive prop. One overlay/dialog tree
survives resize: below768 CSS px fullscreen; desktop logical end (physical right
LTR/left RTL), preferred32rem capped to viewport. Body scrolls; header/footer and
safe-area actions remain reachable. CSS responsiveness preferred over matchMedia
branching, especially SSR/initial-open hydration.

Installed drawer.js couples dragging to backdrop dismissal and leaves an inline
transform after a successful swipe requests closure, even if controlled dirty-close
rejects. Default swipe is **disabled explicitly**, not backdrop dismissal. Main
inspected Drawer.Dialog's pinned implementation: its own props are spread after
dragHandlers, so a private reviewed adapter can replace its six pointer drag
handlers with inert handlers (without preventDefault/stopPropagation) and restore
normal touch action. Backdrop and Escape still pass through actual RAC controlled
dismissal. No vendor runtime patch, disabled backdrop or event-swallowing overlay.

First prove in a real browser that header/footer drag cannot translate/request
closure, child pointer/text/button/body scroll still works, backdrop/Escape share
policy and dirty rejection stays visible/focused. Keep the pinned adapter private
and strongly typed; if overriding these public DOM handlers does not work, stop
before claiming a functioning default. Optional swipe is deferred until its real
rejection recovery is proven; no enabled exit may bypass policy.

## Explicit shell/facade boundary before examples

Later DataTable composes external tabs/date → WP-08 toolbar replacement → resource
notice → contained native collection/state → truthful footer → details shell.
It consumes already-owned native/resource presentation; never reconnects a second
resource lifetime. Default initial loading/error, retained updating/failure,
dataset-empty/filtered-empty/unknown-empty are distinct and preserve structure.
Retry/Create/Import appear only when supplied. No implicit global Clear or Export.

defineTable/useTableweave remain absent proposed convenience APIs. Main allocates a
separate exact handshake after tool/control producers stabilize, before WP-11:
compose immutable defaults/definition, existing controller/native/resource owners
and command ports, not an alias, second pipeline/store/cache/fetcher or SSR wrapper.
WP-06 owns authorized Start bootstrap; do not change resource server snapshots here.

## Required evidence and stop rules

Meaningful types/units/browser/SSR/actual packed checks include controlled delayed
accept/reject, all exits and replacement policy, async stale decisions/ABA,
off-page/missing targets, fresh detail provenance, privacy suppression before effects,
removed trigger fallback, independent tables, arbitrary slots/native-row inference,
one-tree resize identity, nested overlay, scroll-lock/background inertness and
keyboard naming/focus. Exercise1440/1024/768/390/320, light/dark, RTL, enlarged text,
reduced motion, safe areas and initial-open hydration without ClientOnly workarounds.

Main wires exact root discovery, owned CSS/packed allowlists, unpatched own public
NodeNext TS6/5.9 and actual-tarball browser interaction after producer handoff.
Independent numbered findings are reproduced/fixed/verified before approval.
Stop affected work for unallocated API/renderer changes, stale authority/private
content, focus/swipe rejection hazards, false persistence success, dependency/type
waivers or missing required handoffs. Automated/axe/Chromium is not actual devices,
manual AT/performance/real consumer/legal acceptance. No merge or publication.

## Independent details correction disposition — 2026-11-24

Three reproduced P1 findings block the initial producer: metadata getter rereads
can admit denied data/throw raw source errors; loading during same-session refetch
unmounts dirty forms; untagged retained currentView can expose an old-scope Row.table
even when an immutable record object is legitimately shared across scopes.

Before code, main approves the necessary private pre-consumer protocol adjustment:
the app-owned **atomic current read** may provide a context-tagged committed native
frame alongside authority. Untagged options.currentView is not provenance. Expose
an optional native row only with matching current owner/context/frame proof;
otherwise return undefined, never fabricate or rebind an old view with new tags.
Record-reference or state-query equality alone is insufficient. Apps already own
the accepted source/model context, just as they own record authorization; no new
native hook/pipeline/store, resource lifetime or post-hoc pseudo-proof is added.
Exact tested types precede later composition. No current consumer relies on this
unpublished interface; update scoped fixtures/types together.

Capture/validate plain metadata once (or reject accessors) before source use and
short-circuit denied contexts without reading private source getters. Do not clone/
freeze app-owned record objects. Same-target/session refetch must keep the actual
custom form subtree mounted through loading/error while reporting truthful current
status; no private-record cache is invented to simulate continuity. Full lifecycle
invalidation still removes private content and bypasses dirty prompts. Reproduce
all four failing invariants before fixes; preserve original overlay/SSR/focus proof.

Request generation is freshness, not target-session lifetime: a committed port may
advance a request before parent render props catch up. Main approves preserving
the permitted same-session subtree through that lag while masking stale record/row
provenance. Owner/context/access/epoch/target/session loss still unmounts immediately.
Capture top-level callbacks once or consistently reject accessors before invocation;
do not validate then reread policy references. These narrow n4/n5 corrections add
no API/store/resource owner and precede public composition.

The separate [composition/capability proposal](wp-09-composition-proposal.md)
records actual facade/default-state/localization and unpaged feasibility gaps.
It allocates no implementation before final WP-07/WP-08 handoffs and a bounded
approved execution plan. Initial details-source approval does not close these gaps.
