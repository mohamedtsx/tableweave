---
name: tableweave-coordination
description: Plan or coordinate Tableweave work packets, allocate task and file ownership, resolve dependencies, review integrated handoffs, or resume an agent task. Does not authorize delegation or execution by itself.
---

# Coordinate bounded delivery

Read [worker workflow](../../../docs/agents/workflow.md), [live tasks](../../../TASKS.md)
and [delivery plan](../../../docs/planning/delivery-plan.md).

1. State current authorization and inspect repository reality. Select only ready
   [packets](../../../docs/planning/work-packets.md); a backlog is not permission.
2. Allocate stable task ID, owner, product/AC/gate links, exclusive paths,
   dependencies/artifact versions, reviewer, done checks and stop rules. Maintain
   TASKS as the only live ledger. Do not invent dates/staffing or completion.
3. Delegate only if user/applicable instructions authorize agents. Serialize
   shared API/manifests/lockfile/TASKS/index edits; give independent workers
   isolated scopes and fixtures. Do not make consumers guess producer contracts.
4. On interface drift/path conflict, pause affected work, reconcile owners and
   record technical or product decisions at the correct authority. Keep unrelated
   safe work moving. Product behavior cannot be downgraded to pass a spike.
5. Review worker outputs against actual source/tests and requirement boundaries.
   Integrate without overwriting unrelated changes; rerun affected combined checks.
   A component/story pass never proves SSR/persistence/accessibility/release.
6. Update task board/detail and handoff with delivered artifacts, actual commands,
   results, limits, blockers and next safe action. Do not close an outcome with
   required missing proof. No commit/push/npm/Figma/Gamila action without permission.

Use [task](../../../docs/templates/task.md) and
[handoff](../../../docs/templates/handoff.md) templates; templates are not policy.
