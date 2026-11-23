# References and provenance

References inform contracts; they do not create product policy or prove
integration. No `.repo/` checkout is required to use these docs.

## Maintainer taste and architecture sources

Maintainer clarification, 2026-11-23: learn the maintainer's taste from **all
three sources below**. `.repo/` is the **main source of taste and architecture**;
it is not merely an optional example of documentation practices.

| Source | How to use it |
| --- | --- |
| Direct maintainer feedback | Record explicit likes, dislikes, corrections and approvals in the affected canonical owner and task. Current explicit feedback governs interpretation of references; do not invent unstated preferences. |
| [Transactions reference](https://shadcnuikit.com/dashboard/payment/transactions) | Study table hierarchy, density, controls and interaction treatment alongside the maintainer's feedback; retain the design handoff's exclusions on commercial code/assets and application-specific behavior. |
| Local `.repo/` references, currently `.repo/Gamila` | Main taste and architecture reference. Inspect relevant design, component, architecture and engineering patterns before proposing corresponding Tableweave choices; adapt the rationale and patterns rather than copying implementation or business policy. |

For relevant design or architecture work, consult the local reference first when
available, compare the transactions reference where applicable, and incorporate
direct feedback. Generic design skills and vendor defaults do not substitute for
these sources. The existing Figma prototype remains supplementary exploratory
material, not the main taste source or an independently approved final design.

Reference preferences do not silently override Tableweave's product requirements,
approved package boundaries or accessibility/privacy obligations. Surface any
conflict for maintainer review instead of weakening requirements. `.repo/` remains
ignored, local-only and strictly read-only: no metadata repair, runtime/code/asset
imports, build dependencies, copied lockfiles/patches or inherited business rules.
If it is unavailable, use the recorded assessment, disclose the limitation and
ask about any consequential missing preference; never claim an inspection occurred.
This clarification does not authorize running its application, installing its
dependencies, editing Figma or modifying a consumer.

## Reference inventory

- [Source manifest](source-manifest.md): supplied Notion pages/revisions,
  acquisition limits, fingerprints and section-to-owner coverage.
- [Gamila assessment](gamila-assessment.md): read-only learning, adopt/adapt/reject
  decisions and local Git metadata limit.
- [Research provenance](research.md): source-time candidate/library/demo research,
  observations versus decisions, and future version-matching lookup.

Read references conditionally. Do not copy vendor manuals, runtime code, private
data, business rules or unlicensed assets into the library.
