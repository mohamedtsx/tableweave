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

## WP-08 — delegated agent review session 1

Core candidate only; control UI and public/packed proof remain unassigned/pending.
Independent review verified six defects despite65 core/56 prior-controller/24
native tests and seven Chromium regressions passing. No approval or PR merge.

### n1 — Mutable command envelopes bypass/relabel capability validation (P1)

- A type getter changes selection.change to selection.page between guard and
  reduction, bypassing single mode. Changing the caller's command type after a
  controlled proposal also makes final acceptance validate a different intent.
- Returned for immutable captured command envelopes used by guard/reducer/proposal/
  acceptance, retaining legitimate function updaters. Reproduce before repair.

### n2 — Old-scope Cancel clears a new scope's selection (P1)

- Captured scopeA authority reports context blocked afterB commits but its Cancel
  still clearsB selection. Query freshness independence cannot discard owner/scope.
- Returned for latest owner/controller/definition/scope checks while preserving
  reachable same-owner selection cancellation during loading/error/access cleanup.

### n3 — Structurally copied view exposes another resource's snapshot (P2)

- A copiedA view carryingB's actual snapshot with colliding identity metadata
  projectsB records and canSelect=true. Event reread rejects it, render does not.
- Returned for actual resource-view/snapshot provenance authentication, retaining
  genuine current/server snapshot behavior rather than structural-key trust.

### n4 — Mutable native options silently remove application guard (P2)

- Deleting options.validateCommand after construction disables the installed
  rejecting guard because its closure rereads the mutable options object.
- Returned for single-capture validated callbacks/configuration; preserve errors,
  async rejection handling and existing validateState semantics.

### n5 — Old relative token binds to a later evaluation clock (P1)

- After today crosses midnight, rebinding yesterday's token gives it the new
  identity/time and makes old results fresh/selectable before the new begin.
- Main approved an atomic pre-UI beginControlsRequest contract: capture accepted
  identity/time before resource.begin, return genuine token/binding to the app,
  no transport/cache/lifetime. Post-hoc old-token binding is removed, not merely
  memoized after its first potentially unsafe late use.

### n6 — Reread selection getter admits an invalid mode (P2)

- A getter returns single during validation then all during storage; immutable
  selectionMode becomes all and a two-ID commit succeeds.
- Returned for capture-once validation/accessor rejection and audit of related
  primitive configuration, never cloning/freezing application row records.

### n7 — Early stale-view return skips privacy and Cancel facts (P1)

- Independent replay verifies n1–n6 corrections, but an ordinary saved viewA
  projected after scopeB/access loss still exposes selected/missing IDs and the
  requested query. Rows alone are suppressed. In same-scope refresh, the same early
  return incorrectly disables Cancel. Three fresh assertions fail.
- Returned for context/permission masking before every fact/early-return path,
  with genuine same-owner/scope cancellation independent of query freshness.
  No old-scope cancellation of a newer owner and no hiding a draft as a workaround.

### n8 — Saved initial server snapshot ignores current resource context (P1)

- Save initial serverA snapshot, move the same resource toB and acceptB selection,
  then project saved serverA under expectedA: B IDs/query appear underA tags. One
  fresh assertion fails. Server-snapshot identity is not current scope authority.
- Returned for current resource-context/permission checks in addition to supplied
  view provenance. Preserve genuine matching-context initial SSR/server snapshots;
  no new resource lifetime, render mutation or disabled SSR workaround.
  Independent rereview resolves n7/n8's four original assertions; initial same-
  context SSR and original n1–n6 checks remain passing. The next finding is separate.

### n9 — Origin-masked authority retains foreign checked/mixed bits (P2)

- CaptureA authority, commitB with two eligible rows, select both/one B rows.
  A read blocks context and masks IDs but still returnsB checked/mixed selection
  metadata. Actions/Cancel remain denied; no ID/query leak is demonstrated here.
- Worker reproduces1/1 failure, then adds an exhaustive shared neutral-facts
  constructor before foreign projection instead of spreading selectively masked
  foreign facts.129 core/56 controller/24 native/seven Chromium/eight strict TS
  checks and Biome pass; independent final rereview is active, no UI approval yet.
  **Resolved:** independent exhaustive replay passes263 units (including54 fresh
  probes), eight strict TS checks/seven Chromium and all38 candidate fingerprints.
  n1–n9 receive scoped source technical approval for main integration/consumers;
  full UI/packed/framework/AT/performance/G-05 acceptance remains separate.

### Additive source handshake disposition

Main approves the narrow sort/columns owner-domain intents before consumer code.
Independent316-test replay includes21 new intent cases plus all54 prior probes;
eight strict checks/seven Chromium and41 candidate fingerprints match. Same-owner
query/loading/failure changes remain available without granting retained-row
actions; foreign owners/context stay neutral. Full packet/UI/packed proof remains.

The separate-target gap receives a narrow factory owner helper, approved before
code. Independent326-test/six-compiler replay validates cached frozen exact
definition/controller refs, null for copied/inherited/proxy objects and no getter/
port invocation. Consumers compare both refs then require the intent; identity
metadata is not authorization. Main approves this source closure, not full WP-08.

## WP-08 pagination — delegated review session 2

Numbering restarts. Original30 Chromium/two unit/SSR and strict source/public type
checks pass, but independent probes verify the following source defects.

### n1 — Authority A authorizes a clamp on separate controller B (P1)

- With matching query metadata, correction usesA authority then clampsB4→1.
- Returned for exact genuine factory definition/controller pairing using the
  reviewed owner helper, before require/dispatch and inside final updater guard.
  Query/reference equality is not owner proof. No new transport or query owner.

### n2 — Denied context accessor is reread as permitted (P1)

- Correction validates denied metadata, rereads allowed values and commits while
  the actual current port remains denied.
- Returned for one-shot primitive/context/epoch/callback capture or consistent
  accessor rejection; no raw private errors, app-record freeze or narrowed tests.

### n3 — Method-style current port loses its receiver (P2)

- A legitimate readCurrent method depends on this; detached invocation crashes
  the subtree instead of returning a safe blocked correction.
- Returned for captured function/receiver invocation and fail-closed malformed/
  throwing/async port handling, preserving original bounded-chain behavior.

**Correction handoff:** worker independently reproduces all three failures before
repair, then reports56 Chromium/eight unit-SSR/strict source and public TS6/5.9
checks, Biome and30 checksums passing. Actual factory owner identities, one-shot
own-data capture and receiver-preserving calls replace the unsafe paths. Source
aggregate434530ddee3ea96c66926f8dd36e8e1d2d628b76b0fb0017e085d2c44847a398;
Pagination.tsx/API unchanged. Independent original-reproducer rereview is active;
no source or packet approval follows from the worker report alone.
Independent replay resolves n1–n3 and passes77 browser checks, but the following
narrow malformed-async boundary remains; no unconditional containment approval.

### n4 — Intrinsic Promise observation can invoke constructor hooks (P2)

- A rejected native Promise with a throwing constructor accessor causes the
  observer's intrinsic then call to invoke that getter before attaching a handler.
  The original rejection remains unhandled. No clamp/subtree crash is reproduced.
