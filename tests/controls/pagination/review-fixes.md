# WP-08 pagination n1–n3 correction handoff — 2026-11-24

**Historical n1–n3 candidate; independently resolved.** The narrower n4 observation
path and unconditional malformed-async wording were subsequently challenged. Current
code, exact limitations and the retained failing negative assertion are recorded in
[promise-boundary-handoff.md](promise-boundary-handoff.md), not an all-green claim.

**Ready for independent rereview; no self-approval.** All edits remain in owned
`packages/heroui/src/pagination/**` and `tests/controls/pagination/**`, isolated cwd
`/tmp/opencode/tableweave-wp08`, own browser port6465. No core/controller/native/
resource/table/root/style aggregation/config/manifest/lock/Git writes, installs,
shared package build, delegation, deploy or publication.

Read `/tmp/opencode/wp08-pagination-review-6477/REVIEW-HANDOFF.md`. Main's existing
approved root `getControlsAuthorityOwner` is consumed, not modified. TASKS remains
main-owned.

## Reproduce first — before source edits

Added a typed owned fixture using genuine native/controller/client projections,
two distinct controllers with identical accepted queries/metadata, and commit-phase
input ports. Against the unchanged hook SHA-256
`0ca8faa7a11d7b0a882fd93dd249bb7bfa64cb050b8301df4a2c5e38dc2d3d54`:

```sh
pnpm exec playwright test --config tests/controls/pagination/playwright.config.ts correction-review.spec.ts
```

**3 tests failed, reproducing all three findings before any source fix:**

- **n1:** authorityA/controllerB, same query identity/evaluation/metadata but distinct
  query objects: A stayed4, B changed4→1, `commits.b=["pagination.clamp"]`.
- **n2:** denied-first/allowed-later `context` getter, both current returns denied:
  B changed4→1. Getter reads7 under this fixture's StrictMode replay.
- **n3:** valid own method using `this.context/this.epoch`: receiver checks were
  `[false,false]`, B stayed4, boundary caught the synthetic raw undefined-receiver
  exception. Its public shape is valid; this was not a malformed-port test.

The same three assertions passed immediately after correction. Expanded final
regressions additionally assert n1 makes **zero authority reads**, n2 makes
**zero getter invocations**, and n3 keeps the original receiver and clamps B only
once with no boundary/page error.

## Source correction and exact API

Public API/signatures are unchanged:

```ts
usePaginationCorrection(controller, presentation, authority, {
  definition, context, epoch, readCurrent
}): void
```

`Pagination`, message/formatter exports and props are unchanged. In particular,
`Pagination.tsx` remains byte-identical at
`95c70de081d0977c428db46c366da24cd3e7792688ad85503cd718178d14b853`.
Only the existing public read-port comment now explicitly describes own-data
method receiver preservation and fail-closed unsupported/throwing/async inputs.
No new public proof/factory/props were added.

- `usePaginationCorrection.ts` now compares **both exact references** from
  `getControlsAuthorityOwner(authority)` to the hook controller and captured native
  definition **before every require**, and again at the final dispatch boundary.
  Null/unregistered owners deny. Canonical/query/object-reference equality is not
  owner proof. Final accepted snapshot identity/query/request/context checks remain.
- New internal `correction-capture.ts` reads each consumed own data descriptor
  once into fresh internal primitive envelopes. Root/nested context, epoch,
  definition/callback, flags and nested displayed pagination/pageInfo/range/request
  metadata accessors are rejected **without invoking their getters**. No validation
  followed by a spread/reread of an app envelope occurs.
- The callable is captured once **with its original owner receiver**, invoked via
  `Reflect.apply`, and never fetched again from a mutated callback property.
  Current-read results are separately captured per intentional read. Final current
  context/access/epoch is rechecked after the final authority read.
- Malformed, throwing, asynchronous or descriptor-failing ports are no-correction
  outcomes; raw port/validation errors do not escape render/effect into the pager.
  Ordinary returned rejecting Promises are observed through the intrinsic Promise
  method; thenable accessors are rejected without invocation. No lifecycle port
  runs in render. Proxy descriptor traps inherently may execute JavaScript;
  throwing traps fail closed, while transparent own-data proxies can work without
  property `get` traps. This is not a universal proxy-detection claim.
- Only correction metadata is copied. No app records/rows/query tree are traversed,
  cloned or frozen. The metadata stamp retains the actual primitive request tags/
  generation; accepted query semantics still use the real schema/evaluation and
  `getQueryIdentity` excluding only pageIndex. Supplied rendered request.query is
  not traversed as an independent semantic/owner proof.

