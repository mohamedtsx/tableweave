import baseline from "../wp11-next/vitest.config.mjs";

// FINAL ONLY, SOURCE lane. Reuse its declared React/toolkit aliases, not its
// obsolete client test selection. This is never a Next runtime configuration.
export default {
  ...baseline,
  test: {
    ...baseline.test,
    include: [
      "tests/workbench/wp11-next-connection/connection.test.tsx",
      "tests/workbench/wp11-next/server.test.ts",
    ],
  },
};
