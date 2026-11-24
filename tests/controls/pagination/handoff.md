# WP-08 pagination producer handoff — 2026-11-24

**Latest test-only disposition:** main authorized explicit LIMITATION
characterizations after frozen-source review. See
[test-classification-handoff.md](test-classification-handoff.md) and
`classified-candidate.sha256`. Source remains `c7085cfc…`; current browser results
are54 supported/guard +5 defensive +3 LIMITATION cases, all active and passing.
The LIMITATION cases assert original host rejection, not containment. Earlier
failing runs and candidate notes below remain historical evidence.

**Current n4 candidate/limit:** see [promise-boundary-handoff.md](promise-boundary-handoff.md)
and `promise-candidate.sha256`. Original n1–n3 are independently resolved. Avoidable
Promise-hook execution is corrected for final review; one explicit unsupported
poisoned-rejection negative assertion remains failing. No unconditional async
containment or scoped approval is claimed. Earlier manifests/reports below are historical.

**Historical initial candidate below.** Independent review subsequently reproduced
n1–n3. The corrected, still-unapproved rereview candidate and current fingerprints
are recorded in [review-fixes.md](review-fixes.md) and `review-candidate.sha256`.
The initial `candidate.sha256` is retained as historical evidence, not the current
candidate manifest. Main still owns the separate UI pairing disposition.

Candidate delivered for main/independent review, **not self-approved**. Scope is
only `packages/heroui/src/pagination/**` and `tests/controls/pagination/**` in
`/tmp/opencode/tableweave-wp08`, browser port **6465**. Parent owns TASKS, root
exports/styles/config/build, shared integration, reviews and Git. No installs,
shared package builds, commits, merges, deployment, publication or delegation.
Starting HEAD: `3e4aaa8e697670035346d4e9a26055d1ad2e6b4a`; approved uncommitted
core source is fingerprinted separately in `candidate.sha256`.

## Exact API

`pagination/index.ts` exports:

- `Pagination<S extends QuerySchema, T extends object>(PaginationProps<S,T>)`.
  Required: `schema`, current render `presentation`, origin-tagged `authority`.
  Optional: `locale`, complete `messages`, `formatNumber`, `id`, `className`,
  `onRetry(currentPresentation)`.
- `paginationMessages`: complete replaceable English dictionary, including all
  labels, range/page formatters, notices and disabled explanations.
- `formatPaginationNumber(value, locale)`: default Intl number formatter.
- `usePaginationCorrection(controller, presentation, authority, context): void`.
- Own public types: `PaginationProps`, `PaginationMessages`,
  `PaginationNumberFormatter`, `PaginationCorrectionContext`,
  `PaginationCorrectionEpoch`.

The component uses actual HeroUI **3.2.8** Pagination anatomy, Button, Select,
Label and ListBox. Its own declaration boundary imports only Tableweave and React
types; no HeroUI/RAC/TanStack imports occur in its emitted declarations. It has no
implicit CSS import. Main must aggregate the **scoped** `pagination/styles.css`
into the existing public stylesheet and add real root exports. No WP-07 file or
shared table renderer is imported by these fixtures.

Render metadata comes only from `presentation.displayed`, never the requested
query. Missing snapshot is unavailable, not zero. Genuine zero is 0–0 with no
pages. Empty out-of-range snapshots retain their unknown range and explicitly
out-of-range page description. Known totals render at most five numbered targets;
unknown totals render only Previous/Next with the authority's explicit bounds.
Size options come directly from the actual schema (default/custom sizes).

Every page/size action uses the original authority's guarded method, which rereads
current owner/query/context/metadata. Expected `ControlsError` invalidation is an
event no-op; unexpected application errors propagate. Retry is rendered **only**
with an app-supplied wrapper and current `canRetry`, and rechecks `require(retry)`.
The pager does not call `retry`, begin, fetch, connect or settle resources itself.
The app's real wrapper owns token handling and transport. Synthetic fixture Retry
invokes the actual authority/resource contract and a counted synthetic application
transport port, then explicit test settlement; this is **not network evidence**.

