# WP-12 manual observation workbook — DATA ONLY

| Record field | Required value / current status |
| --- | --- |
| Fixture | Standalone retained A server / B manual application; see [source contract](README.md) |
| Source / dirty state / fix head | UNKNOWN — BLOCKED pending main exact-revision selection |
| Emitted output / profile identities | UNKNOWN — BLOCKED; preserve original/current identities separately |
| Operator / independent reviewer | UNKNOWN — BLOCKED; no invented participant or approval |
| Browser / engine / exact versions | UNKNOWN — BLOCKED; engine emulation is not actual Safari/Edge/mobile |
| OS / build | UNKNOWN — BLOCKED |
| Device / model / display | UNKNOWN — BLOCKED |
| AT / exact version / settings | UNKNOWN — BLOCKED |
| Physical input / settings | UNKNOWN — BLOCKED |
| Width / locale / theme | UNKNOWN — BLOCKED until each actual run records them |
| Browser zoom / text scale | UNKNOWN — BLOCKED; CSS font expansion is not physical browser zoom |
| Reduced motion / forced colors | UNKNOWN — BLOCKED |
| Observed result / evidence / failures count | UNRUN / UNRUN / UNRUN — no fake zeros |
| Finding / owning correction / retest | UNRUN / UNRUN / UNRUN |

| Scenario / AC | Preconditions and reproducible task steps | Expected observation | Observed / status / evidence / finding / fix / independent retest |
| --- | --- | --- | --- |
| Keyboard / AC-09/10/21/24 | Actual A page response ready, B separate; tab/arrow table/header controls, sort, select eligible current page, next/size/sort, Cancel | Correct semantics/priority/mixed state, IDs preserved versus loaded objects, reachable actions and predictable toolbar focus, no unintended query reset | UNRUN; required environment inputs BLOCKED; evidence/finding/fix/retest UNRUN |
| Screen reader / AC-14–21 | Record actual AT/browser/OS; navigate table headers/rows, loading/failure/retry, selection toolbar, drawer controls and dirty decision | Names, relationships, sort priority, counts and bounded live announcements conveyed; no stale/foreign records; focus/trap/restoration understandable | UNRUN; required AT/operator inputs BLOCKED; evidence/finding/fix/retest UNRUN |
| Simple pointer / AC-12/13/21 | B neutral manual source; click real row/column menus, reject/timeout, publish authoritative input, hide/show renderer | Functional non-drag alternatives, restrictions/reasons, no false persistence, native content retained, correct final order | UNRUN; physical input BLOCKED; drag/G-02 remains user-blocked |
| Physical touch / AC-19–21 | Current actual iOS Safari and Android Chrome with recorded versions/devices; scroll real table to last field, edit native cell and details, open keyboard, dirty-close veto/discard | Native scrolling/text selection/keyboard and reachable actions; safe-area and focus behavior; no inert drag-only affordance | UNRUN; devices/operator BLOCKED; emulation is not evidence |
| True zoom200%/400% / AC-20/21 | Record physical browser zoom and separate text scale; repeat toolbar/footer, last native cell, details and dirty decision tasks | No lost content/action or document-wide overflow; contained table scroll; intact rule segments and meaningful focus | UNRUN; actual zoom/browser inputs BLOCKED; evidence/finding/fix/retest UNRUN |
| RTL / themes / AC-20/21 | Actual320/390/768/1024/1440 widths, EN/light baseline plus AR/dark bounded combinations; switch without remount; edit same details/native draft | Logical-end/mobile drawer, full dictionary, native number/date meaning, isolated bidi IDs, no auto hidden information/cards, retained draft/focus | UNRUN; actual environment inputs BLOCKED; evidence/finding/fix/retest UNRUN |
| Forced colors / reduced motion / AC-20/21 | Record actual OS/browser preferences; repeat selection/error/menu/drawer tasks with real input | Focus, boundaries, checked/error/disabled states not color-only or motion-dependent; no inaccessible close path | UNRUN; actual preference/environment inputs BLOCKED; evidence/finding/fix/retest UNRUN |
| Supported versions / quality | Latest two stable Chrome/Edge/Firefox/Safari plus current iOS Safari/Android Chrome; record actual dates/versions/task combinations and limitations | Exact tested combinations, failures and remaining gates published truthfully; no engine label substituted for real browser/OS/AT | UNRUN; version inventory/devices/operator BLOCKED |

| Per-execution row schema | Value |
| --- | --- |
| Scenario/AC, source+dirty state, output, profile, fix head | UNRUN |
| Operator, independent reviewer, browser+engine/version, OS/build, device/display, AT/settings, physical input | UNKNOWN — BLOCKED |
| Width, locale/theme, zoom/text scale, motion/forced colors, preconditions | UNRUN |
| Exact performed steps, expected versus observed, pass/fail/blocked/unrun | UNRUN |
| Sanitized evidence reference, numbered finding/owner, limitations, correction identity, independent retest disposition | UNRUN |
| Execution authority | Full manual/performance work remains user-deferred; workbook authoring grants none |
