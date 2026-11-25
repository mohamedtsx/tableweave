# Headless Start facade — wired source, runtime UNRUN

WP-11 / TASK-019 / FR-01/13/14/16, AC-01/22–27. This is a new actual Start app
source: createStart/getRouter, standard file routes, root document, loader, error/
retry/navigation, one SDK Query SSR provider/integration, real server functions and
two useDataTable headless views. It is **not another unmounted recipe**, but its
generated assembly, build and execution are intentionally not performed yet.
Do not equate source wiring/handwritten typing with a mounted or SSR-compatible app.

Main owns the exact manifest/lock. Pins equal the old Start app: Start1.168.61,
Router1.170.42/core1.171.35, SSR-query1.167.3, Query/core5.108.4, React/DOM19.3.1,
Table9.3.1, Vite7.3.8/plugin5.2.0, TS6.0.3. Existing framework declaration patches/
packageExtensions stay unchanged. No HeroUI/Tailwind/CSS/DnD or new dependencies.
The original G-04 app/routes/runtime/drivers/seals and Stage A/B remain unchanged;
their results are not inherited. KEEP DRAG BLOCKED remains binding; G-02 incomplete.

## Actual source/reader ownership

- Every getRouter call allocates its own QueryClient and parent bootstrap session.
  No request/cache/controller/lease is module-global. Public immutable synthetic
  transaction/inventory inputs are shared; server-only transformation/filter/sort/
  paging happens once over full INPUT, not over a displayed server page.
- Bootstrap is a real server-function response with unique receipt, dataset/scope,
  fixed UTC clock, normalized query and canary. The root loader awaits both domains
  and a **constant-key request-local canary** Query result. A global QueryClient
  would reuse a foreign canary and fail adoption, not quietly pass key isolation.
  Optional synthetic cookies `wp11-facade-dataset=alpha|beta` and
  `wp11-facade-availability=closed` are fixture inputs, not production credentials
  or backend authorization. UI choices are local requested inputs, never persisted.
- Query integration calls original hydrate to validate/prepare descriptors; an outer
  callback awaits actual SDK initial hydration before cache adoption and a private
  local lease. deserializeData validates exact prepared response envelopes BEFORE
  Query mutation and rejects ended/foreign/invalid/duplicate-row data. No first-time
  certificate, row-count grant or unsafe DTO cast is used.
- Route verification still follows the hydrate callback. Only the actual committed
  TablePage attach, with matching loader receipt and live local parent lease, creates
  retained child D/C/P/resources. Strict re-attach and Hide/Show find the same owners.
  UI cleanup does not disconnect sources or erase parent Query data.
- Child initial P retirement always clears its own resource/request bindings/drafts/
  real C selection/details. It never calls parent removeQueries. Activation issues
  actual beginControlsRequest bindings; queryClient.query uses the same key/clock/
  30-second freshness options. Cached fresh hydration should avoid a second reader;
  stale input is a real refresh, not relabelled hydration success. This needs execution.
- Search/page/selection/retry use genuine public models/authority/native rows. Two
  independently retained child controllers share only the explicitly parent-owned
  authorized synthetic cache. No accepted query mirror/native-output cache/fake row.
- Real source end closes parent lease/command guards first, retires every child,
  cancels/removes parent cache/canary, then notifies parent observers. Failed child
  disposal stays closed with explicit debt and Retry source cleanup. Late/aborted
  candidates cannot close a newer source; unsupported speculative route preload
  rejects before touching current state. Explicit recheck requires a real new reply.
- onBeforeNavigate conservatively retires a departing path before next loading.
  Server parent cleanup is registered before SQ appends its teardown, through typed
  onServerSsrAttach/onCleanup. No middleware-finally stream disposal/framework-only
  cleanup calls. Browser pagehide/HMR close the actual application; event removers
  are owned by the session. BFCache restoration requests a fresh document. HMR is
  an end boundary, not a promise that SDK's retained HMR router can revive this owner.

The server allocates no C/P/DOM authority. Server snapshot and first client view are
neutral; actual rows require the library's genuine committed useDataTable frame.
No owner/model/authority/function/signal is serialized. Signals stay local through
createIsomorphicFn → server reader or client RPC call options. DTO/record validation
is real and rejecting; public synthetic isolation is NOT a production auth promise.

## Authoring and final commands

Only the scoped source lane may run now:

```sh
node tests/workbench/wp11-start-facade/light.mjs FRESH_LABEL
```

`tsconfig.source-light.json` includes handwritten application/source/reader/view,
start/config declarations and a public SDK method-type probe. Strict/noEmit/exact
optional/skipLibCheck:false remain. It excludes router.tsx/register.d.ts/file routes
and missing real routeTree.gen.ts. Static syntax/full scoped Biome still cover those
handwritten files. The normal tsconfig.json has no source alias and includes the
whole app; it has NOT passed. No generated tree/types/ambient mock are hand-authored,
old global Register is not imported/renamed, and no type suppression/context cast
substitutes for generated assembly. Vite plugins have not been invoked.

Only in the user's FINAL phase after main authorization, from repository root:

```sh
pnpm build
pnpm --filter @tableweave/example-start-facade build
pnpm --filter @tableweave/example-start-facade typecheck
node node_modules/@playwright/test/cli.js test --config tests/workbench/wp11-start-facade/playwright.config.ts
WP11_START_PRODUCTION=1 node node_modules/@playwright/test/cli.js test --config tests/workbench/wp11-start-facade/playwright.config.ts
node node_modules/vitest/vitest.mjs run --config tests/workbench/wp11-start-facade/vitest.config.mjs
```

Real generation is enabled and supplies the SDK's production route manifest. Strict
development/production fixture port6573; production host is a local acceptance host,
not deployment. Bare runtime library imports resolve actual ESM public emitted
exports through finite aliases (also for plain shared fixtures outside the app's
dependency directory), with declaring-app React. There is no runtime source alias.
Current emitted outputs are not inspected as proof of this revision.

Details/builder/sort/menu/date/dark/RTL catalog coverage remains in unchanged Stage A;
this headless app does not claim to replace the complete WP-11 scene matrix. Actual
generation/whole-app typing/SSR hydration, HTTP abort/stream cleanup, late/ABA/debt,
BFCache/HMR, current ordinary archive/dual TS, independent/manual/AT/device/CI and
full release requirements remain final/unrun. Exact evidence/gaps/portable receipts
are in `tests/workbench/wp11-start-facade/README.md`.
