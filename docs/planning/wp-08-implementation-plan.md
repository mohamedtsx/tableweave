# WP-08 controls and presentation implementation plan

TASK-016 under the explicit WP-04–WP-15 delegated grant. Main approves this bounded
plan/provisional reference-informed direction before feature code. No personal
maintainer/final Figma acceptance, merge, publication, deployment or real consumer
change. Isolated work starts reviewed WP-05 `3e4aaa8` in
`/tmp/opencode/tableweave-wp08`; final PR stacks after reviewed WP-07.

## Observable scope

WP-08 / AC-09–AC-11/13/15/24/25, F-08–F-11/F-17: accepted-state toolbar replacement,
truthful action subsets/counts, page eligibility, single/multiple selection,
explicit sort priorities, displayed-provenance known/unknown pager and required/
hidden chooser. Reuse the actual [native](../engineering/wp-04-native.md),
[controller](../engineering/wp-03-controller.md) and [resource](../engineering/resources.md)
producers. No fetching/cache/backend actions/URL/storage/Export or sortable.

Read [shared rules](../../product/shared-rules.md), [features](../../product/features.md),
[rendering](../engineering/rendering.md), recovery and the relevant acceptance.
Quiet compact token layout follows all three maintainer references, especially
read-only local composition patterns. No reference code/assets/business defaults.
Real browser widths/RTL/theme/text review remains evidence, not plan acceptance.

## Explicit gaps and allocation

The bounded native input currently only enables multiple selection; the minimum
core extension here permits `selection: true | "multiple" | "single"` while false/
omission remains disabled and true remains backward-compatible multiple. Controller
definition retains its boolean enabled capability; native preacceptance constraints
add single-ID cardinality at initialization/candidate/final override acceptance.
Expose immutable mode on definition/current view; native single-row intents replace
the previous selected ID, not merge two. No select-all in single mode, including
programmatic supported page actions. UI alone never enforces cardinality.

Native eligibility has no resource-freshness ownership and native accepted page
metadata may differ from retained displayed metadata. A pure presentation bridge
must therefore precede controls. Its own types combine current native view,
immutable definition, explicit client/server source, expected ResourceContext and
explicit current request/query-identity binding. Never silently assume arbitrary
application resource keys equal controller queryIdentity. Bind the application's
request key to a tagged accepted controller query identity; guard changes at event
time and compare actual snapshot query semantics/provenance as required. Unsupported
or mismatched combinations reject/suppress safely, never manufacture fresh rows.

The bridge returns facts only: all selected IDs; loaded selected {id,record} subset;
missing selected IDs; actual displayed query/page/pageInfo or null; busy/stale/
obsolete and select/navigation/reorder authority. No new writable state, resource
buffer, pipeline or resource hook lifetime. Server input must be the resource's
actual page/manual processing; client input is complete local data/native results.
Initial no-snapshot state is not authoritative zero-total/empty-dataset metadata.

Render uses **current view state/models**, not stable native committed getter
snapshots. Supported event handlers recheck current accepted controller/resource
authority, including accepted B before application begin(B), stale closures and
same-query changed records/eligibility/metadata. Obsolete rows cannot gain new
selection/reorder; Cancel/recovery remain reachable. App scope/permission is not
library authorization. One existing owner acquires each resource lifetime.

## Exclusive paths and readiness

1. Core worker first: `packages/react/src/presentation/**`, approved native mode
   edits only in `packages/react/src/tanstack/**`, `tests/controls/core/**` and its
   scoped types/test config. Existing controller/resource/filter sources are read-
   only; report a required change instead of wrapping or duplicating their policy.
2. Selection worker later: `packages/heroui/src/selection/**` and own fixtures.
3. Pager worker later: `packages/heroui/src/pagination/**` and own fixtures.
4. Chooser/sort worker later: `packages/heroui/src/columns/**`, `sorting/**`.
5. Main: shared table renderer guards/messages/diagnostic switches/row-header
   fallback, public indexes, styles/build/config/manifests/lockfile, packed harness,
   docs/TASKS/REVIEW and all Git. No WP-07 toolbar/filter/date ownership overlap.

Only step1 is assigned initially. Precise tested producer interfaces precede UI
consumers; no guessed WP-07 props. Those tools occupy a normal-region render slot.
External tabs/date remain outside the selection switch. Scoped output uses ignored
`.artifacts/`; later browser port6437. No installs/version changes planned; isolated
tooling may link already-installed exact vendors, but links are never committed.

