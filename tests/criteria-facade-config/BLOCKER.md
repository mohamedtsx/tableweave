# S3a: superseded capture needs a closed non-destructive core outcome

**STOPPED before producer edits; not implementation-ready.** This is an actual
shared-source control-flow trace, not an executed runtime/React/SSR reproduction.
The user explicitly freezes the shared core and requires stopping if a minimal
core hook is needed. D2's changing isolated core was not read or intaken.

## Required behavior

The activated plan requires both:

1. Exact child ticket checks before/after private descriptor/default/callback
   capture. Superseded H.A must never read B's config or publish a new child A
   revision after its ticket changes.
2. A superseded **in-flight** H.A layout skips child L-config without purging an
   otherwise eligible committed child actor A, its edits, work or participant.
   Malformed actual current H.B, source loss and real reentry still fail closed.

Parent B's port/config publication is not child B's L-config. Child A must remain
eligible in the same genuine C/CD/P/frame-owner domain until an actual child B
commit. Parent actor A validity cannot become child callback authority.

## Actual frozen call path

Paths below are relative to `/tmp/opencode/tableweave-wp09-stacked`.

### A. Tool admission/capture has no skip outcome

`packages/heroui/src/filters/criteria-commit.tsx:234–250` performs actual target/
owner/C/CD admission. Its `capture` at `253–291` validates C/context/stamp, calls
unchanged actual F3a at `284`, then returns `{ports,stamp,mode}`. There is no
registered facade supersession result in that interface.

`packages/heroui/src/filters/criteria-commit-core.ts:24–67` declares the fixed
adapter interface. `capture` at `46–52` can return only that successful payload;
otherwise it throws. There is no candidate cancellation / preserve-current outcome.

### B. Every capture failure purges the existing active child

The sole core `commit` at `445–571`:

- admits the target and creates a capturing candidate at `481–496`;
- invokes `adapter.capture` inside its try block at `511–517`;
- checks/registers, calls `cancelAll()` at `520`, constructs a new actor and
  retires the previous current entry at `522–540`;
- catches **all** capture exceptions at `549–565`, retires the candidate and
  unconditionally calls `purge()` at `557`, then denies.

The same file's `purge` at `306–321` retires/clears the current entry, sets current
to null, clears every owned local node, invalidates owned work and cancels it.
This is correct for malformed current config and actual revocation. It cannot
implement non-destructive superseded-candidate skip merely by throwing a different
library error from the new decoder.

### C. The actual dated host cannot repair that purge afterward

`packages/heroui/src/toolbar/criteria-tool-host.tsx` is the actual Search/Tabs/Date
host, not an invented facade host:

- `commit` begins at `215`; real target/domain checks are `246–270`;
- disabled/className are currently captured at `271–278`, before the core commit;
- actual `cell.commit(lease,next,input)` runs at `300`;
- presentation is written at `303–310` and actual Date preparation at `313–317`;
- catch at `322–324` calls `retire()` for every failure.

`retire` at `157–166` deliberately submits an invalid actual F3 commit to purge
its edit lifetime. A host preflight can skip a ticket that was already superseded
before `cell.commit`, but cannot undo the core's purge when supersession occurs
**during** the admitted private capture. A host-only catch distinction is too late.

### D. Required reflection itself permits reentry

Frozen `filters/criteria-ports.ts:274–282,301–329` surrounds actual own-descriptor
reflection with permission checks; descriptor accessors are rejected without calling
them. A Proxy's `getOwnPropertyDescriptor` trap can still run application code, and
the explicit task requires checking ticket/domain again even when reflection throws.
`criteria-commit-core.ts:116–124,126–155` likewise fences metadata reflection.

This is not a reason to invoke getters, infer permission from shape or weaken the
checks. It establishes where the supersession can occur while a real child capture
is already inside the frozen core's try/catch.

## Concrete same-domain counterexample sequence (authored trace, not executed)

All identities in this scenario must be actual S1/P2/F1/F3 issued objects when the
future regression is implemented; none are a permitting fake gate:

1. Genuine renderer parent cell and genuine child tool cell share actual D/C/CD/P
   and current frame owner. Parent slots publish ticket A / opaque config A. Child
   actor A is already committed and has a nonempty owned draft/timeout.
2. Start another actual child layout capture from still-current H.A. Actual F3
   admission succeeds in the unchanged domain. The decoder begins a guarded own
   descriptor read of config A within `adapter.capture`.
