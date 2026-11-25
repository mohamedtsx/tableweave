# Builder source formatting — isolated provisional correction

TASK-017, review17n1. The actual Builder handoff deliberately disabled formatter/
import-assist checks. Main preserves it as isolatedbec322f after matching32 own
inputs/123 protected sources and passing one positive own source-fixture TS6.
Its new/adopted source branches are compressed and not consistent with neighbors.

One worker owns only the five existing Builder production files from that commit
and new tests/criteria-builder-format/**. No behavioral changes, import/module order
changes, test assertion edits, old seals/README maps or source outside those paths.
Use the patch tool for edits; an installed formatter can supply reference output.
Preserve normalized TS/JSX AST including literal values, operators, order and imports
exactly, ignoring only positions/trivia/parenthesis printing differences. Do not
silently rename APIs, fix unrelated behavior or re-sign the prior producer seal.

Baseline source128 map8d4cd2f6cfc5fa1dcd708a12118b608c84dac17366a9f385557363c4cff97197 is
/tmp/opencode/wp09-after-builder-source128.json; protect other123 source entries and
all existing fixture/seal files. Capture five preimages atbec322f. Scoped formatter/
lint with assist disabled, normalized AST, one positive TS6 and scope/whitespace
checks are light checks, not runtime/privacy/continuity or independent acceptance.
Record exact separate delta/hashes and deferred final commands in the new fixture.
Main owns Git/intake; no old output/generation expectation is rebased.

## Preserved provisional correction

Isolated1e0c218 formats four paths; types.ts stays byte-identical. Worker full scoped
Biome formatter/lint (assist off), AST/printer/import/comment/scope and positive TS6
pass. Main matches all16 sealed inputs/123 protected source hashes and independently
runs the normalized AST checker; staged whitespace passes. New16-input aggregate:
524f2f84602b7aefb377d686d3da4f64f33e9d3e6d9f30e21934a5d2adb73f01.
Main explicitly preserves only five required formatter reference files under ignored
.artifacts/reference because ast.mjs reads those exact immutable inputs. Generated
logs/other evidence remain unstaged. All original Builder fixtures/seals are unchanged.
New source128 map23d42b42c3dc9c9e47d9e260c354532246eca3bc5ba22141d3c72c49260b5694
does not rebase the historicalbec322f producer. Runtime/React/SSR/negative/packed/
independent correction verification remains deferred; main holds intake for S3a.

Main intakes this asba282fa after S3a, preserving the original Builder commit as
54841a8. The current [format handoff](../../tests/criteria-builder-format/README.md)
proves only its actual source-quality boundary; integrated Builder positive TS6
passes, while behavior and independent verification remain deferred.
