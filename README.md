<div align="center">

# Tableweave

### Less table wiring. More control.

A planned React table toolkit built on **TanStack Table**, with a genuinely
**headless path** and an optional **HeroUI renderer**.

[Share a use case](https://github.com/mohamedtsx/tableweave/discussions) ·
[Suggest an improvement](https://github.com/mohamedtsx/tableweave/issues/new)

**Project preview · Early development · Not installable yet**

</div>

## Why Tableweave?

A table engine solves row processing. It doesn't finish your table experience.

You still wire together search, filters, sorting, selection, pagination, details,
and recovery states—and make those interactions agree across every screen.

**Tableweave aims to make that integration reusable without taking control away
from your application.** Describe your data, explicitly choose each table's
capabilities, and compose the presentation your product needs.

## Two ways to build

| Planned layer | Intended use |
| --- | --- |
| **Headless** | Keep your own components and design system. No HeroUI or Tailwind requirement. |
| **HeroUI** | Start from a HeroUI-based table experience, with replaceable controls, custom cells, details, and action slots. |

TanStack Table owns row processing. Tableweave is intended to coordinate the
configuration and interactions around it—not introduce a competing table engine.

## Planned capabilities

These are the intended direction, **not currently available features**:

- **Find the right records:** search, a typed filter builder, tabs, and date controls.
- **Shape the view:** sorting, column visibility, and pagination.
- **Work with records:** opt-in selection and application-defined row or bulk actions.
- **Show more when needed:** customizable responsive details, not a fixed record template.
- **Reorder deliberately:** row and column reordering, with keyboard alternatives
  and application-owned persistence.
- **Handle the real states:** loading, refreshing, stale data, errors, empty results,
  localization, and presentation overrides.

Both local processing and application-controlled server processing are planned.

### Your application stays in charge

Your application owns **fetching, authorization, backend queries, business actions,
and persistence**. Tableweave is not a database client or a spreadsheet engine.

No default telemetry, automatic URL/storage persistence, or built-in Export is
planned. Selection is not authorization; a reorder interaction is not a successful
database update.

## Where the project stands

Development is at the architecture and workspace-foundation stage. This repository
is currently a **public project preview**, not a source release. The local
development foundation exists, but a functioning
Tableweave table and its feature APIs have not been released.

**There is no npm release or public install command yet.** APIs and implementation
details are not frozen, and no release date is promised.

The next work is to validate schemas and filter semantics, establish coordinated
state, and prove the TanStack/HeroUI integration before expanding the table UI.
Tested application examples and clearly labeled prereleases come later.

## Help shape it

Concrete use cases are especially useful at this stage:

- What do you repeatedly rebuild around TanStack Table?
- Which interaction becomes hardest to keep consistent across several tables?
- What must a headless toolkit leave under your control?

Bring a workflow or integration constraint to
[Discussions](https://github.com/mohamedtsx/tableweave/discussions), or open an
[issue](https://github.com/mohamedtsx/tableweave/issues/new) with a focused proposal.
Please use synthetic examples, not private application data.

If this direction would help your projects, **star the repository to show
interest**. Use **Watch** for the updates you want to receive—starring alone does
not subscribe you to announcements.

## License and availability

The implementation is intended for an **MIT-licensed open-source release**. Its
source and final license notice are not published here yet; this preview is not
an MIT-licensed software distribution. TanStack and HeroUI are independent
projects; this project does not imply their endorsement.
