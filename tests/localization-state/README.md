# Table-state locale composition — PROVISIONAL

TASK-017 / FR-16. Main-owned isolated worktree at76c3823, under the stacked
wp-09-state-locales-plan.md. This is data-only source-module authoring, not default
UI behavior, runtime/SSR/import-graph/packed/manual-language or WP-09 acceptance.
No existing source, locale bundle, root export, config or lockfile is changed.

## Actual private source API

`packages/heroui/src/localization/data-table.ts` exports englishDataTableLocale and
arabicDataTableLocale. Both satisfy the actual S1 DataTableLocale type and compose
existing eleven-port bundles with exactly fourteen readonly state strings. The
state key set comes from DataTableStateMessages, not a new recovery-state protocol.

Old eleven message objects/functions, locale/direction and builtinOperatorLabels
references are retained. Only new owned locale/messages/state containers are frozen;
no old object, app callback or record is mutated/frozen. Existing index.ts and old
bundle defaults are unchanged. No Retry function, source, fetch, callback capture,
React renderer or permission is created. Unknown-empty language does not claim a
dataset/filter cause; out-of-range empty is distinct. Arabic strings are authored,
not native-language/manual RTL approval.

## Scope and authored fixtures

Before the source addition, all126 actual source entries matched the canonical
4a956137a365746d964c084a161884853650138c36e1aebe6a586d178345b731 map. The source map
and1057 other tracked input hashes are retained in .artifacts, with TASKS excluded
only for the explicitly main-owned child lease. Protected tracked aggregate:
dbc1c602dee6d92b43cc140a3ca64db8776b6e060550aef701da5b4584d24ed0.
No old seals are rewritten to accept this new module.

Five unit cases are **authored, not executed**: exact keys/old object reference and
locale preservation for both languages, frozen/nonempty dictionaries, unknown-empty
versus no-match/dataset text and no transport. Positive inference fixture uses the
actual S1 types. Four negative lines cover readonly state/locale, unknown key and
callback-not-string; none were executed. Their runner compiles one annotated and
one all-directives-removed program per compiler, with line-specific diagnostics.

## Actual lightweight results

- Frozen install with the existing lockfile succeeds; no dependencies change.
- One initial positive TS6 source-fixture noEmit program succeeds. Initial scoped
  Biome finds only two formatting changes in the new module. After correction,
  final-source positive TS6 noEmit succeeds again. These are lightweight programs,
  not dual/emitted/negative matrices or runtime tests.
- The next Biome pass reports only new deferred-runner formatting. Corrected final
  scoped Biome passes all seven authored TS/MJS/JSON inputs. Both failed logs remain
  under .artifacts; source/test assertions are not weakened.
- `node --check tests/localization-state/check-negatives.mjs` passes. The negative
  program is not executed by that syntax check.
- Scope/input comparison and the final raw file map are recorded in .artifacts.
  Installed dist remains historical; source alias resolution is not public discovery.

No runtime, React/browser, source-executed graph, negative rejection, TS5.9, emitted,
packed, independent review or manual Arabic/RTL check is claimed. No shared build,
server, Figma, deployment or publication occurs. Main preserves this isolated work
before integration; unrelated runtime workers' source inventories are not changed.

## Deferred final commands

```sh
pnpm exec vitest run --config tests/localization-state/vitest.config.mjs
node tests/localization-state/check-negatives.mjs typescript
node tests/localization-state/check-negatives.mjs typescript-5-9
node node_modules/typescript-5-9/bin/tsc -p tests/localization-state/tsconfig.light.json --pretty false
```

Final source/emitted import confinement, actual shell/default wiring, root/archive
discovery, text expansion/RTL/browser and independent/native-language review need
their own final allocation. This README and test code do not satisfy those gates.
