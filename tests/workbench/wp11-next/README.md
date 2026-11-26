# WP-11 Next isolated source evidence

**Provisional source handoff only.** Main selected app-only materialization47e20df
after preserved Stage A c9c36cb/intake9ce41bd. The writer changed only the16 newly
leased `apps/example-next` files (not `package.json`) and this new fixture directory.
Main's plan was read at its absolute primary documentation path; no active primary
Stage B source/progress was read. No Git operations, installs, old-input edits,
framework execution, agents or drag work were performed. No TASKS/REVIEW metadata
was edited because main exclusively owns that handoff.

## Immutable inputs and actual checks

- `before.json` records **1,692 actually present old regular inputs**, byte hashes
  and permission bits, before app edits. It includes all155 library bodies, tracked
  shared/catalog artifacts actually present in this tree, all old apps/tests/configs,
  root/app manifests, lock/settings and private compatibility inputs. It does not
  pretend absent primary/raw artifacts were present. It excludes `.git`, symlinks,
  `node_modules`, read-only `.repo`, and this new evidence directory.
- `source155-before.json` is an unchanged copy of main's source155 identity file,
  SHA256 `bdfabdedcb23cb53244e9e9298cc234717a3cc526f0c97c2d46e3dfe6dcf1837`.
  `scope.mjs` checks actual155 hashes/modes at capture and every old regular input
  thereafter, while rejecting unleased new app paths. `source155-after.json` is
  sealed only after final scope verification; it is not a new historical baseline.
- Frozen app manifest SHA256:
  `55ed9a4ee4a560846548a94c9ef223c01627ac3ad649f338c0b9f19d5224ce42`;
  lock SHA256:
  `6cc5f56f8377ce15d85576ca2d2f9b487925cf423899002dbff51db05ef1c688`.
  `receipts/` preserves main's plan, complete additive lock review, installed-byte
  inspection and ignore-scripts install log byte-for-byte. This is a receipt copy,
  not another install. Main reviewed all5 existing importers/468 package/468 snapshot
  blocks, adding one importer/44 pairs with no old drift.
- `installed.mjs` rechecks selected manifest/license/type-entry identities, records
  separate Next PostCSS8.5.23 and plugin PostCSS8.5.33 metadata, and extracts all44
  new locked package blocks/SRIs. `installed-*/new-closure.json` is provenance, **not
  tarball-byte/signature/native-platform/license-closure approval**. Optional platform
  and unmaterialized archives remain unverified; no new resolution research occurred.
- `static.mjs` parses directives/imports/config source and traces the plain route
  through25 repository modules; external declared edges stop at Valibot and
  `@internationalized/date`. It forbids client/styled owners on that route, server
  mutable declarations and app runtime/source-alias/suppression escapes. This is
  static guard coverage, not a complete bundler tree-shake/runtime-closure proof.
- Positive TS6 includes the app, actual A producer/facade source, real installed
  Next declarations, JSDoc NextConfig/PostCSS options, route types, serializable DTO
  shape and top-level authored TS/TSX fixtures. It excludes deliberate negatives,
  packed configs and raw receipts. MJS fixtures are parsed/linted, not imported.
- `.artifacts/positive-inputs-001/inputs.json` pins the final actual positive
  compiler inputs plus compiler bodies, own inspection scripts, configs, declared
  manifests and received inspection inputs. Its `summary.json` gives the exact
  count/aggregate and process/TS versions: **1,728 inputs**, TS6.0.3/Node24.22.0,
  SHA256 `74f5065d1ca42b8d7ef99e18a21579bd974ab7ed5c3a922c00be364e8c14aa55`.
  All1,728 hashes/modes were rechecked unchanged after final LIGHT. This does not pin every installed
  runtime/native/transitive artifact.
- `handoff-hashes.json` seals all new app16 inputs and this fixture's raw evidence,
  including preimages, after-map, immutable logs and compiler pin. It excludes itself.
  `seal.mjs` reports the map/app aggregate; `check-handoff.mjs` verifies every sealed
  hash/mode. Neither overwrites historical maps or producer profiles.

