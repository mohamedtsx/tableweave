# WP-07 filter tools implementation plan

TASK-015 under the explicit delegated WP-04–WP-15 grant. Main approves this bounded
plan and the provisional visual disposition **before code**, not as personal
maintainer/Figma acceptance. Separate stacked commit/PR after independent review;
never merge. WP-04 `bf7712e` and combined WP-05 `3e4aaa8` are reviewed inputs.
WP-06 is independent and not a prerequisite for these tools.

## Outcome and authorities

WP-07, AC-02–AC-08, F-02–F-07: composable segmented builder, local value drafts,
All/Any/Duplicate/Negate/Remove/builder-only Clear, search/tabs/date and safe async
choice recovery. Read [operators](../../product/operators.md),
[shared rules](../../product/shared-rules.md), [design](../design/handoff.md),
[controller](../engineering/wp-03-controller.md) and actual schema/registry types.
Use the actual native/resource producers, not a second engine or cache.

No `DataTable`, `defineTable`, `useTableweave`, Query/router, transport/storage,
telemetry or application authorization service. NativeDefinitionInput does not
contain a full tools facade: separate presentation props from accepted schema/
state. Existing renderer localization is allocated to WP-08/WP-09, not claimed
complete here. Scope/access invalidation clears local drafts/timers/option labels;
applications own accepted query policy and backend permission independently.

## Provisional visual disposition

Delegated implementation/review may use a quiet compact reference-informed layout:
external tabs/date and embedded builder/search, restrained token surfaces/dividers,
whole-rule wrapping, bounded narrow overlays, logical spacing/bidi isolation and
sufficient targets. All messages replaceable; no brand, payment colors, Export,
commercial assets or copied reference code/business rules.

Read-only planning inspected relevant Gamila table/booking-filter/date composition
and actual HeroUI3.2.8 Storybook/source; `.repo/` remains the main taste source.
Main previously inspected the public transactions default/picker/selection toolbar
in a connected browser. Main also read supplementary prototype node2:72 in a new
Figma file session for this packet; no file edits/assets/imports or final visual
approval. Real implemented 1440/1024/768/390/320, light/dark/RTL/enlarged-text
review remains required. A source/text inspection is not visual acceptance.

## Ownership and producer handshake

Main owns TASKS/REVIEW/canonical docs, public indexes/exports, manifests/lockfile,
root styles/CSS build copying, discovery/packed harness/consumers and Git.

1. **Headless worker first:** new `packages/react/src/filters/editor-types.ts`,
   `editor-fields.ts`, `editor-draft.ts`, `options-source.ts` and
   `tests/filter-tools/unit/**` plus isolated headless check config. Existing
   registry/schema/controller/resource code is read-only. `operatorAllowed` is
   already exported internally by registry.ts; reuse it through same-package
   imports, not a new raw public alias or duplicated policy.
2. **Builder worker after exact headless handoff:** `packages/heroui/src/filters/**`
   including private picker/rule/options/value helpers and owned styles. Own genuine
   public props/messages; do not leak vendor component props into declarations.
3. **Search/tabs/date worker:** `packages/heroui/src/toolbar/filter-*` and private
   `packages/heroui/src/date/**`, with own props/messages/styles. Date primitives
   have a precise own wire-value interface before builder-date consumers use them.
   No guessed cross-worker props or duplicate date arithmetic.
4. **Fixture/story worker after producer handoffs:**
   `tests/filter-tools/browser/**`, `tests/filter-tools/fixtures/**`,
   `apps/storybook/src/filters/**`. Main allocates shared configuration edits.
5. **Independent reviewer:** read-only reproduction; main assigns fixes to owners.

No worker edits another scope/shared controller or installs dependencies. Port
**6427**, ignored `.artifacts/` outputs; no collision with Start6013 or prior tests.
Work is prepared on `work/wp-07-tools` from reviewed WP-05, then stacked onto
WP-06 for final PR delivery without merging/rebasing away other work.

## Headless/public candidate surface

New `/filters` helpers (names become actual only after tests/exports):
`getBuilderFields`, `getFieldOperators`, `validateRuleDraft` and a small plain
option-source factory/protocol. Preserve schema-specific field/operator/value
types. Helpers stay React/DOM/network-free. Validate drafts with the existing
normalizer/compiler by replacing/appending one candidate in accepted query;
incomplete/invalid never changes applied state. No duplicate evaluator/inverse.

Styled root candidate components: `FilterBuilder`, `FilterSearch`, `FilterTabs`,
`FilterDate`, with genuine own types. Inputs include controller, explicit expected
ResourceContext, same custom registry where applicable, labels/messages and field
presentation/static choices/option source/custom editor. Optional mutation observer
runs after dispatch, not a second acceptance callback. No raw vendor/Intl date types
in public declarations. IDs are event-time per-instance collision-checked strings
or an application factory, never positions/global render counters.

## Drafts, accepted state and controls

