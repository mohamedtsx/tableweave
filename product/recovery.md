# State and recovery requirements

Source: PRD v1.0 §9 and D-26; FR-13. The [resource contract](../docs/engineering/resources.md)
owns precedence, provenance and guards. Labels/actions/renderers are customizable;
the application provides status, Retry and server empty/no-results context.

| State | Default experience | Required safeguards/recovery |
| --- | --- | --- |
| Initial loading | Column-aware skeleton or equivalent accessible loading view | No false empty message; preserve table structure through data/empty/no-results/error |
| Background refresh | Retain clearly marked previous rows, non-blocking updating/busy state | Preserve query/presentation; selection follows query-change policy. Expose busy/stale to actions. No new selection/reorder on obsolete-query rows; keep Cancel/recovery available |
| Initial error | Content-region error | Retry only when supplied; safe public message; no raw sensitive payload or infinite automatic retry |
| Refresh error | Retain usable results with stale warning | Retry without erasing criteria/rows; never masquerade as empty data |
| Empty dataset | Explain no records exist | Optional supplied Create/Import action, never invented/dead controls |
| No matching results | Explain criteria produced no matches | Relevant configured tool-specific recovery. Builder Clear cannot silently clear search/date/tabs or claim to cure search-only filtering |
| Invalid/incomplete filter | Inline validation | Preserve prior applied rule and other criteria; allow correction/cancel |
| Reorder persistence failure | Application reports failure and supplies restored/authoritative order | No false success; preserve focus/recoverability; no library-owned persistence |

A zero-row server response alone cannot distinguish empty dataset from no
matches. Accept explicit application context and unknown totals. Unknown cause
uses neutral wording, not a fabricated empty-dataset claim.

Initial loading/error cannot also show contradictory empty states. Refresh with
existing rows is not first load. A fresh successful empty response replaces old
rows; a failure is not a successful empty response.

Async picker loading/error/empty-options is local to that tool; preserve applied
IDs and labels. [Operator rules](operators.md) own exact draft/option behavior.

Authorization/scope loss is **not** ordinary network failure: immediately clear
private retained rows, selections, details, option labels and transient operations
through the application adapter. Never recover old private records into a new
scope. See [security](../docs/engineering/security.md).