3. That descriptor trap synchronously performs a genuine parent ports-B commit
   using the **same genuine current model**, then publishes the new child config
   reference/ticket B into the parent's existing owned slot. Root config publication
   does not change C, P, epoch or frame owner and does not commit child B. The parent
   and child are distinct instances of the existing shared engine, so the child's
   busy flag does not make the parent commit a child-core reentry.
4. Descriptor reflection returns (or throws). The decoder's required post-check
   finds H.A superseded. It must stop private traversal and skip this candidate.
   Current child actor A is still genuine and eligible in the unchanged domain.
5. Throwing a superseded sentinel enters core catch `549` → purge `557` → clears
   A's ports/locals/work at `306–321`; host catch then retires again. Requirement2
   is violated **before** the host can classify/ignore that exception.

Returning a normal capture payload instead issues a new actor, cancels work and
retires A; it is not a skipped L-config. Continuing to traverse config A ignores the
required post-supersession check. Reading current slot B for H.A violates the exact
ticket guarantee. None is an acceptable in-scope substitute.

## Why alternative in-lease shortcuts do not resolve it

- **Precheck ticket only in host:** misses supersession during later private
  reflection. Private decode outside the actual child's capture is also forbidden.
- **Catch after cell.commit:** existing A was already purged; no authorized way
  to resurrect its exact issued actor, local values, timers or participant exists.
- **Recommit/restore A:** creates a different actor/lifetime and needs private
  history/copies; saved A references remain retired. Not continuity or physical purge.
- **Keep A and B plaintext outside tracked slots / queue publication:** changes the
  selected source/ticket protocol or retains private history instead of implementing
  the required superseded in-flight skip. No such alternate protocol is allocated.
- **Stage a second cell/participant/engine:** duplicates lifetime/registration and
  side effects; explicitly prohibited.
- **Put parent/ticket check in child callback gates forever:** makes old child A
  callbacks depend on parent A/ticket A after parent B and prematurely denies them.
- **Treat every error as skip:** weakens malformed current B/source/reentry denial.

Receiver/default materialization, fixed stamp0, registered unready routing and host
disabled/className capture remain work for the original lease. No implementation or
claim that these other requirements have passed follows from this trace.

## Minimum prerequisite for main to allocate serially

Main must disposition a **closed library-only superseded-candidate abort outcome**
in the actual shared core/capture integration (or select an equally requirement-
preserving actual seam), before resuming S3a. This is an engineering allocation,
not a requested product restriction or new public permitting/reset protocol.

The eventual mechanism must:

- recognize only genuine registered facade-ticket supersession, never arbitrary
  app errors, booleans or caller-supplied allowing callbacks;
- stop before `cancelAll`, previous-actor retirement and candidate L-config;
- retain current actor/ports/locals/work/participant/config version **only if**
  its actual lease, operation and C/CD/P/domain remain genuinely eligible;
- preserve all original raw/current-malformed/revoked/reentry purge/debt behavior;
- let the host skip presentation/Date preparation for the skipped attempt and not
  invoke its normal failure `retire` path;
- preserve tool constructor/public cell signatures and callback ownership, with no
  new engine, private config history or skipped purge on actual source loss.

The current interface supplies no such outcome. Its design/implementation must be
coordinated with D2's isolated core changes by main; this worker has not inspected
those changes, modified the shared core or assumed a future D2 API already exists.

## Scope/result

Original source129 aggregate:
`52a14c39ca28b51004a2316bf200ab9bd64b5fca2a19522ccd31a92f47f0885b`.

Initial two allocated producer SHAs:

- `filters/criteria-commit.tsx`:
  `312e71ceba9291cbb086206b9280e85efb456051920141a5d34f9e8ba98ff9ce`;
- `toolbar/criteria-tool-host.tsx`:
  `af5cf078585c7707692c7f8d9cfd3ad1e2bf5dc07b8a400c403a861f11bfa4ab`.

Both original bytes are preserved. All129 sources (not just the127 protected
others, CSS included) remain unchanged. All1453 captured existing test/config/
artifact inputs remain unchanged. Original maps/seals are not rebased. Only this
new report/readme/scope directory is written. No facade source/props producer,
private config materializer, feature fixture, toolbar/core behavior or UI was added.

No units/runtime/React/browser/SSR/golden/cycles/negative/dual/emitted/packed/
independent verification; no Git/root exports/dependencies/install/build/shared
emission/network/vendor/.repo/agents or changing-worker API reads. Main owns
TASKS/REVIEW/intake and the serial prerequisite allocation. This handoff is blocked,
not implementation-ready or approved.