- Only schema builder-owned fields enter the builder, even when other tools are
  neutral; hidden builder fields remain available. Allowed operators use registry
  family/nullable/explicit restrictions. Value-less operators omit operands/editor.
- Each whole applied rule has independently reachable field/operator/value/options
  segments. Same-field rules have independent IDs/drafts. Changing field/operator
  stages a draft and retains a value only if valid for the new combination.
- Immediate valid enum/membership choices; actual value-less boolean operators.
  Last membership deselection removes an existing rule; new empty draft never
  sends an empty predicate. Text/number/date/ranges/custom default to confirmation.
  Reject blank/incomplete/nonfinite numeric input, preserve zero/false/whitespace.
- Duplicate uses new ID. Negate only when its inverse is allowed; replacement
  operands open a draft, preserving applied rule. Remove one; Clear only builder
  rules and retains join/search/tabs/date/sort/size/presentation by controller policy.
- Every chip/join/tab/date summary reads **accepted** state. `reject()` has no
  subscription notification: `proposed` means submission, not applied success or
  an indefinite optimistic pending mirror. Confirmed valid submissions may close
  and restore focus, announcing submission; reopening reads accepted rule.
- Draft Cancel/Escape/backdrop discard only local unsubmitted state, never Clear,
  selection Cancel or rollback of a submitted transaction. Thrown/rejected commits
  preserve accepted criteria with safe local feedback. External changed/removed
  edited rule invalidates stale draft; unrelated page/layout need not discard it.
- Restore trigger/next/previous-rule/Filters focus after edit/removal/Clear. Scope/
  access/definition/controller changes cancel timers and drafts without render
  mutations or prior-scope label exposure. Two tables remain independent.

## Async option protocol

Do not force table ResourceRequest/WireQuery into choice identity. Use own context
`definitionKey/scopeKey/access/fieldId` and exact instance token with term/pageKey/
monotonic generation. Pure begin/succeed/fail/retry/context/clear/dispose/subscribe
ports; app receives new token after begin and owns actual transport/cancellation.
No endpoint/Query dependency, implicit fetch, all-term cache or background retry.

Reject stale/copied/cross-source/field/term/page/scope tokens including ABA and
uncancellable completions. Preserve numeric vs string IDs, current accepted IDs
and usable selected labels outside the current page through loading/failure.
Only current page plus currently selected-label retention, not prior search pages;
no silent value truncation. Provide selected-label recovery and honest ID fallback.
Disappearing options never erase accepted rules. Loading/error/empty/Retry stays
local. Mask old-context labels before effects and clear on true owner lifecycle/
access loss, not merely closing the picker or Suspense layout hiding. Connect app
scope invalidation to resource onInvalidate without a second row-resource owner.

## Search, tabs and dates

SearchField local text uses configured debounceMs (300 default, zero valid), IME
composition and canceled/superseded/context timers. Clear affects search only;
external changes reconcile without stale timer or blindly erasing newer typing.
Tabs use schema IDs, app labels/count meaning, preserve zero and never infer from
loaded rows. Real tab/panel associations use one shared result region, no duplicate
tables/fake panels. Accepted values control all tools under delayed accept/reject.

Date uses real installed DatePicker/DateRangePicker/DateField primitives, configured
single/range/presets and explicit standalone Clear. Keep symbolic relative values,
date-only vs instant distinctions and exact bounds/DST semantics. Use accepted
locale/timezone/evaluatedAt for previews/calendar initialization; dispatch owns final
clock validation. No implicit Date.now/getLocalTimeZone/default UTC arithmetic or
24-hour day assumption. Calendar/date primitives are shared by builder adapters.

## Dependencies, checks and stops

No new package/version. Before runtime date imports, main moves existing exact
Internationalized Date3.12.4 from styled dev-only metadata to a runtime dependency;
no transitive availability assumption. All strict flags and unpatched NodeNext
public consumers remain. CSS build copies only reviewed owned CSS, not assets.

Required evidence: all owner/family/inverse/cardinality/custom-editor vectors;
invalid drafts preserving prior query/results; immediate/confirmed/Cancel paths;
native Any/same-field/tool-AND result IDs; Clear slice-by-slice/atomic reset; delayed
accept/reject/no-op/callback failures; actual debounce/IME/date context; deterministic
late/ABA/scope option races and labels; real keyboard/focus/axe; emitted fixtures,
actual **packed styled browser interaction**, TS6/5.9 positive/negative inference,
server-safe helpers and public declaration/bundle boundaries; real stories for
F-02–F-07; widths/themes/RTL/text expansion. Main adds discovery/runner/pack lists
before claiming any check. Full pnpm check plus docs/whitespace and independent
numbered review/corrections precede delegated approval and separate stacked PR.

Stop affected acceptance for producer drift, custom registry mismatch, missing real
picker types/focus/packed proof, label/scope leakage, optimistic proposed criteria,
path conflict or new dependency. Never waive requirements to pass a dependency or
look attractive. No final Figma/human-AT/actual Safari/mobile/consumer/performance/
release acceptance follows from this provisional engineering/UI packet.

