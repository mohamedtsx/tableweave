# WP-08 authorized test-only LIMITATION classification — 2026-11-24

**Test-only correction complete; source remains frozen.** Main explicitly approved
replacing the impossible unsupported universal-containment expectation after
`/tmp/opencode/wp08-pagination-review-6477/PROMISE-FINAL-REVIEW.md` recommended
scoped technical source/contract approval. No runtime/source/API modification was
needed or made. This is not whole-WP-08, packed integration or personal-maintainer
acceptance.

All edits are under `tests/controls/pagination/**`. No root/shared config/core/
table/source/Git/install/build/emission/deploy/publication work, and no delegation.
Own browser port6465 only. The supported positive test files `pagination.spec.ts`,
`correction-review.spec.ts`, `capture.test.ts` and `types.ts` remain byte-identical
to `promise-candidate.sha256`.

## Explicit assertion replacement, not a skipped failure

The original exact `errors=[]` expectation is replaced by the active test:

`LIMITATION: unsupported poisoned app Promise stays host-unhandled; library does not invoke getters or clamp`

It asserts exactly one **original synthetic application rejection** at the host,
constructor/species/envelope getters0, controller page4 unchanged, no clamp,
no raw subtree error, and the pager still mounted. Test-only readback additionally
verifies returned Promise own descriptors/prototype/frozen status and native
Promise constructor/prototype descriptors remain unchanged. The poison is created
before return, exactly as before; no Promise mutation after return, global
rejection handlers, suppression, ignore-all-errors, skip or xfail was added.

`correction-review.tsx` only adds descriptor snapshots/readback for that unsupported
poison case and a test-only `poisonFacts` diagnostic; no library API is affected.
Existing supported port branches/positive assertions are unchanged.

Two separate named LIMITATION controls remain active:

1. Direct intrinsic feasibility: the locked constructor throws before handler
   attachment, getter1/handler0, unchanged descriptor and original host rejection1.
   This standalone experiment imports no library; its getter1 is not a library call.
2. App-only/no-observer control: getter0/handler0, unchanged descriptor and the same
   original host rejection1 **without any library observation**.

These three characterization passes are **not rejection-containment successes**.
They enforce the proven limitation while still detecting unexpected errors,
getter execution, mutations, suppression, unsafe clamps or subtree crashes.

## Preserved negative history and scope of review

[promise-original-failure.md](promise-original-failure.md) preserves the exact old
test source/failed diff/page snapshot, its original spec fingerprint, before-fix
getter1 facts, after-fix getter0/original-host-rejection facts and historical
61-pass/1-fail worker result. Historical source/test manifests remain unchanged.

The independent84-case replay genuinely had82 pass/2 fail before classification;
its13 additional defensive/limitation checks and10 unit/SSR checks remain separate
historical evidence. This task does not modify or recount the private review
suite. No old failed run is relabeled green. The review recommends scoped approval
for the exact supported synchronous own-data/owner/epoch/chain and safe ordinary
native Promise best-effort boundary, not async-port support or a privacy waiver.

## Actual current counts — reported separately

Single full invocation: **62 active Chromium cases pass, exit0**:

| Category | Count | Meaning |
| --- | ---: | --- |
| Supported synchronous/guard/UI/resource checks | **54** | Existing owner/context/epoch/chain/metadata/keyboard/focus/RTL/theme guarantees; unexpected pageerrors fail |
| Defensive best-effort/unsupported metadata checks | **5** | Existing async-port/then-accessor checks plus ordinary-rejection and fulfilled constructor/species poison; not supported async ports |
| Named LIMITATION characterizations | **3** | Exact original host rejection/no-observer/native-intrinsic negative facts; **not containment passes** |

These category counts were separately verified using Playwright `--list` filters,
not inferred from an all-green aggregate. All10 unit/actual-source bare-React SSR
tests also pass. Strict TS6.0.3/5.9.3 source and existing emitted-public NodeNext
checks pass. No emission/build rerun: declaration artifacts correspond to the
unchanged frozen source; actual packed/root workflows remain main-owned.

Commands actually run from `/tmp/opencode/tableweave-wp08`:

```sh
pnpm exec playwright test --config tests/controls/pagination/playwright.config.ts
pnpm exec playwright test --config tests/controls/pagination/playwright.config.ts --list --grep 'LIMITATION:'
pnpm exec playwright test --config tests/controls/pagination/playwright.config.ts --list --grep 'DEFENSIVE:|review fail closed: (async-port|then-accessor)'
pnpm exec playwright test --config tests/controls/pagination/playwright.config.ts --list --grep-invert 'LIMITATION:|DEFENSIVE:|review fail closed: (async-port|then-accessor)'
pnpm exec vitest run --config tests/controls/pagination/vitest.config.ts
pnpm exec tsc -p tests/controls/pagination/tsconfig.json
node node_modules/typescript-5-9/bin/tsc -p tests/controls/pagination/tsconfig.json
pnpm exec tsc -p tests/controls/pagination/public.tsconfig.json
node node_modules/typescript-5-9/bin/tsc -p tests/controls/pagination/public.tsconfig.json
pnpm exec biome check tests/controls/pagination
git diff --check -- tests/controls/pagination
```

Source checks run serially with sufficient host deadline; no skipLibCheck/version
suppression flags. Scoped Biome checks17 test/config files without fixes. Normal
current tests still cover n1–n3, controlled rejection/contradictory chains,
same-query request-generation ABA, displayedA/requestedB, RetryB, default/custom
sizes, null/unknown/zero metadata, selection/sort preservation, real HeroUI
keyboard/focus, matched Arabic provider/RTL, widths/themes/axe and SSR no render
mutation/start/retry. No new manual AT/device/performance/framework/network claim.

## Exact frozen source / new test manifest

Unchanged eight-file source aggregate:
`c7085cfc552c48c945c7629c71db8d78288384ae0a7b0fb081c743ab6d4dcf19`.
Algorithm: ASCII-sort repository-relative source paths and hash lines
`path + space + SHA256(file) + newline`.

New `classified-candidate.sha256`:34 entries (28 tested source/test/config inputs,
5 unchanged read-only approved core inputs, and the archived exact failure).
Historical `promise-candidate.sha256` records the pre-classification test bytes.

Only two existing executable test files changed:

- `correction-review.tsx`: `471d1f976093594aa270d807d3ce671056270a781a1d3e6785b0ba3b32f04499`
- `promise-boundary.spec.ts`: `b57fcfb2475ba8e8e180b5fd82c733989a53f613ae30a95457ddd61f86316d36`

Main retains full integrated packing, root exports/styles/shared renderer and
WP-10 interlock handshakes, independent final test disposition and Git/PR work.
No whole-WP-08/full-release approval is inferred from the scoped source review or
this authorized assertion correction.
