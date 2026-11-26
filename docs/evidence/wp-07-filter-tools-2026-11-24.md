# WP-07 filter-tools evidence — 2026-11-24

TASK-015, [bounded plan](../planning/wp-07-implementation-plan.md), AC-02–AC-08 /
F-02–F-07. Work starts from reviewed WP-05 `3e4aaa8` on `work/wp-07-tools`;
preparation/source changes remain dirty until the final source handoff commit.
Entries are chronological: initial preparation below did not establish acceptance;
the final isolated-source disposition is recorded at the end. WP-06 stack/PR
integration and later library/release gates remain separate.

Main approved the bounded plan and provisional reference-informed code visual
direction before runtime edits. Planning inspected relevant read-only local
filter/date patterns and matching HeroUI3.2.8 sources. Main's prior connected
transactions default/picker/selection inspection and a new supplementary Figma
node2:72 read inform the direction, not final visual approval. No Figma write,
reference code/assets/business policy import or local reference mutation.

## Dependency and CSS build preparation

- Existing Internationalized Date **3.12.4** moved from styled dev-only metadata
  to a direct runtime dependency before date imports. No new package/version,
  forced peer or additional native installer exemption.
- `pnpm install --no-frozen-lockfile`: passed strict workspace resolution with
  unchanged runtime versions; existing glob10 deprecation warning remains.
- The stylesheet copier now supports only the explicit owned `filters`, `toolbar`
  and `date` CSS roots plus the stable root entry. It never copies arbitrary
  assets/unallocated roots or follows source symlinks. Actual component CSS/root
  imports and reviewed tarball allowlists remain later integration work.
- `pnpm exec vitest run tests/foundation/styles.test.ts`: **two passed**, covering
  nested CSS copying, non-CSS/unallocated exclusion and external symlink rejection.
- `node tests/foundation/copy-styles.mjs`: existing stable-entry CLI copy passed.
- Scoped Biome passed after formatting corrections; no component style/visual
  pass follows from testing this build helper.
- `pnpm check:docs`: **81 Markdown /514 local links /18 probes passed** after
  initial plan/navigation/authority preparation. Structural only.

## Active boundary

The headless worker owns the four new helper/draft/option-source modules and
scoped unit/types first. Toolbar/date API research is read-only. UI consumers
must wait for precise producer interfaces; no guessed API or accepted-state
mirror is authorized. Main owns shared indexes/styles/build/config/manifests/
lockfile/packed harness and Git. WP-06 runs independently in its isolated app
worktree; it is not a WP-07 prerequisite.

Required meaningful operator/draft/choice-race/controlled/focus/date/IME/browser/
responsive/RTL/packed/strict declaration proof and independent numbered review
remain outstanding. No manual AT, actual Safari/mobile, reference performance,
real-consumer, release/legal readiness, publication, deployment or PR merge.

## Headless handoff and initial integration

The exact four-module helper/option-source protocol is now exposed through the
existing `/filters` entry. Main built the React package and ran default discovery:
**397 unit tests passed** (prior288 +two owned-CSS tests +107 headless tests).
Independent reviewer separately confirmed107 and strict TS6/5.9, then reproduced
the envelope accessor/reread defect now tracked as WP-07 n1. Correction is active;
passing original vectors is not acceptance of that defect.

Preliminary actual unpatched NodeNext TS6.0.3/5.9.3 tarball checks passed new helper/
option types, guarded React/network-free runtime owner/draft/ID/late-token/label-
projection probes and all prior native/resource/renderer import/bundle checks.
Report: transient `.artifacts/packed-AsrvVk/report.json`. This used the initial
compiled headless candidate and the **prior minimal renderer**, not the unfinished
new filter UI. It does not cover n1's forthcoming correction or real packed filter
interaction. Explicit accepted IDs in a new context receive honest unknown-label
fallbacks; old cached labels are suppressed, not presented as new-scope labels.