## Controls and semantics

- SelectionToolbar replaces all embedded controls/chips/chooser/passthrough tools
  whenever any accepted ID is selected, including off-page-only selection. Count
  and Cancel remain; actions receive IDs separately from incomplete loaded records,
  missing IDs/provenance/busy/stale context. App actions authorize independently.
  Controlled proposals/rejected Cancel do not optimistically switch the toolbar.
  Deactivation closes embedded portals/discards only unsubmitted drafts; criteria
  stay applied. Restore meaningful focus without stealing surviving table focus.
- Page header selection touches eligible displayed-page IDs, preserves off-page
  IDs and never uses dataset-wide "all". Single mode has no page select-all. Keep
  sort/page/size/refetch selection, filter/tab clearing and controlled override
  reducer-owned. Cancel affects selection only.
- Sorting exposes schema/native-permitted explicit ascending/descending/remove/
  additive intents and priorities. Hidden primary retains its true priority; never
  assign directional aria-sort to a secondary visible column. Only visible primary
  gets directional sort; text equivalents describe all priorities.
- Pager shows displayed snapshot A's range/page/size/total while requested B is
  pending/failed, with clear retained-results notice and guarded navigation. Unknown
  uses explicit hasNextPage, previous/next only, no fabricated total/last/short-page
  inference. Known zero never renders Page1of0. Numbered controls are bounded.
  Fresh authoritative shrink correction uses identity-tagged pagination.clamp,
  outside render, current context/query/request checks and one bounded attempt
  per chain. Controlled rejection/contradiction cannot start correction loops.
- Chooser lists complete ordered definition data leaves, including hidden; excludes
  carrier/utilities/placeholders, explains required/final-visible restrictions and
  changes visibility only. Preserve hidden slots/order/filter/sort/selection.
  Composition resolves a visible data row-header or explicitly requires a fixed
  non-hideable one; chooser must not crash the renderer after hiding a preferred
  header. Drag remains WP-10.

Touched native collection messages become replaceable own props and diagnostics
optional in composed UI; WP-09 owns aggregate localization. Genuine own/native/
React public props only, no vendor declaration leaks. DataTable/default notices/
details shell is explicitly allocated to WP-09. Any defineTable/useTableweave
convenience facade gets a separate main-owned producer handshake after WP-07/08
interfaces stabilize, before examples—not an alias or duplicate controller/cache.
Resource server bootstrap remains WP-06, not a silent producer change here.

## Required proof and stops

Core tests cover single mode initialization/native/programmatic/controlled-final
acceptance, page-all rejection and true/multiple compatibility; pure projection
scope/definition/query/request mismatch, accepted-B-before-begin, retained A
metadata, no-snapshot, selected subsets/off-page/mixed eligibility, current metadata
and identity/independent instances. Preserve all prior native/frame regressions.

UI proof later covers actual toolbar/portal/focus/controlled Cancel, shared external
tools, known/unknown/zero/retained pager and bounded shrink, hidden primary sort,
chooser required/hidden/group/row-header behavior, same-ID data/metadata refresh and
stale callbacks. Run real emitted/packed browser interaction, strict unpatched
NodeNext TS6/5.9 inference/negative cases, headless/server-safe/import/CSS/sortable
guards, required scenes, responsive/RTL/theme/text checks, full workflow and docs.
Independent numbered findings are reproduced/fixed/rerun before delegated approval.

Stop affected work for producer/facade drift, interface guesses, stale action leaks,
misleading metadata, correction loops, type/keyboard failures, new dependencies or
missing required evidence. Never replace real devices/manual AT/performance/actual
consumer/legal gates with stories, axe or synthetic fixtures. No PR merge.

## Single-mode generic-command closure — 2026-11-24

Core handoff correctly enforces state cardinality and every native/view/controls
page-all method, but the generic controller's state-only guard cannot distinguish
a one-ID `selection.page` intent from a valid single selection. Main explicitly
allocates this necessary bounded controller change before code:

Add optional pure synchronous `ControllerOptions.validateCommand(command)`. It
runs under the existing reentrancy/error boundary before reduction/publication,
including no-ops, and again for the original command before final acceptance.
Failures preserve accepted state/revision/notifications/pending proposal. Validate
callback type and reject/observe async/nonvoid results just like validateState.
Existing validateState invocation/initialization/no-op policy stays unchanged.
This is an immutable capability guard, never fetching or backend authorization.

