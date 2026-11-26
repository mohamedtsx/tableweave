# WP-09 native client — provisional source-browser fixture

**Authored for main's single final verification phase. Not browser acceptance.**

Only this new folder is owned. Supplied baseline HEAD is `0288904`; no Git command,
install, shared build, producer/config/manifest/lock/TASKS/vendor edit, external
network, agent, deployment or publication was performed. Authorization is the
isolated [TASKS lease](../../../TASKS.md) and main's parallel proof plan in
`/tmp/opencode/tableweave-wp09-stacked/docs/planning/wp-09-parallel-proof-plan.md`.
The accepted [U2 source handoff](../native-client/README.md) is the dependency;
changing U3/resource-complete APIs are not imported or assumed.

## Actual outcomes, including failures

Before user steering, one browser startup attempt and **one actual 14-case run**
completed. No browser run was launched after steering.

| Generation / check | Actual result |
| --- | --- |
| `initial` | Startup failed: Playwright defaulted webServer cwd to the config folder. Zero browser cases ran. Own config now explicitly supplies root cwd. |
| `browser-second` | **12 passed / 2 failed**, 14 cases, Chromium, one worker, retries 0. Reports, screenshots and traces retained unchanged. |
| First strict compile (`types`) | TS6 failed only on missing side-effect CSS declaration for the real `@heroui/styles/css` export; TS5.9 was not reached. |
| `types-second` | TS6.0.3 and TS5.9.3 strict source fixture/browser/config compile passed with real declarations, `skipLibCheck=false`. |
| `types-authored` | Both strict compilers pass on the current authored fixture/tests/config, including actual numeric native accessor inference. No type-negative or declaration-emission matrix rerun. |
| Final source/profile guard | All105 sources /742 existing files /8 installed profiled assets unchanged against the before snapshot. |
| Documentation | Structural checker fails solely because this new README is unreachable from root entrypoints;18 probes run,15 pass/3 fail due to that same finding. Main must add the discovery link; root docs are read-only here. Raw output retained in `.artifacts/docs.json`. |
| Current authored fixture | Browser verification **DEFERRED**, including test corrections and later fixture/config changes. |

Two failing assertions were fixture/test errors, not established shared-source bugs:

1. The multiple-selection case asked for `label-004`, whose record has amount zero
   and was correctly filtered out. It now derives a genuinely rendered ineligible
   row from the independent oracle. Header select-all and exact eligible/loaded/
   offscreen distinctions had passed before that assertion; deselect tail did not run.
2. Ctrl+End successfully reached final physical row `r001` and scrolled it into the
   viewport. The test then incorrectly expected Home to enter that row's checkbox.
   The retained trace shows Home focused first row `r167`. Authored correction uses
   ArrowRight to enter the current row's first cell. **That correction and Space
   selection/focus/screenshot tail remain unverified.** No force/focus injection,
   changed semantics, arbitrary sleep or runtime fix was used.

Current changes also add an explicit application-owned positive-filter dispatch,
numeric accessor inference through the actual column helper, saved-view narrowing,
and generation/JSON-environment confinement. These are authoring, not another pass.

After the atomic browser run completed, no Vite listener remained on6541 (one local
listener inspection returned empty); there is no own persistent server to stop.

## What the fixture actually uses

- Actual `NativeCollection` and actual `useNativeTable`, genuine stable definition/
  controller created outside React render, actual native boundary/WeakMap registry,
  real native Subscribe/FlexRender. No static-only HeroUI table, fake row model,
  replaced collection or subscription stub. React StrictMode is mounted; readiness
  requires the real committed-view effect count to reach two. This does not prove
  general StrictMode lifecycle, SSR, hydration or frame adoption.
- Synthetic mutable application records: 173 inputs, 148 positive-amount matches,
  actual amount-descending/title-ascending native sorts; default dormant size10 and
  custom7. Empty, five-input and 311-input/266-match cases. Every physical tbody row
  ID/order is compared both to an independent oracle and to the real final native
  row model, not only snapshot JSON. Record references, order/content and absence of
  array/record freezing are observed passively through the app test port.
- Fourteen authored risk-based cases: disabled/omitted/true/custom baselines with
  actual enabled next/previous actions; empty/small/>100 rows; actual header multi-sort,
  builder clear/reapply and selection reset; multiple/single/false selection, real
  eligible-subset select-all versus unloaded ID; grouped hidden/reordered leaves;
  keyboard reach/Space; stale/disposed saved actions; ordinary-server refusal before
  getRowId through a genuine adapter port. No fabricated server UI is claimed.
