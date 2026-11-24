# WP-08 n7/n8 correction candidate — independent re-review required

Target: `/tmp/opencode/tableweave-wp08`. No API/UI expansion, Git, installs, root
builds, resource/bootstrap/hook changes or files outside assigned paths.
This correction changes only `presentation/project.ts`, its owned README, and
`tests/controls/core` evidence/regressions. Command/native configuration, atomic
binding and event-origin implementations from n1–n6 remain unchanged; the projection
correction preserves actual-view authentication.

## Verified starting candidate and fail-first result

Before producer edits, all **31** entries in `review-candidate.sha256` matched.
That prior manifest's digest matched the independent re-review exactly:
`50c4eb50c9ca2a94f00e2d6f5e833b528e3481a7c362a3db46d1c1be5bc65f1a`.
It remains an unchanged historical fingerprint, not the corrected candidate.

The exact four new failures from the read-only independent probe's lines 158–190
were reproduced locally before implementation:

```sh
pnpm exec vitest run --config tests/controls/core/vitest.config.ts tests/controls/core/privacy-review.test.ts
```

**4 failed / 4:** stale same-owner refresh hid Cancel; ordinary stale scope-change
and access-loss views exposed selected/missing IDs and query; a saved own initial
server snapshot exposed new-scope selection/query under old expected tags.

## Correction

- Capture expected tags, source/binding values and both snapshot method references
  once. Read the actual current resource snapshot once, before projecting facts.
- Derive controls privacy and Cancel-scope eligibility before any early output.
  Both actual and supplied unmasked contexts must match expected definition/scope;
  access must permit private facts. Supplied binding proofs must belong to this
  definition/controller/resource; invalid controller/definition candidates hide
  accepted IDs/query too, even when schemas/opaque context strings collide. The
  actual current request's already-registered exact-token owner is checked even
  when candidate bindings are dropped; this uses lookup, not a new owner/buffer.
- Use actual `projectResourceView` for resource masking. All blocked paths consult
  the precomputed privacy flag, not their error reason, before returning selected /
  missing IDs or requested query. Rows/loaded records/metadata remain suppressed.
- Authenticate actual current/server snapshot instances only after privacy gating.
  A saved initial server snapshot cannot grant old-scope or restored permission.
  Genuine same-current-context initial server snapshots remain supported.
- Same-owner/scope discarded views block new row/page/reorder actions but preserve
  usable Cancel through ready/pending/failure. Access-loss cleanup may expose the
  Cancel capability but never IDs/query. Existing event origin checks remain intact;
  old-scope callbacks still cannot clear new-scope selection.

`privacy-review.test.ts` adds **32** scenarios: the four repros, full actual/expected
scope/definition/access matrices, same-scope recovery, real initial-server behavior,
foreign/replacement controllers, complete private-field masking and one-read port
instrumentation. The test-only read counter adds no runtime adapter/bootstrap port.
The replacement-controller vector also reproduced a dropped-binding privacy leak
before exact current-token owner lookup was added (`-t 'foreign controller'`).

## Checks and commands

Final suite coverage: **119 core + 56 controller + 24 native = 199 unit tests**;
**7 Chromium source regressions** on isolated port **6437**. Original n1–n6 tests
remain in the core run, including immutable commands/configuration, modes, foreign
views and atomic relative-clock request provenance.

```sh
pnpm exec vitest run --config tests/controls/core/vitest.config.ts
pnpm exec vitest run --config tests/controls/core/controller-regressions.vitest.config.ts
pnpm exec vitest run --config tests/controls/core/native-regressions.vitest.config.ts
pnpm exec playwright test --config tests/controls/core/native.playwright.config.ts
```

Strict TS6/TS5.9 `--noEmit` matrix (all eight exact commands):

```sh
pnpm exec tsc -p packages/react/tsconfig.json --noEmit
node node_modules/typescript-5-9/bin/tsc -p packages/react/tsconfig.json --noEmit
pnpm exec tsc -p tests/controls/core/tsconfig.json --noEmit
node node_modules/typescript-5-9/bin/tsc -p tests/controls/core/tsconfig.json --noEmit
pnpm exec tsc -p tests/controls/core/controller-regressions.tsconfig.json --noEmit
node node_modules/typescript-5-9/bin/tsc -p tests/controls/core/controller-regressions.tsconfig.json --noEmit
pnpm exec tsc -p tests/native/tsconfig.json --noEmit
node node_modules/typescript-5-9/bin/tsc -p tests/native/tsconfig.json --noEmit
pnpm exec biome check packages/react/src/controller/store.ts packages/react/src/controller/types.ts packages/react/src/presentation/*.ts packages/react/src/tanstack/adapter.ts packages/react/src/tanstack/definition.ts packages/react/src/tanstack/types.ts tests/controls/core/*.ts tests/controls/core/*.json
sha256sum -c tests/controls/core/privacy-review-candidate.sha256
```

The new manifest identifies corrected source/tests without replacing the historical
baseline manifest. No new public exports/types, renderer fixes, lifetime acquisition,
render writes, fetch/cache/query owner or dependency change. This does not prove
framework SSR/bootstrap, packed-consumer integration, manual AT, performance or
backend authorization. Main retains public integration and independent approval;
controls UI is still unassigned. No gate/self-approval is claimed.
