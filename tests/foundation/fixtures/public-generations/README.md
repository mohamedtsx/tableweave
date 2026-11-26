# Historical public-output preimages

These committed maps are data for historical guard regressions, **not current
workspace output**. Canonical form is repository-relative keys sorted with the
existing Node `localeCompare`, JSON.stringify(map, null, 2), terminal LF.

| Fixture | Count | Immutable aggregate |
| --- | ---: | --- |
| original.json |180|ad59470c7d472563ed273b8b167073953f6f574df0a1910510480082da63a8ce|
| fc01.json |180|de82ce232f3021a754b1e30df780eac27cd358604766cde4110cc922bf25f095|

Recovery for provisional H1/H2: original map read from
`/tmp/opencode/wp08-generation-helper-review-7ipbp_9k/original-public.json`;
fc01 enumerated from the actual frozen delivered parent
`/tmp/opencode/tableweave-wp08-stacked/packages/{react,heroui}/dist`.
Both count/canonical digest pairs were checked against the pre-existing literal
anchors **before writing** these fixtures. No parent build/write was performed.
The paths explain recovery provenance; tests depend only on these committed data
and the literal registry, never on those temporary directories/ignored manifests.

Only hashes and paths are copied, not runtime/vendor code. Each test mutates an
isolated copy. Cold/poisoned ignored-history regressions keep those files as
untrusted input; they never supply expected hashes. A separate actual-workspace
CURRENT test remains deliberately fail-closed for missing/unregistered output.
CURRENT is still fc01. Neither fixture registers or approves WP-09/199 outputs.
