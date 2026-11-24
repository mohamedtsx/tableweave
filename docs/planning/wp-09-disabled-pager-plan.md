# WP-09 disabled pager/correction safety — isolated provisional lease

TASK-017 / FR-12, partial AC-24/25/26. Main permits independent UI-policy guards
against accepted0288904 while U4 changes separate native/presentation files. This
does not require U4's new modes/metadata to implement the trusted false-policy gate.
Final integrated verification is deferred under the user's phase decision.

## Exclusive paths

In the isolated native-browser worktree at7e05505, one worker owns only
packages/heroui/src/pagination/{Pagination.tsx,usePaginationCorrection.ts,types.ts}
and new tests/pagination-policy/pager-disabled/**. Existing browser proof is frozen.
All headless/resource/native/presentation/controller/metadata/tools, correction-
capture.ts, existing tests/styles/messages/profile/assets/root config/manifests/lock/
exports/docs/TASKS/Git stay read-only. No install/shared build/browser matrix/agents.
Main owns later three-file intake into U4; no shared runtime writer collision.

## Exact authored behavior

- Pagination returns null for normalized schema.pagination.enabled===false before
  reading presentation/authority/locale/messages/formatter/retry callback ports.
  Its current eager parameter defaults must not read facts first. Hooks remain
  unconditional; local focus bookkeeping may clear after commit but no focus theft,
  global DOM/inert change or animation/style change is allowed.
- For enabled schema, an explicitly supplied disabled/invalid new paginationEnabled
  fact must not invoke formatters. As the isolated parent lacks U4's required field,
  a descriptor-safe own-data check may deny a supplied false/invalid value while
  legacy absent facts retain their old coherent-host precondition. Never use this
  display flag to grant event/backend permission or rewrite foreign facts.
- PaginationComponent's return is ReactElement|null; no other public prop API change.
- usePaginationCorrection still invokes hooks unconditionally. Determine false
  policy from the supplied actual controller's immutable getDefinition metadata,
  fail closed on unusable metadata, and skip origin/context/authority/readCurrent
  capture/effect work before private ports when disabled. Do not call context getters
  to discover paging policy. Native/app command/state guards remain mandatory.
- Enabled correction logic, attempt ownership/final epoch/state checks and existing
  Promise limitations stay unchanged. No correction-capture rewrite, timers,
  retry/timeout relaxation or global rejection observation is part of this lease.
- The later facade conditionally mounts a separate pager/correction child only for
  enabled policy. These raw gates protect deliberate misuse; hiding is not unslicing.

## Provisional proof code and handoff

Author tests for false schema with poisoned presentation/formatter/message/authority
ports; disabled correction with hostile context/readCurrent and stale clamp-looking
facts; zero port/dispatch/attempt work; transitions between true/false without hook
order errors; and enabled baseline formatting/correction/focus behavior. Use genuine
controllers/authorities for allowing cases; hostile structures are denial tests only.
No fake permitting frame, static table, existing-assertion removal or CSS adaptation.

Only lightweight syntax/type/scope checks now. Author browser/React cases if needed
on6543 but do not launch the new full suite; preserve old14-case native-browser
reports untouched. Record all unchanged source/accepted proof inputs in a new stage
map; old105-source browser guard stays historical. Exact commands/results/deferred
checks go in own README. No verification approval/SSR/manual/WCAG/full-WP09 claim.
Stop if an excluded field/API or runtime change is required; main owns allocation.

Provisional isolated49c641e is intaken as8cdbae3 after U4 handoff. The
[actual handoff](../../tests/pagination-policy/pager-disabled/README.md) records19
authored/unexecuted cases and lightweight TS6/scope results. Main's integrated
whole-HeroUI TS6 compile passes; no behavioral/independent acceptance follows.
