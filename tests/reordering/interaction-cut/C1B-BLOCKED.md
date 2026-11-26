# C1a is necessary, not a closed row terminal action

Source trace only; no renderer/native/consumer implementation or runtime proof.
Main's selected `/tmp/opencode/wp10-neutral-consumer-contract/REPORT.md`, page3,
owns the original finding (review22n2):

1. Actual `RendererCapture.callback` runs callback-role/source checks before
   `Reflect.apply` and in finally. Invoking that ordinary wrapped onSubmit **after**
   actual begin returns can deny before application notification, orphaning the
   already-issued operation. C1a does not make that wrapper callback-free.
2. A raw callback inside one outer `tableRendererBoundary(begin + rawSubmit)` is
   not safe either: a genuine pre-token metadata/native/eligibility callback can
   replace renderer A with B on the same genuine model. The outer boundary checks
   too late; actor association in headless is not actual renderer authorization.
3. C1a now supplies only exact release-only interaction revocation. No frozen
   renderer/core/N hook calls it automatically. Refs/geometry surviving replacement
   do not prove A's action cut, and there is no selected operation-specific prepared
   notification in this lease. No source-private port can be replaced by a fake
   allowing callback or a post-token veto.

Future **separately allocated C1b** must issue an exact real renderer/native cut,
tie capture/clear/ref retirement to `revokeReorderInteraction` synchronously before
pre-token port work continues, and finish the original before/finally role fences
before operation creation. Its already-captured exact notification/receiver must
then receive a started operation immediately, without a new source read/permission
lookup/await or a raw callback escape. Rechecks after notification govern UI effects
only. If that cannot close the seam, main must select a genuine prepared-operation
protocol rather than fabricate rejection/ack/undo or activate a dead row control.

The new fixtures exercise the **headless application-owned API**, including genuine
model/renderer/native callbacks that explicitly revoke a known token. They do not
pretend that manual fixture revocation is actual C1b N/R retirement integration.
Common native refs, ordinary-C columns and row-pending pager work remain independently
scoped in the isolated consumer tree. This primary lease changes none of those files.
Review22n2 stays OPEN; runtime, real replacement/ref cleanup, atomic row notification,
SSR/distribution and independent acceptance stay in the user's single final phase.
