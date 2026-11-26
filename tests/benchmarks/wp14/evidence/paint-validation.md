# FINAL-only paint validation, not a rAF certificate

Current state: HOLD / UNRUN. Synchronous public first-subscriber acceptance is the
named commit boundary, not exact internal assignment. Native post-commit evaluator
work and React remain inside the interval; earlier normalization is separately
reported and covered by the additional action-to-paint gate. Semantic clock is not
the performance clock. No timer/renderer validation ran during source authoring.

The driver creates one separate fresh validation browser process. Each of the24
scenario paths (21 budgeted +3 typing) executes in both fixed directions:48 paths.
Initial samples use new actual source owners/mounts. Every sample requires the
current genuine model/native/displayed-query/page/resource binding,100 actual DOM
row IDs, field headers and independent cell digest. Below-fold DOM rows need not
all be on-screen; the table/container must intersect the actual1440x900 viewport.

Only VALIDATION uses CDP tracing: devtools.timeline, blink.user_timing and the
disabled-by-default screenshot category. It records actual `performance.mark`
witness/endpoint events; timestamps in the SAME trace are correlated with the
browser sample delta (predeclared tolerance <1ms). No cross-process wall-clock
subtraction. Paint/DrawFrame and actual nonempty trace Screenshot bytes between
those marks are preserved. Missing Paint/frame yields pending/unsupported coverage,
never a passing flag or synthesized image. A draw/paint event alone is insufficient.

Main must review actual trace events and captured frame content against matching
DOM/oracle observations for EVERY path; candidate/source protocol/scheduler/renderer/
image must match. External review status `main-reviewed-wp14-paint-validation` binds
candidate, runner-attestation SHA, protocol, scheduler, validation observations SHA,
build SHA, reviewer and all48 path records. Each record names the exact path,
status `paint-and-matching-rendered-frame-reviewed`, trace SHA, frame SHA and actual
witness/endpoint trace timestamps. The worker never writes this approval.

Double rAF + MessageChannel remains merely a proxy until this independent review.
If the real browser cannot expose an adequate correlated frame boundary, STOP for
that exact validation seam. Do not loosen frame checks, invent a busy-loop, infer
paint from an effect, or substitute screenshot taken only after endpoint.

MEASUREMENT does no tracing, screenshots, video, DevTools Profiler or React Profiler.
Preflight browser PID/command-line observations detach before fixture sampling.
It uses the identical reviewed witness/scheduler; traversal and marks stay INSIDE
timing, serialization outside. Each new source/candidate/image/scheduler requires new
validation. No validation timings enter measured percentiles; no old receipt is
recolored for a changed candidate. Unexpected page/console errors always fail.
