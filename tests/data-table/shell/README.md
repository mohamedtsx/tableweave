# S3b DataTable shell — provisional source handoff

TASK-017 / FR-01/04/05/08–16, partial AC-16/25. **Implementation-ready for main's
provisional source intake; no runtime, visual or independent acceptance.** Base is
main-supplied `ba282fa` in `/tmp/opencode/tableweave-wp09-stacked`. The separate
Builder-host worker is not intaken here. Joint integration and every exhaustive
suite remain main-owned in the user's single final verification phase.

## Actual source API

`packages/heroui/src/data-table/data-table.tsx` exports `DataTable`.
`packages/heroui/src/table/types.ts` declares readonly `DataTableProps<S,T>`:

```tsx
<DataTable
  table={table}
  collection={{
    label: "Records",
    rowHeaderColumnId: "title",
    rowTextValue: row => row.original.title,
    columnTextValue: column => column.id,
    cellTextValue: cell => cell.row.original.title,
  }}
  accessory={accessory}
/>
```

`table: DataTableModel<S,T>` is the **sole inference anchor**. Remaining renderer
config/accessory types use NoInfer S/T. Collection is required and uses exactly the
existing NativeCollection label, row-header/optional selection-column IDs and native
row/column/cell text callbacks. The fixture application needs no row/object/any casts.
The one Builder bridge assertion is a registry-bound library metadata envelope from
its actual `kind="builder"` factory, not a consumer record conversion.

Other config is the actual renderer API: `renderToolbar`, `renderState`, `onRetry`,
selection `actions`, focus/error observation, `columns`, `formatNumber`, locale/
message dictionaries and opaque `tools`. New consumed config is `layout?: { id?,
className? }`, genuine `accessory?`, nonsensitive `detailsRegionLabel?`,
`neutralMessages?` and optional actual `paginationCorrection` context.

No root/public barrel, export map, style entry/import, manifest or emitted artifact
was changed. These are **source imports**, not installed/emitted/packed availability.
Main must review explicit exports, including a noncolliding `TableDetailsTrigger`
alias for the existing context-bound row-ID trigger. Legacy root DetailsTrigger is
not renamed/replaced/adopted here. Public generation registration remains untouched.

## Host/config/model ownership

- Root reads the own-data model reference and uses exact `getDataTableModelOwner`
  **before** any model payload or private props. Unknown/copy/proxy model identities
  render fixed neutral library text without traversing alleged model methods/fields.
  Genuine foreign D/C cannot retag the stable host/cell. Explicit nonsensitive neutral
  metadata is captured only after model identity; arbitrary private locale is not
  read for prelayout/denied copy.
- `DataTableHost` is unsubscribed. One stable owner creates the actual renderer core
  cell, one signature session local and four finite actual S3 child sources. The new
  closed `createDataTableRendererCell` calls the unchanged actual renderer factory;
  it adds only a metadata display-snapshot designation, not another engine, model,
  cell own key, app policy flag or event grant. Connect/disconnect is actual mount
  ownership, separate from the config layout effect; there is no per-config cleanup.
- Candidate props remain opaque effect closures, never render-time latest refs.
  Layout verifies current genuine model/source first. Metadata-only B calls actual
  `cell.updateModel` before config capture. A tracked parent F3 session slot compares
  consumed config refs/known scalars (including tool/default/dictionary refs), so React
  props cloning and ordinary model/query/selection refresh do not recommit actor A.
  Readonly nested values must be replaced rather than mutated silently in place.
- Actual config B commits actual renderer ports, retiring A callback ownership. The
  four child sources publish from those **committed** ports in layout. They retain
  unchanged child tickets/defaults; parent B is not child B's L-config. No private
  child config spread/formatter/default generation runs in root render. Search/Tabs/
  Date use actual CriteriaFacadeToolbar. Builder subscribes only to its proven real
  parent cell and passes `getCriteriaFacadeInput(actualBuilderSource)` to the actual
  FilterBuilder. It does not import an imaginary new Builder helper or own Builder's
  callback actor. The separate host handoff must consume the already actual S3 skip
  protocol before joint runtime verification.
- Source/domain loss or malformed consumed B fails closed and disconnects owned
  library cells; C/P/R are borrowed, never created, connected, fetched or disposed
  by the shell. Same-domain strict-model staleness before reflection may wait; an
  exception after config reflection is not laundered into that wait classification.
  Actual P loss is terminal to that mounted host, not automatic epoch adoption.

### Waiting, callbacks and React-owned output