- Returned for avoiding arbitrary constructor/species hooks while preserving safe
  ordinary-Promise best effort. The supported current port is synchronous data.
  Standard then performs species construction before handler attachment; main and
  reviewer assess whether a nonconfigurable poisoned application Promise can be
  contained without forbidden object mutation or global error suppression.
  Do not fake a pass, promise universal containment or silently waive supported
  behavior. Record unavoidable contract-violating app behavior distinctly if proven.
  **Independent feasibility:**20 negative browser cases reproduce the original
  application rejection even with no library observer. There is no portable
  guarantee under the no-mutation/no-global-suppression boundaries; await/wrappers
  do not bypass species construction in general. Five ordinary/synchronous checks
  and eight unit/SSR cases pass. The remaining owned blocker is getter-avoidance
  code plus precise synchronous-port/best-effort wording, not automatic n4 closure.
  **Owned source correction verified:** independent final code/contract review
  verifies zero constructor/species/then getter calls, ordinary native rejection
  observation, no input/prototype mutation and preserved n1–n3/owner/epoch/chain
  guards. Exact source aggregatec7085cfc552c48c945c7629c71db8d78288384ae0a7b0fb081c743ab6d4dcf19.
  Main approves this bounded synchronous source contract under delegated technical
  authority, not universal rejection containment. Runtime replay retains two
  impossible universal assertions as failures;13 extra defensive/limitation checks,
  ten unit/SSR and strict declarations pass. Main approves test-only replacement
  with explicitly named LIMITATION characterizations asserting the host rejection,
  zero getter/clamp/crash and a no-observer control. Preserve failure evidence;
  never count those as containment success. Green supported-suite handoff remains.
  Test-only correction is now complete at unchanged source fingerprint:54 supported/
  guard, five defensive best-effort and three explicitly named LIMITATION checks
  pass, plus ten unit/SSR/strict compiler checks. Original failing claims remain
  in promise-original-failure.md; none is skipped or counted as containment success.

## WP-08 selection toolbar — delegated review session 3

Numbering restarts. Eight units/24 Chromium/source SSR and both strict compiler
versions pass, but the following before-effect/SSR privacy gap blocks approval.

### n1 — Masked context is mistaken for authoritative zero selection (P1)

- Genuine selecteda → access denied preserves accepted selection, while projection
  masks IDs and requested query. The toolbar sees[] and remounts normal tools,
  exposing old Amount criteria. Reproduced in DOM and server HTML before effects.
- Returned for privacy-first unavailable-vs-zero distinction, including slot
  invocation/focus cleanup. Preserve actual accepted criteria/selection and usable
  same-owner pending/failure Cancel; do not gate everything on row readiness.
  **Correction handoff:** original DOM/SSR failures are reproduced before repair.
  Withheld query/context/definition now renders nothing before normal/action-slot
  invocation or private focus fallback; accepted criteria/selection stay unchanged.
  Worker8-unit/29-browser/both strict compiler/SSR/Biome checks pass. Source manifest
  2b161d097292bd34e72557b74ee5b6311ba39773a62cdcfd1bea83bdd6742f43;
  independent original-reproducer rereview is active, no approval yet.
  **Resolved:** independent original DOM/SSR/focus/access-restoration replay passes
  29 Chromium plus a fresh probe, eight units and both strict source/declaration
  compilers. Both source/complete manifests match. Main approves the scoped
  selection-source correction under delegated technical authority; real tool/
  collection/packed/full-WP08/AT integration remains pending.

### Cross-input pairing diagnostic (both UI sessions)

Probes pair presentationB with authorityA: B copy is displayed, while commands
intrinsically act onA. The current producer requires coherent host-paired inputs
and does not promise automatic presentation/authority binding. This is recorded,
not silently treated as factory proof or backend authorization. The composed host
must derive facts/authority from one current owned input and verify genuine
separate targets. No query-reference workaround or arbitrary new core API is
approved; public documentation must state pairing obligations before integration.

## WP-08 sorting/chooser — delegated review session 4

No blocking findings. Independent36 units (30 candidate/six fresh),19 Chromium
(17 candidate/two fresh), five strict compiler checks and20-file Biome pass.
Exact61-file manifest3880ecfb1fc70938057a73cc4729cc1f73daacb9ae15efa71f2e9ccb5a9d7171
matches. Main grants scoped source integration approval, including real owner
checks, latest accepted functional updates, controlled rejection, hidden priorities
and visibility restrictions. Coherent host pairing and complex-label string/ID
fallback remain documented. Root/CSS/packed/shared-renderer/full-WP08/AT separate.

## WP-08 guarded collection — delegated review session 5

No blocking renderer defect. Independent27 current/21 legacy/six fresh Chromium
checks, strict TS6/5.9/13-file Biome and all13 candidate fingerprints pass. Main's
missing group-header foreground selector is causally verified by removing it to
reproduce4.2:1 and restoring it to pass light/RTL-dark axe. Only that selector
changes the existing collection-scoped foreground rule; unchecked1px boundaries
remain. Historical worker26/27 and prior CSS hash are retained as failures, not
rewritten. Main refreshes current CSS dependency/disposition and grants bounded
renderer source approval. Added root exports/owned stylesheet imports require
actual integrated runtime/type/packing proof, not inferred from source review.

## WP-08 public package boundary — delegated review session 6

No blocking findings. Independent strict TS6.0.3/5.9.3 validates both real NodeNext
consumers (210 headless/230 styled program files), confined except compiler standard
libraries. Removing three negative suppressions in memory yields exactly the intended
unknown-record-field/vendor-selectedKeys/missing-definition errors, not accidental
unresolved imports. All80 headless/57 styled emitted files match actual archives and
installed bytes. Exact82/59 archive outputs include internal masked facts and CSS.

Reviewer audits185/885 recorded bundle module IDs, confirms all169/864 absolute
paths resolve inside their consumer, and verifies layered owned CSS imports/selectors/
group foreground survive bundling. Type/runtime/graph confinement is enforced by
the runner, not source aliases; exact source-unit aliases do not alter explicit dist
or actual packed checks. HeroUI patch4120eff…caded769 is declaration-only with
attribution and no dependency versions changed. Public CSS hash
57ed68bf91949cf362468d89e7381b2dcaa58957cba994be8511e0cb5096d024.

Main grants bounded public-package integration approval under delegated technical
authority after this independent compiler/byte/guard review and the main-run actual
runtime/bundle checks. No actual browser interaction, visual/AT/device/performance,
full-WP08/G-05 or release acceptance follows. Combined fixture/harness work remains
separate and source/runtime outputs stay frozen during it.

## WP-08 controls composition — delegated review session 7

Baseline23 emitted cases/110 assertion entry points pass; additional controlled
rejection/retained provenance/no-snapshot Cancel/non-Strict Suspense and one-active-
acquisition cleanup probes pass.137 emitted bytes remain unchanged. Nevertheless:

### n1 — Controlled scope reset leaves old selected IDs actionable (P1)

- `model.ts` resource invalidation dispatches selection.cancel but controlled mode
  leaves it unaccepted. Select loaded+missing IDs, change scope, begin and settleB,
  Queue review: actual callback receives oldA IDs a/off under the new scope.
