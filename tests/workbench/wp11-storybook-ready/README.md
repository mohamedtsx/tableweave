# Static Storybook readiness harness

Scope: TASK-019 / FR-16 / AC-01/27. Main owns build selection, execution, source
corrections, ledger/evidence and preview lifetime. This directory adds no dependency,
source-runtime alias, vendor change or build step. **Keep drag blocked.** Existing
private development profile is not ordinary/packed/G-05/stable acceptance.

## Actual main executions — readiness still open

All outputs below are beneath OWN; failures, source frames and receipts are retained.
These runs are development-profile evidence, not ordinary consumers or clean CI.

| Run | Selected artifact / checks | Observed result |
| --- | --- | --- |
| browser-007 | build008; complete63-case inventory | 43 pass,20 fail; no unrun cases |
| browser-008 | build009;15 affected details/viewport/recovery/appearance checks | 11 pass,4 fail |
| browser-009 | build010; light/dark/Arabic RTL/details keyboard and axe | All4 pass, zero reported axe violations; no exclusions |

Build009/010 use exact frozen emission005 (300 public development files) while
query-safe admission source is under separate implementation. They do NOT verify
that newer source. Actual53-entry index and app typechecks pass. All five original
viewport overflow assertions and three detail stories pass in browser008. Main
reviewed actual screenshots; broader visual polish, latency, grouped/manual moves
and a fresh consolidated current-candidate run remain open. Full WCAG/manual AT,
SSR/framework/packed/ordinary/G-02/publication gates remain separate.

The focused context/owner-conflict `.test.ts` files are additional source-unit
checks; this Playwright config intentionally discovers only ready.spec.ts. Main's
live phase selections and active writer scopes remain in [TASKS](../../../TASKS.md).

## Selected main invocation only

`OWN` below means
`/mnt/data/Projects/tableweave-final-verification-cand001/wp13-run-cand001/storybook-ready`.
Use main's already-verified owned Node24.22.0 and existing root Playwright1.65.1;
never npx/install/download/browser fallback. First main must hand off one completed
build at **OWN/build-NNN/static** (001–999), containing real regular index.html,
iframe.html and index.json. No default build selection, live build polling, Vite,
other app, source repository serving, deployment or static-root fallback exists.

Before selected CLI startup, main supplies a cleared/explicit tool environment,
fresh HOME/TMP/XDG/npm paths, disabled telemetry/update/compile caches, and:

- `TABLEWEAVE_STORYBOOK_BUILD_DIR=OWN/build-NNN/static` (main's actual selected build)
- `TABLEWEAVE_STORYBOOK_RUN=LABEL` (fresh `[a-z0-9][a-z0-9-]{0,31}` value)
- `PLAYWRIGHT_TRANSFORM_CACHE_DIR=OWN/browser-LABEL-cache/playwright`
- `CACHE_DIR=OWN/browser-LABEL-cache`, `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`,
  `STORYBOOK_DISABLE_TELEMETRY=1`, `DO_NOT_TRACK=1`

Expand placeholders to actual selected values; they are not shell variables in source.
Both browser-LABEL and browser-LABEL-cache must be absent before main's invocation.
Do not precreate browser-LABEL: config reserves it exclusively before Playwright can
clear output. Transform cache is a sibling because config transformation precedes
config evaluation. Main must clear inherited TEST_WORKER_INDEX/TEST_PARALLEL_INDEX.
Workers reloading config use Playwright's own TEST_WORKER_INDEX (installed worker
entry sets it before config deserialization). Even a main `--list` consumes its run
label. Any replay/failed preparation requires a NEW label; never clean old evidence.
Check both filesystems' capacity (128MiB floor) before execution.

From primary, selected command shape (not executed by the author):

```text
OWNED_NODE node_modules/@playwright/test/cli.js test --config tests/workbench/wp11-storybook-ready/playwright.config.ts
```

Main may add `--max-failures=3` for first diagnostics; the remaining tests then stay
UNRUN, not passed/skipped acceptance. Config sets workers1/retries0, test30s,
expect10s, global600s. Failure screenshots and retained traces, JSON/HTML reports,
diagnostics, actual index/browser events and review screenshots go only beneath
OWN/browser-LABEL (transform cache: sibling browser-LABEL-cache). Native executable
is fixed1255, regular0755/size216255824/SHA256
24eb0a14de64ab0c9c2e283a5512ca817db64af8fd853cdb4d818f19a8e23b9b, verified before
launch. No runtime/browser provisioning or fallback is attempted.