Builder and toolbar/date UI now consume the handed-off protocol in disjoint
owned paths. Private date consumer integration waits for its exact finished
interface. Final UI/browser/lifecycle/packed/visual and independent review remain
required. No packet approval is implied by this preliminary integration.

## n1 correction rereview and refreshed headless checks

Original envelope repros and the broader audit fail before correction. The source
now captures own data descriptors and rejects accessors without invoking them;
malformed inputs preserve snapshot identity and the outstanding valid token.
Independent rereview confirms all130 tests, TS6/5.9, original getter/proxy probes
and previous ABA/scope/access/selected-label/lifecycle cases. No residual verified
headless defect; reviewer recommends scoped correction approval only.

Main rebuilt the React package and ran default discovery: **420 unit tests passed**.
Refreshed actual unpatched NodeNext TS6.0.3/5.9.3 public type/runtime/import/bundle
checks passed (`.artifacts/packed-17LJDP/report.json`), still using the prior minimal
renderer rather than unfinished filter UI. Four-source aggregate matched exactly:
`2caa67e47d4f6ab949beecd8add1b8edc05af4f240f1158ba9b3b50c8e166f5d`
(sorted `path + NUL + bytes + NUL`). Main approves the tested **headless correction**
under delegated technical authority, not the whole WP-07/UI packet. Real source
owner/Suspense/unmount, visible label masking, picker/date/control/browser/visual
and actual packed filter interaction remain required before packet approval.

## Toolbar/date handoff and strict repair

Source worker reports five date unit/15 Chromium scenarios for actual search,
accepted tabs/shared result lifetime and date primitives. Its private date editor
has a precise wire-value/resetKey session contract, now handed to builder owner.
Independent review is active; source aliases are not emitted/packed proof.

Main reproduced four TS6 TS2320 diagnostics reached through unnecessary full
HeroUI declaration barrel references in Calendar/RangeCalendar. The pre-install
plan/ADR records the exact scoped-entry declaration-only repair. Compared all528
vendor files: only the two entry .d.ts files differ; every runtime/license byte
matches. Prominent modification comments and NextUI Inc. Apache attribution are
retained. Both TS6/5.9 toolbar checks and real year-picker positive/negative types
now pass, as do exact patch-path/hash/integrity tests. No property erasure,
compiler relaxation, runtime/version change or unrelated-interface patch.

Main added candidate public toolbar exports and owned CSS imports in the reserved
layer, with documented predeclared app layer order so utility overrides remain
possible. The CSS copier covers these exact owned roots. The real desktop source
fixture was inspected in a connected browser: bounded low-emphasis search/date/
tabs, explicit timezone/relative presets, real range field, disabled incomplete
Apply and one result panel. This is a synthetic probe layout, not final table
composition or all-widths/RTL/AT approval; screenshots remain transient. The owned
6441 preview was stopped. Builder and final emitted/public/packed checks remain.

## First full public tool archive check (not corrected-UI acceptance)

Main emitted both actual package roots with strict TS6 and owned recursive CSS.
Public declaration traversal reaches only own/React/Tableweave types, not vendor
HeroUI/RAC/Internationalized Date declarations. Added genuine positive/negative
tool-prop/schema inference, required evaluation-mode, private-subpath and numeric
option-source tests to unpatched strict NodeNext TS6.0.3/5.9.3 tarball consumers.
Both consumers pass, as do actual ESM public exports, no-headless-UI/default-
sortable guards and bundled CSS/import graph checks. Report:
`.artifacts/packed-ByDNqc/report.json`.

This uses the first emitted UI snapshot, before search n3/n4 and builder n5–n7
correction acceptance. It proves the public package/type boundary, **not** those
runtime fixes or actual packed styled interaction. The combined fixture owner is
building emitted stories/browser integration against exact handed-off interfaces;
main will run an independent genuine-tarball browser consumer after correction.

