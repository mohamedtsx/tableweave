# Explicit admission client entry — provisional source discovery

Main-owned TASK-018 / FR-02/03/14, AC-12/13/26. The additive
`@tableweave/react/reordering-controller` manifest mapping points to the actual
existing client index's future dist outputs. Baseline8ba59fd has twelve runtime and
thirteen type exports, including the UI/model/navigation bridge. No new production
body, factory wrapper, callback policy, dependency, lock or default-root export is
introduced. B2 source15039adeb5d… and all historical seals stay distinct and unchanged.

The manifest preimage is exactly `git show 8ba59fd:packages/react/package.json`;
the static check requires that preserved Git revision. It compares the sole additive
exports entry and every150 source byte against that revision, verifies the actual
client export list, and traverses relative source import/export edges. It does not
inspect installed vendor transitive graphs or execute a client/vendor module.

`positive.ts` uses the bare source alias and actual generic S/T anchors, application
lease, exact-model UI join/navigation origin and existing callback types. It is
compile-only, not a sample application lifecycle or a row-submit implementation.
In particular, review22n2's pre-token renderer/native cut remains separate.
`negative.ts` authors unexecuted brand/foreign-record rejections; it is excluded from
the positive program. Source alias resolution is not ordinary package availability.

Allowed LIGHT commands:

```sh
pnpm exec tsc -p tests/reordering/admission-entry/tsconfig.json --pretty false
node tests/reordering/admission-entry/check-static.mjs
node --check tests/reordering/admission-entry/check-static.mjs
pnpm exec biome check --assist-enabled=false packages/react/package.json tests/reordering/admission-entry
```

Initial positive compilation fails because the own fixture guessed the argument
order of requireReorderAdmission. Main reads the actual signature and corrects only
the fixture; the failed log remains `/tmp/opencode/wp10-admission-entry-ts6-first.log`.
The corrected positive TS6 program passes in
`/tmp/opencode/wp10-admission-entry-ts6-final.log`. The exact static source/manifest
check and syntax check pass; full scoped Biome passes five files after fixing only
the new static helper's formatting. The original formatter failure remains
`/tmp/opencode/wp10-admission-entry-biome-first.log`; fresh passing logs use `final`.
No rejection/negative program was executed by those checks.

All runtime/React/SSR/browser/negative/dual/emitted/installed/packed/independent
checks remain in the user's final phase. Final negative execution must test intended
diagnostics with and without directives, not count any compiler failure as success.
Genuine tarballs must expose the ordinary client entry and keep default/headless
contracts/criteria/pure paths free of helper/optional-adapter imports as applicable.
No fc01/output generation is replaced, old dist rebuilt, consumer patched, PR pushed,
package published or whole WP-10/numbered correction approved by this entry.
