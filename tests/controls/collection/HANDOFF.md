# WP-08 shared collection handoff

Status: independently reviewed for scoped source integration. Main-owned light
group-header contrast is resolved below; no full packet acceptance. No packet approval,
emitted/packed integration, release, commit or merge is claimed.

## Scope

Renderer writes: `packages/heroui/src/table/native-collection.tsx`,
`controlled-collection.tsx`, `collection-messages.ts` and this test directory only.
The earlier core producer work was stopped before this allocation. No core,
root/export, shared CSS, dependency, manifest, lockfile, ledger or Git edits were
made during this renderer allocation. Browser work uses port **6469** only.

## Exact NativeCollection props

The generic constraints remain `S extends QuerySchema, T extends object`.

```ts
interface NativeCollectionProps<S extends QuerySchema, T extends object> {
  readonly view: NativeTableView<S, T>;
  readonly label: string;
  readonly rowHeaderColumnId: string;
  readonly selectionColumnId?: string;
  readonly columnTextValue: (column: NativeColumn<T>) => string;
  readonly rowTextValue: (row: NativeRow<T>) => string;
  readonly cellTextValue: (cell: NativeCell<T>) => string;
  readonly controls?: {
    readonly definition: NativeDefinition<S, T>;
    readonly presentation: ControlsPresentation<S, T>;
    readonly authority: ControlsAuthority<S, T>;
  };
  readonly messages?: Partial<CollectionMessages>;
  readonly diagnostics?: boolean;
}
```

`getControlsAuthorityOwner(authority)` must return the exact supplied definition
and `view.controller` before guarded projection, require or target commands.
Missing factory provenance and mismatched owners mask without raw errors or
authority port reads. Query/schema equality is never an owner proof. Existing
authority guards still own current scope, access, mode and resource freshness.

Guarded rows come solely from presentation and must match the actual current-view
row objects. Empty authorized presentations may intentionally hide retained native
rows. Masked/incoherent guarded input renders an empty `tw-native-collection`
container before cell/row formatting or subscription. There is no render-time
native getter fallback, fabricated row model or second processing pipeline.

Without controls, prior native-only callers retain their minimal API and memoized
native selection subscription. Selection mode always comes from the supplied
view. Guarded diagnostic counts use guarded IDs, not the unmasked subscription.

## ControlledCollection additions

Existing required props remain `label`, `columns`, `rows`, `selectedIds`,
`eligiblePageIds`, `onSelectedIdsChange`, `sorting`, `onSort`.
The new optional props are:

```ts
readonly selectionMode?: "none" | "single" | "multiple"; // default multiple
readonly messages?: Partial<CollectionMessages>;
readonly diagnostics?: boolean; // default true
readonly isSelectionDisabled?: boolean;
readonly onPageSelectionChange?: (selected: boolean) => void;
readonly onCancelSelection?: () => void;
```

The root Table carries `tw-native-collection`. `diagnostics=false` removes both
the footer and NativeCollection's diagnostic count. Hiding a valid preferred
row-header leaf uses the first current visible nonutility data leaf. Invalid
utility/missing-header or utility-only data configurations retain owned errors.

## Events and accepted-state ownership

- Row checkboxes are explicitly controlled HeroUI checkboxes with `slot=null`.
  This preserves own labels and actual accepted checks in single and multiple
  modes rather than inheriting the table's checkbox context. They propose IDs;
  they never accept selection locally.
- Single mode has no page-all checkbox. Ctrl/Cmd+A is stopped outside multiple
  mode. A selected row replaces the accepted selection through `selectRow`;
  multiple mode modifies only eligible current-page IDs and preserves off-page IDs.
- Row/page events compare rendered query/definition identities and the complete
  accepted selection baseline against the current controller, then recheck actual
  authority row objects and eligibility. A stale connected DOM action cannot
  replace newer accepted selection. No query-reference owner workaround is used.
- Prefer `authority.selectRow` for a single changed row and
  `authority.selectPage` for page-all. RAC ranges/batches use one native functional
  updater, with baseline/origin/query/rows/eligibility checks repeated inside the
  final updater. Rejected events return the prior selection atomically.
- Escape delegates to `authority.cancelSelection`, even for obsolete rows in the
  same scope, but cannot clear another scope. Legacy native-only calls use the
  existing native Cancel command. This is not builder Clear.
- Header events check owner, call `authority.require({type:"sort"})`, then use the
  actual visible native column's decorated `toggleSorting(undefined, additive)`.
  The native/controller transition reads latest accepted sorting; captured arrays
  are not rewritten. Only a visible primary gets directional `aria-sort`; hidden
  primaries keep real priorities and the complete diagnostic sort description.
- Genuine RAC selection-key objects are retained read-only solely when their exact
  IDs match accepted props. Both the proposed and prior accepted object are kept
  so rejection cannot discard RAC's range anchor. There is no optimistic accepted
  state, vendor-metadata inspection, cached-node mutation or DnD wrapper.
- UI masking and these event guards are not backend authorization.

## Messages

`CollectionMessages` and frozen `defaultCollectionMessages` are defined in
`collection-messages.ts`; consumers may replace any subset. Main owns root exports.

