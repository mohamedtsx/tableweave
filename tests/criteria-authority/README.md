# Plain criteria-authority candidate handoff

Ready for **independent scoped source review**, not self-approved. Implemented in
`/tmp/opencode/tableweave-wp09` under the approved
`docs/planning/wp-09-criteria-authority-plan.md`. This is only the plain WP-09
prerequisite, not a facade, raw-tool adoption or integrated AC-16/25 closure.

## Source and API

The only new production file is
`packages/react/src/controller/criteria.ts`. Candidate exports:

- `CriteriaOrigin<S>`: exact controller/ControllerDefinition references, context
  (`definitionKey`, `scopeKey`, `access`) and `epoch: string | number`.
- `CriteriaCurrent<S>`: exact references, expected/actual contexts and epoch.
- `CriteriaAuthorityOptions<S>`: origin plus synchronous own-data `readCurrent()`.
- `CriteriaAuthority<S>`: `require(): CriteriaOrigin<S>`.
- `CriteriaAuthorityError`: code `criteria.unavailable`, fixed message
  `Criteria are unavailable.`, no original error/cause attachment.
- `createCriteriaAuthority`, `getCriteriaAuthorityOrigin`,
  `requireCriteriaAuthority(authority, targetOrigin)`.

There are **no new root exports**. Main owns future public-entry/discovery/package
integration; consumers must not assume these names are already available there.

Construction captures only consumed own-data metadata and the exact reader method.
It invokes no reader/controller method or lifecycle. It freezes new authority,
origin/context and registration copies, not application objects. The reader keeps
its original options receiver. Origin lookup is an inert private-WeakMap lookup,
not a permission check. Successful direct/helper checks return the **same frozen
captured origin**, preserving inferred schema/controller/rule types.

A denied origin may be registered, but require denies before any reader or
controller call. Shared require checks factory identity and exact target origin
before entering the registered implementation; it never reads/calls an arbitrary
public `require` property. Copies, inherited objects, proxies and revoked proxies
do not obtain registration. A copied/extracted direct method does not gain its
original receiver's registration either.

Each event captures one current envelope. Both allowed contexts, exact references
and epoch must match before controller methods are even captured. Then captured
`isDisposed` must return exactly false and captured `getDefinition` must return the
exact origin definition, with the controller receiver retained. No query, clock,
snapshot, rows, subscription, dispatch/accept or resource lifetime is consulted.
Unrelated accepted query/selection/details changes therefore remain eligible.

Envelopes use own data properties on ordinary/null-prototype objects; consumed
accessors reject without invocation. Unconsumed fields are ignored. Context keys
are nonempty strings and access is boolean. Epoch strings (including empty) and
finite numbers are accepted with strict `===` equality; NaN/infinities deny.

## External obligations and limits

The application supplies truthful coherent current expected/actual metadata and
publishes revocation/epoch advancement before subsequent actor work. Unpublished
changes are unknowable. Rule/search/date draft baselines, callback reentrancy
rechecks, option-source invalidation, controlled-proposal retirement and backend
authorization remain separate. These helpers do not confer permission after a
later callback/await and cannot retract data already held by application code.

Async readers are unsupported: native Promise/non-envelope results and ordinary
thenable-only results deny without then/constructor/species access. The module
does not await, discover arbitrary thenability, consume an async rejection, install
global handlers or mutate Promise behavior. Rejected unsupported async work remains
the application's responsibility; no universal Promise containment is claimed.

## Verification

Installed tools only: Node 24.22.0, TypeScript 6.0.3 and 5.9.3, Vitest 5.1.1.
Run from `/tmp/opencode/tableweave-wp09`, in this order where emission is required:

```sh
pnpm exec tsc -p tests/criteria-authority/tsconfig.emit.json
pnpm exec tsc -p tests/criteria-authority/tsconfig.json
node node_modules/typescript-5-9/bin/tsc -p tests/criteria-authority/tsconfig.json
pnpm exec tsc -p tests/criteria-authority/tsconfig.public.json
node node_modules/typescript-5-9/bin/tsc -p tests/criteria-authority/tsconfig.public.json
pnpm exec vitest run --config tests/criteria-authority/vitest.config.ts --configLoader runner --reporter=default --reporter=json --outputFile.json=tests/criteria-authority/.artifacts/unit-results.json
node tests/criteria-authority/check-boundary.mjs
pnpm exec biome check packages/react/src/controller/criteria.ts tests/criteria-authority
node tests/criteria-authority/fingerprints.mjs
```

Results:

- **56 unit tests pass**, including real accepted controller factories/definitions,
  equal-query foreign owners, same-turn scope/ABA, access, target-before-reader,
  real disposal/replacement, unrelated transitions, registration denial, capture
  ordering, malformed/accessor/proxy input, receivers and opaque/async failures.
  Instrumented delegates backed by real controllers are explicitly labeled for
  callback-order/receiver probes; they are not the semantic owner-positive proof.
- Strict source/fixture TS6 and TS5.9 pass. Private emission uses ES2022 without
  DOM/types globals. Own emitted public NodeNext consumers pass on both compilers,
  including meaningful inferred schema/command and readonly/foreign-target negatives.
- Private runtime has **zero runtime imports**. The own declaration closure has
  **four files**, type-only controller/resource/contracts dependencies, no React,
  native/UI/network/storage runtime. A separate bare-Node ESM import/runtime probe
  passes without DOM and installs no rejection handlers.
- Scoped Biome passes; no compiler/lint flag weakening. Two narrowly documented
  test-only lint exceptions allow intentionally poisoned `then` regression inputs.
- Existing-file guard covers **11 controller/details source files**, unchanged.
  Approved details aggregate remains
  `11ddb455e5bcfefde2a1760886cf720a22fd13935e42841ca02d986d7e9ba5da`.

Initial fixture issues were corrected, not suppressed: a Proxy descriptor made
the fixture mutation unwritable; the dependency guard initially confused the
public `require` method name with a CommonJS runtime reference; formatted negative
type directives needed placement at the actual failing properties. Final commands
above pass. No production workaround or relaxed assertion was introduced.

## Fingerprints and boundaries

Production SHA-256:
`80da37ffc9cbfad9b15ead39f0b24833e382adfa45d6d8f6481656d83af654db`.
`fingerprints.mjs` checks the original `.artifacts/baseline.json` and records all
owned files plus unchanged inputs in `.artifacts/fingerprints.json`. The initial
baseline command was `node tests/criteria-authority/fingerprints.mjs baseline`;
**do not recapture it** to excuse unrelated changes. Unit JSON is scoped alongside
private emitted files and Vite/Vitest cache beneath this directory's ignored
`.artifacts/`.

All writes stayed in the two authorized paths. No accepted producer, root index,
configuration, manifest, lockfile, shared build, documentation/ledger, vendor, Git
or install changes; no delegation. Borrowed existing local dependencies and source
imports of actual accepted controller factories are **source proof**, not a clean
tarball/confined-install/public-root, UI integration, framework SSR, manual AT,
performance or full-facade acceptance claim.
