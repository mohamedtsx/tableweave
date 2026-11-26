# Start retirement fixture values/assertions — source-only follow-up

Review28n3/n4; baseline70c95ac. Main changes only the sealed retirement stage's
two FINAL test files. All production code, original producer maps/logs/READMEs and
155 library sources remain unchanged. No test body, app/framework module or consumer
is executed. The original14-input/803-input guards now have these two disclosed
fixture-body changes; their old maps remain history, never re-signed.

- The test transport uses deterministic36-character UUID-shaped bootstrap ids,
  matching the unchanged production codec. The prior `retirement-synthetic-N` ids
  were statically invalid and would prevent loaded-source scenarios reaching their
  target. Actual codec/session validation and genuine initial P retirement remain.
- With no receipt, adoptHydration returns without opening a grant. The test now
  asserts its actual undefined return and identical closed snapshot with no receipt/
  sources, rather than requiring an exception that is not part of the contract.
  Debt must still block new owners; surrounding load/attach/deserialize checks stay.

The source checker compares the **exact** two changes with70c95ac, verifies all
other12 retirement inputs/28 artifacts, original protected source/artifacts and155
library hashes, and checks the fixture's literal ID prefix against the codec's
36-character shape. Parsing constants is not execution of the reader/test/application.

Source-only checks, isolated root:

```sh
node tests/workbench/wp11-start-assertions/check-source.mjs
node node_modules/typescript/bin/tsc -p tests/workbench/wp11-start-retirement/tsconfig.source-light.json --pretty false
pnpm exec biome check --assist-enabled=false tests/workbench/wp11-start-assertions tests/workbench/wp11-start-retirement/final/synthetic-reader.ts tests/workbench/wp11-start-retirement/final/retirement.test.ts
```

Main's exact-delta/static guard, syntax, strict source TS6 and full scoped Biome
pass. The first new-checker formatting failure is retained at
`/tmp/opencode/wp11-start-assertions-biome-first.log`; passing logs use `final`.
No unit case or application body ran. The same final-only retirement Vitest config
still selects all five original contract assertions and seven corrected cases; no
case is skipped/excluded. Runtime/observer/debt/React/HTTP/framework/generation/SSR/
browser/dual/ordinary/packed/manual/independent gates remain UNRUN. No source parse
or compile proves review28 runtime closure, G-04 inheritance or drag/G-02 acceptance.
