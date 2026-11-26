# WP-10 definition reorder capabilities — isolated main-owned integration

TASK-018 / FR-02/03/14, AC-12/13. Actual P1 DefineTableInput/TableDefinition currently
have no row/column reorder enablement, while ADR-08 requires separate definition
capabilities and explicit renderer/plugin composition. Manual-order observations,
isRowSelectable and a handle slot must not silently become that feature flag.

Main selects additive `reordering?: {rows?: boolean; columns?: boolean}` on the
genuine defineTable input and frozen `reordering: {rows:boolean; columns:boolean}`
on its actual returned definition. Both default false. Supplied false stays false;
empty object means both false. Like existing tools, a present undefined/null/object
with unknown/inherited/accessor or nonboolean consumed fields is invalid. Capture
only own data once through the existing metadata capture; do not freeze caller
objects or import UI/drag code. This metadata enables configuration, not authority.

In a fresh isolated tree from848c94b, main owns only react/src/table/{types,definition}.ts
and new tests/reordering/definition/**. Protect all other143 existing sources/old
tests/seals/manifests/lock/config/root exports. No NativeDefinition/ControllerDefinition
schema/identity, controller factory callback order, state defaults, tools, row engine
or native producer changes. No second coordinator or backend grant. The new field
does not itself create a move coordinator, UI, callbacks, refs or optional dependency.

The active shared admission helper and isolated native lifetime remain independent;
no source intake until their actual handoffs. Future bindings must check both real
definition flags and explicit current renderer configuration, then actual per-intent
authority/admission. The helper may exist inertly for a definition without enabled
UI capabilities; constructing it is not a row/column action grant. Raw native and
pure reorder entry remain unchanged. Any other actual factory needs stop for a new
lease rather than accepting a structural native wrapper.

Baseline145 map31da43d6873e3c73604244cc72142f2e62081727bf3df7e3c5d1ebf93feb0ebe is
/tmp/opencode/wp10-before-core-entry-source145.json. Capture the two source preimages
and protect the other143 entries. Necessary existing frozen dependency installation
is authorized only for this isolated tree; no DnD install/build is allocated.

Author real definition/default/explicit/descriptor/copy/metadata-mutation regressions
and type inference/negative cases. Only lightweight positive TS6/full scoped Biome/
syntax/static/scope checks now. Runtime/negative/dual/emitted/ordinary/packed/SSR/
G-02/independent correction acceptance stays final. Preserve original maps; source
authoring and aliases do not establish package availability or feature feasibility.

## Preserved provisional handoff

Isolated04941b2 contains exactly the two source edits/new own fixtures. Main reviews
the actual small diff and passes positive own TS6, full scoped formatter/lint,
syntax,143 protected-source hashes,1376 other tracked-file byte identities and staged
whitespace. Initial formatting/type-import warnings remain externally preserved.
Twelve-input aggregate66cbea798abe77061a665cc22639ad5ff3720c6cd73041db03edbc10b0c06395;
new145-source map35974beec7f58f70b2f3a27114767cf4b4e036cfaadcd6a59447292ed0288c71.
Intake waits for the active admission/native-lifetime handoffs. Real factory/native
identity regressions and four negative cases are authored but unexecuted. This is
neither runtime/independent approval nor a claim that raw native supports reordering.
The [actual definition fixture handoff](../../tests/reordering/definition/README.md)
owns its authored cases/light checks/deferred commands; the navigation edge is
required independently of naming the directory in prose.

Main intakes this aseb17ff9 after actual U1 handoff, then native lifetimec8e7880.
All150 expected combined source hashes match and three positive extent/definition/
native-lifetime source programs pass. The original isolated map remains unchanged;
no old protected143-source guard is relabeled a current combined-tree gate.
