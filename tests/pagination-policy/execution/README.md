# Server-safe execution descriptor prerequisite

**Review-ready source, not independent approval or integrated unpaged support.**

Authorization: `docs/planning/wp-09-execution-descriptor-plan.md`, TASK-017. Only
new `packages/react/src/contracts/execution.ts` and this new test folder were
written. The independently approved four-contract prerequisite and all its test/
README input bytes remain at aggregate
`36676cb883cda5276a2a63194988bacd89d38981ff49e16b8690daf8d1111086`.

No existing exports/indexes, source/helpers, tests, root config/manifests/lock,
documentation/ledger, vendor or Git state was edited. No install, shared build,
server, additional agent or external call was performed. Installed dependencies
are resolved through this target's actual declaring packages; their preexisting
shared-store links are disclosed, not represented as a fresh isolated install.

## Exact new module-only API

```ts
type QueryExecutionExtent =
  | { readonly kind: 'page'; readonly pageIndex: number; readonly pageSize: number }
  | { readonly kind: 'complete' };

interface QueryExecution<S extends QuerySchema> {
  readonly version: 1;
  readonly query: QueryFor<S>;
  readonly filter: FilterPlan;
  readonly extent: QueryExecutionExtent;
  readonly evaluatedAt: number;
  readonly queryIdentity: string;
}

compileQueryExecution<S extends QuerySchema>(
  registeredSchema: S,
  input: unknown,
  options: CompileOptions,
): QueryExecution<S>;
```

These exports exist **only in the new source module**. Root/contracts indexes and
public package discovery remain untouched and main-owned; no deep public-package
import or new published entry is claimed.

- Capture the plain/null-prototype options envelope via own data descriptors once,
  before query/custom work. Only own enumerable now/optional registry are allowed;
  extra/hidden/symbol/accessor/undefined data and unsupported envelope prototypes
  reject with existing `query.context`. now must be finite and Date-valid; function
  clock providers are never invoked. Exact supplied fractional/zero/negative values
  are retained when valid. No Date.now, scheduler, default clock or global override.
- Retain the actual trusted registry reference, including host-object prototype/
  receiver identity. Do not clone/freeze/recursively inspect that app object or
  treat factory provenance as backend authorization. Explicit null/primitive
  registry options reject early; registry behavior remains the trusted app's port.
  Only the new private options copy is shallow-frozen.
- Normalize/clone the **original wire query once** through normalizeQuery. Then
  call actual compileFilter/getQueryIdentity on that normalized query, using the
  same captured options. Those existing helpers revalidate; pure/idempotent custom
  normalizers may run repeatedly. No exact-one/max callback count is promised.
- Derive extent solely from registeredSchema.pagination.enabled. Enabled/omitted
  copies the validated index/size into page. False returns **only** `{kind:'complete'}`:
  no offset/limit/pageIndex/pageSize is present in that extent. The wire query still
  retains its canonical dormant pair, which is not a complete-result row limit.
- Return new deeply frozen JSON metadata on every call, without registry, records,
  methods, controller/native/resource refs, transport or accepted-state storage.
  Query preserves normalized ordered sorting, locale/timezone and real schema
  version; FilterPlan remains filtering only. evaluatedAt is captured sanctioned
  now, not receivedAt, request completion or a new Retry-time evaluation.

The app must choose the authoritative server schema/registry and authorize actors,
fields and records independently; a client cannot choose an alternative registered
schema to obtain complete execution. Complete-result proof, workload limits,
parameterized backend sorting/filter translation and deterministic ID tie-breaks
are application responsibilities. The helper does not execute a backend query.

Existing translateQuery is unchanged and still translates **filters only**. The
synthetic test translator receives descriptor.query/evaluatedAt plus the same
trusted registry; sorting and extent remain separate backend responsibilities.
Captured-time custom parity is preserved within one execution. The existing custom
temporal identity/tick limitation is unchanged; no hidden clock migration occurs.

## Actually completed proof

| Boundary | Result |
| --- | --- |
| New execution tests | **81/81** pass |
| Unchanged approved policy tests | **56/56** pass |
| Unchanged existing contract/controller tests | **211/211** pass |
| Combined actual source run | **348 tests,12 files**, zero failures/skips/todos |
| Strict TS6.0.3/5.9.3 | Source, own-emitted declarations and authored unit fixtures pass; skipLibCheck=false |
| Meaningful negative diagnostics | **13 lines per compiler/mode**,52 total; TS2322/2339/2345/2353/2379/2540, not missing modules or unused annotations |
| Own declaration emission | Both compilers emit below this folder only; no shared package build |
| Server-safe graph | **11 source modules = approved unchanged10 + execution.ts**, identical preexisting edges/external dependencies |
| Bare Node source-derived import | Pass, no window/document globals; no React/UI/controller/native/resource dependency added |
| Full Biome | New module and own supported files pass,9 files |
| Original protected bytes | **177/177 unchanged**, including approved prerequisite14 inputs and excluded source/tests/config/manifest/lock |

