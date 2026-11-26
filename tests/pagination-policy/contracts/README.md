# Pure pagination-policy contract prerequisite

**Review-ready implementation, not independent acceptance or a usable unpaged table.**

Authorization: `docs/planning/wp-09-pagination-contracts-plan.md` and TASK-017.
Only `packages/react/src/contracts/{types,schema,query,identity}.ts` and this new
folder were edited. No root export, discovery/config/manifest/lock, existing test,
controller/native/resource/presentation/filter helper, details, criteria or WP-08
file was changed. No install, shared build, server, Git or additional agent.

## Exact implemented boundary

- Definition input accepts `pagination.enabled?:boolean`. Normalized schema has
  `enabled?:false`: omission and true physically omit the member, false survives.
  Existing strict JSON cloning, prototype/accessor/unknown/undefined rejection,
  freeze and numeric/default/sizes/maxPageRows validation are unchanged.
- Wire v1 retains its required pair. Disabled accepts only index0/configured
  defaultSize; createQuery supplies it on omission. Other otherwise valid pairs
  fail existing `query.invalid` before custom rule validation/normalization.
  Existing malformed/context/version/bounds diagnostic precedence is retained.
- Paged schema/controller/query/filter identity bytes remain identical to literal
  **pre-edit** observations. Only disabled query identity gains
  `paginationEnabled:false`; filter identity, schema version and clock semantics
  remain unchanged. No timestamp, new error type or wire version.
- Existing real `replaceTableDefinition` rejects same-ID/version false/omitted
  swaps and treats omitted/true as identical; it validates a versioned replacement
  seed before disposing its old owner. The controller itself was not edited.

**Current native processing still pages.** This stage does not implement native
unpaged rows, whole-query execution, complete-server provenance, a facade or shell.
It does not claim disabled pagination command/no-op denial before functional
updaters/private state validators; those require a future shared-controller/native
allocation. No custom temporal refresh, default clock or parity waiver is added.

## Before-change baseline, never rebased

The initial four SHA256s matched the approved plan before any source edit. A real
source-factory capture then recorded two representative default/custom-size cases:
neutral/active wire queries and filter/query identities, canonical schema and real
controller fingerprints. Active criteria include builder, trimmed search, tabs,
sorting and symbolic relative date at an explicit fixed clock.

`baselines.json` contains16 **literal** byte strings plus the four original source
hashes. It was compared to the actual captured JSON and sealed while all four
source hashes still matched. Its immutable SHA256 is:

```text
91b22d1271073745c57c79a93e278203ee1b1df1635722310a8a9f0c02109e9e
```

`.artifacts/pre-change/` preserves original hashes, captured observations, the
one-case pre-change execution, protected-input map and golden hash. The capture
test is excluded from normal runs, requires original hashes and uses exclusive
file creation: **do not recapture/rebase it after the implementation**. A guard
checks the sealed literal file rather than deriving expectations from new code.

## Actually completed checks

| Boundary | Result |
| --- | --- |
| New source units | **56/56** pass |
| Unchanged affected existing contracts | **155/155** pass |
| Unchanged affected existing controller | **56/56** pass |
| Combined source run | **267 tests,11 files**, zero failures/skips/todos |
| Strict source and own-emitted API types | TS6.0.3 and5.9.3 pass; full programs, skipLibCheck=false |
| Meaningful type rejection | **10 offending lines per compiler/mode**,40 total; TS2322/2375/2540, not missing imports or unused annotations |
| Own authored unit fixture types | Both compilers pass |
| Own declarations/JS | Both compilers emit only beneath this folder's `.artifacts/` |
| Server-safe graph and bare Node import | Original/updated **10 source modules**, identical edges/external imports; no added React/UI/controller/native/resource/presentation dependency |
| Full Biome | All four producer files and own supported files pass,13 files |
| Protected inputs | **163 files** byte-identical, including existing source/tests/indexes, controller/native/resource, details, criteria, manifests/config/lock |

The56 own tests cover literal paged compatibility for omitted/true, false dormant
defaults/custom sizes and query-only identity tags, otherwise valid navigation,
16 malformed/bounds cases, diagnostic ordering, invalid bool/container/unknown
inputs, getters/prototypes/hidden/symbol/null-prototype data, nonmutation/freeze,
unchanged numeric schema constraints, zero custom callbacks on all denied public
query-helper paths and real plain-controller definition replacement. No native
command guard is inferred from those schema/query tests.

