# Tableweave

Define your data and requirements. Deliver a consistent, customizable table
experience without rebuilding its design and interactions each time.

Tableweave is a planned open-source React table toolkit built on TanStack Table,
with a genuinely headless path and an optional HeroUI default experience.

**Current stage: private native/collection producers, not a complete table toolkit.**
WP-01–WP-03 are accepted. The root provides controller/subscription hooks;
`/contracts` and `/filters` retain the accepted schema/operator surface. See
[WP-03](docs/engineering/wp-03-controller.md) and [WP-02](docs/engineering/wp-02-contracts.md).
WP-04's bounded native/collection producer is agent-approved under delegated
authority for the recorded G-01 scope, not personal maintainer acceptance.
WP-05's plain resource adapter/hook has delegated scoped G-03 approval as well.
`DataTable` and the whole-table facade remain unavailable. Nothing is
published; [TASKS.md](TASKS.md) owns current acceptance/review status.

## Start here

| You want to… | Read |
| --- | --- |
| Understand the product, defaults and exclusions | [Project map](PROJECT.md), [product map](product/README.md) |
| Work as an agent | [Agent bootstrap](AGENTS.md), [current tasks](TASKS.md) |
| Start the first authorized engineering slice | [Readiness](docs/engineering/feasibility.md), [delivery plan](docs/planning/delivery-plan.md) |
| Find a technical/design contract | [Documentation router](docs/README.md) |
| Contribute or review | [Contributing](CONTRIBUTING.md), [worker workflow](docs/agents/workflow.md) |
| Verify source coverage | [Source manifest](docs/reference/source-manifest.md), [traceability](product/traceability.md) |

## Planned distribution

- `@tableweave/react`: typed definitions, state/query coordination, filters,
  TanStack bridge, and headless helpers; no HeroUI/Tailwind/Query requirement.
- `@tableweave/heroui`: default table, controls, recovery and responsive details;
  optional sortable entry isolated from the default renderer.

The target baseline is React 19+, TanStack Table v9, HeroUI v3 and Tailwind v4 for
styled consumers. TanStack Start + Query is the primary example integration;
Vite React and Next.js App Router are secondary examples. Exact peers, npm scope
rights and package contents still need verification. **Do not run `npm install
@tableweave/...` based on this README.**

## Scope

Stable v1 includes all eleven requested capabilities, recovery, opt-in selection
and application actions, customization/localization, and Storybook. Incremental
prereleases may be incomplete; they do not reduce the stable-release contract.
See [requirements](product/features.md) and [release gates](product/release-gates.md).

Applications own data fetching, authorization, backend queries, mutations and
persistence. No automatic export, telemetry, URL/storage persistence, spreadsheet
engine, nested Boolean groups, cursor API or virtualization is implied.

## Check documentation

Python 3.10+ with only the standard library is enough:

```sh
python3 scripts/check_docs.py
python3 -B scripts/test_check_docs.py
git diff --check
```

The checker covers local Markdown targets/fragments, navigation, source-ID
inventories and skill structure. It does not check external URLs or prove product
behavior. [Evidence](docs/evidence/README.md) records actual checks and limits.
The regression probes test the checker, not Tableweave. Optional
`--source-dir PATH` compares captured `prd.md`/`hld.md` Notion payload fingerprints,
section counts and source IDs to the manifest; normal checks need no connector
or reference checkout. It does not fetch Notion or establish semantic equivalence.

## Local foundation workflow

