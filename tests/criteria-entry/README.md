# Plain criteria entry — implementation-ready PROVISIONAL

TASK-017 / FR-01/13/16, isolated54c3c9e. Independent additive export/discovery
prerequisite only. S3a stays paused; no core, D2, Builder, Date or renderer work was
resumed/read as a future accepted API. Main owns install/intake/Git, generation and
late export integration. No publication/private/version/license waiver.

## Exact change

`packages/react/package.json` appends only:

```json
"./criteria": {
  "types": "./dist/criteria/index.d.ts",
  "import": "./dist/criteria/index.js"
}
```

Every old field, files array, export key order/value, script, dependency/peer,
version/private/license/sideEffects flag and formatting outside that additive hunk
is preserved. Scope compares the exact expected byte hunk as well as ordered JSON.
Manifest preimage SHA256:
`0c37de2e8e83172dbc83f2e69cfbbf8d7cf8b5360bc4a6030cc8d7bbf6911e37`.

New `packages/react/src/criteria/index.ts` contains named reexports only. No client
directive, facade implementation, controller, method, writer, registry setter,
backend permission, framework import, resource acquisition or behavior change.
It forwards the actual two existing plain producers; no copied implementations.
Existing root/contracts/filters exports and all producer semantics/errors stay intact.

Seven runtime exports:

- `createCriteriaAuthority`, `CriteriaAuthorityError`,
  `getCriteriaAuthorityOrigin`, `requireCriteriaAuthority`;
- `createCriteriaPublication`, `CriteriaPublicationError`,
  `getCriteriaPublicationBinding`.

Nineteen explicit public type reexports:

- Authority: `CriteriaAuthority`, `CriteriaAuthorityOptions`, `CriteriaCurrent`,
  `CriteriaOrigin`.
- Publication: `CriteriaPublication`, `CriteriaPublicationOptions`,
  `CriteriaPublicationNext`, `CriteriaPublicationSnapshot`,
  `CriteriaPublicationFailure`, `CriteriaPublicationTicket`,
  `CriteriaPublicationEvent`, `CriteriaPublicationParticipant`,
  `CriteriaPublicationRetirementPort`, `CriteriaPublicationObserver`,
  `CriteriaPublicationBinding`, `CriteriaPublicationBeginResult`,
  `CriteriaPublicationCompleteResult`, `CriteriaPublicationCancelResult`,
  `CriteriaPublicationDisposeResult`.

No type-star export of private SnapshotVersion/ResultInfo/registration helpers.
Referenced controller/resource/schema types stay erased; applications can use
type-only imports or indexed public types without runtime-importing the client root.
Authority identity and lifecycle metadata are not query freshness/backend permission.
Apps still own actual bootstrap/retirement certificates, requests and authorization.

## Source-only profile and static graph

Own `tsconfig.json` uses the actual NodeNext module/resolution profile, strict base
settings/noEmit and one explicit bare-specifier path:
`@tableweave/react/criteria` → **new source entry**, not installed historical dist.
`positive.ts` checks all public types with externally supplied actual controller,
definition, origins/readers/retirement ports/participants/receipts; it creates no
fabricated permitting C/P implementation. Its functions are never invoked here.
Six excluded negative lines cover readonly origin, wrong S/NoInfer reader/definition/
authority target/receipt and structural ticket fabrication.

`source.test.ts` authors one actual source-import identity test: exact seven names
and identity against direct existing producer exports. It invokes no constructors,
app readers or lifecycle operations. **Not executed.** Source authority/publication
behavior already has its own suites; this is not duplicate engine acceptance.

`check-source-graph.mjs` parses actual TS ASTs and resolves relative runtime `.js`
specifiers to actual source files, classifying type-only erasure. Actual result:

- **3 runtime nodes:** new `criteria/index.ts`, `controller/criteria.ts`,
  `controller/criteria-publication.ts`;
- **3 runtime edges**, **8 erased type-only declaration edges**;
- no external/runtime framework/vendor/root/native/hook/renderer/resource module,
  client directive, dynamic loader or DOM/network/global entry identifier.

The graph scanner reads/parses files; it **does not import/execute target modules**.
Its TypeScript/tooling imports are not target runtime dependency evidence. Graph
report `.artifacts/source-graph.json` is a static result, not a Node/SSR/cycle/session
or genuine installed archive pass. Type-only graph traversal is not runtime loading.

## Future dist/generation limits

`dist/criteria/index.js` and `.d.ts` do not exist in this tree's historical outputs.
The export map is intentionally ahead of the next reviewed build. No shared build,
emission, pack/install or runtime bare-module resolution was performed to hide this.
Normal installed-package availability is **not** established by the source alias.

Original/fc01 output count/hash/member/asset profiles remain immutable. The eventual
new JS/d.ts outputs need main's explicit generation/export integration; old mismatch
gates are not automatically green or rebased. No old packed consumer/profile/asset
fixture was patched. No prerelease/private/legal/publication flags changed.

## Authored final genuine archive runner — UNRUN

Only in the user's final verification phase, supply a real standalone consumer
already installed by main from a reviewed local archive:

```sh
NODE_DISABLE_COMPILE_CACHE=1 node tests/criteria-entry/check-packed.mjs \
  --consumer /absolute/standalone/consumer \
  --archive /absolute/reviewed-tableweave-react.tgz \
  --sha256 REVIEWED_64_HEX_ARCHIVE_SHA256
```

