import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
const app = fileURLToPath(
  new URL("../../../apps/example-start-facade/", import.meta.url),
);
const production = process.env.WP11_START_PRODUCTION === "1";
export default defineConfig({
  testDir: "./final",
  testMatch: "browser.spec.ts",
  workers: 1,
  retries: 0,
  outputDir: `.artifacts/browser-${production ? "production" : "development"}`,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:6573",
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  webServer: {
    cwd: app,
    command: production
      ? "node ../../tests/workbench/wp11-start-facade/production-host.mjs"
      : "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 6573 --strictPort",
    url: "http://127.0.0.1:6573",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
