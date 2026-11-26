# Explicit styled source entry — PROVISIONAL

TASK-017 / FR-01/07/14/16, main-owned after shell8fdbde6 and Builder host914cd60.
This is source discovery/type/asset-mapping authoring, **not built/installed/packed
availability, runtime, visual, SSR or independent WP-09 acceptance**.

## Actual delta

- Styled root explicitly exports DataTable, useDetailsAccessory, RecordDetails and
  the context-bound TableDetailsTrigger alias. Legacy DetailsTrigger stays the raw
  producer. Only intended app props/accessory/context/message/locale types are added;
  private cells, actors, leases, work, sources and bindings are not root exports.
- Existing11-port locale bundles and new DataTable/neutral EN/AR bundles are explicit
  named exports. Root keeps its client marker; the plain criteria entry is separate.
- Root CSS imports actual data-table/styles.css, whose own tableweave layer is not
  nested a second time. The explicit owned-root copier adds only data-table. No
  component/default vendor CSS, manifest, dependency, version or lockfile changes.
- Facade Builder config now matches actual existing materialization defaults:
  fields/evaluationMode/per-field label can be omitted. Stable Builder field IDs,
  other presentation types and supplied-value runtime conflict checks are unchanged.
  The raw FilterBuilderProps fields/mode/labels remain required.

Main captures four source preimages and the copier preimage externally before edits.
The original140-source map0d25b948124ca91db52d056dae493d9b459bf0f9f5bb4a2c4027aeddb1c10b69
is `/tmp/opencode/wp09-before-styled-exports-source140.json`. Other136 sources and
old fixtures/seals stay unchanged; no original/fc01 output/member/asset profile is
rewritten. The new per-stage handoff/map is local `.artifacts` evidence only.

## Authored consumer and asset checks

`positive.tsx` imports the actual styled source **root** through its own explicit
tsconfig alias. It checks cast-free model-anchored native record callbacks, selected
record wrappers, accessory/context/state/toolbar types, locale/neutral bundles and
minimal Builder overrides. It is type feasibility, not a rendered app or permitting
model/accessory fixture. `loadedSelected` contains `{id, record}`, not bare records.

Seven negative directives are authored, not executed: private cell/actor exports,
readonly props, wrong native record, foreign accessory, wrong field owner and raw
Builder's still-required mode. `check-negatives.mjs` compiles one annotated and one
all-removed program per compiler, requiring diagnostics on each intended line and
rejecting foreign-program failures. No arbitrary nonzero exit is treated as proof.

`check-static.mjs` parses source only: explicit runtime/type allowlists, unchanged
legacy trigger, root client marker, actual shell CSS import and exact owned copier
roots. It neither imports a producer nor copies styles/emits code.

`asset-copy.test.mjs` is one **unexecuted** Node unit using the actual copier with a
fresh UUID output under this fixture's own .artifacts. It checks source bytes, the
new shell asset and every copied CSS local-import target. No shared dist/consumer
output is used or cleaned. This unit would still not prove bundled/archive/CSS
visual rendering, computed cascade, RTL, zoom, contrast or AT.

## Actual lightweight checks

- Actual joint shell and Builder-host positive TS6 source programs pass before
  these export edits; their exact producer/source maps remain separate history.
- The first public-root positive TS6 fails only because the fixture accessed
  `loadedSelected.title` instead of its real `.record.title`. Correcting that fixture
  (not the producer/type) yields a passing positive TS6 noEmit program.
- Initial/next Biome report formatting only in root/own fixtures and deferred helper
  scripts. Patch-based corrections yield final full scoped formatter/lint with
  assist disabled and CSS formatting enabled: pass13 files, no fixes/diagnostics.
- Static export/CSS mapping check and deferred-runner syntax check pass. All failed
  and successful logs are retained externally under `/tmp/opencode/wp09-styled-public-*`.
  No negative program, Node test, producer runtime import, build or archive ran.

Source aliases, parser checks and root imports in a positive program do not prove
ordinary package declarations/resolution. Historical installed dist remains unbuilt;
current reviewed public generation is still fc01. Full runtime/React/browser/SSR,
dual/emitted/negative/ordinary root/actual archive/CSS/independent proof is deferred.

## Deferred commands

```sh
node --test tests/data-table/public-entry/asset-copy.test.mjs
node tests/data-table/public-entry/check-negatives.mjs typescript
node tests/data-table/public-entry/check-negatives.mjs typescript-5-9
node node_modules/typescript-5-9/bin/tsc -p tests/data-table/public-entry/tsconfig.json --pretty false
```

Ordinary emitted/archive positive/removal consumers and integrated styled Start SSR/
hydration need the final reviewed build/output/archive allocations. This fixture
does not replace them or automatically approve/register a new output generation.
