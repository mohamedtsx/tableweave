# Integrated acceptance scenarios

These AC IDs are **locally derived scenarios**, not IDs present in the Notion
PRD. They operationalize its acceptance and HLD failure boundaries without adding
scope. All are planned; no scenario has passed here. Use [traceability](traceability.md)
to select requirements and [testing](../docs/testing/README.md) to choose evidence.

Each scenario states setup → exercise → expected result / meaningful boundary.

## AC-01 Typed defaults and domain reuse

Configure stable-ID transactions, customers and inventory through the same typed
API. Start minimal, then opt in tools. Only builder (with configured fields) and
pagination appear by default; sort is per-field opt-in. Custom cells/headers/
accessors/actions need no library fork. Verify declaration inference and actual
browser rendering; domain-specific library branches are a failure.

## AC-02 Exclusive ownership and definition transitions

Configure Status→tabs, Description→search and BookedAt→date with inactive neutral
tools. None appears in builder. Reject competing owners. Replace schema/owner
assignment through explicit version transition: revalidate/reject stale criteria,
never silently delete/rewrite or retain unauthorized stale rules.

## AC-03 Flat All/Any and rule commands

Apply cross-field and same-field rules; switch All/Any; empty either mode is
neutral. Search ORs only declared fields; tools AND together. Duplicate edits
independently; Negate uses inverse preserving compatible value shape, absent for
custom operator without inverse; Remove targets one rule. Assert result IDs and
one semantic transition, not chip appearance alone.

## AC-04 Operators and missing values

Use case variants, null/undefined/empty text/collection, whitespace, zero/false,
invalid dates/non-finite numbers and inclusive boundaries. Zero/false remain
values; missing never satisfies negative non-empty operators; whitespace only
normalizes when configured. Compare stable enum/entity IDs and underlying money/
computed values, not formatted labels. Local/translator conformance vectors agree.

## AC-05 Draft timing and membership

Edit typed text/number/date ranges while prior rule is applied: invalid/incomplete
input changes no results until valid confirmation. Enum/boolean/value-less choices
commit immediately. Final membership deselection removes rule. Editor Cancel
restores previous applied value without touching selection/query tools.

## AC-06 Date, relative clock and debounce

Apply single/range/presets across a DST boundary in configured timezone; complete
end day included using next-day exclusive boundary. Date-only values keep day,
instants keep meaning, relative presets reevaluate against injected clock with
stable boundary keys. Test bounds/invalid ranges. Search defaults 300 ms; zero
and custom matchers work; no intermediate request per keystroke beyond policy.

## AC-07 Async options recovery

Search/page options, retain selected IDs outside the current page, fail/retry,
return older term after newer term. Labels/applied rules survive loading/failure;
only current term/scope data is accepted. Loading/no-options/error remain local
to picker and custom inputs obey validation/commit contract.

## AC-08 Builder Clear and scoped recovery

With builder/search/tab/date/sort/order/visibility/page size active, Clear removes
only all builder rules, keeps join preference and other tools/presentation,
applies valid page/selection policies once. No-rules Clear hidden by default
(optional disabled). Search-only no-results offers search recovery, not a falsely
global builder Clear. Compare all state slices before/after.

## AC-09 Selection toolbar replacement

With active criteria and external tabs/date, select an ID. Replace only the
in-table builder/rules/Clear/embedded search/chooser region with total/custom
actions/Cancel. Hidden criteria remain active. Cancel/final deselect restores
unchanged query/presentation with predictable focus; no built-in Export.

## AC-10 Selection lifetime and effective transitions

Select across pages, then sort/change size: preserve stable IDs/count, including
off-page. Same-query refetch preserves IDs. Effective builder/join/search/date/
tab or app-driven filtering clears by default; drafts/semantic no-ops do not.
Test explicit controlled override and that query reset is atomic, not two requests.

## AC-11 Current-page selection and custom actions

Header select-all selects only eligible current-page IDs, mixed state accurate,
other pages retained. Count all IDs, supply loaded records separately; no invented
off-page objects/all-matching sentinel. App reconciles authoritative removed/
ineligible IDs; page absence is not deletion. Actions receive stale/busy context
and test unauthorized IDs at the actual application boundary when available.

## AC-12 Row move restrictions and persistence races

Manual/current-page/fresh fixture: pointer/touch/keyboard/simple move controls
emit one anchored ID intent; cancel emits none. Sort/effective filter/stale/pending
blocks all methods with reasons; neutral All does not. Fail/conflict while newer
records arrive: latest authoritative order wins, focus recoverable, no false
success/automatic retry. Old completion after query/scope change cannot overwrite.

## AC-13 Column groups, utilities and hidden order

Move visible leaves, hide/reveal siblings, attempt crossing groups/utilities via
every input. Header/body align; hidden IDs retain stored positions; utilities
fixed/not crossed; within-group only, no whole-group move. Validate permutation.
Required data columns cannot hide; internal carrier never appears in chooser.

## AC-14 Initial and empty-state precedence

First pending → error/ready/zero variants. Skeleton never coincides with false
empty, error never masquerades as empty. Dataset-empty, filtered-empty and unknown
server cause use distinct truthful copy/actions. Retry/Create/Import exist only
when supplied; all work without custom table-body implementation.

## AC-15 Retained results and requested-page provenance

