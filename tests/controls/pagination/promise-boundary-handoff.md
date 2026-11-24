# WP-08 n4 Promise boundary — final-review candidate, 2026-11-24

**Historical pre-classification record below.** Independent frozen-source review
subsequently recommended scoped source/contract approval, and main explicitly
authorized test-only replacement of the impossible universal assertion with exact
LIMITATION characterization. Current results and unchanged source proof are in
[test-classification-handoff.md](test-classification-handoff.md). The old failures
remain archived in [promise-original-failure.md](promise-original-failure.md);
they are not retrospectively counted as containment successes.

**Avoidable getter/species invocation corrected; final independent code/wording
review and main disposition still required. No self-approval.** The original
unsupported poisoned rejection is not contained. Its universal-containment test
remains active and failing; there is no all-green browser aggregate.

Read the independent `N1-N3-FIX-REVIEW.md` and
`N4-FEASIBILITY-DISPOSITION.md` in `/tmp/opencode/wp08-pagination-review-6477`.
Independent feasibility confirms the specified original already-rejected Promise
cannot portably be guaranteed handled under the no-mutation/no-global-suppression
constraints. That does not approve this replacement or waive library privacy.

All work stays in `packages/heroui/src/pagination/**` and
`tests/controls/pagination/**`, isolated cwd `/tmp/opencode/tableweave-wp08`, own
browser port6465. No root/core/table/controller/native/resource/shared output,
Git, dependency install, deployment, publication or delegation writes.

## Original reproduction before code changes

On the independently reviewed source aggregate
`434530ddee3ea96c66926f8dd36e8e1d2d628b76b0fb0017e085d2c44847a398`,
added the exact genuine `Promise.reject` + nonconfigurable throwing constructor
getter case to the owned browser fixture. No source edit preceded this command:

```sh
pnpm exec playwright test --config tests/controls/pagination/playwright.config.ts promise-boundary.spec.ts
```

Result: **1 failing test**. Exactly one current-port call, **constructor getter1**,
original rejection pageerror1, pageIndex4 unchanged, zero clamps, raw boundary
error null and pager still mounted. The failure first occurred at getter count.
All messages are synthetic, not private data.

## Actual source fix / supported contract

Public API and props are unchanged. `readCurrent` must **synchronously return the
documented own-data context/epoch envelope**. Own-data methods preserve their
original receiver. Returning a Promise/thenable is unsupported and cannot authorize
correction; no async-port support has been added.

`correction-capture.ts` now captures relevant native reflection/apply/Promise
intrinsics and original descriptor/prototype references once. Async detection uses
a bounded prototype walk and own descriptor inspection, never property reads of
an arbitrary then/constructor/species getter. It no longer blindly calls intrinsic
then on every object.

Best-effort rejection observation is narrower than generic Promise support:

- same captured realm's direct native Promise prototype;
- empty own keys (no constructor/then/other app overrides);
- unchanged native Promise prototype/constructor parents and exact original
  constructor, then, prototype and species descriptors, including attributes;
- only then invoke the captured intrinsic using captured Reflect.apply, with both
  fulfillment/rejection observers. A non-Promise/proxy fails its intrinsic brand
  check before constructor access. A genuine ordinary native Promise uses the
  validated native constructor/species path without an intervening async gap.

Poisoned/modified/subclassed/cross-realm/proxied Promises and arbitrary thenables
are not guaranteed observable. Inspection may encounter JavaScript proxy traps;
throwing traps are contained, not a universal proxy-detection/sandbox claim.
The intrinsic snapshot assumes the ordinary realm intrinsics at module evaluation;
this is not authentication of an already compromised JavaScript realm.

The library does **not** mutate/shadow returned promises or prototypes, freeze app
objects, install window/process rejection handlers, preventDefault, suppress host
events or expose raw errors in its UI/diagnostics. Unit evidence verifies returned
Promise descriptors/frozen status remain unchanged. Only fixture creation installs
synthetic poison before returning its application-owned object.

Supported synchronous capture/read exceptions remain contained, invalid envelopes
cannot clamp, and no lifecycle callback runs in render. Ordinary accidental native
rejection observation remains best effort, not an async-port entitlement. The
original rejected Promise's host report can remain app-owned and unhandled; apps
must own their asynchronous operations and rejection handlers separately.

## Before/after and focused feasibility facts

