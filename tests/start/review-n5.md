# WP06 n5 correction handoff — 2026-11-24

**Candidate for independent rereview, not G04 approval.** Work remained in
`/tmp/opencode/tableweave-wp06` under the original isolated app/test-fixture
ownership. Main owns TASKS/REVIEW/canonical docs, manifests, dependency patches,
UPSTREAM and the four compatibility/packed/preparation/client-check runners;
none was edited. No Git action, install, dependency/runtime change, core producer
edit, reference mutation, unrelated server kill, or approval claim occurred.

## Authorization and completion boundary

- Request: reproduce then fix the actual loader authorization-denial lifecycle;
  prevent retained wrappers/allowed props from restoring revoked private state;
  guard stale denial generations/identities; preserve ordinary unavailable/unmount
  and StrictMode behavior; add definition-transition and duplicate-read evidence.
- Writes: `apps/example-start/**` excluding package.json/tsconfig.json, plus this
  worker evidence under `tests/start/`. Earlier n2–n4 evidence is historical and
  its 21-test fingerprint does not cover this new candidate.
- Dependencies: accepted native/resource producers and the already installed exact
  Start/Router/Query/React/Vite profile; main's existing strict declaration repairs.
- Completion: independently reproduced failing dev/production regression, repaired
  application boundary, original 13 tests retained, corrected 27-test suites and
  strict/build/client checks passing. Independent approval and packed/root checks
  remain main-owned and outstanding.

## Before-fix reproduction

The supplied rereview reproduction path
`/tmp/opencode/wp06-rereview-ZWq8a2/apps/example-start/review/lifecycle.spec.ts`
was absent when read. The app-owned regression reconstructs the reported actions:
hydrate Alpha, select a row, retain inspection/reconnect closures, set the actual
cookie to `revoked`, click existing **Reload authorization** (`router.invalidate`),
wait for the committed error view/unmount, inspect and reconnect the old wrapper.
Only synthetic counts/identities are exposed; no records/criteria/credentials.

Before behavioral repair:

```sh
WP06_PORT=6431 pnpm --filter @tableweave/example-start test:e2e tests/bootstrap-denial.spec.ts
pnpm --filter @tableweave/example-start build
WP06_PORT=6431 WP06_PRODUCTION=1 pnpm --filter @tableweave/example-start test:e2e tests/bootstrap-denial.spec.ts
```

Both modes failed the **one added n5 regression** on retained `demo:alpha` row
cache. The production run's captured synthetic state additionally established:

| State after committed error | Before reconnect | After reconnect |
| --- | --- | --- |
| access / serverAccess | true / true | true / true |
| active / canSelect | false / false | true / true |
| visible resource rows | 0 | **10** |
| cached scopes | demo:alpha | demo:alpha |
| constant-key canary | Alpha retained | Alpha retained |

Artifacts are preserved separately as
`.artifacts/start/review-n5-before-development` and
`.artifacts/start/review-n5-before-production` (including traces/error contexts;
production also includes the captured state attachment).

## Repairs

- `reader.server.ts` returns safe discriminated **BootstrapOutcome** and
  **CanaryOutcome** on actual actor denial, just as rows use RowsOutcome. No
  requested-mode inference, error-string parsing or UI-only permission policy.
- `authorization-session.ts` creates one **application authorization owner per
  router/request**, alongside the existing one QueryClient/provider. Loader
  request generation plus captured prior-grant identity reject obsolete denials.
  Current typed denial synchronously terminates the resource and clears private
  row/canary caches before route unmount can preserve them for reuse.
- Grants partition Query keys by scope, definition and authorization generation.
  Explicit authorized restoration after revocation gets a **new grant**, not a
  revived old wrapper. Ordinary same-grant unmount/cache reuse remains valid.
- `runtime.ts` checks the grant on exposed client/server snapshots, context writes,
  requests, outcome acceptance and reconnect. Reconnecting with the old original
  `access: true` expected context remains terminal after denial, even after a new
  authorized session commits. Selection/details/option labels and request tokens
  clear through the synchronous invalidation path.
- Definition/scope/grant replacement is accepted only at layout commit. That
  retires the previous grant and disposes its controller. New private construction
  and abandoned/Suspense renders do not mutate the committed controller/cache.
  The existing abandoned-render regression still passes.
- Same-grant page-two revalidation prefetches the accepted current query, rather
  than needlessly invalidating/fetching initial page zero. Loader and observer
  retain the exact shared options/freshness policy. Tests prove **zero additional
  row POSTs and server reads**, preserving page two and selection. Scope and actual
  native-definition replacements each prove **one**, not duplicate, row POST.

## Coverage and final verification

`tests/bootstrap-denial.spec.ts` adds six cases:

1. Current loader denial clears cache/access/server snapshot/selection and blocks
   old-wrapper reconnect; fresh authorized restoration has a distinct grant and
   still cannot restore the old wrapper.
2. Delayed real Alpha bootstrap denial cannot revoke committed Beta.
3. Delayed real Beta bootstrap denial cannot revoke committed Alpha.
4. Ordinary bootstrap transport unavailability does **not** infer permission loss;
   legitimate old cache reconnect remains possible.
5. Actual authorization loss between successful bootstrap and canary is terminal.
6. Definition-only change uses a different actual native definition, clears
   selection, disposes the old controller and issues exactly one row POST.

