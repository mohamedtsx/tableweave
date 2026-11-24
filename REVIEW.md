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

## WP-07 — delegated agent review session 1

Open; numbering restarts at n1. Headless producer interfaces are handed off and
the UI is under implementation, not packet approval. No personal maintainer/
final Figma/manual-AT acceptance, and no PR merge.

### n1 — Option envelopes validate then reread mutable/accessor values (P2)

- **Independent reproduction:** a hasMore getter returns false for validation and
  a mutable object on the next read; succeed returns true and stores that payload
  in the supposedly primitive immutable page. Context access can likewise return
  true then a nonboolean string, which is stored and permits begin.
- **Disposition:** returned to the producer owner for independently failing
  regressions and single-capture validation/consistent accessor rejection. Store
  exactly validated values; preserve atomicity and safe errors. Audit other
  envelopes for the same pattern. No interface drift or weakened validation.
  Worker reproduced both reported cases and the broader envelope audit before
  correction; own descriptor capture/accessor rejection now passes130 tests and
  strict TS6/5.9 without a signature change. Independent rereview and refreshed
  emitted/packed checks remain required; original pack evidence is superseded.
  **Resolved:** independent rereview confirms both original rejections without
  getter invocation, atomic snapshot/token preservation, proxy safety and prior
  identity/label/lifecycle vectors.130 tests and both strict TS versions pass.
  Main matches four-module SHA-256
  `2caa67e47d4f6ab949beecd8add1b8edc05af4f240f1158ba9b3b50c8e166f5d`,
  rebuilds the React package and passes420 default unit tests plus refreshed
  unpatched public TS6/5.9/type/runtime/bundle tarball checks. Scoped headless
  correction approved technically; WP-07 UI/React/packed interaction is still pending.

### n2 — Scoped calendar declarations unnecessarily load conflicting barrel (P1)

- **Main reproduction:** TS6 toolbar/date check reaches four unrelated HeroUI
  TS2320 interfaces through Calendar/RangeCalendar `import("..")` type references.
- **Disposition:** exact HeroUI3.2.8 declaration patch selects the same genuine
  CalendarYearPicker scoped types with prominent modification notices. All528
  upstream files compared: only the two reviewed entries differ, runtime/license
  bytes match. Scoped toolbar and positive/negative calendar-type checks pass
  TS6/5.9; patch-path/hash tests pass. No strictness/version/type-erasure waiver.
  Frozen application and actual public/UI/packed proof remain required.
  The same verified barrel problem also affects builder ListBox item/section
  references. The pre-install disposition extends the exact repair to its scoped
  entry (three declarations total); builder TS6/5.9 now pass without flag changes.

### n3 — Suspense reveal strands the surviving search draft (P2)

- **Independent reproduction:** type before debounce, hide/reveal via Suspense,
  wait and press Enter. The visible draft remains but produces no command because
  reveal advances a sequence without rearming that draft.
- **Disposition:** worker independently reproduced debounce/Enter failures, then
  preserved the surviving draft sequence and rearmed debounce on reveal. True
  unmount/context replacement still cancel.24 Chromium/5 units/both strict TS
  versions pass; independent original-repro rereview is active. No UI approval yet.
  **Resolved:** fresh independent rereview passes both original reproductions,
  receipt identity/interleaved/stale/external-clone/callback/IME/Suspense probes,
  five units and strict TS6/5.9.40 Chromium checks across two runs passed; search
  SHA-256 is `c8f221fa67d943f2d161f0c6c673f6a6ae3609b0612d694d6645188104bbbb9b`.
  Scoped source correction approved technically; emitted/packed proof remains.

### n4 — Rejected search history conceals external replacement (P2)

- **Independent reproduction:** submit external, reject, type a newer draft, then
  externally accept external. Text-history matching wrongly treats the external
  change as the rejected submission's acknowledgement and resubmits the draft.
- **Disposition:** worker reproduced and replaced history matching with exact own
  proposal-query/revision correlation. The corrected search bytes are under
  independent rereview, including older genuine acceptance during newer typing.
  **Resolved** by the same independent receipt-identity/revision rereview as n3;
  no residual search defect. This does not approve builder or full WP-07.

### n5 — Stale connected Apply overwrites an externally accepted rule (P1)

- **Independent reproduction:** edit Amount10 to12 while proposals are held; in
  one browser turn externally accept30 and click the still-connected Apply before
  React commits. Accepting its stale proposal restores12. Render-only baseline
  checks miss the current accepted state at submission.
- **Disposition:** returned for independently failing same-turn regression and
  event-time controller ownership/baseline validation. No optimistic rollback or
  controller mirror; unrelated page/presentation changes must remain harmless.
  **Resolved:** independent rereview's original same-turn stale-Apply reproduction
  now preserves the newer accepted rule. Broader discrete option freshness is
  separately tracked as n10, not hidden by this disposition.

### n6 — Retained option-page failure hides warning and Retry (P2)

- **Independent reproduction:** load termA, close/reopen, refreshA then fail. Source
  truthfully has failure/display=options/load-failed/canRetry, but picker only
  renders the display=error branch, silently disabling the retained choices.
