# Developer experience and stable-release gates

Source: PRD v1.0 §§7, 11–15, D-29/D-35/D-36. [TASKS](../TASKS.md) owns progress;
this is the acceptance contract, not a checklist of completed work.

## Required developer experience

- Installation instructions and a minimal typed example verified against packed
  packages, plus configuration/feature/default/restriction references.
- Polished transactions, customers and inventory examples proving domain reuse.
- A truly headless example using neither HeroUI components nor styling.
- Primary Start + Query server example covering SSR/hydration, request isolation,
  cancellation, loading/retained rows/errors/retry, totals and no-results.
  Additional tested Vite React and Next.js App Router examples.
- Recipes for custom cells, row/bulk actions, custom filters, localization and
  recovery overrides; arbitrary custom record details and shell slots.
- Storybook for representative configurations, interactions, disabled features,
  async options, all recovery states, custom content/actions, narrow/RTL/themes.
- MIT license for owned source, independent third-party notices, README,
  contribution guide, conduct policy, issue/PR templates, security instructions
  and changelog; semantic versioning, prerelease/stability/compatibility/migration
  policy and repeatable release process.

## Blocking stable gates

| Gate | Required evidence |
| --- | --- |
| Full scope | All FR-01–FR-16; all eleven original capabilities, including both drag axes; supported combinations and restrictions documented/tested |
| Feature composition | Builder-only Clear, owner exclusivity/All-Any, hidden fields, grouped boundaries, selection toolbar/lifetime, controlled state, recovery/server state |
| Lower bespoke work | Ordinary/recovery states usable without rewriting table body |
| Types and packages | Type inference/exports, clean consumer installs/builds from tarballs, contents/styles/directives, correct peers and headless isolation |
| Reuse/integration | Three domains plus authorized real-consumer integration aligned with Gamila; stack similarity alone is not real-consumer acceptance |
| Workbench | Accepted component/configuration/state/interaction matrix in Storybook |
| Accessibility | Manual keyboard, screen-reader and simple non-drag pointer acceptance alongside automated checks; narrow/zoom/RTL/theme review |
| Browsers | Published exact supported/tested desktop/mobile versions and limitations |
| Performance | Approved workloads meet p95 ≤200 ms interactions and ≤1 second initial render under fixed protocol; results/exclusions published |
| Publication | MIT/third-party obligations, brand/npm scope/package rights verified, version/release notes/provenance/rollback plan and explicit publishing authorization |

G-01–G-05 are [engineering proof gates](../docs/engineering/feasibility.md), not
substitutes for this complete stable checklist. No gate is currently represented
as passed. Prereleases may be incomplete but must label missing capabilities,
compatibility and known limitations explicitly; do not advertise them as stable.

## Advisory validation

Observe developer integration friction with the proposed 30-minute typed-table
task. External usability trials inform reviewed improvements; **no fixed number
of external participants is a stable blocker**. Downloads/stars alone do not
establish quality. Brand/npm availability is readiness work, not an unresolved
scope decision or claim of reservation.

See [release operations](../docs/operations/releasing.md) for execution and
[acceptance](acceptance.md) for derived scenarios. Describing a consumer gate
does not authorize editing Gamila, and describing a release does not authorize
publishing packages or deploying docs.