## Toolbar/date producer disposition — 2026-11-24

Read-only installed-source research identified three explicit boundaries before UI
code. Main approves them under the same delegated grant; no product scope changes:

- An accepted null tab requires an explicit `neutralTab` presentation. Never pass
  nullish vendor selectedKey and silently select the first tab. Missing neutral
  presentation is a visible configuration diagnosis. Render one stable-position
  shared Tabs.Panel whose collection id follows the accepted key, not keyed or
  duplicated result subtrees. Browser DOM/lifecycle evidence must prove it.
- Private date primitives use only own wire-value/date-context props; explicitly
  seed placeholder/focused calendar value from accepted evaluatedAt/timeZone and
  supply representable/schema bounds. Vendor today highlighting still has internal
  clock behavior; do not claim it is fully overridden. Observe incomplete segment
  state, retain instant milliseconds and require explicit handling of DST-invalid
  wall times. No blur-constrained or prior valid value may submit unnoticed.
- Explicit `invalidationKey` may clear same-context local drafts/timers; context
  alone cannot observe application reset. App-owned onInvalidate supplies it;
  this is not a second row-resource lifetime or backend permission authority.

Search/tabs and private date primitives are independent of the pending headless
helper protocol and may proceed in their disjoint paths. Date operator/draft
validation integration waits for the exact tested helper handoff; do not guess or
duplicate operator policy. Builder consumers still wait for producer interfaces.

## Calendar declaration repair disposition — 2026-11-24

Main reproduced four TS6 TS2320 errors reached through HeroUI3.2.8 Calendar/
RangeCalendar declaration references to `import("..")`. The barrel unnecessarily
loads unrelated color-swatch/separator/toggle-group/toolbar interfaces. Before
installation, main approves one exact declaration-only `@heroui/react@3.2.8` patch:
the twelve CalendarYearPicker-bearing lines in those two scoped entry declarations
reference `import("../calendar-year-picker")` instead. The root barrel explicitly
re-exports that same scoped declaration; no property/type is replaced or erased.

No runtime/version/strictness change, broad interface patch or new dependency.
Retain upstream Apache license/attribution and modification notes. Check exact
patch paths/hash/runtime-byte integrity, frozen reapplication, both strict TS
versions and independent unpatched NodeNext **own public** types. Root patches
do not propagate to consumers directly importing raw vendor declarations. Remove
after a reviewed stable upstream release passes the same evidence. This repair
is not packet/UI/visual acceptance or raw vendor barrel compatibility.

The completed builder independently reaches the same four conflicts through
ListBox's declaration barrel. Main reproduces that path and extends the same exact
patch, before install, to `dist/components/list-box/index.d.ts`: use the genuine
already-imported/re-exported `../list-box-item` and `../list-box-section` types for
its five type-bearing lines. Same types/capabilities, no unrelated-interface fix.
The integrity expectation becomes exactly three .d.ts files; raw runtime bytes
remain unchanged. Both public positive/negative ListBox types and builder strict
checks are required after reapplication.

## Standalone consumer proof hardening

Main's TypeScript resolution trace finds that the existing clean tarball consumer
uses workspace @types/react19.3.0 through ancestor-directory fallback. Those types
are genuine/unpatched, so this is not a demonstrated ABI defect, but a self-contained
installation claim is too strong. Before the next consumer installation, explicitly
declare the already-approved exact React/DOM declaration dev dependencies and reject
any resolved program file outside the consumer except the selected compiler's
standard library. No aliases/patch inheritance or changed compatibility versions.

For the mandatory actual packed browser fixture, use the existing exact Vite7.3.8,
Playwright1.65.1, Tailwind plugin4.3.5 and axe4.14.0 as consumer-only development
tooling. No root/runtime dependency is added. Copy only owned synthetic fixture/
test/style files; resolve the library from real installed archives, with no source,
dist or vendor aliases. Main owns this harness. Emitted workspace fixtures are not
substituted for actual production-bundle/tarball browser interaction.

## Integrated keyboard/naming/contrast correction disposition

The frozen40-case emitted integration run passes37 and exposes three failures:
Escape clears an already accepted membership rule; builder trigger/value names
omit visible text; default light table-header/dark confirmation colors fail scoped
axe contrast. They remain asserted; do not suppress axe or reinterpret Escape as
an accepted remove operation. Main assigns keyboard/naming to the builder owner
and owns shared renderer/root stylesheet contrast correction.

Main approves a scoped Tableweave table class and semantic foreground headers,
plus a shared owned confirmation-button class using foreground/background token
pairs across normal/hover/pressed states. Apply it to actual builder/date confirm
actions only, not every vendor button or the global theme. No arbitrary brand hex,
vendor runtime patch, dependency/prop expansion or weakened test. Default visible
labels must stay in accessible names, including rich value summaries; exact
selector/name handoff precedes fixture updates. RTL fixtures must provide the app's
matching current Aria locale provider, not just CSS direction/controller locale.
All source/emitted/actual-tarball and before/after contrast checks remain required.