The existing mandatory app epoch protocol and one-attempt-per-chain behavior are
unchanged. A proposal/rejection/noop/dispatch exception spends the attempt before
dispatch; automatic-target responses/contradictory smaller totals cannot reopen
it. Genuine external epochs/semantic changes can start another chain. Keep the
hook mounted; no second state/resource/fetch/cache/persistence owner was added.

## Final checks and meaningful regression coverage

Final combined run **56/56 Chromium pass**: original30 +25 review/defensive cases
+1 real same-query request-generation ABA. Original2 unit/SSR tests remain passing;
6 additional capture/port tests make **8/8 unit/SSR pass**.

Review cases include authorityA/B same-query distinct-target rejection; matching
B/B positive; a distinct equal-configuration native definition with the **same B
controller** rejected before require; unregistered authority rejection; ordinary
denied context; root/nested context/epoch/callback accessors; nested metadata;
method `this`; callback rebinding; malformed/throwing/rejecting-async ports; throwing
proxy origin/result/nested descriptor traps; a positive descriptor-backed proxy;
and final-read access denial. Unit tests audit nested pagination/page/range/request
accessors, ignored query/row getters, and unchanged app-record frozen status.

Existing actual resource/controller tests still cover retainedA/requestedB,
RetryB's app transport port, same-turn stale controls, known/unknown/null/zero,
size/reset/selection/sorting, controlled proposal/rejection/acceptance, StrictMode
callback rejection, contradictory smaller totals, epoch/scope/query/metadata
invalidation, keyboard/focus, Arabic provider/RTL, narrow/themes/axe, reference
widths and CSS text expansion. SSR remains bare React with a current genuine
resource snapshot and no render correction/start/retry; no framework hydration
claim.

Commands actually passed from the isolated cwd:

```sh
pnpm exec playwright test --config tests/controls/pagination/playwright.config.ts
pnpm exec vitest run --config tests/controls/pagination/vitest.config.ts
pnpm exec tsc -p tests/controls/pagination/tsconfig.json
node node_modules/typescript-5-9/bin/tsc -p tests/controls/pagination/tsconfig.json
pnpm exec tsc -p tests/controls/pagination/declarations.tsconfig.json
pnpm exec tsc -p tests/controls/pagination/public.tsconfig.json
node node_modules/typescript-5-9/bin/tsc -p tests/controls/pagination/public.tsconfig.json
pnpm exec biome check packages/heroui/src/pagination tests/controls/pagination
git diff --check -- packages/heroui/src/pagination tests/controls/pagination
```

Both strict TS6.0.3/5.9.3 source and emitted-public NodeNext checks pass, including
valid method-style and negative async-port fixtures. No skipLibCheck/version flags
or installed dependency changes. Two source-check processes initially exceeded
120s when run concurrently with compilation/browser work; each unchanged command
was rerun **serially with a 300s host timeout and completed exit0**, not counted as
an initial pass. An expect-error line placement was corrected before those final
source/public checks. Scoped Biome checks23 files with no fixes. Scan of all7 own
emitted pagination declaration files found no direct HeroUI/RAC/TanStack/
internationalized import leak. All emission is under the owned test artifacts,
not a shared package build or tarball/clean-install proof.

## Fingerprints and rereview boundary

Current complete tested-source/input manifest: `review-candidate.sha256`
(25 owned source/test/config entries +5 read-only approved core input entries).
The historical initial `candidate.sha256` is deliberately retained, not relabeled
as the corrected candidate.

Eight-file pagination source aggregate:
`434530ddee3ea96c66926f8dd36e8e1d2d628b76b0fb0017e085d2c44847a398`.
Algorithm matches independent review: filename-ASCII-sorted lines
`filename + space + SHA256 + newline`, then SHA256 of that string.

Current hook:
`1257896b33800aa107d5d1505af6de7d88b5ec21a77e648dd0fc013a1a0b1080`.
Internal capture helper:
`4a716790242744e64f33722ae302e7b7b7ce807293caba27c38baf7dfe26d265`.

**Held for main, unchanged:** the separate B-presentation/A-authority UI diagnostic
is not claimed fixed or passing. Pagination commands intrinsically target the
authority's owner, and main is negotiating the host/presentation pairing contract.
No query-reference shortcut/new UI proof API/product waiver was invented. Future
WP-10 interlock props remain unimplemented pending main's exact additive current
read-port handshake. Shared renderer, root exports/style aggregation, emitted-root/
actual-packed/full workflow and independent rereview remain main-owned. No manual
AT, devices, performance, real consumer/network, publication or personal acceptance
claim. Next action: fresh independent rereview of this manifest and n1–n3 fixes.