Native construction composes the command guard to forbid selection.page unless
mode is multiple, preserving application guards and their async failure handling.
No public controller wrapper/alternate accept or second state owner. The core
worker now exclusively owns existing controller/store.ts and types.ts for this
change in its isolated worktree; main retains docs/public indexes/shared harness.
Direct command, no-op, controlled proposal/acceptance and prior-controller
regressions are required before review. No broader command-policy rewrite.

## Independent review correction disposition — 2026-11-24

Six reproduced findings block the core handoff: mutable/getter command kinds,
old-scope Cancel, copied foreign resource views, mutable application guard options,
relative-date token rebinding after clock change, and reread selection mode input.
Fix each after an independently failing regression; no scope waiver or UI expansion.

Commands need immutable captured envelopes used consistently by guards/reducer/
proposal/final acceptance, preserving legitimate function updaters. Capture native
callback references and primitive configuration once; never validate then reread.
Cancel keeps query/resource-staleness independence but must retain origin owner/
definition/scope guards. Pure render projection must authenticate actual resource
views/snapshots, not structural key collisions; retain real server-snapshot support.

The request-binding timing gap requires an explicit **pre-UI candidate API change**:
replace arbitrary post-hoc `bindControlsRequest` with an atomic
`beginControlsRequest` helper. It captures accepted query identity/evaluation before
calling the existing resource.begin and returns the real token with its binding.
Application still owns invocation, transport/cache and settlement. No network is
started. Never permit an old token's first/repeated bind to acquire a newer clock
identity; memoizing only repeated binds is insufficient. Update the exact producer
contract/tests before any UI consumer. This is not a second resource lifetime,
buffer, query store or default fetching service.

## Query/layout intent handshake before control UI

n1–n9 source correction now has independent recommendation. Before consumer code,
main allocates one narrow additive intent closure: ControlsAuthority.require
supports explicit sort and columns intents. They recheck the original current
owner/controller/definition/scope/access domain, but do not require loaded-row
freshness or the old captured query identity. Sort/visibility are criteria/layout,
not actions on retained row targets; valid same-owner changes remain possible
during loading/refresh/failure. Wrong origin/context must still deny, with no
foreign facts or mutation. Existing row/page/navigation/reorder/retry guards and
Cancel semantics stay unchanged. This is not backend authorization or generic
unguarded dispatch. Source types/tests precede UI; no controller-policy rewrite.

## Initial control UI allocation

