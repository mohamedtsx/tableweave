# WP-07 builder implementation handoff

Bounded worker implementation on `work/wp-07-tools`, 2026-11-24. Writes are only
`packages/heroui/src/filters/**` and this directory. This is an implementation and
verification handoff, **not packet approval or maintainer visual acceptance**.
Main owns TASKS/review, public root exports, package declarations, style copying,
Storybook discovery, emitted/packed verification and Git operations.

## Source and public surface for main

- `packages/heroui/src/filters/filter-builder.tsx`: `FilterBuilder<S>`.
- `packages/heroui/src/filters/types.ts`: `FilterBuilderProps<S>`,
  `FilterBuilderMessages`, `FilterFieldPresentation<S>`,
  `FilterCustomEditorProps<S>` and `FilterOptionPort`.
- `packages/heroui/src/filters/filters.css`: builder-owned styles. Main should
  include these with the already-owned date producer's `date-editor.css` in the
  actual stylesheet build/import path. The current root source entry imports both;
  the fixture loads that real root entry. This worker changed no shared stylesheet.
- Private only: `OptionOwners`/`useBuilderOptionViews`/`scalarIds`/`acceptedOptionIds`, `ValueEditor`,
  `requestOptions`/`choiceKey`, `dateOperandValue`, `builderMessages` and
  `operatorLabel`. Do not promote these incidental helpers as public facades.

Required builder props:

```ts
controller: TableController<S>;
evaluationMode: "client" | "server";
expectedResourceContext: ResourceContext;
invalidationKey: string | number;
fields: Readonly<Partial<Record<BuilderFieldId<S>, FilterFieldPresentation<S>>>>;
```