Source compilation uses existing server Node types (as the package build does),
because Valibot's declarations refer to Blob/File; it uses no DOM library. The
own-emitted declaration consumer uses **neither DOM nor Node types**. Literal
field/owner/numeric/enum/sort/date/custom operand inference remains checked.
Generated unannotated negative fixtures must fail on10 distinct lines in each
compiler/mode; a positive run also verifies all annotated errors are meaningful.

The private source bundle externalizes the actual installed Valibot/date packages
resolved from this target's declaring package. This checkout's installed dependency
links point into the preexisting shared local install store; that is recorded,
not disguised as a fresh consumer-local install. No other root's library source,
root dist, package runtime or private candidate was copied/imported as a fallback.
This is **source/own-emission evidence**, not an actual public-root rebuild,
genuine-tarball or consumer confinement proof. Original dependencies remain; there
is no claim of zero original imports.

## Exact commands

All commands below use cwd `/tmp/opencode/tableweave-wp09`. No shared pnpm scripts
are run because they rebuild excluded package outputs.

Completed **before edits**, preserved and not repeatable on this generation:

```sh
node tests/pagination-policy/contracts/guard.mjs --before
PAGINATION_CAPTURE=1 PAGINATION_CONTRACTS_RUN=pre-change NODE_DISABLE_COMPILE_CACHE=1 node node_modules/vitest/vitest.mjs run --config tests/pagination-policy/contracts/vitest.config.mjs --configLoader native
NODE_DISABLE_COMPILE_CACHE=1 node tests/pagination-policy/contracts/server-safe.mjs --before
```

The captured JSON was copied as literal `baselines.json` via patch, equality-checked
against `.artifacts/pre-change/observed.json` while original hashes still matched,
and its SHA256 sealed in `.artifacts/pre-change/baselines.sha256` before edits.

Final executed verification (use fresh safe run labels for future review logs):

```sh
PAGINATION_CONTRACTS_RUN=final-units NODE_DISABLE_COMPILE_CACHE=1 node node_modules/vitest/vitest.mjs run --config tests/pagination-policy/contracts/vitest.config.mjs --configLoader native
PAGINATION_TYPES_RUN=final-types-2 NODE_DISABLE_COMPILE_CACHE=1 node tests/pagination-policy/contracts/check-types.mjs
NODE_DISABLE_COMPILE_CACHE=1 node tests/pagination-policy/contracts/server-safe.mjs --after
node node_modules/@biomejs/biome/bin/biome check packages/react/src/contracts/types.ts packages/react/src/contracts/schema.ts packages/react/src/contracts/query.ts packages/react/src/contracts/identity.ts tests/pagination-policy/contracts
node tests/pagination-policy/contracts/guard.mjs --after
sha256sum -c tests/pagination-policy/contracts/.artifacts/SHA256SUMS
```

Final logs/results:

- `.artifacts/final-unit-run.log`, `final-units/vitest.json`, source transform list.
- `.artifacts/final-type-run-2.log`, `final-types-2/results.json` and every compiler's
  own emit/positive/negative/unit log and generated strict config.
- `.artifacts/server-safe-before/graph.json`, `server-safe-after/graph.json`,
  corresponding bare-import logs, `final-server-safe.log`.
- `.artifacts/biome.log`, `outputs.json`, `handoff.json` and `SHA256SUMS`.

Earlier preparation logs are retained: an initial no-Node source declaration
configuration exposed Valibot's existing Blob/File type requirements; it was fixed
using the package's existing Node type context, never skipLibCheck/stubs. Biome
formatting moved some property-level type diagnostics beyond annotations; negative
fixtures were rewritten as typed assignments from literal seeds and then rechecked
under both compilers. Those harness-only preparation failures are not producer
failures or substituted positive evidence. The golden bytes were never changed.

## Four producer output hashes

| File under `packages/react/src/contracts/` | SHA256 |
| --- | --- |
| types.ts | `b92b476ffa10592a2b4d24e6fd7ae89653ac84b5177841038555df117b5e3713` |
| schema.ts | `74ae6897bd6967b95505341fd086ff487c696a77fcffd8186cdf0b3212ab2d57` |
| query.ts | `ddf2d78ef4870ab9c94dc2905e144e39e9745b63d0d7aa00de2f45c557b49cf6` |
| identity.ts | `b767bba97682599f990ede2a6f981fe6cd1f1fc1c28ef14aeefba964ba770f3d` |

The own input/output fingerprint manifest is `.artifacts/SHA256SUMS`; the protected
map is `.artifacts/pre-change/protected.json`. Main owns independent review,
discovery/exports/shared build/integration, later controller/native/resource policy
work and packet approval. No browser/SSR/real backend/full AC-24/25/26, complete
result, release or personal maintainer acceptance is inferred from this prerequisite.
