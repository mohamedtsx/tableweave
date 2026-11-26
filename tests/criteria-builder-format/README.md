# Builder format-only correction — ready PROVISIONAL

This is a separate source-quality delta over main's supplied `bec322f`, not a
behavioral fix or runtime approval. No Git command reverified or changed that
revision. The child TASKS top and full main `wp-09-builder-format-plan.md` were
read. That plan references review17n1; a separate local session17n1 transcript was
not available to this worker. Main retains intake and review ownership.

## Exact scope and immutable history

Only these existing production paths are eligible:

`packages/heroui/src/filters/{criteria-builder-host.tsx,filter-builder.tsx,option-owners.tsx,types.ts,value-editors.tsx}`.

Four files needed formatting; `types.ts` already matches the formatter and remains
byte-identical. Every production edit used the patch tool. The installed formatter
supplied stdout reference data only; no `--write`, import assist, import/module
reordering, semantic refactoring, bug fix, API change or source intake was used.
Source modes are unchanged. New files are confined to this fixture directory.

Before editing, `stage.mjs before` verified **all 128** entries in
`/tmp/opencode/wp09-after-builder-source128.json`, whose byte SHA-256 is
`8d4cd2f6cfc5fa1dcd708a12118b608c84dac17366a9f385557363c4cff97197`.
It also matched all **32** original Builder sealed inputs. Five exact preimages
were captured into `preimages/*.txt`; `before.json` records their hashes/modes and
the stage's protected-file inventory, after main's supplied TASKS bookkeeping.

The new scope gate protects **1,121 existing files / 123 other production sources**,
including every old Builder README/assertion/baseline/seal/BLOCKER, Date prerequisite,
F3 core/ports, toolbar/F1/F2, headless/renderer/details, other old tests and config.
TASKS is explicitly excluded as main-supplied bookkeeping but was not edited.
No source from the other active workers was consumed.

The old Builder aggregate
`7422a760f9c995a2bf3a574cbb0d90d9a3133fdd62d8eb30b26541e95730a52b`
still describes the **unformatted** producer at `bec322f`. Its seal and all old
checks remain unchanged. Do not rerun that historical source-seal expectation as
the current format-delta gate, and do not update/rebaseline/re-sign it. Main owns
stacking this separate correction and generating any later canonical source map.

## Exact before → after SHA-256

Paths below are relative to `packages/heroui/src/filters/`:

| Source | Captured preimage | Formatted source |
| --- | --- | --- |
| `criteria-builder-host.tsx` | `97cd88adde24df83f7fa31214ac83b8d650c0fd0a7915e7f260a6613bfa00f57` | `a6c141239024c44be1ef8fb38b040e9acb5f09d0354333996095546aa77b8fd3` |
| `filter-builder.tsx` | `0fe50bdfdd84163cbca598da35f1f5b243862aa28054702d0c4fc9f0cd9d769a` | `ed8901e6ed903aea4b8e74292a59a4b4c74950e7d2f77583d4c0bec95f8257ce` |
| `option-owners.tsx` | `71f696bc0efdfc79c3027e354c31630799de4059b17dbc1c656d541b1a72b97c` | `b694476832df4a61cb53309760c784c01e8b5c086dc751ca0c1bc1763b499f33` |
| `types.ts` (unchanged) | `a1a537e3058dc6ed43b63b8e9aae5e728b2129e238b2bb92e4cc2fbd708469ae` | `a1a537e3058dc6ed43b63b8e9aae5e728b2129e238b2bb92e4cc2fbd708469ae` |
| `value-editors.tsx` | `fb568bd7f08b4dd0f2dbfe334476caae556006b85f4298bd5c006a7df25830a4` | `6d6b1e184f0adf166b1fd1bd69fa823bb6ef911ae4d795dd3e397af2515eacea` |

