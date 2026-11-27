# Static fixture/public API audit — not execution evidence

Reviewed against genuine final WP-07 source in this target and approved WP-08
source/emitted declarations read-only in `/tmp/opencode/tableweave-wp08`. No
cross-worktree runtime import, compiler alias, vendor stub or producer edit was
introduced. This section records the manual declaration/source comparison, not a
source handoff approval. Subsequent authorized merged-target execution is recorded
in the own README/BLOCKER: strict compilers pass, combined runtime is18/19 with
FC-01 open. No Storybook or actual archive success is inferred from this audit.

## Concrete fixture correction

`FilterControlsComposition.tsx` now renders:

```tsx
<Pagination schema={compositionSchema} presentation={presentation} authority={authority} />
```

The previous missing `schema` and invented `pageSizes` were fixture defects.
Approved `packages/heroui/src/pagination/types.ts:39–50` and emitted
`packages/heroui/dist/pagination/types.d.ts:28–39` require `schema`, `presentation`
and `authority`, and do not define `pageSizes`. `Pagination.tsx:150,162` validates
and renders sizes from `schema.pagination.sizes`. The composition schema already
declares `[3,6]`. No API change or assertion weakening is needed.

Own `types.ts` now authors a positive real pager-props fixture and negative cases
for missing schema and invented size props. After main opened the merged-artifact
gate, both cases passed strict TypeScript6.0.3 and5.9.3 against actual target public
declarations (and separately labelled actual target source).

## Every application component boundary

The following are the exact supplied producer props; no additional producer prop
names were found in the application/stories. Ordinary HTML, React props and the
application's own `FilterControlsCompositionProps` are not Tableweave extensions.

| Actual component | Supplied props | Genuine contract read |
| --- | --- | --- |
| `FilterBuilder` | `controller`, `evaluationMode="client"`, `expectedResourceContext`, `invalidationKey`, `fields`, `createRuleId` | WP-07 `packages/heroui/src/filters/types.ts:98–126` |
| `FilterSearch` | shared `controller`, `expectedContext`, `invalidationKey` | WP-07 `toolbar/filter-shared.ts:12–21`, `filter-search.tsx:27–30` |
| `FilterDate` | shared tool props plus `presets` with `{id,label,date}` | WP-07 `toolbar/filter-date.tsx:46–56`; date is `NonNullable<QueryFor<S>["date"]>` |
| `FilterTabs` | shared tool props, `neutralTab`, configured `tabs`, one `children` subtree | WP-07 `toolbar/filter-tabs.tsx:14–39` |
| `Sorting` | current `{definition,view,presentation,authority}`, `id` | WP-08 emitted `sorting/types.d.ts:21–23`, `columns/types.d.ts:5–21` |
| `ColumnChooser` | same current target and `id` | WP-08 emitted `columns/types.d.ts:5–21,32–34` |
| `SelectionToolbar` | `presentation`, `authority`, `normal`, `getRestoreFocusTarget`, `actions` | WP-08 emitted `selection/types.d.ts:19–26,41–56` |
| `NativeCollection` | `view`, `label`, row/selection column IDs, the three text-value callbacks, guarded `controls`, `diagnostics=false` | WP-08 emitted `table/native-collection.d.ts:5–20` |
| `Pagination` | corrected `schema`, `presentation`, `authority` | WP-08 source and emitted pager types above |

Static builder fields use the genuine `FilterFieldPresentation` `label` and
`choices` properties; choice entries use `id`/`label`. They are static local choices,
not an asynchronous protocol or a fabricated `OptionSource`. No custom registry,
date-message dictionary or non-public aggregate locale prop is passed. The
`I18nProvider`/`useLocale` import follows WP-07's actual workbench public
`react-aria-components/I18nProvider` usage; the application passes `locale` and reads
the returned `locale`/`direction`. Actual resolution/profile remains an execution
gate, not something this static comparison proves.

