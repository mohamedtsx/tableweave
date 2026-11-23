# Private WP-02 producer contract

Implementation: TASK-006; [approved plan](../planning/wp-02-implementation-plan.md).
Product semantics remain in [operators](../../product/operators.md) and
[shared rules](../../product/shared-rules.md). This document records executable
private behavior, not an accepted release or later-packet implementation.
[TASKS](../../TASKS.md) owns review/authorization status.

## Surface and revisions

Package version remains the private `0.0.0-wp01.0`, **not** a new published release.
Wire envelope and shared synthetic conformance vectors are revision **1**.
Schema `id`/positive integer `version` are application-owned; change the version
when field semantics, ownership, operators or custom behavior change.

| Entry | Runtime exports |
| --- | --- |
| `/contracts` | `defineQuerySchema`, `createQuery`, `parseQuery`, `normalizeQuery`, `getFilterIdentity`, `getQueryIdentity`, `ContractError`, `defaultLimits`, `canonicalJson` |
| `/filters` | `builtinOperators`, `defineOperator`, `createOperatorRegistry`, `defaultOperatorRegistry`, `fieldPresets`, `relativePresets`, `compileFilter`, `createFilterEvaluator`, `translateQuery`, `invertRule`, `resolveDateValue`, `resolveDateOperand` |
| Root | None; retained client boundary for later React work |

Types include `QuerySchemaDefinition`, `QuerySchema`, `QueryFor<S>`, `QueryInput<S>`,
`RuleFor<S>`, `WireQuery`, `WireRule`, date variants, operator/translator/evaluator
contracts and `FieldAccessors<S, Row>`. Vendor types are not public dependencies.
All outputs are ESM. Private deep imports remain blocked.

## Definition, validation and transport

`defineQuerySchema` clones, checks and freezes a JSON descriptor. Fields declare
one explicit owner (`builder/search/tabs/date/none`), family, optional operator
allowlist and opt-in `sort: true`. At most one date-owned field, of date/date-time
type, is allowed. Search/tab ownership excludes builder even when inactive.
Tab rules resolve only against tab-owned fields. No accessors/callbacks/native
columns, React nodes or vendor validator objects enter this descriptor. Strings
are values/IDs, never executable backend fragments.

Literal definitions infer field/operator/value, enum-ID, custom operand, date
mode/preset and sort/tab types. Widened/dynamic descriptors rely on runtime
validation rather than claiming literal compile-time precision. Row accessors are
separate, family-typed callbacks; absent accessors read own simple record keys.
Nested/computed fields need accessors. This is not `defineTable` or a column API.
For widened definitions, optional `sort: boolean` permits a potentially sortable
field and optional tabs retain their element ID type (string when unknown).
Runtime validation still rejects IDs/configurations not actually enabled. Literal
omitted/false sort flags and absent tabs do not gain capabilities from widening
other properties; known optional tab IDs remain precise.

Wire v1 requires schema ID/version, builder `{join,rules}`, committed search,
nullable tab/date, ordered sorting, page index/size, locale and timezone.
`createQuery` accepts explicit locale/timezone and optional complete group
overrides; supplies an empty AND builder, blank search, configured default tab or
null, null date, no sorting and page 0/size 10 by default. Pagination defaults to
`[10,25,50,100]`; configured sizes/default must fit `maxPageRows`. Multi-sort is
off unless `sorting.multi` is true. No mounted defaults, clock or browser lookup.

`parseQuery(schema, unknown, {registry?})` returns a discriminated success/data or
failure/issues result. `normalizeQuery` and `createQuery` throw `ContractError` on
failure. Unknown keys, versions, IDs/owners, bad operator/value/cardinality,
non-finite/unsafe pagination, invalid locale/zone and limits fail; no truncation,
silent deletion, arbitrary coercion or source mutation. Configured limits apply
**before** deduplication/trimming. Defaults are 50 rules, 100 membership values,
512 Unicode code points of search and 100 page rows. Applications must align
their server policy and validate actor/scope/record access separately.

JSON must be finite data with ordinary/null-prototype objects and dense arrays:
no cycles, symbols, functions, undefined, Date instances, accessors, hidden or
extra array properties. Safe diagnostics contain generic messages/codes and only
validated field/rule IDs, never input values or callback exception payloads.
IDs use 1–128 ASCII letters/digits plus `_ . : -`, starting with a letter/digit.

## Operators, custom callbacks and presets

The registry includes every family in the product owner. Descriptors expose
stable namespaced IDs, label keys, types, cardinality and inverse metadata;
`empty/notEmpty` are shared. Numeric ranges include both bounds. Membership
sets must be nonempty and normalize to sorted distinct stable IDs; enum/set IDs
are strings by default, numeric when declared/inferred from static values.
No loaded async-options page/label is needed to retain an applied ID.
Operand and record IDs share nonempty-string/finite-number shape validation.
Record collections must have valid IDs at every own array index: holes, inherited
slots or invalid members fail non-empty comparisons, including negative ones.
Static option allowlists constrain query operands, not unloaded record-ID shapes.

