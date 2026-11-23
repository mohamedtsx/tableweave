# Quality requirements

Source: PRD v1.0 §10, D-27–D-35. These are targets and acceptance obligations,
not current compatibility, performance or conformance claims.

## Accessibility and responsive behavior

- Target WCAG 2.2 AA for library-owned UI; automated checks **and** manual
  keyboard/screen-reader testing. HeroUI inheritance alone proves nothing about
  the composed table or consumer content.
- Keyboard-operable sorting, filtering, pagination, visibility, details,
  selection/actions and reordering, with names/focus/announcements. Reordering
  also needs simple non-drag pointer alternatives, not keyboard dragging alone.
- Contain horizontal table scrolling; wrap intact rule segments. No automatic
  cards or hidden columns. Developer-configured responsive omissions need a
  documented details/custom path to information.
- Logical-end drawer, full-screen mobile, customizable shell; test narrow layouts,
  zoom, RTL, focus entry/return and text expansion. No color-only meaning or
  motion-dependent status. Announce loading/results without excessive interruption.
- Document consumer responsibilities for custom cells, details and actions.

## Type safety, compatibility and localization

- Preserve row/field inference, computed accessors and native contexts; normal
  use must not require casts to bypass the API.
- React 19+, TanStack Table v9; HeroUI v3/Tailwind v4 for styled consumers only.
  Exact peer ranges/TypeScript support await feasibility and packed consumers.
- Primary Start + Query integration covers SSR/hydration, cancellation, query
  ownership, previous-data/error handling and client/server separation.
  Framework-neutral React remains valid; Vite and Next App Router are additional
  tested examples, not mandatory runtime dependencies.
- Latest two stable Chrome/Edge/Firefox/Safari, current iOS Safari and Android
  Chrome. Publish actual versions and limitations; WebKit automation is not an
  actual Safari/mobile screen-reader pass.
- English defaults with replaceable dictionaries; locale-aware numbers/dates;
  LTR/RTL and light/dark. Include Arabic/RTL validation without promising a
  maintained Arabic dictionary. No mandatory Lingui/other i18n framework.

## Performance and scale

| Reference workload | Required target |
| --- | --- |
| Local 10,000 records × 20 fields; up to 100 rendered page rows | p95 ≤200 ms applied filter/sort/page/visibility; initial render ≤1 second after data available |
| Server-controlled up to 100 records × 30 fields; supplied larger total | Same frontend targets; network/backend processing excluded explicitly |

Exclude configured debounce and arbitrary consumer-renderer costs; report
typing-to-result separately. Fix hardware/browser/fixtures/protocol **before**
measurement using the [HLD protocol](../docs/engineering/performance.md). Measure
reorder responsiveness without inventing a numeric drag-frame guarantee.
These are reference scenarios, not universal maxima. No full remote-dataset
loading, virtualization, cursor API or spreadsheet-scale editing is required.

Keep optional UI/features out of headless requirements; verify imports and
production bundles. Report own code versus peers/optional sortable separately.

## Reliability, privacy and maintenance

Stable identity across updates; separate evaluation/rendering from authorization
and backend construction. No automatic telemetry, application-data uploads or
URL persistence of sensitive criteria. No automatic storage persistence.
Publish compatibility, changes, migration guidance and tested feature combinations.
Two tables must stay isolated unless deliberately controlled together.
