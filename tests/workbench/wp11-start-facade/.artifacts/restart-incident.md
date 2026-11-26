# Interrupted write and recovery (historical tooling failure)

The initial multi-file patch stopped at the first new `vite.config.ts` write with:
`ENOSPC: no space left on device, write`.
The dedicated read returned an empty new file; the remaining files in that patch
were absent. No completed source modules/baseline were repeated or rebaselined.

After the server restart, readonly disk inspection reported657MiB available and the
existing scope check still matched all155 libraries/all1,736 old regular inputs.
The same writer filled that empty owned file and added only the previously absent
leased files. No cleanup/dependency/cache deletion, Git, install, build, generator,
framework/app module, React, server, browser or runtime test was performed.
Subsequent write batches check actual statfs against the main-required128MiB floor.
