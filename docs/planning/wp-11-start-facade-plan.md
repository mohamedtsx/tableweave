# WP-11 mounted headless Start facade — bounded source authoring

TASK-019 / FR-01/13/14/16, AC-01/22–27. Main selects standard Start file routes,
not the disabled-generator variant in the read-only
`/tmp/opencode/wp11-start-mount-boundary/PLAN.md`. Actual pinned plugin source
requires generator output for the production route manifest. The final phase owns
real generation, full route assembly/typing and build/SSR/hydration proof. Do not
hand-author routeTree.gen.ts, generated types or SDK globals to make LIGHT green.

## Isolation, dependencies and paths

Main creates `/tmp/opencode/tableweave-wp11-start-facade` from39363f4, branch
feat/wp11-start-facade. Main alone writes a NEW apps/example-start-facade/package.json
with exactly the old Start app's direct pins; no HeroUI/Tailwind/styled dependency.
Only an additive new importer is permitted in the isolated lock. Resolve lock-only
with scripts disabled, inspect old blocks/profile, then frozen ignore-scripts install.
Stop on any old lock/profile drift. No new dependency version, patch, extension,
native installer permission, old G-04 rewrite or primary/Next lock mutation.

Main preserves this isolated manifest/lock stage asf7ad033. Direct dependencies
and devDependencies equal the original Start app's exact pins. All5 old importers,
468 package blocks/468 snapshots/settings/profile and155 library hashes match;
only the new55-line importer is added. Lock digest190f5b37… and app manifest
73048928… are recorded at `/tmp/opencode/wp11-start-facade-lock-review.json`.
Frozen ignore-scripts install passes367 packages, all reused/zero downloads. No
framework/native/module/generator invocation occurs. Main may activate the exact
source writer below with those inputs protected; install is not compatibility proof.

One source writer, only after the installed-byte handoff, owns NEW:

- apps/example-start-facade/{vite.config.ts,tsconfig.json,tsconfig.source-light.json,
  README.md,.gitignore}.
- src/{router.tsx,start.ts,register.d.ts} and routes/{__root.tsx,index.tsx,away.tsx}.
- src/application/{types.ts,codec.ts,query-options.ts,bootstrap-session.ts,
  table-source.ts,functions.ts,transport.ts,reader.server.ts}.
- src/table/{HeadlessTable.tsx,TablePage.tsx}.
- tests/workbench/wp11-start-facade/** (own evidence and deferred fixtures).

All155 library sources, preserved Stage A/B, old Start/Query producer, existing
manifests/lock nodes/profiles/seals and other workers' paths remain fixed. Main
owns Git/docs/manifests/lock/intake. No worker install or framework/module/server/
generator/runtime test execution. New strict dev/preview/browser port6573.

## Application ownership and actual mount

Use real createStart/getRouter, standard file routes/document/loader/provider/
error/retry and server functions. The new app must wire a genuine useDataTable
headless view; it is not another unmounted recipe. Runtime uses emitted public
exports; source aliases belong only to the new LIGHT compiler config.

Each router/request owns its QueryClient and a parent bootstrap session. Server
loader awaits actual bootstrap and row/canary queries from immutable synthetic inputs
using the same normalized wire query/clock/key as client reads. No server C/P or
browser authority. Only validated JSON receipts/envelopes dehydrate; no C/P/model/
resource/lease/function/AbortSignal crosses the wire. Public synthetic isolation
is not production authentication. Receipts are tied to actual response transport,
not invented from scope names, row counts or an access boolean.

The actual Query hydration callback must finish before parent cache adoption.
Reject ended/foreign envelopes through the supported pre-write deserializeData
hook, not post-observer cache deletion. Child activation waits for verified loader
receipt at real page commit; preload candidates cannot activate a live source.
Parent retains child D/C/P/resource above optional UI and Strict effect replay.
Child initial P retirement always clears its own records/bindings/requests/drafts/
selection/details but does not own independent parent Query cache. Fresh cached
query adoption must not perform a duplicate fresh reader call or relabel stale data.

UI cleanup only releases UI attachments. Real navigation/access/realm/end first
closes parent leases and retires child state before observers; then clears that
parent's Query partition/bootstrap/canaries. New data requires actual new validated
receipt/new owners after successful retirement. Keep blocked cleanup debt closed
and explicit. Query/page refresh retains C/P, with exact request bindings and local
AbortSignals; no accepted query/native-output mirror, permitting test certificate,
per-query remount, optimistic cache or automatic URL/storage persistence.

Use actual typed router lifecycle/subscription and serverSsrLifecycle.onServerSsrAttach
→ onCleanup. Do not dispose streaming state in middleware finally before response
consumption. Browser pagehide/HMR end owns explicit cleanup/removers; ended BFCache
return needs a fresh bootstrap/document. No timer/unmount heuristic or module-global
data-bearing owner. Navigation denial/retry/cancellation must not restore an old
grant or allow a superseded candidate to retire a newer source.

## Evidence and stop gates

Capture actual155-source/entire-old-input hashes/modes first. Allowed now: strict
positive TS6/noEmit for handwritten source/reader/view/SDK contracts, static entry/
graph/ownership checks, syntax/full scoped Biome and pinned compiler inputs. LIGHT
excludes generated-dependent route assembly and says so explicitly; it must not
silence diagnostics using casts/suppressions, fake augmentation or relaxed strictness.

Author unskipped two-domain concurrent SSR/canary/request isolation, fresh-read
hydration, Strict/UI hide versus app-end, late/ABA/denial/abort, stream cleanup,
navigation/BFCache/HMR, ordinary current-archive and negative/dual/browser fixtures.
Every framework/generator/whole-app type/build/module/unit/HTTP/SSR/browser/negative/
packed/CI/independent/manual check remains final and UNRUN. No old G-04 evidence
is inherited, resealed or renamed. Stop on a missing public ownership/hydration/
cleanup API, old-input drift or additional dependency/profile requirement. No new
source permission is inferred from this plan beyond the exact writer lease.

Main reviews source receipts and actual public call ordering before preservation.
Drag/G-02 remains user-blocked; full WP-11 and WP-12–WP-15 remain incomplete.
