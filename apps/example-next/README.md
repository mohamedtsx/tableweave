# Next App Router example — provisional source handoff

TASK-019 / FR-01/13/14/16, AC-01/22–27. This is an isolated **source-only**
integration of preserved Stage A, not Next/SSR/hydration/packed compatibility or
WP-11 approval. Drag remains blocked; WP-10/G-02 remains incomplete.

Main owns the already selected manifest/lock at47e20df. The app uses Next16.4.6,
React/DOM19.3.1, HeroUI3.2.8, TypeScript6.0.3 and the exact peers in
`package.json`; no dependency, profile, patch or export was changed by this writer.
Main's ignore-scripts materialization receipt is copied under
`../../tests/workbench/wp11-next/receipts/`. No Next CLI/config module, native
binary, application/vendor runtime, server or browser was executed here.

## Actual composition

- `app/layout.tsx` is an RSC layout with ordinary `html`/`body`, app CSS, local
  metadata and no external font, image, service or telemetry integration.
- `app/page.tsx` calls `buildInitialPayload()` directly, never its own HTTP route.
  `/` renders one client boundary; `/?compare=1` renders two independent boundaries.
  These are document links, not a client router/source continuation protocol.
- `lib/server-contract.ts` uses public `@tableweave/react/contracts`, preserved
  plain `records.ts`/`schemas.ts`, and fresh per-call queries/envelopes/row/tag
  arrays. Schemas reach the plain public `/filters` entry. No React root,
  HeroUI, definitions, source owner or mutable request controller is on this graph.
- `lib/payload.ts` describes **initial public synthetic inputs only**: stable string
  IDs, finite amounts including zero, nulls/empty strings, array-valued tags, UTC
  strings, fixed evaluation time and a public wire query/identity. D/C/P, callbacks,
  definitions, publications, authorities, leases and JSX never cross RSC.
  Type shape checks are not a runtime row validator or backend authorization.
- `app/headless/route.ts` is an actual standard `GET(Request): Response`, using the
  same builder. Both page and route explicitly select Node and `force-dynamic`;
  GET returns `Cache-Control: no-store`. Only `primary`/`comparison` labels are
  accepted; unknown labels return400. This public synthetic read has no auth state,
  persistence, production network, shared controller or cache. Labels are not access
  checks. It is not wired as the table's transport.
- `app/ClientDataTableBoundary.tsx` begins with `"use client"` and uses real
  `useDataTable`, `useTableweaveState` and production `DataTable`. All new JSX is
  app-local. No Storybook Workbench, test owner, fake native projection or private
  certificate is imported. Next, not the app, owns hydration.
- `lib/client-owner.ts` calls Stage A's actual `minimalTransactionDefinition()` and
  `createExampleOwner(D, rows, {id})`. That owner creates real D/C/P, settles its
  actual retirement protocol, supplies `modelOptions()` and `connect()`, and clears
  selection/details/resource/option state through its public retirement behavior.
  The adapter uses actual `parseQuery()` and fixed-clock `getQueryIdentity()`;
  the server identity must equal C's real initial identity. No accepted-query mirror
  or per-query remount is used. This minimal definition enables its builder and
  pager, not selection/details/manual-row/drag tools or the full catalog.
- One lazy source instance lives above optional table visibility. Hide/show does
  not disconnect or recreate it. Whole-boundary cleanup disconnects A synchronously,
  then disposes P/resource/options/C in a microtask unless an immediate Strict effect
  replay reconnects that same owner. A blocked P disposal throws; it is not forced.
  This authored lifecycle is **runtime-unproved**. Discarded render allocations have
  no external connection. Source revocation is terminal, not a regrant.
- The payload is not a prop-update transport: a different initial object immediately
  hides the old facade and requests source revocation at commit. Even equal scope
  strings do not authorize continuation. A new document starts a new owner.
- Genuine prerender is expected to be a neutral facade status, **not rendered table
  rows**. Public records can appear in serialized Flight scripts; that is not SSR row
  proof. There is no `ssr:false`, browser-global module initializer or fake fallback.

## Runtime versus positive LIGHT

`next.config.mjs` bounds `turbopack.root` to this repository, not `/tmp` or a parent
workspace. Its finite Tableweave entries resolve through app-local
`fileURLToPath(import.meta.resolve(specifier))`: the real public emitted exports,
including the public stylesheet. It has no package-source aliases or filesystem
React aliases. **This config was typechecked as data, not imported/executed.** Current
dist is not established as complete/current; final emission and actual resolution
are still required. No old output-generation driver is borrowed.

The preserved shared client graph imports bare toolkit entries from outside the
app (`definitions.ts`, `owner.ts`, resource/options/reordering helpers). Exact app
aliases are intended to route those imports to app-declared public exports. New JSX
does not import shared `details.tsx` or Workbench. Type resolution cannot establish
Next's condition-specific React/SSR module identity across these origins. Preserve
Next's own conditional React machinery; stop if actual bundling needs another
profile, export, root dependency, React alias or a shared-package rewrite.

`tsconfig.json` is the runtime/emitted configuration: strict base, exact optional
properties, `skipLibCheck:false`, ESNext/DOM libs, ESNext/Bundler, React JSX, no
paths/suppression/ignored build errors. `next-env.d.ts` contains only the official
core/image references, not fabricated generated paths. Next may generate/change it
only in the later authorized phase.

`tsconfig.light.json` is separate and **source-only**: exact public Tableweave
specifier-to-source mappings plus explicit app-installed Next, HeroUI component,
date, TanStack and RAC I18nProvider declaration resolution. It does not replace
React with a filesystem runtime alias. `noEmit` and `incremental:false` prevent
emission/cache output. Passing it is not proof of runtime/emitted/dual-consumer
resolution, a distributable package or an ordinary unpatched installation.

PostCSS config names only `@tailwindcss/postcss`. The installed plugin uses existing
PostCSS8.5.33 separately from Next's8.5.23; no direct PostCSS dependency or override
was added. CSS imports Tailwind/HeroUI/public Tableweave styles, scans only this app
and preserved shared examples, and adds small app-shell rules. The approved local
direction image informed composition only; no Figma edit, design approval, library
theme redesign or screenshot comparison was performed.

## Evidence and final-only commands

See `../../tests/workbench/wp11-next/README.md` for exact attempts, frozen-input
maps, installed declaration/lock receipts, pinned compiler input aggregate, authored
cases and limits. Only positive TS6/noEmit, syntax/static/byte/scope checks and full
scoped Biome are allowed now. Frozen155/all old regular inputs remain unchanged.

**Do not run the following before the user's single final verification-and-fix
phase.** Main must first authorize current emission/declaration use and review the
resolved graph; a missing output/dependency is a stop, not an install workaround.
From the repository root, using the already installed selected tools:

```sh
pnpm --dir apps/example-next typecheck
pnpm --dir apps/example-next build
pnpm --dir apps/example-next dev
pnpm --dir apps/example-next start
```

Run dev/start separately on the reserved strict port6571. All are **UNRUN**, as are
Next type generation, framework production/dev HTTP, SWC/sharp/PostCSS execution,
SSR/hydration, negative/dual/ordinary packed tests, a second TS version, CI,
independent review, visual/browser/AT/performance and real-consumer checks.
`NEXT_TELEMETRY_DISABLED=1` is already in the selected scripts. No automatic type
installation, forced peers, new native script permission or vendor repair is allowed.
The existing private compatibility profile remains distinct from the required
outside-workspace **unpatched** ordinary archive lane. Neither is silently promoted
by LIGHT. Existing Start/G-04 and all Stage B work are untouched.