Optional props: `registry` (the controller's exact custom registry),
`messages`, `dateMessages`, `createRuleId`, `onMutation(result, command)` and
`className`. `onMutation` is an observation **after dispatch**, never an acceptance
callback. `evaluationMode` is explicit application processing policy: client mode
disables/rejects custom operators without a client evaluator; server mode permits
headless compile validation without inventing client execution or backend results.
Backend translation, fetching and authorization still belong to the application.

Each field presentation supplies `label`, optional `operatorLabels`, `choices`,
`asyncOptions`, `formatValue(rule)` and `renderEditor(props)`. Literal schema IDs
provide honest fallback choices/labels when no presentation choices are supplied.
Presentations cannot name search/tabs/date/none owners; the schema, not a neutral
UI state, controls ownership.

The custom renderer receives typed schema rule/validation context and a raw local
`value: unknown`, plus `onChange(JsonValue | undefined)`. Raw drafts are not typed
predicates: only `validateRuleDraft(...).status === "valid"` supplies the
`RuleFor<S>` dispatched by `builder.commit`. Custom editors are confirmed by
default, including custom replacements for otherwise-immediate families.

## Option port and lifetime

`asyncOptions` contains an application-owned `source` and `onRequest(token)`;
optional `nextPageKey(token)` enables explicit next-page requests. Number-only
sources use `idType: "number"`, string-only sources use `idType: "string"`, and
`OptionSource<ScalarId>` may omit `idType` (or use `"scalar"`). Public type fixtures
reject mismatched port/source types. IDs are never string-coerced into predicates.

The UI calls `begin` before the app port and forwards the exact returned token.
The app settles through its source's `succeed`, `recoverSelectedLabels` or `fail`.
No request starts merely because a closed builder is rendered. Accepted IDs are
input to `setSelectedIds`, never a second query/selection authority. Current-page
options and current selected labels are the only label stores; missing labels
show the original ID. Empty/error/retry/loading state stays local and never erases
the accepted predicate.

One passive `source.connect()` owner per presented async field lives outside
picker visibility. Pure projection masks mismatching contexts before effects.
Committed context/epoch changes invalidate the source; unchanged stale allowed
props never restore terminal request-side access loss. Source owners must not be
duplicated by a second application `connect` owner for the same presentation.

Production-lifetime Suspense hide/reveal preserves pending/ready work and selected
labels. React development StrictMode can replay passive cleanup/setup on reveal:
that **cleanup revokes tokens and labels**, just like actual unmount, and requires
a fresh explicit request. The tests distinguish preservation while hidden from
cleanup invalidation/reconnection; they do not delay cleanup, resurrect labels or
silently grant access. This matches the distinction in
`tests/resource/hooks.spec.ts`, whose preservation cases use `without-strict`.

## Date integration

The default date/datetime editor imports the handed-off private
`../date/date-operand-editor.js` directly. There is no provisional date slot or
text-input substitute. It passes the exact one/range discriminated props, actual
field/context, stable per-session `resetKey`, disabled state and `dateMessages`.
The `value` seeds a session; draft notifications are not mirrored back as session
resets. Cancel/reopen and external invalidation remount from accepted state.

Complete drafts supply their wire value; empty/incomplete drafts remain local,
and invalid date drafts use local `null` so validation cannot reuse a prior valid
operand. Apply is disabled unless a date candidate is valid. Valueless operators
drop the value and mount no operand editor. `date-value.ts` only bridges wire
shapes and accepted summaries; all calendar, timezone, DST, interval and relative
date arithmetic remains in the shared producer/headless modules. No date-owned
file was edited.

## Behavior covered

The browser fixture uses the actual native controller and `useNativeTable`, with
explicit controlled proposals and synthetic records. Tests cover:

- Owner exclusion, native Any results, independent same-field IDs, Duplicate,
  allowed Negate/replacement drafts, exact Remove and builder-only Clear.
- Accepted-only chips/join/choices, delayed accept/reject, safe callback failure,
  submission rather than false application announcements, no fake pending mirror.
- Confirmed text/number/range/custom input, whitespace, numeric zero, nonfinite
  rejection, valueless Boolean, membership final deselection and atomic resets.
- Draft Cancel/Escape/backdrop, focus restoration, keyboard-reachable segments,
  overlay focus trapping, external rule/scope/access/epoch invalidation and
  unrelated-page preservation.
- Real date day/range segments, incomplete/invalid preservation, operator
  cardinality replacement, exact milliseconds, symbolic relative values and
  valueless date operators.
- Async stale ABA, off-page selected labels, honest ID fallback, local loading,
  empty/error/retry, terminal access loss, passive lifetime and stale-token rejection.
- 320px RTL whole-rule groups/contained overlays; light/dark containment at
  1440/1024/768/390/320 and enlarged text. Runtime page errors are checked in every
  scenario. English RTL is not Arabic localization or assistive-technology proof.

## Commands and latest evidence

Run from repository root, using existing dependencies only:

```sh
pnpm exec playwright test --config tests/filter-tools/builder/playwright.config.ts
pnpm exec tsc -p tests/filter-tools/builder/tsconfig.json
node node_modules/typescript-5-9/bin/tsc -p tests/filter-tools/builder/tsconfig.json
pnpm exec biome check packages/heroui/src/filters tests/filter-tools/builder
```

The isolated browser harness exclusively owns port **6433** and writes Vite cache,
JSON, screenshots and traces to ignored `.artifacts/` under this directory. It
does not write shared builds or require root discovery/config edits.

- Final Chromium rerun: **55 passed, 0 failed**, retaining all original 27,
  the 14 n5/n6/n7 review/source-style checks, four n10 choice checks and three
  n11 duplicate/union checks, plus seven n13/n14/confirm-style checks. All
  scenarios retain runtime-error assertions. Exact runner output is
  recorded in `.artifacts/results.json`.
- Scoped Biome: passed; no weakened lint/type flags or unsafe assertions added.
- Strict TypeScript **6.0.3 and 5.9.3 pass**, using main's current genuine-entry
  HeroUI compatibility patches. Current logs: `.artifacts/n13-n14-typescript-6.log` and
  `.artifacts/n13-n14-typescript-5.9.log` (empty on success). Earlier TS2320 blockers
  are historical, not the current result. This worker neither patched vendors nor
  enabled skipLibCheck.

Screenshots in `.artifacts/results/` include 320px RTL overlay and 320px light/dark
builder groups. These are synthetic provisional visual evidence, not maintainer
taste approval.

## Independent review corrections n5/n6/n7

All three supplied findings were independently reproduced **before implementation
changes**: stale Apply overwrote externally accepted 30 with 12 while the same DOM
button remained connected; same-key retained refresh failure omitted warning and
Retry; reopened Next paired A's cursor with the empty term. The three desired
regressions failed before and pass after. Before JSON/traces/attachments and
source fingerprints are retained in `.artifacts/review-before/`.

- **n5:** Mutation handlers read `controller.getSnapshot()` and recheck the draft's
  owner, definition, scope/access/epoch and exact accepted rule baseline before
  validating/submitting, with a second check immediately before dispatch. Validation
  uses the live accepted query/evaluated time, not the rendered query. Rule actions,
  immediate choices/final deselection, opening/editing and builder Clear/Any receive
  corresponding live-baseline guards. Unrelated page/presentation revisions do not
  invalidate a rule draft. Stale controls close without mutation, restore focus
  and show the replaceable `messages.staleDraft` safe message. No controller wrapper,
  query mirror or controller acceptance behavior was added.
- **n6:** `notice: "load-failed"` renders warning plus supplied Retry even when
  `display: "options"` retains a page. Retained options/selected labels remain
  visible and honestly disabled until the current retry settles. Retry checks the
  live source request/context rather than acting on a replaced context.
- **n7:** Reopened search seeds from displayed-page/current-request provenance.
  Next is available only for a matching displayed term. Its event handler rechecks
  the live source's current page/token/context and uses the displayed request's
  term together with the app's opaque cursor; a reentrant source change invalidates
  that action. It never derives a cursor from a guessed page-key format.

The added tests also exercise same-turn stale Duplicate/Negate/Remove/Clear/Any,
immediate addition/final removal, external rule removal, live source-context
invalidation and valid own proposal acceptance after unrelated changes. The
fixture verifies its CSS response and computed flex/wrap styles directly from
source, without rewriting stylesheet paths in memory. No fixture-path failure was
reproduced in the current direct harness; this is **not** packed CSS verification.

Final normal-exit report: `.artifacts/review-after/results.json`. The earlier
traced run printed all 41 passing but hit the host deadline during teardown before
replacing its JSON report; the stale preceding expanded-failure report is explicitly
named `previous-expanded-failures.json`, not successful evidence. The subsequent
untraced full run exited normally with 41 passing. Traces and provenance attachments
from the traced run remain under `.artifacts/review-after/results/`; see
`traced-run-note.txt`. Source hashes and the explicit aggregate algorithm are in
`review-before/source-fingerprints.json` and `review-after/source-fingerprints.json`.

## Residual independent review correction n10

The same-turn stale-choice repro was independently verified before the fix:
enabled term-A membership options submitted a proposal after the real source had
begun term B (`pending`, no page, `canChoose: false`) but before React committed.
The caller could then accept that proposal. Two related desired regressions also
failed: an old scalar click after a new ready token, and final deselection after a
same-key ready-page refresh disabled that ID. A fourth positive control (same-token
selected-label recovery with unchanged eligibility) already passed. Before result:
**3 failed / 1 passed**. Exact JSON, live-DOM/proposal/source attachments and failing
traces are under `.artifacts/n10-before/`.

The shared discrete scalar/membership handler now reads the actual source snapshot
and calls the existing `projectOptionSourceView` with expected context and accepted
field IDs read from the live controller. Before forwarding **any** choice or empty
membership callback it checks live `canChoose`, exact request and displayed page
provenance, and the current eligibility/disabled metadata of the affected IDs.
Page metadata overrides recovered labels for eligibility. Unchanged selected IDs
may be preserved; scalar replacement checks its newly chosen target rather than
treating implicit removal of a prior scalar as a separate disabled-option click.
The existing controller baseline guard remains the final rule-ownership boundary.

A stale choice produces only the existing safe local `staleDraft` notice. It does
not dispatch, accept a proposal, start/cancel requests, erase an applied rule or
globally invalidate a draft. Normal loading/error may keep the editor and typed
input alive. Static choices have no async-source guard. Explicit rule Remove is
independent, and is tested while the option source remains pending. No public
signature, source factory, registry or controller wrapper was added.

Protocol verification used the actual factory: a second `succeed` for an already
settled exact token returns false, so same-key changed disabled-page metadata is
tested through a genuine new request/page. `recoverSelectedLabels` can update
labels for the current token after settlement without replacing that page; this
label-only case remains eligible and passes as a positive control. The tests do
not invent a mutable-page or same-token second-settlement protocol.

Current focused command:

```sh
pnpm exec playwright test choice-review.spec.ts --config tests/filter-tools/builder/playwright.config.ts
```

All four n10 checks pass after the fix; the final full normal-exit run passes
**45/45**. Final report, per-file library source fingerprints, aggregate algorithm
and before/after summary live under `.artifacts/n10-after/`. The production source
change for n10 is only `packages/heroui/src/filters/value-editors.tsx`.

The fixture's three filesystem-relative CSS imports have also been replaced by
Vite aliases resolved from this config's own URL and the installed vendor package.
They no longer depend on the CSS document being at a particular relative depth,
which is brittle when a reviewer serves an isolated copy. The ordinary harness
still reads the real source styles; direct CSS-response/computed flex/wrap checks
and viewport tests pass without an in-memory absolute-CSS substitution. This is
fixture portability/source styling evidence, **not** packed production CSS proof.

## Residual independent review correction n11

The exact duplicate-async-rule repro was independently reproduced before code:
seed Person membership `[99]`, invoke the actual Duplicate action, open either
independently identified rule against a fresh ready/canChoose page, then click a
currently enabled choice. Both normal addition and final deselection threw
`Invalid Tableweave option source input.` and produced no proposal because the
new live projection received concatenated field IDs `[99, 99]`. **Both regressions
failed before**. Their exact runtime errors, snapshots, source hashes and failing
traces are retained under `.artifacts/n11-before/`.

`acceptedOptionIds` now centralizes the existing `Set<ScalarId>` field-wide union
for both `OptionOwners` and the live event projection. It only deduplicates a new
input array; it does not mutate either rule, coerce IDs, copy normalizer policy or
relax the headless source's duplicate-input rejection. This helper is private and
must not become a new root export. No public signature changed.

Three focused checks pass after the correction:

- A valid current choice proposes/accepts a change to only the edited duplicate;
  the other rule's stable ID and `[99]` operand are unchanged. Membership ordering
  remains the headless normalizer's policy, not an assertion about UI array order.
- Final deselection removes only the target duplicate; the other `[99]` rule and
  its known selected label remain present and usable.
- A pure frozen-input union/projection proof preserves numeric `0` and string
  `"0"` separately, excludes another field, leaves inputs/the controller untouched,
  and confirms that directly projecting duplicate IDs still throws. This is an ID
  collection proof, not an attempt to admit mixed IDs into a homogeneous schema.

```sh
pnpm exec playwright test duplicate-choice.spec.ts --config tests/filter-tools/builder/playwright.config.ts
```

The final full source run exits normally with **48/48 passing**, including the
earlier n10 pending/ready/disabled stale-choice blocks and valid same-token label
recovery. Final JSON, source/fixture fingerprints and a before/after summary are
under `.artifacts/n11-after/`. Strict TS 6.0.3/5.9.3 and scoped Biome pass without
flag changes. Direct source CSS checks and the existing real config aliases remain
enabled and pass; no programmatic CSS substitution or CSS omission was used.

Only the shared private union helper and its live caller changed in production
source (`option-owners.tsx`, `value-editors.tsx`). All other n11 writes are in this
fixture directory. No shared build or dist file was written; main's concurrent
emitted-runtime run/hash guards remain outside this worker's scope.

## Combined-review corrections n13/n14 and confirm-style handshake

Both reported failures were independently reproduced on the n11 source before
implementation changes. Escape from a selected static membership option removed
the accepted rule; Escape from a selected async membership option submitted an
extra controlled removal proposal. The static scalar control already behaved
correctly. The scoped real axe scan reported exactly three
`label-content-name-mismatch` nodes: visible `Filters`, `30` and `alpha` with names
that omitted those texts. Before result: **3 failed / 1 passed**. Snapshots,
three-node axe output, runtime checks, traces and the n11 source fingerprint are
retained under `.artifacts/n13-n14-before/`.

The installed ListBox API supports `escapeKeyBehavior="none"` for contexts where
Escape is handled externally. Builder listboxes now use it and let the actual
Popover dismiss the local draft and restore focus. There is no key-event
propagation bypass and no membership `disallowEmptySelection` workaround. Static
and async Escape checks preserve query/results, proposal and request counts.
Explicit keyboard Space selection and final membership deselection still work.

### Exact accessible-name / selector contract

Add/value triggers use rendered children plus a visually hidden contextual prefix,
without an overriding `aria-label`. Their visible content is not aria-hidden.
Browser whitespace normalization applies to the computed name as usual.

| Trigger | Default computed name |
| --- | --- |
| Add, visible `Filters` | `Add filter rule: Filters` |
| Field | `Field: <field label>` — unchanged |
| Operator | `Operator: <visible operator label>` — unchanged |
| Value | `Value: <field label>: <accessible text of the rendered summary>` |
| Options icon | `Rule options: <field label>` — unchanged |

Examples include `Value: Amount: 30`, `Value: Note (hidden column): alpha` and rich
`Value: Amount: 0 units`. A valueless operator still has **no value trigger/editor**.
Context/action/filter strings come from the existing replaceable messages; field
and operator labels remain application presentation. The Arabic fixture verifies
`إضافة شرط: الفلاتر`, `القيمة: المبلغ: 0` and mixed-script note text against the real
rendered labels. It is not a complete localization or screen-reader acceptance run.

The existing `formatValue` property now returns `ReactNode`, a compatible widening
for existing string formatters, with no new prop. Summaries render the returned
presentational content directly—never `String(reactNode)`. Typed JSX, nested rich
summary text, numeric zero, text `false`, raw whitespace and valueless Boolean false
are covered. Applications still own sensible, noninteractive accessible formatter
content.

Owned tests now query semantic prefixes rather than an obsolete exact value-only
name. Downstream fixture/stories owners must update their selectors after the
active emitted-byte guard ends; this worker did not edit those files. Examples:

```ts
page.getByRole("button", { name: /^Add filter rule:/ });
page.getByRole("button", { name: /^Value: Amount:/ });
page.getByRole("button", { name: /^Value: Note \(hidden column\):/ });
```

Scope repeated-field queries to their stable rule group/ID as before. Tests that
specifically verify naming may use the full computed name above.

### Shared confirm styling and actual source stylesheet

Only builder Apply receives `className="tw-confirm-action"`. The class definition
is main-owned in root `packages/heroui/src/styles.css`; it is not copied into the
fixture or builder CSS. The fixture now imports the actual root stylesheet through
`@builder-source/styles.css`, resolved from its Vite config URL, alongside the
installed vendor styles. It no longer imports only the filter/date child files.
The consumer contract remains the root `@tableweave/heroui/styles.css` entry.

Enabled Apply passes real scoped axe scans in light and dark, and computed custom
properties match the shared foreground/background helper tokens. No hex/theme
override or disabled axe rule was added. Main's separate NativeCollection/header
contrast work is not claimed verified by this builder-only fixture.

```sh
pnpm exec playwright test dismissal-names.spec.ts --config tests/filter-tools/builder/playwright.config.ts
```

All seven focused checks and the final full **55/55** normal-exit source run pass.
The final strict checks use TS 6.0.3 and 5.9.3 with unchanged flags; the optional
ARIA label is omitted via a conditional spread, not weakened to accept undefined.
Final JSON/axe/name/style evidence, source/fixture fingerprints and the aggregate
algorithm are under `.artifacts/n13-n14-after/`. No root stylesheet, private date
primitive, toolbar, combined fixture, story or shared emitted/dist file was edited.

## Remaining main work / limits

Main has integrated public exports/CSS and compatibility patches, but must rebuild
the latest n13/n14 source when its frozen emitted run permits, update downstream
Add/value trigger selectors, and rerun emitted/packed checks before renewed
runtime/packed approval. Main still owns
the updated emitted/packed checks, Storybook and independent packet review. There
is no worker claim of SSR, packed consumer, real backend, actual macOS,
screen-reader, browser-engine matrix, performance or release readiness. No install,
shared build, root export/config change, date producer edit, commit, push, merge,
deployment or publication was performed by this worker.
