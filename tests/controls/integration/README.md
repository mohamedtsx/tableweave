# Combined public controls fixture (WP-08)

## Initial allocation and worker handoff

Authorized writes are only `tests/controls/integration/**` and
`apps/storybook/src/controls/**` in `/tmp/opencode/tableweave-wp08`; browser port
**6483**. No producer/library, shared config/styles, ledger/docs, Git, dependency
installation, package build or delegation is authorized here.

This fixture composes the approved SelectionToolbar, Sorting, ColumnChooser,
Pagination, correction hook and guarded NativeCollection through public package
imports. Each example has one actual controller/native pipeline and one app-owned
resource lifetime. App transport, request bindings, context, actions and correction
epochs are application concerns, not a new table facade or backend authorization.

Main has supplied real public `dist` entries and a genuine isolated pnpm install.
The emitted fixture uses those entries and the exact declaring vendor packages,
not the previous borrowed links, primary-worktree imports or a library source
fallback. There were no installs or package builds by this fixture owner.

WP-07 tools are absent from this tree. The first app-owned scratch-note portal
proves ONLY toolbar normal-region lifecycle, not FilterBuilder/Search integration.
Main has delivered the final WP-07 dependency at
`46df932cd6076450ffb67d711a6e747d7b2aaf72` (PR #7, open/unmerged). It is not
ad-hoc copied here. Combined WP-07 checks wait for main's stack and a new lease.

Completion requires actual public emitted-root browser checks, genuine Storybook
plays with completion/exception gates, controlled/stale/resource/privacy cases,
independent examples, RTL/narrow/theme/axe checks, and frozen own-file fingerprints.
Main separately owns portable declarations, genuine archive staging/allowlists,
full workflow checks and independent approval.

Current result: **23 Chromium integration tests pass**, public emitted declaration
checks pass both TypeScript 6.0.3 and 5.9.3, and source-only checks also pass both.
Full scoped Biome formatting, import organization and lint now pass **28 files**.
This is a scoped engineering handoff, not independent approval or archive proof.
Main owns the pending real Storybook build/play run, archive installation/replay,
WP-07 stack and full workflow checks. The four real Storybook play definitions are
strictly typechecked, **not claimed executed**.

## Existing public API used (no new facade)

`apps/storybook/src/controls/ControlsExample.tsx` is the actual composition; `model.ts`
is its synthetic application owner, not library runtime. All library imports use
`@tableweave/react`, `@tableweave/react/contracts`, `@tableweave/heroui` and the real
public CSS entries. No private source import appears in the application example.

The exact current control props used are:

```tsx
const view = useNativeTable(definition, controller, nativeInput);
const input = { native: view, expected, source }; // one coherent render input
useLayoutEffect(() => { committed.current = input; });
const presentation = projectControls(definition, input);
const authority = createControlsAuthority({
  definition, controller, queryIdentity: view.state.queryIdentity,
  context: expected, mode: "server", resource,
  readCommitted: () => committed.current,
});
// Factory owner references are checked, not inferred from equal queries/schemas.
const owner = getControlsAuthorityOwner(authority);
const target = { definition, view, presentation, authority };

<SelectionToolbar
  presentation={presentation}
  authority={authority}
  normal={<><Sorting {...target} /><ColumnChooser {...target} /></>}
  actions={[{ id: "review", label: "Queue review", onAction: appAction }]}
  getRestoreFocusTarget={appFocusTarget}
  onError={safeAppFeedback}
/>
<NativeCollection
  view={view} label="Records" rowHeaderColumnId="name"
  selectionColumnId="selection"
  columnTextValue={columnText} rowTextValue={rowText} cellTextValue={cellText}
  controls={{ definition, presentation, authority }} diagnostics={false}
/>
<Pagination
  schema={schema} presentation={presentation} authority={authority}
  onRetry={() => { authority.retry(); }}
/>
```

The snippet illustrates existing props; the executable file contains initialized
commit-phase ports, the client/server discriminant, memoized origin authorities,
actual application acquisition, immutable request bindings and safe feedback.
It does not pass `authority.read()` results off as render facts.

Root message APIs actually imported/typechecked: `CollectionMessages`,
`defaultCollectionMessages`, `ColumnChooserMessages`, `defaultColumnChooserMessages`,
`SortingMessages`, `defaultSortingMessages`, `SelectionToolbarMessages`,
`PaginationMessages` and `paginationMessages`. There is no invented selection
default-message export. Collection/selection accept partial overrides; chooser,
sorting and pagination dictionaries are complete replacements. Arabic dictionaries
replace all owned copy and the real `react-aria/I18nProvider` supplies vendor locale.
The actual default Cancel accessible name is `Cancel — Clear row selection`.

## Application ownership and correction protocol

- A single `ExampleOwner` per table creates one controller and one resource adapter.
  The application effect alone calls `resource.connect()`. All controls and the
  guarded collection share the same actual native view, presentation and genuine
  authority. The two-table scenario creates independent owners/lifetimes.
- Initial criteria are a real accepted `score > 0` builder rule. The app-owned
  scratch note is explicitly unrelated to criteria: its portal/draft is removed
  with the toolbar normal region; Cancel selection preserves accepted criteria.
  This is **not WP-07 FilterBuilder/Search evidence**.
- Server request initiation uses real atomic `beginControlsRequest`; settlement
  uses the actual adapter token and `resource.succeed/fail`. Retry goes through the
  real authority/adapter retry path, whose app callback binds the new token and
  increments the actual transport count. The scenario buttons explicitly settle
  this synthetic application transport. No network/backend integration is claimed.
- The synthetic server service supports this fixed positive-score criterion and
  actual requested sort/page metadata. Client mode uses exactly one native
  TanStack filter/sort/page pipeline. No rows or native models are reconstructed.
- Custom action callbacks receive all IDs and the actual loaded/missing subsets.
  Queue review updates a real app-owned local queue; synthetic callback failure
  changes safe feedback without exposing the private exception. Scope/access
  invalidation clears queue/note state and requests selection cancellation.
  UI controls and selected IDs are not backend authorization.
- All query changes are genuinely controlled at the application boundary. In the
  default example the app accepts the real proposal in a guarded microtask; the
  controlled scenario exposes real Accept/Reject buttons instead. There is no
  speculative query or selected-key state mirror.
- For query proposals, the app advances its current intent `epoch` **before
  acceptance**. Explicit external query/clock/navigation/reset intents advance it
  before dispatch. Context changes also advance it before publishing new context.
  Clamp proposals/acceptance and their requests/responses do not advance the tag.
- `acceptedEpoch` is only the causal origin of the accepted render. A pending or
  rejected user query proposal does not relabel the old accepted page with its new
  tag. Thus old effects are denied by `readCurrent` and a new render cannot replace
  a pending user navigation with an old-page correction. It is not query data.
  A genuine accepted query or intentional external accepted no-op acknowledges
  the new tag. Correction acceptance keeps the same causal chain.
- The mounted correction hook receives the existing public API exactly:

```tsx
const port = {
  definition, context: app.context, epoch: app.acceptedEpoch, owner,
  readCurrent() { // own DATA method; original receiver is required
    const current = this.owner.getSnapshot();
    return { context: current.context, epoch: current.epoch };
  },
};
usePaginationCorrection(controller, presentation, authority, port);
```

This synchronous, pure own-data method is essential: detaching it loses `this.owner`
and cannot authorize the tested clamp. The hook stays mounted across page changes.
Real shrink responses and controlled rejection prove the one-attempt bound;
explicit new app intent opens a new chain. An async `readCurrent` is a negative
type fixture, not a supported API or universal Promise-containment claim.

## Runnable checks and actual evidence

From `/tmp/opencode/tableweave-wp08`:

```sh
# Captures all public runtime/declaration/CSS outputs, without building anything.
node tests/controls/integration/capture-roots.mjs --before
node tests/controls/integration/check-types.mjs
pnpm exec playwright test --config tests/controls/integration/playwright.config.ts
node tests/controls/integration/capture-roots.mjs

# Explicitly separate SOURCE ONLY feasibility check, not public/archive evidence.
node tests/controls/integration/check-types.mjs --source

# Full scoped formatting, import organization and lint, without writing source.
pnpm exec biome check apps/storybook/src/controls tests/controls/integration
```

Results:

- **23/23 Chromium** on 6483: real composed controls/collection, loaded/missing
  action effects, safe failures, normal portal cleanup/focus and criteria survival,
  controlled row/Cancel reject versus accept, single keyboard/no page-all,
  eligible page-all/off-page IDs, retained A with requested B pending/failure,
  Retry token transport, known/unknown/zero metadata, same-turn external accepted
  selection/query/visibility/scope before old connected DOM callbacks, scoped old
  app action denial, latest accepted header sorting, real chooser/header fallback,
  hidden-primary priority/ARIA, independent tables and access masking before effects,
  real page size changes, synchronous receiver-bound correction, bounded/rejected
  correction chains and pending user-proposal preservation.
- Four RTL/theme combinations at 320px pass scoped axe and actual provider/copy
  assertions. Unchecked collection checkbox boundaries are measured against their
  actual opaque ancestor backdrop and asserted **at least 3:1**, not merely a
  nonzero border. JSON color/ratio evidence is attached per test.
- 1440/1024/768/390/320 document containment and open chooser at 200% CSS text
  expansion pass. This is not real browser zoom, touch or manual AT proof.
  Light/dark/RTL 320 and light 1440 screenshots were visually inspected.
- Emitted public roots: **TS 6.0.3 and 5.9.3 pass**, strict/exact optional/full
  library checking. Positive/negative fixtures cover root message exports,
  guarded-definition requirements and rejecting async correction envelopes.
  `--listFiles` logs are checked to reject library `packages/*/src` fallback.
- Source-only checks also pass both compilers and are labelled separately.
- **Full Biome check passes 28 files**, with no disabled formatting/import-order
  checks. Formatting/import changes were applied through patches confined to the
  two owned scopes. Biome's stdin mode generated candidates without writing source;
  there was no global/source formatter write. Main's full workflow remains pending.
- The formatted `integration.spec.ts` is AST-equivalent to its prior frozen
  version: all **110 assertion entry points** are preserved, with identical AST
  digest `1ce51fd6fa498b03d29461d8fed823b69a7883a2731f1c83547160e4e9bc0013`.
  `.artifacts/formatter-assertions.json` records the prior frozen file digest,
  formatted digest and both AST/count observations. No product assertions or
  public APIs changed during the formatting/Storybook-gate followup.

Current followup logs are `.artifacts/browser-followup.log`,
`public-check-followup.log`, `source-check-followup.log`, `biome-followup.log`,
and the `public-typescript*.log`/`source-typescript*.log` compiler file lists.
Earlier `browser.log`, `public-check.log`, `source-check.log`, `lint.log` and
exploratory diagnostics remain historical, not the current full Biome result.
Browser screenshots/contrast attachments are under `.artifacts/browser`.
The stale-event helper records actual layout-commit counters and connected DOM,
plus the accepted revision immediately before/after the old action.

The harness resolves real local declaring packages with `createRequire`, including
the Storybook 9.1.21 Chai namespace from its own `@vitest/expect` dependency.
There are no committed vendor symlinks or primary-worktree aliases. Ordinary browser
requests are checked against forbidden primary paths and library-source fallback.

## Frozen public outputs

Before/after manifests are `.artifacts/roots-before.json` and `roots-after.json`.
All **137** public JS/declaration/CSS files remain byte-identical; aggregate:

`0fa7dd24a8060f94b71e9dc872d2a835dfc48d3aa6da2eb5af5ca2ff98f46a6f`

Selected before/after SHA-256 values (identical):

| Entry | SHA-256 |
| --- | --- |
| `packages/react/dist/index.js` | `756ad9c8afaeddaf8642e0dcf3e7ba92492ba48a5038a1605ba80bd126aba13b` |
| `packages/heroui/dist/index.js` | `1a9efc08852f1ee0140adeba12849de40a555a563fa2970ea75c3dd1508ab48b` |
| `packages/heroui/dist/styles.css` | `57ed68bf91949cf362468d89e7381b2dcaa58957cba994be8511e0cb5096d024` |
| `packages/heroui/dist/columns/controls.css` | `032b1f6f5d5f5bcfe3b5be7af4ee99796e92970317920ec83f1e511cf25d16f2` |
| `packages/heroui/dist/pagination/styles.css` | `3b767b48627931cb0db47db0cb901fb216284be9a5b39ff23c1f9826a0278b54` |

Main supplied the actual installed declaration patches, including the approved
HeroUI ListBox patch. This fixture changed no patch, dependency, version, lockfile,
strict compiler flag or public output. Own-file frozen fingerprints are separate
in `SHA256SUMS` and can be checked with `sha256sum -c` from the worktree root.

## Actual Storybook play gate definition

Four stories import the pinned `storybook/test` **userEvent**, `within`, `waitFor`
and awaited `expect`. They perform real pointer/keyboard and assertion work.
No `fireEvent` export is assumed or used. The wrapper sets `data-play-state` to
`completed` only after every awaited operation/assertion; failures set `exception`
and rethrow. Rendering a button/canvas is not play completion.

After main supplies the real built Storybook/discovery:

```sh
CONTROLS_STORYBOOK_DIR=/absolute/main-built/storybook-static pnpm exec playwright test --config tests/controls/integration/storybook.playwright.config.ts
```

This read-only static server uses **6483**, requires the real `index.json`, and
runs the actual iframe plays. The runner checks each story exists, waits for
the own `completed` marker and the **actual Storybook host** finishing that same
story with autoplay and a real play function. The version-pinned read-only helper
in `storybook.play-completion.ts` adapts Tableweave's own primary filter-tools
test helper; it has no cross-workspace runtime import or missing WP-07 alias.
It reads `__STORYBOOK_PREVIEW__.channel.last` and `currentRender` only; it never
emits events, invokes play, assigns preview state or fabricates host success.

The helper requires matching requested/rendered/finished story IDs, actual
`phase:"finished"`, terminal `status:"success"`, `autoplay:true` and a play
function. It independently rejects cached `playFunctionThrewException`,
`storyThrewException`, `storyErrored` and `unhandledErrorsWhilePlaying` events,
because a Storybook-caught error can still end at a successful terminal phase.
Reporter statuses must be the pinned non-failing `passed`/`warning` values;
failed or malformed reports fail the probe. The own marker, no page errors and
no actual `sb-show-errordisplay`/`sb-show-nopreview` body class are additional
checks, not replacements for host completion. Observations attach as JSON.

All four flows retain their real `userEvent` assertions. The host probes use a
60s test budget but are currently **typechecked only, not executed**. Main will
run a DIRECT Storybook application build after this file freeze, never a root
wrapper/package rebuild for these probes. No successful built play execution is
claimed by this fixture owner.

## Prepared development archive helpers — not production evidence

The optional development helpers require a genuine tarball-installed consumer under
`tests/controls/integration/.artifacts/archives/<consumer>` with the public packages,
their exact peers, React types, Vite/Tailwind plugin and both compiler versions.
No script here packs, installs or edits a manifest/lockfile.
Main's separate production archive driver under `tests/foundation` owns the actual
archive proof; it copies the real application files and all 23 assertions into its
genuine consumer without aliases/source fallthrough. It does not depend on these
prepared development staging helpers or their owned output location.

```sh
export CONTROLS_ARCHIVE_ROOT=/absolute/owned/.artifacts/archives/consumer
node tests/controls/integration/archive-stage.mjs
node tests/controls/integration/archive-types.mjs
pnpm exec playwright test --config tests/controls/integration/archive.playwright.config.ts
```

Staging copies only the owned application/fixture files, including the positive/
negative public type fixture. Its generated strict config has **no** workspace,
public-package or vendor aliases. Type checks require every resolved file,
including compiler libs, to stay in that installed consumer. The archive Vite CLI
and Tailwind plugin must also resolve inside it; the application resolution plugin,
filesystem boundary and browser request audit reject external runtime fallback.
Unlike the local emitted fixture, archive mode uses no public-root aliases.

These archive scripts are a prepared replay boundary, **not executed archive
evidence**. Main still owns genuine tarballs, portable declaration/archive allowlists
and independent verification of this boundary.

## Remaining gates / exact next step

Main reviews the application causal protocol and public fixture fingerprints,
runs the real Storybook play gate and genuine archive replay against its frozen
outputs, commits the transport and stacks WP-08 on the final WP-07 dependency.
Actual FilterBuilder/Search/date/tabs crossintegration requires a new explicit
lease in that stacked tree; the current fixture remains controls-only.
Do not substitute scratch-note lifecycle or static criteria text for real WP-07
tool/chip/draft behavior. No public DataTable facade, package build, SSR/hydration,
manual AT, real consumer, performance, release or publication proof is claimed.

## Subsequent main-owned profile observations

The first23 cases are historical controls-only proof. Main's current inventory is
38:13 application-mandatory-reset regressions plus plain StrictMode and rapid
physical reopen. Ordinary controlled rejection and all original assertions remain.
Old public0fa7dd… evidence is preserved in roots-before-unpatched-historical.json;
new frozen137-file output guard is9068ff9570a73137ea1b9e28d65b1bfe9e726d59ef4825527be31e3539fc55a0.
Only two library JS files change for the approved popover animation mitigation;
declarations/CSS and the other135 library outputs stay unchanged.

Main's fresh documented emitted38 and four actual built Storybook plays pass.
Genuine profiled archive production38 also passes, report
`.artifacts/packed-cEz7Tp/report.json` at the repository root. This lane extracts the
six reviewed compat assets before a separate clean consumer install, explicitly
registers the user-selected runtime patch and verifies actual bytes before/after
browser execution. The unpatched type/runtime-import consumer remains separate and
its runtime bytes are unchanged; the profile CLI rejects it with E_VENDOR.

The first packed profile attempt is retained as a harness failure: --ignore-workspace
ignored the consumer's own patch configuration, so all vendor bytes stayed unpatched
and verification stopped before browser tests. The corrected lane proves pnpm chose
the consumer's own workspace and retains frozen reinstall/strict peer/script guards.

The historical30-file worker manifest is preserved as WORKER-HANDOFF.sha256 after
the disclosed cwd, scope-reset and two public regression changes. SHA256SUMS now
records the reviewed source handoff; the historical inputs are not relabeled green.
Main's ordered isolated workflow completes504 units/42 asset checks/250 browser
executions plus38 actual-profiled production cases. Real WP-07 composition and
final stacked workflow remain required; manual AT/device/performance/real-consumer/
legal/full-G05 remain separate.
