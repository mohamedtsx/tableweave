# WP-09 composition and capability proposal

TASK-017 under the delegated WP-04–WP-15 delivery grant. This records a selected
engineering direction, **not an implementation allocation**. Initial details source
is separately approved. Code below waits for exact final WP-07/WP-08 integration
heads, a bounded approved execution plan and exclusive ownership. No dependency
install, reference/Figma write, merge, deployment or publication is implied.

## Required boundary, not a footer trick

Product D-10/D-24, FR-12/16 and disabled-feature combinations require genuine
developer-controlled pagination disablement. No requirement demands deleting the
wire pagination pair; the state/query contract already includes it. Current native
client processing still pages when a footer is hidden. That is a real feasibility
gap, not permission to weaken requirements or claim an unpaged table.

Select a shared server-safe schema policy `pagination.enabled?: boolean`, default
true. Preserve existing paged behavior/identities and the wire pair. Disabled input
must use canonical dormant `{pageIndex:0,pageSize:configuredDefault}`; it is not a
row limit. Reject noncanonical navigation, direct pagination/clamp commands and
controlled acceptance, including apparent no-ops and query replacement. Do not
silently normalize an attempted navigation into success.

Resolved native pagination enablement must match the schema, never rewrite it.
Disabled policy changes definition/query identity explicitly and requires a version
transition for an existing schema. Keep paged identities byte-compatible. Resource
keys alone, raw serialization or object identity cannot distinguish execution.

## Server-safe execution and complete provenance

A new server-safe execution descriptor validates against the server-registered
schema, reuses current normalized filter/sort/date semantics and resolves paging
as `page` with index/size or `complete`. The client cannot select trusted policy.
Existing translateQuery translates filters only; do not imply otherwise. Backend
authorization, completeness and workload limits remain application responsibilities.

Complete means no pagination offset/limit, not an arbitrary large page size.
Truncated output must not report completeness. Requests and their genuine immutable
controls bindings capture extent before begin; success/snapshot/retry preserve it.
Omission remains legacy page semantics. No post-hoc binding or relabeling a saved
page as complete. Known total equals complete supplied record count as a consistency
check, not proof the backend returned all authorized matching records.

Use an explicit server-complete native/control source branch. Ordinary server-page
input is incompatible with disabled pagination. Client disabled processing uses
the existing filter→sort stages and unsliced output; server-complete is manual and
unsliced, without another pipeline or cached accepted row-order mirror. Retained A
keeps A's actual extent/range while B loads; incompatible policy snapshots mask,
never acquire B's labels. Unavailable metadata is not authoritative zero.

Native/control projections expose enablement explicitly: no navigation/page count
when disabled, no dormant offset calculations. Complete results have1–N or real0–0.
Selection targets eligible actually rendered rows, not a server-wide all-matching
sentinel, and preserves the accepted single/multiple restrictions. Disabled shells
mount no pager/correction hook. Existing resource lifetime and Start bootstrap stay
unchanged; policy support is not SSR cache hydration.

## Real facade responsibilities

These names remain proposed until emitted/packed consumers prove them:

- `defineTable`: constructs the real registered native definition, resolves actual
  immutable tool/capability/default configuration and validates defaults through
  existing query/controller contracts. Default builder exists only for configured
  available builder fields; paging defaults10 and configured sizes. Opt-ins remain
  opt-ins. Locale/timezone/clock and application-controlled groups stay explicit.
- A definition controller factory creates the one genuine native controller in the
  application's established lifetime. No render-created duplicate owner or implicit
  disposal is introduced. Defaults merge through normalization, not unchecked casts.
- `useTableweave`: adopts that controller and actual current native/control frame,
  pairs render presentation and event authority from the same owned input, resolves
  default recovery and typed renderer facts. It is real composition, not an alias
  to an unrelated hook. It does not create a second native pipeline, connect/begin
  a resource, fetch, persist or copy accepted query state. A possible internal
  commit pointer is metadata only; abandoned/pre-layout callbacks fail closed.
- `DataTable`: optional real HeroUI composition with guarded current view, preferred
  visible-data row-header fallback and diagnostics=false. Private slots are not
  invoked before privacy checks. App supplies meaningful labels/text values and
  actual actions/Retry transport, not dead default buttons.

Separate presentation placement from capability disablement. An external search/
tabs/date control preserves schema ownership and active criteria. A genuinely
disabled capability rejects incompatible accepted states/commands rather than
silently clearing them or releasing fields to the builder. Sorting/selection reuse
existing immutable native guards; no controller wrapper or unsafe generic dispatch.

