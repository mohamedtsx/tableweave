# Controls harness portability handoff — 2026-11-24

**Test-only portability layer delivered; columns viewport replay remains blocked.**
This does not change any source approval or claim full WP-08/packed/AT/G-05 approval.
Main owns the unresolved browser triage, integration6483 and final acceptance.

## Scope and protected inputs

Only the five existing controls scopes' configuration/helper files and this new
harness were changed. Two existing READMEs receive pointers only. No producer,
model, core source, fixture app/CSS, assertion, public-type assertion, root/shared
config, exports/styles, package/lockfile, packer, consumer, Storybook config,
TASKS/REVIEW/docs, installation, Git operation or shared build was changed/run.
No delegation. Active integration6483 was neither edited nor served/stopped here.

Before edits, `audit.mjs capture` exclusively created four manifests. Capture uses
`wx` and refuses to overwrite history. Subsequent `audit.mjs` verifies exact bytes:

| Frozen group | Files | Manifest SHA-256 (unchanged before/after) |
| --- | ---: | --- |
| Entire React/HeroUI source trees | 72 | `d79681bd344565897ca414886d95008a1fc8b5b7a83da707c95969e5e544e8c4` |
| Existing shared dist trees | 137 | `c0bc44245f74c1b3ad7a417ce46b4ca9e89ded753b2e250bb3009215660b8c76` |
| Existing scoped fixture apps/CSS/assertions/type assertions | 45 | `0315e4ea00762be78605e3570b90e47f9f3fab04b4862a6b7a390f763a47953d` |
| Historical reviewed SHA manifests | 14 | `0600904534a692fd76ef2b26164135863f89a961b8f619f95c557513f231217f` |

The files are `portability-before.{runtime,dist,fixtures,history}.sha256` alongside
this README. These byte-preservation checks do not relabel any historical review.
Old manifests containing config hashes deliberately describe the **old** harness.
New inputs/hashes are in `portability-layer.sha256`, written by `record.mjs`.
Columns' fingerprint helper now writes a separately named
`.artifacts/source-fingerprints.portability.sha256`, never the historical filename.

## Before failures and resolution

