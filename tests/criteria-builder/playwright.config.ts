import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".", testMatch: "browser.spec.ts", workers: 1, fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:6552", browserName: "chromium" },
  outputDir: process.env.CRITERIA_BUILDER_BROWSER_DIR ?? ".artifacts/browser-results",
  webServer: {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    command: "node node_modules/vite/bin/vite.js --config tests/criteria-builder/vite.config.mjs --host 127.0.0.1 --port 6552 --strictPort",
    url: "http://127.0.0.1:6552/tests/criteria-builder/browser.html", reuseExistingServer: false,
  },
});
