# Rapid popover reopen correction — 2026-11-24

**Scoped source correction candidate: 19 browser cases pass at30s. Independent
review and main-owned production rebuild/replay remain required.** No whole-WP-08,
WP-07 composition/integration, StrictMode, packed, AT or release approval is claimed.

## Approved boundary and exact source delta

Main approved the plan's “Rapid popover reopen correction” section before code.
Only these two existing source files changed:

- `packages/heroui/src/sorting/sorting.tsx`
- `packages/heroui/src/columns/column-chooser.tsx`

Each adds a bounded HeroUI3.2.8 focus/Escape-bug comment and **`shouldSkipAnimation`**
to its one internal `Popover.Content`. No other overlay loses motion. No controlled
open state, controller/model/query/owner checks, renderer, CSS, vendor version,
private FocusScope/ref/cache, inert DOM state or public component API was changed.

Actual installed public-type confirmation, read before the patch:

- HeroUI3.2.8 `dist/components/popover/popover.d.ts:12` defines Content props as
  `Omit<ComponentPropsWithRef<typeof PopoverPrimitive>, "children">` plus its variants.
- The installed RAC1.22.1 public `dist/types/src/Popover.d.ts:37–41` declares
  `shouldSkipAnimation?: boolean` for appearing/disappearing without entry/exit
  animation. HeroUI's public Content forwards it to the primitive.
- The real source JSX compiles under both TS6.0.3 and5.9.3. No vendor type is added
  to an own public interface or declaration.

Main's read-only diagnostic at `/tmp/opencode/wp08-inert-n1-lahh54ch/EVIDENCE.md`
also reproduces the old path in vendor-only and uninstrumented frozen production
Sorting **and** chooser. This worker did not alter or rerun that workspace.

## Reproduce first: actual unchanged-source failure

Added `rapid-popover.spec.ts` before touching either component. Both cases attempt
four real physical cycles: open; Escape; immediate pointer reopen at the trigger's
bounding box; one final Escape; require dialog removal, ARIAfalse and trigger focus.
There is **no close/focus wait between the first Escape and pointer reopen**, and no
wait for eventual focus recovery before the final Escape. There are no sleeps,
force/DOM clicks, retries, skip/xfail, global rejection handlers or focus repair.
The test also requires unchanged accepted state and no page errors.

With the original source and restored30-second test limit:

```sh
node tests/controls/columns/rapid-fingerprints.mjs capture
pnpm exec playwright test --config tests/controls/columns/playwright.config.ts rapid-popover.spec.ts --output tests/controls/columns/.artifacts/rapid-before
node tests/controls/columns/rapid-fingerprints.mjs archive-failure
```

**0 pass / 2 fail**, about6.2s each. Both fail `dialog count expected0, received1`
after the reopened dialog's final Escape (5s assertion deadline), not the overall
30s deadline. Failure traces, contexts, the original report and exact before source/
test/config preimages are in `.artifacts/rapid-before/`.

`rapid-before.failure.sha256` records all10 archive files; manifest SHA-256:
`b1355817a5753646e7b6c93c6f22ec91c0eda3d9368fa612760dd146964caa91`.
Its full `sha256sum -c` verification still passes after the correction.

An open modal's background inertness is expected. The confirmed bug is missed
overlay-local Escape after rapid exit-retained reopen/focus loss, **not proof of
permanently orphaned inert state or an irreversible application deadlock**.

## Separate product mitigation and matrix sequencing

Only after preserving the two failures were the two public props applied.
Separately, the existing three-theme viewport matrix now asserts after every
Escape: dialog removed, trigger `aria-expanded=false`, trigger focused. Only then
does it change viewport/start its independent next scene. It retains every original
axe, full-page screenshot, contrast, RTL/provider/locale, width and text-expansion
assertion. Actual DOM `[role="dialog"]` count must also be zero, not merely absent
from an accessibility query. Synchronizing that scene boundary alone is not the product fix: the new
rapid regression deliberately keeps the real race path unsynchronized.

`playwright.config.ts` restores **30_000ms**, not diagnostic90s. It also excludes
`.artifacts/**` from discovery because preserved before-input `.spec.ts` copies are
evidence, not extra tests. The first post-patch quick command mistakenly discovered
those copies and reported4 passes; its report is preserved at
`.artifacts/rapid-after/initial-duplicate-discovery-report.json`. The final result
below uses exactly the17 original cases plus2 canonical rapid cases, not duplicated
archive cases. No canonical scenario or assertion was excluded.