The81 new tests cover default/custom paged metadata and literal old identity bytes,
complete extent exact keys/dormant pair, every nested output frozen, caller input/
array/options/registry nonmutation, options own-data capture, invalid envelopes,
getters/prototypes/hidden/symbol/proxy failures, zero custom calls before invalid
options or forbidden pairs, original wire cloning before reentrant registry work,
client plan/policy injection, existing safe errors, real date-only/relative/DST/
rolling semantics at two explicit times, and valid idempotent custom normalization.

Source descriptors/read traps are tested precisely: ordinary input getters are
not executed and own descriptors are captured once. Proxy reflection traps can
execute; this is **not** a universal ban on proxies or every possible trap effect.
The reentrant registry test deliberately mutates caller-owned input/options itself
and proves those later values cannot relabel the already captured execution.
Ordinary nonmutation tests contain no such application-induced mutation.

Independent compileFilter/getQueryIdentity results at descriptor.evaluatedAt equal
the descriptor results. Real createFilterEvaluator and translateQuery use identical
evaluation and produce matching synthetic record IDs. This is an in-memory,
allowlisted predicate target—not SQL/database/backend completeness/auth proof.
The valid custom Math.round normalizer remains pure, JSON-safe/idempotent; repeated
validation is observed rather than suppressed. A deliberately invalid non-idempotent
normalizer is rejected by the existing rule.value contract, not treated as valid
drift requiring a change to protected helpers.

Source/internal declaration checks use existing server Node types for Valibot's
Blob/File declarations, without a DOM lib. Own-emitted declaration consumers need
**neither Node nor DOM types**. Field ownership, numeric/custom operands, sorting,
date presets, generic QueryExecution<S>, readonly metadata and extent narrowing
remain checked. Initial fixture-only type issues (widened rolling length and array
closure narrowing) were fixed in new tests; no protected producer/type was changed.

## Concurrent inventory exception — not silently rebased

The broad strict inventory guard initially passed, then correctly reported additions
under the **separately main-allocated** publication namespace. TASKS:802–809 grants
that worker only new controller/criteria-publication.ts and tests/criteria-publication/**.
None of those additions was written, modified, deleted, imported or reverted here.

- `.artifacts/protected-before.json` remains the original177-file map.
- `.artifacts/pre-concurrent-guard.json` preserves the earlier successful inventory
  capture with its then-current source hash; it is not relabeled final-source proof.
- `.artifacts/strict-inventory.log` preserves the later **failed full-inventory**
  comparison. No final whole-worktree inventory pass is claimed.
- `record-inventory.mjs` separately verifies every original protected byte, fails
  for any original change/removal, and records added paths/hashes with
  `fullInventoryUnchanged:false`, `baselineRebased:false` in inventory-delta.json.
  Those snapshots can include still-growing foreign files; they are observations,
  not a promise to freeze another worker's namespace.

The original177 bytes and approved four-file/test/README aggregate are unchanged.
Main can reconcile the authorized concurrent additions independently; they do not
alter the pure import graph or the source inputs used by this helper's checks.

## Exact commands and evidence

Cwd: `/tmp/opencode/tableweave-wp09`. Initial capture ran before the new module:

```sh
node tests/pagination-policy/execution/guard.mjs --before
```

Final executed source/type/import checks (fresh safe labels avoid old run logs):

```sh
EXECUTION_RUN=handoff-units NODE_DISABLE_COMPILE_CACHE=1 node node_modules/vitest/vitest.mjs run --config tests/pagination-policy/execution/vitest.config.mjs --configLoader native
EXECUTION_TYPES_RUN=handoff-types NODE_DISABLE_COMPILE_CACHE=1 node tests/pagination-policy/execution/check-types.mjs
NODE_DISABLE_COMPILE_CACHE=1 node tests/pagination-policy/execution/server-safe.mjs
node node_modules/@biomejs/biome/bin/biome check packages/react/src/contracts/execution.ts tests/pagination-policy/execution
node tests/pagination-policy/execution/record-inventory.mjs
sha256sum --quiet -c tests/pagination-policy/execution/.artifacts/SHA256SUMS
```

The strict additional command `node tests/pagination-policy/execution/guard.mjs
--after` was also executed and is intentionally recorded as nonzero for the
concurrent additions above, not silently replaced by a passing rebased capture.
Do not repeat --before over the existing baseline.

Final evidence is under this folder's `.artifacts/`: `handoff-units.log`,
`handoff-units/vitest.json`, `handoff-types.log`, `handoff-types/results.json` and
each compiler's meaningful negative/positive/unit logs; `server-safe/graph.json`
and `bare-import.log`; `biome.log`, `inventory-delta.json`, `handoff.json` and
`SHA256SUMS`. Caches/emits/reports stay in this folder. No root script, package
dist, private candidate or other-root library runtime is substituted.

New module SHA256:

```text
c4e2bf93218b82eb36e85f62fa260e678de776835f04787c32b1a9139e0b9d51
```

Main owns independent review and later exports/discovery/fresh stack integration.
No genuine archive, real backend, complete-resource success/provenance, native
unpaged rows, facade, React/SSR lifecycle, full AC/browser/AT/performance or release
acceptance follows from this standalone metadata prerequisite.