The surface subscribes to the **real** renderer snapshot. Native/selection display
leaves already subscribe independently through actual S2 helpers, so a parent memo
alone cannot preserve a same-actor wait. For shell-created cells only,
`tableRendererSnapshot` holds the last **metadata snapshot identity** while actual
`tableRendererStatus` classifies that same actor as waiting. Source surface still
sees every real metadata update. Raw/non-shell cells keep the original passthrough.
There is one finite WeakMap entry per genuine cell, no rows/config/output cache or
accepted-state mirror. Null/denied or real ready snapshots resume the real channel.
Strict event/private callback guards are unchanged: waiting is never permission.

Committed display output can stay React-owned, hidden/inert while a source-only
state leaf uses independent fresh source proof. It does not invoke new private row,
toolbar or tool projections merely to redraw a wait. Real same-branch form elements
remain ordinary React nodes; no static HTML table, definition proxy, row clone,
new getRowId engine, portal/focus engine or hand-called app component body exists.
Actual TableRendererNativeContent preserves React memo/function/forwardRef/class
behavior. `renderToolbar`/`renderState` are explicit callback APIs returning nodes;
hooks inside those callbacks are unsupported. Return `<AppComponent/>` instead.

Owned renderState/renderToolbar **ordinary current-realm Promise** returns now check
the same actor/model/source again on fulfillment/rejection. Unsupported thenables/
subclassed/cross-realm promise-like returns fail closed rather than receiving an
unchecked React delivery. Opaque synchronous nodes remain React-owned. This does
not run or fence arbitrary descendant component bodies, effects, external promises
or React internals. App render/coercion side effects outside these library entries
are not universally suppressed/erased.

Renderer dictionary wrappers also recognize own-data copies containing the same
issued wrapper at the original dictionary key. This preserves the original dictionary
receiver through the actual native/pager/selection normalization and locale override
merges. Reflection is guarded before/after; unrelated explicit caller receivers keep
the existing behavior. No getter is invoked to identify a normalized copy.

## Tools, selection, collection and paging

Placements come only from actual `definition.tools` and actual field owners/schema.
Default Builder exists only for real builder-owned fields; Search/ColumnChooser are
explicit placements. Tabs/Date appear externally only when both placement and actual
capability exist. Private config cannot enable a foreign field owner. External tools
are outside SelectionToolbar replacement. SelectionToolbar uses its actual adopted
renderer route, committed action ports, actual authority and normal tool node.

0→N selected IDs intentionally unmount the normal tools; this handoff does **not**
promise their local form survives that intentional replacement. Existing producer
focus policy owns the swap. Ordinary same-branch revisions are a different case.
Builder Clear, selection Cancel and each local draft Cancel remain distinct. No
Export/Create/Import/default business action was added. IDs are never backend auth.

One actual NativeCollection owns native rows, grouped headers/sorting, selection,
text ports and its one horizontal scroller. Actual ColumnChooser receives the real
ND/view/authority/presentation and captured labels/options, retaining its grouping/
utility exclusions. Root does not borrow `canSelect` for navigation/sort/retry.

Pager is a separate **enabled-only** leaf using actual normalized schema, C,
presentation and authority. Disabled schema captures no formatter/correction/pager
message callbacks and mounts no pager/correction hook. An explicit app
`PaginationCorrectionContext` enables the existing usePaginationCorrection in its
own leaf, with exact ND/context and original readCurrent receiver. The context's
external query/navigation causality belongs to the app. Minimal DataTable does not
invent such a tag from P epoch, query equality or a hidden library counter; correction
is opt-in exactly like the existing raw hook. Pager navigation itself remains real.
Transport/retry is supplied by the app; no effect starts a request automatically.

## Source-role recovery/localization

`requireTableRendererSourceTarget` authenticates actual registered cell/actor before
core/model/source metadata and repeats proof after. It has no display/tool/frame
requirement and fabricates no controls/ToolAuthority/empty native frame. The state
leaf maps real finite recovery kind/cause/notice/busy/stale/obsolete facts. Unknown
empty is not called filtered/dataset; refresh failure retains actual rows and gets
no success promotion. Stale/obsolete metadata is exposed without inventing a new
state-message meaning. Existing fourteen state IDs remain unchanged.

Only committed custom renderState and supplied onRetry can run, with actual source
role and retry eligibility. Real HeroUI Button invokes the guarded retry callback;
failed app retry clears neither rows nor criteria and schedules no automatic retry.
No raw cause/error/context/row is exposed in fixed diagnostics or evidence.