- Main approves mandatory app-owned reset/proposal retirement before fixture code
  correction. Ordinary controlled Cancel/reject stays unchanged. No library
  authorization shortcut or selected-ID/backend permission inference is allowed.
  **Resolved n1:** fixture reset now rejects stale pending intent even when accepted
  selection is empty, completes application-mandatory selection reset, and clears
  private queue/note before publishing the new expected owner. Ordinary user
  controlled rejection remains intact. Independent36 cases plus four original/
  held-token/revoke-regrant/lifetime probes pass; handoffd0632c008decdd1c01e1a0501ab12edc6b4445939bc0755ee6983048192c84c0
  matches app/model/assertions. Main actual-tarball production36 also passes with
  old137 public bytes unchanged. Main resolves only n1 under delegated authority;
  n2 and rapid-popover correction remain required. The restored Storybook30-second
  config is an explicit metadata delta, not falsely covered by the old manifest.

### n2 — Plain StrictMode composition crashes the collection (P1)

- Uninstrumented StrictMode with ControlsExample throws cell-count mismatch:
  four cells against eight columns; grid does not mount. No lifecycle instrumentation
  or library-source alias is needed. Producer/vendor responsibility needs isolation.
- Separate read-only diagnosis precedes an approved bounded correction. Do not
  remove StrictMode or replace/mutate genuine collection nodes to manufacture green.
  Independent isolation now attributes the failure to RAC1.22.1 grouped collection
  cloning: copied clean headers lose columnsDirty=false, so flattened sibling links
  are unnecessarily traversed across group boundaries. Four leaves become eight
  visits while native rows stay four cells. Flat controls, stable native frames and
  balanced one-active app acquisition rule out the app/native duplication guesses;
  canonical ESM identities still fail. Main approves only a private clone-boolean
  preservation experiment, not candidate/shared vendor edits or shipping a patch.
  Registry latest is1.22.1; final distribution remains a separate blocker because
  workspace runtime patches do not propagate through actual archives.
  The private clone copy fixes the original two Strict positives and passes27
  renderer/21 prior/23 ordinary+23 Strict pinned composition/nine Strict selection
  smokes, but genuine cached public Collection insertion still fails five cells/
  eight columns. The owner stops without another change. Main approves a separate
  private column-parent lastChildKey traversal boundary experiment, preserving
  actual cache invalidation and all non-column traversal. This is not distribution
  or packed-runtime approval; shared137 outputs and dependencies remain unchanged.
  A separate unpatched public-cache trial uses actual Header columns/render-function
  and nested Collection items/dependencies with genuine materialization inputs.
  Both original Strict positives still fail4/8 before and after; three ordinary
  semantic/visibility/current-event gates pass with strict TS6/5.9 and coherent
  public ESM identities. All three vendor runtimes remain registry-identical.
  Main records this tested alternative as negative, not a universal impossibility
  proof or approval to ship either private vendor experiment.

The expected-only Mask before effects diagnostic can permit an old action before
new expected context publishes; it is not immediate-revocation proof. Real Change
scope invalidates the actual resource immediately. Keep that host-publication limit
explicit, not a raw-library authorization defect. Static/public and main actual
production23/Storybook4 proof remains valid but cannot approve this composition.

## WP-08 portability/rapid popover — delegated review session 8

### n1 — Rapid reopen can lose focus and miss Escape (P2)

- Independent raw30-second viewport matrix fails3/3. Physical open, Escape,
  immediate pointer reopen before exit completes, Escape reproduces in source,
  uninstrumented frozen production Sorting and Chooser, and vendor-only HeroUI.
- The exit-retained dialog reopens without reliable focus restoration; active
  focus falls to body and overlay-local Escape misses the event. Open-modal inert
  background is expected, not orphaned cleanup or proven permanent deadlock.
- Legitimate close/ARIA/focus synchronization makes all three viewport matrices
  pass while retaining axe/screenshots/contrast/text expansion. Removing those
  checks does not avoid the physical-input bug, so sequencing alone is not a fix.
- Main approves only two internal public shouldSkipAnimation props, a dedicated
  rapid-input regression for both controls, explicit matrix closure synchronization
  and restoration of30-second test limits. Vendor-only mitigation feasibility is
  four passing rapid cycles, not Tableweave correction acceptance. Source owner
  implements/tests before independent replay/main rebuilt genuine-package proof.
  **Resolved source correction:** independent causal replay restores exact old
  preimages and fails all four rapid-input checks, then restores only the approved
  two props/comments and passes21 Chromium (19 candidate/two uninstrumented fresh
  four-cycle probes),30 units/five strict compilers/13-file Biome. No pre-reopen
  closure wait is introduced and the30-second limit remains. Fourteen-file manifest
  b4869fc93f7ededc44683979ef4d961296e133e0dec4e799061a8a432595d8b7
  matches; six public declarations are unchanged. Main grants scoped delegated
  source approval. Shared old dist is still unfixed; final rebuild and genuine
  production replay remain required independently of StrictMode disposition.

## WP-08 clone repair scope — delegated review session 9

No blocking finding in the minimal ESM clone repair. Independent reviewer restores
unpatched runtime and fails both original Strict positives4/8; clone-only passes
six core,27 renderer,21 prior,23 ordinary+23 Strict pinned composition,nine Strict
selection/range/rejection/stale probes and one cache probe.44 natural clean clones
preserve false and cached references;12 detached clones at actual dirty entries
preserve true without publishing a manufactured snapshot or assigning flags.

Raw cached vendor Collection insertion still fails5/8 and uses the internal group
helper directly. Current public NativeCollection ownership/order/visibility/pruned
groups/fallback/current-record/empty-cycle requirements pass. Main grants scoped
technical approval to the actual boolean copy, not the unnecessary broader traversal
repair. Evidence uses the old pinned app and selected ESM profile, not current38,
CJS runtime, candidate assets/install or genuine archive acceptance. All137 shared
dist and1446 shared vendor files remain unchanged.

The user separately selects explicit temporary application-side compatibility for
private/prerelease delivery, conditional on independent review and packed tests.
Candidate three-format assets add modification notices and remove stale source-map
annotations; those assets/verifier are under separate review. No shipping, automatic
mutation, unpatched-runtime promise, fullG05 or external/manual acceptance follows.

## WP-08 compatibility asset review — delegated review session 10

No blocking finding. Independent42/42 Node tests (two explicit test-double positives/
40 negative cases), genuine three-format registry/zero-fuzz patch proof,10 checksums
and five-file Biome pass. Patch remains only the boolean copy/modification notices/
terminal stale-map annotation removal; no traversal repair or guard weakening.
Exact-pin/local isolated-pnpm resolution, hashes/escape rejection/sanitized read-only
verification and bootstrap/attribution are reviewed. No vendor runtime executes.

