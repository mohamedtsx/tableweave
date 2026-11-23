# Shared rules and vocabulary

Source: PRD v1.0 §§5, 7–9; D-15, D-17, D-20, D-24, D-37–D-40.
Technical transitions live in [state/query](../docs/engineering/state-and-query.md).

## Vocabulary and identity

| Term | Meaning |
| --- | --- |
| Field/property | Stable semantic identity, capabilities and accessor; not a display index |
| Column | Presentation of a field/custom content; filter fields need not be columns |
| Filter owner | Exactly one configured owner: builder, tabs, search, date or none |
| Draft | Uncommitted editor input; never part of the effective query |
| Applied rule | Valid committed builder condition, with independent editor identity |
| Effective filtering | Actual constraining semantics, not just enabled controls |
| Manual order | Application-meaningful record order, not current sorted display indices |
| Selected IDs | Stable identities independent of loaded row objects |
| Snapshot | Records plus the query/page/scope that actually produced them |
| Scope | Application-provided dataset/authorization context; not authorization itself |

Stable field/record identity survives sorting, filtering, visibility, reordering,
refreshes and updates. Tables are isolated unless the application intentionally
shares state. Hiding a field does not revoke its filter/sort capabilities.

## Configured ownership and composition

1. Assign one filter owner upfront. A property assigned to tabs/search/date is
   absent from the builder even on a neutral All tab or empty input.
2. Reject/clearly diagnose competing owners, rather than silently removing or
   rewriting criteria. Definition changes must not leave stale rules applied.
3. Builder All/Any governs only its flat rule list; empty builder is neutral.
   Search ORs its fields. Independent tools combine with AND.
4. Changing a tab does not silently erase independent search/date/builder state.
   Application-supplied tab counts state what they count.
5. Configuration enablement is developer-owned, not a built-in end-user feature
   settings panel. Default is builder (if configured fields exist) + pagination;
   every other tool and row selection is opt-in. Sorting is per-field opt-in.

## Three different exit/reset actions

| Action | Removes | Preserves |
| --- | --- | --- |
| Builder Clear | Every applied builder rule | Builder join preference; search/tab/date/sort/size/order/visibility |
| Selection Cancel | Selected IDs only | All criteria, sorting, page/size and presentation |
| Filter-editor Cancel | Current uncommitted edit only | Last applied rule and every other state slice |

There is no implicit global reset. Relevant no-results recovery may expose
separate tool-specific commands when configured; labels cannot disguise a wider
effect. Pagination and selection policies apply to an effective filter change,
including one caused by builder Clear.

## Selection mode and lifetime

- Zero selected IDs: normal toolbar. Any selected ID (including off-page): total
  count, developer bulk actions and Cancel replace the in-table toolbar.
- Hide builder trigger/chips/Clear and embedded search/visibility in that region.
  External tabs/date stay visible; custom external controls remain app-owned.
  Hidden criteria keep constraining results; never reset the controller on swap.
- Preserve IDs through sorting, paging and page-size changes; preserve on a
  same-query background refresh. Do not infer deletion from page absence.
- Header select-all touches eligible current-page IDs only, retains other pages,
  and has current-page checked/mixed semantics. No dataset-wide “all” sentinel.
- Count all selected IDs; loaded records are a separate subset. No fabricated
  off-page objects. Application reconciles authoritative removed/ineligible IDs.
- Clear by default when effective filters or tab scope change, whether driven by
  builder/join, search, date, tabs or the application. Controlled selection may
  explicitly override the policy. No-op/draft/reference-only changes are not an
  effective filter change.
- Cancel/final deselect restores the unchanged toolbar. Clear selection never
  clears query criteria. Actions receive busy/stale context and remain application
  operations requiring backend authorization. No built-in Export.

## Sorting, pagination and reordering

- Single sort by default; multi-sort optional. Only explicitly enabled fields
  sort. Server mode delegates processing, not local sorting of a partial page.
- Filtering/sorting/page-size changes reset to first page. Defaults: 10 rows;
  sizes 10/25/50/100. Known total permits numbered pages; unknown requires
  explicit next-page information, never a guess from row count.
- Row moves require manual order, current page, no active sorting or effective
  filtering. A neutral All tab or empty input alone does not block moves.
  Stable IDs/application persistence and clear disabled reasons are mandatory.
  Keyboard/simple-pointer move controls have the same constraints as dragging.
- Column moves alter presentation only: data leaves inside the current group,
  utilities fixed, no whole/cross-group moves, hidden order preserved.
- Never let incidental library behavior decide unsupported combinations. Prevent
  them or document them clearly; do not weaken stable-v1 requirements.

## Ownership boundary

Developers explicitly choose complete local data versus server-controlled page.
Applications own requests/cancellation/cache/auth/backend queries/mutations and
persistence. Tableweave exposes controlled slices, defaults and notifications,
not mandatory Query/router/i18n/ORM/storage. UI permissions are not authorization.

Retained rows must be clearly identified; built-in new selection/reorder must
not target obsolete-query rows. Selection Cancel/recovery stays available.
Recovery and authorization-loss behavior are owned by [recovery](recovery.md)
and [resource isolation](../docs/engineering/resources.md).
