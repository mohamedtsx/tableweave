# Next ordinary preparation target — source-only correction

Review26n3 / AC-26/27. Original Next source17a1439 and its80-input seal stay
historical; the connection correction16500a0/44-input seal remains byte-identical.
Main changes only `wp11-next/packed/prepare.mjs` and this new fixture directory.

Preparation now uses the preserved approved direct-child target helper from
`wp11-consumer-boundary/boundary.mjs`, **before** archive reads or target writes.
It requires absolute real archive inputs, creates only the exact new directory
nonrecursively and writes the shared empty-workspace marker/strict standalone
configuration. It still does not resolve a lock, install, emit, apply a private
patch, execute Next or prove compatibility. No target was prepared during LIGHT.

The earlier producer has exactly two disclosed body changes: the connection owner
and this preparation runner. No original map/pin/README is re-signed. The static
checker anchors this runner's preimage to17a1439 and verifies the other78 original
inputs, all44 connection-correction inputs and155 unchanged library source hashes.
This does not turn an isolated whole-tree pin into a current primary pin.

Source checks only:

```sh
node tests/workbench/wp11-next-consumer-boundary/check-source.mjs
node --check tests/workbench/wp11-next/packed/prepare.mjs
node --check tests/workbench/wp11-next-consumer-boundary/preparation.test.mjs
pnpm exec biome check --assist-enabled=false tests/workbench/wp11-next-consumer-boundary tests/workbench/wp11-next/packed/prepare.mjs
```

Main's static scope comparison, three syntax checks and full scoped Biome pass
after formatter-only corrections to the new helper/test and changed preparation
lines. The first formatting failure remains
`/tmp/opencode/wp11-next-preparation-biome-first.log`; passing logs use `final`.
No preparation, helper filesystem operation, Node test or installation executes.
The new preparation adversary and
the shared helper's four filesystem adversaries are **UNRUN**. Final-only:

```sh
node --test tests/workbench/wp11-consumer-boundary/boundary.test.mjs tests/workbench/wp11-next-consumer-boundary/preparation.test.mjs
```

Before any future ordinary install, main must review actual archives/strict peers,
create/review a consumer-local lock with `--ignore-workspace --ignore-scripts`,
then frozen materialize under the same target guard. Verify installed toolkit,
compiler and framework resolution is confined to that consumer and no parent/global
private profile leaks in. This preparation patch does not implement or pass that
separate install/runtime lane. Keep failures rather than auto-install peers/patches.
The guard is not an OS sandbox or protection against concurrent filesystem races.
Runtime/ordinary Next/negative RSC/build/hydration/independent proof and drag/G-02
remain deferred or blocked, not accepted by source parsing.