Main grants scoped asset approval for the separate packaging/install/testing stage,
not runtime delivery. Reviewed patchf3073583972685a721995e0db935a5172cbbc777bcc679270a718a2f12736e35
and verifier remain unchanged. Original descriptor a81cfea… and10-input manifest
a40aa126… are preserved in ASSET-REVIEW.sha256 as historical inputs. Main then updates
only candidate packaging README and its descriptor hash for the new file allowlist;
new descriptor86a3d24eace0483ec4b779994c7fb2b30bc66e150c8e62318904ecb9b225078e
requires repeated tests/byte proof before installation. Both independent reviews
predate shared vendor/output changes; later genuine profile38 still gates acceptance.

## WP-08 genuine profile integration — delegated review session 11

No blocking finding. Independent extracted-CLI checks accept the actual profiled
consumer and reject inspected unpatched styled installs with E_VENDOR, without
mutation. Both compilers pass210/230/250-file confined programs. Two focused probes
pass against the unchanged production build. Main's38/38 report and891-module graph
are audited, not described as an independently regenerated complete run.

React82/styled65 archive members match installed bytes; exactly six compatibility
assets ship with no runtime export/install hook. Combined patch is exact concat;
lock introduces no versions. Profiled/unpatched RAC differs in exactly three runtime
files.135/137 library outputs remain unchanged; only approved animation props differ.
One concurrent helper edit is verified formatting-only. Registry-proof harness
adaptation is outside this review and retained as a separate test-harness change.

Main grants **agent-approved under delegated authority** for this bounded private/
prerelease compatibility integration. User-selected setup and actual current38 are
verified, not ordinary unpatched runtime or all CJS interactions. Complete ordered
workflow, real WP-07 stack/tools and final packet/remote review remain required;
no fullG05/manual/device/performance/legal/publication or merge approval follows.

### Completed isolated-source disposition

The full ordered `pnpm check` completes on the corrected frozen candidate:504
Vitest units,42 Node asset checks,250 browser executions (43 baseline/165 scoped
controls/38 emitted/four built Storybook) plus38 genuine profiled-archive production
cases. Pager's three LIMITATION cases remain negative characterizations, never
universal rejection containment. Fresh frozen install, strict source/public types,
source SSR/import, explicit archive/runtime/CSS/confinement guards and docs/18
checker probes pass. Independent reviews resolve all verified source findings;
the minimal private compatibility profile has actual extraction/install proof.

Main grants bounded **agent-approved under delegated authority** for the isolated
WP-08 source/component/public-package/private-profile boundary. Source handoff
commit and safe replay onto exact final WP-07 precede real tool composition and
combined verification. This is not final packet/remote delivery, personal maintainer
review, general unpatched runtime, full CJS interaction, fullG05 or any unmeasured
manual/device/performance/real-consumer/legal/publication gate. No PR merge.

## WP-08 final stack reconciliation — delegated review session 12

### n1 — Packed-lane description is ambiguous (P3)

Independent review notes README's “profiled tool/control” sentence misdescribes
the retained lanes. Main verifies that actual code runs WP-07 tools in the unpatched
consumer and WP-08 controls in a separate explicitly profiled consumer. **Resolved:**
correct the sentence, preserving the implementation and both regression baselines.

No blocking code finding. Independent comparison preserves146 WP-07-exclusive
and217 WP-08-exclusive paths byte-for-byte; shared producer/index/CSS/scripts/test
discovery retain both baselines. Lock/workspace differences only replace the exact
RAC patch reference, with no upgrades. Independent42 copied asset tests, actual
three-format workspace guard, TS6/5.9 emitted checks (215/244 files, not installed
consumers) and exact88-headless/92-styled output union pass. Frozen180-file aggregate
remainsad59470c7d472563ed273b8b167073953f6f574df0a1910510480082da63a8ce.
Main's643-unit log is audited, not independently rerun. Active new fixtures are not
assessed by this review. Main grants bounded delegated stack-reconciliation approval;
real composition/packed proof/full ordered workflow/remote packet approval remain.

## WP-08 additive archive harness — delegated review session 13

### n1 — Scoped guard review; no blocking finding reproduced

Independent synthetic proof accepts one control case and rejects18 guard negatives
for the new packed-composition runner. Generated configs retain strictness/local
consumer isolation/exact inventory/hash guards and dedicated6501 port. No actual
fixture/compiler/build/browser executes in that review; this is not packed19 proof.

The registry harness adaptation separately passes11 classification cases: only all
original or all reviewed bytes are accepted; six mixed sets and three unknown
formats reject. Real registry integrity/private zero-fuzz patch proof also passes
with truthful reviewed-clone installed labeling, unchanged maps and per-format
unpatched rejection retained. All10 current manifest entries match; reviewed source
and actual installed runtime remain unchanged. Main grants bounded harness approval
for later wiring, not new composition/full stack/CJS interaction/G05/legal/packet
acceptance. Actual19 must be executed after the fixture is ready.

## WP-08 named-generation evidence guards — review session 15

### n1 — Inherited JSON report FILE overrides unique NAME (P2)

Pinned Playwright prioritizes OUTPUT_FILE; inheriting it can overwrite previous
evidence before the runner fails to find its expected unique report. Independent
review corroborates with the genuine pinned --list CLI. Main separately reproduces
in a private copied runner: the historical sentinel is overwritten and run exits1.
Fix the highest-priority output path explicitly for every boundary; no browser or
source assertion is changed.

### n2 — Rebased before-manifest can hide source drift (P2)

If a child changes source and replaces that run's before-map to match, the copied
runner currently exits0 despite its initial source differing. Main independently
reproduces this coupled counterexample plus a clean positive control. Keep the
initial snapshot in parent memory and compare both final manifests to those bytes,
in addition to helper/public-generation guards. These findings block default
registration, not the independently completed actual19/four plays or producer fix.
The separate reviewer verifies77 other guard cases; those are synthetic, not real
browser acceptance. No shared source/runtime/evidence is modified by these probes.

**n1/n2 resolved for the corrected base runner:** main counter-replay passes the
clean positive, rejects coupled rebasing and preserves prior report bytes under
inherited FILE settings. Independent review passes88 synthetic vectors and three
genuine pinned --list checks at runnere2b71cf3…, with parent-held snapshots and
unique highest-priority FILE outputs. No browser/packet acceptance follows.
The later permanent-focus integration adds explicit focus capture/type mode and
separate snapshot retention; that delta receives another review before activation.

## WP-08 whole real-tool composition — delegated review session 16

### n1 — Bounded composition approval; no blocking finding

Independent review executes four fresh unclocked Chromium scenarios against actual
target app/shared outputs, audits main19 retry0 successes including the blocked
tail, and passes strict TS6/5.9. Removing negative directives produces exactly
seven intended errors per compiler. Four awaited Storybook plays/additive packed
wiring are sound;14 synthetic host-gate negatives reject. Its four probes and audit
are not a separately rerun full19, nor actual tarball/Storybook proof.

Main grants bounded delegated real-composition source/emitted integration approval
with all15 reviewed inputs unchanged. Main separately supplies actual built4 and
genuine packed19 success. Raw-tool AC-16/25 authority, full ordered stack, final
packet/remote and all external/full-G05 gates stay separate. No merge is authorized.

## WP-08 real-tool focus integration — review session 14

### n1 — Focused real builder portal falls to BODY on selection swap (P1, resolved)

