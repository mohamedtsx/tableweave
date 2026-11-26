# WP-09 U1 — disabled pagination command guards

**Review-ready source; main's independent review is required before U2.**
Authorization: `docs/planning/wp-09-controller-guards-plan.md`, activated at TASKS:33–40.
Only `packages/react/src/controller/{store,reducer}.ts` and this new folder were
written, in `/tmp/opencode/tableweave-wp09-stacked`, starting at
`cb1c729869ae8cb4f71ad8832efd4288a879feaf`. The old WP-09 target is untouched.
TASK-017 / FR-12, D-10/D-24; a prerequisite toward AC-24/25/26, not complete acceptance.

## Exact producer change

- At the start of existing private validateIntent, inspect the own type descriptor
  of the **already captured immutable command**. False pagination policy rejects
  pagination.change/clamp with existing `state.capability` before private
  validateCommand, clock, reducer, updater, state validation or notifications.
- Both pure reducer cases guard false before payload/updater/equality/stale-clamp
  handling. Definition identity and revision checks still precede the switch.
- Dispatch still enters mutate and captures the complete original command first.
  Disposed/reentrant and malformed capture diagnostics keep priority. Accept still
  checks its exact pending proposal/base revision before validating the retained
  original captured intent. No reread of original caller input was added.
- Enabled/omitted/true semantics, callbacks and errors stay unchanged. No public
  type, command, helper, export, schema, query/filter, clock or async policy changed.
- query.replace is untouched: original candidate normalization precedes reset and
  equality. A functional updater necessarily runs once to expose that candidate;
  private command validation/clock may precede it. **No zero-all-callback promise**
  is made for query.replace.

The final full-rule formatted diff is **13 added physical lines**,9 store +4 reducer,
zero replacements/deletions. The earlier10-line statement described the pre-format
layout; formatting expands the descriptor read. Removing only these insertions
reconstructs both exact starting hashes, including every original query.replace,
capture, receipt, clock and validation line. See `.artifacts/source-delta.json`/patch.

| Source | Before SHA256 | After SHA256 |
| --- | --- | --- |
| store.ts | `92a00f9272b98ca940b67b12e7eed08bd49c0ae83c3db12c5a1551e7ecd198a7` | `089206a462fa68c8f544658446372efbb22779361249e63bb213efa41d97cd12` |
| reducer.ts | `c5a1e3fb25a543d8d501dfed9cea9d200c73277b6af3db20aa552eb42d945774` | `fc6a10034a543af520a24bb2a1e2d6fbc66422f72ebf6680b0fd409ff58259aa` |

## Prechange proof, sealed BEFORE producer edits

The two starting hashes and HEAD were checked first. All105 tracked runtime source
paths/modes/bytes replay the common Python-compatible source-map recipe from
`docs/evidence/wp-09-combined-baseline-2026-11-24.md`:

```text
b9a3e8ee7deeac595ddc168c3ea7e23bef83c4425b96f455a68ef8156cf725b5
```

Before implementation, one passing regression captured **24 actual paged cases**:
omitted/true × uncontrolled/controlled × same-value/function-previous/index/size/
clamp0/stale-clamp. Each records literal schema/definition/query/filter/query-identity
strings (including shared duplicates), status/snapshot reference behavior, real
callback ordering and all counters. These expectations were not generated from the
updated producer. The final test compares the complete24-case object, not just count.

The actual disabled tests then ran **18/18 FAILED** on the original sources: six
cases in each of dispatch, controlled dispatch and pure reducer. The failure was
missing state.capability; stale clamp instead returned state.stale. Counters expose
command validation/clock and functional updater work formerly reached. These are
preserved **failed tests**, not a generic "expected failure passed" relabeling:
`.artifacts/before-disabled.log`, its Vitest JSON and denials.json. All counters reset
after actual construction; no constructor calls are miscounted as guard failures.

