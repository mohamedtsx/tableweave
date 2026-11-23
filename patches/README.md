# Exact upstream declaration repair

`react-aria-components@1.22.1.patch` modifies only `Group.d.ts` and
`OverlayArrow.d.ts` to avoid contradictory inherited optional properties under
TypeScript's exact-optional check. React HTML attribute bases omit keys already
owned by Aria; the authoritative Aria properties remain. No runtime file changes.
Each modified declaration carries a prominent modification comment.

Origin: Adobe React Aria Components 1.22.1, **Copyright 2019 Adobe**, Apache-2.0;
the accompanying [license](LICENSE-APACHE-2.0) applies to the upstream material.
This is not Tableweave-owned MIT source or a complete third-party/legal audit.
No separate NOTICE file was present in the inspected upstream package.

See the [bounded disposition](../docs/planning/wp-04-implementation-plan.md#compatibility-repair-disposition--2026-11-24)
and [ADR-07](../docs/adr/README.md#wp-04-adr-07-compatibility-disposition).
Exact pnpm registration/lock hash and frozen clean-install checks make application
fail-closed. Remove after a reviewed stable upstream replacement passes the same
checks. No upgrade, ignored patch failure, declaration shim or strictness waiver.

The root pnpm patch does **not** propagate through Tableweave tarballs. Public
declarations must compile in unpatched NodeNext TS5.9/6 consumers; direct raw
HeroUI/RAC imports retain their upstream limitations. Package builds use Bundler
resolution without relaxing exact optional checks or skipLibCheck:false.
