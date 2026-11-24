# Disabled pager/correction — provisional source authoring

**No new behavioral tests executed. Final integrated verification is deferred.**

Lease: main's `wp-09-disabled-pager-plan.md` (read in full from the stacked tree),
TASK-017 / FR-12, partial AC-24/25/26. Supplied child HEAD `7e05505`; no Git operation
or HEAD re-verification. Main already owns the frozen install. This lane does not
depend on or change main's concurrent U4 native/resource/presentation APIs.

Only three existing files and this new folder are authored:

- `packages/heroui/src/pagination/Pagination.tsx`
- `packages/heroui/src/pagination/usePaginationCorrection.ts`
- `packages/heroui/src/pagination/types.ts`
- `tests/pagination-policy/pager-disabled/**`

## Exact source behavior

`Pagination` now accepts an undestructured props argument. useId, both refs and the
effect still run unconditionally. The normalized schema's explicit false gate
prevents even reading `props.presentation`; it also precedes authority, optional
locale, messages, formatter, retry, id and className reads. A disabled effect only
clears its own focused-control reference and returns. It does not inspect/mutate DOM,
move focus, alter inert/animation policy or render new markup.

For enabled schema, the presentation reference is captured once. An optional own
`paginationEnabled` descriptor, if present, must be a data descriptor containing
exactly true; false, invalid values, accessors or descriptor failures deny rendering
before defaults/formatters. The isolated presentation type has **no** such field;
it was not modified or cast to any. Legacy absent metadata retains the old coherent
host precondition. This is a denial gate only, never event/backend permission or
verification of arbitrary foreign facts. Enabled markup/messages/callback/focus
recovery code below the gate is unchanged. The sole public type change is
`PaginationComponent` returning `ReactElement | null`.

`usePaginationCorrection` first reads only the supplied actual controller's immutable
definition metadata. Normalized enabled schemas omit the flag; explicit false,
invalid metadata values or metadata exceptions fail closed. It skips origin capture
and all context/authority/rendered-fact/private-port/effect work when disabled, while
still invoking useRef/useEffect. It does **not** clear the attempted ref on a false
render. The enabled capture, original receiver, provenance, final epoch/state checks,
one-attempt semantics and dispatch body remain unchanged. Correction-capture and
Promise behavior are not rewritten; source command/state capability guards remain
mandatory. The flag is not an authorization token.

## Authored, deferred cases

Ten source `renderToString` cases in `render.test.tsx`:

- False normalized schema with poisoned getters on every non-schema prop, including
  the presentation reference; no reads, formatting or accepted mutation.
- False schema correction render with hostile presentation/authority/context.
- Enabled schema plus five explicit false/invalid new fact values, with poisoned
  default-locale/displayed access and formatter callbacks.
- Own metadata accessor without invoking its getter; throwing descriptor trap denial.
- Genuine enabled legacy facts/authority with unchanged user formatter behavior.

Nine real-browser/React cases in `policy.spec.ts`, **authored only**:

- Raw disabled props; disabled committed hook with hostile structures and with actual
  out-of-range clamp-looking native facts; malformed controller metadata denial.
- Metadata accessor denial; original enabled keyboard paging/focus and summary.
- Genuine enabled correction/receiver checks; controlled rejection and rerender,
  true→false→true with the same spent owner/epoch, then a genuinely advanced epoch.
- Existing removed-target focus recovery, disable/re-enable hook order and preserving
  focus in an external application region.

Allowing actors use actual defineNativeTable/createNativeController, actual native
boundary prepare/commit, actual projectControls and factory-registered authorities.
Browser authorities refresh against current accepted query identity. No fake allowing
frame/controller, private controller wrapper or replacement model is used. Hostile
Proxies/extra metadata are denial fixtures only. Raw wrapper invocation tests the
component's own function boundary rather than requiring React props construction to
avoid invoking getters on a caller-created spread.

The browser fixture mounts StrictMode and records post-commit/effect phases instead
of arbitrary sleeps. App completion ports perform real synthetic native input
replacement; no inaccessible overlay/fake UI click is used. Pageerror/console errors
fail afterEach. No force actions, CSS adaptation, reduced-motion overrides, new
product design, Figma work or vendor modifications. Existing styles are reused.