Data-only locale composition adds English/Arabic neutral-message containers and
optional top-level neutralMessages/detailsRegionLabel; it imports no React/details
runtime. Original state14-key values and the old eleven-port/label references remain
AST-equal. Explicit root metadata wins. Before first layout, supply root
`neutralMessages={arabicDataTableNeutralMessages}` for Arabic; private locale alone
is not read early. After actual layout, validated locale neutral strings may become
public nonsensitive fallback copy. Those two designated public strings can remain
outside purgeable storage for denied UI, never as permission or private values.
Arabic region labels come from explicit locale/metadata, never from RTL inference.
RecordDetails uses its actual neutralLabel handoff, not another English-only region.

## Exact details join

The actual DetailsBinding now owns an exclusive `claimTable(realRendererCell)` /
`releaseTable(issuedToken)` lifetime. Registry authentication precedes alleged cell/
accessory methods. Matching D/C alone is insufficient: ready binding metadata and
the eventual actual model must match real CD/P/frame owner/source origin/mode.
Unready accessories may be pending but cannot decode/read/render private body.
The claim issues its own opaque token; an arbitrary/reused old release cannot clear
a replacement claim. A failed competing claim cannot release the actual old owner.

The join binds to the **cell/domain**, not parent config actor A. Parent B ordinary
refresh therefore does not retire independently committed details actor/form A.
Attachment/remount is a real new lifetime: old actor/work is disconnected, producer
hook acquires a real new lease and reconfigures through actual D2. Actor→join token
metadata never retags old sessions/triggers/policy/focus receipts as latest B. Once
joined, detach cannot silently fall back to standalone access. Never-joined genuine
standalone accessories and legacy raw sessions preserve their separate routes.

Every binding entry/private callback path now validates the actual join, including
source reads, body/render slots, transition/policy/observer/retry, row triggers and
focus/restoration. Fresh source proof does not grant body/display. Existing eligible
held output uses metadata-only waiting without new reads/projections. Renderer P
purge synchronously disconnects the real details core; its actual locals/requests/
DOM refs are purged. Cleanup still permits application `C.details.change(null)`.
The one existing Drawer/NoSwipeDialog/request/focus engine and actual beforeChange/
onOutcome semantics are reused, not reimplemented.

Row association remains actual `record === row.original` in current native view,
never a same-ID clone; offpage records can have `row: undefined`. Row triggers require
genuine displayed row membership independently of selection eligibility. Programmatic
opening retains arbitrary/offpage target support. Old deferred close/session/focus
handlers cannot mutate or focus a new join/dialog merely through latest refs.

## Visual/version provenance

Loaded Tableweave UI/HeroUI v3 guidance plus mandatory design-to-code resource
`skill://figma/figma-design-to-code/SKILL.md`. Reused file USX6vMtBrZICYS9M4V84bB /
session ee4af72b-3aba-4d91-b261-5c136b8e84ba. Actual get_design_context for configured
node5:159 used `skillNames: resource:figma-design-to-code`, `excludeScreenshot:false`;
high-fidelity reference and screenshot were returned. No image/SVG asset was required
or downloaded; no Figma write, temporary URL, new font, vendor patch, paid AI/Weave,
Tailwind install or generated div-table was used.

Adaptation uses the read-only seven-class CSS contract, 16/8 rhythm, inherited fonts,
semantic tokens and native scroller. It does not impose the illustration's fixed
1376px table, six records, app title, screen padding/card or business fields.
Actual pinned HeroUI3.2.8/React19.3.1/TanStack9.3.1 manifests and installed Button
types were inspected. Hosted HeroUI quick-start fetch failed; no retry/install or
latest-version API substitution occurred. `.repo/` is absent; the recorded reference
assessment/handoff was read, not represented as a fresh local Gamila inspection.
No actual browser/visual/asset geometry/RTL/manual AT/device review has run here.

## Protection, LIGHT evidence and deferred proof

Canonical137 was checked **before producer edits**, CSS included:
`1c28d45fb16d137772cd96be3c3b800e96fbda7227bf105d4e3afa9118aee623`.
Unchanged map and six preimages are in `.artifacts/`. Six allocated existing sources
are table/{types.ts,renderer-commit.ts}, data-table/{details-binding.ts,
details-provider.tsx,details-trigger.tsx}, localization/data-table.ts. The existing
details-trigger file needs no edit: its real binding entries enforce the join.
Only new production files are data-table/{data-table.tsx,host.tsx,state.tsx}.

