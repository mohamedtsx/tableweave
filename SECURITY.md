# Security reporting

Do not publish exploit details, private records, credentials or authenticated
captures in public issues/PRs. Use a verified private maintainer reporting route;
GitHub private vulnerability reporting is suitable **only if actually enabled**.

This repository has no released Tableweave version or configured private
security channel yet. Ask the maintainer how to contact them privately without
including vulnerability details in the public request. A working private route,
responsible reviewer and supported-version policy are required before distribution.
No placeholder email, response SLA or enabled advisory feature is claimed.

A private report should include affected version/revision, minimal synthetic
reproduction, impact/boundary and safe remediation context. Redact tokens,
personal data and sensitive criteria. Avoid testing against other users' data
or systems without authorization. Coordinate disclosure privately; maintainers
assess impact, fix/test, document affected versions and publish a safe advisory.

Applications remain responsible for backend authorization, query translation and
custom content/actions; Tableweave's ownership exclusions and UI hiding are not
security boundaries. See [security contract](docs/engineering/security.md).
