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

## Start Vite declaration repairs

The two exact TanStack patches retain runtime bytes and genuine source types:
server-core1.169.40 restores its omitted algorithm union; plugin-core1.171.50
references the public Router Vite entry for the same CodeSplittingOptions type.
The root extension also declares Standard Schema1.1.0/cookie-es3.1.1 on server-core,
where its declarations import them. These are app-only Start compatibility needs,
not Tableweave library dependencies. See the
[WP-06 disposition](../docs/planning/wp-06-implementation-plan.md#strict-vite-declaration-repair-disposition--2026-11-24).
TanStack upstream material is **Copyright (c) 2021-present Tanner Linsley**, under
the accompanying [MIT license](LICENSE-TANSTACK-MIT). Exact modifications are
identified in these patch notes/diffs; no runtime file is modified. This is not
a complete release legal audit. The standalone Start harness carries only these
app-required patches/extension explicitly; no root repair propagates through a
Tableweave tarball automatically. Removal requires a reviewed stable replacement
passing strict app/config, frozen install and actual HTTP/browser/tarball checks.

## HeroUI calendar type-entry repair

Exact `@heroui/react@3.2.8.patch` changes only Calendar/RangeCalendar scoped entry
declarations to reference the genuine CalendarYearPicker scoped types instead of
the entire component barrel. This removes unrelated TS6 declaration conflicts
from the actual used graph without erasing or replacing types. Runtime/version
and strict flags are unchanged. See the
[WP-07 disposition](../docs/planning/wp-07-implementation-plan.md#calendar-declaration-repair-disposition--2026-11-24).
Upstream material is **Copyright 2025 NextUI Inc.**, Apache-2.0 under the
accompanying license terms; see [attribution](NOTICE-HEROUI). All modified
declarations carry prominent modification comments. These notes
and the exact diff identify our declaration modification; no vendor runtime is
copied or modified. Direct raw-barrel users retain upstream limitations. Remove
only after a reviewed stable replacement passes the same strict/packed/browser
proof; no patch failure waiver or publication/legal acceptance is implied.
The same patch also scopes ListBox item/section references to their genuine
existing exports, for the same reason. Its complete expectation is exactly the
Calendar, RangeCalendar and ListBox entry declarations; no runtime file changes.
