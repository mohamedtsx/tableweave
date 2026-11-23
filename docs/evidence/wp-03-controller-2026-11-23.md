# WP-03 private coordinator — 2026-11-23

TASK-009; [plan](../planning/wp-03-implementation-plan.md),
[implemented candidate](../engineering/wp-03-controller.md). Pure portions of
AC-03/05/08–11/24–26 and the linked FRs, not full scenario or G-gate acceptance.

## Scope and environment

Local base `a4dd2b1d515ad35e613d094e56c945e5e40efbe0` on
`feat/wp-02-contracts`, dirty WP-03 implementation/tests/docs plus preserved local
merge/acceptance ledger. No WP-03 commit/push/PR or branch/index operation.
Main agent owned all local files. The explicitly authorized background agent
only finished GitHub PR #2; it did not implement or edit local files.

WP-02 was explicitly accepted before this work. Its implementation ancestry is
now merged in remote develop at `21e90d29d53dc98284b49355d245aabf5d21eead`.
Merge status did not substitute for producer acceptance or runtime verification.

Linux, Node 24.22.0, pnpm 10.13.1, TS 6.0.3 with packed TS 5.9.3 cross-check,
Vitest 5.1.1, React/DOM 19.3.1, Vite 7.3.8, Playwright 1.65.1. Dependencies/lockfile
unchanged. Fixtures use synthetic records/IDs, explicit clocks and local ports.

## Sequence and findings

- Wrote and reviewed the bounded plan before feature code; documentation checks,
  all 17 checker probes and whitespace checks passed at that checkpoint.
- Captured two failing initial transition/controller tests: defineController was
  missing. Implemented real producer APIs rather than placeholder exports.
- Built immutable snapshots/validation, pure commands/resets, controlled atomic
  proposal/accept/reject, explicit replacement/disposal and thin React hooks.
- Initial strict build caught schema helper generic revalidation incompatibility;
  validated through a broad internal descriptor while retaining the unchanged
  typed schema at the boundary. No declaration skip or compiler relaxation.
- Initial source-side React server test could not resolve a runtime React package
  from the root harness. Moved actual React server rendering to isolated packed
  consumers, where React/DOM peers are explicitly installed. Browser fixture
  reuses the existing Storybook vendor dependency installation, imports emitted
  Tableweave directly and does not add dependencies or fake a package alias.
- Review added definition fingerprints to prevent pure state/definition reuse,
  safe malformed-command error boundaries, independent listener cleanup and
  idempotent disposal. Expanded ownership/reset/clock/presentation failure tests.
- Intermediate scoped controller tests, local typecheck, both real browser
  fixtures and packed TS 6/5.9/controller/runtime/server-render checks passed.
  These earlier results are superseded by final integrated results below.

## Initial delivery verification (before review session 1)

Final `pnpm check` passed on the delivered source/test snapshot. The first full
attempt reached 196 passing unit tests/docs and headless packing before the host
120-second command limit interrupted the isolated styled install. Repeated with
a 600-second host limit; all stages completed. This was a host timeout, not a
suppressed test failure, forced install or dependency change.

| Boundary | Observed result |
| --- | --- |
| Frozen workspace install | Fresh manifest-only install passed, 317 packages, lockfile unchanged, cache reused |
| Lint/types | 72 code/config files; strict package/Storybook/harness checks including controller/browser sources passed |
| Unit discovery | Nine suites, **196 tests**: 155 accepted contract vectors, 37 controller and four foundation guards |
| Documentation | 71 Markdown files, 457 local links/fragments and 17 checker regression probes passed before final ledger/evidence edits |
| Tarball content | Exact 46-file core and seven-file styled allowlists, private ESM/subpath checks preserved |
| Packed types | Headless/styled both pass TS 6.0.3 and 5.9.3 with strict/exact-optional/skipLibCheck:false, ES2022 only, no DOM/Node typings or workspace Tableweave aliases |
| Packed runtime | Real controlled proposal/read/accept/reset and one subscriber notification; existing guarded contract/date/key functions; actual React server rendering uses captured initialization snapshot after client-state mutation |
| Import/declaration review | Root client directive retained; contracts/filters still React-free; no vendor, React, Node or Blob/File names/imports in emitted public declarations; UI/sortable isolation and CSS checks pass |
| React browser | Real StrictMode mount, selection-only query render isolation, controlled rejection/atomic acceptance, object selector equality/no-op stability and unmount passed on isolated port 6008 |
| Existing browser foundation | Static Storybook build and pointer/keyboard/style/axe smoke passed; two Chromium tests total |

Browser: existing Playwright-managed Google Chrome for Testing 159.0.8154.6 on
Linux; no manual AT session. Nonfatal existing Vite ignored-client-directive and
large Storybook chunk warnings remain, not SSR/performance proof.

