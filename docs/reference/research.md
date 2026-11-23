# Research provenance and candidate limits

Sources: PRD §§16–17 and HLD §21. The table below records **source-time research**,
not fresh registry checks, installed versions, licenses audit or feasibility
results from TASK-001. Product decisions and HLD selections take precedence over
candidates. Use official docs matching the installed release before coding.

| Candidate/reference | Source-time observation | Disposition |
| --- | --- | --- |
| HeroUI Table / React Aria | Table docs/source cover collections/TanStack composition; Aria row drag exists | Default renderer selected, exact bridge unproven; G-01/G-02 |
| New `@dnd-kit/react` | Observed 0.5.3, MIT; generation differs from legacy core/sortable | Isolated adapter selected by HLD, 0.x/DOM/focus risk; no second Aria drag manager |
| react-querybuilder | Observed 8.28.0, MIT, replaceable controls/validation | Candidate rejected initially in favor of scoped flat builder; public model not adopted |
| Internationalized Date | Observed 3.12.4, Apache-2.0 | Selected with Intl; prove timezone/DST/SSR, retain independent obligations |
| TanStack Query | Observed 5.108.2, MIT | Optional app integration, never core fetching dependency |
| nuqs | Observed 2.10.3, MIT | Optional future URL recipe, no default sensitive criteria persistence |
| React Aria Virtualizer / TanStack Virtual | Latter observed 3.14.28, MIT | Not required v1; do not add both or promise virtualized drag |
| Dice UI Data Table | shadcn/Base UI/Radix/nuqs source-distribution reference | Metadata/operator/composition inspiration only; check license, no wholesale adoption |
| OpenStatus data-table-filters | Describes itself as playbook, not library | Server/filter/state reference, no inherited ORM/router/backend or source rights |
| Vitest/Testing Library/Playwright/axe | Source observed MIT/MIT/Apache-2.0/MPL-2.0 respectively | Development candidates/selected roles; review actual versions/obligations |

## Selection-reference observations

PRD records live-reference inspection on 2026-11-23: first selection replaced
Filters with count/Export/Cancel; external tabs/date remained; page and Amount
sort preserved selected identity/count; tab scope change cleared it; Cancel
restored toolbar without undoing sort. **These are source-reported reference
observations, not Tableweave checks executed here.**

General search/date/programmatic transitions were not all observed. D-38–D-40
explicitly generalize toolbar-embedded search/visibility replacement and effective
filter clearing. Export remains an application example, not built-in scope.
Preserve those product extensions instead of re-inferring behavior from the demo.

## Retrieval and interpretation limits

The PRD reports TanStack HeroUI example URLs returned 404 despite search results;
they are not implementation evidence. HLD reports HeroUI MCP/doc retrieval failed
then official Table/Drawer repository source was inspected. Unpinned branch source
establishes anatomy, not a released-peer compatibility pass. This task did not
repeat vendor fetches or open/edit Figma; it reviewed the supplied documents and
read-only Gamila practices.

## Conditional official references

- [TanStack Table](https://tanstack.com/table/latest),
  [state guide](https://tanstack.com/table/latest/docs/framework/react/guide/table-state).
- [Query pagination](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries),
  [cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation).
- [Start + Query](https://tanstack.com/start/latest/docs/framework/react/guide/tanstack-query),
  [Router SSR](https://tanstack.com/router/latest/docs/integrations/query).
- [HeroUI source Table](https://github.com/heroui-inc/heroui/blob/v3/packages/react/src/components/table/table.tsx),
  [Drawer](https://github.com/heroui-inc/heroui/blob/v3/packages/react/src/components/drawer/drawer.tsx).
- [Aria Table](https://react-aria.adobe.com/Table), [drag/drop](https://react-aria.adobe.com/dnd).
- [dnd-kit quickstart](https://dndkit.com/react/quickstart),
  [migration](https://dndkit.com/react/guides/migration),
  [sensors](https://dndkit.com/react/guides/sensors).
- [Query Builder controls](https://react-querybuilder.js.org/docs/components/querybuilder-controlelements),
  [validation](https://react-querybuilder.js.org/docs/utils/validation).
- [Internationalized Date](https://react-spectrum.adobe.com/internationalized/date/index.html),
  [nuqs](https://nuqs.dev/docs), [Dice UI](https://diceui.com/docs/components/data-table),
  [OpenStatus](https://data-table.openstatus.dev/).
- [Notion views/filtering](https://www.notion.com/help/views-filters-and-sorts),
  [property filter API](https://developers.notion.com/reference/filter-data-source-entries).

Exact prototype/demo URLs live in [designer handoff](../design/handoff.md#authority-and-exact-references).
Reference availability is not audited by the local-link checker.
