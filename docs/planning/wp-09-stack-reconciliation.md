# WP-09 prerequisite transport onto WP-08

TASK-017. Main owns transport/Git/shared integration. Source snapshot is
dcfeb874b1a7757f0e86b61a1573c20030056f1a (101 changed paths from accepted WP-05).
Candidate parent is fadb9a8e226f4a7111f062c5e6d00a7ce1235ebb. Final parent selection
still requires its running push/PR workflows to complete. No shared-core behavior
or consumer implementation is authorized merely by this transport plan.

## Measured overlap and reconciliation

Read-only Git comparison finds95 source-exclusive paths,433 parent-exclusive paths
and exactly six overlaps. Carry every source-exclusive path byte-for-byte and keep
every parent-exclusive path byte-for-byte. Reconcile only:

| Shared path | Required result |
| --- | --- |
| REVIEW.md | Preserve all WP-08 sessions; append WP-09 sessions with their original scoped disposition. Keep historical sessions distinct. |
| TASKS.md | Preserve WP-08 delivery history and add the current WP-09 handoff/leases, not the older WP-05 task status. |
| docs/engineering/README.md | Add details and prerequisite evidence links to the current parent index. |
| packages/heroui/src/index.ts | Add details exports/types without dropping current tools/controls exports. |
| packages/heroui/src/styles.css | Add the details import without wrapping its already-owned layer or changing current CSS rules. |
| tests/foundation/copy-styles.mjs | Add details to the current explicit componentRoots; retain recursive regular-file/symlink guards and direct-run detection. |

Do not copy old package manifests/lockfiles, replace current test discovery or discard
any WP-06/07/08 compatibility asset. Do not stage dependency symlinks/node_modules or
generated evidence. New plain modules remain module-only; public export/discovery
integration is a separate intentional delta, not an accidental cherry-pick side effect.

## Verification and fence

Record exact source/parent/combined commits and SHA maps. Prove all95/433 exclusive
path bytes preserved and inspect each of the six resolutions. Re-run lint/docs and
build/type checks on the real combined install; preserve existing reviewed generation
hashes as historical anchors, never replace them with current outputs to force a pass.
New details root exports/CSS intentionally change package output, so strict WP-08
fixed-generation gates require a separately reviewed generation integration rather
than pretending the old180-file generation remains current. Keep that work explicit.

Source prerequisites' protected-input maps likewise describe their original producer
boundary. Retain originals and record a separately named combined baseline before
authorized store/reducer/native/resource changes. A source transport/type pass proves
neither unpaged execution nor actual publication/tool/React/SSR/backend completeness.
Independent reconciliation review precedes new shared-core implementation leases.
