# WP-10 stage1 worker handoff — 2026-11-24

Candidate implementation and scoped verification only, **not self-approval/G-02**.
The explicit main-approved stage1 plan preceded code. Work used isolated
`/tmp/opencode/tableweave-wp10`, supplied WP-05-based producer tree. No Git command,
install, existing producer/root export/config/manifest/lock/docs/ledger/review edit,
shared/root build, browser server, delegation or optional sortable implementation
was performed. No actual application persistence/authorization was exercised.

## Owned changes

Only these five runtime files were added:

```text
packages/react/src/reordering/types.ts
packages/react/src/reordering/capture.ts
packages/react/src/reordering/rows.ts
packages/react/src/reordering/columns.ts
packages/react/src/reordering/index.ts
```

All other delivery files are under this directory: four unit suites
(`rows.test.ts`, `capture.test.ts`, `columns.test.ts`, `emitted.test.ts`),
`fixtures.ts`, `consumer.ts`, three scoped tsconfigs, `vitest.config.ts`, README and
this evidence. Main owns eventual public exports/discovery and documentation links.

Two explicitly authorized ignored links supply exact existing tools:

- worktree `node_modules` → `/home/mohamed/Desktop/tableweave/node_modules`;
- worktree `packages/react/node_modules` →
  `/home/mohamed/Desktop/tableweave/packages/react/node_modules`.

Configuration runner loading and explicit cache/output paths avoid shared
node_modules build/cache outputs. Emitted files live only in this directory's
`.artifacts/declarations`; Vitest cache lives in `.artifacts/vitest`.

## Exact commands/results

Node **24.22.0**; actual installed TS **6.0.3 / 5.9.3**, Vitest **5.1.1** and
Biome **2.6.8**. Commands ran from the isolated worktree root:

| Command | Final observed result |
| --- | --- |
| `node node_modules/typescript/bin/tsc -p tests/reordering/core/tsconfig.build.json` | Passed pure-source JS/declaration emission; ES2022, no Node/DOM/React types |
| `node node_modules/typescript/bin/tsc -p tests/reordering/core/tsconfig.json` | Passed strict source/test/config checking |
| `node node_modules/typescript/bin/tsc -p tests/reordering/core/tsconfig.consumer.json` | Passed own emitted-declaration positive/negative consumer |
| `node node_modules/typescript-5-9/bin/tsc -p tests/reordering/core/tsconfig.build.json --noEmit` | Passed pure source under TS5.9 |
| `node node_modules/typescript-5-9/bin/tsc -p tests/reordering/core/tsconfig.json` | Passed strict source/test/config checking |
| `node node_modules/typescript-5-9/bin/tsc -p tests/reordering/core/tsconfig.consumer.json` | Passed the same emitted declaration consumer |
| `node node_modules/vitest/vitest.mjs run --config tests/reordering/core/vitest.config.ts --configLoader runner` | **131 tests / four files passed**, final run 2.94s |
| `node node_modules/@biomejs/biome/bin/biome check packages/react/src/reordering tests/reordering/core` | Passed 15 code/config files, no fixes |

An additional isolated Node ESM invocation imported the actual emitted barrel,
began one synthetic move and ran the column helper with throwing global getters
for window/document/localStorage/sessionStorage/fetch: passed. Scanning emitted
JS/declarations found no external package imports. The regular emitted unit suite
also executes the actual generated JS rather than a fake export assertion.

Root `pnpm check`, root packing/builds and documentation reachability were not run.
The new README is deliberately awaiting a main-owned incoming navigation link.

## Coverage and development corrections

- All 16 four-row adjacent-gap placements, no-op/boundary/membership rejection;
  one pending, complete origin-page equality, scope/epoch/source/revision/ABA fences.
- Exact/copy/proxy/foreign/late token rejection, ack before settlement, accepted
  waiting for authority, uncertain cancellation/transport failures retaining lock,
  definitive failure without rollback and explicit superseded acknowledgements.