Built-ins exclude missing/invalid records from negative non-empty comparisons.
Zero/false are values. Default whitespace remains nonempty; text `trim` is an
explicit field normalization. Text is locale-aware case-insensitive by default,
with `caseSensitive` opt-in. Default search matches **string** accessor values
using contains/OR, without coercing numbers/collections. Its trim/case policy is
separate from builder fields; nondefault matchers need explicit callbacks.

Presets cover text/email/URL/phone, number/currency/percentage, enum, tags,
person/people/relation/relations, boolean and date/dateTime. They set semantics,
not renderers, services or business formats. Numeric precision/value adaptation
can use typed accessors and custom operators; there is no hidden rounding.

`defineOperator` retains the inferred validator operand type; callbacks stay
outside the JSON schema. Custom IDs must not shadow built-ins. Custom operators
are exposed explicitly in field allowlists. Register reciprocal inverse IDs if
present; their field types must overlap. `none` omits wire values (callbacks
validate/evaluate the null sentinel); `many/range` require nonempty arrays/two
items respectively. Normalize must be pure, JSON-safe, valid and idempotent;
non-idempotent output is rejected. Callback failures become safe contract errors.
Applications own equal semantics on client and server; missing client evaluators
or requested translator entries fail, never fallback.

`invertRule` is a **pure value helper**, not a controller command. It retains the
rule ID and compatible operand; incompatible cardinality/validation requires a
replacement. No configured inverse means no Negate action. Query acceptance,
Duplicate/Clear/Remove, draft Cancel and final-membership removal remain WP-03/UI.

## Calendar representation and context

Day points are `{kind:'day',value:'YYYY-MM-DD'}`; explicit instants are
`{kind:'instant',value:'...Z'}` or offset ISO strings, to millisecond precision.
Date-only fields reject instants. Ranges contain two complete points of the same
kind, in ascending order. Symbolic values are `{kind:'relative',preset:...}` or
`{kind:'rolling',days:N,direction:'past'|'future'}`. Relative allowlists default to
all required presets; rolling lengths must be explicitly configured. A rolling
window includes today and N−1 neighboring calendar days, not N fixed 24h spans.

Standalone date defaults to range: `date.between` with two points, or `date.on`
with a relative/rolling window. Single mode accepts `date.on` only. Configured
min/max bound the full resolved interval, including relative values at evaluation.
Parsing checks symbolic shape/configuration; evaluation/key/translation resolves
it using the supplied epoch-millisecond `now`, query locale and IANA timezone.
No library clock is read. Consumers schedule reevaluation at relevant boundaries.
Unrepresentable/clipped calendar windows fail rather than silently shortening.
After timezone conversion, timestamp boundaries must also be finite and strictly
increasing. A skipped local day (e.g. Apia 2011-12-30) is rejected for datetime
criteria, while a date-only value remains a timezone-independent calendar day.

Date-only intervals retain ordered day strings, without UTC conversion.
Date-time calendar intervals use local start through **next local day start,
exclusive**. DST days can be 23/25 hours. Explicit instant endpoints are inclusive
at millisecond precision, represented internally by end instant +1ms. Week starts
follow the supplied locale; offsets preserve instants. Before/after compare with
the beginning/end of the resolved interval. Browser defaults, SSR shared-clock
adoption and hydration remain later integrations.

## Predicates, translation and identity

`compileFilter(schema, unknownQuery, {now,registry?})` revalidates and returns a
frozen JSON filter plan. `createFilterEvaluator` compiles once and returns a pure
one-record predicate. It does not build/filter/sort/page row collections or replace
TanStack. Composition is builder AND search OR-fields AND tab AND date; only
builder/tab groups use their respective flat join; empty groups are neutral.

`translateQuery` also validates the original query; it never trusts a client plan.
Applications provide operator-ID adapters plus all/any/search composition, map
field IDs to allowlisted backend columns and **bind values**. The shared test
translator emits SQL-shaped text plus bound values and interprets primitives
independently; it is not executable portable SQL, a real database or authorization
proof. Sort/page processing remains application-owned and outside FilterPlan.

`getFilterIdentity` excludes editable rule IDs, sort/page and empty join preference;
canonicalizes built-in rule order/duplicates, membership order and configured text
case; retains explicit custom rule order/normalization. Locale/timezone and resolved
date intervals participate. `getQueryIdentity` additionally includes tab scope,
ordered sorting, pagination and wire version. Identical relative boundaries have
identical keys despite different clock ticks. Identities are deterministic JSON
strings, not hashes, encryption, scope/auth tokens or automatic caches. They can
contain filter values: never log/persist/upload them by default; scope isolation
is the application's separate responsibility.

## Review and proof boundaries

Run `pnpm test:contracts`, `pnpm typecheck`, `pnpm pack:check` or the full
`pnpm check`; [README](../../README.md#local-foundation-workflow) owns commands.
Tests use synthetic data and vector revision 1. Packed consumers compile the real
schema/field/operator/custom/date/accessor contracts under TS 6.0.3 and 5.9.3 with
strict/exact-optional checking, no DOM/Node typings and no declaration skips.

This slice covers only the pure portions of AC-02–AC-07/AC-23/AC-26. No native
bridge, mounted controller/draft/resource/async UI behavior, G-01–G-05 completion,
real backend, SSR/hydration, visual/accessibility, performance or publication pass
follows. Maintainer review is required before WP-03 consumes this producer.
