# Provisional H1 + H2 harness handoff

**AUTHORED / NOT VERIFIED OR APPROVED.** Isolated target:
`/tmp/opencode/tableweave-wp09-generations`, supplied branch `work/wp09-generations`
from `0288904`. No Git command was run to inspect/change that supplied attribution.
Main owns TASKS, frozen install, intake, final API snapshot and final verification.
Authority: the explicit user lease and main
`docs/planning/wp-09-generation-harness-plan.md` in the stacked target.

## Outcome and exact API

One literal harness-only registry in `public-generations.mjs` (+ `.d.mts`):

- `getPublicGeneration(label)` returns a frozen readonly
  `{outputCount, outputSha256}`; own-key lookup rejects unknown/prototype labels.
- `CURRENT_PUBLIC_GENERATION` is **still fc01**. The only entries are original180
  ad59470c… and fc01 180 de82ce…. No WP09/dummy/199 identity was registered.
- `assertGenerationEnvironment(label, env)` only checks consistency; ambient
  generation/hash cannot supply approval data.
- `selectPublicGeneration(argv, env)` returns one frozen parent capture containing
  generation/selection/mode/count/digest. Grammar is
  `[browser|types] [--generation REGISTERED_LABEL]`; defaults to browser + committed
  CURRENT. Rejects surplus/duplicate/unknown flags, missing/unsafe/unknown labels
  and contradictory inherited generation/SHA before evidence writes.

Raw filter helper still defaults to original/flat evidence for compatibility. Its
count/digest now come from the registry. Focus uses the same registry, retains the
toolbar source pin, rejects original/ad594 as corrected runtime evidence and treats
the old PUBLIC_SHA env field only as consistency input. All captured-root formats,
capture scripts, source-only type modes, Vite/Playwright configs and specs are unchanged.

The ordered runner selects once, supplies the same label/SHA (count resolved through
that label) to both namespaces, and owns fresh ordered-UUID paths. Both independent
initial Buffers remain parent-retained; both before and after files must equal those
Buffers after stages. FILE/NAME/DIR are scrubbed and explicitly pinned to each owned
browser report/directory. Existing serial19/4/10 inventories and four-program types
mode remain, with selected identity/count observations in the success report.

`packed-focus-handoff.mjs` exports `packedPublicGeneration`, selected once when its
module loads. The parent packer imports that exact object before packing; focus
uses it throughout and reports its label/count/digest. Parent source/public bytes
are captured before packing, real archive output bytes are compared against the
frozen registered build, and source/output/archive bytes are rechecked before final
success. **Old exact emitted-member allowlists remain unchanged**; no new members
are authorized. Existing declaration/module/profile/consumer/finally guards are kept.
No general tar member-type/link audit is claimed from the existing name allowlist.

## Changed paths (14 implementation/data + this handoff)

New:

- `tests/foundation/public-generations.mjs`
- `tests/foundation/public-generations.d.mts`
- `tests/foundation/public-generations.test.ts`
- `tests/foundation/public-generation-runner.test.ts`
- `tests/foundation/fixtures/public-generations/{original,fc01}.json`
- `tests/foundation/fixtures/public-generations/README.md`
- `tests/foundation/public-generation-handoff.md`

Modified:

- `tests/foundation/public-root-generation.test.ts`
- `tests/foundation/filter-controls-browser.mjs`
- `tests/foundation/packed-consumers.mjs`
- `tests/foundation/packed-focus-handoff.mjs`
- `tests/controls/filter-composition/generation.mjs`
- `tests/controls/filter-composition/verify-public-roots.mjs`
- `tests/controls/focus-handoff/roots.mjs`

No other existing file changed, including TASKS and all105 package source files.
No `.d.mts` focus signature change was needed.

## Authored regression coverage — execution DEFERRED

`public-root-generation.test.ts`: original nine cold/poisoned ignored-history,
changed/missing/renamed/extra, invalid/mismatched selector cases now consume a
committed historical fc01 map, not today's workspace. Copies the registry into the
isolated helper dependency path. Adds original/fc01 cross-replays, same-count new
declaration rejection/caller-hash poison, mixed/shuffled/swapped/nonhex/absolute/
wrong-separator map negatives. Historical files/fixtures are not modified by tests.

`public-generations.test.ts`: canonical fixture integrity and readonly record
mutation refusal; unknown/prototype names; captured current/replay/parser/env
contradictions; selection-only packed module capture test (never calls packing);
**separate actual-workspace CURRENT output guard**. That last guard must fail on
missing/dist-different output; it is neither skipped nor converted to a positive
fixture test. The isolated tree currently has no package dist. This expected open
barrier was **not executed** or represented as a newly observed failing test.

`public-generation-runner.test.ts`: explicitly SYNTHETIC children/root-map I/O,
with real copied registry/capture/verification logic and SHA256. Authors modes and
serial inventory; two independently retained maps; paired source/before/after
rebases per namespace/stage; post-helper before-only/after-only/both replacement;
source-only drift and identical-byte rewrites; inherited FILE/NAME/DIR historical
sentinel and unique runs; wrong/zero/missing stats, skipped/flaky/unexpected,
missing/malformed JSON and failed browser/type child; parser/env pre-write denial;
raw original/flat/duplicate-before/unsafe-run/unknown-focus/missing-corrupt-before;
missing/external Storybook roots and public mismatch before captures/children.
No authored synthetic result is a real browser/compiler/packed pass.