Display accepted A while B loads/fails, including a different page. Show A's actual
range and explicit previous-results notice, not B metadata. Preserve criteria;
block obsolete new selection/reorder/unknown navigation; Cancel/recovery remain.
Retry B rather than A. Same-key failure retains usable rows without state reset.

## AC-16 Late responses and scope loss

Resolve B before late A, including uncancellable transports. Wrong generation/
key cannot replace accepted B. Switch/revoke scope while rows/details/options/
selection/move are present: clear private/transient buffers immediately. Late
success cannot resurrect prior-scope records. Test request-local SSR isolation
separately, not only browser UI hiding.

## AC-17 Fresh empty and buffer lifecycle

After A→failed B→Retry B→fresh successful empty B, old A disappears permanently.
Never promote placeholder as accepted snapshot. Previous empty refresh stays
neutral and usable; buffer limited to one same-scope snapshot and cleared on
unmount/definition transition/access loss. No persistence to storage.

## AC-18 Arbitrary details and target isolation

Render distinct transaction/customer/inventory content/actions and custom shell
slots without modifying library. Explicit accessible trigger; selection/links/
handles/actions do not accidentally open drawer. Visible/hidden field context
correct, no mandatory generated template, no fabricated off-page native Row.

## AC-19 Drawer lifecycle and focus

Desktop logical-end/mobile fullscreen, custom size/content, loading/error/missing
details resource. Close button/Escape/backdrop/enabled swipe share controlled
policy; dirty-state rejection honored. Focus trap/restore or fallback, scroll
lock/safe area/nested controls work. Page absence not deletion; scope loss clears.

## AC-20 Responsive, RTL, themes and translation

Review 1440/1024/768/390/320, zoom/text expansion/reduced motion, light/dark and
Arabic RTL. Contain horizontal table scrolling; intact rules wrap; no automatic
cards/hidden data. Explicit responsive omissions have a custom details path.
Replace dictionary/format locale, isolate bidi IDs/money, preserve identity/data
meaning, reachable toolbar/footer/details actions.

## AC-21 Manual accessible interactions

On the supported task paths, exercise keyboard, real screen-reader/table/header
semantics, sort priority, checkbox states, focus swaps/drawer, live announcements,
pointer-only non-drag alternatives and touch. Automated axe supplements but does
not replace review. Record actual browser/OS/AT/input versions and failures;
consumer-renderer responsibility remains explicit. No untested WCAG claim.

## AC-22 Start SSR and hydration isolation

Use packed packages in Start + Query. Two concurrent actor/scope requests have
separate QueryClients/caches. Loader/component share validated options/identity;
hydrate locale/timezone/clock/controller IDs without mismatch or duplicate fresh
read. Verify browser abort/isomorphic server port, no relative-URL/serialized
AbortSignal assumptions, one SSR integration/provider.

## AC-23 Server query validation and processing

Submit unknown/mismatched schema/field/operator/tab/sort/limits and injection-like
values: reject safely, authorize separately, parameterize translators. Filter →
sort → page with deterministic tie-breaker. Partial supplied page is not locally
reprocessed; unauthorized fields/actions cannot be enabled by native escape hatch.

## AC-24 Pagination metadata and shrink

Known/unknown totals, first/middle/last/zero, explicit next-page flags, defaults
10/25/50/100 and configurable sizes. Filter/sort/size reset first page once;
selection preserved on sort/page/size. Dataset shrink uses authoritative or
bounded correction without loops, fabricated totals or unexplained empty page.

## AC-25 Controlled rejection and independent tables

Controlled owner accepts/rejects proposed group snapshots; rejected proposal has
no hidden optimistic accepted mirror, partial request or duplicate callback.
Native per-slice setters use coordinator; raw resets cannot bypass it. Two tables
remain independent; equivalent filter keys ignore draft/rule IDs while editor
identities stay independent. Explicit definition transition revalidates state.

## AC-26 Packed types and headless boundaries

Clean tarball consumers compile valid/invalid type fixtures, inferred accessors/
custom values/native contexts and declared TS/peer matrix. Headless imports no
HeroUI/CSS/Query/router/ORM/i18n/storage; contracts import no React runtime/DOM.
Default styled bundle omits sortable without explicit entry. Correct exports,
declarations, side effects/styles/Next client boundaries and license contents.

## AC-27 Workbench, examples and honest docs

All required stories/F-scenes and three synthetic domains/primary Start/secondary
Vite/Next/headless examples work from packed APIs. Stories use real components,
custom details/actions and failure controls, no business backend/private data.
Install/config/default/restriction/extension/recovery docs match actual API.
Story/mock passes do not claim real integration.

## AC-28 Reference performance

Use fixed HLD workload/environment, seeded fixtures, ten warmups then 100 samples
per scenario across three fresh sessions. Report per-scenario p50/p95/raw
samples; meet ≤200 ms interactions/≤1 second initial render, explicit exclusions
and separate typing/network/SSR/consumer costs. Measure reorder/bundles honestly;
no universal-scale claim or invented numeric drag budget.

## AC-29 Authorized consumer and release

Real-consumer integration aligned with Gamila has explicit target/change
permission and observed acceptance (not stack-only or `.repo/` edits). All FRs,
G-gates, manual/browser/performance/package/docs gates pass for exact release
revision. Verify MIT/notices/name/scope/publisher rights, semver/changelog/
migration/known limits and provenance. Publish only with current explicit
authorization; advisory usability participant counts do not block stable.
