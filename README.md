# Tableweave

Define your data and requirements. Deliver a consistent, customizable table
experience without rebuilding its design and interactions each time.

Tableweave is a planned open-source React table toolkit built on TanStack Table,
with a genuinely headless path and an optional HeroUI default experience.

**Current stage: documentation foundation; no Tableweave packages are implemented
or published here.** Names and APIs below are planned, not available exports.
There is no installable workspace, demo server, or runtime test suite yet.

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

## Runtime workflow is not mounted

The [bootstrap packet](docs/planning/work-packets.md#wp-01-workspace-and-package-foundation)
must create and verify real install/build/type/test/Storybook/pack commands, then
replace this notice with the executable workflow. Do not copy commands from
Gamila or invent passing tests. Node 24 LTS and pnpm 10 are the HLD's development
baseline, not installed-tool claims.

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
