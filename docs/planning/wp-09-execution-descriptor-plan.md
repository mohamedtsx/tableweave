# WP-09 server-safe execution descriptor prerequisite

TASK-017 / FR-06/10/12/16, D-10/D-24. Main approves this exact pure prerequisite
before code, using the independently approved pagination contracts36676cb8….
No native unpaged rows, resource extent/complete success, facade or backend query
implementation is implied. Final WP-08 remote delivery remains separate.

## Exclusive lease

One worker owns only new packages/react/src/contracts/execution.ts and new
tests/pagination-policy/execution/**. The approved four contract files, all filters/
controller/native/resource/presentation/details/criteria sources, existing tests,
root indexes/config/manifests/lock/docs/ledger/Git remain read-only. No installs,
shared build, extra agents, .repo/vendor edits or external calls.

## Exact new API

Export from the new module only (not root indexes): QueryExecutionExtent is either
readonly {kind:"page",pageIndex:number,pageSize:number} or {kind:"complete"}.
QueryExecution<S> contains readonly version:1, query:QueryFor<S>, filter:FilterPlan,
extent:QueryExecutionExtent, evaluatedAt:number and queryIdentity:string.
compileQueryExecution<S extends QuerySchema>(registeredSchema:S,input:unknown,
options:CompileOptions):QueryExecution<S> returns new deeply frozen JSON metadata.

- Capture own-data options.now and optional registry exactly once before any custom
  callback; never call Date.now or a clock provider. Require finite/date-valid now.
  Unsupported option envelopes/accessors/prototypes/unknown keys or explicit undefined
  reject with existing query.context; inspect descriptors, never invoke getters.
  Registry is a retained trusted app reference, not JSON-cloned/frozen. No new errors.
- Revalidate the original wire query through actual normalizeQuery, preserving full
  schema/version/owner/numeric/dormant policy validation. Never trust a client plan,
  execution extent/enabled flag or precomputed identity. Reuse the captured now/
  registry for real compileFilter and getQueryIdentity on normalized query. Existing
  custom normalization is contractually pure/idempotent and checked by its factory;
  repeated validation must not be claimed single-callback execution.
- The query preserves actual normalized sorting, locale/timezone/schema/version;
  FilterPlan remains filtering only. Copy page extent from its validated pair when
  policy is enabled/omitted. Only registeredSchema.pagination.enabled===false yields
  complete, with no offset/limit/page count/size members in that extent. Dormant
  metadata remains in wire query, never becomes a complete execution row limit.
- evaluatedAt equals the exact captured sanctioned now, not receivedAt or retry time.
  Original query input is cloned/normalized once before subsequent helper calls;
  caller mutation/getters cannot change which wire query or now is represented.
  Output contains no registry, functions, controller/native/resource refs or records.
- Trusted schema/registry choice, actor authorization, complete-result proof, workload
  limits, parameterized backend translation and deterministic ID tie-breaks remain
  application-owned. No backend execute/transport/callback API is added. Existing
  translateQuery keeps its filter-only contract; examples use descriptor.query and
  descriptor.evaluatedAt with the same trusted registry and apply sorting/extent
  separately. No client-selected alternative schema grants complete execution.

## Required source/type/semantic proof

Use actual factories and approved source inputs. Test paged/default/custom settings,
disabled canonical pair and forbidden pairs; unknown wire policy/plan injection;
invalid options with zero getter/custom calls; nonmutation/deep freeze; stable
actual schema versions/identities and exact extent own keys. Prove options capture
once with descriptor-safe hostile envelopes and no implicit clock. Preserve callback
error contracts, registry references and custom captured-time semantics.

Across at least two explicit times, use real built-in relative/DST and rolling/date
fixtures plus a valid idempotent custom operator: descriptor filter/identity must
equal independent existing-helper results at descriptor.evaluatedAt. Demonstrate
client filtering and synthetic allowlisted translator parity at that same sanctioned
time; never label an in-memory translator a real backend. Sorting direction/order
survives normalized query, complete has no limit and page metadata does not disappear.

Both TS6/5.9 strict source/own-emitted consumers retain generic field/operand/sort/date
typing and meaningful intended negatives. Private server-safe emission/import graph
adds no React/UI/controller/native/resource dependency; bare import has no browser
globals. Run affected unchanged pure tests plus focused ones with pinned installed
tools/isolated artifacts. Record all protected source hashes, exact commands/counts/
limits in own README. No root exports/discovery or genuine packed/full AC/SSR/browser
acceptance follows. Stop for excluded edits, non-idempotent helper drift or a needed
clock/extent/schema/translator contract change; return evidence rather than improvise.

## Source handoff and inventory reconciliation

[Own handoff](../../tests/pagination-policy/execution/README.md) reports81 new+267
unchanged units, strict TS6/5.9/52 meaningful negative rejections, eleven-module
server-safe graph and original177 protected bytes unchanged. Main verifies that
its preserved strict-inventory failure records only the separately pre-authorized
publication module/test namespace additions. No old baseline is rebased; their
changing bytes are not accepted by this execution review or imported into its graph.
Independent review must verify original bytes/graph and the exact addition allowlist;
no final whole-worktree unchanged claim follows from scoped reconciliation.

Independent69 fresh probes plus348 rerun cases, strict TS6/5.9/76 meaningful negative
rejections, measured thirteen declarations/compiler and unchanged import/protected
seals pass. Main grants bounded new-module source approval at
552fe801c7ff59ad5faddf20c3a4065f347b29605fe1bb44aae35c88bbb5af0c, not integrated
execution/complete-result/backend/resource/native or public-package acceptance.