Use **Node 24.22.0** (`.node-version`) and **pnpm 10.13.1** (`packageManager`).
Python 3.10+ and Linux `tar` are also needed for documentation/packing checks.
Runtime dependencies and tooling are exact development candidates, not a released
compatibility promise. Packages remain private; no backend/auth service is needed.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm check
```

On Linux CI, Playwright uses `pnpm exec playwright install --with-deps chromium`.
This may install OS browser prerequisites; local users can provision those through
their normal administrator workflow instead. No telemetry or remote CI execution
is enabled by these local commands.

| Command | Scope |
| --- | --- |
| `pnpm install:check` | Fresh manifest-only workspace install with the frozen lockfile; may reuse dependency cache |
| `pnpm build` | Clean owned package `dist/` outputs, emit ESM/declarations, copy the CSS entry |
| `pnpm typecheck` | Build packages and Start's generated router, then strict Storybook/harness/app TypeScript 6 |
| `pnpm lint` / `pnpm format` | Biome check / format code and configs only, not unrelated Markdown |
| `pnpm test` | Emitted-boundary guards, contracts/operators, controller/native models and resource race/lifecycle tests; browser behavior is separate |
| `pnpm test:contracts` | Build plus schema/operator/date/identity and synthetic translator vectors |
| `pnpm test:controller` | Build plus accepted-state/reset/controlled-transaction/lifecycle tests |
| `pnpm test:native` | Build plus v9 definition/carrier/client/manual/native transition tests; not G-01 by itself |
| `pnpm test:resource` | Build plus tagged resource generations/retention/precedence/permission/lifecycle tests; not framework SSR |
| `pnpm test:start` | Actual Start build, dev/production HTTP+Chromium SSR/hydration fixtures and server-only bundle markers |
| `pnpm pack:start` | Actual-tarball Start strict install/types/build/dev+production HTTP/browser proof; no workspace aliases |
| `pnpm test:filter-tools` | Candidate helper/option-source/date vectors; UI/packet acceptance remains separate |
| `pnpm pack:check` | Inspect tarballs; isolated strict TS 5.9/6 installs/declarations, runtime/bundle/CSS guards and actual packed filter-tool production Chromium |
| `pnpm storybook` | Local synthetic vendor scene at `http://127.0.0.1:6006`; telemetry disabled |
| `pnpm storybook:build` | Build the static smoke workbench, without deploying it |
| `pnpm test:browser` | Chromium smoke/native (6011), collection (6009), resource (6415), toolbar (6429), builder (6433) and combined emitted tools (6443); build packages/Storybook first |
| `pnpm check:docs` | Structural Markdown checks and checker regression probes |
| `pnpm check` | Full local sequence above, including fresh-install verification |
| `pnpm changeset status` | Local Changesets status only; no versioning/publication configured for private scaffolds |

Generated consumer/tarball reports live in ignored `.artifacts/`; browser evidence
is in ignored `test-results/`. These commands do not publish, commit or push.
[Headless contracts](packages/react/README.md) and [styled scaffold](packages/heroui/README.md)
document their actual exports. The [bounded WP-04 native/collection producer](docs/engineering/wp-04-native.md)
has recorded delegated G-01 approval; the [resource producer](docs/engineering/resources.md)
has scoped G-03 proof. Tests still reject unimplemented whole-table facades/private
deep imports. This is not a full toolkit/release gate.

The reviewed tooling set uses security-patched Storybook **9.1.21** with Vite
**7.3.8**, retaining TypeScript **6.0.3**, React **19.3.1**, TanStack Table **9.3.1**,
HeroUI/styles **3.2.8** and Tailwind **4.3.5**. All configurations retain
`strict: true` and `skipLibCheck: false`. Only the development Storybook app omits
the additional exact-optional-property check, explicitly approved after upstream
declaration failures; Tableweave packages and packed consumers retain it.
WP-04's [recorded compatibility repair](docs/engineering/wp-04-native.md#vendor-declaration-compatibility)
uses an exact declaration-only RAC patch and HeroUI-only Bundler build resolution;
public tarball declarations must still pass unpatched strict NodeNext consumers.
WP-07's [private tool boundary](docs/engineering/wp-07-tools.md) adds genuine own
filter-component types/CSS and an exact scoped HeroUI declaration-entry repair.
Both packages pass strict unpatched NodeNext TS6/5.9 tool-prop/runtime/bundle checks
and real emitted/actual-tarball interactions after independent UI corrections.
The isolated and combined WP-06 full workflows pass; remote PR delivery is verified
separately, without merging.
No full DataTable facade or personal maintainer acceptance is implied.

The vendor smoke alone is not G-01/full G-05, a full vendor-barrel declaration pass,
SSR, complete browser/manual accessibility, performance or real-consumer acceptance.
WP-06 separately has [bounded delegated G-04 proof](docs/evidence/wp-06-start-2026-11-24.md)
from actual source/tarball Start, not from that story. Next integration and final
UI/reference-informed design, device/AT/performance/real-consumer/release gates
remain separate; no PR merge is authorized.

## Authority and licensing

The [Notion PRD](https://app.notion.com/p/mohamedtsx/Tableweave-PRD-42061b5e62648054aa06dcb0ed4ba0c8)
owns product intent. The [Notion HLD](https://app.notion.com/p/mohamedtsx/Tableweave-HLD-42061b5e626480e3a52acda4a3c00527)
is the completed technical/design baseline **ready for review**. Local focused
owners preserve both, with provenance and any conflicts recorded explicitly.
The existing Figma prototype is exploratory, not an approved visual contract.

MIT is selected for Tableweave's own source. [Licensing readiness](docs/operations/releasing.md#licensing-and-publication-inputs)
tracks the legal notice, third-party obligations and publication rights; no
commercial reference assets or Gamila code are licensed by this documentation.
See [security reporting](SECURITY.md) and [community conduct](CODE_OF_CONDUCT.md).