The range is a polite atomic live region, disabled controls have descriptions,
IDs/keys are stable, and a removed focused numbered target recovers to a surviving
current-page/control (or range) only if focus was lost to the document body. It
does not steal surviving external focus. Scoped colors use actual semantic token
pairs, not a global theme change.

## Correction causality protocol — required, not inferred

`PaginationCorrectionContext<S,T>` requires:

```ts
{
  definition: NativeDefinition<S, T>;
  context: ResourceContext;
  epoch: string | number;
  readCurrent: () => { context: ResourceContext; epoch: string | number };
}
```

The **application advances the epoch before external navigation/query/scope/reset
intents**, including A→B→A and external clock/evaluation changes. Do not advance it
for this hook's clamp, controlled acceptance of that clamp, or resulting transport/
responses. Tags must not be reused for a different causal chain. `readCurrent` is
a pure synchronous committed app port, not speculative render state. Keep the
hook mounted across pagination transitions; remounting discards its attempt memory.

This explicit input is essential: accepted controller snapshots do not distinguish
automatic target acceptance from a later external action to the same page. The
hook does **not guess causality** from revisions, resource keys or page indices.
Do not enable it in a host that cannot supply this port/protocol. Main must carry
this requirement into the final shell/application handoff.

The effect captures render-origin epoch/context values, then requires current
navigation authority and checks current known/nonbusy/nonstale/nonobsolete facts,
definition canonical identity, accepted query/evaluation identity, and exact
render/current request-generation/metadata fingerprints. It rechecks epoch, state
identity and authority immediately before dispatching the existing identity-tagged
`pagination.clamp {pageCount,queryIdentity}`. No resource read/start, new query
store, transport, cache, backend service, or render write is introduced.

Attempt identity is controller + native definition + app context/epoch + actual
`getQueryIdentity(schema, query-with-pageIndex-zero, definition.evaluation +
state.evaluatedAt)`. Thus page size, sorting, filter semantics, locale, timezone,
schema and evaluated relative-date semantics remain in the stamp; only page index
is excluded. The attempt is spent **before dispatch**, including proposal,
rejection, noop or exception. Contradictory smaller totals after the automatic
target cannot reopen it. A genuinely external epoch/semantic change can start a
new chain. No natural real-controller noop is fabricated as a passing fixture;
the code's pre-dispatch spend also covers that outcome.

## Required future WP-10 handshake (not implemented)

Core `canNavigate` describes its own resource/query authority. Do **not falsify**
that fact to represent a future app-owned row operation. Today the host can withhold
the interactive pager and show an app-owned pending reason/read-only information;
the current pager API has no separate row-operation lock input. DOM-only disabling
or hiding is **not** an event-time stale-callback guarantee.

Before keeping built-in navigation/size/correction active in a WP-10 host, main
must negotiate an additive contract that supplies both truthful rendered disabled
state/reason and a **current app-owned read port** checked at every page/size event
and every correction attempt immediately before mutation. A pending operation
must block those paths even before React commits. No exact prop names or WP-10
adapter are proposed/guessed here. Existing pager/context/clamp guards are unchanged;
there is no hidden fetching or persistence. Shared collection-renderer integration
and this pending-operation interlock remain **pending main-owned integration**.

## Checks actually run

Environment: Node **24.22.0**, TypeScript **6.0.3 / 5.9.3**, Playwright **1.65.1**,
Chromium **159.0.8154.6**, Linux. Existing exact linked vendors only.

All commands run from this isolated worktree, with `skipLibCheck: false`, strict
and exact optional checks; no version suppression flags:

```sh
pnpm exec tsc -p tests/controls/pagination/tsconfig.json
node node_modules/typescript-5-9/bin/tsc -p tests/controls/pagination/tsconfig.json
pnpm exec tsc -p tests/controls/pagination/declarations.tsconfig.json
pnpm exec tsc -p tests/controls/pagination/public.tsconfig.json
node node_modules/typescript-5-9/bin/tsc -p tests/controls/pagination/public.tsconfig.json
pnpm exec vitest run --config tests/controls/pagination/vitest.config.ts
pnpm exec playwright test --config tests/controls/pagination/playwright.config.ts
pnpm exec biome check packages/heroui/src/pagination tests/controls/pagination
git diff --check -- packages/heroui/src/pagination tests/controls/pagination
```

- **2 source unit/SSR tests pass**: bounded huge totals and current actual resource
  snapshot server render with an otherwise-correctable out-of-range query, without
  controller/resource mutation, start or retry during render. This is bare React
  SSR, not a Start/hydration/bootstrap pass.
- **30 Chromium tests pass**, including first/middle/last/zero/unknown/null,
  default/custom sizes, selection/sort preservation and single reset, retained A
  while requested B loads/fails, Retry B, same-turn old connected callbacks after
  query/scope/metadata changes, focus recovery/non-stealing, opt-in bounded shrink,
  controlled proposal/rejection/acceptance and callback rejection under StrictMode,
  contradictory smaller totals, external epoch changes, old-effect epoch/query/
  scope/metadata invalidation, and refusing nonauthoritative correction.
- Real pointer/keyboard controls, matched **Arabic I18nProvider + RTL DOM**, light/
  dark, 320px, 1440/1024/768/390/320 and 200% CSS text expansion pass. Axe passes on
  initial pager, open size popover and resulting page in all four RTL/theme cases.
  Browser tests also assert no page runtime errors. CSS text expansion is not a
  real-device or browser-zoom/manual-AT claim.
- Strict positive/negative source and emitted public declaration fixtures pass
  both compiler versions. Source uses Bundler resolution like the private package
  build; emitted own declarations are checked with NodeNext. Aliases are explicit
  local fixture inputs, **not tarball/clean install/root export proof**.
- Scoped Biome checks **19 files**; actual public declaration scan found no direct
  HeroUI/RAC/TanStack import leak. No shared package build was run.

Initial failures were retained as development findings, not hidden passes: raw
vendor source declarations require Bundler resolution rather than NodeNext;
exact optional vendor props required omission instead of `undefined`; definition
object-reference equality incorrectly suppressed correction and was replaced with
the producer's canonical definition identity. Real Tailwind processing was added
to the **owned fixture** before visual/axe evidence; raw `@apply` CSS alone was not
treated as styled proof. A later duplicate JSX class was caught by TS/Biome and
fixed before the final 30-test run.

Screenshots are local ignored evidence under `.artifacts/`: `known-{width}.png`,
`{ltr,rtl}-{light,dark}-320-initial.png` and `...-320.png`. Inspected narrow English
and Arabic/dark captures. Source checksums are in `candidate.sha256`. Reference
reading: canonical direct-feedback/reference owners, read-only Gamila pagination
pattern/assessment, transactions reference and actual installed component types/
source. Official HeroUI Storybook was attempted; MCP docs/list lookup failed, so
matching installed 3.2.8 types/source were the capability authority. No reference
runtime/assets/business rules were imported.

## Limits and exact next action

Main must review the exact props and mandatory correction epoch protocol, add root
exports/scoped stylesheet aggregation, negotiate the future current-operation
interlock **before WP-10 adapter code**, and run independent/root-emitted/actual
packed/full combined workflows. Shared collection renderer may change independently;
this handoff makes no table-shell or combined compatibility claim. No manual AT,
touch/device, Safari/Firefox, performance, actual consumer, network, publication or
personal-maintainer acceptance is claimed. No verified in-scope failing check is
left unresolved; required integration/gate evidence is explicitly pending.
