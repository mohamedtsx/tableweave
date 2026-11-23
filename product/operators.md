# Filter vocabulary and operator contract

Source: PRD v1.0 §7 operator contract and §8. Applies to FR-07/FR-09/FR-10/FR-14.
Engineering representation belongs in [state and query](../docs/engineering/state-and-query.md).

## Fields and operator families

Developers explicitly choose semantic types, filterable fields and exposed
operators. A filter field need not have a visible table column. Simple keys or
computed/nested accessors supply values; display formatting never changes the
comparison value. Custom operators and value inputs are supported.

| Value family | Required v1 operators/presets |
| --- | --- |
| Text, including configured email/URL/phone strings | Contains / does not contain; is / is not; starts with / does not start with; ends with / does not end with; empty / not empty. Default case-insensitive matching; customizable. |
| Number, including currency/percentage | Equals / does not equal; greater than / greater than or equal; less than / less than or equal; between / not between; empty / not empty. Both range bounds inclusive; custom precision/value adapters permitted. |
| Scalar enum/status | Is / is not; is any of / is none of; empty / not empty. Compare stable values/IDs, not labels. |
| Multi-select/tags and many-valued people/relations | Contains any of / contains none of; contains all of / does not contain all of; empty / not empty. Static/async choices. Single-valued people/relations use scalar-ID operators. |
| Boolean | Is true / is false; empty / not empty for nullable fields. False is not empty. |
| Date/date-time, including created/updated timestamps | On / not on; before / on or before; after / on or after; between / not between; empty / not empty. Relative today/yesterday/tomorrow, this/last/next week/month/year, and developer-configured rolling-day presets. |
| Computed/accessor | Reuse the returned value family's operators. No formula/rollup engine. Domain collections/attachment presence can use accessors/custom operators. |

## Rule composition and commands

- Attribute → allowed operator → value, with editable active-rule segments.
- Flat list, default **All/AND**, configurable initial join and user-selectable
  **Any/OR**. Empty builder is neutral in either mode. No nested groups.
- Multiple independently editable rules can target one builder-owned field.
- **Duplicate** makes an independently editable rule, not a shared draft.
- **Negate** selects the configured inverse operator, never inverts the whole
  query. Keep compatible value shape; otherwise require valid replacement values.
  Custom operators without an inverse omit Negate.
- **Remove** removes one applied rule. **Builder Clear** removes all applied
  builder rules only, preserving the join preference and every other tool.

## Empty, missing and invalid values

Empty means null, undefined, an empty string or an empty collection as appropriate
to the field type. **Zero and false are not empty.** Whitespace-only text is not
empty without explicit developer normalization. Non-empty comparisons, including
negative operators, do not match missing values; add an empty rule explicitly.

Do not silently coerce arbitrary strings to numbers/zero/booleans/dates.
Non-finite numbers, invalid dates, incomplete ranges and empty membership sets
cannot apply. Invalid edits preserve the previous valid applied rule/query.

## Draft and commit timing

| Interaction | Apply policy |
| --- | --- |
| Enum/boolean choices, multi-select toggles, value-less operators | Immediate valid commit |
| Explicit deselection of final membership value | Remove that applied rule, not an empty membership predicate |
| Typed text/numeric or date/date-time edits, including ranges | Confirm complete valid value; never emit a half-range |
| Cancel filter edit | Discard draft only; preserve last applied rule and other criteria |

Builder Clear is hidden when no rules are applied unless a developer requests a
disabled presentation. It is not an answer to search-only no-results.

## Dates and matching parity

- Calendar-day comparisons use the configured timezone. Include the full end
  day even across daylight-saving changes. Date-only values never shift through
  accidental UTC conversion. Explicit date-time comparisons preserve instants.
- Relative choices preserve symbolic intent and resolve at evaluation time with
  a defined clock/timezone; they do not silently become permanently fixed dates.
- Standalone date uses one exclusively owned field, range by default, optional
  single-date mode and developer-provided presets/bounds. Browser timezone is
  the normal default; SSR initial date criteria need an explicit shared context.
- Default search is case-insensitive contains, OR across declared search fields;
  debounce is configurable, 300 ms default, zero valid, custom matcher allowed.
- Builder result AND search result AND tab result AND date result defines the
  effective filter. Server translators must preserve the same semantics.

## Static and asynchronous options

Applications supply IDs, labels, option search/page state, loading, error and
Retry; the library performs no endpoint fetching. Show loading, empty-options,
error/retry and selected-value recovery locally to the picker.

Preserve selected IDs and usable labels across search pages, loading and failure.
A temporarily unavailable option must not erase a rule. Stale option responses
must not replace the newest term/scope. People/relation presets do not introduce
a directory service or relational backend.