The same scoped-type barrel defect was reproduced through ListBox. Its genuine
item/section entry references were included in the pre-install disposition/patch.
Both TS versions now pass builder and positive/negative ListBox/year-picker types.
Fresh comparison of528 vendor files confirms exactly Calendar, ListBox and
RangeCalendar .d.ts entries differ; every runtime/license byte matches.

## Shared discovery correction

The first expanded default unit run exposed a real harness gap: the newly
discovered date test imports Internationalized Date from the test root, which
does not declare that package. Main now resolves it through the exact declaring
package's installed dependency, like the existing React test aliases; no new
dependency or production/packed source alias. The same run's emitted-graph guard
exceeded the unchanged five-second deadline amid22 concurrent compiler/test workers.
With bounded four-worker execution all **426 tests pass**. Main records that
worker cap in default discovery without changing strictness, assertions, behavior
timeouts or retries. This is harness resource budgeting, not a runtime performance
gate or permission to suppress a failing behavior test.

Fresh manifest-only strict frozen installation passes with the complete three-
declaration patch; lockfile stays byte-identical. Four style/patch integrity tests
and both strict calendar/ListBox type versions pass. No packet approval follows.

## Type-install isolation audit

Main traced the initial actual styled consumer's module resolution: React types
came from the workspace's genuine, unpatched @types/react19.3.0 through ancestor
fallback. Those earlier type/ABI assertions did execute against the matching
version, but a fully self-contained declaration install was not proven. This is
WP-07 n9, a harness proof correction—not a demonstrated library ABI/runtime defect.

The next apps explicitly declare exact approved React/DOM type dev dependencies.
New per-compiler resolved-program-file inspection permits only the selected
compiler's standard library outside the consumer. Main replay confirms that this
guard rejects the original artifact. Fresh standalone TS6/5.9/import/runtime/bundle
proof is active; final corrected actual packed-browser interaction remains pending.

The refreshed standalone run **passes** with explicit local React/DOM declarations:
210 headless and223 styled program files under each compiler, with only compiler
standard libraries outside the actual app. All unpatched strict NodeNext types,
runtime/import/bundle guards pass (`.artifacts/packed-nXufQD/report.json`). Main
then rebuilt both package roots to include independently corrected search and the
builder correction candidate. Actual production packed-browser interaction is
next after the combined fixture handoff; the older archive does not approve those
new UI runtime bytes.

## Corrected production tarball interaction

`node tests/foundation/packed-consumers.mjs --filter-tools-browser` now passes
**43/43 Chromium tests** against an actual Vite production bundle installed from
the real package archives. Zero unexpected/skipped/flaky cases. No Tableweave,
vendor or React source/dist aliases; every absolute runtime module resolves inside
the consumer's own install. Full light/dark axe, membership Escape, live option
guards, accepted locale, one-results/resource lifecycle and responsive scenarios
remain asserted. Report: `.artifacts/packed-T7IYlJ/report.json`.

Both unpatched NodeNext consumers pass TS6.0.3/5.9.3 and resolved-file confinement
(210 headless/223 styled files each). The actual browser application also passes
strict TS6/5.9 with370 files each and only compiler standard libraries outside its
install. Its first harness run correctly failed because Playwright helper types
needed Node ambient activation; the exact Node dependency was already declared.
No compatibility flag or version change was used. CSS bundle hashes/module graph
are retained with the report; all owned filter/search/date selectors are present.

Independent builder review resolves n13/n14 with54 behavioral cases, additional
original Escape/rich-name probes, five scoped axe scans and both strict TS versions.
Source aggregate:92908b00a017b2ce9ac7f33f73dd6f57db8bb689a6db0875df0fba43dc60e210.
Reviewer excluded native-config CSS preflight due to isolated resolution; main's
genuine installed-archive production proof above has no such substitution.

Main inspects actual desktop light/dark/RTL and production320px/enlarged-text
screenshots: contained table scrolling, group boundaries and reachable editor
actions are visible. This is agent visual review, not personal maintainer/Figma/
manual-AT/device acceptance. Native checkbox boundary contrast is noted for WP-08
control review rather than hidden by axe-only claims; no overall WCAG conformance.