The real composition run passes18/19 with strict source/public TS6/5.9 and full
22-file Biome. Its remaining case focuses an unapplied builder value input, accepts
off-page-only selection through the genuine application seam and verifies normal
tools/portal unmount. Focus falls to BODY rather than the new selection Cancel.
A separate unclocked reproduction also fails. Main independently replays before
any correction and allocates private causal review, not an application workaround
or vendor/global focus patch. The failing assertion and unexecuted queued-search/
Cancel/restore tail remain blocking; Storybook4/packed19 are not claimed executed.
Main's unchanged unclocked replay independently fails at the same Cancel-focus
assertion (`/tmp/opencode/tableweave-wp08-main-before-focus.log`); no correction has
been applied. Private causal investigation runs on6503 with shared180 outputs frozen.
Private causal proof now identifies the actual phase boundary: connected/enabled
Cancel is still below root[inert] at layout restoration; focus never takes effect.
Modal passive cleanup clears inert afterward. This agrees with the pinned public
overlay implementation, not a need for a vendor/global/inert patch. Private clean
candidate passes59 executions (1 unclocked/19 unchanged/10 focused/29 adapted), both
strict compilers and Biome. Main applies only that producer correction at source
4ce900626de4479db7d1d69a7c51db64fca4fbd41ede957280189d82ca347144:
layout capture stays; restoration moves to passive phase with current-authority,
config/liveness/phase/surviving-focus checks before and after fallback callbacks.
No timers, public APIs or other producers change. Independent source review is
active; shared180 outputs remain the failing generation. This finding stays open
until actual rebuilt19, permanent focus regressions and later packed proof pass.

### Independent producer disposition

A different reviewer reproduces both original failures and proves original TSX
emission equals the old JS byte-for-byte. Corrected private emission passes65
Chromium cases (1 unclocked/19 unchanged/16 focused/29 adapted selection/privacy),
zero skips/flakes, plus strict TS6/5.9, Biome and two DOM-free SSR/import smokes.
New negatives cover throwing reads, disabled/inert destinations and fallback
disposal/reselection, alongside live denial/external focus/Strict/unmount safety.
Main grants bounded **agent-approved under delegated authority** for source
4ce900626de4479db7d1d69a7c51db64fca4fbd41ede957280189d82ca347144.
This is not a root rebuild or full composition/packed pass. Main now authorizes
the named fc01 build generation; preserve failing manifests before rebuilding,
verify only toolbar JS changes and rerun the actual boundary before closing n1.

**Resolved at the corrected producer/integration boundary:** actual unchanged19,
unclocked regression, source selection/privacy29 and old/new built plays4+4 pass.
Genuine packed composition19 and permanent public focus10 pass; a different reviewer
freshly reruns all10 and verifies meaningful types. Main separately reviews the
packed-focus module and runs three fresh production probes against its existing
actual-consumer build. No timer/vendor/inert/global workaround or assertion removal.
Complete ordered workflow/final packet approval remain separate from this defect.

## WP-08 permanent focus fixture — delegated review session 17

### n1 — Source/public regression approval; no blocking finding

Independent fresh public10 retry0/zero skip/flaky, public/source TS6/5.9 and three
supplied intended type negatives plus an extra missing-client-context negative pass.
All14 inputs match manifest0480312190d5b5023d945bd5b0cf68f9c109e46c322f374dd63f05eee896a4d2.
Worker's separate10 and12-file Biome are audited, not added as unique cases. Main
grants bounded delegated permanent source/public fixture approval. That reviewer
does not assess the packed runner; default/packed/full workflow gates stay separate.

## WP-08 actual packed focus runner — main independent review session 18

### n1 — Bounded genuine packed-focus approval

Main reviews the worker's exact new runner012ae501b27508a2cc9efb69d57209642de5edef3f807a0e2995cb80752319e0:
fixed regular-file/import allowlist, no source/vendor alias or installer, both strict
programs, actual installed dist/component checks, physical module confinement,
unique highest-priority JSON output, exact10 single retry0 results and parent-held
source/staged/vendor/archive/previous-report guards, including on failure cleanup.

Worker's real production10 pass on6509, both265-file programs,1240 module IDs and
471501-byte CSS are audited. Main independently serves that unchanged consumer
production build on6515 and passes three fresh ordinary/Strict/denied-context probes,
including real input/Cancel/normal focus and private callback suppression. Initial
standalone test-tool CJS import interop fails before any browser; using the actual
consumer's require entry corrects that harness-only problem. No product code changes.
Prior100 report SHA21c8a9fcdb08ba3e8fc43b022f9402f39e03b5beb478dc74c1b4e0032de04bb4
remains unchanged. Main grants bounded packed-focus approval and registers this
additional10 in future fresh explicit-profile runs after38+19, before final CLI.
No full ordered stack/packet/G05/manual/device/legal/publication approval or merge.

## WP-08 final default gate integration — delegated review session 19

### n1 — Types-mode final console label is too broad (P3, resolved)

The report correctly classifies types-only execution, but its final console line
mentions Storybook/focus browser gates. Main changes only that line to include the
actual mode; no browser assertion or result classification is changed.

Independent review accepts the dual-namespace integration after123 fresh synthetic
checks/two history readbacks and four actual strict compiler programs (composition
668/focus532 files per version). Both snapshots remain parent-anchored; source
rebasing/report redirection/invalid modes/child failures reject. Main's actual
types and19+4+10 browser preflights are separate completed evidence. Main grants
bounded delegated default-gate approval, registers its public/type commands and
starts the complete ordered stack workflow with runtime/test/config inputs frozen.
No full packet/remote acceptance or external gate follows before that result.

## WP-08 complete ordered packet disposition

The actual final stacked `pnpm check` completes with exit0:643 Vitest units/42 Node
asset checks,411 baseline/tool/control/actual-built-play browser executions,110
genuine packed production cases (43 unpatched tools; separate38 controls/19 real
composition/10 focus on explicit profile),54 source and54 actual-packed Start
HTTP/browser checks. Strict type/confinement, source SSR/import, frozen install,
426-file lint, docs/18 regression probes pass. Pager's three LIMITATION cases remain
negative host-behavior characterizations, not universal rejection containment.

All verified packet findings are corrected and independently reviewed at their
recorded scopes. Main grants **agent-approved under delegated authority** for the
bounded WP-08 packet/component/composition/private temporary-profile integration.
Actual180 output remains de82ce…; archives retain their tested90/100-member bytes.
Final Git/PR remote delivery remains to verify. No personal maintainer acceptance,
ordinary unpatched grouped/Strict runtime, full CJS table behavior, raw vendor
structures, fullG05/manual/device/performance/real-consumer/legal/publication or
merge permission is inferred. Raw criteria AC-16/25 adoption remains WP-09's duty.

## WP-08 remote clean-checkout harness — review session 20

### n1 — Ignored local manifest required before first type gate (P1, corrected)