`ast-results.json` records each normalized parser-AST and TS-printer-roundtrip AST
hash, ordered-import counts, comment counts and exact byte hashes. This stage's
new `handoff-hashes.json` seals **16 inputs**: five production paths plus eleven
own helper/preimage/evidence files. It excludes this README, itself and
`.artifacts`. Its aggregate over sorted compact path→SHA JSON is:

`524f2f84602b7aefb377d686d3da4f64f33e9d3e6d9f30e21934a5d2adb73f01`.

## Actual preservation checks

`ast.mjs` parses preimages, stdout references and actual patched sources using the
installed TypeScript parser. Structural comparison retains syntax kinds, flags,
literal values, operators, declaration/class/function names, properties, statement/
specifier/JSX order and require/side-effect placement. It ignores positions,
printing metadata, comment attachment and redundant printing parentheses only.
An additional TS-printer → parser roundtrip also matches structurally.

Only whitespace-only JSX text nodes receive whitespace normalization: multiline
indentation emitting no text is omitted; meaningful single-line spaces remain.
Content-bearing JSX text, ordinary strings, templates and regexes are not stripped
or space-collapsed. Production bytes must also equal the exact installed Biome
stdout references. All **74 ordered import statements** and **38 source comments**
match; comment comparison uses parser token boundaries, including comments in empty
blocks, and permits only whitespace wrapping/indentation differences. No assertions
or old test contents were removed or modified. Trailing-whitespace, LF and single
final-newline checks pass for all five paths.

Reference outputs and raw light logs are retained under `.artifacts/`. The final
recorded static bundle is `.artifacts/light-002/`; `light-001/` is retained too.
No command failed in this stage. These are static contract helpers, not new unit
tests or application executions. No application modules are loaded by them.

## Actual allowed light results

The installed Biome **2.6.8** production check ran with the formatter and linter
enabled and **assist disabled**; neither checker was disabled to obtain a pass:

```sh
node node_modules/@biomejs/biome/bin/biome check --assist-enabled=false packages/heroui/src/filters/criteria-builder-host.tsx packages/heroui/src/filters/filter-builder.tsx packages/heroui/src/filters/option-owners.tsx packages/heroui/src/filters/types.ts packages/heroui/src/filters/value-editors.tsx --max-diagnostics=40
```

Result: **5 files checked, no fixes or diagnostics**. Exactly one positive existing
Builder TS6 source-fixture compilation was run after all production patches:

```sh
node node_modules/typescript/bin/tsc -p tests/criteria-builder/tsconfig.json --pretty false
```

Result: **PASS, noEmit**. No negative/removal program, second compiler, emitted
program or application/runtime test was run. The new `.mjs` helpers passed syntax
checks. Scope, normalized AST, TS-printer roundtrip, ordered imports, comments,
whitespace, exact-reference bytes and stage seal checks all pass.

Repeatable lightweight commands (do not repeat `before`, `reference`, or `seal`
initialization over their existing files):

```sh
node tests/criteria-builder-format/ast.mjs
node tests/criteria-builder-format/stage.mjs
node tests/criteria-builder-format/measure.mjs
node tests/criteria-builder-format/light.mjs light-003
```

`light.mjs` requires a fresh label, preserves each result/log, and runs only parser,
scope, helper syntax and full five-source formatter/lint checks. It deliberately
does not invoke another compiler or any application/test runner.

## Main handoff and limits

Main can inspect the five preimages, exact separate delta, AST results and new
seal, then preserve/intake this format correction independently. No Git operations,
agents, installs, builds/shared emissions, browser/server/network operations,
`.repo`/vendor-source inspection or edits to old fixtures/seals/docs/TASKS occurred.

**Runtime, React continuity, browser, SSR, privacy/purge behavior, negative/dual/
emitted/packed consumers and independent acceptance remain deferred to the user's
single final verification phase.** This format check does not approve the Builder
implementation or final WP-09 behavior. The existing unexecuted runtime commands
remain in the unchanged `tests/criteria-builder/README.md`; only run them when that
final phase is explicitly authorized. No behavior defect was fixed in this lease.