| Case | Constructor/species getter count | Clamp / subtree crash | Original host rejection |
| --- | --- | --- | --- |
| Original hook + exact rejected constructor poison | 1 / 0 | none / none | one |
| Corrected hook + same exact poison | **0 / 0** | none / none | **one, still uncontained** |
| Corrected hook + ordinary native rejected Promise | 0 / 0 | none / none | none; best-effort observer attached |
| Corrected hook + fulfilled constructor poison | 0 / 0 | none / none | none; it was fulfilled |
| Corrected hook + fulfilled constructor's species poison | 0 / 0 | none / none | none; it was fulfilled |

The original negative test retains its `errors=[]` assertion and is **not skipped,
disabled or marked expected-failure**. After correction it passes getter0/no-clamp/
mounted assertions and fails **only** the unconditional no-host-error assertion.
This records the proven unsupported boundary rather than relabeling containment.

Separate owned standalone semantics-only fixture imports **no library**:

- `promise-feasibility.html` / `promise-feasibility.ts` directly attempts the native
  intrinsic on a nonconfigurable throwing constructor. Constructor getter1,
  original handler runs0, attachment throws, descriptor unchanged, original
  application rejection host-reported1. Standard `then` runs SpeciesConstructor
  before PerformPromiseThen; no portable public operation exposes that internal
  reaction attachment separately.
- Its `strategy=none` causal control installs **no observer at all**. Getter0,
  handler runs0, descriptor unchanged, original application rejection still
  host-reported1. These are explicitly negative capability characterizations,
  **not successful containment tests**.
- Only external Playwright `page.on('pageerror')` records the browser event; no
  page-global/process suppression is used. The independent feasibility report
  additionally verifies20 constructor/species/strategy cases and the specification
  ordering; this handoff does not claim those20 were rerun by this worker.

## Commands/results on final bytes

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

- **Full Chromium:61 pass /1 fail (62 executions), exit1.** All prior56 owner/
  epoch/chain/controller/resource/SSR-related browser regressions remain green;
  three new ordinary/fulfilled-poison defensive characterizations and two standalone
  negative capability controls pass. The sole failing test is the retained original
  unsupported universal-containment expectation, not a new source regression.
- **Unit/actual-source bare-React SSR:10/10 pass**, original8 plus getter-free
  fulfilled-Promise descriptor/nonmutation and non-Promise brand cases.
- Strict TS6.0.3/5.9.3 source and emitted own public NodeNext checks pass; source
  checks were run serially with sufficient host timeout. No declaration skips or
  version-suppression flags. Biome checks25 files, no fixes. Seven own emitted
  declaration files scanned without direct HeroUI/RAC/TanStack/internationalized
  imports. No shared package build or actual tarball proof.
- Original n1/n2/n3 assertions still pass: wrong controller/definition proof rejects
  before require, accessor invoked0, valid own method keeps its receiver/clamps only
  B once. Controlled rejection/contradictory totals/request-generation ABA, real
  resource retained A/requested B, RetryB, truthful pager metadata, keyboard/focus,
  Arabic provider/RTL, widths/themes/axe and SSR no-render-writes remain covered.
- `Pagination.tsx` is byte-identical. Its coherent presentation/authority input
  pairing remains the main-documented host precondition, not a newly invented
  query-reference/proof API. Future WP-10 interlock remains separately negotiated.

## Current fingerprints / next step

`promise-candidate.sha256` contains **33** entries:28 owned source/test/config inputs
and5 unchanged read-only approved core inputs. Previous candidate manifests remain
historical, not relabeled as current.

Eight-file source aggregate:
`c7085cfc552c48c945c7629c71db8d78288384ae0a7b0fb081c743ab6d4dcf19`.
Algorithm: ASCII-sort the **repository-relative paths**, construct lines
`path + space + SHA256(file) + newline`, hash that string.

Current capture helper:
`0fc635fc236a7e3ac54f16b4d7266254a3627d7e6b4ddfce3927ae80364dfa47`.
Unchanged UI component:
`95c70de081d0977c428db46c366da24cd3e7792688ad85503cd718178d14b853`.

Main should request independent review of the exact getter/species avoidance code,
ordinary best-effort behavior, unchanged guard regressions and this precise wording
before any scoped approval/classification. Do not treat the independent feasibility
finding or this handoff as approval, a privacy waiver or an all-input containment
pass. The retained negative assertion still requires explicit reviewer/main
disposition. No full WP-08/root/packed/combined/framework hydration/network/manual
AT/device/performance/real-consumer/publication acceptance is claimed.
