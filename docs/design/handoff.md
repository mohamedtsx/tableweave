# Complete designer handoff

Source: HLD §§16–20. This is a design task contract, not existing frames or a
pixel-perfect prototype promise. Review final design jointly against FR-01–FR-16
and F-01–F-22. Requirement changes need product review; intentional visual
departures from references need annotations, not hidden Figma-only decisions.

## Authority and exact references

The maintainer's [three taste sources](../reference/README.md#maintainer-taste-and-architecture-sources)
are direct feedback, the transactions reference below and `.repo/` (currently
`.repo/Gamila`), the **main taste and architecture reference**. Consult relevant
local design/component patterns, compare the transactions treatment and apply
direct feedback rather than substituting generic HeroUI or design-skill defaults.
The Figma prototype is supplementary and exploratory, not the primary taste
source or final visual approval. Keep all reference no-copy/read-only boundaries.

| Reference | Use | Do not inherit |
| --- | --- | --- |
| [Transactions reference](https://shadcnuikit.com/dashboard/payment/transactions) | Quiet hierarchy, compact rows/status, segmented builder, selection replacement, pagination | Commercial code/assets, dashboard shell, Export, business terms/default dates or always-enabled tools |
| [Prototype default](https://www.figma.com/design/03BxapjDU8ceJUFjx3o6Cx/better-table?node-id=2-72) | Early minimal anatomy/proportions | Final branding/dimensions/API or complete coverage |
| [Toolbar configurations](https://www.figma.com/design/03BxapjDU8ceJUFjx3o6Cx/better-table?node-id=2-74) | Optional tools and attribute/operator/value controls | Competing owners or all tools on by default |
| [Segmented rules](https://www.figma.com/design/03BxapjDU8ceJUFjx3o6Cx/better-table?node-id=27-922) | Whole-rule wrapping, segments/options/typed editor | Nested Boolean groups; segments are one rule, not a subtree |
| [Filtered table](https://www.figma.com/design/03BxapjDU8ceJUFjx3o6Cx/better-table?node-id=27-1269) | Sample active criteria/results | Assuming every sample owner map is valid |
| [HeroUI Table](https://heroui.com/docs/components/table), [Drawer](https://heroui.com/docs/components/drawer) | Compound vocabulary, theme/focus/state affordances | Second processing owner or unsupported responsive props |
| [shadcn guide](https://ui.shadcn.com/docs/components/base/data-table) | Composition/custom cells/actions | Required Base UI/Radix/shadcn dependency or only permitted theme |
| [Notion filtering](https://www.notion.com/help/views-filters-and-sorts) | Type/operator/empty vocabulary | Nested groups/views/formulas/backend clone |

The source prototype inventory was partial: default/tools/segmented rules,
loading/empty/no-results/error and narrow rows/headers. Selection transitions,
All/Any, exclusive owners, async choices, multi-sort, dragging, arbitrary drawers,
refresh-error retention, unknown totals and complete RTL/dark/mobile remain design
outputs. Historical reference observations are not Tableweave acceptance.

## Anatomy and configuration

Optional application title/context → optional external tabs/date → normal or
selection toolbar → resource notice → contained table scroll → footer/page size/
status/navigation. Explicit details trigger opens logical-end/mobile drawer.
No dashboard sidebar/account/revenue cards or application actions in base table.

| Configuration | Shown | Owner map / invariant |
| --- | --- | --- |
| Minimal | Filters if builder fields exist + pagination | No implicit selection/search/date/details/actions |
| Search and tabs | External tabs, embedded search, builder, pager | Status → tabs; Description → search; Amount/Reference → builder; All tab does not release Status |
| Date and columns | External date, builder, chooser, pager | BookedAt → date; a different builder date may still exist |
| Selection | Opt-in checkbox column; replacement toolbar when IDs selected | Hidden criteria stay applied; external tabs/date remain |
| Reorder | Explicit handles/move actions and configured tools | Ready and blocked reasons; no dead affordances |
| Details | Explicit action and arbitrary supplied content | Shell/slots, not mandated record list |

## Foundation and responsive rules

Use one HeroUI-aligned semantic variable system: surfaces, text/muted, borders,
accent, danger/warning/success, focus and overlays. Map to pinned HeroUI tokens;
light/dark are modes of one system. No undocumented fixed color literals.

Designer starting points, **not frozen product/API requirements**: 4/8/12/16/24
spacing, 14 px data/controls, 12 px metadata, 16 px local titles, roughly 40 px
headers/52 px rows, restrained 1 px separators, coherent radius. Phone touch
targets around 44 px; preserve zoom/text expansion without oversized desktop rows.
Logical-start text; consistent logical-end numbers/tabular numerals. Isolate bidi
IDs/emails/money. Color is not status meaning; negative money is not globally bad.

| Viewport/condition | Expected |
| --- | --- |
| 1440/1024 | Aligned columns, compact/wrapping toolbar, end-side drawer |
| 768 | Constrained tablet; capped side drawer; no tool/footer overlap |
| 390/320 | Contained table horizontal scroll, no page overflow/cards/automatic hidden columns; wrap intact rules; reachable footer/actions; full-screen details |
| RTL desktop/mobile | Logical mirrored placement/navigation, mixed-value isolation, same property identities/data meanings |
| Zoom/text expansion/reduced motion | No clipping/unreachable actions; focus visible; no motion-dependent meaning |

Each rule's attribute/operator/value/options wraps as **one unit**. Toolbar may
grow; values cannot detach into an apparent second rule. Essential tabs/actions
use accessible overflow, not hover-only affordances. Clear stays with builder.
Drawer default boundary/size is [engineering-owned](../engineering/rendering.md#responsive-drawer-and-interaction-isolation)
and configurable.

## File structure and component sets

Suggested pages: 00 Read me/requirement map; 01 Foundations/theme variables;
02 Components; 03 Configurations/three domains; 04 Filter/selection interactions;
05 Async/recovery; 06 Responsive/RTL/dark; 07 Details customization;
08 Prototype flows/acceptance annotations.

Use Auto Layout, instances, text/instance properties, semantic variables and slot
boundaries, not unrelated flattened screenshots. Every main frame records FR ID,
owner map/configuration, initial state, interaction/expected result and story.

| Component set | Required variants/properties |
| --- | --- |
| TW/Table | Data/loading/initial-error/refreshing/refresh-error/empty/no-results/unknown; configured features, direction/theme |
| TW/Toolbar | Normal/selection, embedded presence, wrapping |
| TW/FilterBuilder | No rules/active, All/Any, enabled/no available fields |
| TW/FilterRule | Field/type/operator/value, normal/editing/invalid, inverse availability |
| TW/AttributePicker | Search/list/no match, owned-field exclusions |
| TW/OperatorPicker | Text/number/enum/collection/boolean/date/custom families |
| TW/ValueEditor | None/text/number/range/enum/multi/boolean/date/entity; option loading/error/empty |
| TW/RuleOptions | Duplicate/Negate/Remove; no inverse → no Negate |
| TW/Search | Empty/typed/debouncing/busy, explicit label |
| TW/Tabs | Active/inactive/count/overflow/focus |
| TW/DateFilter | Single/range/preset/invalid/clear, timezone annotation |
| TW/ColumnHeader | Unsortable/unsorted/asc/desc/multi priority, optional handle |
| TW/ColumnChooser | Visible/hidden/required, no internal carrier |
| TW/Selection | None/some/all current page, off-page count, app action pending/error |
| TW/Row and TW/Cell | Default/hover/focus/selected, custom content, eligible/disabled actions |
| TW/Reorder | Row/column handles, preview/target/blocked/pending/failure and move controls |
| TW/Pagination | Known/unknown, first/middle/last/empty, size, busy/stale metadata |
| TW/ResourceNotice | Updating/stale/refresh-error, optional Retry |
| TW/DetailsShell | Logical-end/full-screen, LTR/RTL, open/closing, custom header/body/footer |

## Required review scenes

These are coverage scenes, not every Cartesian combination. IDs are retained from
the HLD; actual Figma node/story IDs are supplied by the future design task.

| ID | Scene | Required annotation / planned story |
| --- | --- | --- |
| F-01 | Synthetic minimal builder/pagination table | Defaults vs opt-in; `Default` |
| F-02 | Tabs/search/date/visibility/selection/details | Owner map/external region; `FullyConfigured`, `FieldOwnership` |
| F-03 | Applied rules/All-Any | Flat, no nested affordance; `BuilderAllAny` |
| F-04 | Attribute → operator → value for all families/collections | Immediate vs confirmed, cardinality; `OperatorFamilies` |
| F-05 | Invalid number/date, Cancel, value-less | Previous applied rule retained; `InvalidDraft` |
| F-06 | Async loading/search-empty/error/retry/off-page selected option | IDs/labels survive; `AsyncOptions` |
| F-07 | Before/after builder Clear with other tools active | Only rules removed, join retained; `BuilderClear` |
| F-08 | One/multiple/off-page selection | Count/custom actions/Cancel, hidden region; `SelectedAcrossPages` |
| F-09 | Page/sort/size preserve; filter/tab clear; Cancel | Exact selection/query transitions; `SelectionLifetime` |
| F-10 | Unsortable/default/asc/desc/multi-sort | Opt-in, priorities; `Sorting` |
| F-11 | Required/hidden/revealed columns | Identity/rules retained; `RequiredColumns` |
| F-12 | Row ready/preview/drop/cancel/blocked/pending/failure | Same move-control restrictions/current page; `DragBlocked`, `ReorderFailure` |
| F-13 | Column drag/group boundaries | Fixed utilities/hidden order; `GroupedColumns` |
| F-14 | Initial loading vs background refresh | Skeleton vs marked previous rows; `InitialLoading`, `Refreshing` |
| F-15 | Initial vs refresh error/Retry | Current requested query, retained rows; `InitialError`, `RefreshError` |
| F-16 | Empty/no-match/unknown cause | Distinct copy/tool-specific recovery; `Empty`, `NoResults`, `UnknownEmpty` |
| F-17 | Known first/middle/last and unknown totals | No invented counts/next, size reset; `Pagination` |
| F-18 | Desktop/mobile arbitrary details/actions | Close/focus/nested targets, no template; `CustomDetails` |
| F-19 | Different customer/inventory details | Slot-based reuse, custom layouts; `CustomerDetails`, `InventoryDetails` |
| F-20 | 1440/1024/768/390/320, dark, Arabic RTL | Scroll/wrapping/focus/logical-end; `Dark`, `RTL`, `Narrow` |
| F-21 | Two tables | No implicit shared state; `IndependentTables` |
| F-22 | Scope/access loss and stale action guards | Private data cleared/obsolete targets blocked; `AccessLoss` |

## Flows, copy and handoff acceptance

Builder: Filters → available property → allowed operator → no value/immediate
choice or valid confirmed typed value → one accepted rule → results/page policy.
Invalid input stays local. Duplicate independent; Negate inverse only; Remove one.
Last membership deselection removes rule. All/Any describes builder, not all tools.

Selection: active criteria → first selected ID → toolbar replacement → page/sort/
size preserve IDs/off-page count → Cancel restores unchanged criteria. Separate
flow: external tab/date change clears by default, preserves unrelated tools.
Reference Export is a custom action slot, not a library promise.

| Situation | English default direction | Action |
| --- | --- | --- |
| First load | Loading records. | Busy announcement |
| Refresh | Updating results. Showing previous records. | Block obsolete new selection/reorder |
| First error | Records could not be loaded. | Supplied Retry only |
| Refresh error | Results could not be updated. Previous records are shown. | Retry current request |
| Empty | No records yet. | Supplied Create/Import only |
| No matches | No records match these criteria. | Separate relevant tool recoveries |
| Unknown empty | No records available for this view. | No invented cause |
| Builder Clear | Clear / accessible “Clear filter-builder rules” | Builder rules only |
| Selection Cancel | Cancel / “Clear row selection” | Selection only |
| Draft Cancel | Cancel / “Cancel filter edit” | Draft only |
| Drag blocked | Reordering is unavailable while sorting or filters are active. | Visible/accessible reason |

All English defaults replaceable. Arabic fixture validates layout/focus/bidi/text
expansion, not a maintained built-in dictionary. Synthetic transactions/customers/
inventory must look like distinct uses of one system, not permanent merchant,
payment/refund/currency content in the base component.

Final handoff provides variables/component properties/slots/constraints, exact
before/after for three exits, configured vs user state, keyboard order/focus/
announcements/checkbox states/move alternatives, all data/option recovery,
responsive omitted-information paths and two arbitrary details/action layouts.
Map every scene to FRs and a story; review jointly before calling design ready.
