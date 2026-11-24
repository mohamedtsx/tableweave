# Tableweave shell reference — design review candidate

TASK-017. The user explicitly authorizes a new Figma design named **Tableweave**.
The [editable review board](https://www.figma.com/design/USX6vMtBrZICYS9M4V84bB?node-id=4-62)
is a synthetic, source-informed reference, not approved runtime UI or full F-01–F-22
coverage. The maintainer's [three primary references](../reference/README.md#maintainer-taste-and-architecture-sources)
and product requirements remain authoritative. No existing reference file is edited.

The user subsequently selects **Approve direction** in the ask modal: use this
appearance for shell implementation. Approval covers visual direction only, not
runtime behavior, accessibility, missing scenes or WP-09 completion.

## Scene links

| Scene | Figma reference |
| --- | --- |
| F-01 minimal defaults, 1440 | [Minimal](https://www.figma.com/design/USX6vMtBrZICYS9M4V84bB?node-id=5-55) |
| F-02 configured/exclusive owners, 1440 | [Configured](https://www.figma.com/design/USX6vMtBrZICYS9M4V84bB?node-id=5-159) |
| F-08 selected IDs/normal-toolbar replacement | [Selection](https://www.figma.com/design/USX6vMtBrZICYS9M4V84bB?node-id=5-319) |
| F-18 arbitrary desktop details | [Desktop details](https://www.figma.com/design/USX6vMtBrZICYS9M4V84bB?node-id=5-463) |
| F-20 Arabic RTL/dark, 1024 | [RTL desktop](https://www.figma.com/design/USX6vMtBrZICYS9M4V84bB?node-id=6-432) |
| F-20 Arabic RTL/dark, 390 | [RTL phone](https://www.figma.com/design/USX6vMtBrZICYS9M4V84bB?node-id=6-551) |
| F-18 fullscreen phone details | [Phone details](https://www.figma.com/design/USX6vMtBrZICYS9M4V84bB?node-id=6-672) |
| F-14–17 compact recovery/paging reference | [Recovery](https://www.figma.com/design/USX6vMtBrZICYS9M4V84bB?node-id=6-705) |

The recovery board distinguishes loading, initial error, retained refresh error,
empty/no-match/unknown cause, known/unknown totals and disabled-pager omission.
Some states are textual annotations, not complete separate screens or prototypes.

## Provenance and limits

The design worker reports source/reference inspection, library search and editable
local components after no matching published HeroUI renderer mapping was established.
It did not substitute Material styling for HeroUI. Local semantic Light/Dark tokens
map pinned HeroUI3.2.8 colors/spacing/radii; OKLCH-to-sRGB conversion is not contrast
or browser color-management evidence. Noto Sans is an available member of the actual
fallback stack; Noto Sans Arabic is an explicit layout stand-in, not a production
font decision. A single Close vector comes from the pinned Apache-2.0 HeroUI icon.
No proprietary reference code/data/assets or complete-UI raster is imported.

Worker composition readback reports896 editable board nodes,141 instances,
zero image fills and no remaining placeholder/zero-width text. One composition
screenshot and one targeted correction pass were performed. These observations
are design-worker evidence, not main's independent or browser verification.
Buttons remain static ownership references; no interactions/backend are wired.

At the initial handoff, complete F-03–07/F-09–13/F-19/F-21–22 scenes, full refreshing/
middle/last-page screens,768/320, zoom/text expansion and RTL drawer/selection were
missing. The additive board below addresses only its stated visual subset.
Manual language/AT/device, keyboard/focus, contrast, touch, safe-area and actual
runtime/SSR/packed/privacy/performance acceptance are deferred. Do not infer a
full design-system publication, personal maintainer approval or WP-09 completion.

Private handoff: /tmp/opencode/wp09-figma-shell/REPORT.md. The account-facing file
was created as Tableweave; the plugin's internal root readback was Document. No
second file or title change was made from that internal-name discrepancy.

## Additive responsive/details board

The [supplement](https://www.figma.com/design/USX6vMtBrZICYS9M4V84bB?node-id=10-619)
adds the initial board's missing WP-09 references without changing its approved
nodes: [768 tablet](https://www.figma.com/design/USX6vMtBrZICYS9M4V84bB?node-id=10-635),
[320 RTL phone](https://www.figma.com/design/USX6vMtBrZICYS9M4V84bB?node-id=10-841),
[RTL left-side drawer](https://www.figma.com/design/USX6vMtBrZICYS9M4V84bB?node-id=10-978),
[RTL selection](https://www.figma.com/design/USX6vMtBrZICYS9M4V84bB?node-id=10-1105),
[customer form](https://www.figma.com/design/USX6vMtBrZICYS9M4V84bB?node-id=10-1185),
[inventory form](https://www.figma.com/design/USX6vMtBrZICYS9M4V84bB?node-id=10-1240),
[two tables](https://www.figma.com/design/USX6vMtBrZICYS9M4V84bB?node-id=10-1295) and
[neutral access loss](https://www.figma.com/design/USX6vMtBrZICYS9M4V84bB?node-id=10-1480).

Worker readback reports788 editable supplemental nodes/125 instances/zero image
fills and a corrected field-wrap defect, using existing tokens/fonts. These are
bounded illustrations for F-19–22, not proof of actual two-table/privacy/form/focus/
responsive behavior. F-03–07/F-09–13, full transition/zoom/manual matrices and all
runtime gates remain missing. Initial896-node evidence stays separately scoped.
