# Deferred ordinary-consumer driver boundary — provisional hardening

Review25n2 / AC-26/27. Stage B5e72c95 and its original37-input seal remain history.
Main changes only that stage's deferred consumer driver and adds this fixed target
helper/new fixtures. No consumer is prepared/installed and no app/library code changes.

Only a new direct child of the approved `/tmp/opencode` parent can be prepared.
That parent cannot itself have project/workspace markers; an existing Git worktree,
nested workspace child or substituted target symlink is denied. Installation requires
the exact prepared empty-workspace marker and strict ordinary-consumer `.npmrc`.
Both install passes explicitly ignore parent workspaces and scripts. The compiler
and installed toolkit roots must resolve inside the new consumer's own node_modules;
the driver invokes that exact compiler with Node, never ancestor `pnpm exec` lookup.
No private compatibility profile/patch is applied to the ordinary consumer.

This is a bounded accidental-workspace/target-isolation guard, not an adversarial OS
sandbox, a guarantee against concurrent filesystem replacement or archive/runtime
compatibility. Actual peer/declaration failures remain failures, not repaired by
automatic peer installation. Main still supplies reviewed archives and a fresh target.

Allowed source checks:

```sh
node tests/workbench/wp11-consumer-boundary/check-source.mjs
node --check tests/workbench/wp11-consumer-boundary/boundary.mjs
node --check tests/workbench/wp11-consumer-boundary/boundary.test.mjs
node --check tests/workbench/wp11-examples/consumer/driver.mjs
pnpm exec biome check --assist-enabled=false tests/workbench/wp11-consumer-boundary tests/workbench/wp11-examples/consumer/driver.mjs
```

`check-source.mjs` compares the original driver hash to5e72c95/the sealed producer,
all other Stage B inputs and155 unchanged library sources. It parses source and
checks selected guard/command structure; it does not import the driver or run its
filesystem/native/package operations. Main records actual LIGHT results separately.
Main's static comparison and all four syntax checks pass. Full scoped Biome passes
four supported files after correcting only new fixture/helper formatting and literal
checks; the first formatter/lint failure remains
`/tmp/opencode/wp11-consumer-boundary-biome-first.log`. Passing logs use `final`.
None executes the boundary helper, filesystem adversaries, driver or an install.
The installed pnpm10.13.1 help and existing frozen packed-consumer harness document
`--ignore-workspace`; help inspection does not execute an installation.

The four filesystem adversaries in `boundary.test.mjs` are **UNRUN**. Only the final
phase may execute `node --test tests/workbench/wp11-consumer-boundary/boundary.test.mjs`.
They create/remove exact fresh owned fixtures, never recursively delete a supplied
directory or install packages. No runtime/independent closure of n2 is claimed.
Actual ordinary archives/consumer resolution/declarations/runtime/peer/profile and
TS6/5.9 boundaries remain final and separately required. Drag/G-02 stays blocked.
