# WP-09 option-source criteria reset bridge — provisional isolated lease

TASK-017 / FR-13/16, AC-16/25. Main accepts the source-owned two-phase mechanism
proposed by the private exact-adoption report, with the corrections below. This
stage is independent of U4: use actual plain criteria/publication and option APIs,
not changing native/presentation sources. Final verification remains deferred.

## Paths and ownership

In a separate worktree from1a1086d, one worker owns only existing
packages/react/src/filters/options-source.ts, new filters/options-criteria.ts,
new filters/options-criteria-core.ts and new tests/options-criteria/**.
No existing editor-types/public exports, criteria/publication/controller/native/
resource/presentation/UI/config/manifests/lock/tests/docs/Git changes. Main owns
frozen install, intake and public discovery. Source construction stays inert.

## Required implementation

- Only genuine createOptionSource results acquire an internal reset capability in
  the core module's WeakMap. The core has no runtime criteria/publication/React/
  native dependency; importing the legacy source must not pull in those graphs.
- registerOptionCriteriaSource takes publication, actual publication-issued criteria,
  existing BuilderFieldId and genuine source, and returns exact release. Use the
  **actual registerParticipant** method, not the proposal's shorthand P.register.
  Verify exact publication binding/origin/context/field before private source work.
- An initial claim requires quiescent virgin or explicitly acknowledged-reset source;
  equal context/empty public snapshots are not proof. A populated unbound source
  needs real owner clear/reset at a safe boundary, not implicit erase/adoption.
- Publisher purge synchronously clears actual IDs, known labels, request/page/retry/
  open state and blocks usability without app callbacks, notifications or disconnect.
  It installs a fresh barrier/ticket even for same-context resets. In-flight source
  capture/mutations recheck the barrier before writes and after callbacks/reflection.
  A purge must not be followed by old-buffer resurrection or old retry transport.
- Cleanup completes that exact ticket at a safe nonbusy source boundary, invoking
  the original onInvalidate receiver and notification once per acknowledged phase.
  Busy, throwing, nonvoid or async acknowledgement fails safely and remains owed;
  do not infer completion from public clear's void/noop return. No automatic retry,
  epoch increment, then/species inspection or universal Promise-containment claim.
- Preserve original purge/cleanup ownership across retries and superseding domains.
  Real purge.next is null; cleanup may be another event with captured proposed next.
  Match by participant/operation/previous ownership, not event object identity.
- After successful transition cleanup remain blocked until explicit new settled-domain
  registration. A stale release cannot clear/reactivate a replacement; keep the old
  source claim until actual cleanup acknowledgement. Failed registration leaks no claim.
- Registration adds no connect/subscription/transport. Existing one passive connection
  remains owner-managed. Raw omitted-adoption clear/context/connect/request semantics
  stay compatible; do not add OptionSource.reset or change legacy nonvoid callback policy.

Safe fixed errors contain no raw callbacks/labels/context payload. Known source reset
echoes must not recurse publication; genuinely new same-tag/access changes must not be
silenced as echoes. Unknown structural/custom sources deny only the adopted bridge.

## Handoff

Author source/bridge regression cases covering real publisher transitions, ABA,
busy/capture/notify reentry, stale tokens/retry, selected-label purge, failed cleanup,
release/debt and two independent owners; include unchanged raw-route controls.
Use only lightweight TS6 compile/syntax/scope checks now. Units, dual compiler,
negative/import/lifetime/browser and independent verification stay deferred to the
user's final phase. Own README records exact APIs, source/fixture hashes, actual
checks and deferred commands. No approval, full privacy/SSR or release claim.
Stop with concrete path/API conflict before editing outside this lease.
