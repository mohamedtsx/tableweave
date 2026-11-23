# Selected technical baseline

Source: HLD §3. Selected majors/generations are design decisions; exact installed
versions and valid peers await G-01/G-05. WP-01 now pins an executable development
candidate in manifests/`pnpm-lock.yaml`; see [foundation evidence](../evidence/wp-01-foundation-2026-11-23.md)
for exact versions, reviewed tooling choices and limits. A foundation check does
not accept the full runtime compatibility matrix.

| Area | Intended baseline | Verification obligation |
| --- | --- | --- |
| Development | Node 24 LTS, pnpm 10, strict TypeScript 6 | Pin exact reviewed tools in bootstrap; TS 5.9/6 declaration consumers where vendor types permit |
| Runtime | React 19, TanStack Table v9; target researched v9.3 behavior | Inspect actual v9 docs/types, per-slice control/subscriptions/row models; real packed consumer builds |
| Styled layer | HeroUI v3, corresponding styles/React Aria peers, Tailwind v4 | Align actual versions; compound component API; no v2 Provider assumptions |
| Dates | Internationalized Date and native Intl | Clock/timezone/date-only/DST/locale/SSR fixtures; independent Apache obligations |
| Internal contract validation | Valibot 1.5.0, approved for WP-02 | No vendor schemas/types on the wire or in public declarations; strict packed consumers |
| Sortable | New `@dnd-kit/react` generation, isolated optional entry | G-02 before adapter freeze; do not mix legacy core/sortable or a second Aria drag manager |
| Builder | Scoped purpose-built flat editor/operator registry | No initial react-querybuilder dependency; revisit behind our contracts only if evidence supports it |
| Server-data examples | Start + Router + Query, one SSR integration | Request-scoped QueryClient; Query/router not core dependencies |
| Secondary examples | Vite React, Next.js App Router | Same contracts; Next client/server import boundaries tested |
| Development checks | Vitest, Testing Library, Playwright, Storybook, axe, type/package checks, Changesets | Actual installed commands/versions and clean consumer evidence; manual AT remains separate |

React 19+ is the product compatibility intent, not proof that every future React
release is supported. Node 24 is a development baseline, not a browser-consumer
runtime requirement. Final peer ranges follow tested combinations, not copied
reference patch numbers. A vendor incompatibility is recorded/reviewed, not
silently resolved by weakening the PRD.

WP-02 explicitly declares Internationalized Date `3.12.4` and Valibot `1.5.0`
in the core package under maintainer approval. Valibot's internal declaration file
mentions `Blob`/`File`: the private build uses existing Node 24 typings rather
than adding DOM libs or skipping declarations. Packed consumers still compile
without DOM/Node typings. This is an internal build choice, not a browser/global
requirement on public contracts or proof of SSR. See [contract limits](wp-02-contracts.md).

No Redux/Zustand, mandatory Query/router/i18n/ORM, react-querybuilder, nuqs,
virtualizer, spreadsheet engine or backend service is selected for core. Optional
URL/storage recipes remain explicit application choices, with sensitive-data
warnings. Do not install both TanStack Virtual and React Aria Virtualizer.

## Compatibility evidence

Release evidence must name exact React/TanStack/HeroUI/styles/Tailwind/Aria/date/
sortable versions, TS declaration consumers, Node/pnpm/lockfile and actual browser
builds. The browser policy is [product quality](../../product/quality.md#type-safety-compatibility-and-localization).
Playwright WebKit is not proof of actual Safari/mobile assistive technology.

## Conditional official lookup

- [TanStack Table state](https://tanstack.com/table/latest/docs/framework/react/guide/table-state)
  for controlled slices/reactive subscriptions; `latest` URLs must be checked
  against the installed version.
- [HeroUI v3 Storybook](https://storybook-v3.heroui.com/?path=/docs/welcome--docs)
  is the **primary HeroUI component reference**, per maintainer instruction.
  Use its actual component docs/stories for anatomy,
  variants and interactions; navigate the catalog rather than guessing story IDs.
  The maintainer reports the main HeroUI site is sometimes unresponsive; do not
  repeatedly depend on it for component lookup. The
  [main-site quick start](https://heroui.com/docs/react/getting-started/quick-start)
  is supplementary setup guidance. Check Storybook examples against installed
  package types and official source at the matching release/tag; a hosted
  Storybook may track a different release and is not compatibility proof. If
  Storybook is unavailable, use matching installed types/tagged source and record
  the limitation rather than claiming the component reference was inspected.
- [dnd-kit generation migration](https://dndkit.com/react/guides/migration) and
  [sortable state](https://dndkit.com/react/guides/sortable-state-management/).
- [Internationalized Date](https://react-spectrum.adobe.com/internationalized/date/index.html).
- [Start + Query](https://tanstack.com/start/latest/docs/framework/react/guide/tanstack-query),
  [Router SSR Query](https://tanstack.com/router/latest/docs/integrations/query).

The PRD's 2026-11-22 candidate-version observations and HLD's documentation/source
research were **not executed integration checks**. See [research provenance](../reference/research.md).
