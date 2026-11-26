# WP-09 parallel proof allocation

TASK-017. User explicitly requests more agents for faster parallel delivery.
Shared runtime APIs still have one writer. The following independent work uses
accepted source0288904, not changing U3 metadata or guessed U4 interfaces.

| Work | Exclusive paths / target | Required result |
| --- | --- | --- |
| U3 generic resource | Main stacked tree: resource/{types,adapter,view}.ts and own resource-extent tests | Existing active plan; one runtime writer |
| Initial-domain bootstrap proof | Isolated worktree from0288904; new tests/criteria-bootstrap/** only | Actual native controller/publication fixture preserving authorized initial state/receipts, real reset ordering and strict types |
| Client collection browser proof | Different isolated worktree from0288904; new tests/pagination-policy/native-browser/** only, localhost6541 | Existing NativeCollection/real native hook with unsliced client rows, source-profile runtime, real interactions and preserved paged behavior |
| Live criteria adoption contract | Private read-only reports only | Exact paired-frame/committed-callback/reset contract before tool code |
| Generation integration design | Private read-only reports only | Preserve old approved anchors; propose safe selection/new-generation registration without auto-blessing current output |

Main owns each worktree's frozen-lock install and TASKS allocation before workers
start. No new dependencies, source/index/manifest/lock/config modifications, shared
build, Git writes, .repo/vendor edits or external deployment by proof workers.
Each worker writes only its new test folder/private artifacts and returns a handoff;
main integrates only after independent review and verifies source compatibility.

## Bootstrap fixture boundary

Implement the [selected initial-domain protocol](wp-09-bootstrap-readiness.md) in
application test code, not a library owner/controller wrapper or new factory API.
Use actual registered native owner/CD/publication, a one-use exact candidate/domain
certificate, and actual controlled receipt bookkeeping after dispatch returns.
Prove initial IDs/pending intent unchanged, destructive mount-reset negative control,
unknown history denial, ABA/revocation/certificate reuse/conflict and real reject-first
selection clearing. Busy/rejected/proposed-only cleanup cannot acknowledge success.
Owner lifetime ends P-before-C; borrowed view lifetime is not controller disposal.
Source/types/bare runtime only; React Strict/hydration requires a later explicit lane.

## Browser fixture boundary

Exercise existing actual NativeCollection and native hook, not a newly designed UI,
static row table, fake models, force clicks or adapted vendor styles. Use synthetic
173/311 records, actual filters/ordered sorts, disabled default/custom dormant pairs,
grouped/hidden columns and selection modes/eligible rendered subsets. Confirm >100
actual rows and exact order, unchanged input records, keyboard/selection behavior,
no pagination mutation, and enabled paged controls as the baseline. Explicit complete
server/resource/controls-authority/facade behavior is outside this source fixture.
Use only6541, one worker, actual installed Chromium and pinned temporary profile.
Preserve failures; label source-browser evidence, not tarball/manual/device/WCAG proof.

All tests/config/cache/emission/reports stay in owned scopes. Main preserves source
seals and creates separately named integration baselines; no existing expected hash
or failed generation is overwritten. Independent review is required before any proof
is counted toward final WP-09. No later packet is skipped, approved or merged here.

The later [final-verification timing](final-verification-phase.md) supersedes
per-handoff exhaustive-run timing above. Workers now author provisional proof code,
use lightweight compile/scope checks and defer full runs/reviews to the final phase.
Executed results stay exact; no unexecuted assertion is represented as passed.

Provisional intake handoffs: [bootstrap](../../tests/criteria-bootstrap/README.md)
and [native browser](../../tests/pagination-policy/native-browser/README.md).
Their final authored revisions remain pending the declared final verification.
