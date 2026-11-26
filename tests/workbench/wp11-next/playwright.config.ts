import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "browser.spec.ts",
  workers: 1,
  outputDir: ".artifacts/browser-results",
  use: { baseURL: "http://127.0.0.1:6571", browserName: "chromium" },
  webServer: {
    cwd: fileURLToPath(new URL("../../../apps/example-next", import.meta.url)),
    command:
      process.env.WP11_NEXT_PRODUCTION === "1"
        ? "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 6571"
        : "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 6571",
    env: { NEXT_TELEMETRY_DISABLED: "1", CI: "1" },
    url: "http://127.0.0.1:6571/headless",
    reuseExistingServer: false,
  },
});