No default consumer, install/build/pack/extraction or consumer/config mutation.
The SHA is mandatory and externally supplied, never derived-and-blessed by the
runner. It rejects this source tree/monorepo roots, workspace manifests, pnpm
workspace ancestors, workspace/link/source dependency specs and package redirects
outside the consumer's actual node_modules. Ordinary pnpm archive-store links wholly
inside that node_modules are allowed; archive files themselves may not be symlinks.

The consumer must declare that exact local `file:...tgz`/`.tar.gz` archive. The
read-only archive verifier accepts bounded regular-file/directory USTAR images and
rejects duplicate/unsafe paths, links, PAX/GNU extensions, malformed/truncated data
or unexpected members rather than extracting/repairing them. This conservative
harness-format limit is not a library API/support claim; unsupported final packaging
needs a reviewed harness correction, not an implicit fallback.

It verifies the reviewed archive SHA, whole installed package image/member hashes
and exact manifest against that archive (excluding installer-owned nested
node_modules). It requires actual new `dist/criteria/index.js` **and** `.d.ts`, parses
the actual declaration barrel's 7+19 names, and statically confines the installed JS
relative closure to the three actual dist modules with no external runtime import.
Matching names alone or a private shim/source alias is not archive image evidence.
This is content/spec verification, not forensic attestation of an installer process.

Only after those checks does a fresh Node ESM process from the consumer resolve and
import bare `@tableweave/react/criteria`, verify its exact installed real path/names/
producer identities, and check browser globals are absent. NODE_OPTIONS/NODE_PATH
are cleared and compile cache disabled for that process; no constructors/readers,
app requests/network/browser/React/hook operations are called. It writes retained
logs/report only under own `.artifacts/final-packed/`. **None of this runner has run.**

Passing it later would establish archive image/public discovery/plain import only,
not backend authorization, application lifecycle, SSR/session isolation or product
approval. Actual typed emitted public-root positives, removed-negative-line checks,
dual compiler programs, archive declaration consumers and whole-package/member/
generation/SSR/CI/independent gates remain **DEFERRED and not authored as a complete
lane here**. No claim that presence/AST parsing of a d.ts equals compiling it.

Other final-only commands (not run now):

```sh
NODE_DISABLE_COMPILE_CACHE=1 node node_modules/vitest/vitest.mjs run --configLoader native --config tests/criteria-entry/vitest.config.mjs
NODE_DISABLE_COMPILE_CACHE=1 node node_modules/typescript/bin/tsc -p tests/criteria-entry/tsconfig.negatives.json --pretty false
```

The latter is only the authored source expected-directive fixture, not an individual
removed-directive/emitted/dual/archive type matrix. Add/run those real programs in
the final phase; don't rename source-alias evidence as installed-public evidence.

## Protection and actual LIGHT handoff

Before edits, `.artifacts/before-source129.json` matched canonical aggregate
`52a14c39ca28b51004a2316bf200ab9bd64b5fca2a19522ccd31a92f47f0885b`,
all CSS included. All129 original sources are protected; new entry makes130.
`.artifacts/package.before.json` is the exact separate manifest preimage.

Scope uses **read-only `git ls-files --stage -z`** inventory for actual Git modes/
index identities, not guesses from arbitrary permission bits. All1116 other tracked
inputs (including source, old tests/CSS/config/lock/manifests/vendor assets/profiles/
docs) are hashed and compared, except only allocated react/package.json, explicit
main-owned child TASKS and own new test directory. Index contents/modes are unchanged.
No Git mutation, producer edit, historical hash/profile tuple rewrite or .repo access.

Actual LIGHT results:

- TS6 package-source and own bare-source-alias positive noEmit programs pass;
- scoped Biome passes14 files; seven own MJS syntax checks pass;
- static AST graph passes3 nodes/3 runtime edges/8 erased type-only edges;
- scope passes129 original sources/1116 other tracked inputs and the exact additive
  manifest hunk. Final input hashes/aggregate: `.artifacts/handoff.json`.

Logs: `package-positive-final.log`, `own-positive-final.log`,
`biome-final-light.log`, `syntax-light.json`, `source-graph-final.log`,
`scope-final-light.log`. Initial attempts/format logs are preserved.

```sh
NODE_DISABLE_COMPILE_CACHE=1 node node_modules/typescript/bin/tsc -p packages/react/tsconfig.json --pretty false
NODE_DISABLE_COMPILE_CACHE=1 node node_modules/typescript/bin/tsc -p tests/criteria-entry/tsconfig.json --pretty false
NODE_DISABLE_COMPILE_CACHE=1 node tests/criteria-entry/check-source-graph.mjs
NODE_DISABLE_COMPILE_CACHE=1 node tests/criteria-entry/scope.mjs --after
```

Zero target runtime imports/units/negative/dual/emitted/packed/SSR/CI assertions were
executed. No dependency install/new dependency/shared build/emission/server/browser/
network/vendor/.repo/agent/PR/merge activity. Main's frozen install is a prerequisite,
not this worker's action. No independent/publication approval. S3/core remains paused.

Main next: inspect explicit exports/types, exact manifest delta, static graph and
handoff/protection hashes; preserve this isolated commit/intake when other relevant
handoffs permit, then perform deliberate generation/public discovery integration and
the final behavior/failure/fix/replay/type/archive/independent phase.