Stale-bootstrap tests await both actual router invalidations to settle, rather
than assuming a fixed sleep proves the delayed outcome was handled. The original
13 integration cases plus the prior eight authorization cases remain: **27 total**.
Final captured n5 state is access/serverAccess/canSelect false, zero resource and
server rows, empty cached scopes and no canary **both before and after reconnect**.

All runs used isolated port **6431**; main's 6013, reviewer 6025 and source UI
6429/6433 servers were not touched.

| Command | Final result |
| --- | --- |
| `WP06_PORT=6431 pnpm --filter @tableweave/example-start test:e2e` | 27/27 passed, 2.0m |
| `WP06_PORT=6431 WP06_PRODUCTION=1 pnpm --filter @tableweave/example-start test:e2e` | 27/27 passed, 1.4m |
| `pnpm --filter @tableweave/example-start typecheck` | strict TS 6.0.3 passed |
| `node node_modules/typescript-5-9/bin/tsc -p apps/example-start/tsconfig.json --noEmit` | strict TS 5.9.3 passed |
| `pnpm --filter @tableweave/example-start build` | real Start client/SSR passed, 367/148 transformed modules |
| `pnpm exec biome check apps/example-start/src apps/example-start/tests apps/example-start/vite.config.ts apps/example-start/playwright.config.ts` | 24 files passed, no fixes |
| `node tests/start/check-client.mjs` | five client chunks passed server-marker exclusion |

Additional final full runs captured successful attachments and exact timings:

```sh
PLAYWRIGHT_JSON_OUTPUT_FILE=/tmp/opencode/tableweave-wp06/.artifacts/start/review-n5-final-development.json WP06_PORT=6431 pnpm --filter @tableweave/example-start test:e2e --reporter=list,json
PLAYWRIGHT_JSON_OUTPUT_FILE=/tmp/opencode/tableweave-wp06/.artifacts/start/review-n5-final-production.json WP06_PORT=6431 WP06_PRODUCTION=1 pnpm --filter @tableweave/example-start test:e2e --reporter=list,json
```

Results: **27/27 dev (125.477s), 27/27 production (40.200s)**; zero unexpected,
skipped or flaky results. These JSON files include the n5 state and 25 initial
bootstrap timing attachments each.

### Focused initial hydration calibration

An intermediate dev full run reproduced the reported five-second hydration
timeout: **26/27** passed; only first initial hydration failed. Preserved trace:
`.artifacts/start/review-n5-dev-cold-start-timeout/trace.zip`.
HTTP SSR returned in **632.638ms**; 110 local requests were recorded, with **39
module requests still pending when the deadline closed Chromium** and the last
module request starting at **5662ms**. This does not establish a lifecycle source
bug or justify relaxing race assertions.

Only initial hydration now uses the **existing bounded Playwright test deadline**
(30 seconds in this installed config), via `tests/bootstrap-ready.ts`. No test or
global assertion timeout, retry count, production runtime flag or transition
deadline changed; no readiness sleep/retry was added. Positive timing evidence:
final dev's first navigation was **883ms**, actual hydrated state **6052ms** from
navigation start (**5169ms after navigation**). The original five seconds was
insufficient for that observed healthy cold load. Production's first sample was
300/589ms navigation/hydration; its maximum hydration sample was 1331ms.

## Source fingerprint

25 application code/config files: files below `apps/example-start/src` except
generated routeTree.gen.ts, all app tests, vite/playwright configs and serve.mjs.
Sort repository-relative paths; aggregate UTF-8
`path + NUL + sha256(file) + newline`, then SHA-256:

`88438df5a0ef6c7fd044efe7bc02f4badfdd99826a46f962a8530a6a4ae447de`

App README (excluded from that code fingerprint) SHA-256:
`70d907113dea0a78840fc06c000dc24571574cda3761c77fe4d7d1101991c435`.

| Production chunk | Bytes | SHA-256 |
| --- | --- | --- |
| index-BxiERFyq.js | 427530 | ad314f8adb4d7f54b974a13873bc6de2831579694e3c1fb8fbf17dd9cd1f3e30 |
| lifecycle-CyCyvEA2.js | 1322 | aba2a623397c40a579f4d1d3be096a684f7d52a463e3a829cfc559c4bd89c82d |
| routes-CGgdx-kW.js | 322 | 1dc0a0b470668e87fcbca5847c318df1cf81a9733f7fb493e85ac02f358a883c |
| routes-DQXiQjvD.js | 293 | 4da33edcfa52108a4bd61ac1554b5a8cf1a8691e3007c6f3d5ab5031140b1e47 |
| session-DJCwM4U5.js | 104059 | dee122e642ff3303d9df2e31b4c315c65074c645a2d5618e670ac3cdc5826ad3 |

## Exact next action and limits

Main: independently rereview this fingerprint, including loader generation/grant
handling and retained-wrapper terminality; then rerun the main-owned packed
consumer and combined root checks on **this** corrected source. Prior packed
results cover older candidates and must not be reused. Main records disposition
and handles any separately authorized Git/PR delivery; no merge is authorized.

Upstream unused-import warnings and intentional cancellation AbortError diagnostics
remain visible. Synthetic cookies/authorization and local Chromium/Node hosting
do not prove production auth, actual consumer integration, Safari/mobile/manual
AT, performance, publication readiness or personal maintainer acceptance. G04 is
**still not approved** by this worker handoff.