Default units pass429 after separating exact runtime export and individual graph/
directive assertions. The earlier combined test exceeded its unchanged5-second
deadline once under load; no assertion/deadline/retry was removed or relaxed.
Default discovery now includes strict combined fixtures and actual packed-browser
interaction. Main discovers Storybook's wrapper rebuild overlaps an emitted run;
that43/43 result is retained as overlapped and superseded only by a clean rerun.
After completion,76 headless/50 styled emitted files match the passing archive
byte-for-byte: respective aggregate hashes
3c37b171f6a2f3be28c672eba285b1eee81024ab53c6192199959a6c0b03076a and
5a5916baa495ef9d04a88ec21e24e4eb33667dff6aa00bdd0bf8f2b9c3811ed5.

Storybook initially cannot resolve shared-fixture runtime/types from outside its
app. Main config resolves actual declaring-app vendors and public emitted entries,
without source aliases; genuine tarball proof stays separate. Direct underlying
Storybook build and app types now pass. Clean emitted rerun/full ordered workflow
and final WP-06 stack integration remain required before packet approval.

## Completed isolated source workflow and delegated disposition

The corrected frozen `work/wp-07-tools` candidate completes `pnpm check` with
exit0: strict frozen manifest-only install/unchanged lock, Biome, package/app/
fixture strict types, **429 unit tests**, structural documentation plus18 probes,
genuine inspected archives/Node/runtime/default-sortable/CSS guards, Storybook and
**171 Chromium checks**. The browser total is4 foundation/controller +7 native +21
grouped collection +11 resource +24 toolbar +55 builder +43 combined emitted +6
built Storybook plays. Each stage is from this completed run, not interrupted or
overlapped earlier candidates. Host headroom was45 minutes; no assertion/transition
deadline or retry was relaxed.

The same workflow's actual-tarball production fixture passes **43/43**, with zero
skipped/unexpected/flaky cases. Both unpatched NodeNext consumers pass strict
TS6.0.3/5.9.3 and resolved-file confinement (210 headless/223 styled files each).
The actual browser app passes both strict compilers over372 files; only the chosen
compiler's standard libraries escape the consumer. All runtime modules stay inside
its installed app with no source/dist/vendor aliases. Report:
`.artifacts/packed-tGeUat/report.json`.

Inspected archives before documentation-only approval updates:

- React:78 files, SHA-256
  384bcdc8250d58d8e8bd183042da4471be150e0804b43c36be50b5e1f9305288.
- HeroUI:52 files, SHA-256
  ff35a83a03cf917783b0918c85389a41f767373455e4321e97561a59b50b2ac6.
- Actual application CSS:466645 bytes, SHA-256
  cda0f69b6dbe5be5d23abb1d27d9c5d1d9ac8fa0a701b4484929632e660ae9f4.

Clean emitted acceptance43/43 separately has identical before/after fingerprint
7a453f5174eb228626eed6cecc3c15b033cb4b3e746f4d9aeea2032e7cb9c8e0.
Real built Storybook checks include completed phase/autoplay/matching story and
absence of caught play/preview errors, not merely visible final data or terminal
success. The negative erroneous empty-Clear story assertion is retained as proof
that those gates catch a late failure even when Storybook reports success. The
corrected source/probe correctly require Clear to be absent when no rule exists.

All WP-07 session1 findings n1–n15 are resolved within their recorded scope after
independent source replays and main's genuine package/integration checks. Main
grants **agent-approved under delegated authority** for this private isolated
WP-07 source/component/public-type/packed boundary and provisional visual treatment.
This is not personal maintainer/final Figma/manual AT/device/performance/real-
consumer/legal/publication/full G-05 acceptance. Shared collection/control work,
including separately discovered grouped-header contrast, remains scoped to WP-08.

