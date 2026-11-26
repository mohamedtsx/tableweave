# WP-04 grouped collection proof

The static fixture consumes a minimal **controlled presentation projection**;
`/?native` integrates the actual `useNativeTable` producer through
`NativeCollection`. Neither is a second row-processing engine, a final table UI,
or a complete G-01 pass. All records are synthetic. No shared package
exports, manifests, lockfiles, build outputs or Git metadata are changed here.

## Commands and observed results (2026-11-24)

From the repository root:

```sh
pnpm exec playwright test --config tests/native/collection/playwright.config.ts --project chromium
pnpm exec playwright test native.spec.ts --config tests/native/collection/playwright.config.ts --project=chromium
pnpm exec tsc -p tests/native/collection/tsconfig.group.json
pnpm exec tsc -p tests/native/collection/tsconfig.json
pnpm exec tsc -p tests/native/collection/tsconfig.json --module NodeNext --moduleResolution NodeNext
```

- Static Chromium baseline: **9 passed**, including the raw-branch reproducer
  whose expected exception is asserted. Real grouped DOM, balanced and uneven
  depth, standalone selection utility, group pruning/spans, cell order, row headers,
  carrier exclusion, current-page/off-page selection, native checkbox focus,
  controlled sort priorities/primary-only aria-sort, same-ID updates, controlled
  rejection, hidden-padding navigation and scoped axe checks were exercised.
- Strict branch/projection/navigation check: **passed** with exact optional checks
  and `skipLibCheck: false` inherited unchanged.
- Initial full strict browser fixture check was **blocked**, with three upstream TS2320
  diagnostics in React Aria Components 1.22.1 `Group.d.ts:37` (two incompatible
  inheritance declarations) and `OverlayArrow.d.ts:9` (one). No application-source
  diagnostics remained. After main's RAC compatibility patch was installed, the
  integrated strict fixture check **passed** without source suppressions or changed
  strict flags. No compatibility patch/install was performed by this worker.
- NodeNext check additionally exposes HeroUI 3.2.8 extensionless declaration
  imports/related styles exports. The browser fixture deliberately uses Bundler
  resolution, matching Vite; this does not establish NodeNext package readiness.
- The configured Firefox/WebKit projects were attempted, but cannot launch:
  `/home/mohamed/.cache/ms-playwright/firefox-1572/firefox/firefox` and
  `/home/mohamed/.cache/ms-playwright/webkit-2388/pw_run.sh` are absent. No browser
  installation was authorized/performed. Chromium-only commands do not claim
  cross-browser acceptance.

### Integrated native browser run and subsequent producer change

The native-only command above passed **all six initial integrated scenarios** on
the delivered `useTable`-based producer: actual header/cell FlexRender, grouped
visibility and column-order alignment, cross-field Any versus same-field repeated
rules, native filter → sort → page processing, multi-sort priorities and controlled
accept/reject callbacks, concrete cross-page selection and memoized subscribed
leaves, same-ID data-only refresh, metadata-only total/next refresh, and manual
server-page bypass followed by return to complete client processing.

A seventh native keyboard/focus scenario was then added. During the full 16-case
rerun, the producer owner replaced the hook with a committed-frame boundary.
That run was blocked before rendering by unresolved public imports from
`packages/react/src/tanstack/boundary.ts`: `@tanstack/table-core/reactivity` and
`@tanstack/table-core/store-reactivity-bindings`. The strict fixture check likewise
reports these producer errors (plus a Subscribe overload error at the observed
intermediate revision). The timed-out run's own orphaned port-6009 Vite process
was identified and terminated; no unrelated server was touched. The initial six
passes do not establish the changed boundary revision. Rerun after producer and
dependency handoff stabilizes; no final G-01 approval is recorded here.

Vite runs only on `127.0.0.1:6009`, with a local artifact cache. Installed vendor
subpaths are resolved from the existing Storybook dependency set; TS `paths`
entries locate the same installed public declaration entries, not replacement
types. There are no declaration shims.

## Source boundary

- `packages/heroui/src/table/group-column.tsx`: public
  `react-aria/CollectionBuilder.createBranchComponent("column", ...)` and public
  table hooks/context build genuine collection group nodes. Only the group heading
  DOM is emitted by the adapter; HeroUI owns table/header/body/leaf/cell semantics.
- `collection-projection.ts`: excludes internal/hidden leaves, prunes empty groups,
  requires a visible data row header, validates duplicate/reserved column IDs and
  pads unequal-depth leaves with explicit empty collection branches. It never
  processes records.
- `header-navigation.ts`: capture-phase navigation skips only synthetic padding
  nodes and focuses the semantic target cell, letting Aria marshal child focus.
  Other keyboard navigation remains Aria-owned. This prevents `aria-hidden`
  padding headers acquiring keyboard focus.
- `controlled-collection.tsx`: concrete selected ID set, eligible-page selection
  union/difference, loaded-row selection reconciliation preserving off-page IDs,
  controlled primary sort descriptor, explicit priority text/actions, stable row
  IDs and collision-safe cell tuple IDs. No local selection/sort/data store.