- **Disposition:** returned for explicit retained-failure notice and actual supplied
  Retry without erasing usable provenance/selected labels or the accepted rule.
  **Resolved:** independent retained-failure/Retry replay passes with truthful
  retained options and current supplied request recovery.

### n7 — Reopened choice pagination mixes old cursor and blank term (P2)

- **Independent reproduction:** load termA/first with hasMore, close/reopen and
  Next. Local term resets to blank while retained page staysA; request combines
  blank term withA's cursor. Opaque cursor provenance is broken.
- **Disposition:** returned for matching displayed/request term+cursor handling and
  exact-token/context regression, never guessed cursors or fabricated new pages.
  **Resolved:** independent reopened-cursor and superseded-Next replay preserve
  actual term/request provenance. Full component approval remains blocked by n10.

### n8 — Shared date-unit discovery cannot resolve its installed vendor (P1)

- **Main reproduction:** expanded default Vitest discovery fails before date tests
  because their root-relative import cannot resolve Internationalized Date, although
  the scoped runner resolves its declaring package's exact installed dependency.
- **Resolved:** default runner now uses that same exact vendor resolution; no new
  dependency, production alias or strictness waiver.426 tests pass with four-worker
  budgeting. A simultaneous graph-only five-second timeout under22 workers is
  addressed by that worker cap, not by changing assertions/deadlines/retries or
  hiding a runtime behavior failure. Full corrected workflow remains required.

### n9 — Consumer typechecks borrow workspace React declarations (P2)

- **Main reproduction:** --traceResolution on the initial actual styled archive
  resolves React declarations to the workspace's unpatched @types/react19.3.0,
  because the test app has no explicit type dev dependencies. Existing ABI/type
  assertions still ran against genuine matching types, but full install isolation
  was not established by those checks.
- **Disposition:** declare exact already-approved React/DOM type dev dependencies
  in both clean apps and inspect every compiler program file. Only the chosen
  compiler's standard library may be outside that app. The new guard independently
  rejects the original artifact. Fresh standalone TS6/5.9/runtime/bundle rerun is
  active; no patch inheritance, alias or compatibility-version change.
  **Resolved:** fresh actual archives pass both compilers with explicit local
  type dependencies and the resolved-file guard:210 headless/223 styled program
  files per compiler, nothing outside the app except compiler standard libraries.
  Runtime/import/bundle checks also pass. This hardens the shared proof; corrected
  UI production/tarball interaction and full packet review still remain.

### n10 — Same-turn stale option click ignores current request eligibility (P2)

- **Independent reproduction:** with enabled termA options and accepted membership
  99, begin termB in the actual source then click the still-connected A option1
  before React commits. Although current source is pending/page=null/canChoose=false,
  the held proposal accepts1+99. Context/baseline guards do not check live choice
  request/page eligibility; render-captured enabled is insufficient.
- **Disposition:** original n5/n6/n7 reproductions pass, but this residual blocks
  approval. Returned for failing same-turn regression and discrete choice checks
  against the actual current source/token/page/context/canChoose/disabled ID.
  Preserve local drafts through loading and keep separate Remove reachable; do not
  globally hide/discard a valid editor to avoid this event-time guard requirement.
  **Correction handoff:** worker reproduced three failures before fixing only the
  discrete value-editor runtime path.45 Chromium/both strict TS checks and scoped
  Biome pass, including a selected-label-recovery positive control and all prior
  regressions. Main rebuilds both packages successfully; independent rereview and
  actual packed/browser proof remain required. Public signatures are unchanged.

### n11 — Duplicate async rules repeat IDs in live field union (P2)

- Independent n10 replay passes, then Duplicate creates two Person99 rules. A
  current valid option click throws because the live field-wide union is99,99 and
  the headless projection correctly rejects duplicate IDs.
- **Resolved:** shared Set<ScalarId> union preserves numeric/string identity without
  mutating either rule or weakening headless validation. Independent duplicate-
  target/deselection/label-retention probes,47 behavioral cases and both strict TS
  checks pass, matching source aggregate
  `d1c186132863774c4b7596169be7695d26e094b01b8573107e9ba4e0cf3c8895`.
  This approves the scoped correction, not the additional integrated findings below.

### n12 — RTL fixture omits matching inherited Aria locale (P2)

- CSS/controller use ar-EG but the browser is en-US and Tabs/table have no matching
  provider (the private date editor alone has one). Real ArrowRight therefore uses
  the wrong direction. Main inspected pinned default-locale resolution and the
  captured before probe fails.
- App fixture now wraps the whole workbench in its accepted locale provider.
  After probes pass3/3: actual RTL/English navigation and accepted-only locale/
  message/bidi updates without remounts. Full emitted run is pending; no maintained
  Arabic dictionary or actual-device acceptance is implied.

### n13 — Escape clears an already accepted membership rule (P1)

- Completed emitted integration captures Tags red accepted, then focused ListBox
  Escape removes that rule. Escape is local dismiss/Cancel, not accepted Remove.
