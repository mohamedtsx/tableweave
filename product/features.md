# Functional requirements

Source: PRD v1.0 §7, FR-01–FR-16. Requirements are acceptance contracts, not
implementation status. [Traceability](traceability.md) routes each to technical
owners, derived scenarios and work packets. All eleven original tools plus the
additional recovery, extensibility, selection and Storybook requirements are
stable-v1 scope. Every capability remains configurable.

## FR-01 Table definition and rendering

**Configure:** typed data, stable row identity, column definitions, custom
cells/headers, field capabilities, feature enablement and application actions.

**Accept:** transactions, customers and inventory use the same contract without
domain-specific library branches. Preserve native TanStack escape hatches and
TypeScript row/field inference.

## FR-02 Draggable rows

**Configure:** enablement, eligible rows, handle, allowed scope, resulting order
notification and application-owned persistence.

**Accept:** stable-ID current-page moves in manual order only. Active sort or
effective filtering disables drag **and equivalent move controls** with an
understandable reason. No cross-page movement. Persistence success/failure is
application-owned and recoverable. Keyboard and simple non-drag pointer
alternatives obey the same restrictions.

## FR-03 Draggable columns

**Configure:** initial/controlled order, movable data columns, fixed utilities,
change notifications; leaf-only grouped moves inside the current group.

**Accept:** header/body order stays aligned; hidden IDs/order survive. Utilities
cannot move through any input method. No group-level or cross-group dragging.
Accessible alternatives are available.

## FR-04 Property-based sorting

**Configure:** explicit per-field enablement, default order, single-column default,
optional table-level multi-sort, custom comparison where applicable, local/server.

**Accept:** only enabled fields expose sorting; direction and priority are
understandable. Server mode does not reorder the supplied page as if complete.

## FR-05 Responsive record details

**Configure:** arbitrary developer content via record/context callback, custom
actions, accessible trigger and customizable HeroUI drawer shell.

**Accept:** side drawer on larger screens and full-screen on mobile; no mandatory
generated field list. Focus enters/returns correctly; nested controls and row
actions do not accidentally open details. An explicit responsive layout that
omits information provides a documented consumer-defined way to reach it.

## FR-06 Select shown columns

**Configure:** initial/controlled visibility, required/non-hideable fields, chooser.

**Accept:** required fields cannot hide. Hiding preserves sort/filter identity;
visibility updates table and details context consistently without forcing custom
details content to hide information. Prevent or explicitly handle an unusable
blank table.

## FR-07 Filter builder

**Configure:** fields, semantic types, operators, choices, custom value inputs,
active-rule editing, change notifications.

**Accept:** attribute → operator → value for declared types; invalid combinations
cannot apply; value-less predicates omit value inputs; Clear removes only builder
rules; multiple same-field rules have defined semantics. Full [operator contract](operators.md)
includes flat All/Any, draft timing, Duplicate/Negate/Remove and async choices.

## FR-08 Tabs filter

**Configure:** labels, criteria, default/controlled tab, optional application counts,
enablement.

**Accept:** changing tab updates effective query predictably without silently
erasing other tools. Displayed counts have a documented application-defined
meaning; do not infer them from a partial page.

## FR-09 Search filter

**Configure:** searchable fields, placeholder, debounce, controlled value,
local/server processing.

**Accept:** only declared fields participate, input remains responsive, and the
documented server integration prevents stale results replacing a newer query.
Default matching/debounce follow D-20.

## FR-10 Date filter

**Configure:** exclusively owned property, single/range mode (range default),
developer presets/bounds, timezone (browser default), complete end calendar day.

**Accept:** invalid ranges cannot apply; local/server can represent identical
intent; builder Clear leaves the standalone date unchanged. Respect date-only,
instant, relative-clock and DST semantics in [operators](operators.md).

## FR-11 Builder Clear control

**Configure:** visibility, enabled state, label, builder-clear notification.

**Accept:** with all tools active, remove every builder rule and preserve search,
tab, standalone date, sorting, order/visibility and page size. Keep All/Any
preference. Pagination/selection adjustments follow [shared rules](shared-rules.md).
Default: hidden without applied rules; optional disabled presentation.

## FR-12 Pagination

**Configure:** enabled/default or controlled page/size; 10 rows and sizes
10/25/50/100 by default, configurable size control; known-total numbered navigation
or unknown-total previous/next; local/server processing.

**Accept:** first/last/empty boundaries valid, unavailable navigation disabled,
totals not inferred from page length. Effective filters, sorting and size changes
reset to page one. Do not strand users on unexplained empty pages. No cursor API
promise in v1.

## FR-13 Loading and recovery states

**Configure:** initial loading, refreshing, errors, empty/no-results context, retry,
labels, actions and render overrides.

**Accept:** every [recovery state](recovery.md) is predictable without replacing
the table body in application code. No contradictory initial/error/empty messages,
stale results passed off as fresh, or fabricated recovery actions.

## FR-14 Extensibility and localization

**Configure:** renderers, custom fields/operators, labels, locale-aware formatting,
direction, headless consumption.

**Accept:** business cells/actions require no library modification; headless needs
no HeroUI; English is replaceable. No mandatory router, Query, ORM, browser
storage or i18n framework.

## FR-15 Row selection and actions

**Configure:** opt-in single/multiple selection, eligible current-page select-all,
stable IDs, custom row/bulk actions, controlled cross-page selection and selection
toolbar.

**Accept:** select-all touches eligible current-page IDs only and preserves other
pages. Sort/page/size changes preserve IDs; effective filter/tab-scope changes
clear by default. Count all IDs, including off-page ones; never fabricate their
objects. Replace the normal toolbar with count/custom actions/Cancel. Cancel
restores normal controls without clearing filters. No implicit Export or
dataset-wide select-all-matching. Backend authorization is application-owned.

## FR-16 Storybook component workbench

**Configure:** representative configurations, interactions, async/recovery states,
themes, RTL, arbitrary details/actions and disabled-feature combinations.

**Accept:** reviewers exercise the accepted feature/state matrix without a
business backend. Stories share meaningful fixtures with tests/design. Story/mock
checks never count as live integration evidence.