Final transient report: `.artifacts/packed-nSuRaY/report.json`. Tarballs, installed
consumers/bundles and browser output stay ignored/local, not durable tracked proof.
Durable sanitized fingerprints:

| Artifact | SHA-256 |
| --- | --- |
| Core private tarball | `5ba16c7cbd73516e871284993e8e7116db189a35981940fc0ef008b78ea03624` |
| Styled private tarball (unchanged) | `cdf073ec9505ccd8dd0582b9805ada2152af969f0263c3296bb8abff709a8ff2` |

Reviewed the source, failure paths, fixtures, exports/declarations and scoped diff
after verification. Only final protocol/evidence/TASKS Markdown changed afterward;
documentation/whitespace checks rerun on that update. Maintainer acceptance remains
pending. Earlier scoped counts/reports are not the final integrated artifact.

## Review session 1 — n1–n2 corrections

Same base/branch and local WP-03 scope; no dependency or public API change.
Reports were reproduced before changing the implementation:

- `pnpm exec vitest run tests/controller/review-regressions.test.ts` failed all
  four direct/functional null order/visibility assertions (expected throw, none).
- After rebuilding the unchanged baseline, Chromium
  `pnpm exec playwright test tests/browser/controller.spec.ts --grep "n1:"`
  failed with inline effect count **3 instead of 2** following an unrelated parent
  commit. Stable selector effects and controller revision did not change.
- Selector correction adds a hook-local last-committed value. Reader recreation
  compares against it with current equality; only a commit-phase effect writes
  that baseline. It is not updated from speculative snapshot/selector reads.
- Validation correction distinguishes own omitted keys from explicit null values.
  Order/visibility commands reject malformed direct/functional values; initial
  group/metadata nulls also reject, while valid omitted/partial seeds retain defaults.
- Scoped after: **49 controller tests**, **three controller Chromium tests** and
  local strict harness typecheck pass. Regression coverage additionally preserves
  pending controlled intent, proves changed inline selector props/store state
  update, and adds the four null cases to packed runtime invocation.

Final `pnpm check` passed on the corrected snapshot:

- Fresh frozen install, unchanged lockfile, 73-file lint and strict package/
  Storybook/harness types.
- **208 unit tests / ten suites**: 155 contracts, 49 controller (including 12 new
  n2/default/atomic-rejection tests) and four foundation guards.
- 17 documentation probes, exact 46/7-file tarball allowlists, isolated strict-peer/
  frozen installs and headless/styled TS 6.0.3/5.9.3 consumers without declaration
  skips or DOM/Node typings.
- Real packed direct/functional null order/visibility rejection, unchanged state/
  revision/subscriber count, existing controller/server-render checks and Vite
  import/bundle/CSS guards.
- Static Storybook and **four Chromium tests**: unchanged vendor/axe smoke,
  existing accepted-state/selector fixture and two new inline-selector regressions.
- Inspected corrected source and emitted declarations: no React/vendor/Node/DOM
  type leakage or public API/dependency change. Existing nonfatal build warnings
  remain unchanged. Final handoff edits are Markdown-only; docs/whitespace checks
  rerun afterward. No WP-03 acceptance/G-gate/SSR-framework pass is implied.

Current transient report: `.artifacts/packed-VKiuTK/report.json`. Durable SHA-256:

| Artifact | SHA-256 |
| --- | --- |
| Corrected core private tarball | `600f17bd9eedaa653d567f049e0ffbf7e9440ee419852b45df21fd477d2abf65` |
| Styled tarball (unchanged) | `cdf073ec9505ccd8dd0582b9805ada2152af969f0263c3296bb8abff709a8ff2` |

Reports, tarballs and browser traces remain ignored/local. The 196-test/tarball
evidence above belongs to the pre-review snapshot only. No Git writes were made.

## Maintainer acceptance

The maintainer explicitly stated “I accept WP-03” after review session 1 n1–n2.
TASK-009 is done and the review is closed; retained review notes are not cleared.
Acceptance applies to the reviewed local runtime/declaration snapshot measured by
the corrected core tarball fingerprint above. The subsequent acceptance update is
Markdown-only, with documentation/whitespace checks; runtime tests were not rerun
or backdated for that update. Source remains uncommitted on base `a4dd2b1`.
No commit, push, new PR, next-packet execution or release is authorized by acceptance.

## Limits

Controlled proposals and React synthetic fixtures do not prove native TanStack
callbacks/row processing, HeroUI collections, resource/data races, backend access,
actual Start/Next request isolation or hydration. Bare React server rendering is
not a framework SSR gate. No visual table design, manual accessibility, benchmark,
real-consumer, G-01–G-05 or publication pass is implied. No services, fetching,
telemetry, storage or default key logging. Controller keys/snapshots can contain
filter intent and remain application-private. WP-03 is now accepted as a producer;
dependent packet implementation still needs separate authorization. No broader
acceptance outcome is promoted by this review disposition.
