# WP06 integration worker handoff

App source lives in `apps/example-start`, with [actual commands and composition
notes](../../apps/example-start/README.md). Main alone owns shared integration,
manifests, dependency repair/install, canonical ledger/review and Git delivery.

## Actual tarball consumer preparation

```sh
pnpm --filter @tableweave/react build
node tests/start/prepare-packed.mjs
```

Preparation packs the current built **actual package**, writes its SHA-256 and
copies the Start app into a new `.artifacts/start/packed-*` workspace. Its only
Tableweave reference is `file:../../tarballs/<actual archive>.tgz`; no source
aliases, copied source package or shared node_modules symlinks are introduced.
It does **not install** dependencies.

Main's authorized follow-up in the printed consumer directory:

1. Stage any reviewed app-required dependency extensions/patches for the genuine
   blockers in [UPSTREAM.md](UPSTREAM.md), preserving strict peers and checks.
   Do not copy an unrelated RAC patch into a headless-only consumer and silently
   ignore its nonapplication.
2. `pnpm install` for initial exact-manifest resolution, record the resulting
   lockfile and then verify `pnpm install --frozen-lockfile` leaves it unchanged.
3. Verify the installed Tableweave package resolves inside this consumer, not to
   the source workspace. Inspect packed declarations/runtime and positive/negative
   public API consumers under required TS versions through main's packed harness.
4. Run `pnpm --filter @tableweave/example-start typecheck`, `build`, `test:e2e`, and
   `WP06_PRODUCTION=1 pnpm --filter @tableweave/example-start test:e2e` there, using
   port 6013 exclusively. Preserve the actual Start/default-entry HTTP checks.
5. Check copied client chunks with the same server-only markers as
   `check-client.mjs`, and record exact tarball/client hashes and limits.

No clean packed install/build/browser pass is claimed by preparation alone.

## Main-owned shared integration (completed after original worker handoff)

Main has now added root `test:start`/`pack:start` discovery and a
`packed-consumer.mjs` runner: it prepares a fresh actual archive, explicitly stages
only the approved Start compatibility patches/extension, installs strictly,
verifies frozen lockfile and isolated ESM resolution, then runs actual types/
build/development/production HTTP+browser and client-chunk checks. It is not a
workspace source-alias proof. Complete execution/acceptance is recorded in TASKS
and canonical evidence, not inferred from adding the runner.

Main has now completed that runner, both strict compiler/isolation guards, root
discovery and independent correction review. The completed full workflow and
27+27 actual source/27+27 actual-tarball cases support scoped delegated G-04;
see [canonical evidence](../../docs/evidence/wp-06-start-2026-11-24.md).
The original checklist below explains the obligations; it is not a live task board.

- Root typecheck/build/check must explicitly discover the new app and its isolated
  dev/production browser checks; current foundation build targets packages only.
- Root clean-install harness must include `apps/example-start/package.json` and
  any actual referenced patch files. Preserve fresh frozen lockfile verification.
- Integrate, do not duplicate, this actual Start consumer into the existing packed
  harness; enforce absence of workspace aliases and real declaration/runtime use.
- Root lint should honor the app-owned ignore for generated routeTree/.tanstack
  outputs; no hand-maintained router tree or generated-file suppression is needed.
- Resolve strict vendor declarations before technical acceptance; then independent
  n1 review/fix/reverification and evidence are required. Do not claim G04 from
  builds alone or from synthetic authorization as real-consumer proof.

No native/resource producer, root configuration, manifest, lockfile, canonical
docs/ledger/review or reference file was modified by this worker.
