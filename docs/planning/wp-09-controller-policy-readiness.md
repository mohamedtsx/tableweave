# WP-09 controller policy readiness — no implementation lease

TASK-017 / FR-12, D-10/D-24, partial AC-24/25/26. Read-only review reconciles the
approved four-file policy with actual final WP-08 source, rather than treating this
worktree's older controller as final authority. This selects the next algorithm,
not code execution, full unpaged support or passed integration.

## Selected final-stack algorithm

The later WP-08 store captures commands and calls private validateCommand before
the reducer. Reducer-only guards would therefore run too late for that callback.
The minimal future source lease is controller/{store,reducer}.ts and a new isolated
controller-test folder, **after the dependency fence below**.

- Preserve existing mutate/disposed/reentry and complete descriptor-based capture.
  Insert static disabled-page policy at the start of existing private validateIntent,
  before validateCommand. Inspect the already captured envelope's own type descriptor,
  not original input/payload or an updater. For pagination.change/clamp with normalized
  enabled===false, throw existing ControllerError state.capability.
- This common path covers dispatch and revalidation of retained original intent
  during accept; exact current-proposal/base-revision checks still precede accept's
  validator. No new callback option, union, receipt, wrapper or reset API is required.
- Keep early guards in both public pure reducer cases before payload reads/updaters.
  Definition/revision preconditions remain first. Store capture failures keep their
  original priority; do not claim every malformed/accessor input yields capability.
- After valid capture, unsupported false-policy commands call neither command/state
  validators, updater nor clock; state/previous pending/notification refs stay intact.
  Enabled/omitted/true path keeps existing capture→command-validator→clock→reducer
  order. This supersedes the older pre-WP-08 proposal's clock-before-denial count.
- query.replace stays legal. Capture preserves its actual updater/envelope; reducer
  validates its entire original candidate before resets/equality. Functional updater
  executes once to reveal that candidate. Noncanonical dormant pair rejects before
  parser rule callbacks/private state validation, but private validateCommand can
  legitimately run before the candidate is known. Do not advertise zero all-callbacks
  or launder a forbidden original pair through page reset/partial replacement.

## Mandatory reset remains the application owner's route

Actual WP-08 native construction composes fixed capability/state constraints plus
optional app validators; it does not install global source/publication readiness.
The accepted example rejects actual pending receipts first, uses bare app-owned
controller.dispatch(selection.cancel), accepts a proposed clear after dispatch
returns, and only then publishes new expected tags/app epoch. Resource invalidation
may already have denied access/changed actual scope/cleared its request before this
callback, so UI authority is not a prerequisite for mandatory application cleanup.

Do not weaken stale UI-origin checks or add bypass flags. UI authority Cancel has
its own same-origin/scope policy; bare application ownership remains separate.
Do not install a blanket publication-ready predicate on the base native controller:
deny-first retirement deliberately runs while publication permission is absent.

The existing example external helper returns void and is not a general retirement
acknowledgement. Future adapters must inspect real dispatch/accept statuses and
accepted empty-selection postconditions. Busy, guarded, stale or callback-rejected
work must not be acknowledged by catching and returning undefined. Commit notification
failures do not undo a completed reset. Existing generic publisher source tests use
the older real controller and prove no final native/source reset integration yet.

## Fence and future proof

Finish independent publication review with all its protected controller inputs
unchanged. Freeze approved details/criteria/pagination/execution/publication sources,
then reconcile onto the actual delivered WP-08 parent. Read the resulting combined
store/reducer/types/validation before authorizing two-file changes. Existing source
seals and golden expectations stay historical; use a separately named new baseline
for intentional shared-core deltas, never rebase old protected maps to make them pass.

The future plan must cover capture precedence/zero forbidden callbacks/noops/clamps,
original query replacement, exact pending acceptance/rejection/guard and notification
behavior, default paged golden parity, relative-boundary and definition/ABA safety.
Use actual final native/store/source model plus approved policy in source-proven
bridges, not frozen dist as purported candidate. Separately prove real app/publication
retirement after source revocation and callback rejection. Existing G-03 dist tests
are not new-source proof without a declared build/consumer boundary.

Native client filter→sort still needs unsliced execution; server page is not complete
provenance. Resource/request/binding extent, explicit complete native input, disabled
control projection, no mounted pager/correction hook and facade remain future owners.
Controller safety alone is not a usable unpaged table. No source edits, public exports,
SSR/browser/packed/full AC/backend authorization or personal/merge approval follows.
