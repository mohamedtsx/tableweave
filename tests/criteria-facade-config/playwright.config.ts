import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "browser.spec.ts",
  workers: 1,
  use: { browserName: "chromium", baseURL: "http://127.0.0.1:6554" },
  outputDir: ".artifacts/resumed/browser-results",
  webServer: {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    command:
      "node node_modules/vite/bin/vite.js --config tests/criteria-facade-config/vite.config.mjs",
    url: "http://127.0.0.1:6554/tests/criteria-facade-config/browser.html",
    reuseExistingServer: false,
  },
});
