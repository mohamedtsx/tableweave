# Review notes

Temporary scratchpad for maintainer feedback, separate from the live task ledger
in [TASKS.md](TASKS.md). Note numbering (`n1`, `n2`, …) restarts in each new review
session. Keep session context while notes are retained; labels are not TASK IDs
or acceptance of the whole work packet.

When the maintainer no longer needs these notes, they can be cleared on request.
Keep applied decisions in their canonical documentation/code first, so clearing
the scratchpad does not lose the guidance. No notes are cleared by this move.

## WP-01 — review session 1

Reviewing TASK-003. WP-01 remains in review; WP-02 is not started or authorized.

### n1 — HeroUI component reference

- **Request:** use the official
  [HeroUI v3 Storybook](https://storybook-v3.heroui.com/?path=/docs/welcome--docs)
  for component lookup instead of relying on the main HeroUI site, which the
  maintainer reports is sometimes unresponsive.
- **Disposition:** applied in [stack lookup guidance](docs/engineering/stack.md#conditional-official-lookup),
  [design references](docs/design/handoff.md#authority-and-exact-references) and
  the [UI workflow skill](.agents/skills/tableweave-ui-workflow/SKILL.md).
  Installed-version/type/tagged-source verification remains required. No change
  to product scope, dependency versions or the three maintainer taste sources.
- **Checks:** documentation structure, all 17 checker regression probes and
  `git diff --check` passed when the guidance was applied. No runtime or external
  site availability validation was claimed for that documentation-only update.

Continue with the next maintainer-provided note in this session; reset numbering
only when a new review session begins.
