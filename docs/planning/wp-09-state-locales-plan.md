# WP-09 table-state locale extension — isolated main-owned lease

TASK-017 / FR-16. Actual S1 now defines DataTableLocale/DataTableStateMessages.
Main owns only new localization/data-table.ts and new tests/localization-state/**
in an isolated worktree from76c3823. All existing sources/tests/11-port locale
bundles/exports/config/manifests/lock stay frozen. No new dependency or shared build.

Compose englishDataTableLocale and arabicDataTableLocale from the actual existing
locale objects and a complete readonly14-string state dictionary. Preserve old
message/function/operator-label references; freeze new owned containers only.
This is data-only source-module API, not new default UI behavior or root exports.
Source-only/error/unknown-empty language must not imply a count, known cause,
backend authorization or automatic transport/Retry. Field overrides remain later
actual owner capture. Native-language/manual RTL acceptance remains deferred.

Author exact keys/old-reference preservation/immutability/representative strings
and inference fixtures. Only one positive TS6/syntax/scope check now; unit/runtime/
negative/dual/emitted/graph/browser/packed/independent proof stays deferred.
Record exact baseline126/protected inputs and results. Keep source separate until
the active shared S2 and isolated Date/D2 protected-source handoffs finish.

## Preserved provisional handoff

Isolated271d843 records the one new source/eight own fixture files. Final9-input
aggregate35fca2131fd6a210e5e431512be4bfa610f93989fe2f3b76799f89cd59db3cca; source SHA
250d0e3c4036ad2815d44e213e00f7c53cb3c82a1bf72451ae5c5ca86ee4c44f. Both positive
TS6 programs pass (the second follows source formatting correction); final scoped
Biome/syntax/whitespace and1057 tracked-input/126 source comparisons pass. Two
formatter failures are preserved, not converted to test passes. No runtime/negative/
manual/graph/independent check runs. Intake and actual default/export wiring remain
separate. The isolated tests/localization-state/README.md owns exact commands/limits.