String fields: `pageCheckbox`, `sortOrderLabel`, `sortSeparator`, `notSorted`,
`subscribedCountLabel`, `invalidColumns`, `invalidRows`, `invalidRowHeader`,
`invalidSelectionColumn`, `missingCell`.

Formatters returning strings:

```ts
rowCheckbox(rowText: string): string;
sortButton(columnText: string, direction: "ascending" | "descending" | null,
  priority: number | null): string;
sortEntry(columnId: string, direction: "ascending" | "descending",
  priority: number): string;
sortPriority(priority: number): string;
selectedCount(count: number): string;
subscribedCount(count: number): string;
```

Aria's own localized announcements remain vendor/provider-owned. The fixture uses
the actual I18nProvider for Arabic RTL and replaces every Tableweave message.

## Reproduce and results

Run from `/tmp/opencode/tableweave-wp08`, sequentially for browser commands:

```sh
pnpm exec tsc -p tests/controls/collection/tsconfig.json --noEmit
node node_modules/typescript-5-9/bin/tsc -p tests/controls/collection/tsconfig.json --noEmit
pnpm exec playwright test --config tests/controls/collection/playwright.config.ts
pnpm exec playwright test --config tests/controls/collection/legacy.playwright.config.ts
sha256sum -c tests/controls/collection/SHA256SUMS
```

- Strict TS 6.0.3 and 5.9.3: **pass**, including own positive/negative prop and
  message fixtures, full library checking and installed vendor declarations.
- Original worker renderer Chromium: **26 passed, 1 failed**. The only failure is the light-mode
  grouped-header contrast assertion below. Native/controller/resource producers,
  controlled accept/reject, genuine keyboard range and final-updater access loss,
  precommit connected old row/page/query/scope/Cancel, mismatched actual owners,
  copied/proxied authority, foreign rows, single/none/multiple keyboard, preferred
  header hiding, hidden-primary ARIA, invalid configurations and RTL dark axe pass.
- Read-only prior collection regressions: **21/21 pass** using owned configs on
  6469. Grouping/padding/focus/static-cache/native reactivity regressions are intact.
- Explicit scoped Biome check: **12 files pass** (three renderer files and the
  test TS/TSX/JSON/CSS files; see `.artifacts/biome.log`).
- The width matrix 1440/1024/768/390/320 and contained document scrolling pass
  before the light axe assertion. RTL/dark 320 and light 1440 screenshots were
  visually inspected. No real browser zoom, manual AT or touch claim is made.

Logs are local `.artifacts/chromium.log`, `legacy-chromium.log`,
`typescript-6.log`, `typescript-5-9.log`, `biome.log`. Screenshots and retained
failure traces are under `.artifacts/results` and `.artifacts/legacy-results`.
The stale-event fixture records an actual layout-commit counter plus connected
DOM evidence, not an explicit fixture-state approximation. Range proof now uses
real RAC keyboard gestures; the exploratory React-fiber callback test was removed.

The isolated worktree borrows the already installed primary Storybook vendor
dependencies via `vendor-node_modules` (a test-local symlink) and explicit aliases.
There was no install. This harness assumes that existing primary-worktree path;
main must adapt it for a normal checkout rather than publishing these paths.
Observed versions: HeroUI/styles 3.2.8, RAC 1.22.1, react-aria 3.53.1, React 19.3.1,
TanStack 9.3.1. `ES2023.Intl` supplies vendor NumberRangeFormatPart declarations.
HeroUI MCP lookup failed during initial work; the official v3 Storybook catalog
and matching installed source/types were inspected instead.

## Original main-owned blocker, resolution and next step

At initial handoff, `packages/heroui/src/styles.css` colors `table-column` and
`table-sortable-column-header`, not `table-column-group`. Actual grouped Data and
Metrics headers inherit muted text: foreground `#71717a`, background `#efeff0`,
12px normal, **4.2:1** versus required 4.5:1. These measured values are evidence,
not proposed hardcoded colors. Main should extend its existing foreground-token
rule to `.tw-native-collection [data-slot="table-column-group"]`, then rerun the
entire renderer suite. The failing assertion is retained, not suppressed.

Main adds the missing foreground-token selector. Independent isolated A/B review
removes it to reproduce4.2:1, restores it and passes the complete renderer27/27,
prior21/21 and six fresh privacy/current-metadata probes. Both strict compiler
checks/13-file Biome and all source fingerprints pass. This establishes correction
causally; historical output is retained, not described as a prior pass.
The corrected-only CSS reviewed hash is e40bd1a8e434fe7cb67f11ccee82c1165d26221b85159633985235124c048d87.
Main then adds owned column/pagination stylesheet imports for real packaging;
current entry hash57ed68bf91949cf362468d89e7381b2dcaa58957cba994be8511e0cb5096d024
is recorded in READONLY-DEPENDENCIES. It requires integrated CSS/runtime reruns;
no claim that the earlier reviewer checked these added imports.

Main grants scoped renderer-source technical approval, then wires root message
exports and owned CSS. Next validate actual emitted/packed
consumer integration with the selection/pager/sort-chooser controls. No shared
build, packed test, SSR, performance, real consumer or publication gate was run
by this renderer worker. Their approval remains separate.