### Attempt history (raw outputs remain under `.artifacts/`)

| Attempt | Actual result and limit |
| --- | --- |
| light-001 | Failed TS: Next declarations need standard `PromiseWithResolvers`; initial ES2023 lib was too narrow. |
| light-002 | Passed Next declaration/public type probe with ESNext lib; no dependency or suppression added. |
| light-003 | Failed TS: actual `getQueryIdentity` requires a third compile-options argument. |
| light-004 | Passed app positive TS after supplying the actual fixed-clock options. |
| light-005 | Passed with authored top-level SSR/route/browser/DTO cases included for typechecking only. |
| light-006 | Positive TS/static/installed/scope passed. Scope preserved all1,692 old inputs; static traced25 repository modules. |
| format-001 | Scoped full Biome fixed formatting and reported app accessibility grouping plus a template-literal hint; raw failure preserved. |
| format-002 | Formatting fixed; Biome rejected redundant group role in favor of a semantic fieldset. App now uses fieldset/legend. |
| format-003 / biome-001 | Full scoped Biome passed38 owned code/config files; check mode made no fixes. |
| light-007 | Positive TS/static/installed/scope passed after the semantic grouping and disposal review; application tests still UNRUN. |
| format-004 / biome-002 | Final full scoped Biome passed38 owned code/config files, assist off; check mode made no fixes. |
| light-008 | Final positive TS/static/installed/scope passed against the captured input snapshot. All1,692 old hashes/modes and155 source bodies remain fixed. |

Final numbered LIGHT/Biome attempts and the exact immutable input aggregate are
recorded in raw logs and the pinned summary, not substituted for failed attempts.
No application test has been executed by any of these checks.

Allowed repeat checks, repository root, with **fresh** numbered labels only:

```sh
node tests/workbench/wp11-next/checks.mjs light-NEW_NUMBER
node tests/workbench/wp11-next/format.mjs biome-NEW_NUMBER check
node tests/workbench/wp11-next/check-inputs.mjs positive-inputs-001
node tests/workbench/wp11-next/check-handoff.mjs
```

`format.mjs` enables full recommended Biome plus formatter, assist off, restricted
to new owned code/configs. It explicitly excludes manifests, seals, preimages,
receipts and raw outputs. Scope runs before imported tooling as well. Use the
versioned attempt logs, not these illustrative `NEW_NUMBER` placeholders, for the
checks actually performed.

## Authored but UNRUN final matrix

No skipped/passing placeholders: tests below import real modules or exercise a real
Next server only when the user's final phase is authorized. None was invoked now.

| Case | Fixture / proof boundary |
| --- | --- |
| Plain JSON/query/UTC, finite records, fresh nested arrays and request envelopes | `server.test.ts`; actual builder/public `parseQuery`, not a fake row validator. |
| Headless request isolation, no-store, valid/invalid label handling | `server.test.ts` calls actual GET; `browser.spec.ts` uses real concurrent HTTP requests. |
| Neutral genuine React SSR, two distinct A C/P owners, independent accepted queries/revocation | `client.test.tsx`; renderToString and actual public source owners. Source lane only, not Next SSR. |
| Immediate Strict-style effect replay and terminal source disposal | `client.test.tsx`; same genuine C/P, no replacement controller. This is not proof of all React/Next scheduling. |
| Initial HTML versus Flight script data, real hydration, table/pager, hide/show state retention | `browser.spec.ts`, real Next server at6571, no `createRoot`/fake hydration. |
| Two simultaneous client boundaries and terminal revocation isolation | `browser.spec.ts` comparison page; final manual scheduling/navigation checks still required. |
| Invalid query bootstrap | `client.test.tsx` uses actual public parser rejection. |
| Deliberate non-JSON DTO/excess callback type errors | `negative/payload.ts` and its excluded config: final nonzero TS diagnostics must be inspected, not treated as positive evidence. |
| Genuine function crossing RSC | `negative/NonSerializablePage.tsx` injected only into an outside fixture; legal spread is intended to reach Next's real rejection. `packed/negative.spec.ts` asserts a dev500/diagnostic. |
| Ordinary archive exports without source/emitted-workspace aliases or private patch | `packed/prepare.mjs`, no-alias Next config and `packed/ordinary.spec.ts`. Actual two package archives are mandatory; copied app/shared inputs are explicitly relocated example source, not fake library packages. |