## Factories, read methods and shapes

| Boundary | Actual arguments/read fields used | Genuine source/declaration |
| --- | --- | --- |
| Schema/query helpers | `defineQuerySchema` field owners, tabs/rules, single date, search debounce, multi-sort, pagination; `createQuery(schema,{locale,timeZone,builder})`; `canonicalJson`; story `parseQuery(schema,unknown)` | WP-07 `contracts/types.ts:204–230,406–450`, schema/query helpers and actual workbench |
| Native factory | `defineNativeTable<S,T>({schema,selection:"multiple",multiSort,getRowId,columns})` | WP-08 emitted `tanstack/types.d.ts:18–37`, `definition.d.ts:24–28` |
| Native columns | `id`, `header`, `accessorKey`, `meta.utility`, `meta.rowHeader`, `enableHiding`, `sortDescFirst` | Genuine native column definition and WP-08 source `tanstack/definition.ts` handling these public column options |
| Controller creation | `createNativeController(definition,{initial:{query,columns:{visibility}},now,controlled,onRequest})` | WP-08 emitted `tanstack/definition.d.ts:28`, `controller/types.d.ts:30–45,144–158` |
| Controller methods | `getSnapshot()`, `dispatch(command)`, `accept(proposal)`, `reject(proposal)` | WP-08 emitted `controller/types.d.ts:159–171` |
| Commands/proposals | `selection.change`/`sorting.change` with `update`; test `tabs.change` with nullable/configured `tabId`; `result.status`/`result.proposal`; `proposal.transition.reason` | WP-08 emitted `controller/types.d.ts:51–143` |
| Accepted state reads | `definitionIdentity`, `queryIdentity`, `query`, `selection`, `columns`, `evaluatedAt` | WP-08 emitted `controller/types.d.ts:36–46` |
| Native hook/view | `useNativeTable(definition,controller,{mode:"client",records})`; `view.state`, `view.rows` with `row.id`/`row.original` | WP-08 emitted `tanstack/types.d.ts:45–80` and `tanstack/hook.d.ts` |
| Render input/projector | `{native,expected,source:{mode:"client",context,records}}`; `projectControls(definition,input)` | WP-08 emitted `presentation/types.d.ts:25–40`, `project.d.ts:6` |
| Authority factory | `{definition,controller,queryIdentity,context,mode:"client",readCommitted}` | WP-08 emitted `presentation/types.d.ts:125–140`, `authority.d.ts:6` |
| Factory owner read | `getControlsAuthorityOwner(authority)` then exact `definition` and `controller` references | WP-08 emitted `presentation/types.d.ts:121–124`, `authority.d.ts:5` |
| Text callbacks | `column.columnDef.header`/`column.id`, `row.original.description`, `cell.getValue()` | Actual public native column/row/cell types and approved WP-08 collection fixture usage |
| Action context | `selectedIds`, `loadedSelected.length`, `missingSelectedIds.length` | WP-08 emitted `selection/types.d.ts:5–17` |

The application does not call event authority reads during render, fabricate
presentation fields, call private controller/native methods, add a second engine
or reinterpret raw tool hiding as criteria-authority revocation. `commit`,
`readCommitted`, `inspect`, `external`, `enqueue`, `accept`, `reject` and the small
application subscription store are application-owned methods, not invented library
methods. They call the original real controller without replacing/wrapping its
methods or claiming backend authorization.

Apart from the corrected pager boundary, this static audit found no further
producer-prop/read-method mismatch. That statement does not establish merged
declaration compatibility, installed-vendor resolution, runtime behavior or test
success. Main subsequently supplied merged artifacts and execution go. Both strict
compilers pass, full Biome passes22 files, and actual browser19 yields18 pass/1 fail
at the real builder-portal focus boundary documented in BLOCKER.md. All four plays
remain typechecked-only, not executed. No producer was weakened or public check
allowed to fall through to source to obtain these results.