- `native-collection.tsx`: public candidate `NativeCollection` with
  `NativeCollectionProps<S extends QuerySchema, T extends object>`:

  ```ts
  {
    view: NativeTableView<S, T>;
    label: string;
    rowHeaderColumnId: string;
    selectionColumnId?: string;
    columnTextValue: (column: NativeColumn<T>) => string;
    rowTextValue: (row: NativeRow<T>) => string;
    cellTextValue: (cell: NativeCell<T>) => string;
  }
  ```

  The current native view is required: a stable handle alone cannot carry data/
  metadata-only refreshes. The adapter maps actual `headerGroups` and the public
  `visibleColumns` allowlist into the collection tree, collapses native placeholder
  headers, renders real native header/cell contexts with `native.FlexRender`, and
  uses native row IDs without sorting/filtering/paging records. A visible data
  row-header field is mandatory; the explicit selection field must be a visible
  fixed utility. Managed native callbacks receive row selection and sorting, and
  header selection calls the guarded producer `selectPage`. The native selection
  mode follows the controller definition. A memoized count leaf contains the real
  `native.Subscribe`; the fixture adds an independently memoized sorting probe.

Header page selection uses `Checkbox slot={null}` to opt out of Aria's required
selection-slot context and dataset-wide `"all"` toggle behavior. Per-row checkboxes
use the real selection slot. Explicit `focusMode="child"` and
`allowsArrowNavigation` are needed for interactive header/selection cells.

Multi-sort header buttons route commands once. Only the primary leaf enables
Aria's native `allowsSorting`, so Aria emits the primary directional `aria-sort`
without false `aria-sort="none"` states on other sorted leaves. The complete sort
sequence is exposed in a status region. The static fixture does not establish row
ordering; the separate native scenarios exercise the actual producer pipeline.

## Verified upstream limitation / workaround

`/?raw-uneven` contains a standalone leaf beside a grouped leaf using only the raw
public branch. React Stately builds a placeholder node without a render function;
React Aria's default collection renderer then throws `node.render is not a
function`. The negative browser test retains the actual exception. Explicit empty
branch padding avoids those synthetic nodes without a private collection override
or nested semantic table markup. Group DOM identity must use `node.key`, not
`props.id`, which collection-node props do not preserve.

## Evidence and remaining work

### Independent review P2: Home/End hidden-padding focus correction

The collection worker independently reproduced both reported keyboard-only paths
before changing source: Home from Identity focused
`__tw_placeholder:3:selection`; End from Metrics focused
`__tw_placeholder:2:location`. The two new regressions **both failed** with actual
focused-element HTML attached. After the correction, both pass. The complete
static Chromium suite now has **14 passed, zero failed**: the original nine plus
the two regressions, visible sibling/nested-leaf scope, Shift+Home/End, and
Ctrl/Meta Home/End/range-chord coverage on Linux Chromium.

Only `header-navigation.ts`, `collection.spec.ts` and this handoff changed for P2.
The guard replaces only hidden local Home/End collection-parent endpoints. It
does not flatten header levels, change markup, make padding focusable, or rewrite
Ctrl/Meta global navigation. Native tab-mode checkbox ownership of non-arrow keys
is preserved, as are Aria's body-grid global/range semantics and eligible-ID scope.
No actual macOS/AT claim follows from the Linux Meta-key checks.

```sh
pnpm exec playwright test collection.spec.ts --config tests/native/collection/playwright.config.ts --project=chromium --grep 'Home from Identity|End from Metrics'
pnpm exec playwright test collection.spec.ts --config tests/native/collection/playwright.config.ts --project=chromium
pnpm exec tsc -p tests/native/collection/tsconfig.group.json
pnpm exec biome check packages/heroui/src/table/header-navigation.ts tests/native/collection/collection.spec.ts
```

Before: **2 failed**. Focused after: **2 passed**. Complete static after:
**14 passed**. Strict group check and scoped Biome check pass. Preserved copies of
the observed runner evidence are under `.artifacts/p2-before/` (JSON and failing
traces) and `.artifacts/p2-after/` (JSON, screenshots/attachments and strict-check
log), so a later combined run does not overwrite this evidence. The native
producer's ongoing correction was not debugged or changed; main owns the combined
rerun after its final handoff. P2 correction is not final G-01 approval.

Generated evidence stays ignored under `.artifacts/`: `results.json`, scoped axe
attachment, raw-error attachment, balanced/uneven/focus PNGs in `test-results/`,
and `typecheck.log`, `typecheck-group.log`, `typecheck-native.log`,
`typecheck-nodenext.log`. The latest interrupted run replaces the runner's output
directory; earlier numeric outcomes above are command observations, not a claim
that prior artifacts still represent the latest producer.

Native mapping and initial integrated checks are delivered; the changed producer
boundary needs a stable dependency handoff and complete rerun. Main owns the vendor
declaration compatibility decision, dependencies and package exports. Final UI, virtualization, SSR, real
AT/Safari/mobile, performance, resource races and G-02–G-05 remain outside this
proof. The custom group heading adapter is intentionally nonvirtualized.