## Shell, messages and live criteria seam

Compose external tabs/date, selection replacement or normal builder/search/chooser/
sort, resource notice, collection/state region, truthful pager, and details. Tabs
own one stable results subtree, not per-tab resource/table copies. External tools
survive in-table selection replacement; only normal local drafts/portals unmount.

Built-in states work without custom body code: initial loading/error, retained
refresh/failure, successful dataset/filtered/unknown empty, updating-empty and
privacy-unavailable. Retained A range stays A; Retry targets B through a real app
wrapper. Fresh empty B permanently supersedes A. Recovery is tool-specific; no
global Clear/Export, automatic card layout, silent hidden fields or implicit Save.

Aggregate messages reference the exact own producer interfaces plus new own state
messages; omission uses complete English defaults and replacements are explicit.
Accepted locale/timezone, actual application Aria provider, theme and bidi isolation
must agree. Do not claim a maintained Arabic dictionary or manual AT acceptance.
Details reuse the accepted atomic port/session and permitted-form continuity; a
request generation is freshness, not target/session lifetime.

Before composition, negotiate one live context/epoch/criteria-intent seam for real
WP-07 controls. Their render tags alone cannot prove same-turn access/scope changes.
Do not fabricate a facade alias, write speculative render refs as committed state
or wrap/substitute the controller to pretend an event guard exists. Exact factory
owner refs precede separate-target mutations, followed by current intent checks.
Host facts/authority must come from one coherent owned frame, not equal query text.

Read-only producer tracing selects an optional plain registered criteria-authority
protocol shared by all four tools, plus a separate controls adapter. This is a
direction to refine and approve, not an implemented or frozen API. The plain
controller module must not import native/presentation into server-safe filters.
Exact controller/getDefinition() references, expected/actual context and an explicit
application reset epoch establish the origin domain. A copied/invalid supplied
authority denies rather than falling back to raw behavior. Event-time permission
must precede private editor/formatter/source/cursor callbacks and be rechecked
after reentrant validation/begin and immediately before mutation. Existing exact
applied-rule/search/date baselines, passive source lifetimes and proposal receipts
remain mandatory; unrelated sort/page changes must not invalidate eligible drafts.

Raw tools retain their explicit coherent-context application precondition. WP-08's
bounded normal-region/external-tool composition can prove actual replacement,
portal/draft cleanup and preserved accepted criteria under that precondition; it
cannot claim same-controller pre-render criteria revocation. That integrated
AC-16/25 obligation remains open for the WP-09 facade and must be proved there
with the negotiated seam, not waived by hiding UI or wrapping the controller.
Immediate revocation still requires application publication/reset before subsequent
actor work; unpublished changes are unknowable. Controlled acceptance remains the
owner's operation and must retire revoked proposals. No source allocation follows.

## Bounded implementation plan to approve after dependencies

Proposed core-policy scope: contracts types/schema/query/identity and a new execution
helper; controller reducer/store existing guard boundaries; native types/definition/
adapter/boundary; resource extent metadata/validation/view; presentation types/
binding/project/masked/authority. Hook lifetime/bootstrap is excluded. Main owns
exports and migration notes. Dedicated tests/pagination-policy precede consumers.
Do not mutate active WP-08 paths or silently broaden this proposal's code authority.

Separate later owners: headless table/** plus facade tests; styled data-table/**,
own state/localization modules and shell tests; explicitly bounded WP-07 live-intent
seam only after final packet handoff. Main serializes all shared changes, review,
styles/manifests/lock and final actual package integration. Sortable navigation
interlock waits for its own exact coordinator/pager protocol; DOM disabling alone
cannot establish it.

Before WP-11 require paged backward compatibility, >10-row unpaged client filter/
sort, explicit complete-server positives and ordinary-page/truncated/binding
negatives, disabled command/final-acceptance guards, policy/version/ABA invalidation,
relative-date/evaluatedAt/retry provenance, truthful ranges/selection/empty states,
one owner/pipeline/lifetime, controlled reject, same-turn private-slot denial,
pre-layout/abandoned/Suspense callbacks, details continuity, inferred negative types
and genuine packed styled/headless consumers. Stop for explicit clock-contract
correction if a genuine evaluation transition cannot be represented; never hide it
inside paging logic. No story/mock/type-only pass establishes those boundaries or
manual/device/performance/real-consumer/legal/publication acceptance.