## Coverage and evidence

catalog-check.ts registers first: HTTP index exact53 story IDs, nine import paths,
33 scene-map IDs plus20 literal legacy IDs, raw index attachment and actual live
browser.version()/CDP Browser.getVersion. Docs entries do not count as stories.
No CSF module is imported/evaluated to discover IDs.

ready.spec.ts imports the original wp11-catalog/browser.spec.ts through its .js
specifier; Playwright transforms to the existing .ts source. All33 authored DOM
cases and five viewport assertions remain unchanged. Twenty additional legacy
cases cover14 real authored plays and six render-only stories. Three focused
light/dark/Arabic-RTL axe/screenshot checks and a390px keyboard/details-form check
are separate, not another33-story sweep. Total authored cases:63.

Root hooks apply to imported tests too: page/console errors, HTTP errors, failed requests and
non-loopback6570 traffic fail; raw diagnostics are attached. Every iframe requires
the matching actual Storybook9.1.21 storyFinished success, no failed reporters or
framework exception events; ALL WP-11 completion surfaces must complete. This
pinned framework observation reads its own cached channel event, not library
private state, a fake marker or a second direct call to a story play function.
Preview-api/index.js:3981–4031 awaits authored plays and emits storyId/status/
reporters; channels/index.js:449–450/483 retains event args. Missing API is failure,
not a fixed sleep or fallback success. Controls additionally check their real DOM
completion marker; unmarked filter plays check public resulting DOM. Legacy async
options still asserts only failure/results, not successful retry.

Existing viewport tests produce320/390/768/1024/1440 screenshots. Appearance/details
checks retain raw axe results and require zero reported violations, with no rule
disabling, impact filtering or excluded descendants. This does not prove full
WCAG, AT/device/zoom/manual usability or visual approval. Main must review actual
screenshots against the read-only approved compact reference and record remaining
manual/product gates. No passing result is claimed by source authoring.

## Static server / preview handoff

The config starts ONLY serve-static.mjs with the caller's exact process.execPath,
fixed --port6570 and selected root. Bind/reuse failure stops; it never kills an
existing process or chooses another port. GET/HEAD only; invalid escapes, controls,
dot/traversal segments and symlink components are denied. Unknown files return404,
not SPA/index fallback. No API/uploads/auth/persistence endpoints. Static requests
are not backend authorization. SIGINT/SIGTERM close only this server.

After tests Playwright closes its server. Main may separately select the following
long-lived loopback preview, with the completed build path substituted:

```text
OWNED_NODE tests/workbench/wp11-storybook-ready/serve-static.mjs --dir OWN/build-NNN/static --port 6570
```

URL: <http://127.0.0.1:6570/?path=/story/wp11-configurations--fully-configured>.
No preview/server/browser command was run by this author. Syntax/format/source-only
checks, when recorded in handoff, are not test discovery, render or play evidence.
For the currently tested provisional appearance, NNN is010; remaining failures
above still apply. No long-lived preview server is currently promised by this README.

## Historical source-author verification

- Existing TS6 strict no-emit source check passes all six code files, including
  the unchanged imported old spec. Explicit ES2023/DOM, NodeNext, Node types,
  allowJs; checkJs=false (not strict JavaScript semantic proof). No compiler output,
  config import, story evaluation or browser/test execution.
- Owned Node --check passes paths.mjs and serve-static.mjs without executing them.
- Scoped Biome check passes six supported code files, with VCS disabled. Initial
  formatting/lint pass found test-module exports, assignment-in-expression and
  control-regex lint issues; all corrected within this new directory, no rule waiver.
- Python-stdlib read-only source-text comparison passes: nine modules,53 declared
  IDs/47 authored plays match legacy20 plus scene-map33; intended import declaration
  order and absence of test skip/fixme/fail/only directives checked. Not actual index
  discovery or execution order evidence.

Those source-author checks did not execute runtime. Main subsequently executed the
runs above,13 static-server protocol/bind/cleanup checks, and actual Storybook event/
Chromium identity checks. Next current-candidate execution still needs an explicitly
selected complete build and fresh label; do not overwrite old results or infer a
whole-catalog pass from the four appearance checks.
