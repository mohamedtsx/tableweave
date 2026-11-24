# WP-06 actual Start + Query SSR implementation plan

TASK-014 under the explicit delegated WP-04–WP-15 delivery grant. This plan
precedes app source and the scoped install. Main approves the bounded plan under
delegated engineering authority, not personal maintainer review. No PR merge,
publication, deployment, actual consumer/reference change or production auth.

## Inputs and observable outcome

WP-04's reviewed G-01 native/collection producer (`bf7712e`) and WP-05's reviewed
resource producer (`71f076c`, stacked as `e6eeabf`). The combined WP-05 workflow
is main-owned; app preparation is isolated in `/tmp/opencode/tableweave-wp06` on
`work/wp-06-start-query`. Final PR stacks only after producer Git/check handoffs.

WP-06/G-04, AC-22/23/24: actual Start streaming HTTP SSR prefetched with the same
normalized options as hydration; request-local QueryClients; concurrent synthetic
actors/scopes with no serialized data/cache leak; stable initial query/IDs/clock/
locale/timezone and no duplicate fresh reads. This is not bare renderToString.
Read [integration](../engineering/integrations.md), [security](../engineering/security.md),
[resources](../engineering/resources.md) and [native](../engineering/wp-04-native.md).

## Exact app-only dependency disposition

Main independently checked registry metadata on 2026-11-24: Start **1.168.61**,
Router **1.170.42**, router-core **1.171.35**, React Query/query-core **5.108.4**,
react-router-ssr-query **1.167.3**. These satisfy checked engines/peers with Node
24.22.0, React/DOM19.3.1, Vite7.3.8 and plugin-react5.2.0. Current Start1.169.7
requires Vite8; deliberately preserve the accepted tools, not a forced-peer or
silent root upgrade. Metadata is not installed/runtime/security acceptance.

All six integration packages stay app-only; native Table9.3.1 and the actual
private React package are consumed. Exact existing TS6.0.3, React types19.3.0,
Node types24.19.2 and Playwright1.65.1 support the fixture. No HeroUI/devtools/
Nitro/auth/ORM/RSC dependencies are needed. Main alone writes manifests/lockfile
and installs in the isolated worktree without shared node_modules symlinks.
No audit/upload, publication or package version upgrade is implied.

App compilation uses ESNext/Bundler, strict/noUnchecked/exactOptional checks and
skipLibCheck:false. App-only verbatimModuleSyntax:false follows Start's compilation
pattern; package/public consumer settings are unchanged. Unexpected upstream
strict failures need a recorded repair, not suppressed diagnostics or casts.

## Ownership and sequence

App worker owns `apps/example-start/**` except main-owned manifest/tsconfig, plus
`tests/start/**`. Main owns root config/check-discovery/install/lockfile, canonical
docs/TASKS/REVIEW, integration and Git. Producers remain read-only to app worker.
App proof uses port **6013** and isolated artifacts; no 6007/6008/6009/6010/6011
runner conflicts. Existing references are strictly read-only.

1. Verify installed exact APIs and producer exports. State/query exists before
   requests/native construction. No library Query/router/Start dependency.
2. Use Start's actual Vite plugin before React, filesystem routes, root document
   HeadContent/Outlet/Scripts and request-local getRouter/QueryClient construction.
   Exactly one setupRouterSsrQueryIntegration provider/hydration owner; no global
   QueryClient, duplicate HydrationBoundary or manual parallel cache owner.
3. Server derives an allowlisted **synthetic** actor/scope/bootstrap. Revalidate
   every query and authorize scope/fields separately. Prefer POST server-function
   criteria, matching CSRF middleware and private/no-store responses. No secrets,
   real auth assumptions, relative Node fetch or serialized AbortSignal.
4. Share options factory across loader `await queryClient.query(options)` and
   component observer. Genuine Query5.108.4 has query(); don't substitute a
   deprecated API from older examples. Browser/server isomorphic loadRows consumes
   cancellation and retains token/generation/key guards for uncancellable results.
5. Connect accepted native **manual server** and plain resource APIs. WP-05's
   default server snapshot is initially empty: define an explicit app/request-
   owned validated bootstrap adapter with the same stable server/first-client
   view, or propose a separately reviewed minimal producer extension. Do not
   claim HTML rows from Query prefetch while the resource actually renders empty.
6. Query transitions must synchronously tag resource intent before stale rows can
   receive new selection/reorder; fetching remains app-owned. Preserve real
   displayed page/query, current-query Retry, fresh empty, known/unknown flags,
   late failure/success and explicit scope/permission invalidation. Same-key
   refetch also needs a new generation; placeholder data is never fresh promotion.
7. Synthetic server reader processes filter → sort → page with deterministic ID
   ties and allowlisted field/operator mappings. Demonstrate invalid schema,
   owner/operator/tab/sort/limits/injection-like inputs fail safely. No real DB or
   production authorization is claimed. Dataset shrink correction is bounded.
8. Run actual dev **and production** Start HTTP/browser/hydration evidence and
   repeat against real tarballs without Tableweave source aliases. Check server
   reader/fixture internals absent from client bundle. Update actual commands.
