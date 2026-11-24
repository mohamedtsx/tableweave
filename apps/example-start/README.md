# Synthetic Start + Query integration (WP06)

This private feasibility app uses real TanStack Start streaming HTTP SSR, not
`renderToString`. It consumes Tableweave's public native/manual-server and plain
resource producers. Synthetic cookies/fixtures are **not production auth**, a
database translator, real-consumer acceptance or a final styled table.

## Run from the repository root

Dependencies are main-owned and already exactly pinned. No install command is
implied by these worker checks.

```sh
pnpm --filter @tableweave/react build
pnpm --filter @tableweave/example-start build
pnpm --filter @tableweave/example-start typecheck
pnpm --filter @tableweave/example-start test:e2e
WP06_PRODUCTION=1 pnpm --filter @tableweave/example-start test:e2e
node tests/start/check-client.mjs
```

For manual inspection, `pnpm --filter @tableweave/example-start dev` uses port
6013. Production browser checks use `node serve.mjs` inside the app: a small
local Node host forwards real Web Requests to **built Start's default server
entry** and streams its responses. Its explicit response-close AbortSignal is
necessary: the initial Vite-preview production attempt passed other scenarios but
failed reader-side cancellation. `serve.mjs` is not a hosting/deployment promise.
Never run dev/production/packed tests concurrently on 6013.
For an isolated worker run, prefix browser commands with `WP06_PORT=6431`;
the test server receives the same port through `PORT`.

Generated Start route trees and `.tanstack`/dist outputs are ignored. Browser
traces/results are isolated under `.artifacts/start/` and contain synthetic data.

## Actual integration boundary

- `src/router.tsx`: QueryClient constructed **inside getRouter**, one
  `setupRouterSsrQueryIntegration` provider/dehydration/hydration owner. No global
  QueryClient or independent HydrationBoundary.
- `src/routes/__root.tsx`: filesystem root document, HeadContent/Outlet/Scripts;
  Start default client/server entries remain in use. StrictMode is exercised in
  development.
- `src/routes/index.tsx`: derives validated bootstrap query/clock/IDs/locale/TZ
  before reading rows; awaits `queryClient.query(rowsOptions(input, grant))`, then uses
  the same factory in the component's `useQuery`. A deliberately **same-key**
  actor canary proves request-local isolation, beyond differing row scope keys.
  The shared loader now lives in `src/rows/bootstrap.ts`: every explicit
  authorization revalidation re-reads the constant-key, scope-tagged canary.
  Same-grant revalidation prefetches the accepted current query (not an unwanted
  initial page) and preserves shared freshness, avoiding duplicate row reads.
- `src/rows/authorization-session.ts`: request/router-local application authority
  beside the one QueryClient. Safe typed bootstrap/canary denial revokes the current
  grant synchronously, before a route error merely unmounts the UI. It clears
  private row/cache/server-snapshot/token/selection state. Request generation and
  prior-grant identity reject stale denials in either scope direction. Only a new
  authorized bootstrap can restore access, with a new cache/session generation.
- `src/rows/session.tsx`: an explicit definition/scope/grant-keyed authorization
  boundary creates a private new runtime without mutating a committed one during
  render. For identity replacement, only layout commit retires the previous runtime, clears its private
  state/tokens/server snapshot/cache, disposes its controller and purges older
  scope/definition/grant queries. The resource
  render guard receives the new authoritative bootstrap context. Same-identity
  revalidation preserves accepted page/selection and same-query failure policy.
- `src/rows/transport.ts`: `createIsomorphicFn` calls the authorized reader
  directly on SSR; browser calls the installed Start POST RPC with **signal as a
  call option**, never serialized data. No relative Node fetch.
- `src/rows/functions.ts` / `reader.server.ts`: independent schema/operator/owner/
  sort/limit validation and allowlisted synthetic actor/scope authorization on
  every read. Filter then multi-sort then page, ID tie-breaker. No raw backend
  construction. Criteria do not enter URLs. Responses are private/no-store;
  `src/start.ts` enables the matching installed CSRF middleware.
  An outer request middleware establishes private/no-store before CSRF and input
  validation and preserves it on early responses. Start's malformed RPC input
  response remains HTTP 200 with a serialized error; CSRF denial remains 403.
- A real server actor/scope denial returns the safe discriminated `RowsOutcome`
  (`access-lost`), not an error message to parse. Query converts that outcome to a
  local typed error; the runtime maps it terminally only for the exact current
  token. It never infers permission from a requested test mode. The Query observer
  unmounts on access loss, so it cannot recreate a removed private cache entry.