Both initial17b846b remote workflows fail before new type/browser work because
verify-public-roots reads ignored controls/integration/.artifacts/roots-before.json.
Local ordered success is preserved as local evidence, not remote acceptance.
The trusted approved count/digest already lives in committed generation.mjs. Main
removes only the historical manifest dependency, retains that fixed anchor and the
dual parent-memory source snapshots, and adds clean-fixture regression coverage.
No runtime/package/type/browser assertion change is authorized by this correction.
Main's separate clean detached17b846b worktree installs/builds successfully, then
reproduces the same ENOENT in actual types mode without copying historical outputs.
The new9 regressions fail2/pass7 before the fix, pass9 afterward, including CI tmpdir
mode. All652 units across36 files and foundation strict TS pass after the correction.
Independent correction review and clean fixed checkout/remote replay remain next.

Independent review now accepts verifierb808c4592601f4bb44d3c67e376af626442e80a177ed2039855fb7b0734f1293
and test621e54145fe08d066d6897926120dd60c7fbaaedc5fea2c7a0c5d98adc12494c:
9 permanent cases/31 private vectors/two physical clean relocations pass; two old
verifier reproductions fail as expected. Strict TS6 foundation619 and TS5.9 targeted
201-file programs pass without diagnostics; default discovery retains the test.
Actual runtime/RAC bytes stay unchanged. Main grants bounded harness-correction
approval and pushes the same corrected code for fresh remote runs while complete
CI-mode checks continue in the separate cold worktree. Final remote/full-clean
acceptance is not inferred from the focused approval.

## WP-08 existing builder transition — review session 21

### n1 — Cancel locator matches consecutive popover exits (P2 test, corrected)

Both e385104 replacement workflows pass cold type gating/652 units, then the
existing inverse/operand builder case fails at its immediate Cancel locator. The
preceding Apply and new Rule options trigger can leave two matching buttons during
exit. Private causal review must distinguish an exiting noninteractive subtree
from simultaneously live modal sessions before choosing a fix. No source/test
assertion or behavior has been relaxed. Earlier local/full packed passes remain
historical and do not replace current remote failures.

Private causal evidence classifies this blocker as a test lifecycle precondition,
not a verified producer/animation defect. Old Cancel is an exit-retained element
with pointer-events:none and later inert; actual native pointer events do not hit
its obsolete handler and rapid keyboard focus stays in the new session. Role-count
two is not proof of two usable native/AX sessions. The rapid diagnostic reproduces
the exact strict error, while the original first-rule case passes normally.
Private focused5/full55 settled-assertion runs pass; its CSS import-specifier serving
adaptation is explicitly qualified and proves no canonical or manual-AT boundary.
All2043 fingerprints/180+275 roots remain unchanged. Main independently replays
the canonical fixture before applying only four added lifecycle/focus assertions;
no shouldSkipAnimation expansion/vendor/runtime or original assertion changes.
Main's original canonical focused case passes; after only four added lifecycle/focus
assertions, the complete canonical55, strict TS and Biome pass on6521 without private
CSS serving adaptation. Separate independent correction review is active. The cold
04b3bf7 complete CI-mode workflow independently passes652/42/411/110/54+54, including
the original case; local success does not reclassify remote failures as passed.

## WP-08 builder assertion correction — review session 22

### n1 — Exact four added assertions preserve intent (static/type approved)

Independent review confirms corrected specf107a7aaf1c1e9e0359a4c92c62b2176645677c9cec378eaf52d364a37232cae;
removing only four new lines restores the original entire spec byte-for-byte.
All original actions/strict Cancel/inverse/operand/error/query/native assertions
remain. Fresh strict TS5.9 and one-file Biome pass. Bounded test-only acceptance
is conditional on canonical behavior, not a producer/animation correction.

### n2 — Private native-loader server blocks before behavioral proof (setup)

Three independent browser attempts reach no correction lines: a private native Vite
API/config/cache setup cannot resolve the fixture's stylesheet import; its overlay
intercepts the original first click. A separate CSS preflight is HTTP500. This is
zero behavioral passes, not a correction defect or ignored failure. Main's exact
canonical CLI runs pass focused-before/full55-after and clean-checkout55-after;
main supplies that unchanged CLI/cwd/standard generated-cache path for a bounded
independent replay without CSS/alias adaptation. Historical blocked outputs remain.
All2043 fingerprints retain only the one expected test change; runtime180/275 roots
stay fixed. Remote final acceptance remains pending.

Independent exact canonical CLI replay now passes3/3, zero failed/skipped/flaky,
retry0/unchanged30s budget. Corrected spec hash and all2043 input/180+275 generation
seals remain unchanged. The three earlier native-loader setup failures stay separate.
Main grants bounded **agent-approved under delegated authority** for the test-only
correction7e3ff48, supported by main canonical55, clean CI-mode55 and independent3.
Fresh full remote workflows are still required; no producer/animation/AX/manual/
performance/general rapid-interaction or merge approval follows.

## WP-08 pagination open-Select contrast — review session 23

### n1 — Immediate open-menu scan lacks settled-state precondition (P2 test, corrected)

Push45390462746 passes builder correction and reaches pager62; its English/Arabic
light cases fail axe color-contrast at line461 immediately after Enter opens Select.
Failure nodes carry data-entering=true and contrast4.36–4.42 against required4.5.
It is not yet established whether settled tokens or transitional compositing cause
the failure. Main allocates private unmodified-source phase/contrast measurements,
not threshold relaxation, disabled rules, arbitrary sleeps or animation overrides.
Producer/test changes wait for causal evidence and independent correction review.
The sibling PR workflow45390474622 subsequently passes completely at the identical
a668922 head. This is separate successful remote evidence, not a reclassification
of failed push45390462746; both remain part of the phase/contrast investigation.
Private canonical measurements return stable option contrast17.71:1 light and17.26:1
dark in both locales, all four options. Raw frames show unchanged tokens with popup
opacity0→1 over the pinned150ms entry. Main audits actual phase/axe data: steady
open has no entering flag/animations, opacity1, zero violations and all four passing
option nodes. Supplemental alpha calculation explains the remote gray pair but is
not a freshly reproduced full-axe failure. Main allocates only three observed-state
preconditions before the existing open scan; no rule/token/animation/timeout edits.
Main canonical original4 pass (remote failure not locally reproduced), then actual
corrected full62/strict TS/Biome pass. Main audits raw16 steady option nodes at the
reported ratios and confirms all180 outputs unchanged. Only visible-listbox,
entry-complete and opacity1 assertions are added before the open scan. Separate
independent correction review and clean-checkout replay remain active before push.

## WP-08 pager contrast preconditions — review session 24

### n1 — Bounded test-only correction approved; no blocking finding

Independent actual canonical4 cases and four fresh steady probes pass, retaining
twelve zero-violation default axe scans/all16 option passing nodes at original4.5.
Measured light17.71/dark17.26 ratios hold in English/Arabic. Strict TS5.9 actual
845-file pager program and Biome pass. Corrected spec701436ff48c6429361d823949c45889bbb45cc1553261d717f00afd1e4cbbc68;
removing the three assertions restores the complete original exact source hash.
All10338 fingerprints and180/275 generation aggregates stay unchanged.

Main canonical62 and separate clean CI-mode62 also pass, preserving the three
LIMITATION characterizations. Main grants bounded **agent-approved under delegated
authority** for test-only correction6df7914. All scans/rules/actions, original4.5
threshold, deadlines/retry0 and actual animations remain unchanged. This does not
repair or certify every transition frame or prove manual AT/WCAG compliance.
Original red push/green PR remain historical; replacement full remote checks are
still required before final delivery, and no PR merge is authorized.

