# HeroUI rendering, selection and record details

Source: HLD §9; ADR-07. Detailed behavior remains in
[features](../../product/features.md) and [shared rules](../../product/shared-rules.md).
Validate actual v3 composition in G-01; a design sketch is not vendor API proof.

## Controlled collection bridge

TanStack alone processes rows. HeroUI/React Aria receives controlled presentation
and handlers, not a second row/filter/sort owner. Target the documented compound
anatomy `Table → ScrollContainer → Content → Header/Body`, with Footer outside
table content. Translate grouped column trees into collection hierarchy; no
invalid wrappers inside semantic table row groups.

Use stable `getRowId` for keys, selection, focus and dragging. Preserve a row-header
column and meaningful `textValue` for complex cells. One adapter policy excludes
the hidden predicate carrier/utility internals. Require a usable visible data
field or explicit application recovery, not an accidentally blank table.

Single sort maps into the controlled native descriptor. Multi-sort uses controlled
header actions/priority indicators, not independent React Aria sort state.
Announce each direction/priority; only primary header exposes primary `aria-sort`.
Inspect generated collection/ARIA rather than assuming multi-descriptor support.

Keep parent/controller context stable. Use v9 subscriptions/selectors for toolbar,
pager, selection cells and body projections, plus memoized collection models.
Reading atoms without React subscriptions is not reactive. A feature flag is not
proof optional code is absent from a bundle.

## Selection presentation

Translate native selected keys into stable-ID map; never use dataset-wide all
sentinel. Header selection is eligible current-page IDs, preserving other pages,
with checked/mixed state derived from that page. Total selected count is all IDs,
not loaded/filtered selected row count. Pass loaded records separately to actions.

Swap only the configured toolbar region: builder trigger/rules/Clear and embedded
search/visibility → total count/custom actions/Cancel. External tabs/date remain.
No query-controller remount/reset. Preserve criteria while controls are hidden.
Focus moves to a meaningful count/action target when appropriate and restores
predictably on exit. Custom actions receive stale/busy context; permission and
persistence are application responsibilities.

## Arbitrary details content

```ts
// Proposed context; TNativeRow is bound to the matching TanStack Row<T>.
type DetailsContext<T, TNativeRow> = {
  recordId: string; record: T;
  isStale: boolean; isBusy: boolean;
  visibleFieldIds: readonly string[];
  hiddenFieldIds: readonly string[];
  close: () => void;
  row?: TNativeRow;
};
```

Details require explicit feature enablement, renderer and accessible title.
Expose header/body/footer and full-content overrides; no mandatory field list or
transaction layout. App-owned forms/actions own validation, authorization,
mutations and dirty-state policy. Visibility informs context, not forced content.

Record identity is independent of selected ID/index. An off-page record may keep
an explicitly stale snapshot; do not fabricate a TanStack Row. App can supply a
separate details resource with loading/error/retry/missing states. Page absence
is not deletion. Clear on scope/permission loss.

## Responsive drawer and interaction isolation

Use verified HeroUI v3 compound Drawer surface: controlled root/open change,
Backdrop, Content, Dialog, Header/Heading/CloseTrigger and Body, with named slots.
Do not invent a built-in responsive fullscreen prop from an illustrative snippet.

HLD engineering defaults (configurable): below 768 CSS px full viewport; at/above
768 a preferred 32rem panel capped to viewport. Logical end maps right in LTR,
left in RTL. Test safe areas, scrolling and mobile keyboard.

Every enabled close path—button, Escape, backdrop, swipe—uses the same controlled
close policy. Verify accessible naming, focus entry/trap/restoration, scroll lock
and nested actions. Default trigger is explicit; row-wide handlers must not
swallow links, selection, handles or actions. An off-page removed trigger needs a
predictable fallback focus target.

Visual/interaction coverage belongs to [handoff](../design/handoff.md) and
[Storybook](../design/storybook.md), including two different custom details
layouts/actions and consumer responsibility for omitted responsive information.
