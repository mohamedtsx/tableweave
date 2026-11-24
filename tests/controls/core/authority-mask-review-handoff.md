# WP-08 n9 aggregate/activity mask correction — independent review required

Worktree: `/tmp/opencode/tableweave-wp08`. Only presentation source/owned README
and core-test paths changed. No public API, controller/native/resource/bootstrap,
Git, install, build-output, shared export/config or UI changes. The previous
privacy correction manifest remains unchanged as historical evidence.

## Fail first

Read the independent final-review probe's exact checked/mixed case at
`/tmp/opencode/wp08-core-independent-finalreview/probes.test.ts:268–283`.
Reproduced it locally BEFORE producer edits:

```sh
pnpm exec vitest run --config tests/controls/core/vitest.config.ts tests/controls/core/authority-mask-review.test.ts
```

**1 test failed / 1:** old-scope read returned empty IDs/rows with context blocked,
but all-selected foreign rows left checked=true and one-selected left mixed=true.

## Bounded correction and audit

- Added internal `presentation/masked.ts`: an exhaustive typed neutral literal
  covering EVERY public `ControlsPresentation` field. It takes only immutable
  origin selection mode and blocked reason, never another owner's facts. New
  required fields force explicit neutral defaults at compile time.
- Authority checks its existing origin guards BEFORE projecting any foreign
  facts. A mismatch returns the neutral builder directly, with no foreign spread.
  IDs/rows/query/provenance, checked/mixed, busy/stale/obsolete/resourceObsolete
  and every selection/reorder/retry/Cancel/page-navigation capability are empty,
  null or false. Only safe origin mode/configured page support remains.
- Projection reuses the same builder. After existing privacy checks it uses an
  explicit whitelist for accepted SAME-owner IDs/query/activity and scoped Cancel
  cleanup. Invalid controller/definition/privacy outputs cannot forward activity.
- Same-owner query/refresh guards remain separate, preserving accepted IDs,
  truthful activity and usable Cancel. Prior n7/n8 same-owner access-loss cleanup
  stays available with no private IDs/query. Old owners gain no recovery command.
- Complete-object assertions cover foreign ready/pending/failure/obsolete states,
  enabled foreign page/reorder/retry/Cancel affordances, all origin selection
  modes, invalid-definition busy state, and unchanged same-owner refresh recovery.
  All prior **32 privacy vectors** remain; their private-mask assertions now also
  check neutral aggregate/activity and navigation/retry fields. Existing n1–n8
  suites remain in the rerun.

No new runtime export or public type. Main's future packing may need the new
internal emitted `presentation/masked.{js,d.ts}` module; no outputs were built here.

## Commands and evidence scope

```sh
pnpm exec vitest run --config tests/controls/core/vitest.config.ts
pnpm exec vitest run --config tests/controls/core/controller-regressions.vitest.config.ts
pnpm exec vitest run --config tests/controls/core/native-regressions.vitest.config.ts
pnpm exec playwright test --config tests/controls/core/native.playwright.config.ts
pnpm exec tsc -p packages/react/tsconfig.json --noEmit
node node_modules/typescript-5-9/bin/tsc -p packages/react/tsconfig.json --noEmit
pnpm exec tsc -p tests/controls/core/tsconfig.json --noEmit
node node_modules/typescript-5-9/bin/tsc -p tests/controls/core/tsconfig.json --noEmit
pnpm exec tsc -p tests/controls/core/controller-regressions.tsconfig.json --noEmit
node node_modules/typescript-5-9/bin/tsc -p tests/controls/core/controller-regressions.tsconfig.json --noEmit
pnpm exec tsc -p tests/native/tsconfig.json --noEmit
node node_modules/typescript-5-9/bin/tsc -p tests/native/tsconfig.json --noEmit
pnpm exec biome check packages/react/src/controller/store.ts packages/react/src/controller/types.ts packages/react/src/presentation/*.ts packages/react/src/tanstack/adapter.ts packages/react/src/tanstack/definition.ts packages/react/src/tanstack/types.ts tests/controls/core/*.ts tests/controls/core/*.json
sha256sum -c tests/controls/core/authority-mask-review-candidate.sha256
```

Coverage: **129 core + 56 controller + 24 native = 209 unit tests**, eight strict
TS6/TS5.9 checks over four configurations and seven source Chromium regressions on
port **6437**.
Automated synthetic/source evidence only: no framework bootstrap/full SSR,
packed-consumer, manual AT, performance, backend authorization or full-gate proof.
Public integration/packing and independent approval remain main-owned; UI is
unassigned. No merge or self-approval is claimed.
