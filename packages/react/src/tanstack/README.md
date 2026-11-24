# Private WP-04 native producer

`index.ts` supplies the root's private producer exports:
`defineNativeTable`, `createNativeColumnHelper`, `createNativeController`,
`useNativeTable`, `NativeBridgeError` and the native definition/input/view types.
`adapter.ts`, `boundary.ts` and `features.ts` are internal implementation/test seams, not escape
hatches to export from the package root.

## Renderer handoff

Create an immutable definition once. All native group/leaf columns require explicit
globally unique IDs. Use `createNativeColumnHelper<Row>()` and its `columns()` helper
for inferred accessor values in native cells. Native `meta.utility` marks fixed,
non-hideable utilities; `meta.rowHeader` is a rendering hint. Controller policies
are derived from this same column tree; direct parent IDs delimit reorder groups.
Every schema-sortable field requires an accessor leaf (hidden is fine). Native
column restrictions can disable, but never add, schema sorting capabilities.
Computed, nested or aliased columns that also filter require an explicit typed
`evaluation.accessors[fieldId]`; native index-aware accessors are not silently
reused with an invented row index or evaluated against an unrelated direct key.
Multi-sort needs both schema `sorting.multi` and definition `multiSort: true`.

WP-08 adds immutable selection modes: omission/false disables selection, true is
backward-compatible multiple, and `"multiple"` / `"single"` are explicit modes.
Definition and view expose `selectionMode`. Single mode is coordinator-validated
at initialization, reduced candidates and final controlled override acceptance;
row intents replace the prior selected ID and actual native multi-select is false.
Supported page-all actions reject in single/disabled mode even on a one-row page.

`createNativeController(definition, options)` uses the definition's explicit shared
registry and composes native restrictions into the coordinator's `validateState`
hook before candidate/proposal publication and final acceptance. The native bridge
requires a controller created for that exact native definition: an arbitrary
WP-03 controller cannot prove the shared registry or installed capability guard.
There is no wrapper with different dispatch/accept semantics. Neither constructor
nor hook fetches anything.

Call `useNativeTable(definition, controller, input)` with complete client records
or the actual server page and explicit known/unknown metadata. The returned view
contains current `rows`, `headerGroups`, `visibleColumns`, accepted `state`,
`selectedIds`, current-page `pageSelection`, `pagination` and controlled actions.
Renderer props must include current models/metadata: native state subscriptions
alone do not notify memoized children about data-only or total/next-flag refreshes.

The supported `view.native` handle is stable for a mounted bridge, while the view
and its current model/metadata props may change. Its `Subscribe` / readonly
`atoms` / readonly `store` support subscribed leaves. Put Subscribe inside a
memoized leaf or pass its changing selected value.
`get()` is not a React subscription. `native.FlexRender` renders native cells/headers.
`rows`/`headerGroups`/`visibleColumns` contain actual vendor models, not a second
collection or row engine. HeroUI/ARIA collection policy is the renderer's owner.

The hook constructs isolated actual v9 core render frames using the pinned core's
store reactivity bindings, rather than mutating a persistent vendor `useTable`
instance during React render. Only a commit-phase effect publishes a frame to
previously committed handles and readonly subscription sources. A suspended or
abandoned render cannot replace their input/options. Real rows/columns keep their
own native table, so retaining a visible row does not follow a speculative table
swap through its model actions. Server rendering reads its initialization frame.
One controller still owns state and only the native pipeline processes rows.

## Controlled processing and supported writes

All supported native slice setters dispatch latest-accepted-state controller
commands, including functional updaters. Native column/row toggle methods and their
handlers are decorated to derive each intent from the latest accepted owner;
vendor toggle helpers otherwise capture old direction/selection before their
functional updater runs. Each supported intent dispatches once. There is no
optimistic native/React mirror.
Native resets are disabled; the coordinator owns filter/sort/size resets. Native
global/column filter writes are rejected: the accepted query produces one hidden
accessor carrier and one composite evaluator in the native filtering stage.
Evaluation uses accepted `evaluatedAt`, never a new render-time clock. Server mode
does not compile a client evaluator and bypasses filter/sort/page processing.

The carrier is excluded from controller policy and all visible models. Application
chooser/custom-action field lists must use the definition/visible data leaves and
exclude utilities, not enumerate every vendor internal column. Frozen projections
prevent ordinary reference mutation; the supported handle excludes `setOptions`,
`reset`, writable base atoms and dataset-wide select-all.

Native row/column/header contexts necessarily retain vendor references, including
their internal table. Mutating `row.table`, internal options/features/atoms, or
calling unexposed reset/global-filter APIs is unsupported. This is an API ownership
contract, not a sandbox or backend authorization boundary. Arbitrary native options
cannot be spread over managed options. Definition/controller replacement requires
an explicit keyed React remount; keep one stable definition/controller per mount.

Records and accessor/evaluator callbacks are immutable/pure inputs. Replace the
records array to refresh; no in-place record mutation detection is promised. Row
IDs must be nonempty unique strings, never array indices. New selection is based
on eligible current-page rows; total selected IDs remain separate from loaded rows.
Unknown totals require `hasNextPage`; only the view's bounded pager actions use it.
Captured view pager/page-selection actions retain a query guard but resolve row
and metadata authority from the latest committed frame, not a stale closure.
Uncommitted metadata never grants or revokes navigation.
Raw `setPagination` is an explicit application/controller intent, not a source of
authoritative pagination metadata. Applications still own stale-resource guards
and identity-tagged page correction (`pagination.clamp`); WP-05 supplies that layer.

## Focused checks

With the frozen workspace dependencies installed, no build is needed for these
source fixtures:

```sh
pnpm exec tsc -p packages/react/tsconfig.json --noEmit
pnpm exec tsc -p tests/native/tsconfig.json --noEmit
node node_modules/typescript-5-9/bin/tsc -p tests/native/tsconfig.json --noEmit
pnpm exec vitest run --config tests/native/vitest.config.ts
pnpm exec playwright test --config tests/native/playwright.config.ts
```

The isolated Chromium/StrictMode fixture uses port 6011 and `/tmp/opencode` caches
and results. Unit fixtures construct the installed matching core with its vanilla
reactivity bindings; the browser uses the actual React hook and includes suspended/
abandoned render regressions. These do not prove
packed exports, grouped HeroUI collections, generated ARIA, full SSR/hydration,
manual AT, resource races, performance or G-01 by themselves. Main owns integrated
build/packing/browser/collection proof and independent gate review.

The isolated-frame correction prioritizes commit correctness. It constructs a new
native instance per parent render; no reference-performance or large-data claim
is made. Optimizing frame reuse must preserve the suspension/model-action tests.