- Returned to builder owner for before-failing source regression and disabling
  implicit Escape-selection clearing while retaining real overlay dismissal and
  explicit final-membership deselection. Never rollback submitted commands.
  **Resolved:** independent static red/async99 Escape and Cancel replays preserve
  rules/proposals/commands/results/source eligibility and restore focus; explicit
  final deselection still removes its target.54 behavioral cases pass, including
  earlier n10/n11. Scope is source correction, not complete packet acceptance.

### n14 — Builder accessible names omit visible trigger/value text (P1)

- Captured real axe label-content-name-mismatch: visible Filters named Add filter
  rule; visible30/alpha named only Value: Amount/Note. Visible text is absent.
- Returned for meaningful names including visible labels/rich summaries, preserving
  own replaceable messages and compact layout. Exact new name/selector handoff
  precedes fixture updates; do not hide meaningful text or suppress the rule.
  **Resolved:** independent rich zero/false summaries and five scoped axe scans
  pass with actual visible content in contextual names, both strict TS versions,
  unchanged aggregate92908b00a017b2ce9ac7f33f73dd6f57db8bb689a6db0875df0fba43dc60e210.
  Direct native-config CSS preflight was excluded by the reviewer due to isolated
  resolution; main's genuine installed-tarball CSS/browser proof is separate.

### n15 — Default table headers/dark confirmation have low contrast (P1)

- Main decodes actual axe attachments: light muted headers score4.05/4.20 against
  their real backgrounds; dark Apply scores3.58, versus the tested4.5 threshold.
- Main owns a scoped native-table foreground class and shared confirmation token
  pair; only builder/date confirmation actions use it. No arbitrary brand hex,
  global vendor/theme patch or disabled axe. Source changes are prepared while the
  frozen emitted run finishes; before/after actual emitted/packed checks remain.
  **Packed correction proof:** genuine standalone production app passes all43
  browser checks including full axe scans, with no test skips/flakiness, source/
  dist/vendor aliases or external runtime modules. Actual CSS includes all owned
  selectors. Main also inspects desktop light/dark/RTL and narrow320/enlarged-text
  screenshots; no full-device/manual-AT conformance claim follows.

### Verification-harness follow-ups (not additional product defects)

- The first packed-fixture typecheck omitted Node ambient activation even though
  browser helper types reference Playwright. The consumer already declares exact
  Node types; activating them fixes that strict harness error without a waiver.
  Both compilers now pass370 app program files, only compiler stdlib outside.
- The combined graph/runtime assertion still exceeded its unchanged5-second
  deadline once under load despite four workers. Split it into separate exact
  runtime-export, headless/styled graph and sortable-directive tests; no assertion
  or deadline removed/relaxed. All429 tests pass after that split.
- Main's Storybook wrapper also rebuilds packages. A later emitted run overlaps
  that rebuild; matching final hashes cannot prove continuous output availability.
  Preserve it as overlapped, then rerun clean after build completion. The earlier
  completed43/43 actual-tarball run is unaffected and not workspace-emitted proof.
- Shared fixtures outside the Storybook app need actual declaring-app dependency
  resolution and emitted public entry aliases in that dev runner. Storybook build
  and types initially fail; main fixes runtime/declaration resolution without a
  production/packed source alias or strictness change. Direct Storybook build and
  app typecheck pass; full ordered workflow remains required.

### Completed isolated-source disposition

The frozen candidate completes the ordered `pnpm check`:429 units,171 browser
checks (including43 combined emitted and six built Storybook plays), plus43 actual
tarball production checks. Strict clean install/unchanged lock, both public compiler
versions/confinement, runtime/default-sortable/CSS guards and documentation checks
pass. The clean standalone emitted43 byte guard also remains unchanged. Caught
Storybook play exceptions are explicitly checked; negative late-assertion evidence
is retained rather than misread as terminal success.

All session1 n1–n15 receive scoped resolved disposition. Main grants
**agent-approved under delegated authority** for this isolated private WP-07 source/
component/public-type/packed boundary and provisional visual treatment. This is
not personal maintainer/Figma/manual-AT/device/performance/real-consumer/release
acceptance. Main next commits the source handoff and stacks onto final WP-06
9eb71e1 without merging, reconciles shared ownership and reruns combined checks
before final integration approval, push and separate PR.

### Completed combined-stack disposition

Stack7b3b981 has exact parent9eb71e1. Independent static review verifies both
runtime/fixture baselines byte-for-byte and all shared script/patch/lock/guard/docs
unions. Main's complete stacked `pnpm check` exits0 with430 units,171 baseline/tool
Chromium,43 genuine packed-tool production cases and27 development+27 production
source Start plus27+27 actual-packed Start. Both strict compiler versions and
confinement pass (210 headless/223 styled/372 tool app/721 Start program files).
Cold generated routes come only from the actual framework. No version, strictness,
behavior deadline or retry change was used;45-minute CI budget remains unchanged.

Main extends scoped **agent-approved under delegated authority** to this combined
WP-07 private integration after reviewing the actual completed result. Final
documentation/PR push/remote checks remain delivery verification, not personal
maintainer, manual AT/device/performance/real-consumer/legal/publication/full G-05
acceptance. PRs remain unmerged; no residual WP-07 finding is verified.