Next main commits this source handoff, stacks it without merging onto actual
WP-06 head9eb71e1, reconciles owned shared configuration and reruns the combined
Start/tools workflow before final packet integration approval/push/separate PR.
No publication, deployment, real-consumer change or PR merge is authorized.

## Completed combined WP-06/WP-07 stack

Source handoff ea9dc57 is replayed as7b3b981 with exact parent
9eb71e16bac43466443d9547256ead3f9733225e. Tool package/source/fixture paths match
ea9dc57 byte-for-byte; Start app/tests match9eb71e1. Independent static review
checks shared script/patch/lock/type-isolation/guard/documentation unions against
both parents, finding no blocker. Final runtime/source inputs stay frozen during
the complete stacked `pnpm check`, which now exits0.

Actual completed stacked run: **430 units**, **171 baseline/tool Chromium**,
**43 actual-tarball tool production checks**, **27 development+27 production source
Start**, and **27+27 actual-tarball Start**. All strict/frozen-install, package/
Storybook/framework build, client/server bundle markers, runtime/default-sortable/
CSS guards and docs/18 checker probes pass. These are completed combined results,
not summed partial runs. CI keeps45-minute headroom; main allows60-minute host
delivery headroom without changing assertions, runtime deadlines or retries.

Tool archive report: `.artifacts/packed-R562On/report.json`. React78-file archive
SHA384bcdc8250d58d8e8bd183042da4471be150e0804b43c36be50b5e1f9305288;
HeroUI52-file archive SHA
ff7dadaa50640b6df207ef010f513fb5a7e4894489412cdd62985db2ac8371ef.
Styled README differs from the earlier isolated archive; emitted library files
remain byte-identical. Actual tool app CSS hash remainscda0f69b6dbe5be5d23abb1d27d9c5d1d9ac8fa0a701b4484929632e660ae9f4.
Both strict compilers confine210 headless/223 styled/372 app program files, and
the tool browser result has43 expected/zero skipped/unexpected/flaky cases.

Packed Start acceptance `.artifacts/start/packed-USYWHH/acceptance.json` uses that
same headless archive, passes both compilers with721-file confinement each and
starts without generated route input. Actual framework build creates the route
tree; dev/production tests pass. The deliberately aborted synthetic negative HTTP
cases retain vendor AbortError diagnostics; they are not a claim of zero server
diagnostics or a production error-reporting/backend service.

Main grants **agent-approved under delegated authority** for bounded combined WP-07
engineering integration after independent source/static review and this actual
full result. Final documentation-only handoff/push/separate PR/remote checks are
next. The final remote run rebuilds archives after these documentation changes;
no stale archive hash is claimed for a later README. No PR merge, personal
maintainer/Figma/manual-AT/device/performance/real-consumer/legal/publication/full
library G-05 acceptance is inferred. WP-08 controls and WP-09 facade remain separate.

## Ordered PR correction integration — 2026-11-26

The user authorizes reviewed sequential merges into develop and bug corrections.
PR #6's supersession correction `0967326` passes both complete corrected-head CI
workflows and merges to develop as `821dfa2`, with its tested tree preserved.
Main integrates that correction into #7 by ordinary merge, preserving the original
packet history. The only conflict is Vitest discovery: retain both filter-tools
entries and add the seven new Start owner units plus their real declaring-app
Query alias. The five corrected app/test bodies match the verified #6 inputs
exactly; no filter producer, UI, dependency, test assertion or timeout is changed.

Fresh `wp07-integration-check-001` records **437/437 units pass** (23 files, zero
pending/retries), whole-root Biome245 files, original strict Start app TS6/5.9,
92 Markdown/563 local links and18 checker probes. Existing dependencies and
accepted emission are reused; these focused checks are not a new install, package
build, browser or packed-consumer result. The earlier430-unit workflow remains
historical. Main selects a two-parent integration commit/push for current complete
CI. #7 remains unmerged until its changed combined tree passes current checks and
the ordinary develop merge preserves that tested tree. No release is implied.