9. Independent numbered n1 review, reproduce/fix/rerun, evidence-based delegated
   technical approval, commit and separate stacked PR. Never merge a PR.

## Required checks and stops

- Two simultaneous actor/scope HTTP requests get only their authorized fixture
  rows and serialized data. A same-key per-request canary must expose a global
  QueryClient bug even when ordinary keys contain different scope strings.
- Actual rows appear in HTML before JavaScript. Hydration has stable IDs/clock/
  locale/timezone, no mismatch warnings and no duplicate fresh reader calls.
- Cancellation reaches the real isomorphic reader/RPC call option; changed/same-
  key failure, out-of-order completion, Retry-current and fresh empty retain the
  producer's semantics. Full/short pages obey explicit next flags, not guesses.
- Actual tarball strict types/runtime/build/HTTP/browser proof and client/server
  code separation pass. Root commands must discover the new app/tests; the clean
  install harness must include its manifest. Main handles those shared changes.

Stop acceptance on failed peers/strict types/producer integration/SSR isolation;
do not weaken product scope or fabricate evidence. Synthetic actors are not real
authentication, backend permission/DB proof, manual AT, actual Safari/mobile,
reference performance, legal/publisher or actual consumer acceptance. No network
service/database/deployment provisioning, URL/storage persistence or telemetry.

## Candidate handoff (not acceptance)

The [app instructions](../../apps/example-start/README.md),
[worker evidence](../../tests/start/EVIDENCE.md) and
[packed/shared harness handoff](../../tests/start/README.md) record the actual
candidate. Development and production Start browser fixtures report 13 scenarios
each and actual production build passed. Strict installed-declaration errors
remain tracked separately; main integrates all required root/packed checks and
independent review before any delegated G-04 approval. No build/story/mock pass
substitutes for that acceptance.

## Strict Vite declaration repair disposition — 2026-11-24

Main independently reproduced all 11 strict diagnostics and reviewed a separate
read-only source/registry investigation. Before patch/install, main approves this
bounded exact repair under delegated engineering authority, not a product change:

- `@tanstack/start-server-core@1.169.40` declaration-only restoration of the exact
  `type _Algorithm = EncryptionAlgorithm | IntegrityAlgorithm` already present
  in shipped `src/session.ts`; its emitter removed an internal alias while leaving
  references. No new algorithm or runtime change.
- `@tanstack/start-plugin-core@1.171.50` declarations only: eight
  `import('@tanstack/router-plugin').CodeSplittingOptions` references in the base
  and Vite schemas use the genuine public `/vite` entry instead. Both re-export
  the same core/config type. This prevents eager unrelated optional-bundler types
  from entering Vite config checks without replacing/erasing any genuine type.
  Rsbuild/other adapters and unplugin API/runtime are not changed or claimed tested.
- Exact package extension on declaring server-core adds genuine dependency edges
  `@standard-schema/spec:1.1.0` and already-present `cookie-es:3.1.1`. App hoisting
  does not repair declaration dependency ownership. No runtime version upgrade.

All material is MIT; retain upstream copyright/license. Exact patches/config/
lockfile and fail-closed frozen reapplication are required. Standalone Start packed
consumers must carry these app-specific repairs explicitly (root pnpm patches do
not propagate through ordinary tarballs); no unrelated RAC patch/unused-patch
waiver or alternate bundler dependency. Root/package strict flags stay unchanged.
Add patch-path/hash/runtime-integrity and real strict-property/type checks. Remove
workarounds only after a reviewed stable upstream replacement passes the same
actual dev/production/tarball/types checks. No upstream issue/publication implied.

## Combined-workflow proof budget and isolation closure

The corrected full workflow measured more than30 minutes under concurrent local
load, reaching the final actual-tarball production suite after all prior checks,
43 baseline browser cases,54 source Start cases and27 packed-development cases
passed. The host deadline stopped it after the first packed-production case; no
assertion failure was reported. This is not a full pass. Main approves45-minute
host/CI execution headroom for the expanded workflow, not altered runtime/transition
assertions or retries. Vitest worker processes are capped at four without changing
its existing assertion deadlines.

Main also traced the shared library consumer harness borrowing genuine unpatched
workspace React declarations by ancestor fallback. Before the next install, both
apps explicitly declare the existing exact React/DOM type dev dependencies. A
resolved-program-file guard rejects everything outside that consumer except the
selected compiler's standard libraries, and also checks the complete standalone
Start workspace under both compiler versions. No new runtime/root version, source
alias or patch inheritance. The original artifact fails the new guard; refreshed
actual strict packing and the complete workflow must pass before G-04 approval.

## Clean-checkout route-generation correction

Remote CI on cc88f21 and an independent fresh source copy reproduce TS2307 for
ignored routeTree.gen.ts: local framework builds had already generated it. Before
repair, main approves explicit real Start/Vite generation in the app's typecheck
script (`vite build` then unchanged strict tsc), rather than checking in a generated
tree, omitting source/routes from types or adding a new CLI dependency. The packed
preparer must exclude that ignored file and assert it is absent; the actual packed
typecheck/build then must create it. No app runtime source/authorization/policy or
strict compiler change. Prior local full success is retained, but clean-checkout
delivery/remote acceptance stays blocked until corrected fresh source/tarball proof.
