# WP-08 core correction candidate — independent re-review required

Worktree: `/tmp/opencode/tableweave-wp08`. Main's appended correction disposition
in `docs/planning/wp-08-implementation-plan.md` was read before producer edits.
Only assigned controller/store+types, native, presentation and core-test paths were
edited. No Git, install, root build, public export or shared harness changes.

## Fail-first evidence

Read-only review inputs: `/tmp/opencode/wp08-core-independent-review/probes.test.ts`
and its `candidate.sha256`. Independent correctness regressions were added locally,
not substituted for the review's assertions that bugs existed.

Before correction:

```sh
pnpm exec vitest run --config tests/controls/core/vitest.config.ts tests/controls/core/independent-review.test.ts
```

Result: **9 failed / 9**, covering all six findings: command getter/kind/payload
mutation, old-scope Cancel, copied foreign snapshots, deleted command and replaced
state guard options, relative-date rebinding and reread selection input.
The n5 test was then migrated to the approved atomic API, retaining the required
old-evaluation/obsolete-data assertions. Additional never-registered-token,
midnight observer and retry vectors cover the replacement protocol.

A further n3 source-view-getter vector failed before source-port capture:

```sh
pnpm exec vitest run --config tests/controls/core/vitest.config.ts tests/controls/core/independent-review.test.ts -t 'n3 copied'
```

It is now part of that same regression: authentication and projection use one
captured source/view, never successive getter results.

## Correction boundaries

- **n1:** controller-owned recursively copied/frozen command data is used by the
  command guard, reduction and private pending acceptance. Function updaters retain
  references; undefined survives; accessors/cycles/non-data prototypes reject
  safely. Caller objects/functions/business records are not frozen by capture.
- **n2:** Cancel checks current registered controller/definition, origin expected
  scope, actual source scope and resource owner. It still ignores query freshness
  and row availability and allows same-owner access-loss cleanup.
- **n3:** only actual unmasked resource getSnapshot/getServerSnapshot instances
  authenticate render data; copied/foreign/getter-swapped views suppress rows.
- **n4:** native construction captures and validates callback references once,
  including state constraints and async/nonvoid forwarding. Caller option mutation
  cannot weaken installed guards.
- **n5:** removed arbitrary post-hoc binding. `beginControlsRequest(definition,
  controller, resource, input)` captures actual accepted query/identity/evaluation
  BEFORE existing resource.begin and returns `{request,binding}` or null. No
  transport/lifetime/buffer is introduced. `getControlsRequestBinding(...)` only
  looks up already-registered EXACT tokens; it cannot bind old/foreign/raw tokens.
  Explicit retry ports register original request provenance before app transport.
- **n6:** selection/multiSort/row callbacks and evaluation callbacks are captured
  once; the exact published primitive mode is validated. No broad row-data clone.

`ControllerOptions.validateCommand` remains the only added controller option;
state-validator invocation timing, reentrancy, async rejection observation and
pending-preservation behavior remain covered. No public transition/command shape
or controller wrapper was introduced.

## Reproduction commands and coverage

Run from the worktree:

```sh
pnpm exec vitest run --config tests/controls/core/vitest.config.ts
pnpm exec vitest run --config tests/controls/core/controller-regressions.vitest.config.ts
pnpm exec vitest run --config tests/controls/core/native-regressions.vitest.config.ts
pnpm exec playwright test --config tests/controls/core/native.playwright.config.ts
```

Coverage: **87 core + 56 controller + 24 native tests; 7 Chromium regressions** on
isolated port **6437**. Strict positive/negative types use both TS6 and TS5.9 with
`--noEmit` and `skipLibCheck:false` for all four configurations:

| Configuration | TS6 command | TS5.9 command |
| --- | --- | --- |
| Package | `pnpm exec tsc -p packages/react/tsconfig.json --noEmit` | `node node_modules/typescript-5-9/bin/tsc -p packages/react/tsconfig.json --noEmit` |
| Core | `pnpm exec tsc -p tests/controls/core/tsconfig.json --noEmit` | `node node_modules/typescript-5-9/bin/tsc -p tests/controls/core/tsconfig.json --noEmit` |
| Prior controller | `pnpm exec tsc -p tests/controls/core/controller-regressions.tsconfig.json --noEmit` | `node node_modules/typescript-5-9/bin/tsc -p tests/controls/core/controller-regressions.tsconfig.json --noEmit` |
| Prior native | `pnpm exec tsc -p tests/native/tsconfig.json --noEmit` | `node node_modules/typescript-5-9/bin/tsc -p tests/native/tsconfig.json --noEmit` |

Seven simultaneous typechecks initially timed out at 120 seconds without
diagnostics; their serial reruns completed successfully. No code conclusion was
drawn from a timeout. Prior broad foundation checks require isolated emitted dist
and are not claimed here. Source checks are not packed-consumer or SSR proof.

```sh
pnpm exec biome check packages/react/src/controller/store.ts packages/react/src/controller/types.ts packages/react/src/presentation/*.ts packages/react/src/tanstack/adapter.ts packages/react/src/tanstack/definition.ts packages/react/src/tanstack/types.ts tests/controls/core/*.ts tests/controls/core/*.json
sha256sum -c tests/controls/core/review-candidate.sha256
```

The checksum manifest identifies this dirty-source candidate without Git operations.
Root runtime exports now need `beginControlsRequest` and lookup instead of the
removed bind, plus new `ControlsRequestInput` and `ControlsRequestStart` types.
Main owns integration/packing and independent re-review. No self/gate approval,
full SSR/manual-AT/performance/backend-authorization or publication claim follows.
