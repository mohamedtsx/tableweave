# WP-09 combined source baseline — 2026-11-24

TASK-017. Delivered WP-08 parent is fadb9a8e226f4a7111f062c5e6d00a7ce1235ebb;
push45396781964 and PR45396795693 both complete successfully. PR #8 remains OPEN,
unmerged, base WP-07, auto-merge null. Earlier failed workflows remain historical.

## Source transport acceptance

Source dcfeb874b1a7757f0e86b61a1573c20030056f1a reconciles as0a63a25; follow-up
a8d46119401e6d63d1ddedd33950685d98b85960 replays asfee0bb5c177ece4f00ee2f4125f198e66dc86a81.
Independent Git-byte/mode review confirms original95/433 and follow-up97/433
exclusive-path preservation with zero mismatches. All610 unaffected parent paths
remain exact. Six shared resolutions preserve histories/exports/CSS/layers and safe
recursive copier; eight independent copier fixtures pass. All105 runtime sources
remain unchanged during review. Later main-owned status/plan additions are separately
identified, not mislabeled as original source-document bytes.

Main grants **agent-approved under delegated authority** for transport only.
The approved prerequisite boundaries and their [historical evidence](wp-09-prerequisites-2026-11-24.md)
remain intact. No generation/native/resource/facade/full WP-09 approval follows.

## Reproducible source identity

The named pre-U1 baseline covers all tracked packages/{react,heroui}/src regular
files:105 entries. For each repository-relative path, record Git mode and SHA256
of actual file bytes; serialize the map with Python json.dumps(sort_keys=True,
indent=2), then terminal LF. Aggregate:

`b9a3e8ee7deeac595ddc168c3ea7e23bef83c4425b96f455a68ef8156cf725b5`.

Main independently verifies every path/hash against its earlier105-entry map and
replays this serialization. The earlier c6ce30d0… digest uses sorted
"hash  path\n" lines, so it is a different representation of the same source bytes,
not a conflicting baseline. Neither is an emitted-generation whitelist.

## Actual combined checks and open integration boundary

- `pnpm install --frozen-lockfile`: all five projects,367 packages; no lock change.
- `pnpm build`: both actual packages pass TS6 emission and safe style copying.
- TS5.9 noEmit package checks: react/heroui pass unchanged strict configuration.
- `pnpm lint`:498 files; docs checker and18 regression probes pass.
- Actual source suites: policy267, execution348, publication88, plain criteria56,
  details9 pass. Counts overlap; they are not a summed unique-test total.
- Installed RAC clone byte verifier and42 compatibility-asset probes pass; these
  are not a fresh genuine packed-consumer/runtime confinement claim.
- Default Vitest:650 passed/**2 failed**. Both unchanged generation tests observe
  new199 output files instead of WP-08's reviewed180. Preserve those failures and
  old anchors until separately reviewed public-generation integration. No full
  `pnpm check`, new browser/SSR/tarball or whole-feature acceptance is claimed.

## Next bounded implementation

Transport review and combined source checks permit main to activate only the
[U1 guard plan](../planning/wp-09-controller-guards-plan.md): controller/store.ts,
controller/reducer.ts and new isolated tests. Capture/validation/receipt ordering
and prechange paged bytes must be preserved. All other runtime sources stay frozen.
Native client unslicing, explicit complete request/binding/projection, pager safety,
tool publication/commit adoption, facade/localization and public verification remain
separate serial scopes. No automatic hash rebase, backend authorization or merge.