- All other131 source bytes/modes remain unchanged, including every CSS source.
  Protected-source aggregate:
  `49391fb2b22dbfb6c6ea34d33ac51283b2fc428d0e23449a43f5c1163dd77ebb`.
- Original protection inventory has2,212 files; its initial strict check passed.
  Main later changed TASKS and the Builder-host plan to record isolated9733b92.
  The final original strict guard **correctly fails** on exactly those two files
  (`scope-handoff.log`); it is not weakened or rebased. Supplemental
  `metadata-scope-result.json` records exact before/after hashes, all other2,210
  original files/seals/old fixtures unchanged, all131 sources unchanged and no
  unexpected additions. This worker did not edit/restore either main file.
  Original protected-file aggregate:
  `196a72e7b590c0704233c3b0d2e402542a7a0ed1c5c0bc7e2126cc118f8b7f60`.
- Latest TS6 noEmit own source/positive fixtures and unchanged S1/D2/Date/S3 configs
  pass (`ts6-own-final.log`, `ts6-*-final.log`). Root aliases use actual current
  source, not old dist. `positive-inputs-2.json` is the final immutable input pin;
  TS6.0.3 /140 inputs, SHA256
  `d9d019cb0b00c4e66c6e8e4d8d783d55734907c01fc97377e523310a5f701423`.
  The earlier positive-inputs map remains historical before final join/snapshot/
  receiver hardening. Input stability is checked again at handoff.
- Scoped Biome formatter/lint and syntax/import/static AST checks pass. Existing
  renderer constructor/display guards and message ID containers remain AST-equal;
  the shell-only snapshot branch is deliberate, not claimed unchanged. These checks
  prove no runtime cycle or callback behavior. Biome's remaining optional-chain/
  template-literal style suggestions are recorded, not suppressed by config changes.
  Final static pass covers24 source/tool/fixture inputs; final scoped Biome checks
  25 files with zero errors (one optional-chain warning, fourteen template infos).
- Failed first/second TS attempts and the historically named `ts6-positive.log`
  getter-type failure remain raw. Earlier Biome dependency errors were corrected
  with actual join-version checks. `static-first.log` preserves a printer/trailing-
  comma mismatch; normalized AST comparison now checks the original locale refs,
  not a source rewrite or re-signed old assertion. Old S3/D2/Builder/fc01 maps and
  stopped reports have not been rebased, overwritten or newly registered.

Authored **only, unrun**: actual D.factory/C/P/ApplicationOwner/resource/native P2
models, all four tools, minimal/configured/disabled pager/paged/complete recovery,
unknown empty, two distinct tables and equal-D/C/P two-owner denial, actual DetailsPort,
unselectable/offpage row details, Strict/Suspense/neutral SSR/counterfeit denial,
parent refresh controlled/uncontrolled/memo/forwardRef/class forms/caret/width,
intentional selection replacement vs independent external results, dictionary receiver,
old callback/Retry/owned Promise/source ABA, exclusive/stale release, deferred policy/
session/focus detach/remount and refetch association. Seven meaningful NoInfer/
readonly/native callback negatives are authored separately, **not compiled**.

The actual library buffers are purgeable; app drafts/effects/React fibers, already
observed elements, copied external values/promises and app-held callbacks are not
universally erased. Hidden UI, selected IDs, schema and query are not backend auth.
No runtime, React, SSR/hydration, browser, cycle, golden, negative/dual compiler,
emitted, packed/Start, CI, independent, full privacy/focus/manual or WP-09 approval
is claimed. No Git/PR/merge/build/install/shared emit/deploy/agents occurred.

Only after final-phase authorization (browser port **6580**, no server was started):

```sh
pnpm exec vitest run --config tests/data-table/shell/vitest.config.mjs
pnpm exec playwright test --config tests/data-table/shell/playwright.config.ts
node tests/data-table/shell/check-negatives.mjs typescript
node tests/data-table/shell/check-negatives.mjs typescript-5-9
```

Screenshot expectations are authored without generated baseline images; main must
explicitly generate/review them in the final phase rather than auto-bless a visual
pass. Integrate the separate actual Builder-host handoff first, review exports/CSS
discovery, then execute untouched producer regressions and integrated cycle/SSR/
emitted/packed/Start/golden/dual plus independent/manual gates. Final exact own-file
seal is `.artifacts/implementation-map.json`; its terminal digest identifies this
provisional handoff, not acceptance or a public output generation.
