# Validation, privacy and isolation

Source: HLD §11. Library schema validation is not application authorization.
No auth/ORM/telemetry/storage/export service is added to the library.

## Untrusted transport and defensive defaults

Backend revalidates schema/version, field/operator/value combinations and owner,
tabs, sort allowlist, page bounds, resource scope and actor/record authorization.
Map stable allowlisted identifiers; parameterize values. Never interpolate client
field/sort/SQL/regex/predicate strings into backend code. Custom operators need
explicit translators; unknown translation is rejected.

HLD engineering defaults, configurable schema policy that must match server:

| Limit | Initial value |
| --- | --- |
| Builder rules | 50 |
| Membership values per rule | 100 |
| Search characters | 512 |
| Page rows | 100 |

Validate visibly instead of silently truncating intent. These limits are not a
hard cap on total dataset size; the 10,000-row reference is a workload, not a limit.

## Scope and data minimization

Scope keys distinguish dataset/permission context but are not secrets or proof
of access. Never include tokens/full personal records in cache keys. On access
revocation or scope change clear retained rows, selected IDs, details, selected
option-label buffers and transient operations; old requests must not resurrect
them. Request-local SSR cache isolation is mandatory.

Render strings as text. Consumer rich HTML/content is their security
responsibility; do not trust record-provided markup/classes. Public errors and
diagnostics use safe messages/error codes/field-rule IDs, not raw stacks,
records/queries or credentials. No default telemetry or application-data uploads.
Stories/evidence use synthetic non-sensitive records.

No automatic URL/browser storage persistence. Any optional recipe warns about
sensitive query leakage. Definitions remain immutable for mounted identity;
schema/owner replacement requires explicit version transition, revalidation and
stale-state rejection, not silent rule migration/deletion.

Actions receive selected IDs separately from loaded objects; off-page IDs must
be reauthorized. Neither selected IDs nor permission-driven UI hiding authorize
reads, exports, bulk operations, moves or writes. [Resources](resources.md) owns
safe retained-data recovery; [security reporting](../../SECURITY.md) owns disclosure.