- `src/rows/runtime.ts`: app-owned typed composition of `createResourceAdapter`,
  `createNativeController` and Query. Authorized fresh cache data seeds an
  immutable SSR/first-client resource snapshot; the producer's intentionally empty
  server snapshot is not misrepresented as prefetched rows. Exposed snapshots,
  context writes and reconnects also check the application grant; even the old
  wrapper's original allowed props cannot revive a revoked grant. Real unmount clears
  the buffer; StrictMode reconnect promotes only matching non-invalidated fresh
  cache data without another network read.
- Accepted query callbacks synchronously `begin` intent before transport, and
  checkbox event handlers re-check current resource authority. Every refetch gets
  a new opaque resource generation; the logical request key remains stable for a
  same-query refresh. Query cancellation and exact resource tokens guard late/ABA
  outcomes. Retry targets the current query. Successful empty data replaces prior
  records, including before one bounded page correction.
- Native `useNativeTable(..., { mode: 'server', records, pageInfo })` uses actual
  displayed resource records/metadata. Footer ranges come from **snapshot.query**,
  not requested state. Unknown next flags are explicit. No fabricated row objects,
  all-matching selection, sortable persistence or client reprocessing of pages.
- Access loss clears resource rows/tokens, app selection/details/option labels,
  pending requests and scoped Query cache; stale allowed props cannot revive it.

The fixed 30-second freshness window is app example policy, not a library default.
Focus/reconnect refetching is deliberately app-managed here; no universal retry,
storage, URL persistence, telemetry or third-party data service is added.

## Evidence and limits

`tests/integration.spec.ts` exercises actual HTTP HTML-before-JavaScript,
concurrent actor/scope and same-key canary isolation, hydration/StrictMode with
no duplicate fresh read, synchronous stale-target guards, failure/Retry/empty,
same-key generations, real reader cancellation, late outcomes, unknown totals,
bounded shrink, terminal access loss, malformed/unauthorized HTTP input and CSRF.
`tests/start/check-client.mjs` checks production chunks for server reader/fixture
markers and prints SHA-256 hashes.
`tests/authorization.spec.ts` adds real cookie/loader changes, ordinary Refresh
with actual denied authorization, abandoned/Suspense bootstrap, scoped ABA, a
delayed real denial after a new scope commits, and validation/CSRF cache headers.
`tests/bootstrap-denial.spec.ts` adds loader-denial/reconnect/restoration, delayed
bootstrap denials in both scope directions, real denial between bootstrap/canary,
ordinary transport failure without accidental revocation, and an actual
definition-only native replacement/controller disposal. Transition tests assert
one row POST for scope/definition changes and none for same-grant page-two
revalidation. The original 13 tests remain (27 total).
Initial hydration alone uses the existing bounded Playwright test budget, with
navigation/ready timings attached; transition/race deadlines and retries are not
relaxed. A cold dev failure at five seconds had 39 Vite modules still pending.
The `/lifecycle` route is an explicit synthetic concurrent-render fixture. The
read-only inspection exposes counts/synthetic identities only, never records,
criteria or credentials; separate acceptance actions invoke the existing router
invalidation and retained resource reconnect/context APIs.
See [earlier review corrections](../../tests/start/review-n2-n4.md)
and [n5 correction evidence](../../tests/start/review-n5.md).

The initial production build passed before strict typing. Main then applied the
recorded exact declaration/dependency repair in
[`tests/start/UPSTREAM.md`](../../tests/start/UPSTREAM.md); actual strict app/config
typing now passes without compiler relaxation or runtime version changes.
The original app worker applied no dependency repair. Start's current upstream
abort path also emits AbortError stack diagnostics
on intentional canceled requests; these contain no app records/criteria, but are
not represented as a silent production logging policy.

Main completed frozen/actual packed/root checks and independent n1–n6 corrections.
The [canonical evidence](../../docs/evidence/wp-06-start-2026-11-24.md) records
**agent-approved under delegated authority** for private WP-06/bounded G-04,
including27+27 source and27+27 actual-tarball cases. This is not personal maintainer
acceptance, actual Safari/mobile/manual AT, performance, production auth, real
consumer or release readiness. The separate PR must remain unmerged.

## Exact upstream versions inspected

Start 1.168.61 / Router 1.170.42 / router-core 1.171.35 / React Query and query-core
5.108.4 / react-router-ssr-query 1.167.3; React/DOM 19.3.1; Table 9.3.1;
Vite 7.3.8 / React plugin 5.2.0; TypeScript 6.0.3 / Playwright 1.65.1.
Installed default Start entry uses `createStartHandler(defaultStreamHandler)`;
installed SSR Query integration adds the QueryClientProvider itself. Installed
Query 5.108.4 implements `queryClient.query` (older fetch/ensure methods are
deprecated). No newer-generation API was guessed.