The earlier accepted123-vector/real reporter/private reviews remain historical,
untouched evidence. These new tests do not claim to have rerun them or constitute
a counted replacement pass. Replay the full accepted obligation matrix in final
independent verification, including its genuine reporter and Storybook index guards.
No root fixtures were skipped/forced and no retries/timeouts/locators were changed.

## Actual lightweight checks only

Node `v24.22.0`, installed TS parser `6.0.3`:

- Historical recovery: count180 + canonical sorted JSON/LF SHA verified **before**
  fixture creation; original from preserved original-public.json, fc01 from actual
  frozen delivered WP08 parent dist. No parent build/write. Fixture provenance
  README records exact recovery paths and anchors; fixtures no longer depend on them.
- Final fixture byte-integrity check: both180 maps retain original ad594…/fc01 de82…
  exact aggregates. No current-generation outputs were calculated or approved.
- `node --check`: seven changed/new executable .mjs files and the extracted
  synthetic shim template, all syntax status0. No helper/runner/test was executed.
- TypeScript AST **parse only**: three test files and new declaration, zero parse
  diagnostics. No Program, semantic typecheck, negative compilation or emission.
- Scoped Biome:13 code/declaration/fixture JSON files, final check clean/no fixes.
  Earlier format/import-order findings were corrected only in leased files.
- Before/after scope:735 protected repository files unchanged, all105 package
  sources unchanged, all six compatibility assets unchanged; zero outside-lease
  changes. Excludes `.git`, `.repo`, node_modules and ignored .artifacts, so this is
  not a newly claimed full installed-vendor audit. No package dist directories exist.

Exact lightweight commands/evidence (private, no acceptance authority):

```sh
node /tmp/opencode/wp09-generations-authoring-evidence/light-syntax.mjs
python3 /tmp/opencode/wp09-generations-authoring-evidence/scope-and-fixtures.py
```

The syntax script only invokes `node --check`, TS createSourceFile parsing and
historical fixture byte checks. `light-syntax.json` records all paths/results.
Scoped Biome command is `node_modules/.bin/biome check` with the eleven code/
declaration/test paths above (excluding Markdown) plus the two fixture JSON files.

## Protected/source seals and implementation identity

Private `before.json`, `after.json`, `scope.json` preserve exact path/mode/SHA maps.
Recipe: sorted repository-relative path → `{mode: POSIX permission integer,
sha256: raw-file SHA256}`; Python json.dumps(indent=2), terminal LF. These are
**scope seals**, not public-generation hashes or rebasings of earlier source seals.

| Map | Count | Aggregate SHA256 |
| --- | ---: | --- |
| Before repository inventory |742|4053b4de8de2210f199b550ddd112a8b7273720093215ccf62002de6d1bf9a2e|
| Unchanged protected files |735|ca217536fb85a86c237b5e496ae5de9ffc2ffb5c8ccf10229c9127efa2f673f2|
| Unchanged package sources |105|f4ef4d632587e80bb3b4ae06a76a0af1c28d16ff61672184868f8a86a3a19aa7|
| Unchanged six profile assets |6|4b53198c5b539174f2cf2a633aa8004c8ca6ba99e40429e5bcf8c38f0c307d1f|
| Implementation/data, excluding this handoff |14|9f148364ba5fcb9ef125e9caae8ba1d3ca8113eed198f2e957d8dd57c9fc1436|

Historical275/180 guards, failed reports/workflows and the delivered WP08 tree
were not edited/rebuilt. No current expected output count/digest was registered.

## Final phase — NOT RUN

Main/reviewer owns final command allocation and actual final API/source inventory.
At that phase select the installed commands, including focused authored tests:

```sh
pnpm exec vitest run tests/foundation/public-root-generation.test.ts tests/foundation/public-generations.test.ts tests/foundation/public-generation-runner.test.ts
node tests/foundation/filter-controls-browser.mjs types
node tests/foundation/filter-controls-browser.mjs browser
```

These are future commands, **not run here**. Actual-workspace/current tests and
registered wrappers stay red for missing/unregistered output; do not fake a match.
Main must finish final implementation, freeze source/tooling, build and pack an
unapproved actual candidate outside the registered-only wrappers, obtain independent
source/archive/strict TS6+5.9/negative/runtime/profile/browser review, then deliberately
append a new identity/switch CURRENT/reconcile actual exact archive/public-root lists.
Synthetic current-selector expectations here pin the present fc01 policy; changing
that policy later is an explicit main-owned reviewed integration delta, not a worker
auto-update. Only then run registered gates/default pnpm check and remote verification.

Deferred: every unit/synthetic-vector execution, full type/negative programs, real
reporter/Storybook/browser/production/genuine packed/profile-negative execution,
root CI, SSR/Start, manual/device/accessibility/performance/full AC and WP09–15
remaining gates. No Git/install/build/network/server/browser/agent/PR/merge action
was performed. This handoff is implementation-ready **PROVISIONAL**, not self-approval.
