# Packaging and release operations

Source: PRD §11; HLD §13. Publication remains a future procedure, not permission
to publish. WP-01 adds private local package scaffolds, packing checks and CI
configuration; no remote CI run, registry ownership or release is claimed.
[Product gates](../../product/release-gates.md) own readiness.

## Version and support policy

Use semantic versions and Changesets for consumer-visible package changes.
Prereleases identify unstable APIs, incomplete capabilities, tested peers and
limitations; they never imply full stable-v1 scope. Stable v1 requires every FR
and accepted combination. Coordinate versions/peer relationships of the two
packages deliberately; finalize Changesets configuration with actual manifests.
Document breaking API/schema/behavior changes and migration guidance.

Support promises follow tested peer/browser matrices and actual maintainer
capacity, not indefinite SLAs. Publish exact Node/pnpm build tools, React/TanStack/
HeroUI/styles/Aria/date/sortable/TS checks and supported browsers with releases.
Node 24 development baseline is not a browser-consumer Node requirement.

## Licensing and publication inputs

- MIT is selected for Tableweave's owned source. Maintainer must supply/confirm
  rightsholder/attribution and add the actual root/package MIT notice before
  distribution; this documentation does not fabricate a copyright owner.
- Review runtime **and development-tool** licenses; retain required notices,
  attribution and redistributed dependency obligations. Source examples/fonts/
  icons/assets have independent rights. Commercial references are not licensed
  for reuse by a URL, and Gamila runtime code is not copied.
- Verify Tableweave brand/name/domain and npm scope/package availability/ownership,
  correct publisher/account/repository/CI identity, credential scope and provenance.
  Planned package names are not availability/reservation claims.
- Establish a working private security/conduct channel and reviewer/operator.
  Do not publish a placeholder email or assume private advisories are enabled.

## Candidate checks

1. Inspect exact candidate revision/dirty state and all FR/G/AC evidence; resolve
   critical failures, final manual/browser/performance/consumer gates and known
   limitations. Advisory external participant counts do not block release.
2. Build declarations/ESM/client entries and server-safe contracts with explicit
   export maps. Preserve Next client directives; styles are side effects.
3. Pack locally using the actual verified WP-01 commands. Inspect tarball allowlist,
   exports/types/styles, source maps if shipped, license/notices/README, and hashes.
   Exclude secrets, `.repo/`, stories/test fixtures and development artifacts.
4. Install packed artifacts into clean headless/styled/Start/Vite/Next consumers,
   not workspace aliases. Verify declared peer/TS matrix and negative type cases.
   Check production bundles: no UI in headless, no React runtime/DOM in contracts,
   no optional sortable in default renderer, no mandatory Query/router/ORM/i18n.
5. Publish actual install/API/examples/defaults/restrictions/customization/recovery/
   locale recipes, compatibility/migration notes, changelog and sanitized evidence.
6. Prepare trusted publication/provenance and exact target/tag/version only after
   actual rights/CI identity are verified. CI secrets never go into docs/artifacts.
7. Obtain **current explicit publication authorization**. A readiness task or
   Changesets file does not authorize Git commits/pushes, npm publish or deployment.

Proposed pipeline: reviewed changes → contracts/transitions → packed consumers/
types → browser/Storybook → manual accessibility → reference benchmarks →
authorized real consumer → labeled prerelease → full stable gate → trusted publish.
Parallel check execution is fine where safe; no gate can be replaced by a count
from another boundary or earlier unrelated revision.

## Publication verification and recovery

When separately authorized, record operator, immutable artifact hashes, exact
versions/tags, provenance, registry readback/clean install and release-note links.
Docs/demo hosting is a separate deployment action with its own target authority.

For a defective release: stop rollout, assess impact/security, communicate a safe
advisory, deprecate affected versions when appropriate, publish an authorized
fixed version/migration and verify packed consumers again. Do not silently replace
published artifacts, force rewrite Git history, blindly unpublish or claim a tag
rollback removes installed vulnerable code. Real-consumer rollback requires its
own approved deployment plan; preserve prior evidence/version history.
