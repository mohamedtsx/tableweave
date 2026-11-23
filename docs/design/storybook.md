# Storybook workbench contract

Source: HLD §13 and §§18–20; FR-16. Home: `apps/storybook`. WP-01 mounts only
`Foundation/Workspace → Smoke` using real vendor primitives and synthetic local
state, not a Tableweave component or approved visual design. The catalog below
remains planned. Root [README](../../README.md#local-foundation-workflow) owns
verified commands; no Gamila paths or test scripts are copied.

## Ownership

Use real library components/default tokens and synthetic shared fixtures, not
duplicated demo implementations. Storybook dependencies/config/stories remain
development-only and outside published runtime entries/tarballs. No auth,
business backend, private data, provider credentials or `.repo/` imports needed.
Controls represent meaningful props; stateful compositions own actual query/
draft/pending behavior. Do not remount controllers to hide lifecycle bugs.

Reuse the test/design field/operator/action fixtures. Interaction stories assert
accepted transitions where useful, not only screenshots. Avoid duplicate browser
runners asserting the same thing; choose tooling against the pinned Storybook
version during bootstrap. Do not promise a specific vendor story API unverified.

## Required catalog

HLD baseline stories: `Default`, `FullyConfigured`, `FieldOwnership`,
`BuilderAllAny`, `AsyncOptions`, `SelectedAcrossPages`, `RequiredColumns`,
`GroupedColumns`, `DragBlocked`, `ReorderFailure`, `CustomDetails`,
`InitialLoading`, `Refreshing`, `InitialError`, `RefreshError`, `Empty`,
`NoResults`, `UnknownEmpty`, `Dark`, `RTL`, `Narrow`.

Additional routed scenes: `OperatorFamilies`, `InvalidDraft`, `BuilderClear`,
`SelectionLifetime`, `Sorting`, `Pagination`, `CustomerDetails`,
`InventoryDetails`, `IndependentTables`, `AccessLoss`. These names are local
planning labels, not existing generated story IDs. The [F-scene map](handoff.md#required-review-scenes)
assigns coverage; the implementation records actual IDs when created.

Exercise custom cells/actions/details slots, disabled combinations, owner-conflict
diagnostics, static/async entity options, stale/empty/race fixtures, current-page
selection and off-page counts. Test 1440/1024/768/390/320 CSS px, light/dark,
English/Arabic RTL and zoom without Cartesian story explosion.

## Acceptance limits

Storybook enables component review without business services. Accessibility-addon
or interaction passes do not prove SSR/hydration, real backend authorization,
mutation persistence, actual Safari/mobile or complete screen-reader conformance.
Keep separate packed-consumer, SSR, browser and manual acceptance fixtures.
Static Storybook hosting is a separate publication action; artifacts contain only
authorized synthetic data. See [testing strategy](../testing/README.md).
