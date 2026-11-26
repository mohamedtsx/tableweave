# Next connection correction — provisional source handoff

Authorized correction of review26n1/n2 against supplied isolated HEAD35780bf.
Only existing `apps/example-next/lib/client-owner.ts` changed; all other writes are
new files in this directory. Main owns Git, TASKS/REVIEW and primary intake. No Git,
install, dependency/profile/export, library, other app/config, original fixture/map,
Next/bundler/native module, application/React test, server, browser or SSR execution
occurred. Drag remains blocked; WP-10/G-02 and WP-11 acceptance remain incomplete.

## Exact source delta

1. Effect release invalidates its exact local connection token **before callbacks**
   and invokes only the disconnector actually returned by A's `app.connect()`.
   There is no timer/microtask, terminal-disposal heuristic or final-unmount guess.
2. Temporary release synchronously uses A's real unsubscribe/clear-input behavior.
   A later retained effect can reconnect the same genuine C/P and existing authority;
   it does not remount the controller, create a publication or grant new access.
   Public synthetic initial records are not an inherited private cache or grant.
3. A synchronous transition guard rejects reentrant attach during attach/release.
   The wrapper marks a token attached only after actual connect returns with active
   input. Stale/duplicate disconnects are no-ops and cannot retire a replacement.
4. Genuine `app.revoke()` is unchanged and terminal. A terminal A owner cannot
   become active through this wrapper; an inactive result gets no attached token.
   If attach/release throws, the wrapper stays closed and invokes actual A revocation,
   not a new authority. Primary errors propagate; secondary revocation errors are
   retained together in `AggregateError`. This is not a disposal receipt. If attach
   failed before returning its exact disconnector, no complete unsubscribe receipt
   is invented; real exceptional cleanup remains a final verification obligation.
5. The **only** P/resource/options/C disposal is the pre-return initial-query mismatch
   branch, before the source is connected. It first checks P's successful `disposed`
   result, then disposes downstream resources/C. A blocked result throws with cleanup
   debt, without pre-marking disposal or forcing C cleanup. There is no automatic
   UI-disconnect terminal helper or new public disposal API.

The existing client boundary/hook, RSC payload, source owner, definitions, manifest,
runtime/LIGHT config and all155 library sources are untouched. Inactive local objects
may become unreachable; **GC is not a C/P disposal receipt**. Actual React retained
effect/Next Activity scheduling and genuine framework behavior remain unproved.

## Historical evidence disposition — no old seal was re-signed

Before editing, `scope.mjs capture` verified all80 original seal bodies, all1,728
original pinned inputs and all155 library identities. It captured **1,773 current
regular inputs/modes**, including the original raw artifacts, and copied the exact
owner preimage to `receipts/client-owner.before.txt`. Original1692 inputs also match.
The new plan receipt includes the bounded connection selection; primary reads were
limited to that documentation and REVIEW's review26n1/n2, not other-worker WIP.

Original seal SHA256 remains
`391ded6f0de58c5e17cdead4c83bfc8cdef61f4cd70fdd7b26f95b6786ccb810`.
Source155 map SHA256 remains
`bdfabdedcb23cb53244e9e9298cc234717a3cc526f0c97c2d46e3dfe6dcf1837`.
Post-correction comparisons record exactly **one body drift** in the original80 map
and original1728 pin: `apps/example-next/lib/client-owner.ts`. The other79 sealed
bodies,1727 pinned inputs, all1692 protected old inputs and all155 sources are fixed.
These historical maps are unchanged, not silently rebaselined. Their original
all-current-hashes claim no longer passes. The old auto-scope driver also predates
this new authorized namespace; use this correction's explicit comparator/commands.

The original `wp11-next/client.test.tsx` and both old READMEs remain exact history:

| Original assertion group | 