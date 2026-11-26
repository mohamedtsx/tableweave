# WP06 strict declaration blockers (initial actual reproduction)

In `/tmp/opencode/tableweave-wp06`, after the exact strict-peer install supplied by
main and a successful actual Start production build:

```sh
pnpm --filter @tableweave/example-start typecheck
```

App-owned parseQuery `.value` references were corrected to actual `.data`. The
following independent vendor errors remain; no suppressions/ambient stubs/casts
or dependency changes have been applied by this worker.

- `@tanstack/start-server-core@1.169.40/dist/esm/session.d.ts:23` references an
  undeclared `_Algorithm` in `SealOptionsSub<TAlgorithm extends _Algorithm =
  _Algorithm>`. The preceding declarations define `EncryptionAlgorithm` and
  `IntegrityAlgorithm`. Main should compare the exact upstream source and consider
  an exact declaration-only restoration of the missing union alias, not `any`.
- Its `request-response.d.ts:4` imports `StandardSchemaV1` from
  `@standard-schema/spec`, which that isolated dependency cannot resolve. Main
  should review metadata and add the genuine dependency through a scoped package
  extension/exact dependency disposition; an app-only hoist is not proof of a
  repaired dependency contract.
- `unplugin@3.7.0/dist/index.d.mts` eagerly imports type declarations from absent
  optional bundlers: `@farmfe/core`, `@rsbuild/core`, `@rspack/core`, `bun`,
  `rolldown`, `unloader`, and `webpack`. `webpack-virtual-modules@0.6.2` also imports
  absent `webpack`. Main should select a metadata-compatible exact unplugin
  release with complete declarations, or explicitly plan actual type dependencies
  and their peer footprint. Do not replace missing types with ambient any, skip
  library checking, or quietly exclude config checks.

Main owns manifests, patches, lockfile, installs and canonical disposition. The
app's Vite production compiler already works; build success is NOT strict type
acceptance. Re-run full strict app/config checks and actual-tarball checks after
the reviewed repair.

## Main repair applied — strict app/config check now passes

The [pre-install disposition](../../docs/planning/wp-06-implementation-plan.md#strict-vite-declaration-repair-disposition--2026-11-24)
preserves exact runtime versions and compiler checks. Two declaration-only patches
restore the shipped source algorithm union and reference the genuine public
Router `/vite` entry for the same CodeSplittingOptions type. An exact declaring-
package extension adds Standard Schema1.1.0 and existing cookie-es3.1.1.

`pnpm --filter @tableweave/example-start typecheck` now passes with all original
strict settings. Full-file comparison against unpatched installed packages finds
only session.d.ts among **80** server-core files and the base/Vite schema.d.ts
among **346** plugin-core files changed. All runtime/license bytes match. No
unplugin API, unrelated bundler, ambient type or skipLibCheck waiver was needed.
The two root patch/hash/path integrity checks pass. Frozen full install and the
actual standalone tarball Start consumer remain separate required evidence;
`tests/start/compatibility.mjs` explicitly stages only app-required repairs because
root pnpm configuration does not propagate through Tableweave archives.