Removed only the three borrowed `vendor-node_modules` symlinks under selection,
columns and collection (each pointed to the primary checkout's Storybook install).
They remain absent. No dependency directory was deleted or installed.

Actual before checks with those links absent:

- `node tests/controls/columns/check-types.mjs`: ENOENT on columns/vendor-node_modules.
- `node tests/controls/selection/check-ssr.mjs`: ENOENT on selection/vendor-node_modules.
- `pnpm exec tsc -p tests/controls/selection/tsconfig.json`: TS2307 for the actual
  HeroUI button import. The old static config pointed through the absent link.
- The original selection unit config passed8; it was not falsely recorded failing.
- Read-only inspection also found primary-checkout absolute paths in pager and
  collection Vite/TS inputs, plus fixed worktree cache/output paths in core.

`resolve.mjs` uses `createRequire` from exact declaring workspace package manifests:

| Inputs | Actual declaring package |
| --- | --- |
| HeroUI React/styles, React/DOM, React Aria/RAC, Tailwind runtime | `packages/heroui/package.json` |
| Tailwind Vite plugin | `apps/storybook/package.json` (its declared dev dependency) |
| TanStack React Table/table-core declarations | `packages/react/package.json` |
| Node/React type data and both TypeScript compilers | root `package.json` dev dependencies |
| esbuild for existing selection SSR helper | root-declared Vite's own resolved dependency |

Resolution first checks the declaring manifest, then resolves through that package.
Real paths outside this checkout reject, so a missing install cannot silently borrow
the primary checkout. For tools such as `@tailwindcss/vite` with private package.json
exports, package metadata is found by walking from **that declared resolved entry**.
No vendor declaration shim, ambient replacement or copied manual is introduced.
Dynamic types use actual installed package `types` exports; the shared static TS
config points to the same real scoped declarations using checkout-relative paths.

Fixture-level Aria root/provider imports use exact aliases to the installed
package's declared **import** exports. Other Aria subpaths retain normal declaring-
package resolution, rather than rewriting an entire namespace into an absolute
directory and potentially bypassing import conditions.

Frozen fixture CSS retains its old vendor-link imports: scoped Vite aliases resolve
those two exact import shapes to declared local Tailwind/HeroUI styles. No fixture
was edited and no vendor link was recreated. Browser source fixtures use automatic
JSX, React deduplication, checkout-only filesystem access, ignored artifact watches
and no HMR. Their 90s deadline provides viewport/axe headroom, not a passed close
race or relaxed assertion. No force click, skip, retry mask or error suppression.

## One source factory registry; separate public boundary

Source configs use **exact** bare aliases for `@tableweave/react`, `/contracts` and
`/filters`. They resolve to the same source modules imported relatively by fixtures,
not the frozen dist registry. `provenance.mjs` proves actual factory and owner-helper
function identity through bare and relative imports in Vite middleware SSR, with no
listener or resource port. `.artifacts/provenance.json` records exact local peer
versions, declaring issuers and resolved paths.

SSR keeps Node's dependency externalization; browser directory aliases must not
inline React's CJS runtime as ESM. An initial provenance-helper attempt did that
and failed `module is not defined`; only the **new helper** was corrected. The
existing selection SSR bundle now also aliases its bare core imports to source.

Own emitted declaration checks retain their source-core/generated-core type
identity as required by the unchanged assertions. They are not genuine package
consumers. No main dist rebuild, tarball replay or emitted integration6483 replay
is claimed; those remain separate main-owned, unaliased boundaries.

## Actual commands/results

Run from the checkout root. Do **not** use `pnpm test`, `pnpm build`, `pnpm check` or
`pack:check` here: they would invoke the forbidden shared build/install workflow.

```sh
pnpm exec vitest run
pnpm exec vitest run --config tests/controls/core/vitest.config.ts
pnpm exec vitest run --config tests/controls/core/native-regressions.vitest.config.ts
pnpm exec vitest run --config tests/controls/core/controller-regressions.vitest.config.ts
pnpm exec vitest run --config tests/controls/selection/vitest.config.ts
pnpm exec vitest run --config tests/controls/columns/vitest.config.ts
pnpm exec vitest run --config tests/controls/pagination/vitest.config.ts
node tests/controls/harness/check-types.mjs
node tests/controls/selection/check-ssr.mjs
node tests/controls/harness/provenance.mjs
node tests/controls/harness/audit.mjs
node tests/controls/harness/record.mjs
node tests/controls/columns/fingerprints.mjs
```

- Root source units: **503/503**, 30 files. Scoped replays, **not additional tests**:
  core164, native24, controller56, selection8, columns30, pager10 (includes actual
  source bare-React SSR). All pass with one source registry.
- `check-types.mjs`: **21 compiler invocations pass**, TS6.0.3/5.9.3. Selection5,
  columns5; core/controller/collection/pager source configs2 each; pager own scoped
  declaration emission1 plus emitted-public NodeNext2. Strict, exact optional and
  `skipLibCheck:false` retained. Only scoped declaration directories were emitted.
- Existing selection SSR/import/privacy checks pass without window/document using
  local Vite's esbuild0.28.2. This is source SSR, not a packed import.

Browser commands actually run (servers owned by each invocation, no reuse):

```sh
pnpm exec playwright test --config tests/controls/core/native.playwright.config.ts
pnpm exec playwright test --config tests/controls/selection/playwright.config.ts
pnpm exec playwright test --config tests/controls/pagination/playwright.config.ts
pnpm exec playwright test --config tests/controls/collection/playwright.config.ts
pnpm exec playwright test --config tests/controls/collection/legacy.playwright.config.ts
pnpm exec playwright test --config tests/controls/columns/playwright.config.ts
```

| Replay | Port | Actual result |
| --- | ---: | --- |
| Core native | 6445 | **7/7 pass** |
| Selection | 6463 | **29/29 pass** |
| Pager | 6465 | **62/62 pass**, classification below |
| Guarded collection | 6469 | **27/27 pass** |
| Prior collection regressions (sequential on6469) | 6469 | **21/21 pass** |
| Columns full 90s run | 6467 | **15 pass / 2 fail** (dark and RTL viewport loops) |
| Columns follow-up `--grep contained` | 6467 | **0 pass / 3 fail** (same inert-trigger symptom) |
| Final exact-ESM columns `--grep-invert contained` | 6467 | **14/14 pass**, explicitly only the non-matrix subset |
| Final isolated `--grep 'light: contained'` diagnostic | 6467 | **1/1 pass**; does not erase repeated loop failures |

The five other browser replays total146 active cases, **not** an all-browser pass.
The earlier initial columns 30s run was14 pass/1 timeout/2 not run; more headroom
did not resolve the underlying inert-trigger behavior. No failed run is relabeled.
Both broad-namespace and narrowed exact-ESM matrix replays produced0 passes/3
failures; the later isolated light pass shows this is intermittent, not proof of a
fix. The recorded negative and positive subset runs are not an all17 pass claim.

Pager classification was verified with existing `--list` regexes, not inferred
from a green aggregate: **54 supported synchronous/guard/UI checks**, **5 defensive
best-effort/unsupported metadata checks**, **3 named LIMITATION characterizations**.
The three LIMITATION passes assert the original synthetic host rejection and
no-getter/no-clamp facts; they are **not universal rejection containment**.

```sh
pnpm exec playwright test --config tests/controls/pagination/playwright.config.ts --list --grep 'LIMITATION:'
pnpm exec playwright test --config tests/controls/pagination/playwright.config.ts --list --grep 'DEFENSIVE:|review fail closed: (async-port|then-accessor)'
pnpm exec playwright test --config tests/controls/pagination/playwright.config.ts --list --grep-invert 'LIMITATION:|DEFENSIVE:|review fail closed: (async-port|then-accessor)'
```

## Remaining blocker: columns Escape / resize replay

The unchanged viewport loop at `columns/columns.spec.ts:329` sometimes reaches the
next click with Sort already `aria-expanded=true`, `data-pressed=true`, and inert.
The trace shows Escape followed by viewport resize then a trigger click that stays
blocked; one light replay gets through320/390/768 and stalls at1024. This repeats
with HMR disabled and90s headroom, not just under parallel CPU load.

Failure traces are separately archived under
`harness/.artifacts/columns-inert-before/` and
`harness/.artifacts/columns-inert-namespace-alias/`. The final isolated diagnostic
used `--output tests/controls/harness/.artifacts/columns-final-esm`; it passed and
does not contain a failing trace. Normal runner output directories are mutable,
so use the archived failures rather than assuming the last run retained them.
Main must distinguish fixture close
synchronization from producer/vendor behavior before approving this replay.
Changing frozen fixture sequencing, producer behavior or assertions is outside
this allocation; none was changed to manufacture green. No broader approval follows.

## Changed paths and new fingerprint layer

- Existing Vite configs: core/native, selection, pagination, columns, collection.
- Existing Vitest configs: core main/native/controller, selection, columns; pager
  continues composing its own Vite config.
- Existing Playwright configs: core/native, selection, pagination, columns,
  collection main/legacy (core's former fixed6437 becomes allocated6445).
- Existing TS configs: core, selection, pagination source/public, collection.
- Existing helpers: selection check-types/check-ssr; columns check-types/fingerprints.
- New shared helpers/config/types: this directory's audit, resolver, provenance,
  compiler runner, recording script and source TS config. `resolve.d.mts` describes
  only our helper exports, not vendor components.
- Existing selection/columns README changes are pointers only. Historical source
  manifests are untouched; the new manifest also records inherited config inputs.

## Final fingerprints and cleanup

`portability-layer.sha256` records **36** new/current harness inputs. Its SHA-256:

```text
ec1ca8a71ce5f9f5f9a635bb2bafb6c254dd58db1695c55058be01aef261d420
```

The separately named columns portability manifest has61 entries and SHA-256
`604deee87da70d292e43088a324a3f285488e3e3f586e5d8b9ea4cf4cfcac5e3`.
It includes deliberate config/helper changes; it is not a new producer approval.
All four frozen-group hashes in the first table still match the captured inputs.

Final scoped Biome check: **36 files pass, no fixes pending**. Scoped
`git diff --check` passes. Listener inspection shows no remaining owned6445/
6463/6465/6467/6469 server; no command managed the separately allocated6483 server.
No borrowed vendor symlinks remain. The only unresolved verification is the
intermittent columns viewport-loop replay described above; main owns its triage.