- Same-origin newer input supersedes but does not unlock pending; owner transition,
  access/unmount invalidation, malformed observations and permanent disposal.
- Own descriptor capture, getters never invoked, sparse/extended/symbol arrays,
  finite cardinality/character budgets, plain/null prototypes, hostile and transparent
  proxy limitations, immutable owned outputs without freezing caller records/input.
- Current-read/observer reentrancy, unsubscribe, throwing/async observers, synchronous
  revocation/disposal during notification/capture, and native Promise rejection
  observation. Ordinary reentrant commands cannot mutate; lifecycle invalidation
  remains available and wins before a begin submission token is returned.
- Actual original controller `columnState` parity: **5,040 full permutations**, 12
  valid accepted seed states, **108 generated proposals** validated against the
  accepted seed's hidden slots/partitions. Mixed utilities, repeated group names,
  hidden IDs, exact permutation and malformed policies/visibility are exercised.
  These vector counts are not counted as additional unit cases.

Initial compiler run caught missing contextual method parameter types; fixed before
the first passing build. Initial unit run had one incorrectly scoped parity setup:
it validated candidate *seed states* against the original state's hidden index.
The accepted controller allows a seed's hidden ID anywhere within its legal
partition, then fixes that seed's hidden indices for subsequent moves. Corrected
the test to validate seeds first, then compare each helper output against its own
accepted prior seed (12 states/108 moves). No controller policy was weakened.
Both declaration compilers also caught a misplaced multiline `@ts-expect-error`;
it was moved to the actual forbidden `persist` property, preserving real rejection.

Further source review hardened empty-token early rejection, non-exposure of private
callback receivers, subscription-time reentrancy, disposal during hostile metadata
capture, stable empty snapshots and native Promise rejection observation. Dedicated
regressions were added. Final 131-test and strict/Biome runs cover those sources.

## Fingerprints

For each set, sort repository-relative paths, SHA-256 each file, concatenate UTF-8
`path + NUL + fileSha256 + newline`, then SHA-256 the concatenation.

- Five new runtime files:
  `f0b483b71de105c8e760be837a0adf64225420fd86f7007cec387e8ebd30569d`
- Sixteen review files: those five plus all direct files in this directory **except
  EVIDENCE.md** (README included, generated `.artifacts` excluded):
  `788a3efdb5faa083c320e7bf5950d226807c770926d14f60b8fb3ae54e11a896`

Individual runtime SHA-256:

| File | SHA-256 |
| --- | --- |
| capture.ts | `69294f3726679212f4a868b302d8c61658dce3100533c0ea53dd5b2eca4cedd5` |
| columns.ts | `e95d740d4b5b5dafa0b9a403d880e7b71d9c277368b62f5f937ee2387435184b` |
| index.ts | `aaf3e386ec1c4dd225c296f4c4e34b5fdcefe4d9b83f7e0c41ed4d9e4674a1b6` |
| rows.ts | `a11f66a6baf8734feda39dd6180ef44c64f8fc1c301e652bedf53a628b707653` |
| types.ts | `ad617d49eac472a7bf66cba13d254e0ce4fe5f6ef380d509863690afb121a8f0` |

## Required next step / limits

Main arranges independent numbered review of this exact candidate and actual API
handoff. No self-approval is offered. The pure stamp port depends on truthful atomic
application commits; it neither validates backend grants nor proves actual WP-08
integration. A transparent Proxy cannot universally be identified; no such security
promise or asynchronous/thenable port support is claimed.

Main still owns real authority binding, pending-navigation interlock, renderer refs/
handle slots and cached collection integration. Optional dnd install/API/DOM behavior,
touch/pointer/keyboard/simple controls, focus, MutationObserver/node identity and
actual packed optional-entry checks remain held. Synthetic metadata/unit/declaration
checks are not G-02, real persistence, SSR/browser/manual-AT/performance/release or
personal maintainer acceptance.
