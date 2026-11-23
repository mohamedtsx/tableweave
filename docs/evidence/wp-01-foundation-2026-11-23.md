# WP-01 foundation — verification and compatibility decisions

## Scope and environment

TASK-003 / WP-01, explicitly authorized local implementation and dependency
installation. Started from clean `de7f1cb`, Node `24.22.0`, pnpm `10.13.1`, Linux.
No commit, push, publication, deployment or delegation authorized. `.repo/` is
absent in this worktree; used the prior recorded reference assessment, not a fresh
inspection. No reference code/assets imported or metadata changed.

## Dependency research

Read npm registry release/peer metadata before pinning. Registry candidates:
TypeScript `6.0.3` (latest major is 7, intentionally not selected), React/DOM
`19.3.1`, React types `19.3.0`, TanStack React Table `9.3.1`, HeroUI/styles `3.2.8`,
Tailwind/Vite plugin `4.3.5`, Storybook React Vite `10.6.8`, Vite `8.3.8`, Vitest
`5.1.1`, Playwright `1.65.1`. Full exact direct dependencies are in manifests;
resolved graph is in `pnpm-lock.yaml`, not an accepted compatibility matrix.

Official pnpm workspace and TypeScript configuration documentation was read.
HeroUI MCP documentation and the quick-start MDX timed out/failed; fallback was
the installed matching README/types and official
[v3.2.8 button source](https://raw.githubusercontent.com/heroui-inc/heroui/v3.2.8/packages/react/src/components/button/button.tsx).
Installed Storybook CLI help confirmed its telemetry-disable flag. CLI wrapper,
config and CI environment disable telemetry; no Storybook server/build has yet
been run. The minimal vendor scene is not a Tableweave design or feature API.

## Commands and results

| Command                                                                                                     | Actual result                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `pnpm install` (initial)                                                                                    | Failed strict peers: HeroUI's `@react-types/color` requires `@react-spectrum/provider`.       |
| `pnpm install` (after explicit compatible provider pin `3.11.1`)                                            | Passed, with strict peers and auto-install peers disabled. No vendor patches or forced peers. |
| `pnpm build` (invoked by typecheck)                                                                         | Both empty package entry/declaration builds passed; CSS entry copy passed.                    |
| `pnpm typecheck`                                                                                            | Failed in upstream declarations; did not reach the remaining root harness checks.             |
| `pnpm --filter @tableweave/storybook exec tsc --noEmit -p tsconfig.json --exactOptionalPropertyTypes false` | Diagnostic only; still failed in Storybook declarations. No flag persisted in configs.        |
| `node node_modules/typescript-5-9/bin/tsc --noEmit -p apps/storybook/tsconfig.json`                         | Also failed in Storybook and React Aria declarations. No TS baseline change.                  |

TypeScript 6 reports TS2320 incompatible inherited properties in HeroUI
ColorSwatchPicker, Separator, ToggleButtonGroup and Toolbar, plus React Aria
Group/OverlayArrow. Storybook's generated `chunk-ojHmM-yX.d.ts` reports TS2578
unused expected errors and TS2344 generic constraints. TypeScript 5.9 reproduces
the Storybook errors and React Aria optional-property incompatibilities. These
are failures in the selected candidate declarations, not evidence of a broken
Tableweave feature implementation; no features are implemented.

## Initial stop (subsequently resolved)

Initially stopped for maintainer compatibility disposition as required by WP-01. No
`skipLibCheck`, vendor patch, baseline downgrade or accepted compatibility claim.
Build scripts and package skeletons exist, but unit/pack-consumer harnesses are
unfinished and browser/Storybook/full verification has not run. No G-01–G-05,
SSR, real-consumer, final visual/manual accessibility or release gate passes.
Packages remain private with temporary `UNLICENSED` metadata pending the actual
MIT rightsholder/notice; this does not change the selected MIT policy or authorize
distribution. Those were the limits at the initial stop; the reviewed continuation
and subsequent evidence follow below.

## Research and maintainer-approved resolution

The maintainer first chose research without patched/suppressed vendor declarations.
Compared the published Storybook React declaration tarballs: 10.5/10.6 inline
expected-error comments into invalid positions; 10.4 keeps them on separate lines.
Rejected 10.4/10.5 rather than installing an affected development server: official
[origin-validation advisory](https://github.com/advisories/GHSA-f2ph-cmg5-wxc8)
and [local-network advisory](https://github.com/advisories/GHSA-px85-f4q5-jh77)
name patched versions 10.6.2, 9.1.21 and 8.6.19. This was targeted public advisory
research, not an upload of a dependency graph or a full security audit.

Selected the patched, aligned Storybook **9.1.21** framework/core set and compatible
Vite **7.3.8** / React plugin **5.2.0**, rather than mixing Storybook minor versions.
This removes the Storybook declaration errors without changing the approved
Node/pnpm/TS/React/TanStack/HeroUI/Tailwind generations. `@testing-library/dom`
**10.4.2** explicitly satisfies Storybook's transitive user-event peer.

Use the official `@heroui/react/button` subpath for the actual smoke primitive,
not the full vendor barrel. A React Aria Group declaration still fails the extra
`exactOptionalPropertyTypes` check. A diagnostic disabling only that extra check
passes with `strict: true` and `skipLibCheck: false`. The maintainer explicitly
approved persisting that setting **only in the development Storybook app**.
Both library builds and packed consumers retain exact optional checking, strict
mode and full declaration checking. No vendor patch, `skipLibCheck`, forced peer,
TypeScript downgrade or fake Tableweave API was used. This does not establish that
the complete HeroUI barrel or future Table/Drawer surfaces typecheck under all
planned flags; G-01 must test the actual future surfaces.

The first packed headless install revealed TanStack React Store's required
React DOM peer, hidden by other workspace dependencies during initial installation.
React DOM **19.3.1** is now explicit in the headless development/peer candidate and
isolated consumer. It is not imported by contracts/filters, and it does not add
HeroUI or styling to headless use. No peer checks were disabled.

## Delivered foundation and verification scope

- Four-project pnpm workspace: root, two private package scaffolds and Storybook.
- Node **24.22.0**, pnpm **10.13.1**, TS **6.0.3**, declaration cross-check **5.9.3**;
  React/DOM **19.3.1**, React types **19.3.0**, TanStack **9.3.1**, HeroUI/styles
  **3.2.8**, Tailwind/plugin **4.3.5**, Aria **3.53.1**, Aria Components **1.22.1**,
  date **3.12.4**, SSR **3.10.1**, utils **3.34.1**, Spectrum provider **3.11.1**.
  The Spectrum dependency is a transitive type-package peer, not an app provider.
- Build uses TypeScript's unbundled ESM/declaration emission and explicit CSS copy,
  cleaning only the two owned `dist/` outputs. Client directives survive packing;
  contracts/filters have no React runtime or DOM requirement. No source maps are
  emitted/shipped, avoiding source-map references to excluded sources.
- Default styled entry and isolated sortable subpath are empty modules. The CSS
  entry reserves a layer, is marked side-effectful and survives a real Vite bundle.
  No `DataTable`, schema/operator/controller or sortable plugin facade is invented.
- Vitest **5.1.1**: four emitted-boundary tests, including a negative transitive
  forbidden-import/escaped-path probe for the graph checker itself.
- Packed consumers install actual local tarballs into isolated dependency trees,
  enforce peers, inspect contents/hashes and reject workspace links/private deep
  imports. Both compile declarations with TS 5.9/6. A Node 24 import hook rejects
  React/UI imports while executing contracts/filters. Headless installation and
  bundle graphs exclude HeroUI/Aria/styles/sortable; default-entry graph checks
  exclude optional sortable. These are empty-entry checks, not G-01 row processing.
- Playwright **1.65.1**, Chromium **159.0.8154.6**: one static-Storybook smoke tests
  the actual HeroUI button's pointer/keyboard activation, rendered styles, status
  updates, browser errors and scoped axe **4.14.0** violations. Synthetic data only.
  A screenshot is retained under ignored test output for local review.
- Biome **2.6.8** checks only code/config files. Its initial broad formatter touched
  unrelated Markdown; only those agent-created formatting edits were removed,
  and the final configuration excludes Markdown. No unrelated user work existed.
- Changesets **3.0.3** config keeps private packages unversioned/untagged; local
  status returned successfully. No release branch, trusted publisher or registry
  ownership is asserted. Root/package private metadata prevents accidental publish.
- GitHub Actions configuration invokes the same local check sequence with read-only
  contents permission, no credentials/publication and telemetry disabled. It was
  not pushed, configured remotely or run on GitHub.
- Documentation checks now exclude generated `.artifacts`, Storybook and browser
  outputs, with an added regression probe. No source requirements were changed.

## Final verification results

Final `pnpm check` passed after the clean-build/dev-wrapper fixes and expanded
boundary/privacy assertions. Source state is the uncommitted WP-01 working tree
based on `de7f1cb`, not a newly committed immutable revision.

| Boundary/command | Observed result |
| --- | --- |
| `pnpm install:check` | Fresh four-project manifest-only workspace, 316 packages, frozen lockfile unchanged; dependency cache reused. |
| `pnpm lint` | 38 code/config files checked, no fixes/errors. Markdown intentionally outside formatter scope. |
| `pnpm typecheck` | Clean emitted library JS/declarations, Storybook and harness source checks passed with the approved flags. |
| `pnpm test` | Four boundary/guard tests passed. |
| `pnpm check:docs` | 64 Markdown files, 393 local links/fragments, source-ID inventories and all 17 checker probes passed; no captured-source fingerprint comparison. |
| `pnpm pack:check` | Two exact-content tarballs inspected, clean headless/styled installs and frozen reruns passed; TS 6.0.3/5.9.3, Node import guards, private-path negatives, no-workspace-link assertions and Vite bundle/CSS checks passed. |
| `pnpm storybook:build` | Root wrapper builds packages first; static Storybook completed successfully, not deployed. |
| `pnpm test:browser` | One Chromium smoke passed: pointer/keyboard activation, computed vendor style, status, no browser errors, zero scoped axe violations and no external HTTP(S) request origins. |
| `pnpm storybook --smoke-test --ci` | Package build and local dev-server startup passed, then exited; no review server left running. |
| `pnpm exec changeset status --output=.artifacts/changeset-status.json` | Local status returned success; no version, tag, commit or publication performed. |
| `git diff --check` | Passed. |

Packed run report: `.artifacts/packed-i1h3uC/report.json` (ignored/local), containing
exact file lists and module graphs. Package archive SHA-256 values:

- `@tableweave/react`: `d89b00235906cdfe78b965c611b6fec9c6139b45fe88ff280955e3d17a020458`
- `@tableweave/heroui`: `cdf073ec9505ccd8dd0582b9805ada2152af969f0263c3296bb8abff709a8ff2`
- `pnpm-lock.yaml`: `d3fcc3a0419982d6d0e7e9f530c68f1c642b8bb64edd96f244ae5a2404aeb18b`

Locally inspected screenshot:
`test-results/foundation-static-smoke-bo-cae7b-upports-keyboard-activation-chromium/smoke.png`.
It shows the clearly labeled vendor-only scene, styled interactive button, visible
keyboard focus and synthetic counter. It does not approve a table design. These
generated reports/images are ignored local evidence, not distributed artifacts.

Nonblocking warnings are retained, not suppressed: Vite/Rollup ignores `use client`
when making browser-only consumer/Storybook bundles; the shipped unbundled package
files retain it and are explicitly checked. No Next/RSC behavior is inferred.
The Storybook manager preview chunk exceeds 500 kB; it is development tooling,
not a Tableweave runtime bundle/performance baseline. Storybook also emits a Node
DEP0190 child-process warning on dev startup; workspace-owned wrappers use
`spawnSync` without a shell. Dependency resolution notes deprecated `glob@10.5.0`.
This is not a claim of a complete transitive security/license audit.

## Remaining limits and handoff

No table features, G-01–G-04, full G-05, SSR/Next/Start integration, complete vendor
barrel declaration matrix, final visual/taste approval, Firefox/WebKit/real Safari,
manual screen-reader/mobile, benchmark or real-consumer acceptance. The Storybook
smoke is explicitly not an approved table design. Source references were not
available for a fresh taste/architecture inspection; the local assessment was the
fallback. No edits to `.repo/`, Gamila, Figma, source Notion pages or product scope.
No commits, pushes, publication or deployment were performed during the original
verification run. Subsequent local snapshot and acceptance are recorded below;
WP-02 still needs its own execution authorization.

## Maintainer acceptance

On 2026-11-23 the maintainer explicitly stated: “I end my review and accept WP-01.”
TASK-003 is done and review session 1 is closed. Accepted foundation snapshot:
`6bac5a623754f2e1b0eae292a076e15cfd31fefb`, on local `chore/setup`. Review note n1
was applied to the canonical HeroUI component-reference guidance; temporary notes
remain in `REVIEW.md` until clearing is requested.

This accepts the bounded foundation and its documented compatibility disposition,
not unimplemented APIs or the deferred feasibility/release boundaries above.
Acceptance/handoff updates change documentation only; they do not rerun runtime
tests or authorize WP-02, installs, a new commit, publication or deployment.