Before edits, `prechange-seal.json` sealed the paged capture, original source copies,
raw passing/failing logs/reports, original probe fixture copies, protected maps and
13-module server graph/bundle. Do not regenerate any historical seal or rerun before
capture against updated source; before-only tools check the original hashes.

The original raw JSON is now archived at `.artifacts/paged-baselines.json`, SHA
`1d9649b899e3b2178cdec61223b30108d93e777af613a4ee7c373c40f1fe8cae`.
The original seal's historical `paged-baselines.json` key/digest remain unchanged;
guard explicitly resolves that one archived location. Durable root
`paged-baselines.json` is a formatter-compatible clone made **only from that sealed
capture**, never updated source. Guard compares both parsed objects exactly, so all
literal strings/order/counters stay original. This keeps permanent unit data outside
ignored artifacts without reformatting/rebasing the original capture.

## Final executed results

| Boundary | Result |
| --- | --- |
| New U1 tests | **51 pass**:18 denial +32 regressions +1 complete paged replay |
| Unchanged actual contracts/controller | **211 pass** |
| Unchanged approved policy tests | **56 pass** |
| Unchanged final-WP08 private-command tests | **27 pass** |
| Combined scoped run | **345 passed,15 files**, no failed/skipped/todo cases |
| Strict TypeScript6.0.3/5.9.3 | Source, own emitted declarations, authored fixtures pass; skipLibCheck=false |
| Meaningful negatives | **14 lines ×2 compilers ×2 modes =56**; actual TS2322/2540, not unresolved imports/unused directives |
| Own emission | **17 declarations/compiler**, emitted only beneath this folder |
| Pure source import graph | **13 modules**, original edges/external imports unchanged |
| Bare Node source-derived bundle | Before/after pass, window/document absent; no React/native/resource/UI runtime |
| Full Biome | Both producers + entire own supported code/data pass, **13 files**; no fixes/suppressions |
| Protected runtime sources | **103/103 unchanged**, all105 except the two allocated producers |
| Other existing inputs | **456/456 unchanged** tests/artifacts/root/package configs/manifests/lock |
| Original prechange seal | All hashes unchanged, including failed reports and original raw golden |

The18 formerly red cases now all pass with zero command/state validators, clock,
updater, request, commit, query-change and subscriber callbacks and exact accepted
snapshot preservation. Other tests cover capture getter/hidden/cycle priority and
zero getter execution; supported proxy descriptors captured once (reflection traps
can execute); disposed/reentrant/definition/revision/current-receipt precedence;
actual pending query receipt accept/reject after denied paging; retained original
intent despite caller mutation; callback rejection and explicit acceptance retry;
throwing private validator/clock never reached on false policy; canonical atomic
replacement and original noncanonical pair rejection before resets; valid idempotent
custom normalization only after policy admission; explicit relative ticks and stale
controlled relative acceptance; and isolated same-version policy replacement failure,
failed new-version initialization preserving old lifetime, and valid replacement.

The direct reducer guarantees guard-before-payload for these two cases, **not**
universal original-input capture/getter protection. Store's existing supported capture
semantics are retained, not extended to ban all proxies. Definition replacement
tests use actual plain controllers; no native registration/provenance is inferred.

Type fixtures retain field ownership, numeric/enum/custom operands, custom IDs,
date presets, sort allowlists, readonly captured state and pagination/sorting/query
functional-updater inference. Actual generated negative diagnostics are analyzed;
there are no declaration stubs or weakened library checks. Source/internal programs
use existing Node types for Valibot Blob/File declarations without DOM. Own emitted
declaration consumers use **neither Node nor DOM types**. Own JS tooling is ordinary
JS (checkJs=false in fixture programs), not a stub for library declarations.

## Exact commands / source boundary

Cwd `/tmp/opencode/tableweave-wp09-stacked`. Initial commands actually executed:

```sh
node tests/pagination-policy/controller/guard.mjs --before
U1_RUN=before-paged NODE_DISABLE_COMPILE_CACHE=1 node node_modules/vitest/vitest.mjs run --configLoader native --config tests/pagination-policy/controller/vitest.config.mjs
U1_RUN=before-disabled NODE_DISABLE_COMPILE_CACHE=1 node node_modules/vitest/vitest.mjs run --configLoader native --config tests/pagination-policy/controller/vitest.config.mjs
NODE_DISABLE_COMPILE_CACHE=1 node tests/pagination-policy/controller/server-safe.mjs before
node tests/pagination-policy/controller/seal-prechange.mjs
```

The disabled command exited nonzero with18 failed tests, deliberately preserved.
These before-only commands must **not** be rerun/rebased on this delivery. Final:

```sh
U1_RUN=delivery-units NODE_DISABLE_COMPILE_CACHE=1 node node_modules/vitest/vitest.mjs run --configLoader native --config tests/pagination-policy/controller/vitest.config.mjs
U1_TYPES_RUN=delivery-types NODE_DISABLE_COMPILE_CACHE=1 node tests/pagination-policy/controller/check-types.mjs
NODE_DISABLE_COMPILE_CACHE=1 node tests/pagination-policy/controller/server-safe.mjs after
node node_modules/@biomejs/biome/bin/biome check packages/react/src/controller/store.ts packages/react/src/controller/reducer.ts tests/pagination-policy/controller
node tests/pagination-policy/controller/guard.mjs --after
sha256sum --quiet -c tests/pagination-policy/controller/.artifacts/SHA256SUMS
```

Final logs/reports are the matching `.artifacts/delivery-*` files/directories,
`graph-after.json`, `server-after.log`, `biome.log`, `delivery-protected.log`,
`protected-after.json`, `source-delta.json`, `handoff.json` and `SHA256SUMS`.
The handoff records exact input list/aggregate, tool versions/physical paths and
all input/output fingerprints. It is not an emitted-generation whitelist.

The own unit config uses minimal exact current-target source aliases for the three
@tableweave/react entries, matching the actual combined root config's single-factory
registry approach. Actual installed declaring-package React/date dependencies are
resolved read-only; workspace dist imports are rejected. This is actual source
testing, **not** a new archive/genuine packed-consumer or dependency-install claim.
Pure server graph/bundle is separately limited to the controller/contracts/filter
graph; its external dependencies resolve from actual declaring-package paths.

## Failure history and remaining fence

An initial source-map serialization used locale sorting, not Python key ordering;
the guard rejected507fe7… before any source edit. The actual105 bytes matched, and
the corrected ASCII/Python-compatible recipe verified b9a3e8ee… before sealing.
Full Biome identified formatting/import changes and a missing terminal LF in the
raw capture. Rather than rebase it, the raw preimage was archived and a durable
formatted clone produced from it. The patch archival move appended one LF; guard
detected it. Only that LF was removed **after verifying the resulting preimage hash
equals the existing seal**; archive-restoration.json records this, with no digest
change. Full prechange guards now pass. Formatter movement also displaced five type
negative directives; they were relocated to actual error lines. Final strict checks
pass without unresolved-module allowances or extra producer modifications.

All existing source/test/config/index/export/native/resource/tool/details/criteria/
publication/execution files and historical source guards are preserved. No install,
shared build/root emission, browser/server, agents, vendor/.repo change, Git write,
commit/PR/merge or root-generation constant edit occurred. Main alone may update
docs/TASKS; no whole-repository/documentation identity claim is made.

Main's recorded default-root status remains **650 passed/2 FAILED**, the unchanged
180-output tests seeing199 combined outputs. This scoped run neither reran nor
fixed those generation gates; no full pnpm check pass/skip waiver is claimed.
Native/server unslicing, completeness/resource binding, renderer/static/unknown
pager safety, tools/facade, exports/integration, SSR/browser/manual/performance,
genuine packing/full AC and packet/release acceptance remain separate. Main reviews
this exact two-file delivery independently before allocating U2.
