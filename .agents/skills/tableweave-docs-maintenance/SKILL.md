---
name: tableweave-docs-maintenance
description: Reconcile Tableweave PRD or HLD changes, maintain local documentation and skills, inspect source provenance, or audit requirement and navigation coverage. Use for documentation work, not as implementation authorization.
---

# Maintain the knowledge foundation

1. Read [project map](../../../PROJECT.md), [documentation router](../../../docs/README.md)
   and active [task](../../../TASKS.md). Select canonical owners; keep `.repo/`
   read-only and preserve unrelated staged/untracked work.
2. For source changes, fetch affected PRD/HLD content and inspect returned
   revision/verification/truncation/unknown-block metadata. Missing counters are
   unknown, not zero. Compare [manifest](../../../docs/reference/source-manifest.md),
   detailed prose/tables/acceptance, not IDs alone. No Notion writes unless asked.
3. Product owns intent, engineering/design intended contracts, ADR rationale,
   skill procedure, task live state and evidence dated observations. Keep details
   in one owner and repair navigation instead of copying policy.
4. Preserve FR/D/ADR/G/F IDs and exact exclusions/defaults/boundaries. Record a
   contradiction with both passages and affected owners; never repair it silently
   or reinterpret unexecuted proof as open product scope.
5. Update affected acceptance, traceability, packet dependencies and source
   disposition together. Record durable verified findings in the right owner;
   keep bootstrap concise and task-sized context paths usable offline.
6. Run actual [README checks](../../../README.md#check-documentation); independently
   compare all source sections and unnumbered constraints. Exercise representative
   worker reading paths. Structural checks do not establish semantic equivalence
   or implementation behavior. Report exact limits in [evidence](../../../docs/evidence/README.md).

No runtime scaffolding, dependency install, external publication, source mutation
or reference repair is authorized by this procedure. For coordination and status
use the [worker workflow](../../../docs/agents/workflow.md).
