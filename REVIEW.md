# Review notes

Temporary scratchpad for maintainer feedback and delegated agent review findings,
separate from the live task ledger
in [TASKS.md](TASKS.md). Note numbering (`n1`, `n2`, …) restarts in each new review
session. Keep session context while notes are retained; labels are not TASK IDs
or acceptance of the whole work packet.

When the maintainer no longer needs these notes, they can be cleared on request.
Keep applied decisions in their canonical documentation/code first, so clearing
the scratchpad does not lose the guidance. No notes are cleared by this move.

## WP-01 — review session 1

**Closed:** the maintainer ended this review and accepted TASK-003 / WP-01 on
2026-11-23. The foundation revision is `6bac5a6`; WP-02 is not started or authorized.
Notes are retained until clearing is requested; applied guidance remains in the
canonical documentation and skill.

### n1 — HeroUI component reference

- **Request:** use the official
  [HeroUI v3 Storybook](https://storybook-v3.heroui.com/?path=/docs/welcome--docs)
  for component lookup instead of relying on the main HeroUI site, which the
  maintainer reports is sometimes unresponsive.
- **Disposition:** applied in [stack lookup guidance](docs/engineering/stack.md#conditional-official-lookup),
  [design references](docs/design/handoff.md#authority-and-exact-references) and
  the [UI workflow skill](.agents/skills/tableweave-ui-workflow/SKILL.md).
  Installed-version/type/tagged-source verification remains required. No change
  to product scope, dependency versions or the three maintainer taste sources.
- **Checks:** documentation structure, all 17 checker regression probes and
  `git diff --check` passed when the guidance was applied. No runtime or external
  site availability validation was claimed for that documentation-only update.

This session has ended. Restart note numbering at `n1` in the next review session.

## WP-02 — review session 1

Closed: maintainer explicitly accepted WP-02 after n1–n3 corrections. Notes remain
retained until clearing is requested. Reports are checked against executable reproductions and product
contracts; neither maintainer nor agent assertions are assumed correct.

### n1 — Invalid collection records can match negative filters (P2)

- **Report:** `set.noneOf ['a']` accepts `['']` and a sparse single-slot array;
  record ID validation differs from operand validation and `.every` skips holes.
- **Disposition:** confirmed with both reported inputs returning true before the
  fix. Operand and record ID shape checks now share an internal validator;
  collection validation explicitly checks every own index. The independent
  translator fixture was also defective and now checks density/ID shapes using
  its own implementation. Regression coverage includes all membership operators,
  notEmpty, mixed invalid members, inherited slots and finite numeric IDs/zero.

### n2 — Skipped local day compiles to an empty interval (P2)

- **Report:** datetime On `2011-12-30` in `Pacific/Apia` yields equal epoch bounds.
- **Disposition:** confirmed: a corrected runtime reproduction accepted an empty
  interval before the fix. Converted timestamp bounds are now checked for
  finiteness and strict order. Tests reject the skipped absolute/relative day and
  preserve date-only intent and the next representable day; existing DST tests
  remain in the verification set. Initial reproduction setup mistakenly passed a
  clock into createQuery; that unrelated setup error was corrected before diagnosis.

### n3 — Dynamic definitions lose valid sort/tab types (P2)

- **Report:** a broadly typed `QuerySchemaDefinition` yields sort ID `never` and
  tab ID `null` even when runtime configuration supports those values.
- **Disposition:** confirmed by two TS2322 errors on otherwise valid dynamic
  sort/tab calls. Type derivation now admits possibly-true optional sort flags
  and extracts optional tab element IDs without requiring present properties.
  Local strict typecheck passes broad/optional positive cases and literal/known
  ID negative cases. Equivalent fixtures are included in the packed TS matrix.

**Verification:** all three reports independently confirmed and corrected.
`pnpm check` passes 159 tests (including ten new review regressions), strict local
types, both packed TS 6.0.3/5.9.3 consumers with broad/optional/literal fixtures,
guarded packed runtime regressions and the existing Chromium smoke. See
[correction evidence](docs/evidence/wp-02-contracts-2026-11-23.md#review-session-1--n1n3-corrections).
The [worker workflow](docs/agents/workflow.md#lifecycle-and-one-live-ledger) now
preserves the maintainer's instruction to verify factual reports rather than
assume their truth. The later explicit maintainer acceptance closes this session;
it does not pass broader product/release gates. Restart numbering for WP-03 review.

## WP-03 — review session 1

Closed: maintainer explicitly accepted WP-03 after n1–n2 corrections. Notes remain
retained until clearing is requested. Reports are checked independently against reproductions and
the owning contract; neither reporter nor agent assertions substitute for proof.

### n1 — Inline selectors lose equality reference stability (P2)

- **Report:** recreating an inline selector on an unrelated parent rerender resets
  the reader cache, producing a new equal object and rerunning dependent effects.
- **Disposition:** confirmed in Chromium: the inline dependent-effect count
  increased from 2 to 3 on an unrelated parent update, while stable selector count
  and controller revision stayed unchanged. Added a hook-local committed-value
  baseline, read by new readers using the current equality function and updated
  only after commit. Chromium regressions now preserve identity across parent
  updates and prove changed selector props/accepted store state still recompute.

### n2 — Invalid column updates default/reset layout (P2)

- **Report:** null order/visibility values, directly or returned by updaters, use
  initialization defaults instead of failing and can commit unwanted resets.
- **Disposition:** confirmed by four failing direct/functional order/visibility
  null regressions. Validation now defaults only missing initialization keys;
  explicit nulls are rejected in updates and initial groups/column metadata.
  Valid omitted/partial seeds still work. Tests cover pure/store rejection,
  unchanged snapshots/revisions/notifications and preservation of a pending
  controlled proposal. Equivalent real packed runtime checks were added.

**Verification:** `pnpm check` passes **208 unit tests**, both packed TS versions,
guarded runtime/server-render checks, 17 documentation probes and **four Chromium
tests** (including both n1 regressions). Reviewed corrected source/declarations
and preserved all prior guards. See [WP-03 evidence](docs/evidence/wp-03-controller-2026-11-23.md#review-session-1--n1n2-corrections).
The later explicit WP-03 acceptance closes this session; broader gates remain
unpassed. No Git writes occurred during these corrections; subsequent delivery is
tracked in TASK-010. Restart numbering at n1 for the next session.

## WP-04 — delegated agent review session 1

Closed under the user's explicit WP-04–WP-15 delegation after n1–n7 corrections,
independent native/controller and collection rereview, and the final integrated
workflow: **241 unit tests, 32 Chromium tests, strict unpatched public TS6/5.9,
packed/runtime/bundle/declaration guards and 18 docs probes**.
Main **agent-approves under delegated authority** the tested WP-04/G-01 boundary.
This is not personal maintainer review; the maintainer reviews PRs later.
No PR may be merged. Broader SSR/manual-AT/browser/performance/release gates remain
separate. Notes are retained; numbering restarts in the next review session.

### n1 — Suspended native renders leak speculative records (P1)

- **Independent report:** committed `[a]`; transition renders `[b]` then suspends
  after `useNativeTable`. Chromium shows committed DOM/view rows still `[a]` but
  the supported native getter returns `[b]`; selecting visible `a` throws.
- **Disposition:** returned for a failing regression and commit-safe native model/
  action correction. The reviewer reports an executable reproduction; implementer
  must independently reproduce before fixing. No approval while unresolved.
  Implementer reproduced/corrected using isolated actual-core frames; independent
  rereview now passes original Suspense getter/raw-row action and controlled
  accept/reject scenarios. Integrated G-01/public packing remains pending.

### n2 — Native restrictions reject after controller acceptance (P1)

- **Independent report:** schema-enabled/native-disabled sorting and schema-multi/
  definition-single sorting can commit or be accepted by the controller, then
  fail bridge projection with `native.sorting`.
- **Disposition:** restrictions must reject before proposal/accepted publication,
  not leave an unusable committed state. Minimal controller-contract integration
  is main-owned if needed; no silent schema-policy weakening.
  Main added the pure synchronous preacceptance validator at initialization,
  reduced candidate and final acceptance. All three original native regressions
  and seven direct constraint tests pass; independent rereview also confirms
  rejection/pending preservation and observed async failure. Native composition
  now also rejects runtime null/nonfunction validators consistently.

### n3 — Old pager closure uses obsolete metadata (P2)

- **Independent report:** capture Next with unknown `hasNextPage:true`; refresh
  only that metadata to false, preserving the query; old Next still increments.
- **Disposition:** callback must use current committed authority and identity,
  with regression coverage for same-query metadata-only refresh and old closures.
  Implemented and independently verified with committed-versus-speculative
  metadata scenarios; old closures cannot grant/revoke based on abandoned inputs.

### n4 — Native column toggles capture stale sorting/visibility (P2)

- **Independent report:** two native column `toggleSorting()` calls without an
  intervening render both accept descending; the second should advance to
  ascending. Direct bridge functional setters already use the latest state.
- **Disposition:** reproduce and fix the supported native column action boundary,
  not only direct setter updaters. Verify accepted/proposed/rejected paths.
  Main's follow-up independently reproduced the same defect in visibility:
  two same-turn category toggles left it hidden. Added the failing regression and
  routed toggleVisibility through the latest accepted visibility updater too.
  Independent rereview then caught group method/handler parity: writing a group
  ID is invalid because accepted visibility is leaf-only. Main independently
  reproduced that failure; the correction derives intent from current descendant
  visibility and updates hideable leaves once, preserving controller final-visible
  guards. Added group method/default-toggle/handler/atomic-rejection regression;
  fresh follow-up verification passes method/handler parity, required/utility/final
  guards, accepted/controlled intent and the original n1–n4 probes. Scoped reviewer
  recommends approval; the final combined workflow also passes.

### n5 — Real collection imports fail strict vendor declarations (P1)

- **Report:** full collection typing exposes three RAC exact-optional inheritance
  errors; NodeNext also rejects HeroUI's extensionless declarations.
- **Disposition:** exact current-stable declaration-only RAC repair plus styled-
  package Bundler resolution is recorded in the plan/ADR-07, without weakening
  strict flags. Main's positive/negative real-RAC checks pass TS6.0.3/5.9.3;
  frozen fresh install reapplies the patch. Compared all 1,446 installed files to
  an unpatched isolated consumer: only the two reviewed declarations differ;
  runtime/license bytes match. Final unpatched public NodeNext TS6/5.9 renderer/
  context checks and reachable declaration-graph exclusion also pass.

### n6 — Home/End can focus hidden grouped-header padding (P2)

- **Independent report:** uneven collection, keyboard navigation from Name →
  Identity → Home lands on hidden `__tw_placeholder:3:selection`; End from
  Metrics lands on hidden location padding. Existing arrow-only regression passes
  but does not cover boundary navigation.
- **Disposition:** returned to collection worker for independent failing repro,
  Home/End/chord handling and actual keyboard regression. Hidden padding must not
  become a focus target; no acceptance while unresolved. Reviewer independently
  passed nine static tests and additional callback/selection/DOM-identity checks.
  Worker reproduced both exact failures and fixed navigation without semantic
  markup changes; all 14 expanded static Chromium tests pass. Fresh independent
  rereview is pending. Generated before/after artifacts were moved to the fixture's
  standard ignored `.artifacts/` directory so they are not documentation inputs.
  Independent fresh-copy rereview resolves n6: original reproduction stays on
  Identity, 14 static cases and a 96-chord matrix find no hidden focus, with ten
  additional native/selection/DOM probes and strict type checks. Scoped renderer
  correction approval recommended; main's final public packed/combined G-01 checks
  subsequently pass with 21 collection cases included in 32 Chromium tests.

### n7 — Native fixture diagnostic reads a committed handle during render (P2 test)

- **Independent report:** filtered-ID diagnostic lags one commit after the n1
  boundary correction. Actual filtered collection pages verify correctly; the
  diagnostic reads the stable committed handle in render without observing its
  commit publication.
- **Disposition:** main moved this test-only derived read after commit, with
  explicit input/state dependencies for data-only refreshes. It is not a second
  row processor or managed-state owner. Full combined browser rerun and subsequent
  strict collection typecheck pass; no library API or processing expectation was
  weakened to fit the test.

## WP-05 — delegated agent review session 1

Closed for the independently reviewed isolated resource producer at `71f076c`;
numbering restarts at n1. Main **agent-approves under delegated authority** the
tested WP-05/G-03 producer after the full isolated workflow (255 unit/15 browser,
both public packed TS versions/runtime probes). No personal maintainer review,
combined native-integration, framework SSR or release approval is claimed.
Final stacked `e6eeabf` integration now also passes **288 unit/43 Chromium**, both
unpatched packed TS versions and all native/collection/resource boundaries; source
fingerprints match the reviewed producer. Separate PR delivery follows, no merge.

### n1 — Suspense hide incorrectly clears the resource as unmounted (P1)

- **Independent report:** layout-effect disconnect during committed Suspense hide
  clears accepted rows/pending requests and calls application `unmount` cleanup.
  On reveal the adapter reconnects idle, but the app's still-mounted passive
  fetch effect has not restarted; the table can remain empty indefinitely.
- **Disposition:** independently reproduced before correction (three new
  regressions failed), then resolved by passive lifetime ownership with layout
  context invalidation/pure render guards unchanged. Independent fresh-copy
  rereview verifies ready/pending hide/reveal, hidden completion/revocation and
  real hidden-owner unmount/StrictMode cleanup. Candidate suite: 47 unit/SSR and
  11 Chromium passed; reviewer also reran nine independent races and three
  corrected-original/hidden-revocation checks, plus strict TS6/5.9. No residual
  verified defect; producer approval recommended pending main packed integration.
  Unmount cleanup is passive-phase, not before arbitrary layout callbacks;
  application permission/scope invalidation remains explicit, including hidden UI.

## WP-06 — delegated agent review session 1

Open for the actual Start candidate; numbering restarts at n1. Development and
production source fixtures report 13 checks each, but strict typing, actual
tarball installation/SSR proof and independent application review remain required.
No G-04 approval or personal maintainer acceptance. No PR merges.

### n1 — Actual app/config strict typing fails upstream declarations (P1)

- **Main reproduction:** `pnpm --filter @tableweave/example-start typecheck`
  reports 11 diagnostics under unchanged strict settings: missing `_Algorithm`
  and undeclared Standard Schema dependency in installed Start server-core, plus
  eager optional-bundler type imports in unplugin/webpack-virtual-modules.
- **Disposition:** main owns the exact dependency/declaration repair after
  source/metadata research. Build/browser success is not type acceptance. No
  ambient-any modules, skipLibCheck, strictness downgrade, omitted config checks
  or broad dependency upgrade is permitted merely to hide these errors.
  The recorded exact source-type/dependency repair now passes strict TS6/5.9
  app/config checks; compared all 426 upstream package files, only the three
  reviewed declarations differ. Initial actual-tarball types/build/dev+production
  proof also passes, but predates n2–n4 corrections and is not G-04 approval.

### n2 — Accepted actor/scope transition retains prior runtime (P1)

- **Independent reproduction:** hydrate Alpha/select a row, switch the synthetic
  actor cookie to Beta, invalidate the existing router and wait for committed
  Beta loader bootstrap. Alpha resource/rows/selection/cache and same-key canary
  remain active in both dev and production.
- **Disposition:** returned for an independently failing regression and explicit
  accepted bootstrap/scope lifecycle, pure first-render privacy guard and correct
  cache/token/application-state invalidation. Using the old runtime's context as
  its own expected context cannot detect the newly authorized scope.
  Worker independently reproduced the failing dev/production case, then added a
  commit-owned authorization session boundary, fresh scoped bootstrap/canary and
  retirement cleanup. Real pending/late/ABA and abandoned Suspense scenarios are
  included in21 passing checks per mode. Main matches the source fingerprint;
  independent rereview/full refreshed actual-tarball workflow are active.

### n3 — Real authorization denial is ordinary refresh failure (P1)

- **Independent reproduction:** hydrate/select Alpha, change the cookie to an
  unauthorized actor, ordinary Refresh. The actual RPC denies access, but rows,
  selection/cache and canSelect remain; output reports access=true/unavailable.
- **Disposition:** returned for actual safe authorization-outcome signaling from
  the server/RPC, not a special requested test-mode oracle. Current-token/generation
  guards must prevent stale denials revoking a later scope. Add real ordinary-
  request denial regressions in dev and production.
  Worker reproduced/fixed with the actual safe discriminated server authorization
  outcome and exact token guards; no requested-mode/error-string oracle. A mounted
  denied Query observer initially recreated an empty entry; observer ownership was
  corrected instead of weakening cache-clear assertions. Independent rereview pending.

### n4 — Early validation/CSRF rejection omits no-store headers (P2)

- **Independent reproduction:** invalid-mode RPC input returns safe serialized
  rejection (framework HTTP200) without Cache-Control; cross-origin CSRF rejection
  likewise lacks the promised private/no-store policy. No secret leakage shown.
- **Disposition:** returned for an outer response policy covering early rejection
  paths before validation/CSRF. Preserve the genuine framework status/transport
  protocol and safe errors; document actual statuses rather than inventing them.
  Worker reproduced both early paths and added outer request middleware before
  CSRF/validation; regressions require private/no-store while preserving actual
  framework HTTP200 serialized validation and HTTP403 CSRF statuses. Full and
  independent refreshed checks remain pending.

### n5 — Bootstrap denial leaves resumable authorized cache (P1)

- **Independent fresh-copy reproduction:** hydrate/select Alpha, change the actor
  cookie to revoked, then invalidate the router (Reload authorization). Error UI
  unmounts, but Alpha cache/canary and access=true resource/server metadata remain;
  reconnecting the old wrapper immediately restores ten cached rows without fresh
  authorization. Confirmed in dev and production. No server authorization bypass
  is claimed, but private-cache clearing/resurrection invariants fail.
- **Disposition:** original n2–n4 fixes are independently verified; this new
  bootstrap-side denial path still blocks approval. Main stopped only the owned
  obsolete full-check tree and returned n5 for failing regressions/typed terminal
  authorization handling, generation-safe scope retirement and explicit fresh
  restoration. Mere unmount or a generic thrown error is not access invalidation.
  Definition-only transition/read-count gaps and a five-second cold hydration
  expectation timeout are noted separately; the latter is not a verified source
  defect or permission to hide failures with broad retries/timeouts.
  **Correction handoff:** worker reproduced n5 in both modes before fixing typed
  bootstrap/canary outcomes and a per-router authorization grant owner. Terminal
  denial now clears caches/server snapshots and blocks old-wrapper restoration;
  late-denial, fresh grant, definition change and per-transition read-count cases
  are included.27 dev+27 production/both strict TS checks pass in worker scope.
  Initial hydration alone uses the existing30-second test deadline after recorded
  module-load timing exceeded five seconds; transition/race timeouts stay unchanged.
  Independent rereview and refreshed full/actual-packed checks remain outstanding.
  **Independent resolution:** fresh27 dev+27 production and two extra probes per
  mode confirm terminal old wrappers even after fresh grants and delayed denial
  across Alpha→Beta→Alpha. Same-grant page-two revalidation adds no read; scope/
  actual-definition transitions add one each. Both TS versions/24-file Biome/build
  and all five client hashes match. Reviewed25-file aggregate remains
  `88438df5a0ef6c7fd044efe7bc02f4badfdd99826a46f962a8530a6a4ae447de`.
  n5 is resolved; scoped source technical approval recommended. Main's refreshed
  full/actual-packed workflow remains mandatory before delegated G-04 disposition.

### n6 — Shared consumer type isolation relies on workspace fallback (P2)

- Main's resolution trace finds the earlier shared library test apps borrowing
  genuine unpatched React19.3.0 declarations from an ancestor workspace. Type/ABI
  assertions ran, but complete type-install isolation was not proven.
- Added exact local React/DOM type dev dependencies and per-compiler resolved-file
  guards to the shared harness. The actual standalone Start workspace already
  resolves all721 program files locally under TS6 and5.9; only compiler standard
  libraries escape. Both shared and actual Start runners now enforce that guard.
  Refreshed full workflow is required before marking the shared correction passed.
  **Resolved:** final full workflow passes exact local type installs and resolved-
  file confinement for both compilers:205 headless/209 styled and721 actual Start
  files each. No workspace declaration is borrowed except compiler standard libs.

### WP-06 session-1 disposition

All n1–n6 are resolved. Independent source review and main's completed guarded
`pnpm check` pass289 units,43 baseline browser cases,27+27 real Start source and
27+27 actual-tarball cases, strict TS6/5.9, archive/runtime/bundle/header safeguards
and source/packed25-file fingerprint equality. Main grants **agent-approved under
delegated authority** for bounded private WP-06/G-04 only. This is not personal
maintainer acceptance, production auth, actual-device/AT/performance/real-consumer/
release evidence. Commit/separate stacked PR follows; **no PR merge**.

### n7 — Clean-checkout typecheck lacks ignored generated route tree (P1)

- Remote CI on cc88f21 fails TS2307 for routeTree.gen plus derivative route/context
  diagnostics. Main independently copies source without ignored generated output
  and reproduces that exact missing-module failure. Earlier local runs had the
  framework-generated file; their success did not prove clean-checkout generation.
- Disposition: real Start/Vite build now precedes app strict tsc. Packed preparation
  excludes/asserts absence of the ignored tree, and its real typecheck must create
  it. No hand-maintained generated module, narrowed source check, shim/dependency
  or compiler waiver. Fresh source/actual-packed and remote verification required;
  packet delivery remains in progress despite prior scoped runtime proof.
  **Fresh local proof:** cold source copy now generates routes and passes; root
  typecheck and genuine fresh pack:start pass27 dev+27 production, both strict
  compilers/721-file confinement. Preparation starts without the ignored route
  tree and actual framework typecheck creates it. Independent correction review
  and final remote checks remain pending; runtime source/archive are unchanged.
  **Resolved:** independent cold probe confirms absence before actual framework
  build, generated-tree creation, strict TS6/5.9 pass and packed preparer's real
  ENOENT assertion even with generated output present at source. CI ordering is
  correct;25-file runtime digest and headless archive match prior review. Main
  grants scoped delegated technical approval for n7. Corrected remote delivery
  checks remain required; the prior cc88f21 CI failures are not overwritten.
  Corrected222c97f source now passes both complete remote push/PR jobs. Final
  documentation-head verification follows; all PRs remain unmerged.
