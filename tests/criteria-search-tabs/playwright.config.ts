import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "browser.spec.ts",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:6547", browserName: "chromium" },
  outputDir: ".artifacts/browser-results",
  webServer: {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    command:
      "node node_modules/vite/bin/vite.js --config tests/criteria-search-tabs/vite.config.mjs --host 127.0.0.1 --port 6547 --strictPort",
    url: "http://127.0.0.1:6547/tests/criteria-search-tabs/browser.html",
    reuseExistingServer: false,
  },
});
