# Product overview

Source: PRD v1.0 §§1–5, 12–15. [Acquisition and authority](../docs/reference/source-manifest.md).

## Promise and evidence

Tableweave is a reusable, configurable table toolkit for React developers who
repeatedly build tables for different datasets and stakeholder needs. Developers
describe data, field capabilities, enabled tools and application actions.
Tableweave supplies coherent interactions, presentation defaults, recovery and
customization on TanStack Table, with an optional HeroUI experience.

**Promise:** define your data and requirements; deliver a consistent, customizable
table experience without rebuilding its design and interactions each time.

The problem evidence is the owner's repeated table-building experience and a
transactions prototype, **not independently validated market research**. Proposed
usability measures are hypotheses, not observed adoption or performance results.
TanStack supplies behavior, component libraries supply controls, but applications
still repeatedly assemble field tools, responsive access and failure handling.
Copying a previous table creates diverging behavior and duplicated maintenance.

## Users and jobs

- **Primary:** application developers who know their domain and need typed,
  adaptable defaults across multiple tables.
- **Secondary:** design-system/platform teams; open-source maintainers and
  contributors; finance/support/operations users of consuming applications.
- Introduce a dataset without redesigning standard interactions.
- Change stakeholder tools through configuration rather than a fork.
- Replace or extend a built-in part without abandoning the toolkit.
- Give clear feedback and recovery for loading, stale, failed or filtered data.

## Goals and principles

Reduce repeated decisions; provide a polished default and truly headless use;
make required tools configurable at table/field level; preserve TypeScript
inference and native TanStack access; support local and app-controlled server
processing; make accessibility/responsiveness/recovery part of the contract;
establish credible open-source docs, tests and releases.

1. Configuration first; composition when needed.
2. Explicit developer-chosen capabilities, not type-based guesses at intent.
3. Domain-neutral foundations: transactions, customers and inventory are examples.
4. Predictable behavior across tools and datasets.
5. Recoverable defaults, not demo-only happy paths.
6. Explicit ownership: applications keep network, permissions and persistence.
7. Bounded, evidenced scale: publish workloads/combinations, not “any scale.”

## Scope and exclusions

All eleven original capabilities ship in the **first stable release**: row drag,
column drag, field sorting, responsive details, visibility, builder, tabs, search,
standalone date, builder-only Clear, and pagination. Recovery, opt-in selection
and custom actions, localization/extensibility and Storybook are also required.
Prereleases may be incremental; stable must satisfy the full [feature contract](features.md).
Shipping a capability does not enable it by default.

Not included/implied:

- Another sorting/filtering engine replacing TanStack.
- Data fetching, database choice, authentication, backend authorization or
  automatic mutation/persistence.
- Stakeholder intent inferred solely from JavaScript property types.
- Universal combinations, unlimited scale or virtualized spreadsheet workloads.
- Pixel-perfect cloning of the exploratory Figma prototype or commercial
  reference asset/source redistribution rights.
- Spreadsheet editing, reporting engine, no-code table builder, nested Boolean
  groups, cursor pagination, dataset-wide select-all-matching, built-in Export.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Giant configuration becomes another framework | Small common contract, native TanStack concepts, focused extension points |
| Builder becomes a query-language project | Explicit families/operators/validation/flat Boolean scope; defer complexity |
| Drag implies wrong order under filters/server pages | Manual/current-page restrictions, stable IDs, application persistence/recovery |
| Two owners of state | One transition coordinator and documented controlled groups |
| Prototype mistaken for specification | Trace to FR/D; approve visual work separately |
| Accessibility/scale claims exceed evidence | Reproducible workloads, exact matrix, manual checks and honest limits |
| Maintenance exceeds capacity | Staged releases and explicit support policy, validated priorities |

## Milestones and success

PRD baseline is complete. HLD is complete **for review**. Feasibility,
implementation/prereleases, authorized real-consumer validation, and stable
publication remain future activities; no dates/staffing commitments are implied.
The [delivery plan](../docs/planning/delivery-plan.md) sequences those activities.

Observe a developer making a typed table and adding search, sorting and a builder
filter; use a 30-minute task as an advisory research hypothesis. No fixed external
participant count blocks release. Downloads/stars are not substitutes for
correctness or retained use. Required success measures and exact release
evidence live in [release gates](release-gates.md).