The independently reviewed n1–n9 producer is now approved for scoped source
consumption. Main adds its real root exports; no public/packed acceptance follows.
Separate workers may now implement SelectionToolbar under selection/** plus
tests/controls/selection/** (port6463), and Pagination/usePaginationCorrection under
pagination/** plus tests/controls/pagination/** (port6465). No shared renderer,
root/index/style/config/manifest/lock or core source edits by those workers. Each
uses the actual ControlsPresentation/Authority interfaces, own public message/slot
types and current accepted state, not speculative readCommitted writes or another
resource owner. Existing exact installed vendors only; no installs.

SelectionToolbar consumes current presentation plus event authority and renders
the normal region only with zero selected IDs. Applied criteria remain untouched;
unmount normal embedded tools to close portals/discard only local drafts. Optional
app actions are real callbacks supplied by the application and receive latest
guarded IDs separately from loaded/missing records. Do not infer authorization or
successful persistence. Cancel rechecks authority, including while rows are busy/
stale, and never optimistically restores the normal toolbar on a proposal/reject.
Focus fallback applies only when the removed region owned focus, not when a user
remains in the table/external tools. External tabs/date are outside this component.

Pagination consumes displayed provenance and authority. Null metadata is unknown,
not zero. Known/unknown/zero/retained copy and navigation use actual displayed facts;
all events recheck authority. A separate exported opt-in correction hook may issue
existing identity-tagged pagination.clamp outside render only for genuinely current
known authoritative shrink. One bounded attempt per correction chain; controlled
rejection or contradictory successive shrink cannot loop. No resource start/read,
transport, query mirror, forged totals or borrowed native committed getters. Exact
tested props/semantics precede later shell integration. Root/emitted/actual-packed,
full combined/independent review remain main-owned and mandatory.

## Sorting/chooser and collection ownership handoff

The additive sort/columns handshake now has independent316-test/eight-compiler/
seven-browser recommendation with all41 source fingerprints matching. Main
approves that narrow source extension for consumers. A separate UI owner may
implement columns/**, sorting/** and tests/controls/columns/** on6467, consuming
the exact current authority intents and existing controller/native commands.

Main delegates only the shared collection adapter implementation to a distinct
owner: table/native-collection.tsx, controlled-collection.tsx, new own messages
module and tests/controls/collection/** on6469. No other table/core/root/index/
style/dependency edits. Optional controls:{presentation,authority} enables guarded
resource-aware rendering/actions; legacy minimal callers remain compatible.
Guarded display uses only genuine row models matching the supplied current view,
masked selection/query facts and event-time authority. No rebuilding native rows,
query mirror or fallback to stale record values. Scope/access loss masks private
row/selection/query diagnostics even before effects; default composed shell later
always supplies guards. UI hiding is not backend authorization.

Support genuine single mode with no page-all header or keyboard escape route to
page-all. All-page IDs remain current eligible page only. Prefer actual authority
commands for row/page changes; if a batch/native updater is necessary, it must
recheck current origin/eligibility and accepted baseline at event/final updater,
dispatch atomically, preserve off-page IDs and never overwrite newer accepted
selection from an old connected DOM callback. No stale captured selected set.

Sort/header actions use require(sort) then existing native/controller semantics,
not stale captured sort arrays; hidden primary and secondary priority semantics
remain truthful. All touched labels/formatters become own replaceable messages;
optional diagnostics=false removes both debugging footers/subscribed count without
changing behavior. Preferred row-header hiding resolves a current visible data
leaf, while invalid utilities/missing-data configurations remain diagnosed. No
column chooser may crash a table merely by hiding that preferred leaf.

Use a scoped tw-native-collection class. Main owns semantic header/unchecked
checkbox boundary contrast CSS and final root/style packaging. Main's browser
inspection found unchecked default controls with zero border/shadow and near-
background fill; automated text axe alone cannot close that non-text review.
Real grouped/native/single/resource/controlled/keyboard/RTL tests and public own
declaration checks precede integration. Selection/pager fixtures must distinguish
their component proof from pending shared-renderer integration until this handoff.

## Cross-owner target proof before query/layout consumers

The sorting/chooser owner correctly stops before code: require() alone does not
prove that a separately supplied controller/native target is the same factory
owner. Query object/reference equality is **not** an approved owner proof.
Before consumers continue, main approves a narrow getControlsAuthorityOwner helper:
module-private WeakMap registration of genuine createControlsAuthority results,
returning a frozen {definition,controller} identity pair, or null for copied/foreign
objects. It never calls methods/getters/current ports, authorizes a command or
changes ownership. Exact controller/definition equality precedes require() and
target mutation. Same-query different controllers cannot pass. Criteria/resource
freshness still belongs to existing require guards; the proof is not credentials.
Main owns helper/types/exports, independent tests/review precede consumer handoff.
Pager correction and guarded collection use the same helper for separate targets;
no structural query-identity workaround or generic unsafe mutation helper.

## Combined public control fixture allocation

Core, selection, sorting/chooser and guarded collection now have scoped independent
source approval. Pagination's supported synchronous source contract is independently
approved; its test-only unsupported-Promise characterization handoff precedes full
integration checks. Main wires real root exports/owned CSS; no public/packed proof
follows from those edits. A fixture owner may now compose actual public components
under tests/controls/integration/** and apps/storybook/src/controls/** on6483.
No library/root/config/manifest/lock/style-entry/ledger writes or package builds.

Use one actual controller/native/resource owner and coherent same-input presentation/
authority. Default fixture uses guarded NativeCollection with exact definition,
diagnostics=false, SelectionToolbar normal controls, Sorting/ColumnChooser and
Pagination; app supplies real explicit request/Retry/actions and correction epochs.
App state/callbacks remain genuine, no fake selection/query/token mirrors or direct
vendor row mutation. Source fixtures use public emitted entries; tarball replay
must remove those aliases and confine all runtime/type modules to its own install.

WP-07 cross-tool composition runs only after the exact final stacked dependency is
present; do not manufacture missing FilterBuilder/Search aliases in the old WP-05
tree. Initial own normal portal/draft fixture proves only control-region lifecycle,
not actual filter tools. Main adds exact WP-07 stack before final packet acceptance.
Stories must run real interactions and explicit completed/exception gates in the
actual built Storybook. Include same-turn callbacks, controlled reject/accept, scope/
access, retained A/B metadata, known/unknown/zero, single/multiple, hidden preferred
header/primary sort, localized messages/provider, narrow/themes/RTL and scoped axe.
Main owns default discovery, genuine archives, final full checks and integration
approval; source/Storybook success alone cannot establish those boundaries.

### Composition review correction allocation

Independent controls-only composition review verifies two P1 residuals despite
baseline23/public package/Storybook passes. Main approves a bounded application
scope-reset correction before code: the fixture owner may change model.ts and
owned integration tests only to reject stale prior proposals and complete mandatory
scope/access/lifetime selection reset, or fail closed until it completes. Ordinary
user-controlled Cancel/rejection/delayed acceptance must remain non-optimistic.
No generic controller/authority weakening, forced source freshness or private-row
retagging is allowed. Reproduce selected loaded+missing IDs across controlled
scope change and fresh B settlement before correction; old IDs cannot reach the
real action callback afterward. Same-query refetch must not clear valid selection.

Plain uninstrumented StrictMode also produces four cells against eight collection
columns. That source/vendor responsibility is separately diagnosed read-only first;
no removing StrictMode, switching to fake collection nodes or overriding vendor
internals is approved. The next exact adapter correction needs an explicit bounded
plan and before-failing probe. Both findings block composition/packet acceptance.

### Rapid popover reopen correction

Independent raw30-second matrix, uninstrumented frozen production Sorting/Chooser
and vendor-only reproduction confirm a real focus/Escape bug: rapid reopen while
the dialog is exit-retained can leave focus on body, so the next overlay-local
Escape is missed. Background inertness is appropriate while the modal is open;
this is not proof of permanently orphaned inert state or irreversible deadlock.
Removing axe/screenshots does not eliminate it. A separate close/focus await makes
the viewport matrix deterministic but cannot itself repair this user interaction.

Main approves the smallest public-API mitigation before code: the source owner may
add pinned supported shouldSkipAnimation to only the two internal Popover.Content
sites in sorting/sorting.tsx and columns/column-chooser.tsx. No global animation or
inert/focus DOM patch, vendor mutation, peer change, public vendor prop leakage,
query/authority alteration or focus-stealing custom manager is approved. All other
overlays retain their existing behavior. Validate a dedicated rapid physical
open→Escape→immediate-reopen→Escape sequence for both controls without waiting away
the race, with normal dialog closure/trigger focus return and no page errors.

The same owner may update only tests/controls/columns/** for that regression and
legitimate independent matrix sequencing: after each viewport's Escape assert
dialog removal, aria-expanded=false and trigger focus before changing viewport.
Keep all original axe/screenshots/contrast/RTL/text expansion assertions. Restore
the original30-second test limit; diagnostic90-second headroom is not acceptance.
Source/fixture before-failure evidence and exact hashes precede the patch. Scoped
source/compiler/browser proof and independent replay precede main-owned package
rebuild/actual production verification. Coordinate StrictMode work separately;
no combined acceptance follows until both P1 composition findings also resolve.

The public fixture owner may additionally add a plain StrictMode URL scenario and
public-root regression, plus a rapid physical reopen/Escape regression covering
both real controls. No library-source alias, lifecycle wrapper, remount key or
instrumentation may create the StrictMode result. Capture old emitted failures
first and keep them explicit until main supplies corrected public outputs. Preserve
all36 existing controls/scope assertions. Main updates the exact packed inventory
only from the resulting reviewed handoff; these tests join default production
replay rather than remaining temporary diagnosis.

### StrictMode vendor-cache experiment (not a distribution decision)

Independent isolation proves genuine native frames keep four leaves/cells and one
stable handle; flat vendor controls pass. Grouped empty→populated/ref updates clone
RAC's clean header cache but reset columnsDirty=true. Rebuilding already flattened
sibling links visits four genuine leaves as eight columns. The semantic count guard
is correct. Stable branch constructors and shallow child rematerialization do not
fix it; context alias identity is a separate harness concern, not this root cause.

Main approves only an isolated exact react-aria-components1.22.1 compatibility
experiment: preserve the actual columnsDirty boolean in TableCollection.clone next
to its existing cache copies. Copy true or false faithfully, never force false.
The experiment owner may modify only a private temporary vendor copy and private
Strict/lifecycle/column regression probes. No shared node_modules, candidate patch/
source/manifest/lock/dist, native/GroupColumn/renderer/app model or other controls
may change. No dependency install, runtime module copy into Tableweave, hidden
prototype monkey-patch or public vendor prop exposure is authorized.

Require before-positive failures and after-positive plain Strict app/real native
empty/populated cycles, same-ID changed records, uneven/hidden groups and preferred
header fallback, real column add/remove/hide invalidation, single/multiple/control-
rejection/range/stale-event smoke and prior renderer/composition checks. Retain
real lifecycle/semantic assertions. If genuine column changes reveal a separate
traversal defect, stop and return a further bounded proposal; do not silently add
node mutation or cache bypasses.

Registry latest is still1.22.1. Main separately researches fixed stable releases or
supported adapter alternatives. A successful workspace-only runtime patch would
not propagate through Tableweave archives and cannot prove normal packed-consumer
acceptance. Any final vendor/adapter/explicit consumer compatibility disposition
requires separate approval and real archive verification before packet acceptance;
this experiment is engineering evidence only, not that decision or publication.

### Cached column-parent traversal experiment

The clone-boolean experiment fixes both original Strict positives and the existing
renderer/legacy/pinned composition probes, but a genuine public Table.Collection
cached-column addition still fails five cells against eight columns. The owner
correctly stops: valid invalidation must rebuild, and skipping that rebuild would
conceal changed columns. No candidate/shared dependency or output is modified.

Main separately approves the proposed private experiment before code: preserve the
clone boolean and stop TableCollection.getChildren's default iterator immediately
after yielding a column parent's genuine lastChildKey. Apply only when the parent
is a column; leave body/footer flattening, row-cell restrictions, header lookup,
navigation and actual cache invalidation unchanged. Bound files remain the private
exact1.22.1 Table.js/Table.mjs copies and owned probes/artifacts. No shared vendor,
source package, manifests/lock/dist, CJS acceptance, global monkey-patch, node/DOM
mutation, deduplication/visit cap, remount or extra processing pipeline is approved.

Preserve the cached-add failure before modification. Require additions/removals/
reordering/hide-show across sibling and uneven nested cached groups, unchanged leaf
identity, actual header/cell text/order/count, row-header fallback, real dirty true
and false clone states, plus prior Strict lifecycle/value/selection/rejection/range/
stale-event checks. A truly new failure stops this experiment for another bounded
review; no further repair is silently added. Passing private experiments remain
distinct from independent review and any supported consumer distribution decision.

### Unpatched public-cache API alternative experiment

Before selecting an installation-burdening compatibility profile, main authorizes
a separate private adapter experiment using only documented TableHeader/Collection
items, render-function and dependencies inputs. Use genuine current columns/rows/
render inputs as cache dependencies; no random tokens, clocks, dummy counters,
remount keys, private node/prototype/DOM mutation, vendor edits or lifecycle removal.
The owner may change only an isolated private copy of ControlledCollection and
owned probes, with the actual unpatched vendor runtime. Candidate/source/dist and
shared dependencies remain read-only. This is not an implemented API contract.

Require the same uninstrumented Strict mounts/internal-ref updates and cached
column add/remove/hide/restore/reorder semantics. Baseline failures must precede
the experiment; private fresh output is not a real tarball result. Stop if only
superficial rerendering or lifecycle/interaction loss conceals the bug. A negative
result is useful evidence; no public cache prop is assumed to override cloning.

The completed private trial is negative: documented dynamic header columns/render
callbacks and nested public Collection items/dependencies retain both Strict4/8
failures, despite ordinary semantic/stale-event/visibility smoke and strict TS6/5.9
passing. Three of five positive gates pass; zero failures are hidden. All three
vendor Table runtime formats match the registry archive. The candidate stays
unchanged. This rules out the tested public-cache arrangement only, not every
possible public API architecture; no broader adapter change is allocated.

### Conditional consumer-profile design (not selected or allocated)

If a minimal private vendor repair passes and receives independent review, an
explicit private/prerelease consumer profile is a possible disposition—not ordinary
unpatched-runtime support. Its setup burden and stable/G-05 support remain separate
maintainer/release inputs. A wider public-hooks renderer is the architectural
alternative; neither is selected merely because the cache-input trial failed.

Any later profile plan must preserve these independently verified lanes:

1. Genuine unpatched public declaration/Node/bundle consumers remain unchanged;
   headless installation acquires no RAC or styled dependency.
2. A separate genuine runtime consumer extracts an exact runtime-only patch asset
   and descriptor from the actual styled archive **before installation**, explicitly
   registers it, installs without workspace fallback, verifies resolved vendor bytes
   and runs all current production/Strict/group/visibility/order/stale-event probes.
3. Missing/altered/wrong-version/unused profiles fail explicit verification; the
   original unpatched Strict failure remains negative evidence. No postinstall,
   automatic mutation, private prototype patch or user boolean establishes repair.

The styled package alone would own any reviewed patch/descriptor/verifier/license/
notice assets, exact files allowlists and documented public asset paths. Do not
copy a vendor implementation into Tableweave or rely on an asset appearing under
node_modules before the clean install has completed. Peer semver cannot express
patch state; normal setup must state the constraint prominently and offer explicit
CI verification, not a buried troubleshooting note or fake browser auto-detection.

Workspace registration cannot stack two patches for the same exact RAC selector.
A combined development declaration/runtime profile would need deliberate approval,
while the consumer runtime asset stays declaration-free. Table.js/.mjs/.cjs parity,
actual tested resolver formats and source-map accuracy require separate evidence;
unused stale sourceMappingURL references must not be advertised as correct maps.
Preserve exact upstream integrity, attribution, Apache license and prominent
modification notices. This is not third-party legal/publication acceptance.

No runtime asset creation, package export/files change, dependency/lock registration,
new install or candidate vendor edit is authorized by this conditional design.

### Candidate clone-only profile construction allocation

The second private experiment distinguishes supported NativeCollection A from raw
vendor Collection B. Clone-only passes genuine immutable-native ownership, accepted
same-group order, visibility/group pruning, row-header fallback/current values and
stable leaf/cache checks. Both changes also repair broader cached vendor insertion,
but that extra bound is not demonstrated necessary for the current public renderer.
Main rejects shipping it absent a supported consumer reason; preserve its negative
and positive diagnostic evidence without calling raw B a new Tableweave API.

Main now authorizes **candidate asset construction**, before code, in only
`packages/heroui/compat/**` and `tests/compat/rac-table-clone/**`. This is not package
shipping, registration, installation or final runtime-profile approval. Main owns
package files/exports, combined development patch, lock, setup/ADR/ledger and Git.
The owner may read existing pinned vendor files, exact registry1.22.1 metadata and
the existing Apache license, but must not modify shared dependencies or dist.

Build the minimal clone-only runtime patch for Table.js/.mjs/.cjs: copy the actual
boolean next to existing copied cache fields, preserving true and false. Add a
prominent modification notice and remove only the changed files' stale terminal
sourceMappingURL annotations; do not claim regenerated maps. No traversal repair,
node/DOM/prototype patch, forced false, runtime implementation in Tableweave, public
vendor props or automatic/postinstall mutation is approved. Preserve upstream
attribution/license and publish exact before/after hashes and integrity in the
candidate descriptor. CJS parity is a new candidate to verify, not inherited from
the earlier two-format experiment.

Provide a read-only explicitly invoked verifier for the tested isolated-project
layout. Resolve from the supplied project manifest, require the exact pinned vendor
version and consumer-local installation, validate the asset/descriptor and each
actual runtime file. Do not execute imported vendor code, accept a user enabled
boolean, silently borrow a parent workspace, write files or upload anything.
Negative tests must reject altered/missing assets, wrong/unpatched/mixed vendor
bytes and escaped resolution. Tests may modify only their private fixture copies;
actual browser/runtime approval still requires a later genuine archive install.

Document extraction from the archive before installation, explicit app-owned patch
registration, the unchanged unpatched public-declaration lane, raw-vendor cached
insertion limitation, exact tested formats and removal criteria. Match the existing
private/UNLICENSED package status; installation friction/stable/G-05/legal/manual/
publication acceptance is not granted. An independent reviewer checks the minimal
repair/supported scope while assets are constructed. Main approves any later
files/exports/registration/clean-install/packed-browser phase separately.

### Maintainer-selected compatibility direction

The user explicitly selects **Temporary patch** for private/prerelease delivery,
conditional on independent review and genuine packed-consumer tests. This resolves
the setup-direction decision, not any pending verification. Follow the explicit
application-owned exact-version runtime patch, byte verification and removal
criteria above; never automatic mutation or an unpatched-runtime claim. The broader
traversal repair remains excluded. Public-hooks replacement and waiting for an
upstream release are not selected. Stable/full G-05, legal/publication, manual/
device/performance and personal PR review remain separate. No merge is authorized.

Existing asset-owner boundaries remain unchanged. Main may prepare the separately
scoped package/profile integration plan; actual registration/clean installation
and final acceptance follow the candidate review, not this direction alone.

### Main-owned profile integration sequence

Independent minimal-repair review now reproduces both unpatched Strict failures
and passes clone-only supported native/core/renderer/lifetime/selection probes.
The constructed six-asset candidate is frozen for separate asset/verifier review.
Main prepares tests/foundation/packed-controls-profile.mjs and the corresponding
verify-workspace-compat.mjs byte guard in parallel. Neither is executed against
dependencies until review clears; do not install or alter reviewed assets during it.

After a clean asset disposition, main serializes these bounded changes:

1. Include exactly the six reviewed compat assets in the styled archive, without
   adding a runtime import, postinstall/bin, headless dependency or broad subpath.
   Update candidate packaging wording, descriptor asset digests and fingerprints
   transparently; repeat asset tests/byte proof after metadata changes.
2. Preserve the original declaration patch and build a separate combined workspace
   patch by exact concatenation with the reviewed runtime-only asset. Register only
   that combined RAC selector, retain the scoped HeroUI patch, update exact lock
   references and clean-install staging. Guards verify original declaration bytes,
   exact runtime scope, asset hashes and the combined lock hash. No versions change.
3. Perform the scoped pinned local install, verify actual declaring-package runtime
   digests and only then rebuild the owned Tableweave outputs. Old137 byte evidence
   stays historical; record new outputs instead of relabeling its guard.
4. Preserve genuine unpatched declaration/import/bundle consumers. Build a separate
   clean profiled consumer using only the actual archives: extract assets before
   installation into app patches, register runtime-only repair explicitly, install
   with scripts disabled/strict peers, verify through the extracted CLI and run all
   current38 production assertions with no library/vendor/source aliases. The CLI
   must reject the untouched unpatched consumer with E_VENDOR. Record each lane.
5. Run source165, current emitted38, built Storybook4, all strict types/SSR and full
   workflow. Source/public default checks retain every regression. Review actual
   packet/stack before commit/push and separate unmerged PR.

No success is predeclared. A new asset or real-install failure returns for correction
and independent review. This sequence implements the user's conditional temporary
private/prerelease direction, not ordinary unpatched runtime or stable/full-G05/
legal/manual/device/performance acceptance. Application setup is explicit and no
vendor repair propagates silently from root pnpm configuration into an archive.

After workspace registration the optional registry-proof harness must classify
installed bytes accurately: main may update only that test harness to accept either
all three exact registry originals or all three reviewed profile outputs, rejecting
mixed/unknown files. The actual downloaded originals, private zero-fuzz application
and unpatched negative controls remain mandatory; do not replace them with installed
patched inputs. Preserve the pre-registration report and old review manifest, update
the harness README/current hashes, and label installed state instead of claiming it
is still unpatched. No runtime asset/verifier change is needed for this adaptation.

## Test-harness portability pass

After source approval, a test-only owner may update existing controls core/selection/
pagination/columns/collection Vite/Vitest/Playwright/TS/type-check/SSR/fingerprint
configuration helpers to resolve pinned dependencies from their real declaring
workspace packages. No component/model/source fixture/assertion edits, no main
root/Vitest/package/consumer/packer/Storybook config writes and no installs/builds.
The current isolated tree now has genuine local dependencies and emitted roots.
Remove reliance on ignored vendor-node_modules symlinks or machine-specific
primary paths; do not replace real vendors with shims or relax strictness. Source
units must use one source factory registry; genuine public/packed checks remain
unaliased and separately claimed. Preserve prior manifests as historical evidence,
record new harness/input hashes, and prove portable runs after all borrowed links
are absent. Coordinate6483 integration fixture separately; its own config is not
part of this pass. Main owns final discovery/CI and the actual tarball boundary.
