import { defineConfig } from "@playwright/test";
const consumer = process.env.WP11_NEXT_CONSUMER;
if (!consumer || process.env.WP11_NEXT_FINAL !== "1")
  throw Error(
    "Final phase requires the actual outside-workspace prepared consumer",
  );
export default defineConfig({
  testDir: ".",
  testMatch:
    process.env.WP11_NEXT_RSC_NEGATIVE === "1"
      ? "negative.spec.ts"
      : "ordinary.spec.ts",
  workers: 1,
  outputDir: "../.artifacts/packed-browser",
  use: { baseURL: "http://127.0.0.1:6571", browserName: "chromium" },
  webServer: {
    cwd: consumer,
    command:
      process.env.WP11_NEXT_PRODUCTION === "1"
        ? "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 6571"
        : "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 6571",
    env: { NEXT_TELEMETRY_DISABLED: "1", CI: "1" },
    url: "http://127.0.0.1:6571/headless",
    reuseExistingServer: false,
  },
});