## WP-09 — delegated agent review session 1

Open for initial private details producer. Independent read-only review is active;
numbering restarts at n1 when findings are reproduced. Worker22 Chromium/two unit/
strict source/declaration checks do not establish public exports/actual tarball,
default shell, aggregate localization/facade or packet acceptance. No PR merge,
personal maintainer/human-AT/actual-device/performance/release claim.

### n1 — Getter rereads admit denied data or throw raw source errors (P1)

- An access getter changes after validation; denied source context then matches
  the reread origin and renders its record in a normal React root. Separately,
  an explicitly denied session still evaluates an old throwing source getter.
- Returned for fail-closed single-snapshot metadata validation and denial-first
  projection, without reading raw errors or cloning/freezing app record objects.

### n2 — Loading refetch unmounts an unsaved same-session form (P1)

- Edit the open form, increment request generation with correctly tagged loading
  then ready input. Its original input disconnects and unsaved state is lost;
  ready→ready coverage missed the transition.
- Returned for real subtree continuity through same-session loading/error, truthful
  status and application draft ownership. No hidden retained-record cache or
  conditional shell unmount may substitute for preserving the form.

### n3 — Untagged retained native view exposes old-scope models (P1)

- Preserve controller/query across scopes and legitimately share immutable recordA.
  Supplying retained viewA under sourceB returns RowA whose table still exposes
  old-scope rows. Matching record reference is not frame/resource provenance.
- Main approved an atomic current-read/native-frame protocol before code: validate
  owner/context/frame together or omit the optional row. Do not rebind old views,
  fabricate rows, add a second native/resource owner or weaken privacy. Independently
  reproduce/fix/update unpublished candidate fixtures/types before composition.
  Independent replay resolves n1's original privacy/source-getter faults and n3's
  old-frame rejection; genuine current-frame and separate detail-record controls
  remain passing. The following continuity/callback residuals remain separate.

### n4 — Request-generation lag unmounts a permitted dirty session (P1)

- Advance the current committed port generation before parent props catch up,
  retaining row/session/epoch/scope/access. An intervening render closes the shell
  and disconnects its form; loading props later remount and reset the draft.
- Main approved lifetime/freshness separation. Worker reproduces before failure,
  then preserves the same permitted subtree while masking stale records/rows.
  Real lifecycle changes still unmount. Independent rereview remains active.

### n5 — Dirty policy accessor is validated then reread (P2)

- A readonly beforeChange getter yields deny then allow. The denying policy is
  never called, allowing is called once and close commits, losing the dirty form.
- Worker reproduces before failure and rejects callback accessors without invoking
  them, captures valid receivers and contains async observer/focus failures.
  n4/n5 handoff reports52 Chromium/nine units/both strict compiler/public checks;
  independent review must verify the exact candidate, not infer full approval.
  **Resolved:** independent original generation-race/policy probes and earlier
  privacy/frame controls pass.68 Chromium checks across two runs, nine units,
  source/public TS6/5.9 and four-file declaration scan/Biome pass with aggregate
  11ddb455e5bcfefde2a1760886cf720a22fd13935e42841ca02d986d7e9ba5da.
  Main grants scoped initial details-source technical approval for integration;
  public packing/default shell/localization/facade/full WP-09 remain separate.

## WP-09 criteria authority — delegated review session 2

### n1 — Scoped plain producer reviewed; no blocking finding

Independent70 units (56 candidate/14 new probes), both strict source/public compiler
versions, DOM-free private emission/bare Node import and nine-file Biome pass.
Removing negative type directives produces seven intended errors per compiler,
not unresolved-module failures. Zero runtime imports/four own declaration files;
11 existing controller/details files remain unchanged. Nonempty context keys
match the accepted resource contract. Denial order/exact refs/receivers/capture-
once/replacement/disposal/revoked proxies/poisoned errors are independently tested.

Main grants **agent-approved under delegated authority** for the plain source
prerequisite at80da37ffc9cbfad9b15ead39f0b24833e382adfa45d6d8f6481656d83af654db.
Host publication/reset discipline and rechecks after later callbacks remain required.
This does not approve root exports/UI adoption/native adapter/actual tarball/
request SSR/full facade or integrated AC-16/25; those are separate producer steps.

## WP-09 pure pagination contracts — delegated review session 3

### n1 — Four-file source prerequisite approved; no in-scope defect

Independent review runs56 fresh probes plus267 candidate/existing cases, zero
failures/skips, and both strict source/own-emitted compilers. It independently
replays all16 sealed golden strings using hash-verified original HEAD preimages;
omitted/true preserve paged schema/controller/query/filter bytes. False-only identity,
callback ordering/diagnostic precedence/definition replacement/custom captured-clock
behavior pass. Forty worker and24 independent meaningful negative rejections are
confirmed, not missing-module errors. Original/current ten-module graphs match;
bare imports pass and emitted consumers need neither DOM nor Node types.

All279 manifest entries/163 protected inputs/four source hashes and aggregate
36676cb883cda5276a2a63194988bacd89d38981ff49e16b8690daf8d1111086 remain unchanged.
Main grants **agent-approved under delegated authority** for this source prerequisite
only. Current native still pages. No controller command/no-op guard, native/complete-
server/resource/exports/facade/browser/SSR/genuine packed/full AC or packet acceptance
follows. Those require separately approved owners/contracts and integrated proof.

## WP-09 execution metadata — delegated review session 4

### n1 — New-module source prerequisite approved; no in-scope defect

Independent69 fresh probes plus348 candidate/existing cases pass, zero failures/
skips. Strict TS6/5.9 source/own-emitted checks confirm52 candidate+24 independent
meaningful negative rejections; each compiler emits13 declarations and own consumers
need neither Node nor DOM types. Original ten-module graph plus only execution.ts,
external imports and bare Node import pass. Capture/time/extent/identity/parity/error
semantics match the approved pure contract, not a backend execution assertion.

Sourcec4e2bf93218b82eb36e85f62fa260e678de776835f04787c32b1a9139e0b9d51 and aggregate
552fe801c7ff59ad5faddf20c3a4065f347b29605fe1bb44aae35c88bbb5af0c match before/after.
All177 original/upstream14 bytes and289 manifest entries verify. Extra inventory
paths are only the separately authorized publication namespace; their active contents
are not read/accepted and the strict whole-inventory failure remains preserved.
Main grants **agent-approved under delegated authority** for this pure new-module
source prerequisite only. No root exports, native unpaged/complete-server/resource,
genuine packed/SSR/browser/full-feature or packet/merge acceptance follows.

## WP-09 publication metadata — delegated review session 5

### n1 — One-module source prerequisite approved; no verified defect

Independent110 fresh+88 unchanged source cases pass, including1296 length-four
public lifecycle traces/5184 steps (not infinite/MAX_SAFE_INTEGER execution).
Strict TS6/5.9 source/own-emitted programs confirm136 meaningful negative checks;
two runtime modules/five declarations, bare Node and full scoped Biome pass.
All130 sealed inputs/artifacts, original72 and accepted policy/execution inputs
remain unchanged; historical279/289 manifests verify without rebasing.