## Final actual commands and counts

From `/tmp/opencode/tableweave-wp08`:

```sh
pnpm exec playwright test --config tests/controls/columns/playwright.config.ts --output tests/controls/columns/.artifacts/rapid-final
pnpm exec vitest run --config tests/controls/columns/vitest.config.ts
node tests/controls/columns/check-types.mjs
pnpm exec biome check packages/heroui/src/sorting/sorting.tsx packages/heroui/src/columns/column-chooser.tsx tests/controls/columns/*.ts tests/controls/columns/*.mjs
node tests/controls/columns/rapid-fingerprints.mjs
sha256sum -c tests/controls/columns/rapid-before.failure.sha256
```

- **19/19 Chromium pass**, one worker,30-second limit. Final total42.1s across the suite.
  All17 original cases remain; matrices take **5.1/4.9/4.5s** (light/dark/Arabic RTL).
  Both four-cycle physical regressions pass in **3.2/3.0s**. No split/raised deadline.
- **30/30 existing unit tests pass**: exact owner proof, access/scope/definition,
  current functional updaters, same-turn state, controlled proposals/rejection/
  delayed acceptance, required/final visibility and query/selection retention.
- **Five strict compiler invocations pass**: source TS6/5.9, private scoped TS6
  declaration emission, and own emitted public NodeNext consumers TS6/5.9.
  `skipLibCheck:false`, exact optional and all positive/negative assertions remain.
- **13 scoped code/config files pass Biome**, no pending fix. Scoped whitespace
  check passes. No source/public type assertions were weakened.

Final browser report is `.artifacts/results.json`; output is `.artifacts/rapid-final/`.
Only own private declaration directories and source Vite artifacts were emitted.
The existing portability resolver remains unchanged and uses the same source
factory registry; there was no borrowed install, new dependency or shared build.

## Fingerprints, unchanged API and deliberately preserved history

`rapid-before.runtime.sha256` records the original72 source files (manifest hash
`d79681bd344565897ca414886d95008a1fc8b5b7a83da707c95969e5e544e8c4`).
The correction verifier checks the same inventory and requires **exactly the two
allocated source deltas**, rather than relabeling the old frozen-source audit green.

The updated72-file `rapid-after.runtime.sha256` has manifest hash:
`5db48334d60d4bff17163ded5f98793dbdbdcb44f9f8656c7b05ac22fb16e674`.

New exact source hashes:

```text
9048b061b31af880585e51531d3cee2d44fcb21eae511e2013a342dbacbf463a  packages/heroui/src/sorting/sorting.tsx
0ed883a11dfa4dd68e92c9cff9139baf1b761edc04b4c1c4797234757f5459ad  packages/heroui/src/columns/column-chooser.tsx
```

`rapid-correction.sha256` records14 current source/test/config inputs. Manifest hash:
`b4869fc93f7ededc44683979ef4d961296e133e0dec4e799061a8a432595d8b7`.

Still byte-identical to this allocation's capture:

- **137 shared dist files**: manifest
  `c0bc44245f74c1b3ad7a417ce46b4ca9e89ded753b2e250bb3009215660b8c76`.
- **18 captured historical SHA manifests**, including the prior portability layer:
  `3cb3c736c080b0921c63f34758e934dded79e2993ed6c248ebc10ec0ee91ee07`.
- **Six own public declaration files** before/after re-emission:
  `309764e9cd1a925d9db8ce0f0eb24526121ab99de132bd78638ac3a300d1a709`.
  This proves unchanged own public API bytes, not a new packed-consumer pass.

Historical manifests/audit tables were not overwritten to hide intentional source/
config drift. The new files and evidence live only in this test scope.

## Remaining gate

Main must independently review/replay this exact candidate, then authorize its own
new package/production rebuild and real public replay. **The frozen old137 dist
files and old production assets were not fixed or rebuilt by this worker.** No
new production/package pass is implied by the source result. Composition n1 on6483
and StrictMode n2 diagnosis on6491 were not edited, served, stopped or resolved here.
No root/core/renderer/harness/main manifest/style/ledger/Git/install/delegation or
shared-build work occurred in this allocation. Other required gates remain separate.