- Disabled fixture simply does not mount app pager buttons. This absence is **not**
  proof of implementation. The supported previous/next/setPagination ports separately
  assert exact denial codes, zero functional-updater/private callback work and exact
  accepted-state reference preservation. U2 owns the real unslicing producer proof.
- No presentation/authority/resource scope, adopted controls, complete-server input,
  facade, privacy-before-commit, packed/archive, output-generation or full AC-09 claim.

All pageerror and console-error events are captured and asserted empty after each
case. Expected negative app ports normalize only actual library error classes;
unexpected exceptions escape and fail. Real checkbox labels, pointer and keyboard
actions retain normal actionability checks. No reduced-motion/global style override,
vendor patch, CSS alias-to-JS, in-memory rewrite or new product styling was added.
Tailwind uses its installed plugin, an actual CSS package entry and explicit source
patterns; HeroUI styles import the actual `@heroui/styles/css` package export.
Existing production table styles and existing pagination-fixture body styles are
reused unchanged. Aliases are the exact shared factory entries, declared React
packages, three used HeroUI subpaths and actual CSS exports only.

## Exact commands

Cwd `/tmp/opencode/tableweave-wp09-native-browser`. Main already installed the
frozen lock/profile (external main log `/tmp/opencode/wp09-native-browser-install.log`).
Do not reinstall or build. Cached pinned Chromium was present; missing cache must
stop for main, never trigger browser installation.

Already executed:

```sh
node tests/pagination-policy/native-browser/guard.mjs before
node tests/pagination-policy/native-browser/check-types.mjs
NATIVE_TYPES_RUN=types-second node tests/pagination-policy/native-browser/check-types.mjs
NATIVE_BROWSER_RUN=initial NODE_DISABLE_COMPILE_CACHE=1 node node_modules/@playwright/test/cli.js test --config tests/pagination-policy/native-browser/playwright.config.ts
NATIVE_BROWSER_RUN=browser-second NODE_DISABLE_COMPILE_CACHE=1 node node_modules/@playwright/test/cli.js test --config tests/pagination-policy/native-browser/playwright.config.ts
```

The first type command is historical: current checker intentionally requires a
unique `NATIVE_TYPES_RUN`. Scoped Biome formatting/checking was also executed;
no suppression, root formatting or edits to protected files were applied.

Lightweight final authoring checks and sealing (not a browser rerun):

```sh
NATIVE_TYPES_RUN=types-authored node tests/pagination-policy/native-browser/check-types.mjs
node node_modules/@biomejs/biome/bin/biome check tests/pagination-policy/native-browser
python3 scripts/check_docs.py
python3 -B scripts/test_check_docs.py
node tests/pagination-policy/native-browser/guard.mjs after
node tests/pagination-policy/native-browser/seal.mjs
```

**Deferred to main's one final verification phase**, after inspection/integration:

```sh
NATIVE_BROWSER_RUN=main-final NODE_DISABLE_COMPILE_CACHE=1 node node_modules/@playwright/test/cli.js test --config tests/pagination-policy/native-browser/playwright.config.ts
```

Choose a never-used generation. Browser config binds only `127.0.0.1:6541`, refuses
reuse, timeout30s/expect5s/retries0/one worker, explicit absolute JSON/output paths,
and overrides all JSON report environment controls into that own generation.
Reports/screenshots/traces and Vite cache stay under this folder's `.artifacts`.
Current generation guard/report confinement changes themselves still await the
deferred browser launch. No own persistent server was started outside Playwright.

## Seals and limits

The before guard verified all **105 source files**, **742 existing input files**
(including sources/docs/config/tests/manifests/lock) and **8 installed patched runtime/
declaration files**. It invokes the existing read-only runtime byte CLI; no profile
is reapplied. Expected full source map:

```text
497a1e37cd60c4080243847760e23526b8fe7cb033627ead9c7042d3ca0b0790
```

The after guard compares bytes/modes and installed assets to that initial snapshot.
The own handoff JSON contains installed versions/browser descriptors, exact historical
report statistics, the new authored-test aggregate and every retained artifact hash
(excluding disposable Vite cache and the manifest itself). Original reports remain
separate generations; the two failed cases are never relabeled passing.

Browser target is the cached Playwright1.65.1 Chromium installation, Linux,
1280×800 Desktop Chrome device settings, no all-browser/version/device rollout.
No axe run, WCAG/AA certification, manual AT, performance benchmark, new Next/Start
build, backend authorization, packed-consumer or release acceptance. Current branch/
HEAD are supplied context, not reverified with Git. Main must independently review,
batch-run and resolve remaining failures before counting browser evidence. Root docs/
TASKS/navigation are read-only here; main owns any needed discovery link/intake.