Source86bb9c80e6286ecd4eace96d2503710a2df8f6fa62e858993eb046fa6e5262fb and aggregate
e06bb4212d9327dea7105f8e25005630ccb141cf8833c850ddd39218d0e625f3 match before/after.
Main grants **agent-approved under delegated authority** for this one new pure
metadata module only. Actual retirement actors use old source store51352a…;
new WP-08 command-validator/native/source reset integration is not established.
No actual tool/option-buffer erasure, privacy-before-commit, React/SSR, paired frame,
native unpaged/complete-resource/facade/genuine packed/full AC/packet acceptance or
merge follows. Preserve all old source seals before the next declared generation.

## WP-09 combined transport — delegated review session 6

### n1 — Bounded source reconciliation accepted; no verified defect

Independent object/working-tree comparisons verify original95/433 and follow-up
97/433 exclusive paths, zero mismatches;610 unaffected parent paths and105 runtime
sources stay exact. Six shared resolutions preserve history/exports/layers/safe
copier, with8/8 fresh copier vectors. Main independently reconciles the source-map
recipe at b9a3e8ee… and verifies actual combined build/strict package/type/scoped
units. Main grants delegated transport acceptance, not an output-generation or
whole-WP09 pass. Default650 pass/2 historical-generation failures remain open.
Only the exact two-file U1 controller plan is activated; other runtime owners frozen.

## WP-09 U1 controller guards — delegated review session 7

### n1 — Exact two-file source candidate accepted; no blocking finding

Independent345 scoped cases/67 fresh probes pass, with both source variants matching
all24 sealed paged cases. Strict TS6/5.9 source/private declarations and56 meaningful
negatives pass. Removing exactly13 insertions restores both preimages. Protected
103 sources/456 existing inputs,794 manifest entries and historical seals stay intact.
Main reruns actual345/guard-after/lint509/docs+18 and confirms source hashes:
store089206a462fa68c8f544658446372efbb22779361249e63bb213efa41d97cd12;
reducerfc6a10034a543af520a24bb2a1e2d6fbc66422f72ebf6680b0fd409ff58259aa.
Main grants **agent-approved under delegated authority** at source/test aggregate
2c2d8f4df8efc57270a2f85d27d0c7c75abcf690e66daa85e4bef944e1496532 only.
No native/resource/pager/facade/generation/full-WP09 or merge approval follows.
New pre-U2 source105 map is abba84ba… under the documented canonical JSON recipe;
old baseline/seals remain historical, not rewritten to bless intentional deltas.

## WP-09 U2 native client unslicing — delegated review session 8

### n1 — Three-file source candidate accepted; no blocking finding

Final independent review passes302 scoped cases/41 fresh probes/72 paged golden
comparisons. TS6.0.3/5.9.3 complete normally, all64 individually removed negatives
and26 declarations/compiler pass. The three native hashes and source/test aggregate
b5a853ab59f11068cb0239b20a7316101612ee8c646f479f3d4a43cc15a2a257 remain exact;
1038 fingerprints/U1 identity/1025 manifest entries/18 seals are unchanged.
Main reruns actual302/guard-after/lint521/docs+18 and grants **agent-approved under
delegated authority** for client native source only. No server completeness/control
projection/pager/facade/output-generation/full-WP09 or merge approval follows.
Post-U2 pre-U3 source105 canonical map is497a1e37cd60c4080243847760e23526b8fe7cb033627ead9c7042d3ca0b0790;
historical maps remain intact. Only a separately activated U3 lease may change resource.

## WP-09 F1 implementation contract — review session 9 (provisional)

### n1 — Constructed sort resolver calls escape an outer callback fence

- **Finding:** the installed TanStack9.3.1 option is sortFn. Its constructSortFn
  closure calls resolver A, resolver B, then sort using its original function object.
  Replacing wrapper properties cannot interpose after resolver A revokes permission.
- **Independent check:** main reads actual installed sortFns.js:34–45 and
  rowSortingFeature.types.d.ts:20–50/88, confirming the static call/closure trace.
  No runtime failing test or successful correction is claimed; the original
  BLOCKER.md and authored obligation remain preserved in tests/criteria-frame/.
- **User decision:** the ask modal selects Explicit helper, not a vendor patch or
  weaker fence. Author createTableSortFn using actual vendor factory + private
  provenance; rebuild recognized helper/built-ins with separately guarded callbacks.
  Unregistered constructed/ambiguous functions deny on the protected route only;
  ordinary custom callback internals remain app-owned. Raw native APIs are unchanged.
- **Status:** correction is authorized, not implemented/verified/approved here.
  Exact scope is in the criteria-frame plan. Runtime/golden/type/independent proof
  remains in the user's final verification phase; this session is not F1 acceptance.

Implementation follow-up: F1/helper handoff11636636… now implements the selected
route. Main inspects actual source/API, matches21 input/104 protected source hashes
and passes one whole-package TS6 noEmit compile. One-resolver/zero-sort positives,
receiver/order parity and independent correction verification remain **unexecuted**
and deferred. n1 is not marked verified or accepted from these lightweight checks.

## WP-09 React/source contract — review session 10 (provisional)

### n1 — Initial-idle resource has no producer identity proof

- **Finding:** a requestless idle adapter has no U4 token binding. Structural own
  getter/view equality admits a different object returning the same idle view.
- **Independent check:** main inspects actual adapter construction/return, resource
  types and binding lookup. No factory identity lookup exists; the descriptor cache
  is unrelated. This is a confirmed static contract gap, not an executed failure.
- **Correction scope:** main adds only a private WeakSet admission/identity lookup
  to adapter.ts, preserving preimage36df1cc7… separately. New source SHA7ce69208…
  identifies this provisional delta. Identity does not imply access/liveness/binding;
  no requests, subscriptions, rows, public keys or server snapshot behavior change.
- **Status:** worker must use the lookup before remote metadata ports, author real
  identity/permission cases and complete the original bridge. Runtime and independent
  correction verification stay deferred; neither n1 nor the stage is approved.

Session10 n1 follow-up: the bridge now uses actual producer identity before remote
metadata ports. Main inspects its API/hook, matches20 handoff/115 protected source
hashes plus the exact adapter delta, and passes one TS6 package noEmit compile.
Requestless positive/copy denial, subscription/Strict/no-loop and independent
correction checks remain unexecuted; n1 is not marked runtime-verified or accepted.

## WP-09 Search/Tabs contract — review session 11 (provisional)

### n1 — Structural target envelope is not the identity-bearing capability

Main confirms from CriteriaToolTarget and commit's exact authority/owner registry
checks that the envelope itself has no brand/registry. Copying an envelope carrying
the same real proofs does not forge those proofs. The lease's blanket copy/proxy
wording is corrected to deny counterfeit authorities/owners, not transparent outer
containers; own-data capture/reentry checks and committed owner/actor pinning stay.
No new target producer/protocol or F3 source change is authorized. This is a static
contract clarification; no runtime test or Search/Tabs approval is claimed.
