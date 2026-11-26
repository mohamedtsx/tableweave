# Independent privacy finding — correction candidate

2026-11-24, awaiting independent re-review. Only the authorized selection source
and `tests/controls/selection/**` were changed. No core/root/other UI/build/Git/
install changes and no self-approval. Original implementation requirements and
the [handoff limits](README.md#limits-and-exact-next-action) still apply.

## Verified fail-first reproduction

Read the independent `review-context-mask.json` and `review-masked-ssr.json` from
`/tmp/opencode/wp08-selection-independent/tests/controls/selection/.artifacts`.
The initial toolbar source SHA-256 was
`30c691c77a81c54eabb82497b527d0603ddac2c0c1e6813885445f091dda2ee5`, identical to
this worker's prior candidate. The review reports source aggregate
`68030733afb3244a15f7ba89f7c8ce832f126f71a32e84fd621df9bc8a370fe3`.

Before editing producer source, added real resource/native/controller regression
fixtures and ran:

```sh
node tests/controls/selection/check-ssr.mjs
pnpm exec playwright test --config tests/controls/selection/playwright.config.ts privacy.spec.ts
```

- Both browser reproductions **failed**: access denial preserving accepted
  `{a:true}` remounted the old normal criterion; denial from an open normal portal
  also kept the private normal subtree mounted. The factual projection was
  `blockedReason:context`, `requestedQuery:null`, `selectedIds:[]`, not accepted zero.
- The corrected SSR assertion **failed before producer edits**, emitting
  `Amount greater than 0`. Pure audit for actual denied access, mismatched context
  and disposed definition each showed `normalRenders:1`, `actionMetadataReads:1`,
  accepted `{a:true}` and an unchanged query. The first assertion attempt only
  exposed the controller's intentional null-prototype selection map; spreading
  that map in the assertion fixed the test shape and then reproduced the HTML leak.
- Ignored evidence: `.artifacts/privacy-before-source.sha256`,
  `privacy-ssr-before.log`, `privacy-ssr-before.json`, `privacy-browser-before.log`.
  These are synthetic evidence, not sensitive production records.

## Narrow correction and direct audit

`selection-toolbar.tsx` now captures `requestedQuery` and `blockedReason` once
alongside selected IDs. Private rendering is permitted only when the query fact
is not withheld and the reason is neither `context` nor `definition`.

- A genuine neutral/masked presentation returns **null on the first render**, so
  SSR emits no normal criteria, selected records, private action controls or count.
  Normal React child renderers and action-descriptor metadata getters are not
  invoked. The available/zero versus unavailable distinction is made before
  choosing the normal/selection subtree; it is not repaired by an effect.
- This does not gate on busy, stale, row eligibility, snapshot presence or generic
  blocked status. A genuine same-owner initial/pending/failure presentation keeps
  its non-null accepted query fact, normal tools and appropriate selection Cancel.
- No accepted-state mirror, permission cleanup, query reference comparison,
  controller mutation, new core API or public prop was added. After access false
  then true, still-accepted `{a:true}` renders selection, **not** normal tools.
  Authorized true zero restores normal tools. Criteria remain unchanged.
- The commit-phase event configuration carries the availability fact. Retired
  handlers/reporters do not invoke private callbacks while that render is masked.
  The genuine authority remains the event-origin owner; no automatic binding
  proof between arbitrary presentation/authority objects is invented. The host
  must supply the matching pair (main owns that contract documentation).
- Focus-removal bookkeeping is cleared on a masked commit, but restoration is
  suppressed: no old private normal-trigger/fallback callback, no forced local
  focus, no deferred restoration when access returns. Surviving external focus
  stays put. An open normal child's portal unmounts with the private region.
- Direct source audit found the vulnerable decision only in the renderer's
  zero-selected branch and its associated action capture/focus paths. The action
  payload helper already rejects empty IDs/context/definition and retains its
  existing semantics. Only the renderer logic and its prop comment changed in
  production source; the helper and other producers were not edited.

## Corrected verification

```sh
pnpm exec vitest run --config tests/controls/selection/vitest.config.ts
pnpm exec playwright test --config tests/controls/selection/playwright.config.ts
node tests/controls/selection/check-types.mjs
node tests/controls/selection/check-ssr.mjs
pnpm exec biome check packages/heroui/src/selection tests/controls/selection
sha256sum -c tests/controls/selection/privacy-correction.sha256
git diff --check -- packages/heroui/src/selection tests/controls/selection
```

- **8 unit tests pass**, unchanged real producers and prior one-read/payload checks.
- **29 Chromium tests pass**, including the original controlled single/multiple
  delayed/rejected proposals, retained stale/pending/failure Cancel, source-origin
  guards, focus, responsive/RTL/theme/contrast checks. The five new tests prove
  withheld rendering with accepted selection retained; false→true restoration;
  legitimate authorized zero; no private fallback/portal/surviving-focus leak;
  and authorized initial/pending/failure tools plus Cancel without any snapshot.
  The old access-loss test's expectation that normal remounts was itself wrong;
  it now expects the private region absent, without removing its stale-action check.
- **DOM-free source SSR passes** for both normal/selected modes and three genuine
  privacy projections. Access/context/definition audit HTML is `""`, with
  `normalRenders:0`, `actionMetadataReads:0`, `selectionMessageCalls:0`, retained
  `{a:true}` and the same accepted query. This proves no effect-dependent repair.
- **TS6/TS5.9 strict source and own emitted NodeNext declaration checks pass**;
  `skipLibCheck:false`, meaningful positive/negative cases, no new props or vendor
  declarations. Return type now truthfully includes `null`. Only ignored scoped
  declaration artifacts are generated, not a shared package build.
- Scoped Biome and whitespace checks pass. After logs/audit remain under ignored
  `.artifacts/privacy-ssr-after.log`, `privacy-ssr-audit.json`,
  `privacy-browser-after.log`, `privacy-full-browser-after.log`.

`privacy-correction.sha256` records corrected owned source/tests and current
headless dependency bytes. `candidate.sha256` remains historical; its root/core
authority drift is expected from main's separately approved owner-helper work,
not a worker core edit. No unfinished collection adapter is included or claimed.
The separate `privacy-source.sha256` identifies just the four owned source files.
Its manifest SHA-256 (hash of the listed standard relative-path checksum lines) is
`2b161d097292bd34e72557b74ee5b6311ba39773a62cdcfd1bea83bdd6742f43`.
Corrected toolbar SHA-256:
`4d04450aa4b979ca4e35cb33bf460dd6c113fb620cedb57640839fccb393a1d3`.

Next: independent re-review of this exact correction. Main still owns real WP-07/
shared adapter/public packing/Storybook/combined integration and all remaining
device/manual-AT/real-consumer gates. This correction is not packet approval.