All these behavioral cases, plus existing enabled known/unknown/zero-page, cancel,
focus, epoch/attempt/Promise regressions, must run in main's final batch. Source/type
checking is **not** a behavioral pass or SSR/hydration acceptance.

## Actual lightweight checks and commands

Cwd `/tmp/opencode/tableweave-wp09-native-browser`. Already executed:

```sh
node tests/pagination-policy/pager-disabled/guard.mjs before
PAGER_TYPES_RUN=types-initial node tests/pagination-policy/pager-disabled/check-types.mjs
PAGER_TYPES_RUN=types-authored node tests/pagination-policy/pager-disabled/check-types.mjs
```

Initial TS6 compile failed on comparing the current normalized false-or-absent
schema field with true. The policy value is now locally typed unknown at the
defensive boundary (not a cast of facts/controller APIs), preserving malformed-value
denial. The fresh **TS6.0.3 strict single-program noEmit check passes**, whole HeroUI
source plus all own TypeScript: **55 root files**, real declarations,
`skipLibCheck=false`, no stubs, no TS5.9 or negative/declaration matrices. Initial
diagnostics and final empty log/result are retained in separate generations.

Scoped Biome formatting/checking covers only the three allocated producers and own
supported files, with no rule suppression. Handoff sealing performs Node syntax-only
checks on own mjs files; it does not import/launch their Vite/Vitest configurations.
The final scope/seal commands are:

```sh
node tests/pagination-policy/pager-disabled/guard.mjs after
node tests/pagination-policy/pager-disabled/seal.mjs
```

Deferred, **not executed**, for main's single final verification phase:

```sh
PAGER_UNITS_RUN=main-final-render NODE_DISABLE_COMPILE_CACHE=1 node node_modules/vitest/vitest.mjs run --configLoader native --config tests/pagination-policy/pager-disabled/vitest.config.mjs
PAGER_BROWSER_RUN=main-final-browser NODE_DISABLE_COMPILE_CACHE=1 node node_modules/@playwright/test/cli.js test --config tests/pagination-policy/pager-disabled/playwright.config.ts
```

Use unused generation names; do not overwrite earlier reports. Browser config binds
only127.0.0.1:6543, one worker, retries0, timeout30s/expect5s, cached pinned Chromium,
1280×800. Missing cached browser must stop for main, not install. Actual CSS exports
and installed Tailwind plugin are resolved through declaring-package helpers; no
style-to-JS alias. Cache/trace/screenshot/JSON outputs stay in this owned folder;
JSON environment controls are constrained to the unique own generation. No server
or new browser process was started in this lease.

## Scope seals and handoff

The new before map begins at all105-source aggregate:

```text
497a1e37cd60c4080243847760e23526b8fe7cb033627ead9c7042d3ca0b0790
```

It protects the **102 other sources**, **846 existing files**, **107 separately
sealed native-browser code/artifact/cache/seal files**, and **8 installed profiled
runtime/declaration assets**. The existing read-only runtime byte CLI also runs.
`guard.mjs after` compares those same protected bytes/modes without rebasing any old
seal. Main's prior TASKS lease change and the three intentional producer deltas are
not hidden by rewriting the old browser742 map. No old guard/report was rerun.

`.artifacts/handoff.json` records exact three-file source diffs/hashes, new source
aggregate, new authored-test aggregate, syntax/type results and every own artifact
hash except the handoff manifest itself. `.artifacts/before.json`/`after.json` own
the new protection maps. The original browser result remains **12 passed /2 failed
of14**, unchanged and historical; there is still no fresh browser pass.

No install, dependency/root manifest/export/config/doc/TASKS/Git write, shared build,
root emissions, agents, external network, deployment or publication. No full WP-09,
complete-server/resource, controls adoption, facade, genuine archive, output-generation,
AA/WCAG/manual/device/SSR/hydration/performance or release approval. Root documentation
discovery/checking and U4 type adaptation are main's intake/final-phase responsibility.
