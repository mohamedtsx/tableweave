# Confirmed product decisions

Source: PRD v1.0 §6 and closure O-01–O-12 in §14. These are requirements/defaults,
not engineering-spike outcomes. [Features](features.md), [shared rules](shared-rules.md)
and [operators](operators.md) own detailed behavior. All forty source IDs are
retained; no new product decisions are introduced by this local representation.

| ID | Confirmed decision |
| --- | --- |
| D-01 | Treat Tableweave as a serious reusable open-source product, not a prototype-only demo. |
| D-02 | Approved name: Tableweave; npm distribution. Plan `@tableweave/react` and `@tableweave/heroui`; verify npm scope ownership/publishability, brand/domain and final package boundaries before publication. No reservation is claimed. |
| D-03 | TanStack Table owns behavior; HeroUI is the default component experience. |
| D-04 | A genuinely headless path requires neither HeroUI styling nor components. |
| D-05 | All eleven requested configurable capabilities, including row/column dragging, ship in first stable v1. |
| D-06 | Clear is scoped exclusively to filter-builder rules. |
| D-07 | Built-in loading, error, empty and recovery experiences are required. |
| D-08 | Supplied Figma is exploratory, not the final design specification. |
| D-09 | Produce/review PRD before finalizing HLD. |
| D-10 | Defaults: builder when filterable fields are configured, plus pagination. Search, tabs, standalone date, visibility controls, details and dragging are opt-in. |
| D-11 | Sorting is opt-in per field; single-column default, optional table-level multi-sort. |
| D-12 | Shadcn UI Kit transactions is the builder interaction reference; translate behavior into requirements rather than depending on a mutable demo. |
| D-13 | User-selectable flat All/AND or Any/OR; no nested groups. Rules support Duplicate, Negate and Remove. |
| D-14 | Builder families: text, number, enum, boolean, date/date-time; custom operators/value inputs. Developers choose exposed fields/operators. |
| D-15 | Filter ownership is exclusive and configuration-based. Tabs/search/date-owned properties stay excluded from builder even when inactive; competing ownership is diagnosed/rejected, never silently rewritten. |
| D-16 | Enum/boolean choices and value-less predicates apply immediately. Typed text/numeric values and date ranges require confirmation; incomplete/invalid edits never affect results. |
| D-17 | Row drag is manual-order only, current page, no active sorting/effective filtering, no cross-page moves. Stable IDs and application persistence are required; explain unavailability. |
| D-18 | Details use fully developer-defined content/actions via record/context callback in a customizable responsive drawer; no required hidden-field/full-record template. |
| D-19 | Static and application-controlled asynchronous filter options in v1, with loading, error/retry, empty-options and selected-value recovery. Library does not fetch endpoints. |
| D-20 | Default search: case-insensitive contains, OR across configured fields, configurable 300 ms debounce including zero, custom matching. Independent tools combine with AND. |
| D-21 | Standalone date: single or range (default), developer presets/bounds, configurable timezone (browser default), whole end calendar day included. |
| D-22 | Notion filtering informs broad operator recommendations under delegated design work, not nested groups or unrelated Notion features. |
| D-23 | Include multi-select/tags, people/assignee, relation-ID, currency/percentage and computed-accessor presets. App supplies people/relation IDs/options; computed fields reuse their resulting type. |
| D-24 | Pagination: 10 rows; 10/25/50/100 sizes; known totals previous/numbered/next, unknown totals previous/next. First-page reset after effective filters/sort/size changes. Local/server supported; cursor API not promised. Defaults configurable. |
| D-25 | HeroUI side drawer on large screens, full-screen on mobile; arbitrary content/actions, configurable shell size/style, accessible focus. Call it responsive record details, not a required centered modal. |
| D-26 | Initial skeleton; marked retained rows during refresh; initial error with optional app Retry; non-blocking refresh error; distinct empty/no-results; tool-specific recovery. App supplies status/retry/empty context; labels/actions/renderers customizable. |
| D-27 | React 19+, TanStack Table v9, HeroUI v3 and Tailwind v4 for styled use; no HeroUI/Tailwind for headless. Start + Query is primary; Vite React/Next App Router are additional supported examples. |
| D-28 | English defaults, replaceable dictionaries, locale-aware dates/numbers, LTR/RTL, HeroUI light/dark. Validate Arabic/RTL without promising a maintained built-in Arabic dictionary. |
| D-29 | MIT for Tableweave source; third-party obligations remain. Brand/npm checks are publication gates, not availability claims. |
| D-30 | Reference workloads: local 10,000 records × 20 fields, up to 100 rendered page rows; app-controlled server page up to 100 × 30 fields. Not universal limits; no full remote dataset loading or virtualization required. |
| D-31 | Latest two stable Chrome/Edge/Firefox/Safari and current iOS Safari/Android Chrome. Publish exact tested versions/limitations per release. |
| D-32 | Opt-in single/multiple selection, current-page select-all, stable IDs, custom row/bulk hooks, application-controlled cross-page IDs. No dataset-wide select-all-matching. |
| D-33 | Contained horizontal table scroll and wrapping toolbars on narrow screens; no automatic column hiding/cards. Developers may explicitly configure responsive visibility/details. |
| D-34 | On approved workloads target p95 ≤200 ms applied filter/sort/page/visibility and ≤1 second initial render after data availability. Exclude network, configured debounce and arbitrary consumer-renderer costs; fixed HLD protocol. Targets are not measurements. |
| D-35 | Stable requires feature/type/packed-consumer checks, examples, browser/RTL/themes, manual keyboard/screen-reader review, benchmarks and authorized Gamila-aligned real-consumer integration. External trials advisory; requirement does not authorize Gamila changes. |
| D-36 | Storybook for reusable components/configurations: interactions, responsive/recovery/customization scenarios. |
| D-37 | Drag individual data columns; utilities fixed. Grouped leaf moves stay within current group; no whole-group/cross-group moves; preserve hidden order. |
| D-38 | Selection replaces the in-table toolbar with total count, custom bulk actions and Cancel; hide builder/rules/Clear and embedded controls without clearing criteria. External tabs/date remain; external custom controls app-owned. |
| D-39 | Preserve stable selected IDs across sort/page/size. Clear on effective filter/tab-scope change including app-driven search/date/builder. Cancel/final deselect restores toolbar without clearing query/sort/size. Controlled selection may override. |
| D-40 | Selection Cancel, builder Clear and filter-editor Cancel are distinct. Reference Export does not create a built-in Export operation; apps supply bulk actions. |

O-01–O-12 are closed source questions, not a new backlog of unresolved product
policy. Engineering proof, API/peer freezing, publication rights and executed
acceptance remain separate [open items](open-questions.md).
