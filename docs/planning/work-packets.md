# Ready-to-claim work packets

These packets specify outcomes and acceptance, not progress. Claim one through
[TASKS](../../TASKS.md) only after [definition of ready](../agents/workflow.md#definition-of-ready).
All code paths below are proposed. Use actual installed commands once WP-01
creates them. Every handoff includes exact revisions, artifacts, commands/results,
limits and consumer impacts using the [handoff template](../templates/handoff.md).

Common exclusions: no `.repo/` changes/imports, private data, unauthorized installs,
source/Figma writes, Git/npm publication/deployment or real-consumer mutations.
Coordinator owns TASKS/index edits; reserve shared paths before parallel work.
Required missing proof prevents that packet's completion, not unrelated work.

## WP-00 Reviewed design system and scenes

- **Role/dependencies:** designer + engineer; baseline review and explicit file/
  design-write authorization. No product scope changes.
- **Read:** [design handoff](../design/handoff.md), affected FRs/shared rules.
- **Paths/artifacts:** authorized design target, frame/story/FR mapping, review
  evidence under `docs/evidence/`; no runtime/package changes by default.
- **Deliver:** reusable variables/components/slots, configuration owner maps,
  F-01–F-22 and annotated flows, arbitrary details layouts, complete recovery,
  narrow/RTL/theme/input/focus annotations. Use existing design-system primitives
  if the target has them; preserve source/asset rights.
- **Validate:** joint engineer/designer review against scene/FR checklist, all
  three Clear/Cancel meanings, no automatic hidden data/Export/nested groups.
- **Stop/handoff:** unclear visual choice gets review, not new policy; return
  actual design node IDs, accepted/provisional dispositions and story mapping.

## WP-01 Workspace and package foundation

- **Role/dependencies:** foundation/package worker; TASK-002 and explicit local
  implementation/dependency-install authority.
- **Read:** [architecture](../engineering/architecture.md), [stack](../engineering/stack.md),
  [testing](../testing/README.md), [release operations](../operations/releasing.md).
- **Paths:** root manifests/lockfile/tool configs, package entry/build skeletons,
  minimal `apps/storybook`, test/consumer harnesses and CI; single writer. Update
  README with actual commands. Preserve pre-existing Git/submodule work.
- **Deliver:** pnpm workspace, reviewed exact toolchain/dependency set, ESM exports/
  declarations/client/server boundaries, style side-effect policy, initial
  meaningful smoke/type/import checks, synthetic Storybook boot, clean packing
  and local/static CI commands. Select build/lint details based on real metadata.
- **Validate:** clean reproducible install/build/declarations/test/story build/pack
  with inspected tarballs and honest empty-foundation limits. No auth/database
  services needed. Pin versions, don't copy Gamila patches/lockfile.
- **Stop/handoff:** dependency incompatibility → evidence/decision, not forced
  peers or runtime fake implementations. Return runnable commands, actual tested
  versions and next WP-02 inputs; do not claim G-01 or full G-05 passed.

## WP-02 Schema, operators and conformance vectors

- **Execution preparation:** [bounded implementation plan](wp-02-implementation-plan.md)
  (proposal only; TASKS owns review and authorization).
- **Role/dependencies:** contracts worker; WP-01 accepted.
- **Read:** [public API](../engineering/public-api.md), [operators](../../product/operators.md),
  [security](../engineering/security.md), AC-02–AC-07/AC-23/AC-26.
- **Paths:** `packages/react/src/contracts`, `filters`, definition schema types,
  `tests/contracts`; reserve shared exports with foundation owner.
- **Deliver:** schema/version/owner/sort/tab/limits validation, inferred helpers,
  versioned wire normalization/query identities, complete registry/presets/custom
  contracts, injected time, shared local/server translator conformance vectors.
- **Validate:** cross-field Any/same-field rules, inverse/cardinality, null/false/
  zero/whitespace/non-finite, inclusive numbers/DST/date-only/relative clock,
  membership/async stable IDs, unknown IDs/limits and React/DOM-free server import.
- **Stop/handoff:** no arbitrary backend predicates or formula engine; choose
  runtime validation implementation within dependency policy. Return schema/type
  revision and fixtures before controller/integration consumers start.

## WP-03 Accepted state and transition coordinator

- **Execution preparation:** [bounded WP-03 plan](wp-03-implementation-plan.md);
  TASKS owns plan-first execution authority and accepted producer status.

- **Role/dependencies:** controller worker; WP-02 schema revision.
- **Read:** [state/query](../engineering/state-and-query.md), shared rules,
  AC-03/AC-05/AC-08–AC-11/AC-24/AC-25.
- **Paths:** `packages/react/src/controller`, `hooks`, coordinator tests; one
  accepted interface owner for native/resource dependents.
- **Deliver:** pure transitions, subscription snapshots/selectors, transactional
  controlled query and separate selection/columns/details groups, semantic filter
  identity, reasons/revisions and proposed public hooks. No effects in reducer.
- **Validate:** one accepted query/callback transaction, resets/preservation,
  controlled rejection/no mirrors, functional native updaters, equivalent no-ops,
  independent tables and explicit definition transition. Finalize cross-controlled
  group policy through review, not hidden partial updates.
- **Stop/handoff:** no fetching/storage/whole-table bypass. Return command/state
  types plus transition fixtures and accepted controlled-owner semantics.

## WP-04 TanStack and HeroUI collection feasibility

- **Execution plan:** [WP-04 bounded plan](wp-04-implementation-plan.md); TASKS
  records current delegated authority, worker paths, review and gate disposition.

- **Role/dependencies:** native bridge + UI worker; WP-02/WP-03.
- **Read:** [rendering](../engineering/rendering.md), composite predicate contract,
  [G-01](../engineering/feasibility.md#g-01-native-processing-and-collection-bridge).
- **Paths:** `packages/react/src/tanstack`, minimal `packages/heroui/src/table`,
  isolated browser/type fixtures. Serialize shared DataTable/exports edits.
- **Deliver:** actual v9 per-slice/native bridge, one predicate carrier, local
  native filter/sort/page versus manual server mode, grouped collection structure,
  stable selection/focus keys, sort priority and subscribed leaf reads.
- **Validate:** G-01 real-browser/type/row-model/subscription/generated-ARIA fixture;
  no carrier leakage, no fake global callback, client/server correct processing,
  no duplicate React Aria state. AC-01/AC-03/AC-13/AC-23/AC-25.
- **Stop/handoff:** if bridge fails, fix/review before feature expansion. Return
  pinned API/peer evidence, accepted adapter surfaces and known limits.

## WP-05 Resource presentation and race safety

- **Role/dependencies:** resource worker; WP-02/WP-03.
- **Read:** [resources](../engineering/resources.md), recovery, AC-14–AC-17/G-03.
- **Paths:** `packages/react/src/resource`, focused hooks and controllable request
  fixtures; resource notice/state renderer changes allocated separately.
- **Deliver:** identity-tagged envelope, view precedence, one last accepted
  same-scope snapshot, actual-page provenance, fresh-empty replacement, status/
  stale action guards, safe error/retry and explicit access-loss handling.
- **Validate:** deterministic changed/same-key failures, uncancellable late
  responses, Retry requested query, scope/permission loss, previous empty,
  unmount/definition transition and buffer bound. Complete G-03.
- **Stop/handoff:** no fetch cache/persistence or placeholder promotion. Return
  plain adapter interface, request fixtures and exact acceptance/race evidence.

## WP-06 Primary Start and Query SSR integration

- **Role/dependencies:** integration worker; WP-04/WP-05.
- **Read:** [integration contract](../engineering/integrations.md), security,
  [G-04](../engineering/feasibility.md#g-04-ssr-and-hydration), AC-22–AC-24.
- **Paths:** `apps/example-start`, integration/SSR fixtures; no core Query imports.
- **Deliver:** synthetic authorized isomorphic reader/transport, state-before-data,
  normalized keys, request-scoped QueryClient/loader/provider, same-options
  hydration, cancellation/previous-error/totals/empty/option examples.
- **Validate:** two concurrent synthetic actors/scopes, no cache leak, stable
  locale/timezone/clock/IDs, no duplicate fresh reads, out-of-order failure and
  bounded page correction. Complete G-04; label synthetic authorization limits.
- **Stop/handoff:** no real Gamila data or production backend provision. Return
  actual integration versions, runnable example and SSR/resource evidence.

## WP-07 Builder, tabs, search, date and async choices

- **Role/dependencies:** tools UI worker; WP-04/WP-05, relevant reviewed/provisional
  visual dispositions. Coordinator allocates toolbar/shared files.
- **Read:** operators, shared rules, design F-02–F-07; AC-02–AC-08.
- **Paths:** `packages/heroui/src/filters`, tool-specific `toolbar` files,
  interaction fixtures/stories; core semantic changes return to owner.
- **Deliver:** segmented flat builder, editable applied rules/drafts, All/Any,
  Duplicate/Negate/Remove, builder-only Clear, search debounce, tabs/count labels,
  standalone date and static/async/custom inputs with selected-label recovery.
- **Validate:** full family/commit/owner/clock/invalid/cancel/last-membership flow,
  keyboard/focus, same local/server intent, stale options and whole-rule wrapping.
- **Stop/handoff:** no nested groups, fetching, implicit global reset or business
  Export. Return story IDs/FRs, interactions and component integration contracts.

## WP-08 Selection, sort, pagination and visibility

- **Role/dependencies:** table-controls worker; WP-04/WP-05, relevant visual review.
- **Read:** shared rules, rendering/reordering column section, AC-08–AC-11/AC-13/
  AC-15/AC-24; scenes F-08–F-11/F-17.
- **Paths:** `packages/heroui/src/selection`, `pagination`, column controls;
  coordinator owns shared toolbar switch/row/table file allocations.
- **Deliver:** stable-ID current-page selection, off-page total/action context,
  toolbar replacement/Cancel, single/multi-sort priority, known/unknown/stale page
  footer, size resets/clamping and required/hidden chooser.
- **Validate:** semantic reset versus sort/page preservation, controlled override,
  eligible mixed state, no fabricated records/totals/next, focus-safe swaps,
  current-snapshot metadata and carrier/utility exclusions.
- **Stop/handoff:** no all-matching sentinel or built-in actions. Return isolated
  transition/browser stories and remaining manual coverage.

## WP-09 Custom details, localization and responsive shell

- **Role/dependencies:** composition worker; WP-04/WP-05 and relevant visual review.
- **Read:** rendering, quality, design F-18–F-20; AC-18–AC-21.
- **Paths:** `packages/heroui/src/details`, styles/localization interface and
  focused stories; shared theme/table layout edits explicitly allocated.
- **Deliver:** arbitrary context/render/header/body/footer slots, controlled close,
  logical-end/fullscreen shell, off-page details/resource support, replaceable
  English dictionary, locale formats, themes/RTL and contained narrow scrolling.
- **Validate:** distinct custom layouts/actions, trigger isolation, all close
  paths/dirty-policy/focus fallback, 1440/1024/768/390/320/zoom/bidi, no auto cards/
  hidden fields; app-defined missing-info path.
- **Stop/handoff:** no built-in field-list template or claimed maintained Arabic
  dictionary. Return scene/story mapping, browser evidence and manual AT needs.

## WP-10 Optional sortable feasibility and delivery

- **Role/dependencies:** reorder worker; WP-04/WP-05.
- **Read:** [reordering](../engineering/reordering.md), G-02, AC-12/AC-13/AC-21.
- **Paths:** `packages/heroui/src/sortable`, optional export integration and move
  fixtures; core command changes negotiated with coordinator.
- **Deliver:** both axes using isolated new-generation adapter, controlled
  previews, required input methods, ID anchor/revision intents, one pending move,
  blocked reasons and authoritative failure recovery.
- **Validate:** G-02 collection/DOM identity, touch/pointer/keyboard/simple move,
  cancellation/focus, filter/sort/stale/pending restrictions, utilities/groups/
  hidden order, new data/scope versus late outcome, default bundle exclusion.
- **Stop/handoff:** incompatible reparenting → adapter/version revision, not
  product downgrade. Synthetic persistence is labeled; no business backend write.

## WP-11 Examples, recipes and complete workbench

- **Role/dependencies:** developer-experience worker; WP-06–WP-10 and design map.
- **Read:** release gates, [Storybook contract](../design/storybook.md), AC-01/AC-27.
- **Paths:** `apps/docs`, `apps/storybook`, `apps/example-vite`, `apps/example-next`,
  shared synthetic fixtures, actual API docs/README (coordinator integrates).
- **Deliver:** polished transactions/customers/inventory, Start/headless/Vite/Next
  consumers, custom cell/filter/action/details/locale/recovery recipes, defaults/
  restrictions and every required story/F scene linked to actual IDs.
- **Validate:** examples compile/run against actual packed API; truthful action
  callbacks, synthetic data, state interactions, Next directives/server contracts,
  no workspace-only imports or stories in runtime package contents.
- **Stop/handoff:** no fake installation instruction, published URL or inherited
  commercial assets. Return executable docs examples and gaps for WP-12/WP-13.

## WP-12 Integrated browser and manual accessibility acceptance

- **Role/dependencies:** verification reviewer; integrated WP-11.
- **Read:** [testing](../testing/README.md), AC-01–AC-27, quality and scenes.
- **Paths:** interaction/accessibility/browser fixtures and dated evidence;
  implementation fixes assigned to owning worker, not overwritten in parallel.
- **Deliver:** risk-based cross-feature matrix, actual desktop/mobile versions,
  automated checks plus manual keyboard/screen-reader/simple-pointer/touch/zoom/
  RTL/theme/focus review, reproducible failures and fixes.
- **Validate:** real generated table/ARIA and retained/stale/selection/drawer/move
  behavior. Actual Safari/mobile coverage separate from WebKit emulation.
- **Stop/handoff:** missing manual/supported-browser evidence remains a gate;
  never infer WCAG from axe. Return exact tested matrix and unresolved limitations.

## WP-13 Packed compatibility and release tooling

- **Role/dependencies:** package worker; integrated WP-11; early harness allowed
  after WP-04 with explicit scope. Exclusive manifests/lockfile ownership.
- **Read:** architecture/stack, [releasing](../operations/releasing.md), AC-26.
- **Paths:** export/build/package configuration, `tests/consumers`, Changesets/CI,
  notices/changelog/API reference and evidence.
- **Deliver:** tarball clean consumers for headless/styled/Start/Vite/Next, inferred
  declaration positive/negative tests in declared TS/peer matrix, own/peer/bundle
  split, style/client directives and files/license checks; repeatable local CI.
- **Validate:** no .repo/Storybook/private files, no React/DOM in contracts,
  no mandatory UI/network in headless, default styled excludes sortable, correct
  ESM/type/side-effect exports. Record package portion of G-05 only.
- **Stop/handoff:** no trusted-publisher claim or publish without actual rights/
  permission. Return inspected artifact hashes/versions and remaining release inputs.

## WP-14 Reproducible performance acceptance

- **Role/dependencies:** performance reviewer; integrated WP-11/WP-13.
- **Read:** [fixed protocol](../engineering/performance.md), AC-28.
- **Paths:** `tests/benchmarks`, deterministic fixtures, sanitized raw samples/
  reports and evidence; runner provisioning needs explicit authority.
- **Deliver/validate:** approved reference runner/workloads, validated marks/paint
  timing, ten warmups/100 samples per scenario across three sessions, per-scenario
  p50/p95, ≤200 ms/≤1 second gates, exclusions/typing/SSR/bundle/reorder reports.
- **Stop/handoff:** unequal hardware or missing runner is not a pass; no fabricated
  universal upper limits. Return exact results, regressions/fixes and performance
  portion of G-05 for integrated readiness review.

## WP-15 Real consumer and stable readiness

- **Role/dependencies:** integration/release reviewer; WP-12–WP-14 and separate
  actual consumer target/access/change authorization.
- **Read:** release gates, AC-29, operations, full traceability/evidence.
- **Paths:** authorized consumer workspace (never read-only `.repo/Gamila`),
  sanitized integration evidence/release readiness; library changes separate.
- **Deliver:** Gamila-aligned real-consumer acceptance, complete FR/G/AC evidence
  review, actual package/name/publisher/license/security-channel checks, semver/
  migration/known-limit notes, proposed release candidate and rollback plan.
- **Validate:** clean candidate artifacts, complete current revision coverage,
  private-data-safe evidence; no substitution of stack-only fixture for real use.
- **Stop/handoff:** readiness report does not authorize commit/push/npm/deploy.
  Publication is a separately authorized operation; external trial count advisory.