Final-only commands, **UNRUN**, after main authorizes prerequisites/emission:

```sh
node node_modules/vitest/vitest.mjs run --config tests/workbench/wp11-next/vitest.config.mjs
node node_modules/@playwright/test/cli.js test --config tests/workbench/wp11-next/playwright.config.ts
WP11_NEXT_PRODUCTION=1 node node_modules/@playwright/test/cli.js test --config tests/workbench/wp11-next/playwright.config.ts
node node_modules/typescript/bin/tsc -p tests/workbench/wp11-next/negative/tsconfig.json --pretty false
```

The unit config is an explicitly **source-only** Vitest lane with app React filesystem
resolution, not Next runtime configuration. Its aliases must never be copied into
Next. Production browser mode needs a separately successful real build first. Dev
and production servers are mutually exclusive; port6571 refuses an existing server.
Browser acquisition/install is not authorized by these commands.

### Outside-workspace ordinary and negative-RSC lanes

`packed/prepare.mjs` refuses execution unless `WP11_NEXT_FINAL=1`, requires a fresh
absolute outside-workspace destination plus real `.tgz` archives, records their byte
hashes, and copies **no** workspace patch/workspace config/source alias. It writes no
current workspace input. It does not emit, pack, install, generate a lock or run Next.
Main must inspect archive contents/peers/public entries and authorize the exact
unpatched consumer lock/materialization separately. No package-manager parent/global
compatibility settings may leak in. Ordinary unpatched failures must be retained as
failures; do not silently add the workspace's private RAC/HeroUI patch profile.

Final-only invocation template (not yet materialized):

```sh
WP11_NEXT_FINAL=1 node tests/workbench/wp11-next/packed/prepare.mjs ABSOLUTE_FRESH_CONSUMER ACTUAL_REACT_TGZ ACTUAL_HEROUI_TGZ ordinary
WP11_NEXT_FINAL=1 WP11_NEXT_CONSUMER=ABSOLUTE_FRESH_CONSUMER node node_modules/@playwright/test/cli.js test --config tests/workbench/wp11-next/packed/playwright.config.ts
```

Use a second fresh consumer with mode `rsc-negative`, reviewed installation, and
`WP11_NEXT_RSC_NEGATIVE=1` for the separate dev rejection. Do not combine that
intentional failure route with ordinary acceptance/build evidence. Raw error wording,
HTTP behavior and fixture portability are themselves unproved until this runs.

## Remaining gates / exact handoff

Main reviews and preserves the isolated source after Stage B intake. No extra lease
is currently requested. Stop on any required dependency/profile/export change,
shared-source lifecycle/React resolution seam, ignored error, forced peer, native
permission or frozen-input drift. The current app/runtime config was never loaded;
complete current dist, generated types, Node/React condition identity, SWC/PostCSS,
real Next dev/build/start/typegen and neutralSSR→hydration remain final obligations.

Final work also includes second-TS/dual/emitted consumer checks, private-profile versus
ordinary unpatched archive differences, install/native/license/provenance closure,
CI and independent review. Manually check keyboard order/focus, builder Apply/Clear/
Cancel ownership, pagination, optional hide/show, repeated/full-document navigation,
Strict scheduling, unmount during callbacks, two-client independence, request
isolation, and initial-source replacement before any continuation claim. Check
responsive6571 rendering, reduced motion, forced colors and actual AT. No screenshot,
assistive-technology, performance, deployment or source-ready pass waives these.
Stage A itself remains provisional/runtime-unrun. Start/G-04, WP-10/G-02 and the wider
WP-11/release acceptance status are unchanged.
