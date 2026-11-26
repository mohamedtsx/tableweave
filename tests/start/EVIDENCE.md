# WP06 worker observations — 2026-11-24

Working tree: `/tmp/opencode/tableweave-wp06`, supplied branch
`work/wp-06-start-query`; no Git command/write or commit was performed by this
worker. Main supplied the accepted producers and strict exact dependency install.
Only app-owned files (not package.json/tsconfig.json) and `tests/start` were edited;
package builds and ignored local verification outputs were generated as authorized.

This is a worker handoff, **not independent approval or a G04 acceptance claim**.
These initial13-test observations are historical. Later independently corrected
27-test source and actual-tarball suites plus the main guarded full workflow are
recorded in [canonical final evidence](../../docs/evidence/wp-06-start-2026-11-24.md).

## Exact final commands/results

| Command from worktree root | Observed result |
| --- | --- |
| `pnpm --filter @tableweave/react build` | Passed; actual public resource/native declarations and ESM generated |
| `pnpm --filter @tableweave/example-start build` | Passed; actual Start client + streaming SSR production output, 360/141 transformed modules |
| `pnpm --filter @tableweave/example-start test:e2e` | **13/13 passed**, final run 28.2 seconds, dev Start + Chromium |
| `WP06_PRODUCTION=1 pnpm --filter @tableweave/example-start test:e2e` | **13/13 passed**, final run 18.3 seconds, built Start default entry + app-owned Node acceptance host + Chromium |
| `pnpm --filter @tableweave/example-start typecheck` | **Blocked: 11 genuine upstream declaration diagnostics**, no remaining app diagnostic reported; see UPSTREAM.md |
| `pnpm exec biome check apps/example-start/src apps/example-start/tests apps/example-start/vite.config.ts apps/example-start/playwright.config.ts apps/example-start/serve.mjs tests/start` | Passed, 18 source/config/script files, no fixes |
| `node tests/start/check-client.mjs` | Passed; server reader/fixture markers absent from both actual production client chunks |
| `node tests/start/prepare-packed.mjs` | Passed **preparation only**, actual tarball and standalone app manifest created; no install/build/browser pass in isolated consumer claimed |

Final development and production test paths cover: concurrent actor/scope HTTP
SSR and constant-key canary; real rows in HTML; hydration/StrictMode without
duplicate fresh reads; same-event-turn obsolete checkbox guard; displayed/requested
page divergence and Retry-current; same-key failure generations; A→failed B→retry
successful empty B; actual browser RPC cancellation reaching reader; **real ABA**
with old uncancellable server completion measured and distinguishable old response
excluded; explicit unknown next flags; bounded authoritative shrink; terminal
access loss; nine malformed/unauthorized transport/query inputs; genuine POST RPC
CSRF cross-origin rejection and no criteria URL.

## Fingerprints

18 owned source/config/script files: all files below `apps/example-start/src`
except generated `routeTree.gen.ts`, all app test files, app vite/playwright
configs and serve.mjs, plus `tests/start/*.mjs`. Sort paths; SHA-256 each file;
aggregate UTF-8 `path + NUL + fileSha256 + newline`:

`571c776cd0064131c6b5bbde064194340f610af53728e633b84538694b3ae0cb`

Production client:

| Chunk | Bytes | SHA-256 |
| --- | --- | --- |
| `index-f26NUOFX.js` | 424104 | `bdea361d03be94056989004504a69f9f086524a9eb4f5e1c596f094525bf70af` |
| `routes-C0x0qSz3.js` | 100827 | `6c30107221bf9a81450f9831b6c95ed71d4b95aa36c747c3d17c8760886bc3b9` |

Prepared consumer:
`.artifacts/start/packed-zQlts7`, archive
`tarballs/tableweave-react-0.0.0-wp01.0.tgz`, SHA-256
`a9ea95f2f1fdda306a1d2df05150c64a5e377dabe775e93e9dc992edfca016dd`.
The app copy uses a file tarball dependency, not workspace aliases. Main must
perform its separately authorized strict installation and actual consumer checks.

## Corrections and explicit limits

- Fixed app-owned parseQuery result name (`data`, not `value`) and an initial
  over-broad bootstrap spread rejected by the app's strict transport validator.
- Fixed loader HTML assertion to account for React text-separator comments.
- Fixed same-query request identity (generation is the opaque token, not a new
  logical request key) and Query observer/imperative options synchronization.
- Fresh successful empty results now replace old rows even before bounded page
  correction; full unknown-last pages retain actual requested-page records.
- Strengthened the late-result test: the old server reader really starts and
  completes, and a same-key A after B cannot receive its marked old response.
- Initial production Vite-preview attempt failed reader-side cancellation while
  other checks passed. The explicit app-local Node Request/stream adapter fixes
  cancellation for actual built Start; no deployment target is claimed.
- Start emits upstream AbortError diagnostics on intentionally canceled requests;
  output has stack paths but no app records/criteria. Production build also reports
  three groups of unused vendor re-export imports. Neither warning is hidden.
- Strict declaration blockers remain unmodified; `skipLibCheck:false`, exact
  optional properties and strict checking remain enabled. No dependency install,
  patch, forced peer or ambient type stub was performed by this worker.
- No packed install/type/runtime/app build/browser pass, combined root check,
  independent review, personal maintainer acceptance, production auth/database,
  actual Safari/mobile/manual AT/performance/consumer or release gate is inferred.

Main's smallest next action: resolve the scoped declaration/dependency blockers,
integrate root discovery/clean-install and actual packed acceptance, then arrange
independent numbered review and rerun affected combined checks. No PR merge.
